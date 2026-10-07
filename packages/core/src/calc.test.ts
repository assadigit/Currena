import { describe, expect, it } from 'vitest';

import { CalcError, evaluateExpression, normalizeCalcExpression, MAX_NESTING_DEPTH } from './calc';

describe('evaluateExpression — arithmetic (legacy calculator parity)', () => {
  it('evaluates plain arithmetic the legacy eval() handled', () => {
    expect(evaluateExpression('1+1')).toBe(2);
    expect(evaluateExpression('7-2')).toBe(5);
    expect(evaluateExpression('8×7')).toBe(56); // legacy × symbol
    expect(evaluateExpression('10÷4')).toBe(2.5); // legacy ÷ symbol
    expect(evaluateExpression('−3+5')).toBe(2); // legacy − (minus sign) button
    expect(evaluateExpression('0.5*2')).toBe(1);
    expect(evaluateExpression('.5+.5')).toBe(1); // leading-dot number the buttons could produce
  });

  it('respects operator precedence: * / before + -', () => {
    expect(evaluateExpression('2+3*4')).toBe(14);
    expect(evaluateExpression('2*3+4')).toBe(10);
    expect(evaluateExpression('10-4/2')).toBe(8);
    expect(evaluateExpression('2+3*4-6/3')).toBe(12);
  });

  it('supports parentheses and unary minus', () => {
    expect(evaluateExpression('(2+3)*4')).toBe(20);
    expect(evaluateExpression('2*(3+4)')).toBe(14);
    expect(evaluateExpression('((1+2))*3')).toBe(9);
    expect(evaluateExpression('-3')).toBe(-3);
    expect(evaluateExpression('2*-3')).toBe(-6);
    expect(evaluateExpression('7--2')).toBe(9);
    expect(evaluateExpression('--4')).toBe(4); // legacy eval parity
  });

  it('tolerates whitespace', () => {
    expect(evaluateExpression(' 1 + 2 * 3 ')).toBe(7);
  });

  it('keeps raw IEEE-754 results (no hidden rounding — formatting is render-time)', () => {
    expect(evaluateExpression('0.1+0.2')).toBe(0.30000000000000004);
  });
});

describe('evaluateExpression — typed errors (replaces legacy "Error" flash)', () => {
  const expectCalcError = (expr: string, code: string): void => {
    try {
      evaluateExpression(expr);
      expect.unreachable(`expected ${code} for ${JSON.stringify(expr)}`);
    } catch (error) {
      expect(error).toBeInstanceOf(CalcError);
      expect((error as CalcError).code).toBe(code);
      expect(typeof (error as CalcError).position).toBe('number');
    }
  };

  it('rejects empty / whitespace-only input', () => {
    expectCalcError('', 'empty_expression');
    expectCalcError('   ', 'empty_expression');
  });

  it('rejects trailing / missing operands', () => {
    expectCalcError('1+', 'unexpected_end');
    expectCalcError('1+2*', 'unexpected_end');
    expectCalcError('(1+2', 'unexpected_end');
  });

  it('rejects stray tokens and characters', () => {
    expectCalcError('1+2)', 'unexpected_token');
    expectCalcError('1 2', 'unexpected_token');
    expectCalcError('abc', 'unexpected_character');
    expectCalcError('5%', 'unexpected_character'); // legacy had NO percent operator
    expectCalcError('1.2.3', 'unexpected_token'); // '.3' lexes as a number → stray second operand
    expectCalcError('2**3', 'unexpected_token'); // no exponent operator in legacy
    expectCalcError(')', 'unexpected_token');
  });

  it('throws typed division_by_zero instead of legacy Infinity', () => {
    expectCalcError('1/0', 'division_by_zero');
    expectCalcError('5/(2-2)', 'division_by_zero');
  });

  it('throws typed non_finite_result on overflow', () => {
    expectCalcError('9'.repeat(400) + '*1', 'non_finite_result');
  });
});

describe('normalizeCalcExpression', () => {
  it('maps the legacy display symbols 1:1 (positions preserved)', () => {
    expect(normalizeCalcExpression('8×7÷2−1')).toBe('8*7/2-1');
    expect(normalizeCalcExpression('1+2')).toBe('1+2');
    expect(normalizeCalcExpression('×÷−')).toHaveLength(3);
  });
});

describe('evaluateExpression — BACKLOG #32 hardening (paste reality + depth guard)', () => {
  const expectCalcError = (expr: string, code: string): void => {
    try {
      evaluateExpression(expr);
      expect.fail(`expected CalcError('${code}') for ${JSON.stringify(expr)}`);
    } catch (err) {
      expect(err).toBeInstanceOf(CalcError);
      expect((err as CalcError).code).toBe(code);
    }
  };

  it('skips NBSP (U+00A0) from HTML copies as plain whitespace', () => {
    expect(evaluateExpression('1\u00A0+\u00A02')).toBe(3);
    expect(evaluateExpression('\u00A01.5*2\u00A0')).toBe(3);
  });

  it('skips CR/LF from multi-line pastes as plain whitespace', () => {
    expect(evaluateExpression('1+\r\n2')).toBe(3);
    expect(evaluateExpression('2*\n3')).toBe(6);
  });

  it('accepts unary plus (legacy eval parity: "2*+3" worked)', () => {
    expect(evaluateExpression('2*+3')).toBe(6);
    expect(evaluateExpression('+5')).toBe(5);
    expect(evaluateExpression('1++2')).toBe(3);
    expect(evaluateExpression('2*-+3')).toBe(-6); // alternating unaries
  });

  it('throws typed too_deep instead of a bare native RangeError on pathological nesting', () => {
    expectCalcError('('.repeat(MAX_NESTING_DEPTH + 1) + '1' + ')'.repeat(MAX_NESTING_DEPTH + 1), 'too_deep');
    // Exactly at the cap is still fine.
    expect(evaluateExpression('('.repeat(MAX_NESTING_DEPTH) + '1' + ')'.repeat(MAX_NESTING_DEPTH))).toBe(1);
  });
});
