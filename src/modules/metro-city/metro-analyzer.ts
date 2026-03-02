// ═══════════════════════════════════════════════════════════════
// 🏗️ Metro City Analyzer - 독립형 데이터 분석기
// ═══════════════════════════════════════════════════════════════
//
// dev-city 코드에 전혀 의존하지 않는 독립 분석기.
// GitHubData를 받아 MetroCityProfile을 생성합니다.

import {
  GitHubData,
  GitHubRepository,
  CityState,
} from '../../types';

// ── 타입 정의 ───────────────────────────────────────────────────

export type MetroType =
  | 'skyscraper'
  | 'hospital'
  | 'school'
  | 'stadium'
  | 'hotel'
  | 'church'
  | 'bank'
  | 'construction';

export interface MetroCityTier {
  tier: number;
  name: string;
  nameKo: string;
  icon: string;
  minScore: number;
}

export interface MetroWeather {
  type: 'sunny' | 'cloudy' | 'rainy' | 'snowy' | 'rainbow' | 'fireworks';
  icon: string;
  label: string;
  labelKo: string;
}

export interface MetroTraffic {
  level: number;
  vehicleCount: number;
  description: string;
}

export interface MetroStats {
  totalBuildings: number;
  totalCommits: number;
  totalStars: number;
  topLanguage: string;
  population: number;
  streakDays: number;
}

export interface MetroBuilding {
  repoName: string;
  description: string | null;
  buildingType: MetroType;
  language: string | null;
  stars: number;
  totalCommits: number;
  gridRow: number;
  gridCol: number;
  isDormant: boolean;
  height: number;
}

export interface MetroCityProfile {
  buildings: MetroBuilding[];
  tier: MetroCityTier;
  weather: MetroWeather;
  traffic: MetroTraffic;
  stats: MetroStats;
  stateUpdate: CityState;
}

// ── 분류 로직 ───────────────────────────────────────────────────

const TIERS: MetroCityTier[] = [
  { tier: 1, name: 'Groundbreaking', nameKo: '착공',         icon: '🏗️', minScore: 0    },
  { tier: 2, name: 'Under Construction', nameKo: '건설중',    icon: '🧱', minScore: 100  },
  { tier: 3, name: 'Development Zone',  nameKo: '개발지구',   icon: '🏘️', minScore: 500  },
  { tier: 4, name: 'New Town',          nameKo: '신도시',     icon: '🏙️', minScore: 1500 },
  { tier: 5, name: 'Metropolis',        nameKo: '메트로폴리스', icon: '🌆', minScore: 4000 },
];

function getTier(score: number): MetroCityTier {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (score >= TIERS[i].minScore) return TIERS[i];
  }
  return TIERS[0];
}

function getWeather(recentCommits: number, totalStars: number): MetroWeather {
  const month = new Date().getMonth();
  if (totalStars >= 1000 || recentCommits > 80)
    return { type: 'fireworks', icon: '🎆', label: 'Milestone!',  labelKo: '달성!' };
  if (recentCommits > 40)
    return { type: 'rainbow',   icon: '🌈', label: 'Productive',  labelKo: '생산적인 날' };
  if (recentCommits > 20)
    return { type: 'sunny',     icon: '☀️',  label: 'Sunny',       labelKo: '맑음' };
  if (month >= 11 || month <= 1)
    return { type: 'snowy',     icon: '🌨️', label: 'Snowy',       labelKo: '눈' };
  if (recentCommits > 5)
    return { type: 'cloudy',    icon: '⛅',  label: 'Cloudy',      labelKo: '흐림' };
  return   { type: 'rainy',     icon: '🌧️', label: 'Rainy',       labelKo: '비' };
}

function classifyMetroBuilding(repo: GitHubRepository): MetroType {
  const combined = `${repo.name} ${repo.description ?? ''} ${repo.topics.join(' ')}`.toLowerCase();

  // 고층 빌딩: 인기 or 커밋 다수
  if (repo.stars >= 200 || repo.totalCommits >= 500) return 'skyscraper';
  // 병원: 헬스케어
  if (/health|medical|hospital|clinic|wellness|fitness|care/.test(combined)) return 'hospital';
  // 학교: 교육
  if (/learn|education|tutorial|course|school|study|exercise|training|bootcamp/.test(combined)) return 'school';
  // 경기장: 스포츠/게임
  if (/sport|game|esport|arena|tournament|competitive|play/.test(combined)) return 'stadium';
  // 은행: 금융/블록체인
  if (/finance|crypto|blockchain|defi|token|payment|bank|trading|fund|analytics/.test(combined)) return 'bank';
  // 교회: 커뮤니티/오픈소스
  if (/community|nonprofit|foundation|open-source|awesome|resource|hub|docs|blog/.test(combined)) return 'church';
  // 호텔: 웹앱/플랫폼
  if (/portfolio|dashboard|platform|saas|app|web|frontend|website|landing/.test(combined)) return 'hotel';
  // 공사현장: 템플릿/보일러플레이트/아카이브
  if (repo.isArchived || /template|starter|boilerplate|wip|draft|scaffold|setup|config/.test(combined)) return 'construction';

  // 언어 기반 폴백
  const lang = (repo.primaryLanguage ?? '').toLowerCase();
  if (lang === 'go' || lang === 'rust')                 return 'skyscraper';
  if (lang === 'python')                               return 'hospital';
  if (lang === 'java' || lang === 'kotlin' || lang === 'scala') return 'bank';
  if (lang === 'swift' || lang === 'dart')             return 'stadium';
  if (lang === 'typescript' || lang === 'javascript')  return 'hotel';

  return 'construction'; // 기본: 공사중 도시
}

