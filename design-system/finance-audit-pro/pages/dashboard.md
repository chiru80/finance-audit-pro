# Page Override: Dashboard

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Dashboard page only.
> All rules not explicitly listed here fall back to Master.

---

**Page:** Dashboard (`/dashboard`)  
**Component:** `src/app/dashboard/dashboard.component.ts`  
**Route:** Default authenticated route  
**Layout:** Single-column → responsive grid (stats: 1/2/3 cols, analytics: 1/3 cols)

---

## Page-Specific Token Overrides

| Token | Master Value | Dashboard Value | Reason |
|-------|--------------|-----------------|--------|
| Container max-width | none (full) | `max-w-7xl` (1280px) | Dashboard content centered, breathing room |
| Section gap | `--glass-space-xl` (32px) | `space-y-8` (32px) | Consistent with Master |
| Card padding | `--glass-space-md` (16px) | `p-6` (24px) | Elevated cards need more inner space for charts |

---

## Component Composition

### Header Section (Lines 28–71)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Title | Native `<h1>` | `text-2xl sm:text-3xl font-extrabold tracking-tight text-[#F8FAFC]` |
| Subtitle | Native `<p>` | `text-sm font-medium text-[#94A3B8]` |
| Date badge | Native `<span>` | `text-xs font-bold text-[#38BDF8] uppercase tracking-widest` |
| Quick Actions | `<a>` + `<glass-button>` | `variant="filled"` (primary), `variant="glass"` (secondary), `size="md"` |
| Icons | Inline SVG | `stroke="currentColor"`, `w-4 h-4`, `stroke-width="2.5"` |

**Pattern:** Header uses flexbox with `sm:flex-row` for responsive stack → row. Primary CTA (Add Collection) uses `filled` variant; secondary CTAs use `glass` variant.

### Stats Grid (Lines 74–120)

| Slot | Component | Props |
|------|-----------|-------|
| 1 | `<glass-stat-card>` | `label="Total Customers"`, `color="primary"`, `trend=8.4`, `icon=customers` |
| 2 | `<glass-stat-card>` | `label="Today's Collection"`, `prefix="₹"`, `color="success"`, `trend=12.5`, `icon=collection` |
| 3 | `<glass-stat-card>` | `label="Weekly Collection"`, `prefix="₹"`, `color="success"`, `trend=5.2`, `icon=weekly` |
| 4 | `<glass-stat-card>` | `label="Monthly Collection"`, `prefix="₹"`, `color="success"`, `trend=18.0`, `icon=monthly` |
| 5 | `<glass-stat-card>` | `label="Total Outstanding"`, `prefix="₹"`, `color="warning"`, `icon=outstanding` |
| 6 | `<glass-stat-card>` | `label="Pending Payments"`, `prefix="₹"`, `color="warning"`, `icon=pending` |

**Grid:** `grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5` (matches `--glass-space-lg`)

**Data Binding:** All values from `stats$ | async` (Observable). Nullish coalescing `?? 0` for loading state.

**Color Semantics:**
- `primary` (blue) → neutral/count metrics
- `success` (green) → positive financials (collections)
- `warning` (amber) → attention needed (outstanding, pending)
- `danger` (red) → not used here (would be for overdue/failed)

**Trend Badges:** Positive trends only (green). Negative would use `trend < 0` → red badge automatically.

### Analytics Row (Lines 123–239)

Two elevated glass cards side-by-side on `lg`, stacked on mobile:

#### Card 1: Collection Velocity & Trend (`lg:col-span-2`)

| Element | Implementation |
|---------|----------------|
| Header | Native `<h3>` + `<p>` with border-bottom |
| Badge | Native `inline-flex` with colored dot + text (`bg-blue-500/15`, `border-blue-500/30`) |
| Chart | **Inline SVG** (not a chart library) — area + line path, gradient fill, data point circles |
| Metrics Footer | 3-column grid, `font-mono` for numbers |

**SVG Chart Notes:**
- ViewBox: `0 0 500 120` (fixed aspect, scales via `w-full h-44`)
- Gradient: `linearGradient` id=`velocityGradient` (blue 35% → 0%)
- Area path: Smooth quadratic curves (`Q` / `T` commands)
- Line path: Same curve, stroke `#3B82F6` width 3
- Data points: Circles with white stroke ring, last point pulses (`animate-pulse`)
- Grid lines: `stroke="#263449"` dasharray (subtle, matches border token)

**Do NOT replace with chart library** — inline SVG is intentional for zero-dep, pixel-perfect, theme-aware rendering.

#### Card 2: Dues Status Breakdown (`lg:col-span-1`)

| Element | Implementation |
|---------|----------------|
| Header | Native `<h3>` + `<p>` with border-bottom |
| Donut | **Inline SVG** — three concentric `stroke-dasharray` segments on shared path |
| Center | Absolute-positioned health score (92%) |
| Legend | 3 rows, colored dots + labels + mono percentages |

