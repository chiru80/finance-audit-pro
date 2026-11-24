# Public APIs vs. Project Requirements

**Date:** 2026-11-17
**Source catalogue:** https://github.com/public-apis/public-apis
**Purpose:** Map the stated requirements of Finance Audit Pro to candidate
public APIs, so we only add an external dependency where it genuinely helps.

> **No application code, packages, keys or configuration were changed.**
> This document is a discovery artifact. Per `PRODUCT_BRIEF.md`, integrations
> require explicit owner approval.

---

## 0. Owner decision recorded — 2026-11-17

**No holiday API will be integrated.** The owner confirmed:

- When a collection day falls on a holiday, the handling is **manual entry or
  correction** — there is no automatic shift, skip or flag rule.
- **There is no predefined holiday list** to load. If a holiday arises, the
  owner will update the record manually at that time.

Consequently item 1 below is **closed / not approved**, and no `public_holidays`
table, fetch script, Edge Function or CORS/proxy work will be added.

---

## 1. How this was checked

1. Read `PRODUCT_BRIEF.md`, `PROJECT_STATUS.md` and the implemented feature
   list to extract the actual data needs.
2. Fetched the full public-apis catalogue (README) and searched the relevant
   sections: Calendar, Finance, Currency Exchange, Data Validation, Phone,
   Email, Government, Test Data, Development.
3. Applied the safety gate: no real customer PII or financial transactions may
   be sent to a third party; prefer keyless, HTTPS, CORS-enabled, cacheable
   reference data; prefer local computation for deterministic logic.

Note: `https://api.publicapis.org/entries` did not resolve from this machine,
so the raw GitHub README was used as the source of truth.

---

## 2. Requirement → API shortlist

| # | Requirement / where it fits | Candidate API(s) | Auth / HTTPS / CORS | Verdict |
|:--|:---|:---|:---|:---|
| 1 | **Holiday-aware weekly scheduling** (`collections/`, `settings/`) — holiday handling | ~~India Public Holidays, caldays, HolidayExplore, Nager.Date~~ | — | **CLOSED — not approved.** Owner chose manual entry/correction with no holiday list. No API or schema change. |
| 2 | **Online payment record metadata** (`collections/`) — store bank branch info for a manual UPI/NEFT reference | **Razorpay IFSC** (Indian bank branch codes) | No / Yes / Unknown | **Optional.** Lookup only; it does **not** verify a payment. Use only if bank details become a stored field. |
| 3 | **Customer address completeness** (`customers/`) — if address collection is added later | **Indian Pincode** (165k+ post offices), **India LGD Index** (states/districts) | No / Yes / Yes | **Defer.** No address requirement exists in the brief today. |
| 4 | **Demo / test data** (local dev, test DB seeding) | **DummyJSON**, **FakerAPI**, **Sampuli**, **RandomUser**, **Mockaroo** | Mostly No / Yes / Yes | **Recommended for dev only.** Generate fixtures offline; never call from the running app or load fake records into production. |
| 5 | **Phone validation** (`form-validation.utils.ts`) | Numverify, Numlookup, AbstractAPI Phone Validation, Veriphone | `apiKey` / Yes / mixed | **Avoid.** All are key-gated and receive the real customer phone number. Keep the existing local regex + format rules. |
| 6 | **Email validation** (`customer-form.component.ts`) | Mailboxlayer, AbstractAPI, VerifNow | `apiKey` / Yes / mixed | **Avoid.** Same PII exposure; local syntax check plus existing verification flow is sufficient. |
| 7 | **Multi-currency support** | **Frankfurter**, **Currency-api**, **AllRatesToday**, **ExchangeRate.dev** | No / Yes / Yes | **Not needed.** The app is INR-only by design and stores integer paise. Revisit only if multi-currency is formally approved. |
| 8 | **Business-customer tax ID (GSTIN)** | **gstinapi** (`apiKey`, free tier), **India GST HSN & SAC** (keyless codes) | mixed | **Defer.** No business-customer or invoicing requirement in the brief. Would send business identifiers to a third party. |
| 9 | **PDF / Excel report export** (today: CSV only) | Various document-generation APIs exist | `apiKey` | **Avoid.** Would send financial data to a third party. Use a local library if PDF/XLSX is ever requested. |
| 10 | **Payment gateway / automatic bank verification** | Many finance APIs exist | — | **Do not integrate.** Explicitly out of scope per `PRODUCT_BRIEF.md` §"Online payments" (lines 120–125). |
| 11 | **Weekly totals, FIFO allocation, balances, carry-forward** | — | — | **No API needed.** Deterministic money math belongs in local TypeScript + PostgreSQL (`BIGINT` paise), which is already implemented and tested. |

