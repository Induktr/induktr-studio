import { Client, cacheExchange, fetchExchange } from 'urql';

export const graphqlClient = new Client({
  url:
    import.meta.env.VITE_GRAPHQL_ENDPOINT ||
    (typeof window !== 'undefined' ? '/graphql' : 'http://localhost:4000/graphql'),
  exchanges: [cacheExchange, fetchExchange],
  fetchOptions: () => {
    interface TelegramWindow extends Window {
      Telegram?: {
        WebApp?: {
          initData?: string;
        };
      };
    }

    const headers: Record<string, string> = {};

    if (typeof window !== 'undefined') {
      const tgInitData = (window as unknown as TelegramWindow).Telegram?.WebApp?.initData;
      if (tgInitData) {
        headers['x-telegram-init-data'] = tgInitData;
      }

      try {
        const token = localStorage.getItem('induktr_auth_token');
        if (token) {
          headers.Authorization = `Bearer ${token}`;
        }
      } catch {}
    }

    return { headers };
  },
});
