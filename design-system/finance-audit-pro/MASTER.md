# Design System Master File — Finance Audit Pro

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Finance Audit Pro  
**Updated:** 2026-11-17  
**Category:** B2B Financial SaaS  
**Theme:** Dark (default) — Liquid Glass / Glisse-inspired

---

## Global Rules

### Color Palette (FinTech Dark Theme)

| Role | Hex | CSS Variable |
|------|-----|--------------|
| Primary (CTA) | `#2563EB` | `--primary-accent` / `--color-primary` |
| Primary Hover | `#3B82F6` | `--primary-hover` / `--color-primary-hover` |
| Primary Light (tint) | `rgba(37, 99, 235, 0.15)` | `--color-primary-light` |
| Primary Border | `rgba(37, 99, 235, 0.30)` | `--color-primary-border` |
| Background Primary | `#0B1120` | `--bg-primary` / `--color-bg-primary` |
| Background Secondary | `#111827` | `--bg-secondary` / `--color-bg-secondary` |
| Background Sidebar | `#0F172A` | `--bg-sidebar` / `--color-bg-sidebar` |
| Background Topbar | `#111827` | `--bg-topbar` / `--color-bg-topbar` |
| Background Card | `#151F32` | `--bg-card` / `--color-bg-card` / `--glass-surface-base` |
| Background Card Elevated | `#18243A` | `--bg-card-elevated` / `--color-bg-card-elevated` / `--glass-surface-elevated` |
| Background Input | `#0F172A` | `--bg-input` / `--color-bg-input` |
| Border Subtle | `#263449` | `--border-color` / `--color-border` / `--glass-border-subtle` |
| Border Crisp | `#33435C` | `--glass-border-crisp` |
| Border Medium | `#334460` | `--color-border-medium` |
| Text Primary | `#F8FAFC` | `--text-primary` / `--color-text-primary` |
| Text Secondary | `#94A3B8` | `--text-secondary` / `--color-text-secondary` |
| Text Muted | `#64748B` | `--text-muted` / `--color-text-muted` |
| Success | `#10B981` | `--color-success` |
| Success Light (tint) | `rgba(16, 185, 129, 0.15)` | `--color-success-light` / `--color-success-light` |
| Success Border | `rgba(16, 185, 129, 0.30)` | `--color-success-border` |
| Warning | `#F59E0B` | `--color-warning` |
| Warning Light (tint) | `rgba(245, 158, 11, 0.15)` | `--color-warning-light` / `--color-warning-light` |
| Warning Border | `rgba(245, 158, 11, 0.30)` | `--color-warning-border` |
| Danger | `#EF4444` | `--color-danger` |
| Danger Light (tint) | `rgba(239, 68, 68, 0.15)` | `--color-danger-light` / `--color-danger-light` |
| Danger Border | `rgba(239, 68, 68, 0.30)` | `--color-danger-border` |
| Info | `#38BDF8` | `--color-info` |
| Info Light (tint) | `rgba(56, 189, 248, 0.15)` | `--color-info-light` / `--color-info-light` |
| Info Border | `rgba(56, 189, 248, 0.30)` | `--color-info-border` |
| Neutral Light (tint) | `rgba(100, 116, 139, 0.15)` | `--color-neutral-light` |
| Neutral Border | `rgba(100, 116, 139, 0.30)` | `--color-neutral-border` |
| Surface Hover | `#1E2D47` | `--color-surface-hover` |
| Surface Active | `#1D2B42` | `--color-surface-active` |
| Text Inverse (on saturated) | `#FFFFFF` | `--color-text-inverse` |
| Focus Ring | `#2563EB` | `--focus-ring-color` |
| Focus Ring Width | `2px` | `--focus-ring-width` |
| Focus Ring Offset | `2px` | `--focus-ring-offset` |
| Focus Ring Offset Color | `#0B1120` | `--focus-ring-offset-color` |

**Color Notes:** Dark FinTech navy base (`#0B1120`), blue primary accent (`#2563EB`), semantic tints for states (success/warning/danger/info at 15% opacity with 30% borders), frosted-glass surfaces via `backdrop-filter: blur + saturate`.

