import { describe, expect, it } from 'vitest';
import {
  createSterileDictionary,
  deepFreeze,
  isCyclicGraph,
  packMapToSterileObject,
  pickWhiteList,
  safeAssignDescriptors,
  safeCycleProofSerialize,
  sanitizePayloadBySchema,
  updateInImmutable,
} from './objects';

describe('Induktr Studio — High-Integrity JS Object Primitives Suite', () => {
  describe('[JS 30] sanitizePayloadBySchema & pickWhiteList', () => {
    it('preserves only whitelisted fields with matching primitive types', () => {
      const payload = {
        name: 'Alexander Foundation',
        age: 32,
        active: true,
        extraInjection: 'DROP TABLE leads;',
        mismatchedType: 'not-a-number',
      };

      const schema = {
        name: 'string',
        age: 'number',
        active: 'boolean',
        mismatchedType: 'number',
      };

      const result = sanitizePayloadBySchema(payload, schema);

      expect(result.name).toBe('Alexander Foundation');
      expect(result.age).toBe(32);
      expect(result.active).toBe(true);
      expect('extraInjection' in result).toBe(false);
      expect('mismatchedType' in result).toBe(false);
    });

    it('guards against null and array values when expectedType is object', () => {
      const payload = {
        metadata: null,
        tags: ['a', 'b'],
        config: { theme: 'dark' },
      };
      const schema = {
        metadata: 'object',
        tags: 'object',
        config: 'object',
      };
      const result = sanitizePayloadBySchema(payload, schema);
      expect('metadata' in result).toBe(false);
      expect('tags' in result).toBe(false);
      expect(result.config).toEqual({ theme: 'dark' });
    });

    it('safely handles non-object inputs by returning sterile frozen dictionary', () => {
      const nullRes = sanitizePayloadBySchema(null, { a: 'string' });
      expect(Object.getPrototypeOf(nullRes)).toBeNull();
      expect(Object.isFrozen(nullRes)).toBe(true);

      const undefRes = sanitizePayloadBySchema(undefined, { a: 'string' });
      expect(Object.getPrototypeOf(undefRes)).toBeNull();
      expect(Object.isFrozen(undefRes)).toBe(true);

      const numRes = sanitizePayloadBySchema(42, { a: 'string' });
      expect(Object.getPrototypeOf(numRes)).toBeNull();
      expect(Object.isFrozen(numRes)).toBe(true);

      const strRes = sanitizePayloadBySchema('str', { a: 'string' });
      expect(Object.getPrototypeOf(strRes)).toBeNull();
      expect(Object.isFrozen(strRes)).toBe(true);

      const pickedNull = pickWhiteList(null as unknown as object, ['a' as never]);
      expect(Object.getPrototypeOf(pickedNull)).toBeNull();
      expect(Object.isFrozen(pickedNull)).toBe(true);
    });

    it('discards prototype pollution attacks (__proto__, constructor, prototype)', () => {
      const maliciousJson = '{"__proto__":{"admin":true},"constructor":{"evil":1},"prototype":{"hacked":true},"username":"nikita"}';
      const parsed = JSON.parse(maliciousJson) as Record<string, unknown>;

      const schema = {
        admin: 'boolean',
        evil: 'number',
        hacked: 'boolean',
        username: 'string',
        __proto__: 'object',
        constructor: 'object',
        prototype: 'object',
      };

      const sanitized = sanitizePayloadBySchema(parsed, schema);

      expect(sanitized.username).toBe('nikita');
      expect('__proto__' in sanitized).toBe(false);
      expect('constructor' in sanitized).toBe(false);
      expect('prototype' in sanitized).toBe(false);
      expect((sanitized as Record<string, unknown>).admin).toBeUndefined();

      // Ensure global Object.prototype was NOT polluted
      const cleanObj = {};
      expect((cleanObj as Record<string, unknown>).admin).toBeUndefined();
      expect((cleanObj as Record<string, unknown>).hacked).toBeUndefined();
    });

    it('ensures sanitized result is a sterile dictionary with null prototype', () => {
      const result = sanitizePayloadBySchema({ id: 'lead-123' }, { id: 'string' });
      expect(Object.getPrototypeOf(result)).toBeNull();
      expect((result as Record<string, unknown>).toString).toBeUndefined();
      expect((result as Record<string, unknown>).valueOf).toBeUndefined();
    });

    it('guarantees object immutability by returning a frozen object', () => {
      const result = sanitizePayloadBySchema({ role: 'ADMIN' }, { role: 'string' });
      expect(Object.isFrozen(result)).toBe(true);
      expect(() => {
        (result as Record<string, unknown>).role = 'HACKER';
      }).toThrow(/Cannot add property|Cannot assign to read only property/);
    });

    it('pickWhiteList: extracts permitted keys with prototype pollution immunity', () => {
      const source = {
        title: 'High Performance Architecture',
        secretKey: 'top_secret_999',
        price: 1500,
      };

      const picked = pickWhiteList(source, ['title', 'price']);
      expect(picked.title).toBe('High Performance Architecture');
      expect(picked.price).toBe(1500);
      expect('secretKey' in picked).toBe(false);
      expect(Object.getPrototypeOf(picked)).toBeNull();
      expect(Object.isFrozen(picked)).toBe(true);

      // Drops magic properties even if explicitly passed in allowedKeys
      const pickedMalicious = pickWhiteList(source, ['__proto__', 'constructor', 'title'] as unknown as (keyof typeof source)[]);
      expect('__proto__' in pickedMalicious).toBe(false);
      expect('constructor' in pickedMalicious).toBe(false);
      expect(pickedMalicious.title).toBe('High Performance Architecture');
    });
  });

  describe('[JS 28] safeAssignDescriptors', () => {
    it('resolves Accessor vs Data descriptor conflict without throwing TypeError', () => {
      const target = { existing: 1 };

      // Manually construct invalid conflicting descriptor: has getter AND value/writable
      const conflictingDesc: PropertyDescriptor = {
        get() {
          return 'dynamic_computed_val';
        },
        value: 'conflicting_value',
        writable: true,
        enumerable: true,
        configurable: true,
      };

      // In raw Object.defineProperties, this would throw fatal TypeError:
      // "Invalid property descriptor. Cannot both specify accessors and a value or writable attribute"
      expect(() => {
        Object.defineProperties({}, { test: conflictingDesc });
      }).toThrow(TypeError);

      // Verify safeAssignDescriptors handles accessors cleanly
      const mixedSource = Object.create(null);
      Object.defineProperty(mixedSource, 'getterProp', {
        get() {
          return 'from_getter';
        },
        enumerable: true,
        configurable: true,
      });

      const result = safeAssignDescriptors(target, mixedSource);
      expect(result.existing).toBe(1);
      expect((result as Record<string, unknown>).getterProp).toBe('from_getter');
    });

    it('preserves accessor functionality and Symbol keys correctly', () => {
      let counter = 10;
      const symKey = Symbol('telemetryId');

      const source = {};
      Object.defineProperty(source, 'counter', {
        get() {
          return counter++;
        },
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(source, symKey, {
        value: 'sym-val-42',
        writable: false,
        enumerable: true,
        configurable: true,
      });

      const target = {};
      const merged = safeAssignDescriptors(target, source);

      // Getter should be dynamically invoked on target access
      expect((merged as Record<string, unknown>).counter).toBe(10);
      expect((merged as Record<string, unknown>).counter).toBe(11);
      expect((merged as Record<symbol, unknown>)[symKey]).toBe('sym-val-42');
    });

    it('preserves both accessors and data descriptors without deleting properties or throwing', () => {
      const source = {};
      let val = 'initial';
      Object.defineProperty(source, 'dataProp', {
        value: 123,
        writable: true,
        enumerable: true,
        configurable: true,
      });
      Object.defineProperty(source, 'accessorProp', {
        get() {
          return val;
        },
        set(v: string) {
          val = v;
        },
        enumerable: true,
        configurable: true,
      });

      const target = {};
      const result = safeAssignDescriptors(target, source) as Record<string, unknown>;

      expect(result.dataProp).toBe(123);
      expect(result.accessorProp).toBe('initial');
      result.accessorProp = 'updated';
      expect(val).toBe('updated');
      expect(result.accessorProp).toBe('updated');

      const descData = Object.getOwnPropertyDescriptor(result, 'dataProp');
      expect(descData?.writable).toBe(true);
      expect(descData?.value).toBe(123);

      const descAccessor = Object.getOwnPropertyDescriptor(result, 'accessorProp');
      expect(descAccessor?.get).toBeDefined();
      expect(descAccessor?.set).toBeDefined();
      expect(descAccessor?.value).toBeUndefined();
      expect(descAccessor?.writable).toBeUndefined();
    });
  });

  describe('[JS 27] updateInImmutable (Copy-on-Write Structural Sharing)', () => {
    it('zero allocation: returns exact same reference if updater returns identical value', () => {
      const original = {
        user: {
          profile: {
            name: 'Alexander',
          },
        },
      };

      const result = updateInImmutable(
        original,
        ['user', 'profile', 'name'],
        (prev) => prev, // No-op updater
      );

      expect(result).toBe(original);
    });

    it('zero allocation: supports NaN identity via Object.is', () => {
      const original = {
        metrics: {
          score: NaN,
        },
      };

      const result = updateInImmutable(
        original,
        ['metrics', 'score'],
        () => NaN,
      );

      expect(result).toBe(original);
    });

    it('preserves structural sharing across untouched subtrees', () => {
      const original = {
        user: {
          profile: {
            name: 'Alexander',
            age: 30,
          },
          settings: {
            theme: 'dark',
            notifications: true,
          },
        },
        posts: [
          { id: 1, title: 'Article 1' },
          { id: 2, title: 'Article 2' },
        ],
      };

      const result = updateInImmutable(
        original,
        ['user', 'profile', 'name'],
        () => 'Alexander Great',
      );

      // Updated path segments must produce new object references
      expect(result).not.toBe(original);
      expect(result.user).not.toBe(original.user);
      expect(result.user.profile).not.toBe(original.user.profile);
      expect(result.user.profile.name).toBe('Alexander Great');

      // Untouched branches MUST maintain strict referential identity (Object.is)
      expect(result.user.settings).toBe(original.user.settings);
      expect(result.posts).toBe(original.posts);
      expect(result.user.profile.age).toBe(30);
    });

    it('supports array indexing in path segments', () => {
      const state = {
        leads: [
          { id: 'l1', status: 'NEW' },
          { id: 'l2', status: 'NEW' },
        ],
      };

      const next = updateInImmutable(state, ['leads', '1', 'status'], () => 'QUALIFIED');

      expect(next.leads[1]?.status).toBe('QUALIFIED');
      expect(next.leads[0]).toBe(state.leads[0]); // Untouched lead retains reference
    });

    it('guards against prototype pollution in path segments', () => {
      const state = { user: { name: 'Alex' } };
      const next1 = updateInImmutable(state, ['__proto__', 'polluted'], () => true);
      expect(next1).toBe(state);
      expect(({} as Record<string, unknown>).polluted).toBeUndefined();

      const next2 = updateInImmutable(state, ['constructor', 'prototype', 'polluted'], () => true);
      expect(next2).toBe(state);
    });
  });

  describe('[JS 26] isCyclicGraph & safeCycleProofSerialize', () => {
    it('accurately identifies true cyclic references (A -> B -> A and self-cycle)', () => {
      interface Node {
        name: string;
        next?: Node;
      }

      const nodeA: Node = { name: 'A' };
      const nodeB: Node = { name: 'B' };
      nodeA.next = nodeB;
      nodeB.next = nodeA; // True cycle

      expect(isCyclicGraph(nodeA)).toBe(true);

      const selfRef: { self?: unknown } = {};
      selfRef.self = selfRef;
      expect(isCyclicGraph(selfRef)).toBe(true);
    });

    it('accurately identifies DAGs (diamonds) as NOT cyclic', () => {
      // Directed Acyclic Graph (DAG) diamond topology:
      //       A
      //      / \
      //     B   C
      //      \ /
      //       D
      const nodeD = { name: 'D', value: 42 };
      const nodeB = { name: 'B', child: nodeD };
      const nodeC = { name: 'C', child: nodeD };
      const nodeA = { name: 'A', left: nodeB, right: nodeC };

      // Shared child nodeD is reachable via two different paths, but is NOT a cycle!
      expect(isCyclicGraph(nodeA)).toBe(false);
    });

    it('safely serializes cyclic graphs without throwing TypeError using [Circular] placeholder', () => {
      const parent: Record<string, unknown> = { id: 'parent-1' };
      const child: Record<string, unknown> = { id: 'child-1', parent };
      parent.child = child;

      // Standard JSON.stringify fails with "TypeError: Converting circular structure to JSON"
      expect(() => JSON.stringify(parent)).toThrow(TypeError);

      // safeCycleProofSerialize handles the cycle gracefully
      const json = safeCycleProofSerialize(parent);
      expect(json).toBeDefined();
      expect(json).toContain('"child":{"id":"child-1","parent":"[Circular]"}');

      // Custom placeholder test
      const customJson = safeCycleProofSerialize(parent, '<<LOOP>>');
      expect(customJson).toContain('"parent":"<<LOOP>>"');
    });

    it('serializes standard acyclic structures identical to JSON.stringify', () => {
      const data = { user: 'alex', count: 42, active: true };
      expect(safeCycleProofSerialize(data)).toBe(JSON.stringify(data));
    });
  });

  describe('createSterileDictionary & deepFreeze', () => {
    it('creates sterile null-prototype dictionary and rejects prototype attack keys', () => {
      const initial: Record<string, unknown> = {
        a: 10,
        b: 'test',
      };
      Object.defineProperty(initial, '__proto__', {
        value: { evil: true },
        enumerable: true,
        configurable: true,
      });

      const dict = createSterileDictionary<{ a: number; b: string }>(
        initial as unknown as Partial<{ a: number; b: string }>,
      );

      expect(Object.getPrototypeOf(dict)).toBeNull();
      expect(dict.a).toBe(10);
      expect(dict.b).toBe('test');
      expect('__proto__' in dict).toBe(false);
    });

    it('deepFreeze: recursively freezes object graphs without deadlocking on cycles', () => {
      const tree: Record<string, unknown> = {
        level1: {
          level2: {
            title: 'Immutable Leaf',
            items: [1, 2, 3],
          },
        },
      };

      // Add a cycle to verify cycle-resistant recursion
      tree.cycle = tree;

      const frozen = deepFreeze(tree);
      expect(Object.isFrozen(frozen)).toBe(true);
      expect(Object.isFrozen((frozen.level1 as Record<string, unknown>).level2)).toBe(true);
      expect(Object.isFrozen(((frozen.level1 as Record<string, unknown>).level2 as Record<string, unknown>).items)).toBe(true);
    });
  });

  describe('[JS 31] packMapToSterileObject', () => {
    it('correctly packs key-value pairs into a null-prototype frozen object', () => {
      const map = new Map<string, string>([
        ['en', 'English'],
        ['ua', 'Ukrainian'],
        ['de', 'German'],
      ]);

      const packed = packMapToSterileObject(map);

      expect(Object.getPrototypeOf(packed)).toBeNull();
      expect(Object.isFrozen(packed)).toBe(true);
      expect(packed.en).toBe('English');
      expect(packed.ua).toBe('Ukrainian');
      expect(packed.de).toBe('German');
      expect(Object.keys(packed)).toEqual(['en', 'ua', 'de']);
    });

    it('filters out __proto__, constructor, and prototype keys', () => {
      const map = new Map<string, unknown>([
        ['__proto__', { admin: true }],
        ['constructor', () => {}],
        ['prototype', { hack: 1 }],
        ['safeKey', 'safeValue'],
      ]);

      const packed = packMapToSterileObject(map);

      expect(Object.getPrototypeOf(packed)).toBeNull();
      expect(Object.isFrozen(packed)).toBe(true);
      expect('__proto__' in packed).toBe(false);
      expect('constructor' in packed).toBe(false);
      expect('prototype' in packed).toBe(false);
      expect(packed.safeKey).toBe('safeValue');
      expect(Object.keys(packed)).toEqual(['safeKey']);
    });

    it('handles empty Map correctly (0 properties, null prototype, frozen)', () => {
      const emptyMap = new Map<string, number>();
      const packed = packMapToSterileObject(emptyMap);

      expect(Object.getPrototypeOf(packed)).toBeNull();
      expect(Object.isFrozen(packed)).toBe(true);
      expect(Object.keys(packed)).toHaveLength(0);
      expect(Reflect.ownKeys(packed)).toHaveLength(0);
    });
  });
});
