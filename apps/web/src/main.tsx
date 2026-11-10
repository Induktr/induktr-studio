import { scan } from 'react-scan';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router';
import { NuqsAdapter } from 'nuqs/adapters/react-router/v8';
import { App } from './app/App';
import { store } from './app/store';
import { initLocale } from './app/store/i18n-slice';
import { detectLocale, i18nStore } from './shared/i18n';

const initialLocale = detectLocale();
store.dispatch(initLocale(initialLocale));
void i18nStore.switchLocale(initialLocale);

if (typeof window !== 'undefined' && import.meta.env.DEV) {
  scan({
    enabled: true,
    log: true,
  });
}

const rootElement = document.getElementById('root');
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <BrowserRouter>
      <NuqsAdapter>
        <App />
      </NuqsAdapter>
    </BrowserRouter>,
  );
}
