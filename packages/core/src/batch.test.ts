import { describe, expect, it } from 'vitest';

import {
  BATCH_TEMPLATES,
  BatchError,
  csvEscapeField,
  isBatchTemplateId,
  MAX_BATCH_LINE_CHARS,
  MAX_BATCH_LINES,
  parseBatchLine,
  parseBatchLines,
  toCsv,
} from './batch';

describe('parseBatchLine (tolerant, legacy parity + extensions)', () => {
  it('parses a bare amount (legacy bulk mode: first number wins, suffixes ignored)', () => {
    expect(parseBatchLine('150.99')).toEqual({ ok: true, value: { amount: 150.99 } });
    expect(parseBatchLine('  89.50  ')).toEqual({ ok: true, value: { amount: 89.5 } });
    expect(parseBatchLine('45.50 USD')).toEqual({ ok: true, value: { amount: 45.5, from: 'USD' } });
    expect(parseBatchLine('abc 45.50 xyz')).toEqual({ ok: true, value: { amount: 45.5 } }); // legacy tolerance
  });

  it('parses amounts with commas and Persian digits', () => {
    expect(parseBatchLine('1,234.56')).toEqual({ ok: true, value: { amount: 1234.56 } });
    expect(parseBatchLine('۱۰۰ usd eur')).toEqual({
      ok: true,
      value: { amount: 100, from: 'USD', to: 'EUR' },
    });
  });

  it('parses from/to pairs in the tolerant forms', () => {
    expect(parseBatchLine('100 usd eur')).toEqual({ ok: true, value: { amount: 100, from: 'USD', to: 'EUR' } });
    expect(parseBatchLine('100 USD to EUR')).toEqual({ ok: true, value: { amount: 100, from: 'USD', to: 'EUR' } });
    expect(parseBatchLine('100 usd in eur')).toEqual({ ok: true, value: { amount: 100, from: 'USD', to: 'EUR' } });
    expect(parseBatchLine('100 USD → EUR')).toEqual({ ok: true, value: { amount: 100, from: 'USD', to: 'EUR' } });
    expect(parseBatchLine('100 usd')).toEqual({ ok: true, value: { amount: 100, from: 'USD' } });
    expect(parseBatchLine('100 eur usd # reversed note')).toEqual({
      ok: true,
      value: { amount: 100, from: 'EUR', to: 'USD', note: 'reversed note' },
    });
  });

  it('captures optional notes after # or |', () => {
    expect(parseBatchLine('150.99 # iPhone 15 Pro, Black, 256GB')).toEqual({
      ok: true,
      value: { amount: 150.99, note: 'iPhone 15 Pro, Black, 256GB' },
    });
    expect(parseBatchLine('150.99 USD | gift for Sara')).toEqual({
      ok: true,
      value: { amount: 150.99, from: 'USD', note: 'gift for Sara' },
    });
    expect(parseBatchLine('150.99 #')).toEqual({ ok: true, value: { amount: 150.99 } }); // empty note dropped
    expect(parseBatchLine('150.99 # note with # inside')).toEqual({
      ok: true,
      value: { amount: 150.99, note: 'note with # inside' },
    });
  });

  it('returns typed per-line errors (legacy silently skipped these)', () => {
    expect(parseBatchLine('')).toEqual({
      ok: false,
      error: { code: 'empty_line', message: expect.any(String), line: '' },
    });
    expect(parseBatchLine('   ')).toEqual({
      ok: false,
      error: { code: 'empty_line', message: expect.any(String), line: '   ' },
    });
    expect(parseBatchLine('no numbers here')).toEqual({
      ok: false,
      error: { code: 'no_amount', message: expect.any(String), line: 'no numbers here' },
    });
    expect(parseBatchLine('0')).toEqual({
      ok: false,
      error: { code: 'invalid_amount', message: expect.any(String), line: '0' }, // legacy required > 0
    });
    expect(parseBatchLine('-5')).toEqual({
      ok: false,
      error: { code: 'invalid_amount', message: expect.any(String), line: '-5' },
    });
    expect(parseBatchLine('abc').ok).toBe(false);
  });

  it('ignores unsupported currency tokens but keeps recognized ones', () => {
    expect(parseBatchLine('100 xyz abc')).toEqual({ ok: true, value: { amount: 100 } });
    expect(parseBatchLine('100 usd usd')).toEqual({ ok: true, value: { amount: 100, from: 'USD' } });
  });
});

