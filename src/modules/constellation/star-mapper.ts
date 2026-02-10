// ═══════════════════════════════════════════
// 🌌 Star Mapper - 천체 매핑 시스템
// ═══════════════════════════════════════════
//
// 레포지토리 특성을 별자리 이름, 별 색상 등
// 천체 요소로 매핑합니다.

import { GitHubRepository } from '../../types';

// ── 레포 분류 ──────────────────────────

export type RepoType =
  | 'frontend'
  | 'backend'
  | 'library'
  | 'docs'
  | 'ml'
  | 'game'
  | 'mobile'
  | 'profile'
  | 'cli'
  | 'other';

/**
 * 레포를 유형별로 분류합니다.
 * (토픽, 이름, 언어 등으로 추론)
 */
export function classifyRepoType(repo: GitHubRepository): RepoType {
  const name = repo.name.toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const topics = repo.topics.map(t => t.toLowerCase());
  const lang = (repo.primaryLanguage || '').toLowerCase();
  const allText = `${name} ${desc} ${topics.join(' ')}`;

  // 프로필 README
  if (name === repo.name.toLowerCase() || name.includes('readme') || name.includes('profile')) {
    return 'profile';
  }

  // ML/AI
  if (
    allText.includes('machine-learning') ||
    allText.includes('deep-learning') ||
    allText.includes('tensorflow') ||
    allText.includes('pytorch') ||
    allText.includes('neural') ||
    allText.includes('ai') ||
    allText.includes('ml')
  ) {
    return 'ml';
  }

  // 게임
  if (
    allText.includes('game') ||
    allText.includes('unity') ||
    allText.includes('unreal') ||
    allText.includes('godot') ||
    allText.includes('phaser')
  ) {
    return 'game';
  }

  // 모바일
  if (
    allText.includes('mobile') ||
    allText.includes('android') ||
    allText.includes('ios') ||
    allText.includes('flutter') ||
    allText.includes('react-native') ||
    lang === 'swift' ||
    lang === 'kotlin' ||
    lang === 'dart'
  ) {
    return 'mobile';
  }

  // 문서/블로그
  if (
    allText.includes('docs') ||
    allText.includes('blog') ||
    allText.includes('wiki') ||
    allText.includes('documentation') ||
    allText.includes('til') ||
    lang === 'markdown'
  ) {
    return 'docs';
  }

  // CLI/도구
  if (
    allText.includes('cli') ||
    allText.includes('tool') ||
    allText.includes('script') ||
    allText.includes('automation') ||
    lang === 'shell' ||
    lang === 'bash'
  ) {
    return 'cli';
  }

  // 라이브러리/패키지
  if (
    allText.includes('library') ||
    allText.includes('lib') ||
    allText.includes('package') ||
    allText.includes('sdk') ||
    allText.includes('framework') ||
    allText.includes('npm') ||
    allText.includes('pip') ||
    allText.includes('gem')
  ) {
    return 'library';
  }

  // 프론트엔드
  if (
    allText.includes('frontend') ||
    allText.includes('front-end') ||
    allText.includes('react') ||
    allText.includes('vue') ||
    allText.includes('angular') ||
    allText.includes('svelte') ||
    allText.includes('next') ||
    allText.includes('nuxt') ||
    allText.includes('website') ||
    allText.includes('web') ||
    lang === 'html' ||
    lang === 'css' ||
    lang === 'vue' ||
    lang === 'svelte'
  ) {
    return 'frontend';
  }

  // 백엔드/API
  if (
    allText.includes('backend') ||
    allText.includes('back-end') ||
    allText.includes('api') ||
    allText.includes('server') ||
    allText.includes('rest') ||
    allText.includes('graphql') ||
    allText.includes('spring') ||
    allText.includes('express') ||
    allText.includes('fastapi') ||
    allText.includes('django') ||
    lang === 'java' ||
    lang === 'go'
  ) {
    return 'backend';
  }

  return 'other';
}

// ── 별자리 이름 ──────────────────────────

/** 별자리 이름 패턴 (PLANNING.md 기반) */
const CONSTELLATION_NAME_PATTERNS: Record<RepoType, { suffixKo: string; suffixEn: string }> = {
  frontend: { suffixKo: '의 방패', suffixEn: "'s Shield" },
  backend: { suffixKo: '의 탑', suffixEn: "'s Tower" },
  library: { suffixKo: '의 망치', suffixEn: "'s Hammer" },
  docs: { suffixKo: '의 두루마리', suffixEn: "'s Scroll" },
  ml: { suffixKo: '의 눈', suffixEn: "'s Eye" },
  game: { suffixKo: '의 검', suffixEn: "'s Sword" },
  mobile: { suffixKo: '의 날개', suffixEn: "'s Wing" },
  profile: { suffixKo: '의 왕관', suffixEn: "'s Crown" },
  cli: { suffixKo: '의 톱니', suffixEn: "'s Gear" },
  other: { suffixKo: '의 별', suffixEn: "'s Star" },
};

