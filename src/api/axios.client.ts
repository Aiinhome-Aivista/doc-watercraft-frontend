import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';
import { ENV } from '../config/env.config';

/**
 * Custom Axios Instance
 */
export const apiClient: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.TIMEOUT,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

/**
 * Request Interceptor
 * Adds bearer tokens to outgoing HTTP requests.
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // Dynamically retrieve the token (this ensures we catch log-ins made in session)
    const token = localStorage.getItem('access_token');
    
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response Interceptor
 * Handles global error responses safely.
 */
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    // Any status code exactly in the range of 2xx triggers this function
    return response;
  },
  (error: AxiosError) => {
    // Any status codes that fall outside the range of 2xx trigger this function
    if (error.response) {
      const { status, data } = error.response;

      switch (status) {
        case 401:
          console.warn('[API] 401 Unauthorized - Redirecting or Purging Token');
          // Example: Perform forced logout logic
          localStorage.removeItem('access_token');
          // window.location.href = '/login'; // if using standard redirects
          break;
        case 403:
          console.warn('[API] 403 Forbidden', data);
          break;
        case 404:
          console.warn('[API] 404 Not Found', data);
          break;
        case 500:
        case 502:
        case 503:
          console.error('[API] Server Error:', data);
          break;
        default:
          console.error(`[API] Unhandled Error Code (${status})`, data);
      }
    } else if (error.request) {
      // The request was made but no response was received
      console.error('[API] Network Error - No Response Received', error.request);
    } else {
      // Something happened in setting up the request
      console.error('[API] Request Setup Error', error.message);
    }

    return Promise.reject(error);
  }
);