describe('parseBatchLines (whole textarea)', () => {
  it('skips blank lines and applies page-level from/to defaults', () => {
    const results = parseBatchLines('150.99\n\n89.50 # note\n   \n45', { from: 'USD', to: 'IRR' });
    expect(results).toEqual([
      { ok: true, value: { amount: 150.99, from: 'USD', to: 'IRR' } },
      { ok: true, value: { amount: 89.5, from: 'USD', to: 'IRR', note: 'note' } },
      { ok: true, value: { amount: 45, from: 'USD', to: 'IRR' } },
    ]);
  });

  it('keeps per-line codes over defaults and surfaces per-line errors without throwing', () => {
    const results = parseBatchLines('100 eur usd\nnonsense', { from: 'USD', to: 'IRR' });
    expect(results[0]).toEqual({ ok: true, value: { amount: 100, from: 'EUR', to: 'USD' } });
    expect(results[1]!.ok).toBe(false);
    expect(results).toHaveLength(2);
  });

  it('handles CRLF textareas', () => {
    const results = parseBatchLines('1\r\n2\r\n', {});
    expect(results).toHaveLength(2);
    expect(results[1]).toEqual({ ok: true, value: { amount: 2 } });
  });
});

describe('toCsv (legacy exportCSV shape)', () => {
  it('writes header, rows, blank line, Total and Exchange Rate lines', () => {
    const csv = toCsv(
      [
        { original: 150.99, converted: 138.9108, note: 'iPhone 15 Pro' },
        { original: 89.5, converted: 82.34 },
      ],
      { from: 'USD', to: 'EUR', rate: 0.92 },
    );
    expect(csv).toBe(
      'Original Amount (USD),Converted Amount (EUR),Note\n' +
        '150.99,138.91,"iPhone 15 Pro"\n' +
        '89.50,82.34,\n' +
        '\n' +
        'Total,240.49,221.25,\n' +
        'Exchange Rate,1 USD = 0.9200 EUR,,\n',
    );
  });

  it('uses 0 decimals for IRR targets and 4 for the rate (legacy policy)', () => {
    const csv = toCsv([{ original: 100, converted: 23050000, note: 'hotel' }], {
      from: 'USD',
      to: 'IRR',
      rate: 230500,
    });
    expect(csv).toContain('100.00,23050000,"hotel"');
    expect(csv).toContain('Total,100.00,23050000,');
    expect(csv).toContain('Exchange Rate,1 USD = 230500 IRR,,');
  });

  it('escapes quotes in notes (RFC-4180 doubling)', () => {
    expect(csvEscapeField('say "hi"')).toBe('"say ""hi"""');
    expect(csvEscapeField('plain')).toBe('plain');
    expect(csvEscapeField('a,b')).toBe('"a,b"');
    expect(csvEscapeField('line\nbreak')).toBe('"line\nbreak"');
    const csv = toCsv([{ original: 1, converted: 2, note: '5" screen' }], { from: 'USD', to: 'EUR' });
    expect(csv).toContain('"5"" screen"');
  });

  it('omits the Exchange Rate line when no rate is given', () => {
    const csv = toCsv([{ original: 1, converted: 2 }], { from: 'USD', to: 'EUR' });
    expect(csv).not.toContain('Exchange Rate');
    expect(csv).toContain('Total,1.00,2.00,');
  });
});

