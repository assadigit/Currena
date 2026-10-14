/**
 * settle/ExpensePhoto — a receipt photo thumbnail: blob from IndexedDB →
 * objectURL, rendered lazily under the expense row (Phase: WS-4 module
 * split of the former Settle.tsx monolith — zero behavior change, code
 * moved verbatim). The objectURL is revoked on unmount/swap — no leak.
 */

import { useEffect, useState } from 'react';
import { getPhoto } from '../../lib/photo-store';

function ExpensePhoto({ expenseId, alt }: { expenseId: string; alt: string }) {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    let objectUrl: string | null = null;
    let cancelled = false;
    void (async () => {
      const blob = await getPhoto(expenseId);
      if (cancelled || !blob) return;
      objectUrl = URL.createObjectURL(blob);
      setUrl(objectUrl);
    })();
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [expenseId]);

  if (!url) return null;
  return (
    <img
      src={url}
      alt={alt}
      className="mt-2.5 max-h-48 w-full rounded-[12px] object-cover"
    />
  );
}

export { ExpensePhoto };
