/**
 * Receipt-photo storage for Split & Settle — IndexedDB, NEVER localStorage
 * (checklist #11: legacy stored dataURLs in localStorage, bloating the quota;
 * the rebuild keeps photo blobs in IndexedDB and only their keys in the
 * localStorage group metadata).
 *
 * Tiny promise wrapper over IndexedDB with a graceful no-op fallback when
 * IndexedDB is unavailable (private modes, ancient WebViews) — expenses then
 * simply render without their photos.
 */

const DB_NAME = 'currena-settle';
const DB_VERSION = 1;
const STORE = 'photos';

function openDb(): Promise<IDBDatabase | null> {
  return new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null);
      return;
    }
    let request: IDBOpenDBRequest;
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION);
    } catch {
      resolve(null);
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE); // key = expense id (string)
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
    request.onblocked = () => resolve(null);
  });
}

async function withStore<T>(
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T | null> {
  const db = await openDb();
  if (!db) return null;
  return new Promise((resolve) => {
    let request: IDBRequest<T>;
    try {
      request = run(db.transaction(STORE, mode).objectStore(STORE));
    } catch {
      resolve(null);
      return;
    }
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => resolve(null);
  });
}

/** Persist a receipt photo blob under the expense id. */
export function putPhoto(id: string, blob: Blob): Promise<unknown> {
  return withStore('readwrite', (store) => store.put(blob, id));
}

/** Fetch a receipt photo blob (null when absent or IndexedDB unavailable). */
export function getPhoto(id: string): Promise<Blob | null> {
  return withStore<Blob | undefined>('readonly', (store) => store.get(id)).then(
    (blob) => blob ?? null,
  );
}

/** Delete one photo. */
function deletePhoto(id: string): Promise<unknown> {
  return withStore('readwrite', (store) => store.delete(id));
}

/** Delete every photo belonging to a set of expense ids (group deletion). */
export async function deletePhotos(ids: readonly string[]): Promise<void> {
  await Promise.all(ids.map((id) => deletePhoto(id)));
}
