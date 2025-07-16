describe('Real Estate Site E2E', () => {
  // eslint-disable-next-line no-undef
  beforeEach(() => {
    cy.loginAsTestAgent();
  });

  it('Login page loads and login works', () => {
    cy.visit('/login');
    cy.get('input[name=email]').type('admin@realtorsite.com');
    cy.get('input[name=password]').type('password123');
    cy.get('button[type=submit]').click();
    cy.url().should('not.include', '/login');
    cy.contains('Dashboard');
  });

  it('Properties list loads', () => {
    cy.visit('/properties');
    cy.contains('Объекты');
    cy.get('[data-testid=property-card]').should('exist');
  });

  it('Property details page loads', () => {
    cy.visit('/properties');
    cy.get('[data-testid=property-card]').first().click();
    cy.url().should('include', '/properties/');
    cy.get('[data-testid=property-details]').should('exist');
  });

  it('Chat page loads', () => {
    cy.visit('/chats');
    cy.contains('Чаты');
    cy.get('[data-testid=chat-list]').should('exist');
  });

  it('Notifications page loads', () => {
    cy.visit('/notifications');
    cy.contains('Уведомления');
    cy.get('[data-testid=notification-list]').should('exist');
  });

  it('Navigation works', () => {
    cy.visit('/dashboard');
    cy.get('nav').contains('Объекты').click();
    cy.url().should('include', '/properties');
    cy.get('nav').contains('Клиенты').click();
    cy.url().should('include', '/clients');
    cy.get('nav').contains('Календарь').click();
    cy.url().should('include', '/calendar');
  });
}); 