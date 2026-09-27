using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using SpendWise.Application.Interfaces;
using SpendWise.Infrastructure.Persistence;
using SpendWise.Infrastructure.Services;

namespace SpendWise.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration configuration)
    {
        services.AddDbContext<AppDbContext>(options =>
            options.UseNpgsql(configuration.GetConnectionString("DefaultConnection")));

        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IExpenseService, ExpenseService>();
        services.AddScoped<IScanService, ScanService>();

        services.AddHttpClient<IGeminiVisionService, GeminiVisionService>(client =>
        {
            client.BaseAddress = new Uri(configuration["Gemini:BaseUrl"]!.TrimEnd('/') + "/");
            client.Timeout = TimeSpan.FromSeconds(60);
        });

        services.AddHttpClient<IReceiptStorageService, SupabaseStorageService>(client =>
        {
            client.Timeout = TimeSpan.FromSeconds(30);
        });

        return services;
    }
}