### Typography

- **Heading Font:** Inter (via `var(--glass-font-sans)`)
- **Body Font:** Inter (via `var(--glass-font-sans)`)
- **Mono Font:** JetBrains Mono (via `var(--glass-font-mono)`)
- **Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap');
```

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-text-xs` | `0.75rem` (12px) | Captions, badges, timestamps |
| `--glass-text-sm` | `0.875rem` (14px) | Body small, labels, table cells |
| `--glass-text-base` | `1rem` (16px) | Default body |
| `--glass-text-lg` | `1.125rem` (18px) | Large body, card titles |
| `--glass-text-xl` | `1.25rem` (20px) | Section headers |
| `--glass-text-2xl` | `1.5rem` (24px) | Page titles, KPI values |
| `--glass-text-3xl` | `1.875rem` (30px) | Hero headings |
| `--glass-text-4xl` | `2.25rem` (36px) | Marketing hero |
| `--glass-font-normal` | `400` | Body |
| `--glass-font-medium` | `500` | Emphasized body |
| `--glass-font-semibold` | `600` | Labels, stat values |
| `--glass-font-bold` | `700` | Headings |
| `--glass-font-extrabold` | `800` | Large KPI numbers |

### Spacing Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-space-xs` | `0.25rem` (4px) | Tight gaps, icon padding |
| `--glass-space-sm` | `0.5rem` (8px) | Inline spacing, icon gaps |
| `--glass-space-md` | `1rem` (16px) | Standard padding, card inner |
| `--glass-space-lg` | `1.5rem` (24px) | Section padding |
| `--glass-space-xl` | `2rem` (32px) | Large gaps, container padding |
| `--glass-space-2xl` | `3rem` (48px) | Section margins, hero padding |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-radius-xs` | `4px` | Chips, badges |
| `--glass-radius-sm` | `8px` | Buttons, inputs |
| `--glass-radius-md` | `12px` | Cards, dropdowns |
| `--glass-radius-lg` | `16px` | Modals, dialogs |
| `--glass-radius-xl` | `20px` | Large modals |
| `--glass-radius-2xl` | `24px` | Feature cards |
| `--glass-radius-full` | `9999px` | Pills, avatars |

### Glass / Frosted Effects

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-blur-xs` | `6px` | Subtle overlays |
| `--glass-blur-sm` | `12px` | Cards, tooltips |
| `--glass-blur-md` | `20px` | Standard glass surface |
| `--glass-blur-lg` | `32px` | Elevated surfaces, modals |
| `--glass-blur-xl` | `48px` | Overlay sheets |
| `--glass-saturate` | `185%` | Standard glass saturation |
| `--glass-saturate-high` | `200%` | Stronger refraction |

**Utility Classes (from `glass-tokens.css`):**
```css
.glass-surface {
  background: var(--glass-surface-base);
  backdrop-filter: blur(var(--glass-blur-md)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border-subtle);
  box-shadow: var(--glass-shadow-md), var(--glass-specular-rim);
}
.glass-surface-elevated {
  background: var(--glass-surface-elevated);
  backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border-crisp);
  box-shadow: var(--glass-shadow-lg), var(--glass-specular-rim);
}
.glass-surface-subtle {
  background: var(--glass-surface-muted);
  backdrop-filter: blur(var(--glass-blur-sm)) saturate(var(--glass-saturate));
  border: 1px solid var(--glass-border-subtle);
  box-shadow: var(--glass-shadow-sm), var(--glass-specular-top);
}
.glass-surface-overlay {
  background: var(--glass-surface-overlay);
  backdrop-filter: blur(var(--glass-blur-lg)) saturate(var(--glass-saturate-high));
  border: 1px solid var(--glass-border-subtle);
  box-shadow: var(--glass-shadow-xl), var(--glass-specular-rim);
}
```

