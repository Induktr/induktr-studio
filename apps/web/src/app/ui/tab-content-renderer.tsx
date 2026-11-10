import { FC, Suspense, lazy } from 'react';
import type { AppTab } from '../store/navigation-slice';
import { ErrorBoundary, WidgetSuspenseFallback } from '@/shared/ui';

const LazyHomePage = lazy(() => import('@/pages/home').then((m) => ({ default: m.HomePage })));
const LazyIntakePage = lazy(() => import('@/pages/intake').then((m) => ({ default: m.IntakePage })));
const LazyAuthPage = lazy(() => import('@/pages/auth').then((m) => ({ default: m.AuthPage })));
const LazyShowcaseWidget = lazy(() =>
  import('@/widgets/showcase').then((m) => ({ default: m.ShowcaseWidget })),
);
const LazyStorefrontWidget = lazy(() =>
  import('@/widgets/storefront').then((m) => ({ default: m.StorefrontWidget })),
);
const LazyCasesWidget = lazy(() =>
  import('@/widgets/cases').then((m) => ({ default: m.CasesWidget })),
);
const LazyClientHubWidget = lazy(() =>
  import('@/widgets/client-hub').then((m) => ({ default: m.ClientHubWidget })),
);

export interface TabContentRendererProps {
  activeTab: AppTab;
  onNavigate: (tab: AppTab) => void;
}

export const TabContentRenderer: FC<TabContentRendererProps> = ({
  activeTab,
  onNavigate,
}) => {
  return (
    <ErrorBoundary key={activeTab}>
      <Suspense
        fallback={
          <WidgetSuspenseFallback
            label={`STREAMING ${activeTab.toUpperCase()} SUB-SYSTEM // HYDRATING SHARDS...`}
          />
        }
      >
        {activeTab === 'studio' && (
          <LazyHomePage
            onIntakeClick={() => onNavigate('intake')}
            onExploreSystems={() => onNavigate('systems')}
          />
        )}
        {activeTab === 'systems' && <LazyShowcaseWidget />}
        {(activeTab === 'store' || activeTab === 'knowledge') && <LazyStorefrontWidget />}
        {activeTab === 'cases' && <LazyCasesWidget />}
        {activeTab === 'client-hub' && (
          <LazyClientHubWidget
            onNavigateToAuth={() => onNavigate('auth')}
            onNavigateTab={onNavigate}
          />
        )}
        {activeTab === 'intake' && <LazyIntakePage />}
        {activeTab === 'auth' && (
          <LazyAuthPage
            onSuccess={() => onNavigate('client-hub')}
            onSuccessUserExists={() => onNavigate('client-hub')}
            onSuccessUserNotFound={() => onNavigate('intake')}
          />
        )}
      </Suspense>
    </ErrorBoundary>
  );
};
