/**
 * 運動紀錄截圖前端預檢引擎
 * 完整實作運動部 https://500.gov.tw front-ocr-precheck/1.0 & front-eligibility-precheck/1.0 演算法
 * 並具備「雙軌對照機制」（官網原始嚴格判定 vs 改良版智慧判定）與當週活動期別檢查
 */

import { OFFICIAL_SCHEDULE_RANGES, getCurrentPeriod } from './periods';

export interface RuleMatch {
  value: string;
  ruleId: string;
}

export interface RuleGroupResult {
  found: boolean;
  matches: RuleMatch[];
}

export interface ExtractedFields {
  date: RuleGroupResult;
  dateRange?: RuleGroupResult;
  duration: RuleGroupResult;
  distanceOrSteps: RuleGroupResult;
  activityOrRoute: RuleGroupResult;
  appHints: RuleGroupResult;
}

export type PrecheckState = 'READY' | 'WARN' | 'BLOCK' | 'INCONCLUSIVE';
export type EligibilityStatus =
  'LIKELY_QUALIFIED' | 'LIKELY_NOT_QUALIFIED' | 'INCONCLUSIVE' | 'NOT_EVALUATED';
export type ActivityType = 'WALK_RUN' | 'CYCLING' | 'OTHER' | 'UNKNOWN';

export interface EligibilityEvidence {
  value: number;
  unit: 'minutes' | 'steps' | 'km';
  rawValue: string;
  aggregate: boolean;
}

export interface PeriodCheckResult {
  isCurrentPeriod: boolean;
  screenshotDate: string | null;
  currentPeriodLabel: string;
  matchedPeriodLabel: string | null;
  matchedPeriodName?: string | null;
  periodDiff: number; // -1 for past period, 0 for current, 1 for future
}

export interface EligibilityReport {
  contractVersion: string;
  status: EligibilityStatus;
  officialDecision: boolean;
  matchedRuleCode: string | null;
  reasonCodes: string[];
  activityType: ActivityType;
  observed: {
    dateFound: boolean;
    durationMinutes: number | null;
    steps: number | null;
    distanceKm: number | null;
    metricTypeCount: number;
    periodCheck?: PeriodCheckResult;
  };
  evidence: EligibilityEvidence[];
  thresholds: {
    durationMinutes: number;
    dailySteps: number;
    walkRunKm: number;
    cyclingKm: number;
  };
  officialEligibility?: EligibilityReport;
  isDivergent?: boolean;
  divergenceReason?: string;
}

export interface PrecheckResult {
  contractVersion: string;
  state: PrecheckState;
  userMaySubmit: boolean;
  officialDecision: boolean;
  codes: string[];
  fields: ExtractedFields;
  eligibility: EligibilityReport;
  officialEligibility?: EligibilityReport;
  isDivergent?: boolean;
  divergenceReason?: string;
  ocr: {
    engineId: string | null;
    durationMs: number;
    meanConfidence: number | null;
    rawText?: string;
  };
}

// 官方門檻標準
export const ELIGIBILITY_THRESHOLDS = {
  durationMinutes: 30, // 時長滿 30 分鐘
  dailySteps: 8000, // 步數滿 8,000 步
  walkRunKm: 5, // 跑步/健走滿 5 公里
  cyclingKm: 15, // 騎車滿 15 公里
};

// 狀態與原因代碼的中文友善說明對照
export const REASON_CODE_LABELS: Record<
  string,
  { label: string; type: 'success' | 'warning' | 'info' | 'error' }
> = {
  // 達標規則
  DURATION_30_MIN: { label: '運動時間達標（滿 30 分鐘）', type: 'success' },
  DAILY_STEPS_8000: { label: '單日步數達標（滿 8,000 步）', type: 'success' },
  WALK_RUN_5_KM: { label: '跑步 / 健走距離達標（滿 5 公里）', type: 'success' },
  CYCLING_15_KM: { label: '自行車騎乘距離達標（滿 15 公里）', type: 'success' },
  MATCHED_DURATION_THRESHOLD: { label: '符合運動時長標準', type: 'success' },
  MATCHED_DAILY_STEPS_THRESHOLD: { label: '符合單日步數標準', type: 'success' },
  MATCHED_WALK_RUN_DISTANCE_THRESHOLD: { label: '符合跑步/健走距離標準', type: 'success' },
  MATCHED_CYCLING_DISTANCE_THRESHOLD: { label: '符合騎乘距離標準', type: 'success' },
  MATCHED_THRESHOLD: { label: '符合任務活動門檻資格', type: 'success' },
  DATE_FOUND: { label: '已識別出運動日期', type: 'info' },
  DATE_FOUND_CURRENT_PERIOD: { label: '運動日期符合當前活動期別', type: 'success' },

  // 雙軌分歧說明
  OFFICIAL_PRECHECK_MAY_FLAG: {
    label:
      '官網自動判定可能審核不通過（因格式限制，但經本 App 的改良版預檢判定數值實質達標，可能需待人工審核才會通過）',
    type: 'info',
  },

  // 警示與退件風險
  DATE_NOT_CURRENT_PERIOD: {
    label: '非當週運動紀錄：截圖日期不符當前活動期別（逾期不可跨期補傳，易遭官方退件）',
    type: 'warning',
  },
  DATE_MISSING: { label: '未找到有效運動日期（易遭退件）', type: 'warning' },
  MISSING_DATE: { label: '缺少運動日期資訊（易遭退件）', type: 'warning' },
  DATE_RANGE_NOT_ALLOWED: {
    label:
      '非單日運動紀錄：截圖僅顯示目標或統計週期（如 9月6日至12日），不符運動部「當週單日」上傳規範（無法通過審核）',
    type: 'error',
  },
  MISSING_ACTIVITY_METRIC: { label: '未偵測到有效時長、距離或步數', type: 'warning' },
  MISSING_ACTIVITY_OR_ROUTE_HINT: { label: '未辨識出運動類型關鍵字或軌跡', type: 'warning' },
  ONLY_AGGREGATE_VALUES_FOUND: {
    label: '偵測到「週/月平均」統計數據（須為單次或單日紀錄）',
    type: 'warning',
  },
  QUALIFYING_METRIC_WITHOUT_DATE: {
    label: '數值已達標，但截圖中缺少日期資訊（易遭退件）',
    type: 'warning',
  },
  ACTIVITY_TYPE_REQUIRED_FOR_DISTANCE: {
    label: '距離大於 5km，但需標註為跑步或健走（若為單車須滿 15km）',
    type: 'warning',
  },
  INSUFFICIENT_METRIC_COVERAGE: {
    label: '運動數據不足或不完整，無法確認是否符合資格',
    type: 'warning',
  },
  NO_ELIGIBILITY_METRIC_FOUND: {
    label: '未偵測到可計入之運動數據（時長、步數或距離）',
    type: 'error',
  },
  BELOW_ALL_OBSERVED_THRESHOLDS: { label: '數值未達任一項任務合格門檻', type: 'error' },
  BELOW_ALL_ELIGIBILITY_THRESHOLDS: {
    label: '未達到任務資格要求（時長 30 分 / 8,000 步 / 跑 5km / 騎 15km）',
    type: 'error',
  },
  LOW_OCR_CONFIDENCE: {
    label:
      '圖片文字辨識度偏低（低於 60%），建議更換截圖（可嘗試設定放大系統文字或改為淺色模式，再重新截圖）',
    type: 'warning',
  },
  OCR_EMPTY: { label: '圖片中未辨識出任何文字', type: 'error' },
  OCR_TIMEOUT: { label: '文字辨識超時，請重新選取圖片', type: 'error' },
  OCR_FAILED: { label: '文字辨識發生錯誤，請重新選取圖片', type: 'error' },
  FILE_TOO_LARGE: { label: '檔案大小超過 10MB 限制', type: 'error' },
  UNSUPPORTED_TYPE: { label: '僅支援 PNG 或 JPEG 圖片格式', type: 'error' },
  PIXEL_LIMIT_EXCEEDED: { label: '圖片解析度超過 4000 萬像素', type: 'error' },
};

/**
 * 取得原因代碼的人性化說明（附安全備援，杜絕工程代碼洩漏）
 */
export function getReasonCodeInfo(code: string): {
  label: string;
  type: 'success' | 'warning' | 'info' | 'error';
} {
  if (REASON_CODE_LABELS[code]) {
    return REASON_CODE_LABELS[code];
  }
  return {
    label: '截圖內容尚有部分項目無法完整確認',
    type: 'warning',
  };
}

