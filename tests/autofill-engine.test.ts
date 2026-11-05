import assert from 'node:assert';
import { test, describe } from 'node:test';

import {
  generateAutoFillScript,
  generateLogoutScript,
  generateDownloadInterceptorScript,
  isBase64HtmlContent,
} from '../src/services/autofill-engine';
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
    assert.ok(
      script.includes('_sports500_download_interceptors_installed'),
      'Script must still install download interceptors even when profile is null'
    );
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

  test('generateDownloadInterceptorScript intercepts window.open, print, and anchor clicks', () => {
    const downloadScript = generateDownloadInterceptorScript();
    assert.ok(downloadScript.includes('window.open = function'), 'Must intercept window.open');
    assert.ok(downloadScript.includes('window.print = function'), 'Must intercept window.print');
    assert.ok(
      downloadScript.includes('HTMLAnchorElement.prototype.click'),
      'Must intercept programmatic anchor click'
    );
    assert.ok(
      downloadScript.includes('downloadCertificateWithAuth'),
      'Must provide authenticated certificate fetch'
    );
    assert.ok(downloadScript.includes('CERT_DOWNLOADED'), 'Must deliver downloaded certificate');
    assert.ok(downloadScript.includes('DOWNLOAD_OR_LINK'), 'Must handle file link downloads');
  });

  test('generateDownloadInterceptorScript excludes certificate verification links from download hijacking', () => {
    const downloadScript = generateDownloadInterceptorScript();
    assert.ok(
      downloadScript.includes('function isVerificationLink'),
      'Must define isVerificationLink helper'
    );
    assert.ok(
      downloadScript.includes('查驗') && downloadScript.includes('防偽'),
      'isVerificationLink must check for 查驗 and 防偽'
    );
    assert.ok(
      downloadScript.includes('/verify') && downloadScript.includes('verification'),
      'isVerificationLink must check for /verify and verification URLs'
    );
  });

  test('generateDownloadInterceptorScript catches HTML responses during website congestion', () => {
    const downloadScript = generateDownloadInterceptorScript();
    assert.ok(
      downloadScript.includes("contentType.includes('text/html')"),
      'Must detect text/html content type'
    );
    assert.ok(downloadScript.includes('isHtmlPayload'), 'Must inspect payload for HTML content');
    assert.ok(downloadScript.includes('isHtmlResponse: true'), 'Must flag HTML response on error');
    assert.ok(
      downloadScript.includes('CERT_FETCH_ERROR'),
      'Must dispatch CERT_FETCH_ERROR when site returns HTML instead of cert'
    );
    assert.ok(
      downloadScript.includes('AbortController'),
      'Must configure timeout controller for hanging connections'
    );
  });

  test('isBase64HtmlContent identifies HTML error pages and permits binary certificates', () => {
    // 1. <!DOCTYPE html>
    const doctypeHtml = Buffer.from(
      '<!DOCTYPE html><html><body>502 Bad Gateway</body></html>'
    ).toString('base64');
    assert.strictEqual(isBase64HtmlContent(doctypeHtml), true);

    // 2. <html with attributes
    const htmlTag = Buffer.from(
      '<html lang="zh-TW"><head><title>系統忙碌</title></head></html>'
    ).toString('base64');
    assert.strictEqual(isBase64HtmlContent(htmlTag), true);

    // 3. Cloudflare or gateway timeout
    const gatewayTimeout = Buffer.from(
      '<html><head><title>504 Gateway Time-out</title></head></html>'
    ).toString('base64');
    assert.strictEqual(isBase64HtmlContent(gatewayTimeout), true);

    // 4. Data URL prefix format
    const dataUrlHtml = `data:text/html;base64,${doctypeHtml}`;
    assert.strictEqual(isBase64HtmlContent(dataUrlHtml), true);

    // 5. Valid PDF header should NOT be treated as HTML
    const pdfContent = Buffer.from('%PDF-1.4\n%âãÏÓ\n1 0 obj\n<<>>').toString('base64');
    assert.strictEqual(isBase64HtmlContent(pdfContent), false);

    // 6. Valid PNG header should NOT be treated as HTML
    const pngContent = Buffer.from('\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR').toString('base64');
    assert.strictEqual(isBase64HtmlContent(pngContent), false);
  });
});
