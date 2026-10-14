using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using Microsoft.Extensions.Configuration;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;

namespace SpendWise.Infrastructure.Services;

public class GeminiVisionService : IGeminiVisionService
{
    private readonly HttpClient _http;
    private readonly string _apiKey;
    private readonly string _model;

    private static readonly string ReceiptPrompt = """
        You are a receipt data extractor. Analyze the receipt image and return ONLY a raw JSON object with no markdown, no code fences, no explanation.

        Required JSON schema:
        {
          "merchant": "string (shop name)",
          "date": "YYYY-MM-DD (use today if not visible)",
          "total": number,
          "tax": number (0 if not found),
          "categorySuggestion": "one of: Dining, Groceries, Travel, Utilities, Electronics",
          "items": [
            {
              "description": "string",
              "quantity": number,
              "unitPrice": number,
              "totalPrice": number
            }
          ]
        }
        """;

    public GeminiVisionService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _apiKey = config["Gemini:ApiKey"]!;
        _model = config["Gemini:Model"] ?? "gemini-flash-lite-latest";
    }

    public async Task<ReceiptScanResultDto> ScanReceiptAsync(byte[] imageBytes, string mimeType)
    {
        var base64 = Convert.ToBase64String(imageBytes);

        var payload = new
        {
            contents = new[]
            {
                new
                {
                    parts = new object[]
                    {
                        new { text = ReceiptPrompt },
                        new { inlineData = new { mimeType = mimeType, data = base64 } }
                    }
                }
            }
        };

        var candidateModels = new[]
        {
            _model,
            "gemini-flash-lite-latest",
            "gemini-3.5-flash-lite",
            "gemini-3-flash-preview",
            "gemini-flash-latest"
        }
        .Where(m => !string.IsNullOrWhiteSpace(m))
        .Distinct()
        .ToArray();

        HttpResponseMessage response = null!;
        string lastError = string.Empty;

        foreach (var modelName in candidateModels)
        {
            var url = $"v1beta/models/{modelName}:generateContent?key={_apiKey}";
            try
            {
                response = await _http.PostAsJsonAsync(url, payload);
                if (response.IsSuccessStatusCode)
                {
                    break;
                }

                var status = (int)response.StatusCode;
                lastError = await response.Content.ReadAsStringAsync();

                // On 429 rate limit, short delay and retry once
                if (status == 429)
                {
                    await Task.Delay(1000);
                    response = await _http.PostAsJsonAsync(url, payload);
                    if (response.IsSuccessStatusCode)
                    {
                        break;
                    }
                }

                // If 503 (overloaded) or other error, fast-failover immediately to next candidate model
            }
            catch (Exception ex)
            {
                lastError = ex.Message;
            }
        }

        if (response == null || !response.IsSuccessStatusCode)
        {
            throw new HttpRequestException($"Gemini API error across candidate models: {lastError}");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        if (!doc.RootElement.TryGetProperty("candidates", out var candidates) || candidates.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Gemini returned no candidates in response.");
        }

        var candidate = candidates[0];
        if (!candidate.TryGetProperty("content", out var content) ||
            !content.TryGetProperty("parts", out var parts) ||
            parts.GetArrayLength() == 0)
        {
            throw new InvalidOperationException("Gemini response missing content parts.");
        }

        var text = parts[0].GetProperty("text").GetString();
        if (string.IsNullOrWhiteSpace(text))
        {
            throw new InvalidOperationException("Gemini returned empty text.");
        }

        text = text.Trim();
        var firstBrace = text.IndexOf('{');
        var lastBrace = text.LastIndexOf('}');
        if (firstBrace >= 0 && lastBrace > firstBrace)
        {
            text = text.Substring(firstBrace, lastBrace - firstBrace + 1);
        }
        else
        {
            if (text.StartsWith("```json", StringComparison.OrdinalIgnoreCase))
                text = text[7..];
            else if (text.StartsWith("```"))
                text = text[3..];
            if (text.EndsWith("```"))
                text = text[..^3];
            text = text.Trim();
        }

        var raw = JsonSerializer.Deserialize<GeminiReceiptResponse>(text, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        });

        if (raw is null)
        {
            throw new InvalidOperationException("Failed to deserialize Gemini receipt JSON.");
        }

        var items = (raw.Items ?? new List<GeminiItem>())
            .Select(i => new ScannedItemDto(
                i.Description ?? "Item",
                i.Quantity <= 0 ? 1 : i.Quantity,
                i.UnitPrice,
                i.TotalPrice
            )).ToList();

        return new ReceiptScanResultDto(
            raw.Merchant ?? "Unknown Merchant",
            DateTime.SpecifyKind(DateTime.TryParse(raw.Date, out var date) ? date : DateTime.UtcNow, DateTimeKind.Utc),
            raw.Total,
            raw.Tax,
            raw.CategorySuggestion ?? "General",
            items
        );
    }

    private record GeminiReceiptResponse(
        string Merchant,
        string Date,
        decimal Total,
        decimal Tax,
        string CategorySuggestion,
        List<GeminiItem> Items
    );

    private record GeminiItem(
        string Description,
        int Quantity,
        decimal UnitPrice,
        decimal TotalPrice
    );
}
