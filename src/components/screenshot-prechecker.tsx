import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebView } from 'react-native-webview';

import { Spacing } from '@/constants/theme';
import { useTheme, useThemeContext } from '@/hooks/use-theme';
import { getOcrRunnerHtml } from '@/services/ocr-runner-html';
import {
  ELIGIBILITY_THRESHOLDS,
  evaluateFrontendEligibility,
  getReasonCodeInfo,
  parseSportsRecordText,
  PrecheckResult,
} from '@/services/precheck-engine';

interface SelectedImageState {
  uri: string;
  width?: number;
  height?: number;
}

export function ScreenshotPrechecker() {
  const theme = useTheme();
  const { preference } = useThemeContext();
  const router = useRouter();

  const isDark = preference === 'dark';

  const [selectedImage, setSelectedImage] = useState<SelectedImageState | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [progressText, setProgressText] = useState('');
  const [progressPercent, setProgressPercent] = useState(0);
  const [result, setResult] = useState<PrecheckResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showRawOcr, setShowRawOcr] = useState(false);

  const webViewRef = useRef<WebView>(null);
  const currentReqIdRef = useRef<string>('');

  // 根據當前主題動態生成與 Native 樣式 100% 同步的 HTML 選取器網頁
  const runnerHtml = useMemo(() => {
    return getOcrRunnerHtml({
      isDark,
      primary: theme.primary,
      cardBg: theme.cardBackground,
      text: theme.text,
      textSecondary: theme.textSecondary,
      cardBorder: theme.cardBorder,
      backgroundElement: theme.backgroundElement,
    });
  }, [isDark, theme]);

  const handleWebViewMessage = useCallback((event: { nativeEvent: { data: string } }) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);

      if (data.type === 'RUNNER_READY') {
        console.log('[Prechecker] OCR HTML5 Runner is ready');
      } else if (data.type === 'STATUS') {
        if (data.status === 'READING_FILE') {
          setIsAnalyzing(true);
          setResult(null);
          setErrorMessage(null);
          setProgressText('正在讀取截圖檔案...');
          setProgressPercent(10);
        } else if (data.status === 'LOADING_ENGINE') {
          setProgressText('正在載入 Tesseract OCR 辨識核心...');
          setProgressPercent(25);
        } else if (data.status === 'ENGINE_READY') {
          setProgressText('辨識引擎準備完成，開始分析截圖...');
          setProgressPercent(40);
        }
      } else if (data.type === 'IMAGE_SELECTED') {
        // 從 HTML5 file input 接收到圖片
        if (data.id) currentReqIdRef.current = data.id;
        setSelectedImage({
          uri: data.dataUrl,
        });
        setIsAnalyzing(true);
        setResult(null);
        setErrorMessage(null);
        setProgressText('已選取截圖，正在準備分析...');
        setProgressPercent(15);
      } else if (data.type === 'PROGRESS') {
        if (data.status === 'PREPARING_IMAGE') {
          setProgressText('正在優化截圖解析度與尺寸...');
          setProgressPercent(30);
        } else if (data.status === 'recognizing text') {
          const prog = data.progress ? Math.round(data.progress * 60) : 0;
          setProgressText(`正在逐行辨識運動紀錄文字... (${Math.min(95, 35 + prog)}%)`);
          setProgressPercent(Math.min(95, 35 + prog));
        }
      } else if (data.type === 'OCR_DONE') {
        if (data.id && data.id !== currentReqIdRef.current) return;

        const rawText = data.rawText || '';
        const meanConfidence = data.meanConfidence;
        console.log('[Prechecker] OCR_DONE received, text length:', rawText.length);
        console.log('[Prechecker] OCR RAW TEXT:\n' + rawText);

        // 1. 執行文字正則剖析 (日期、時間、距離、步數、App)
        const fields = parseSportsRecordText(rawText);
        console.log('[Prechecker] Parsed date:', JSON.stringify(fields.date));

        // 2. 執行官方門檻審查評估
        const eligibility = evaluateFrontendEligibility(rawText, meanConfidence);
        console.log(
          '[Prechecker] Eligibility status:',
          eligibility.status,
          'matchedRule:',
          eligibility.matchedRuleCode
        );

        // 3. 匯總預檢狀態
        const codes: string[] = [];
        if (!fields.date.found) {
          if (fields.dateRange?.found) {
            codes.push('DATE_RANGE_NOT_ALLOWED');
          } else {
            codes.push('MISSING_DATE');
          }
        }
        if (!fields.duration.found && !fields.distanceOrSteps.found)
          codes.push('MISSING_ACTIVITY_METRIC');
        if (!fields.activityOrRoute.found) codes.push('MISSING_ACTIVITY_OR_ROUTE_HINT');

        let state: PrecheckResult['state'] = 'INCONCLUSIVE';
        const isNotCurrentPeriod =
          eligibility.observed.periodCheck && !eligibility.observed.periodCheck.isCurrentPeriod;

        if (eligibility.status === 'LIKELY_QUALIFIED') {
          if (isNotCurrentPeriod) {
            state = 'WARN';
            codes.push('DATE_NOT_CURRENT_PERIOD');
          } else {
            state = 'READY';
          }
          codes.push(eligibility.matchedRuleCode || 'MATCHED_THRESHOLD');
          if (eligibility.isDivergent) {
            codes.push('OFFICIAL_PRECHECK_MAY_FLAG');
          }
        } else if (eligibility.status === 'LIKELY_NOT_QUALIFIED') {
          state = 'WARN';
          if (isNotCurrentPeriod) {
            codes.push('DATE_NOT_CURRENT_PERIOD');
            if (eligibility.matchedRuleCode) {
              codes.push(eligibility.matchedRuleCode);
            }
          } else {
            codes.push('BELOW_ALL_ELIGIBILITY_THRESHOLDS');
          }
        } else {
          state =
            fields.date.found || fields.duration.found || fields.distanceOrSteps.found
              ? 'WARN'
              : 'INCONCLUSIVE';
          if (eligibility.reasonCodes.includes('ONLY_AGGREGATE_VALUES_FOUND')) {
            codes.push('ONLY_AGGREGATE_VALUES_FOUND');
          }
          if (eligibility.reasonCodes.includes('LOW_OCR_CONFIDENCE')) {
            codes.push('LOW_OCR_CONFIDENCE');
          }
          if (isNotCurrentPeriod) {
            codes.push('DATE_NOT_CURRENT_PERIOD');
          }
        }

        const precheckResult: PrecheckResult = {
          contractVersion: 'front-ocr-precheck/1.0',
          state,
          userMaySubmit: true,
          officialDecision: false,
          codes,
          fields,
          eligibility,
          officialEligibility: eligibility.officialEligibility,
          isDivergent: eligibility.isDivergent,
          divergenceReason: eligibility.divergenceReason,
          ocr: {
            engineId: 'tesseract.js/7.0.0',
            durationMs: data.durationMs || 0,
            meanConfidence: meanConfidence ?? null,
            rawText,
          },
        };

        setResult(precheckResult);
        setIsAnalyzing(false);
        setProgressPercent(100);
      } else if (data.type === 'PRECHECK_ERROR') {
        if (data.id && data.id !== currentReqIdRef.current) return;
        setErrorMessage(data.error || '文字辨識失敗，請確認截圖是否清晰後再試。');
        setIsAnalyzing(false);
      }
    } catch (e) {
      console.error('[Prechecker] message parse error:', e);
    }
  }, []);

  const handleResetImage = () => {
    setSelectedImage(null);
    setResult(null);
    setErrorMessage(null);
    setIsAnalyzing(false);
  };

  const handleGoToBrowser = () => {
    router.push({
      pathname: '/browser',
      params: {
        initialUrl: 'https://500.gov.tw/registrant/access',
      },
    });
  };

  return (
    <View style={styles.container}>
      {/* 頂部功能引言 */}
      <View
        style={[
          styles.introCard,
          { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
        ]}
      >
        <View style={styles.introHeaderRow}>
          <View style={[styles.introIconCircle, { backgroundColor: theme.primaryLight }]}>
            <Ionicons name="scan-outline" size={20} color={theme.primary} />
          </View>
          <View style={styles.introHeaderText}>
            <Text style={[styles.introTitle, { color: theme.text }]}>運動紀錄截圖預先檢查</Text>
            <Text style={[styles.introSub, { color: theme.textSecondary }]}>
              上傳只有一次機會，先幫您做基本檢查！
            </Text>
          </View>
        </View>

        {/* 門檻規則快速指引 */}
        <View style={styles.criteriaGrid}>
          <View style={[styles.criterionPill, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.criterionLabel, { color: theme.textSecondary }]}>時長</Text>
            <Text style={[styles.criterionVal, { color: theme.primary }]}>≥ 30 分鐘</Text>
          </View>
          <View style={[styles.criterionPill, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.criterionLabel, { color: theme.textSecondary }]}>步數</Text>
            <Text style={[styles.criterionVal, { color: theme.primary }]}>≥ 8,000 步</Text>
          </View>
          <View style={[styles.criterionPill, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.criterionLabel, { color: theme.textSecondary }]}>路跑/走</Text>
            <Text style={[styles.criterionVal, { color: theme.primary }]}>≥ 5.0 km</Text>
          </View>
          <View style={[styles.criterionPill, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.criterionLabel, { color: theme.textSecondary }]}>單車</Text>
            <Text style={[styles.criterionVal, { color: theme.primary }]}>≥ 15.0 km</Text>
          </View>
        </View>
      </View>

      {/* 方案 B：可視化 HTML5 檔案選取卡片（無選圖時可見；選圖後作為背景 Runner 運作） */}
      <View style={selectedImage ? styles.hiddenWebViewContainer : styles.visibleWebViewContainer}>
        <WebView
          key={`ocr-runner-${isDark ? 'dark' : 'light'}-${runnerHtml.length}`}
          ref={webViewRef}
          style={styles.webViewFill}
          originWhitelist={['*']}
          source={{ html: runnerHtml }}
          onMessage={handleWebViewMessage}
          scrollEnabled={false}
          nestedScrollEnabled={false}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowFileAccess={true}
          allowFileAccessFromFileURLs={true}
          allowUniversalAccessFromFileURLs={true}
          mixedContentMode="always"
        />
      </View>

      {/* 已選取截圖後的預覽區塊 */}
      {selectedImage && (
        <View
          style={[
            styles.imagePreviewCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.primary },
          ]}
        >
          <Image
            source={{ uri: selectedImage.uri }}
            style={styles.imagePreview}
            resizeMode="contain"
          />
          <TouchableOpacity
            style={[styles.changeImageBadge, { backgroundColor: 'rgba(0,0,0,0.75)' }]}
            activeOpacity={0.8}
            onPress={handleResetImage}
          >
            <Ionicons name="camera-reverse-outline" size={16} color="#ffffff" />
            <Text style={styles.changeImageText}>點擊更換照片</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* 辨識中進度條 */}
      {isAnalyzing && (
        <View
          style={[
            styles.statusCard,
            { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
          ]}
        >
          <ActivityIndicator size="small" color={theme.primary} style={{ marginBottom: 10 }} />
          <Text style={[styles.analyzingText, { color: theme.text }]}>{progressText}</Text>
          <View style={[styles.progressBarBg, { backgroundColor: theme.backgroundElement }]}>
            <View
              style={[
                styles.progressBarFill,
                { backgroundColor: theme.primary, width: `${Math.max(5, progressPercent)}%` },
              ]}
            />
          </View>
          <Text style={[styles.progressPercentText, { color: theme.textSecondary }]}>
            繁中與英文 OCR 模型分析中，請稍候...
          </Text>
        </View>
      )}

      {/* 錯誤訊息 */}
      {errorMessage && !isAnalyzing && (
        <View
          style={[
            styles.errorCard,
            { backgroundColor: theme.dangerLight, borderColor: theme.danger },
          ]}
        >
          <Ionicons name="alert-circle" size={20} color={theme.danger} style={{ marginRight: 8 }} />
          <Text style={[styles.errorText, { color: theme.danger }]}>{errorMessage}</Text>
        </View>
      )}

      {/* 辨識診斷結果卡片 */}
      {result && !isAnalyzing && (
        <View style={styles.resultContainer}>
          {/* 1. 核心結論大卡片 */}
          <View
            style={[
              styles.verdictCard,
              result.state === 'READY'
                ? { backgroundColor: theme.successLight, borderColor: theme.success }
                : result.state === 'WARN'
                  ? { backgroundColor: theme.warningLight, borderColor: theme.warning }
                  : { backgroundColor: theme.dangerLight, borderColor: theme.danger },
            ]}
          >
            <View style={styles.verdictHeader}>
              <Ionicons
                name={
                  result.state === 'READY'
                    ? 'checkmark-circle'
                    : result.state === 'WARN'
                      ? 'alert-circle'
                      : 'close-circle'
                }
                size={36}
                color={
                  result.state === 'READY'
                    ? theme.success
                    : result.state === 'WARN'
                      ? theme.warning
                      : theme.danger
                }
              />
              <View style={styles.verdictTitleGroup}>
                <Text
                  style={[
                    styles.verdictTitle,
                    {
                      color:
                        result.state === 'READY'
                          ? theme.success
                          : result.state === 'WARN'
                            ? theme.warning
                            : theme.danger,
                    },
                  ]}
                >
                  {result.state === 'READY'
                    ? result.isDivergent
                      ? '預檢合格！符合揮汗有禮標準（官網自動判定可能不通過）'
                      : '預檢合格！符合揮汗有禮標準'
                    : result.state === 'WARN'
                      ? result.eligibility.observed.periodCheck &&
                        !result.eligibility.observed.periodCheck.isCurrentPeriod
                        ? '運動數據達標，但非當週運動紀錄（不符本期任務標準）'
                        : '截圖存有疑慮（需注意退件風險）'
                      : '截圖未達合格標準'}
                </Text>
                <Text style={[styles.verdictSub, { color: theme.textSecondary }]}>
                  {result.state === 'READY'
                    ? result.isDivergent
                      ? '已偵測到達標數值且為當週紀錄。由於官網自動判定演算法較嚴格，系統自動判定可能審核不通過，但仍可正常送出，可能需待人工審核才會通過。'
                      : '已偵測到達標數值且為當週紀錄，初步檢查通過，請再次確認無誤後前往官網上傳。'
                    : result.state === 'WARN'
                      ? result.eligibility.observed.periodCheck &&
                        !result.eligibility.observed.periodCheck.isCurrentPeriod
                        ? `截圖日期為 ${result.eligibility.observed.periodCheck.screenshotDate}${
                            result.eligibility.observed.periodCheck.matchedPeriodLabel
                              ? `（屬 ${result.eligibility.observed.periodCheck.matchedPeriodLabel}）`
                              : ''
                          }，非當前活動期別（${result.eligibility.observed.periodCheck.currentPeriodLabel}）。依運動部規定不可跨期補傳，建議換上本週紀錄。`
                        : '請檢視下方警示項目，補正後再上傳以免遭官方退件審查。'
                      : '觀測到的各項數據均未達 115 年加碼活動任務標準。'}
                </Text>
              </View>
            </View>

            {/* 達標項目徽章 */}
            {result.eligibility.matchedRuleCode && (
              <View style={[styles.matchedBadge, { backgroundColor: theme.cardBackground }]}>
                <Ionicons
                  name="ribbon-outline"
                  size={16}
                  color={theme.success}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.matchedBadgeText, { color: theme.text }]}>
                  {getReasonCodeInfo(result.eligibility.matchedRuleCode).label}
                </Text>
              </View>
            )}
          </View>

          {/* 非當週特別警告橫幅 */}
          {result.eligibility.observed.periodCheck &&
            !result.eligibility.observed.periodCheck.isCurrentPeriod && (
              <View
                style={[
                  styles.periodWarningBanner,
                  {
                    backgroundColor: theme.warningLight,
                    borderColor: theme.warning,
                  },
                ]}
              >
                <View style={styles.bannerHeaderRow}>
                  <Ionicons
                    name="calendar"
                    size={18}
                    color={theme.warning}
                    style={{ marginRight: 6 }}
                  />
                  <Text style={[styles.bannerTitle, { color: theme.warning }]}>
                    非當週運動紀錄警示
                  </Text>
                </View>
                <Text style={[styles.bannerText, { color: theme.text }]}>
                  截圖日期為{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {result.eligibility.observed.periodCheck.screenshotDate}
                  </Text>
                  {result.eligibility.observed.periodCheck.matchedPeriodLabel
                    ? `（屬於 ${result.eligibility.observed.periodCheck.matchedPeriodLabel}）`
                    : ''}
                  ，而當前活動進行至{' '}
                  <Text style={{ fontWeight: '700' }}>
                    {result.eligibility.observed.periodCheck.currentPeriodLabel}
                  </Text>
                  。
                </Text>
                <Text style={[styles.bannerSubText, { color: theme.textSecondary }]}>
                  運動部活動規範明定「當週紀錄限當週單日上傳，逾期不可跨期補傳」，現在上傳該紀錄極高機率遭官方審核退件。
                </Text>
              </View>
            )}

          {/* 雙軌演算法對照說明卡片 */}
          {result.isDivergent && (
            <View
              style={[
                styles.divergentBanner,
                {
                  backgroundColor: theme.cardBackground,
                  borderColor: theme.cardBorder,
                },
              ]}
            >
              <View style={styles.bannerHeaderRow}>
                <Ionicons
                  name="sparkles"
                  size={18}
                  color={theme.primary}
                  style={{ marginRight: 6 }}
                />
                <Text style={[styles.bannerTitle, { color: theme.primary }]}>雙軌審核對照說明</Text>
              </View>
              <View style={styles.divergentItemRow}>
                <Text
                  style={[
                    styles.divergentItemTag,
                    {
                      color:
                        result.eligibility.observed.periodCheck &&
                        !result.eligibility.observed.periodCheck.isCurrentPeriod
                          ? theme.warning
                          : theme.success,
                    },
                  ]}
                >
                  🌟 本 App 的改良版預檢：
                </Text>
                <Text style={[styles.divergentItemText, { color: theme.text }]}>
                  {result.eligibility.observed.periodCheck &&
                  !result.eligibility.observed.periodCheck.isCurrentPeriod
                    ? `不符當週任務標準（數據已達標，但日期屬於 ${
                        result.eligibility.observed.periodCheck.matchedPeriodName || '非當週'
                      }，非當前活動期別）`
                    : '符合任務標準（已精準辨識達標數據且為當週紀錄）'}
                </Text>
              </View>
              <View style={[styles.divergentItemRow, { marginTop: 4 }]}>
                <Text style={[styles.divergentItemTag, { color: theme.warning }]}>
                  🏛️ 官網自動審核判定：
                </Text>
                <Text style={[styles.divergentItemText, { color: theme.textSecondary }]}>
                  {result.eligibility.observed.periodCheck &&
                  !result.eligibility.observed.periodCheck.isCurrentPeriod
                    ? '系統自動判定可能審核不通過（未辨識出有效數據或非當週紀錄，逾期官方將退件審核）'
                    : '系統自動判定可能審核不通過（因格式限制，但仍可正常送出，可能需待人工審核才會通過）'}
                </Text>
              </View>
            </View>
          )}

          {/* 2. 數據指標詳細檢核表 */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: theme.text }]}>📊 截圖觀測數值清單</Text>

            {/* 日期檢視 */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <Ionicons
                  name={
                    result.eligibility.observed.periodCheck &&
                    !result.eligibility.observed.periodCheck.isCurrentPeriod
                      ? 'alert-circle'
                      : result.eligibility.observed.dateFound
                        ? 'calendar'
                        : result.fields.dateRange?.found
                          ? 'close-circle'
                          : 'calendar-outline'
                  }
                  size={18}
                  color={
                    result.eligibility.observed.periodCheck &&
                    !result.eligibility.observed.periodCheck.isCurrentPeriod
                      ? theme.warning
                      : result.eligibility.observed.dateFound
                        ? theme.success
                        : result.fields.dateRange?.found
                          ? theme.danger
                          : theme.warning
                  }
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.metricName, { color: theme.text }]}>運動日期</Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  {
                    color:
                      result.eligibility.observed.periodCheck &&
                      !result.eligibility.observed.periodCheck.isCurrentPeriod
                        ? theme.warning
                        : result.eligibility.observed.dateFound
                          ? theme.text
                          : result.fields.dateRange?.found
                            ? theme.danger
                            : theme.warning,
                    fontWeight:
                      result.fields.dateRange?.found ||
                      (result.eligibility.observed.periodCheck &&
                        !result.eligibility.observed.periodCheck.isCurrentPeriod)
                        ? '600'
                        : '400',
                  },
                ]}
              >
                {result.fields.date.found
                  ? result.eligibility.observed.periodCheck &&
                    !result.eligibility.observed.periodCheck.isCurrentPeriod
                    ? `${result.fields.date.matches[0]?.value}（非當週：${
                        result.eligibility.observed.periodCheck.matchedPeriodName ||
                        result.eligibility.observed.periodCheck.matchedPeriodLabel ||
                        '非活動期'
                      }）`
                    : result.fields.date.matches[0]?.value
                  : result.fields.dateRange?.found
                    ? `日期錯誤：非單日（${result.fields.dateRange.matches[0]?.value}）`
                    : '未偵測到日期（易遭退件）'}
              </Text>
            </View>

            {/* 運動時長檢視 */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <Ionicons
                  name={
                    (result.eligibility.observed.durationMinutes || 0) >=
                    ELIGIBILITY_THRESHOLDS.durationMinutes
                      ? 'checkmark-circle'
                      : 'time-outline'
                  }
                  size={18}
                  color={
                    (result.eligibility.observed.durationMinutes || 0) >=
                    ELIGIBILITY_THRESHOLDS.durationMinutes
                      ? theme.success
                      : theme.textMuted
                  }
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.metricName, { color: theme.text }]}>
                  運動時長（門檻 30 分）
                </Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  (result.eligibility.observed.durationMinutes || 0) >=
                  ELIGIBILITY_THRESHOLDS.durationMinutes
                    ? { color: theme.success, fontWeight: '700' }
                    : { color: theme.textSecondary },
                ]}
              >
                {result.eligibility.observed.durationMinutes !== null
                  ? `${result.eligibility.observed.durationMinutes} 分鐘`
                  : '未觀測'}
              </Text>
            </View>

            {/* 步數檢視 */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <Ionicons
                  name={
                    (result.eligibility.observed.steps || 0) >= ELIGIBILITY_THRESHOLDS.dailySteps
                      ? 'checkmark-circle'
                      : 'footsteps-outline'
                  }
                  size={18}
                  color={
                    (result.eligibility.observed.steps || 0) >= ELIGIBILITY_THRESHOLDS.dailySteps
                      ? theme.success
                      : theme.textMuted
                  }
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.metricName, { color: theme.text }]}>
                  單日步數（門檻 8,000 步）
                </Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  (result.eligibility.observed.steps || 0) >= ELIGIBILITY_THRESHOLDS.dailySteps
                    ? { color: theme.success, fontWeight: '700' }
                    : { color: theme.textSecondary },
                ]}
              >
                {result.eligibility.observed.steps !== null
                  ? `${result.eligibility.observed.steps.toLocaleString()} 步`
                  : '未觀測'}
              </Text>
            </View>

            {/* 距離檢視 */}
            <View style={styles.metricRow}>
              <View style={styles.metricLabelCol}>
                <Ionicons
                  name={
                    (result.eligibility.observed.distanceKm || 0) >=
                    ELIGIBILITY_THRESHOLDS.walkRunKm
                      ? 'checkmark-circle'
                      : 'navigate-outline'
                  }
                  size={18}
                  color={
                    (result.eligibility.observed.distanceKm || 0) >=
                    ELIGIBILITY_THRESHOLDS.walkRunKm
                      ? theme.success
                      : theme.textMuted
                  }
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.metricName, { color: theme.text }]}>
                  運動距離（跑 5km / 騎 15km）
                </Text>
              </View>
              <Text
                style={[
                  styles.metricValue,
                  (result.eligibility.observed.distanceKm || 0) >= ELIGIBILITY_THRESHOLDS.walkRunKm
                    ? { color: theme.success, fontWeight: '700' }
                    : { color: theme.textSecondary },
                ]}
              >
                {result.eligibility.observed.distanceKm !== null
                  ? `${result.eligibility.observed.distanceKm} km`
                  : '未觀測'}
              </Text>
            </View>

            {/* 運動類型 */}
            <View style={[styles.metricRow, { borderBottomWidth: 0 }]}>
              <View style={styles.metricLabelCol}>
                <Ionicons
                  name="fitness-outline"
                  size={18}
                  color={theme.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.metricName, { color: theme.text }]}>運動類型判斷</Text>
              </View>
              <Text style={[styles.metricValue, { color: theme.primary, fontWeight: '600' }]}>
                {result.eligibility.activityType === 'WALK_RUN'
                  ? '🏃 跑步 / 健走 / 徒步'
                  : result.eligibility.activityType === 'CYCLING'
                    ? '🚴 單車 / 自行車騎乘'
                    : result.eligibility.activityType === 'OTHER'
                      ? '🏊 游泳 / 重訓 / 健身'
                      : '未明確辨識型態'}
              </Text>
            </View>
          </View>

          {/* 3. 官方審查防退件提醒清單 */}
          <View
            style={[
              styles.sectionCard,
              { backgroundColor: theme.cardBackground, borderColor: theme.cardBorder },
            ]}
          >
            <Text style={[styles.sectionHeading, { color: theme.text }]}>⚠️ 官方審核避坑重點</Text>
            {result.eligibility.reasonCodes.length > 0 ? (
              result.eligibility.reasonCodes.map((code, idx) => {
                const info = getReasonCodeInfo(code);
                return (
                  <View key={idx} style={styles.tipRow}>
                    <Ionicons
                      name={info.type === 'error' ? 'close-circle' : 'warning-outline'}
                      size={16}
                      color={info.type === 'error' ? theme.danger : theme.warning}
                      style={{ marginRight: 8, marginTop: 2 }}
                    />
                    <Text style={[styles.tipText, { color: theme.text }]}>{info.label}</Text>
                  </View>
                );
              })
            ) : (
              <View style={styles.tipRow}>
                <Ionicons
                  name="checkmark-circle"
                  size={16}
                  color={theme.success}
                  style={{ marginRight: 8 }}
                />
                <Text style={[styles.tipText, { color: theme.success }]}>
                  截圖符合各項審核指標，無常見的作弊或缺漏特徵。
                </Text>
              </View>
            )}

            {/* 偵測到的運動 App 標籤 */}
            {result.fields.appHints.found && (
              <View style={styles.appHintsRow}>
                <Text style={[styles.appHintTitle, { color: theme.textSecondary }]}>
                  偵測到運動 App：
                </Text>
                <View style={styles.appBadgeList}>
                  {result.fields.appHints.matches.map((app, idx) => (
                    <View
                      key={idx}
                      style={[styles.appBadge, { backgroundColor: theme.backgroundElement }]}
                    >
                      <Ionicons
                        name="phone-portrait-outline"
                        size={12}
                        color={theme.primary}
                        style={{ marginRight: 4 }}
                      />
                      <Text style={[styles.appBadgeText, { color: theme.text }]}>{app.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>

          {/* 4. 折疊：查看 OCR 辨識出的原始文字 */}
          <TouchableOpacity
            style={[styles.collapseToggle, { borderColor: theme.cardBorder }]}
            onPress={() => setShowRawOcr(!showRawOcr)}
          >
            <Text style={[styles.collapseToggleText, { color: theme.textSecondary }]}>
              {showRawOcr ? '收合原始文字辨識內容' : '查看 OCR 原始辨識文字與信心度'}
            </Text>
            <Ionicons
              name={showRawOcr ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.textSecondary}
            />
          </TouchableOpacity>

          {showRawOcr && (
            <View style={[styles.rawOcrCard, { backgroundColor: theme.backgroundElement }]}>
              <Text style={[styles.rawOcrMeta, { color: theme.textSecondary }]}>
                辨識耗時：{result.ocr.durationMs} ms ｜ 信心度：
                {result.ocr.meanConfidence ? `${Math.round(result.ocr.meanConfidence)}%` : '無'}
              </Text>
              <Text style={[styles.rawOcrContent, { color: theme.text }]}>
                {result.ocr.rawText || '(未辨識到任何文字)'}
              </Text>
            </View>
          )}

          {/* 5. 底部快捷操作按鈕 */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={[styles.repickButton, { borderColor: theme.primary }]}
              onPress={handleResetImage}
            >
              <Ionicons
                name="refresh-outline"
                size={18}
                color={theme.primary}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.repickButtonText, { color: theme.primary }]}>重選截圖</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.uploadButton, { backgroundColor: theme.primary }]}
              onPress={handleGoToBrowser}
            >
              <Text style={styles.uploadButtonText}>前往官方網站上傳</Text>
              <Ionicons name="arrow-forward" size={18} color="#ffffff" style={{ marginLeft: 6 }} />
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* 底部固定免責警語提示 */}
      <View style={[styles.inlineDisclaimerBox, { borderColor: theme.cardBorder }]}>
        <Ionicons
          name="information-circle-outline"
          size={15}
          color={theme.textMuted}
          style={{ marginTop: 2, marginRight: 6 }}
        />
        <Text style={[styles.inlineDisclaimerText, { color: theme.textMuted }]}>
          提醒：本功能無法保證運動部官方最終審核通過或不通過，僅做預先檢查提示供參考，請自行承擔風險。
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingBottom: Spacing.five,
  },
  inlineDisclaimerBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: Spacing.three,
    marginTop: Spacing.three,
  },
  inlineDisclaimerText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  visibleWebViewContainer: {
    width: '100%',
    height: 230,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: Spacing.three,
  },
  hiddenWebViewContainer: {
    position: 'absolute',
    width: 1,
    height: 1,
    opacity: 0,
    pointerEvents: 'none',
  },
  webViewFill: {
    width: '100%',
    height: '100%',
    backgroundColor: 'transparent',
  },
  introCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  introHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.two,
  },
  introIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  introHeaderText: {
    flex: 1,
  },
  introTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  introSub: {
    fontSize: 12,
    lineHeight: 16,
  },
  criteriaGrid: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  criterionPill: {
    flex: 1,
    paddingVertical: 6,
    paddingHorizontal: 4,
    borderRadius: 8,
    alignItems: 'center',
  },
  criterionLabel: {
    fontSize: 11,
    marginBottom: 2,
  },
  criterionVal: {
    fontSize: 12,
    fontWeight: '700',
  },
  imagePreviewCard: {
    width: '100%',
    height: 240,
    borderWidth: 2,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.three,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  changeImageBadge: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  changeImageText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  statusCard: {
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    alignItems: 'center',
    marginBottom: Spacing.three,
  },
  analyzingText: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressPercentText: {
    fontSize: 11,
  },
  errorCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 12,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  resultContainer: {
    gap: Spacing.three,
  },
  verdictCard: {
    borderWidth: 1.5,
    borderRadius: 16,
    padding: Spacing.three,
  },
  verdictHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  verdictTitleGroup: {
    flex: 1,
  },
  verdictTitle: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  verdictSub: {
    fontSize: 13,
    lineHeight: 18,
  },
  matchedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginTop: 12,
  },
  matchedBadgeText: {
    fontSize: 13,
    fontWeight: '600',
  },
  sectionCard: {
    borderWidth: 1,
    borderRadius: 16,
    padding: Spacing.three,
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: '700',
    marginBottom: Spacing.two,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(150,150,150,0.2)',
  },
  metricLabelCol: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricName: {
    fontSize: 13,
    fontWeight: '500',
  },
  metricValue: {
    fontSize: 13,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipText: {
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  appHintsRow: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  appHintTitle: {
    fontSize: 12,
    marginBottom: 6,
  },
  appBadgeList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  appBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  appBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  collapseToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 6,
  },
  collapseToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  rawOcrCard: {
    borderRadius: 12,
    padding: Spacing.three,
  },
  rawOcrMeta: {
    fontSize: 11,
    marginBottom: 6,
  },
  rawOcrContent: {
    fontSize: 12,
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Menlo', android: 'monospace' }),
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 4,
  },
  repickButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingVertical: 12,
  },
  repickButtonText: {
    fontSize: 14,
    fontWeight: '700',
  },
  uploadButton: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    paddingVertical: 12,
  },
  uploadButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '700',
  },
  periodWarningBanner: {
    borderRadius: 14,
    borderWidth: 1.5,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  divergentBanner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: Spacing.three,
    marginBottom: Spacing.three,
  },
  bannerHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  bannerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  bannerText: {
    fontSize: 13,
    lineHeight: 19,
    marginBottom: 4,
  },
  bannerSubText: {
    fontSize: 12,
    lineHeight: 17,
  },
  divergentItemRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  divergentItemTag: {
    fontSize: 12,
    fontWeight: '700',
    minWidth: 115,
  },
  divergentItemText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});
