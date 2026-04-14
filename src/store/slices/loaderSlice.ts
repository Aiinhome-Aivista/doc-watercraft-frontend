import { AnyAction, createSlice } from '@reduxjs/toolkit';

interface LoaderState {
  pendingRequests: number;
}

const initialState: LoaderState = {
  pendingRequests: 0,
};

const isPendingAction = (action: AnyAction): boolean =>
  typeof action.type === 'string' && action.type.endsWith('/pending');

const isSettledAction = (action: AnyAction): boolean =>
  typeof action.type === 'string' &&
  (action.type.endsWith('/fulfilled') || action.type.endsWith('/rejected'));

const loaderSlice = createSlice({
  name: 'loader',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addMatcher(isPendingAction, (state) => {
        state.pendingRequests += 1;
      })
      .addMatcher(isSettledAction, (state) => {
        state.pendingRequests = Math.max(0, state.pendingRequests - 1);
      });
  },
});

export default loaderSlice.reducer;
