using SpendWise.Application.DTOs;

namespace SpendWise.Application.Interfaces;

public interface IGeminiVisionService
{
    Task<ReceiptScanResultDto> ScanReceiptAsync(byte[] imageBytes, string mimeType);
}
