using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;
using SpendWise.Domain.Entities;
using SpendWise.Infrastructure.Persistence;

namespace SpendWise.Infrastructure.Services;

public class AuthService : IAuthService
{
    private readonly AppDbContext _context;
    private readonly IConfiguration _configuration;

    public AuthService(AppDbContext context, IConfiguration configuration)
    {
        _context = context;
        _configuration = configuration;
    }

    public async Task<AuthResponseDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _context.Users.AnyAsync(u => u.Email == dto.Email.ToLower().Trim());
        if (existingUser)
            throw new InvalidOperationException("An account with this email already exists.");

        var user = new AppUser
        {
            Name = dto.Name.Trim(),
            Email = dto.Email.ToLower().Trim(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            CreatedAt = DateTime.UtcNow
        };

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Seed default categories for this new user
        var defaultCategories = new List<Category>
        {
            new() { Name = "Dining",       MonthlyBudgetLimit = 500,  ColorHex = "#FF6B6B", Icon = "restaurant",    UserId = user.Id },
            new() { Name = "Groceries",    MonthlyBudgetLimit = 800,  ColorHex = "#51CF66", Icon = "shopping_cart", UserId = user.Id },
            new() { Name = "Travel",       MonthlyBudgetLimit = 1500, ColorHex = "#339AF0", Icon = "flight",        UserId = user.Id },
            new() { Name = "Utilities",    MonthlyBudgetLimit = 300,  ColorHex = "#F59F00", Icon = "bolt",          UserId = user.Id },
            new() { Name = "Electronics",  MonthlyBudgetLimit = 1000, ColorHex = "#845EF7", Icon = "devices",       UserId = user.Id },
        };
        _context.Categories.AddRange(defaultCategories);
        await _context.SaveChangesAsync();

        return IssueToken(user);
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto)
    {
        var user = await _context.Users
            .FirstOrDefaultAsync(u => u.Email == dto.Email.ToLower().Trim());

        if (user is null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Invalid email or password.");

        return IssueToken(user);
    }

    public async Task<UserProfileDto?> GetProfileAsync(int userId)
    {
        var user = await _context.Users.FindAsync(userId);
        return user is null ? null : new UserProfileDto(user.Id, user.Name, user.Email, user.CreatedAt);
    }

    public async Task<bool> DeleteAccountAsync(int userId)
    {
        var user = await _context.Users
            .Include(u => u.Expenses)
                .ThenInclude(e => e.Items)
            .Include(u => u.Categories)
            .FirstOrDefaultAsync(u => u.Id == userId);

        if (user is null) return false;

        _context.Users.Remove(user);
        await _context.SaveChangesAsync();
        return true;
    }

    private AuthResponseDto IssueToken(AppUser user)
    {
        var jwtKey = _configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not configured.");
        var jwtIssuer = _configuration["Jwt:Issuer"] ?? "SpendWisely";
        var jwtAudience = _configuration["Jwt:Audience"] ?? "SpendWiselyApp";
        var expiryHours = int.TryParse(_configuration["Jwt:ExpiryHours"], out var h) ? h : 720; // 30 days

        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddHours(expiryHours);

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("name", user.Name),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString()),
        };

        var token = new JwtSecurityToken(
            issuer: jwtIssuer,
            audience: jwtAudience,
            claims: claims,
            expires: expiry,
            signingCredentials: creds);

        return new AuthResponseDto(
            new JwtSecurityTokenHandler().WriteToken(token),
            user.Name,
            user.Email,
            user.Id,
            expiry
        );
    }
}
