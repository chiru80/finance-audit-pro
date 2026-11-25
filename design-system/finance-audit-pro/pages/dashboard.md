# Dashboard Design Guidance

**Page:** `/dashboard`
**Active component:** `src/app/dashboard/premium-dashboard.component.ts`
**Data source:** `DashboardService` queries the connected Supabase ledger. Preserve its paise values and error states; never introduce sample balances or inferred trends.

## Visual direction

Follow the Obsidian Luxe tokens in `src/app/design-system/styles/glass-tokens.css`. Keep the page spacious and restrained: obsidian/graphite surfaces in dark mode, warm ivory/white surfaces in light mode, Cormorant Garamond for editorial totals, and Inter for interface text. Champagne is a small accent, not a substitute for income/expense status colors. The hero uses the real trailing-30-day collection total, formatted by the shared `money` pipe.

## Dashboard hierarchy

1. Welcome and portfolio overview hero, with the real 30-day collection total.
2. Quick actions for customer records and recording a collection.
3. Six live metrics: customers, collections today, rolling seven-day collections, rolling 30-day collections, customer outstanding balances, and pending payments.
4. Collection activity periods using the service’s actual today, seven-day, and 30-day totals.
5. Outstanding exposure with customer dues and pending ledger entries.
6. The ten most recent transactions from the ledger.

Do not add chart trends, savings, account balances, budgets, or percentage deltas unless the database supplies the required real data. The activity bars compare actual period totals only; they are not a daily time series. Do not fabricate financial health scores.

## Data and behavior

- Monetary values returned by `DashboardService` are integer paise; use `MoneyPipe` for display and do not convert twice.
- Loading, error, retry, and empty states are intentional and must remain visible and accessible.
- Keep transaction amount sign and paid/pending status semantics intact.
- Keep actions connected to the existing `/customers`, `/collections`, `/ledger`, and `/reports` routes.
- Preserve the current service contract and Supabase integration when refining the view.

## Responsive and accessible behavior

- The six KPI cards use three columns on wide screens and two columns at tablet/mobile widths; the analytic cards stack on narrow screens.
- The transaction table retains horizontal scrolling instead of compressing financial values.
- Use a single page-level `<h1>`, section `<h2>` headings, semantic table headers, visible focus indicators, and status/error announcements.
- Keep controls touch-friendly and honor `prefers-reduced-motion`.
- Both themes use the same layout; only semantic tokens change.
