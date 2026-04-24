import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';

export interface VehicleMasterPayload {
  vehicle_no: string;
  transporter_name: string;
  status: 'active' | 'inactive';
}

export const vehicleMasterService = {
  createVehicleMaster: async (payload: VehicleMasterPayload) => {
    const response = await apiClient.post(ENDPOINTS.VEHICLE_MASTER.BASE, payload);
    return response.data;
  },
  getVehicleMasters: async () => {
    const response = await apiClient.get(ENDPOINTS.VEHICLE_MASTER.BASE);
    return response.data;
  },
  deleteVehicleMaster: async (id: number | string) => {
    const response = await apiClient.delete(`${ENDPOINTS.VEHICLE_MASTER.BASE}/${id}`);
    return response.data;
  },
  updateVehicleMaster: async (id: number | string, payload: Partial<VehicleMasterPayload>) => {
    const response = await apiClient.post(`${ENDPOINTS.VEHICLE_MASTER.BASE}/${id}`, payload);
    return response.data;
  },
};
