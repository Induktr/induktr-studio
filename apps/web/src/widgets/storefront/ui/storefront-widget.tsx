import type React from 'react';
import { useState, useMemo } from 'react';
import { useQuery } from 'urql';
import {
  type ProductCategory,
  type ProductItem,
  ProductCategorySchema,
  ProductItemSchema,
} from '@induktr/contracts';
import { GET_PRODUCTS_QUERY } from '@/shared/api/operations';
import { useAbortController } from '@/shared/lib/async';

export interface StorefrontProps {
  readonly onCheckout?: (productId: string, method: 'telegram' | 'card') => void;
}

export type { ProductCategory, ProductItem };
export { ProductCategorySchema, ProductItemSchema };

const RAW_FALLBACK_PRODUCTS: readonly ProductItem[] = [
  {
    id: '4a9b2c3d-3333-4aaa-bbbb-000000000003',
    slug: 'sovereign-saas-platform',
    title: 'Sovereign SaaS Starter Platform',
    type: 'APPS_TEMPLATES',
    category: 'APPS_TEMPLATES',
    priceUsd: 249,
    description: 'Production-ready turnkey SaaS platform with multi-tenant RBAC, Neon PostgreSQL, Bun Elysia edge runtime, and Tailwind v4.\nDeploy within 5 minutes with zero cloud vendor lock-in.',
    tier: 'TIER 01 / TURNKEY FULL-STACK APP',
    badge: 'REPO + DEPLOY',
    version: 'v2.4',
    fileSize: '48.2 MB',
    componentCount: 52,
    features: ['Next.js 15 & Bun', 'Neon PostgreSQL', 'Tailwind v4 tokens', 'HMAC Auth & Stripe'],
  },
  {
    id: '4a9b2c3d-4444-4aaa-bbbb-000000000004',
    slug: 'high-performance-storefront',
    title: 'High-Performance Headless Storefront',
    type: 'APPS_TEMPLATES',
    category: 'APPS_TEMPLATES',
    priceUsd: 199,
    description: 'Sub-15ms edge commerce engine with sub-second LCP, optimistic local cart, and crypto/Telegram checkout.\nEngineered for high conversion rates and zero hydration overhead.',
    tier: 'TIER 01 / E-COMMERCE ENGINE',
    badge: 'REACT + CRYPTO',
    version: 'v3.1',
    fileSize: '36.4 MB',
    componentCount: 38,
    features: ['Sub-second LCP', 'Edge Cart Sync', 'Telegram Stars & Crypto', 'Zero Hydration Drift'],
  },
  {
    id: '4a9b2c3d-1111-4aaa-bbbb-000000000001',
    slug: 'modular-ui-kit',
    title: 'Modular UI Kit v2.0',
    type: 'UI_KITS',
    category: 'UI_KITS',
    priceUsd: 29,
    description: 'OKLCH · Radix Primitives · FSD 2.1\n48 editable components. One coherent engineering design language without runtime CSS-in-JS overhead.',
    tier: 'TIER 02 / COMPONENT SYSTEM',
    badge: 'FIG + TSX',
    version: 'v2.0',
    fileSize: '24.8 MB',
    componentCount: 48,
    features: ['OKLCH tokens', 'Radix primitives', 'FSD 2.1 slices', 'Dark/Light/Cyber'],
  },
  {
    id: '4a9b2c3d-2222-4aaa-bbbb-000000000002',
    slug: 'architecture-cheatsheets',
    title: 'Architecture Cheatsheets v1.4',
    type: 'CHEATSHEETS',
    category: 'CHEATSHEETS',
    priceUsd: 69,
    description: 'V8 Internals · Scheduler API · Distributed Consensus · Event loop maps\n24 concise sheets for high-leverage architectural decisions that scale.',
    tier: 'TIER 03 / SYSTEM ARCHITECTURE',
    badge: 'PDF + MD',
    version: 'v1.4',
    fileSize: '8.2 MB',
    componentCount: 24,
    features: ['V8 Internals', 'Scheduler API', 'Event loop maps', 'Database Indexing'],
  },
  {
    id: '4a9b2c3d-5555-4aaa-bbbb-000000000005',
    slug: 'architecture-audit-consultation',
    title: 'Full-Cycle Architecture Audit & Consultation',
    type: 'SERVICES',
    category: 'SERVICES',
    priceUsd: 299,
    description: '3-hour private technical session with Induktr principal systems engineers.\nDeep profiling of query plans, state bottlenecks, edge caches, and step-by-step remediation roadmap.',
    tier: 'TIER 04 / ENGINEERING CONSULTATION',
    badge: '1-ON-1 / 3H',
    version: 'Live Session',
    fileSize: 'Full Audit Report',
    componentCount: 1,
    features: ['Query Plan Profiling', 'Bottleneck Elimination', 'Zero-Mock Transition', 'Executive Roadmap'],
  },
];

