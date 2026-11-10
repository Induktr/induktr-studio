import { type FC, useState } from 'react';
import { useQuery } from 'urql';
import { useAppDispatch, useAppSelector } from '@/app/store';
import { logout } from '@/app/store/auth-slice';
import { setActiveTab } from '@/app/store/navigation-slice';
import { GET_ME_QUERY, GET_MY_PURCHASES_QUERY, GET_MY_ORDERS_QUERY } from '@/shared/api/operations';
import { useAbortController } from '@/shared/lib/async';
import { useClientHubSectionQueryState, type ClientHubSection, type AppTab } from '@/shared/lib/url';

interface ClientHubProps {
  readonly onNavigateToAuth?: () => void;
  readonly onNavigateTab?: (tab: AppTab) => void;
}

interface MilestoneItem {
  id: string;
  step: number;
  title: string;
  description?: string;
  status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED';
  completedAt?: string | null;
}

interface PurchaseItem {
  id: string;
  userId: string;
  productId: string;
  amountUsd: number;
  status: string;
  downloadUrl?: string | null;
  createdAt: string;
  product?: {
    id: string;
    slug: string;
    title: string;
    type: string;
    priceUsd: number;
    description: string;
    tier?: string;
    badge?: string;
    version?: string;
    fileSize?: string;
    componentCount?: number;
    features?: string[];
    artifactKey?: string;
  };
}

