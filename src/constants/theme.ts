/**
 * 運動部「揮汗有禮・全民動起來」專用活力運動風格設計系統
 */

import { Platform } from 'react-native';

export const Colors = {
  light: {
    text: '#1F2937',
    textSecondary: '#6B7280',
    textMuted: '#9CA3AF',
    background: '#FAF6F2',
    backgroundElement: '#F3EDE7',
    backgroundSelected: '#FFE8DF',
    cardBackground: '#FFFFFF',
    cardBorder: '#EFE3DA',
    primary: '#FF5E1E', // 運動部活力橘
    primaryDark: '#D84315',
    primaryLight: '#FFF0EA',
    accent: '#F59E0B', // 活力金色
    accentLight: '#FEF3C7',
    success: '#10B981',
    successLight: '#ECFDF5',
    warning: '#F97316',
    warningLight: '#FFF7ED',
    danger: '#EF4444',
    dangerLight: '#FEF2F2',
    tint: '#FF5E1E',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#FF5E1E',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#9CA3AF',
    textMuted: '#6B7280',
    background: '#111215',
    backgroundElement: '#1F2127',
    backgroundSelected: '#33231D',
    cardBackground: '#181A1F',
    cardBorder: '#292C34',
    primary: '#FF6B30',
    primaryDark: '#FF5E1E',
    primaryLight: '#2C1A14',
    accent: '#FBBF24',
    accentLight: '#2B2312',
    success: '#34D399',
    successLight: '#0E2A1E',
    warning: '#FB923C',
    warningLight: '#2F1E14',
    danger: '#F87171',
    dangerLight: '#2E1515',
    tint: '#FF6B30',
    tabIconDefault: '#6B7280',
    tabIconSelected: '#FF6B30',
  },
} as const;

export type ThemeColor = keyof typeof Colors.light & keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 48,
  seven: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 75 }) ?? 0;
export const MaxContentWidth = 840;
