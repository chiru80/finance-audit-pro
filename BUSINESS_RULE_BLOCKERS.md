# Business Rule Blockers — Finance Audit Pro

**Owner Decisions Required Before Implementing Absence & Carry-Forward Workflow**

As per the architectural guidelines, financial rules must NEVER be invented. The following business questions require explicit confirmation from the owner.

---

### Question 1: Weekly Due on Absence
**When a customer is marked "absent" and the absence is APPROVED by the owner:**
- **Option A:** The customer is **waived** of that week's due (due amount = 0, no debt added).
- **Option B (Recommended for weekly finance):** The customer is **still charged** that week's due, but the absence simply documents why they didn't pay that week, and the unpaid amount carries forward to future weeks.
- **Option C:** Configurable per customer or per absence request.

---

### Question 2: Partial Payment Allocation
**When a customer pays less than their total outstanding dues:**
- Current Implementation: FIFO (First In, First Out) — pays off the oldest unpaid week first, and any remainder is partially applied to the next week.
- **Does the owner confirm FIFO allocation is the desired behavior?** (Yes / No)

---

### Question 3: Excess Payment Handling
**When a customer pays more than their total current dues:**
- Current Implementation: Excess is held as a customer credit (`credit_amount`) in paise and automatically applied towards future weeks.
- **Does the owner confirm excess payments should be held as credit balance?** (Yes / No)

---

### Question 4: Customer Status: Paused / Suspended
**When a customer is temporarily paused or suspended:**
- Should new weekly dues stop generating automatically during the suspension period? (Yes / No)

---

### Question 5: Weekly Cycle Boundary
**What defines a weekly cycle?**
- Standard calendar week (Monday 00:00 to Sunday 23:59), or cycle relative to enrollment date?

