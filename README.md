# 🌿 Veggio — Fresh Vegetable Ordering Platform

A full-stack vegetable e-commerce platform built with:
- **Frontend:** React 18 + Vite + React Query + Framer Motion
- **Backend:** C# ASP.NET Core 8 (.NET 8)
- **Database:** PostgreSQL 15
- **Hosting:** AWS EC2 + RDS (Free Tier)

---

## Project Structure

```
veggio/
├── frontend/               # React app
│   ├── src/
│   │   ├── assets/styles/  # CSS tokens, global, skeleton
│   │   ├── components/
│   │   │   ├── auth/       # AuthModal
│   │   │   ├── layout/     # Navbar, Footer, Layout, AdminLayout
│   │   │   ├── shop/       # VeggieCard, CartDrawer
│   │   │   └── skeleton/   # PageSkeleton, VeggieCardSkeleton…
│   │   ├── context/        # AuthContext, CartContext, ToastContext
│   │   ├── lib/            # api.js (Axios)
│   │   └── pages/
│   │       ├── Home.jsx
│   │       ├── Shop.jsx
│   │       ├── Product.jsx
│   │       ├── Cart.jsx
│   │       ├── Checkout.jsx
│   │       ├── Orders.jsx
│   │       ├── Profile.jsx
│   │       ├── NotFound.jsx
│   │       └── admin/      # Dashboard, Vegetables, Orders, Users
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── backend/                # ASP.NET Core 8 API
│   ├── Controllers/        # Auth, Vegetables, Orders, Admin
│   ├── Data/               # AppDbContext (EF Core + PostgreSQL)
│   ├── DTOs/               # Request/response models
│   ├── Middleware/         # GlobalException, SecurityHeaders
│   ├── Models/             # User, Vegetable, Order, OrderItem
│   ├── Services/           # TokenService (JWT)
│   ├── Program.cs          # App bootstrap
│   ├── appsettings.json
│   └── Veggio.Api.csproj
│
└── docs/
    ├── schema.sql          # Raw PostgreSQL schema
    └── AWS_DEPLOYMENT.md   # Full step-by-step deployment guide
```

---

## Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- .NET 8 SDK
- PostgreSQL 15

### 1. Database
```bash
psql -U postgres -c "CREATE DATABASE veggio;"
psql -U postgres -d veggio -f docs/schema.sql
```

### 2. Backend
```bash
cd backend

# Set secrets (dev)
dotnet user-secrets set "Jwt:Key" "your-dev-secret-at-least-32-chars-long"
dotnet user-secrets set "ConnectionStrings:DefaultConnection" "Host=localhost;Database=veggio;Username=postgres;Password=yourpassword"

# Run migrations and start
dotnet ef database update
dotnet run
# API available at http://localhost:5000
```

### 3. Frontend
```bash
cd frontend
npm install
# Create .env.local:
echo "VITE_API_URL=http://localhost:5000/api" > .env.local
npm run dev
# App available at http://localhost:3000
```

---

## Features

### Customer
- Browse vegetables with search, filter by category, sort, price filter
- Product detail page with related items
- Add to cart with quantity control
- Cart drawer (slide-in) with live totals
- Checkout with address, phone, payment method
- Order history with cancel option
- Profile management
- Sign in / Register modal with validation

### Admin (`/admin`)
- Dashboard with real-time stats (orders, revenue, low stock)
- Vegetables CRUD: add, edit, soft-delete
- Orders management with status updates
- User list with search and pagination

### Design System
- CSS custom properties (tokens) for all colors, spacing, typography
- Skeleton loading screens on all data-fetching pages
- Responsive: mobile-first, 2-col → 3-col → 4-col grids
- Accessible: ARIA labels, focus traps, keyboard nav, skip links
- Dark mode via `prefers-color-scheme`
- Toast notifications
- Animated cart badge, hero floating chips

### Security
- JWT authentication (stored in `sessionStorage`, not `localStorage`)
- BCrypt password hashing (work factor 12)
- Rate limiting (10 auth requests/min, 200 API requests/min)
- Security headers: CSP, X-Frame-Options, HSTS, CORS
- Input validation with data annotations
- Soft deletes (no hard data loss)
- Parameterized queries via EF Core (SQL injection safe)
- Timing-safe password comparison

---

## Default Admin Login
- Email: `admin@veggio.io`
- Password: `Admin@123`

**Change this immediately after first deployment!**

---

## Deployment
See [`docs/AWS_DEPLOYMENT.md`](docs/AWS_DEPLOYMENT.md) for the complete step-by-step AWS Free Tier deployment guide.