const fallbackValidation = ProductItemSchema.array().safeParse(RAW_FALLBACK_PRODUCTS);
if (!fallbackValidation.success) {
  console.warn('[StorefrontWidget] FALLBACK_PRODUCTS failed schema validation:', fallbackValidation.error);
  throw new Error(`[StorefrontWidget] Invalid FALLBACK_PRODUCTS schema: ${fallbackValidation.error.message}`);
}
export const FALLBACK_PRODUCTS: ProductItem[] = fallbackValidation.data;

const CATEGORY_TABS: { id: ProductCategory; label: string; sublabel: string }[] = [
  { id: 'ALL', label: 'ALL', sublabel: 'Complete Catalog' },
  { id: 'APPS_TEMPLATES', label: 'APPS & SITES', sublabel: 'Turnkey Applications' },
  { id: 'UI_KITS', label: 'UI KITS', sublabel: 'Component Systems' },
  { id: 'CHEATSHEETS', label: 'CHEATSHEETS', sublabel: 'Architectural Blueprints' },
  { id: 'SERVICES', label: 'SERVICES', sublabel: 'Engineering Audits' },
];

function matchesCategory(product: ProductItem, category: ProductCategory): boolean {
  if (category === 'ALL') return true;
  if (product.category === category) return true;
  const pType = product.type.toUpperCase();
  if (category === 'APPS_TEMPLATES') {
    return pType === 'APPS_TEMPLATES' || pType.includes('APP') || pType.includes('SITE');
  }
  if (category === 'UI_KITS') {
    return pType === 'UI_KITS' || pType.includes('UI_KIT') || product.slug.includes('ui-kit');
  }
  if (category === 'CHEATSHEETS') {
    return pType === 'CHEATSHEETS' || pType.includes('CHEATSHEET') || product.slug.includes('cheatsheet');
  }
  if (category === 'SERVICES') {
    return pType === 'SERVICES' || pType.includes('SERVICE') || pType.includes('AUDIT');
  }
  return false;
}

