describe('App Loading', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForApp();
  });

  it('should load the app without errors', () => {
    cy.get('body').should('exist');
  });

  it('should have correct title', () => {
    cy.title().should('include', 'Finance Audit Pro');
  });

  it('should redirect unauthenticated users to login', () => {
    cy.url().should('include', '/login');
  });

  it('should be responsive', () => {
    cy.viewport(375, 667);
    cy.get('body').should('be.visible');
  });
});
