import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import * as Updates from 'expo-updates';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme, useThemeContext } from '@/hooks/use-theme';
import {
  BiometricsSupportInfo,
  authenticateBiometrics,
  checkBiometricsSupport,
  deleteProfile,
  getProfiles,
  isBiometricsEnabled,
  saveProfile,
  setActiveProfile,
  setBiometricsEnabled,
} from '@/services/storage';
import {
  UserProfile,
  formatRocDate,
  isValidTaiwanId,
  isValidTaiwanPhone,
  maskId,
  maskPhone,
} from '@/types/sports500';

const COMMON_LABELS = ['本人', '配偶', '父親', '母親', '子女', '長輩'];

export default function AccountsScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const formScrollRef = useRef<ScrollView>(null);
  const { preference, colorScheme, setThemePreference } = useThemeContext();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Updates
  const { currentlyRunning, isUpdatePending } = Updates.useUpdates();
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(false);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIdNo, setFormIdNo] = useState('');
  const [formRocYear, setFormRocYear] = useState('85');
  const [formMonth, setFormMonth] = useState('1');
  const [formDay, setFormDay] = useState('1');
  const [formPhone, setFormPhone] = useState('');
  const [formLabel, setFormLabel] = useState('本人');
  const [formIsDefault, setFormIsDefault] = useState(false);

  const [bioEnabled, setBioEnabled] = useState(false);
  const [bioSupport, setBioSupport] = useState<BiometricsSupportInfo | null>(null);

  const loadData = useCallback(async () => {
    const list = await getProfiles();
    setProfiles(list);
    const support = await checkBiometricsSupport();
    setBioSupport(support);
    if (support.isAvailable) {
      const bio = await isBiometricsEnabled();
      setBioEnabled(bio);
    } else {
      setBioEnabled(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const handleOpenAddModal = async () => {
    if (bioEnabled && bioSupport?.isAvailable) {
      const ok = await authenticateBiometrics('請驗證身分以新增登入身分');
      if (!ok) {
        Alert.alert('驗證未通過', '無法存取帳號保險箱。');
        return;
      }
    }
    setEditingId(null);
    setFormName('');
    setFormIdNo('');
    setFormRocYear('85');
    setFormMonth('1');
    setFormDay('1');
    setFormPhone('');
    setFormLabel('本人');
    setFormIsDefault(profiles.length === 0);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = async (item: UserProfile) => {
    if (bioEnabled && bioSupport?.isAvailable) {
      const ok = await authenticateBiometrics('請驗證身分以編輯身分資料');
      if (!ok) {
        Alert.alert('驗證未通過', '無法檢視受保護的個資。');
        return;
      }
    }
    setEditingId(item.id);
    setFormName(item.name);
    setFormIdNo(item.idNo);
    setFormRocYear(String(item.birthYearRoc));
    setFormMonth(String(item.birthMonth));
    setFormDay(String(item.birthDay));
    setFormPhone(item.phone);
    setFormLabel(item.label || '本人');
    setFormIsDefault(item.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const cleanName = formName.trim();
    const cleanIdNo = formIdNo.trim().toUpperCase();
    const cleanPhone = formPhone.trim().replace(/\s+/g, '');

    if (!cleanName) {
      Alert.alert('請填寫姓名', '請輸入使用者的真實姓名或稱呼。');
      return;
    }

    if (!isValidTaiwanId(cleanIdNo)) {
      Alert.alert(
        '身分證號格式不正確',
        '請輸入合法的台灣身分證字號（1 碼大寫英文字母加 9 碼數字）。'
      );
      return;
    }

    const rocYear = parseInt(formRocYear, 10);
    const month = parseInt(formMonth, 10);
    const day = parseInt(formDay, 10);

    if (isNaN(rocYear) || rocYear < 1 || rocYear > 98) {
      Alert.alert(
        '年齡不符合資格',
        '官方規定參加者需為民國 98 年 12 月 31 日前出生（年滿 16 歲）。'
      );
      return;
    }

    if (isNaN(month) || month < 1 || month > 12) {
      Alert.alert('出生月份錯誤', '月份需介於 1 至 12。');
      return;
    }

    if (isNaN(day) || day < 1 || day > 31) {
      Alert.alert('出生日期錯誤', '日期需介於 1 至 31。');
      return;
    }

    if (!isValidTaiwanPhone(cleanPhone)) {
      Alert.alert('手機號碼格式錯誤', '請輸入以 09 開頭的 10 碼台灣手機號碼。');
      return;
    }

    await saveProfile(
      {
        name: cleanName,
        idNo: cleanIdNo,
        birthYearRoc: rocYear,
        birthMonth: month,
        birthDay: day,
        phone: cleanPhone,
        label: formLabel,
        isDefault: formIsDefault,
      },
      editingId || undefined
    );

    setIsModalOpen(false);
    await loadData();
    Alert.alert('儲存成功', `已成功儲存 ${cleanName} 的登入資料！`);
  };

  const handleDelete = (item: UserProfile) => {
    Alert.alert('刪除確認', `確定要刪除 ${item.name} 的登入資料嗎？`, [
      { text: '取消', style: 'cancel' },
      {
        text: '確定刪除',
        style: 'destructive',
        onPress: async () => {
          if (bioEnabled && bioSupport?.isAvailable) {
            const ok = await authenticateBiometrics('請驗證身分以刪除此身分');
            if (!ok) {
              Alert.alert('驗證未通過', '無法刪除受保護的身分。');
              return;
            }
          }
          await deleteProfile(item.id);
          await loadData();
        },
      },
    ]);
  };

  const handleSetDefault = async (item: UserProfile) => {
    await setActiveProfile(item.id);
    await loadData();
  };

  const handleToggleBio = async (val: boolean) => {
    if (val) {
      const promptLabel = bioSupport?.label
        ? `請驗證${bioSupport.label.replace('保護', '')}以啟用防護`
        : '請驗證身分以開啟生物辨識保護';
      const ok = await authenticateBiometrics(promptLabel);
      if (ok) {
        await setBiometricsEnabled(true);
        setBioEnabled(true);
      } else {
        Alert.alert('驗證未通過', '無法啟用生物辨識保護。');
      }
    } else {
      await setBiometricsEnabled(false);
      setBioEnabled(false);
    }
  };

  const handleCallHotline = () => {
    Linking.openURL('tel:0277523658');
  };

  const handleOpenUrl = (url: string) => {
    Linking.openURL(url);
  };

  const appVersion = Constants.expoConfig?.version || '1.0.0';
  const buildCommit =
    (Constants.expoConfig?.extra as { gitCommit?: string } | undefined)?.gitCommit || '';
  const updateCommit =
    (currentlyRunning?.manifest as { extra?: { gitCommit?: string } })?.extra?.gitCommit ||
    (currentlyRunning?.manifest as { metadata?: { gitCommit?: string } })?.metadata?.gitCommit ||
    '';
  const currentCommit = updateCommit || buildCommit || '';

  const updateSourceText = currentlyRunning.isEmbeddedLaunch ? '內建版本' : '雲端更新';

  const handleCheckUpdate = async () => {
    if (__DEV__ || !Updates.isEnabled) {
      Alert.alert(
        '本地開發環境',
        '目前處於本地開發環境（Expo Go 或 Local Dev Server），EAS 雲端更新需在獨立打包的發布版本（Release / Preview Build）中運作。'
      );
      return;
    }

    setIsCheckingUpdate(true);
    try {
      const update = await Updates.checkForUpdateAsync();
      if (update.isAvailable) {
        Alert.alert('發現新版本', '伺服器上有可用的最新版本，是否立即下載更新？', [
          { text: '稍後', style: 'cancel' },
          {
            text: '立即下載',
            onPress: async () => {
              setIsCheckingUpdate(true);
              try {
                await Updates.fetchUpdateAsync();
                Alert.alert('下載完成', '新版本已下載完成，是否立即重新啟動套用？', [
                  { text: '稍後重啟', style: 'cancel' },
                  { text: '立即重啟', onPress: () => Updates.reloadAsync() },
                ]);
              } catch (err: unknown) {
                const message = err instanceof Error ? err.message : '無法下載更新';
                Alert.alert('下載失敗', message);
              } finally {
                setIsCheckingUpdate(false);
              }
            },
          },
        ]);
      } else {
        Alert.alert('已是最新版本', '目前運行的已經是最新版本，沒有更新需要下載。');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : '檢查更新時發生錯誤，請稍後再試。';
      Alert.alert('檢查失敗', message);
    } finally {
      setIsCheckingUpdate(false);
    }
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.superTitle, { color: theme.primary }]}>安全憑證管理</Text>
          <Text style={[styles.mainTitle, { color: theme.text }]}>帳號保險箱與設定</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            安全儲存您與家庭成員的身分證字號及生日，隨時一鍵自動登入官方系統。
          </Text>
        </View>

        {/* Profiles Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              已儲存身分證資料 ({profiles.length})
            </Text>
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: theme.primary }]}
              onPress={handleOpenAddModal}
            >
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={styles.addButtonText}>新增帳號</Text>
            </TouchableOpacity>
          </View>

          {profiles.length === 0 ? (
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
              ]}
            >
              <Ionicons name="shield-outline" size={36} color={theme.primary} />
              <Text style={[styles.emptyCardTitle, { color: theme.text }]}>尚未儲存任何帳號</Text>
              <Text style={[styles.emptyCardText, { color: theme.textSecondary }]}>
                點選上方「新增帳號」按鈕，建立第一筆身分證與生日，即可享有極速自動登入！
              </Text>
            </View>
          ) : (
            <View style={styles.profilesList}>
              {profiles.map((item) => (
                <View
                  key={item.id}
                  style={[
                    styles.profileCard,
                    { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
                    item.isDefault && { borderColor: theme.primary, borderWidth: 1.5 },
                  ]}
                >
                  <View style={styles.profileCardTop}>
                    <View style={styles.profileCardHeaderLeft}>
                      <Text style={[styles.profileCardName, { color: theme.text }]}>
                        {item.name}
                      </Text>
                      {item.label && (
                        <View
                          style={[styles.labelBadge, { backgroundColor: theme.backgroundElement }]}
                        >
                          <Text style={[styles.labelBadgeText, { color: theme.textSecondary }]}>
                            {item.label}
                          </Text>
                        </View>
                      )}
                      {item.isDefault && (
                        <View
                          style={[styles.defaultBadge, { backgroundColor: theme.primaryLight }]}
                        >
                          <Ionicons name="star" size={11} color={theme.primary} />
                          <Text style={[styles.defaultBadgeText, { color: theme.primary }]}>
                            預設登入
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.cardActionsGroup}>
                      <TouchableOpacity
                        onPress={() => handleOpenEditModal(item)}
                        style={styles.actionIconButton}
                      >
                        <Ionicons name="pencil" size={18} color={theme.textSecondary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleDelete(item)}
                        style={styles.actionIconButton}
                      >
                        <Ionicons name="trash-outline" size={18} color={theme.danger} />
                      </TouchableOpacity>
                    </View>
                  </View>

                  <View
                    style={[styles.profileInfoBox, { backgroundColor: theme.backgroundElement }]}
                  >
                    <Text style={[styles.infoLine, { color: theme.text }]}>
                      身分證號：<Text style={{ fontWeight: '800' }}>{maskId(item.idNo)}</Text>
                    </Text>
                    <Text style={[styles.infoLine, { color: theme.textSecondary }]}>
                      出生日期：{formatRocDate(item.birthYearRoc, item.birthMonth, item.birthDay)}
                    </Text>
                    <Text style={[styles.infoLine, { color: theme.textSecondary }]}>
                      手機號碼：{maskPhone(item.phone)}
                    </Text>
                  </View>

                  {!item.isDefault && (
                    <TouchableOpacity
                      style={[styles.setDefaultBtn, { borderColor: theme.cardBorder }]}
                      onPress={() => handleSetDefault(item)}
                    >
                      <Ionicons name="star-outline" size={14} color={theme.textSecondary} />
                      <Text style={[styles.setDefaultBtnText, { color: theme.textSecondary }]}>
                        設為一鍵預設登入身分
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Biometrics Settings - 若裝置不支援或無法啟用則完全不顯示 */}
        {Boolean(bioSupport?.isAvailable) && (
          <View
            style={[
              styles.settingsCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
          >
            <View style={styles.settingRow}>
              <View style={[styles.settingIconWrap, { backgroundColor: theme.primaryLight }]}>
                <Ionicons
                  name={bioSupport?.icon || 'finger-print'}
                  size={22}
                  color={theme.primary}
                />
              </View>
              <View style={{ flex: 1, gap: 2 }}>
                <Text style={[styles.settingTitle, { color: theme.text }]}>
                  {bioSupport?.label || '生物辨識保護'}
                </Text>
                <Text style={[styles.settingDesc, { color: theme.textSecondary }]}>
                  開啟後存取帳號保險箱需通過身分驗證，保護個資隱私。
                </Text>
              </View>
              <Switch
                value={bioEnabled}
                onValueChange={handleToggleBio}
                trackColor={{ false: theme.backgroundElement, true: theme.primary }}
                thumbColor="#ffffff"
              />
            </View>
          </View>
        )}

        {/* Appearance / Theme Settings Section */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.authorHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="color-palette-outline" size={18} color={theme.primary} />
              <Text style={[styles.cardSectionTitle, { color: theme.text }]}>外觀主題</Text>
            </View>
            <View
              style={[
                styles.unofficialAuthorBadge,
                { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.unofficialAuthorBadgeText, { color: theme.textSecondary }]}>
                {preference === 'system'
                  ? `跟隨系統 (${colorScheme === 'dark' ? '深色' : '淺色'})`
                  : preference === 'dark'
                    ? '深色模式'
                    : '淺色模式'}
              </Text>
            </View>
          </View>

          <Text style={[styles.authorIntroText, { color: theme.textSecondary }]}>
            可依照個人喜好鎖定淺色或深色風格，或自動隨手機系統外觀切換。
          </Text>

          <View
            style={[
              styles.themeSegmentContainer,
              { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
            ]}
          >
            {(
              [
                { key: 'system', label: '跟隨系統', icon: 'contrast-outline' },
                { key: 'light', label: '淺色模式', icon: 'sunny-outline' },
                { key: 'dark', label: '深色模式', icon: 'moon-outline' },
              ] as const
            ).map((item) => {
              const isSelected = preference === item.key;
              return (
                <TouchableOpacity
                  key={item.key}
                  style={[
                    styles.themeSegmentBtn,
                    isSelected && [
                      styles.themeSegmentBtnActive,
                      { backgroundColor: theme.cardBackground, borderColor: theme.primary },
                    ],
                  ]}
                  activeOpacity={0.7}
                  onPress={() => setThemePreference(item.key)}
                >
                  <Ionicons
                    name={item.icon}
                    size={16}
                    color={isSelected ? theme.primary : theme.textSecondary}
                  />
                  <Text
                    style={[
                      styles.themeSegmentText,
                      {
                        color: isSelected ? theme.primary : theme.textSecondary,
                        fontWeight: isSelected ? '700' : '500',
                      },
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Version & Updates Section */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.authorHeaderRow}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Ionicons name="git-branch-outline" size={18} color={theme.primary} />
              <Text style={[styles.cardSectionTitle, { color: theme.text }]}>版本與更新</Text>
            </View>
            <View
              style={[
                styles.unofficialAuthorBadge,
                { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.unofficialAuthorBadgeText, { color: theme.textSecondary }]}>
                v{appVersion}
              </Text>
            </View>
          </View>

          {/* Commit & Build Info */}
          <View style={[styles.versionInfoRow, { borderColor: theme.cardBorder }]}>
            <TouchableOpacity
              style={styles.versionInfoCol}
              disabled={!currentCommit}
              onPress={() => {
                if (currentCommit) {
                  handleOpenUrl(
                    `https://github.com/patw0929/tw-sports-500-helper/commit/${currentCommit}`
                  );
                }
              }}
            >
              <Text style={[styles.versionLabel, { color: theme.textMuted }]}>Latest Commit</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={[styles.versionValue, { color: theme.text }]}>
                  {currentCommit ? `#${currentCommit}` : 'N/A'}
                </Text>
                {currentCommit ? (
                  <Ionicons name="open-outline" size={11} color={theme.textMuted} />
                ) : null}
              </View>
            </TouchableOpacity>

            <View style={[styles.versionDivider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.versionInfoCol}>
              <Text style={[styles.versionLabel, { color: theme.textMuted }]}>運作模式</Text>
              <Text style={[styles.versionValue, { color: theme.text }]}>{updateSourceText}</Text>
            </View>

            <View style={[styles.versionDivider, { backgroundColor: theme.cardBorder }]} />

            <View style={styles.versionInfoCol}>
              <Text style={[styles.versionLabel, { color: theme.textMuted }]}>更新渠道</Text>
              <Text style={[styles.versionValue, { color: theme.text }]}>
                {Updates.channel || '預設'}
              </Text>
            </View>
          </View>

          {/* If update downloaded and waiting for restart */}
          {isUpdatePending && (
            <View style={[styles.pendingUpdateBanner, { backgroundColor: theme.primaryLight }]}>
              <Ionicons name="sparkles" size={16} color={theme.primary} />
              <Text style={[styles.pendingUpdateText, { color: theme.primary }]}>
                新版本已下載就緒，重啟立即生效！
              </Text>
              <TouchableOpacity
                style={[styles.pendingRestartBtn, { backgroundColor: theme.primary }]}
                onPress={() => Updates.reloadAsync()}
              >
                <Text style={styles.pendingRestartBtnText}>重啟</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Check for Updates Button */}
          <TouchableOpacity
            style={[
              styles.checkUpdateBtn,
              {
                backgroundColor: isCheckingUpdate ? theme.backgroundElement : theme.primaryLight,
                borderColor: theme.primary,
              },
            ]}
            disabled={isCheckingUpdate}
            onPress={handleCheckUpdate}
          >
            {isCheckingUpdate ? (
              <>
                <ActivityIndicator size="small" color={theme.primary} />
                <Text style={[styles.checkUpdateBtnText, { color: theme.primary }]}>
                  正在檢查雲端更新...
                </Text>
              </>
            ) : (
              <>
                <Ionicons name="cloud-download-outline" size={18} color={theme.primary} />
                <Text style={[styles.checkUpdateBtnText, { color: theme.primary }]}>
                  手動檢查雲端更新 (EAS Update)
                </Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Official Resources & Support */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <Text style={[styles.cardSectionTitle, { color: theme.text }]}>官方資源與客服管道</Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() =>
              handleOpenUrl('https://500.gov.tw/news/115/115年揮汗有禮加碼活動使用說明_0831V4.pdf')
            }
          >
            <Ionicons name="document-text-outline" size={20} color={theme.primary} />
            <Text style={[styles.linkRowText, { color: theme.text }]}>官方操作說明手冊 (PDF)</Text>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() =>
              handleOpenUrl(
                'https://500.gov.tw/news/115/運動幣全民運動加碼方案規劃-懶人包08261609_300dpi.pdf'
              )
            }
          >
            <Ionicons name="sparkles-outline" size={20} color={theme.accent} />
            <Text style={[styles.linkRowText, { color: theme.text }]}>運動部活動懶人包 (PDF)</Text>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity style={styles.linkRow} onPress={handleCallHotline}>
            <Ionicons name="call-outline" size={20} color={theme.success} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkRowText, { color: theme.text }]}>
                撥打活動客服專線 02-7752-3658
              </Text>
              <Text style={[styles.linkSubtext, { color: theme.textMuted }]}>
                週一至週日 09:00~18:00 (12:00~13:00休息)
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            onPress={() => handleOpenUrl('https://twedu.qbicloud.com/webchat_sa/index.html')}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#3B82F6" />
            <Text style={[styles.linkRowText, { color: theme.text }]}>線上文字客服小幫手</Text>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Unofficial App Author / 非官方 App 作者 */}
        <View
          style={[
            styles.settingsCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <View style={styles.authorHeaderRow}>
            <Text style={[styles.cardSectionTitle, { color: theme.text }]}>非官方 App 作者</Text>
            <View
              style={[
                styles.unofficialAuthorBadge,
                { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
              ]}
            >
              <Text style={[styles.unofficialAuthorBadgeText, { color: theme.textSecondary }]}>
                開源專案
              </Text>
            </View>
          </View>

          <Text style={[styles.authorIntroText, { color: theme.textSecondary }]}>
            由開發者 patw 因個人需求自製開發，無廣告、零伺服器後端，原始碼完全開源於
            GitHub，歡迎前往加顆星支持。
          </Text>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenUrl('https://github.com/patw0929/tw-sports-500-helper')}
          >
            <Ionicons name="logo-github" size={20} color={theme.text} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkRowText, { color: theme.text }]}>GitHub 原始碼庫</Text>
              <Text style={[styles.linkSubtext, { color: theme.textMuted }]}>
                patw0929/tw-sports-500-helper
              </Text>
            </View>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.linkRow}
            onPress={() => handleOpenUrl('https://patw.me/')}
          >
            <Ionicons name="globe-outline" size={20} color={theme.primary} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkRowText, { color: theme.text }]}>個人網站</Text>
              <Text style={[styles.linkSubtext, { color: theme.textMuted }]}>patw.me</Text>
            </View>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.linkRow, { borderBottomWidth: 0 }]}
            onPress={() => handleOpenUrl('mailto:patw.hi@gmail.com')}
          >
            <Ionicons name="mail-outline" size={20} color={theme.accent} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.linkRowText, { color: theme.text }]}>聯絡作者信箱</Text>
              <Text style={[styles.linkSubtext, { color: theme.textMuted }]}>
                patw.hi@gmail.com
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={theme.textMuted} />
          </TouchableOpacity>
        </View>

        {/* Security Declaration & Disclaimer */}
        <View style={[styles.disclaimerBox, { backgroundColor: theme.backgroundElement }]}>
          <Ionicons name="information-circle-outline" size={18} color={theme.textSecondary} />
          <Text style={[styles.disclaimerText, { color: theme.textSecondary }]}>
            免責聲明：本 App
            非官方所有，僅為開發者個人方便使用開發，請以官方規則為主。所有身分證與電話等資訊僅加密保存在使用者裝置本機硬體晶片中，絕不上傳任何第三方伺服器，登入與資料核驗皆直接於運動部官方主機進行。
          </Text>
        </View>
      </ScrollView>

      {/* Add / Edit Profile Modal */}
      <Modal
        visible={isModalOpen}
        transparent
        animationType="slide"
        statusBarTranslucent
        onRequestClose={() => {
          Keyboard.dismiss();
          setIsModalOpen(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => {
              Keyboard.dismiss();
              setIsModalOpen(false);
            }}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.cardBackground,
                maxHeight: isKeyboardVisible ? '100%' : '85%',
                paddingBottom: isKeyboardVisible
                  ? 12
                  : insets.bottom > 0
                    ? insets.bottom + 12
                    : Spacing.four,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingId ? '編輯登入身分' : '新增登入身分'}
              </Text>
              <TouchableOpacity
                onPress={() => {
                  Keyboard.dismiss();
                  setIsModalOpen(false);
                }}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView
              ref={formScrollRef}
              style={styles.modalFormScroll}
              keyboardShouldPersistTaps="handled"
              keyboardDismissMode="on-drag"
              showsVerticalScrollIndicator={false}
            >
              {/* Name */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  姓名或稱呼 <Text style={{ color: theme.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="例如：王小明"
                  placeholderTextColor={theme.textMuted}
                  value={formName}
                  onChangeText={setFormName}
                  onFocus={() => {
                    setTimeout(() => {
                      formScrollRef.current?.scrollTo({ y: 0, animated: true });
                    }, 150);
                  }}
                />
              </View>

              {/* Tag / Label Quick Select */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>身分標籤</Text>
                <View style={styles.labelsChipRow}>
                  {COMMON_LABELS.map((lbl) => (
                    <TouchableOpacity
                      key={lbl}
                      style={[
                        styles.labelSelectChip,
                        { borderColor: formLabel === lbl ? theme.primary : theme.cardBorder },
                        formLabel === lbl && { backgroundColor: theme.primaryLight },
                      ]}
                      onPress={() => setFormLabel(lbl)}
                    >
                      <Text
                        style={[
                          styles.labelSelectChipText,
                          { color: formLabel === lbl ? theme.primary : theme.textSecondary },
                        ]}
                      >
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* ID Number */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  身分證字號 <Text style={{ color: theme.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  placeholder="A123456789"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="characters"
                  maxLength={10}
                  value={formIdNo}
                  onChangeText={(t) => setFormIdNo(t.toUpperCase())}
                  onFocus={() => {
                    setTimeout(() => {
                      formScrollRef.current?.scrollTo({ y: 80, animated: true });
                    }, 150);
                  }}
                />
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  首碼英文大寫加 9 碼數字，系統會自動核對檢核碼
                </Text>
              </View>

              {/* Birth Date (ROC) */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  出生年月日（民國） <Text style={{ color: theme.primary }}>*</Text>
                </Text>
                <View style={styles.dateInputsRow}>
                  <View style={styles.dateInputCol}>
                    <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>
                      民國年
                    </Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.dateInput,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      keyboardType="number-pad"
                      placeholder="85"
                      placeholderTextColor={theme.textMuted}
                      maxLength={3}
                      value={formRocYear}
                      onChangeText={setFormRocYear}
                      onFocus={() => {
                        setTimeout(() => {
                          formScrollRef.current?.scrollTo({ y: 150, animated: true });
                        }, 150);
                      }}
                    />
                  </View>

                  <View style={styles.dateInputCol}>
                    <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>月份</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.dateInput,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={theme.textMuted}
                      maxLength={2}
                      value={formMonth}
                      onChangeText={setFormMonth}
                      onFocus={() => {
                        setTimeout(() => {
                          formScrollRef.current?.scrollTo({ y: 150, animated: true });
                        }, 150);
                      }}
                    />
                  </View>

                  <View style={styles.dateInputCol}>
                    <Text style={[styles.dateSubLabel, { color: theme.textSecondary }]}>日期</Text>
                    <TextInput
                      style={[
                        styles.input,
                        styles.dateInput,
                        {
                          backgroundColor: theme.backgroundElement,
                          color: theme.text,
                          borderColor: theme.cardBorder,
                        },
                      ]}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={theme.textMuted}
                      maxLength={2}
                      value={formDay}
                      onChangeText={setFormDay}
                      onFocus={() => {
                        setTimeout(() => {
                          formScrollRef.current?.scrollTo({ y: 150, animated: true });
                        }, 150);
                      }}
                    />
                  </View>
                </View>
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  需為民國 98 年 12 月 31 日前出生（滿 16 歲）
                </Text>
              </View>

              {/* Phone */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>
                  手機號碼 <Text style={{ color: theme.primary }}>*</Text>
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  keyboardType="phone-pad"
                  placeholder="0912345678"
                  placeholderTextColor={theme.textMuted}
                  maxLength={10}
                  value={formPhone}
                  onChangeText={setFormPhone}
                  onFocus={() => {
                    setTimeout(() => {
                      formScrollRef.current?.scrollToEnd({ animated: true });
                    }, 150);
                  }}
                />
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  需與登記於運動部系統之門號一致
                </Text>
              </View>

              {/* Default Toggle */}
              <View style={[styles.toggleRow, { borderColor: theme.cardBorder }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.toggleTitle, { color: theme.text }]}>
                    設為一鍵快速登入帳號
                  </Text>
                  <Text style={[styles.toggleDesc, { color: theme.textSecondary }]}>
                    首頁點擊快速登入時將自動採用此帳號
                  </Text>
                </View>
                <Switch
                  value={formIsDefault}
                  onValueChange={setFormIsDefault}
                  trackColor={{ false: theme.backgroundElement, true: theme.primary }}
                  thumbColor="#ffffff"
                />
              </View>

              <TouchableOpacity
                style={[styles.saveSubmitBtn, { backgroundColor: theme.primary }]}
                onPress={handleSave}
              >
                <Ionicons name="checkmark-circle" size={20} color="#fff" />
                <Text style={styles.saveSubmitBtnText}>儲存身分資料</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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
  section: {
    gap: 12,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    gap: 4,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
  emptyCard: {
    padding: Spacing.five,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    gap: 10,
  },
  emptyCardTitle: {
    fontSize: 16,
    fontWeight: '800',
  },
  emptyCardText: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
  },
  profilesList: {
    gap: 12,
  },
  profileCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: 12,
  },
  profileCardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  profileCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  profileCardName: {
    fontSize: 17,
    fontWeight: '800',
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  labelBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  defaultBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    gap: 3,
  },
  defaultBadgeText: {
    fontSize: 11,
    fontWeight: '800',
  },
  cardActionsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  actionIconButton: {
    padding: 6,
  },
  profileInfoBox: {
    padding: Spacing.three,
    borderRadius: 12,
    gap: 4,
  },
  infoLine: {
    fontSize: 13,
  },
  setDefaultBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  setDefaultBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  settingsCard: {
    padding: Spacing.four,
    borderRadius: 18,
    borderWidth: 1,
    gap: Spacing.three,
  },
  cardSectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 4,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  settingDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
    gap: 12,
  },
  linkRowText: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  linkSubtext: {
    fontSize: 11,
    marginTop: 2,
  },
  authorHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  unofficialAuthorBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  unofficialAuthorBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  authorIntroText: {
    fontSize: 13,
    lineHeight: 19,
  },
  disclaimerBox: {
    flexDirection: 'row',
    padding: Spacing.three,
    borderRadius: 14,
    gap: 8,
  },
  disclaimerText: {
    fontSize: 11,
    lineHeight: 16,
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
  },
  modalFormScroll: {
    marginBottom: Spacing.four,
  },
  formField: {
    marginBottom: 14,
    gap: 6,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '700',
  },
  fieldHint: {
    fontSize: 11,
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
  },
  labelsChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  labelSelectChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
  },
  labelSelectChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
  dateInputsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dateInputCol: {
    flex: 1,
    gap: 4,
  },
  dateSubLabel: {
    fontSize: 11,
  },
  dateInput: {
    textAlign: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginBottom: 16,
  },
  toggleTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  toggleDesc: {
    fontSize: 11,
  },
  saveSubmitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
    marginBottom: 20,
  },
  saveSubmitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '800',
  },
  versionInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    marginVertical: 12,
  },
  versionInfoCol: {
    flex: 1,
    alignItems: 'center',
    gap: 3,
  },
  versionDivider: {
    width: 1,
    height: 24,
  },
  versionLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  versionValue: {
    fontSize: 13,
    fontWeight: '700',
  },
  pendingUpdateBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 10,
    marginBottom: 10,
    gap: 8,
  },
  pendingUpdateText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
  pendingRestartBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pendingRestartBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  checkUpdateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  checkUpdateBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  themeSegmentContainer: {
    flexDirection: 'row',
    borderRadius: 14,
    borderWidth: 1,
    padding: 4,
    gap: 4,
    marginTop: 4,
  },
  themeSegmentBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
  },
  themeSegmentBtnActive: {
    borderWidth: 1.5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  themeSegmentText: {
    fontSize: 13,
  },
});
