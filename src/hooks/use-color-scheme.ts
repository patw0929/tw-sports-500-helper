import { useThemeContext } from '@/context/theme-context';

export function useColorScheme(): 'light' | 'dark' {
  const { colorScheme } = useThemeContext();
  return colorScheme || 'light';
}
