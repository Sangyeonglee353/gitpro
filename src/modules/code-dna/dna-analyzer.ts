// ═══════════════════════════════════════════
// 🧬 DNA Analyzer - 코딩 패턴 분석기
// ═══════════════════════════════════════════
//
// GitHub 데이터를 분석하여 개발자 고유의 DNA 프로파일을 생성합니다.
// 동일한 DNA 패턴은 절대 나오지 않습니다!

import { GitHubData, CommitRecord } from '../../types';

/** DNA 분석 결과 - 시각화에 필요한 모든 데이터 */
export interface DNAProfile {
  /** 상위 언어 분포 (색상 매핑용) */
  languageDistribution: LanguageSlice[];

  /** 시간대별 커밋 분포 (24시간, 파형 생성용) */
  hourlyPattern: number[];

  /** 요일별 활동량 (7개 링 두께) */
  weekdayActivity: WeekdayRing[];

  /** 레포 다양성 지수 (0~1) */
  repoDiversity: number;

  /** 커밋 메시지 키워드 빈도 */
  messageKeywords: KeywordFrequency[];

  /** 전체 활동 밀도 (0~1) */
  activityDensity: number;

  /** 코딩 스타일 분류 */
  codingStyle: CodingStyle;

  /** 고유 시드 (해시 기반, 패턴 재현용) */
  uniqueSeed: number;

  /** 총 커밋 수 */
  totalCommits: number;

  /** 총 레포 수 */
  totalRepos: number;

  /** 사용 언어 수 */
  languageCount: number;
}

export interface LanguageSlice {
  name: string;
  percent: number;
  color: string;
}

export interface WeekdayRing {
  day: string;
  dayKo: string;
  activity: number;       // 0~1 정규화된 활동량
  rawCommits: number;
}

export interface KeywordFrequency {
  keyword: string;
  icon: string;
  count: number;
  percent: number;
}

export type CodingStyle =
  | 'night_owl'      // 야간형 (18~3시 커밋이 주)
  | 'early_bird'     // 새벽형 (4~8시 커밋이 주)
  | 'day_worker'     // 주간형 (9~17시 커밋이 주)
  | 'balanced';      // 균형형

/** 요일 이름 매핑 */
const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WEEKDAYS_KO = ['일', '월', '화', '수', '목', '금', '토'];

