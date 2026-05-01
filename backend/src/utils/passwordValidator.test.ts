import { describe, expect, it } from 'vitest';
import { calculatePasswordStrength, validatePassword } from './passwordValidator';

describe('validatePassword', () => {
  it('accepts a strong password', () => {
    const result = validatePassword('SecurePass987!@#A');
    expect(result.valid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('rejects weak passwords with clear reasons', () => {
    const result = validatePassword('weak');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('rejects sequential patterns', () => {
    const result = validatePassword('Abcd1234!Secure');
    expect(result.valid).toBe(false);
    expect(result.errors.join(' ')).toContain('sequential characters');
  });
});

describe('calculatePasswordStrength', () => {
  it('scores strong passwords higher than weak ones', () => {
    const weak = calculatePasswordStrength('abcd1234');
    const strong = calculatePasswordStrength('Str0ng!Value#2026');

    expect(strong.score).toBeGreaterThan(weak.score);
  });
});
