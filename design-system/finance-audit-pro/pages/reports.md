# Page Override: Reports

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Reports page only.
> All rules not explicitly listed here fall back to Master.
> 
> **User instruction:** Create page overrides for collections, reports, settings pages per most recent explicit request.

---

**Page:** Reports (`/reports`)  
**Component:** `src/app/reports/reports.component.ts`  
**Route:** `/reports`  
**Layout:** Date range filter → Summary cards → Recent payments table → Customer balances

---

## Page-Specific Token Overrides

| Token | Master Value | Reports Value | Reason |
|-------|--------------|---------------|--------|
| Container max-width | none (full) | `max-w-7xl` (1440px) | Reports need wide viewport for tables and CSV exports |
| Section gap | `--glass-space-xl` (32px) | `space-y-8` (32px) | Consistent rhythm between summary and detailed sections |
| Card padding | `--glass-space-md` (16px) | `p-6` (24px) | Summary cards need spacious padding for metric readability |
| Table height | default | `h-[500px]` (controlled) | Payment/customer tables need fixed height with scroll |

---

## Component Composition

### Header Section (Lines 1–40)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Title | Native `<h1>` | `text-2xl font-bold text-[#F8FAFC]` |
| Date preset chips | `<glass-badge>` variant=`subtle` | `7d`, `30d`, `this_month`, `all` |
| Primary CTA | `<glass-button>` | `variant="filled"`, `size="md"`, `label="New Report"` |
| Export buttons | `<glass-button>` variant=`glass` | `size="sm"`, `label="Export CSV"` (two: payments, balances) |

### Summary Cards (Lines 43–100)

| Slot | Component | Props |
|------|-----------|-------|
| 1 | `<glass-stat-card>` | `label="Total Customers"`, `color="primary"`, `trend` auto-calculated |
| 2 | `<glass-stat-card>` | `label="Total Outstanding"`, `prefix="₹"`, `color="warning"` |
| 3 | `<glass-stat-card>` | `label="Total Paid"`, `prefix="₹"`, `color="success"` |
| 4 | `<glass-stat-card>` | `label="Total Due"`, `prefix="₹"`, `color="primary"` |
| 5 | `<glass-stat-card>` | `label="This Week Collectible"`, `prefix="₹"`, `color="info"` |

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4` (matches `--glass-space-lg`)

### Recent Payments Table (Lines 103–200)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Table | `<glass-table>` | Columns: Date, Payment ID, Customer, Amount, Method, Reference |
| Row hover | `hover:bg-[var(--glass-surface-elevated)]` |
| Empty state | `<glass-empty-state variant="info" size="sm" actionLabel="No payments" actionVariant="filled">` |

### Customer Balances Table (Lines 203–300)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Table | `<glass-table>` | Columns: Customer Name, Phone, Outstanding, Total Paid, Status |
| Row actions | Edit modal, Delete confirmation (`<glass-dialog>`) |
| Export CTA | `<glass-button>` variant=`glass`, `size="sm"`, `label="Export Balances CSV"` |

---

## Data Flow

```
ReportsComponent
  ├─ loading = signal(true)
  ├─ error = signal<string | null>(null)
  ├─ activePreset = signal<'7d' | '30d' | 'this_month' | 'all'>('30d')
  ├─ startDate = signal<string>('')
  ├─ endDate = signal<string>('')
  ├─ summary = signal<SummaryData> | null>(null)
  ├─ recentPayments = signal<any[]>([])
  ├─ customerBalances = signal<any[]>([])
  ├─ onPresetChange(preset) → update date range + load data
  ├─ onDateRangeChange(start, end) → update date filters
  ├─ exportPaymentsCSV() → generate and download CSV
  └─ exportBalancesCSV() → generate and download CSV
```

**Service Contract (`ReportsService`):**
- `getSummary()`: Returns `{ totalCustomers, totalOutstanding, totalDue, totalPaid, thisWeekCollectible }`
- `getRecentPayments(startDate?, endDate?)`: Returns `Payment[]` (limited to 100)
- `getCustomerBalances()`: Returns customer objects ordered by outstanding balance
- `exportPaymentsCSV(startDate, endDate)`: Returns CSV bytes
- `exportBalancesCSV()`: Returns CSV bytes

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| 375px (mobile) | Stack: summary cards 1 col, tables horizontal scroll, export buttons full-width |
| 768px (tablet) | Two-column: summary cards left (2 cols), tables right (stacked) |
| 1024px+ | Full four-column summary, tables full width with proper columns |
| 1440px+ | Centered `max-w-7xl`, generous spacing between sections |

**Container queries:** Not yet used — page uses viewport media queries. Future: migrate summary cards to `@container` for true component-level responsiveness.

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Date preset chips | `aria-label="Select date range"`, keyboard navigable (`role="tablist"` or similar) |
| Export buttons | `aria-label="Export payments report CSV"`, `aria-label="Export customer balances CSV"` |
| Summary cards | `aria-label="Total customers: {value}"` for screen readers |
| Table headers | Proper `<th scope="col">` for all columns |
| Reduced motion | All transitions respect `prefers-reduced-motion` via global token |

---

## Anti-Patterns Specific to Reports

- ❌ Do not use `variant="kpi"` on stat cards — default variant is correct for summary overview
- ❌ Do not skip date range filtering — reports should always have a date context
- ❌ Do not hardcode currency symbols — use `₹` via money pipe or locale-aware formatting
- ❌ Do not export unlimited rows — cap at 100 for performance, warn user if data truncates
- ❌ Do not forget to set `startDate`/`endDate` when changing presets

---

## Future Enhancements (Tracked)

- [ ] Add date range picker component (replacing preset chips)
- [ ] Add comparison mode (current period vs. previous period)
- [ ] Add real-time stats WebSocket updates
- [ ] Add scheduled report delivery (email daily/weekly summaries)
- [ ] Add interactive charts for payment trends (inline SVG, not chart library)
- [ ] Add filtering by payment method, status, customer segment

---

## Related Files

- `src/app/reports/reports.component.ts` — Reports component logic
- `src/app/reports/reports.component.html` — Reports component template
- `src/app/design-system/components/glass-stat-card.component.ts` — Stat cards
- `src/app/design-system/components/glass-table.component.ts` — Tables
- `src/app/design-system/components/glass-button.component.ts` — Action buttons
- `src/app/design-system/components/glass-empty-state.component.ts` — Empty states