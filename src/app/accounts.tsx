import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import { useFocusEffect } from 'expo-router';
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Switch,
} from 'react-native';

import { Spacing, MaxContentWidth } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  getProfiles,
  saveProfile,
  deleteProfile,
  setActiveProfile,
  isBiometricsEnabled,
  setBiometricsEnabled,
  authenticateBiometrics,
  checkBiometricsSupport,
  BiometricsSupportInfo,
} from '@/services/storage';
import {
  UserProfile,
  isValidTaiwanId,
  isValidTaiwanPhone,
  maskId,
  maskPhone,
  formatRocDate,
} from '@/types/sports500';

const COMMON_LABELS = ['本人', '配偶', '父親', '母親', '子女', '長輩'];

export default function AccountsScreen() {
  const theme = useTheme();

  const [profiles, setProfiles] = useState<UserProfile[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Form states
  const [formName, setFormName] = useState('');
  const [formIdNo, setFormIdNo] = useState('');
  const [formRocYear, setFormRocYear] = useState('85');
  const [formMonth, setFormMonth] = useState('1');
  const [formDay, setFormDay] = useState('1');
  const [formPhone, setFormPhone] = useState('');
  const [formEmail, setFormEmail] = useState('');
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
    setFormEmail('');
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
    setFormEmail(item.email || '');
    setFormLabel(item.label || '本人');
    setFormIsDefault(item.isDefault);
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    const cleanName = formName.trim();
    const cleanIdNo = formIdNo.trim().toUpperCase();
    const cleanPhone = formPhone.trim().replace(/\s+/g, '');
    const cleanEmail = formEmail.trim();

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
        email: cleanEmail,
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
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
            style={styles.linkRow}
            onPress={() => handleOpenUrl('https://twedu.qbicloud.com/webchat_sa/index.html')}
          >
            <Ionicons name="chatbubbles-outline" size={20} color="#3B82F6" />
            <Text style={[styles.linkRowText, { color: theme.text }]}>線上文字客服小幫手</Text>
            <Ionicons name="open-outline" size={16} color={theme.textMuted} />
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
      <Modal visible={isModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>
                {editingId ? '編輯登入身分' : '新增登入身分'}
              </Text>
              <TouchableOpacity onPress={() => setIsModalOpen(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalFormScroll} showsVerticalScrollIndicator={false}>
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
                />
                <Text style={[styles.fieldHint, { color: theme.textMuted }]}>
                  需與登記於運動部系統之門號一致
                </Text>
              </View>

              {/* Email */}
              <View style={styles.formField}>
                <Text style={[styles.fieldLabel, { color: theme.text }]}>電子郵件（選填）</Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.backgroundElement,
                      color: theme.text,
                      borderColor: theme.cardBorder,
                    },
                  ]}
                  keyboardType="email-address"
                  placeholder="example@mail.com"
                  placeholderTextColor={theme.textMuted}
                  autoCapitalize="none"
                  value={formEmail}
                  onChangeText={setFormEmail}
                />
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
        </View>
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
});
