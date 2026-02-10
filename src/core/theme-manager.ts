// ═══════════════════════════════════════════
// 🎨 Theme Manager - 테마 색상 관리
// ═══════════════════════════════════════════

import { ThemeName, ThemeColors, CustomThemeColors } from '../types';

const THEMES: Record<Exclude<ThemeName, 'custom'>, ThemeColors> = {
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

  // ── 8주차 신규 테마 ──────────────────────────

  ocean: {
    name: 'ocean',
    background: '#0a192f',
    backgroundSecondary: '#112240',
    text: '#ccd6f6',
    textSecondary: '#8892b0',
    accent: '#64ffda',
    accentSecondary: '#00b4d8',
    border: '#233554',
    success: '#64ffda',
    warning: '#ffd166',
    error: '#ff6b6b',
    cardGradientStart: '#112240',
    cardGradientEnd: '#0a192f',
  },
  forest: {
    name: 'forest',
    background: '#1a2f1a',
    backgroundSecondary: '#2d4a2d',
    text: '#d4e7c5',
    textSecondary: '#a3c585',
    accent: '#7ec850',
    accentSecondary: '#4a9c2d',
    border: '#3d6b3d',
    success: '#7ec850',
    warning: '#f0c040',
    error: '#e05555',
    cardGradientStart: '#2d4a2d',
    cardGradientEnd: '#1a2f1a',
  },
  dracula: {
    name: 'dracula',
    background: '#282a36',
    backgroundSecondary: '#44475a',
    text: '#f8f8f2',
    textSecondary: '#6272a4',
    accent: '#bd93f9',
    accentSecondary: '#ff79c6',
    border: '#44475a',
    success: '#50fa7b',
    warning: '#f1fa8c',
    error: '#ff5555',
    cardGradientStart: '#44475a',
    cardGradientEnd: '#282a36',
  },
  nord: {
    name: 'nord',
    background: '#2e3440',
    backgroundSecondary: '#3b4252',
    text: '#eceff4',
    textSecondary: '#d8dee9',
    accent: '#88c0d0',
    accentSecondary: '#81a1c1',
    border: '#4c566a',
    success: '#a3be8c',
    warning: '#ebcb8b',
    error: '#bf616a',
    cardGradientStart: '#3b4252',
    cardGradientEnd: '#2e3440',
  },
  sunset: {
    name: 'sunset',
    background: '#1a1020',
    backgroundSecondary: '#2d1b3d',
    text: '#ffecd2',
    textSecondary: '#d4a574',
    accent: '#ff6b35',
    accentSecondary: '#f7931e',
    border: '#4a2d5e',
    success: '#a8e6cf',
    warning: '#ffd93d',
    error: '#ff6b6b',
    cardGradientStart: '#2d1b3d',
    cardGradientEnd: '#1a1020',
  },
};

/**
 * 테마 이름에 해당하는 색상 팔레트를 반환합니다.
 * 'custom' 테마의 경우 사용자 정의 색상을 사용합니다.
 */
export function getTheme(themeName: ThemeName, customColors?: CustomThemeColors): ThemeColors {
  if (themeName === 'custom' && customColors) {
    return buildCustomTheme(customColors);
  }

  if (themeName === 'custom') {
    console.warn('⚠️  custom 테마가 선택되었지만 custom_theme 설정이 없습니다. dark 테마를 사용합니다.');
    return THEMES.dark;
  }

  return THEMES[themeName] || THEMES.dark;
}

/**
 * 사용자 정의 색상으로 테마를 구성합니다.
 * 누락된 속성은 자동으로 생성됩니다.
 */
function buildCustomTheme(colors: CustomThemeColors): ThemeColors {
  return {
    name: 'custom',
    background: colors.background,
    backgroundSecondary: colors.backgroundSecondary,
    text: colors.text,
    textSecondary: colors.textSecondary,
    accent: colors.accent,
    accentSecondary: colors.accentSecondary,
    border: colors.border,
    success: colors.accent,
    warning: '#f0c040',
    error: '#e05555',
    cardGradientStart: colors.backgroundSecondary,
    cardGradientEnd: colors.background,
  };
}

/**
 * 사용 가능한 모든 테마 이름을 반환합니다.
 */
export function getAvailableThemes(): ThemeName[] {
  return [...(Object.keys(THEMES) as ThemeName[]), 'custom'];
}

/**
 * 테마 프리뷰 SVG를 생성합니다.
 */
export function generateThemePreview(themeName: ThemeName): string {
  const theme = getTheme(themeName);
  const width = 300;
  const height = 180;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="prevBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
  </defs>
  <rect width="${width}" height="${height}" rx="12" fill="url(#prevBg)" stroke="${theme.border}" stroke-width="1.5"/>
  <text x="20" y="32" font-size="16" font-weight="bold" fill="${theme.text}" font-family="'Segoe UI', sans-serif">${themeName}</text>
  <text x="20" y="54" font-size="11" fill="${theme.textSecondary}" font-family="'Segoe UI', sans-serif">Theme Preview</text>
  <rect x="20" y="70" width="80" height="28" rx="6" fill="${theme.accent}" opacity="0.9"/>
  <text x="60" y="89" font-size="11" text-anchor="middle" fill="${theme.background}" font-family="'Segoe UI', sans-serif">Primary</text>
  <rect x="110" y="70" width="80" height="28" rx="6" fill="${theme.accentSecondary}" opacity="0.9"/>
  <text x="150" y="89" font-size="11" text-anchor="middle" fill="${theme.background}" font-family="'Segoe UI', sans-serif">Secondary</text>
  <rect x="200" y="70" width="80" height="28" rx="6" fill="${theme.backgroundSecondary}" stroke="${theme.border}" stroke-width="1"/>
  <text x="240" y="89" font-size="11" text-anchor="middle" fill="${theme.text}" font-family="'Segoe UI', sans-serif">Surface</text>
  <circle cx="35" cy="130" r="10" fill="${theme.success}"/>
  <circle cx="65" cy="130" r="10" fill="${theme.warning}"/>
  <circle cx="95" cy="130" r="10" fill="${theme.error}"/>
  <text x="120" y="135" font-size="10" fill="${theme.textSecondary}" font-family="'Segoe UI', sans-serif">success / warning / error</text>
  <rect x="20" y="155" width="260" height="8" rx="4" fill="${theme.border}"/>
  <rect x="20" y="155" width="160" height="8" rx="4" fill="${theme.accent}"/>
</svg>`;
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
    Lua: '#000080',
    Haskell: '#5e5086',
    Elixir: '#6e4a7e',
    Clojure: '#db5855',
    R: '#198CE7',
    Julia: '#a270ba',
    Zig: '#ec915c',
    Nim: '#ffc200',
    OCaml: '#3be133',
    Perl: '#0298c3',
  };

  return colors[language] || '#8b949e';
}
