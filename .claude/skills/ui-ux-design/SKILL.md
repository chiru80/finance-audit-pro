---
name: ui-ux-design
description: Premium responsive UI/UX design for the Finance Audit Pro financial SaaS application. Use when designing or implementing components, layouts, dashboards, forms, tables, or visual styling with Tailwind CSS. Covers dark/light themes, mobile-first responsive design, accessibility (WCAG 2.2), and financial-appropriate visual hierarchy.
---

# Premium UI/UX Design

## Design Direction

Finance Audit Pro is a premium financial SaaS product. The interface should feel calm, trustworthy, and efficient — not flashy. Prioritize clarity over decoration.

## Visual Principles

- **Calm, professional palette.** Use muted blues, slate grays, and warm neutrals. Reserve accent colors for CTAs and status indicators only.
- **Clear information hierarchy.** Use a consistent type scale (6px/0.25rem steps recommended). Display, heading, body, caption, and mono text styles.
- **Generous whitespace.** Financial data is dense; give it room to breathe.
- **Subtle interaction.** Avoid unnecessary animation. Use micro-interactions only for state changes (hover, focus, loading, success).
- **Consistent radius.** Use a single border-radius scale (e.g., sm: 4px, md: 8px, lg: 12px, xl: 16px).

## Tailwind CSS Conventions

- Use Tailwind utility classes directly in templates. Avoid custom CSS unless a repeated pattern emerges.
- Extend the Tailwind config for project-specific colors, fonts, and spacing only.
- Define semantic color tokens in `tailwind.config.ts`:
  ```ts
  colors: {
    brand: {
      50: '#...', 100: '#...', 500: '#...', 600: '#...', 900: '#...'
    }
  }
  ```
- Use `dark:` variant classes for dark mode. Wrap the app root in `class="dark"` when dark mode is active.

## Dark / Light Theme

- Implement theme switching via a CSS class on `<html>` or `<body>`.
- Persist the user's theme choice in `localStorage`.
- Provide a theme toggle in the header or settings.
- Test both themes for contrast compliance (WCAG AA minimum, AAA preferred for text).

## Mobile-First Responsive Design

- Design for mobile first. Use `sm:`, `md:`, `lg:`, `xl:`, `2xl:` breakpoints deliberately.
- Touch targets must be at least 44x44px.
- Tables should be scrollable horizontally on small screens, or use a card/list layout for mobile.
- Forms should use appropriate input types (`type="number"` for amounts, `type="email"` for emails).

## Financial Dashboard Patterns

- **Summary cards.** KPI tiles with label, value, and optional trend indicator. Use integer paise values formatted as currency.
- **Status badges.** Color-coded pills for payment status (paid, pending, overdue, partial).
- **Data tables.** Sortable columns, row selection, bulk actions. Use virtual scrolling for large datasets (>200 rows).
- **Date pickers.** Native or lightweight custom date pickers. Avoid heavy third-party libraries.

## Accessibility (WCAG 2.2)

- All interactive elements must be reachable via keyboard (tab order, focus rings).
- Provide `aria-label` for icon-only buttons.
- Use semantic HTML: `<table>` for data tables, `<nav>` for navigation, `<main>` for primary content.
- Ensure color is never the only indicator of meaning (use icons + text + color).
- Form inputs must have associated `<label>` elements.
- Test contrast ratios: normal text ≥ 4.5:1, large text ≥ 3:1.

## Telugu Language Support

- Telugu is an LTR script. No RTL handling required.
- Ensure Tailwind's content path includes all components so Telugu text in templates gets the correct font.
- Use a Telugu-capable font stack (e.g., Noto Sans Telugu) as a fallback.
- Avoid embedding Telugu text in images — use real text for accessibility and searchability.

## Checklist

- [ ] Mobile-first breakpoints applied consistently
- [ ] Dark and light themes both render correctly
- [ ] Touch targets ≥ 44px on mobile
- [ ] No color-only meaning indicators
- [ ] Forms have proper labels and error messages
- [ ] Tables are readable on mobile (scroll or card layout)
- [ ] No unnecessary animations
- [ ] Telugu text renders with correct font fallback