export const StorefrontWidget: React.FC<StorefrontProps> = ({ onCheckout }) => {
  const [activeCategory, setActiveCategory] = useState<ProductCategory>('ALL');
  const [purchasedIds, setPurchasedIds] = useState<string[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const downloadAbort = useAbortController();

  const [{ data }] = useQuery({ query: GET_PRODUCTS_QUERY });
  const rawProducts: ProductItem[] =
    data?.products && data.products.length > 0 ? data.products : FALLBACK_PRODUCTS;

  const categoryCounts = useMemo(() => {
    const counts: Record<ProductCategory, number> = {
      ALL: rawProducts.length,
      APPS_TEMPLATES: 0,
      UI_KITS: 0,
      CHEATSHEETS: 0,
      SERVICES: 0,
    };
    for (const tab of CATEGORY_TABS) {
      if (tab.id !== 'ALL') {
        counts[tab.id] = rawProducts.filter((p) => matchesCategory(p, tab.id)).length;
      }
    }
    return counts;
  }, [rawProducts]);

  const filteredProducts = useMemo(() => {
    return rawProducts.filter((p) => matchesCategory(p, activeCategory));
  }, [rawProducts, activeCategory]);

  const handlePurchase = (id: string, method: 'telegram' | 'card') => {
    if (onCheckout) {
      onCheckout(id, method);
    }
    setPurchasedIds((prev) => [...prev, id]);
  };

  const handleDownload = (slug: string) => {
    const controller = downloadAbort.renew();
    setDownloadingId(slug);

    const timerId = setTimeout(() => {
      if (!controller.signal.aborted) {
        setDownloadingId(null);
        window.open(`https://cdn.induktr.studio/artifacts/${slug}.zip`, '_blank');
      }
    }, 600);

    controller.signal.addEventListener('abort', () => clearTimeout(timerId), { once: true });
  };

  return (
    <section className="flex flex-col gap-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-2">
            02 / THE SOVEREIGN STORE &amp; KNOWLEDGE BASE
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-text-primary">
            The lab, distilled.
          </h2>
          <p className="text-text-secondary m-0 text-[1.05rem]">
            Turnkey production apps, foundational UI kits, and battle-tested architectural blueprints. Zero abstraction tax.
          </p>
        </div>

        <div className="mono flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/25 text-accent-cyan text-xs font-bold tracking-normal shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--accent-cyan)]" />
          CATALOG: {rawProducts.length} ARTIFACTS VERIFIED
        </div>
      </div>

      {/* Reactive Category Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
        {CATEGORY_TABS.map((tab) => {
          const isActive = activeCategory === tab.id;
          const count = categoryCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveCategory(tab.id)}
              className={`mono text-xs font-bold px-3.5 py-2 rounded-lg cursor-pointer transition-all flex items-center gap-2 border ${
                isActive
                  ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-[0_0_12px_rgba(38,181,244,0.15)]'
                  : 'bg-bg-surface text-text-secondary border-border-subtle hover:border-border-card hover:text-text-primary'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`text-[0.68rem] px-1.5 py-0.5 rounded-full font-semibold transition-colors ${
                  isActive
                    ? 'bg-accent-cyan text-[#071018]'
                    : 'bg-bg-card text-text-tertiary'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredProducts.map((product) => {
          const isApp = product.type === 'APPS_TEMPLATES';
          const isUiKit = product.type === 'UI_KITS' || product.slug.includes('ui-kit');
          const isService = product.type === 'SERVICES';

          let tierAccent = 'text-accent-purple';
          let borderGlow = 'border-border-card';
          if (isApp) {
            tierAccent = 'text-accent-cyan';
            borderGlow = 'border-sky-500/20';
          } else if (isUiKit) {
            tierAccent = 'text-accent-cyan';
            borderGlow = 'border-sky-500/20';
          } else if (isService) {
            tierAccent = 'text-accent-green';
            borderGlow = 'border-green-500/20';
          }

          const isPurchased =
            purchasedIds.includes(product.slug) || purchasedIds.includes(product.id);

          return (
            <div
              key={product.id || product.slug}
              className={`card-layer p-8 flex flex-col justify-between gap-6 transition-all hover:border-accent-cyan/40 ${borderGlow}`}
            >
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-start gap-4">
                  <span className={`mono text-xs ${tierAccent} tracking-wider font-bold`}>
                    {product.tier || 'TIER 01 / ARCHITECTURE ARTIFACT'}
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-extrabold leading-none text-text-primary">
                      ${product.priceUsd}
                    </span>
                    {isService && (
                      <span className="mono text-xs text-text-tertiary">/ SESSION</span>
                    )}
                  </div>
                </div>

                <h3 className="text-2xl sm:text-[1.85rem] font-extrabold tracking-tight my-1 text-text-primary">
                  {product.title}
                </h3>

                {/* Visual Technical Box */}
                <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-4">
                  <div className="flex justify-between items-center">
                    <span className={`mono text-xs ${tierAccent}`}>
                      {isApp && 'systems / turnkey / runtime'}
                      {isUiKit && 'shared / ui / primitives'}
                      {isService && 'consultation / live-profile'}
                      {!isApp && !isUiKit && !isService && 'architecture / runtime.md'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="mono text-[0.65rem] text-accent-cyan border border-sky-400/30 px-1.5 py-0.5 rounded">
                        STANDARDS: FSD 2.1 + SSG
                      </span>
                      <span className="mono text-[0.65rem] text-text-tertiary border border-border-subtle px-1.5 py-0.5 rounded">
                        {product.badge || 'PROD READY'}
                      </span>
                    </div>
                  </div>

                  {isApp && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        EDGE TTFB &lt;15ms
                      </div>
                      <div className="mono py-2 px-1 rounded bg-sky-500/12 border border-sky-400/30 shadow-[0_0_10px_rgba(38,181,244,0.18)] text-center text-[0.68rem] font-bold text-accent-cyan">
                        LCP 0.35s
                      </div>
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        POSTGRES NEON
                      </div>
                    </div>
                  )}

                  {isUiKit && (
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        className="px-4 py-2 rounded bg-accent-cyan-solid text-[#071018] font-bold text-xs border-0 cursor-pointer"
                      >
                        Deploy ↗
                      </button>
                      <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-green-500/10 text-accent-green text-[0.72rem] font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                        200 OK
                      </span>

                      {/* Color Swatches */}
                      <div className="flex gap-1.5 ml-auto">
                        <span className="w-4 h-4 rounded bg-accent-cyan" />
                        <span className="w-4 h-4 rounded bg-accent-purple" />
                        <span className="w-4 h-4 rounded bg-accent-green" />
                      </div>
                    </div>
                  )}

                  {isService && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        01. PROFILING
                      </div>
                      <div className="mono py-2 px-1 rounded bg-green-500/12 border border-accent-green shadow-[0_0_10px_rgba(74,222,128,0.2)] text-center text-[0.68rem] font-bold text-accent-green">
                        02. TRACING
                      </div>
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        03. ROADMAP
                      </div>
                    </div>
                  )}

                  {!isApp && !isUiKit && !isService && (
                    <div className="grid grid-cols-3 gap-2">
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        CALL STACK
                      </div>
                      <div className="mono py-2 px-1 rounded bg-purple-500/12 border border-accent-purple shadow-[0_0_10px_rgba(192,132,252,0.25)] text-center text-[0.68rem] font-bold text-accent-purple">
                        μ TASKS
                      </div>
                      <div className="mono py-2 px-1 rounded bg-bg-card border border-border-subtle text-center text-[0.68rem] text-text-secondary">
                        RENDER
                      </div>
                    </div>
                  )}

                  <div className="mono text-[0.68rem] text-text-tertiary flex flex-wrap gap-2 items-center">
                    {product.version && <span>{product.version}</span>}
                    {product.fileSize && <span>• {product.fileSize}</span>}
                    {product.features && (
                      <span className="text-text-secondary">
                        • {product.features.slice(0, 3).join(' / ')}
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-text-secondary text-[0.95rem] leading-relaxed m-0 whitespace-pre-line">
                  {product.description}
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col gap-3">
                {isPurchased ? (
                  <button
                    type="button"
                    onClick={() => handleDownload(product.slug)}
                    className="mono flex items-center justify-center gap-2 p-3.5 rounded-md bg-green-500/15 border border-accent-green text-accent-green font-extrabold text-sm cursor-pointer"
                  >
                    {downloadingId === product.slug
                      ? 'Generating Presigned Link...'
                      : isService
                      ? '✓ RESERVED • Telemetry Dispatched'
                      : '✓ PURCHASED • Download ⭳'}
                  </button>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => handlePurchase(product.slug, 'telegram')}
                      className="mono flex items-center justify-center gap-2 p-3.5 rounded-md bg-accent-cyan-solid text-[#071018] font-extrabold border-0 text-sm cursor-pointer shadow-[0_4px_14px_rgba(38,181,244,0.3)] hover:brightness-110 active:scale-[0.98] transition-all"
                    >
                      Telegram Checkout ✈
                    </button>

                    <button
                      type="button"
                      onClick={() => handlePurchase(product.slug, 'card')}
                      className="mono flex items-center justify-center gap-2 p-3.5 rounded-md bg-bg-surface text-text-primary font-bold border border-border-card text-sm cursor-pointer hover:border-accent-cyan transition-colors"
                    >
                      {isApp ? 'Buy & Customize ⚡' : isService ? 'Book Direct ⚡' : 'Card & Crypto 💳'}
                    </button>
                  </div>
                )}

                <div className="mono text-[0.68rem] text-text-tertiary tracking-wider">
                  {isApp && 'FULL SOURCE CODE / COMMERCIAL LICENSE / IMMEDIATE ACCESS'}
                  {isUiKit && 'FIGMA + REACT / COMMERCIAL LICENSE / LIFETIME UPDATES'}
                  {isService && 'PRIVATE VIDEO SESSION / CALENDAR SYNC / WRITTEN DELIVERABLE'}
                  {!isApp && !isUiKit && !isService && 'PDF + MARKDOWN / LIFETIME UPDATES / INSTANT ACCESS'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
