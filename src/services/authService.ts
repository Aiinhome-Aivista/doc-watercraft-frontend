import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';

export interface RegisterPayload {
  username: string;
  password?: string;
  full_name?: string;
  mobile?: string;
  email?: string;
}

export const authService = {
  /**
   * Register a new user
   */
  registerUser: async (payload: RegisterPayload) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.REGISTER, payload);
    return response.data;
  },
  
  /**
   * Login (placeholder for future use)
   */
  loginUser: async (payload: any) => {
    const response = await apiClient.post(ENDPOINTS.AUTH.LOGIN, payload);
    return response.data;
  }
};
