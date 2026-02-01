import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { LocalStorage } from '../../utils';

type StatusWindow = 'create-status' | 'view-status' | null;
interface InitialState {
  statusWindow: StatusWindow;
}

const initialState: InitialState = {
  statusWindow: LocalStorage.get('statusWindow') || null,
};

export const statusSlice = createSlice({
  name: 'status',
  initialState,
  reducers: {
    setStatusWindow: (state, action: PayloadAction<{ statusWindow: StatusWindow }>) => {
      state.statusWindow = action.payload.statusWindow;
      LocalStorage.set('statusWindow', state.statusWindow);
    },
  },
});

export const { setStatusWindow } = statusSlice.actions;
export default statusSlice;
