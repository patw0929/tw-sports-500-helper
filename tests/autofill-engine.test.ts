import assert from 'node:assert';
import { test, describe } from 'node:test';

import { generateAutoFillScript, generateLogoutScript } from '../src/services/autofill-engine';
import { UserProfile } from '../src/types/sports500';

const mockProfile: UserProfile = {
  id: 'test-user-1',
  name: '王小明',
  idNo: 'A123456789',
  birthYearRoc: 85,
  birthMonth: 5,
  birthDay: 20,
  phone: '0912345678',
  isDefault: true,
  createdAt: Date.now(),
};

describe('Autofill Engine - Script Generation & Selectors', () => {
  test('generateAutoFillScript handles null profile safely', () => {
    const script = generateAutoFillScript(null);
    assert.ok(script.includes('No active profile to auto-fill'));
  });

  test('generateAutoFillScript embeds profile information accurately', () => {
    const script = generateAutoFillScript(mockProfile);
    assert.ok(script.includes('王小明'));
    assert.ok(script.includes('A123456789'));
    assert.ok(script.includes('0912345678'));
    assert.ok(script.includes('1996-05-20'));
  });

  test('generateAutoFillScript excludes .quota-notice from error detection', () => {
    const script = generateAutoFillScript(mockProfile);
    // Must contain :not(.quota-notice) so 300萬筆 notice does not block autofill
    assert.ok(
      script.includes(':not(.quota-notice)'),
      'Script must exclude .quota-notice to prevent false error blocking'
    );
  });

  test('generateAutoFillScript includes check for registration-finished page', () => {
    const script = generateAutoFillScript(mockProfile);
    assert.ok(
      script.includes('.registration-finished'),
      'Script must handle registration-finished page gracefully'
    );
    assert.ok(
      script.includes('#finished-title'),
      'Script must detect #finished-title on access page submission'
    );
  });

  test('generateAutoFillScript supports data-date-year/month/day selectors', () => {
    const script = generateAutoFillScript(mockProfile);
    assert.ok(
      script.includes('data-date-year'),
      'Script must support data-date-year select attribute'
    );
    assert.ok(
      script.includes('data-date-month'),
      'Script must support data-date-month select attribute'
    );
    assert.ok(
      script.includes('data-date-day'),
      'Script must support data-date-day select attribute'
    );
  });

  test('generateLogoutScript generates valid script', () => {
    const logoutScript = generateLogoutScript(mockProfile);
    assert.ok(logoutScript.includes('王小明'));
    assert.ok(logoutScript.includes('sports500_pending_login'));
  });
});
