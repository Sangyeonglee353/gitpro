// ═══════════════════════════════════════════
// 🌌 Constellation Analyzer - 별자리 데이터 분석기
// ═══════════════════════════════════════════
//
// GitHub 레포/커밋/PR/이슈 데이터를 분석하여
// 밤하늘의 별자리, 유성, 성운 등 천체 데이터를 생성합니다.

import {
  GitHubData,
  GitHubRepository,
  CommitRecord,
} from '../../types';
import {
  getConstellationName,
  getStarColor,
  classifyRepoType,
  RepoType,
} from './star-mapper';

// ── 타입 정의 ──────────────────────────

/** 별 (단일 커밋 기반) */
export interface Star {
  /** 별자리 내 상대 X 좌표 (0~1) */
  x: number;
  /** 별자리 내 상대 Y 좌표 (0~1) */
  y: number;
  /** 밝기 (0~1) — 변경 라인 수 비례 */
  brightness: number;
  /** 크기 (1~5) */
  size: number;
  /** 색상 */
  color: string;
  /** 커밋 메시지 (첫 20자) */
  label: string;
}

/** 별자리 (레포지토리 기반) */
export interface Constellation {
  /** 레포 이름 */
  repoName: string;
  /** 별자리 이름 (자동 생성) */
  constellationName: string;
  /** 레포 분류 */
  repoType: RepoType;
  /** 주 언어 */
  language: string | null;
  /** 별 목록 */
  stars: Star[];
  /** 별 연결 (인덱스 쌍) */
  connections: Array<[number, number]>;
  /** 전체 캔버스 내 위치 X (0~1) */
  cx: number;
  /** 전체 캔버스 내 위치 Y (0~1) */
  cy: number;
  /** 별자리 반지름 (레포 크기 비례) */
  radius: number;
  /** 스타(GitHub star) 수 */
  starCount: number;
  /** 총 커밋 수 */
  totalCommits: number;
  /** 비활성 여부 */
  isDormant: boolean;
}

/** 유성 (머지된 PR) */
export interface Meteor {
  /** 시작 X (0~1) */
  x1: number;
  /** 시작 Y (0~1) */
  y1: number;
  /** 끝 X (0~1) */
  x2: number;
  /** 끝 Y (0~1) */
  y2: number;
  /** 밝기 (0~1) */
  brightness: number;
  /** 애니메이션 딜레이 (초) */
  delay: number;
}

/** 성운 (오픈 이슈) */
export interface Nebula {
  /** X 좌표 (0~1) */
  x: number;
  /** Y 좌표 (0~1) */
  y: number;
  /** 크기 (0~1) */
  size: number;
  /** 색상 */
  color: string;
  /** 투명도 */
  opacity: number;
}

/** 하늘 배경 정보 */
export interface SkyBackground {
  /** 하늘 타입 */
  type: 'dawn' | 'day' | 'night';
  /** 개발자의 가장 활동적인 시간대 */
  peakHour: number;
  /** 하늘 그라데이션 색상들 */
  colors: string[];
  /** 은하수 표시 여부 */
  showMilkyWay: boolean;
}

/** 별자리 전체 분석 결과 */
export interface ConstellationProfile {
  /** 별자리 목록 */
  constellations: Constellation[];
  /** 유성 목록 */
  meteors: Meteor[];
  /** 성운 목록 */
  nebulas: Nebula[];
  /** 하늘 배경 */
  sky: SkyBackground;
  /** 통계 요약 */
  stats: ConstellationStats;
}

/** 통계 */
export interface ConstellationStats {
  totalStars: number;
  totalConstellations: number;
  totalMeteors: number;
  totalNebulas: number;
  brightestStar: string;
  largestConstellation: string;
  totalGitHubStars: number;
  totalCommits: number;
}

// ── 분석 함수 ──────────────────────────

/**
 * GitHub 데이터를 분석하여 별자리 프로파일을 생성합니다.
 */