/**
 * 레포 이름과 유형으로 별자리 이름을 생성합니다.
 */
export function getConstellationName(repoName: string, repoType: RepoType): string {
  const pattern = CONSTELLATION_NAME_PATTERNS[repoType];
  // 레포 이름을 짧게 정리
  const shortName = repoName.length > 12
    ? repoName.substring(0, 12)
    : repoName;
  return `${shortName}${pattern.suffixEn}`;
}

/**
 * 별자리 이름을 한국어로 생성합니다.
 */
export function getConstellationNameKo(repoName: string, repoType: RepoType): string {
  const pattern = CONSTELLATION_NAME_PATTERNS[repoType];
  const shortName = repoName.length > 10
    ? repoName.substring(0, 10)
    : repoName;
  return `${shortName}${pattern.suffixKo}`;
}

// ── 별 색상 ──────────────────────────

/** 언어별 별 색상 (GitHub 언어 색상 기반) */
const LANGUAGE_STAR_COLORS: Record<string, string> = {
  TypeScript: '#58a6ff',
  JavaScript: '#f0db4f',
  Python: '#6bbd6e',
  Java: '#e76f00',
  Go: '#00ADD8',
  Rust: '#dea584',
  'C++': '#f34b7d',
  C: '#888888',
  'C#': '#68c14a',
  Ruby: '#cc342d',
  PHP: '#7b7fb5',
  Swift: '#F05138',
  Kotlin: '#A97BFF',
  Dart: '#00B4AB',
  Shell: '#89e051',
  HTML: '#e34c26',
  CSS: '#6b5bff',
  Vue: '#41b883',
  Svelte: '#ff3e00',
  Scala: '#c22d40',
};

/**
 * 언어에 따른 별 색상을 반환합니다.
 */
export function getStarColor(language: string | null): string {
  if (!language) return '#c8d6e5'; // 기본 은빛
  return LANGUAGE_STAR_COLORS[language] || '#c8d6e5';
}

// ── 하늘 테마 색상 ──────────────────────────

export interface SkyThemeColors {
  bgGradient: string[];
  starGlow: string;
  textColor: string;
  textSecondary: string;
  milkyWayColor: string;
  meteorColor: string;
  borderColor: string;
}

/**
 * sky_theme 설정에 따른 하늘 색상을 반환합니다.
 */
export function getSkyThemeColors(
  skyTheme: 'midnight' | 'aurora' | 'sunset' | 'deep_space'
): SkyThemeColors {
  switch (skyTheme) {
    case 'midnight':
      return {
        bgGradient: ['#020515', '#0a0e27', '#0d1230'],
        starGlow: '#ffffff',
        textColor: '#e6edf3',
        textSecondary: '#8b949e',
        milkyWayColor: '#1a1f4e',
        meteorColor: '#ffffff',
        borderColor: '#1f2937',
      };
    case 'aurora':
      return {
        bgGradient: ['#001122', '#002233', '#003344'],
        starGlow: '#88ffcc',
        textColor: '#ccffee',
        textSecondary: '#77ccaa',
        milkyWayColor: '#004455',
        meteorColor: '#88ffcc',
        borderColor: '#224444',
      };
    case 'sunset':
      return {
        bgGradient: ['#1a0a2e', '#2d1553', '#4a1a6b'],
        starGlow: '#ffcc88',
        textColor: '#ffeedd',
        textSecondary: '#cc9977',
        milkyWayColor: '#3d1f5e',
        meteorColor: '#ffaa55',
        borderColor: '#3d1f5e',
      };
    case 'deep_space':
      return {
        bgGradient: ['#000005', '#050510', '#0a0a1a'],
        starGlow: '#aabbff',
        textColor: '#d0d8ef',
        textSecondary: '#6670a0',
        milkyWayColor: '#0e0e28',
        meteorColor: '#8899ff',
        borderColor: '#151530',
      };
  }
}

// ── 별자리 아이콘 ──────────────────────────

/**
 * 레포 유형에 따른 아이콘을 반환합니다.
 */
export function getRepoTypeIcon(repoType: RepoType): string {
  const icons: Record<RepoType, string> = {
    frontend: '🛡️',
    backend: '🏗️',
    library: '🔨',
    docs: '📜',
    ml: '👁️',
    game: '⚔️',
    mobile: '📱',
    profile: '👑',
    cli: '⚙️',
    other: '⭐',
  };
  return icons[repoType];
}
