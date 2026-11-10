/**
 * Cryptographic & deterministic slug generation for dynamic URL parameters.
 * Format: lead-[8-16 hex chars] (e.g. lead-a7f92e41).
 */

export function generateLeadSlug(): string {
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const buf = new Uint32Array(1);
    crypto.getRandomValues(buf);
    return `lead-${(buf[0] ?? 0).toString(16).padStart(8, '0')}`;
  }

  // Deterministic fallback for environments without crypto.getRandomValues
  const timestampHex = Math.floor(Date.now() / 1000).toString(16).slice(-4);
  const randomHex = Math.floor(Math.random() * 0xffff).toString(16).padStart(4, '0');
  return `lead-${timestampHex}${randomHex}`;
}

export function isValidLeadSlug(slug: string | null | undefined): boolean {
  if (!slug || typeof slug !== 'string') return false;
  return /^lead-[a-f0-9]{8,16}$/i.test(slug.trim());
}

export function formatLeadSlug(slug: string): string {
  return slug.toUpperCase();
}