### Shadow Depths

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-shadow-xs` | `0 1px 2px rgba(0,0,0,0.30)` | Subtle lift |
| `--glass-shadow-sm` | `0 1px 3px rgba(0,0,0,0.35)` | Buttons, chips |
| `--glass-shadow-md` | `0 4px 16px -2px rgba(0,0,0,0.50)` | Cards, default |
| `--glass-shadow-lg` | `0 12px 28px -4px rgba(0,0,0,0.65)` | Elevated cards, dropdowns |
| `--glass-shadow-xl` | `0 20px 40px -8px rgba(0,0,0,0.70)` | Modals, drawers |
| `--glass-shadow-glow-accent` | `0 0 24px rgba(37,99,235,0.25)` | Primary focus/glow |
| `--glass-shadow-glow-success` | `0 0 24px rgba(16,185,129,0.25)` | Success states |
| `--glass-shadow-glow-warning` | `0 0 24px rgba(245,158,11,0.25)` | Warning states |
| `--glass-shadow-glow-danger` | `0 0 24px rgba(239,68,68,0.25)` | Danger states |
| `--glass-shadow-glow-info` | `0 0 24px rgba(56,189,248,0.25)` | Info states |
| `--glass-shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.4)` | Recessed inputs |

### Specular / Rim Lighting (Liquid Glass Signature)

```css
--glass-specular-top: inset 0 1px 0 0 rgba(255,255,255,0.08);
--glass-specular-rim: inset 0 1px 1px 0 rgba(255,255,255,0.10), inset 0 -1px 1px 0 rgba(0,0,0,0.40);
--glass-specular-recessed: inset 0 2px 4px 0 rgba(0,0,0,0.45);
--glass-specular-highlight: inset 0 1px 0 0 rgba(255,255,255,0.15);
```
Applied as a 1px top highlight line on cards/dialogs (see component templates).

### Motion / Interaction Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-spring-easing` | `cubic-bezier(0.16, 1, 0.3, 1)` | Standard spring |
| `--glass-spring-bounce` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful bounce |
| `--glass-transition-fast` | `100ms var(--glass-spring-easing)` | Hover, focus |
| `--glass-transition-normal` | `200ms var(--glass-spring-easing)` | Default transitions |
| `--glass-transition-slow` | `300ms var(--glass-spring-easing)` | Modals, drawers |
| `--glass-transition-very-slow` | `500ms var(--glass-spring-easing)` | Page transitions |
| `--glass-scale-hover` | `scale(1.008)` | Card hover lift |
| `--glass-scale-hover-lg` | `scale(1.02)` | Button hover |
| `--glass-scale-active` | `scale(0.988)` | Press feedback |
| `--glass-scale-active-lg` | `scale(0.97)` | Button press |

**Keyframe Animations:**
- `glassFadeIn` (200ms) — fade in
- `glassSlideUp` (250ms) — slide up from 8px
- `glassSlideDown` (250ms) — slide down from -8px
- `glassScaleIn` (200ms, bounce) — scale from 0.96
- `glass-shimmer` (1.5s infinite) — skeleton loading

**Reduced Motion:** `@media (prefers-reduced-motion: reduce)` sets all transitions to `0ms`.

### Z-Index Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--glass-z-dropdown` | `50` | Dropdowns, popovers |
| `--glass-z-tooltip` | `60` | Tooltips |
| `--glass-z-modal` | `100` | Dialogs, modals |
| `--glass-z-toast` | `200` | Toasts, notifications |

### Container Queries (Component-Level Responsive)

| Token | Value |
|-------|-------|
| `--container-xs` | `280px` |
| `--container-sm` | `320px` |
| `--container-md` | `420px` |
| `--container-lg` | `540px` |
| `--container-xl` | `720px` |
| `--container-2xl` | `960px` |
| `--container-3xl` | `1100px` |
| `--container-4xl` | `1440px` |

---

## Component Specs (Implemented)

All components are **standalone Angular components** in `src/app/design-system/components/`, exported via `src/app/design-system/index.ts`.

### 1. glass-button (`<glass-button>`)

**Variants:** `filled` (vibrant primary), `glass` (dark elevated), `tinted` (subtle blue), `danger`  
**Sizes:** `sm` (34px), `md` (42px), `lg` (46px)  
**States:** default, hover (`translateY(-1px)`), active (`scale(0.985)`), disabled (opacity 0.5, `not-allowed`), loading (spinner)  
**Focus:** `focus:ring-2 focus:ring-[#2563EB]/40 focus:ring-offset-1 focus:ring-offset-[#0B1120]`  
**Specular:** 1px top highlight line (`via-white/20`)

