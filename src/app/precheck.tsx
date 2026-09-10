import { Ionicons } from '@expo/vector-icons';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ScreenshotPrechecker } from '@/components/screenshot-prechecker';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export default function PrecheckScreen() {
  const theme = useTheme();

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.background }]}
      edges={['top', 'left', 'right']}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        {/* Header Title */}
        <View style={styles.header}>
          <Text style={[styles.superTitle, { color: theme.primary }]}>運動部 115 年揮汗有禮</Text>
          <Text style={[styles.mainTitle, { color: theme.text }]}>運動紀錄截圖預檢</Text>
          <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
            基於運動部演算法進行事前檢查，上傳前及早發現缺漏
          </Text>
        </View>

        {/* 重要警語卡片（使用者特別要求之免責聲明） */}
        <View
          style={[
            styles.warningNoticeCard,
            { backgroundColor: theme.warningLight, borderColor: theme.warning },
          ]}
        >
          <Ionicons
            name="alert-circle"
            size={22}
            color={theme.warning}
            style={styles.warningIcon}
          />
          <View style={styles.warningTextCol}>
            <Text style={[styles.warningNoticeTitle, { color: theme.text }]}>
              免責聲明與風險提示
            </Text>
            <Text style={[styles.warningNoticeBody, { color: theme.textSecondary }]}>
              此功能僅提供基本預先檢查提示供參考，
              <Text style={{ fontWeight: '800', color: theme.text }}>
                無法保證官方最終審核通過或不通過
              </Text>
              。實際資格認定請以運動部官方系統判定為準，請使用者自行承擔活動參與與上傳風險。
            </Text>
          </View>
        </View>

        {/* 核心預檢器組件 */}
        <ScreenshotPrechecker />
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
  warningNoticeCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderWidth: 1.5,
    borderRadius: 14,
    padding: Spacing.three,
    gap: 10,
  },
  warningIcon: {
    marginTop: 1,
  },
  warningTextCol: {
    flex: 1,
    gap: 4,
  },
  warningNoticeTitle: {
    fontSize: 14,
    fontWeight: '800',
  },
  warningNoticeBody: {
    fontSize: 12.5,
    lineHeight: 18,
  },
});
