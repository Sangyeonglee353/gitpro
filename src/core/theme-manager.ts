// ═══════════════════════════════════════════
// 🎨 Theme Manager - 테마 색상 관리
// ═══════════════════════════════════════════

import { ThemeName, ThemeColors } from '../types';

const THEMES: Record<ThemeName, ThemeColors> = {
  dark: {
    name: 'dark',
    background: '#0d1117',
    backgroundSecondary: '#161b22',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    accent: '#58a6ff',
    accentSecondary: '#1f6feb',
    border: '#30363d',
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    cardGradientStart: '#161b22',
    cardGradientEnd: '#0d1117',
  },
  light: {
    name: 'light',
    background: '#ffffff',
    backgroundSecondary: '#f6f8fa',
    text: '#1f2328',
    textSecondary: '#656d76',
    accent: '#0969da',
    accentSecondary: '#0550ae',
    border: '#d0d7de',
    success: '#1a7f37',
    warning: '#9a6700',
    error: '#cf222e',
    cardGradientStart: '#f6f8fa',
    cardGradientEnd: '#ffffff',
  },
  cyberpunk: {
    name: 'cyberpunk',
    background: '#0a0014',
    backgroundSecondary: '#1a0033',
    text: '#00ffcc',
    textSecondary: '#ff00ff',
    accent: '#ff0066',
    accentSecondary: '#6600ff',
    border: '#330066',
    success: '#00ff00',
    warning: '#ffff00',
    error: '#ff0000',
    cardGradientStart: '#1a0033',
    cardGradientEnd: '#0a0014',
  },
  retro: {
    name: 'retro',
    background: '#2b2b2b',
    backgroundSecondary: '#3c3c3c',
    text: '#f0e68c',
    textSecondary: '#d2b48c',
    accent: '#ff6347',
    accentSecondary: '#ffa07a',
    border: '#555555',
    success: '#90ee90',
    warning: '#ffd700',
    error: '#ff4500',
    cardGradientStart: '#3c3c3c',
    cardGradientEnd: '#2b2b2b',
  },
  pastel: {
    name: 'pastel',
    background: '#fef6fb',
    backgroundSecondary: '#f0e6f6',
    text: '#5b4a6f',
    textSecondary: '#8b7a9e',
    accent: '#b388eb',
    accentSecondary: '#89c4f4',
    border: '#e0d0f0',
    success: '#77dd77',
    warning: '#fdfd96',
    error: '#ff6961',
    cardGradientStart: '#f0e6f6',
    cardGradientEnd: '#fef6fb',
  },
};

/**
 * 테마 이름에 해당하는 색상 팔레트를 반환합니다.
 */
export function getTheme(themeName: ThemeName): ThemeColors {
  return THEMES[themeName] || THEMES.dark;
}

/**
 * 사용 가능한 모든 테마 이름을 반환합니다.
 */
export function getAvailableThemes(): ThemeName[] {
  return Object.keys(THEMES) as ThemeName[];
}

/**
 * 언어별 대표 색상을 반환합니다 (GitHub 언어 색상 기반).
 */
export function getLanguageColor(language: string): string {
  const colors: Record<string, string> = {
    TypeScript: '#3178c6',
    JavaScript: '#f1e05a',
    Python: '#3572A5',
    Java: '#b07219',
    Go: '#00ADD8',
    Rust: '#dea584',
    'C++': '#f34b7d',
    C: '#555555',
    'C#': '#178600',
    Ruby: '#701516',
    PHP: '#4F5D95',
    Swift: '#F05138',
    Kotlin: '#A97BFF',
    Dart: '#00B4AB',
    Scala: '#c22d40',
    Shell: '#89e051',
    HTML: '#e34c26',
    CSS: '#563d7c',
    Vue: '#41b883',
    Svelte: '#ff3e00',
  };

  return colors[language] || '#8b949e';
}
