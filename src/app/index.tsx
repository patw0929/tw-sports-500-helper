import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ThemePickerModal } from '@/components/theme-picker-modal';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme, useThemeContext } from '@/hooks/use-theme';
import { getCurrentPeriod, PARTNER_PERKS } from '@/services/periods';
import { getActiveProfile, getProfiles, setActiveProfile } from '@/services/storage';
import { maskId, maskPhone, UserProfile } from '@/types/sports500';

export default function HomeScreen() {
  const router = useRouter();
  const theme = useTheme();
  const { preference } = useThemeContext();

  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const themeIcon: keyof typeof Ionicons.glyphMap =
    preference === 'system'
      ? 'contrast-outline'
      : preference === 'dark'
        ? 'moon-outline'
        : 'sunny-outline';

  const [currentDate, setCurrentDate] = useState(() => new Date());
  const currentPeriod = useMemo(() => getCurrentPeriod(currentDate), [currentDate]);

  const loadData = useCallback(async () => {
    setCurrentDate(new Date());
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
            <View style={styles.brandTitleRow}>
              <Text style={[styles.brandTitle, { color: theme.text }]}>揮汗有禮加碼券小幫手</Text>
              <View
                style={[
                  styles.unofficialBadge,
                  { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
                ]}
              >
                <Text style={[styles.unofficialBadgeText, { color: theme.textSecondary }]}>
                  非官方輔助工具
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={[
                styles.headerIconButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
              accessibilityLabel="切換外觀主題"
              onPress={() => setIsThemeModalOpen(true)}
            >
              <Ionicons name={themeIcon} size={19} color={theme.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerIconButton,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
              accessibilityLabel="前往帳號管理與設定"
              onPress={() => router.push('/accounts')}
            >
              <Ionicons name="settings-outline" size={19} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>
        </View>

        {/* Official Campaign Announcement Notice (300萬筆額滿 / 停止上傳公告) */}
        <View
          style={[
            styles.noticeCard,
            { backgroundColor: theme.cardBackground, borderColor: '#EA580C' },
          ]}
        >
          <View style={styles.noticeHeaderRow}>
            <View style={styles.noticeBadge}>
              <Ionicons name="megaphone" size={14} color="#ffffff" />
              <Text style={styles.noticeBadgeText}>活動重要公告</Text>
            </View>
            <View style={[styles.noticeStatusPill, { backgroundColor: '#FEE2E2' }]}>
              <Text style={styles.noticeStatusText}>300 萬筆額滿截止</Text>
            </View>
          </View>

          <Text style={[styles.noticeTitle, { color: theme.text }]}>
            運動紀錄上傳已截止・加碼券持續兌換
          </Text>

          <Text style={[styles.noticeDesc, { color: theme.textSecondary }]}>
            運動部官方公告：運動紀錄筆數已達 300
            萬筆上限，目前已關閉「註冊帳號」及「上傳運動紀錄」功能，第 3 期（含）起不再受理新上傳。
          </Text>

          <View style={[styles.noticeRightsBox, { backgroundColor: theme.backgroundElement }]}>
            <Text style={[styles.noticeRightsTitle, { color: theme.primary }]}>
              【重要提醒與權益說明】
            </Text>
            <View style={styles.noticeBulletRow}>
              <Ionicons
                name="checkmark-circle"
                size={15}
                color="#10B981"
                style={styles.noticeBulletIcon}
              />
              <Text style={[styles.noticeBulletText, { color: theme.text }]}>
                <Text style={{ fontWeight: '800' }}>加碼券兌換不受影響：</Text>
                凡成功上傳且經審查通過者即可獲得加碼券，
                <Text style={{ fontWeight: '800', color: '#EA580C' }}>12 月 31 日前皆可兌換</Text>。
              </Text>
            </View>
            <View style={styles.noticeBulletRow}>
              <Ionicons name="time" size={15} color="#F59E0B" style={styles.noticeBulletIcon} />
              <Text style={[styles.noticeBulletText, { color: theme.text }]}>
                <Text style={{ fontWeight: '800' }}>審查中進度：</Text>
                目前狀態若為「審查中」，工作人員將於上傳日起{' '}
                <Text style={{ fontWeight: '800' }}>5 個工作天內</Text>完成審核。
              </Text>
            </View>
            <View style={styles.noticeBulletRow}>
              <Ionicons
                name="flash"
                size={15}
                color={theme.primary}
                style={styles.noticeBulletIcon}
              />
              <Text style={[styles.noticeBulletText, { color: theme.text }]}>
                <Text style={{ fontWeight: '800' }}>小幫手持續服務：</Text>
                仍可使用下方「一鍵快登」查詢審核狀態，並出示各大超商與量販店兌換條碼！
              </Text>
            </View>
          </View>
        </View>

        {/* Current Period Banner */}
        <View
          style={[
            styles.periodCard,
            {
              backgroundColor: currentPeriod.isUploadClosed
                ? theme.cardBackground
                : theme.primaryLight,
              borderColor: currentPeriod.isUploadClosed ? theme.cardBorder : theme.primary,
            },
          ]}
        >
          <View style={styles.periodCardTop}>
            <View
              style={[
                styles.periodBadge,
                { backgroundColor: currentPeriod.isUploadClosed ? '#64748B' : theme.primary },
              ]}
            >
              <Text style={styles.periodBadgeText}>{currentPeriod.label}</Text>
            </View>
            <View style={styles.periodCountdown}>
              <Ionicons
                name={currentPeriod.isUploadClosed ? 'close-circle' : 'time-outline'}
                size={14}
                color={currentPeriod.isUploadClosed ? '#DC2626' : theme.primaryDark}
              />
              <Text
                style={[
                  styles.periodCountdownText,
                  { color: currentPeriod.isUploadClosed ? '#DC2626' : theme.primaryDark },
                ]}
              >
                {currentPeriod.isUploadClosed
                  ? '已停止受理上傳'
                  : currentPeriod.isCurrent
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
            {currentPeriod.isUploadClosed
              ? '本期起因全活動已達 300 萬筆上限，已截止受理上傳。審查通過之加碼券仍可持續兌換至 12/31。'
              : '每週每人限上傳一次運動截圖，審核通過即享 50 元加碼券！'}
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
        <View style={styles.loginSection}>
          <TouchableOpacity
            style={[styles.mainLoginButton, { backgroundColor: theme.primary }]}
            activeOpacity={0.88}
            onPress={handleQuickLogin}
          >
            <View style={styles.mainLoginIconWrap}>
              <Ionicons name="flash" size={26} color="#ffffff" />
            </View>
            <View style={styles.mainLoginTextWrap}>
              <Text style={styles.mainLoginTitle}>一鍵快登「我的任務」</Text>
              <Text style={styles.mainLoginSubtitle}>
                {activeUser
                  ? `自動填入 ${activeUser.name} 的身分證、生日與手機`
                  : '點此立即開始快速登入'}
              </Text>
            </View>
            <Ionicons name="arrow-forward" size={22} color="#ffffff" />
          </TouchableOpacity>

          <View style={styles.loginHintBox}>
            <Ionicons name="information-circle-outline" size={14} color={theme.textMuted} />
            <Text style={[styles.loginHintText, { color: theme.textMuted }]}>
              可一鍵登入官方「我的任務」頁面，查詢審查狀態及出示加碼券兌換條碼。
            </Text>
          </View>
        </View>

        {/* Quick Features Grid */}
        <Text style={[styles.sectionHeading, { color: theme.text }]}>常用功能捷徑</Text>
        <View style={styles.gridContainer}>
          <TouchableOpacity
            style={[
              styles.gridCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
            onPress={() => router.push('/precheck')}
          >
            <View style={[styles.gridIconCircle, { backgroundColor: '#FFE8DF' }]}>
              <Ionicons name="scan" size={24} color="#FF5E1E" />
            </View>
            <Text style={[styles.gridCardTitle, { color: theme.text }]}>截圖合格預檢</Text>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              歷史截圖規範診斷對照
            </Text>
          </TouchableOpacity>

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
            <View style={styles.gridTitleWithBadge}>
              <Text style={[styles.gridCardTitle, { color: theme.text }]}>審核進度查詢</Text>
              <View style={styles.closedMiniBadge}>
                <Text style={styles.closedMiniBadgeText}>已截止</Text>
              </View>
            </View>
            <Text style={[styles.gridCardDesc, { color: theme.textSecondary }]}>
              上傳已截止，點此快登查審查
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
            onPress={() => router.push({ pathname: '/tasks', params: { tab: 'criteria' } })}
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
            onPress={() => router.push({ pathname: '/tasks', params: { tab: 'schedule' } })}
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

      {/* Theme Picker Bottom Sheet */}
      <ThemePickerModal visible={isThemeModalOpen} onClose={() => setIsThemeModalOpen(false)} />
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
  brandTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  brandTitle: {
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: -0.2,
  },
  unofficialBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'center',
  },
  unofficialBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingsIconButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noticeCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1.5,
    gap: 10,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  noticeHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  noticeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EA580C',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 5,
  },
  noticeBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
  noticeStatusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  noticeStatusText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '800',
  },
  noticeTitle: {
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: -0.2,
    lineHeight: 22,
  },
  noticeDesc: {
    fontSize: 13,
    lineHeight: 18,
  },
  noticeRightsBox: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: 8,
    marginTop: 2,
  },
  noticeRightsTitle: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  noticeBulletRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeBulletIcon: {
    marginTop: 2,
  },
  noticeBulletText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
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
  loginSection: {
    gap: 8,
  },
  loginHintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 12,
  },
  loginHintText: {
    fontSize: 12,
    lineHeight: 16,
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
  gridTitleWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  closedMiniBadge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 5,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  closedMiniBadgeText: {
    color: '#DC2626',
    fontSize: 10,
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