---

## 3. Outcome — no external API integration

After reviewing the catalogue, **no public API is being adopted in this
project**. The only candidate that mapped to a genuine data need (a holiday
calendar) was explicitly declined by the owner in favour of manual handling.
Everything else is either already solved locally, out of scope, or an
unacceptable PII/compliance risk.

### Existing manual capabilities (verified in code)

| Capability | Where | Status |
|:---|:---|:---|
| Record an absence with a reason; auto-approve; due stays charged and carries forward (Option A) | `src/app/collections/weekly-tracker.component.ts` → `markAbsent()` → `record_absence` / `approve_absence` RPCs | ✅ Available |
| Manually record a cash collection for a chosen week | `weekly-tracker.component.ts` → `collectForWeek()` → `record_weekly_payment` RPC | ✅ Available |
| Manually record online payments / set status | `online_payments` table + `update_online_payment_status` RPC | ✅ Available (data layer) |
| Mark a payment as reversed in the DB (`reversed`, `reversed_reason`, `reversed_at`) | `payment_history` table, `transactions` view | ✅ Schema only |
| **Edit a weekly due date or adjust a due amount after generation** | — | ❌ **Not available** — no RPC or UI exists |
| **Reverse a posted payment from the UI** | — | ❌ **Not available** — reversal columns exist but no screen calls them |

So "manual entry or correction" is only partly supported today: absences and
new collections can be entered manually, but **correcting an existing due date
or amount cannot yet be done through the app**. If that is required, it needs a
separate, explicitly scoped change (new RPC with audit log + UI). Nothing was
built here because the exact correction behaviour was not specified.

### Kept for reference only

If needs change later, these were the plausible low-risk candidates — recheck
terms, rate limits and CORS before use, since catalogue entries go stale:
- `https://calendar-api-web.vercel.app/docs` (India Public Holidays)
- `https://caldays.com/api`
- `https://dummyjson.com/`, `https://fakerapi.it/en` (dev fixtures only)

---

## 4. Global resource saved for future projects

A reusable skill has been installed at:

```
C:\Users\HP\.claude\skills\public-apis-finder\
├── SKILL.md
└── references\
    ├── categories.md
    └── selection-checklist.md
```

It is available in **OpenCode and Claude Code, in every project**, and triggers
on requests such as "is there an API for X?", "find a free API for holidays",
or any mention of `public-apis` / `publicapis.lol`. It contains the lookup
sources, a 5-step discovery workflow, a privacy/approval safety gate, a
category index and a due-diligence checklist.

---

## 5. Closed vs. still open

**Closed:** holiday handling — manual only, no API, no holiday table.

**Still open (needs a separate decision, nothing built):**
1. Do you want a **manual correction screen** to edit a generated due date or
   adjust a due amount, with an audit-log entry? If yes, define who may do it
   and which fields are editable.
2. Do you want a **payment reversal action in the UI** (the schema already
   supports reversal flags)?
3. Do you want a **dev-only demo-data script** using local generation or a
   keyless fixture API?

Until any of these are approved: no API keys, no new dependencies, no code
changes from this discovery task.
