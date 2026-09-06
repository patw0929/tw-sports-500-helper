import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  Modal,
  FlatList,
  Alert,
  Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import { generateAutoFillScript, generateLogoutScript } from '@/services/autofill-engine';
import { getProfiles, getActiveProfile, setActiveProfile } from '@/services/storage';
import { UserProfile, maskId } from '@/types/sports500';

const DEFAULT_URL = 'https://500.gov.tw/registrant/access';

const VENDOR_SHORTCUTS = [
  { label: '登入 / 任務', url: 'https://500.gov.tw/registrant/access' },
  { label: '🏪 全家 (308項)', url: 'https://500.gov.tw/registrant/intro/vendor-1.html' },
  { label: '🏪 7-11 (473項)', url: 'https://500.gov.tw/registrant/intro/vendor-2.html' },
  { label: '🏪 萊爾富 (168項)', url: 'https://500.gov.tw/registrant/intro/vendor-3.html' },
  { label: '🛒 全聯 (9大類)', url: 'https://500.gov.tw/registrant/intro/vendor-5.html' },
  { label: '🏸 萬家福 (18大類)', url: 'https://500.gov.tw/registrant/intro/vendor-7.html' },
  { label: '活動首頁', url: 'https://500.gov.tw/registrant/' },
  { label: '任務辦法', url: 'https://500.gov.tw/registrant/activity-rules' },
];

function isShortcutActive(shortcutUrl: string, currentUrl: string): boolean {
  if (!currentUrl) return false;

  const cleanCurrent = currentUrl.split('?')[0].split('#')[0];
  const cleanShortcut = shortcutUrl.split('?')[0].split('#')[0];

  // Exact match
  if (cleanShortcut === cleanCurrent) return true;

  // 活動首頁: only match root /registrant/ or /registrant or /registrant/index.html
  if (shortcutUrl === 'https://500.gov.tw/registrant/') {
    return (
      cleanCurrent === 'https://500.gov.tw/registrant/' ||
      cleanCurrent === 'https://500.gov.tw/registrant' ||
      cleanCurrent === 'https://500.gov.tw/registrant/index.html'
    );
  }

  // 登入 / 任務: match /access, /login, /member/tasks, /register
  if (shortcutUrl === 'https://500.gov.tw/registrant/access') {
    return (
      cleanCurrent.includes('/registrant/access') ||
      cleanCurrent.includes('/registrant/login') ||
      cleanCurrent.includes('/registrant/register') ||
      cleanCurrent.includes('/registrant/member')
    );
  }

  // Other pages (e.g. vendor intro or rules)
  return cleanCurrent.startsWith(cleanShortcut);
}

