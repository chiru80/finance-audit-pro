# Page Override: Ledger

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Ledger page only.
> All rules not explicitly listed here fall back to Master.

---

**Page:** Ledger (`/ledger`)  
**Component:** `src/app/ledger/ledger.component.ts` (or similar)  
**Route:** `/ledger`  
**Layout:** List → Detail pattern

---

## Page-Specific Token Overrides

| Token | Master Value | Ledger Value | Reason |
|-------|--------------|--------------|--------|
| Container max-width | none (full) | `max-w-7xl` (1280px) | Transaction ledger needs wide viewport for date/amount columns |

---

## Component Composition

### Page Header

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Title | Native `<h1>` | `text-2xl font-bold text-[#F8FAFC]` |
| Stats chips | `<glass-badge>` variant=`subtle` | Shows Today's total, Week's total |
| Primary CTA | `<glass-button>` variant=`filled` | "New Transaction" |
| Export CTA | `<glass-button>` variant=`glass` | "Export CSV" (opens dropdown) |

### Ledger Table

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Date filter | `<input type="date">` with `glassInput` directive | `class="w-auto"` |
| Status filter | `<glass-dropdown>` | Options: All, Cleared, Uncleared, Pending |
| Table | `<glass-table>` | Columns: Date, Customer, Description, Amount, Status |
| Status badges | `<glass-badge [status]="...">` | `primary` = Cleared, `warning` = Pending, `danger` = Uncleared |

### Row Actions

| Action | Implementation |
|--------|----------------|
| View | Icon button → `<glass-button variant="tinted" size="sm">` |
| Edit | Modal drawer (`<glass-dialog>` or right slide) |
| Delete | Confirmation dialog (`<glass-dialog variant="danger">`) |

---

## Data Flow

```
LedgerComponent
  ├─ transactions$ = ledgerService.getTransactions() → Observable<Transaction[]>
  ├─ selectedDate = signal(Date | null)
  ├─ statusFilter = signal<'all'|'cleared'|'uncleared'|'pending'>('all')
  ├─ filteredTransactions = computed(() -> filter(transactions$ | async, selectedDate, statusFilter))
  └─ totals$ = ledgerService.getTotals() → Observable<{ today: number, week: number }>
```

**Transaction Interface:**
```typescript
{
  id: string;
  date: string; // ISO date
  customer_id: string;
  customer_name: string;
  description: string;
  amount: number; // in minor units (paise)
  status: 'cleared' | 'uncleared' | 'pending';
  audit_trail: string[];
  created_at: string;
}
```

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| 375px | Stack: filter row → table (horizontal scroll) |
| 768px | Two rows of stat chips |
| 1024px+ | Full table with all columns |

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Date filter | `<label for="date-filter">` + `id="date-filter"` |
| Status filter | `<label for="status-filter">` + `id="status-filter"` |
| Table headers | Proper `<th scope="col">` |
| Row actions | Keyboard accessible, focus visible, icon aria-labels |
| Amounts | `role="cell"` with currency prefix (₹) |

---

## Audit Trail Considerations

Per compliance requirements:
- Every edit creates a new `audit_trail` entry
- Uncleared transactions require supervisor review
- Deleted transactions are soft-deleted with deletion reason logged
- Export includes full audit trail

---

## Anti-Patterns Specific to Ledger

- ❌ Do not use `<glass-table>` without sortable columns (ledger must sort by date/amount/customer)
- ❌ Do not display amounts without INR prefix (₹)
- ❌ Do not allow inline editing (must use dialog/drawer)
- ❌ Do not permanently delete (soft delete only)
- ❌ Do not hide audit_trail (expandable row)

---

## Future Enhancements

- [ ] Add bulk action toolbar (select multiple transactions)
- [ ] Excel export with audit trail
- [ ] Reconciliation status indicators
- [ ] Undo delete within 24 hours
- [ ] Export to XBRL for regulatory filing
- [ ] Audit trail expandable row

---

## Related Files

- `src/app/ledger/ledger.component.ts` (create if not exists)
- `src/app/design-system/components/glass-table.component.ts` — table component
- `src/app/design-system/components/glass-badge.component.ts` — status badges
- `src/app/design-system/components/glass-button.component.ts` — action buttons
- `src/app/design-system/components/glass-empty-state.component.ts` — empty state
- `src/app/shared/money-pipe.ts` — currency formatting