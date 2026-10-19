/**
 * access-mode.test.ts — M-5 (RULES.md §3, T-24): the panic switch's precedence
 * core, its value parsing, and the per-isolate 60-second KV memo.
 *
 * Precedence (spec): PANIC_PRIVATE wins over everything; then the KV runtime
 * override `insights:access-mode:v1`; then the ACCESS_MODE env var; then the
 * legacy SITE_MODE (private unless exactly 'public'); the default is public.
 * ANY 'private' signal wins over a 'public' one ("any private wins") — the
 * fail-closed reading of the back-compat promise.
 */

import { beforeEach, describe, expect, it } from 'vitest';
import {
  ACCESS_MODE_KV_KEY,
  __resetAccessModeMemoForTests,
  isPanicPrivate,
  parseAccessModeValue,
  resolveAccessMode,
  resolveAccessModeForRequest,
} from './access-mode';

describe('isPanicPrivate (PANIC_PRIVATE="true"|"1", case-insensitive)', () => {
  it.each(['true', 'TRUE', 'True', '1', ' 1 '])('truthy: %j → the hard panic is armed', (raw) => {
    expect(isPanicPrivate(raw)).toBe(true);
  });

  it.each([undefined, '', 'false', '0', 'yes', 'private', 'banana'])('not a panic: %j', (raw) => {
    expect(isPanicPrivate(raw)).toBe(false);
  });
});

describe('parseAccessModeValue (the KV override, zod-validated)', () => {
  it('accepts "public"/"private" (case-insensitive, surrounding whitespace tolerated)', () => {
    expect(parseAccessModeValue('public')).toBe('public');
    expect(parseAccessModeValue('private')).toBe('private');
    expect(parseAccessModeValue(' Private ')).toBe('private');
  });

  it('missing or invalid → undefined (fall through to the next layer)', () => {
    expect(parseAccessModeValue(null)).toBeUndefined();
    expect(parseAccessModeValue(undefined)).toBeUndefined();
    expect(parseAccessModeValue('')).toBeUndefined();
    expect(parseAccessModeValue('yes')).toBeUndefined();
    expect(parseAccessModeValue('{"mode":"private"}')).toBeUndefined();
  });
});

describe('resolveAccessMode — the pure precedence core (M-5)', () => {
  const lookupNever = (): 'public' | 'private' | undefined => {
    throw new Error('kvLookup must not be called when the panic already decided');
  };

  it('PANIC_PRIVATE wins over EVERYTHING (KV public, ACCESS_MODE=public, SITE_MODE=public)', () => {
    expect(resolveAccessMode({ PANIC_PRIVATE: 'true', ACCESS_MODE: 'public', SITE_MODE: 'public' }, () => 'public', 'public')).toBe('private');
  });

  it('PANIC_PRIVATE needs no KV read at all (the lookup is never consulted)', () => {
    expect(resolveAccessMode({ PANIC_PRIVATE: '1', SITE_MODE: 'public' }, lookupNever, undefined)).toBe('private');
  });

  it('a KV private override gates even when SITE_MODE=public and nothing else says private', () => {
    expect(resolveAccessMode({ SITE_MODE: 'public' }, () => 'private', undefined)).toBe('private');
  });

  it('a KV private override wins over ACCESS_MODE=public', () => {
    expect(resolveAccessMode({ ACCESS_MODE: 'public', SITE_MODE: 'public' }, () => 'private', undefined)).toBe('private');
  });

  it('ACCESS_MODE=private gates with no KV override (SITE_MODE=public deployed)', () => {
    expect(resolveAccessMode({ ACCESS_MODE: 'private', SITE_MODE: 'public' }, () => undefined, undefined)).toBe('private');
  });

  it('SITE_MODE=public with no PANIC/ACCESS_MODE/KV → public (the default deployment)', () => {
    expect(resolveAccessMode({ SITE_MODE: 'public' }, () => undefined, undefined)).toBe('public');
  });

  it('back-compat: SITE_MODE=private still gates when no ACCESS_MODE/PANIC/KV exists', () => {
    expect(resolveAccessMode({ SITE_MODE: 'private' }, () => undefined, undefined)).toBe('private');
    // The legacy default (SITE_MODE absent) was private too.
    expect(resolveAccessMode({}, () => undefined, undefined)).toBe('private');
  });

  it('any private wins: SITE_MODE=private stays private even against a KV public vote', () => {
    expect(resolveAccessMode({ SITE_MODE: 'private' }, () => 'public', undefined)).toBe('private');
  });

  it('any private wins: ACCESS_MODE=private stays private even against a KV public vote', () => {
    expect(resolveAccessMode({ ACCESS_MODE: 'private', SITE_MODE: 'public' }, () => 'public', undefined)).toBe('private');
  });

  it('an invalid ACCESS_MODE falls through to the SITE_MODE layer (never opens the gate on garbage)', () => {
    expect(resolveAccessMode({ ACCESS_MODE: 'banana', SITE_MODE: 'public' }, () => undefined, undefined)).toBe('public');
    expect(resolveAccessMode({ ACCESS_MODE: 'banana', SITE_MODE: 'private' }, () => undefined, undefined)).toBe('private');
  });

  it('a cached override short-circuits the lookup (the memo means no fresh read)', () => {
    let lookups = 0;
    const counting = () => {
      lookups++;
      return 'private' as const;
    };
    expect(resolveAccessMode({ SITE_MODE: 'public' }, counting, undefined)).toBe('private');
    expect(lookups).toBe(1);
    // The cached value answers without touching the lookup at all.
    expect(resolveAccessMode({ SITE_MODE: 'public' }, counting, 'private')).toBe('private');
    expect(lookups).toBe(1);
  });
});

