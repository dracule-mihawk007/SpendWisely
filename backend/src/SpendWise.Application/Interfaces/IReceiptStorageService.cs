namespace SpendWise.Application.Interfaces;

public interface IReceiptStorageService
{
    Task<string> UploadAsync(byte[] imageBytes, string fileName, string contentType);
}
