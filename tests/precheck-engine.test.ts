import assert from 'node:assert';
import { test, describe } from 'node:test';
import {
  parseSportsRecordText,
  evaluateFrontendEligibility,
  getReasonCodeInfo,
  REASON_CODE_LABELS,
} from '../src/services/precheck-engine';

describe('Precheck Engine - Reason Codes and Localization', () => {
  test('NO_ELIGIBILITY_METRIC_FOUND has friendly Traditional Chinese text', () => {
    const info = getReasonCodeInfo('NO_ELIGIBILITY_METRIC_FOUND');
    assert.strictEqual(info.type, 'error');
    assert.strictEqual(info.label, '未偵測到可計入之運動數據（時長、步數或距離）');
  });

  test('INSUFFICIENT_METRIC_COVERAGE has friendly text', () => {
    const info = getReasonCodeInfo('INSUFFICIENT_METRIC_COVERAGE');
    assert.strictEqual(info.type, 'warning');
    assert.strictEqual(info.label, '運動數據不足或不完整，無法確認是否符合資格');
  });

  test('MATCHED_THRESHOLD has friendly text', () => {
    const info = getReasonCodeInfo('MATCHED_THRESHOLD');
    assert.strictEqual(info.type, 'success');
    assert.strictEqual(info.label, '符合任務活動門檻資格');
  });

  test('Unknown code returns safe fallback without technical underscores', () => {
    const info = getReasonCodeInfo('SOME_FUTURE_UNKNOWN_CODE');
    assert.strictEqual(info.type, 'warning');
    assert.strictEqual(info.label, '截圖內容尚有部分項目無法完整確認');
    assert.doesNotMatch(info.label, /SOME_FUTURE_UNKNOWN_CODE/);
  });

  test('Empty evidence report emits user-friendly reason codes', () => {
    const report = evaluateFrontendEligibility('這是一張完全沒有任何運動數據的圖片');
    assert.strictEqual(report.status, 'NOT_EVALUATED');
    assert.ok(report.reasonCodes.includes('NO_ELIGIBILITY_METRIC_FOUND'));
    // All reason codes in report have mapped labels
    for (const code of report.reasonCodes) {
      assert.ok(REASON_CODE_LABELS[code], `Missing label for code: ${code}`);
    }
  });
});

