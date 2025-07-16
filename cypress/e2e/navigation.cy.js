// E2E tests for main page and navigation

describe('Main Navigation', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/');
  });

  it('should display all main menu items', () => {
    cy.contains('Главная');
    cy.contains('Объекты недвижимости');
    cy.contains('Мои клиенты');
    cy.contains('Мои чаты');
    cy.contains('Подбор');
    cy.contains('Уведомления');
    cy.contains('Обучение');
    cy.contains('Мой профиль');
    cy.contains('Настройки');
  });

  it('should navigate to each main section', () => {
    cy.contains('Объекты недвижимости').click();
    cy.url().should('include', '/properties');
    cy.contains('Мои клиенты').click();
    cy.url().should('include', '/clients');
    // ...и так далее для всех пунктов меню
  });

  it('should log out and redirect to login', () => {
    cy.contains('Выйти').click();
    cy.url().should('include', '/login');
  });
}); 