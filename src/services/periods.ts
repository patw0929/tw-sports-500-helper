import { TaskPeriod, TaskCriteria, PartnerPerk } from '@/types/sports500';

export const OFFICIAL_SCHEDULE_RANGES = [
  {
    period: 1,
    start: '2026-09-01T10:00:00+08:00',
    end: '2026-09-06T23:59:59+08:00',
    label: '第 1 期',
    text: '09/01 (二) ~ 09/06 (日)',
  },
  {
    period: 2,
    start: '2026-09-07T00:00:00+08:00',
    end: '2026-09-13T23:59:59+08:00',
    label: '第 2 期',
    text: '09/07 (一) ~ 09/13 (日)',
  },
  {
    period: 3,
    start: '2026-09-14T00:00:00+08:00',
    end: '2026-09-20T23:59:59+08:00',
    label: '第 3 期',
    text: '09/14 (一) ~ 09/20 (日)',
  },
  {
    period: 4,
    start: '2026-09-21T00:00:00+08:00',
    end: '2026-09-27T23:59:59+08:00',
    label: '第 4 期',
    text: '09/21 (一) ~ 09/27 (日)',
  },
  {
    period: 5,
    start: '2026-09-28T00:00:00+08:00',
    end: '2026-10-04T23:59:59+08:00',
    label: '第 5 期',
    text: '09/28 (一) ~ 10/04 (日)',
  },
  {
    period: 6,
    start: '2026-10-05T00:00:00+08:00',
    end: '2026-10-11T23:59:59+08:00',
    label: '第 6 期',
    text: '10/05 (一) ~ 10/11 (日)',
  },
  {
    period: 7,
    start: '2026-10-12T00:00:00+08:00',
    end: '2026-10-18T23:59:59+08:00',
    label: '第 7 期',
    text: '10/12 (一) ~ 10/18 (日)',
  },
  {
    period: 8,
    start: '2026-10-19T00:00:00+08:00',
    end: '2026-10-25T23:59:59+08:00',
    label: '第 8 期',
    text: '10/19 (一) ~ 10/25 (日)',
  },
  {
    period: 9,
    start: '2026-10-26T00:00:00+08:00',
    end: '2026-11-01T23:59:59+08:00',
    label: '第 9 期',
    text: '10/26 (一) ~ 11/01 (日)',
  },
  {
    period: 10,
    start: '2026-11-02T00:00:00+08:00',
    end: '2026-11-08T23:59:59+08:00',
    label: '第 10 期',
    text: '11/02 (一) ~ 11/08 (日)',
  },
  {
    period: 11,
    start: '2026-11-09T00:00:00+08:00',
    end: '2026-11-15T23:59:59+08:00',
    label: '第 11 期',
    text: '11/09 (一) ~ 11/15 (日)',
  },
  {
    period: 12,
    start: '2026-11-16T00:00:00+08:00',
    end: '2026-11-22T23:59:59+08:00',
    label: '第 12 期',
    text: '11/16 (一) ~ 11/22 (日)',
  },
  {
    period: 13,
    start: '2026-11-23T00:00:00+08:00',
    end: '2026-11-29T23:59:59+08:00',
    label: '第 13 期',
    text: '11/23 (一) ~ 11/29 (日)',
  },
  {
    period: 14,
    start: '2026-11-30T00:00:00+08:00',
    end: '2026-11-30T23:59:59+08:00',
    label: '第 14 期',
    text: '11/30 (一) 最終日',
  },
];

export function getCalculatedPeriods(nowDate = new Date()): TaskPeriod[] {
  const nowTime = nowDate.getTime();

  return OFFICIAL_SCHEDULE_RANGES.map((item) => {
    const startTime = new Date(item.start).getTime();
    const endTime = new Date(item.end).getTime();

    const isCurrent = nowTime >= startTime && nowTime <= endTime;
    const isPast = nowTime > endTime;
    const isFuture = nowTime < startTime;

    let daysLeft = 0;
    let hoursLeft = 0;

    if (isCurrent) {
      const diffMs = endTime - nowTime;
      daysLeft = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      hoursLeft = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    }

    return {
      period: item.period,
      startDate: item.start,
      endDate: item.end,
      label: item.label,
      dateRangeText: item.text,
      isCurrent,
      isPast,
      isFuture,
      daysLeft,
      hoursLeft,
    };
  });
}

export function getCurrentPeriod(nowDate = new Date()): TaskPeriod {
  const periods = getCalculatedPeriods(nowDate);
  const current = periods.find((p) => p.isCurrent);
  if (current) return current;

  // If before first period
  const nowTime = nowDate.getTime();
  const firstStart = new Date(OFFICIAL_SCHEDULE_RANGES[0].start).getTime();
  if (nowTime < firstStart) {
    return periods[0];
  }
  // Otherwise default to last
  return periods[periods.length - 1];
}

