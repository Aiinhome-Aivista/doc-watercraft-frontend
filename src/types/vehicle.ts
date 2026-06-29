import { Direction } from './vessel';

export type GateStatus = 
  | 'PENDING_WBIN' 
  | 'WBIN_DONE' 
  | 'LOADING'
  | 'UNLOADING' 
  | 'PENDING_WBOUT'
  | 'GATE_OUT'
  | 'COMPLETED';

export interface GateEntry {
  id: number;
  cargo_operation_id?: number | null;
  cargo_start_datetime?: string | null;
  cargo_end_datetime?: string | null;
  supplier_name?: string | null;
  gate_in_no: string;
  vessel_id?: number | null;
  vessel_name?: string | null;
  party_id?: number | null;
  party_code?: string | null;
  party_name?: string | null;
  consignor_name?: string | null;
  challan_invoice_no: string;
  compressor_no?: string | null;
  vehicle_id?: number | null;
  vehicle_no: string;
  transporter_name?: string | null;
  outside_payment_slip?: string | null;
  weighment_slip_no?: string | null;
  outside_gross_weight?: number | string | null;
  outside_tare_weight?: number | string | null;
  outside_net_weight?: number | string | null;
  wbin_gross_weight?: number | string | null;
  wbin_tare_weight?: number | string | null;
  wbout_gross_weight?: number | string | null;
  wbout_tare_weight?: number | string | null;
  own_weighbridge: 0 | 1;
  status: GateStatus;
  gate_in_datetime: string;
  wbin_datetime?: string | null;
  gate_out_datetime?: string | null;
  direction: Direction | string;
  vessel_direction?: string | null;
  gross_weight?: number | null;
  tare_weight?: number | null;
  net_weight?: number | null;
  berthing_datetime?: string | null;
  mooring_datetime?: string | null;
  driver_name?: string | null;
  driver_mob_no?: string | null;
  created_at?: string;
  updated_at?: string;
}
