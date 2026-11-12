# Architecture Review — Finance Audit Pro

**Reviewer:** Agent 1 (Architecture & Codebase Analyst)  
**Date:** 2026-11-12  
**Target:** Angular 22 + Tailwind CSS 4 + Supabase / PostgreSQL  

---

## 1. Compliance with `PRODUCT_BRIEF.md`

| Requirement in Brief | Current Status | Assessment |
|----------------------|----------------|------------|
| **Frontend: Angular (latest stable) + TypeScript** | Angular 22.2.0, TypeScript 6.0 | ✅ Aligned. Clean standalone components and signals. |
| **Styling: Tailwind CSS** | Tailwind CSS 4.1.12 with PostCSS | ⚠️ Syntax mismatch: `@tailwind` v3 directives used with Tailwind v4 engine causing build break. |
| **Backend: Supabase + PostgreSQL** | 3 Supabase migrations created | ✅ Aligned. 11 tables, triggers, RPCs, views. |
| **No Firebase Firestore** | Pure Supabase, no Firestore SDK | ✅ Compliant. |
| **Currency stored as BIGINT paise** | All financial columns use `BIGINT` (paise) | ✅ Compliant. Stored in paise; converted with integer math. |
| **No secrets in frontend** | `src/environments/` has placeholder keys | ✅ Compliant. Service-role key absent. |
| **Language: English & Telugu** | `I18nService` + dictionary keys | ✅ Core structure aligned. Needs Telugu translations for newer views. |
| **Single-owner model with RLS** | RLS enabled on all tables via `auth.uid() = profile_id` | ✅ Compliant. |
| **Domain & Staging** | `weeklyfinance.online` planned | ✅ No unauthorized DNS/production deployment touched. |

---

## 2. Angular Architecture & Folder Structure Review

```
src/
├── app/
│   ├── app.config.ts          # Application providers
│   ├── app.routes.ts          # Route definitions & guards
│   ├── app.ts                 # Root shell component
│   ├── supabase.service.ts    # Supabase client singleton
│   ├── auth/                  # Login, signup, guards, auth service
│   ├── customers/             # Customer list, detail, form, types, service
│   ├── collections/           # Daily collection entry, weekly tracker
│   ├── dashboard/             # Financial KPI cards, stats service
│   ├── ledger/                # Customer transaction ledger
│   ├── reports/               # Financial reporting (stub)
│   ├── settings/              # Owner preferences & dues configuration (stub)
│   ├── shared/                # App shell, header, sidebar, theme, i18n, design-tokens
│   └── utils/                 # Currency, allocation, form-validation, language math
├── environments/              # Environment configurations
└── styles.css                 # Global CSS variables & Tailwind imports
```

### Strengths:
- Clear separation between feature domains (`customers`, `collections`, `ledger`, `auth`).
- Consistent use of Angular standalone components and signals (`signal`, `computed`).
- Math logic decoupled into pure functions under `src/app/utils/` with unit tests.

### Technical Debt & Regressions to Address:
1. **Component Template vs Controller Mismatch**:
   - `CustomerFormComponent` controller was left with standalone signals while the template was rewritten to reactive `formGroup`.
2. **Angular Template Element Naming**:
   - `AppHeaderComponent` references `<LanguageSwitcherComponent />` rather than the registered selector `<app-language-switcher>`.
3. **Tailwind v4 Integration**:
   - Tailwind 4 uses `@import "tailwindcss";` instead of `@tailwind base; @tailwind components; @tailwind utilities;`. Standalone component styles using `@apply` need `@reference` or global definition.
4. **Guard Redirection**:
   - `canAuthenticate` in `app.routes.ts` returns `Promise<boolean>` without redirecting to `/login` if false.
5. **Vitest / Vite Dependency**:
   - `vitest` requires `vite` in devDependencies to boot in ES module mode.

---

## 3. Recommended Safe Improvements (Priority Order)

1. **Step 1 (Milestone 1)**: Correct the 3 build regressions (Tailwind 4 syntax, `customer-form` ReactiveForm sync, `app-header` selector) and install `vite` so `ng build` and `npm test` execute cleanly.
2. **Step 2 (Milestone 1)**: Add `.env` to `.gitignore`.
3. **Step 3 (Milestone 2 & 3)**: Verify Supabase schema against local/staging instance and harden route guards to redirect unauthenticated users to `/login`.
4. **Step 4 (Milestone 4 & 5)**: Wire collection entry and customer management to the real Supabase backend with end-to-end integration tests.

