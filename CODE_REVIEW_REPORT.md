# Code Review Report - Finance Audit Pro

**Date:** 2026-11-11  
**Review Type:** Comprehensive Code Review  
**Effort Level:** Medium  
**Reviewer:** Claude Code Security Review Agent

---

## Executive Summary

After completing a comprehensive review of the Finance Audit Pro codebase, I found **5 critical findings** and **7 medium-severity observations**. The project has solid architectural foundations but contains several critical bugs and security concerns that need immediate attention.

---

## Critical Findings

### 1. Database Table `transactions` Does Not Exist (CRITICAL)

**Location:** `src/app/dashboard/dashboard.service.ts:64-82`

**Description:** The dashboard service attempts to query a `transactions` table that doesn't exist in the database schema. The initial migration `202611110001_initial_schema.sql` creates 12 tables: `profiles`, `customers`, `weekly_schedules`, `absences`, `payments`, `payment_allocations`, `online_payments`, `settings`, `audit_logs`, `weekly_rate_history`, `payment_history`, but **no `transactions` table**.

**Evidence:**
- Lines 64-66: `this.client.from('customers')` - queries customers table (exists)
- Lines 66-82: `this.client.from('transactions')` - queries transactions table (DOES NOT EXIST)

**Impact:** The `getStats()` function will fail when trying to fetch actual data, falling back to mock data. The `getRecentTransactions()` function has the same issue. This means real financial data won't display in the dashboard.

**Recommendation:** 
1. Create a `transactions` table or rename `payment_history`/`payments` to `transactions`
2. Or update the dashboard service to query `payment_history` instead of `transactions`

---

### 2. Incorrect RPC Usage in Customer Service (CRITICAL)

**Location:** `src/app/collection.service.ts:47-51`

**Description:** The `getCustomerPaymentSummary()` function incorrectly calls a database function `get_customer_payment_summary` using `.from()` instead of `.rpc()`. This is a fundamental misuse of Supabase JS API.

**Evidence (Line 47-51):**
```typescript
const { data, error } = await this._authService.getClient()
  .from('get_customer_payment_summary')  // WRONG - should be .rpc()
  .select('*')
  .eq('customer_id', customerId)
  .single();
```

**Correct usage should be:**
```typescript
const { data, error } = await this._supabaseService.client.rpc('get_customer_payment_summary', {
  p_customer_id: customerId
});
```

**Impact:** This function will never work correctly. The RPC is defined in `202611110002_hardened_rls_functions.sql` but cannot be called properly.

---

### 3. Missing Profile Creation on Login (HIGH)

**Location:** `src/app/auth/auth.service.ts`

**Description:** The application only creates a profile during signup (`createProfileAfterSignup`), but there's no mechanism to handle profile creation when users sign up via OAuth/external providers or if the profile is accidentally deleted. The application will fail silently without a profile.

**Impact:** Users signing up through OAuth or social providers won't have profiles created, causing RLS failures and data access issues.

**Recommendation:** Add profile auto-creation in `initializeAuth()` when a new user is detected without a profile.

---

### 4. Customer Service Creates Duplicate Profiles (HIGH)

**Location:** `src/app/customers/customer.service.ts:39-72`

**Description:** The `createCustomer()` function creates a new profile in the `profiles` table before creating the customer. This is a design flaw - profiles should be created during authentication/signup, not customer creation. This could lead to:

1. Duplicate profiles if the same customer registers separately
2. Data inconsistency where customer and profile don't match
3. Security issues with profile ownership

**Evidence (Lines 42-51):**
```typescript
const { data: profile, error: profileError } = await this._supabaseService.client
  .from('profiles')
  .insert({
    email: values.email,  // Creating profile here is wrong
    full_name: values.name,
  })...
```

**Impact:** Customers will be created without proper profile ownership, breaking RLS policies and potentially causing data leaks.

---

### 5. Dashboard Service Uses Mock Data with Undefined Sources (MEDIUM)

**Location:** `src/app/dashboard/dashboard.service.ts:61-60`

**Description:** The dashboard service returns mock data for `totalOutstanding` and `pendingPayments` because there's no `transactions` table. Additionally, the `supabaseUrl` and `supabaseAnonKey` are hardcoded placeholder values instead of using environment variables properly.

**Evidence (Lines 29-30):**
```typescript
private supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
private supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';
```

**Impact:** Dashboard will always show fake/mock data, making it impossible to get accurate financial metrics.

---

## Medium Severity Observations

### 6. Missing RLS Policy for `payment_history` SELECT

**Location:** `supabase/migrations/202611110001_initial_schema.sql:719-738`

**Description:** The RLS policy for `payment_history` checks `customer_id` but the table schema doesn't have a direct `customer_id` column that's always populated. The policy should verify the user owns the customer via the payment's customer relationship.

