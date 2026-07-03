import type { SectionsByType } from "./ini-parser.js";

export class InheritResolver {
  private readonly cache = new Map<string, Record<string, string>>();

  constructor(private readonly sections: SectionsByType) {}

  /** Resolves a section's full flattened key=value map, following its inherits chain. */
  resolve(type: string, name: string, stack: Set<string> = new Set()): Record<string, string> {
    const cacheKey = `${type}:${name}`;
    const cached = this.cache.get(cacheKey);
    if (cached) return cached;

    if (stack.has(cacheKey)) {
      throw new Error(`Circular inherits detected at ${cacheKey}`);
    }

    const raw = this.sections.get(type)?.get(name);
    if (!raw) {
      throw new Error(`Unknown section [${type}:${name}]`);
    }

    stack.add(cacheKey);
    let merged: Record<string, string> = {};
    for (const parentName of raw.inherits) {
      const parentResolved = this.resolve(type, parentName, stack);
      merged = { ...merged, ...parentResolved };
    }
    merged = { ...merged, ...raw.keys };
    stack.delete(cacheKey);

    this.cache.set(cacheKey, merged);
    return merged;
  }

  namesOfType(type: string): string[] {
    return Array.from(this.sections.get(type)?.keys() ?? []);
  }

  /** Concrete sections are ones whose name is not wrapped in asterisks (abstract base sections). */
  concreteNamesOfType(type: string): string[] {
    return this.namesOfType(type).filter((n) => !(n.startsWith("*") && n.endsWith("*")));
  }
}
