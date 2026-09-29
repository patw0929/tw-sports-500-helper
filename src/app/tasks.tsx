import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import React, { useState, useCallback, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getCalculatedFirstWavePeriods,
  TASK_CRITERIA_LIST,
  PARTNER_PERKS,
  UPCOMING_CAMPAIGN,
  UPCOMING_SCHEDULE_RANGES,
} from '@/services/periods';

export default function TasksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const theme = useTheme();

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [showUpcomingWeeks, setShowUpcomingWeeks] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setCurrentDate(new Date());
      const interval = setInterval(() => {
        setCurrentDate(new Date());
      }, 60000);
      return () => clearInterval(interval);
    }, [])
  );

  const firstWavePeriods = useMemo(() => getCalculatedFirstWavePeriods(currentDate), [currentDate]);

  React.useEffect(() => {
    if (params.tab === 'precheck') {
      router.replace('/precheck');
    }
  }, [params.tab, router]);

  const [selectedTab, setSelectedTab] = useState<'schedule' | 'criteria' | 'perks' | null>(null);
  const activeTab: 'schedule' | 'criteria' | 'perks' =
    selectedTab ??
    (params.tab === 'perks' || params.tab === 'criteria' || params.tab === 'schedule'
      ? params.tab
      : 'schedule');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={[styles.superTitle, { color: theme.primary }]}>運動部 115 年揮汗有禮</Text>
          <Text style={[styles.mainTitle, { color: theme.text }]}>任務辦法與時程總覽</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            延續活動 9/29 (二) 10:00 已正式登場！採 10 週累積制「揮汗任務卡」，首波加碼券可兌換至
            12/31。
          </Text>
        </View>

        {/* Tab Switcher */}
        <View style={[styles.segmentContainer, { backgroundColor: theme.backgroundElement }]}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'schedule' && { backgroundColor: theme.cardBackground },
            ]}
            onPress={() => setSelectedTab('schedule')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'schedule' ? theme.primary : theme.textSecondary },
                activeTab === 'schedule' && styles.segmentTextActive,
              ]}
            >
              10 週延續時程
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'criteria' && { backgroundColor: theme.cardBackground },
            ]}
            onPress={() => setSelectedTab('criteria')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'criteria' ? theme.primary : theme.textSecondary },
                activeTab === 'criteria' && styles.segmentTextActive,
              ]}
            >
              三大任務標準
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.segmentButton,
              activeTab === 'perks' && { backgroundColor: theme.cardBackground },
            ]}
            onPress={() => setSelectedTab('perks')}
          >
            <Text
              style={[
                styles.segmentText,
                { color: activeTab === 'perks' ? theme.primary : theme.textSecondary },
                activeTab === 'perks' && styles.segmentTextActive,
              ]}
            >
              好禮兌換通路
            </Text>
          </TouchableOpacity>
        </View>

        {/* Tab 1: Schedule & Continuation Preview */}
        {activeTab === 'schedule' && (
          <View style={styles.sectionWrapper}>
            {/* Upcoming Continuation Campaign Highlight Card */}
            <View
              style={[
                styles.upcomingCampaignCard,
                { backgroundColor: theme.cardBackground, borderColor: '#10B981' },
              ]}
            >
              <View style={styles.upcomingHeaderRow}>
                <View style={[styles.upcomingBadge, { backgroundColor: '#10B981' }]}>
                  <Ionicons name="sparkles" size={13} color="#ffffff" />
                  <Text style={styles.upcomingBadgeText}>9/29 延續活動重磅回歸</Text>
                </View>
                <View style={[styles.upcomingPill, { backgroundColor: theme.primaryLight }]}>
                  <Text style={[styles.upcomingPillText, { color: theme.primary }]}>
                    共 10 週・累積制
                  </Text>
                </View>
              </View>

              <Text style={[styles.upcomingTitle, { color: theme.text }]}>
                {UPCOMING_CAMPAIGN.name}（9/29 ~ 12/06）
              </Text>

              <Text style={[styles.upcomingDesc, { color: theme.textSecondary }]}>
                {UPCOMING_CAMPAIGN.rulesSummary}
                三大指定運動任務標準維持相同，審查時間改為約 7 個工作日完成。
              </Text>

              {/* 官方「揮汗任務卡」集點機制說明 */}
              <View
                style={[
                  styles.stampCardContainer,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.stampCardHead}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <Ionicons name="card-outline" size={16} color={theme.primary} />
                    <Text style={[styles.stampCardTitle, { color: theme.text }]}>
                      官方「揮汗任務卡」機制
                    </Text>
                  </View>
                  <View style={[styles.stampGoalPill, { backgroundColor: '#FEF3C7' }]}>
                    <Text style={[styles.stampGoalPillText, { color: '#B45309' }]}>
                      集滿 9 點達標
                    </Text>
                  </View>
                </View>
                <Text style={[styles.stampCardSub, { color: theme.textSecondary }]}>
                  共 10 週參加機會；每週審核通過官網系統集 1
                  點（不需連續）。點數進度與審查結果請至官網「我的任務」查看。
                </Text>

                <View style={styles.stampMechanismList}>
                  <View style={styles.stampMechanismRow}>
                    <View style={[styles.stampDotIconCircle, { backgroundColor: '#CD7F32' }]}>
                      <Text style={styles.stampDotIconText}>5</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stampMechanismTitle, { color: theme.text }]}>
                        集滿 5 點：獲銅色數位完成證書
                      </Text>
                      <Text style={[styles.stampMechanismDesc, { color: theme.textSecondary }]}>
                        於 10 週內累計 5 週審核通過即可取得。
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stampMechanismRow}>
                    <View style={[styles.stampDotIconCircle, { backgroundColor: '#94A3B8' }]}>
                      <Text style={styles.stampDotIconText}>7</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stampMechanismTitle, { color: theme.text }]}>
                        集滿 7 點：獲銀色數位完成證書
                      </Text>
                      <Text style={[styles.stampMechanismDesc, { color: theme.textSecondary }]}>
                        於 10 週內累計 7 週審核通過即可取得。
                      </Text>
                    </View>
                  </View>

                  <View style={styles.stampMechanismRow}>
                    <View style={[styles.stampDotIconCircle, { backgroundColor: '#F59E0B' }]}>
                      <Text style={styles.stampDotIconText}>9</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.stampMechanismTitle, { color: theme.text }]}>
                        集滿 9 點（達標）：金色數位證書 ＋ 抽 116 年 500 元運動幣
                      </Text>
                      <Text style={[styles.stampMechanismDesc, { color: theme.textSecondary }]}>
                        限量 5 萬份（超過電腦抽籤），抽籤結果 115/12/31 前公布。
                      </Text>
                    </View>
                  </View>
                </View>
              </View>

              {/* Reward Milestones Grid */}
              <View style={styles.upcomingRewardsGrid}>
                {UPCOMING_CAMPAIGN.rewards.map((r) => (
                  <View
                    key={r.weeks}
                    style={[
                      styles.upcomingRewardItem,
                      { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
                    ]}
                  >
                    <View style={[styles.rewardWeeksPill, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.rewardWeeksPillText, { color: theme.primary }]}>
                        {r.title}
                      </Text>
                    </View>
                    <Text style={[styles.rewardDescText, { color: theme.text }]}>{r.desc}</Text>
                  </View>
                ))}
              </View>

              {/* Official Upload Rules Box */}
              <View
                style={[
                  styles.officialRulesBox,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
                ]}
              >
                <View style={styles.officialRulesHead}>
                  <Ionicons name="shield-checkmark-outline" size={16} color={theme.primary} />
                  <Text style={[styles.officialRulesTitle, { color: theme.text }]}>
                    官方最新上傳提醒
                  </Text>
                </View>
                {UPCOMING_CAMPAIGN.officialUploadRules.map((rule, idx) => (
                  <View key={idx} style={styles.officialRuleRow}>
                    <Text style={[styles.officialRuleNum, { color: theme.primary }]}>
                      {idx + 1}.
                    </Text>
                    <Text style={[styles.officialRuleText, { color: theme.textSecondary }]}>
                      {rule}
                    </Text>
                  </View>
                ))}
              </View>

              {/* Notice key points */}
              <View style={[styles.upcomingNotesBox, { backgroundColor: theme.backgroundElement }]}>
                <View style={styles.upcomingNoteRow}>
                  <Ionicons name="person-circle" size={15} color="#0284C7" />
                  <Text style={[styles.upcomingNoteText, { color: theme.text }]}>
                    <Text style={{ fontWeight: '800' }}>舊帳號免重註冊：</Text>
                    9/29 開放後直接一鍵快登；新參加者將重啟註冊。
                  </Text>
                </View>
                <View style={styles.upcomingNoteRow}>
                  <Ionicons name="alert-circle" size={15} color="#EA580C" />
                  <Text style={[styles.upcomingNoteText, { color: theme.text }]}>
                    <Text style={{ fontWeight: '800' }}>舊紀錄不列入累積：</Text>
                    首波第 1、2 週紀錄不列入延續活動，均自 9/29 重新起算。
                  </Text>
                </View>
                <View style={styles.upcomingNoteRow}>
                  <Ionicons name="gift" size={15} color="#10B981" />
                  <Text style={[styles.upcomingNoteText, { color: theme.text }]}>
                    <Text style={{ fontWeight: '800' }}>首波加碼券正常兌換：</Text>
                    原審核通過領取之 50 元加碼券，12 月 31 日前皆可折抵兌換。
                  </Text>
                </View>
              </View>

              {/* 10 Weeks Schedule Toggle */}
              <TouchableOpacity
                style={[
                  styles.toggleWeeksBtn,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
                ]}
                onPress={() => setShowUpcomingWeeks((prev) => !prev)}
              >
                <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                <Text style={[styles.toggleWeeksBtnText, { color: theme.primary }]}>
                  {showUpcomingWeeks ? '收合 10 週延續時程預告' : '展開 10 週延續時程預告'}
                </Text>
                <Ionicons
                  name={showUpcomingWeeks ? 'chevron-up' : 'chevron-down'}
                  size={15}
                  color={theme.primary}
                />
              </TouchableOpacity>

              {showUpcomingWeeks && (
                <View style={styles.upcomingWeeksList}>
                  {UPCOMING_SCHEDULE_RANGES.map((uw) => (
                    <View
                      key={uw.week}
                      style={[
                        styles.upcomingWeekRow,
                        {
                          backgroundColor: uw.milestone
                            ? theme.primaryLight
                            : theme.backgroundElement,
                          borderColor: uw.milestone ? theme.primary : theme.cardBorder,
                        },
                      ]}
                    >
                      <View style={styles.upcomingWeekLeft}>
                        <View
                          style={[
                            styles.upcomingWeekPill,
                            { backgroundColor: uw.milestone ? theme.primary : theme.cardBorder },
                          ]}
                        >
                          <Text
                            style={[
                              styles.upcomingWeekPillText,
                              { color: uw.milestone ? '#ffffff' : theme.textSecondary },
                            ]}
                          >
                            W{uw.week}
                          </Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[styles.upcomingWeekTitle, { color: theme.text }]}>
                            {uw.label}
                          </Text>
                          <Text style={[styles.upcomingWeekDates, { color: theme.textSecondary }]}>
                            {uw.text}
                          </Text>
                          {uw.milestone && (
                            <View style={styles.upcomingMilestoneWrap}>
                              <Ionicons name="trophy" size={13} color="#D97706" />
                              <Text
                                style={[styles.upcomingMilestoneText, { color: theme.primaryDark }]}
                              >
                                {uw.milestone}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>
                    </View>
                  ))}
                  <Text style={[styles.upcomingScheduleTip, { color: theme.textMuted }]}>
                    * 9/29 (二) 10:00 官方正式上線後，小幫手將自動切換為最新 10 週即時時程表。
                  </Text>
                </View>
              )}
            </View>

            {/* First Wave Historical Schedule Header */}
            <View style={styles.historyHeaderRow}>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                首波 14 週歷史時程（9/1 ~ 11/30）
              </Text>
              <View style={[styles.historyBadge, { backgroundColor: '#FEE2E2' }]}>
                <Text style={[styles.historyBadgeText, { color: '#DC2626' }]}>300 萬筆已額滿</Text>
              </View>
            </View>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              第 1、2 週審核通過之 50 元加碼券可持續折抵兌換至 12/31；第 3 期起已停止受理新上傳。
            </Text>

            <View style={styles.periodList}>
              {firstWavePeriods.map((item) => (
                <View
                  key={item.period}
                  style={[
                    styles.periodItem,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    item.isCurrent && {
                      borderColor: item.isUploadClosed ? theme.cardBorder : theme.primary,
                      borderWidth: 1.5,
                      backgroundColor: item.isUploadClosed
                        ? theme.cardBackground
                        : theme.primaryLight,
                    },
                  ]}
                >
                  <View style={styles.periodItemHeader}>
                    <View style={styles.periodItemTitleGroup}>
                      <View
                        style={[
                          styles.periodNumberPill,
                          {
                            backgroundColor: item.isCurrent
                              ? item.isUploadClosed
                                ? '#64748B'
                                : theme.primary
                              : theme.backgroundElement,
                          },
                        ]}
                      >
                        <Text
                          style={[
                            styles.periodNumberText,
                            { color: item.isCurrent ? '#ffffff' : theme.textSecondary },
                          ]}
                        >
                          {item.label}
                        </Text>
                      </View>
                      <Text style={[styles.periodDate, { color: theme.text }]}>
                        {item.dateRangeText}
                      </Text>
                    </View>

                    {item.isUploadClosed && (
                      <View style={[styles.statusBadge, { backgroundColor: '#FEE2E2' }]}>
                        <Text style={[styles.statusText, { color: '#DC2626', fontWeight: '700' }]}>
                          上傳已截止
                        </Text>
                      </View>
                    )}
                    {!item.isUploadClosed && item.isCurrent && (
                      <View style={[styles.currentStatusBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="flame" size={12} color="#ffffff" />
                        <Text style={styles.currentStatusText}>本週進行中</Text>
                      </View>
                    )}
                    {!item.isUploadClosed && item.isPast && (
                      <View
                        style={[styles.statusBadge, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>已截止</Text>
                      </View>
                    )}
                    {!item.isUploadClosed && item.isFuture && (
                      <View
                        style={[styles.statusBadge, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>
                          即將開始
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.isCurrent && (
                    <View
                      style={[
                        styles.activeWeekNotice,
                        {
                          backgroundColor: item.isUploadClosed
                            ? theme.backgroundElement
                            : theme.cardBackground,
                        },
                      ]}
                    >
                      <Ionicons
                        name={item.isUploadClosed ? 'information-circle' : 'time'}
                        size={16}
                        color={item.isUploadClosed ? '#64748B' : theme.primary}
                      />
                      <Text
                        style={[
                          styles.activeWeekNoticeText,
                          { color: item.isUploadClosed ? theme.textSecondary : theme.primaryDark },
                        ]}
                      >
                        {item.isUploadClosed
                          ? '因全活動達 300 萬筆上限，本週起已停止受理上傳；加碼券仍可持續兌換至 12/31。'
                          : `距離上傳截止剩餘：${item.daysLeft} 天 ${item.hoursLeft} 小時，請把握時間！`}
                      </Text>
                    </View>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Tab 2: Three Tasks Criteria */}
        {activeTab === 'criteria' && (
          <View style={styles.sectionWrapper}>
            {/* Continuation Compatibility Card */}
            <View
              style={[
                styles.criteriaNoticeCard,
                { backgroundColor: theme.primaryLight, borderColor: theme.primary },
              ]}
            >
              <Ionicons name="sparkles" size={18} color={theme.primary} />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.criteriaNoticeTitle, { color: theme.primaryDark }]}>
                  延續活動三大任務標準維持完全相同！
                </Text>
                <Text style={[styles.criteriaNoticeDesc, { color: theme.textSecondary }]}>
                  9/29 延續活動開跑後，依然擇一完成「時間 30 分鐘」、「步數 8,000
                  步」或「距離健走跑步 5km / 自行車 15km」即可。小幫手的「截圖預檢」演算法完全通用！
                </Text>
              </View>
            </View>

            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              三大指定運動任務（擇一達標即可）
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              不限地點時間，完成任一種即可於當週登入上傳 APP 截圖或完賽證明。
            </Text>

            <View style={styles.criteriaGrid}>
              {TASK_CRITERIA_LIST.map((task) => (
                <View
                  key={task.type}
                  style={[
                    styles.taskCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                  ]}
                >
                  <View style={styles.taskCardHeader}>
                    <View style={[styles.taskIconCircle, { backgroundColor: theme.primaryLight }]}>
                      <Ionicons name={task.iconName as any} size={24} color={theme.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.taskCardTitle, { color: theme.text }]}>
                        {task.title}
                      </Text>
                      <Text style={[styles.taskCardTarget, { color: theme.primary }]}>
                        {task.target}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.taskCardDesc, { color: theme.textSecondary }]}>
                    {task.description}
                  </Text>

                  <View style={[styles.appsRow, { backgroundColor: theme.backgroundElement }]}>
                    <Text style={[styles.appsTitle, { color: theme.textSecondary }]}>
                      常見適用 APP：
                    </Text>
                    <Text style={[styles.appsList, { color: theme.text }]}>
                      {task.recommendedApps.join('、')}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            {/* Checklist Guide */}
            <View
              style={[
                styles.checklistCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.checklistTitle, { color: theme.text }]}>
                📸 截圖佐證合格檢核清單（避免被退件）
              </Text>

              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.checkText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '800' }}>必須包含完整手機狀態列</Text>
                  ：需清楚顯示手機頂部時間、電量及連線圖示，不可裁切。
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.checkText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '800' }}>必須顯示當週運動日期</Text>
                  ：日期需介於當週週一至週日區間，逾期不得補件。
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Ionicons name="checkmark-circle" size={20} color={theme.success} />
                <Text style={[styles.checkText, { color: theme.text }]}>
                  <Text style={{ fontWeight: '800' }}>必須清楚顯示運動數據</Text>：時間需滿 30
                  分鐘、步數滿 8,000 步或距離滿 5km。
                </Text>
              </View>

              <View style={styles.checkItem}>
                <Ionicons name="close-circle" size={20} color={theme.danger} />
                <Text style={[styles.checkText, { color: theme.textSecondary }]}>
                  <Text style={{ fontWeight: '800' }}>嚴禁翻拍與修圖</Text>
                  ：不可翻拍運動手錶、不可翻拍電腦螢幕、嚴禁 AI 生成或修圖，違者將取消後續資格。
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Tab 3: Perks and Partners */}
        {activeTab === 'perks' && (
          <View style={styles.sectionWrapper}>
            {/* Voucher applicability clarification banner */}
            <View
              style={[
                styles.perksNoticeCard,
                { backgroundColor: theme.cardBackground, borderColor: '#EA580C' },
              ]}
            >
              <Ionicons name="information-circle" size={20} color="#EA580C" />
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.perksNoticeTitle, { color: theme.text }]}>
                  加碼券折抵說明（首波加碼券適用至 12/31）
                </Text>
                <Text style={[styles.perksNoticeDesc, { color: theme.textSecondary }]}>
                  以下 5 大通路優惠適用於首波活動已核發之 50 元加碼券（兌換期限至 115 年 12 月 31
                  日止）。9/29 開跑之延續活動獎勵改為累積制「數位完成證書」與「116 年 500
                  元運動幣抽籤（限量 5 萬份）」，非每週直接發放超商加碼券。
                </Text>
              </View>
            </View>

            <View style={styles.perksHeaderBanner}>
              <View style={[styles.perksBadgePill, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="storefront" size={13} color={theme.primary} />
                <Text style={[styles.perksBadgePillText, { color: theme.primary }]}>
                  官方 5 大合作通路兌換品項
                </Text>
              </View>
              <Text style={[styles.sectionTitle, { color: theme.text }]}>
                各商家加碼優惠與兌換商品清單
              </Text>
              <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
                首波審核通過後獲得之 50 元加碼券（可折抵至 12/31）。點選下方商家可直接在 App
                內瀏覽或以外部瀏覽器開啟官方商品明細。
              </Text>
            </View>

            <View style={styles.perksGrid}>
              {PARTNER_PERKS.map((perk) => (
                <View
                  key={perk.name}
                  style={[
                    styles.perkCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                  ]}
                >
                  {/* Top Row: Name & Badge */}
                  <View style={styles.perkTopRow}>
                    <View style={styles.perkTitleGroup}>
                      <View
                        style={[
                          styles.perkVendorIconCircle,
                          { backgroundColor: theme.backgroundElement },
                        ]}
                      >
                        <Ionicons
                          name={
                            perk.id === 'vendor-1' ||
                            perk.id === 'vendor-2' ||
                            perk.id === 'vendor-3'
                              ? 'storefront-outline'
                              : perk.id === 'vendor-5'
                                ? 'cart-outline'
                                : 'barbell-outline'
                          }
                          size={18}
                          color={theme.primary}
                        />
                      </View>
                      <View>
                        <Text style={[styles.perkName, { color: theme.text }]}>{perk.name}</Text>
                        <Text style={[styles.perkItemCount, { color: theme.primary }]}>
                          {perk.itemCountText}
                        </Text>
                      </View>
                    </View>
                    <View style={[styles.perkBadge, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.perkBadgeText, { color: theme.primary }]}>
                        {perk.badge}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.perkTag, { color: theme.primaryDark }]}>{perk.tag}</Text>
                  <Text style={[styles.perkDesc, { color: theme.textSecondary }]}>
                    {perk.description}
                  </Text>

                  {/* Highlights */}
                  {perk.highlights && perk.highlights.length > 0 && (
                    <View
                      style={[
                        styles.highlightsContainer,
                        { backgroundColor: theme.backgroundElement },
                      ]}
                    >
                      <Text style={[styles.highlightsTitle, { color: theme.textSecondary }]}>
                        熱門推薦兌換品項：
                      </Text>
                      <View style={styles.highlightsWrap}>
                        {perk.highlights.map((h, i) => (
                          <View
                            key={i}
                            style={[
                              styles.highlightChip,
                              {
                                backgroundColor: theme.cardBackground,
                                borderColor: theme.cardBorder,
                              },
                            ]}
                          >
                            <Text style={[styles.highlightChipText, { color: theme.text }]}>
                              {h}
                            </Text>
                          </View>
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Official URL display */}
                  <View style={[styles.urlBox, { backgroundColor: theme.backgroundElement }]}>
                    <Ionicons name="link-outline" size={13} color={theme.textMuted} />
                    <Text
                      style={[styles.urlText, { color: theme.textMuted }]}
                      numberOfLines={1}
                      ellipsizeMode="middle"
                    >
                      {perk.url}
                    </Text>
                  </View>

                  {/* Action Buttons */}
                  <View style={styles.actionButtonsRow}>
                    <TouchableOpacity
                      style={[styles.primaryActionBtn, { backgroundColor: theme.primary }]}
                      onPress={() =>
                        router.push({ pathname: '/browser', params: { initialUrl: perk.url } })
                      }
                    >
                      <Ionicons name="browsers-outline" size={15} color="#ffffff" />
                      <Text style={styles.primaryActionBtnText}>App 內瀏覽商品清單</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.secondaryActionBtn,
                        { borderColor: theme.cardBorder, backgroundColor: theme.cardBackground },
                      ]}
                      onPress={() => Linking.openURL(perk.url)}
                    >
                      <Ionicons name="open-outline" size={15} color={theme.text} />
                      <Text style={[styles.secondaryActionBtnText, { color: theme.text }]}>
                        外部開啟
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </View>

            {/* Offline usage warning */}
            <View
              style={[
                styles.ruleNotice,
                { backgroundColor: theme.warningLight, borderColor: theme.warning },
              ]}
            >
              <Ionicons name="alert-circle" size={20} color={theme.warning} />
              <View style={{ flex: 1, gap: 4 }}>
                <Text style={[styles.ruleNoticeTitle, { color: theme.text }]}>
                  門市抵用重要規定
                </Text>
                <Text style={[styles.ruleNoticeText, { color: theme.textSecondary }]}>
                  加碼券抵用時，
                  <Text style={{ fontWeight: '800', color: theme.text }}>
                    必須於合作店家櫃檯出示活動網站即時動態條碼畫面
                  </Text>
                  ，現場不得以紙本列印、手機截圖或翻拍畫面抵用。加碼券使用期限至 115 年 12 月 31
                  日止。
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Disclaimer / 非官方免責聲明 */}
        <View style={[styles.disclaimerBox, { borderColor: theme.cardBorder }]}>
          <Ionicons name="information-circle-outline" size={16} color={theme.textMuted} />
          <Text style={[styles.disclaimerText, { color: theme.textMuted }]}>
            免責聲明：本 App 非官方所有，僅為開發者個人方便使用開發，請以官方規則為主。
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.six,
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
    width: '100%',
    gap: Spacing.four,
  },
  header: {
    gap: 4,
  },
  superTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  mainTitle: {
    fontSize: 22,
    fontWeight: '900',
  },
  subtitle: {
    fontSize: 13,
    lineHeight: 18,
  },
  segmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    padding: 4,
    gap: 4,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentText: {
    fontSize: 13,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '800',
  },
  sectionWrapper: {
    gap: Spacing.three,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  sectionSubtitle: {
    fontSize: 12,
    lineHeight: 16,
    marginTop: -4,
  },
  scheduleNoticeCard: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 6,
  },
  scheduleNoticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  scheduleNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  scheduleNoticeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  periodList: {
    gap: 10,
  },
  periodItem: {
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  periodItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodItemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  periodNumberPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  periodNumberText: {
    fontSize: 12,
    fontWeight: '800',
  },
  periodDate: {
    fontSize: 14,
    fontWeight: '700',
  },
  currentStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 4,
  },
  currentStatusText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '600',
  },
  activeWeekNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 10,
    borderRadius: 10,
    gap: 8,
  },
  activeWeekNoticeText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
  },
  criteriaGrid: {
    gap: 12,
  },
  taskCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
  },
  taskCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  taskCardTarget: {
    fontSize: 13,
    fontWeight: '700',
  },
  taskCardDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  appsRow: {
    padding: 8,
    borderRadius: 10,
    gap: 2,
  },
  appsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  appsList: {
    fontSize: 12,
  },
  checklistCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
    marginTop: Spacing.two,
  },
  checklistTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  perksHeaderBanner: {
    gap: 4,
    marginBottom: 4,
  },
  perksBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
    marginBottom: 4,
  },
  perksBadgePillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  perksGrid: {
    gap: 14,
  },
  perkCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: 8,
  },
  perkTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  perkTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  perkVendorIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  perkName: {
    fontSize: 16,
    fontWeight: '800',
  },
  perkItemCount: {
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  perkBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  perkBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  perkTag: {
    fontSize: 13,
    fontWeight: '700',
  },
  perkDesc: {
    fontSize: 12,
    lineHeight: 18,
  },
  highlightsContainer: {
    padding: 10,
    borderRadius: 12,
    gap: 6,
    marginTop: 2,
  },
  highlightsTitle: {
    fontSize: 11,
    fontWeight: '700',
  },
  highlightsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  highlightChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  highlightChipText: {
    fontSize: 11,
    fontWeight: '600',
  },
  urlBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 6,
    marginTop: 2,
  },
  urlText: {
    fontSize: 11,
    flex: 1,
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  primaryActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    gap: 6,
  },
  primaryActionBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '800',
  },
  secondaryActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 5,
  },
  secondaryActionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  ruleNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 10,
    marginTop: Spacing.two,
  },
  ruleNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  ruleNoticeText: {
    fontSize: 12,
    lineHeight: 18,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: Spacing.two,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
  upcomingCampaignCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: Spacing.two,
  },
  upcomingHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  upcomingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  upcomingBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  upcomingPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  upcomingPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  upcomingTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  upcomingDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  upcomingRewardsGrid: {
    gap: 6,
  },
  upcomingRewardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 10,
  },
  rewardWeeksPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  rewardWeeksPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  rewardDescText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '700',
  },
  upcomingNotesBox: {
    padding: 12,
    borderRadius: 12,
    gap: 8,
  },
  upcomingNoteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  upcomingNoteText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  toggleWeeksBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
    marginTop: 2,
  },
  toggleWeeksBtnText: {
    fontSize: 13,
    fontWeight: '800',
  },
  upcomingWeeksList: {
    gap: 6,
    marginTop: 4,
  },
  upcomingWeekRow: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  upcomingWeekLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  upcomingWeekPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  upcomingWeekPillText: {
    fontSize: 12,
    fontWeight: '800',
  },
  upcomingWeekTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  upcomingWeekDates: {
    fontSize: 11,
  },
  upcomingMilestoneWrap: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  upcomingMilestoneText: {
    flex: 1,
    flexShrink: 1,
    fontSize: 11,
    fontWeight: '800',
    lineHeight: 16,
  },
  upcomingScheduleTip: {
    fontSize: 11,
    textAlign: 'center',
    marginTop: 4,
  },
  historyHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing.three,
  },
  historyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  historyBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  criteriaNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: Spacing.two,
  },
  criteriaNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  criteriaNoticeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  perksNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1.5,
    gap: 10,
    marginBottom: Spacing.two,
  },
  perksNoticeTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  perksNoticeDesc: {
    fontSize: 12,
    lineHeight: 17,
  },
  stampCardContainer: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  stampCardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  stampCardTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  stampGoalPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  stampGoalPillText: {
    fontSize: 11,
    fontWeight: '800',
  },
  stampCardSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  stampMechanismList: {
    gap: 8,
    marginTop: 4,
  },
  stampMechanismRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  stampDotIconCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stampDotIconText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
  stampMechanismTitle: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 16,
  },
  stampMechanismDesc: {
    fontSize: 11,
    lineHeight: 15,
    marginTop: 1,
  },
  officialRulesBox: {
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
  },
  officialRulesHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  officialRulesTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  officialRuleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 6,
  },
  officialRuleNum: {
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 17,
  },
  officialRuleText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
