import assert from 'node:assert';
import { test, describe } from 'node:test';
import {
  parseSportsRecordText,
  parseDateToCalendarDate,
  evaluateFrontendEligibility,
  evaluateOfficialFrontendEligibility,
  checkDatePeriod,
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

  test('Garmin timestamp with OCR corrupted month and day: 9878 19:03 (without @)', () => {
    const res = parseSportsRecordText('® & 9878 19:03\n騎乘');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月7日');
  });

  test('Garmin timestamp with symbol: 9878 © 19:03', () => {
    const res = parseSportsRecordText('9878 © 19:03');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月7日');
  });

  test('Corrupted month 8 before 日: 987日', () => {
    const res = parseSportsRecordText('時間 987日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月7日');
  });

  test('Corrupted month B before 日: 9B7日', () => {
    const res = parseSportsRecordText('時間 9B7日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月7日');
  });

  test('Corrupted month 朋 before 日: 9朋7日', () => {
    const res = parseSportsRecordText('時間 9朋7日');
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '9月7日');
  });

  test('Date without 日: 9月7 @ 19:03 or 9月7', () => {
    const res1 = parseSportsRecordText('9月7 @ 19:03');
    assert.strictEqual(res1.date.found, true);
    assert.strictEqual(res1.date.matches[0].value, '9月7日');

    const res2 = parseSportsRecordText('活動紀錄 9月7\n騎乘');
    assert.strictEqual(res2.date.found, true);
    assert.strictEqual(res2.date.matches[0].value, '9月7日');
  });

  test('Short fused month-day: 97日 and 907日', () => {
    const res1 = parseSportsRecordText('97日 紀錄');
    assert.strictEqual(res1.date.found, true);
    assert.strictEqual(res1.date.matches[0].value, '9月7日');

    const res2 = parseSportsRecordText('907日 紀錄');
    assert.strictEqual(res2.date.found, true);
    assert.strictEqual(res2.date.matches[0].value, '9月7日');
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

    const report = evaluateFrontendEligibility(
      realWorldOcrText,
      null,
      new Date('2026-09-10T12:00:00+08:00')
    );

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

    const report = evaluateFrontendEligibility(
      corruptedMonthOcrText,
      null,
      new Date('2026-09-10T12:00:00+08:00')
    );
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

describe('Precheck Engine - Activity Period Validation (當週運動期別檢核)', () => {
  const referenceDate = new Date('2026-09-11T14:00:00+08:00'); // 處於第 2 期 (09/07 ~ 09/13)

  test('9月5日 is flagged as past week (第 1 期), not in current period', () => {
    const pc = checkDatePeriod('9月5日', referenceDate);
    assert.ok(pc !== null);
    assert.strictEqual(pc.isCurrentPeriod, false, '9月5日 should not be in current period');
    assert.strictEqual(pc.screenshotDate, '9月5日');
    assert.ok(pc.currentPeriodLabel.includes('第 2 期'));
    assert.ok(pc.matchedPeriodLabel?.includes('第 1 期'));
    assert.strictEqual(pc.periodDiff, -1);
  });

  test('9月10日 is recognized as current week (第 2 期)', () => {
    const pc = checkDatePeriod('9月10日', referenceDate);
    assert.ok(pc !== null);
    assert.strictEqual(pc.isCurrentPeriod, true, '9月10日 should be in current period');
    assert.strictEqual(pc.screenshotDate, '9月10日');
    assert.ok(pc.currentPeriodLabel.includes('第 2 期'));
    assert.ok(pc.matchedPeriodLabel?.includes('第 2 期'));
    assert.strictEqual(pc.periodDiff, 0);
  });

  test('Full year date 2026-09-08 is recognized as current week', () => {
    const pc = checkDatePeriod('2026-09-08', referenceDate);
    assert.ok(pc !== null);
    assert.strictEqual(pc.isCurrentPeriod, true);
    assert.strictEqual(pc.screenshotDate, '9月8日');
  });

  test('Date outside official campaign (8月20日) is handled gracefully', () => {
    const pc = checkDatePeriod('8月20日', referenceDate);
    assert.ok(pc !== null);
    assert.strictEqual(pc.isCurrentPeriod, false);
    assert.strictEqual(pc.matchedPeriodLabel, null);
  });
});

describe('Precheck Engine - Garmin Connect & Dual Evaluation (雙軌對照機制)', () => {
  const referenceDate = new Date('2026-09-11T14:00:00+08:00'); // 當前為第 2 期

  const garminOcrText = `
15:47
< 跑步 :
總覽 數據 計圈 圖表 裝備
Google 沙崙海灘
9月5日 @ 14:49
下大雨
新增備註
6.53 公里
距離
153 bpm
平均心率
6:05 /公里
平均配速
39:42
總計時間
391
總卡路里
照片 分享
評估
  `;

  test('Official raw algorithm fails this screenshot with NO_ELIGIBILITY_METRIC_FOUND', () => {
    const officialReport = evaluateOfficialFrontendEligibility(garminOcrText, 90);
    // 官網原始正則因為無法識別漢字相鄰的「6.53 公里距離」與未支援分秒格式的「39:42」，判定為 NOT_EVALUATED
    assert.strictEqual(officialReport.status, 'NOT_EVALUATED');
    assert.ok(officialReport.reasonCodes.includes('NO_ELIGIBILITY_METRIC_FOUND'));
  });

  test('Enhanced algorithm successfully identifies 6.53km distance and 39:42 duration', () => {
    const report = evaluateFrontendEligibility(garminOcrText, 90, referenceDate);

    // 1. 改良版確認數值達標，但因截圖日期（9月5日，第 1 期）非當前活動期別（第 2 期），判定為不符合
    assert.strictEqual(report.status, 'LIKELY_NOT_QUALIFIED');
    assert.strictEqual(report.observed.distanceKm, 6.53, 'Distance 6.53 km must be extracted');
    assert.strictEqual(report.observed.durationMinutes, 39.7, 'Duration 39:42 must be 39.7 min');
    assert.strictEqual(report.activityType, 'WALK_RUN');
    assert.strictEqual(report.matchedRuleCode, 'WALK_RUN_5_KM');

    // 2. 雙軌分歧標記 (isDivergent = true)，精確指出非當期不符任務標準
    assert.strictEqual(
      report.isDivergent,
      true,
      'Should detect divergence between official and enhanced'
    );
    assert.strictEqual(
      report.reasonCodes.includes('OFFICIAL_PRECHECK_MAY_FLAG'),
      false,
      'Should not flag manual review possibility for expired past-week record'
    );
    assert.ok(report.divergenceReason?.includes('本 App 改良版預檢'));
    assert.ok(report.divergenceReason?.includes('不符當週任務標準'));

    // 3. 運動日期期別檢核：9月5日判定為非當週紀錄
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, false);
    assert.ok(report.reasonCodes.includes('DATE_NOT_CURRENT_PERIOD'));
    assert.ok(report.observed.periodCheck?.matchedPeriodLabel?.includes('第 1 期'));
    assert.ok(report.observed.periodCheck?.currentPeriodLabel?.includes('第 2 期'));
  });

  test('Pace (/公里) is NOT falsely extracted as distance', () => {
    const paceOnlyText = '平均配速 6:05 /公里';
    const report = evaluateFrontendEligibility(paceOnlyText, 90, referenceDate);
    assert.strictEqual(report.observed.distanceKm, null, 'Pace must not be parsed as distance');
  });

  test('Duration immediately before label (39:42 總計時間) is correctly parsed', () => {
    const text = '39:42 總計時間';
    const report = evaluateFrontendEligibility(text, 90, referenceDate);
    assert.strictEqual(report.observed.durationMinutes, 39.7);
  });

  test('Duration immediately after label (總計時間 45:10) is correctly parsed', () => {
    const text = '總計時間 45:10';
    const report = evaluateFrontendEligibility(text, 90, referenceDate);
    assert.strictEqual(report.observed.durationMinutes, 45.17);
  });

  test('Parses raw Tesseract output with OCR noise (6.53 ag 距離 & 39:42 391 總計時間)', () => {
    const rawTesseractOutput = `
15:47 8@%F 內 六 轉 樟 光 閃避 1
全 跑步
總 覽 數 據 計 圈 圖 表 裝備
% 9 月 5 日 @14:49 3
下 大 雨 ?
新 增 備註
6.53 ag
距離
153 bpm @ 6:05/22 ®
平均 心率 平均 配 速
39:42 391
總 計時 間 總 卡 路 里
& 照片 < 分 享
評估
    `;

    const report = evaluateFrontendEligibility(rawTesseractOutput, 90, referenceDate);
    const fields = parseSportsRecordText(rawTesseractOutput);

    // 1. 日期確認為 9月5日，且排除 pace 6:05/22 被誤認
    assert.strictEqual(fields.date.matches[0].value, '9月5日');
    assert.strictEqual(report.observed.dateFound, true);

    // 2. 距離成功擷取 6.53 km，排除 153 bpm
    assert.strictEqual(report.observed.distanceKm, 6.53);

    // 3. 時長成功擷取 39:42 (39.7 分鐘)
    assert.strictEqual(report.observed.durationMinutes, 39.7);

    // 4. 判定數值達標但非當週期別（不符合當週任務標準），且標記雙軌分歧
    assert.strictEqual(report.status, 'LIKELY_NOT_QUALIFIED');
    assert.strictEqual(report.isDivergent, true);
    assert.strictEqual(report.matchedRuleCode, 'WALK_RUN_5_KM');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, false);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 1 期');
    assert.ok(report.reasonCodes.includes('DATE_NOT_CURRENT_PERIOD'));
    assert.strictEqual(report.reasonCodes.includes('OFFICIAL_PRECHECK_MAY_FLAG'), false);
  });

  test('Distance with unit OCR misrecognized as "2" or "2=" captures actual metric instead of "2 km"', () => {
    const text1 = '6.53 2\n距離';
    const rep1 = evaluateFrontendEligibility(text1, 90, referenceDate);
    assert.strictEqual(rep1.observed.distanceKm, 6.53);

    const text2 = '6.593 2=\n距離';
    const rep2 = evaluateFrontendEligibility(text2, 90, referenceDate);
    assert.strictEqual(rep2.observed.distanceKm, 6.593);
  });

  test('Activity type correctly resolves to WALK_RUN when 跑步 and 配速 are present, even if route mentions 自行車道', () => {
    const text = `
< 跑步 :
淡海新市鎮自行車道
9月5日 @ 14:49
6.53 公里
距離
153 bpm 6:05 / 公里
平均心率 平均配速
39:42 總計時間
    `;
    const rep = evaluateFrontendEligibility(text, 90, referenceDate);
    assert.strictEqual(rep.activityType, 'WALK_RUN');
    assert.strictEqual(rep.observed.distanceKm, 6.53);
    assert.strictEqual(rep.observed.durationMinutes, 39.7);
  });

  test('Parses complete inverted canvas OCR text correctly for distance, duration, period and activity type', () => {
    const invertedOcr = `
15:47 = @ N@BBleiR  SaED
< [跑步 :
總 覽 數 據 計 圈 圖 表 裝備
o-? am
M 記 ) / \\
淡海 新 市 鎮 !
£ 關公 /
醫 放 緣 野 馬術 交 創 園區 人
Google 高 海灘 更 慢 ME — 更 快 有 4
¥ 9 月 5 日 @ 14:49 2
下 大 雨 4
6.593 2=
距離
153 bpm 6:05 / 公 里
平均 心率 平均 配 速
39:42 391
總 計時 間 總 卡 路 里
& 照片 ee 分 享
評估
三 O 4
    `;
    const rep = evaluateFrontendEligibility(invertedOcr, 85, referenceDate);
    assert.strictEqual(rep.activityType, 'WALK_RUN');
    assert.strictEqual(rep.observed.distanceKm, 6.593);
    assert.strictEqual(rep.observed.durationMinutes, 39.7);
    assert.strictEqual(rep.observed.periodCheck?.isCurrentPeriod, false);
    assert.strictEqual(rep.observed.periodCheck?.matchedPeriodName, '第 1 期');
    assert.strictEqual(rep.status, 'LIKELY_NOT_QUALIFIED');
    assert.strictEqual(rep.matchedRuleCode, 'WALK_RUN_5_KM');
  });

  test('Garmin cycling screenshot passes eligibility by duration >= 30min despite cycling distance < 15km', () => {
    const rawOcr = `
1450@ x 生 過重 和 盆 量 9 全 知念 加
全 騎 乘 H
總 覽 數 據 計 圈 圖 表 裝備

新 北 大 mlg 寢 ,
站 饋 9
— = :
An 臺北 am
板橋 區 ge 大
中 和 區 !
® & 9878 @19:03
中 山區 騎 乘
8.742
距離
40:09 13.1 kmh @
總 計時 間 平均 速度
202R @ 120 bpm @
總 爬升 平均 心率
OD 2 個 洛
O®m 器 留言
評估
= (e] <
    `;
    const rep = evaluateFrontendEligibility(rawOcr, 85, referenceDate);
    assert.strictEqual(rep.activityType, 'CYCLING');
    assert.strictEqual(rep.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(rep.matchedRuleCode, 'DURATION_30_MIN');
    assert.strictEqual(rep.observed.durationMinutes, 40.15);
    assert.strictEqual(rep.observed.periodCheck?.matchedPeriodName, '第 2 期');
    assert.strictEqual(rep.isDivergent, true);
  });

  test('User device OCR output with corrupted "(A) co 987H @ 19:03" correctly parses date and qualifies', () => {
    const rawOcr = `
14:59 8 | 100%
← 騎乘
總覽 數據 計圈 圖表 裝備
(A) co 987H @ 19:03
中山區 騎乘
8.74 公里
距離
40:09 13.1 km/h
總計時間 平均速度
20 公尺 120 bpm
總爬升 平均心率
    `;
    const rep = evaluateFrontendEligibility(rawOcr, 85, referenceDate);
    assert.strictEqual(rep.activityType, 'CYCLING');
    assert.strictEqual(rep.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(rep.matchedRuleCode, 'DURATION_30_MIN');
    assert.strictEqual(rep.observed.durationMinutes, 40.15);
    assert.strictEqual(rep.observed.distanceKm, 8.74);
    assert.strictEqual(rep.observed.dateFound, true);
    assert.strictEqual(rep.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(rep.observed.periodCheck?.screenshotDate, '9月7日');
    assert.strictEqual(rep.observed.periodCheck?.matchedPeriodName, '第 2 期');
  });
});

describe('Precheck Engine - Apple Fitness & Corrupted YMD OCR', () => {
  const referenceDate = new Date('2026-09-11T16:00:00+08:00');

  test('Corrupted YMD header from user Apple Fitness device OCR: "2026%9A88H... EB OM"', () => {
    const rawLine = '2026%9A88H... EB OM';
    const res = parseSportsRecordText(rawLine);
    assert.strictEqual(res.date.found, true);
    assert.strictEqual(res.date.matches[0].value, '2026年9月8日');

    const calendar = parseDateToCalendarDate(rawLine, referenceDate);
    assert.ok(calendar !== null);
    assert.strictEqual(calendar?.year, 2026);
    assert.strictEqual(calendar?.month, 9);
    assert.strictEqual(calendar?.day, 8);
    assert.strictEqual(calendar?.dateStr, '2026-09-08');
  });

  test('Apple Fitness multi-column table extracts steps 8,592 and distance 5.76 km', () => {
    const rawText = `
2026%9A88H... EB OM
每日步數
步數 距離
8,592 5.76 公里
    `;
    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.steps, 8592);
    assert.strictEqual(report.observed.distanceKm, 5.76);
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'WALK_RUN_5_KM');
    assert.ok(report.reasonCodes.includes('MATCHED_DAILY_STEPS_THRESHOLD'));
    assert.ok(report.reasonCodes.includes('MATCHED_WALK_RUN_DISTANCE_THRESHOLD'));
  });

  test('Garmin screenshot with corrupted unit "5.01 z=\\n距離" correctly extracts distance 5.01 km and qualifies', () => {
    const rawText = `
14:23 Ge 句 回 條 NIP E TE
< my :
總 覽 數 據 計 圈 圖 表
(3) X 9 月 10 日 @ 20:10
新 店 區 跑步
5.01 z=
距離
165bpm 一 6:41 / 公 里 一
平均 心率 平均 配 束
33:29 421
總 計時 間 總 卡 路 里
    `;
    const fields = parseSportsRecordText(rawText);
    assert.strictEqual(fields.distanceOrSteps.found, true);
    assert.strictEqual(fields.distanceOrSteps.matches[0].value, '5.01');

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.distanceKm, 5.01);
    assert.strictEqual(report.observed.durationMinutes, 33.48);
    assert.strictEqual(report.activityType, 'WALK_RUN');
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'WALK_RUN_5_KM');
    assert.ok(report.reasonCodes.includes('MATCHED_WALK_RUN_DISTANCE_THRESHOLD'));
    assert.ok(report.reasonCodes.includes('MATCHED_DURATION_THRESHOLD'));
  });

  test('Garmin screenshot with corrupted unit "5.01 ag\\n距離" correctly extracts distance 5.01 km', () => {
    const rawText = `
全 9 月 10 日 @ 20:10
新 店 區 跑步
5.01 ag
距離
165bpm ( 6:41 / 公 里 (
平均 心率 平均 配 速
胡說 421
總 計時 間 總 卡 路 里
    `;
    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.distanceKm, 5.01);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'WALK_RUN_5_KM');
  });

  test('Google Fit screenshot with clean "8,145 步" qualifies for DAILY_STEPS_8000', () => {
    const rawText = `
21:34 自 我 的 活動 記 日
< 9 月 10 日 星期 四
8,145 步
1,700
0 4 8 12 16 20 24
| 心肺 強化 分 數 | 步 數
「 步 數 」 可 有 效 測量 移動 距離 , 協 助 你 瞭解 活動 量 的 變化
11:42 中午走路 3 分鐘 49 秒 ‧ 297 步
12:07 中午走路 4 分鐘 38 秒 ‧ 445 步
12:26 中午走路 17 分鐘 39 秒 ‧ 840 步
    `;
    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.steps, 8145);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
  });

  test('Google Fit screenshot with corrupted OCR "8 了 5" recovers steps to 8145 and qualifies', () => {
    const rawText = `
21:34 @ = nu # Nala ws n= 8B
< BRAVES SE
x 週 月

< 9 月 10 日 星期 四
8 了 5
1,700
| | :
I! - i a J UJ
0 4 8 12 16 20 24
| 心肺 強化 分 數 | SH
「 步 數 」 可 有 效 測量 移動 距離 , 協 助 你 瞭解 活動 量 的 變化
® 11:42 中 午 走 路 3 分 鐘 49 秒 ‧ 297 步
® 12:07 中 午 走 路 4 分 鐘 38 秒 。 “445 步
® 12:26 中 午 走 路 17 分 鐘 39 秒 。 “840 步
三 0 <
    `;
    const fields = parseSportsRecordText(rawText);
    assert.strictEqual(fields.distanceOrSteps.found, true);

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.steps, 8145);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
    assert.strictEqual(report.isDivergent, true);
    assert.ok(report.reasonCodes.includes('OFFICIAL_PRECHECK_MAY_FLAG'));
  });

  test('Google Fit screenshot with corrupted OCR "81455" (步 read as 5) recovers steps to 8145 and qualifies over sub-segments (840 步)', () => {
    const rawText = `
21:34 自 品 & 6 二 內 會 量 滲 全知 仿 喲
全 我 的 活動 這 日
天 週 月

< 9 月 10 日 星期 四
81455
1,700
|
利和
0 4 8 12 16 20 。 2
心肺 強化 分 數 步 數
「 步 數 」 可 有 效 測量 移動 距離 , 協 助 你 瞭解 活動 量 的
變化
當 11:42
中 午 走 路
3 分 鐘 49 秒 ‧。. 297 步
當 12:07
中 午 走路
4 分 鐘 38 秒 。 ”445 步
當 12:26
中 午 走 路
17 分鐘 39 秒 。 840 步
一 : O 和
    `;
    const fields = parseSportsRecordText(rawText);
    assert.strictEqual(fields.distanceOrSteps.found, true);

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.steps, 8145);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
  });

  test('Google Fit screenshot with corrupted OCR "8,145 5" recovers steps to 8145 and qualifies', () => {
    const rawText = `
9 月 10 日 星期 四
8,145 5
心肺 強化 分 數 步 數
中午走路 17 分鐘 840 步
    `;
    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.steps, 8145);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
  });

  test('Google Fit screenshot with corrupted OCR "©8145 %" recovers steps to 8145 and qualifies over sub-segments (840 步)', () => {
    const rawText = `
21:34 @@ = 8 #® NeBRCE mT EE

全] 我 的 活動 下 :
天 週 月
< 9 月 10 日 星期 四
©8145 %
1,700
| | :
I! - i a, J a
0 4 8 18 16 20 24

Common | sw

「 步 數 」 可 有 效 測量 移動 距離 , 協 助 你 瞭解 活動 量 的
變化

讓 11:42
中 午 走 路
3 分鐘 49 秒 。 297 步

12:07
中 午 走 路
4 分 鐘 38 秒 。 “445 步

集 12:26
中 午 走 路
17 分 鐘 39 秒 。 “840 步

= 0 <
    `;
    const fields = parseSportsRecordText(rawText);
    assert.strictEqual(fields.distanceOrSteps.found, true);

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.steps, 8145);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DAILY_STEPS_8000');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
    assert.strictEqual(report.isDivergent, true);
    assert.ok(report.reasonCodes.includes('OFFICIAL_PRECHECK_MAY_FLAG'));
  });
});

