import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Vessel, VesselStatus } from '@/types/vessel';
import { VesselService, CreateVesselPayload, BerthVesselPayload, MoorVesselPayload, SurveyVesselPayload, UnberthVesselPayload } from '@/services/vesselService';

interface VesselState {
  items: Vessel[];
  loading: boolean;
  error: string | null;
}

const initialState: VesselState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchVessels = createAsyncThunk(
  'vessels/fetchVessels',
  async (_, { rejectWithValue }) => {
    try {
      const data = await VesselService.getAllVessels();
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch vessels');
    }
  }
);

export const createVesselThunk = createAsyncThunk(
  'vessels/createVessel',
  async (payload: CreateVesselPayload, { rejectWithValue }) => {
    try {
      const data = await VesselService.createVessel(payload);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create vessel');
    }
  }
);

export const berthVesselThunk = createAsyncThunk(
  'vessels/berthVessel',
  async ({ id, payload }: { id: number | string; payload: BerthVesselPayload }, { rejectWithValue }) => {
    try {
      await VesselService.berthVessel(id, payload);
      return { id, datetime: payload.berthing_datetime };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to berth vessel');
    }
  }
);

export const moorVesselThunk = createAsyncThunk(
  'vessels/moorVessel',
  async ({ id, payload }: { id: number | string; payload: MoorVesselPayload }, { rejectWithValue }) => {
    try {
      await VesselService.moorVessel(id, payload);
      return { id, datetime: payload.mooring_datetime };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to moor vessel');
    }
  }
);

export const surveyVesselThunk = createAsyncThunk(
  'vessels/surveyVessel',
  async ({ id, payload }: { id: number | string; payload: SurveyVesselPayload }, { rejectWithValue }) => {
    try {
      await VesselService.surveyVessel(id, payload);
      return { id, qty: payload.survey_quantity, datetime: payload.survey_datetime };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to record survey');
    }
  }
);

export const unberthVesselThunk = createAsyncThunk(
  'vessels/unberthVessel',
  async ({ id, payload }: { id: number | string; payload: UnberthVesselPayload }, { rejectWithValue }) => {
    try {
      await VesselService.unberthVessel(id, payload);
      return { id, datetime: payload.sailing_datetime };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to unberth vessel');
    }
  }
);

const vesselSlice = createSlice({
  name: 'vessels',
  initialState,
  reducers: {
    addVessel: (state, action: PayloadAction<Vessel>) => {
      state.items.push(action.payload);
    },
    updateVesselStatus: (
      state, 
      action: PayloadAction<{ id: number; status: VesselStatus; datetime?: string }>
    ) => {
      const vessel = state.items.find((v) => v.id === action.payload.id);
      if (vessel) {
        vessel.status = action.payload.status;
        if (action.payload.status === 'BERTHED') {
          vessel.berthing_datetime = action.payload.datetime || null;
        } else if (action.payload.status === 'MOORED') {
          vessel.mooring_datetime = action.payload.datetime || null;
        } else if (action.payload.status === 'COMPLETED') {
          vessel.sailing_datetime = action.payload.datetime || null;
        }
      }
    },
    updateSurveyReport: (
      state,
      action: PayloadAction<{ id: number; surveyQty: number; datetime: string }>
    ) => {
      const vessel = state.items.find((v) => v.id === action.payload.id);
      if (vessel) {
        vessel.survey_quantity = action.payload.surveyQty;
        vessel.survey_datetime = action.payload.datetime;
      }
    },
    setVessels: (state, action: PayloadAction<Vessel[]>) => {
      state.items = action.payload;
    }
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchVessels.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchVessels.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload;
      })
      .addCase(fetchVessels.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create
      .addCase(createVesselThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createVesselThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items.push(action.payload);
      })
      .addCase(createVesselThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Berth Vessel
      .addCase(berthVesselThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(berthVesselThunk.fulfilled, (state, action) => {
        state.loading = false;
        const vessel = state.items.find((v) => v.id === action.payload.id);
        if (vessel) {
          vessel.status = 'BERTHED';
          vessel.berthing_datetime = action.payload.datetime;
        }
      })
      .addCase(berthVesselThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Moor Vessel
      .addCase(moorVesselThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(moorVesselThunk.fulfilled, (state, action) => {
        state.loading = false;
        const vessel = state.items.find((v) => v.id === action.payload.id);
        if (vessel) {
          vessel.status = 'MOORED';
          vessel.mooring_datetime = action.payload.datetime;
        }
      })
      .addCase(moorVesselThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Survey Vessel
      .addCase(surveyVesselThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(surveyVesselThunk.fulfilled, (state, action) => {
        state.loading = false;
        const vessel = state.items.find((v) => v.id === action.payload.id);
        if (vessel) {
          vessel.survey_quantity = action.payload.qty;
          vessel.survey_datetime = action.payload.datetime;
        }
      })
      .addCase(surveyVesselThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Unberth Vessel
      .addCase(unberthVesselThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unberthVesselThunk.fulfilled, (state, action) => {
        state.loading = false;
        const vessel = state.items.find((v) => v.id === action.payload.id);
        if (vessel) {
          vessel.status = 'COMPLETED';
          vessel.sailing_datetime = action.payload.datetime;
        }
      })
      .addCase(unberthVesselThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { addVessel, updateVesselStatus, updateSurveyReport, setVessels } = vesselSlice.actions;
export default vesselSlice.reducer;
