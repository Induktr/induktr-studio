/**
 * ============================================================================
 * Induktr Studio — High-Integrity JS Object Primitives & Security Engine
 * Grounded in ECMAScript Specifications & V8 Memory Performance Cheat-Sheets:
 * [JS 30] Object Sanitizer & Strict White-List Schema Stripping
 * [JS 28] Data vs Accessor Descriptor Mutual Exclusivity
 * [JS 27] Copy-on-Write (Structural Sharing) for Immutable State
 * [JS 26] Cyclic Reference Graph Detector (Cycle-Proof Traversal)
 * ============================================================================
 */

/**
 * [JS 30] Object Sanitizer & Strict White-List Schema Stripping
 * Invariant: Never send raw client objects to the database or storage.
 * Blacklists are inherently incomplete. Sanitization must follow the strict
 * White-List Projection principle, generating an isolated sterile object
 * with a null prototype to completely eliminate prototype pollution.
 */
export function sanitizePayloadBySchema(
  inputPayload: unknown,
  allowedSchema: Record<string, string>,
): Record<string, unknown> {
  if (!inputPayload || typeof inputPayload !== 'object') {
    return Object.freeze(Object.create(null));
  }

  const sanitized: Record<string, unknown> = Object.create(null);
  const allowedKeys = Object.keys(allowedSchema);

  for (let i = 0; i < allowedKeys.length; i++) {
    const key = allowedKeys[i];
    if (key === undefined) continue;
    const expectedType = allowedSchema[key];

    // Prototype pollution prevention: explicitly drop magic properties
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }

    // Always use Object.hasOwn instead of input.hasOwnProperty
    if (Object.hasOwn(inputPayload, key)) {
      const val = (inputPayload as Record<string, unknown>)[key];

      // Guard against typeof null === 'object' and arrays when 'object' is expected
      if (expectedType === 'object' && (val === null || Array.isArray(val))) {
        continue;
      }

      // Strict runtime primitive type verification
      if (typeof val === expectedType) {
        sanitized[key] = val;
      }
    }
  }

  return Object.freeze(sanitized);
}

/**
 * Projects an object onto a strict whitelist of permitted keys.
 * Drops prototype pollution attacks and generates a clean, frozen null-prototype record.
 */
export function pickWhiteList<T extends object, K extends keyof T>(
  obj: T,
  allowedKeys: readonly K[],
): Pick<T, K> {
  if (!obj || typeof obj !== 'object') {
    return Object.freeze(Object.create(null)) as Pick<T, K>;
  }

  const result: Partial<T> = Object.create(null);
  for (let i = 0; i < allowedKeys.length; i++) {
    const key = allowedKeys[i];
    if (key === undefined) continue;
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    if (Object.hasOwn(obj, key)) {
      result[key] = obj[key];
    }
  }
  return Object.freeze(result as Pick<T, K>);
}

/**
 * [JS 28] Data vs Accessor Descriptor Mutual Exclusivity
 * Invariant: In ECMAScript specification, a property descriptor is either
 * a Data Descriptor (has 'value' or 'writable') OR an Accessor Descriptor
 * (has 'get' or 'set'). Attempting to define both simultaneously throws
 * an immediate fatal TypeError in V8.
 */
export function safeAssignDescriptors<T extends object, S extends object>(
  target: T,
  source: S,
): T & S {
  if (!source || typeof source !== 'object') return target as T & S;
  if (!target || typeof target !== 'object') return target as T & S;

  const keys = Reflect.ownKeys(source) as PropertyKey[];

  for (let i = 0; i < keys.length; i++) {
    const k = keys[i];
    if (k === undefined) continue;
    const desc = Object.getOwnPropertyDescriptor(source, k);
    if (!desc) continue;

    const isAccessor = 'get' in desc || 'set' in desc;
    const cleanDesc: PropertyDescriptor = isAccessor
      ? {
          get: desc.get,
          set: desc.set,
          enumerable: desc.enumerable,
          configurable: desc.configurable,
        }
      : {
          value: desc.value,
          writable: desc.writable,
          enumerable: desc.enumerable,
          configurable: desc.configurable,
        };

    Object.defineProperty(target, k, cleanDesc);
  }

  return target as T & S;
}

/**
 * [JS 27] Copy-on-Write (Structural Sharing) for Immutable State
 * Invariant: Never use structuredClone/cloneDeep on single-branch updates.
 * Full clones cause allocation storms in the V8 heap and break React selector
 * referential identity (Object.is). Mutate only the affected branch and
 * preserve references for all untouched subtrees.
 */