**SVG Donut Notes:**
- ViewBox: `0 0 36 36`, radius 15.9155 (circumference = 100)
- Track: `#18243A` (elevated surface color)
- Segments: `stroke-dasharray="XX, 100"` + `stroke-dashoffset` for positioning
- Colors: `emerald-500` (collected), `amber-500` (outstanding), `blue-500` (pending)
- Transform: `-rotate-90` to start at 12 o'clock

---

### Recent Transactions Card (Lines 243–315)

| Element | Component/Primitive |
|---------|---------------------|
| Card | `<glass-card variant="elevated">` with custom padding/border classes |
| Header | Native flex: indicator dot + `<h2>` + "View Full Ledger" link |
| Table | Native `<table>` (not `<glass-table>` — custom layout for transaction density) |
| Row hover | `hover:bg-[#18243A]/70` |
| Status | `<glass-badge [status]="...">` → `paid` = success variant, `pending` = warning variant |
| Action | Native `<a>` with icon button (no glass-button — subtle affordance) |
| Empty State | `<glass-empty-state variant="info" size="sm" actionLabel="Record First Collection" actionVariant="filled">` |

**Why native table not glass-table?**
- Transaction rows need custom currency formatting (`money` pipe)
- Status badge + action icon per row (not uniform action buttons)
- Simpler pagination not needed (fixed 10 rows from service)
- Keep as-is unless transaction list grows → then migrate to `<glass-table>` with custom column formatters

---

## Data Flow

```
DashboardComponent
  ├─ stats$ = dashboardService.getStats() → Observable<DashboardStats>
  ├─ transactions$ = dashboardService.getRecentTransactions() → Observable<Transaction[]>
  ├─ userName = computed(() => authService.user()?.full_name || email prefix)
  ├─ greeting = computed(() => time-based string)
  └─ todayFormatted = formatted Date (locale en-US)
```

**Service Contract (`DashboardService`):**
- `getStats()`: Returns `{ totalCustomers, todaysCollection, weeklyCollection, monthlyCollection, totalOutstanding, pendingPayments }`
- `getRecentTransactions()`: Returns `Transaction[]` (max 10, most recent first)
- `Transaction`: `{ id, date, customer_name, amount, status: 'paid' | 'pending' }`

---

## Responsive Breakpoints (Tested)

| Viewport | Stats Grid | Analytics Row | Table |
|----------|------------|---------------|-------|
| 375px (mobile) | 1 col | Stacked (velocity full, donut below) | Horizontal scroll (`overflow-x-auto`) |
| 768px (tablet) | 2 cols | Stacked | Horizontal scroll |
| 1024px (desktop) | 3 cols | Side-by-side (2:1) | Full width |
| 1440px (wide) | 3 cols | Side-by-side | Full width, centered `max-w-7xl` |

**Container queries:** Not yet used — page uses viewport media queries. Future: migrate cards to `@container` for true component-level responsiveness.

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Headings | `<h1>` (page title), `<h2>` (section cards), `<h3>` (card titles) — proper hierarchy |
| Color contrast | All text ≥ 4.5:1 (primary `#F8FAFC` on `#0B1120` = 18.5:1) |
| Focus states | Buttons/links use `focus:ring-2 focus:ring-[#2563EB]/40` (inherited from glass-button) |
| Reduced motion | `animate-pulse` on SVG respects `prefers-reduced-motion` via global token |
| ARIA | `glass-badge` has `role="status"`, `glass-empty-state` has `role="region"` |
| Keyboard | All interactive elements reachable (buttons, links, badge not interactive) |

---

## Anti-Patterns Specific to Dashboard

- ❌ Do not add a chart library (Chart.js, Recharts, etc.) — inline SVG is the standard
- ❌ Do not use `<glass-table>` for transactions unless pagination/sorting needed
- ❌ Do not hardcode colors in SVG — use `currentColor` + Tailwind text utilities (`text-emerald-500`, etc.)
- ❌ Do not add loading spinners per card — skeleton handled by service (or add `<glass-skeleton>` if needed)
- ❌ Do not use `variant="kpi"` on stat cards — default variant is correct here

---

## Future Enhancements (Tracked)

- [ ] Migrate stat cards to `@container` queries for true responsive independence
- [ ] Add `<glass-progress>` to stat cards for collection target visualization
- [ ] Implement real-time updates via WebSocket (stats$ refresh)
- [ ] Add date range picker for velocity chart (weekly/monthly/quarterly)
- [ ] Export button (PDF/CSV) in transactions card header
- [ ] Drill-down: click transaction → open detail drawer (`<glass-dialog>` or side sheet)

---

## Related Files

- `src/app/dashboard/dashboard.component.ts` — Component logic + template
- `src/app/dashboard/dashboard.service.ts` — Data service (mock → replace with Supabase)
- `src/app/dashboard/dashboard.component.css` — Minimal (only hosts `styleUrls`)
- `src/app/design-system/components/glass-stat-card.component.ts` — Stat card component
- `src/app/design-system/components/glass-card.component.ts` — Base card component
- `src/app/design-system/components/glass-badge.component.ts` — Status badge directive
- `src/app/design-system/components/glass-empty-state.component.ts` — Empty state component
- `src/app/design-system/components/glass-button.component.ts` — Button component