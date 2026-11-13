import { watch } from 'node:fs';
import { resolve } from 'node:path';

export default {
  content: [
    './src/**/*.html',
    './src/**/*.ts',
  ],
  theme: {
    extend: {
      fontFamily: {
        'sans': ['Plus Jakarta Sans', 'Inter', 'Noto Sans Telugu', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
        // Primary colors - Muted blues (for informational content)
        primary: {
          50: '#f0f4ff',
          100: '#e2ebff',
          200: '#c9dbff',
          300: '#a3c4ff',
          400: '#74a9ff',
          500: '#4d8bff',
          600: '#3370ff',
          700: '#265ae9',
          800: '#1d4bd9',
          900: '#163ec2',
        },
        // Brand colors - Finance Audit Pro navy authority color
        brand: {
          DEFAULT: '#0F172A',
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0F172A',
        },
        // Accent/CTA - Teal authority blue for primary actions
        accent: {
          DEFAULT: '#0369A1',
          50: '#f0f9ff',
          100: '#cff4ff',
          200: '#a3daff',
          300: '#70bdff',
          400: '#3f99ff',
          500: '#1e7aff',
          600: '#005acc',
          700: '#004a99',
          800: '#003b7a',
          900: '#002e5e',
        },
        // Success - Green for positive financial states (paid, collected)
        success: {
          50: '#f0fdf4',
          100: '#dcfce7',
          200: '#bbf7d0',
          300: '#86efac',
          400: '#22c55e',
          500: '#16a34a',
          600: '#15803d',
          700: '#166534',
          800: '#14532d',
          900: '#166534',
        },
        // Warning - Amber for outstanding balances and pending items
        warning: {
          50: '#fffbeb',
          100: '#fef3c7',
          200: '#fed7aa',
          300: '#fcd34d',
          400: '#f59e0b',
          500: '#d97706',
          600: '#b45309',
          700: '#92400e',
          800: '#78350f',
          900: '#78350f',
        },
        // Background colors
        background: {
          primary: '#ffffff',
          secondary: '#f8fafc',
          tertiary: '#f1f5f9',
          dark: '#0f172a',
        },
        // Text colors
        text: {
          primary: '#0F172A',
          secondary: '#475569',
          muted: '#64748b',
          dark: '#f8fafc',
        },
        // Slate grays - used throughout UI
        slate: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0F172A',
        },
      },
    },
  },
  plugins: [],
};