describe('BATCH_TEMPLATES (exact legacy quick templates)', () => {
  it('matches the captured loadTemplate() values verbatim', () => {
    expect(BATCH_TEMPLATES.shopping).toEqual([150.99, 89.5, 45, 199.99, 75.25]); // 5 items
    expect(BATCH_TEMPLATES.comparison).toEqual([299.99, 349, 279.5]); // 3 items
    expect(BATCH_TEMPLATES.wishlist).toEqual([100, 250, 75, 180, 95, 125, 220, 340, 88, 165]); // 10 items
  });

  it('is exposed via a type guard', () => {
    expect(isBatchTemplateId('shopping')).toBe(true);
    expect(isBatchTemplateId('comparison')).toBe(true);
    expect(isBatchTemplateId('wishlist')).toBe(true);
    expect(isBatchTemplateId('other')).toBe(false);
  });

  it('every template line parses as a valid batch line', () => {
    for (const amounts of Object.values(BATCH_TEMPLATES)) {
      for (const amount of amounts) {
        const result = parseBatchLine(String(amount));
        expect(result.ok).toBe(true);
      }
    }
  });
});

describe('toCsv — display-consistent totals + formula-injection guard', () => {
  it('the Total equals the sum of the DISPLAYED row values (no penny mismatch)', () => {
    // Two rows of 0.014 each DISPLAY as "0.01" (displayed sum 0.02), but the
    // raw sum 0.028 rounds to "0.03" — the old raw-sum Total disagreed with
    // the rows the user could see by a cent.
    const csv = toCsv(
      [
        { original: 0.014, converted: 0.014, note: '' },
        { original: 0.014, converted: 0.014, note: '' },
      ],
      { from: 'USD', to: 'EUR', rate: 1 },
    );
    expect(csv).toContain('0.01,0.01,\n');
    expect(csv).toContain('Total,0.02,0.02,'); // matches the displayed rows
  });

  it('neutralizes spreadsheet formula injection in notes (OWASP CSV injection)', () => {
    const csv = toCsv(
      [{ original: 1, converted: 2, note: '=HYPERLINK("http://evil","click")' }],
      { from: 'USD', to: 'EUR' },
    );
    expect(csv).toContain("'=HYPERLINK"); // leading apostrophe → rendered as text
    expect(csv).not.toMatch(/,"=HYPERLINK/); // never an executable leading =
    // Plus/minus/at and tab-prefixed notes are neutralized too.
    const more = toCsv(
      [
        { original: 1, converted: 2, note: '+cmd' },
        { original: 1, converted: 2, note: '-2+2' },
        { original: 1, converted: 2, note: '@ref' },
      ],
      { from: 'USD', to: 'EUR' },
    );
    expect(more).toContain("'+cmd");
    expect(more).toContain("'-2+2");
    expect(more).toContain("'@ref");
    // Plain notes are untouched.
    const plain = toCsv([{ original: 1, converted: 2, note: 'groceries' }], { from: 'USD', to: 'EUR' });
    expect(plain).toContain('"groceries"');
  });
});

describe('parseBatchLines input bounds (BACKLOG #32)', () => {
  it('accepts exactly MAX_BATCH_LINES non-blank lines (blank lines never count)', () => {
    const edge = Array.from({ length: MAX_BATCH_LINES }, () => '1').join('\n');
    expect(parseBatchLines(edge)).toHaveLength(MAX_BATCH_LINES);
    const padded = '\n\n' + edge + '\n  \n';
    expect(parseBatchLines(padded)).toHaveLength(MAX_BATCH_LINES);
  });

  it('throws typed batch_too_many_lines past the cap', () => {
    const over = Array.from({ length: MAX_BATCH_LINES + 1 }, () => '1').join('\n');
    expect(() => parseBatchLines(over)).toThrow(BatchError);
    try {
      parseBatchLines(over);
    } catch (err) {
      expect(err instanceof BatchError && err.code).toBe('batch_too_many_lines');
    }
  });

  it('throws typed batch_line_too_long on a mega-line, before any parsing', () => {
    const mega = '9'.repeat(MAX_BATCH_LINE_CHARS + 1);
    expect(() => parseBatchLines(mega)).toThrow(BatchError);
    // A line exactly at the cap parses normally (amount validation still
    // per-line — bounds are about INPUT size, not validity).
    const atCap = '1' + ' '.repeat(MAX_BATCH_LINE_CHARS - 1);
    expect(parseBatchLines(atCap)).toHaveLength(1);
  });
});
