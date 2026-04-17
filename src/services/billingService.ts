import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';

export interface BillingVesselPayload {
  party_id: number;
  period_start: string;
  period_end: string;
}

export interface BillingVesselDTO {
  quantity: string;
  sailing_datetime: string;
  vessel_auto_id: string;
  vessel_id: number;
  vessel_name: string;
}

export interface BillingVesselResponse {
  success: boolean;
  data: BillingVesselDTO[];
}

export interface GenerateBillPayload {
  party_id: number;
  vessel_id: number;
  period_start: string;
  period_end: string;
}

export interface GeneratedBillMain {
  id: number;
  voucher_number: string;
  total_bill_value: string;
  bill_base_value: string;
  igst: string;
  cgst: string;
  sgst: string;
  round_off: string;
}

export interface GeneratedBillDetail {
  id: number;
  vessel_id: number;
  activity_name: string;
  qty: number;
  rate: number;
  amount: number;
  gst_rate: number;
  gst_amount: number;
}

export interface GenerateBillResponse {
  success: boolean;
  bill: GeneratedBillMain;
  details: GeneratedBillDetail[];
}

export const billingService = {
  getVesselsForBilling: async (payload: BillingVesselPayload) => {
    const response = await apiClient.post<BillingVesselResponse>(ENDPOINTS.BILLING.VESSELS, payload);
    return response.data;
  },
  generateBill: async (payload: GenerateBillPayload) => {
    const response = await apiClient.post<GenerateBillResponse>(ENDPOINTS.BILLING.GENERATE, payload);
    return response.data;
  },
};
