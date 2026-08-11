/**
 * Centralized Environment Configuration
 * Safe mapping of process environment variables for UI to consume.
 */
export const ENV = {
  // Use Vite's `import.meta.env`
  // API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api/v1',
  API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'http://165.101.183.152:5001/api/v1',
  // API_BASE_URL: import.meta.env.VITE_API_BASE_URL || 'https://aiinhome.com/haldiamultimodalv2/api/v1',
  API_VERSION: import.meta.env.VITE_API_VERSION || 'v1',
  IS_PROD: import.meta.env.MODE === 'production',
  IS_DEV: import.meta.env.MODE === 'development',
  TIMEOUT: Number(import.meta.env.VITE_API_TIMEOUT) || 30000,
} as const;