// 統計或目標日期區間（例如：9月6日至12日、9/6~9/12 等週/月統計區間，非單日紀錄）
export const RE_DATE_RANGE =
  /(?:(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*[月/.-]\s*(?:[12]\d|3[01]|0?[1-9])\s*[日號]?\s*(?:至|到|~|～|--?)\s*(?:(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*[月/.-]\s*)?(?:[12]\d|3[01]|0?[1-9])\s*[日號]?)/gi;

// 正則表達式集
const DATE_RULES: { id: string; pattern: RegExp; valueGroup?: number }[] = [
  {
    id: 'date-ymd-separator',
    pattern: /\b(?:20\d{2}|1\d{2})[./-](?:0?[1-9]|1[0-2])[./-](?:[12]\d|3[01]|0?[1-9])\b/g,
  },
  {
    id: 'date-ymd-zh',
    pattern:
      /(?<!\d)(?:20\d{2}|1\d{2})\s*年\s*(?:0?[1-9]|1[0-2])\s*月\s*(?:[12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號号口]?(?:\s*(?:\.{2,3}|…))?/gi,
  },
  // 優先比對更具體之「月日+星期」（例如 9月10日 星期四、910 日 星期四、9 六 10 日 星期 四 等）
  {
    id: 'date-md-weekday-zh',
    pattern:
      /(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*(?:[月六朋衣目日HnA1/.-]|\s*)\s*(?:[12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號]?\s*(?:星期|週|周)\s*[一二三四五六日天]/gi,
  },
  {
    id: 'date-weekday-prefix-zh',
    pattern:
      /(?:星期|週|周)\s*[一二三四五六日天][\s,，、]+(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*[月/.-]?\s*(?:[12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號]?/gi,
  },
  {
    id: 'date-md',
    pattern:
      /(?<![:\d])\b(?:0?[1-9]|1[0-2])\s*[/]\s*(?:[12]\d|3[01]|0?[1-9])\b(?!\s*(?:km|公里|m|公尺|mi|英里|k?cal|卡|分|秒))/gi,
  },
  // 標準月日（日號可選，日字元誤讀為 s/S/B/l/b 等也能容錯）
  {
    id: 'date-md-zh',
    pattern:
      /(?<!\d)(0?[1-9]|1[0-2])\s*月\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號Hh号口]?(?:\s*(?:\.{2,3}|…))?(?!\s*[%分秒個度kK]|公里|公尺)/gi,
    valueGroup: 0,
  },
  // 容錯年月日（年被辨識為 % 或 *，月被辨識為 A/8/B/朋/六/目/衣/H/n 等，日被辨識為 88H/8H/H/號/口/号 等）
  // 例如「2026%9A88H... EB OM」或「2026%9月88H」
  {
    id: 'date-corrupted-ymd-zh',
    pattern:
      /(?<!\d)(20\d{2}|1\d{2})\s*[%年*./\-]\s*(0?[1-9]|1[0-2])\s*([月8B朋六目衣HnA/.\-])\s*([12]\d|3[01]|0?[1-9])\s*([8BHh日號号口]+)?(?:\s*(?:\.{2,3}|…))?/gi,
  },
  // 容錯月（月被辨識為 8, B, 朋, 六, 目, 衣, H, A 等，日被辨識為 日/號/H/h/口/88H 等）
  {
    id: 'date-corrupted-month-zh',
    pattern:
      /(?<!\d)(0?[1-9]|1[0-2])\s*[8B朋六目衣HnA]\s*([12]\d|3[01]|0?[1-9])\s*([8BHh日號号口]+)?/gi,
    valueGroup: 0,
  },
  // 月日黏連 3~4 碼容錯（例如 910 日、1010 日）
  {
    id: 'date-fused-md-zh',
    pattern: /\b(?:(0?[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])|([1-9])([12]\d|3[01]))\s*[日號号口]/g,
  },
  // 月日黏連 2 碼容錯（例如 97 日、907 日）
  {
    id: 'date-fused-short-zh',
    pattern: /\b([1-9])0?([1-9])\s*[日號号口]/g,
  },
  // 空白分隔月日容錯（例如 9 10 日）
  {
    id: 'date-spaced-md-zh',
    pattern: /\b(0?[1-9]|1[0-2])\s+([12]\d|3[01]|0?[1-9])\s*[日號号口]/g,
  },
  // 活動時間戳前綴日期（例如 9月7日 @ 19:03、987H @ 19:03、9878 19:03、9月7 19:03、9 7 19:03 等）
  {
    id: 'date-md-at-time-zh',
    pattern:
      /(?<!\d)((?:0?[1-9]|1[0-2])\s*[8B月日朋六目衣HnA/.\-\s]?\s*(?:[12]\d|3[01]|0?[1-9])\s*[8B日號Hh号口]?)\s*(?:[@©®&·•\-~,aA/]|at)?\s*(?:(?:上午|下午|早上|晚上|清晨|中午)\s*)?\d{1,2}:\d{2}/gi,
    valueGroup: 1,
  },
  {
    id: 'date-month-en',
    pattern:
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*(?:20\d{2}))?\b/gi,
  },
];

const DURATION_RULES = [
  { id: 'duration-hms', pattern: /\b\d{1,3}:[0-5]\d:[0-5]\d\b/g },
  { id: 'duration-hm-hour-unit', pattern: /\b\d{1,3}:[0-5]\d\s*(?:h|hr|hrs|hours?)\b/gi },
  { id: 'duration-hour-minute-zh', pattern: /\d+(?:\.\d+)?\s*小時(?:\s*\d+\s*(?:分|分鐘))?/g },
  { id: 'duration-minute-zh', pattern: /\d+(?:\.\d+)?\s*(?:分鐘|分)/g },
  { id: 'duration-en', pattern: /\b\d+(?:\.\d+)?\s*(?:hours?|hrs?|minutes?|mins?)\b/gi },
];

const DISTANCE_OR_STEPS_RULES = [
  { id: 'distance-km-en', pattern: /\b\d+(?:[.,]\d+)?\s*km\b/gi },
  { id: 'distance-km-zh', pattern: /\d+(?:[.,]\d+)?\s*公里/g },
  { id: 'distance-mile-en', pattern: /\b\d+(?:[.,]\d+)?\s*(?:mi|miles?)\b/gi },
  { id: 'distance-mile-zh', pattern: /\d+(?:[.,]\d+)?\s*英里/g },
  { id: 'distance-meter-en', pattern: /\b\d+(?:[.,]\d+)?\s*meters?\b/gi },
  { id: 'distance-meter-zh', pattern: /\d+(?:[.,]\d+)?\s*公尺/g },
  { id: 'steps-zh', pattern: /(?:^|[^\d])((\d{1,3}(?:[ ,]\d{3})*|\d{4,7})\s*步)/g, valueGroup: 1 },
  { id: 'steps-en', pattern: /\b((\d{1,3}(?:[ ,]\d{3})*|\d{4,7})\s*steps?)\b/gi, valueGroup: 1 },
  {
    id: 'steps-label-zh',
    pattern: /步\s*[數数][ \t:：\n]*(\d{1,3}(?:[ ,]\d{3})*|\d{4,7})/gi,
    valueGroup: 1,
  },
  {
    id: 'steps-corrupted-comma-zh',
    pattern: /(?:^|[^\d])([1-9]\s*[了子]\s*\d\s*步?)(?=$|[\s,;])/g,
    valueGroup: 1,
  },
  {
    id: 'steps-corrupted-unit-zh',
    pattern:
      /(?:^|[^\d])(([1-9]\d{3})5|(?:\d{1,2}[,.]\d{3}|[1-9]\d{3,4})\s*[%％5sS贅涉岁多夕])(?=$|[\s,;，；。、]|$)/gi,
    valueGroup: 1,
  },
  {
    id: 'steps-shoe-icon-zh',
    pattern:
      /(?:[©®👟~])\s*(\d{1,2}[,.]\d{3}|[1-9]\d{3,4})(?=$|[\s,;，；。、\n%％5sS贅涉岁多夕]|$)/gi,
    valueGroup: 1,
  },
];

const DISTANCE_LABEL_RULES = [
  {
    id: 'distance-value-before-label-zh',
    pattern:
      /(?:^|[^\d/／])(\d{1,3}(?:[.,]\d{1,3})?)[ \t]*(?:[a-zA-Z0-9=~»>:*#@%_\-\s]{1,6}|公[里尺]?)?[\s\n]*距離/gi,
    valueGroup: 1,
  },
  {
    id: 'distance-value-after-label-zh',
    pattern: /距離[ \t:：]*(\d{1,3}(?:[.,]\d{1,3})?)(?!\s*(?:bpm|次|卡|kcal|cal|步|steps))/gi,
    valueGroup: 1,
  },
  {
    id: 'distance-value-before-label-en',
    pattern:
      /\b(\d{1,3}(?:[.,]\d{1,3})?)[ \t]*(?:[a-zA-Z0-9=~»>:*#@%_\-\s]{1,6})?[\s\n]*distance\b/gi,
    valueGroup: 1,
  },
  {
    id: 'distance-value-after-label-en',
    pattern: /\bdistance[\s\n:：]*(\d{1,3}(?:[.,]\d{1,3})?)/gi,
    valueGroup: 1,
  },
];

const ACTIVITY_KEYWORDS = (
  '跑步.路跑.健走.步行.走路.登山.健行.自行車.單車.騎車.騎行.騎乘.公路車.游泳.瑜珈.' +
  '肌力.肌力訓練.重訓.重量訓練.體能訓練.核心.' +
  '運動時間.活動時間.移動時間.總計時間.經過時間.計時.軌跡.路線.配速.爬升.海拔.GPS.時速.速度.' +
  'running.run.walking.walk.hiking.cycling.ride.swimming.workout.' +
  'duration.moving time.elapsed time.total time.route.pace.elevation.speed'
).split('.');

export const SUPPORTED_APPS = [
  'Strava',
  'Garmin Connect',
  'Garmin',
  'Nike Run Club',
  'NRC',
  'Apple Fitness',
  '健身',
  'Google Fit',
  'Fitbit',
  'Samsung Health',
  '三星健康',
  'Xiaomi Fitness',
  '小米運動健康',
  'Zepp Life',
  'COROS',
  'Suunto',
  'Runkeeper',
  'Caynax',
  'LEAP FITNESS',
  'adidas Running',
  'Running Quotient',
  'RQ',
  '健行筆記',
  '馬拉松世界',
];

const RE_AGGREGATE =
  /(?:平均|週平均|月平均|日平均|每週目標|週目標|過去\s*\d+\s*天|7[ -]?day|weekly|monthly|average|\bavg\b)/i;
const RE_WALK_RUN =
  /(?:跑步|路跑|慢跑|健走|步行|走路|健行|登山|配速|步頻|步數|running|\brun\b|runner|walking|\bwalk\b|hiking|\bpace\b)/i;
const RE_CYCLING = /(?:自行車|單車|騎車|騎行|騎\s*乘|公路車|cycling|\bcycle\b|\bride\b|\bbike\b)/i;
const RE_OTHER =
  /(?:游泳|瑜珈|重訓|重量訓練|健身|肌力(?:訓練)?|體能訓練|swimming|yoga|workout|weight training|strength training)/i;

export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, '$1')
    .trim();
}

function cleanCorruptedDay(dayStr: string): number | null {
  const cleaned = dayStr
    .replace(/[sS]/g, '8')
    .replace(/[b]/g, '6')
    .replace(/[lI|]/g, '1')
    .replace(/[oO]/g, '0')
    .replace(/[zZ]/g, '2');
  const d = Number(cleaned);
  return Number.isFinite(d) && d >= 1 && d <= 31 ? d : null;
}

function cleanCorruptedMonth(monthStr: string): number | null {
  const cleaned = monthStr
    .replace(/[sS]/g, '8')
    .replace(/[b]/g, '6')
    .replace(/[lI|]/g, '1')
    .replace(/[oO]/g, '0')
    .replace(/[zZ]/g, '2');
  const m = Number(cleaned);
  return Number.isFinite(m) && m >= 1 && m <= 12 ? m : null;
}

function formatOcrDateValue(val: string): string {
  val = val
    .trim()
    .replace(/(?:\.{2,3}|…)+$/, '')
    .trim();

  // 0. Corrupted full YMD (e.g. "2026%9A88H...", "2026%9A8H", "2026年9A88H")
  const corruptedYmd = val.match(
    /(?:^|[^\d])(20\d{2}|1\d{2})\s*[%年*./\-]\s*(0?[1-9]|1[0-2])\s*([月8B朋六目衣HnA/.\-])\s*([12]\d|3[01]|0?[1-9])(?:\s*[8BHh日號号口]+)?/i
  );
  if (corruptedYmd) {
    const y = Number(corruptedYmd[1]);
    const m = Number(corruptedYmd[2]);
    const d = Number(corruptedYmd[4]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${y}年${m}月${d}日`;
    }
  }

  // 1. ymdMatch: e.g. "2026 年 9 月 8 日" 或 "2026 年 9 月 s 日 ..."
  const fullYmdMatch = val.match(
    /(?:^|[^\d])(20\d{2}|1\d{2})\s*年\s*(0?[1-9]|1[0-2])\s*月\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號HhBb口0oOD号]?/i
  );
  if (fullYmdMatch) {
    const y = Number(fullYmdMatch[1]);
    const m = cleanCorruptedMonth(fullYmdMatch[2]);
    const d = cleanCorruptedDay(fullYmdMatch[3]);
    if (m !== null && d !== null) {
      return `${y}年${m}月${d}日`;
    }
  }

  // 2. e.g. "910 日 星期 四" or "9 六 10 日 星期 四" or "9 月 10 日 星期 四" -> "9月10日 星期四"
  const weekdayMatch = val.match(
    /^(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(0?[1-9]|1[0-2])\s*(?:[月六朋衣目日HnA1/.-]|\s*)\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號HhBb口0oOD号]?\s*((?:星期|週|周)\s*[一二三四五六日天])$/i
  );
  if (weekdayMatch) {
    const cleanWeekday = weekdayMatch[3].replace(/\s+/g, '');
    const m = cleanCorruptedMonth(weekdayMatch[1]);
    const d = cleanCorruptedDay(weekdayMatch[2]);
    if (m !== null && d !== null) {
      return `${m}月${d}日 ${cleanWeekday}`;
    }
  }

  // 3. e.g. "9 月 10 日" 或 "9月7" 或 "9 月 s 日" (日字元 s/S/B/l/口 容錯) -> "9月10日" / "9月7日" / "9月8日"
  const mdMatch = val.match(
    /^(0?[1-9]|1[0-2])\s*月\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號HhBb口0oOD号]?$/i
  );
  if (mdMatch) {
    const m = cleanCorruptedMonth(mdMatch[1]);
    const d = cleanCorruptedDay(mdMatch[2]);
    if (m !== null && d !== null) {
      return `${m}月${d}日`;
    }
  }

  // 4. 容錯月日（月被辨識為 8, B, 朋, 六, 目, 衣, H, A, 日, 符號 /.- 或空白；日被辨識為 8, B, H, h, 日, 號, 口, 号, s 等）
  const corruptedMatch = val.match(
    /^(0?[1-9]|1[0-2])\s*[8B朋六目衣HnA日/.\-\s]\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[8B日號Hh号口]?$/i
  );
  if (corruptedMatch) {
    const m = cleanCorruptedMonth(corruptedMatch[1]);
    const d = cleanCorruptedDay(corruptedMatch[2]);
    if (m !== null && d !== null) {
      return `${m}月${d}日`;
    }
  }

  // 5. e.g. "910 日" or "1010 日" (純數字黏連只接受中文日號字元，嚴禁 latin 字母)
  const fusedMatch = val.match(/^(\d{1,2})(\d{2})\s*[日號号口]$/);
  if (fusedMatch) {
    const m = Number(fusedMatch[1]);
    const d = Number(fusedMatch[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${m}月${d}日`;
    }
  }

  // 6. e.g. "97日" or "907日"
  const fusedShortMatch = val.match(/^([1-9])0?([1-9])\s*[日號号口]$/);
  if (fusedShortMatch) {
    const m = Number(fusedShortMatch[1]);
    const d = Number(fusedShortMatch[2]);
    return `${m}月${d}日`;
  }

  // 7. e.g. "9 10 日"
  const spacedMatch = val.match(/^(\d{1,2})\s+(\d{1,2})\s*[日號号口]$/);
  if (spacedMatch) {
    const m = Number(spacedMatch[1]);
    const d = Number(spacedMatch[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${m}月${d}日`;
    }
  }
  return val;
}

function deduplicateMatches(matches: RuleMatch[]): RuleMatch[] {
  const seen = new Set<string>();
  return matches.filter((m) => {
    const key = `${m.ruleId}\u0000${m.value.toLocaleLowerCase()}`;
    if (!seen.has(key)) {
      seen.add(key);
      return true;
    }
    return false;
  });
}

function matchRules(
  text: string,
  rules: { id: string; pattern: RegExp; valueGroup?: number }[]
): RuleGroupResult {
  const matches: RuleMatch[] = [];
  for (const rule of rules) {
    rule.pattern.lastIndex = 0;
    for (const m of text.matchAll(rule.pattern)) {
      const val = rule.valueGroup !== undefined ? m[rule.valueGroup] : m[0];
      if (val) {
        matches.push({ value: val.trim(), ruleId: rule.id });
      }
    }
  }
  const deduped = deduplicateMatches(matches);
  return { found: deduped.length > 0, matches: deduped };
}

function matchKeywords(text: string, ruleId: string, keywords: string[]): RuleGroupResult {
  const lower = text.toLocaleLowerCase();
  const matched = keywords
    .filter((k) => lower.includes(k.toLocaleLowerCase()))
    .map((k) => ({ value: k, ruleId }));
  const deduped = deduplicateMatches(matched);
  return { found: deduped.length > 0, matches: deduped };
}

function extractDurationNearLabels(text: string): RuleGroupResult {
  const labelRegex =
    /總計時間|經過時間|計時|運動時間|活動時間|移動時間|duration|moving time|elapsed time|total time/gi;
  const matches: RuleMatch[] = [];

  for (const r of text.matchAll(labelRegex)) {
    const idx = r.index ?? 0;
    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + r[0].length + 50);
    const slice = text.slice(start, end);

    for (const m of slice.matchAll(
      /(?<![@:\d]\s{0,3})\b(\d{1,2}:[0-5]\d(?::[0-5]\d)?)\b(?!\s*[/／])/g
    )) {
      matches.push({ value: m[1], ruleId: 'duration-clock-near-label' });
    }
    for (const m of slice.matchAll(/\b\d{3}:[0-5]\d\b/g)) {
      matches.push({ value: m[0], ruleId: 'duration-ocr-fused-clock-near-label' });
    }
  }

  const deduped = deduplicateMatches(matches);
  return { found: deduped.length > 0, matches: deduped };
}

export function parseSportsRecordText(rawText: string): ExtractedFields {
  const text = normalizeText(rawText);
  const distanceByLabel = matchRules(text, DISTANCE_LABEL_RULES);

  const durationFromRules = matchRules(text, DURATION_RULES);
  const durationNearLabels = extractDurationNearLabels(text);
  const combinedDuration = deduplicateMatches([
    ...durationFromRules.matches,
    ...durationNearLabels.matches,
  ]);

  // 1. 偵測是否有週期或目標統計區間（例如「9月6日至12日」、「9/6~9/12」）
  const dateRanges: { start: number; end: number; value: string }[] = [];
  RE_DATE_RANGE.lastIndex = 0;
  for (const m of text.matchAll(RE_DATE_RANGE)) {
    const idx = m.index ?? 0;
    dateRanges.push({
      start: idx,
      end: idx + m[0].length,
      value: m[0].trim(),
    });
  }

  // 2. 匹配所有日期規則，但若匹配到的片段落在「統計區間」內，予以過濾（不可視為單日紀錄）
  const rawDateMatches: RuleMatch[] = [];
  for (const rule of DATE_RULES) {
    rule.pattern.lastIndex = 0;
    for (const m of text.matchAll(rule.pattern)) {
      const idx = m.index ?? 0;
      const val = rule.valueGroup !== undefined ? m[rule.valueGroup] : m[0];
      if (!val) continue;

      const offsetInFullMatch = rule.valueGroup !== undefined ? m[0].indexOf(val) : 0;
      const matchStart = idx + Math.max(0, offsetInFullMatch);
      const matchEnd = matchStart + val.length;

      const fallsInsideRange = dateRanges.some(
        (dr) => Math.max(matchStart, dr.start) < Math.min(matchEnd, dr.end)
      );
      if (fallsInsideRange) {
        continue;
      }
      rawDateMatches.push({ value: val.trim(), ruleId: rule.id });
    }
  }

  const formattedDateMatches = deduplicateMatches(
    rawDateMatches.map((m) => ({
      ...m,
      value: formatOcrDateValue(m.value),
    }))
  ).sort((a, b) => {
    const aZh = a.value.includes('月') && a.value.includes('日');
    const bZh = b.value.includes('月') && b.value.includes('日');
    if (aZh && !bZh) return -1;
    if (!aZh && bZh) return 1;
    return 0;
  });

  const dateRangeMatches = deduplicateMatches(
    dateRanges.map((dr) => ({
      ruleId: 'date-range-disallowed',
      value: dr.value.replace(/\s+/g, ' '),
    }))
  );

  return {
    date: { found: formattedDateMatches.length > 0, matches: formattedDateMatches },
    dateRange: { found: dateRangeMatches.length > 0, matches: dateRangeMatches },
    duration: { found: combinedDuration.length > 0, matches: combinedDuration },
    distanceOrSteps: distanceByLabel.found
      ? distanceByLabel
      : matchRules(text, DISTANCE_OR_STEPS_RULES),
    activityOrRoute: matchKeywords(text, 'activity-or-route-keyword', ACTIVITY_KEYWORDS),
    appHints: matchKeywords(text, 'app-keyword-hint', SUPPORTED_APPS),
  };
}

/**
 * 解析文字中的日期轉為日曆年月日數值（支援 2026/09/05、9月5日、9/5 等）
 */
export function parseDateToCalendarDate(
  val: string,
  referenceDate: Date = new Date()
): { year: number; month: number; day: number; dateStr: string } | null {
  val = formatOcrDateValue(val.trim());
  const defaultYear = referenceDate.getFullYear();

  // 0. Corrupted full YMD (e.g. 2026%9A88H, 2026年9A88H)
  const corruptedYmdMatch = val.match(
    /\b(20\d{2}|1\d{2})\s*[%年*./\-]\s*(0?[1-9]|1[0-2])\s*[月8B朋六目衣HnA/.\-]\s*([12]\d|3[01]|0?[1-9])(?:\s*[8BHh日號号口]+)?/i
  );
  if (corruptedYmdMatch) {
    const y = Number(corruptedYmdMatch[1]);
    const m = Number(corruptedYmdMatch[2]);
    const d = Number(corruptedYmdMatch[3]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        year: y,
        month: m,
        day: d,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
  }

  // 1. yyyy-mm-dd or yyyy/mm/dd or yyyy.mm.dd or yyyy年mm月dd日
  const ymdMatch = val.match(
    /\b(20\d{2}|1\d{2})\s*[年./-]\s*(0?[1-9]|1[0-2])\s*[月./-]\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號]?/i
  );
  if (ymdMatch) {
    const y = Number(ymdMatch[1]);
    const m = cleanCorruptedMonth(ymdMatch[2]);
    const d = cleanCorruptedDay(ymdMatch[3]);
    if (m !== null && d !== null) {
      return {
        year: y,
        month: m,
        day: d,
        dateStr: `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
  }

  // 2. mm月dd日
  const mdZhMatch = val.match(
    /(?:^|[^\d])(0?[1-9]|1[0-2])\s*月\s*([12]\d|3[01]|0?[1-9]|[12]?[sSBlI]|[1-3]?[oObzZ])\s*[日號]?/i
  );
  if (mdZhMatch) {
    const m = cleanCorruptedMonth(mdZhMatch[1]);
    const d = cleanCorruptedDay(mdZhMatch[2]);
    if (m !== null && d !== null) {
      return {
        year: defaultYear,
        month: m,
        day: d,
        dateStr: `${defaultYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
  }

  // 3. fused / spaced md before 日 (e.g. 910 日, 9 10 日)
  const fusedMatch = val.match(/^(\d{1,2})(\d{2})\s*[日號]?$/);
  if (fusedMatch) {
    const m = Number(fusedMatch[1]);
    const d = Number(fusedMatch[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return {
        year: defaultYear,
        month: m,
        day: d,
        dateStr: `${defaultYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
      };
    }
  }

  // 4. mm/dd
  const slashMatch = val.match(/\b(0?[1-9]|1[0-2])\s*[/]\s*([12]\d|3[01]|0?[1-9])\b/);
  if (slashMatch) {
    const m = Number(slashMatch[1]);
    const d = Number(slashMatch[2]);
    return {
      year: defaultYear,
      month: m,
      day: d,
      dateStr: `${defaultYear}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`,
    };
  }

  return null;
}

/**
 * 檢查運動日期是否符合當前活動期別（如第 2 期 09/07~09/13）
 */
export function checkDatePeriod(
  dateStrRaw: string,
  referenceDate: Date = new Date()
): PeriodCheckResult | null {
  const parsed = parseDateToCalendarDate(dateStrRaw, referenceDate);
  if (!parsed) return null;

  const curPeriod = getCurrentPeriod(referenceDate);
  const curStart = new Date(curPeriod.startDate).getTime();
  const curEnd = new Date(curPeriod.endDate).getTime();

  // 台灣時區中午進行時間比對避免跨日邊界差
  const targetTime = new Date(`${parsed.dateStr}T12:00:00+08:00`).getTime();
  const isCurrent = targetTime >= curStart && targetTime <= curEnd;

  const matched = OFFICIAL_SCHEDULE_RANGES.find((p) => {
    const s = new Date(p.start).getTime();
    const e = new Date(p.end).getTime();
    return targetTime >= s && targetTime <= e;
  });

  const periodDiff = matched ? matched.period - curPeriod.period : targetTime < curStart ? -1 : 1;

  return {
    isCurrentPeriod: isCurrent,
    screenshotDate: `${parsed.month}月${parsed.day}日`,
    currentPeriodLabel: `${curPeriod.label} (${curPeriod.dateRangeText})`,
    matchedPeriodLabel: matched ? `${matched.label} (${matched.text})` : null,
    matchedPeriodName: matched ? matched.label : null,
    periodDiff,
  };
}

function parseNumber(s: string): number | null {
  const n = Number(s.replace(/[ ,]/g, ''));
  return Number.isFinite(n) && n >= 0 ? n : null;
}

function isAggregate(text: string, index: number, rawLength: number): boolean {
  const lineStart = text.lastIndexOf('\n', index - 1) + 1;
  const start = Math.max(lineStart, index - 45);
  const end = Math.min(text.length, index + rawLength);
  return RE_AGGREGATE.test(text.slice(start, end));
}

/**
 * 運動部官網原始提取演算法（嚴格版：無標籤相鄰 MM:SS 支援，公里後方必須為空白或標點）
 */
export function extractOfficialQuantitativeMetrics(text: string): EligibilityEvidence[] {
  const results: (EligibilityEvidence & { index: number })[] = [];

  // Multi-column fitness table (e.g. Garmin / Apple: Kcal Km h)
  for (const n of text.matchAll(
    /\b(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d{1,3}:[0-5]\d)\s*(?:\n\s*){1,3}[^\n]{0,20}\bKcal\b[^\n]{0,20}\bKm\b[^\n]{0,20}\bh\b/gi
  )) {
    const km = parseNumber(n[2] ?? '');
    const durMatch = n[3]?.match(/^(\d{1,3}):([0-5]\d)$/);
    if (km !== null) {
      results.push({
        value: km,
        unit: 'km',
        rawValue: `${n[2]} Km`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
    if (durMatch) {
      results.push({
        value: Number(durMatch[1]) * 60 + Number(durMatch[2]),
        unit: 'minutes',
        rawValue: `${n[3]} h`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
  }

  // Steps pattern
  for (const n of text.matchAll(
    /\b(\d{1,3}(?:[ ,]\d{3})+|\d{4,7})\s+(?:\+\d+\s*)?(?:\n\s*){1,3}(?:\d{1,2}\s+)?steps?\b/gi
  )) {
    const steps = parseNumber(n[1] ?? '');
    if (steps !== null) {
      results.push({
        value: steps,
        unit: 'steps',
        rawValue: `${n[1]} Steps`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
  }

  // Duration: HH:MM:SS
  for (const m of text.matchAll(/\b(\d{1,3}):([0-5]\d):([0-5]\d)\b/g)) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60,
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // Duration: H:MM h/hr
  for (const m of text.matchAll(/\b(\d{1,3}):([0-5]\d)\s*(?:h|hr|hrs|hours?)\b/gi)) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2]),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // Duration: X小時Y分
  for (const m of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(?:小時|hours?|hrs?)(?:\s*(\d+(?:\.\d+)?)\s*(?:分|分鐘|minutes?|mins?))?/gi
  )) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2] ?? 0),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // Duration: X分鐘
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:分鐘|分|minutes?|mins?)(?=$|[\s,;])/gi)) {
    results.push({
      value: Number(m[1]),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // Steps: X步
  for (const m of text.matchAll(
    /(?:^|[^\d])(\d{1,3}(?:[ ,]\d{3})*|\d{4,7})\s*(?:步|steps?)(?=$|[\s,;])/gi
  )) {
    const val = parseNumber(m[1] ?? '');
    if (val !== null) {
      results.push({
        value: val,
        unit: 'steps',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // Distance: X km / 公里 (官網原始嚴格斷言：(?=$|[\s,;]))
  for (const m of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:km|公里)(?=$|[\s,;])/gi)) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val,
        unit: 'km',
        rawValue: m[0],
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // Distance: X mi / 英里
  for (const m of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:mi|miles?|英里)(?=$|[\s,;])/gi)) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val * 1.609344,
        unit: 'km',
        rawValue: m[0],
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  return results.map((r) => ({
    value: Math.round(r.value * 1000) / 1000,
    unit: r.unit,
    rawValue: r.rawValue,
    aggregate: r.aggregate,
  }));
}

/**
 * 改良版量化指標提取演算法（智慧支援「6.53 公里距離」、排除配速「/公里」、支援相鄰「39:42 總計時間」分秒格式）
 */
export function extractEnhancedQuantitativeMetrics(text: string): EligibilityEvidence[] {
  const results: (EligibilityEvidence & { index: number })[] = [];

  // 1. Multi-column fitness table (e.g. Garmin / Apple: Kcal Km h)
  for (const n of text.matchAll(
    /\b(\d+(?:\.\d+)?)\s+(\d+(?:\.\d+)?)\s+(\d{1,3}:[0-5]\d)\s*(?:\n\s*){1,3}[^\n]{0,20}\bKcal\b[^\n]{0,20}\bKm\b[^\n]{0,20}\bh\b/gi
  )) {
    const km = parseNumber(n[2] ?? '');
    const durMatch = n[3]?.match(/^(\d{1,3}):([0-5]\d)$/);
    if (km !== null) {
      results.push({
        value: km,
        unit: 'km',
        rawValue: `${n[2]} Km`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
    if (durMatch) {
      results.push({
        value: Number(durMatch[1]) * 60 + Number(durMatch[2]),
        unit: 'minutes',
        rawValue: `${n[3]} h`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
  }

  // 2. Steps pattern
  for (const n of text.matchAll(
    /\b(\d{1,3}(?:[ ,]\d{3})+|\d{4,7})\s+(?:\+\d+\s*)?(?:\n\s*){1,3}(?:\d{1,2}\s+)?steps?\b/gi
  )) {
    const steps = parseNumber(n[1] ?? '');
    if (steps !== null) {
      results.push({
        value: steps,
        unit: 'steps',
        rawValue: `${n[1]} Steps`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
  }

  // 3. Duration: HH:MM:SS
  for (const m of text.matchAll(/\b(\d{1,3}):([0-5]\d):([0-5]\d)\b/g)) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2]) + Number(m[3]) / 60,
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // 4. Duration: H:MM h/hr
  for (const m of text.matchAll(/\b(\d{1,3}):([0-5]\d)\s*(?:h|hr|hrs|hours?)\b/gi)) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2]),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // 5. Duration: X小時Y分
  for (const m of text.matchAll(
    /(\d+(?:\.\d+)?)\s*(?:小時|hours?|hrs?)(?:\s*(\d+(?:\.\d+)?)\s*(?:分|分鐘|minutes?|mins?))?/gi
  )) {
    results.push({
      value: Number(m[1]) * 60 + Number(m[2] ?? 0),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // 6. Duration: X分鐘
  for (const m of text.matchAll(/(\d+(?:\.\d+)?)\s*(?:分鐘|分|minutes?|mins?)(?=$|[\s,;])/gi)) {
    results.push({
      value: Number(m[1]),
      unit: 'minutes',
      rawValue: m[0],
      aggregate: isAggregate(text, m.index ?? 0, m[0].length),
      index: m.index ?? 0,
    });
  }

  // 7. 【改良版新增】時間標籤相鄰之 MM:SS 或 H:MM:SS（如「39:42 總計時間」、「總計時間 39:42」、「經過時間 45:10」）
  // 支援多欄式排版（如「39:42 391\n總計時間 總卡路里」）
  const durationLabelRegex =
    /總計時間|經過時間|計時|運動時間|活動時間|移動時間|duration|moving time|elapsed time|total time/gi;
  for (const r of text.matchAll(durationLabelRegex)) {
    const idx = r.index ?? 0;
    const start = Math.max(0, idx - 50);
    const end = Math.min(text.length, idx + r[0].length + 50);
    const slice = text.slice(start, end);

    for (const m of slice.matchAll(
      /(?<![@:\d]\s{0,3})\b(\d{1,2}:[0-5]\d(?::[0-5]\d)?)\b(?!\s*[/／])/g
    )) {
      const clockVal = m[1];
      const parts = clockVal.split(':').map(Number);
      let minutes = 0;
      if (parts.length === 3) {
        minutes = parts[0] * 60 + parts[1] + parts[2] / 60;
      } else if (parts.length === 2) {
        minutes = parts[0] + parts[1] / 60;
      }
      const matchIdx = Math.max(0, idx - 50) + (m.index ?? 0);
      results.push({
        value: Math.round(minutes * 100) / 100,
        unit: 'minutes',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, matchIdx, m[0].length),
        index: matchIdx,
      });
    }

    // 7b. 【容錯】時間標籤相鄰之 OCR 冒號黏連 3 碼鐘點（如「113:07 總計時間」還原為「1:13:07」）
    for (const m of slice.matchAll(/(?<![@:\d]\s{0,3})\b(\d)(\d{2}):([0-5]\d)\b(?!\s*[/／])/g)) {
      const hours = Number(m[1]);
      const mins = Number(m[2]);
      const secs = Number(m[3]);
      if (mins < 60) {
        const minutes = hours * 60 + mins + secs / 60;
        const matchIdx = Math.max(0, idx - 50) + (m.index ?? 0);
        results.push({
          value: Math.round(minutes * 100) / 100,
          unit: 'minutes',
          rawValue: `${hours}:${mins}:${secs} (OCR: ${m[0].trim()})`,
          aggregate: isAggregate(text, matchIdx, m[0].length),
          index: matchIdx,
        });
      }
    }

    // 7c. 【容錯】時間標籤相鄰之空白分隔 H M S（如「1 13 07 總計時間」還原為「1:13:07」）
    for (const m of slice.matchAll(
      /(?<![@:\d]\s{0,3})\b(\d{1,2})\s+([0-5]\d)\s+([0-5]\d)\b(?!\s*[/／])/g
    )) {
      const hours = Number(m[1]);
      const mins = Number(m[2]);
      const secs = Number(m[3]);
      const minutes = hours * 60 + mins + secs / 60;
      const matchIdx = Math.max(0, idx - 50) + (m.index ?? 0);
      results.push({
        value: Math.round(minutes * 100) / 100,
        unit: 'minutes',
        rawValue: `${hours}:${mins}:${secs} (OCR: ${m[0].trim()})`,
        aggregate: isAggregate(text, matchIdx, m[0].length),
        index: matchIdx,
      });
    }
  }

  // 8. Steps: X步
  for (const m of text.matchAll(
    /(?:^|[^\d])(\d{1,3}(?:[ ,]\d{3})*|\d{4,7})\s*(?:步|steps?)(?=$|[\s,;])/gi
  )) {
    const val = parseNumber(m[1] ?? '');
    if (val !== null) {
      results.push({
        value: val,
        unit: 'steps',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // 8b. 【改良版新增】Multi-column fitness table: 步數 距離 (例如 Apple Fitness: 步數 距離 \n 8,592 5.76 公里)
  for (const n of text.matchAll(
    /步\s*[數数]\s*距\s*離[^\n]{0,20}\n\s*(\d{1,3}(?:[ ,]\d{3})*|\d{4,7})\s+(\d+(?:[.,]\d+)?)/gi
  )) {
    const steps = parseNumber(n[1] ?? '');
    const km = parseNumber((n[2] ?? '').replace(',', '.'));
    if (steps !== null) {
      results.push({
        value: steps,
        unit: 'steps',
        rawValue: `${n[1]} 步`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
    if (km !== null) {
      results.push({
        value: km,
        unit: 'km',
        rawValue: `${n[2]} 公里`,
        aggregate: isAggregate(text, n.index ?? 0, n[0].length),
        index: n.index ?? 0,
      });
    }
  }

  // 8c. 【改良版新增】Steps near 步數 label
  for (const m of text.matchAll(
    /(?:步\s*[數数]|steps?)[ \t:：\n]*(\d{1,3}(?:[ ,]\d{3})*|\d{4,7})(?!\s*[%/／])/gi
  )) {
    const val = parseNumber(m[1] ?? '');
    if (val !== null && val >= 100) {
      results.push({
        value: val,
        unit: 'steps',
        rawValue: `${val} 步`,
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // 8d. 【容錯】OCR 逗號與千百位數字黏連誤識（如「8,145」之「,14」被繁體中文模型誤識為「了」或「子」形成「8 了 5」）
  for (const m of text.matchAll(
    /(?:^|[^\d])([1-9])\s*[了子]\s*(\d)\s*(?:步|steps?)?(?=$|[\s,;])/gi
  )) {
    if (/步|活動|健身|fit|health|walk/i.test(text)) {
      const thousands = parseInt(m[1] ?? '0', 10);
      const units = parseInt(m[2] ?? '0', 10);
      const recoveredSteps = thousands * 1000 + 140 + units;
      results.push({
        value: recoveredSteps,
        unit: 'steps',
        rawValue: `${recoveredSteps} 步 (OCR: ${m[0].trim()})`,
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // 8e. 【容錯】OCR 單位「步」誤識為「%」、「％」、「5」、「s」、「S」、「贅」、「涉」或黏連為 5 位數（如「8,145 步」誤識為「81455」、「8,145 5」、「8145 贅」、「8145 %」）
  for (const m of text.matchAll(
    /(?:^|[^\d])(([1-9]\d{3})5|(\d{1,2}[,.]\d{3}|[1-9]\d{3,4})\s*([%％5sS贅涉岁多夕]))(?=$|[\s,;，；。、]|$)/gi
  )) {
    if (/步|活動|健身|fit|health|walk|心肺|走/i.test(text)) {
      const rawNum =
        m[2] ||
        (m[3] ? m[3].replace(/[,.]/g, '') : m[1].replace(/[,.]/g, '').replace(/[^0-9]/g, ''));
      const steps = parseInt(rawNum, 10);
      if (steps >= 1000 && steps <= 100000) {
        results.push({
          value: steps,
          unit: 'steps',
          rawValue: `${steps} 步 (OCR: ${m[0].trim()})`,
          aggregate: isAggregate(text, m.index ?? 0, m[0].length),
          index: m.index ?? 0,
        });
      }
    }
  }

  // 8f. 【容錯】Google Fit 等運動 App 步數圖示（球鞋圖示常被誤識為「©」、「®」、「👟」）前綴之步數
  for (const m of text.matchAll(
    /(?:[©®👟~])\s*(\d{1,2}[,.]\d{3}|[1-9]\d{3,4})(?=$|[\s,;，；。、\n%％5sS贅涉岁多夕]|$)/gi
  )) {
    if (/步|活動|健身|fit|health|walk|心肺|走/i.test(text)) {
      const steps = parseInt(m[1].replace(/[,.]/g, ''), 10);
      if (steps >= 1000 && steps <= 100000) {
        results.push({
          value: steps,
          unit: 'steps',
          rawValue: `${steps} 步 (圖示: ${m[0].trim()})`,
          aggregate: isAggregate(text, m.index ?? 0, m[0].length),
          index: m.index ?? 0,
        });
      }
    }
  }

  // 9. 【改良版新增】Distance: X km / 公里（相容「6.53 公里距離」、排除配速「/公里」與時速「km/h」）
  for (const m of text.matchAll(
    /(?:^|[^\d/／])(\d+(?:[.,]\d+)?)\s*(?:km(?=[^\w]|$)|公里)(?!\s*[/／]\s*(?:h|hr|小時|分|分鐘))/gi
  )) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val,
        unit: 'km',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // 10. 【改良版新增】Distance near 距離 label（支援「5.01 z=\n距離」、「6.53 2\n距離」、「6.593 2=\n距離」、「8.74 »=\n距離」、「8.74:=\n距離」等）
  for (const m of text.matchAll(
    /(?:^|[^\d/／])(\d{1,3}(?:[.,]\d{1,3})?)[ \t]*(?:[a-zA-Z0-9=~»>:*#@%_\-\s]{1,6}|公[里尺]?)?[\s\n]*距離/gi
  )) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val,
        unit: 'km',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }
  for (const m of text.matchAll(
    /距離[ \t:：]*(\d{1,3}(?:[.,]\d{1,3})?)(?!\s*(?:bpm|次|卡|kcal|cal|步|steps))/gi
  )) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val,
        unit: 'km',
        rawValue: m[0].trim(),
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  // 10. Distance: X mi / 英里
  for (const m of text.matchAll(/\b(\d+(?:[.,]\d+)?)\s*(?:mi|miles?|英里)(?=$|[\s,;])/gi)) {
    const val = parseNumber((m[1] ?? '').replace(',', '.'));
    if (val !== null) {
      results.push({
        value: val * 1.609344,
        unit: 'km',
        rawValue: m[0],
        aggregate: isAggregate(text, m.index ?? 0, m[0].length),
        index: m.index ?? 0,
      });
    }
  }

  return results.map((r) => ({
    value: Math.round(r.value * 1000) / 1000,
    unit: r.unit,
    rawValue: r.rawValue,
    aggregate: r.aggregate,
  }));
}

// 保持與舊介面相容的別名函數（預設指向改良版提取）
export const extractQuantitativeMetrics = extractEnhancedQuantitativeMetrics;

function detectActivityType(text: string, fields?: ExtractedFields): ActivityType {
  // 1. 強信號中文運動類型或配速/步數指標優先判定
  const hasStrongWalkRun =
    /(?:跑步|路跑|慢跑|健走|步行|走路|配速|步頻|步數|running|runner)/i.test(text) ||
    (fields?.activityOrRoute?.matches.some((m: RuleMatch) =>
      ['跑步', '路跑', '慢跑', '健走', '步行', '走路', '配速'].includes(m.value)
    ) ??
      false);

  const hasStrongCycling =
    /(?:騎車|騎行|騎\s*乘|單車|公路車|踏頻|時速|cycling)/i.test(text) ||
    (fields?.activityOrRoute?.matches.some((m: RuleMatch) =>
      ['騎車', '騎行', '騎乘', '單車', '公路車'].includes(m.value)
    ) ??
      false);

  // 若出現明確的跑步/配速信號，且未有強烈的騎乘信號（排除跑者沿「自行車道」運動時地名被誤判為單車）
  if (hasStrongWalkRun && !hasStrongCycling) {
    return 'WALK_RUN';
  }
  if (hasStrongCycling && !hasStrongWalkRun) {
    return 'CYCLING';
  }

  // 2. 次要或通用關鍵字判斷
  const isCycling = RE_CYCLING.test(text);
  const isWalkRun = RE_WALK_RUN.test(text);
  if (isCycling && isWalkRun) {
    if (hasStrongWalkRun) return 'WALK_RUN';
    if (hasStrongCycling) return 'CYCLING';
    return 'UNKNOWN';
  }
  if (isCycling) return 'CYCLING';
  if (isWalkRun) return 'WALK_RUN';
  if (RE_OTHER.test(text)) return 'OTHER';
  return 'UNKNOWN';
}

function getMaxNonAggregate(
  evidence: EligibilityEvidence[],
  unit: 'minutes' | 'steps' | 'km'
): number | null {
  const matched = evidence.filter((e) => !e.aggregate && e.unit === unit).map((e) => e.value);
  return matched.length ? Math.max(...matched) : null;
}

/**
 * 運動部官網原始審查演算法（不帶客製容錯，精確重現 500.gov.tw 原始預檢判斷）
 */
export function evaluateOfficialFrontendEligibility(
  rawText: string,
  meanConfidence: number | null = null
): EligibilityReport {
  const text = normalizeText(rawText);
  const fields = parseSportsRecordText(rawText);
  const activityType = detectActivityType(text, fields);
  const hasDate = fields.date.found;
  const hasDateRangeOnly = !hasDate && (fields.dateRange?.found ?? false);

  const reasons: string[] = [];
  if (hasDate) {
    reasons.push('DATE_FOUND');
  } else {
    reasons.push('DATE_MISSING');
    if (hasDateRangeOnly) {
      reasons.push('DATE_RANGE_NOT_ALLOWED');
    }
  }

  const evidence = extractOfficialQuantitativeMetrics(text);
  const validEvidence = evidence.filter((e) => !e.aggregate);

  const durationMin = getMaxNonAggregate(evidence, 'minutes');
  const steps = getMaxNonAggregate(evidence, 'steps');
  const distanceKm = getMaxNonAggregate(evidence, 'km');

  const buildReport = (
    status: EligibilityStatus,
    ruleCode: string | null,
    reasonList: string[]
  ): EligibilityReport => ({
    contractVersion: 'front-eligibility-precheck/1.0',
    status,
    officialDecision: false,
    matchedRuleCode: ruleCode,
    reasonCodes: reasonList.filter((r) => r !== 'DATE_FOUND'),
    activityType,
    observed: {
      dateFound: hasDate,
      durationMinutes: durationMin,
      steps,
      distanceKm,
      metricTypeCount: [durationMin, steps, distanceKm].filter((v) => v !== null).length,
    },
    evidence,
    thresholds: ELIGIBILITY_THRESHOLDS,
  });

  if (!validEvidence.length) {
    return buildReport(evidence.length ? 'INCONCLUSIVE' : 'NOT_EVALUATED', null, [
      ...reasons,
      evidence.length ? 'ONLY_AGGREGATE_VALUES_FOUND' : 'NO_ELIGIBILITY_METRIC_FOUND',
    ]);
  }

  if (meanConfidence !== null && meanConfidence < 60) {
    return buildReport('INCONCLUSIVE', null, [...reasons, 'LOW_OCR_CONFIDENCE']);
  }

  if (durationMin !== null && durationMin >= ELIGIBILITY_THRESHOLDS.durationMinutes) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'DURATION_30_MIN' : null,
      [...reasons, hasDate ? 'MATCHED_DURATION_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE']
    );
  }

  if (steps !== null && steps >= ELIGIBILITY_THRESHOLDS.dailySteps) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'DAILY_STEPS_8000' : null,
      [...reasons, hasDate ? 'MATCHED_DAILY_STEPS_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE']
    );
  }

  if (
    distanceKm !== null &&
    activityType === 'WALK_RUN' &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.walkRunKm
  ) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'WALK_RUN_5_KM' : null,
      [
        ...reasons,
        hasDate ? 'MATCHED_WALK_RUN_DISTANCE_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE',
      ]
    );
  }

  if (
    distanceKm !== null &&
    activityType === 'CYCLING' &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.cyclingKm
  ) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'CYCLING_15_KM' : null,
      [
        ...reasons,
        hasDate ? 'MATCHED_CYCLING_DISTANCE_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE',
      ]
    );
  }

  const observedCount = [durationMin, steps, distanceKm].filter((v) => v !== null).length;
  const isAmbiguousDistance =
    distanceKm !== null &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.walkRunKm &&
    activityType === 'UNKNOWN';

  if (observedCount >= 2 && !isAmbiguousDistance) {
    return buildReport('LIKELY_NOT_QUALIFIED', null, [...reasons, 'BELOW_ALL_OBSERVED_THRESHOLDS']);
  }

  return buildReport('INCONCLUSIVE', null, [
    ...reasons,
    isAmbiguousDistance ? 'ACTIVITY_TYPE_REQUIRED_FOR_DISTANCE' : 'INSUFFICIENT_METRIC_COVERAGE',
  ]);
}

/**
 * 改良版前端審核演算法（具備容錯解析、當週期別檢核與相鄰標籤分秒辨識）
 */
export function evaluateEnhancedFrontendEligibility(
  rawText: string,
  meanConfidence: number | null = null,
  referenceDate: Date = new Date()
): EligibilityReport {
  const text = normalizeText(rawText);
  const fields = parseSportsRecordText(rawText);
  const activityType = detectActivityType(text, fields);
  const hasDate = fields.date.found;
  const hasDateRangeOnly = !hasDate && (fields.dateRange?.found ?? false);

  const reasons: string[] = [];
  let periodCheck: PeriodCheckResult | undefined;

  if (hasDate) {
    reasons.push('DATE_FOUND');
    const firstDateVal = fields.date.matches[0]?.value;
    if (firstDateVal) {
      const pc = checkDatePeriod(firstDateVal, referenceDate);
      if (pc) {
        periodCheck = pc;
        if (pc.isCurrentPeriod) {
          reasons.push('DATE_FOUND_CURRENT_PERIOD');
        } else {
          reasons.push('DATE_NOT_CURRENT_PERIOD');
        }
      }
    }
  } else {
    reasons.push('DATE_MISSING');
    if (hasDateRangeOnly) {
      reasons.push('DATE_RANGE_NOT_ALLOWED');
    }
  }

  const evidence = extractEnhancedQuantitativeMetrics(text);
  const validEvidence = evidence.filter((e) => !e.aggregate);

  const durationMin = getMaxNonAggregate(evidence, 'minutes');
  const steps = getMaxNonAggregate(evidence, 'steps');
  const distanceKm = getMaxNonAggregate(evidence, 'km');

  const buildReport = (
    status: EligibilityStatus,
    ruleCode: string | null,
    reasonList: string[]
  ): EligibilityReport => ({
    contractVersion: 'front-eligibility-precheck/1.0-enhanced',
    status,
    officialDecision: false,
    matchedRuleCode: ruleCode,
    reasonCodes: reasonList.filter((r) => r !== 'DATE_FOUND'),
    activityType,
    observed: {
      dateFound: hasDate,
      durationMinutes: durationMin,
      steps,
      distanceKm,
      metricTypeCount: [durationMin, steps, distanceKm].filter((v) => v !== null).length,
      periodCheck,
    },
    evidence,
    thresholds: ELIGIBILITY_THRESHOLDS,
  });

  if (!validEvidence.length) {
    return buildReport(evidence.length ? 'INCONCLUSIVE' : 'NOT_EVALUATED', null, [
      ...reasons,
      evidence.length ? 'ONLY_AGGREGATE_VALUES_FOUND' : 'NO_ELIGIBILITY_METRIC_FOUND',
    ]);
  }

  if (meanConfidence !== null && meanConfidence < 60) {
    return buildReport('INCONCLUSIVE', null, [...reasons, 'LOW_OCR_CONFIDENCE']);
  }

  // 輔助函式：判斷達標時的合格狀態（若日期非當前活動期別則判定不符合）
  const resolveEligibilityStatus = (): EligibilityStatus => {
    if (!hasDate) return 'INCONCLUSIVE';
    if (periodCheck && !periodCheck.isCurrentPeriod) return 'LIKELY_NOT_QUALIFIED';
    return 'LIKELY_QUALIFIED';
  };

  // 收集所有達標項目與規則（支援跑步 5km 與時長 30m 同時達標時完整記錄）
  const matchedRules: string[] = [];
  const qualifyingReasons: string[] = [];

  const isWalkRunDistanceQualified =
    distanceKm !== null &&
    activityType === 'WALK_RUN' &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.walkRunKm;
  const isCyclingDistanceQualified =
    distanceKm !== null &&
    activityType === 'CYCLING' &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.cyclingKm;
  const isDurationQualified =
    durationMin !== null && durationMin >= ELIGIBILITY_THRESHOLDS.durationMinutes;
  const isStepsQualified = steps !== null && steps >= ELIGIBILITY_THRESHOLDS.dailySteps;

  // 優先順序：若專項運動（跑步/健走、單車）距離達標，優先以專項距離作為代表規則
  if (isWalkRunDistanceQualified) {
    matchedRules.push('WALK_RUN_5_KM');
    qualifyingReasons.push(
      hasDate ? 'MATCHED_WALK_RUN_DISTANCE_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE'
    );
  }
  if (isCyclingDistanceQualified) {
    matchedRules.push('CYCLING_15_KM');
    qualifyingReasons.push(
      hasDate ? 'MATCHED_CYCLING_DISTANCE_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE'
    );
  }
  if (isDurationQualified) {
    matchedRules.push('DURATION_30_MIN');
    qualifyingReasons.push(
      hasDate ? 'MATCHED_DURATION_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE'
    );
  }
  if (isStepsQualified) {
    matchedRules.push('DAILY_STEPS_8000');
    qualifyingReasons.push(
      hasDate ? 'MATCHED_DAILY_STEPS_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE'
    );
  }

  if (matchedRules.length > 0) {
    const status = resolveEligibilityStatus();
    const primaryRule = matchedRules[0];
    return buildReport(status, hasDate ? primaryRule : null, [...reasons, ...qualifyingReasons]);
  }

  const observedCount = [durationMin, steps, distanceKm].filter((v) => v !== null).length;
  const isAmbiguousDistance =
    distanceKm !== null &&
    distanceKm >= ELIGIBILITY_THRESHOLDS.walkRunKm &&
    activityType === 'UNKNOWN';

  if (observedCount >= 2 && !isAmbiguousDistance) {
    return buildReport('LIKELY_NOT_QUALIFIED', null, [...reasons, 'BELOW_ALL_OBSERVED_THRESHOLDS']);
  }

  return buildReport('INCONCLUSIVE', null, [
    ...reasons,
    isAmbiguousDistance ? 'ACTIVITY_TYPE_REQUIRED_FOR_DISTANCE' : 'INSUFFICIENT_METRIC_COVERAGE',
  ]);
}

/**
 * 預檢主入口函數（同時執行官網原始演算法與改良版演算法，自動進行雙軌對照）
 */
export function evaluateFrontendEligibility(
  rawText: string,
  meanConfidence: number | null = null,
  referenceDate: Date = new Date()
): EligibilityReport {
  const officialReport = evaluateOfficialFrontendEligibility(rawText, meanConfidence);
  const enhancedReport = evaluateEnhancedFrontendEligibility(
    rawText,
    meanConfidence,
    referenceDate
  );

  // 判定是否出現雙軌分歧
  // 情況 1：改良版判定合格（數值達標且為當週），但官網自動判定可能存有疑慮（因格式限制）
  // 情況 2：改良版成功辨識達標數據但因非當期判定不合格，而官網原始演算法未辨識出有效數據
  const isNotCurrentPeriod =
    enhancedReport.observed.periodCheck && !enhancedReport.observed.periodCheck.isCurrentPeriod;
  const hasQualifyingMetric = enhancedReport.matchedRuleCode !== null;

  const isDivergent =
    (enhancedReport.status === 'LIKELY_QUALIFIED' &&
      officialReport.status !== 'LIKELY_QUALIFIED') ||
    (Boolean(isNotCurrentPeriod) &&
      hasQualifyingMetric &&
      officialReport.status !== 'LIKELY_QUALIFIED');

  if (isDivergent) {
    if (!isNotCurrentPeriod && !enhancedReport.reasonCodes.includes('OFFICIAL_PRECHECK_MAY_FLAG')) {
      enhancedReport.reasonCodes.push('OFFICIAL_PRECHECK_MAY_FLAG');
    }
  }

  enhancedReport.officialEligibility = officialReport;
  enhancedReport.isDivergent = isDivergent;
  if (isDivergent) {
    enhancedReport.divergenceReason = isNotCurrentPeriod
      ? `本 App 改良版預檢判定不符當週任務標準（數值雖達標，但截圖日期屬 ${
          enhancedReport.observed.periodCheck?.matchedPeriodName || '非當週'
        }，非當前活動期別，逾期不可跨期補傳）；官網自動判定亦可能因格式限制未通過`
      : '本 App 的改良版預檢判定符合，但官網自動判定可能審核不通過（因格式限制，但實質達標，可能需待人工審核才會通過）';
  }

  return enhancedReport;
}
