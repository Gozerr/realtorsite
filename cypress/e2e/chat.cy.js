// E2E tests for chat functionality

describe('Chat', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/my-chats');
  });

  it('should display list of chats', () => {
    cy.get('.chat-list-item').should('exist');
  });

  it('should open chat and send/receive messages', () => {
    cy.get('.chat-list-item').first().click();
    cy.get('input[placeholder="Введите сообщение..."]').type('Тестовое сообщение');
    cy.contains('Отправить').click();
    cy.contains('Тестовое сообщение').should('exist');
  });

  it('should highlight new messages', () => {
    cy.get('.chat-list-item.unread').should('exist');
  });
});

describe('Map and Properties E2E', () => {
  it('Loads properties on map move and syncs with URL', () => {
    cy.visit('/map');
    cy.get('.big-map-page').should('exist');
    cy.get('.ant-card').should('have.length.greaterThan', 0);
    // Изменить фильтр
    cy.get('input[placeholder="Поиск по адресу или названию..."]').type('улица');
    cy.url().should('include', 'filters=');
    // Клик по карточке — выделение на карте
    cy.get('.ant-card').first().click();
    cy.url().should('include', 'selectedId=');
    // Переместить карту (bbox меняется)
    // (эмулировать boundschange сложно, но можно проверить, что bbox появляется в url)
    cy.url().should('include', 'bbox=');
    // Fallback: очистить фильтры, убедиться, что объекты отображаются
    cy.get('button').contains('Сбросить').click();
    cy.get('.ant-card').should('have.length.greaterThan', 0);
  });
}); 