describe('resolveAccessModeForRequest — the per-isolate 60s KV memo', () => {
  beforeEach(() => __resetAccessModeMemoForTests());

  /** A counting async KV read over a plain string. */
  function countingKv(raw: string | null, delayMs = 0) {
    let reads = 0;
    return {
      get: async (): Promise<string | null> => {
        reads++;
        if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
        return raw;
      },
      count: () => reads,
    };
  }

  it('two resolutions within the TTL → exactly ONE KV read (bounded KV cost)', async () => {
    const kv = countingKv('private');
    const env = { SITE_MODE: 'public' };
    expect(await resolveAccessModeForRequest(env, kv.get, 1_000)).toBe('private');
    expect(await resolveAccessModeForRequest(env, kv.get, 2_000)).toBe('private');
    expect(kv.count()).toBe(1);
  });

  it('after the TTL a fresh read happens (a switch flip is visible within the bound)', async () => {
    const kv = countingKv('private');
    const env = { SITE_MODE: 'public' };
    expect(await resolveAccessModeForRequest(env, kv.get, 1_000)).toBe('private');
    expect(await resolveAccessModeForRequest(env, kv.get, 1_000 + 60_000)).toBe('private');
    expect(kv.count()).toBe(2);
  });

  it('a KV miss is memoized too (a missing key never becomes a per-request read)', async () => {
    const kv = countingKv(null);
    const env = { SITE_MODE: 'public' };
    expect(await resolveAccessModeForRequest(env, kv.get, 1_000)).toBe('public');
    expect(await resolveAccessModeForRequest(env, kv.get, 2_000)).toBe('public');
    expect(kv.count()).toBe(1);
  });

  it('a KV read FAILURE degrades calmly to the env chain (no throw, no memo poisoning)', async () => {
    let reads = 0;
    const failing = async (): Promise<string | null> => {
      reads++;
      throw new Error('KV unreachable');
    };
    const env = { SITE_MODE: 'public' };
    expect(await resolveAccessModeForRequest(env, failing, 1_000)).toBe('public');
    expect(await resolveAccessModeForRequest({ ...env, ACCESS_MODE: 'private' }, failing, 2_000)).toBe('private');
    expect(reads).toBe(2); // failures are retried next request (never cached)
  });

  it('PANIC_PRIVATE answers without any KV read (the hard panic has no KV dependency)', async () => {
    const kv = countingKv('public');
    expect(await resolveAccessModeForRequest({ PANIC_PRIVATE: 'true', SITE_MODE: 'public' }, kv.get, 1_000)).toBe('private');
    expect(kv.count()).toBe(0);
  });

  it(`reads exactly the key ${ACCESS_MODE_KV_KEY} (through the KV adapter)`, async () => {
    let seenKey: string | null = null;
    const kv = {
      get: async (key: string): Promise<string | null> => {
        seenKey = key;
        return 'private';
      },
      put: async (): Promise<void> => {},
    };
    // The pure core takes a zero-arg read closure (the key knowledge lives
    // in the adapter — adapters/access-mode-store.ts, the AGENTS.md rule-2
    // discipline), so the key is pinned at the adapter boundary.
    const { KvAccessModeStore } = await import('./adapters/access-mode-store');
    const store = new KvAccessModeStore(kv as unknown as KVNamespace);
    await resolveAccessModeForRequest({ SITE_MODE: 'public' }, () => store.get(), 1_000);
    expect(seenKey).toBe(ACCESS_MODE_KV_KEY);
  });
});
