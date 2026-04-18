import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { GateEntry, GateStatus } from '@/types/vehicle';
import { VehicleService, CreateGateEntryPayload, CreateWbinPayload, RecordCargoOpPayload, UpdateCargoOpPayload, CreateWboutPayload, RecordGateOutPayload } from '@/services/vehicleService';

interface VehicleState {
  entries: GateEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: VehicleState = {
  entries: [],
  loading: false,
  error: null,
};

export const fetchGateEntries = createAsyncThunk(
  'vehicles/fetchGateEntries',
  async (_, { rejectWithValue }) => {
    try {
      const data = await VehicleService.getAllGateEntries();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch gate entries');
    }
  }
);

export const createGateEntryThunk = createAsyncThunk(
  'vehicles/createGateEntry',
  async (payload: CreateGateEntryPayload, { rejectWithValue }) => {
    try {
      const data = await VehicleService.createGateEntry(payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create gate entry');
    }
  }
);

export const recordWbinThunk = createAsyncThunk(
  'vehicles/recordWbin',
  async (payload: CreateWbinPayload, { rejectWithValue }) => {
    try {
      await VehicleService.recordWbin(payload);
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record WBIN');
    }
  }
);

export const recordCargoOpThunk = createAsyncThunk(
  'vehicles/recordCargoOp',
  async (payload: RecordCargoOpPayload | UpdateCargoOpPayload, { rejectWithValue }) => {
    try {
      if ('operation_id' in payload && payload.operation_id !== undefined) {
        await VehicleService.updateCargoOperation(payload as UpdateCargoOpPayload);
      } else {
        await VehicleService.recordCargoOperation(payload as RecordCargoOpPayload);
      }
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record cargo operation');
    }
  }
);

export const recordWboutThunk = createAsyncThunk(
  'vehicles/recordWbout',
  async (payload: CreateWboutPayload, { rejectWithValue }) => {
    try {
      await VehicleService.recordWbout(payload);
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record WBOUT');
    }
  }
);

export const recordGateOutThunk = createAsyncThunk(
  'vehicles/recordGateOut',
  async (payload: RecordGateOutPayload, { rejectWithValue }) => {
    try {
      await VehicleService.recordGateOut(payload);
      return payload;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record Gate Out');
    }
  }
);

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
  extraReducers: (builder) => {
    builder
      .addCase(fetchGateEntries.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchGateEntries.fulfilled, (state, action) => {
        state.loading = false;
        state.entries = action.payload;
      })
      .addCase(fetchGateEntries.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(createGateEntryThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createGateEntryThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.entries.push(action.payload);
      })
      .addCase(createGateEntryThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordWbinThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordWbinThunk.fulfilled, (state, action) => {
        state.loading = false;
        const entry = state.entries.find((e) => e.id === action.payload.gate_entry_id);
        if (entry) {
          entry.status = 'WBIN_DONE';
          entry.wbin_datetime = action.payload.wbin_datetime;
          entry.weighment_slip_no = action.payload.weighment_slip_no;
          if (action.payload.gross_weight !== undefined) {
            entry.gross_weight = action.payload.gross_weight;
          }
          if (action.payload.tare_weight !== undefined) {
            entry.tare_weight = action.payload.tare_weight;
          }
          if (action.payload.gross_weight !== undefined && action.payload.tare_weight !== undefined) {
            entry.net_weight = action.payload.gross_weight - action.payload.tare_weight;
          }
        }
      })
      .addCase(recordWbinThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordCargoOpThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordCargoOpThunk.fulfilled, (state, action) => {
        state.loading = false;
        const entry = state.entries.find((e) => e.id === action.payload.gate_entry_id);
        if (entry) {
          entry.status = 'PENDING_WBOUT';
        }
      })
      .addCase(recordCargoOpThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordWboutThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordWboutThunk.fulfilled, (state, action) => {
        state.loading = false;
        const entry = state.entries.find((e) => e.id === action.payload.gate_entry_id);
        if (entry) {
          entry.status = 'GATE_OUT'; // WBOUT complete implies waiting for gate out
          entry.weighment_slip_no = action.payload.weighment_slip_no;
          if (action.payload.gross_weight !== undefined) {
            entry.gross_weight = action.payload.gross_weight;
          }
          if (action.payload.tare_weight !== undefined) {
            entry.tare_weight = action.payload.tare_weight;
          }
          if (action.payload.gross_weight !== undefined && action.payload.tare_weight !== undefined) {
            entry.net_weight = action.payload.gross_weight - action.payload.tare_weight;
          }
        }
      })
      .addCase(recordWboutThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(recordGateOutThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(recordGateOutThunk.fulfilled, (state, action) => {
        state.loading = false;
        const entry = state.entries.find((e) => e.id === action.payload.gate_entry_id);
        if (entry) {
          entry.status = 'COMPLETED';
          entry.gate_out_datetime = action.payload.gate_out_datetime;
        }
      })
      .addCase(recordGateOutThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addGateEntry, updateGateStatus, setGateEntries } = vehicleSlice.actions;
export default vehicleSlice.reducer;
