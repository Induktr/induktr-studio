import { type FC, Suspense } from 'react';
import { useAppNavigation } from '../model/use-app-navigation';
import { Header } from '@/widgets/header';
import { Footer } from '@/widgets/footer';
import { ErrorBoundary, WidgetSuspenseFallback } from '@/shared/ui';
import { TabContentRenderer } from './tab-content-renderer';

export const AppLayout: FC = () => {
  const {
    activeTab,
    leadSlug,
    footerSubtext,
    isAuthenticated,
    username,
    navigateTo,
    onInitializeClick,
  } = useAppNavigation();

  return (
    <div className="min-h-screen flex flex-col bg-bg-primary">
      <Header
        activeTab={activeTab}
        onTabChange={(tab) => navigateTo(tab as Parameters<typeof navigateTo>[0])}
        onInitializeClick={onInitializeClick}
        userVerified={isAuthenticated}
        username={username}
        activeLeadSlug={leadSlug}
      />

      <main className="flex-1 px-8 pt-14 pb-20 max-w-[1240px] mx-auto w-full">
        <ErrorBoundary>
          <Suspense fallback={<WidgetSuspenseFallback label="HYDRATING STUDIO SHELL..." />}>
            <TabContentRenderer activeTab={activeTab} onNavigate={navigateTo} />
          </Suspense>
        </ErrorBoundary>
      </main>

      <Footer subtext={footerSubtext} />
    </div>
  );
};
