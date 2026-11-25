const email = Cypress.env('E2E_EMAIL');
const password = Cypress.env('E2E_PASSWORD');
const authE2ERequired = Cypress.env('E2E_AUTH_REQUIRED') === true;
const runAuthenticatedDashboardTest = authE2ERequired || (email && password) ? it : it.skip;

describe('Authenticated dashboard', () => {
  runAuthenticatedDashboardTest('signs in and loads dashboard data', () => {
    if (!email || !password) {
      throw new Error('Set the E2E_EMAIL and E2E_PASSWORD GitHub Actions secrets.');
    }

    cy.visit('/login');
    cy.get('input[type="email"]').type(email, { log: false });
    cy.get('input[type="password"]').type(password, {
      log: false,
      parseSpecialCharSequences: false,
    });
    cy.get('button[type="submit"]').click();

    cy.location('pathname').should('match', /\/dashboard\/?$/);
    cy.get('app-dashboard').should('be.visible');
    cy.get('app-dashboard h1').should('be.visible');
    cy.contains('app-dashboard h2', 'Recent Transactions').should('be.visible');
    cy.get('app-dashboard [role="status"]').should('not.exist');
    cy.get('app-dashboard [role="alert"]').should('not.exist');
  });
});
