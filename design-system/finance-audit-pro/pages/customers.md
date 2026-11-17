# Page Override: Customers

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Customers page only.
> All rules not explicitly listed here fall back to Master.

---

**Page:** Customers (`/customers`)  
**Component:** `src/app/customer-list/customer-list.component.ts` (or similar)  
**Route:** `/customers`  
**Layout:** List → Detail pattern

---

## Page-Specific Token Overrides

| Token | Master Value | Customers Value | Reason |
|-------|--------------|-----------------|--------|
| Container max-width | none (full) | `max-w-6xl` (960px) | Customer list needs wide viewport for table columns |

---

## Component Composition

### Page Header

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Title | Native `<h1>` | `text-2xl font-bold text-[#F8FAFC]` |
| Stats chips | `<glass-badge>` variant=`subtle` | Shows total, verified, pending |
| Primary CTA | `<glass-button>` variant=`filled` | "Add Customer" |

### Customer List

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Search | Native `<input>` with `glassInput` directive | `type="search"`, `placeholder="Search clients..."` |
| Table | `<glass-table>` | Columns: Name, Email, Phone, Status, Actions |
| Status badges | `<glass-badge [status]="...">` | `primary` = Active, `warning` = Pending KYC, `danger` = Suspended |

### Empty State

| Component | Props |
|-----------|-------|
| `<glass-empty-state>` | `title="No customers yet"`, `description="Add your first client to start tracking."`, `variant="info"`, `actionLabel="Add Customer"`, `actionVariant="filled"` |

---

## Data Flow

```
CustomerListComponent
  ├─ customers$ = customerService.getCustomers() → Observable<Customer[]>
  ├─ searchTerm = computed(() -> filter input)
  ├─ filteredCustomers = computed(() -> filter(customers$ | async, searchTerm))
  └─ statusFilters = signal({ active: true, pending: true, suspended: false })
```

**Customer Interface:**
```typescript
{
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'pending' | 'suspended';
  kyc_verified: boolean;
  last_transaction?: Date;
}
```

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| 375px | Stack: search → table (horizontal scroll) |
| 768px | Two rows of stat chips |
| 1024px+ | Full table with all columns |

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Search input | `<label>` element, `aria-label="Search customers"` |
| Status badges | `role="status"` via glass-badge |
| Table headers | Proper `<th>` scope="col" |
| Row actions | Keyboard accessible, focus visible |

---

## Anti-Patterns Specific to Customers

- ❌ Do not use `<glass-table>` without sortable columns (customers list should support sorting by name, email, status)
- ❌ Do not show phone without `tel:` link (format: `+1-XXX-XXX-XXXX`)
- ❌ Do not hide suspend reason (modal to explain on click)
- ❌ Do not use inline delete confirmation (use `<glass-dialog>`)

---

## Future Enhancements

- [ ] Add bulk action toolbar (select multiple customers)
- [ ] Export to CSV button
- [ ] Status change dropdown in row actions
- [ ] Customer detail drawer (right slide) or dedicated page

---

## Related Files

- `src/app/customer-list/customer-list.component.ts` (create if not exists)
- `src/app/design-system/components/glass-table.component.ts` — table component
- `src/app/design-system/components/glass-badge.component.ts` — status badges
- `src/app/design-system/components/glass-button.component.ts` — primary CTA
- `src/app/design-system/components/glass-empty-state.component.ts` — empty state