### 2. glass-card (`<glass-card>`)

**Variants:** `default`, `elevated`, `subtle`, `kpi`  
**Glow:** `accent`, `success`, `warning`, `none`  
**Interactive:** optional `card-interactive` — hover lifts (`translateY(-2px)`), border glows accent  
**Specular:** 1px top highlight line (`via-white/10`)

### 3. glass-stat-card (`<glass-stat-card>`)

**Variants:** `default`, `elevated`, `subtle`, `kpi`, `glow` (full bleed glow)  
**Colors:** `primary`, `success`, `warning`, `danger`, `info`, `neutral` (icon background)  
**Features:** label (uppercase, tracking-wide), trend badge (positive/negative), large value (auto-formats K/M/Cr), optional progress bar, footer badge, interactive hover lift  
**Specular:** 1px top highlight line

### 4. glass-table (`<glass-table>`)

**Features:** sortable headers, row hover/selection/alternation, action buttons per row (variant/size), empty state integration, pagination, loading skeletons  
**Variants:** header bg `#0F172A`, body `#151F32`, alternate rows `rgba(255,255,255,0.01)`, selected `rgba(37,99,235,0.1)`, hover `rgba(255,255,255,0.02)`

### 5. glass-dialog (`<glass-dialog>`)

**Backdrop:** `bg-black/75 backdrop-blur-md`  
**Surface:** `#111827` / `border #263449` / `shadow-2xl`  
**Animation:** `dialogPop` (200ms, scale 0.96→1, translateY 8px→0)  
**Variants:** `primary` (blue confirm), `danger` (red confirm)  
**Specular:** 1px top highlight line

### 6. glass-dropdown (`<glass-dropdown>`)

**Trigger:** glass-button styled, chevron toggle  
**Panel:** elevated surface, grouped items, dividers, danger items  
**Keyboard:** Arrow navigation, Enter/Space select, Escape close

### 7. glass-tooltip (`<glass-tooltip>`)

**Surface:** elevated glass, 12px blur, specular rim  
**Positioning:** top/right/bottom/left, auto-flip  
**Animation:** fade + slide (200ms)

### 8. glass-progress (`<glass-progress>`)

**Variants:** `default` (blue), `success`, `warning`, `danger`, `info`  
**Sizes:** `sm` (4px), `md` (6px), `lg` (8px)  
**Features:** optional label, indeterminate shimmer

### 9. glass-skeleton (`<glass-skeleton>`)

**Variants:** `text`, `card`, `stat`, `table`, `avatar`  
**Animation:** `glass-shimmer` (1.5s infinite, `rgba(255,255,255,0.03) → 0.08 → 0.03`)

### 10. glass-empty-state (`<glass-empty-state>`)

**Variants:** `default`, `success`, `warning`, `danger`, `info`  
**Sizes:** `sm`, `md`, `lg`  
**Features:** icon, title, description, optional action button

### 11. glass-badge (directive: `glassBadge`)

**Variants:** `primary`, `success`, `warning`, `danger`, `info`, `neutral`  
**Sizes:** `sm`, `md`, `lg`  
**Style:** tinted background (15%), colored border (30%), colored text (light variant)

### 12. glass-input (directive: `glassInput`)

**Style:** `#0F172A` bg, `#263449` border, focus ring `#2563EB`  
**Sizes:** `sm`, `md`, `lg`

### 13. glass-avatar (`<glass-avatar>`)

**Sizes:** `xs` (24px) → `2xl` (72px)  
**Features:** image fallback to initials, status indicator ring, grouped stack

### 14. glass-tabs (`<glass-tabs>`)

**Variants:** `line` (underline), `enclosed` (pill), `soft` (background tint)  
**Animation:** smooth indicator slide (200ms spring)

### 15. glass-switch (`<glass-switch>`)

**Style:** glass track, thumb with specular highlight, focus ring, disabled state

