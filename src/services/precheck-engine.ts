/**
 * 運動紀錄截圖前端預檢引擎
 * 基於運動部 https://500.gov.tw front-ocr-precheck/1.0 & front-eligibility-precheck/1.0 演算法
 * 再自行改良判定不準確的問題
 */

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
  };
  evidence: EligibilityEvidence[];
  thresholds: {
    durationMinutes: number;
    dailySteps: number;
    walkRunKm: number;
    cyclingKm: number;
  };
}

export interface PrecheckResult {
  contractVersion: string;
  state: PrecheckState;
  userMaySubmit: boolean;
  officialDecision: boolean;
  codes: string[];
  fields: ExtractedFields;
  eligibility: EligibilityReport;
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

  // 警示與退件風險
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
  LOW_OCR_CONFIDENCE: { label: '圖片文字辨識度偏低（低於 60%），建議更換截圖', type: 'warning' },
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
    pattern: /\b(?:20\d{2}|1\d{2})[./-](?:0?[1-9]|1[0-2])[./-](?:0?[1-9]|[12]\d|3[01])\b/g,
  },
  {
    id: 'date-ymd-zh',
    pattern:
      /\b(?:20\d{2}|1\d{2})\s*年\s*(?:0?[1-9]|1[0-2])\s*月\s*(?:0?[1-9]|[12]\d|3[01])\s*[日號]?/g,
  },
  // 優先比對更具體之「月日+星期」（例如 9月10日 星期四、910 日 星期四、9 六 10 日 星期 四 等）
  {
    id: 'date-md-weekday-zh',
    pattern:
      /(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*(?:[月六朋衣目日HnA1/.-]|\s*)\s*(?:0?[1-9]|[12]\d|3[01])\s*[日號]?\s*(?:星期|週|周)\s*[一二三四五六日天]/g,
  },
  {
    id: 'date-weekday-prefix-zh',
    pattern:
      /(?:星期|週|周)\s*[一二三四五六日天][\s,，、]+(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(?:0?[1-9]|1[0-2])\s*[月/.-]?\s*(?:0?[1-9]|[12]\d|3[01])\s*[日號]?/g,
  },
  {
    id: 'date-md',
    pattern:
      /\b(?:0?[1-9]|1[0-2])\s*[/]\s*(?:[12]\d|3[01]|0?[1-9])\b(?!\s*(?:km|公里|m|公尺|mi|英里|k?cal|卡|分|秒))/gi,
  },
  { id: 'date-md-zh', pattern: /(?:0?[1-9]|1[0-2])\s*月\s*(?:[12]\d|3[01]|0?[1-9])\s*[日號]/g },
  // 月日黏連 3~4 碼容錯（例如 910 日、1010 日）
  {
    id: 'date-fused-md-zh',
    pattern: /\b(?:(0?[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])|([1-9])([12]\d|3[01]))\s*[日號]/g,
  },
  // 空白分隔月日容錯（例如 9 10 日）
  { id: 'date-spaced-md-zh', pattern: /\b(0?[1-9]|1[0-2])\s+(0?[1-9]|[12]\d|3[01])\s*[日號]/g },
  {
    id: 'date-month-en',
    pattern:
      /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2}(?:,\s*(?:20\d{2}))?\b/gi,
  },
];

const DURATION_RULES = [
  { id: 'duration-hms', pattern: /\b\d{1,2}:[0-5]\d:[0-5]\d\b/g },
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
];

const DISTANCE_LABEL_RULES = [
  {
    id: 'distance-value-before-label-zh',
    pattern: /\b(\d{1,3}(?:[.,]\d{1,2})?)\.?\s*距離/g,
    valueGroup: 1,
  },
  {
    id: 'distance-value-after-label-zh',
    pattern: /距離[ \t:：]*(\d{1,3}(?:[.,]\d{1,2})?)/g,
    valueGroup: 1,
  },
  {
    id: 'distance-value-before-label-en',
    pattern: /\b(\d{1,3}(?:[.,]\d{1,2})?)\s*distance\b/gi,
    valueGroup: 1,
  },
  {
    id: 'distance-value-after-label-en',
    pattern: /\bdistance[ \t:]*(\d{1,3}(?:[.,]\d{1,2})?)/gi,
    valueGroup: 1,
  },
];

