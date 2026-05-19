# Distribution Agency Invoice Tracker - .NET Backend

This is the ASP.NET Core backend for the Distribution Agency Invoice Tracker application.

## Prerequisites

- .NET 8 SDK or later
- Visual Studio Code or Visual Studio

## Installation

1. Install dependencies:
```bash
dotnet restore
```

2. Build the project:
```bash
dotnet build
```

## Running the Application

Start the development server:
```bash
dotnet run
```

The API will be available at `http://localhost:5000` or `http://localhost:5001` (HTTPS).

## API Endpoints

### Routes
- `GET /api/routes` - List all delivery routes
- `POST /api/routes` - Create a new route

### Shops
- `GET /api/shops` - List all shops
- `POST /api/shops` - Create a new shop

### Invoices
- `GET /api/invoices?date=&shopId=&status=` - List invoices with filters
- `POST /api/invoices` - Create a new invoice
- `GET /api/invoices/{id}` - Get invoice details
- `GET /api/invoices/summary?date=` - Get daily summary statistics

### Cheques
- `GET /api/cheques?status=` - List cheques
- `PUT /api/cheques/{id}` - Update cheque status

### Dashboard
- `GET /api/dashboard/summary?date=` - Get dashboard summary statistics for a specific date
- `GET /api/dashboard/cheques-due?date=` - Get cheques due on a specific date

### Credits
- `GET /api/credits?routeId=&agingMonths=&specificDate=` - List credit invoices with filters

## Database

The application uses SQLite for data persistence. The database file (`invoice_tracker.db`) is created automatically on first run.

## CORS Configuration

The backend is configured to allow requests from any origin (allowing the frontend to make API calls).

## Project Structure

```
backend/
├── Models/              # Entity models (Route, Shop, Invoice, etc.)
├── Data/                # DbContext and database configuration
├── Program.cs           # Application entry point and API endpoints
├── appsettings.json     # Application configuration
└── appsettings.Development.json  # Development-specific settings
```
