import './commands';

Cypress.Screenshot.defaults({
  blackout: ['input[type="email"]', 'input[type="password"]'],
});