---

## Style Guidelines

**Style:** Dark Liquid Glass / Glisse-inspired FinTech  
**Keywords:** dark mode, frosted glass, refraction, specular highlights, high contrast, financial, professional, trustworthy, data-dense, responsive, accessible

**Key Effects:**
- Frosted glass surfaces via `backdrop-filter: blur + saturate`
- 1px specular top highlight on all elevated surfaces
- Rim lighting (`inset` shadows) for depth
- Colored glow shadows for semantic states
- Spring physics (`cubic-bezier(0.16, 1, 0.3, 1)`) for all motion
- Reduced-motion support (transitions → 0ms)
- Visible focus rings (2px, primary blue, offset)
- 44×44px minimum touch targets (button heights: 34/42/46px)

---

## Page Pattern

**Pattern Name:** FinTech Dashboard / Command Center

- **Conversion Strategy:** Trust via precision — real-time data, clear hierarchy, audit trails visible, compliance badges
- **CTA Placement:** Primary actions (Create, Approve, Export) top-right; secondary in context
- **Section Order:** Global KPIs (stat cards) → Primary data table → Secondary panels (charts, activity) → Footer actions

---

## Anti-Patterns (Do NOT Use)

- ❌ Light mode default (app is dark-first; no light theme tokens defined)
- ❌ Playful/consumer gradients (no pink/purple AI gradients)
- ❌ Flat, opaque cards (always use glass surface with blur + specular)
- ❌ Emojis as icons — Use inline SVG (Lucide-style, `stroke="currentColor"`)
- ❌ Missing `cursor:pointer` — All clickable elements must have it
- ❌ Layout-shifting hovers — Use `transform` only, no `margin`/`width` changes
- ❌ Low contrast text — Maintain 4.5:1 minimum (text primary `#F8FAFC` on `#0B1120` = 18.5:1)
- ❌ Instant state changes — Always use transitions (100–300ms, spring easing)
- ❌ Invisible focus states — Focus rings mandatory (2px, offset)
- ❌ Hardcoded colors in components — Use CSS variables / design tokens only
- ❌ `any` type leaks — Template expressions must use typed helpers (see `getRowValue` in glass-table)
- ❌ Unused imports — Angular compiler warns (NG8113); remove dead code

---

## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (inline SVG with `stroke="currentColor"`)
- [ ] All icons from consistent set (Lucide-style, 24×24 viewBox)
- [ ] `cursor-pointer` on all clickable elements
- [ ] Hover states with smooth transitions (100–300ms, spring easing)
- [ ] Dark mode: text contrast ≥ 4.5:1 (primary text `#F8FAFC` on `#0B1120` = 18.5:1 ✓)
- [ ] Focus states visible for keyboard navigation (2px ring, offset, primary blue)
- [ ] `prefers-reduced-motion` respected (transitions → 0ms)
- [ ] Responsive: 375px, 768px, 1024px, 1440px (test container queries)
- [ ] No content hidden behind fixed navbars (topbar 64px, sidebar 280px)
- [ ] No horizontal scroll on mobile (tables use `overflow-x: auto`)
- [ ] Touch targets ≥ 44×44px (button heights 34/42/46px — `sm` is 34px, acceptable with padding)
- [ ] No hardcoded hex in component styles — use `var(--token)`
- [ ] Build passes (`ng build --configuration production` — zero errors)
- [ ] No unused imports (NG8113 warnings cleaned)

---

## Implementation Notes

- **Stack:** Angular 22 + TypeScript strict + Tailwind CSS 4 + Vite
- **Token Source:** `src/app/design-system/styles/glass-tokens.css` (single source of truth)
- **Component Location:** `src/app/design-system/components/*.component.ts`
- **Barrel Export:** `src/app/design-system/index.ts`
- **Global Styles:** `src/styles.css` imports tokens + Tailwind
- **Fonts:** Inter + JetBrains Mono via Google Fonts (preconnect in `index.html`)

---

## Pages (Override Directory)

Check `design-system/pages/[page-name].md` for page-specific overrides.

*Current pages:* none yet — all pages follow Master rules.