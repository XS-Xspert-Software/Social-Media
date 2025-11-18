/**
 * API Config Index
 * 
 * This is the main entry point for all API-related imports.
 * Import everything you need from here for convenience.
 * 
 * @example
 * // Import what you need
 * import { ENDPOINTS, apiRequest } from '@/config';
 * 
 * // Or import everything
 * import * as API from '@/config';
 * 
 * // Usage
 * const posts = await apiRequest(ENDPOINTS.posts.getPosts);
 */

export { 
  API_BASE_URLS, 
  ENDPOINTS, 
  apiRequest, 
  buildUrl 
} from './api';

// Re-export default for backward compatibility
export { default } from './api';
