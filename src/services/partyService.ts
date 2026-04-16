import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';

export interface PartyMasterPayload {
  party_name: string;
  party_code: string;
  address: string;
  state: string;
  country: string;
  pincode: string;
  mobiles: string[];
  emails: string[];
}

export const partyService = {
  /**
   * Create a new party master record.
   */
  createPartyMaster: async (payload: PartyMasterPayload) => {
    const response = await apiClient.post(ENDPOINTS.PARTY_MASTER.BASE, payload);
    return response.data;
  },
  /**
   * Fetch all party master records.
   */
  getPartyMasters: async () => {
    const response = await apiClient.get(ENDPOINTS.PARTY_MASTER.BASE);
    return response.data;
  },
  /**
   * Delete a party master record by ID.
   */
  deletePartyMaster: async (id: number | string) => {
    const response = await apiClient.delete(`${ENDPOINTS.PARTY_MASTER.BASE}/${id}`);
    return response.data;
  },
  /**
   * Update a party master record by ID.
   */
  updatePartyMaster: async (id: number | string, payload: Partial<PartyMasterPayload>) => {
    const response = await apiClient.post(`${ENDPOINTS.PARTY_MASTER.BASE}/${id}`, payload);
    return response.data;
  },
};
