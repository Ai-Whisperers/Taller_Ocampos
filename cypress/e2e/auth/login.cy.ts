describe('Authentication - Login', () => {
  beforeEach(() => {
    // Clear any existing auth state
    cy.clearLocalStorage();
    cy.clearCookies();
    cy.visit('/login');
  });

  it('should display login form elements', () => {
    cy.get('[data-testid="login-form"]').should('be.visible');
    cy.get('[data-testid="email-input"]').should('be.visible');
    cy.get('[data-testid="password-input"]').should('be.visible');
    cy.get('[data-testid="login-button"]').should('be.visible');
    cy.get('[data-testid="forgot-password-link"]').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'Email is required');
    
    cy.get('[data-testid="password-error"]')
      .should('be.visible')
      .and('contain', 'Password is required');
  });

  it('should validate email format', () => {
    cy.get('[data-testid="email-input"]').type('invalid-email');
    cy.get('[data-testid="password-input"]').type('password123');
    cy.get('[data-testid="login-button"]').click();
    
    cy.get('[data-testid="email-error"]')
      .should('be.visible')
      .and('contain', 'Please enter a valid email address');
  });

  it('should login successfully with valid credentials', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 200,
      body: {
        success: true,
        user: {
          id: '1',
          email: 'owner@testshop.com',
          firstName: 'John',
          lastName: 'Smith',
          role: 'owner'
        },
        shops: [
          {
            id: '1',
            name: 'Test Auto Repair',
            role: 'owner'
          }
        ],
        tokens: {
          accessToken: 'mock-access-token',
          refreshToken: 'mock-refresh-token',
          expiresIn: 900
        }
      }
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type(Cypress.env('testUserEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('testUserPassword'));
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
    
    // Should store auth token
    cy.window().its('localStorage')
      .invoke('getItem', 'accessToken')
      .should('equal', 'mock-access-token');
  });

  it('should display error message for invalid credentials', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      statusCode: 401,
      body: {
        success: false,
        message: 'Invalid credentials'
      }
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type('wrong@example.com');
    cy.get('[data-testid="password-input"]').type('wrongpassword');
    cy.get('[data-testid="login-button"]').click();

    cy.wait('@loginRequest');
    
    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Invalid credentials');
  });

  it('should show loading state during login request', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      delay: 1000,
      statusCode: 200,
      body: { success: true }
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type(Cypress.env('testUserEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('testUserPassword'));
    cy.get('[data-testid="login-button"]').click();

    // Should show loading state
    cy.get('[data-testid="login-button"]')
      .should('be.disabled')
      .and('contain', 'Signing in...');
    
    cy.get('[data-testid="loading-spinner"]').should('be.visible');
  });

  it('should toggle password visibility', () => {
    cy.get('[data-testid="password-input"]').type('password123');
    
    // Password should be hidden by default
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
    
    // Click visibility toggle
    cy.get('[data-testid="password-toggle"]').click();
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'text');
    
    // Click again to hide
    cy.get('[data-testid="password-toggle"]').click();
    cy.get('[data-testid="password-input"]').should('have.attr', 'type', 'password');
  });

  it('should remember user preference for "Remember me"', () => {
    cy.get('[data-testid="remember-checkbox"]').check();
    cy.get('[data-testid="email-input"]').type('user@example.com');
    
    cy.reload();
    
    cy.get('[data-testid="remember-checkbox"]').should('be.checked');
    cy.get('[data-testid="email-input"]').should('have.value', 'user@example.com');
  });

  it('should handle network errors gracefully', () => {
    cy.intercept('POST', '/api/v1/auth/login', {
      forceNetworkError: true
    }).as('loginRequest');

    cy.get('[data-testid="email-input"]').type(Cypress.env('testUserEmail'));
    cy.get('[data-testid="password-input"]').type(Cypress.env('testUserPassword'));
    cy.get('[data-testid="login-button"]').click();

    cy.get('[data-testid="error-message"]')
      .should('be.visible')
      .and('contain', 'Network error');
  });

  it('should redirect authenticated users away from login page', () => {
    // Mock existing authentication
    cy.window().its('localStorage').invoke('setItem', 'accessToken', 'existing-token');
    
    cy.intercept('GET', '/api/v1/auth/me', {
      statusCode: 200,
      body: {
        success: true,
        user: { id: '1', email: 'user@example.com' }
      }
    }).as('meRequest');

    cy.visit('/login');
    cy.wait('@meRequest');
    
    // Should redirect to dashboard
    cy.url().should('include', '/dashboard');
  });
});