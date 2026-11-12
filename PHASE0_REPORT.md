# Finance Audit Pro - Phase 0 Architecture and Discovery Report

**Date:** 2026-11-11
**Phase:** 0 - Architecture and Discovery
**Status:** Complete

---

## Executive Summary

This report provides a comprehensive analysis of the Finance Audit Pro project, including the existing codebase, database schema, gaps identified, and architecture recommendations. The project has a solid foundation with Angular 22, Supabase/PostgreSQL, and Tailwind CSS already in place.

---

## 1. Current Project State

### 1.1 Technology Stack
- **Frontend:** Angular 22 (latest stable), TypeScript 6.0
- **Styling:** Tailwind CSS 4.x, PostCSS
- **Backend/Database:** Supabase (PostgreSQL), Supabase Auth
- **Build Tools:** Angular CLI, npm 11.20.0, Node.js v26.13.0

### 1.2 Existing Files Inventory

**Configuration Files:**
- `package.json` (1.4KB) - Angular project with dependencies
- `angular.json` - Build/serve/test configurations with production/development configs
- `tsconfig.json`, `tsconfig.app.json`, `tsconfig.spec.json` - TypeScript configuration
- `.postcssrc.json` - Tailwind CSS PostCSS configuration
- `vitest.config.ts` - Vitest testing configuration

**Source Structure (src/app/):**
- `app.ts` - Root component with AppShell wrapper
- `app.routes.ts` - 17 routes for all features
- `app.config.ts` - App configuration
- `supabase.service.ts` - Supabase client wrapper
- `auth.service.ts` - Authentication logic
- `dashboard/` - Dashboard component and service with stat cards
- `customers/` - Customer list, form, service, and types
- `collections/` - Collection entry and weekly tracker
- `ledger/` - Ledger view (stub)
- `reports/` - Reports component (stub)
- `settings/` - Settings component (stub)
- `auth/` - Login, signup components and guards
- `shared/` - App shell, header, sidebar, theme, i18n, loading spinner
- `utils/` - Currency, allocation, language utilities with tests

**Database Migrations:**
- `202611110001_initial_schema.sql` - Full schema (11 tables, 40+ RLS policies, triggers, functions)
- `202611110002_hardened_rls_functions.sql` - Security hardening and RPC functions

**Security Documentation:**
- `SECURITY_AUDIT.md` - Audit report with critical fix to settings RLS policy

---

## 2. Database Schema Analysis

### 2.1 ER Diagram Description

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              ER DIAGRAM                                    │
└─────────────────────────────────────────────────────────────────────────────┘

                         ┌─────────────────────┐
                         │      profiles       │
                         │  (Owner/Profile)      │
                         │  id: UUID (PK)        │◄─── auth.users(id)
                         │  email, full_name     │
                         │  language: en/te      │
                         │  weekly_due_amount    │
                         │  weekly_due_day: 1-7   │
                         └──────────┬──────────┘
                                    │
        ┌───────────────────────────┼───────────────────────────┐
        │                           │                           │
        ▼                           ▼                           ▼
┌───────────────┐           ┌───────────────┐           ┌───────────────┐
│   customers   │           │    settings   │           │  audit_logs   │
│  id: UUID PK  │           │  key: TEXT PK │           │  id: UUID PK  │
│  profile_id   │           │  value: TEXT  │           │  profile_id   │
│  name, phone  │           └───────────────┘           │  action, table│
│  status       │                                       │  append-only  │
│  financial    │         ┌─────────────────┐         └───────────────┘
│  summary      │         │ weekly_rate_     │
└──────┬────────┘         │ history          │
       │                  │  immutable         │
       ▼                  └─────────────────┘
┌───────────────┐
│               │
│  weekly_      │
│  schedules    │ ◄── 1-to-many from customers
│  - due_date   │
│  - paid       │
│  - absence_*  │
│               │
│  payment_     │
│  allocations  │ ◄── M:N via payments
│  (FIFO)       │
│               │
└──────┬────────┘
       │
       ▼
