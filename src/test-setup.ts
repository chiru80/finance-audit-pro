// Test setup file for Vitest
// jsdom polyfill is not needed in Vitest 5 with jsdom environment

// Global test setup can go here if needed

// Silence console errors during tests
if (typeof console !== 'undefined') {
  const originalError = console.error;
  console.error = (...args) => {
    // Only log errors that aren't from known issues
    if (args[0]?.includes?.('ResizeObserver loop limit')) {
      return;
    }
    originalError.apply(console, args);
  };
}