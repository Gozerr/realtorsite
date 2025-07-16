// E2E tests for theme and user settings

describe('Theme and Settings', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/settings');
  });

  it('should switch between light and dark theme', () => {
    cy.get('.theme-toggle').click();
    // Проверить, что тема изменилась (например, по классу или цвету)
  });

  it('should save user settings', () => {
    cy.get('select[name="language"]').select('English');
    cy.contains('Сохранить').click();
    // Перезагрузить страницу и проверить, что язык сохранился
  });
}); 