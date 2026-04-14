import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { Vessel, VesselStatus } from '@/types/vessel';
import { VesselService } from '@/services/vesselService';

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
      });
  },
});

export const { addVessel, updateVesselStatus, updateSurveyReport, setVessels } = vesselSlice.actions;
export default vesselSlice.reducer;
