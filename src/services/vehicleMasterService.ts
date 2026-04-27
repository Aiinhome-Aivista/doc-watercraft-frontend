import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';

export interface VehicleMasterPayload {
  vehicle_no: string;
  transporter_name: string;
  active: number;
}

export const vehicleMasterService = {
  createVehicleMaster: async (payload: VehicleMasterPayload) => {
    const response = await apiClient.post(ENDPOINTS.VEHICLE.BASE, payload);
    return response.data;
  },
  getVehicleMasters: async () => {
    const response = await apiClient.get(ENDPOINTS.VEHICLE.BASE);
    return response.data;
  },
  deleteVehicleMaster: async (id: number | string) => {
    const response = await apiClient.delete(`${ENDPOINTS.VEHICLE.BASE}/${id}`);
    return response.data;
  },
  updateVehicleMaster: async (id: number | string, payload: Partial<VehicleMasterPayload>) => {
    const response = await apiClient.put(`${ENDPOINTS.VEHICLE.BASE}/${id}`, payload);
    return response.data;
  },
  toggleVehicleStatus: async (id: number | string) => {
    const response = await apiClient.patch(`${ENDPOINTS.VEHICLE.BASE}/${id}/toggle`);
    return response.data;
  },
};
