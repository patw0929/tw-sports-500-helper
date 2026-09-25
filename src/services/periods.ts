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

export const CAMPAIGN_UPLOAD_CLOSED_FROM_PERIOD = 3;
export const IS_CAMPAIGN_UPLOAD_CLOSED = true;

export interface UpcomingCampaignInfo {
  name: string;
  startDate: string;
  endDate: string;
  startDateText: string;
  endDateText: string;
  totalWeeks: number;
  openTimeText: string;
  rulesSummary: string;
  stampGoalText: string;
  drawDateAnnouncement: string;
  reviewWorkDays: number;
  rewards: { weeks: number; title: string; desc: string; badge: string }[];
  officialUploadRules: string[];
  keyHighlights: { icon: string; title: string; text: string }[];
}

export const UPCOMING_CAMPAIGN: UpcomingCampaignInfo = {
  name: '揮汗有禮・延續活動',
  startDate: '2026-09-29T10:00:00+08:00',
  endDate: '2026-12-06T23:59:59+08:00',
  startDateText: '115/09/29 (二) 10:00',
  endDateText: '115/12/06 (日) 23:59',
  totalWeeks: 10,
  openTimeText: '9 月 29 日（二）上午 10:00 起跑',
  rulesSummary:
    '全新「揮汗任務卡」共 10 週機會，每週審核通過集 1 點，集滿 9 點達標！首波前 2 週不計入，自 9/29 重新起算。',
  stampGoalText: '揮汗任務卡・集滿 9 點達標',
  drawDateAnnouncement: '115 年 12 月 31 日前官網公告抽籤結果',
  reviewWorkDays: 7,
  rewards: [
    { weeks: 5, title: '集滿 5 點', desc: '銅色數位完成證書', badge: '銅證' },
    { weeks: 7, title: '集滿 7 點', desc: '銀色數位完成證書', badge: '銀證' },
    {
      weeks: 9,
      title: '集滿 9 點達標',
      desc: '金色數位完成證書 ＋ 抽限量 5 萬份「116 年 500 元運動幣」',
      badge: '金證＋抽500',
    },
  ],
  officialUploadRules: [
    '所上傳之截圖須為運動 APP 原始截圖（不得為 AI 生成、重製、翻拍螢幕或相機拍攝）或路跑賽完賽證明。',
    '截圖須保留完整畫面，嚴禁裁切狀態列、日期或運動數據。',
    '截圖一經送出不得要求修改、更換或補件；缺漏或不清致無法判定將不予通過。',
    '上傳資料須屬實且為本人實際運動，冒用造假將取消後續活動及明年運動幣資格。',
    '審查時間約 7 個工作日，請耐心等候。',
  ],
  keyHighlights: [
    {
      icon: 'sparkles',
      title: '延續活動「揮汗任務卡」9/29 開跑',
      text: '因首波反應熱烈，運動部推出 10 週「揮汗任務卡」，每週審查通過可集 1 點，集滿 9 點達標！',
    },
    {
      icon: 'person-circle-outline',
      title: '舊帳號直接登入・新用戶重啟註冊',
      text: '先前已註冊過的使用者無需重新申請，屆時直接使用小幫手「一鍵快登」；新參加者可於 9/29 開放後註冊。',
    },
    {
      icon: 'trophy-outline',
      title: '集點制累積獎勵（免連續）',
      text: '不需連續完成。集滿 5 點獲銅證、7 點獲銀證、9 點以上達標獲金證並取得抽「116 年 500 元運動幣」（限量 5 萬份）資格。',
    },
    {
      icon: 'refresh-outline',
      title: '舊紀錄不計入・重新起算',
      text: '首波（第 1、2 週）已上傳之運動紀錄不列入延續活動累計，所有參加者均自 9/29 重新起算週數。',
    },
    {
      icon: 'checkmark-circle-outline',
      title: '首波加碼券兌換效力不變',
      text: '首波已審查通過領取之 50 元加碼券，115 年 12 月 31 日前皆可至四大超商與全聯正常折抵兌換。',
    },
    {
      icon: 'time-outline',
      title: '審查時間約 7 個工作日',
      text: '延續活動上傳運動截圖後，官方預計於 7 個工作日內完成審查。',
    },
  ],
};

export const UPCOMING_SCHEDULE_RANGES = [
  { week: 1, text: '09/29 (二) 10:00 ~ 10/04 (日)', label: '延續第 1 週', milestone: null },
  { week: 2, text: '10/05 (一) ~ 10/11 (日)', label: '延續第 2 週', milestone: null },
  { week: 3, text: '10/12 (一) ~ 10/18 (日)', label: '延續第 3 週', milestone: null },
  { week: 4, text: '10/19 (一) ~ 10/25 (日)', label: '延續第 4 週', milestone: null },
  {
    week: 5,
    text: '10/26 (一) ~ 11/01 (日)',
    label: '延續第 5 週',
    milestone: '累積滿 5 週：可獲銅色數位完成證書',
  },
  { week: 6, text: '11/02 (一) ~ 11/08 (日)', label: '延續第 6 週', milestone: null },
  {
    week: 7,
    text: '11/09 (一) ~ 11/15 (日)',
    label: '延續第 7 週',
    milestone: '累積滿 7 週：可獲銀色數位完成證書',
  },
  { week: 8, text: '11/16 (一) ~ 11/22 (日)', label: '延續第 8 週', milestone: null },
  {
    week: 9,
    text: '11/23 (一) ~ 11/29 (日)',
    label: '延續第 9 週',
    milestone: '累積滿 9 週：可獲金色數位證書 ＋ 抽 116 年 500 元運動幣',
  },
  {
    week: 10,
    text: '11/30 (一) ~ 12/06 (日)',
    label: '延續第 10 週',
    milestone: '活動最終週（抽籤結果 12/31 前公布）',
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
      isUploadClosed: item.period >= CAMPAIGN_UPLOAD_CLOSED_FROM_PERIOD,
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
