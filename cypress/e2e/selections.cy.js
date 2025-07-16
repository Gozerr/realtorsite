// E2E tests for selections

describe('Selections', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/selection');
  });

  it('should display list of selections', () => {
    cy.get('.selection-card').should('exist');
  });

  it('should create a new selection', () => {
    cy.contains('Создать подборку').click();
    cy.get('input[name="title"]').type('Новая подборка');
    cy.get('button[type="submit"]').click();
    cy.contains('Новая подборка').should('exist');
  });

  it('should add and remove properties in selection', () => {
    cy.get('.selection-card').first().click();
    cy.contains('Добавить объект').click();
    cy.get('.property-card').first().contains('Добавить').click();
    cy.contains('Удалить').click();
  });

  it('should generate PDF for selection', () => {
    cy.get('.selection-card').first().click();
    cy.contains('Скачать PDF').click();
    // Проверить, что файл скачался (опционально)
  });
}); 