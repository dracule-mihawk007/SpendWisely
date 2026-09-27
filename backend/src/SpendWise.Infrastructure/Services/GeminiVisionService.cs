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
        _model = config["Gemini:Model"] ?? "gemini-1.5-flash";
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
                        new { inline_data = new { mime_type = mimeType, data = base64 } }
                    }
                }
            },
            generationConfig = new
            {
                temperature = 0,
                responseMimeType = "application/json"
            }
        };

        var url = $"v1beta/models/{_model}:generateContent?key={_apiKey}";

        HttpResponseMessage response = null!;
        for (int attempt = 1; attempt <= 3; attempt++)
        {
            response = await _http.PostAsJsonAsync(url, payload);
            if (response.IsSuccessStatusCode) break;

            var status = (int)response.StatusCode;
            if ((status == 503 || status == 429) && attempt < 3)
            {
                await Task.Delay(TimeSpan.FromSeconds(Math.Pow(2, attempt)));
                continue;
            }

            var errorBody = await response.Content.ReadAsStringAsync();
            throw new HttpRequestException($"Gemini API error {status}: {errorBody}");
        }

        var json = await response.Content.ReadAsStringAsync();
        using var doc = JsonDocument.Parse(json);

        var text = doc.RootElement
            .GetProperty("candidates")[0]
            .GetProperty("content")
            .GetProperty("parts")[0]
            .GetProperty("text")
            .GetString()!;

        var raw = JsonSerializer.Deserialize<GeminiReceiptResponse>(text, new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        })!;

        return new ReceiptScanResultDto(
            raw.Merchant,
            DateTime.TryParse(raw.Date, out var date) ? date : DateTime.UtcNow.Date,
            raw.Total,
            raw.Tax,
            raw.CategorySuggestion,
            raw.Items.Select(i => new ScannedItemDto(i.Description, i.Quantity, i.UnitPrice, i.TotalPrice)).ToList()
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
