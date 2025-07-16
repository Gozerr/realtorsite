Cypress.Commands.add('loginAsTestAgent', () => {
  cy.visit('/login');
  cy.get('input[type="email"]').clear().type('test.agent.723@example.com');
  cy.get('input[type="password"]').clear().type('qwerty123');
  cy.get('button[type="submit"]').click();
  cy.url().should('not.include', '/login');
}); 