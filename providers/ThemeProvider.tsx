import { useState, useEffect, useCallback } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { Colors } from '@/constants/colors';

type Theme = 'light' | 'dark' | 'system';
type ColorScheme = 'light' | 'dark';

interface ThemeContextType {
  theme: Theme;
  colorScheme: ColorScheme;
  colors: typeof Colors.light | typeof Colors.dark;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

export const [ThemeProvider, useTheme] = createContextHook<ThemeContextType>(() => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<Theme>('system');
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [mounted, setMounted] = useState<boolean>(false);

  const setTheme = useCallback(async (newTheme: Theme) => {
    if (!newTheme || !['light', 'dark', 'system'].includes(newTheme)) {
      console.log('Invalid theme provided:', newTheme);
      return;
    }
    setThemeState(newTheme);
    try {
      await AsyncStorage.setItem('theme', newTheme);
    } catch (error) {
      console.log('Error saving theme:', error);
    }
  }, []);

  // Delay mounting to avoid useInsertionEffect warnings
  useEffect(() => {
    const timer = setTimeout(() => {
      setMounted(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('theme');
        if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
          setThemeState(savedTheme as Theme);
        }
      } catch (error) {
        console.log('Error loading theme:', error);
      } finally {
        setIsLoaded(true);
      }
    };

    loadTheme();
  }, [mounted]);

  // Calculate derived values
  const colorScheme: ColorScheme = theme === 'system' 
    ? (systemColorScheme === 'dark' ? 'dark' : 'light')
    : (theme as ColorScheme);
  const isDark = colorScheme === 'dark';
  const colors = Colors[colorScheme];

  return {
    theme,
    colorScheme,
    colors,
    setTheme,
    isDark,
  };
});