describe('Precheck Engine - Date Extraction and Recovery', () => {
  test('Standard Chinese date matches: 9月10日', () => {
    const res = parseSportsRecordText('今天 9月10日 天氣晴');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日');
  });

  test('Date with spaces: 9 月 10 日 星期 四', () => {
    const res = parseSportsRecordText('9 月 10 日 星期 四');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日 星期四');
  });

  test('OCR corrupted month (月 dropped): 。 910 日 星期 四', () => {
    const res = parseSportsRecordText('。 910 日 星期 四');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日 星期四');
  });

  test('OCR corrupted month (月 recognized as 六): 9 六 10 日 星期 四', () => {
    const res = parseSportsRecordText('9 六 10 日 星期 四');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日 星期四');
  });

  test('OCR corrupted month (月 recognized as 朋): 9 朋 10 日 星期 四', () => {
    const res = parseSportsRecordText('9 朋 10 日 星期 四');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日 星期四');
  });

  test('OCR corrupted month (月 recognized as 衣): 9 衣 10 日 星期 四', () => {
    const res = parseSportsRecordText('9 衣 10 日 星期 四');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日 星期四');
  });

  test('Fused Month-Day numbers before 日: 910 日', () => {
    const res = parseSportsRecordText('紀錄日期 910 日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日');
  });

  test('Fused Month-Day 4 digits: 1010 日', () => {
    const res = parseSportsRecordText('紀錄 1010 日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '10月10日');
  });

  test('Spaced Month-Day before 日: 9 10 日', () => {
    const res = parseSportsRecordText('活動 9 10 日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月10日');
  });
});

describe('Precheck Engine - Step Count Extraction and Separation', () => {
  test('Standard thousands-separated steps: 8,504 步', () => {
    const res = parseSportsRecordText('今日累計 8,504 步');
    assert.strictEqual(res.distanceOrSteps.found, true);
    assert.strictEqual(res.distanceOrSteps.matches[0].value, '8,504 步');

    const rep = evaluateFrontendEligibility('今日累計 8,504 步');
    assert.strictEqual(rep.observed.steps, 8504);
  });

  test('Steps with symbol prefix from OCR icon: %8,504 步', () => {
    const res = parseSportsRecordText('步數 %8,504 步');
    assert.strictEqual(res.distanceOrSteps.found, true);
    assert.strictEqual(res.distanceOrSteps.matches[0].value, '8,504 步');

    const rep = evaluateFrontendEligibility('步數 %8,504 步');
    assert.strictEqual(rep.observed.steps, 8504);
  });

  test('Steps with quotation mark prefix: “8,504 步', () => {
    const res = parseSportsRecordText('總計 “8,504 步');
    assert.strictEqual(res.distanceOrSteps.found, true);
    assert.strictEqual(res.distanceOrSteps.matches[0].value, '8,504 步');

    const rep = evaluateFrontendEligibility('總計 “8,504 步');
    assert.strictEqual(rep.observed.steps, 8504);
  });

  test('Steps with space after icon: 2 8,504 步', () => {
    const res = parseSportsRecordText('2 8,504 步');
    assert.strictEqual(res.distanceOrSteps.found, true);
    assert.strictEqual(res.distanceOrSteps.matches[0].value, '8,504 步');

    const rep = evaluateFrontendEligibility('2 8,504 步');
    assert.strictEqual(rep.observed.steps, 8504);
  });
});

describe('Precheck Engine - Full Real-world Screenshot Verification', () => {
  test('Parses enhanced OCR output from the user attachment accurately', () => {
    const realWorldOcrText = `
21:28 oo@ 和 公 b Neo 品 各 今 上
< 我 的 活動 十 :
天 週 月

。 9 月 10 日 星期 四
“8,504 步
2,80(
| 1,40(
加 半
0. 4 . 8 . 12 . 16 . 20 .24
心肺 強化 分 數 。 步 數
「 步 數 」 可 有 效 測量 移動 距離 , 協 助
你 瞭解 活動 量 的 變化
# 09:40
上 午 走 路
22 分 鐘 12 秒 。 1,468 步
13:17
下 午 走路
11 分 鐘 01 秒 ‧。837 步
三 0 <
    `;

    const report = evaluateFrontendEligibility(realWorldOcrText);

    // 1. 日期確認已識別出 9月10日
    assert.strictEqual(report.observed.dateFound, true, 'Date must be found');

    // 2. 步數必須為 8504 步，而非 28504 步
    assert.strictEqual(report.observed.steps, 8504, 'Steps must be 8,504, not 28,504');

    // 3. 狀態必須合格（單日步數滿 8,000 步）
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');

    // 4. 理由代碼必須可由 getReasonCodeInfo 正確解析
    for (const code of report.reasonCodes) {
      const info = getReasonCodeInfo(code);
      assert.ok(info.label.length > 0);
      assert.doesNotMatch(info.label, /_/);
    }
  });

  test('Parses raw OCR text with corrupted month (910 日 星期 四)', () => {
    const corruptedMonthOcrText = `
21:28 @GS9 和 b Neo 和 汪 和 令 呈
< 我 的 活動 十 :
大 週 月
。 910 日 星期 四
“8,504 步
2,80(
0 4 8 12 16 20 24
心肺 強化 分 數 步 數
人 09:40
上 午 走路
22 分 鐘 12 秒 1,468 步
    `;

    const report = evaluateFrontendEligibility(corruptedMonthOcrText);
    assert.strictEqual(
      report.observed.dateFound,
      true,
      'Corrupted month should still be recovered as date'
    );
    assert.strictEqual(report.observed.steps, 8504);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
  });
});

describe('Precheck Engine - Date Range and Aggregate Disallowance', () => {
  test('Weekly date range (9月6日至12日) is NOT matched as single date, but marked as dateRange', () => {
    const text = '每週目標 9月6日至12日';
    const res = parseSportsRecordText(text);
    assert.strictEqual(
      res.date.found,
      false,
      'Range start 9月6日 must not be treated as a single date'
    );
    assert.strictEqual(res.dateRange?.found, true, 'dateRange must be detected');
    assert.ok(res.dateRange.matches[0].value.includes('9月6日至12日'));

    const rep = evaluateFrontendEligibility(text);
    assert.strictEqual(rep.observed.dateFound, false);
    assert.ok(rep.reasonCodes.includes('DATE_RANGE_NOT_ALLOWED'));
    assert.ok(rep.reasonCodes.includes('DATE_MISSING'));
  });

  test('Decimal distance (5.17 公里) is NOT falsely matched as month-day date', () => {
    const text = '今日距離 5.17 公里';
    const res = parseSportsRecordText(text);
    assert.strictEqual(res.date.found, false, '5.17 should not be treated as May 17th');
  });

  test('Second user screenshot (Weekly summary with 9月6日至12日) fails date check with DATE_RANGE_NOT_ALLOWED', () => {
    const secondScreenshotText = `
18:28 @b 器 @ 自 Nam 全
@ 僵
(9
八 心 肺 強化 分 數 % 步 數
1073 5.17 92
卡 公里 活動 時 間 (分 鐘 )
每 日 目標
過 去 7 天
2 35G 3》G@SGGe@
達成 目標 五 六 日 一 二 三 四
每 週 目標 EE
9 月 6 日 至 12 日
選 自 : 砰 全
守 oO <
    `;

    const res = parseSportsRecordText(secondScreenshotText);
    // 必須不能當作有效單日日期
    assert.strictEqual(
      res.date.found,
      false,
      'Date range must not be recognized as single activity date'
    );
    assert.strictEqual(res.dateRange?.found, true, 'Weekly range must be flagged as dateRange');

    const rep = evaluateFrontendEligibility(secondScreenshotText);
    assert.strictEqual(rep.observed.dateFound, false);
    assert.ok(rep.reasonCodes.includes('DATE_RANGE_NOT_ALLOWED'));
    assert.ok(rep.reasonCodes.includes('DATE_MISSING'));

    const rangeInfo = getReasonCodeInfo('DATE_RANGE_NOT_ALLOWED');
    assert.ok(
      rangeInfo.label.includes('9月6日至12日') ||
        rangeInfo.label.includes('統計') ||
        rangeInfo.label.includes('週期')
    );
  });
});
