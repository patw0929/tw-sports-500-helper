import { Ionicons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system/legacy';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Modal,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';
import {
  generateAutoFillScript,
  generateLogoutScript,
  isBase64HtmlContent,
} from '@/services/autofill-engine';
import {
  getActiveProfile,
  getProfiles,
  getSavedDownloadDirUri,
  setActiveProfile,
  setSavedDownloadDirUri,
} from '@/services/storage';
import { UserProfile, maskId } from '@/types/sports500';

const DEFAULT_URL = 'https://500.gov.tw/registrant/access';

const VENDOR_SHORTCUTS = [
  { label: '登入 / 任務', url: 'https://500.gov.tw/registrant/access' },
  { label: '🔍 證書防偽查驗', url: 'https://500.gov.tw/registrant/certificates/verify' },
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

  // 證書防偽查驗: match /certificates/verify or /certificate/verify
  if (shortcutUrl === 'https://500.gov.tw/registrant/certificates/verify') {
    return (
      cleanCurrent.includes('/certificates/verify') || cleanCurrent.includes('/certificate/verify')
    );
  }

  // 活動首頁: only match root /registrant/ or /registrant or /registrant/index.html
  if (shortcutUrl === 'https://500.gov.tw/registrant/') {
    return (
      cleanCurrent === 'https://500.gov.tw/registrant/' ||
      cleanCurrent === 'https://500.gov.tw/registrant' ||
      cleanCurrent === 'https://500.gov.tw/registrant/index.html'
    );
  }

  // 登入 / 任務: match /access, /login, /member/tasks, /register (exclude certificates/verify)
  if (shortcutUrl === 'https://500.gov.tw/registrant/access') {
    if (
      cleanCurrent.includes('/certificates/verify') ||
      cleanCurrent.includes('/certificate/verify')
    ) {
      return false;
    }
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

interface SavedCertificate {
  filePath: string;
  filename: string;
  base64Data?: string;
  fileSize?: string;
  contentType?: string;
  title?: string;
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
  const [savedCert, setSavedCert] = useState<SavedCertificate | null>(null);
  const [isDownloadingCert, setIsDownloadingCert] = useState(false);

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

  const triggerShareFile = useCallback(
    async (filePath: string, filename: string, contentType?: string) => {
      try {
        const isPdf = filename.toLowerCase().endsWith('.pdf') || contentType?.includes('pdf');
        const mimeType = isPdf ? 'application/pdf' : 'image/png';
        const uti = isPdf ? 'com.adobe.pdf' : 'public.png';

        const isAvailable = await Sharing.isAvailableAsync();
        if (isAvailable) {
          await Sharing.shareAsync(filePath, {
            mimeType,
            dialogTitle:
              Platform.OS === 'android'
                ? '建議選「Google Drive PDF 檢視器」或 PDF 閱讀器開啟'
                : `儲存或開啟證書：${filename}`,
            UTI: uti,
          });
        } else {
          await Share.share({
            url: filePath,
            title: filename,
          });
        }
      } catch (shareErr) {
        console.log('Share dismissed or failed:', shareErr);
      }
    },
    []
  );

  const handleSaveDirectlyToDevice = useCallback(async () => {
    if (!savedCert) return;

    if (Platform.OS === 'android') {
      try {
        let directoryUri = await getSavedDownloadDirUri();
        let writeSucceeded = false;

        const cleanBaseName =
          savedCert.filename.replace(/\.[^/.]+$/, '') || '115年揮汗有禮數位完成證書';
        const mime =
          savedCert.contentType?.includes('pdf') || savedCert.filename.endsWith('.pdf')
            ? 'application/pdf'
            : 'image/png';

        const base64Data =
          savedCert.base64Data ||
          (await FileSystem.readAsStringAsync(savedCert.filePath, {
            encoding: FileSystem.EncodingType.Base64,
          }));

        // If previously authorized, try writing directly to that directory without opening picker
        if (directoryUri) {
          try {
            const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
              directoryUri,
              cleanBaseName,
              mime
            );
            await FileSystem.writeAsStringAsync(createdUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            writeSucceeded = true;
          } catch (prevErr) {
            console.log('Previous SAF directory invalid or revoked, requesting again:', prevErr);
            directoryUri = null;
          }
        }

        // If not yet authorized or previous permission expired, open folder picker pre-targeted at Download
        if (!writeSucceeded) {
          const initialUrl = FileSystem.StorageAccessFramework.getUriForDirectoryInRoot('Download');
          const permissions =
            await FileSystem.StorageAccessFramework.requestDirectoryPermissionsAsync(initialUrl);

          if (!permissions.granted) {
            return;
          }

          directoryUri = permissions.directoryUri;
          await setSavedDownloadDirUri(directoryUri);

          const createdUri = await FileSystem.StorageAccessFramework.createFileAsync(
            directoryUri,
            cleanBaseName,
            mime
          );

          await FileSystem.writeAsStringAsync(createdUri, base64Data, {
            encoding: FileSystem.EncodingType.Base64,
          });
        }

        Alert.alert(
          '下載成功',
          `證書「${savedCert.filename}」已成功儲存至手機「下載」資料夾！\n\n💡 建議開啟工具：\n請選取「Google 雲端硬碟 PDF 檢視器」或「Google 檔案」。`,
          [
            {
              text: '立即開啟證書',
              onPress: () =>
                triggerShareFile(savedCert.filePath, savedCert.filename, savedCert.contentType),
            },
            {
              text: '完成',
              style: 'cancel',
            },
          ]
        );
      } catch (err: any) {
        console.error('Android SAF save error:', err);
        Alert.alert('儲存失敗', `無法儲存檔案至手機：${err?.message || '未知錯誤'}`);
      }
    } else {
      // iOS
      await triggerShareFile(savedCert.filePath, savedCert.filename, savedCert.contentType);
    }
  }, [savedCert, triggerShareFile]);

  const handleSaveAndShareCert = useCallback(
    async (fileInfo: {
      dataUrl: string;
      filename: string;
      contentType?: string;
      size?: number;
      title?: string;
    }) => {
      try {
        setIsDownloadingCert(true);
        const cleanFilename = fileInfo.filename?.trim() || '115年揮汗有禮數位完成證書.pdf';
        const lowerFilename = cleanFilename.toLowerCase();

        // Detect HTML file returned due to official site congestion/error
        if (
          lowerFilename.endsWith('.html') ||
          lowerFilename.endsWith('.htm') ||
          fileInfo.contentType?.toLowerCase().includes('text/html') ||
          fileInfo.contentType?.toLowerCase().includes('application/xhtml')
        ) {
          throw new Error('官網目前伺服器壅塞或忙碌中，回傳了 HTML 錯誤頁面而非證書檔案。');
        }

        const base64Data = fileInfo.dataUrl.includes(',')
          ? fileInfo.dataUrl.split(',')[1]
          : fileInfo.dataUrl;

        // Inspect decoded payload to catch HTML error pages disguised as binary/octet-stream
        if (isBase64HtmlContent(base64Data)) {
          throw new Error('下載內容為網頁錯誤訊息而非有效證書檔案（官網系統目前塞車中）。');
        }

        const baseDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
        if (!baseDir) {
          throw new Error('無法存取本機儲存目錄');
        }

        const targetPath = `${baseDir}${cleanFilename}`;
        await FileSystem.writeAsStringAsync(targetPath, base64Data, {
          encoding: FileSystem.EncodingType.Base64,
        });

        // Compute size display
        let sizeDisplay = '';
        if (fileInfo.size && fileInfo.size > 0) {
          sizeDisplay =
            fileInfo.size > 1024 * 1024
              ? `${(fileInfo.size / (1024 * 1024)).toFixed(2)} MB`
              : `${Math.round(fileInfo.size / 1024)} KB`;
        } else {
          const approxBytes = Math.round((base64Data.length * 3) / 4);
          sizeDisplay =
            approxBytes > 1024 * 1024
              ? `${(approxBytes / (1024 * 1024)).toFixed(2)} MB`
              : `${Math.round(approxBytes / 1024)} KB`;
        }

        const certData: SavedCertificate = {
          filePath: targetPath,
          filename: cleanFilename,
          base64Data,
          fileSize: sizeDisplay,
          contentType: fileInfo.contentType,
          title: fileInfo.title || '數位完成證書',
        };

        setIsDownloadingCert(false);
        setSavedCert(certData);

        // Automatically trigger open / preview for the user on both Android and iOS
        await triggerShareFile(targetPath, cleanFilename, fileInfo.contentType);
      } catch (err: any) {
        setIsDownloadingCert(false);
        console.error('Save certificate error:', err);
        const isHtmlOrCongestion =
          err?.message?.includes('HTML') ||
          err?.message?.includes('壅塞') ||
          err?.message?.includes('塞車') ||
          err?.message?.includes('忙碌') ||
          err?.message?.includes('錯誤頁面');

        Alert.alert(
          '證書下載失敗',
          isHtmlOrCongestion
            ? `${err?.message || '取得內容非證書檔案。'}\n\n💡 官網目前可能正值流量尖峰或塞車，建議稍候 1~2 分鐘後重新整理頁面再試。`
            : `無法將證書儲存至裝置：\n${err?.message || '未知錯誤'}`,
          [
            { text: '重新整理', onPress: () => webViewRef.current?.reload() },
            { text: '我知道了', style: 'cancel' },
          ]
        );
      }
    },
    [triggerShareFile]
  );

  const handleShareExistingCert = useCallback(async () => {
    if (!savedCert?.filePath) return;
    await triggerShareFile(savedCert.filePath, savedCert.filename, savedCert.contentType);
  }, [savedCert, triggerShareFile]);

  const handleDownloadCertificate = useCallback((url: string, title?: string) => {
    setIsDownloadingCert(true);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        if (window.downloadCertificateWithAuth) {
          window.downloadCertificateWithAuth('${url}', '${title || '數位完成證書'}');
        }
        true;
      `);
    }
  }, []);

  const handleNavigate = (url: string) => {
    setActiveUrl(url);
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`window.location.href = '${url}'; true;`);
    }
  };

  const injectedScript = generateAutoFillScript(activeUser);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right', 'bottom']}
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
        setSupportMultipleWindows={true}
        allowsInlineMediaPlayback={true}
        userAgent={
          Platform.OS === 'android'
            ? 'Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Mobile Safari/537.36'
            : undefined
        }
        onLoadStart={() => setIsLoading(true)}
        onLoadEnd={() => setIsLoading(false)}
        onOpenWindow={(event) => {
          const targetUrl = event.nativeEvent.targetUrl;
          if (targetUrl) {
            console.log('WebView onOpenWindow:', targetUrl);
            const lowerTarget = targetUrl.toLowerCase();
            const isVerify =
              lowerTarget.includes('verify') ||
              lowerTarget.includes('verification') ||
              lowerTarget.includes('check');

            if (
              !isVerify &&
              (lowerTarget.includes('certificate') || lowerTarget.includes('/download')) &&
              !lowerTarget.endsWith('.html') &&
              !lowerTarget.endsWith('.htm')
            ) {
              handleDownloadCertificate(targetUrl, '數位完成證書');
            } else if (
              targetUrl.startsWith('http://500.gov.tw/') ||
              targetUrl.startsWith('https://500.gov.tw/')
            ) {
              const secureUrl = targetUrl.replace('http://500.gov.tw/', 'https://500.gov.tw/');
              webViewRef.current?.injectJavaScript(`window.location.href = '${secureUrl}'; true;`);
            }
          }
        }}
        onFileDownload={({ nativeEvent: { downloadUrl } }) => {
          if (downloadUrl) {
            console.log('WebView onFileDownload:', downloadUrl);
            const lowerUrl = downloadUrl.toLowerCase();
            const isVerify =
              lowerUrl.includes('verify') ||
              lowerUrl.includes('verification') ||
              lowerUrl.includes('check');

            if (isVerify) {
              const secureUrl = downloadUrl.replace('http://500.gov.tw/', 'https://500.gov.tw/');
              webViewRef.current?.injectJavaScript(`window.location.href = '${secureUrl}'; true;`);
            } else if (
              lowerUrl.endsWith('.html') ||
              lowerUrl.endsWith('.htm') ||
              lowerUrl.includes('/error') ||
              lowerUrl.includes('/busy')
            ) {
              // Intercept error HTML pages downloaded on server congestion
              setIsDownloadingCert(false);
              Alert.alert(
                '證書下載失敗',
                '官網目前伺服器壅塞，回傳了網頁錯誤檔案而非證書。\n\n建議稍候片刻重新整理頁面後再試。',
                [
                  { text: '重新整理', onPress: () => webViewRef.current?.reload() },
                  { text: '我知道了', style: 'cancel' },
                ]
              );
            } else {
              handleDownloadCertificate(downloadUrl, '數位完成證書');
            }
          }
        }}
        onShouldStartLoadWithRequest={(request) => {
          // Fix 500.gov.tw backend HTTP cleartext redirects on Android
          if (request.url.startsWith('http://500.gov.tw/')) {
            const secureUrl = request.url.replace('http://500.gov.tw/', 'https://500.gov.tw/');
            if (webViewRef.current) {
              webViewRef.current?.injectJavaScript(`window.location.href = '${secureUrl}'; true;`);
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
            if (data.type === 'CERT_FETCH_START') {
              setIsDownloadingCert(true);
            } else if (data.type === 'CERT_DOWNLOADED') {
              handleSaveAndShareCert({
                dataUrl: data.dataUrl,
                filename: data.filename || '115年揮汗有禮數位完成證書.pdf',
                contentType: data.contentType,
                size: data.size,
                title: data.title,
              });
            } else if (data.type === 'CERT_FETCH_ERROR') {
              setIsDownloadingCert(false);
              const isCongestion =
                data.isHtmlResponse ||
                data.error?.includes('HTML') ||
                data.error?.includes('壅塞') ||
                data.error?.includes('塞車') ||
                data.error?.includes('忙碌') ||
                data.error?.includes('逾時');

              Alert.alert(
                '證書下載失敗',
                isCongestion
                  ? `${data.error || '無法取得證書檔案。'}\n\n💡 官網目前可能正處於流量尖峰，建議稍候 1~2 分鐘後重新整理頁面再試。`
                  : `無法取得證書檔案（${data.error || '連線錯誤'}）。\n\n建議重新整理頁面後再試一次。`,
                [
                  { text: '重新整理', onPress: () => webViewRef.current?.reload() },
                  { text: '我知道了', style: 'cancel' },
                ]
              );
            } else if (data.type === 'DOWNLOAD_OR_LINK') {
              const lowerUrl = (data.url || '').toLowerCase();
              const isVerify =
                lowerUrl.includes('verify') ||
                lowerUrl.includes('verification') ||
                lowerUrl.includes('check') ||
                (data.title &&
                  (data.title.includes('查驗') ||
                    data.title.includes('防偽') ||
                    data.title.includes('驗證')));

              const isHtmlFile =
                lowerUrl.endsWith('.html') ||
                lowerUrl.endsWith('.htm') ||
                (data.filename &&
                  (data.filename.toLowerCase().endsWith('.html') ||
                    data.filename.toLowerCase().endsWith('.htm')));

              if (
                !isVerify &&
                (data.title?.includes('證書') || lowerUrl.includes('certificate')) &&
                isHtmlFile
              ) {
                setIsDownloadingCert(false);
                Alert.alert(
                  '證書下載失敗',
                  '官網目前伺服器壅塞，回傳了 HTML 錯誤網頁而非證書。\n\n建議稍候片刻重新整理後再試。',
                  [
                    { text: '重新整理', onPress: () => webViewRef.current?.reload() },
                    { text: '我知道了', style: 'cancel' },
                  ]
                );
              } else if (
                !isVerify &&
                data.url &&
                (data.url.includes('certificate') || data.url.includes('/download'))
              ) {
                handleDownloadCertificate(data.url, data.title);
              } else if (
                data.url &&
                (data.url.startsWith('https://500.gov.tw') ||
                  data.url.startsWith('http://500.gov.tw'))
              ) {
                const secureUrl = data.url.replace('http://500.gov.tw/', 'https://500.gov.tw/');
                webViewRef.current?.injectJavaScript(
                  `window.location.href = '${secureUrl}'; true;`
                );
              }
            } else if (data.type === 'WINDOW_PRINT') {
              Alert.alert(
                '證書取得提示',
                '請直接點擊頁面上的「下載證書」按鈕，小幫手將為您自動下載 PDF 證書並儲存至裝置。'
              );
            }
          } catch {
            // Ignore
          }
        }}
      />

      {/* Certificate Saved Modal (Safe Native UI) */}
      <Modal
        visible={!!savedCert}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setSavedCert(null)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity
            style={StyleSheet.absoluteFill}
            activeOpacity={1}
            onPress={() => setSavedCert(null)}
          />
          <View
            style={[
              styles.certModalCard,
              {
                backgroundColor: theme.cardBackground,
                borderColor: theme.cardBorder,
                paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : 24,
              },
            ]}
          >
            {/* Certificate Header / Icon */}
            <View style={styles.certIconContainer}>
              <View style={[styles.certIconCircle, { backgroundColor: theme.primaryLight }]}>
                <Ionicons name="ribbon" size={44} color={theme.primary} />
              </View>
            </View>

            <Text style={[styles.certCardTitle, { color: theme.text }]}>數位完成證書已下載</Text>

            <View style={[styles.certBadgePill, { backgroundColor: '#e6f4ea' }]}>
              <Ionicons name="checkmark-circle" size={14} color="#137333" />
              <Text style={styles.certBadgePillText}>審核通過・已備妥檔案</Text>
            </View>

            {/* File info box */}
            <View
              style={[
                styles.certFileInfoBox,
                { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
              ]}
            >
              <Ionicons name="document-text" size={26} color={theme.primary} />
              <View style={{ flex: 1, marginLeft: 10 }}>
                <Text style={[styles.certFileName, { color: theme.text }]} numberOfLines={1}>
                  {savedCert?.filename || '115年揮汗有禮數位完成證書.pdf'}
                </Text>
                <Text style={[styles.certFileSize, { color: theme.textSecondary }]}>
                  {savedCert?.fileSize ? `檔案大小：${savedCert.fileSize} (PDF)` : 'PDF 格式文件'}
                </Text>
              </View>
            </View>

            {Platform.OS === 'android' ? (
              <View
                style={[
                  styles.certGuideBox,
                  {
                    backgroundColor: theme.primaryLight,
                    borderColor: theme.primary,
                  },
                ]}
              >
                <View style={styles.certGuideHeader}>
                  <Ionicons name="information-circle" size={17} color={theme.primary} />
                  <Text style={[styles.certGuideTitle, { color: theme.primary }]}>
                    推薦開啟工具（點選「立即開啟」後）：
                  </Text>
                </View>

                <View style={styles.certGuideList}>
                  <View style={styles.certGuideItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#137333" />
                    <Text style={[styles.certGuideItemText, { color: theme.text }]}>
                      首選：<Text style={{ fontWeight: '800' }}>Google 雲端硬碟 PDF 檢視器</Text>
                      （秒開、可直接列印）
                    </Text>
                  </View>
                  <View style={styles.certGuideItem}>
                    <Ionicons name="checkmark-circle" size={14} color="#137333" />
                    <Text style={[styles.certGuideItemText, { color: theme.text }]}>
                      備選：<Text style={{ fontWeight: '800' }}>Google 檔案 (Files)</Text> 或{' '}
                      <Text style={{ fontWeight: '800' }}>Adobe Acrobat</Text>
                    </Text>
                  </View>
                </View>

                <Text style={[styles.certGuideNote, { color: theme.textMuted }]}>
                  ※ Chrome 瀏覽器本身不支援閱讀 PDF 檔案，請選取上述工具即可順利預覽！
                </Text>
              </View>
            ) : (
              <Text style={[styles.certCardHint, { color: theme.textMuted }]}>
                證書檔案已下載備妥！您可以點擊下方按鈕存入 iOS「檔案」或分享。
              </Text>
            )}

            {/* Action buttons */}
            <View style={styles.certCardActions}>
              {Platform.OS === 'android' ? (
                <>
                  <TouchableOpacity
                    style={[styles.certPrimaryBtn, { backgroundColor: theme.primary }]}
                    onPress={handleShareExistingCert}
                  >
                    <Ionicons name="eye-outline" size={20} color="#ffffff" />
                    <Text style={styles.certPrimaryBtnText}>立即開啟 / 檢視證書</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.certSecondaryBtn,
                      { borderColor: theme.primary, backgroundColor: theme.primaryLight },
                    ]}
                    onPress={handleSaveDirectlyToDevice}
                  >
                    <Ionicons name="download-outline" size={18} color={theme.primary} />
                    <Text
                      style={[
                        styles.certSecondaryBtnText,
                        { color: theme.primary, fontWeight: '700' },
                      ]}
                    >
                      另存至手機「下載」資料夾
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.certSecondaryBtn,
                      { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement },
                    ]}
                    onPress={() => setSavedCert(null)}
                  >
                    <Text style={[styles.certSecondaryBtnText, { color: theme.textSecondary }]}>
                      完成關閉
                    </Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <TouchableOpacity
                    style={[styles.certPrimaryBtn, { backgroundColor: theme.primary }]}
                    onPress={handleShareExistingCert}
                  >
                    <Ionicons name="share-outline" size={20} color="#ffffff" />
                    <Text style={styles.certPrimaryBtnText}>開啟證書 / 儲存至「檔案」</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.certSecondaryBtn,
                      { borderColor: theme.cardBorder, backgroundColor: theme.backgroundElement },
                    ]}
                    onPress={() => setSavedCert(null)}
                  >
                    <Text style={[styles.certSecondaryBtnText, { color: theme.textSecondary }]}>
                      完成關閉
                    </Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          </View>
        </View>
      </Modal>

      {/* Downloading Certificate Overlay */}
      {isDownloadingCert && (
        <View style={styles.certDownloadingOverlay}>
          <View style={[styles.certDownloadingBox, { backgroundColor: theme.cardBackground }]}>
            <ActivityIndicator size="large" color={theme.primary} />
            <Text style={[styles.certDownloadingText, { color: theme.text }]}>
              正在使用登入身分下載證書...
            </Text>
          </View>
        </View>
      )}

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
  certModalCard: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.four,
    alignItems: 'center',
    borderTopWidth: 1,
  },
  certIconContainer: {
    marginVertical: 10,
    alignItems: 'center',
  },
  certIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  certCardTitle: {
    fontSize: 20,
    fontWeight: '800',
    marginTop: 6,
    textAlign: 'center',
  },
  certBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    gap: 5,
    marginTop: 8,
    marginBottom: 16,
  },
  certBadgePillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#137333',
  },
  certFileInfoBox: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 12,
  },
  certFileName: {
    fontSize: 14,
    fontWeight: '700',
  },
  certFileSize: {
    fontSize: 12,
    marginTop: 2,
  },
  certCardHint: {
    fontSize: 12,
    lineHeight: 18,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  certGuideBox: {
    width: '100%',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  certGuideHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  certGuideTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  certGuideList: {
    gap: 4,
    marginBottom: 6,
  },
  certGuideItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  certGuideItemText: {
    fontSize: 12,
    lineHeight: 18,
  },
  certGuideNote: {
    fontSize: 11,
    lineHeight: 16,
  },
  certCardActions: {
    width: '100%',
    gap: 10,
  },
  certPrimaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
  },
  certPrimaryBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  certSecondaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    gap: 6,
  },
  certSecondaryBtnText: {
    fontSize: 14,
    fontWeight: '600',
  },
  certDownloadingOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  certDownloadingBox: {
    paddingVertical: 20,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignItems: 'center',
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
    elevation: 8,
  },
  certDownloadingText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
