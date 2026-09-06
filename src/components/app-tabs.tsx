import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from '@/hooks/use-color-scheme';

import { Colors } from '@/constants/theme';

export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'dark' ? 'dark' : 'light'];

  return (
    <NativeTabs
      backgroundColor={colors.cardBackground}
      indicatorColor={colors.backgroundElement}
      tintColor={colors.tabIconSelected}
      iconColor={{
        default: colors.tabIconDefault,
        selected: colors.tabIconSelected,
      }}
      labelStyle={{
        default: { color: colors.tabIconDefault },
        selected: { color: colors.tabIconSelected },
      }}
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>快速登入</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'house', selected: 'house.fill' }}
          md={{ default: 'home', selected: 'home' }}
          src={require('@/assets/images/tabIcons/home.png')}
          renderingMode="template"
          selectedColor={colors.tabIconSelected}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="browser">
        <NativeTabs.Trigger.Label>官方網頁</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'globe', selected: 'globe.americas.fill' }}
          md={{ default: 'public', selected: 'public' }}
          src={require('@/assets/images/tabIcons/globe.png')}
          renderingMode="template"
          selectedColor={colors.tabIconSelected}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tasks">
        <NativeTabs.Trigger.Label>任務週程</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'calendar', selected: 'calendar.circle.fill' }}
          md={{ default: 'calendar_month', selected: 'calendar_month' }}
          src={require('@/assets/images/tabIcons/calendar.png')}
          renderingMode="template"
          selectedColor={colors.tabIconSelected}
        />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="accounts">
        <NativeTabs.Trigger.Label>帳號管理</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon
          sf={{ default: 'person.crop.circle', selected: 'person.crop.circle.fill' }}
          md={{ default: 'manage_accounts', selected: 'manage_accounts' }}
          src={require('@/assets/images/tabIcons/person.png')}
          renderingMode="template"
          selectedColor={colors.tabIconSelected}
        />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
