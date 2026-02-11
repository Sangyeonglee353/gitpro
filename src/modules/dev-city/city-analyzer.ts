// ═══════════════════════════════════════════
// 🏙️ City Analyzer - 도시 데이터 분석기
// ═══════════════════════════════════════════
//
// GitHub 레포/커밋/PR/이슈 데이터를 분석하여
// 아이소메트릭 도시의 건물, 날씨, Tier 등을 생성합니다.

import {
  GitHubData,
  GitHubRepository,
  CommitRecord,
  ContributionDay,
  CityState,
} from '../../types';
import {
  classifyBuilding,
  getBuildingInfo,
  getCityTier,
  BuildingType,
  BuildingInfo,
  CityTier,
  WeatherType,
  getWeatherInfo,
  WeatherInfo,
} from './building-mapper';

// ── 타입 정의 ──────────────────────────

/** 도시 내 건물 하나 */
export interface CityBuilding {
  /** 레포 이름 */
  repoName: string;
  /** 레포 설명 */
  description: string | null;
  /** 건물 타입 */
  buildingType: BuildingType;
  /** 건물 메타 정보 */
  info: BuildingInfo;
  /** 주 사용 언어 */
  language: string | null;
  /** GitHub 스타 수 */
  stars: number;
  /** 총 커밋 수 */
  totalCommits: number;
  /** 그리드 행 (아이소메트릭 배치) */
  gridRow: number;
  /** 그리드 열 */
  gridCol: number;
  /** 비활성 여부 */
  isDormant: boolean;
  /** 건물 높이 (px 단위, heightFactor 기반) */
  height: number;
}

/** 도시 교통 (활동 빈도 표현) */
export interface CityTraffic {
  /** 교통량 레벨 (0~5) */
  level: number;
  /** 차량 수 */
  vehicleCount: number;
  /** 설명 */
  description: string;
}

/** 도시 전체 분석 결과 */
export interface CityProfile {
  /** 건물 목록 */
  buildings: CityBuilding[];
  /** 도시 Tier */
  tier: CityTier;
  /** 날씨 */
  weather: WeatherInfo;
  /** 교통 */
  traffic: CityTraffic;
  /** 통계 요약 */
  stats: CityStats;
  /** 도시 상태 (영구 저장) */
  stateUpdate: CityState;
}

/** 도시 통계 */
export interface CityStats {
  totalBuildings: number;
  totalCommits: number;
  totalStars: number;
  totalRepos: number;
  topLanguage: string;
  topBuildingType: string;
  population: number;
  todayCommits: number;
  streakDays: number;
}

// ── 분석 함수 ──────────────────────────

/**
 * GitHub 데이터를 분석하여 도시 프로파일을 생성합니다.
 */
export function analyzeCity(
  data: GitHubData,
  previousState: CityState
): CityProfile {
  // 1. 레포를 건물로 변환
  const buildings = buildCityBuildings(data.repositories, data.commitHistory);

  // 2. 도시 Tier 결정
  const tier = getCityTier(buildings.length);

  // 3. 날씨 결정
  const weather = determineWeather(
    data.contributionCalendar,
    data.pullRequests.merged,
    data.issues.open
  );

  // 4. 교통 분석
  const traffic = analyzeTraffic(data.commitHistory);

  // 5. 통계 계산
  const stats = calculateCityStats(buildings, data);

  // 6. 상태 업데이트
  const stateUpdate: CityState = {
    tier: tier.tier,
    population: stats.population,
    buildings: buildings.length,
    lastWeather: weather.type,
  };

  return {
    buildings,
    tier,
    weather,
    traffic,
    stats,
    stateUpdate,
  };
}

// ── 건물 구축 ──────────────────────────

/**
 * 레포지토리 목록을 건물로 변환합니다.
 */
function buildCityBuildings(
  repos: GitHubRepository[],
  commits: CommitRecord[]
): CityBuilding[] {
  // 레포별 커밋 수 집계
  const commitsByRepo = new Map<string, number>();
  for (const commit of commits) {
    commitsByRepo.set(commit.repo, (commitsByRepo.get(commit.repo) || 0) + 1);
  }

  // Fork 제외, 중요도순 정렬
  const validRepos = repos
    .filter(repo => !repo.isFork)
    .sort((a, b) => {
      const scoreA = (commitsByRepo.get(a.name) || 0) * 2 + a.stars * 10;
      const scoreB = (commitsByRepo.get(b.name) || 0) * 2 + b.stars * 10;
      return scoreB - scoreA;
    });

  // 최대 16개 건물로 제한 (아이소메트릭 뷰에 최적)
  const maxBuildings = 16;
  const selectedRepos = validRepos.slice(0, maxBuildings);

  // 그리드 배치 계산 (최대 4열)
  const gridCols = Math.min(4, selectedRepos.length);

  return selectedRepos.map((repo, index) => {
    const buildingType = classifyBuilding(repo);
    const info = getBuildingInfo(buildingType, repo);

    // 비활성 여부
    const lastUpdate = new Date(repo.pushedAt || repo.updatedAt).getTime();
    const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
    const isDormant = lastUpdate < oneYearAgo;

    // 그리드 위치 (아이소메트릭 배치)
    const gridRow = Math.floor(index / gridCols);
    const gridCol = index % gridCols;

    // 건물 높이: 기본 50px + (높이계수 * 28px) → 범위 78~134px
    const baseHeight = 50;
    const height = baseHeight + info.heightFactor * 28;

    return {
      repoName: repo.name,
      description: repo.description,
      buildingType,
      info,
      language: repo.primaryLanguage,
      stars: repo.stars,
      totalCommits: commitsByRepo.get(repo.name) || repo.totalCommits,
      gridRow,
      gridCol,
      isDormant,
      height,
    };
  });
}

