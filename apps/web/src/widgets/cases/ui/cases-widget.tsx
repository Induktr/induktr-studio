import type React from 'react';
import { useState, useMemo, useCallback } from 'react';
import { VectorGallery } from '@/shared/ui/vector-gallery';
import {
  type CaseStudyCategory,
  type CaseStudyItem,
  CaseStudyCategorySchema,
  CaseStudyItemSchema,
} from '@induktr/contracts';

export type CaseFilter = CaseStudyCategory;
export type CaseItem = CaseStudyItem;
export type ModalViewMode = 'SPECS' | 'BLUEPRINT';
export { CaseStudyCategorySchema, CaseStudyItemSchema };

const RAW_CASES_DATA: readonly CaseItem[] = [
  {
    id: 'case-01',
    slug: 'fintech-hft-gateway',
    title: 'Fintech High-Frequency Gateway',
    category: 'PRODUCTION_CASES',
    tagline: 'Sub-4ms p99 order execution gateway with deterministic state replayability',
    badge: 'ENTERPRISE DEPLOYED',
    readingTime: '5 MIN READ',
    readTime: '5 MIN READ',
    summary:
      'Engineered for an algorithmic trading desk demanding real-time state broadcasts without TCP head-of-line blocking. Combines zero-alloc message parsers with ClickHouse event streaming.',
    challenge:
      'High-frequency order execution and real-time state broadcasts without TCP head-of-line blocking.',
    architecture: [
      'Shared memory ring buffers over domain sockets',
      'Microsecond-precision clock synchronization',
      'Optimistic client reconciliation with WebSockets',
    ],
    architectureHighlights: [
      'Shared memory ring buffers over domain sockets',
      'Microsecond-precision clock synchronization',
      'Optimistic client reconciliation with WebSockets',
    ],
    impact: 'Sub-4ms p99 latency with 82,000 RPS and 99.999% SLA.',
    metrics: [
      { label: 'THROUGHPUT', value: '82,000 RPS', accent: 'cyan' },
      { label: 'P99 LATENCY', value: '< 3.8ms', accent: 'green' },
      { label: 'LCP CORRIDOR', value: '0.38s', accent: 'cyan' },
      { label: 'UPTIME SLA', value: '99.999%', accent: 'purple' },
    ],
    technologies: ['Rust', 'Bun Elysia', 'ClickHouse', 'Tailwind v4', 'WebSockets'],
    stack: ['Rust', 'Bun Elysia', 'ClickHouse', 'Tailwind v4', 'WebSockets'],
    image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'SYS-ARCH // Low-Latency Order Matching & IPC Topology',
  },
  {
    id: 'case-02',
    slug: 'decentralized-storage-gateway',
    title: 'Decentralized Sovereign Storage',
    category: 'PRODUCTION_CASES',
    tagline: 'Zero-knowledge encrypted asset distribution over global edge CDN',
    badge: 'LIVE PRODUCTION',
    readingTime: '6 MIN READ',
    readTime: '6 MIN READ',
    summary:
      'Engineered an immutable cold/hot storage tier for sovereign identity documents and client builds. Automatic replication to S3-compatible endpoints with client-side ChaCha20 encryption.',
    challenge:
      'Immutable distributed storage tier with zero-knowledge encryption across edge CDN nodes.',
    architecture: [
      'ChaCha20-Poly1305 streaming encryption at the browser edge',
      'WAL streaming with Litestream to distributed object stores',
      'Atomic zero-downtime shard rebalancing',
    ],
    architectureHighlights: [
      'ChaCha20-Poly1305 streaming encryption at the browser edge',
      'WAL streaming with Litestream to distributed object stores',
      'Atomic zero-downtime shard rebalancing',
    ],
    impact: '1.2 PB live managed data with 96.4% edge cache hit and sub-800ms failover.',
    metrics: [
      { label: 'DATA MANAGED', value: '1.2 PB LIVE', accent: 'purple' },
      { label: 'EDGE CACHE HIT', value: '96.4%', accent: 'cyan' },
      { label: 'GLOBAL LCP', value: '0.42s', accent: 'cyan' },
      { label: 'FAILOVER', value: '< 800ms', accent: 'green' },
    ],
    technologies: ['Go', 'Neon PostgreSQL', 'Litestream', 'Cloudflare Workers', 'OKLCH'],
    stack: ['Go', 'Neon PostgreSQL', 'Litestream', 'Cloudflare Workers', 'OKLCH'],
    image: 'https://images.unsplash.com/photo-1544197150-b99a580bb7a8?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'SYS-ARCH // ChaCha20 Edge Sharding & S3 Replication Fabric',
  },
  {
    id: 'case-03',
    slug: 'autonomous-ai-swarm',
    title: 'Autonomous AI Multi-Agent Swarm',
    category: 'PRODUCTION_CASES',
    tagline: 'Multi-role collaborative agents with deterministic tool contracts and zero hallucination loops',
    badge: 'AUTONOMOUS / AGENTS',
    readingTime: '7 MIN READ',
    readTime: '7 MIN READ',
    summary:
      'Production multi-agent pipeline replacing human operations in legal doc auditing and contract analysis. Deterministic JSON schema gating eliminates ungrounded hallucination loops.',
    challenge:
      'Multi-agent coordination and elimination of hallucination loops in complex legal doc auditing.',
    architecture: [
      'Schema-enforced JSON validation on every tool call',
      'Context-compression graph with hierarchical memory pruning',
      'Audit trails written directly to tamper-evident ledger',
    ],
    architectureHighlights: [
      'Schema-enforced JSON validation on every tool call',
      'Context-compression graph with hierarchical memory pruning',
      'Audit trails written directly to tamper-evident ledger',
    ],
    impact: '14 active agent swarms, 280ms average turn latency, and -64% context token reduction.',
    metrics: [
      { label: 'ACTIVE SWARMS', value: '14 AGENTS', accent: 'cyan' },
      { label: 'AVG TURN LATENCY', value: '280ms', accent: 'green' },
      { label: 'TOKEN REDUCTION', value: '-64% CONTEXT', accent: 'purple' },
      { label: 'TASK ACCURACY', value: '99.4%', accent: 'cyan' },
    ],
    technologies: ['Python 3.12', 'FastAPI', 'Redis Streams', 'React 19', 'Zod Schemas'],
    stack: ['Python 3.12', 'FastAPI', 'Redis Streams', 'React 19', 'Zod Schemas'],
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'SYS-ARCH // Directed Acyclic Graph (DAG) Agent Orchestration & IPC Ring',
  },
  {
    id: 'story-01',
    slug: 'orchestrating-ai-agents',
    title: 'Behind the Curtains: How Induktr Studio Orchestrates AI Agents',
    category: 'STUDIO_LIFE',
    tagline: 'Studio backstage: moving from monolithic LLM prompts to modular specialized agent networks',
    badge: 'STUDIO ESSAY',
    date: 'OCT 2026',
    readingTime: '6 MIN READ',
    readTime: '6 MIN READ',
    summary:
      'A deep look into Induktr’s internal multi-agent orchestrator. Why generalist prompts fail at scale, how we assign micro-domains to specialized agents, and how our reactive IPC protocol prevents agent deadlocks.',
    challenge:
      'Eliminating deadlocks and context pollution across modular autonomous AI agent networks.',
    architecture: [
      'Strict role separation: architects, coders, and strict verifiers',
      'Task queues backed by Redis streams with deterministic deduplication',
      'Self-healing error boundaries that spawn diagnostic sub-agents',
    ],
    architectureHighlights: [
      'Strict role separation: architects, coders, and strict verifiers',
      'Task queues backed by Redis streams with deterministic deduplication',
      'Self-healing error boundaries that spawn diagnostic sub-agents',
    ],
    impact: 'Deterministic tool-use orchestration with zero agent deadlocks.',
    technologies: ['Multi-Agent Architecture', 'Reactive IPC', 'Sub-second Verification'],
    stack: ['Multi-Agent Architecture', 'Reactive IPC', 'Sub-second Verification'],
    image: 'https://images.unsplash.com/photo-1620712943543-bcc4688e7485?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'STUDIO-ESSAY // Multi-Agent Micro-Domain Dispatch & Verification Pipeline',
  },
  {
    id: 'story-02',
    slug: 'the-zero-mock-paradigm',
    title: 'The Zero-Mock Paradigm: Moving from Mock Fallbacks to Neon PostgreSQL',
    category: 'STUDIO_LIFE',
    tagline: 'Why mock databases poison client trust and how ephemeral serverless databases changed our velocity',
    badge: 'ENGINEERING PRINCIPLE',
    date: 'SEP 2026',
    readingTime: '5 MIN READ',
    readTime: '5 MIN READ',
    summary:
      'For years, frontends ran on brittle JSON mocks that broke the second backend integration started. In Induktr Studio 2.0, every development branch provisions an isolated Neon branch with real data.',
    challenge:
      'Preventing developer velocity regressions and brittle mock decay in full-stack applications.',
    architecture: [
      'Neon copy-on-write instant database branching for PRs',
      'Automated migrations running in pre-commit hooks',
      'Eliminating the "works on mock" cognitive dissonance',
    ],
    architectureHighlights: [
      'Neon copy-on-write instant database branching for PRs',
      'Automated migrations running in pre-commit hooks',
      'Eliminating the "works on mock" cognitive dissonance',
    ],
    impact: 'Zero-mock developer velocity with instant copy-on-write database branches.',
    technologies: ['Neon DB', 'Drizzle ORM', 'Branching Workflows', 'Developer Velocity'],
    stack: ['Neon DB', 'Drizzle ORM', 'Branching Workflows', 'Developer Velocity'],
    image: 'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'STUDIO-ESSAY // Copy-On-Write Branching & Serverless Database Replication',
  },
  {
    id: 'story-03',
    slug: 'no-abstraction-tax',
    title: 'Our Coding Philosophy: No Abstraction Tax',
    category: 'STUDIO_LIFE',
    tagline: 'Radical engineering minimalism in an era of framework over-engineering',
    badge: 'FOUNDING MANIFESTO',
    date: 'AUG 2026',
    readingTime: '4 MIN READ',
    readTime: '4 MIN READ',
    summary:
      'Every abstraction layer is a loan you pay back with compound interest during high-throughput incidents. We leverage native Web Standards, CSS nesting, OKLCH, and explicit state machines.',
    challenge:
      'Escaping bloated framework dependencies and runtime CSS-in-JS abstractions.',
    architecture: [
      'Native URL search params as single source of truth (via nuqs)',
      'Zero CSS-in-JS runtime overhead via modern Tailwind compilation',
      'Colocating data models with their respective domain boundaries',
    ],
    architectureHighlights: [
      'Native URL search params as single source of truth (via nuqs)',
      'Zero CSS-in-JS runtime overhead via modern Tailwind compilation',
      'Colocating data models with their respective domain boundaries',
    ],
    impact: 'Zero runtime waste and predictable memory profiles at scale.',
    technologies: ['Clean Architecture', 'Web Standards', 'Zero Runtime Waste'],
    stack: ['Clean Architecture', 'Web Standards', 'Zero Runtime Waste'],
    image: 'https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'STUDIO-ESSAY // Minimalist Silicon & Zero-Overhead Memory Architecture',
  },
  {
    id: 'rd-01',
    slug: 'edge-state-synchronization',
    title: 'Sub-10ms Edge State Synchronization Protocol',
    category: 'RD_LAB',
    tagline: 'Experimental conflict-free replicated data types compiled to WebAssembly',
    badge: 'R&D / EXPERIMENTAL',
    readingTime: '4 MIN READ',
    readTime: '4 MIN READ',
    summary:
      'Lab experimentation into multi-peer state reconciliation across edge workers and mobile webviews without centralized coordination bottlenecks.',
    challenge:
      'Multi-peer state reconciliation across mobile webviews without centralized coordination bottlenecks.',
    architecture: [
      'State-based CRDT delta propagation over compact binary frames',
      'Zero-allocation memory layout in WebAssembly linear memory',
      'Cross-tab BroadcastChannel synchronization',
    ],
    architectureHighlights: [
      'State-based CRDT delta propagation over compact binary frames',
      'Zero-allocation memory layout in WebAssembly linear memory',
      'Cross-tab BroadcastChannel synchronization',
    ],
    impact: '2.1ms CRDT merge time and 44 KB gzipped Wasm binary footprint.',
    metrics: [
      { label: 'CRDT MERGE', value: '2.1ms', accent: 'cyan' },
      { label: 'WASM BINARY', value: '44 KB GZIP', accent: 'green' },
      { label: 'MEMORY FLOOR', value: '1.4 MB BASE', accent: 'purple' },
    ],
    technologies: ['Rust', 'Wasm-pack', 'CRDT', 'Web Workers'],
    stack: ['Rust', 'Wasm-pack', 'CRDT', 'Web Workers'],
    image: 'https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'R&D-LAB // Wasm State-Based CRDT Delta Mesh Topology',
  },
  {
    id: 'rd-02',
    slug: 'neural-query-planner',
    title: 'Neural Query Planner for Vector Hybrid Search',
    category: 'RD_LAB',
    tagline: 'AVX-512 accelerated HNSW indexing with adaptive semantic filtering',
    badge: 'R&D / BENCHMARK',
    readingTime: '5 MIN READ',
    readTime: '5 MIN READ',
    summary:
      'Benchmarking custom SIMD vector distance routines against standard cosine implementations for dense retrieval in local LLM indexing.',
    challenge:
      'Benchmarking and optimizing SIMD vector dot-product routines for dense retrieval under high indexing load.',
    architecture: [
      'Hardware-tailored AVX-512 dot product routines',
      'Hybrid sparse-dense inverted indexing structures',
      'Dynamic candidate beam width adjustment based on query entropy',
    ],
    architectureHighlights: [
      'Hardware-tailored AVX-512 dot product routines',
      'Hybrid sparse-dense inverted indexing structures',
      'Dynamic candidate beam width adjustment based on query entropy',
    ],
    impact: '4.2x query speedup with 98.4% Recall@10 via AVX-512 FMA.',
    metrics: [
      { label: 'RECALL@10', value: '98.4%', accent: 'cyan' },
      { label: 'QUERY SPEEDUP', value: '4.2x FASTER', accent: 'green' },
      { label: 'SIMD ROUTE', value: 'AVX-512 FMA', accent: 'purple' },
    ],
    technologies: ['C++20', 'SIMD', 'Python Bindings', 'Vector Math'],
    stack: ['C++20', 'SIMD', 'Python Bindings', 'Vector Math'],
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=1600&q=80',
    blueprintTitle: 'R&D-LAB // AVX-512 SIMD Vector Space & HNSW Quantization Manifold',
  },
];

