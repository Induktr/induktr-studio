import { configureStore } from '@reduxjs/toolkit';
import { type TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { authReducer } from './auth-slice';
import { leadReducer } from './lead-slice';
import { navigationReducer } from './navigation-slice';
import { i18nReducer } from './i18n-slice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    lead: leadReducer,
    navigation: navigationReducer,
    i18n: i18nReducer,
  },
  devTools: import.meta.env.DEV,
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
