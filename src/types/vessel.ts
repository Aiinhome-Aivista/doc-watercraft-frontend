export type VesselStatus = 'PLANNED' | 'BERTHED' | 'MOORED' | 'COMPLETED';
export type Direction = 'IMPORT' | 'EXPORT';
export type CargoType = 'FLYASH' | 'COAL' | string;

export interface Vessel {
  id: number;
  vessel_auto_id: string;
  vessel_name: string;
  party_name: string;
  cargo_type: CargoType;
  quantity: number | string;
  direction: Direction;
  status: VesselStatus;
  expected_date: string;
  berthing_datetime: string | null;
  mooring_datetime: string | null;
  sailing_datetime: string | null;
  survey_quantity?: number | string | null;
  survey_datetime?: string | null;
  created_at?: string;
  updated_at?: string;
}
