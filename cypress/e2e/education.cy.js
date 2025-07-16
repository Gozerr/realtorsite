// E2E tests for education page

describe('Education Page', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/education');
  });

  it('should display list of courses and events', () => {
    cy.get('.education-card').should('exist');
  });

  it('should filter by type (courses/events)', () => {
    cy.contains('Курсы').click();
    cy.get('.education-card').each(card => {
      cy.wrap(card).contains('Курс');
    });
    cy.contains('Мероприятия').click();
    cy.get('.education-card').each(card => {
      cy.wrap(card).contains('Мероприятие');
    });
  });

  it('should navigate to course/event details', () => {
    cy.get('.education-card').first().click();
    cy.url().should('include', '/education');
    cy.get('.education-details').should('exist');
  });
}); 