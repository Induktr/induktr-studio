import type React from 'react';
import { useState } from 'react';
import { useQuery } from 'urql';
import { GET_SYSTEM_SHOWCASES_QUERY } from '@/shared/api/operations';
import { EqualizerVisualizer } from './equalizer-visualizer';

interface SystemShowcaseItem {
  id: string;
  slug: string;
  number: string;
  category: string;
  title: string;
  tagline: string;
  description: string;
  topology: string;
  metrics: string;
  recentLog: string;
  sortOrder: number;
  isActive: boolean;
}

const FALLBACK_1: SystemShowcaseItem = {
  id: 'sc-1',
  slug: 'autonomous-ai-swarm',
  number: '001',
  category: 'AGENTIC INFRASTRUCTURE',
  title: 'Autonomous AI Swarm',
  tagline: 'Complexity. Orchestrated.',
  description: 'A coordinated agent network that researches, reasons, and executes. One supervisor. Parallel intelligence. Traceable decisions.',
  topology: '{}',
  metrics: JSON.stringify({ fps: 60, latency: '18ms', activeAgents: 8 }),
  recentLog: '[14:32:08] task.complete → deliverable.ready',
  sortOrder: 1,
  isActive: true,
};

const FALLBACK_2: SystemShowcaseItem = {
  id: 'sc-2',
  slug: 'high-throughput-graphql',
  number: '002',
  category: 'DATA PLANE',
  title: 'High-Throughput GraphQL',
  tagline: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
  description: 'Persisted queries. Batched resolvers. A data layer built to stay ahead of demand.',
  topology: '{}',
  metrics: JSON.stringify({ fps: 60, p95Latency: '12ms P95' }),
  recentLog: '[14:32:10] batch.resolved 128 keys in 1.4ms',
  sortOrder: 2,
  isActive: true,
};

const FALLBACK_3: SystemShowcaseItem = {
  id: 'sc-3',
  slug: 'omnichannel-sync',
  number: '003',
  category: 'EVENT DELIVERY',
  title: 'Omnichannel Sync',
  tagline: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
  description: 'One event stream. Every touchpoint aligned. Idempotent delivery without duplicate actions.',
  topology: '{}',
  metrics: JSON.stringify({ fps: 60, syncLatency: '21ms SYNC' }),
  recentLog: '[14:32:11] event.dispatched order.paid → 2 targets',
  sortOrder: 3,
  isActive: true,
};

const FALLBACK_SHOWCASES: SystemShowcaseItem[] = [FALLBACK_1, FALLBACK_2, FALLBACK_3];

/**
 * Showcase Widget (React Fiber Deterministic Shell)
 * Connected directly to `systemShowcases` GraphQL query backed by PostgreSQL.
 */
