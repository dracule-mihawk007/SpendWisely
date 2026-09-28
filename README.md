# SpendWisely — AI-Powered Expense & Budget Tracker

SpendWisely is a modern full-stack personal finance application that streamlines expense tracking using Gemini AI vision models for automated receipt scanning, category budget monitoring, and real-time threshold alerts.

---

## Features

- **AI Receipt Scanning**: Upload receipt images (JPEG, PNG, WebP) to extract merchant name, date, items, tax, and total automatically using Google Gemini Vision AI.
- **Client-Side Image Optimization**: Receipts are scaled to a maximum of 800px and re-encoded at 80% JPEG quality with SkiaSharp before uploading to Supabase Storage, dramatically cutting storage usage.
- **Category Budgeting & Real-Time Alerts**: Set monthly budget limits per category with immediate visual warnings when an expense pushes spending past its limit.
- **Filterable Transaction History**: Search by merchant, category, or date range with expandable itemized breakdowns and receipt image viewer.
- **Dark & Light Themes**: Clean, professional SaaS theme toggle with persistent preferences.

---

## Tech Stack

- **Backend**: ASP.NET Core (.NET 8/9), Entity Framework Core, PostgreSQL (Npgsql) / Supabase.
- **AI & Storage**: Google Gemini 2.0 Vision API, Supabase Cloud Storage.
- **Frontend**: Angular 19 (Standalone Components, Signals, New Control Flow `@if`/`@for`), Plain Vanilla CSS design system.

---

## Running the Application Locally

### Prerequisites
- [.NET 8.0 SDK or higher](https://dotnet.microsoft.com/download)
- [Node.js (v22+) & npm](https://nodejs.org/)

### 1. Start the Backend API
```powershell
cd backend
dotnet run --project src/SpendWise.Api
```
- API Base URL: `http://localhost:8000`
- Swagger Documentation: `http://localhost:8000/swagger`

### 2. Start the Frontend
In a separate terminal:
```powershell
cd frontend
npm install
npm start
```
- Web Application: `http://localhost:4200`
