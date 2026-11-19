/**
 * wgc-prices.test.ts — GPE R25 / F6: the WGC prices-workbook parse's
 * tests over HANDCRAFTED cell rows (the workbook itself is DROP-GATED
 * behind the publisher's login wall — the first real file verifies or
 * tunes the mapping in one dated edit; the s8/02 row 14
 * "gated-verified" posture). The parse halves are pure and total over
 * the cells: the header discovery (a date column + a USD column), the
 * mixed month-cell shapes ('YYYY-MM' strings + Excel serials — the
 * LBMA twin), the newest-first/oldest-first normalization, and the
 * fail-closed shape asserts (no header → FormatChanged; a drifted
 * layout → FormatChanged; never garbage).
 */

import { describe, expect, it } from 'vitest';
import { FormatChangedError } from '../../../shared/adapters/fetch-policy';
import type { XlsxCell } from '../../../shared/adapters/xlsx';
import { parseWgcPricesCells } from './wgc-prices';

/** A cell helper (col letters + 1-based rows — the reader's own shape). */
function cell(col: string, row: number, value: string): XlsxCell {
  return { col, row, value, sharedString: false };
}

/** The documented workbook shape (monthly averages since 1978): a
 *  currency-per-column header + monthly rows; the USD column first
 *  among the currencies. ~586 rows in the wild; the synthetic test
 *  grid compresses to the minimum the parse accepts (>= 60 rows). */
function workbookCells(opts?: { headerRow?: number; newestFirst?: boolean; serialDates?: boolean }): XlsxCell[] {
  const headerRow = opts?.headerRow ?? 1;
  const cells: XlsxCell[] = [
    cell('A', headerRow, 'Month'),
    cell('B', headerRow, 'US Dollar'),
    cell('C', headerRow, 'Euro'),
    cell('D', headerRow, 'Japanese Yen'),
  ];
  // 1978-01 → 1985-12 (96 months — over the 60-row minimum).
  const rows: Array<{ month: string; usd: number }> = [];
  let y = 1978;
  let m = 1;
  for (let i = 0; i < 96; i++) {
    rows.push({ month: `${y}-${String(m).padStart(2, '0')}`, usd: 193 + i });
    m += 1;
    if (m > 12) {
      m = 1;
      y += 1;
    }
  }
  const ordered = opts?.newestFirst ? [...rows].reverse() : rows;
  ordered.forEach((r, i) => {
    const row = headerRow + 1 + i;
    cells.push(cell('A', row, opts?.serialDates ? String(25569 + (row - headerRow - 1) * 30) : r.month));
    cells.push(cell('B', row, String(r.usd)));
    cells.push(cell('C', row, String(r.usd * 0.9)));
  });
  return cells;
}

