// E2E tests for clients page

describe('Clients Page', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/clients');
  });

  it('should display list of clients', () => {
    cy.get('.client-card').should('exist');
  });

  it('should search and filter clients', () => {
    cy.get('input[placeholder="Поиск"]').type('Иван');
    cy.get('.client-card').each(card => {
      cy.wrap(card).contains(/Иван/i);
    });
  });

  it('should add a new client', () => {
    cy.contains('Добавить клиента').click();
    cy.get('input[name="firstName"]').type('Тест');
    cy.get('input[name="lastName"]').type('Клиент');
    cy.get('input[name="phone"]').type('79991234567');
    cy.get('button[type="submit"]').click();
    cy.contains('Тест Клиент').should('exist');
  });

  it('should edit client data', () => {
    cy.get('.client-card').first().contains('Редактировать').click();
    cy.get('input[name="firstName"]').clear().type('Изменено');
    cy.get('button[type="submit"]').click();
    cy.contains('Изменено').should('exist');
  });
}); 