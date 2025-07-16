// E2E tests for notifications

describe('Notifications', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/notifications');
  });

  it('should display notifications', () => {
    cy.get('.notification-card').should('exist');
  });

  it('should mark notification as read', () => {
    cy.get('.notification-card.unread').first().click();
    cy.get('.notification-card.unread').should('have.length.lessThan', 1);
  });
}); 