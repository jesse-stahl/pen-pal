/**
 * Cache-first read for one-shot Firestore gets. The two paths that matter most
 * offline — cold-start boot (profile) and studying (the deck) — read through here
 * so they resolve from the on-device cache instantly and never stall on a network
 * round-trip when the device is offline or on flaky "connected but no internet".
 *
 * Strategy: read the cache first; if it has data, use it (no network). Otherwise
 * try the server, and if the server is unreachable fall back to the cache result
 * we already have — so a legitimately-empty cache offline returns empty instead of
 * throwing. Only throws when both the cache and the server are unavailable.
 *
 * Pure (no SDK import) so the logic is unit tested without mocking the native SDK;
 * the Firestore wrappers live in `firestore-read.ts`.
 */
export async function readCacheFirst<T>(
  cacheRead: () => Promise<T>,
  serverRead: () => Promise<T>,
  isEmpty: (value: T) => boolean = () => false,
): Promise<T> {
  let cached: T | undefined;
  let haveCache = false;
  try {
    cached = await cacheRead();
    haveCache = true;
    if (!isEmpty(cached)) return cached;
  } catch {
    // cache unavailable (e.g. persistence disabled) — fall through to the server
  }
  try {
    return await serverRead();
  } catch (err) {
    if (haveCache && cached !== undefined) return cached;
    throw err;
  }
}
