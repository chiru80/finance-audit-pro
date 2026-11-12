/**
 * Spacing Design Tokens for Finance Audit Pro
 */

export const spacing = {
  // Base spacing unit (4px = 0.25rem)
  xs: '0.25rem',   // 4px
  sm: '0.5rem',    // 8px
  md: '0.75rem',   // 12px
  lg: '1rem',      // 16px
  xl: '1.25rem',   // 20px
  '2xl': '1.5rem', // 24px
  '3xl': '1.75rem', // 28px
  '4xl': '2rem',   // 32px
  '5xl': '2.5rem', // 40px
  '6xl': '3rem',   // 48px
  '7xl': '3.5rem', // 56px
  '8xl': '4rem',   // 64px

  // Component-specific spacings
  component: {
    // Button
    button: {
      minH: '2.5rem',   // 40px - touch target minimum
      px: '1rem',       // 16px
      py: '0.5rem',     // 8px
    },
    // Card
    card: {
      p: '1rem',        // 16px
      mb: '1rem',       // 16px
    },
    // Form
    form: {
      label: '0.5rem',  // 8px
      input: '0.75rem', // 12px
      mb: '1rem',       // 16px
    },
    // Grid
    grid: {
      gap: '1rem',      // 16px
      mdGap: '1.5rem',  // 24px
    },
  },

  // Border radius
  radius: {
    xs: '0.125rem',   // 2px
    sm: '0.25rem',    // 4px
    md: '0.5rem',     // 8px
    lg: '0.75rem',    // 12px
    xl: '1rem',       // 16px
    '2xl': '1.5rem',  // 24px
    '3xl': '9999px',  // fully rounded
  },
};