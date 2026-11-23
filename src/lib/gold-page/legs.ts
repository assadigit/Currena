/**
 * The currena-api leg fetcher — the server-side seam for the record
 * sections the previous gold page carried (TA, central banks, the London
 * vault, the Iran premium history, CFTC positions, market expectations,
 * the gold/yield correlation).
 *
 * The upstream gold page fetched these from its own worker
 * (currena.ir/api/insights/*) browser-side. The deployed desk page now
 * serves at currena.ir/gold — same origin as those routes, but the
 * browser-side fetch would still be CORS-blocked on the sandbox preview
 * and the workers.dev mirror, so every leg is instead fetched
 * SERVER-SIDE here (workers and node both fetch public URLs without
 * CORS), cached in memory for five minutes (the upstream routes' own
 * max-age), and served by the desk's own API routes to the page.
 *
 * Fail-closed by design: a leg that cannot be read resolves null and
 * its section renders its honest unavailable line — never a guess
 * (the upstream's own calm-fallback discipline).
 */

/** One cached leg. */
interface LegEntry {
  at: number;
  value: unknown;
}

const CACHE_TTL_MS = 5 * 60 * 1000; // the upstream routes' own max-age
const TIMEOUT_MS = 20_000;

const globalForLegs = globalThis as unknown as {
  __currenaLegs?: Map<string, LegEntry>;
};
const cache: Map<string, LegEntry> = globalForLegs.__currenaLegs ?? new Map();
globalForLegs.__currenaLegs = cache;

/** Fetch one currena-api leg (JSON), memory-cached for 5 minutes. */
export async function fetchLeg<T>(path: string): Promise<T | null> {
  const hit = cache.get(path);
  if (hit !== undefined && Date.now() - hit.at < CACHE_TTL_MS) {
    return hit.value as T;
  }
  try {
    const res = await fetch(`https://currena.ir${path}`, {
      signal: AbortSignal.timeout(TIMEOUT_MS),
      headers: { accept: "application/json" },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const value = (await res.json()) as T;
    cache.set(path, { at: Date.now(), value });
    return value;
  } catch {
    return null;
  }
}
