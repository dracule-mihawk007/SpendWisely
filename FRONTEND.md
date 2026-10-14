# SpendWisely - Frontend Architecture & Technical Documentation

SpendWisely's frontend is a single-page application (SPA) built with **Angular 19** adhering to modern Angular development paradigms, including **Standalone Components**, **Angular Signals** for reactive state management, the **New Control Flow syntax** (`@if`, `@for`, `@switch`), and a **Vanilla CSS Design System** featuring a dark/light fintech theme.

---

## 1. Architectural Highlights

```mermaid
graph TD
    User([User Browser]) --> AppRoot[AppComponent]
    AppRoot --> Navbar[NavbarComponent]
    AppRoot --> Toast[ToastComponent]
    AppRoot --> RouterOutlet[Router Outlet]

    RouterOutlet --> LoginView[LoginComponent (/login)]
    RouterOutlet --> DashView[DashboardComponent (/dashboard)]
    RouterOutlet --> ScanView[ReceiptScannerComponent (/scan)]
    RouterOutlet --> ExpenseView[ExpenseListComponent (/expenses)]
    RouterOutlet --> CatView[CategoryListComponent (/categories)]

    subgraph Core Services & State [Reactive State Layer (Signals)]
        AuthService[AuthService]
        ExpenseService[ExpenseService]
        CategoryService[CategoryService]
        NotificationService[NotificationService]
        ThemeService[ThemeService]
    end

    subgraph Security & Network Layer
        AuthGuard[authGuard / unauthGuard]
        AuthInterceptor[authInterceptor (JWT)]
        HttpClient[Angular HttpClient (Fetch API)]
    end

    DashView --> ExpenseService
    DashView --> CategoryService
    DashView --> ThemeService

    ScanView --> ExpenseService
    ScanView --> CategoryService
    ScanView --> NotificationService

    ExpenseView --> ExpenseService
    ExpenseView --> CategoryService
    ExpenseView --> NotificationService

    CatView --> CategoryService
    CatView --> ExpenseService
    CatView --> NotificationService

    LoginView --> AuthService
    Navbar --> AuthService
    Navbar --> ThemeService

    AuthGuard --> AuthService
    AuthInterceptor --> AuthService
    HttpClient --> BackendAPI[(ASP.NET Core REST API)]
```

### Key Technical Pillars
1. **Standalone Component Architecture**: Zero `NgModule` overhead. Every component explicitly declares its dependencies (`imports: [CommonModule, FormsModule, RouterLink, ...]`).
2. **Signals-Driven Reactivity**: Eliminates manual subscription management for UI state. Uses `signal()`, `computed()`, and `effect()` for reactive updates and computed metrics.
3. **Zero UI Framework Dependencies**: Built without TailwindCSS, Bootstrap, or Material UI. Employs a custom Vanilla CSS design system using CSS custom properties (variables) for theme switching, typography, and responsive layouts.
4. **Data Visualization**: Integrated with **Chart.js 4.5.1** for financial charts (doughnut distributions and monthly bar charts) that re-render reactively on theme or data changes.
5. **Secure Authentication Flow**: Functional route guards (`authGuard`, `unauthGuard`) and a functional HTTP interceptor (`authInterceptor`) that automatically attaches JWT bearer tokens and evicts expired sessions.

---

## 2. Technology Stack & Dependencies

| Dependency | Version | Purpose |
| :--- | :--- | :--- |
| **Angular Core** | `^19.2.0` | Frontend framework (Standalone, Signals, New Control Flow) |
| **Angular Router** | `^19.2.0` | Client-side routing with view transitions & input binding |
| **Angular Forms** | `^19.2.0` | Template-driven forms with two-way data binding (`[(ngModel)]`) |
| **Angular Common/HTTP** | `^19.2.0` | HTTP client configured with Fetch API (`withFetch()`) |
| **Chart.js** | `^4.5.1` | Canvas-based financial chart rendering |
| **RxJS** | `~7.8.0` | Asynchronous stream processing and HTTP operators (`tap`, `catchError`) |
| **TypeScript** | `~5.7.2` | Strongly typed JavaScript superset |
| **Google Fonts** | Hosted | Typography: *Outfit* (headings) & *Plus Jakarta Sans* (body text) |