/** 커밋 메시지 키워드 패턴 */
const KEYWORD_PATTERNS: Array<{ pattern: RegExp; keyword: string; icon: string }> = [
  { pattern: /^feat(\(|:|\s|!)/i, keyword: 'feat', icon: '⭐' },
  { pattern: /^fix(\(|:|\s|!)/i, keyword: 'fix', icon: '🔧' },
  { pattern: /^docs(\(|:|\s|!)/i, keyword: 'docs', icon: '📝' },
  { pattern: /^style(\(|:|\s|!)/i, keyword: 'style', icon: '🎨' },
  { pattern: /^refactor(\(|:|\s|!)/i, keyword: 'refactor', icon: '♻️' },
  { pattern: /^test(\(|:|\s|!)/i, keyword: 'test', icon: '🧪' },
  { pattern: /^chore(\(|:|\s|!)/i, keyword: 'chore', icon: '🔩' },
  { pattern: /^perf(\(|:|\s|!)/i, keyword: 'perf', icon: '⚡' },
  { pattern: /^ci(\(|:|\s|!)/i, keyword: 'ci', icon: '🤖' },
  { pattern: /^build(\(|:|\s|!)/i, keyword: 'build', icon: '📦' },
];

/**
 * GitHub 데이터를 분석하여 DNA 프로파일을 생성합니다.
 */
export function analyzeDNA(data: GitHubData): DNAProfile {
  const commits = data.commitHistory;

  // 1. 언어 분포 분석
  const languageDistribution = analyzeLanguages(data.languages);

  // 2. 시간대별 커밋 분포 (24시간)
  const hourlyPattern = analyzeHourlyPattern(commits);

  // 3. 요일별 활동량
  const weekdayActivity = analyzeWeekdayActivity(commits);

  // 4. 레포 다양성 (Shannon entropy 기반)
  const repoDiversity = calculateRepoDiversity(data);

  // 5. 커밋 메시지 키워드 분석
  const messageKeywords = analyzeMessageKeywords(commits);

  // 6. 활동 밀도 계산
  const activityDensity = calculateActivityDensity(data);

  // 7. 코딩 스타일 분류
  const codingStyle = determineCodingStyle(hourlyPattern);

  // 8. 고유 시드 생성 (사용자 데이터 기반 해시)
  const uniqueSeed = generateUniqueSeed(data);

  return {
    languageDistribution,
    hourlyPattern,
    weekdayActivity,
    repoDiversity,
    messageKeywords,
    activityDensity,
    codingStyle,
    uniqueSeed,
    totalCommits: commits.length,
    totalRepos: data.repositories.length,
    languageCount: Object.keys(data.languages).length,
  };
}

/**
 * 언어 분포를 분석합니다.
 */
function analyzeLanguages(languages: Record<string, number>): LanguageSlice[] {
  const total = Object.values(languages).reduce((a, b) => a + b, 0);
  if (total === 0) return [];

  return Object.entries(languages)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([name, size]) => ({
      name,
      percent: (size / total) * 100,
      color: '', // dna-colors.ts에서 채움
    }));
}

/**
 * 24시간 커밋 분포를 분석합니다 (파형 생성용).
 */
function analyzeHourlyPattern(commits: CommitRecord[]): number[] {
  const hours = new Array(24).fill(0);
  for (const commit of commits) {
    hours[commit.hour]++;
  }

  // 최대값으로 정규화 (0~1)
  const max = Math.max(...hours, 1);
  return hours.map(h => h / max);
}

/**
 * 요일별 활동량을 분석합니다 (7개 동심원 링).
 */
function analyzeWeekdayActivity(commits: CommitRecord[]): WeekdayRing[] {
  const days = new Array(7).fill(0);
  for (const commit of commits) {
    days[commit.dayOfWeek]++;
  }

  const max = Math.max(...days, 1);
  return days.map((count, i) => ({
    day: WEEKDAYS[i],
    dayKo: WEEKDAYS_KO[i],
    activity: count / max,
    rawCommits: count,
  }));
}

/**
 * 레포 다양성을 Shannon entropy로 계산합니다.
 */
function calculateRepoDiversity(data: GitHubData): number {
  const repoCommitCounts: Record<string, number> = {};
  for (const commit of data.commitHistory) {
    repoCommitCounts[commit.repo] = (repoCommitCounts[commit.repo] || 0) + 1;
  }

  const total = data.commitHistory.length;
  if (total === 0) return 0;

  const counts = Object.values(repoCommitCounts);
  let entropy = 0;
  for (const count of counts) {
    const p = count / total;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }

  // 최대 엔트로피로 정규화 (0~1)
  const maxEntropy = Math.log2(Math.max(counts.length, 1));
  return maxEntropy > 0 ? entropy / maxEntropy : 0;
}

/**
 * 커밋 메시지의 Conventional Commit 키워드를 분석합니다.
 */
function analyzeMessageKeywords(commits: CommitRecord[]): KeywordFrequency[] {
  const keywordCounts: Record<string, { icon: string; count: number }> = {};

  for (const commit of commits) {
    const msg = commit.message.trim();
    for (const { pattern, keyword, icon } of KEYWORD_PATTERNS) {
      if (pattern.test(msg)) {
        if (!keywordCounts[keyword]) {
          keywordCounts[keyword] = { icon, count: 0 };
        }
        keywordCounts[keyword].count++;
        break; // 하나의 커밋은 하나의 키워드만
      }
    }
  }

  const total = Object.values(keywordCounts).reduce((sum, v) => sum + v.count, 0);

  return Object.entries(keywordCounts)
    .map(([keyword, { icon, count }]) => ({
      keyword,
      icon,
      count,
      percent: total > 0 ? (count / total) * 100 : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * 전체 활동 밀도를 계산합니다.
 */
function calculateActivityDensity(data: GitHubData): number {
  const calendar = data.contributionCalendar;
  if (calendar.length === 0) return 0;

  const activeDays = calendar.filter(d => d.count > 0).length;
  const density = activeDays / calendar.length;

  // 활동 강도도 반영
  const totalContributions = calendar.reduce((sum, d) => sum + d.count, 0);
  const avgContributions = totalContributions / calendar.length;
  const intensityFactor = Math.min(1, avgContributions / 5); // 일 평균 5회 기준

  return Math.min(1, (density + intensityFactor) / 2);
}

/**
 * 주 활동 시간대로 코딩 스타일을 결정합니다.
 */
function determineCodingStyle(hourlyPattern: number[]): CodingStyle {
  // 시간대 합계
  const nightSum = sumRange(hourlyPattern, 18, 24) + sumRange(hourlyPattern, 0, 4);  // 18~3시
  const earlySum = sumRange(hourlyPattern, 4, 9);   // 4~8시
  const daySum = sumRange(hourlyPattern, 9, 18);     // 9~17시

  const total = nightSum + earlySum + daySum;
  if (total === 0) return 'balanced';

  const nightRatio = nightSum / total;
  const earlyRatio = earlySum / total;
  const dayRatio = daySum / total;

  if (nightRatio > 0.5) return 'night_owl';
  if (earlyRatio > 0.35) return 'early_bird';
  if (dayRatio > 0.6) return 'day_worker';
  return 'balanced';
}

function sumRange(arr: number[], from: number, to: number): number {
  let sum = 0;
  for (let i = from; i < to && i < arr.length; i++) {
    sum += arr[i];
  }
  return sum;
}

/**
 * 사용자 데이터 기반으로 고유 시드를 생성합니다 (간단한 해시).
 */
function generateUniqueSeed(data: GitHubData): number {
  const str = [
    data.user.login,
    data.user.createdAt,
    data.repositories.length,
    data.commitHistory.length,
    Object.keys(data.languages).join(','),
  ].join('|');

  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash |= 0; // Convert to 32-bit int
  }
  return Math.abs(hash);
}

/**
 * 코딩 스타일 정보를 반환합니다.
 */
export function getCodingStyleInfo(style: CodingStyle): {
  labelKo: string;
  labelEn: string;
  icon: string;
  waveDescription: string;
} {
  const styles: Record<CodingStyle, { labelKo: string; labelEn: string; icon: string; waveDescription: string }> = {
    night_owl: {
      labelKo: '야간형 개발자',
      labelEn: 'Night Owl',
      icon: '🌙',
      waveDescription: '긴 파장 + 깊은 진폭',
    },
    early_bird: {
      labelKo: '새벽형 개발자',
      labelEn: 'Early Bird',
      icon: '🌅',
      waveDescription: '짧은 파장 + 높은 주기',
    },
    day_worker: {
      labelKo: '주간형 개발자',
      labelEn: 'Day Worker',
      icon: '☀️',
      waveDescription: '중간 파장 + 안정 진폭',
    },
    balanced: {
      labelKo: '균형형 개발자',
      labelEn: 'Balanced Coder',
      icon: '⚖️',
      waveDescription: '다양한 파형 혼합',
    },
  };

  return styles[style];
}
