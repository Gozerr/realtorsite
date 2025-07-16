// E2E tests for authentication and roles

describe('Authentication and Roles', () => {
  // eslint-disable-next-line no-undef
  it('should allow user to log in with valid credentials', () => {
    cy.loginAsTestAgent();
    cy.contains('Главная').should('exist');
  });

  // eslint-disable-next-line no-undef
  it('should show error on invalid login', () => {
    cy.visit('/login');
    cy.get('[data-testid="login-email"]').type('wrong@example.com');
    cy.get('[data-testid="login-password"]').type('wrongpassword');
    cy.get('button[type="submit"]').click();
    cy.contains('Неверный').should('exist'); // или подберите текст под ваш алерт
  });

  // eslint-disable-next-line no-undef
  it('should restrict access to protected pages for unauthenticated users', () => {
    cy.clearCookies();
    cy.visit('/properties');
    cy.url().should('include', '/login');
  });

  // Для проверки ролей лучше использовать отдельные тестовые аккаунты
}); 