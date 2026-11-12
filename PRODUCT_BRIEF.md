# Finance Aduit Pro --- Product Brief

## Project objective

Build a completely new, professional Finance Book Management application
from scratch. This is a fresh application: do not migrate data from the
existing Firebase application and do not connect to any old production
database.

The owner is a beginner developer working with Claude Code. Explain
technical decisions in simple language and proceed in small, reviewable
phases. Do not make destructive changes or deploy without explicit
approval.

## Confirmed technology direction

-   Frontend: Angular (latest stable version compatible with the
    installed Node.js version)
-   Language: TypeScript
-   Styling: Tailwind CSS
-   Backend and database: Supabase + PostgreSQL
-   Authentication: Supabase Auth
-   Initial user model: one owner/admin
-   Languages: English and Telugu
-   Initial platform: responsive web application
-   Future platform: Android-compatible architecture, potentially
    through a PWA or a later mobile client
-   Production domain: `weeklyfinance.online`
-   Hosting: evaluate Firebase Hosting and Vercel; recommend one based
    on Angular support, routing, deployment simplicity, and cost.

Do not use Firebase Firestore as the database. Do not expose Supabase
service-role keys in browser code. The browser may use the
publishable/anon key only with correctly designed Row Level Security
(RLS).

## Core application capabilities

1.  Customer management: create, edit, view, search, filter, and manage
    customer status.
2.  Weekly payment tracking.
3.  Daily collection entry and collection summaries.
4.  Automatic weekly totals.
5.  Customer absence management.
6.  Carry forward unpaid amounts according to the approved absence and
    payment rules.
7.  Online payment tracking and reconciliation.
8.  Outstanding balance management.
9.  Collection mode and collection workflow.
10. Customer-wise payment history and ledger.
11. Dashboard with financial summaries and key indicators.
12. Search, filters, date ranges, and reports.
13. English/Telugu language switching.
14. Dark mode and light mode.
15. Responsive, mobile-first interface with accessible controls.

## Financial correctness and auditability

-   Store currency as integer paise using PostgreSQL `BIGINT`; do not
    use floating-point arithmetic for money.
-   Define a clear ledger model and preserve transaction history.
-   Prevent duplicate payment submissions using database constraints and
    idempotency where appropriate.
-   Use PostgreSQL transactions and/or database functions for critical
    multi-step financial operations.
-   Maintain an audit trail for important changes.
-   Define and test rules for payment allocation, outstanding balances,
    reversals, and carry-forward.
-   Do not silently edit or delete posted financial transactions. Prefer
    controlled reversal/correction entries with an audit trail.
-   Use database constraints, foreign keys, indexes, and RLS policies.
-   Keep all secrets out of source control and frontend bundles.

## Candidate data model

Evaluate and refine the following normalized PostgreSQL entities. Do not
create tables blindly; explain relationships and justify the final
design.

-   Owner/profile
-   Customers
-   Payment schedules or weekly dues
-   Collections/payments
-   Ledger entries
-   Absence records
-   Online payment records/reconciliation
-   Application settings
-   Audit logs

The architecture proposal should include an ER diagram or clear
relationship description, key columns, data types, constraints, indexes,
and ownership/security strategy.

## UX and visual direction

Create a premium, modern financial SaaS experience.

Priorities: - Clear information hierarchy and readable typography. -
Fast, uncluttered dashboard. - Useful financial summary cards. -
Straightforward customer and collection workflows. - Excellent mobile
usability. - Accessible forms, tables, and controls. - Consistent
English and Telugu layouts. - Dark and light themes. - Subtle,
purposeful interaction; avoid unnecessary animation.

## Weekly payment and absence workflow

The application must support weekly payment tracking and customer
absences. The unpaid amount should carry forward, but the exact business
rules must be confirmed before implementation.

Do not assume: - Whether an absent customer is charged for that week. -
Whether absence requires owner approval or a reason. - Whether partial
payments are allowed. - How payments are allocated when multiple weeks
are outstanding. - Whether a customer can have a pause/suspension
period. - How weekly periods and due dates are defined.

Ask the owner targeted questions and document the approved rules before
coding.

## Online payments

Plan for recording online payments and reconciling them with customer
balances. Do not integrate a payment gateway or claim automatic
bank/payment verification unless separately approved and configured.
Clarify which payment methods and references need to be stored.

## Security

-   Supabase Auth for owner authentication.
-   Enable RLS on every user-owned table.
-   Ensure the initial single-owner design does not accidentally permit
    public reads or writes.
-   Keep the service-role key server-side only; never place it in
    Angular environment files shipped to browsers.
-   Validate critical financial operations in PostgreSQL, not only in
    the UI.
-   Include secure environment-variable handling and a `.gitignore`.
-   Provide a security review and tests for authorization boundaries.

## Domain and deployment

The existing production domain is `weeklyfinance.online`.

-   Do not change DNS or deploy during the architecture phase.
-   Do not disturb existing DNS records, email records, or a live
    website.
-   Plan a staging deployment first.
-   Document exact DNS changes only after the hosting choice is
    approved.
-   Include HTTPS, Angular route fallback, environment separation,
    deployment verification, and rollback steps.

## Required development phases

### Phase 0 --- Architecture and discovery only

Inspect the environment and project directory. Produce: - Architecture
proposal. - PostgreSQL schema and relationship design. - Ledger and
financial workflow. - Weekly schedule and absence/carry-forward rules. -
Authentication, RLS, and security plan. - English/Telugu localization
plan. - Testing strategy. - Hosting recommendation. - Phased roadmap. -
List of unresolved business questions.

Do not write application code, install packages, create Supabase
resources, deploy, or change DNS in Phase 0.

### Phase 1 --- Approved foundation

Only after explicit owner approval: initialize the Angular application,
configure Tailwind, linting, formatting, tests, environment templates,
and project structure.

### Later phases

Implement database migrations and security, authentication, customer
management, weekly dues, collections and ledger, online payment records,
reports, localization, testing, staging, and production deployment in
small approved milestones.

## Claude Code working instructions

Act as the senior software architect and technical lead. The owner is a
beginner: - Explain each step in simple language. - Work in small phases
and wait for approval at phase gates. - Before changing files, explain
what will change. - Never delete or overwrite existing files without
asking. - Do not invent business rules. - Do not use Firebase
Firestore. - Do not expose secrets. - Do not deploy or change DNS
without explicit approval. - Report commands run, files changed, tests
performed, and any remaining risks.

## First task

Read this entire `PRODUCT_BRIEF.md`. Inspect the current project folder
and installed tools. Perform Phase 0 only. Identify contradictions or
missing requirements, propose the architecture, and ask the owner the
essential business-rule questions. Then stop and wait for approval.