describe('Precheck Engine - Garmin Connect Strength Training (肌力訓練) Verification', () => {
  const referenceDate = new Date('2026-09-10T20:00:00+08:00');

  test('Garmin Connect strength training OCR text with 1:13:07 and 總計時間 qualifies for DURATION_30_MIN', () => {
    const rawText = `
16355 xx 生 看 二 品

全 肌 力 訓練

總 覽 數 據 圖 表

“ 主 要 肌肉 他 次 要 肌肉

非 目標 肌肉
【 次 】 守 9 朋 10 日 @18:53
肌 力 訓練
1:13:07

總 計時 間

111 bpm 386
平均 心率 總 卡 路 里

組 數 。 名 稱 時 間 ] 次數” 重量
公斤
    `;

    const fields = parseSportsRecordText(rawText);
    assert.strictEqual(fields.date.found, true);
    assert.strictEqual(fields.duration.found, true);
    assert.strictEqual(fields.duration.matches[0].value, '1:13:07');
    assert.strictEqual(fields.activityOrRoute.found, true);

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DURATION_30_MIN');
    assert.strictEqual(report.observed.dateFound, true);
    assert.strictEqual(report.observed.durationMinutes, 73.12);
    assert.strictEqual(report.activityType, 'OTHER');
    assert.strictEqual(report.observed.periodCheck?.isCurrentPeriod, true);
    assert.strictEqual(report.observed.periodCheck?.matchedPeriodName, '第 2 期');
  });

  test('Garmin Connect strength training with fused clock "113:07 總計時間" recovers 73.12 min and qualifies', () => {
    const rawText = `
9月10日 @ 18:53
肌力訓練
113:07
總計時間
111 bpm 386
平均心率 總卡路里
    `;

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DURATION_30_MIN');
    assert.strictEqual(report.observed.durationMinutes, 73.12);
    assert.strictEqual(report.activityType, 'OTHER');
  });

  test('Garmin Connect strength training with space-separated clock "1 13 07 總計時間" recovers 73.12 min', () => {
    const rawText = `
9月10日 @ 18:53
肌力訓練
1 13 07
總計時間
111 bpm 386
平均心率 總卡路里
    `;

    const report = evaluateFrontendEligibility(rawText, 85, referenceDate);
    assert.strictEqual(report.status, 'LIKELY_QUALIFIED');
    assert.strictEqual(report.matchedRuleCode, 'DURATION_30_MIN');
    assert.strictEqual(report.observed.durationMinutes, 73.12);
    assert.strictEqual(report.activityType, 'OTHER');
  });
});
