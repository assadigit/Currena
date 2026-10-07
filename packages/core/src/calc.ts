/**
 * Safe arithmetic expression evaluator — Calculator parity
 * (MIGRATION_CHECKLIST #7). Replaces the legacy page's `eval()` (captured
 * calculator-script.js: it replaced ×→*, ÷→/, −→- and called eval — a
 * textbook XSS-shaped hole).
 *
 * Legacy feature set (verified against the captured markup + JS): plain
 * arithmetic over `+ - × ÷ .` and digits — buttons 0-9, ., +, −, ×, ÷, C,
 * ⌫, =. NO percent key, NO functions, NO exponent operator. This port
 * supports exactly that grammar plus parentheses (the mission's ask;
 * harmless superset — the legacy eval would have accepted them too) and
 * unary minus ("2*-3" was always reachable via the buttons).
 *
 * Implementation: hand-rolled tokenizer + recursive-descent parser.
 * NEVER uses eval or the Function constructor. No rounding is applied —
 * IEEE-754 doubles come out exactly as the legacy calculator produced
 * them (render-time formatting is format.ts's job).
 *
 * Documented deviations from legacy `eval`:
 *   - division by zero throws CalcError('division_by_zero') — legacy
 *     silently rendered "Infinity"/"NaN";
 *   - results that overflow to a non-finite value throw
 *     CalcError('non_finite_result') instead of rendering "Infinity";
 *   - every syntax problem throws a typed CalcError with a machine code
 *     and 0-based character position (legacy just showed "Error").
 */

import { CoreError } from './errors';

/** Machine-readable failure codes for evaluateExpression. */
export type CalcErrorCode =
  | 'empty_expression'
  | 'unexpected_character'
  | 'unexpected_token'
  | 'unexpected_end'
  | 'division_by_zero'
  | 'non_finite_result'
  | 'too_deep';

/** Typed error thrown by evaluateExpression (code + 0-based char position). */
export class CalcError extends CoreError {
  /** 0-based index into the normalized expression where parsing failed. */
  readonly position: number;

  constructor(code: CalcErrorCode, message: string, position: number) {
    super(code, message);
    this.name = 'CalcError';
    this.position = position;
  }
}

/** Maximum parenthesis nesting the parser accepts (BACKLOG #32). */
export const MAX_NESTING_DEPTH = 128;

/* ------------------------------------------------------------------ *
 * Tokenizer
 * ------------------------------------------------------------------ */

type Token =
  | { type: 'number'; value: number; pos: number }
  | { type: 'op'; op: '+' | '-' | '*' | '/'; pos: number }
  | { type: 'lparen'; pos: number }
  | { type: 'rparen'; pos: number };

/**
 * Normalize the legacy display symbols to ASCII: × (U+00D7) → '*',
 * ÷ (U+00F7) → '/', − (U+2212 minus sign, the calculator's subtract
 * button) → '-'. Length is preserved 1:1 so positions stay meaningful.
 */
export function normalizeCalcExpression(expr: string): string {
  return expr.replace(/[×÷−]/g, (ch) => (ch === '×' ? '*' : ch === '÷' ? '/' : '-'));
}

function tokenize(expr: string): Token[] {
  const tokens: Token[] = [];
  let i = 0;
  while (i < expr.length) {
    const ch = expr[i]!;
    // Whitespace: space/tab (legacy) plus the characters real keyboards and
    // paste pipelines actually produce — NBSP (U+00A0) from HTML copies,
    // CR/LF from multi-line paste (BACKLOG #32). All are silently skipped.
    if (ch === ' ' || ch === '\t' || ch === '\u00A0' || ch === '\r' || ch === '\n') {
      i++;
      continue;
    }
    if (ch === '+' || ch === '-' || ch === '*' || ch === '/') {
      tokens.push({ type: 'op', op: ch, pos: i });
      i++;
      continue;
    }
    if (ch === '(') {
      tokens.push({ type: 'lparen', pos: i });
      i++;
      continue;
    }
    if (ch === ')') {
      tokens.push({ type: 'rparen', pos: i });
      i++;
      continue;
    }
    if (ch >= '0' && ch <= '9' || ch === '.') {
      const start = i;
      let sawDot = false;
      while (i < expr.length) {
        const c = expr[i]!;
        if (c >= '0' && c <= '9') {
          i++;
        } else if (c === '.' && !sawDot) {
          sawDot = true;
          i++;
        } else {
          break;
        }
      }
      const text = expr.slice(start, i);
      if (text === '.') {
        throw new CalcError('unexpected_character', `stray '.' at position ${start}`, start);
      }
      tokens.push({ type: 'number', value: Number(text), pos: start });
      continue;
    }
    throw new CalcError('unexpected_character', `unexpected character ${JSON.stringify(ch)} at position ${i}`, i);
  }
  return tokens;
}

