# Business Rule Decisions — Finance Audit Pro

**Approved by Owner:** 2026-11-12

---

### Decision 1: Weekly Due on Absence — APPROVED: OPTION A
- **Rule**: When a customer is marked absent (and approved by the owner), the weekly due **is STILL CHARGED** and **carries forward as debt**.
- **Rationale**: In weekly microfinance / loan book management, absence documents why collection did not happen on that day/week, but does not forgive or waive the customer's financial obligation. Unpaid weekly dues accumulate in `outstanding_balance`.

---

### Decision 2: Partial Payment Allocation — APPROVED: FIFO
- **Rule**: Partial payments are allowed.
- **Allocation Order**: First-In, First-Out (FIFO) — payments are applied towards the oldest unpaid weekly schedule first, and any remainder pays partially towards the next week.

---

### Decision 3: Excess Payment Handling — APPROVED: CUSTOMER CREDIT
- **Rule**: If a customer pays more than their current total outstanding dues, the excess amount is held as customer credit (`credit_amount` in paise) and automatically applied towards future generated weekly schedules.

---

### Decision 4: Customer Status: Paused / Suspended — APPROVED
- **Rule**: If a customer is marked `suspended`, new weekly schedules are not automatically generated for that customer until their status is returned to `active`.

---

### Decision 5: Weekly Cycle Boundary — APPROVED: MONDAY TO SUNDAY
- **Rule**: Weekly schedules follow standard Monday to Sunday calendar weeks with configurable due day (default: Monday).
