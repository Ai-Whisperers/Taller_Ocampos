/**
 * Mock Service Worker - Browser Setup
 *
 * Configures MSW for browser environment (development, E2E tests).
 * This worker intercepts HTTP requests in the browser.
 *
 * Note: For Playwright E2E tests, prefer using Playwright's native
 * route mocking. This file is provided for consistency and potential
 * future use in development mode or Cypress-style E2E tests.
 *
 * To use in development:
 * 1. Run: npx msw init public/ --save
 * 2. Import this file in your app entry point
 * 3. Call worker.start() conditionally
 */

import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

/**
 * Create MSW browser worker instance with default handlers
 */
export const worker = setupWorker(...handlers);

/**
 * Start the service worker
 * Call this in your app entry point if you want to use MSW in development
 */
export async function startWorker(options?: Parameters<typeof worker.start>[0]) {
  if (typeof window === 'undefined') {
    console.warn('MSW browser worker can only be started in browser environment');
    return;
  }

  return worker.start({
    onUnhandledRequest: 'bypass', // Don't warn about unhandled requests
    ...options,
  });
}
