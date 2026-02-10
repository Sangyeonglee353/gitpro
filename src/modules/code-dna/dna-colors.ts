// ═══════════════════════════════════════════
// 🎨 DNA Colors - DNA 시각화 색상 시스템
// ═══════════════════════════════════════════
//
// 4가지 색상 모드를 지원합니다:
//   - language: 주 사용 언어 기반 색상
//   - mood: 코딩 스타일(시간대) 기반 분위기 색상
//   - rainbow: 무지개 그라데이션
//   - monochrome: 단색 계열

import { ThemeColors } from '../../types';
import { CodingStyle, LanguageSlice } from './dna-analyzer';

/** DNA 색상 팔레트 */
export interface DNAColorPalette {
  /** 주요 가닥 색상들 */
  strandColors: string[];

  /** 링 색상들 (7개 요일용) */
  ringColors: string[];

  /** 배경 색상 (그라데이션) */
  bgGradient: [string, string];

  /** 액센트 글로우 색상 */
  glowColor: string;

  /** 파형 색상 */
  waveColor: string;

  /** 장식 색상 */
  decorColor: string;
}

/** 언어별 DNA 색상 매핑 */
const LANGUAGE_COLORS: Record<string, string> = {
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
  R: '#198CE7',
  Lua: '#000080',
  Haskell: '#5e5086',
  Elixir: '#6e4a7e',
  Clojure: '#db5855',
  Perl: '#0298c3',
};

/** 무지개 색상 팔레트 */
const RAINBOW_COLORS = [
  '#FF0000', '#FF4500', '#FF8C00', '#FFD700',
  '#ADFF2F', '#00FF7F', '#00CED1', '#1E90FF',
  '#6A5ACD', '#9400D3', '#FF1493', '#FF69B4',
];

/**
 * 색상 모드와 데이터에 따라 DNA 색상 팔레트를 생성합니다.
 */
export function generateColorPalette(
  colorScheme: 'language' | 'mood' | 'rainbow' | 'monochrome',
  languages: LanguageSlice[],
  codingStyle: CodingStyle,
  theme: ThemeColors
): DNAColorPalette {
  switch (colorScheme) {
    case 'language':
      return generateLanguagePalette(languages, theme);
    case 'mood':
      return generateMoodPalette(codingStyle, theme);
    case 'rainbow':
      return generateRainbowPalette(theme);
    case 'monochrome':
      return generateMonochromePalette(theme);
    default:
      return generateLanguagePalette(languages, theme);
  }
}

/**
 * 언어 기반 색상 팔레트
 */
function generateLanguagePalette(languages: LanguageSlice[], theme: ThemeColors): DNAColorPalette {
  const strandColors = languages.slice(0, 6).map(lang =>
    LANGUAGE_COLORS[lang.name] || theme.accent
  );

  // 최소 2개 색상 보장
  while (strandColors.length < 2) {
    strandColors.push(theme.accent);
  }

  // 언어 색상에서 링 색상 도출 (7개 요일)
  const ringColors = generateRingColors(strandColors, 7);

  return {
    strandColors,
    ringColors,
    bgGradient: [theme.cardGradientStart, theme.cardGradientEnd],
    glowColor: strandColors[0],
    waveColor: strandColors[1] || strandColors[0],
    decorColor: strandColors.length > 2 ? strandColors[2] : theme.accentSecondary,
  };
}

/**
 * 코딩 분위기 기반 색상 팔레트
 */
function generateMoodPalette(codingStyle: CodingStyle, theme: ThemeColors): DNAColorPalette {
  const moodPalettes: Record<CodingStyle, { strands: string[]; glow: string; wave: string }> = {
    night_owl: {
      strands: ['#1a1a5e', '#2d1b69', '#4a0e8f', '#7c3aed', '#a78bfa', '#c4b5fd'],
      glow: '#7c3aed',
      wave: '#a78bfa',
    },
    early_bird: {
      strands: ['#fbbf24', '#f59e0b', '#fb923c', '#f97316', '#ef4444', '#ec4899'],
      glow: '#f59e0b',
      wave: '#fb923c',
    },
    day_worker: {
      strands: ['#0ea5e9', '#06b6d4', '#14b8a6', '#10b981', '#22c55e', '#84cc16'],
      glow: '#06b6d4',
      wave: '#10b981',
    },
    balanced: {
      strands: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e'],
      glow: '#8b5cf6',
      wave: '#a855f7',
    },
  };

  const mood = moodPalettes[codingStyle];
  const ringColors = generateRingColors(mood.strands, 7);

  return {
    strandColors: mood.strands,
    ringColors,
    bgGradient: [theme.cardGradientStart, theme.cardGradientEnd],
    glowColor: mood.glow,
    waveColor: mood.wave,
    decorColor: mood.strands[3],
  };
}

/**
 * 무지개 색상 팔레트
 */
function generateRainbowPalette(theme: ThemeColors): DNAColorPalette {
  return {
    strandColors: RAINBOW_COLORS.slice(0, 6),
    ringColors: RAINBOW_COLORS.slice(0, 7),
    bgGradient: [theme.cardGradientStart, theme.cardGradientEnd],
    glowColor: '#FFD700',
    waveColor: '#00CED1',
    decorColor: '#FF1493',
  };
}

/**
 * 단색 계열 팔레트
 */
function generateMonochromePalette(theme: ThemeColors): DNAColorPalette {
  const base = theme.accent;
  const shades = generateShades(base, 6);
  const ringShades = generateShades(base, 7);

  return {
    strandColors: shades,
    ringColors: ringShades,
    bgGradient: [theme.cardGradientStart, theme.cardGradientEnd],
    glowColor: base,
    waveColor: shades[2],
    decorColor: shades[4],
  };
}

// ═══════════════════════════════════════════
// 🧩 색상 유틸리티
// ═══════════════════════════════════════════

/**
 * 주어진 색상들에서 보간하여 n개의 색상을 생성합니다.
 */
function generateRingColors(sourceColors: string[], count: number): string[] {
  const result: string[] = [];
  for (let i = 0; i < count; i++) {
    const srcIdx = (i / count) * sourceColors.length;
    const idx = Math.floor(srcIdx) % sourceColors.length;
    result.push(sourceColors[idx]);
  }
  return result;
}

/**
 * 기준 색상에서 명도 차이를 두어 n개의 음영을 생성합니다.
 */
function generateShades(hexColor: string, count: number): string[] {
  const rgb = hexToRgb(hexColor);
  const shades: string[] = [];

  for (let i = 0; i < count; i++) {
    const factor = 0.4 + (i / (count - 1)) * 0.6; // 0.4 ~ 1.0
    shades.push(
      rgbToHex(
        Math.round(rgb.r * factor),
        Math.round(rgb.g * factor),
        Math.round(rgb.b * factor)
      )
    );
  }
  return shades;
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  return {
    r: parseInt(clean.substring(0, 2), 16),
    g: parseInt(clean.substring(2, 4), 16),
    b: parseInt(clean.substring(4, 6), 16),
  };
}

function rgbToHex(r: number, g: number, b: number): string {
  const toHex = (n: number) => Math.min(255, Math.max(0, n)).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

/**
 * 언어 이름에 대한 색상을 반환합니다.
 */
export function getLanguageDNAColor(language: string): string {
  return LANGUAGE_COLORS[language] || '#8b949e';
}
