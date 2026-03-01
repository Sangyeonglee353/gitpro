// ═══════════════════════════════════════════
// 🏙️ Building Mapper - 건물 타입 매핑 시스템
// ═══════════════════════════════════════════
//
// 레포지토리 특성을 건물 타입, 아이콘,
// 시각적 스타일로 매핑합니다.

import { GitHubRepository } from '../../types';

// ── 건물 타입 정의 ──────────────────────────

export type BuildingType =
  | 'mall'       // 🏬 웹 프론트엔드 → 쇼핑몰
  | 'factory'    // 🏗️ API/백엔드 → 공장
  | 'warehouse'  // 📦 라이브러리/패키지 → 창고
  | 'garage'     // 🔧 CLI/도구 → 정비소
  | 'lab'        // 🔬 ML/AI → 연구소
  | 'library'    // 📚 문서/블로그 → 도서관
  | 'arcade'     // 🎮 게임 → 오락실
  | 'telecom'    // 📱 모바일 앱 → 통신사
  | 'cityhall'   // 🏛️ 프로필 README → 시청
  | 'ruin';      // 🏚️ 아카이브 레포 → 폐허

/** 건물 정보 */
export interface BuildingInfo {
  type: BuildingType;
  icon: string;
  name: string;
  label: string;
  /** 건물 기본 색상 (메인) */
  colorMain: string;
  /** 건물 보조 색상 */
  colorAccent: string;
  /** 건물 높이 계수 (1~3, 스타/커밋 기반) */
  heightFactor: number;
}

/** 건물 타입별 정보 맵 */
const BUILDING_META: Record<BuildingType, Omit<BuildingInfo, 'heightFactor'>> = {
  mall: {
    type: 'mall',
    icon: '🏬',
    name: 'Shopping Mall',
    label: '쇼핑몰',
    colorMain: '#4FC3F7',
    colorAccent: '#0288D1',
  },
  factory: {
    type: 'factory',
    icon: '🏗️',
    name: 'Factory',
    label: '공장',
    colorMain: '#90A4AE',
    colorAccent: '#546E7A',
  },
  warehouse: {
    type: 'warehouse',
    icon: '📦',
    name: 'Warehouse',
    label: '창고',
    colorMain: '#FFAB40',
    colorAccent: '#E65100',
  },
  garage: {
    type: 'garage',
    icon: '🔧',
    name: 'Garage',
    label: '정비소',
    colorMain: '#7D9E88',
    colorAccent: '#3E6148',
  },
  lab: {
    type: 'lab',
    icon: '🔬',
    name: 'Lab',
    label: '연구소',
    colorMain: '#CE93D8',
    colorAccent: '#7B1FA2',
  },
  library: {
    type: 'library',
    icon: '📚',
    name: 'Library',
    label: '도서관',
    colorMain: '#A1887F',
    colorAccent: '#5D4037',
  },
  arcade: {
    type: 'arcade',
    icon: '🎮',
    name: 'Arcade',
    label: '오락실',
    colorMain: '#FF4081',
    colorAccent: '#C51162',
  },
  telecom: {
    type: 'telecom',
    icon: '📱',
    name: 'Telecom',
    label: '통신사',
    colorMain: '#69F0AE',
    colorAccent: '#00C853',
  },
  cityhall: {
    type: 'cityhall',
    icon: '🏛️',
    name: 'City Hall',
    label: '시청',
    colorMain: '#FFD54F',
    colorAccent: '#F9A825',
  },
  ruin: {
    type: 'ruin',
    icon: '🏚️',
    name: 'Ruin',
    label: '폐허',
    colorMain: '#616161',
    colorAccent: '#424242',
  },
};

// ── 분류 함수 ──────────────────────────

/**
 * 레포지토리를 건물 타입으로 분류합니다.
 */
export function classifyBuilding(repo: GitHubRepository): BuildingType {
  const name = repo.name.toLowerCase();
  const desc = (repo.description || '').toLowerCase();
  const topics = repo.topics.map(t => t.toLowerCase());
  const lang = (repo.primaryLanguage || '').toLowerCase();
  const allText = `${name} ${desc} ${topics.join(' ')}`;

  // 아카이브된 레포만 폐허로 분류 (비활성은 analyzer에서 isDormant으로 시각 처리)
  if (repo.isArchived) {
    return 'ruin';
  }

  // 프로필 README → 시청
  if (name === name.toLowerCase() && (allText.includes('profile') || allText.includes('readme'))) {
    return 'cityhall';
  }

  // ML/AI → 연구소
  if (
    allText.includes('machine-learning') ||
    allText.includes('deep-learning') ||
    allText.includes('tensorflow') ||
    allText.includes('pytorch') ||
    allText.includes('neural') ||
    allText.includes('ai') ||
    allText.includes('ml')
  ) {
    return 'lab';
  }

  // 게임 → 오락실
  if (
    allText.includes('game') ||
    allText.includes('unity') ||
    allText.includes('unreal') ||
    allText.includes('godot') ||
    allText.includes('phaser')
  ) {
    return 'arcade';
  }

  // 모바일 → 통신사
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
    return 'telecom';
  }

  // 문서/블로그 → 도서관
  if (
    allText.includes('docs') ||
    allText.includes('blog') ||
    allText.includes('wiki') ||
    allText.includes('documentation') ||
    allText.includes('til') ||
    lang === 'markdown'
  ) {
    return 'library';
  }

  // CLI/도구 → 정비소
  if (
    allText.includes('cli') ||
    allText.includes('tool') ||
    allText.includes('script') ||
    allText.includes('automation') ||
    lang === 'shell' ||
    lang === 'bash'
  ) {
    return 'garage';
  }

  // 라이브러리/패키지 → 창고
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
    return 'warehouse';
  }

  // 프론트엔드 → 쇼핑몰
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
    return 'mall';
  }

  // 백엔드/API → 공장
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
    return 'factory';
  }

  // 언어 기반 추가 분류
  if (lang === 'typescript' || lang === 'javascript') return 'mall';
  if (lang === 'python' || lang === 'ruby' || lang === 'php') return 'factory';
  if (lang === 'c' || lang === 'c++' || lang === 'rust') return 'garage';
  if (lang === 'jupyter notebook' || lang === 'r') return 'lab';

  // 기타 → 창고
  return 'warehouse';
}

