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
        'sans': ['Inter', 'Noto Sans Telugu', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'Helvetica', 'Arial', 'sans-serif'],
      },
      colors: {
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
        success: {
          500: '#16a34a',
          600: '#15803d',
        },
        warning: {
          500: '#d97706',
          600: '#b45309',
        },
      },
    },
  },
  plugins: [],
};