import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { GateEntry, GateStatus } from '@/types/vehicle';
import { mockGateEntries } from '@/services/mockData';

interface VehicleState {
  entries: GateEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  entries: mockGateEntries,
  loading: false,
  error: null,
};

const vehicleSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    addGateEntry: (state, action: PayloadAction<GateEntry>) => {
      state.entries.push(action.payload);
    },
    updateGateStatus: (
      state,
      action: PayloadAction<{
        id: number;
        status: GateStatus;
        datetime?: string;
        wbin_datetime?: string;
        weighment_slip_no?: string;
        gross_weight?: number;
        tare_weight?: number;
        net_weight?: number;
      }>
    ) => {
      const entry = state.entries.find((e) => e.id === action.payload.id);
      if (entry) {
        entry.status = action.payload.status;
        if (action.payload.weighment_slip_no !== undefined) {
          entry.weighment_slip_no = action.payload.weighment_slip_no;
        }
        if (action.payload.gross_weight !== undefined) {
          entry.gross_weight = action.payload.gross_weight;
        }
        if (action.payload.tare_weight !== undefined) {
          entry.tare_weight = action.payload.tare_weight;
        }
        if (action.payload.net_weight !== undefined) {
          entry.net_weight = action.payload.net_weight;
        }
        if (action.payload.wbin_datetime !== undefined) {
          entry.wbin_datetime = action.payload.wbin_datetime;
        }
        if (action.payload.status === 'WBIN_DONE') {
          entry.wbin_datetime = action.payload.datetime || null;
        }
        if (action.payload.status === 'COMPLETED') {
          entry.gate_out_datetime = action.payload.datetime || null;
        }
      }
    },
    setGateEntries: (state, action: PayloadAction<GateEntry[]>) => {
      state.entries = action.payload;
    }
  },
});

export const { addGateEntry, updateGateStatus, setGateEntries } = vehicleSlice.actions;
export default vehicleSlice.reducer;
