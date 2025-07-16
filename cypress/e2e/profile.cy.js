// E2E tests for user profile

describe('User Profile', () => {
  beforeEach(() => {
    cy.loginAsTestAgent();
    cy.visit('/profile');
  });

  it('should display and edit profile', () => {
    cy.contains('Редактировать профиль').click();
    cy.get('input[name="firstName"]').clear().type('Тест');
    cy.get('button[type="submit"]').click();
    cy.contains('Тест').should('exist');
  });

  it('should upload and change avatar', () => {
    cy.contains('Загрузить аватар').attachFile('avatar.png');
    cy.get('.avatar-img').should('exist');
  });

  it('should change password', () => {
    cy.contains('Сменить пароль').click();
    cy.get('input[name="oldPassword"]').type('qwerty123');
    cy.get('input[name="newPassword"]').type('newpass123');
    cy.get('button[type="submit"]').click();
    cy.contains(/успешно|success/i).should('exist');
  });
}); 