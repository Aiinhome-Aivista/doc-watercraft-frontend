import { apiClient } from '../api/axios.client';
import { ENDPOINTS } from '../api/endpoints';
import { Vessel } from '../types/vessel';

export interface GetVesselsResponse {
  success: boolean;
  data: Vessel[];
}

export const VesselService = {
  /**
   * Fetch all vessels
   */
  getAllVessels: async (): Promise<Vessel[]> => {
    // We request from ENDPOINTS.VESSEL.BASE
    const response = await apiClient.get<GetVesselsResponse>(ENDPOINTS.VESSEL.BASE);
    return response.data.data;
  },
};
