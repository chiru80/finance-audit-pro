---
name: angular-development
description: Angular architecture and development patterns for the Finance Audit Pro application. Use when creating or refactoring Angular components, services, modules, routing, forms, or state management in this project. Triggers on Angular CLI usage, component design, dependency injection, RxJS patterns, and Angular-specific performance concerns.
---

# Angular Development

## Architecture Conventions

- **Standalone components preferred.** Use Angular 17+ standalone components instead of NgModules where possible. Each feature gets its own directory with its components, services, and types colocated.
- **Feature-first structure.** Group code by domain, not by file type:
  ```
  src/app/
    customers/
      customer-list.component.ts
      customer-form.component.ts
      customer.service.ts
      customer.types.ts
    collections/
    ledger/
    auth/
    shared/
  ```
- **Smart / dumb component split.** Container components hold state and business logic; presentational components receive inputs and emit outputs only.
- **Services for all external interaction.** HTTP calls, Supabase client access, and storage access go through injectable services, never directly from components.

## Component Guidelines

- Use `OnPush` change detection for presentational components.
- Prefer `@Input()` and `@Output()` with typed interfaces; avoid `any`.
- Use `async` pipe in templates for Observables; never subscribe inline unless unsubscribing is handled.
- Keep templates shallow — extract complex UI into child components.
- Use Angular `signals` (Angular 16+) for local component state where appropriate, but keep server state in a dedicated state service or query cache.

## Form Handling

- Use `FormGroup` / `FormBuilder` for complex forms (customer creation, collection entry).
- Validate at the form level AND at the database level. UI validation is a convenience; database constraints are the source of truth.
- Display error messages clearly. Never silently swallow form errors.
- For money inputs, bind to integer paise values internally; format for display only.

## Routing

- Lazy-load feature routes with `loadChildren` or `loadComponent`.
- Guard routes with `CanActivate` for auth and ownership checks.
- Use route resolvers sparingly — prefer explicit service calls in component init for simplicity.

## RxJS and State

- Use `switchMap` for cancellable HTTP requests (e.g., search as user types).
- Use `BehaviorSubject` for shared state that multiple components read; prefer `signal`-based state for local component state.
- Always handle completion/unsubscription. Use `takeUntil` pattern or `async` pipe.

## Dependency Injection

- Provide services at the component level only when they must be isolated per instance.
- Use `providedIn: 'root'` for singleton services by default.
- Inject `SupabaseClient` via a custom token, not the raw client directly.

## Code Quality

- Run `ng build` before committing.
- Use strict TypeScript settings (`strict: true`, `noImplicitAny`, `strictNullChecks`).
- Prefer `interface` for props/emit types; use `type` only for unions/intersections.

## Checklist

- [ ] Component uses `standalone: true` or is part of a feature module
- [ ] No `any` types in component code (use `unknown` or specific interfaces)
- [ ] HTTP calls go through a service
- [ ] Async pipe used in template for Observables
- [ ] Form validation has user feedback
- [ ] Route changes are lazy-loaded where appropriate
- [ ] `ng build` succeeds without errors