// ── 메인 분석 함수 ──────────────────────────────────────────────

function parseTimestamp(value: string): number {
  const parsed = new Date(value).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

export function analyzeMetroCity(
  data: GitHubData,
  previousState: CityState
): MetroCityProfile {
  const now = Date.now();
  const oneYearAgo = now - 365 * 24 * 60 * 60 * 1000;

  // 1. 레포 필터링 (포크 제외, 최대 20개)
  const repos = data.repositories
    .filter(r => !r.isFork)
    .sort((a, b) => (b.stars + b.totalCommits * 0.1) - (a.stars + a.totalCommits * 0.1))
    .slice(0, 20);

  const maxCommits = Math.max(1, ...repos.map(r => r.totalCommits));
  const cols = Math.min(5, Math.max(1, repos.length));

  // 2. 건물 생성
  const buildings: MetroBuilding[] = repos.map((repo, i) => {
    const buildingType = classifyMetroBuilding(repo);
    const heightFactor = Math.log10(Math.max(1, repo.totalCommits)) / Math.log10(Math.max(2, maxCommits));
    const lastUpdateTs = parseTimestamp(repo.pushedAt || repo.updatedAt);
    return {
      repoName:     repo.name,
      description:  repo.description,
      buildingType,
      language:     repo.primaryLanguage,
      stars:        repo.stars,
      totalCommits: repo.totalCommits,
      gridRow:      Math.floor(i / cols),
      gridCol:      i % cols,
      isDormant:    repo.isArchived || lastUpdateTs < oneYearAgo,
      height:       46 + heightFactor * 80,
    };
  });

  // 3. 도시 등급
  const totalStars   = repos.reduce((s, r) => s + r.stars, 0);
  const totalCommits = repos.reduce((s, r) => s + r.totalCommits, 0);
  const score = totalStars * 2 + totalCommits * 0.1 + repos.length * 10;
  const tier = getTier(score);

  // 4. 날씨 (최근 7일 커밋 기반)
  const cutoff = new Date(Date.now() - 7 * 86_400_000).toISOString().split('T')[0];
  const recentCommits = data.contributionCalendar
    .filter(d => d.date >= cutoff)
    .reduce((s, d) => s + d.count, 0);
  const weather = getWeather(recentCommits, totalStars);

  // 5. 교통
  const weekCommitCount = data.commitHistory.filter(c =>
    new Date(c.date).getTime() >= Date.now() - 7 * 86_400_000
  ).length;
  const vehicleCount = Math.min(12, Math.max(0, Math.floor(weekCommitCount / 5)));
  const traffic: MetroTraffic = {
    level:        Math.min(5, Math.ceil(vehicleCount / 2)),
    vehicleCount,
    description:  vehicleCount > 8 ? '혼잡' : vehicleCount > 4 ? '보통' : '한산',
  };

  // 6. 연속 커밋 스트릭
  const calSorted = [...data.contributionCalendar].sort((a, b) => b.date.localeCompare(a.date));
  let streakDays = 0;
  for (const d of calSorted) {
    if (d.count > 0) streakDays++;
    else break;
  }

  // 7. 상위 언어
  const topLanguage = Object.entries(data.languages)
    .sort(([, a], [, b]) => b - a)[0]?.[0] ?? 'TypeScript';

  // 8. 인구 (스타·팔로워·커밋 기반)
  const population = Math.round(totalStars * 120 + data.user.followers * 80 + totalCommits * 2);

  const stats: MetroStats = {
    totalBuildings: buildings.length,
    totalCommits,
    totalStars,
    topLanguage,
    population,
    streakDays,
  };

  const stateUpdate: CityState = {
    tier: tier.tier,
    population,
    buildings: buildings.length,
    lastWeather: weather.type,
  };

  return { buildings, tier, weather, traffic, stats, stateUpdate };
}
