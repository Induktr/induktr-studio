import { describe, expect, it } from 'vitest';
import { createElement } from 'react';
import { renderToString } from 'react-dom/server';
import { CasesWidget, CASES_DATA } from './cases-widget';

describe('CasesWidget & Engineering Lab Journal', () => {
  it('renders section header, filter tabs, and case metrics', () => {
    const html = renderToString(createElement(CasesWidget, {}));

    // Header badge & title
    expect(html).toContain('03 / PROVEN ARCHITECTURES &amp; LAB JOURNAL');
    expect(html).toContain('Battle-tested systems and studio culture.');

    // Filter tabs
    expect(html).toContain('ALL');
    expect(html).toContain('PRODUCTION CASES');
    expect(html).toContain('STUDIO LIFE &amp; CULTURE');
    expect(html).toContain('R&amp;D LAB');

    // Production case studies & metrics
    expect(html).toContain('Fintech High-Frequency Gateway');
    expect(html).toContain('82,000 RPS');
    expect(html).toContain('&lt; 3.8ms');
    expect(html).toContain('Decentralized Sovereign Storage');
    expect(html).toContain('1.2 PB LIVE');
    expect(html).toContain('Autonomous AI Multi-Agent Swarm');
    expect(html).toContain('14 AGENTS');

    // Studio Life essays
    expect(html).toContain('Behind the Curtains: How Induktr Studio Orchestrates AI Agents');
    expect(html).toContain('The Zero-Mock Paradigm: Moving from Mock Fallbacks to Neon PostgreSQL');
    expect(html).toContain('Our Coding Philosophy: No Abstraction Tax');

    // R&D Lab benchmarks
    expect(html).toContain('Sub-10ms Edge State Synchronization Protocol');
    expect(html).toContain('Neural Query Planner for Vector Hybrid Search');
  });

  it('guarantees high-resolution architecture blueprint images and titles on all entries', () => {
    expect(CASES_DATA.length).toBeGreaterThanOrEqual(8);

    for (const item of CASES_DATA) {
      expect(item.image).toBeDefined();
      expect(typeof item.image).toBe('string');
      expect(item.image).toMatch(/^https:\/\/images\.unsplash\.com\//);
      expect(item.blueprintTitle).toBeDefined();
      expect(typeof item.blueprintTitle).toBe('string');
      expect(item.blueprintTitle.length).toBeGreaterThan(5);
    }
  });

  it('renders architecture blueprint triggers and previews in SSR output', () => {
    const html = renderToString(createElement(CasesWidget, {}));

    // Blueprint preview banner elements
    expect(html).toContain('SYS_TOPOLOGY // v2.0');
    expect(html).toContain('Inspect Blueprint');
    expect(html).toContain('Inspect Architecture');
    expect(html).toContain('SYS-ARCH // Low-Latency Order Matching &amp; IPC Topology');
    expect(html).toContain('STUDIO-ESSAY // Multi-Agent Micro-Domain Dispatch &amp; Verification Pipeline');
    expect(html).toContain('R&amp;D-LAB // Wasm State-Based CRDT Delta Mesh Topology');
  });
});
