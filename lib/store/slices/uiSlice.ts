import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface UiState {
  sidebarOpen: boolean;
  modalOpen: boolean;
  activeModal: string | null;
}

const initialState: UiState = {
  sidebarOpen: false,
  modalOpen: false,
  activeModal: null,
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    openModal: (state, action: PayloadAction<string>) => {
      state.modalOpen = true;
      state.activeModal = action.payload;
    },
    closeModal: (state) => {
      state.modalOpen = false;
      state.activeModal = null;
    },
  },
});

export const { toggleSidebar, openModal, closeModal } = uiSlice.actions;
export default uiSlice.reducer;