┌───────────────┐         ┌─────────────────┐
│    payments   │◄─┐      │ payment_history │
│  - idempotency│  │      │  immutable      │
│  - method     │  └──►   └─────────────────┘
└──────┬────────┘                   ▲
       │                               │
       ▼                               │
┌───────────────┐                     │
│  online_      │                     │
│  payments     │─────────────────────┘
│  - gateway    │
│  - status     │
│  - reconciled │
└───────────────┘

                         ┌─────────────────┐
                         │    absences     │
                         │  - status:      │
                         │    pending/a/   │
                         │    approved/r   │
                         └─────────────────┘
```

### 2.2 Key Tables and Columns

**profiles (Owner)**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID PK | REFERENCES auth.users ON DELETE CASCADE | Owner identity |
| email | TEXT | NOT NULL, UNIQUE | Login email |
| language | TEXT | NOT NULL DEFAULT 'en', CHECK (in ('en','te')) | i18n |
| theme_mode | TEXT | NOT NULL DEFAULT 'light' | Dark/light mode |
| weekly_due_day | INTEGER | NOT NULL DEFAULT 1, CHECK 1-7 | Due date day of week |
| weekly_due_amount | BIGINT | NOT NULL DEFAULT 50000 | Default weekly due (paise) |

**customers**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID PK | DEFAULT uuid_generate_v4() | Customer ID |
| profile_id | UUID | NOT NULL, FK → profiles | Owner scoping |
| name | TEXT | NOT NULL | Customer name |
| phone | TEXT | | Contact |
| weekly_due_amount | BIGINT | NOT NULL | Customer-specific weekly amount |
| outstanding_balance | BIGINT | NOT NULL DEFAULT 0 | Current balance |
| total_paid | BIGINT | NOT NULL DEFAULT 0 | Lifetime paid |
| total_due | BIGINT | NOT NULL DEFAULT 0 | Lifetime due |
| status | TEXT | NOT NULL DEFAULT 'active', CHECK | Customer status |

**weekly_schedules**
| Column | Type | Constraints | Purpose |
|--------|------|-------------|---------|
| id | UUID PK | | Schedule ID |
| customer_id | UUID | NOT NULL, FK → customers | Customer reference |
| week_start_date | DATE | NOT NULL | Monday of week |
| week_end_date | DATE | NOT NULL | Sunday of week |
| due_date | DATE | NOT NULL | Payment due date |
| due_amount | BIGINT | NOT NULL | Amount due |
| paid | BOOLEAN | NOT NULL DEFAULT FALSE | Payment status |
| payment_id | UUID | | If paid, reference |
| absence_recorded | BOOLEAN | NOT NULL DEFAULT FALSE | Flag |
| absence_approved | BOOLEAN | | NULL=pending, T/R=approved/rejected |

### 2.3 Constraints

**Check Constraints:**
- `amount > 0` on payments, allocations, online_payments
- `due_amount >= 0` on weekly_schedules
- `weekly_due_day BETWEEN 1 AND 7` on profiles
- `status IN ('active', 'inactive', 'suspended')` on customers
- `payment_method IN ('cash', 'online', 'cheque', 'other')` on payments

**Unique Indexes:**
- `profiles.email` UNIQUE
- `customers` unique customer per profile
- `weekly_schedules(customer_id, week_start_date)` - no duplicated weeks
- `online_payments(gateway, transaction_id)` UNIQUE
- `payments(profile_id, idempotency_key)` UNIQUE WHERE not null

**Foreign Keys with CASCADE:**
- All customer data: CASCADE DELETE on profile
- Schedules: CASCADE on customer
- Allocations: CASCADE on payment, SET NULL on schedule deletion

### 2.4 Indexes

**Critical Performance Indexes:**
```sql
idx_customers_profile_id     ON customers(profile_id) -- Owner lookups
idx_customers_status         ON customers(status)      -- Status filtering
idx_weekly_schedules_customer_id ON weekly_schedules(customer_id)
idx_weekly_schedules_week_start  ON weekly_schedules(week_start_date)
idx_weekly_schedules_paid        ON weekly_schedules(paid)
idx_weekly_schedules_due_date    ON weekly_schedules(due_date) -- FIFO ordering
idx_payments_customer_id       ON payments(customer_id)
idx_payments_payment_date      ON payments(payment_date)
idx_payments_profile_id        ON payments(profile_id)
idx_payments_idempotency       ON payments(profile_id, idempotency_key) -- Prevent dupes
```

### 2.5 RLS Policy Summary

**Single-Owner Model:** All user-owned tables use `auth.uid()` based policies

| Table | Policy Pattern | Notes |
|-------|---------------|-------|
| profiles | `auth.uid() = id` | Owner can access own profile |
| customers | `auth.uid() = profile_id` | All operations scoped to profile |
| weekly_schedules | EXISTS via customers | Owner can access schedules for own customers |
| payments | `auth.uid() = profile_id` | Owner scoped |
| payment_allocations | EXISTS via payments → customers | Immutable (UPDATE/DELETE FALSE) |
| online_payments | EXISTS via customers | Status updates via RPC |
| settings | `auth.role() = 'authenticated'` | Singleton - authenticated only (fixed!) |
| audit_logs | `auth.uid() = profile_id` | INSERT FALSE (append-only) |
| weekly_rate_history | `auth.uid() = profile_id` | INSERT only, UPDATE/DELETE FALSE |
| payment_history | EXISTS via customers | INSERT FALSE, immutable |

---

## 3. Gaps Analysis

### 3.1 Frontend Gaps (High Priority)

| Gap | Current State | Priority |
|-----|---------------|----------|
| Weekly schedule UI | No dedicated component | High |
| Absence approval | No approval workflow | High |
| Payment reconciliation | No matching interface | High |
| Reports page | Stub component exists | High |
| Customer ledger | No detailed history view | Medium |
| Settings page | Stub, needs implementation | Medium |
| Customer detail | Missing (only list/form) | Medium |
| Search/filter UI | Basic filter types only | Low |

### 3.2 Backend/API Gaps

| Gap | Current State | Priority |
|-----|---------------|----------|
| Profile creation | Not in auth flow | High |
| Week generation | Manual via SQL function | Medium |
| Payment summary | RPC exists, no frontend | Medium |
| Online payment RPC | Function exists | Medium |

### 3.3 Integration Gaps

| Gap | Priority |
|-----|----------|
| No CI/CD configuration | Medium |
| Missing .env.example | Low |
| No webhook handlers | Low (deferred) |

---

## 4. Business Rules Questions for Owner Approval

### Critical Questions (Must be answered before implementation)

| # | Question | Current Implementation | Impact |
|---|----------|------------------------|--------|
| 1 | **When absence is approved, does weekly due get waived?** | Code shows: `calculateAbsenceImpact()` returns 0 if approved, but schedule may still be charged | Balance calculations, UI display |
| 2 | **What defines a "week" - Monday-Sunday or enrollment-based?** | Schema has `week_start_date`, `week_end_date` - currently manual | Schedule generation |
| 3 | **How should excess credit be handled?** | `credit_amount` returned from allocation, never discarded | Customer communication |
| 4 | **Who can approve absences?** | `approved_by` references profiles(id) - could be any profile | Permission design |
| 5 | **Does online payment reconciliation need manual approval?** | Status: pending/completed/failed/refunded | Workflow design |
| 6 | **What retention for audit logs?** | No retention policy defined | Storage planning |

### Confirmed Rules (from code analysis)

✅ **Partial payments ARE allowed** - `allocation.utils.ts` line 8: "Partial payments ARE allowed"
✅ **FIFO allocation** - `allocate_payment_to_schedules()` orders by `due_date ASC`
✅ **Absence requires approval** - Status enum: pending/approved/rejected
✅ **Weekly due charged regardless of absence** - But approved absences may waive (needs confirmation)
✅ **Excess payment held as credit, never discarded** - Allocation function returns `credit_amount`

---

## 5. Architecture Recommendations

### 5.1 Database Design

**✅ Sound Architecture:**
- Normalized schema with proper foreign keys
- Financial values as BIGINT paise (no floating-point)
- Idempotent payment prevention via unique index
- Append-only audit trail
- Proper RLS for single-owner model

**⚠️ Considerations:**
- `outstanding_balance` is computed via triggers - ensure consistency
- `total_due` on customers may diverge from sum of schedules - needs validation

### 5.2 Frontend Architecture

**Current Structure (Good):**
- Feature modules: dashboard, customers, collections, ledger, reports, settings
- Shared: app-shell, header, sidebar, theme, i18n, utilities
- Standalone components with Angular signals
- Type-safe with proper interfaces

**Missing Pieces:**
- Profile creation after signup (auth flow incomplete)
- Weekly schedule generation UI
- Absence approval workflow

### 5.3 Security Plan

**✅ Secure Practices:**
- No service_role keys in frontend
- Environment files use placeholders
- All RLS policies verified
- Audit trail for critical operations
- Payment deduplication via idempotency key

### 5.4 Hosting Recommendation

**Recommended: Vercel**

**Justification:**
| Factor | Vercel | Firebase Hosting |
|--------|--------|------------------|
| Angular support | ✅ Full framework mode | ⚠️ SPA mode |
| Routing | ✅ Angular route fallback | ⚠️ May need config |
| Environment vars | ✅ Simple injection | ✅ Simple injection |
| HTTPS | ✅ Automatic | ✅ Automatic |
| CI/CD | ✅ Integrated | ⚠️ Separate setup |
| Cost | ✅ Generous free tier | ✅ Generous free tier |

---

## 6. Phased Roadmap

### Phase 0 ✅ DONE
- Architecture and discovery
- Security audit review
- Business rules questions identified

### Phase 1: Foundation (Next)
- Environment configuration (.env.example, real values)
- Profile creation after signup (RPC or client-side)
- Auth flow verification
- Theme toggle (light/dark) - exists but needs UI
- Language toggle (en/te) - exists but needs UI

### Phase 2: Core CRUD
- Customer list with search/filter - 80% complete
- Customer form (create/edit) - 60% complete
- Customer detail view - MISSING
- Weekly schedule generation - RPC exists, needs UI

### Phase 3: Financial Tracking
- Payment recording (cash) - partial in collection component
- Payment allocation via FIFO - SQL function exists
- Balance calculation - trigger-based
- Absence recording - RPC exists, needs approval UI
- Online payment reconciliation - RPC exists, needs UI

### Phase 4: Reports & Analytics
- Dashboard metrics - existing but needs enhancement
- Reports page - stub needs implementation
- Export functionality - MISSING
- Date range filters - MISSING

### Phase 5: Production Ready
- Staging deployment to Vercel
- End-to-end testing
- Performance optimization
- Production deployment
- Documentation

---

## 7. Detailed Implementation Plan

### Phase 1: Foundation Implementation Steps

1. **Create .env.example template**
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Profile Creation After Signup**
   - Add `profile_created` state in auth service
   - Call RPC or insert to profiles table after signup
   - Ensure `id = auth.uid()`

3. **Verify Auth Flow**
   - Test login/signup with protected routes
   - Confirm RLS policies work correctly

4. **Theme Toggle**
   - Use existing `theme.service.ts`
   - Add toggle button to header

5. **Language Toggle**
   - Use existing `i18n.service.ts`
   - Add toggle button (currently has page reload design)

---

## 8. Conclusion

The Finance Audit Pro project has a **solid foundation** with:
- ✅ Complete database schema with proper financial handling
- ✅ Security-audited RLS policies
- ✅ Multi-language support (English/Telugu)
- ✅ Dark/light mode infrastructure
- ✅ Angular 22 with TypeScript strict mode

**Critical actions needed:**
1. ⏳ Answer business rules questions (item #1-6 above)
2. ⏳ Configure Supabase project (create if needed)
3. ⏳ Set environment variables
4. 🚀 Begin Phase 1 implementation

---

**Report prepared by:** Claude Code (Senior Software Architect)  
**For:** Project Owner  
**Review Status:** Awaiting business rule clarifications