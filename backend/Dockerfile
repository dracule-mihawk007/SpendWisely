FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy solution and all projects
COPY SpendWise.sln .
COPY src/SpendWise.Api/SpendWise.Api.csproj src/SpendWise.Api/
COPY src/SpendWise.Application/SpendWise.Application.csproj src/SpendWise.Application/
COPY src/SpendWise.Domain/SpendWise.Domain.csproj src/SpendWise.Domain/
COPY src/SpendWise.Infrastructure/SpendWise.Infrastructure.csproj src/SpendWise.Infrastructure/

RUN dotnet restore

# Copy all source files
COPY . .

RUN dotnet publish src/SpendWise.Api/SpendWise.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "SpendWise.Api.dll"]