export const TASK_CRITERIA_LIST: TaskCriteria[] = [
  {
    type: 'time',
    title: '時間型任務',
    subtitle: '單次運動達 30 分鐘以上',
    target: '30 分鐘',
    description: '跑步、健身、游泳、瑜珈、球類等任意運動，單次時長需清楚顯示 30 分鐘以上。',
    iconName: 'timer-outline',
    recommendedApps: ['Apple 健身', 'Google Fit', 'Nike Run Club', 'Strava', 'Garmin Connect'],
  },
  {
    type: 'steps',
    title: '步數型任務',
    subtitle: '單日累積達 8,000 步以上',
    target: '8,000 步',
    description: '當日行走或健走步數累積達標，截圖需清楚顯示當日日期與累積步數。',
    iconName: 'footsteps-outline',
    recommendedApps: ['Apple 健康', 'Google Fit', 'Pikmin Bloom', '小米運動健康', 'Garmin Connect'],
  },
  {
    type: 'distance',
    title: '距離型任務',
    subtitle: '健走/跑步 5km 或 自行車 15km',
    target: '5km / 15km',
    description: '戶外健走/跑步單次達 5 公里，或戶外/室內自行車騎乘單次達 15 公里以上。',
    iconName: 'bicycle-outline',
    recommendedApps: ['Strava', 'Nike Run Club', 'Garmin Connect', 'MapMyRun', '路跑完賽證明'],
  },
];

export const PARTNER_PERKS: PartnerPerk[] = [
  {
    id: 'vendor-1',
    name: '全家便利商店',
    tag: '活力折抵加碼 50 + 3 元',
    badge: '50 + 3 元',
    description: '兌換指定健康鮮食、FMC 系列茶飲、大冰經典/特濃美式拿鐵、果乾堅果等。',
    url: 'https://500.gov.tw/registrant/intro/vendor-1.html',
    itemCountText: '308 項可兌換商品',
    highlights: ['FMC 天然水/不知春茶', '大冰美式/拿鐵', '夏威夷果/纖果乾', '全品項折抵'],
  },
  {
    id: 'vendor-2',
    name: '7-ELEVEn',
    tag: '加碼 10% 購物金（50 + 5 元）',
    badge: '50 + 5 元',
    description: '持 50 元券購買指定鮮切水果杯、溫泉蛋、雞胸肉等，享加碼 10% 購物金。',
    url: 'https://500.gov.tw/registrant/intro/vendor-2.html',
    itemCountText: '473 項可兌換商品',
    highlights: ['鮮切蘋果/奇異果杯', '石安牧場溫泉蛋', '大成舒迷雞胸肉', '能量補給飲'],
  },
  {
    id: 'vendor-3',
    name: '萊爾富',
    tag: '超值商品券加碼（果昔/雞胸肉）',
    badge: '50 元券',
    description: '50 元加碼券全額折抵，另有專屬商品券超值加碼品項（果昔、卜蜂雞胸肉等）。',
    url: 'https://500.gov.tw/registrant/intro/vendor-3.html',
    itemCountText: '168 項可兌換商品 + 加碼',
    highlights: ['卜蜂椒麻雞胸肉', '莓完莓了果昔', '統一陽光高纖豆漿', '桂格燕麥飲'],
  },
  {
    id: 'vendor-5',
    name: '全聯福利中心',
    tag: '生鮮健康補給全額折抵',
    badge: '50 元券',
    description: '持加碼券全額折抵冷藏鮮乳、生鮮無調味麵、機能蛋、運動飲料與冷凍蔬菜。',
    url: 'https://500.gov.tw/registrant/intro/vendor-5.html',
    itemCountText: '9 大類健康生鮮品項',
    highlights: ['光泉/統一高纖豆漿', '大武山機能蛋', '綠巨人青花椰菜粒', '蛋白機能凍'],
  },
  {
    id: 'vendor-7',
    name: '萬家福 / 樂家康',
    tag: '運動保健與健身器材折抵',
    badge: '加碼券',
    description: '折抵無糖黑咖啡、運動電解質水、高蛋白能量果凍、毛豆與桌球/健身器材。',
    url: 'https://500.gov.tw/registrant/intro/vendor-7.html',
    itemCountText: '18 大類運動保健商品',
    highlights: ['舒跑/寶礦力水得', 'in 能量蛋白機能凍', '葡萄糖胺/乳清蛋白', '網球/桌球健身器材'],
  },
];