/**
 * 건물 메타 정보를 반환합니다.
 */
export function getBuildingInfo(
  type: BuildingType,
  repo: GitHubRepository
): BuildingInfo {
  const meta = BUILDING_META[type];

  // 높이 계수: 커밋 수 + 스타 수 기반
  const commitScore = Math.min(repo.totalCommits, 500) / 500;
  const starScore = Math.min(repo.stars, 100) / 100;
  const heightFactor = 1 + (commitScore * 1.2 + starScore * 0.8);

  return {
    ...meta,
    heightFactor: Math.min(3, heightFactor),
  };
}

/**
 * 건물 타입 아이콘을 반환합니다.
 */
export function getBuildingIcon(type: BuildingType): string {
  return BUILDING_META[type].icon;
}

// ── 도시 Tier 시스템 ──────────────────────────

export interface CityTier {
  tier: number;
  name: string;
  nameKo: string;
  icon: string;
  /** 최소 레포 수 */
  minRepos: number;
}

const CITY_TIERS: CityTier[] = [
  { tier: 0, name: 'Campsite', nameKo: '캠핑장', icon: '🏕️', minRepos: 0 },
  { tier: 1, name: 'Village', nameKo: '마을', icon: '🏘️', minRepos: 3 },
  { tier: 2, name: 'Town', nameKo: '소도시', icon: '🏙️', minRepos: 6 },
  { tier: 3, name: 'City', nameKo: '도시', icon: '🌆', minRepos: 11 },
  { tier: 4, name: 'Metropolis', nameKo: '메트로폴리스', icon: '🏙️', minRepos: 21 },
  { tier: 5, name: 'Megacity', nameKo: '메가시티', icon: '🌃', minRepos: 41 },
];

/**
 * 레포 수에 따른 도시 Tier를 반환합니다.
 */
export function getCityTier(repoCount: number): CityTier {
  for (let i = CITY_TIERS.length - 1; i >= 0; i--) {
    if (repoCount >= CITY_TIERS[i].minRepos) {
      return CITY_TIERS[i];
    }
  }
  return CITY_TIERS[0];
}

// ── 날씨 시스템 ──────────────────────────

export type WeatherType =
  | 'sunny'     // ☀️ 오늘 커밋 5+
  | 'cloudy_s'  // 🌤️ 오늘 커밋 1~4
  | 'cloudy'    // ☁️ 오늘 커밋 없음
  | 'rainy'     // 🌧️ 3일 무활동
  | 'snowy'     // ❄️ 7일 무활동
  | 'rainbow'   // 🌈 PR 머지 성공
  | 'fireworks' // 🎆 Release 배포
  | 'volcano';  // 🌋 버그 이슈 다수

export interface WeatherInfo {
  type: WeatherType;
  icon: string;
  label: string;
  labelKo: string;
}

const WEATHER_META: Record<WeatherType, Omit<WeatherInfo, 'type'>> = {
  sunny: { icon: '☀️', label: 'Sunny', labelKo: '맑음' },
  cloudy_s: { icon: '🌤️', label: 'Partly Cloudy', labelKo: '구름 약간' },
  cloudy: { icon: '☁️', label: 'Cloudy', labelKo: '흐림' },
  rainy: { icon: '🌧️', label: 'Rainy', labelKo: '비' },
  snowy: { icon: '❄️', label: 'Snowy', labelKo: '눈' },
  rainbow: { icon: '🌈', label: 'Rainbow', labelKo: '무지개' },
  fireworks: { icon: '🎆', label: 'Fireworks', labelKo: '불꽃놀이' },
  volcano: { icon: '🌋', label: 'Volcano', labelKo: '화산' },
};

/**
 * 날씨 메타 정보를 반환합니다.
 */
export function getWeatherInfo(type: WeatherType): WeatherInfo {
  return { type, ...WEATHER_META[type] };
}
