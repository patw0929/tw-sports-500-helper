import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Spacing } from '@/constants/theme';
import { ThemePreference, useThemeContext } from '@/context/theme-context';
import { useTheme } from '@/hooks/use-theme';

interface ThemePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ThemeOption {
  key: ThemePreference;
  title: string;
  desc: string;
  icon: keyof typeof Ionicons.glyphMap;
}

export function ThemePickerModal({ visible, onClose }: ThemePickerModalProps) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { preference, colorScheme, setThemePreference } = useThemeContext();

  const options: ThemeOption[] = [
    {
      key: 'system',
      title: '跟隨系統',
      desc: `隨裝置系統自動切換（目前為：${colorScheme === 'dark' ? '深色' : '淺色'}）`,
      icon: 'contrast-outline',
    },
    {
      key: 'light',
      title: '淺色模式',
      desc: '保持明亮清爽的淺色介面風格',
      icon: 'sunny-outline',
    },
    {
      key: 'dark',
      title: '深色模式',
      desc: '適合夜間低光環境，降低眼部負擔',
      icon: 'moon-outline',
    },
  ];

  const handleSelect = async (key: ThemePreference) => {
    await setThemePreference(key);
    setTimeout(() => {
      onClose();
    }, 120);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={StyleSheet.absoluteFill} activeOpacity={1} onPress={onClose} />
        <View
          style={[
            styles.sheet,
            {
              backgroundColor: theme.cardBackground,
              paddingBottom: insets.bottom > 0 ? insets.bottom + 12 : Spacing.four,
            },
          ]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.title, { color: theme.text }]}>外觀主題設定</Text>
              <Text style={[styles.subtitle, { color: theme.textSecondary }]}>
                選擇您喜好的介面風格，設定將儲存於本機
              </Text>
            </View>
            <TouchableOpacity
              style={[
                styles.closeButton,
                { backgroundColor: theme.backgroundElement, borderColor: theme.cardBorder },
              ]}
              onPress={onClose}
            >
              <Ionicons name="close" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
          </View>

          {/* Options */}
          <View style={styles.optionsList}>
            {options.map((opt) => {
              const isSelected = preference === opt.key;
              return (
                <TouchableOpacity
                  key={opt.key}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: isSelected ? theme.primaryLight : theme.backgroundElement,
                      borderColor: isSelected ? theme.primary : theme.cardBorder,
                    },
                  ]}
                  activeOpacity={0.8}
                  onPress={() => handleSelect(opt.key)}
                >
                  <View
                    style={[
                      styles.iconWrap,
                      {
                        backgroundColor: isSelected ? theme.primary : theme.cardBackground,
                      },
                    ]}
                  >
                    <Ionicons
                      name={opt.icon}
                      size={20}
                      color={isSelected ? '#ffffff' : theme.textSecondary}
                    />
                  </View>

                  <View style={styles.textWrap}>
                    <Text
                      style={[
                        styles.optionTitle,
                        { color: isSelected ? theme.primary : theme.text },
                      ]}
                    >
                      {opt.title}
                    </Text>
                    <Text style={[styles.optionDesc, { color: theme.textSecondary }]}>
                      {opt.desc}
                    </Text>
                  </View>

                  <View style={styles.checkWrap}>
                    {isSelected ? (
                      <Ionicons name="checkmark-circle" size={22} color={theme.primary} />
                    ) : (
                      <View style={[styles.uncheckedCircle, { borderColor: theme.cardBorder }]} />
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.four,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: Spacing.four,
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  subtitle: {
    fontSize: 12,
    marginTop: 3,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  optionsList: {
    gap: 10,
    marginBottom: 8,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    gap: 12,
  },
  iconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  optionDesc: {
    fontSize: 12,
    lineHeight: 16,
  },
  checkWrap: {
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  uncheckedCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
  },
});
