/**
 * contact.test.ts — M-7 (RULES.md §3): the "About this data" contact surface.
 * The owner's existing public contact method is the Currena GitHub repository;
 * the constant must be an https URL (never an invented email address).
 */

import { describe, expect, it } from 'vitest';
import { DATA_CONTACT_URL } from './contact';

describe('DATA_CONTACT_URL (M-7 contact line)', () => {
  it('is a non-empty https URL', () => {
    expect(DATA_CONTACT_URL.startsWith('https://')).toBe(true);
    expect(DATA_CONTACT_URL.length).toBeGreaterThan('https://'.length);
  });

  it('is the owner’s existing public contact surface (the Currena repository)', () => {
    expect(DATA_CONTACT_URL).toBe('https://github.com/assadigit/Currena');
  });
});