**Current (Lines 720-726):**
```sql
CREATE POLICY "Owner can view payment history" ON payment_history
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM customers c
        WHERE c.id = customer_id AND c.profile_id = auth.uid()
    )
);
```

**Issue:** This policy assumes `payment_history.customer_id` is always populated, which it should be based on the schema, but this isn't immediately obvious.

---

### 7. Incomplete Error Handling in Collection Service

**Location:** `src/app/collection.service.ts`

**Description:** The `getCustomerPaymentSummary()` and `getPaymentHistory()` functions catch errors but return `null` or `[]` without proper error propagation. This can hide database issues from users.

**Impact:** Users won't see meaningful error messages when things go wrong.

---

### 8. Hardcoded Default Values Without Configuration

**Location:** Multiple files

**Description:** Default weekly due amounts (50000 paise = ₹500) are hardcoded in multiple places:
- `auth.service.ts:92`
- `customer-form.component.ts:28`
- `settings.component.ts:26`

**Recommendation:** Centralize these defaults in the settings table or environment config.

---

### 9. Missing Input Validation for Payment Amount

**Location:** `src/app/collections/collection-entry.component.ts:65-69`

**Description:** While there's a check for `amount() <= 0`, there's no validation for:
- Maximum amount limits
- Negative amounts (handled by Number conversion, but should be explicit)
- Decimal amounts (paisa values should be integers)

---

### 10. Race Condition Potential in Payment Allocation

**Location:** `supabase/migrations/202611110002_hardened_rls_functions.sql:33-42`

**Description:** The `allocate_payment_to_schedules` function checks `amount >= p_amount` but the original migration used `amount = p_amount`. This change from exact match to `>=` could allow race conditions where multiple operations reference the same payment.

**Recommendation:** Use database transactions or advisory locks for payment allocation operations.

---

### 11. Dashboard Component Has Unimplemented Route

**Location:** `src/app/dashboard/dashboard.component.ts:98`

**Description:** The component navigates to `/transactions/:id` for transaction details, but no routes exist for this path.

**Impact:** Clicking transaction links will result in 404 errors.

---

### 12. Inconsistent Currency Handling

**Location:** Various files

**Description:** While the codebase correctly uses paise (integer) for storage, some functions:
- Accept `number` type without specifying integer
- Don't validate that amounts are integers
- Mix formatting and storage logic

---

## Security Observations

### 13. Settings Table Access Policy

**Location:** `supabase/migrations/202611110001_initial_schema.sql:673-684`

**Description:** Settings policies use `auth.role() = 'authenticated'` which allows any authenticated user access. Note: This is documented in the schema comments as intentional for single-owner model, but worth noting.

---

## Recommendations Summary

### Immediate Actions Required:

1. **Create the `transactions` table** or update all queries to use existing tables
2. **Fix the RPC call** in `collection.service.ts` to use `.rpc()` instead of `.from()`
3. **Fix customer creation flow** - profiles should be created during signup, not customer creation
4. **Add authentication flow profile creation** for OAuth/external signups

### Short-term Improvements:

5. Centralize default values (weekly due amount) in settings
6. Improve error handling to show meaningful messages
7. Add comprehensive input validation for payment amounts
8. Create routes for transaction details

### Long-term Considerations:

9. Implement proper transaction handling for payment allocations
10. Add audit logging for all customer/profile modifications
11. Consider adding a dedicated `transactions` view for dashboard queries
12. Add comprehensive unit tests for all service functions

---

## Test Coverage Review

**Location:** `vitest.config.ts`

The project has vitest configured with a 50% coverage threshold. Tests exist for:
- Auth guards (`auth.guard.spec.ts`)
- Various utility functions

**Recommendation:** Add tests for:
- `collection.service.ts` functions
- `customer.service.ts` CRUD operations
- `dashboard.service.ts` (once transactions issue is resolved)

---

## Architecture Assessment

**Strengths:**
- Good separation of concerns with Angular services
- Proper use of signals for reactive state
- Database-level business logic (FIFO payment allocation)
- Comprehensive RLS security policies
- Audit logging infrastructure in place

**Areas for Improvement:**
- Dashboard service should use the same Supabase client injection pattern
- Customer creation flow needs architectural reconsideration
- Error handling patterns are inconsistent across services

---

## Conclusion

The Finance Audit Pro codebase has a solid foundation with well-designed database schema and RLS security policies. However, there are critical bugs preventing the application from functioning correctly:

1. The `transactions` table doesn't exist but is queried constantly
2. Customer creation incorrectly creates profiles instead of using auth flow
3. RPC function calls are incorrectly implemented

**Priority:** Fix the critical findings before any production deployment.