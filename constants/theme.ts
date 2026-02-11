/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

import { Platform } from 'react-native';

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    border: '#eee',
    cardBackground: '#f8f9fa',
    buttonBackground: '#f0f0f0',
    buttonText: '#007AFF',
    error: '#d32f2f',
    success: '#2e7d32',
    badgeBackground: '#007AFF',
    badgeText: '#fff',
    warningBackground: '#FFF3CD',
    warningBorder: '#FFE69C',
    warningText: '#856404',
    warningButtonBackground: '#fff',
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    border: '#2c2c2e',
    cardBackground: '#1c1c1e',
    buttonBackground: '#2c2c2e',
    buttonText: '#0a84ff',
    error: '#ef5350',
    success: '#66bb6a',
    badgeBackground: '#0a84ff',
    badgeText: '#fff',
    warningBackground: '#5A4A1F',
    warningBorder: '#6B5A2F',
    warningText: '#FFE69C',
    warningButtonBackground: '#2c2c2e',
  },
};

export const Fonts = Platform.select({
  ios: {
    /** iOS `UIFontDescriptorSystemDesignDefault` */
    sans: 'system-ui',
    /** iOS `UIFontDescriptorSystemDesignSerif` */
    serif: 'ui-serif',
    /** iOS `UIFontDescriptorSystemDesignRounded` */
    rounded: 'ui-rounded',
    /** iOS `UIFontDescriptorSystemDesignMonospaced` */
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
});
