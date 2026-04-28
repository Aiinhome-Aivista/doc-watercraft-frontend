import { apiClient } from '@/api/axios.client';
import { ENDPOINTS } from '@/api/endpoints';
import { ENV } from '@/config/env.config';

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
  bill_main_id?: number;
  bill?: GeneratedBillMain;
  details: GeneratedBillDetail[];
}

export interface PdfBillPayload {
  party_id: number;
  vessel_ids: number[];
  period_start: string;
  period_end: string;
}

export interface PdfBillResponse {
  success: boolean;
  message?: string;
  download_url?: string;
  file_name?: string;
  voucher_number?: string;
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
  pdfBill: async (payload: PdfBillPayload) => {
    const pdfBillUrl = new URL(ENDPOINTS.BILLING.PDF_BILL, ENV.API_BASE_URL).toString();
    const response = await apiClient.post<PdfBillResponse>(pdfBillUrl, payload);
    return response.data;
  },
};