// ── 날씨 결정 ──────────────────────────

/**
 * 최근 활동에 따라 날씨를 결정합니다.
 */
function determineWeather(
  calendar: ContributionDay[],
  mergedPRs: number,
  openIssues: number
): WeatherInfo {
  if (calendar.length === 0) {
    return getWeatherInfo('cloudy');
  }

  // 최근 날짜순 정렬
  const sorted = [...calendar].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  // 오늘/최근 커밋 수
  const today = sorted[0]?.count || 0;
  const yesterday = sorted[1]?.count || 0;
  const twoDaysAgo = sorted[2]?.count || 0;

  // 최근 7일 무활동 체크
  const recent7 = sorted.slice(0, 7);
  const daysWithNoCommit = recent7.filter(d => d.count === 0).length;

  // 우선순위 기반 날씨 결정

  // 🎆 Release는 별도 트리거 필요 (여기서는 PR 머지가 많으면 불꽃놀이)
  if (mergedPRs > 20) {
    return getWeatherInfo('fireworks');
  }

  // 🌋 버그 이슈 다수
  if (openIssues > 15) {
    return getWeatherInfo('volcano');
  }

  // 🌈 PR 머지 성공 (최근에 PR이 머지됨을 간접 판단)
  if (mergedPRs > 5 && today > 0) {
    return getWeatherInfo('rainbow');
  }

  // ❄️ 7일 무활동
  if (daysWithNoCommit >= 7) {
    return getWeatherInfo('snowy');
  }

  // 🌧️ 3일 무활동
  if (today === 0 && yesterday === 0 && twoDaysAgo === 0) {
    return getWeatherInfo('rainy');
  }

  // ☀️ 오늘 커밋 5회 이상
  if (today >= 5) {
    return getWeatherInfo('sunny');
  }

  // 🌤️ 오늘 커밋 1~4회
  if (today >= 1) {
    return getWeatherInfo('cloudy_s');
  }

  // ☁️ 오늘 커밋 없음
  return getWeatherInfo('cloudy');
}

// ── 교통 분석 ──────────────────────────

/**
 * 커밋 빈도를 기반으로 교통량을 산출합니다.
 */
function analyzeTraffic(commits: CommitRecord[]): CityTraffic {
  if (commits.length === 0) {
    return { level: 0, vehicleCount: 0, description: '텅 빈 도로' };
  }

  // 최근 30일 커밋 수
  const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const recentCommits = commits.filter(
    c => new Date(c.date).getTime() > thirtyDaysAgo
  ).length;

  // 교통 레벨 산출
  let level: number;
  let description: string;

  if (recentCommits >= 100) {
    level = 5;
    description = '교통 대혼잡! 🚗🚕🚙';
  } else if (recentCommits >= 60) {
    level = 4;
    description = '도로가 붐비고 있습니다 🚗🚕';
  } else if (recentCommits >= 30) {
    level = 3;
    description = '보통 교통량 🚗';
  } else if (recentCommits >= 10) {
    level = 2;
    description = '한산한 도로 🚙';
  } else if (recentCommits >= 1) {
    level = 1;
    description = '조용한 거리';
  } else {
    level = 0;
    description = '텅 빈 도로';
  }

  const vehicleCount = Math.min(8, Math.ceil(level * 1.5));

  return { level, vehicleCount, description };
}

// ── 통계 ──────────────────────────

function calculateCityStats(
  buildings: CityBuilding[],
  data: GitHubData
): CityStats {
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  const totalCommits = data.commitHistory.length;

  // 최다 사용 언어
  const langEntries = Object.entries(data.languages).sort(
    (a, b) => b[1] - a[1]
  );
  const topLanguage = langEntries[0]?.[0] || 'Unknown';

  // 최다 건물 타입
  const typeCounts = new Map<string, number>();
  for (const b of buildings) {
    typeCounts.set(b.buildingType, (typeCounts.get(b.buildingType) || 0) + 1);
  }
  let topBuildingType = 'warehouse';
  let maxTypeCount = 0;
  for (const [type, count] of typeCounts) {
    if (count > maxTypeCount) {
      maxTypeCount = count;
      topBuildingType = type;
    }
  }

  // 인구 (커밋 수 + 스타 수 + 팔로워)
  const population =
    totalCommits * 5 + totalStars * 20 + data.user.followers * 50;

  // 오늘 커밋 수
  const todayStr = new Date().toISOString().split('T')[0];
  const todayCommits = data.contributionCalendar.find(
    d => d.date === todayStr
  )?.count || 0;

  // 연속 커밋 일수
  const streakDays = calculateStreak(data.contributionCalendar);

  return {
    totalBuildings: buildings.length,
    totalCommits,
    totalStars,
    totalRepos: data.repositories.filter(r => !r.isFork).length,
    topLanguage,
    topBuildingType,
    population,
    todayCommits,
    streakDays,
  };
}

/**
 * 연속 커밋 일수를 계산합니다.
 */
function calculateStreak(calendar: ContributionDay[]): number {
  if (calendar.length === 0) return 0;

  const sorted = [...calendar].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  let streak = 0;
  for (const day of sorted) {
    if (day.count > 0) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
}
