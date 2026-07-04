import type { BambuRawProfile } from "./loader.js";

/** Resolves BambuStudio's single-string `inherits` chains into flat merged profiles, memoized per (type, name). */
export class BambuResolver {
  private readonly cache = new Map<string, Record<string, unknown>>();

  constructor(private readonly profilesByType: Record<string, Map<string, BambuRawProfile>>) {}

  resolve(type: string, name: string, stack: Set<string> = new Set()): Record<string, unknown> {
    const cacheKey = `${type}:${name}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;
    if (stack.has(cacheKey)) throw new Error(`Circular inherits at ${cacheKey}`);

    const raw = this.profilesByType[type]?.get(name);
    if (!raw) throw new Error(`Unknown Bambu profile [${type}:${name}]`);

    stack.add(cacheKey);
    let merged: Record<string, unknown> = {};
    if (raw.inherits) {
      merged = { ...this.resolve(type, raw.inherits, stack) };
    }
    merged = { ...merged, ...raw };
    stack.delete(cacheKey);

    this.cache.set(cacheKey, merged);
    return merged;
  }
}

/** Bambu stores most scalar values as single-element string arrays (multi-extruder-ready format). */
export function firstValue(resolved: Record<string, unknown>, key: string): string | undefined {
  const value = resolved[key];
  if (Array.isArray(value)) return typeof value[0] === "string" ? value[0] : undefined;
  return typeof value === "string" ? value : undefined;
}

export function numericValue(resolved: Record<string, unknown>, key: string, fallback: number): number {
  const raw = firstValue(resolved, key);
  const parsed = raw !== undefined ? parseFloat(raw) : NaN;
  return Number.isNaN(parsed) ? fallback : parsed;
}
