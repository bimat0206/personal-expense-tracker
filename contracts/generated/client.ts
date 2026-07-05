import createClient from 'openapi-fetch';
import type { paths } from './types';

// The base URL can be configured by the consumer. Defaulting to empty string means it will be a relative path,
// which is perfect for a frontend client that uses a local dev proxy (e.g., Vite proxying /api to the backend).
export const apiClient = createClient<paths>({
  baseUrl: '/',
});
