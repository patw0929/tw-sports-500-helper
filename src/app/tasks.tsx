import { Ionicons } from '@expo/vector-icons';
import { useRouter, useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCalculatedPeriods, TASK_CRITERIA_LIST, PARTNER_PERKS } from '@/services/periods';

export default function TasksScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ tab?: string }>();
  const theme = useTheme();
  const periods = getCalculatedPeriods();

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
          <Text style={[styles.mainTitle, { color: theme.text }]}>任務辦法與 14 週時程</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            每週完成任一項指定任務並上傳截圖，審核通過即可領取加碼好禮！
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
              14 週時程表
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

        {/* Tab 1: 14 Weeks Schedule */}
        {activeTab === 'schedule' && (
          <View style={styles.sectionWrapper}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              全活動 14 週時程（9/1 ~ 11/30）
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.textSecondary }]}>
              每週一 00:00 起至週日 24:00 止為計算週期；審核時間約 5 個工作日。
            </Text>

            <View style={styles.periodList}>
              {periods.map((item) => (
                <View
                  key={item.period}
                  style={[
                    styles.periodItem,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    item.isCurrent && {
                      borderColor: theme.primary,
                      borderWidth: 2,
                      backgroundColor: theme.primaryLight,
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
                              ? theme.primary
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

                    {item.isCurrent && (
                      <View style={[styles.currentStatusBadge, { backgroundColor: theme.primary }]}>
                        <Ionicons name="flame" size={12} color="#ffffff" />
                        <Text style={styles.currentStatusText}>本週進行中</Text>
                      </View>
                    )}
                    {item.isPast && (
                      <View
                        style={[styles.statusBadge, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.statusText, { color: theme.textMuted }]}>已截止</Text>
                      </View>
                    )}
                    {item.isFuture && (
                      <View
                        style={[styles.statusBadge, { backgroundColor: theme.backgroundElement }]}
                      >
                        <Text style={[styles.statusText, { color: theme.textSecondary }]}>
                          尚未開放
                        </Text>
                      </View>
                    )}
                  </View>

                  {item.isCurrent && (
                    <View
                      style={[styles.activeWeekNotice, { backgroundColor: theme.cardBackground }]}
                    >
                      <Ionicons name="time" size={16} color={theme.primary} />
                      <Text style={[styles.activeWeekNoticeText, { color: theme.primaryDark }]}>
                        距離上傳截止剩餘：{item.daysLeft} 天 {item.hoursLeft} 小時，請把握時間！
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
                審核通過後可獲得加碼券（總計 200 萬份）。點選下方商家可直接在 App
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
    alignItems: 'center',
    padding: 8,
    borderRadius: 10,
    gap: 6,
  },
  activeWeekNoticeText: {
    fontSize: 12,
    fontWeight: '700',
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
});