export function analyzeConstellation(
  data: GitHubData,
  maxConstellations: number
): ConstellationProfile {
  // 1. 레포를 별자리로 변환
  const allConstellations = buildConstellations(data.repositories, data.commitHistory);

  // 2. 중요도순 정렬 후 상위 N개 선택
  const sortedConstellations = allConstellations
    .sort((a, b) => {
      // 커밋 많은 순 + 스타 많은 순
      const scoreA = a.totalCommits * 2 + a.starCount * 10;
      const scoreB = b.totalCommits * 2 + b.starCount * 10;
      return scoreB - scoreA;
    })
    .slice(0, maxConstellations);

  // 3. 캔버스 위치 할당 (충돌 방지 배치)
  assignPositions(sortedConstellations);

  // 4. 유성 생성 (머지된 PR)
  const meteors = buildMeteors(data.pullRequests.merged);

  // 5. 성운 생성 (오픈 이슈)
  const nebulas = buildNebulas(data.issues.open, sortedConstellations);

  // 6. 하늘 배경 결정
  const sky = determineSky(data.commitHistory);

  // 7. 통계
  const stats = calculateStats(sortedConstellations, meteors, nebulas, data);

  return {
    constellations: sortedConstellations,
    meteors,
    nebulas,
    sky,
    stats,
  };
}

// ── 별자리 구축 ──────────────────────────

/**
 * 레포지토리 목록을 별자리로 변환합니다.
 */
function buildConstellations(
  repos: GitHubRepository[],
  commits: CommitRecord[]
): Constellation[] {
  // 레포별 커밋 그룹핑
  const commitsByRepo = new Map<string, CommitRecord[]>();
  for (const commit of commits) {
    if (!commitsByRepo.has(commit.repo)) {
      commitsByRepo.set(commit.repo, []);
    }
    commitsByRepo.get(commit.repo)!.push(commit);
  }

  return repos
    .filter(repo => !repo.isFork) // Fork는 제외
    .map(repo => {
      const repoCommits = commitsByRepo.get(repo.name) || [];
      const repoType = classifyRepoType(repo);
      const constellationName = getConstellationName(repo.name, repoType);

      // 커밋 → 별 변환
      const stars = buildStars(repoCommits, repo.primaryLanguage);

      // 별 연결선 생성 (MST-like 연결)
      const connections = buildConnections(stars);

      // 비활성 여부 (1년 이상 미업데이트)
      const lastUpdate = new Date(repo.pushedAt || repo.updatedAt).getTime();
      const oneYearAgo = Date.now() - 365 * 24 * 60 * 60 * 1000;
      const isDormant = lastUpdate < oneYearAgo;

      return {
        repoName: repo.name,
        constellationName,
        repoType,
        language: repo.primaryLanguage,
        stars,
        connections,
        cx: 0,
        cy: 0,
        radius: Math.min(0.15, Math.max(0.05, Math.sqrt(repoCommits.length) * 0.012)),
        starCount: repo.stars,
        totalCommits: repoCommits.length,
        isDormant,
      };
    });
}

/**
 * 커밋들을 별로 변환합니다.
 */
function buildStars(commits: CommitRecord[], language: string | null): Star[] {
  if (commits.length === 0) {
    // 커밋이 없으면 기본 별 1개
    return [{
      x: 0.5,
      y: 0.5,
      brightness: 0.3,
      size: 1,
      color: getStarColor(language),
      label: '',
    }];
  }

  // 최대 15개 별로 제한 (너무 많으면 시각적으로 복잡)
  const maxStars = 15;
  const step = Math.max(1, Math.floor(commits.length / maxStars));
  const selectedCommits = commits.filter((_, i) => i % step === 0).slice(0, maxStars);

  // 변경량 최대값 (정규화용)
  const maxChanges = Math.max(
    1,
    ...selectedCommits.map(c => c.additions + c.deletions)
  );

  return selectedCommits.map((commit, i) => {
    const changes = commit.additions + commit.deletions;
    const brightness = Math.max(0.2, Math.min(1, changes / maxChanges));
    const size = Math.max(1, Math.min(5, Math.ceil(brightness * 4)));

    // 시간 기반 위치 매핑 (골든 앵글 스파이럴)
    const goldenAngle = Math.PI * (3 - Math.sqrt(5));
    const angle = i * goldenAngle;
    const r = Math.sqrt(i / selectedCommits.length) * 0.4;
    const x = 0.5 + r * Math.cos(angle);
    const y = 0.5 + r * Math.sin(angle);

    return {
      x: Math.max(0.05, Math.min(0.95, x)),
      y: Math.max(0.05, Math.min(0.95, y)),
      brightness,
      size,
      color: getStarColor(language),
      label: commit.message.substring(0, 20),
    };
  });
}