/* ------------------------------------------------------------------ *
 * Recursive-descent parser
 *
 *   expression := term (('+' | '-') term)*
 *   term       := unary (('*' | '/') unary)*
 *   unary      := ('-' | '+') unary | primary   (BACKLOG #32: unary plus
 *                                                  joins minus — the
 *                                                  legacy eval accepted
 *                                                  "2*+3"; now parity)
 *   primary    := NUMBER | '(' expression ')'
 * ------------------------------------------------------------------ */

class Parser {
  private readonly tokens: readonly Token[];
  private index = 0;
  // BACKLOG #32: nesting depth guard — a pathological paste of thousands
  // of '(' would otherwise recurse until the ENGINE throws a bare native
  // RangeError ("Maximum call stack size exceeded") from deep inside the
  // parser. The guard converts that into the SAME typed CalcError surface
  // every other failure uses, with a position the UI can point at.
  private depth = 0;

  constructor(tokens: readonly Token[]) {
    this.tokens = tokens;
  }

  private peek(): Token | undefined {
    return this.tokens[this.index];
  }

  private next(): Token {
    const token = this.tokens[this.index];
    if (!token) {
      throw new CalcError('unexpected_end', 'expression ended unexpectedly', this.tokens.length);
    }
    this.index++;
    return token;
  }

  parse(): number {
    const value = this.parseExpression();
    const leftover = this.peek();
    if (leftover) {
      const what =
        leftover.type === 'number'
          ? `number ${leftover.value}`
          : leftover.type === 'op'
            ? `operator '${leftover.op}'`
            : leftover.type === 'lparen'
              ? "'('"
              : "')'";
      throw new CalcError('unexpected_token', `unexpected ${what} at position ${leftover.pos}`, leftover.pos);
    }
    return value;
  }

  private parseExpression(): number {
    let left = this.parseTerm();
    for (;;) {
      const token = this.peek();
      if (token?.type === 'op' && (token.op === '+' || token.op === '-')) {
        this.index++;
        const right = this.parseTerm();
        left = token.op === '+' ? left + right : left - right;
      } else {
        return left;
      }
    }
  }

  private parseTerm(): number {
    let left = this.parseUnary();
    for (;;) {
      const token = this.peek();
      if (token?.type === 'op' && (token.op === '*' || token.op === '/')) {
        this.index++;
        const right = this.parseUnary();
        if (token.op === '/') {
          if (right === 0) {
            throw new CalcError('division_by_zero', `division by zero at position ${token.pos}`, token.pos);
          }
          left /= right;
        } else {
          left *= right;
        }
      } else {
        return left;
      }
    }
  }

  private parseUnary(): number {
    const token = this.peek();
    if (token?.type === 'op' && (token.op === '-' || token.op === '+')) {
      this.index++;
      const operand = this.parseUnary();
      return token.op === '-' ? -operand : operand;
    }
    return this.parsePrimary();
  }

  private parsePrimary(): number {
    const token = this.next();
    if (token.type === 'number') return token.value;
    if (token.type === 'lparen') {
      if (++this.depth > MAX_NESTING_DEPTH) {
        throw new CalcError('too_deep', `more than ${MAX_NESTING_DEPTH} nested parentheses at position ${token.pos}`, token.pos);
      }
      const value = this.parseExpression();
      this.depth--;
      const closing = this.next();
      if (closing.type !== 'rparen') {
        throw new CalcError('unexpected_end', "missing closing ')'", this.tokens.length);
      }
      return value;
    }
    throw new CalcError(
      'unexpected_token',
      `expected a number or '(' but found ${token.type === 'op' ? `operator '${token.op}'` : token.type === 'rparen' ? "')'" : 'end of expression'} at position ${token.pos}`,
      token.pos,
    );
  }
}

/**
 * Evaluate an arithmetic expression. Accepts digits, '.', '+', '-', '*',
 * '/', '(', ')', whitespace and the legacy display symbols '×' '÷' '−'.
 * Throws CalcError on any malformed input, division by zero, or non-finite
 * result. Never uses eval/Function.
 */
export function evaluateExpression(expr: string): number {
  if (typeof expr !== 'string') {
    throw new CalcError('empty_expression', `expression must be a string, got ${typeof expr}`, 0);
  }
  const normalized = normalizeCalcExpression(expr);
  if (normalized.trim() === '') {
    throw new CalcError('empty_expression', 'expression is empty', 0);
  }
  const result = new Parser(tokenize(normalized)).parse();
  if (!Number.isFinite(result)) {
    throw new CalcError('non_finite_result', `result is not a finite number: ${String(result)}`, normalized.length);
  }
  return result;
}