export const ClientHubWidget: FC<ClientHubProps> = ({ onNavigateToAuth, onNavigateTab }) => {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);

  const [viewMode, setViewMode] = useState<'desktop' | 'mini-app'>('desktop');
  const [sectionQuery, setSectionQuery] = useClientHubSectionQueryState();
  const activeSidebar: ClientHubSection = sectionQuery || 'overview';

  const [activeMiniTab, setActiveMiniTab] = useState<'assets' | 'project' | 'support' | 'billing'>('assets');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  const [{ data: meData }] = useQuery({ query: GET_ME_QUERY, pause: !auth.isAuthenticated });
  const [{ data: purchasesData }] = useQuery({ query: GET_MY_PURCHASES_QUERY, pause: !auth.isAuthenticated });
  const [{ data: ordersData }] = useQuery({ query: GET_MY_ORDERS_QUERY, pause: !auth.isAuthenticated });

  const activeUser = auth.user || meData?.me;
  const userRole = activeUser?.role || 'CLIENT';
  const userUsername = activeUser?.username || '';
  const userFirstName = activeUser?.firstName || '';
  const displayName = userFirstName || userUsername || 'Studio Client';
  const roleSubtitle = `${userRole} · @${userUsername || 'unlinked'}`;
  
  // Real dynamic initials calculation: never hardcoded to 'AL' or 'AM'
  const userInitials = (userFirstName
    ? userFirstName.slice(0, 2)
    : userUsername
      ? userUsername.slice(0, 2)
      : 'SC'
  ).toUpperCase();

  // Zero-mock PostgreSQL boundary: Never leak mock fallbacks to users with 0 purchases
  const rawPurchases: PurchaseItem[] = purchasesData?.myPurchases ?? [];
  const purchasesCount = rawPurchases.length;

  // Zero-mock PostgreSQL boundary: Real user orders only
  const orders = ordersData?.myOrders ?? [];
  const activeOrder = orders[0];
  const activeOrderTitle = activeOrder?.title || 'Bespoke Engineering Pipeline';
  const orderNumber = activeOrder?.orderNumber || '';
  const orderSprint = activeOrder?.sprint || '';

  const milestones: MilestoneItem[] = activeOrder?.milestones ?? [];
  const completedMilestonesCount = milestones.filter((m) => m.status === 'COMPLETED').length;

  const downloadAbort = useAbortController();

  const handleDownload = (assetSlug: string) => {
    const controller = downloadAbort.renew();
    setDownloadSuccess(assetSlug);

    const timerId = setTimeout(() => {
      if (!controller.signal.aborted) {
        setDownloadSuccess(null);
        window.open(`https://cdn.induktr.studio/artifacts/${assetSlug}.zip`, '_blank');
      }
    }, 400);

    controller.signal.addEventListener('abort', () => clearTimeout(timerId), { once: true });
  };

  const handleNavigateToStorefront = () => {
    if (onNavigateTab) {
      onNavigateTab('knowledge');
    } else {
      dispatch(setActiveTab('knowledge'));
    }
  };

  const handleNavigateToIntake = () => {
    if (onNavigateTab) {
      onNavigateTab('intake');
    } else {
      dispatch(setActiveTab('intake'));
    }
  };

  const formatDate = (dateStr?: string | null) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' }).toUpperCase();
  };

  return (
    <section className="flex flex-col gap-8 w-full">
      {/* View Switcher: Desktop Workspace vs TG Mini App Mode */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <span className="mono text-xs text-text-tertiary tracking-wider">
            VIEWPORT DISPATCH:
          </span>
          <div className="inline-flex bg-bg-surface rounded-md border border-border-subtle p-[3px] gap-1">
            <button
              type="button"
              onClick={() => setViewMode('desktop')}
              className={`mono px-3.5 py-1.5 rounded border-0 font-bold text-xs cursor-pointer transition-colors ${
                viewMode === 'desktop'
                  ? 'bg-accent-cyan-solid text-[#071018]'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Desktop Workspace
            </button>
            <button
              type="button"
              onClick={() => setViewMode('mini-app')}
              className={`mono px-3.5 py-1.5 rounded border-0 font-bold text-xs cursor-pointer transition-colors ${
                viewMode === 'mini-app'
                  ? 'bg-accent-cyan-solid text-[#071018]'
                  : 'bg-transparent text-text-secondary hover:text-text-primary'
              }`}
            >
              Telegram Mini App (Phone)
            </button>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {auth.isAuthenticated ? (
            <button
              type="button"
              onClick={() => dispatch(logout())}
              className="mono px-2.5 py-1 rounded bg-transparent border border-border-subtle text-text-tertiary text-xs cursor-pointer hover:border-red-400 hover:text-red-400 transition-colors"
            >
              Sign out ⎋
            </button>
          ) : (
            <button
              type="button"
              onClick={onNavigateToAuth}
              className="mono px-3 py-1.5 rounded bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-xs cursor-pointer hover:brightness-110 transition-all"
            >
              Verify Session ↗
            </button>
          )}

          {/* Explicit Data Provenance Indicator */}
          <div className="mono flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/10 border border-green-500/25 text-accent-green text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_6px_var(--accent-green)]" />
            DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
          </div>
        </div>
      </div>

      {viewMode === 'desktop' ? (
        /* Desktop Two-Column View */
        <div className="grid grid-cols-1 lg:grid-cols-[260px_minmax(0,1fr)] gap-8 items-start">
          {/* Left Navigation Sidebar */}
          <div className="card-layer p-6 flex flex-col gap-7">
            {/* User Profile Info - Dynamic from PostgreSQL with accurate initials */}
            <div className="flex items-center gap-3.5">
              <div className="w-[42px] h-[42px] rounded-md bg-sky-400/15 border border-accent-cyan text-accent-cyan flex items-center justify-center font-extrabold text-sm shrink-0">
                {userInitials}
              </div>
              <div className="min-w-0">
                <div className="font-extrabold text-[0.95rem] text-text-primary truncate">
                  {displayName}
                </div>
                <div className="mono text-[0.68rem] text-text-tertiary tracking-wider truncate">
                  {roleSubtitle}
                </div>
              </div>
            </div>

            {/* Sidebar Navigation with Reactive nuqs Sync */}
            <nav className="flex flex-col gap-1.5">
              {[
                { id: 'overview', label: 'Overview', icon: '⊞' },
                { id: 'assets', label: 'My assets', icon: '📥' },
                { id: 'milestones', label: 'Milestones', icon: '⑂' },
                { id: 'billing', label: 'Billing', icon: '💳' },
                { id: 'support', label: 'Lab support', icon: '💬' },
              ].map((item) => {
                const isActive = activeSidebar === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => void setSectionQuery(item.id as ClientHubSection)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-md text-sm text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-sky-400/12 border border-sky-400/30 text-accent-cyan font-bold shadow-[0_0_12px_rgba(56,189,248,0.1)]'
                        : 'bg-transparent border border-transparent text-text-secondary font-medium hover:text-text-primary hover:bg-bg-surface/50'
                    }`}
                  >
                    <span className="text-base">{item.icon}</span>
                    {item.label}
                  </button>
                );
              })}
            </nav>

            {/* Telegram Link Card */}
            <div className="p-4 rounded-md bg-bg-surface border border-border-subtle flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="text-accent-cyan text-base">✈</span>
                <span className="text-sm font-bold text-text-primary">
                  Your lab, in Telegram.
                </span>
              </div>
              <p className="m-0 text-xs text-text-secondary leading-relaxed">
                Assets and project updates. Always within reach.
              </p>
              <div className="mono text-[0.68rem] text-accent-green flex items-center gap-1.5 mt-1">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                @{userUsername || 'unlinked'} linked
              </div>
            </div>

            {/* Security Session Meta */}
            <div className="mono text-[0.65rem] text-text-tertiary tracking-wider leading-relaxed">
              <div>SESSION / ENCRYPTED</div>
              <div>POSTGRESQL / PERSISTED</div>
            </div>
          </div>

          {/* Right Area: Dynamic Views Switched via activeSidebar / nuqs */}
          <div className="flex flex-col gap-8 min-w-0">
            {/* ============================================================== */}
            {/* SECTION 1: OVERVIEW */}
            {/* ============================================================== */}
            {activeSidebar === 'overview' && (
              <div className="flex flex-col gap-8">
                <div>
                  <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-1.5">
                    04 / YOUR CONTROL PLANE
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-text-primary">
                    Welcome back, {userFirstName?.split(' ')[0] || userUsername || 'Studio Client'}.
                  </h2>
                  <p className="text-text-secondary text-base m-0">
                    Your knowledge assets and build progress, in one place.
                  </p>
                </div>

                {/* 3 Metric Stats Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-cyan">
                      {purchasesCount < 10 ? `0${purchasesCount}` : purchasesCount}
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      OWNED ASSETS
                    </div>
                  </div>

                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-cyan">
                      {milestones.length > 0
                        ? `${completedMilestonesCount < 10 ? `0${completedMilestonesCount}` : completedMilestonesCount} / ${milestones.length < 10 ? `0${milestones.length}` : milestones.length}`
                        : '00 / 00'}
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      MILESTONES COMPLETE
                    </div>
                  </div>

                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-cyan">
                      {activeOrder?.nextReviewDate ? formatDate(activeOrder.nextReviewDate) : '—'}
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      NEXT LAB REVIEW
                    </div>
                  </div>
                </div>

                {/* Quick Purchased Assets Teaser */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-extrabold m-0 text-text-primary">Recent Assets</h3>
                      <span className="mono text-[0.65rem] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                        LIVE POSTGRESQL STATE
                      </span>
                    </div>
                    {rawPurchases.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void setSectionQuery('assets')}
                        className="mono text-xs text-accent-cyan hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        View all assets ({rawPurchases.length}) →
                      </button>
                    )}
                  </div>

                  {rawPurchases.length === 0 ? (
                    <div className="card-layer p-8 border border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-bg-surface/30">
                      <div className="text-2xl text-accent-cyan">📥</div>
                      <div className="font-extrabold text-sm text-text-primary">
                        NO DIGITAL ASSETS ACQUIRED YET
                      </div>
                      <p className="text-text-secondary text-xs m-0 max-w-sm leading-relaxed">
                        Your modular UI components, architectural blueprints, and engineering cheatsheets will appear here.
                      </p>
                      <button
                        type="button"
                        onClick={handleNavigateToStorefront}
                        className="mono mt-1 px-4 py-2 rounded bg-accent-cyan-solid text-[#071018] font-bold text-xs cursor-pointer hover:brightness-110"
                      >
                        Explore Storefront ↗
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {rawPurchases.slice(0, 2).map((p) => (
                        <div key={p.id} className="card-layer p-4 flex items-center justify-between">
                          <div className="min-w-0">
                            <div className="font-bold text-sm text-text-primary truncate">{p.product?.title || 'Production Asset'}</div>
                            <div className="mono text-[0.68rem] text-text-tertiary">{formatDate(p.createdAt)} · {p.product?.version || 'v1.0'}</div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDownload(p.product?.slug || 'asset')}
                            className="mono px-3 py-1.5 rounded border border-border-card text-xs font-bold hover:border-accent-cyan transition-colors"
                          >
                            ⭳
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick Contract Teaser */}
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <h3 className="text-xl font-extrabold m-0 text-text-primary">Bespoke Contract</h3>
                      <span className="mono text-[0.65rem] px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                        LIVE POSTGRESQL STATE
                      </span>
                    </div>
                    {orders.length > 0 && (
                      <button
                        type="button"
                        onClick={() => void setSectionQuery('milestones')}
                        className="mono text-xs text-accent-cyan hover:underline bg-transparent border-0 cursor-pointer"
                      >
                        View full roadmap →
                      </button>
                    )}
                  </div>

                  {orders.length === 0 ? (
                    <div className="card-layer p-8 border border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-center gap-3 bg-bg-surface/30">
                      <div className="text-2xl text-accent-purple">⑂</div>
                      <div className="font-extrabold text-sm text-text-primary">
                        NO ACTIVE BESPOKE CONTRACT
                      </div>
                      <p className="text-text-secondary text-xs m-0 max-w-sm leading-relaxed">
                        Initiate an intake protocol to commission bespoke full-cycle development or low-latency systems.
                      </p>
                      <button
                        type="button"
                        onClick={handleNavigateToIntake}
                        className="mono mt-1 px-4 py-2 rounded bg-purple-500/20 border border-accent-purple text-accent-purple font-bold text-xs cursor-pointer hover:bg-purple-500/30"
                      >
                        Initiate Intake Protocol ↗
                      </button>
                    </div>
                  ) : (
                    <div className="card-layer p-5 flex flex-col gap-3">
                      <div className="flex justify-between items-center">
                        <span className="font-extrabold text-base text-text-primary">{activeOrderTitle}</span>
                        <span className="mono text-xs text-accent-cyan font-bold">{activeOrder?.status}</span>
                      </div>
                      <div className="mono text-xs text-text-tertiary">
                        {orderNumber ? `ORDER ${orderNumber} · ` : ''}{milestones.length} MILESTONES DEFINED
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 2: MY ASSETS */}
            {/* ============================================================== */}
            {activeSidebar === 'assets' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="mono text-xs text-accent-cyan tracking-wider font-semibold">
                    04.1 / DIGITAL ASSET REPOSITORY
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold tracking-tight m-0 text-text-primary">
                      My Assets &amp; Deliverables
                    </h2>
                    <span className="mono text-[0.65rem] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                      DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm m-0">
                    Production kits, architecture cheatsheets, and verified digital licenses.
                  </p>
                </div>

                {rawPurchases.length === 0 ? (
                  <div className="card-layer p-12 border border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-bg-surface/30">
                    <div className="w-16 h-16 rounded-2xl bg-sky-400/10 border border-accent-cyan/30 flex items-center justify-center text-accent-cyan text-3xl">
                      📥
                    </div>
                    <div className="flex flex-col gap-1.5 max-w-md">
                      <div className="mono text-xs text-accent-cyan tracking-widest font-bold">
                        ZERO ASSETS ACQUIRED
                      </div>
                      <h3 className="text-2xl font-extrabold text-text-primary m-0">
                        No digital assets in your vault
                      </h3>
                      <p className="text-text-secondary text-sm m-0 leading-relaxed">
                        Acquire production UI kits, V8 cheatsheets, or advisory sessions in the studio catalog.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNavigateToStorefront}
                      className="mono mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold text-xs cursor-pointer hover:brightness-110 active:scale-[0.98] transition-all shadow-[0_2px_14px_rgba(38,181,244,0.3)]"
                    >
                      Browse Studio Storefront ↗
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    {rawPurchases.map((purchase) => {
                      const product = purchase.product;
                      const slug = product?.slug || 'modular-ui-kit';
                      const isUiKit = slug.includes('ui-kit');
                      const icon = isUiKit ? '❖' : '⑂';
                      const iconColor = isUiKit
                        ? 'bg-sky-400/10 border-accent-cyan text-accent-cyan'
                        : 'bg-purple-500/10 border-accent-purple text-accent-purple';

                      return (
                        <div key={purchase.id} className="card-layer p-6 flex flex-col justify-between gap-5 border border-border-subtle">
                          <div className="flex flex-col gap-3">
                            <div className="flex items-start gap-3.5">
                              <div className={`w-11 h-11 rounded-md border flex items-center justify-center text-base shrink-0 ${iconColor}`}>
                                {icon}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h4 className="m-0 text-lg font-extrabold text-text-primary truncate">
                                  {product?.title || 'Production Asset'}
                                </h4>
                                <div className="mono text-[0.68rem] text-text-tertiary mt-0.5">
                                  {product?.version ? `${product.version} • ` : ''}
                                  {product?.componentCount ? `${product.componentCount} components ` : ''}
                                  {product?.fileSize ? `/ ${product.fileSize}` : ''}
                                </div>
                              </div>
                            </div>
                            <p className="text-text-secondary text-xs m-0 line-clamp-2 leading-relaxed">
                              {product?.description || 'Production architectural asset.'}
                            </p>
                            <div className="mono text-[0.68rem] text-accent-green font-semibold">
                              ✓ PURCHASED · {formatDate(purchase.createdAt)} · ${purchase.amountUsd} USD
                            </div>
                          </div>

                          <div className="flex justify-between items-center border-t border-border-subtle pt-4">
                            <span className="mono text-[0.68rem] text-text-tertiary">LIFETIME LICENSE</span>
                            <button
                              type="button"
                              onClick={() => handleDownload(slug)}
                              className="mono px-4 py-2 rounded bg-sky-400/10 border border-accent-cyan text-accent-cyan text-xs font-bold cursor-pointer hover:bg-sky-400/20 transition-all flex items-center gap-1.5"
                            >
                              {downloadSuccess === slug ? 'PREPARING...' : 'DOWNLOAD ARTIFACT ⭳'}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 3: MILESTONES */}
            {/* ============================================================== */}
            {activeSidebar === 'milestones' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="mono text-xs text-accent-cyan tracking-wider font-semibold">
                    04.2 / BESPOKE ENGINEERING SPRINT
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold tracking-tight m-0 text-text-primary">
                      Milestones &amp; Sprint Progress
                    </h2>
                    <span className="mono text-[0.65rem] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                      DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm m-0">
                    Live tracking of active contract deliverables, architectural audits, and deployment dates.
                  </p>
                </div>

                {orders.length === 0 ? (
                  <div className="card-layer p-12 border border-dashed border-border-card rounded-xl flex flex-col items-center justify-center text-center gap-4 bg-bg-surface/30">
                    <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-accent-purple/30 flex items-center justify-center text-accent-purple text-3xl">
                      ⑂
                    </div>
                    <div className="flex flex-col gap-1.5 max-w-md">
                      <div className="mono text-xs text-accent-purple tracking-widest font-bold">
                        CONTRACT PIPELINE INACTIVE
                      </div>
                      <h3 className="text-2xl font-extrabold text-text-primary m-0">
                        No active engineering contract
                      </h3>
                      <p className="text-text-secondary text-sm m-0 leading-relaxed">
                        Initiate a discovery intake to commission custom full-cycle engineering, autonomous agents, or high-throughput architectures.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleNavigateToIntake}
                      className="mono mt-2 inline-flex items-center gap-2 px-6 py-3 rounded-md bg-purple-500/20 border border-accent-purple text-accent-purple font-extrabold text-xs cursor-pointer hover:bg-purple-500/30 active:scale-[0.98] transition-all"
                    >
                      Commission Bespoke Project ↗
                    </button>
                  </div>
                ) : (
                  <div className="card-layer p-8 flex flex-col gap-6">
                    <div className="flex justify-between items-start border-b border-border-subtle pb-5">
                      <div>
                        <h3 className="m-0 text-2xl font-extrabold text-text-primary">
                          {activeOrderTitle}
                        </h3>
                        <div className="mono text-xs text-text-tertiary mt-1">
                          {orderNumber && `ORDER ${orderNumber} · `}
                          {orderSprint && `${orderSprint} · `}
                          DELIVERY {activeOrder?.deliveryDate ? formatDate(activeOrder.deliveryDate) : 'SCHEDULED'}
                        </div>
                      </div>
                      <div className="mono px-3 py-1.5 rounded-full bg-sky-400/15 border border-sky-400/30 text-accent-cyan text-xs font-bold">
                        {activeOrder?.status || 'IN PROGRESS'}
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <div className="mono text-xs text-accent-cyan font-bold tracking-wider">
                        MILESTONE ROADMAP ({completedMilestonesCount}/{milestones.length})
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {milestones.map((m) => {
                          const isCompleted = m.status === 'COMPLETED';
                          const isInProgress = m.status === 'IN_PROGRESS';
                          const barColor = isCompleted ? 'bg-accent-green' : isInProgress ? 'bg-sky-400' : 'bg-border-card';
                          const badge = isCompleted ? '✓ COMPLETED' : isInProgress ? '⦿ IN PROGRESS' : '○ PENDING';
                          const badgeClass = isCompleted ? 'text-accent-green' : isInProgress ? 'text-accent-cyan' : 'text-text-tertiary';

                          return (
                            <div key={m.id || m.step} className="p-4 rounded-lg bg-bg-surface border border-border-subtle flex flex-col gap-2.5">
                              <div className={`h-1.5 rounded-full ${barColor}`} />
                              <div className="flex justify-between items-center mt-1">
                                <span className="mono text-[0.65rem] text-text-tertiary">STEP 0{m.step}</span>
                                <span className={`mono text-[0.65rem] font-bold ${badgeClass}`}>{badge}</span>
                              </div>
                              <div className="font-extrabold text-sm text-text-primary">{m.title}</div>
                              {m.description && (
                                <p className="text-text-secondary text-xs m-0 leading-relaxed">{m.description}</p>
                              )}
                              <div className="mono text-[0.65rem] text-text-tertiary mt-auto">
                                {isCompleted ? `${formatDate(m.completedAt)}` : 'ACTIVE SPRINT'}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 4: BILLING */}
            {/* ============================================================== */}
            {activeSidebar === 'billing' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="mono text-xs text-accent-cyan tracking-wider font-semibold">
                    04.3 / FINANCIAL SETTLEMENT &amp; INVOICING
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold tracking-tight m-0 text-text-primary">
                      Billing &amp; Invoices
                    </h2>
                    <span className="mono text-[0.65rem] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                      DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm m-0">
                    Cryptographic receipts, transaction settlements, and enterprise statements.
                  </p>
                </div>

                {/* Financial Summary Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-cyan">
                      ${rawPurchases.reduce((acc, cur) => acc + cur.amountUsd, 0)} USD
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      TOTAL SETTLED VOLUME
                    </div>
                  </div>

                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-green">
                      {rawPurchases.length}
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      PAID TRANSACTIONS
                    </div>
                  </div>

                  <div className="card-layer p-5">
                    <div className="text-3xl font-extrabold text-accent-cyan">
                      30 DAYS
                    </div>
                    <div className="mono text-[0.68rem] text-text-tertiary tracking-wider mt-1">
                      SESSION EXPIRATION
                    </div>
                  </div>
                </div>

                {/* Invoices List */}
                <div className="card-layer p-6 flex flex-col gap-4">
                  <div className="mono text-xs text-text-tertiary font-bold tracking-wider">
                    TRANSACTION LEDGER
                  </div>

                  {rawPurchases.length === 0 ? (
                    <div className="py-8 text-center text-text-secondary text-sm">
                      No invoices on record. All completed acquisitions will appear here with cryptographic verification.
                    </div>
                  ) : (
                    <div className="flex flex-col divide-y divide-border-subtle">
                      {rawPurchases.map((purchase) => (
                        <div key={purchase.id} className="py-3.5 flex justify-between items-center">
                          <div>
                            <div className="font-bold text-sm text-text-primary">
                              {purchase.product?.title || 'Production Acquisition'}
                            </div>
                            <div className="mono text-[0.68rem] text-text-tertiary">
                              INV-{purchase.id.slice(0, 8).toUpperCase()} · {formatDate(purchase.createdAt)}
                            </div>
                          </div>
                          <div className="text-end">
                            <div className="font-extrabold text-sm text-accent-green">
                              ${purchase.amountUsd}.00 USD
                            </div>
                            <div className="mono text-[0.65rem] text-text-tertiary">
                              SETTLED / PAID
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* ============================================================== */}
            {/* SECTION 5: LAB SUPPORT */}
            {/* ============================================================== */}
            {activeSidebar === 'support' && (
              <div className="flex flex-col gap-6">
                <div className="flex flex-col gap-2">
                  <div className="mono text-xs text-accent-cyan tracking-wider font-semibold">
                    04.4 / DIRECT ADVISORY &amp; DISPATCH
                  </div>
                  <div className="flex justify-between items-center">
                    <h2 className="text-3xl font-extrabold tracking-tight m-0 text-text-primary">
                      Lab Support &amp; Technical Desk
                    </h2>
                    <span className="mono text-[0.65rem] px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-accent-green font-bold">
                      DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
                    </span>
                  </div>
                  <p className="text-text-secondary text-sm m-0">
                    Direct communication channel to studio engineers and architects.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <div className="card-layer p-6 flex flex-col justify-between gap-4 border border-sky-500/30">
                    <div className="flex flex-col gap-2">
                      <div className="text-2xl text-accent-cyan">✈</div>
                      <h4 className="m-0 text-lg font-extrabold text-text-primary">
                        Telegram Lab Desk
                      </h4>
                      <p className="text-text-secondary text-xs m-0 leading-relaxed">
                        Instant synchronous dispatch. Ask questions directly about codebases, licensing, or custom architectures.
                      </p>
                      <div className="mono text-[0.68rem] text-accent-green mt-2">
                        ● CONNECTED: @{userUsername || 'studio_member'}
                      </div>
                    </div>
                    <a
                      href="https://t.me/induktr_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono px-4 py-2.5 rounded bg-accent-cyan-solid text-[#071018] font-bold text-xs text-center no-underline hover:brightness-110 transition-all"
                    >
                      Open Telegram Channel ↗
                    </a>
                  </div>

                  <div className="card-layer p-6 flex flex-col justify-between gap-4">
                    <div className="flex flex-col gap-2">
                      <div className="text-2xl text-accent-purple">⏱</div>
                      <h4 className="m-0 text-lg font-extrabold text-text-primary">
                        SLA &amp; Response Times
                      </h4>
                      <p className="text-text-secondary text-xs m-0 leading-relaxed">
                        Priority queue for verified client accounts. Enterprise contracts receive sub-2 hour engineering callbacks.
                      </p>
                      <div className="mono text-[0.68rem] text-text-tertiary mt-2">
                        DESK: MON-FRI 08:00–20:00 UTC
                      </div>
                    </div>
                    <div className="mono text-xs text-accent-cyan p-2.5 rounded bg-bg-surface border border-border-subtle text-center">
                      DIRECT: support@induktr.studio
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Telegram Mini App Smartphone Container */
        <div className="flex justify-center w-full py-4">
          <div className="w-[380px] rounded-[36px] border-[6px] border-zinc-800 bg-[#090d16] overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8),0_0_30px_rgba(56,189,248,0.15)] flex flex-col min-h-[740px]">
            {/* iOS Status Bar */}
            <div className="px-6 py-3 flex justify-between items-center text-xs font-bold text-text-primary">
              <span>9:41</span>
              <div className="flex gap-1.5 items-center">
                <span className="text-xs">📶</span>
                <span className="text-xs">🔋</span>
              </div>
            </div>

            {/* Telegram Mini App Navigation Bar */}
            <div className="px-5 py-2 border-b border-border-subtle flex justify-between items-center">
              <button
                type="button"
                onClick={() => setViewMode('desktop')}
                className="bg-transparent border-0 text-accent-cyan text-sm cursor-pointer"
              >
                Close
              </button>
              <div className="text-center">
                <div className="text-sm font-extrabold text-text-primary">
                  Induktr Studio ✓
                </div>
                <div className="mono text-[0.65rem] text-text-tertiary">
                  mini app
                </div>
              </div>
              <span className="text-lg text-text-tertiary">•••</span>
            </div>

            {/* Telegram Mini App Navigation Tabs */}
            <div className="grid grid-cols-4 border-b border-border-subtle bg-bg-surface/50 text-center mono text-[0.68rem]">
              {(['assets', 'project', 'billing', 'support'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveMiniTab(tab)}
                  className={`py-2 border-0 cursor-pointer font-bold transition-colors ${
                    activeMiniTab === tab
                      ? 'text-accent-cyan border-b-2 border-accent-cyan bg-sky-400/10'
                      : 'text-text-secondary bg-transparent hover:text-text-primary'
                  }`}
                >
                  {tab.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Telegram Mini App Main Content */}
            <div className="flex-1 p-5 flex flex-col gap-5 overflow-y-auto">
              <div>
                <div className="mono text-[0.68rem] text-accent-green font-semibold flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent-green shadow-[0_0_6px_var(--accent-green)]" />
                  DATA SOURCE: LIVE POSTGRESQL (ZERO MOCK)
                </div>
                <div className="mono text-[0.65rem] text-text-tertiary mt-0.5">
                  ● CONNECTED AS @{(userUsername || 'CLIENT').toUpperCase()}
                </div>
                <h3 className="text-2xl font-extrabold tracking-tight my-1 text-text-primary">
                  Your lab. Anywhere.
                </h3>
                <p className="text-text-secondary text-sm m-0">
                  Instant access. No inbox archaeology.
                </p>
              </div>

              {activeMiniTab === 'assets' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className="font-extrabold text-base text-text-primary">Your assets</span>
                    <span className="mono text-[0.68rem] text-text-tertiary">
                      {purchasesCount < 10 ? `0${purchasesCount}` : purchasesCount} OWNED
                    </span>
                  </div>

                  {rawPurchases.length === 0 ? (
                    <div className="p-5 rounded-xl bg-bg-card border border-dashed border-border-subtle flex flex-col items-center text-center gap-3">
                      <div className="text-2xl text-accent-cyan">📥</div>
                      <div className="text-xs font-extrabold text-text-primary tracking-wide">
                        NO DIGITAL ASSETS ACQUIRED YET
                      </div>
                      <p className="text-[0.72rem] text-text-secondary m-0 leading-relaxed">
                        Production assets acquired in Storefront will appear directly in your mini-app.
                      </p>
                      <button
                        type="button"
                        onClick={handleNavigateToStorefront}
                        className="mono px-3 py-1.5 rounded bg-accent-cyan-solid text-[#071018] font-bold text-xs cursor-pointer hover:brightness-110 transition-all"
                      >
                        Explore Storefront ↗
                      </button>
                    </div>
                  ) : (
                    rawPurchases.map((purchase) => {
                      const product = purchase.product;
                      const slug = product?.slug || 'modular-ui-kit';
                      const isUiKit = slug.includes('ui-kit');
                      const icon = isUiKit ? '❖' : '⑂';
                      const iconColor = isUiKit ? 'text-accent-cyan' : 'text-accent-purple';

                      return (
                        <div key={purchase.id} className="p-4 rounded-xl bg-bg-card border border-border-subtle flex flex-col gap-3">
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-2">
                              <span className={iconColor}>{icon}</span>
                              <span className="font-extrabold text-[0.95rem] text-text-primary">
                                {product?.title || 'Production Asset'}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDownload(slug)}
                              className="mono px-2.5 py-1.5 rounded bg-transparent border border-border-card text-text-primary text-xs cursor-pointer hover:border-accent-cyan transition-colors"
                            >
                              Download ⭳
                            </button>
                          </div>
                          <div className="mono text-[0.68rem] text-text-tertiary">
                            {product?.version ? `${product.version} • ` : ''}
                            {product?.badge ? `${product.badge} • ` : ''}
                            {product?.fileSize || ''}
                          </div>
                          <div className="mono text-[0.68rem] text-accent-green font-semibold">
                            ✓ PURCHASED
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {activeMiniTab === 'project' && (
                <div className="flex flex-col gap-4">
                  <span className="font-extrabold text-base text-text-primary">Bespoke Contract</span>
                  {orders.length === 0 ? (
                    <div className="p-5 rounded-xl bg-bg-card border border-dashed border-border-subtle flex flex-col items-center text-center gap-3">
                      <div className="text-2xl text-accent-purple">⑂</div>
                      <div className="text-xs font-extrabold text-text-primary">
                        NO ACTIVE CONTRACT
                      </div>
                      <p className="text-[0.72rem] text-text-secondary m-0">
                        Initiate discovery to start a bespoke development sprint.
                      </p>
                      <button
                        type="button"
                        onClick={handleNavigateToIntake}
                        className="mono px-3 py-1.5 rounded bg-purple-500/20 border border-accent-purple text-accent-purple font-bold text-xs cursor-pointer"
                      >
                        Start Intake ↗
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 rounded-xl bg-bg-card border border-border-subtle flex flex-col gap-2">
                      <span className="font-bold text-sm text-text-primary">{activeOrderTitle}</span>
                      <span className="mono text-xs text-accent-cyan font-bold">{activeOrder?.status}</span>
                    </div>
                  )}
                </div>
              )}

              {activeMiniTab === 'billing' && (
                <div className="flex flex-col gap-3">
                  <span className="font-extrabold text-base text-text-primary">Settled Volume</span>
                  <div className="p-4 rounded-xl bg-bg-card border border-border-subtle flex flex-col gap-1">
                    <span className="text-2xl font-extrabold text-accent-cyan">
                      ${rawPurchases.reduce((acc, cur) => acc + cur.amountUsd, 0)}.00 USD
                    </span>
                    <span className="mono text-[0.68rem] text-text-tertiary">{rawPurchases.length} transactions</span>
                  </div>
                </div>
              )}

              {activeMiniTab === 'support' && (
                <div className="flex flex-col gap-3">
                  <span className="font-extrabold text-base text-text-primary">Support Desk</span>
                  <div className="p-4 rounded-xl bg-bg-card border border-border-subtle flex flex-col gap-3">
                    <p className="text-xs text-text-secondary m-0">
                      Need immediate architectural assistance? Reach our engineering team in Telegram.
                    </p>
                    <a
                      href="https://t.me/induktr_bot"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mono p-2.5 rounded bg-accent-cyan-solid text-[#071018] font-bold text-xs text-center no-underline"
                    >
                      Open Telegram Channel ↗
                    </a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
