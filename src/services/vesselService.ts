import { apiClient } from '../api/axios.client';
import { ENDPOINTS } from '../api/endpoints';
import { Vessel } from '../types/vessel';

export interface GetVesselsResponse {
  success: boolean;
  data: Vessel[];
}

export interface VesselRate {
  activity: string;
  formula: string;
  rate: number;
  gst_rate: number;
  min_qty: number;
  max_qty: number;
}

export interface CreateVesselPayload {
  vessel_name: string;
  party_id: number;
  cargo_type: string;
  quantity: number;
  direction: string;
  expected_date: string;
  rates: VesselRate[];
}

export interface CreateVesselResponse {
  success: boolean;
  message: string;
  data: Vessel;
}

export interface BerthVesselPayload {
  berthing_datetime: string;
}

export interface MoorVesselPayload {
  mooring_datetime: string;
}

export interface SurveyVesselPayload {
  survey_quantity: number;
  survey_datetime: string;
}

export interface UnberthVesselPayload {
  sailing_datetime: string;
}

export interface GenericStatusResponse {
  success: boolean;
  message: string;
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

  /**
   * Create a new vessel
   */
  createVessel: async (payload: CreateVesselPayload): Promise<Vessel> => {
    const response = await apiClient.post<CreateVesselResponse>(ENDPOINTS.VESSEL.BASE, payload);
    return response.data.data;
  },

  /**
   * Berth a vessel
   */
  berthVessel: async (id: number | string, payload: BerthVesselPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VESSEL.BERTH(id), payload);
    return response.data;
  },

  /**
   * Moor a vessel
   */
  moorVessel: async (id: number | string, payload: MoorVesselPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VESSEL.MOOR(id), payload);
    return response.data;
  },

  /**
   * Record vessel survey
   */
  surveyVessel: async (id: number | string, payload: SurveyVesselPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VESSEL.SURVEY(id), payload);
    return response.data;
  },

  /**
   * Unberth/Sail a vessel
   */
  unberthVessel: async (id: number | string, payload: UnberthVesselPayload): Promise<GenericStatusResponse> => {
    const response = await apiClient.post<GenericStatusResponse>(ENDPOINTS.VESSEL.UNBERTH(id), payload);
    return response.data;
  },
};
