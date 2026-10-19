/**
 * Workers KV adapter for the access-mode key (AGENTS.md rule 2: all KV access
 * lives behind adapters, so a KV→D1 migration is a swap of this file). The
 * pure decision core and the per-isolate memo live in access-mode.ts; this
 * class only moves bytes.
 */

import type { KVNamespace } from '@cloudflare/workers-types';
import { ACCESS_MODE_KV_KEY, type AccessMode } from '../access-mode';

export interface AccessModeKvStore {
  /** The stored override (null when the key is absent). */
  get(): Promise<string | null>;
  /** Write the override (plain 'public' | 'private' string, no TTL). */
  put(mode: AccessMode): Promise<void>;
}

export class KvAccessModeStore implements AccessModeKvStore {
  constructor(private readonly kv: KVNamespace) {}

  async get(): Promise<string | null> {
    return this.kv.get(ACCESS_MODE_KV_KEY);
  }

  async put(mode: AccessMode): Promise<void> {
    await this.kv.put(ACCESS_MODE_KV_KEY, mode);
  }
}
