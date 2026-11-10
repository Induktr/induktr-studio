import type { FC } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { Provider as UrqlProvider } from 'urql';
import { store } from './store';
import { graphqlClient } from '@/shared/api';
import { AppLayout } from './ui/app-layout';

import '@/shared/styles/tokens.css';

export const App: FC = () => {
  return (
    <ReduxProvider store={store}>
      <UrqlProvider value={graphqlClient}>
        <AppLayout />
      </UrqlProvider>
    </ReduxProvider>
  );
};
