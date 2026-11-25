const { defineConfig } = require('cypress');

module.exports = defineConfig({
  e2e: {
    baseUrl: process.env.CYPRESS_BASE_URL || 'http://localhost:4201',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    defaultCommandTimeout: 10000,
    requestTimeout: 10000,
    responseTimeout: 30000,
    setupNodeEvents(on, config) {
      if (process.env.E2E_EMAIL) config.env.E2E_EMAIL = process.env.E2E_EMAIL;
      if (process.env.E2E_PASSWORD) config.env.E2E_PASSWORD = process.env.E2E_PASSWORD;
      config.env.E2E_AUTH_REQUIRED = process.env.E2E_AUTH_REQUIRED === 'true';
      return config;
    },
  },
});
