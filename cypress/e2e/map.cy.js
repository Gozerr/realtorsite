// E2E tests for map functionality

describe('Map', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/properties');
  });

  it('should display property markers on the map', () => {
    cy.get('.yandex-map-marker').should('exist');
  });

  it('should update visible area (bbox) on move/zoom', () => {
    // Симулировать drag/zoom карты и проверить обновление списка
  });

  it('should highlight property on marker click', () => {
    cy.get('.yandex-map-marker').first().click();
    cy.get('.property-card.selected').should('exist');
  });
}); 