const ACTIVITY_KEYWORDS = (
  '跑步.路跑.健走.步行.走路.登山.健行.自行車.單車.騎車.騎行.游泳.瑜珈.' +
  '運動時間.活動時間.移動時間.軌跡.路線.配速.爬升.海拔.GPS.' +
  'running.run.walking.walk.hiking.cycling.ride.swimming.workout.' +
  'duration.moving time.elapsed time.route.pace.elevation'
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
  /(?:跑步|路跑|健走|步行|走路|健行|登山|running|\brun\b|walking|\bwalk\b|hiking)/i;
const RE_CYCLING = /(?:自行車|單車|騎車|騎行|cycling|\bcycle\b|\bride\b|\bbike\b)/i;
const RE_OTHER = /(?:游泳|瑜珈|重訓|健身|swimming|yoga|workout|weight training)/i;

export function normalizeText(text: string): string {
  return text
    .normalize('NFKC')
    .replace(/\r\n?/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .replace(/([\p{Script=Han}])\s+(?=[\p{Script=Han}])/gu, '$1')
    .trim();
}

function formatOcrDateValue(val: string): string {
  // e.g. "910 日 星期 四" or "9 六 10 日 星期 四" or "9 月 10 日 星期 四" -> "9月10日 星期四"
  const weekdayMatch = val.match(
    /^(?:(?:20\d{2}|1\d{2})\s*[年./-]\s*)?(0?[1-9]|1[0-2])\s*(?:[月六朋衣目日HnA1/.-]|\s*)\s*(0?[1-9]|[12]\d|3[01])\s*[日號]?\s*((?:星期|週|周)\s*[一二三四五六日天])$/
  );
  if (weekdayMatch) {
    const cleanWeekday = weekdayMatch[3].replace(/\s+/g, '');
    return `${Number(weekdayMatch[1])}月${Number(weekdayMatch[2])}日 ${cleanWeekday}`;
  }
  // e.g. "9 月 10 日" -> "9月10日"
  const mdMatch = val.match(/^(0?[1-9]|1[0-2])\s*月\s*(0?[1-9]|[12]\d|3[01])\s*[日號]$/);
  if (mdMatch) {
    return `${Number(mdMatch[1])}月${Number(mdMatch[2])}日`;
  }
  // e.g. "910 日" or "1010 日" -> "9月10日"
  const fusedMatch = val.match(/^(\d{1,2})(\d{2})\s*[日號]$/);
  if (fusedMatch) {
    const m = Number(fusedMatch[1]);
    const d = Number(fusedMatch[2]);
    if (m >= 1 && m <= 12 && d >= 1 && d <= 31) {
      return `${m}月${d}日`;
    }
  }
  // e.g. "9 10 日" -> "9月10日"
  const spacedMatch = val.match(/^(\d{1,2})\s+(\d{1,2})\s*[日號]$/);
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
  const labelRegex = /運動時間|活動時間|移動時間|duration|moving time|elapsed time/gi;
  const matches: RuleMatch[] = [];

  for (const r of text.matchAll(labelRegex)) {
    const idx = r.index ?? 0;
    const start = Math.max(0, idx - 80);
    const end = Math.min(text.length, idx + r[0].length + 40);
    const slice = text.slice(start, end);

    for (const m of slice.matchAll(/\b\d{1,2}:[0-5]\d(?::[0-5]\d)?\b/g)) {
      matches.push({ value: m[0], ruleId: 'duration-clock-near-label' });
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
      const rawLen = m[0].length;
      const fallsInsideRange = dateRanges.some((dr) => idx >= dr.start && idx + rawLen <= dr.end);
      if (fallsInsideRange) {
        continue;
      }
      const val = rule.valueGroup !== undefined ? m[rule.valueGroup] : m[0];
      if (val) {
        rawDateMatches.push({ value: val.trim(), ruleId: rule.id });
      }
    }
  }

  const formattedDateMatches = deduplicateMatches(
    rawDateMatches.map((m) => ({
      ...m,
      value: formatOcrDateValue(m.value),
    }))
  );

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

function extractQuantitativeMetrics(text: string): EligibilityEvidence[] {
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

  // Distance: X km / 公里
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

function detectActivityType(text: string): ActivityType {
  const isCycling = RE_CYCLING.test(text);
  const isWalkRun = RE_WALK_RUN.test(text);
  if (isCycling && isWalkRun) return 'UNKNOWN';
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

export function evaluateFrontendEligibility(
  rawText: string,
  meanConfidence: number | null = null
): EligibilityReport {
  const text = normalizeText(rawText);
  const fields = parseSportsRecordText(rawText);
  const activityType = detectActivityType(text);
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

  const evidence = extractQuantitativeMetrics(text);
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

  // 1. 時長達標
  if (durationMin !== null && durationMin >= ELIGIBILITY_THRESHOLDS.durationMinutes) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'DURATION_30_MIN' : null,
      [...reasons, hasDate ? 'MATCHED_DURATION_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE']
    );
  }

  // 2. 步數達標
  if (steps !== null && steps >= ELIGIBILITY_THRESHOLDS.dailySteps) {
    return buildReport(
      hasDate ? 'LIKELY_QUALIFIED' : 'INCONCLUSIVE',
      hasDate ? 'DAILY_STEPS_8000' : null,
      [...reasons, hasDate ? 'MATCHED_DAILY_STEPS_THRESHOLD' : 'QUALIFYING_METRIC_WITHOUT_DATE']
    );
  }

  // 3. 跑步/健走距離達標
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

  // 4. 自行車距離達標
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
