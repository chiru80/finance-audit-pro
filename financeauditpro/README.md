# Finance Audit Pro

A precise, auditable weekly collection ledger for microfinance / chit-fund businesses. Built with Angular 22, Supabase/PostgreSQL, and Tailwind CSS.

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- Supabase project (free tier works)

### Setup

```bash
# 1. Clone
git clone https://github.com/your-org/finance-audit-pro.git
cd finance-audit-pro

# 2. Install
npm install

# 3. Configure environment
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Run dev server
npm start
# Opens http://localhost:4200
```

### Environment Variables

| Variable                 | Required | Description                |
| ------------------------ | -------- | -------------------------- |
| `VITE_SUPABASE_URL`      | ✅       | Supabase project URL       |
| `VITE_SUPABASE_ANON_KEY` | ✅       | Supabase anon public key   |
| `PLAUSIBLE_DOMAIN`       | ❌       | Analytics domain (v1.1.6+) |
| `SENTRY_DSN`             | ❌       | Error tracking (future)    |

See `.env.example` for full list.

## Development

```bash
# Start dev server
npm start

# Run unit tests
npm test

# Run linting
npm run lint

# Check formatting
npm run format:check

# Production build
npm run build
```

## Project Structure

```
src/
├── app/
│   ├── auth/           # Authentication (login, signup, guards)
│   ├── customers/      # Customer management (list, form, detail)
│   ├── collections/    # Weekly collection entry & tracker
│   ├── dashboard/      # Financial KPI cards
│   ├── ledger/         # Transaction ledger
│   ├── reports/        # Financial reports & CSV export
│   ├── settings/       # Business policy configuration
│   ├── shared/         # Shell, header, sidebar, theme, i18n
│   ├── design-system/  # Glisse Liquid Glass components
│   └── utils/          # Currency, allocation, validation utilities
├── environments/       # Environment configs
└── styles.css          # Global styles & Tailwind
```

## Tech Stack

- **Frontend:** Angular 22 + TypeScript + Tailwind CSS 4
- **Backend:** Supabase (PostgreSQL + Auth + RLS)
- **Testing:** Vitest (unit) + Cypress (e2e)
- **Design:** Glisse Liquid Glass (native Angular adaptation)
- **Languages:** English + Telugu (full bilingual)

## Deployment

- **Target:** `weeklyfinance.online` (Vercel)
- **Staging:** Automatic preview deployments on PRs
- **Production:** Manual promotion via GitHub Actions

## Documentation

- `PROJECT_STATUS.md` — Current implementation status
- `PRODUCT.md` — Product principles & constraints
- `ROADMAP.md` — Future releases
- `SECURITY_AUDIT.md` — Security posture
- `ACCESSIBILITY.md` — WCAG 2.2 AA conformance (v1.1+)

## License

Proprietary — Single-owner use only.
