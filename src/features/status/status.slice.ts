import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { StatusGroup } from './status.api.slice';

type StatusWindow = 'create-status' | 'view-status' | null;
interface InitialState {
  statusWindow: StatusWindow;
  selectedStatusToView: StatusGroup | null;
}

const initialState: InitialState = {
  statusWindow: "view-status",
  selectedStatusToView: null,
};

export const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    setStatusWindow: (state, action: PayloadAction<{ statusWindow: StatusWindow }>) => {
      state.statusWindow = action.payload.statusWindow;
    },

    setSelectedStatusToView: (
      state,
      action: PayloadAction<{ selectedStatusToView: StatusGroup | null }>,
    ) => {
      state.selectedStatusToView = action.payload.selectedStatusToView;
    },
  },
});

export const { setStatusWindow, setSelectedStatusToView } = statusSlice.actions;
export default statusSlice;
