import { apiClient } from '../api/axios.client';
import { ENDPOINTS } from '../api/endpoints';
import { GateEntry } from '../types/vehicle';

export interface GetGateEntriesResponse {
  success: boolean;
  data: GateEntry[];
}

export interface CreateGateEntryPayload {
  vessel_id?: number | null;
  direction?: string;
  consignor_name: string;
  challan_invoice_no: string;
  vehicle_no: string;
  transporter_name: string;
  weighment_slip_no: string;
  own_weighbridge: 1 | 0;
  gross_weight?: number;
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
  gross_weight?: number;
  tare_weight?: number;
}

export interface CreateWboutPayload {
  gate_entry_id: number;
  weighment_slip_no: string;
  wbout_datetime: string;
  gross_weight?: number;
  tare_weight?: number;
}

export interface RecordGateOutPayload {
  gate_entry_id: number;
  gate_out_datetime: string;
}

export interface RecordCargoOpPayload {
  gate_entry_id: number;
  operation_type: string;
  start_datetime: string;
  end_datetime?: string;
  compressor_no?: string;
  remarks?: string;
  vessel_id?: number;
}

export interface UpdateCargoOpPayload {
  operation_id: number;
  gate_entry_id: number;
  operation_type: string;
  end_datetime: string;
  compressor_no?: string;
  remarks?: string;
  vessel_id?: number;
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

  /**
   * Record Cargo Operation
   */
  recordCargoOperation: async (payload: RecordCargoOpPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VEHICLE.CARGO_OPS, payload);
    return response.data;
  },

  /**
   * Update Cargo Operation
   */
  updateCargoOperation: async (payload: UpdateCargoOpPayload): Promise<GenericStatusResponse> => {
    const { operation_id, ...body } = payload;
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VEHICLE.CARGO_OP_DETAIL(operation_id), body);
    return response.data;
  },

  recordWbout: async (payload: CreateWboutPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.WEIGHBRIDGE.WBOUT, payload);
    return response.data;
  },

  /**
   * Record Gate Out
   */
  recordGateOut: async (payload: RecordGateOutPayload): Promise<GenericStatusResponse> => {
    const { gate_entry_id, gate_out_datetime } = payload;
    const response = await apiClient.post<GenericStatusResponse>(`/gate-entries/${gate_entry_id}/gate-out`, { gate_out_datetime });
    return response.data;
  },
};
