/**
 * The single Prisma client seam for every desk surface.
 *
 * Two runtimes, one interface:
 *
 * - Sandbox (next dev on port 3000): the default engine path over the
 *   SQLite archive at db/custom.db — the desk of record, unchanged since
 *   S8.
 * - Cloudflare Worker (the Currena deployment): the Rust SQLite engine
 *   cannot run on workerd, so the client is instead constructed with the
 *   PrismaD1 driver adapter over the D1 binding. The binding is read from
 *   OpenNext's request context — the `Symbol.for("__cloudflare-context__")`
 *   property its worker entry installs on the global scope for every
 *   request (the same contract the adapter's public `getCloudflareContext()`
 *   reads; see @opennextjs/cloudflare dist/api/cloudflare-context.js, which
 *   pins that symbol as its stable cross-bundle mechanism). With the
 *   adapter passed, the generated client never loads its engine binary —
 *   the adapter path is the only one taken on the Worker (Prisma requires
 *   the normally-generated client for the adapter option to be valid).
 *
 * The client resolves lazily on the first query (always inside a request
 * handler), so `db` is exported as a chainable proxy that preserves the
 * exact `db.<model>.<method>(...)` call surface every desk layer already
 * uses. OpenNext's own init also copies the Worker's string vars/secrets
 * onto `process.env` (that is how `process.env.EODHD_TOKEN` reaches the
 * EODHD adapter on the Worker).
 *
 * The archive is seeded into D1 by scripts/d1-dump.ts (a read-only
 * snapshot of db/custom.db); from then on the deployed desk persists to
 * its own D1 and the sandbox archive remains the desk of record here.
 */
import { PrismaClient } from "@prisma/client";
import { PrismaD1 } from "@prisma/adapter-d1";

type D1Binding = Parameters<typeof PrismaD1>[0];

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
  [key: symbol]: unknown;
};

/** Sandbox: the engine over the SQLite archive. */
function createSandboxClient(): PrismaClient {
  return new PrismaClient({ log: ["query"] });
}

function isD1Binding(value: unknown): value is D1Binding {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as { prepare?: unknown }).prepare === "function"
  );
}

/**
 * Bind-parameter shim over the D1 binding.
 *
 * @prisma/adapter-d1 serialises DateTime parameters itself (in its
 * `mapArg`: `value.toISOString().replace("Z", "+00:00")`), so what reaches
 * the D1 bind call is the TEXT "2026-11-22T20:06:01.103+00:00". The reader
 * in the engine-generated Prisma client, however, expects DateTime in the
 * engine's storage convention — millis-since-epoch INTEGER, exactly how
 * db/custom.db and the D1 seed store every DateTime — so an un-normalised
 * Worker write makes that row unreadable on its next request (P2023
 * "expected a either an i64 or a f64"). This shim converts both raw Date
 * objects and the adapter's datetime-text bind params to millis at the
 * bind boundary, keeping Worker writes byte-compatible with the archive
 * seed and with Prisma's own reads.
 *
 * The text heuristic is anchored to the exact adapter format
 * (`YYYY-MM-DDTHH:MM:SS[.mmm]+00:00`); no string column in this schema
 * (ids, labels, "YYYY-MM-DD" dates, JSON payloads) can match it.
 */
const D1_DATETIME_TEXT =
  /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?\+00:00$/;

function normalizeD1Param(value: unknown): unknown {
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string" && D1_DATETIME_TEXT.test(value)) {
    return Date.parse(value);
  }
  return value;
}

function wrapD1Statement<T extends object>(statement: T): T {
  return new Proxy(statement, {
    get(target, prop) {
      if (prop === "bind") {
        const bind = Reflect.get(target, "bind", target) as (
          ...args: unknown[]
        ) => T;
        return (...args: unknown[]) => {
          const bound = bind.apply(target, args.map(normalizeD1Param));
          return wrapD1Statement(bound);
        };
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  });
}

function wrapD1Binding(d1: D1Binding): D1Binding {
  return new Proxy(d1 as object, {
    get(target, prop) {
      if (prop === "prepare") {
        const prepare = Reflect.get(target, "prepare", target) as (
          sql: string
        ) => object;
        return (sql: string) =>
          wrapD1Statement(prepare.call(target, sql) as object);
      }
      const value = Reflect.get(target, prop, target);
      return typeof value === "function"
        ? (value as (...a: unknown[]) => unknown).bind(target)
        : value;
    },
  }) as D1Binding;
}

/**
 * Worker: the D1 binding via OpenNext's request context. Returns null when
 * no context is installed (sandbox `next dev` on node) so the engine path
 * takes over.
 */
function resolveWorkerClient(): PrismaClient | null {
  const context = globalForPrisma[Symbol.for("__cloudflare-context__")] as
    | { env?: Record<string, unknown> }
    | undefined;
  const env = context?.env;
  if (!env) return null;
  const d1 = env.DB;
  if (!isD1Binding(d1)) return null;
  return new PrismaClient({ adapter: new PrismaD1(wrapD1Binding(d1)) });
}

const clientRef: { current: PrismaClient | null } = {
  current: globalForPrisma.prisma ?? null,
};
let resolving: Promise<void> | null = null;

async function ensureClient(): Promise<PrismaClient> {
  if (clientRef.current) return clientRef.current;
  if (!resolving) {
    resolving = (async () => {
      const client = resolveWorkerClient() ?? createSandboxClient();
      clientRef.current = client;
      if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = client;
    })();
  }
  await resolving;
  return clientRef.current as PrismaClient;
}

/** Resolve a chain of properties against the client, then apply args. */
async function invokePath(
  path: string[],
  args: unknown[]
): Promise<unknown> {
  const client = await ensureClient();
  let node: unknown = client;
  for (const segment of path.slice(0, -1)) {
    node = Reflect.get(node as object, segment, node);
  }
  const last = path[path.length - 1];
  const value = Reflect.get(node as object, last, node);
  if (typeof value === "function") return Reflect.apply(value, node, args);
  return value;
}

function makeSegmentProxy(path: string[]): unknown {
  const phantom = () => undefined;
  return new Proxy(phantom, {
    get(_target, prop) {
      // Never present as a thenable — `await db.<anything>` must not hang.
      if (prop === "then") return undefined;
      if (typeof prop === "symbol") return undefined;
      return makeSegmentProxy([...path, prop]);
    },
    apply(_target, _thisArg, args) {
      return invokePath(path, args);
    },
  });
}

export const db = makeSegmentProxy([]) as unknown as PrismaClient;
