/**
 * Mock Service Worker - Node.js Server Setup
 *
 * Configures MSW for Node.js environment (Jest tests).
 * This server intercepts HTTP requests during test execution.
 *
 * Usage in tests:
 * ```typescript
 * import { server } from '@/tests/mocks/server';
 * import { http, HttpResponse } from 'msw';
 *
 * // Override handler for specific test
 * server.use(
 *   http.get('/api/clients', () => {
 *     return HttpResponse.json({ success: true, data: [] });
 *   })
 * );
 * ```
 */

import { setupServer } from 'msw/node';
import { handlers } from './handlers';

/**
 * Create MSW server instance with default handlers
 */
export const server = setupServer(...handlers);

/**
 * Helper to reset handlers to defaults
 */
export function resetHandlers() {
  server.resetHandlers();
}

/**
 * Helper to use custom handlers temporarily
 */
export function useHandlers(...customHandlers: Parameters<typeof server.use>) {
  server.use(...customHandlers);
}
