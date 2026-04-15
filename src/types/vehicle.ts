import { Direction } from './vessel';

export type GateStatus = 
  | 'PENDING_WBIN' 
  | 'WBIN_DONE' 
  | 'LOADING'
  | 'UNLOADING' 
  | 'PENDING_WBOUT' 
  | 'COMPLETED';

export interface GateEntry {
  id: number;
  gate_in_no: string;
  vessel_id: number;
  vessel_name: string;
  party_name: string;
  consignor_name: string;
  challan_invoice_no: string;
  vehicle_no: string;
  transporter_name: string;
  weighment_slip_no: string;
  own_weighbridge: 0 | 1; // 0 for No, 1 for Yes
  status: GateStatus;
  gate_in_datetime: string;
  wbin_datetime?: string | null;
  gate_out_datetime: string | null;
  direction: Direction;
  gross_weight?: number;
  tare_weight?: number;
  net_weight?: number;
  created_at?: string;
  updated_at?: string;
}
