const testUser = require('../fixtures/test-user.json');

describe('Auth Flow', () => {
  beforeEach(() => {
    cy.visit('/');
    cy.waitForApp();
  });

  it('should redirect to login from home page', () => {
    cy.url().should('include', '/login');
  });

  it('should display login form with required fields', () => {
    cy.get('input[type="email"]').should('be.visible');
    cy.get('input[type="password"]').should('be.visible');
    cy.get('button[type="submit"]').should('be.visible');
  });

  it('should show validation errors for empty form submission', () => {
    cy.get('button[type="submit"]').click();
    cy.contains('email').should('be.visible');
    cy.contains('password').should('be.visible');
  });

  it('should show error on invalid credentials', () => {
    cy.get('input[type="email"]').type('invalid@example.com');
    cy.get('input[type="password"]').type('wrongpass');
    cy.get('button[type="submit"]').click();
    // Error message appears in the alert div
    cy.get('[role="alert"]').should('be.visible');
  });

  it('should have a Google sign-in button when Supabase is configured', () => {
    cy.contains('Continue with Google').should('be.visible');
  });
});