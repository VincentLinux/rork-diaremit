import { PixelRatio, useWindowDimensions } from 'react-native';

// Base dimensions for scaling (iPhone 12 Pro as reference)
const BASE_WIDTH = 390;
const BASE_HEIGHT = 844;

// Hook for responsive dimensions
export const useResponsiveDimensions = () => {
  const { width, height } = useWindowDimensions();
  
  const widthScale = width / BASE_WIDTH;
  const heightScale = height / BASE_HEIGHT;
  const scale = Math.min(widthScale, heightScale);
  
  const responsiveFont = (size: number): number => {
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };
  
  const responsiveSpacing = (size: number): number => {
    const newSize = size * scale;
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  };
  
  return {
    width,
    height,
    scale,
    isSmallScreen: width < 375,
    isMediumScreen: width >= 375 && width < 414,
    isLargeScreen: width >= 414,
    responsiveFont,
    responsiveSpacing,
  };
};

// Static responsive functions for non-hook contexts
export const getResponsiveFont = (size: number, screenWidth: number = 390): number => {
  const scale = Math.min(screenWidth / BASE_WIDTH, 1.2); // Cap at 1.2x
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const getResponsiveSpacing = (size: number, screenWidth: number = 390): number => {
  const scale = Math.min(screenWidth / BASE_WIDTH, 1.2); // Cap at 1.2x
  const newSize = size * scale;
  return Math.round(PixelRatio.roundToNearestPixel(newSize));
};

export const PanAfrican = {
  red: '#D21034',
  black: '#111827',
  green: '#008753',
  gold: '#F59E0B',
  white: '#FFFFFF',
  gray: '#6B7280',
  bg: '#F5F7FA',
} as const;

export const Colors = {
  light: {
    text: '#111827',
    textSecondary: '#6B7280',
    background: '#FFFFFF',
    backgroundSecondary: '#F9FAFB',
    backgroundTertiary: '#F5F7FA',
    border: '#E5E7EB',
    borderLight: '#F3F4F6',
    card: '#FFFFFF',
    primary: PanAfrican.green,
    secondary: PanAfrican.gold,
    accent: PanAfrican.red,
    success: PanAfrican.green,
    warning: PanAfrican.gold,
    error: '#EF4444',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: PanAfrican.green,
    shadow: 'rgba(0, 0, 0, 0.1)',
  },
  dark: {
    text: '#F9FAFB',
    textSecondary: '#D1D5DB',
    background: '#1F2937',
    backgroundSecondary: '#374151',
    backgroundTertiary: '#111827',
    border: '#4B5563',
    borderLight: '#374151',
    card: '#374151',
    primary: '#10B981',
    secondary: '#FBBF24',
    accent: '#F87171',
    success: '#10B981',
    warning: '#FBBF24',
    error: '#F87171',
    tabIconDefault: '#9CA3AF',
    tabIconSelected: '#10B981',
    shadow: 'rgba(0, 0, 0, 0.3)',
  },
};

export default Colors;