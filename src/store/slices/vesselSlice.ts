import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Vessel, VesselStatus } from '@/types/vessel';
import { mockVessels } from '@/services/mockData';

interface VesselState {
  items: Vessel[];
  loading: boolean;
  error: string | null;
}

const initialState: VesselState = {
  items: mockVessels,
  loading: false,
  error: null,
};

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
});

export const { addVessel, updateVesselStatus, updateSurveyReport, setVessels } = vesselSlice.actions;
export default vesselSlice.reducer;
