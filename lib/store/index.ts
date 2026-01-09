import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import { baseApi } from '@/lib/api/baseApi';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';

// Persist config - keeps API cache in localStorage
const persistConfig = {
  key: 'dolabb-cache',
  storage,
  whitelist: [baseApi.reducerPath], // Only persist API cache
  // Expire cache after 10 minutes of inactivity
  timeout: 600000,
};

const rootReducer = combineReducers({
  [baseApi.reducerPath]: baseApi.reducer,
  auth: authReducer,
  ui: uiReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const makeStore = () => {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
        },
      }).concat(baseApi.middleware),
  });

  // Enable refetch on focus/reconnect listeners
  setupListeners(store.dispatch);

  return store;
};

export const makePersistedStore = () => {
  const store = makeStore();
  const persistor = persistStore(store);
  return { store, persistor };
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
