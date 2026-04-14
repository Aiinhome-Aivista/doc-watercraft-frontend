import { apiClient } from '../api/axios.client';
import { ENDPOINTS } from '../api/endpoints';
import { GateEntry } from '../types/vehicle';

export interface GetGateEntriesResponse {
  success: boolean;
  data: GateEntry[];
}

export interface CreateGateEntryPayload {
  vessel_id: number;
  consignor_name: string;
  challan_invoice_no: string;
  vehicle_no: string;
  transporter_name: string;
  weighment_slip_no: string;
  own_weighbridge: 1 | 0;
  gate_in_datetime: string;
}

export interface CreateGateEntryResponse {
  success: boolean;
  message: string;
  data: GateEntry;
}

export interface CreateWbinPayload {
  gate_entry_id: number;
  weighment_slip_no: string;
  wbin_datetime: string;
  gross_weight: number;
  tare_weight: number;
}

export interface GenericStatusResponse {
  success: boolean;
  message: string;
}

export const VehicleService = {
  /**
   * Fetch all gate entries
   */
  getAllGateEntries: async (): Promise<GateEntry[]> => {
    const response = await apiClient.get<GetGateEntriesResponse>(ENDPOINTS.VEHICLE.GATE_ENTRIES);
    return response.data.data;
  },

  /**
   * Create a new gate entry
   */
  createGateEntry: async (payload: CreateGateEntryPayload): Promise<GateEntry> => {
    const response = await apiClient.post<CreateGateEntryResponse>(ENDPOINTS.VEHICLE.GATE_ENTRIES, payload);
    return response.data.data;
  },

  /**
   * Record WBIN
   */
  recordWbin: async (payload: CreateWbinPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.WEIGHBRIDGE.WBIN, payload);
    return response.data;
  },
};
