# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

A single owner/admin runs a small weekly-payment business and is the primary user. In day-to-day use, they add and manage customers, record weekly collections and absences, reconcile online payments, and review outstanding balances and reports on both desktop and mobile. Customers are records in the system, not separate app users.

The owner is also a beginner developer who reviews work in small, understandable phases.

## Product Purpose

Finance Audit Pro gives one owner a precise, auditable record of weekly customer dues and collections. It makes it possible to track each customer's weekly schedule, record payments and approved absences, carry unpaid amounts forward, allocate payments in a defined order, and see accurate balances and reports without losing history.

Success means the owner can answer "who owes what, for which weeks, and why" with confidence, in English or Telugu, on a phone or desktop.

## Positioning

An audit-safe weekly collection ledger, not a general accounting suite. Its distinct mechanism is the combination of per-customer weekly dues, absence carry-forward under the approved Option A rule, partial payments, FIFO allocation across outstanding weeks, integer-paise money, and a preserved audit trail.

## Operating Context

Work happens in weekly cycles: generate weekly schedules, record collections or approved absences, allocate payments, and review dashboard, ledger, and report views. The owner configures weekly due amounts, due day, partial-payment behavior, and allocation strategy in settings.

Development context from `PRODUCT_BRIEF.md`: explain decisions in simple language, work in small reviewable phases, and wait for explicit approval at phase gates. These working constraints were documented in the brief but were not re-asked during this `init` interview.

## Capabilities and Constraints

Confirmed in this interview:

- Money rules: approved absences carry weekly dues forward; partial payments are allowed; payments are allocated FIFO; money is stored as integer paise; posted financial entries are not silently edited or deleted.
- Bilingual and responsive operation: English/Telugu switching, light/dark themes, and mobile-first accessible controls must keep working together.

Documented in repository sources (`PRODUCT_BRIEF.md`, `PROJECT_STATUS.md`, routes and migrations) but not re-confirmed in this interview:

- Angular 22 + TypeScript + Tailwind CSS frontend; Supabase Auth, PostgreSQL, and Row Level Security backend.
- Single-owner model: public self-registration removed; service-role keys never shipped in browser code.
- Customer management, weekly schedules, cash collections, absence approval with debt retention, online payment records/reconciliation (no automatic gateway verification), ledger, audit log, reports with CSV export, settings, auth guards.
- Production domain `weeklyfinance.online`; staging first; no deploy, DNS change, or destructive change without explicit approval.
- No Firebase Firestore and no floating-point money arithmetic.

Open decision: the formal accessibility conformance target (for example WCAG 2.2 AA) has not been established.

## Brand Commitments

Product name: **Finance Audit Pro**. No other brand commitment was made binding during init.

## Evidence on Hand

- `PRODUCT_BRIEF.md` — original product objective, confirmed technology direction, core capabilities, financial correctness rules, security rules, and deployment boundaries.
- `PROJECT_STATUS.md` — implementation status through milestones 1–9, including Option A absence workflow, FIFO RPC, bilingual coverage, and build/test status.
- `src/app/app.routes.ts` — implemented route surface: dashboard, customers, collections, ledger, reports, online payments, audit log, settings, login/callback.
- `supabase/` migrations and `supabase/SECURITY_HARDENING_NOTES.md` — schema, RLS, and financial function evidence.
- `design-system/finance-audit-pro/` — existing page and design documentation; treated as incumbent visual authority elsewhere, not copied into product truth.
- No real customer data, testimonials, case studies, or licensing claims were found; future work must not fabricate them.
- `CLAUDE.md` describes a different React/Node/Express/Prisma/AWS compliance-audit product and conflicts with the brief and shipped code. It was not treated as authoritative.

## Product Principles

1. **Precision over convenience.** Money stays in integer paise and every balance must be traceable to preserved entries.
2. **History is preserved.** Corrections happen through controlled entries with an audit trail, never silent edits or deletes.
3. **The weekly cycle is the core model.** Schedules, approved absences, carry-forward, and FIFO allocation define the product's daily rhythm.
4. **One owner, two languages, any screen.** English and Telugu parity and mobile usability are part of correctness, not decoration.

## Accessibility & Inclusion

Accessible forms, tables, and controls plus consistent English/Telugu layouts are known requirements. No specific formal standard was confirmed.
