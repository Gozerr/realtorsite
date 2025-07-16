// eslint-disable-next-line no-undef

describe('Полный e2e smoke-тест платформы', () => {
  // eslint-disable-next-line no-undef
  it('should login and visit all main pages', () => {
    // Отключить туториал, если он определяется по localStorage/cookie
    cy.visit('/login', {
      onBeforeLoad(win) {
        // Пример: win.localStorage.setItem('tutorialShown', 'true');
      }
    });

    cy.get('[data-testid="login-email"]').type('test.agent.723@example.com');
    cy.get('[data-testid="login-password"]').type('qwerty123');
    cy.get('button[type="submit"]').click();
    cy.url().should('not.include', '/login');

    // Проверка главной
    cy.contains('Главная').should('exist');

    // Объекты
    cy.visit('/properties');
    cy.contains('Объекты').should('exist');
    cy.get('body').then($body => {
      if ($body.find('[data-testid="property-card"]').length) {
        cy.get('[data-testid="property-card"]').should('exist');
      } else {
        cy.contains('Нет объектов').should('exist'); // или другой текст для пустого состояния
      }
    });

    // Клиенты
    cy.visit('/clients');
    cy.get('[data-testid="client-card"]').should('exist');

    // Чаты
    cy.visit('/chats');
    cy.get('[data-testid="chat-list"]').should('exist');

    // Уведомления
    cy.visit('/notifications');
    cy.get('[data-testid="notification-list"]').should('exist');

    // Профиль
    cy.visit('/profile');
    cy.contains('Профиль').should('exist');

    // Карта (если есть)
    cy.visit('/map');
    cy.get('[data-testid="map-container"]').should('exist');
  });
}); 