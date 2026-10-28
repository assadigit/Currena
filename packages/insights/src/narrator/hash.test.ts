/**
 * hash.test.ts — the pure SHA-256 against the FIPS 180-4 test vectors
 * (plus the empty string), so the narrator's stateHash has a digest
 * nobody has to trust blindly.
 */

import { describe, expect, it } from 'vitest';
import { sha256Hex } from './hash';

describe('sha256Hex (pure)', () => {
  it('matches the FIPS 180-4 vectors', () => {
    expect(sha256Hex('abc')).toBe(
      'ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad',
    );
    expect(sha256Hex('')).toBe(
      'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    );
    expect(
      sha256Hex('abcdbcdecdefdefgefghfghighijhijkijkljklmklmnlmnomnopnopq'),
    ).toBe('248d6a61d20638b8e5c026930c3e6039a33ce45964ff2167f6ecedd419db06c1');
  });

  it('handles multi-byte UTF-8 (Persian text hashes stably)', () => {
    // The exact digest of this Persian sentence — pinned so any change to
    // the encoder fails loudly.
    expect(sha256Hex('سلام، دنیا')).toBe('2c036aa64ce56c280e8259eb7944f7548a5d3e2bf00f7e5357200861c7fcb7ad');
    // U+1F600 (4 UTF-8 bytes) — cross-checked against Python's hashlib.
    expect(sha256Hex('😀')).toBe('f0443a342c5ef54783a111b51ba56c938e474c32324d90c3a60c9c8e3a37e2d9');
  });

  it('is deterministic across calls (pure, no state)', () => {
    const a = sha256Hex('the narrator state');
    const b = sha256Hex('the narrator state');
    expect(a).toBe(b);
    expect(a).not.toBe(sha256Hex('the narrator state '));
  });
});
