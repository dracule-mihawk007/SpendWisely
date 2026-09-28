using Microsoft.Extensions.Configuration;
using SkiaSharp;
using SpendWise.Application.Interfaces;

namespace SpendWise.Infrastructure.Services;

public class SupabaseStorageService : IReceiptStorageService
{
    private readonly HttpClient _http;
    private readonly string _supabaseUrl;
    private readonly string _serviceKey;
    private const string Bucket = "receipts";
    private const int MaxDimension = 800;
    private const int JpegQuality = 80;

    public SupabaseStorageService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _supabaseUrl = config["Supabase:Url"]!;
        _serviceKey = config["Supabase:ServiceKey"]!;
    }

    public async Task<string> UploadAsync(byte[] imageBytes, string fileName, string contentType)
    {
        var compressed = Compress(imageBytes);
        var cleanFileName = Path.GetFileNameWithoutExtension(fileName);
        cleanFileName = System.Text.RegularExpressions.Regex.Replace(cleanFileName, @"[^a-zA-Z0-9_\-]", "_");
        var uniqueName = $"{Guid.NewGuid():N}_{cleanFileName}.jpg";
        var uploadUrl = $"{_supabaseUrl}/storage/v1/object/{Bucket}/{uniqueName}";

        using var content = new ByteArrayContent(compressed);
        content.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue("image/jpeg");

        using var request = new HttpRequestMessage(HttpMethod.Post, uploadUrl);
        request.Headers.Add("Authorization", $"Bearer {_serviceKey}");
        request.Headers.Add("apikey", _serviceKey);
        request.Content = content;

        var response = await _http.SendAsync(request);
        response.EnsureSuccessStatusCode();

        return $"{_supabaseUrl}/storage/v1/object/public/{Bucket}/{uniqueName}";
    }

    private static byte[] Compress(byte[] imageBytes)
    {
        using var original = SKBitmap.Decode(imageBytes);
        if (original is null) return imageBytes;

        var (width, height) = ScaleDimensions(original.Width, original.Height);

        using var resized = original.Resize(new SKImageInfo(width, height), new SKSamplingOptions(SKFilterMode.Linear, SKMipmapMode.Linear));
        if (resized is null) return imageBytes;

        using var image = SKImage.FromBitmap(resized);
        using var encoded = image.Encode(SKEncodedImageFormat.Jpeg, JpegQuality);

        return encoded.ToArray();
    }

    private static (int width, int height) ScaleDimensions(int w, int h)
    {
        if (w <= MaxDimension && h <= MaxDimension) return (w, h);
        var scale = (double)MaxDimension / Math.Max(w, h);
        return ((int)(w * scale), (int)(h * scale));
    }
}
