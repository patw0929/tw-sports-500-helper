import { Ionicons } from '@expo/vector-icons';
import { useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { getCurrentPeriod, PARTNER_PERKS } from '@/services/periods';
import { getProfiles, getActiveProfile, setActiveProfile } from '@/services/storage';
import { UserProfile, maskId, maskPhone } from '@/types/sports500';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();

  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  const currentPeriod = getCurrentPeriod();

  const loadData = useCallback(async () => {
    const list = await getProfiles();
    setAllProfiles(list);
    const active = await getActiveProfile();
    setActiveUser(active);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleSelectUser = async (user: UserProfile) => {
    await setActiveProfile(user.id);
    setActiveUser(user);
  };

  const handleQuickLogin = () => {
    if (!activeUser) {
      router.push('/accounts');
      return;
    }
    router.push({
      pathname: '/browser',
      params: {
        autoRelogin: 'true',
        profileId: activeUser.id,
        timestamp: Date.now().toString(),
      },
    });
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />
        }
      >
        {/* Header Branding */}
        <View style={styles.brandRow}>
          <View style={[styles.logoIconCircle, { backgroundColor: theme.primary }]}>
            <Ionicons name="flame" size={24} color="#ffffff" />
          </View>
          <View style={styles.brandTextGroup}>
            <Text style={[styles.brandSuper, { color: theme.primary }]}>運動部 115 年加碼活動</Text>
            <Text style={[styles.brandTitle, { color: theme.text }]}>揮汗有禮・加碼券小幫手</Text>
          </View>
          <TouchableOpacity
            style={[
              styles.settingsIconButton,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={() => router.push('/accounts')}
          >
            <Ionicons name="settings-outline" size={20} color={theme.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Current Period Banner */}
        <View
          style={[
            styles.periodCard,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
        >
          <View style={styles.periodCardTop}>
            <View style={[styles.periodBadge, { backgroundColor: theme.primary }]}>
              <Text style={styles.periodBadgeText}>{currentPeriod.label}</Text>
            </View>
            <View style={styles.periodCountdown}>
              <Ionicons name="time-outline" size={14} color={theme.primaryDark} />
              <Text style={[styles.periodCountdownText, { color: theme.primaryDark }]}>
                {currentPeriod.isCurrent
                  ? `剩餘 ${currentPeriod.daysLeft} 天 ${currentPeriod.hoursLeft} 小時`
                  : currentPeriod.isFuture
                    ? '即將開始'
                    : '已結束'}
              </Text>
            </View>
          </View>
          <Text style={[styles.periodDateText, { color: theme.text }]}>
            {currentPeriod.dateRangeText}
          </Text>
          <Text style={[styles.periodHintText, { color: theme.textSecondary }]}>
            每週每人限上傳一次運動截圖，審核通過即享 50 元加碼券！
          </Text>
        </View>

        {/* Active Profile Card */}
        <View
          style={[
            styles.card,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.cardHeaderRow}>
            <Text style={[styles.cardSectionTitle, { color: theme.textSecondary }]}>登入身分</Text>
            <TouchableOpacity onPress={() => router.push('/accounts')} style={styles.manageLink}>
              <Text style={[styles.manageLinkText, { color: theme.primary }]}>管理帳號</Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
          </View>

          {activeUser ? (
            <View style={styles.profileDetailsRow}>
              <View style={[styles.avatarCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="person" size={24} color={theme.primary} />
              </View>
              <View style={styles.profileTextCol}>
                <View style={styles.profileNameLine}>
                  <Text style={[styles.profileName, { color: theme.text }]}>{activeUser.name}</Text>
                  {activeUser.label && (
                    <View
                      style={[
                        styles.profileLabelPill,
                        { backgroundColor: theme.backgroundElement },
                      ]}
                    >
                      <Text style={[styles.profileLabelText, { color: theme.textSecondary }]}>
                        {activeUser.label}
                      </Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.profileSubtext, { color: theme.textSecondary }]}>
                  {maskId(activeUser.idNo)} • {maskPhone(activeUser.phone)}
                </Text>
                <Text style={[styles.profileDateSmall, { color: theme.textMuted }]}>
                  民國 {activeUser.birthYearRoc} 年 {activeUser.birthMonth} 月 {activeUser.birthDay}{' '}
                  日出生
                </Text>
              </View>
            </View>
          ) : (
            <View style={styles.noAccountBox}>
              <Ionicons name="alert-circle-outline" size={32} color={theme.primary} />
              <Text style={[styles.noAccountTitle, { color: theme.text }]}>尚未儲存登入資料</Text>
              <Text style={[styles.noAccountDesc, { color: theme.textSecondary }]}>
                儲存身分證字號與生日後，即可開啟 1 秒自動登入功能！
              </Text>
              <TouchableOpacity
                style={[styles.addAccountButton, { backgroundColor: theme.primary }]}
                onPress={() => router.push('/accounts')}
              >
                <Ionicons name="add" size={18} color="#fff" />
                <Text style={styles.addAccountButtonText}>立即新增身分證資料</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Quick Account Switch Bar (if multiple accounts) */}
          {allProfiles.length > 1 && (
            <View style={styles.switchBar}>
              <Text style={[styles.switchBarLabel, { color: theme.textMuted }]}>快速切換：</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.switchChips}
              >
                {allProfiles.map((p) => {
                  const isCurrent = p.id === activeUser?.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      style={[
                        styles.chip,
                        { borderColor: isCurrent ? theme.primary : theme.cardBorder },
                        isCurrent && { backgroundColor: theme.primaryLight },
                      ]}
                      onPress={() => handleSelectUser(p)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          { color: isCurrent ? theme.primary : theme.textSecondary },
                        ]}
                      >
                        {p.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>
          )}
        </View>

        {/* Big One-Click Auto Login Button */}
        <TouchableOpacity
          style={[styles.mainLoginButton, { backgroundColor: theme.primary }]}
          activeOpacity={0.88}
          onPress={handleQuickLogin}
        >
          <View style={styles.mainLoginIconWrap}>
            <Ionicons name="flash" size={26} color="#ffffff" />
          </View>
          <View style={styles.mainLoginTextWrap}>
            <Text style={styles.mainLoginTitle}>一鍵快速登入「我的任務」</Text>
            <Text style={styles.mainLoginSubtitle}>
              {activeUser
                ? `自動填入 ${activeUser.name} 的身分證、生日與手機`
                : '點此立即開始快速登入'}
            </Text>
          </View>
          <Ionicons name="arrow-forward" size={22} color="#ffffff" />
        </TouchableOpacity>

        {/* Quick Features Grid */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>常用功能捷徑</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={handleQuickLogin}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFF0EA' }]}>
              <Ionicons name="cloud-upload" size={24} color="#FF5E1E" />
            </View>
            <Text style={[styles.gridCardTitle, { color: theme.text }]}>上傳運動紀錄</Text>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              截圖上傳與審核進度查詢
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={handleQuickLogin}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="gift" size={24} color="#F59E0B" />
            </View>
            <Text style={[styles.gridCardTitle, { color: theme.text }]}>兌換加碼券</Text>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              超商及門市即時動態條碼
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={() => router.push('/tasks')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="checkmark-done-circle" size={24} color="#10B981" />
            </View>
            <Text style={[styles.gridCardTitle, { color: theme.text }]}>截圖合格規範</Text>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              狀態列、日期與數據規範
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={() => router.push('/tasks')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="calendar-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={[styles.gridCardTitle, { color: theme.text }]}>14 週任務時程</Text>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              查看全活動各期起迄日
            </Text>
          </TouchableOpacity>
        </View>

        {/* Merchant Merchandise Showcase */}
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionHeading, { color: theme.text, marginTop: 0 }]}>
            各商家兌換商品列表
          </Text>
          <TouchableOpacity
            style={styles.sectionMoreLink}
            onPress={() => router.push({ pathname: '/tasks', params: { tab: 'perks' } })}
          >
            <Text style={[styles.sectionMoreText, { color: theme.primary }]}>查看完整說明</Text>
            <Ionicons name="chevron-forward" size={14} color={theme.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.vendorRowList}>
          {PARTNER_PERKS.map((perk) => (
            <TouchableOpacity
              key={perk.id}
              style={[
                styles.vendorRowCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
              onPress={() =>
                router.push({ pathname: '/browser', params: { initialUrl: perk.url } })
              }
            >
              <View style={styles.vendorRowLeft}>
                <View style={[styles.vendorIconPill, { backgroundColor: theme.primaryLight }]}>
                  <Ionicons
                    name={
                      perk.id === 'vendor-1' || perk.id === 'vendor-2' || perk.id === 'vendor-3'
                        ? 'storefront-outline'
                        : perk.id === 'vendor-5'
                          ? 'cart-outline'
                          : 'barbell-outline'
                    }
                    size={16}
                    color={theme.primary}
                  />
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                  <View style={styles.vendorRowNameRow}>
                    <Text style={[styles.vendorRowName, { color: theme.text }]}>{perk.name}</Text>
                    <View style={[styles.vendorBadgeMini, { backgroundColor: theme.primaryLight }]}>
                      <Text style={[styles.vendorBadgeMiniText, { color: theme.primary }]}>
                        {perk.badge}
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.vendorRowItemCount, { color: theme.textSecondary }]}>
                    {perk.itemCountText}
                  </Text>
                </View>
              </View>

              <View style={styles.vendorRowRight}>
                <View style={[styles.vendorViewBtn, { backgroundColor: theme.backgroundElement }]}>
                  <Text style={[styles.vendorViewBtnText, { color: theme.primary }]}>看品項</Text>
                  <Ionicons name="chevron-forward" size={12} color={theme.primary} />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Security & Privacy Card */}
        <View style={[styles.securityNotice, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="shield-checkmark" size={20} color={theme.success} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.securityNoticeTitle, { color: theme.text }]}>
              本機硬體安全加密保證
            </Text>
            <Text style={[styles.securityNoticeDesc, { color: theme.textSecondary }]}>
              所有身分證與電話資訊僅保存在本機裝置安全晶片（Keychain /
              Keystore），絕不上傳任何第三方伺服器。
            </Text>
          </View>
        </View>

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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  brandTextGroup: {
    flex: 1,
  },
  brandSuper: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  brandTitle: {
    fontSize: 19,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  settingsIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: 6,
  },
  periodCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  periodBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  periodBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  periodCountdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  periodCountdownText: {
    fontSize: 13,
    fontWeight: '700',
  },
  periodDateText: {
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  periodHintText: {
    fontSize: 13,
    lineHeight: 18,
  },
  card: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  manageLinkText: {
    fontSize: 13,
    fontWeight: '700',
  },
  profileDetailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatarCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileTextCol: {
    flex: 1,
    gap: 2,
  },
  profileNameLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileName: {
    fontSize: 18,
    fontWeight: '800',
  },
  profileLabelPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  profileLabelText: {
    fontSize: 11,
    fontWeight: '600',
  },
  profileSubtext: {
    fontSize: 13,
    fontWeight: '500',
  },
  profileDateSmall: {
    fontSize: 12,
  },
  noAccountBox: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
    gap: 8,
  },
  noAccountTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  noAccountDesc: {
    fontSize: 13,
    textAlign: 'center',
  },
  addAccountButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    gap: 6,
    marginTop: 6,
  },
  addAccountButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  switchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    paddingTop: 10,
    gap: 6,
  },
  switchBarLabel: {
    fontSize: 12,
  },
  switchChips: {
    gap: 8,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '700',
  },
  mainLoginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.four,
    borderRadius: 20,
    shadowColor: '#FF5E1E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 6,
    gap: 14,
  },
  mainLoginIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainLoginTextWrap: {
    flex: 1,
  },
  mainLoginTitle: {
    color: '#ffffff',
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  mainLoginSubtitle: {
    color: 'rgba(255,255,255,0.85)',
    fontSize: 12,
    marginTop: 2,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '800',
    marginTop: Spacing.two,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  gridCard: {
    width: '48%',
    flexGrow: 1,
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
    gap: 8,
  },
  gridIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridCardTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  gridCardDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.two,
  },
  sectionMoreLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  sectionMoreText: {
    fontSize: 13,
    fontWeight: '700',
  },
  vendorRowList: {
    gap: 10,
  },
  vendorRowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 16,
    borderWidth: 1,
  },
  vendorRowLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginRight: 8,
  },
  vendorIconPill: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vendorRowNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  vendorRowName: {
    fontSize: 15,
    fontWeight: '800',
  },
  vendorBadgeMini: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vendorBadgeMiniText: {
    fontSize: 11,
    fontWeight: '800',
  },
  vendorRowItemCount: {
    fontSize: 12,
    marginTop: 1,
  },
  vendorRowRight: {
    alignItems: 'center',
  },
  vendorViewBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    gap: 2,
  },
  vendorViewBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  securityNotice: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: Spacing.three,
    borderRadius: 14,
    gap: 10,
    marginTop: Spacing.two,
  },
  securityNoticeTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  securityNoticeDesc: {
    fontSize: 11,
    lineHeight: 16,
    marginTop: 2,
  },
  disclaimerBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
    marginTop: Spacing.one,
  },
  disclaimerText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
  },
});
