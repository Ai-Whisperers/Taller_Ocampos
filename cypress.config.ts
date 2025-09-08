import { defineConfig } from 'cypress';

export default defineConfig({
  e2e: {
    baseUrl: 'http://localhost:5173',
    viewportWidth: 1280,
    viewportHeight: 720,
    video: true,
    screenshotOnRunFailure: true,
    supportFile: 'cypress/support/e2e.ts',
    specPattern: 'cypress/e2e/**/*.cy.{ts,tsx}',
    
    setupNodeEvents(on, config) {
      // implement node event listeners here
      on('task', {
        log(message) {
          console.log(message);
          return null;
        }
      });
    },
    
    env: {
      apiUrl: 'http://localhost:3001/api/v1',
      testUserEmail: 'test@mechanicsshop.com',
      testUserPassword: 'TestPassword123'
    }
  },

  component: {
    devServer: {
      framework: 'react',
      bundler: 'vite'
    },
    specPattern: 'frontend/src/**/*.cy.{ts,tsx}',
    supportFile: 'cypress/support/component.ts'
  }
});