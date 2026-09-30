namespace SpendWise.Application.DTOs;

public record RegisterDto(string Name, string Email, string Password);

public record LoginDto(string Email, string Password);

public record AuthResponseDto(string Token, string Name, string Email, int UserId, DateTime ExpiresAt);

public record UserProfileDto(int Id, string Name, string Email, DateTime CreatedAt);