describe('parseWgcPricesCells (the handcrafted documented shape)', () => {
  it('parses the USD column by its own header, oldest-first workbook → ascending series', () => {
    const rows = parseWgcPricesCells(workbookCells());
    expect(rows.length).toBe(96);
    expect(rows[0]!.month).toBe('1978-01');
    expect(rows[0]!.value).toBeCloseTo(193, 6);
    expect(rows[95]!.month).toBe('1985-12');
    expect(rows[95]!.value).toBeCloseTo(288, 6);
    const months = rows.map((r) => r.month);
    expect(months.every((m, i) => i === 0 || m > months[i - 1]!)).toBe(true);
  });

  it('normalizes a NEWEST-FIRST workbook (the WGC/LBMA files arrive newest-first in the wild)', () => {
    const rows = parseWgcPricesCells(workbookCells({ newestFirst: true }));
    expect(rows.length).toBe(96);
    expect(rows[0]!.month).toBe('1978-01');
    expect(rows[rows.length - 1]!.month).toBe('1985-12');
  });

  it('normalizes EXCEL-SERIAL date cells (the LBMA twin\'s mixed-cell reality — proper month-first-day serials)', () => {
    const serials: XlsxCell[] = [cell('A', 1, 'Month'), cell('B', 1, 'US Dollar')];
    let y = 1978;
    let m = 1;
    for (let i = 0; i < 96; i++) {
      const serial = Math.round((Date.UTC(y, m - 1, 1) - Date.UTC(1899, 11, 30)) / 86_400_000);
      serials.push(cell('A', 2 + i, String(serial)));
      serials.push(cell('B', 2 + i, String(193 + i)));
      m += 1;
      if (m > 12) {
        m = 1;
        y += 1;
      }
    }
    const rows = parseWgcPricesCells(serials);
    expect(rows.length).toBe(96);
    expect(rows[0]!.month).toBe('1978-01');
    expect(rows[95]!.month).toBe('1985-12');
    expect(rows.every((r, i) => i === 0 || r.month > rows[i - 1]!.month)).toBe(true);
  });

  it('finds the header when the workbook carries a title block above it', () => {
    const rows = parseWgcPricesCells(workbookCells({ headerRow: 3 }));
    expect(rows.length).toBe(96);
    expect(rows[0]!.month).toBe('1978-01');
  });

  it('the USD column is located by its own header — a differently-lettered layout parses identically', () => {
    // 'Date' in B, 'USD' in E — the discovery is label-driven, never fixed.
    const relabeled: XlsxCell[] = [];
    const colMap: Record<string, string> = { A: 'B', B: 'E', C: 'F' };
    for (const c of workbookCells()) {
      relabeled.push({ ...c, col: colMap[c.col] ?? c.col });
    }
    // Rewrite the labels: B is the date, E is USD (label 'usd').
    const withLabels = relabeled.map((c) => {
      if (c.col === 'B' && c.row === 1) return { ...c, value: 'Date' };
      if (c.col === 'E' && c.row === 1) return { ...c, value: 'USD' };
      if (c.col === 'B' && c.row > 1 && /^\d/.test(c.value) && c.value.length <= 2) {
        // the original A-column month strings were 7 chars; strip these stray rows
        return c;
      }
      return c;
    }).filter((c) => !(c.col === 'B' && c.row > 1 && /^\d$/.test(c.value)));
    const rows = parseWgcPricesCells(withLabels);
    expect(rows.length).toBe(96);
    expect(rows[0]!.value).toBeCloseTo(193, 6);
  });
});

describe('fail-closed shapes (never a guessed column)', () => {
  it('no header row with a date + USD label → FormatChangedError (the first-drop mapping task)', () => {
    const cells = workbookCells().map((c) =>
      c.row === 1 ? { ...c, value: c.col === 'A' ? 'Financial Data' : 'Column ' + c.col } : c,
    );
    expect(() => parseWgcPricesCells(cells)).toThrow(FormatChangedError);
  });

  it('a drifted layout (the date column relabeled beyond recognition) → FormatChangedError', () => {
    const cells = workbookCells().map((c) => (c.row === 1 && c.col === 'A' ? { ...c, value: 'Segment' } : c));
    expect(() => parseWgcPricesCells(cells)).toThrow(FormatChangedError);
  });

  it('a truncated workbook (fewer than 60 monthly rows) → FormatChangedError (the since-1978 series is the contract)', () => {
    const truncated = workbookCells().filter((c) => c.row <= 40);
    expect(() => parseWgcPricesCells(truncated)).toThrow(FormatChangedError);
  });

  it('a non-monotonic month order (a corrupted row) → FormatChangedError', () => {
    const cells = workbookCells();
    // Corrupt one month cell in the middle to break the strict order.
    for (const c of cells) {
      if (c.col === 'A' && c.row === 50 && c.value === '1982-01') {
        c.value = '1979-05';
      }
    }
    expect(() => parseWgcPricesCells(cells)).toThrow(FormatChangedError);
  });

  it('label/footnote rows below the data block are skipped, never guessed', () => {
    const cells = workbookCells();
    cells.push(cell('A', 98, 'Source: World Gold Council'));
    cells.push(cell('B', 98, 'Monthly averages'));
    const rows = parseWgcPricesCells(cells);
    expect(rows.length).toBe(96); // the footnote row skipped
    expect(rows[95]!.month).toBe('1985-12');
  });
});
