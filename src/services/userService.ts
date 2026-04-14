import { apiClient } from '../api/axios.client';
import { ENDPOINTS } from '../api/endpoints';
import { ApiResponse } from '../types/api.types';

// Example Interface for what the Server might return
export interface UserProfile {
  id: string | number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
}

export interface UpdateUserPayload {
  username?: string;
  email?: string;
}

/**
 * User Service
 * Encapsulates all User-related API calls.
 */
export const UserService = {
  
  /**
   * Fetch a user's profile by ID
   */
  getUserProfile: async (id: string | number): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.get<ApiResponse<UserProfile>>(ENDPOINTS.USER.PROFILE(id));
    return response.data;
  },

  /**
   * Fetch all users
   */
  getAllUsers: async (): Promise<ApiResponse<UserProfile[]>> => {
    const response = await apiClient.get<ApiResponse<UserProfile[]>>(ENDPOINTS.USER.BASE);
    return response.data;
  },

  /**
   * Update a user's profile
   */
  updateUserProfile: async (id: string | number, payload: UpdateUserPayload): Promise<ApiResponse<UserProfile>> => {
    const response = await apiClient.put<ApiResponse<UserProfile>>(ENDPOINTS.USER.PROFILE(id), payload);
    return response.data;
  },

  /**
   * Delete a user
   */
  deleteUser: async (id: string | number): Promise<ApiResponse<null>> => {
    const response = await apiClient.delete<ApiResponse<null>>(ENDPOINTS.USER.PROFILE(id));
    return response.data;
  }
};
