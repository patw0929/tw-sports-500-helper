/**
 * Data structures and helper functions for 500.gov.tw Sports Coin Helper
 */

export interface UserProfile {
  id: string;
  name: string;
  idNo: string;
  birthYearRoc: number; // 民國年，例如 85
  birthMonth: number; // 1-12
  birthDay: number; // 1-31
  phone: string; // 09xxxxxxxx
  /** @deprecated 官方登記流程不需 Email，已自表單中移除，此欄位保留供舊資料相容 */
  email?: string;
  label?: string; // 常用標籤，例如 "本人"、"配偶"、"長輩"、"子女"
  isDefault: boolean;
  createdAt: number;
}

export interface TaskPeriod {
  period: number; // 1 ~ 14
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  label: string; // "第 1 期"
  dateRangeText: string; // "2026/09/01 (二) ~ 2026/09/06 (日)"
  isCurrent: boolean;
  isPast: boolean;
  isFuture: boolean;
  daysLeft: number;
  hoursLeft: number;
}

export type TaskType = 'time' | 'steps' | 'distance';

export interface TaskCriteria {
  type: TaskType;
  title: string;
  subtitle: string;
  target: string;
  description: string;
  iconName: string;
  recommendedApps: string[];
}

export interface PartnerPerk {
  id: string;
  name: string;
  tag: string;
  badge: string;
  description: string;
  url: string;
  itemCountText: string;
  highlights: string[];
}

// Validation helpers
export function isValidTaiwanId(id: string): boolean {
  if (!id) return false;
  const regex = /^[A-Z][12]\d{8}$/;
  if (!regex.test(id.toUpperCase())) return false;

  const letterMap: Record<string, number> = {
    A: 10,
    B: 11,
    C: 12,
    D: 13,
    E: 14,
    F: 15,
    G: 16,
    H: 17,
    I: 34,
    J: 18,
    K: 19,
    L: 20,
    M: 21,
    N: 22,
    O: 35,
    P: 23,
    Q: 24,
    R: 25,
    S: 26,
    T: 27,
    U: 28,
    V: 29,
    W: 32,
    X: 30,
    Y: 31,
    Z: 33,
  };

  const code = letterMap[id.charAt(0).toUpperCase()];
  if (!code) return false;

  const n1 = Math.floor(code / 10);
  const n2 = code % 10;
  let sum = n1 + n2 * 9;

  for (let i = 1; i < 9; i++) {
    sum += parseInt(id.charAt(i), 10) * (9 - i);
  }
  sum += parseInt(id.charAt(9), 10);

  return sum % 10 === 0;
}

export function isValidTaiwanPhone(phone: string): boolean {
  return /^09\d{8}$/.test(phone.replace(/\s+/g, ''));
}

export function maskId(idNo: string): string {
  if (!idNo || idNo.length < 5) return idNo;
  return `${idNo.slice(0, 3)}****${idNo.slice(-3)}`;
}

export function maskPhone(phone: string): string {
  if (!phone || phone.length < 7) return phone;
  return `${phone.slice(0, 4)}***${phone.slice(-3)}`;
}

export function rocToWesternYear(rocYear: number): number {
  return rocYear + 1911;
}

export function westernToRocYear(westernYear: number): number {
  return westernYear - 1911;
}

export function formatRocDate(rocYear: number, month: number, day: number): string {
  return `民國 ${rocYear} 年 ${month} 月 ${day} 日 (西元 ${rocYear + 1911}/${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')})`;
}

export function formatIsoDate(rocYear: number, month: number, day: number): string {
  const yyyy = rocYear + 1911;
  const mm = String(month).padStart(2, '0');
  const dd = String(day).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
