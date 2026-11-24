# Page Override: Collections

> **OVERRIDES:** This file overrides `design-system/finance-audit-pro/MASTER.md` for the Collections page only.
> All rules not explicitly listed here fall back to Master.
> 
> **User instruction:** Create page overrides for collections, reports, settings pages per most recent explicit request.

---

**Page:** Collections (`/collections`)  
**Component:** `src/app/collections/collection-entry.component.ts` (or `weekly-tracker.component.ts`)  
**Route:** `/collections`  
**Layout:** Tabbed interface → Record Collection / Weekly Tracker & Absences

---

## Page-Specific Token Overrides

| Token | Master Value | Collections Value | Reason |
|-------|--------------|-------------------|--------|
| Container max-width | none (full) | `max-w-6xl` (960px) | Tabbed interface needs moderate width for form controls |
| Section gap | `--glass-space-xl` (32px) | `space-y-6` (24px) | Form rhythm tighter than dashboard grid |
| Input height | default | `h-10` (20px) | Form inputs need compact height |

---

## Component Composition

### Tabbed Interface Header

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Tabs | `<glass-tabs>` | `variant="line"`, `activeId="record"` |
| Tab 1: Record Collection | `<glass-tab-item>` | `id="record"`, `label="Record Collection"` |
| Tab 2: Weekly Tracker | `<glass-tab-item>` | `id="tracker"`, `label="Weekly Tracker"` |
| Primary CTA (in record tab) | `<glass-button>` | `variant="filled"`, `size="md"`, `label="Add Collection"` |

### Record Collection Form

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Customer select | `<select>` with `glassInput` directive | `placeholder="Select customer..."`, `class="w-full"` |
| Amount input | `<input>` with `glassInput` directive | `type="number"`, `placeholder="0"`, `class="w-full"` |
| Payment method | `<select>` with `glassInput` directive | `class="w-full"` |
| Notes textarea | `<textarea>` with `glassInput` directive | `placeholder="Notes (optional)"`, `class="w full"` |
| Action button | `<glass-button>` | `variant="filled"`, `size="md"`, `label="Record Payment"` |

### Weekly Tracker Section (embedded from WeeklyTrackerComponent)

| Element | Component/Primitive | Props / Classes |
|---------|---------------------|-----------------|
| Customer selector | `<select>` | `class="block w-full rounded-md border glass-border-subtle px-3 py-2 text-sm text-[var(--text-primary)] focus:ring-2 focus-ring-[var(--primary-accent)]/40 focus:ring-offset-1 focus-ring-offset-[var(--bg-primary)]"` |
| Schedules list | `< WeeklyTrackerComponent >` | `customerId` prop bound to selected customer |
| Absence reason prompt | Native `<prompt>` or custom modal | Trigger per schedule row |

**Why embedded component?** The WeeklyTrackerComponent already exists with full functionality; this page override composes it within the collections tab layout.

---

## Data Flow

```
CollectionsComponent
  ├─ activeTab = signal<'record' | 'tracker'>('record')
  ├─ selectedCustomer = signal<string>('')
  ├─ customers$ = customerService.getCustomers() → Observable<Customer[]>
  ├─ formValues = computed(form state)
  └─ onTabChange(tabId) → switch between record/tracker modes
```

**Service Contract (`CollectionService`):**
- `getCustomers()`: Returns active customers ordered by name
- `recordPayment(paymentData)`: Records a weekly payment via Supabase RPC
- `generateSchedules(customerId)`: Generates 4-week weekly schedules
- `recordAbsence(scheduleId, reason)`: Records customer absence

---

## Responsive Breakpoints

| Viewport | Layout |
|----------|--------|
| 375px (mobile) | Stack: select inputs vertically, button full-width |
| 768px (tablet) | Two-column: form left, tracker summary right (if applicable) |
| 1024px+ | Full form width, tabs always visible |

**Container queries:** Not yet used — page uses viewport media queries. Future: migrate form inputs to `@container` for true component-level responsiveness.

---

## Accessibility Notes

| Feature | Implementation |
|---------|----------------|
| Form labels | All inputs have associated `<label>` elements; `glassInput` directive adds visual styling |
| Customer select | `aria-label="Select customer"` when no native label |
| Amount input | `aria-label="Collection amount in INR"` |
| Payment method | `aria-label="Payment method"` |
| Action buttons | `aria-label="Record Payment"`, `aria-label="Generate Schedules"` |
| Reduced motion | `animate-pulse` on SVG respects `prefers-reduced-motion` via global token |

---

## Anti-Patterns Specific to Collections

- ❌ Do not use `variant="kpi"` on form stat cards — default variant is correct for forms
- ❌ Do not hardcode customer names in template — always fetch from service
- ❌ Do not skip validation on amount field — require positive number > 0
- ❌ Do not use inline delete confirmation (use `<glass-dialog>` if deletion needed)
- ❌ Do not embed WeeklyTracker without customer selection — must select customer first

---

## Future Enhancements (Tracked)

- [ ] Add bulk collection recording (multi-select customers)
- [ ] Add payment method icons (cash, online, cheque, other)
- [ ] Add scheduled payment recurring options
- [ ] Add export to CSV for collection history
- [ ] Add customer-wise collection trend charts
- [ ] Add weekly schedule generation with custom week count

---

## Related Files

- `src/app/collections/collection-entry.component.ts` — Main collection entry component
- `src/app/collections/weekly-tracker.component.ts` — Weekly tracker & absences
- `src/app/design-system/components/glass-tabs.component.ts` — Tabs component
- `src/app/design-system/components/glass-button.component.ts` — Action buttons
- `src/app/design-system/components/glass-input.directive.js` — Input directive
- `src/app/design-system/components/glass-badge.component.ts` — Status badges