---

## 3. Directory Structure

```text
frontend/
├── public/                     # Static assets (favicons, icons)
├── src/
│   ├── app/
│   │   ├── core/               # Singleton services, guards, interceptors, models, utilities
│   │   │   ├── guards/
│   │   │   │   └── auth.guard.ts           # Functional route guards (authGuard, unauthGuard)
│   │   │   ├── interceptors/
│   │   │   │   └── auth.interceptor.ts     # JWT injection & 401 response interceptor
│   │   │   ├── models/
│   │   │   │   ├── analytics.model.ts      # TypeScript interfaces for analytics & trends
│   │   │   │   ├── auth.model.ts           # User login, register, profile, and token DTOs
│   │   │   │   ├── category.model.ts       # Category CRUD models
│   │   │   │   ├── expense.model.ts        # Expense and line item DTOs
│   │   │   │   └── receipt.model.ts        # Receipt scan preview & OCR result models
│   │   │   ├── services/
│   │   │   │   ├── auth.service.ts         # User auth state, token handling, login/register
│   │   │   │   ├── category.service.ts     # Category CRUD state & API interactions
│   │   │   │   ├── expense.service.ts      # Expense CRUD, CSV export, receipt OCR API
│   │   │   │   ├── notification.service.ts # Toast notification queue & HTTP error parser
│   │   │   │   └── theme.service.ts        # Dark / Light theme toggle & persistence
│   │   │   └── utils/
│   │   │       └── icon.utils.ts           # Category icon mapping and emoji normalizer
│   │   ├── features/           # Feature view components
│   │   │   ├── auth/
│   │   │   │   ├── login.component.ts      # Login/Register tabbed form with live password criteria
│   │   │   │   ├── login.component.html
│   │   │   │   └── login.component.css
│   │   │   ├── categories/
│   │   │   │   ├── category-list.component.ts   # Category budget cards, edit/create modals
│   │   │   │   ├── category-list.component.html
│   │   │   │   └── category-list.component.css
│   │   │   ├── dashboard/
│   │   │   │   ├── dashboard.component.ts       # KPI summary, Doughnut & Bar charts, alerts
│   │   │   │   ├── dashboard.component.html
│   │   │   │   └── dashboard.component.css
│   │   │   ├── expenses/
│   │   │   │   ├── expense-list.component.ts    # Filterable transaction table, CSV exporter, receipt modal
│   │   │   │   ├── expense-list.component.html
│   │   │   │   └── expense-list.component.css
│   │   │   └── scanner/
│   │   │       ├── receipt-scanner.component.ts # Drag-drop OCR scanner, preview editor, budget alert
│   │   │       ├── receipt-scanner.component.html
│   │   │       └── receipt-scanner.component.css
│   │   ├── shared/             # Reusable UI components
│   │   │   └── components/
│   │   │       ├── navbar/     # Responsive top navigation with mobile drawer & theme switcher
│   │   │       └── toast/      # Floating multi-toast notification overlay
│   │   ├── app.component.ts    # Root shell component
│   │   ├── app.component.html  # Shell template (@if auth navbar + router-outlet + toast)
│   │   ├── app.component.css
│   │   ├── app.config.ts       # Application providers (Router, HttpClient, ZoneCoalescing)
│   │   └── app.routes.ts       # Route definition table with lazy component loaders
│   ├── environments/
│   │   ├── environment.ts              # Local dev API configuration (`http://localhost:8000/api`)
│   │   ├── environment.development.ts  # Dev environment config
│   │   └── environment.prod.ts         # Production API config (`https://spendwisely-kjnn.onrender.com/api`)
│   ├── index.html              # HTML5 entry point with Google Fonts preconnect
│   ├── main.ts                 # Bootstrap application call
│   └── styles.css              # Global Design System tokens, utilities, and resets
├── angular.json                # Angular CLI workspace configuration
├── package.json                # NPM package definitions and scripts
├── tsconfig.json               # TypeScript base compiler configuration
└── vercel.json                 # Vercel deployment rewrite rules for SPA routing
```

---

## 4. Core Services & State Management

### 1. `AuthService` (`src/app/core/services/auth.service.ts`)
- **State Signals**:
  - `_token = signal<string | null>`: Stores current JWT token.
  - `_user = signal<UserProfileDto | null>`: Stores authenticated user details.
  - `isAuthenticated = computed(() => !!this._token())`: Readonly boolean indicator for view rendering and route guarding.
- **Key Responsibilities**:
  - `register(dto)` & `login(dto)`: Dispatches HTTP requests and persists token + user in `localStorage`.
  - `logout()`: Clears `localStorage` keys (`spendwisely_token`, `spendwisely_user`) and redirects to `/login`.
  - `deleteAccount()`: Permanently deletes user account and cascade-removes data.

### 2. `ExpenseService` (`src/app/core/services/expense.service.ts`)
- **State Signals**:
  - `_expenses = signal<ExpenseDto[]>`: Cached list of loaded expenses.
  - `_loading = signal<boolean>`: Network loading indicator.
  - `_activeFilter = signal<ExpenseFilterDto>`: Active query parameters.
- **Key Responsibilities**:
  - `loadExpenses(filter)`: Fetches expenses with optional query params (`fromDate`, `toDate`, `categoryId`).
  - `createExpense(dto)`: Optimistically prepends new expenses to state.
  - `deleteExpense(id)`: Removes expense from state.
  - `scanReceipt(file)`: Sends multi-part FormData file to `/api/expenses/scan` for Gemini Vision processing.
  - `exportCsv(filter)` / `downloadCsvBlob()`: Initiates browser download of server-generated or client-generated CSV reports.

### 3. `CategoryService` (`src/app/core/services/category.service.ts`)
- **State Signals**:
  - `_categories = signal<CategoryDto[]>`: Cached list of user categories.
  - `_loading = signal<boolean>`: Loading status.
- **Key Responsibilities**:
  - Handles category CRUD operations (`loadCategories`, `create`, `update`, `delete`).

### 4. `NotificationService` (`src/app/core/services/notification.service.ts`)
- **State Signals**:
  - `_toasts = signal<ToastMessage[]>`: Active toast notification queue.
- **Key Responsibilities**:
  - Dispatches timed notifications (`success`, `error`, `warning`, `info`).
  - `handleHttpError(err)`: Intelligent HTTP error classifier that parses status codes (400, 404, 429, 500, 503, 504) and network disconnects into human-friendly alert messages.

### 5. `ThemeService` (`src/app/core/services/theme.service.ts`)
- **State Signals**:
  - `currentTheme = signal<'dark' | 'light'>`: Persisted in `localStorage` (`spendwisely-theme`).
- **Key Responsibilities**:
  - Modifies `document.documentElement` class list (`dark-theme` / `light-theme`) and `data-theme` attribute to instantly switch CSS custom properties across the DOM.

---

## 5. Security & Routing Architecture

### Routing (`src/app/app.routes.ts`)

| Route | Component | Guard | Description |
| :--- | :--- | :--- | :--- |
| `/` | Redirects to `/dashboard` | - | Root route redirection |
| `/login` | `LoginComponent` | `unauthGuard` | Auth portal (redirects to `/dashboard` if already authenticated) |
| `/dashboard` | `DashboardComponent` | `authGuard` | Main financial dashboard with KPI cards and charts |
| `/scan` | `ReceiptScannerComponent` | `authGuard` | Receipt scanner & manual entry form |
| `/expenses` | `ExpenseListComponent` | `authGuard` | Filterable and searchable transaction table |
| `/categories` | `CategoryListComponent` | `authGuard` | Category budget cards and limit configuration |
| `/privacy-policy` | `PrivacyPolicyComponent` | - | Dedicated Privacy Policy page |
| `/terms` | `TermsConditionsComponent` | - | Dedicated Terms & Conditions page |
| `/**` | Redirects to `/dashboard` | - | Wildcard catch-all fallback |

### HTTP Interceptors (`src/app/core/interceptors/auth.interceptor.ts`)
1. **Bearer Token Injection**: Clones outgoing HTTP requests and appends `Authorization: Bearer <token>` if a token is present in `AuthService`.
2. **401 Unauthorized Eviction**: Automatically intercepts any non-login 401 response, calls `AuthService.logout()`, and redirects the user back to `/login`.

---

## 6. Feature Modules & UI Components

### 1. Authentication View (`features/auth/login.component.ts`)
- Dual-mode card supporting **Sign In** and **Create Account**.
- **Live Password Strength Criteria**: Reactive validation showing real-time checkmarks for:
  - Minimum 6 characters
  - At least 1 uppercase letter (`[A-Z]`)
  - At least 1 number (`[0-9]`)
  - At least 1 special character (`[^A-Za-z0-9\s]`)
- One-click **Demo Account Autofill** for quick previewing.

### 2. Dashboard View (`features/dashboard/dashboard.component.ts`)
- **Metric Cards**: Total Spent This Month, Total Monthly Budget, Remaining Budget, Transaction Count, Scanned Receipts.
- **Budget Threshold Alerts**: Displays warning banners when spending reaches or exceeds 100% of category limits.
- **Chart.js Doughnut Chart**: Interactive visual breakdown of spending per category.
- **Chart.js Bar Chart**: 6-month historical spending trend.
- **Theme-Aware Chart Lifecycle**: Implements Angular `effect()` to cleanly re-create chart instances with appropriate font colors and grid lines whenever the user toggles dark/light theme.

### 3. Receipt Scanner View (`features/scanner/receipt-scanner.component.ts`)
- **Drag-and-Drop Dropzone**: Supports dragover, drop, and file picker for `.jpg`, `.png`, and `.webp` images up to 10MB.
- **Dual Mode**: AI Receipt Scanner mode and Manual Expense Entry mode.
- **Interactive Scan Preview**:
  - Merchant name, transaction date, tax, and total.
  - Automatically suggested category with budget warning calculation.
  - Itemized line items with dynamic quantity/unit price calculations.
  - Image preview thumbnail.
- Fallback notice handling if AI Vision is under heavy load.

### 4. Transactions View (`features/expenses/expense-list.component.ts`)
- **Multi-criteria Filtering**: Category selector, date range (`fromDate` to `toDate`), and instant search query filter.
- **Client & Server Sorting**: Sort by date, amount, or merchant (ascending/descending).
- **Expandable Itemized Accordions**: Click any row to reveal line items and unit pricing.
- **Receipt Image Modal**: Click to inspect high-resolution uploaded receipt images.
- **CSV Export**: Client-side RFC 4180-compliant CSV generation with UTF-8 BOM encoding for seamless Excel compatibility.

### 5. Categories & Budgets View (`features/categories/category-list.component.ts`)
- Visual budget progress bars with dynamic color transitions:
  - Green/Category Color: Normal spending (< 85%)
  - Amber Warning: Approaching limit (85% – 99%)
  - Rose Danger: Over budget (>= 100%)
- Category modal with emoji preset selection and hex color pickers.

---

## 7. Design System & CSS Architecture

The application uses Vanilla CSS structured with custom properties in `src/styles.css`:

```css
/* Core Color Tokens (Dark Mode Default) */
--bg-app: #0b0f19;
--bg-surface: #111726;
--bg-card: #151e33;
--bg-card-hover: #1b2640;
--bg-input: #0e1422;
--border-subtle: #202b42;
--border-card: #25334e;
--text-primary: #f8fafc;
--text-secondary: #94a3b8;
--primary: #4f46e5;
--accent-emerald: #10b981;
--accent-amber: #f59e0b;
--accent-rose: #ef4444;
--accent-cyan: #06b6d4;

/* Light Mode Overrides (Activated via [data-theme="light"]) */
--bg-app: #f8fafc;
--bg-surface: #ffffff;
--bg-card: #ffffff;
--border-card: #e2e8f0;
--text-primary: #0f172a;
```

---

## 8. Build, Development & Deployment

### Local Development
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm start
# -> Runs on http://localhost:4200 (proxies to backend on port 8000)
```

### Production Build & Deployment
```bash
# Compile optimized production bundle
npm run build
# -> Output generated in frontend/dist/frontend/browser
```

### Vercel Deployment Configuration (`vercel.json`)
The application includes a `vercel.json` SPA rewrite configuration to ensure client-side routing routes all requests to `index.html`:
```json
{
  "routes": [
    {
      "src": "/[^.]+",
      "dest": "/",
      "status": 200
    }
  ]
}
```
