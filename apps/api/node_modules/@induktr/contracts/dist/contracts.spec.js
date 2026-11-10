import { describe, it, expect } from 'vitest';
import { CreateLeadSchema, LeadStatusSchema, ProductTypeSchema, ProductCategorySchema, ProductItemSchema, CaseStudyCategorySchema, CaseStudyItemSchema, AffineMatrixSchema, } from './index';
describe('Contracts Verification Suite (IPO-Protocol Validation)', () => {
    it('validates a correct Lead creation payload', () => {
        const validLead = {
            name: 'Alexander Tech',
            contact: '@alex_founder',
            budget: '$5,000 - $10,000',
            description: 'High-performance trading dashboard refactoring to 60 FPS',
            serviceType: 'FULL_CYCLE_ENGINEERING',
        };
        const result = CreateLeadSchema.safeParse(validLead);
        expect(result.success).toBe(true);
    });
    it('rejects an invalid Lead with insufficient characters', () => {
        const invalidLead = {
            name: 'A',
            contact: 'x',
            budget: '',
            description: 'short',
        };
        const result = CreateLeadSchema.safeParse(invalidLead);
        expect(result.success).toBe(false);
    });
    it('validates a correct Lead creation payload with uuid or lead slug idempotencyKey', () => {
        const validLeadWithSlug = {
            name: 'Alexander Tech',
            contact: '@alex_founder',
            budget: '$5,000 - $10,000',
            description: 'High-performance trading dashboard refactoring to 60 FPS',
            serviceType: 'FULL_CYCLE_ENGINEERING',
            idempotencyKey: 'lead-a1b2c3d4',
        };
        expect(CreateLeadSchema.safeParse(validLeadWithSlug).success).toBe(true);
        const validLeadWithUuid = {
            ...validLeadWithSlug,
            idempotencyKey: '123e4567-e89b-12d3-a456-426614174000',
        };
        expect(CreateLeadSchema.safeParse(validLeadWithUuid).success).toBe(true);
        const invalidLeadKey = {
            ...validLeadWithSlug,
            idempotencyKey: 'invalid-key-format',
        };
        expect(CreateLeadSchema.safeParse(invalidLeadKey).success).toBe(false);
    });
    it('validates product taxonomy', () => {
        expect(ProductTypeSchema.options).toContain('UI_KIT');
        expect(ProductTypeSchema.options).toContain('CHEATSHEET_HIGH_LEVEL');
        expect(ProductTypeSchema.options).toContain('CHEATSHEET_LOW_LEVEL');
        expect(LeadStatusSchema.options).toContain('NEW');
    });
    it('validates ProductCategorySchema values and rejects invalid categories', () => {
        const validCategories = ['ALL', 'APPS_TEMPLATES', 'UI_KITS', 'CHEATSHEETS', 'SERVICES'];
        for (const cat of validCategories) {
            expect(ProductCategorySchema.safeParse(cat).success).toBe(true);
        }
        expect(ProductCategorySchema.safeParse('INVALID_CATEGORY').success).toBe(false);
        expect(ProductCategorySchema.safeParse(123).success).toBe(false);
    });
    it('validates ProductItemSchema with complete and minimal payloads', () => {
        const fullProduct = {
            id: 'prod-001',
            slug: 'sovereign-saas',
            title: 'Sovereign SaaS Starter Platform',
            type: 'APPS_TEMPLATES',
            priceUsd: 249,
            description: 'Turnkey full-stack application',
            tier: 'TIER 01',
            badge: 'PROD READY',
            version: 'v2.4',
            fileSize: '48.2 MB',
            componentCount: 52,
            features: ['Bun', 'Tailwind v4'],
            category: 'APPS_TEMPLATES',
        };
        expect(ProductItemSchema.safeParse(fullProduct).success).toBe(true);
        const minimalProduct = {
            id: 'prod-002',
            slug: 'minimal-product',
            title: 'Minimal Product',
            type: 'SERVICES',
            priceUsd: 199,
            description: 'Audit session',
        };
        expect(ProductItemSchema.safeParse(minimalProduct).success).toBe(true);
        const invalidProduct = {
            id: 'prod-003',
        };
        expect(ProductItemSchema.safeParse(invalidProduct).success).toBe(false);
    });
    it('validates CaseStudyCategorySchema values and rejects invalid categories', () => {
        const validCategories = ['ALL', 'PRODUCTION_CASES', 'STUDIO_LIFE', 'RD_LAB'];
        for (const cat of validCategories) {
            expect(CaseStudyCategorySchema.safeParse(cat).success).toBe(true);
        }
        expect(CaseStudyCategorySchema.safeParse('UNKNOWN').success).toBe(false);
    });
    it('validates CaseStudyItemSchema with all required and optional fields', () => {
        const fullCaseStudy = {
            id: 'case-01',
            slug: 'fintech-hft-gateway',
            title: 'Fintech High-Frequency Gateway',
            category: 'PRODUCTION_CASES',
            badge: 'ENTERPRISE DEPLOYED',
            tagline: 'Sub-4ms p99 order execution gateway',
            date: 'OCT 2026',
            readingTime: '4 MIN READ',
            metrics: [
                { label: 'THROUGHPUT', value: '82,000 RPS', accent: 'cyan' },
                { label: 'P99 LATENCY', value: '< 3.8ms', accent: 'green' },
            ],
            technologies: ['Rust', 'Bun Elysia', 'Tailwind v4'],
            image: 'https://images.unsplash.com/photo-1558494949-ef010cbdcc31',
            blueprintTitle: 'SYS-ARCH // Low-Latency Order Matching & IPC Topology',
            challenge: 'High-frequency order processing without TCP head-of-line blocking',
            architecture: ['Shared memory ring buffers', 'Microsecond clock sync'],
            impact: '82k RPS with sub-4ms p99 latency',
        };
        expect(CaseStudyItemSchema.safeParse(fullCaseStudy).success).toBe(true);
        const invalidCaseStudy = {
            id: 'case-02',
            title: 'Incomplete Case Study',
        };
        expect(CaseStudyItemSchema.safeParse(invalidCaseStudy).success).toBe(false);
    });
    it('validates AffineMatrixSchema tuple of 6 finite numbers and rejects invalid matrices', () => {
        const identityMatrix = [1, 0, 0, 1, 0, 0];
        expect(AffineMatrixSchema.safeParse(identityMatrix).success).toBe(true);
        const transformedMatrix = [1.5, 0.2, -0.2, 1.5, 250.75, -120.5];
        expect(AffineMatrixSchema.safeParse(transformedMatrix).success).toBe(true);
        // Rejects non-finite numbers (NaN, Infinity)
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, NaN, 0]).success).toBe(false);
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, Infinity, 0]).success).toBe(false);
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, -Infinity, 0]).success).toBe(false);
        // Rejects invalid lengths (5 or 7 numbers)
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, 0]).success).toBe(false);
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, 0, 0, 0]).success).toBe(false);
        // Rejects non-number elements
        expect(AffineMatrixSchema.safeParse([1, 0, 0, 1, '0', 0]).success).toBe(false);
    });
});
