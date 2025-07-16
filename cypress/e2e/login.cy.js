// E2E test for login

describe('Login', () => {
  // eslint-disable-next-line no-undef
  it('should allow user to log in', () => {
    cy.loginAsTestAgent();
  });
}); 