const casesValidation = CaseStudyItemSchema.array().safeParse(RAW_CASES_DATA);
if (!casesValidation.success) {
  console.warn('[CasesWidget] CASES_DATA failed schema validation:', casesValidation.error);
  throw new Error(`[CasesWidget] Invalid CASES_DATA schema: ${casesValidation.error.message}`);
}
export const CASES_DATA: CaseItem[] = casesValidation.data;

const FILTER_TABS: { id: CaseFilter; label: string; sublabel: string }[] = [
  { id: 'ALL', label: 'ALL', sublabel: 'Combined Feed' },
  { id: 'PRODUCTION_CASES', label: 'PRODUCTION CASES', sublabel: 'Client Systems' },
  { id: 'STUDIO_LIFE', label: 'STUDIO LIFE & CULTURE', sublabel: 'Philosophy & Essays' },
  { id: 'RD_LAB', label: 'R&D LAB', sublabel: 'Benchmarks & Prototypes' },
];

export interface CasesWidgetProps {
  readonly onConsultClick?: (caseId: string) => void;
}

export const CasesWidget: React.FC<CasesWidgetProps> = ({ onConsultClick }) => {
  const [activeFilter, setActiveFilter] = useState<CaseFilter>('ALL');
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [modalViewMode, setModalViewMode] = useState<ModalViewMode>('BLUEPRINT');
  const [isModalExpanded, setIsModalExpanded] = useState<boolean>(false);
  const [cardBlueprintView, setCardBlueprintView] = useState<Record<string, boolean>>({});

  const filterCounts = useMemo(() => {
    const counts: Record<CaseFilter, number> = {
      ALL: CASES_DATA.length,
      PRODUCTION_CASES: 0,
      STUDIO_LIFE: 0,
      RD_LAB: 0,
    };
    for (const item of CASES_DATA) {
      counts[item.category] = (counts[item.category] || 0) + 1;
    }
    return counts;
  }, []);

  const filteredCases = useMemo(() => {
    if (activeFilter === 'ALL') return CASES_DATA;
    return CASES_DATA.filter((item) => item.category === activeFilter);
  }, [activeFilter]);

  const activeSelectedCase = useMemo(() => {
    return CASES_DATA.find((c) => c.id === selectedCaseId) ?? null;
  }, [selectedCaseId]);

  const toggleCardView = useCallback((caseId: string) => {
    setCardBlueprintView((prev) => ({
      ...prev,
      [caseId]: !prev[caseId],
    }));
  }, []);

  const openInspector = useCallback((caseId: string, initialMode: ModalViewMode = 'BLUEPRINT') => {
    setSelectedCaseId(caseId);
    setModalViewMode(initialMode);
    setIsModalExpanded(false);
  }, []);

  return (
    <section className="flex flex-col gap-8 w-full">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <div className="mono text-xs text-accent-cyan tracking-wider font-semibold mb-2">
            03 / PROVEN ARCHITECTURES &amp; LAB JOURNAL
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2 text-text-primary">
            Battle-tested systems and studio culture.
          </h2>
          <p className="text-text-secondary m-0 text-[1.05rem]">
            Real client deployments, verified telemetry metrics, and first-hand essays from the Induktr engineering lab.
          </p>
        </div>

        <div className="mono flex items-center gap-2 px-3 py-1.5 rounded-full bg-sky-400/10 border border-sky-400/25 text-accent-cyan text-xs font-bold tracking-normal shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_8px_var(--accent-cyan)]" />
          VERIFIED: {CASES_DATA.length} PRODUCTION ENTRIES
        </div>
      </div>

      {/* Reactive Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-border-subtle pb-4">
        {FILTER_TABS.map((tab) => {
          const isActive = activeFilter === tab.id;
          const count = filterCounts[tab.id];

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
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

      {/* Cases & Essays Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredCases.map((item) => {
          const isProd = item.category === 'PRODUCTION_CASES';
          const isStudioLife = item.category === 'STUDIO_LIFE';
          const isRd = item.category === 'RD_LAB';
          const isCardBlueprintActive = Boolean(cardBlueprintView[item.id]);

          let categoryBadgeColor = 'text-accent-cyan border-sky-400/30 bg-sky-500/10';
          let borderGlow = 'border-sky-500/20';
          if (isStudioLife) {
            categoryBadgeColor = 'text-accent-purple border-purple-400/30 bg-purple-500/10';
            borderGlow = 'border-purple-500/20';
          } else if (isRd) {
            categoryBadgeColor = 'text-accent-green border-green-400/30 bg-green-500/10';
            borderGlow = 'border-green-500/20';
          }

          return (
            <article
              key={item.id}
              className={`card-layer p-8 flex flex-col justify-between gap-6 transition-all hover:border-accent-cyan/40 ${borderGlow}`}
            >
              <div className="flex flex-col gap-4">
                {/* Meta Header */}
                <div className="flex justify-between items-center gap-3">
                  <span
                    className={`mono text-[0.7rem] font-bold px-2.5 py-1 rounded-md border ${categoryBadgeColor}`}
                  >
                    {item.badge}
                  </span>

                  <div className="mono text-xs text-text-tertiary flex items-center gap-2">
                    {item.date && <span>{item.date}</span>}
                    {item.readTime && <span>• {item.readTime}</span>}
                    {isProd && <span>• 2026 AUDITED</span>}
                    {isRd && <span>• EXPERIMENTAL</span>}
                  </div>
                </div>

                {/* Title & Tagline */}
                <div>
                  <h3 className="text-2xl font-extrabold tracking-tight text-text-primary mb-1">
                    {item.title}
                  </h3>
                  <p className="mono text-xs text-accent-cyan font-semibold m-0">
                    {item.tagline}
                  </p>
                </div>

                {/* Architecture Blueprint Card Toggle or Preview Banner */}
                {isCardBlueprintActive ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between gap-2 px-1">
                      <div className="flex items-center gap-2 mono text-xs text-accent-cyan font-semibold">
                        <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse" />
                        <span>INTERACTIVE VECTOR CANVAS</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => toggleCardView(item.id)}
                          className="mono text-[0.68rem] px-2.5 py-1 rounded bg-bg-surface border border-border-card text-text-secondary hover:text-text-primary cursor-pointer transition-colors"
                        >
                          Switch to Spec
                        </button>
                        <button
                          type="button"
                          onClick={() => openInspector(item.id, 'BLUEPRINT')}
                          className="mono text-[0.68rem] px-2.5 py-1 rounded bg-accent-cyan/10 border border-accent-cyan/30 text-accent-cyan hover:bg-accent-cyan/20 cursor-pointer transition-colors"
                          title="Open Fullscreen Blueprint Inspector"
                        >
                          Deep-Dive ↗
                        </button>
                      </div>
                    </div>

                    {/* CSS Containment & GPU Layer Promoted Vector Canvas */}
                    <div
                      className="relative w-full h-72 sm:h-80 rounded-xl overflow-hidden border border-border-subtle bg-[#0a0d14] [contain:paint_layout] will-change-transform"
                      style={{
                        contain: 'paint layout',
                        willChange: 'transform',
                      }}
                    >
                      <VectorGallery
                        src={item.image}
                        alt={`Interactive Blueprint for ${item.title}`}
                        className="w-full h-full"
                        style={{
                          contain: 'paint layout',
                          willChange: 'transform',
                        }}
                        initialZoom={1.0}
                        minZoom={0.2}
                        maxZoom={12.0}
                        showStatusOverlay={true}
                        enableWheelZoomWithoutCtrl={false}
                      />
                    </div>
                    <span className="mono text-[0.65rem] text-text-tertiary px-1">
                      {item.blueprintTitle}
                    </span>
                  </div>
                ) : (
                  <div className="relative group overflow-hidden rounded-xl border border-border-subtle bg-bg-surface">
                    <img
                      src={item.image}
                      alt={item.title}
                      loading="lazy"
                      className="w-full h-44 object-cover object-center filter brightness-[0.75] contrast-[1.1] transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/40 to-transparent pointer-events-none" />

                    <div className="absolute top-2.5 left-2.5 px-2 py-0.5 rounded bg-black/60 backdrop-blur-md border border-white/10 mono text-[0.62rem] text-text-secondary">
                      SYS_TOPOLOGY // v2.0
                    </div>

                    <div className="absolute bottom-2.5 left-2.5 right-2.5 flex items-center justify-between gap-2">
                      <span className="mono text-[0.68rem] font-bold text-white/90 truncate max-w-[65%] drop-shadow-md">
                        {item.blueprintTitle}
                      </span>
                      <button
                        type="button"
                        onClick={() => toggleCardView(item.id)}
                        className="mono text-[0.68rem] font-bold px-2.5 py-1 rounded bg-accent-cyan/20 backdrop-blur-md border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan hover:text-[#071018] transition-all cursor-pointer shadow-lg shrink-0"
                      >
                        Inspect Blueprint 📐
                      </button>
                    </div>
                  </div>
                )}

                {/* Metrics Box (for production and R&D cases) */}
                {item.metrics && item.metrics.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-bg-surface border border-border-subtle rounded-xl p-3">
                    {item.metrics.map((metric) => {
                      let accentClass = 'text-accent-cyan';
                      if (metric.accent === 'green') accentClass = 'text-accent-green';
                      if (metric.accent === 'purple') accentClass = 'text-accent-purple';

                      return (
                        <div
                          key={metric.label}
                          className="flex flex-col gap-0.5 p-2 rounded bg-bg-card border border-border-subtle"
                        >
                          <span className="mono text-[0.62rem] text-text-tertiary">
                            {metric.label}
                          </span>
                          <span className={`mono text-xs font-bold ${accentClass}`}>
                            {metric.value}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Summary */}
                <p className="text-text-secondary text-[0.95rem] leading-relaxed m-0">
                  {item.summary}
                </p>

                {/* Architecture Highlights */}
                <div className="flex flex-col gap-1.5 pt-2 border-t border-border-subtle">
                  <span className="mono text-[0.68rem] font-bold text-text-tertiary tracking-wider">
                    {isStudioLife ? 'CORE PRINCIPLES:' : 'ARCHITECTURAL ADVANTAGES:'}
                  </span>
                  <ul className="flex flex-col gap-1.5 m-0 p-0 list-none">
                    {(item.architectureHighlights ?? []).map((highlight) => (
                      <li
                        key={highlight}
                        className="text-xs text-text-secondary flex items-start gap-2"
                      >
                        <span className="text-accent-cyan font-bold">›</span>
                        <span>{highlight}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Card Footer: Tech Stack Tags & Interactive Action */}
              <div className="flex flex-col gap-4 pt-2 border-t border-border-subtle">
                {item.stack && (
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {item.stack.map((tech) => (
                      <span
                        key={tech}
                        className="mono text-[0.65rem] px-2 py-0.5 rounded bg-bg-surface border border-border-card text-text-secondary"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => openInspector(item.id, 'BLUEPRINT')}
                    className="mono flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-bg-surface border border-border-card text-xs font-bold text-text-primary hover:border-accent-cyan transition-colors cursor-pointer"
                  >
                    <span>{isStudioLife ? 'Inspect Blueprint' : 'Inspect Architecture'}</span>
                    <span className="icon-directional">↗</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onConsultClick && onConsultClick(item.id)}
                    className="mono flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-md bg-sky-500/10 border border-sky-400/30 text-xs font-bold text-accent-cyan hover:bg-sky-400/20 transition-colors cursor-pointer"
                  >
                    <span>{isStudioLife ? 'Join Discussion' : 'Inquire Stack'}</span>
                    <span>⚡</span>
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>

      {/* Modal / Deep-Dive Inspector Sheet with Vector Gallery */}
      {activeSelectedCase && (
        <dialog
          open
          aria-modal="true"
          aria-label={`Deep Dive Inspector: ${activeSelectedCase.title}`}
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md border-0 w-full h-full max-w-none max-h-none m-0"
        >
          <button
            type="button"
            aria-label="Close dialog backdrop"
            className="absolute inset-0 w-full h-full bg-transparent border-none p-0 m-0 cursor-default"
            onClick={() => setSelectedCaseId(null)}
          />

          <div
            className={`relative z-10 card-layer w-full p-6 sm:p-8 flex flex-col gap-6 overflow-y-auto border border-accent-cyan/40 shadow-[0_0_40px_rgba(38,181,244,0.25)] transition-all duration-300 ${
              isModalExpanded
                ? 'max-w-7xl h-[94vh] max-h-[94vh]'
                : 'max-w-3xl max-h-[88vh]'
            }`}
          >
            {/* Modal Header */}
            <div className="flex justify-between items-start gap-4 pb-3 border-b border-border-subtle">
              <div>
                <div className="flex items-center gap-2">
                  <span className="mono text-xs text-accent-cyan font-bold tracking-wider">
                    {activeSelectedCase.badge}
                  </span>
                  <span className="text-text-tertiary mono text-xs">•</span>
                  <span className="mono text-xs text-text-tertiary">
                    {activeSelectedCase.category}
                  </span>
                </div>
                <h3 className="text-2xl sm:text-3xl font-extrabold text-text-primary mt-1">
                  {activeSelectedCase.title}
                </h3>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {modalViewMode === 'BLUEPRINT' && (
                  <button
                    type="button"
                    onClick={() => setIsModalExpanded((prev) => !prev)}
                    aria-label={isModalExpanded ? 'Shrink Inspector' : 'Expand to Fullscreen'}
                    className="mono text-xs px-3 py-1.5 rounded bg-bg-surface border border-border-card text-accent-cyan hover:bg-accent-cyan/10 transition-colors cursor-pointer"
                  >
                    {isModalExpanded ? '⛶ Normal Canvas' : '⛶ Expand Canvas'}
                  </button>
                )}
                <button
                  type="button"
                  aria-label="Close Inspector"
                  onClick={() => setSelectedCaseId(null)}
                  className="mono text-sm px-3 py-1.5 rounded bg-bg-surface border border-border-card text-text-secondary hover:text-text-primary hover:border-accent-cyan cursor-pointer transition-colors"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* View Switcher Tabs: Spec vs Interactive Blueprint Canvas */}
            <div className="flex items-center gap-2 border-b border-border-subtle pb-3">
              <button
                type="button"
                onClick={() => setModalViewMode('SPECS')}
                className={`mono text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-2 border ${
                  modalViewMode === 'SPECS'
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-[0_0_12px_rgba(38,181,244,0.15)]'
                    : 'bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary'
                }`}
              >
                <span>📄 System Specification &amp; Analysis</span>
              </button>

              <button
                type="button"
                onClick={() => setModalViewMode('BLUEPRINT')}
                className={`mono text-xs font-bold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all flex items-center gap-2 border ${
                  modalViewMode === 'BLUEPRINT'
                    ? 'bg-accent-cyan/15 text-accent-cyan border-accent-cyan/40 shadow-[0_0_12px_rgba(38,181,244,0.15)]'
                    : 'bg-bg-surface text-text-secondary border-border-subtle hover:text-text-primary'
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse" />
                <span>📐 Interactive Architecture Blueprint</span>
              </button>
            </div>

            {/* Tab 1: System Specification & Analysis */}
            {modalViewMode === 'SPECS' && (
              <div className="flex flex-col gap-6">
                <p className="text-text-secondary text-sm leading-relaxed m-0 whitespace-pre-line">
                  {activeSelectedCase.summary}
                </p>

                {activeSelectedCase.metrics && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-bg-surface p-4 rounded-xl border border-border-subtle">
                    {activeSelectedCase.metrics.map((m) => (
                      <div key={m.label} className="flex flex-col">
                        <span className="mono text-[0.65rem] text-text-tertiary">{m.label}</span>
                        <span className="mono text-base font-bold text-accent-cyan">{m.value}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Blueprint Teaser Banner */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-xl bg-bg-surface border border-accent-cyan/30">
                  <div className="flex items-center gap-3">
                    <img
                      src={activeSelectedCase.image}
                      alt={activeSelectedCase.title}
                      className="w-16 h-16 rounded-lg object-cover border border-white/10 shrink-0"
                    />
                    <div>
                      <div className="mono text-xs font-bold text-text-primary">
                        {activeSelectedCase.blueprintTitle}
                      </div>
                      <div className="mono text-[0.68rem] text-text-tertiary">
                        Zero-latency pan/zoom architectural manifold ready for interactive inspection.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setModalViewMode('BLUEPRINT')}
                    className="mono text-xs font-bold px-3.5 py-2 rounded bg-accent-cyan/15 border border-accent-cyan/40 text-accent-cyan hover:bg-accent-cyan hover:text-[#071018] transition-all cursor-pointer shrink-0"
                  >
                    Open Blueprint Canvas ↗
                  </button>
                </div>

                <div className="flex flex-col gap-2">
                  <span className="mono text-xs font-bold text-text-primary">
                    Technical Blueprint &amp; Guardrails:
                  </span>
                  <ul className="flex flex-col gap-2 m-0 p-0 list-none">
                    {(activeSelectedCase.architectureHighlights ?? []).map((h) => (
                      <li key={h} className="text-xs text-text-secondary flex items-start gap-2">
                        <span className="text-accent-cyan font-bold">✔</span>
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {activeSelectedCase.stack && (
                  <div className="flex flex-col gap-2">
                    <span className="mono text-xs font-bold text-text-primary">
                      Verified Technology Stack:
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {activeSelectedCase.stack.map((t) => (
                        <span
                          key={t}
                          className="mono text-xs px-2.5 py-1 rounded bg-bg-surface border border-border-card text-accent-cyan"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Interactive Architecture Blueprint (Vector Gallery) */}
            {modalViewMode === 'BLUEPRINT' && (
              <div className="flex flex-col gap-3">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1">
                  <div>
                    <span className="mono text-xs font-bold text-accent-cyan">
                      {activeSelectedCase.blueprintTitle}
                    </span>
                  </div>
                  <div className="mono text-[0.65rem] text-text-tertiary">
                    Drag to pan • Ctrl + Scroll / Pinch to zoom • Ctrl + 0 to reset • Double-click to center
                  </div>
                </div>

                {/* Vector Gallery with CSS Containment and GPU Layer Promotion */}
                <div
                  className={`relative w-full rounded-xl overflow-hidden border border-accent-cyan/40 bg-[#0a0d14] [contain:paint_layout] will-change-transform ${
                    isModalExpanded ? 'h-[68vh]' : 'h-[440px] sm:h-[500px]'
                  }`}
                  style={{
                    contain: 'paint layout',
                    willChange: 'transform',
                  }}
                >
                  <VectorGallery
                    src={activeSelectedCase.image}
                    alt={`High-resolution architectural topology blueprint for ${activeSelectedCase.title}`}
                    className="w-full h-full"
                    style={{
                      contain: 'paint layout',
                      willChange: 'transform',
                    }}
                    initialZoom={1.0}
                    minZoom={0.2}
                    maxZoom={12.0}
                    zoomStep={1.25}
                    showStatusOverlay={true}
                    enableWheelZoomWithoutCtrl={false}
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 px-1 pt-1">
                  <span className="mono text-[0.68rem] text-text-secondary">
                    Isolated GPU composite layer • Zero React Fiber layout recalculation on viewport drag
                  </span>
                  <button
                    type="button"
                    onClick={() => setModalViewMode('SPECS')}
                    className="mono text-xs text-accent-cyan hover:underline cursor-pointer"
                  >
                    ← Switch back to text analysis
                  </button>
                </div>
              </div>
            )}

            {/* Modal Actions Footer */}
            <div className="flex justify-end gap-3 pt-4 border-t border-border-subtle mt-auto">
              <button
                type="button"
                onClick={() => setSelectedCaseId(null)}
                className="mono text-xs font-bold px-4 py-2 rounded bg-bg-surface border border-border-card text-text-primary hover:border-accent-cyan cursor-pointer transition-colors"
              >
                Close Inspector
              </button>
              <button
                type="button"
                onClick={() => {
                  setSelectedCaseId(null);
                  if (onConsultClick) onConsultClick(activeSelectedCase.id);
                }}
                className="mono text-xs font-bold px-4 py-2 rounded bg-accent-cyan-solid text-[#071018] border-0 cursor-pointer shadow-[0_0_12px_rgba(38,181,244,0.3)] hover:opacity-90 transition-opacity"
              >
                Request Architecture Consultation ↗
              </button>
            </div>
          </div>
        </dialog>
      )}
    </section>
  );
};
