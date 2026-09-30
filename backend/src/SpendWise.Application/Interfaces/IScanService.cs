using SpendWise.Application.DTOs;

namespace SpendWise.Application.Interfaces;

public interface IScanService
{
    Task<ScanPreviewDto> ScanAndPreviewAsync(byte[] imageBytes, string fileName, string contentType, int userId);
}