/**
 * 별들을 가까운 이웃끼리 연결하는 선을 생성합니다.
 * (간단한 최근접 이웃 알고리즘)
 */
function buildConnections(stars: Star[]): Array<[number, number]> {
  if (stars.length < 2) return [];

  const connections: Array<[number, number]> = [];
  const connected = new Set<number>([0]);

  // 프림 알고리즘 변형 - 최소 신장 트리
  while (connected.size < stars.length) {
    let bestDist = Infinity;
    let bestFrom = -1;
    let bestTo = -1;

    for (const from of connected) {
      for (let to = 0; to < stars.length; to++) {
        if (connected.has(to)) continue;
        const dx = stars[from].x - stars[to].x;
        const dy = stars[from].y - stars[to].y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < bestDist) {
          bestDist = dist;
          bestFrom = from;
          bestTo = to;
        }
      }
    }

    if (bestTo === -1) break;
    connections.push([bestFrom, bestTo]);
    connected.add(bestTo);
  }

  return connections;
}

// ── 위치 할당 ──────────────────────────

/**
 * 별자리들을 캔버스에 겹치지 않게 배치합니다.
 */
function assignPositions(constellations: Constellation[]): void {
  if (constellations.length === 0) return;

  // 황금 나선 배치
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < constellations.length; i++) {
    const angle = i * goldenAngle;
    const r = 0.15 + Math.sqrt(i / constellations.length) * 0.3;

    constellations[i].cx = 0.5 + r * Math.cos(angle);
    constellations[i].cy = 0.5 + r * Math.sin(angle);

    // 경계 안에 유지
    constellations[i].cx = Math.max(0.12, Math.min(0.88, constellations[i].cx));
    constellations[i].cy = Math.max(0.15, Math.min(0.85, constellations[i].cy));
  }
}

// ── 유성 (PR 기반) ──────────────────────────

/**
 * 머지된 PR 수에 따라 유성을 생성합니다.
 */
function buildMeteors(mergedPRCount: number): Meteor[] {
  const count = Math.min(8, Math.max(1, Math.ceil(mergedPRCount / 5)));
  const meteors: Meteor[] = [];

  for (let i = 0; i < count; i++) {
    // 랜덤 시드: i 기반으로 결정론적
    const seed1 = ((i * 137 + 83) % 100) / 100;
    const seed2 = ((i * 241 + 47) % 100) / 100;
    const angle = (Math.PI / 6) + (seed1 * Math.PI / 3);
    const length = 0.08 + seed2 * 0.12;

    const x1 = 0.1 + seed1 * 0.8;
    const y1 = 0.05 + seed2 * 0.3;

    meteors.push({
      x1,
      y1,
      x2: x1 + Math.cos(angle) * length,
      y2: y1 + Math.sin(angle) * length,
      brightness: 0.5 + seed1 * 0.5,
      delay: i * 2.5 + seed2 * 3,
    });
  }

  return meteors;
}

// ── 성운 (이슈 기반) ──────────────────────────

/**
 * 오픈 이슈 수에 따라 성운을 생성합니다.
 */