export function updateInImmutable<T extends object>(
  state: T,
  pathSegments: readonly string[],
  updater: (val: unknown) => unknown,
): T {
  if (pathSegments.length === 0) return updater(state) as T;

  function step(current: unknown, index: number): unknown {
    if (index >= pathSegments.length) {
      return updater(current);
    }

    const key = pathSegments[index];
    if (key === undefined) {
      return updater(current);
    }

    // Prototype pollution protection for path keys
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      return current;
    }

    const currentSub =
      current && typeof current === 'object'
        ? (current as Record<string, unknown>)[key]
        : undefined;

    const updatedSub = step(currentSub, index + 1);

    // Zero-Allocation Check: If value is identical (Object.is supports NaN and -0/+0), preserve existing state
    if (Object.is(currentSub, updatedSub)) {
      return current;
    }

    if (Array.isArray(current)) {
      const nextArr = [...current];
      nextArr[Number(key)] = updatedSub;
      return nextArr;
    }

    return {
      ...(current as object),
      [key]: updatedSub,
    };
  }

  return step(state, 0) as T;
}

/**
 * [JS 26] Cyclic Reference Graph Detector (Cycle-Proof Traversal)
 * Invariant: Arbitrary object graphs with cyclic references (A -> B -> A)
 * cause call stack overflow (RangeError) or JSON serialization fatal crashes.
 * Uses an ancestor stack Set (backtracking) to distinguish true cycles from DAGs.
 */
export function isCyclicGraph(root: unknown): boolean {
  const ancestorStack = new Set<unknown>();

  function traverse(current: unknown): boolean {
    if (!current || typeof current !== 'object') return false;

    // Cycle detected if current object exists in the active ancestor stack
    if (ancestorStack.has(current)) {
      return true;
    }

    ancestorStack.add(current);

    const keys = Reflect.ownKeys(current);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === undefined) continue;
      const child = (current as Record<string | symbol, unknown>)[k];
      if (child && typeof child === 'object') {
        if (traverse(child)) return true;
      }
    }

    // Backtracking: remove from stack as we pop up the traversal tree
    ancestorStack.delete(current);
    return false;
  }

  return traverse(root);
}

/**
 * Safely serializes an object graph to JSON, replacing circular references
 * with a placeholder instead of throwing TypeError.
 */
export function safeCycleProofSerialize(
  root: unknown,
  fallbackPlaceholder = '[Circular]',
  space?: number,
): string {
  const seen = new WeakSet<object>();

  return JSON.stringify(
    root,
    (_key, value) => {
      if (value !== null && typeof value === 'object') {
        if (seen.has(value)) {
          return fallbackPlaceholder;
        }
        seen.add(value);
      }
      return value;
    },
    space,
  );
}

/**
 * Creates a sterile dictionary object with null prototype.
 * Immune to prototype pollution and hasOwnProperty shadowing.
 */
export function createSterileDictionary<T extends object = Record<string, unknown>>(
  initial?: Partial<T>,
): T {
  const dict: T = Object.create(null);
  if (initial && typeof initial === 'object') {
    const keys = Reflect.ownKeys(initial);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === undefined || k === '__proto__' || k === 'constructor' || k === 'prototype') continue;
      (dict as Record<string | symbol, unknown>)[k] = (initial as Record<string | symbol, unknown>)[k];
    }
  }
  return dict;
}

/**
 * Deep freezes an object graph recursively with cycle protection.
 */
export function deepFreeze<T extends object>(obj: T): Readonly<T> {
  if (!obj || typeof obj !== 'object' || Object.isFrozen(obj)) {
    return obj;
  }

  const visited = new WeakSet<object>();

  function freezeRecursive(current: object): void {
    if (visited.has(current)) return;
    visited.add(current);

    const keys = Reflect.ownKeys(current);
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k === undefined) continue;
      const val = (current as Record<string | symbol, unknown>)[k];
      if (val && typeof val === 'object' && !Object.isFrozen(val)) {
        freezeRecursive(val);
      }
    }

    Object.freeze(current);
  }

  freezeRecursive(obj);
  return obj;
}

/**
 * [JS 31] Zero-Allocation Sterile Map Exporter
 * Packs a Map into an immutable null-prototype record without allocating
 * intermediate entry tuples (unlike Object.fromEntries). Completely immune
 * to prototype pollution and V8 shape transition explosions.
 */
export function packMapToSterileObject<V>(
  map: ReadonlyMap<string, V>,
): Readonly<Record<string, V>> {
  const sterile: Record<string, V> = Object.create(null);
  for (const [key, value] of map.entries()) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype') {
      continue;
    }
    sterile[key] = value;
  }
  return Object.freeze(sterile);
}
