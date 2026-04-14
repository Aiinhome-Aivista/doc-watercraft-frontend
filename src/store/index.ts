import { configureStore } from '@reduxjs/toolkit';
import vesselReducer from './slices/vesselSlice';
import vehicleReducer from './slices/vehicleSlice';
import loaderReducer from './slices/loaderSlice';

export const store = configureStore({
  reducer: {
    vessels: vesselReducer,
    vehicles: vehicleReducer,
    loader: loaderReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