function buildNebulas(
  openIssueCount: number,
  constellations: Constellation[]
): Nebula[] {
  const count = Math.min(5, Math.max(1, Math.ceil(openIssueCount / 3)));
  const nebulas: Nebula[] = [];

  const nebulaColors = [
    '#FF6B9D', '#C44DFF', '#4DA6FF', '#47D4A0', '#FFB74D',
  ];

  for (let i = 0; i < count; i++) {
    // 별자리 근처에 배치
    const nearIdx = i % Math.max(1, constellations.length);
    const near = constellations[nearIdx];

    const offsetX = ((i * 173 + 29) % 100 - 50) / 500;
    const offsetY = ((i * 211 + 67) % 100 - 50) / 500;

    nebulas.push({
      x: near ? Math.max(0.05, Math.min(0.95, near.cx + offsetX)) : 0.3 + i * 0.15,
      y: near ? Math.max(0.05, Math.min(0.95, near.cy + offsetY)) : 0.4 + i * 0.1,
      size: 0.03 + (openIssueCount > 10 ? 0.02 : 0),
      color: nebulaColors[i % nebulaColors.length],
      opacity: 0.15 + ((i * 43) % 20) / 100,
    });
  }

  return nebulas;
}

// ── 하늘 배경 ──────────────────────────

/**
 * 커밋 시간 분포에 따라 하늘 배경을 결정합니다.
 */
function determineSky(commits: CommitRecord[]): SkyBackground {
  if (commits.length === 0) {
    return {
      type: 'night',
      peakHour: 22,
      colors: ['#0a0e27', '#131a3a', '#1a1f4e'],
      showMilkyWay: true,
    };
  }

  // 시간대별 커밋 수
  const hourBuckets = new Array(24).fill(0);
  for (const commit of commits) {
    hourBuckets[commit.hour]++;
  }

  // 가장 활동적인 시간
  const peakHour = hourBuckets.indexOf(Math.max(...hourBuckets));

  // 새벽형 (4~8시)
  const dawnCommits = hourBuckets.slice(4, 9).reduce((a, b) => a + b, 0);
  // 주간형 (9~17시)
  const dayCommits = hourBuckets.slice(9, 18).reduce((a, b) => a + b, 0);
  // 야간형 (18~3시)
  const nightCommits = [
    ...hourBuckets.slice(18, 24),
    ...hourBuckets.slice(0, 4),
  ].reduce((a, b) => a + b, 0);

  const total = dawnCommits + dayCommits + nightCommits;

  if (total === 0) {
    return {
      type: 'night',
      peakHour: 22,
      colors: ['#0a0e27', '#131a3a', '#1a1f4e'],
      showMilkyWay: true,
    };
  }

  if (dawnCommits / total > 0.35) {
    // 새벽형
    return {
      type: 'dawn',
      peakHour,
      colors: ['#2d1b69', '#6b3fa0', '#c77dba', '#f4a7bb'],
      showMilkyWay: false,
    };
  }

  if (dayCommits / total > 0.5) {
    // 주간형
    return {
      type: 'day',
      peakHour,
      colors: ['#0f1b4c', '#1a2980', '#26437b', '#384d7e'],
      showMilkyWay: false,
    };
  }

  // 야간형 (기본)
  return {
    type: 'night',
    peakHour,
    colors: ['#020515', '#0a0e27', '#0d1230'],
    showMilkyWay: true,
  };
}

// ── 통계 ──────────────────────────

function calculateStats(
  constellations: Constellation[],
  meteors: Meteor[],
  nebulas: Nebula[],
  data: GitHubData
): ConstellationStats {
  const totalStars = constellations.reduce((sum, c) => sum + c.stars.length, 0);
  const totalGitHubStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);

  // 가장 밝은 별 (가장 큰 커밋 변경량의 레포)
  let brightestRepo = '';
  let maxCommits = 0;
  for (const c of constellations) {
    if (c.totalCommits > maxCommits) {
      maxCommits = c.totalCommits;
      brightestRepo = c.repoName;
    }
  }

  // 가장 큰 별자리 (별이 가장 많은)
  let largestRepo = '';
  let maxStars = 0;
  for (const c of constellations) {
    if (c.stars.length > maxStars) {
      maxStars = c.stars.length;
      largestRepo = c.repoName;
    }
  }

  return {
    totalStars,
    totalConstellations: constellations.length,
    totalMeteors: meteors.length,
    totalNebulas: nebulas.length,
    brightestStar: brightestRepo,
    largestConstellation: largestRepo,
    totalGitHubStars,
    totalCommits: data.commitHistory.length,
  };
}