export const ShowcaseWidget: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'QUERY' | 'RESOLVER' | 'CACHE'>('CACHE');

  const [{ data }] = useQuery({ query: GET_SYSTEM_SHOWCASES_QUERY });
  const showcases: SystemShowcaseItem[] =
    data?.systemShowcases && data.systemShowcases.length > 0
      ? data.systemShowcases
      : FALLBACK_SHOWCASES;

  const card1 = showcases.find((s) => s.slug === 'autonomous-ai-swarm') ?? FALLBACK_1;
  const card2 = showcases.find((s) => s.slug === 'high-throughput-graphql') ?? FALLBACK_2;
  const card3 = showcases.find((s) => s.slug === 'omnichannel-sync') ?? FALLBACK_3;

  return (
    <section className="flex flex-col gap-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-2">
            02 / SYSTEMS IN THE FIELD
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-text-primary">
            Complexity. Orchestrated.
          </h2>
          <p className="text-text-secondary m-0 text-[1.05rem]">
            Three architectures. One uncompromising performance discipline.
          </p>
        </div>

        <div className="mono flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/25 text-accent-cyan text-xs font-bold tracking-normal">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--accent-cyan)]" />
          DATA SOURCE: IMMUTABLE CATALOG (SSG)
        </div>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)] gap-6">
        {/* Card 001: Autonomous AI Swarm (Left, Tall) */}
        <div className="card-layer p-8 flex flex-col justify-between gap-6">
          <div>
            <div className="flex justify-between items-center">
              <div className="mono text-xs text-accent-purple tracking-wider font-bold">
                {card1.category} / {card1.number}
              </div>
              <span className="text-accent-purple text-lg">↗</span>
            </div>

            <h3 className="text-2xl sm:text-[1.75rem] font-extrabold tracking-tight my-2 text-text-primary">
              {card1.title}
            </h3>
            <p className="text-text-secondary text-[0.95rem] leading-relaxed m-0">
              {card1.description}
            </p>
          </div>

          {/* Topology Canvas Preview */}
          <div className="bg-bg-surface border border-border-subtle rounded-xl p-5 flex flex-col gap-4">
            <div className="mono text-[0.68rem] text-text-tertiary tracking-wider text-center">
              ORCHESTRATION TOPOLOGY / 08 WORKERS / 01 SUPERVISOR
            </div>

            {/* Interactive Flow Diagram */}
            <div className="grid grid-cols-[1fr_1.2fr_1fr] grid-rows-2 gap-4 items-center min-h-[180px]">
              {/* RESEARCH Node */}
              <div className="p-2.5 sm:px-3 rounded-md bg-bg-card border border-border-subtle">
                <div className="mono text-[0.7rem] font-bold text-text-primary">RESEARCH</div>
                <div className="mono text-[0.62rem] text-text-tertiary">agent-01 / gathering</div>
              </div>

              {/* Center SUPERVISOR Node */}
              <div className="row-span-2 col-start-2 p-4 rounded-md bg-purple-500/10 border border-accent-purple shadow-[0_0_20px_rgba(192,132,252,0.2)] text-center">
                <div className="mono text-[0.8rem] font-extrabold text-accent-purple">
                  SUPERVISOR
                </div>
                <div className="mono text-[0.65rem] text-text-secondary mt-1">
                  context / 128k
                </div>
              </div>

              {/* EXECUTION Node */}
              <div className="p-2.5 sm:px-3 rounded-md bg-bg-card border border-border-subtle">
                <div className="mono text-[0.7rem] font-bold text-text-primary">EXECUTION</div>
                <div className="mono text-[0.62rem] text-text-tertiary">agent-03 / running</div>
              </div>

              {/* REASONING Node */}
              <div className="p-2.5 sm:px-3 rounded-md bg-bg-card border border-border-subtle">
                <div className="mono text-[0.7rem] font-bold text-text-primary">REASONING</div>
                <div className="mono text-[0.62rem] text-text-tertiary">agent-02 / planning</div>
              </div>

              {/* VALIDATION Node */}
              <div className="p-2.5 sm:px-3 rounded-md bg-bg-card border border-border-subtle">
                <div className="mono text-[0.7rem] font-bold text-text-primary">VALIDATION</div>
                <div className="mono text-[0.62rem] text-text-tertiary">agent-04 / passing</div>
              </div>
            </div>

            {/* Legend */}
            <div className="mono flex justify-center gap-6 text-[0.65rem] text-text-tertiary">
              <span>─── EVENT BUS</span>
              <span>------ SHARED CONTEXT</span>
            </div>
          </div>

          {/* Telemetry Badges */}
          <div className="flex items-center gap-3 flex-wrap">
            <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-accent-green text-[0.7rem] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
              60 FPS LIVE
            </span>

            <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400/10 text-accent-cyan text-[0.7rem] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
              18ms LATENCY
            </span>

            <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-500/10 text-accent-purple text-[0.7rem] font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-accent-purple" />
              08 AGENTS
            </span>
          </div>

          {/* Terminal log */}
          <div className="mono px-3.5 py-2.5 rounded bg-bg-surface border border-border-subtle text-[0.7rem] text-text-secondary flex justify-between">
            <span>{card1.recentLog}</span>
            <span className="text-text-tertiary">BUN / FSD 2.1</span>
          </div>
        </div>

        {/* Right Stack: Card 002 & Card 003 */}
        <div className="flex flex-col gap-6">
          {/* Card 002: High-Throughput GraphQL */}
          <div className="card-layer p-7 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="mono text-xs text-accent-cyan tracking-wider font-bold">
                {card2.category} / {card2.number}
              </div>
              <span className="text-accent-cyan text-lg">↗</span>
            </div>

            <h3 className="text-2xl font-extrabold m-0 text-text-primary">
              {card2.title}
            </h3>
            <p className="text-text-secondary text-sm leading-normal m-0">
              {card2.description}
            </p>

            {/* Equalizer Visualizer & Tabs */}
            <div className="bg-bg-surface border border-border-subtle rounded-md p-4 flex flex-col gap-3">
              <div className="flex gap-2">
                {(['QUERY', 'RESOLVER', 'CACHE'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setActiveTab(tab)}
                    className={`mono flex-1 py-1.5 rounded text-[0.68rem] font-bold cursor-pointer transition-colors ${
                      activeTab === tab
                        ? 'bg-sky-400/15 text-accent-cyan border border-accent-cyan'
                        : 'bg-bg-card text-text-tertiary border border-border-subtle'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Isolated Equalizer Bars UI Element (useRef DOM binding) */}
              <EqualizerVisualizer />
            </div>

            {/* Badges */}
            <div className="flex gap-3">
              <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-accent-green text-[0.7rem] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                60 FPS LIVE
              </span>
              <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400/10 text-accent-cyan text-[0.7rem] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                12ms P95
              </span>
            </div>
          </div>

          {/* Card 003: Omnichannel Sync */}
          <div className="card-layer p-7 flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <div className="mono text-xs text-accent-cyan tracking-wider font-bold">
                {card3.category} / {card3.number}
              </div>
              <span className="text-accent-cyan text-lg">↗</span>
            </div>

            <h3 className="text-2xl font-extrabold m-0 text-text-primary">
              {card3.title}
            </h3>
            <p className="text-text-secondary text-sm leading-normal m-0">
              {card3.description}
            </p>

            {/* Event Flow Diagram */}
            <div className="bg-bg-surface border border-border-subtle rounded-md p-4 flex items-center gap-4">
              <div>
                <div className="mono text-[0.62rem] text-text-tertiary">EVENT SOURCE</div>
                <div className="mono text-[0.85rem] font-bold text-text-primary">order.paid</div>
              </div>

              <div className="text-accent-cyan text-lg">→</div>

              <div className="flex flex-col gap-1.5 flex-1">
                <div className="mono px-2.5 py-1.5 rounded bg-bg-card border border-border-subtle text-[0.7rem] flex justify-between items-center text-text-primary">
                  <span>✈ TELEGRAM</span>
                  <span className="text-accent-green font-semibold">✓ SYNCED</span>
                </div>
                <div className="mono px-2.5 py-1.5 rounded bg-bg-card border border-border-subtle text-[0.7rem] flex justify-between items-center text-text-primary">
                  <span>⎘ WEB + CRM</span>
                  <span className="text-accent-green font-semibold">✓ SYNCED</span>
                </div>
              </div>
            </div>

            {/* Badges */}
            <div className="flex gap-3">
              <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-accent-green text-[0.7rem] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-green" />
                60 FPS LIVE
              </span>
              <span className="mono inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-400/10 text-accent-cyan text-[0.7rem] font-semibold">
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan" />
                21ms SYNC
              </span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