export default function BrowserScreen() {
  const router = useRouter();
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    initialUrl?: string;
    autoRelogin?: string;
    profileId?: string;
    timestamp?: string;
  }>();

  const initialSource = useMemo(
    () => ({ uri: params.initialUrl || DEFAULT_URL }),
    [params.initialUrl]
  );
  const [activeUrl, setActiveUrl] = useState<string>(params.initialUrl || DEFAULT_URL);
  const [activeUser, setActiveUser] = useState<UserProfile | null>(null);
  const [allProfiles, setAllProfiles] = useState<UserProfile[]>([]);
  const [isAccountModalVisible, setAccountModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const lastInjectedUrlRef = useRef<string>(params.initialUrl || DEFAULT_URL);
  const lastInjectedAutoReloginRef = useRef<string | null>(null);

  useEffect(() => {
    if (params.initialUrl && params.initialUrl !== lastInjectedUrlRef.current) {
      lastInjectedUrlRef.current = params.initialUrl;
      setActiveUrl(params.initialUrl);
      if (webViewRef.current) {
        webViewRef.current.injectJavaScript(`window.location.href = '${params.initialUrl}'; true;`);
      }
    }
  }, [params.initialUrl]);

  const loadProfiles = useCallback(async () => {
    const list = await getProfiles();
    setAllProfiles(list);
    const active = await getActiveProfile();
    setActiveUser(active);
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadProfiles();
    }, [loadProfiles])
  );

  const handleOpenAccountModal = async () => {
    await loadProfiles();
    setAccountModalVisible(true);
  };

  const executeLogoutAndRelogin = useCallback((profile: UserProfile) => {
    const fillScript = generateAutoFillScript(profile);
    const logoutScript = generateLogoutScript(profile);

    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(fillScript);
      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(logoutScript);
        }
      }, 50);
    } else {
      setTimeout(() => {
        if (webViewRef.current) {
          webViewRef.current.injectJavaScript(fillScript);
          webViewRef.current.injectJavaScript(logoutScript);
        }
      }, 350);
    }
  }, []);

  const handleAutoLogoutAndRelogin = (profile: UserProfile) => {
    executeLogoutAndRelogin(profile);
  };

  useEffect(() => {
    if (
      params.autoRelogin === 'true' &&
      params.timestamp &&
      params.timestamp !== lastInjectedAutoReloginRef.current
    ) {
      lastInjectedAutoReloginRef.current = params.timestamp;

      (async () => {
        const list = await getProfiles();
        setAllProfiles(list);
        const target =
          (params.profileId && list.find((p) => p.id === params.profileId)) ||
          (await getActiveProfile());
        if (target) {
          await setActiveProfile(target.id);
          setActiveUser(target);
          executeLogoutAndRelogin(target);
        }
      })();
    }
  }, [params.autoRelogin, params.timestamp, params.profileId, executeLogoutAndRelogin]);

  const handleSelectProfile = async (profile: UserProfile) => {
    const isDifferent = activeUser?.id !== profile.id;
    await setActiveProfile(profile.id);
    setActiveUser(profile);
    setAccountModalVisible(false);

    // Re-inject script with new profile
    if (webViewRef.current) {
      const script = generateAutoFillScript(profile);
      webViewRef.current.injectJavaScript(script);
    }

    if (isDifferent) {
      Alert.alert(
        '已切換登入身分',
        `已切換為「${profile.name}」。\n\n若已登入，請在網頁中點擊「登出」；登出後小幫手將自動為您填入新身分！`,
        [
          {
            text: '自動登出並重新登入',
            onPress: () => handleAutoLogoutAndRelogin(profile),
          },
          {
            text: '我知道了',
            style: 'cancel',
          },
        ]
      );
    }
  };

  const handleManualAutoFill = () => {
    if (!activeUser) {
      Alert.alert('尚無帳號', '請先至「帳號管理」新增身分證與生日資料，才能自動填入。');
      return;
    }

    // If currently on an external URL or PDF, navigate directly to official access page
    if (!activeUrl.includes('500.gov.tw') || activeUrl.endsWith('.pdf')) {
      handleNavigate(DEFAULT_URL);
      return;
    }

    if (webViewRef.current) {
      const script = generateAutoFillScript(activeUser, true);
      webViewRef.current.injectJavaScript(script);
    }
  };

  const handleNavigate = (url: string) => {
    setActiveUrl(url);
    if (webViewRef.current) {
      // @ts-ignore
      webViewRef.current.injectJavaScript(`window.location.href = '${url}'; true;`);
    }
  };

  const injectedScript = generateAutoFillScript(activeUser);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      {/* Top Controls Bar */}
      <View
        style={[
          styles.topBar,
          { backgroundColor: theme.cardBackground, borderBottomColor: theme.cardBorder },
        ]}
      >
        <View style={styles.navButtonGroup}>
          <TouchableOpacity
            style={[styles.iconButton, !canGoBack && styles.disabledButton]}
            disabled={!canGoBack}
            onPress={() => webViewRef.current?.goBack()}
          >
            <Ionicons
              name="chevron-back"
              size={20}
              color={canGoBack ? theme.text : theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.iconButton, !canGoForward && styles.disabledButton]}
            disabled={!canGoForward}
            onPress={() => webViewRef.current?.goForward()}
          >
            <Ionicons
              name="chevron-forward"
              size={20}
              color={canGoForward ? theme.text : theme.textMuted}
            />
          </TouchableOpacity>

          <TouchableOpacity style={styles.iconButton} onPress={() => webViewRef.current?.reload()}>
            <Ionicons name="reload" size={18} color={theme.text} />
          </TouchableOpacity>
        </View>

        {/* Account Selector Pill */}
        <TouchableOpacity
          style={[
            styles.profilePill,
            { backgroundColor: theme.primaryLight, borderColor: theme.primary },
          ]}
          onPress={handleOpenAccountModal}
        >
          <Ionicons name="person-circle" size={18} color={theme.primary} />
          <Text style={[styles.profilePillText, { color: theme.primary }]} numberOfLines={1}>
            {activeUser ? `${activeUser.name} (${maskId(activeUser.idNo)})` : '未選取帳號'}
          </Text>
          <Ionicons name="chevron-down" size={14} color={theme.primary} />
        </TouchableOpacity>

        {/* Quick Auto-fill button */}
        <TouchableOpacity
          style={[styles.autoFillButton, { backgroundColor: theme.primary }]}
          onPress={handleManualAutoFill}
        >
          <Ionicons name="flash" size={15} color="#fff" />
          <Text style={styles.autoFillButtonText}>自動填寫</Text>
        </TouchableOpacity>
      </View>

      {/* Quick shortcuts ribbon */}
      <View style={[styles.shortcutsBar, { backgroundColor: theme.backgroundElement }]}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.shortcutsScrollContent}
        >
          {VENDOR_SHORTCUTS.map((item) => {
            const isMatch = isShortcutActive(item.url, activeUrl);
            return (
              <TouchableOpacity
                key={item.url}
                style={[
                  styles.shortcutTag,
                  isMatch && {
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.primary,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleNavigate(item.url)}
              >
                <Text
                  style={[
                    styles.shortcutTagText,
                    { color: isMatch ? theme.primary : theme.textSecondary },
                    isMatch && { fontWeight: '800' },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Loading Progress Bar */}
      {isLoading && (
        <View style={styles.loadingBar}>
          <ActivityIndicator size="small" color={theme.primary} />
        </View>
      )}

      {/* Native WebView */}
      <WebView
        ref={webViewRef}
        source={initialSource}
        style={styles.webView}
        injectedJavaScript={injectedScript}
        injectedJavaScriptBeforeContentLoaded={injectedScript}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        sharedCookiesEnabled={true}
        thirdPartyCookiesEnabled={true}
        mixedContentMode="always"
        setSupportMultipleWindows={false}
        allowsInlineMediaPlayback={true}
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
            : undefined
        }
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onShouldStartLoadWithRequest={(request) => {
          // Fix 500.gov.tw backend HTTP cleartext redirects on Android
          if (request.url.startsWith('http://500.gov.tw/')) {
            const secureUrl = request.url.replace('http://500.gov.tw/', 'https://500.gov.tw/');
            if (webViewRef.current) {
              webViewRef.current.injectJavaScript(`window.location.href = '${secureUrl}'; true;`);
            }
            return false;
          }
          return true;
        }}
        onNavigationStateChange={(navState) => {
          setCanGoBack(navState.canGoBack);
          setCanGoForward(navState.canGoForward);
          if (navState.url && navState.url !== activeUrl) {
            setActiveUrl(navState.url);
          }
        }}
        onMessage={(event) => {
          try {
            const data = JSON.parse(event.nativeEvent.data);
            console.log('WebView Message:', data);
          } catch {
            // Ignore
          }
        }}
      />

      {/* Profile Switcher Modal */}
      <Modal visible={isAccountModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setAccountModalVisible(false)}
          />
          <View
            style={[
              styles.modalContent,
              {
                backgroundColor: theme.cardBackground,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 16 : 24,
              },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>切換登入身分</Text>
              <TouchableOpacity onPress={() => setAccountModalVisible(false)}>
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={allProfiles}
              keyExtractor={(item) => item.id}
              ListEmptyComponent={
                <View style={styles.emptyProfiles}>
                  <Text style={{ color: theme.textSecondary }}>
                    目前尚未建立任何帳號，請至帳號管理建立。
                  </Text>
                </View>
              }
              renderItem={({ item }) => {
                const isSelected = activeUser?.id === item.id;
                return (
                  <TouchableOpacity
                    style={[
                      styles.profileItem,
                      { borderColor: isSelected ? theme.primary : theme.cardBorder },
                      isSelected && { backgroundColor: theme.primaryLight },
                    ]}
                    onPress={() => handleSelectProfile(item)}
                  >
                    <View style={styles.profileItemLeft}>
                      <Ionicons
                        name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                        size={20}
                        color={isSelected ? theme.primary : theme.textMuted}
                      />
                      <View style={{ marginLeft: 10 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                          <Text style={[styles.profileItemName, { color: theme.text }]}>
                            {item.name}
                          </Text>
                          {item.label && (
                            <View
                              style={[
                                styles.badgePill,
                                { backgroundColor: theme.backgroundElement },
                              ]}
                            >
                              <Text style={[styles.badgePillText, { color: theme.textSecondary }]}>
                                {item.label}
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text style={[styles.profileItemId, { color: theme.textSecondary }]}>
                          {maskId(item.idNo)}
                        </Text>
                      </View>
                    </View>
                    {isSelected && (
                      <View style={[styles.activeBadge, { backgroundColor: theme.primary }]}>
                        <Text style={styles.activeBadgeText}>使用中</Text>
                      </View>
                    )}
                  </TouchableOpacity>
                );
              }}
            />

            {/* Modal Bottom: Jump to Accounts */}
            <TouchableOpacity
              style={[
                styles.manageAccountsBtn,
                {
                  backgroundColor: theme.backgroundElement,
                  borderColor: theme.cardBorder,
                },
              ]}
              onPress={() => {
                setAccountModalVisible(false);
                router.push('/accounts');
              }}
            >
              <Ionicons name="settings-outline" size={16} color={theme.primary} />
              <Text style={[styles.manageAccountsBtnText, { color: theme.primary }]}>
                前往帳號管理（新增或編輯帳號）
              </Text>
              <Ionicons name="chevron-forward" size={14} color={theme.primary} />
            </TouchableOpacity>
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
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderBottomWidth: 1,
    gap: Spacing.two,
  },
  navButtonGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  iconButton: {
    padding: 6,
    borderRadius: 8,
  },
  disabledButton: {
    opacity: 0.35,
  },
  profilePill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    gap: 5,
  },
  profilePillText: {
    fontSize: 13,
    fontWeight: '700',
    flex: 1,
  },
  autoFillButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 18,
    gap: 4,
  },
  autoFillButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  shortcutsBar: {
    paddingVertical: 6,
  },
  shortcutsScrollContent: {
    paddingHorizontal: Spacing.three,
    gap: 8,
  },
  shortcutTag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.04)',
  },
  shortcutTagText: {
    fontSize: 11,
    fontWeight: '600',
  },
  loadingBar: {
    paddingVertical: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  webView: {
    flex: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    maxHeight: '70%',
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
  profileItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: Spacing.three,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 10,
  },
  profileItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileItemName: {
    fontSize: 15,
    fontWeight: '700',
  },
  profileItemId: {
    fontSize: 12,
    marginTop: 2,
  },
  badgePill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgePillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  activeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },
  activeBadgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  emptyProfiles: {
    padding: Spacing.four,
    alignItems: 'center',
  },
  manageAccountsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginTop: 12,
  },
  manageAccountsBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
});
