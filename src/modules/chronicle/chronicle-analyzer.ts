// ═══════════════════════════════════════════
// 📜 Chronicle Analyzer - 마일스톤 분석 및 챕터 생성기
// ═══════════════════════════════════════════
//
// GitHub 데이터의 마일스톤을 분석하여
// RPG 퀘스트 로그 형식의 챕터를 생성합니다.

import {
  GitHubData,
  MilestoneEvent,
  MilestoneType,
  ChronicleState,
} from '../../types';

// ── 타입 정의 ──────────────────────────

/** 연대기 챕터 */
export interface ChronicleChapter {
  /** 챕터 번호 (1부터 시작) */
  number: number;

  /** 챕터 제목 (RPG 스타일) */
  title: string;

  /** 챕터 부제목 */
  subtitle: string;

  /** 이벤트 날짜 */
  date: string;

  /** 아이콘 이모지 */
  icon: string;

  /** RPG 등급 (난이도/중요도) */
  rank: ChapterRank;

  /** 상세 설명 (ko/en) */
  descriptionKo: string;
  descriptionEn: string;

  /** 관련 데이터 */
  details: Record<string, unknown>;

  /** 마일스톤 타입 */
  type: MilestoneType;
}

export type ChapterRank = 'S' | 'A' | 'B' | 'C' | 'D';

/** 연대기 프로파일 (분석 결과) */
export interface ChronicleProfile {
  /** 감지된 챕터 목록 */
  chapters: ChronicleChapter[];

  /** 현재 진행 중인 퀘스트 */
  activeQuest: ActiveQuest | null;

  /** 전체 통계 요약 */
  summary: ChronicleSummary;

  /** 개발자 칭호 */
  devTitle: string;

  /** 개발자 레벨 (챕터 수 기반) */
  devLevel: number;

  /** 총 경험치 (EXP) */
  totalExp: number;
}

export interface ActiveQuest {
  name: string;
  description: string;
  icon: string;
  progress: number; // 0~100
  target: string;
}

export interface ChronicleSummary {
  totalChapters: number;
  firstEventDate: string;
  latestEventDate: string;
  journeyDays: number;
  languagesLearned: number;
  reposCreated: number;
  totalStars: number;
  totalCommits: number;
}

// ── 챕터 제목 매핑 ──────────────────────────

interface MilestoneTemplate {
  icon: string;
  rank: ChapterRank;
  titleKo: string;
  titleEn: string;
  subtitleKo: (details: Record<string, unknown>) => string;
  subtitleEn: (details: Record<string, unknown>) => string;
  descKo: (details: Record<string, unknown>) => string;
  descEn: (details: Record<string, unknown>) => string;
}

const MILESTONE_TEMPLATES: Record<MilestoneType, MilestoneTemplate> = {
  first_commit: {
    icon: '🌱',
    rank: 'A',
    titleKo: '여정의 시작',
    titleEn: 'The Beginning',
    subtitleKo: (d) => `첫 번째 커밋이 탄생한 날`,
    subtitleEn: (d) => `The day the first commit was born`,
    descKo: (d) => `${d.repo || '알 수 없는 레포'}에 첫 커밋을 남겼습니다. 위대한 여정의 시작입니다!`,
    descEn: (d) => `Made the first commit to ${d.repo || 'unknown repo'}. The great journey begins!`,
  },
  first_repo: {
    icon: '📦',
    rank: 'A',
    titleKo: '기초 공사',
    titleEn: 'Laying the Foundation',
    subtitleKo: (d) => `첫 번째 레포지토리 "${d.repoName}" 생성`,
    subtitleEn: (d) => `Created first repository "${d.repoName}"`,
    descKo: (d) => `"${d.repoName}" — 당신의 첫 번째 성채가 세워졌습니다!`,
    descEn: (d) => `"${d.repoName}" — Your first fortress has been built!`,
  },
  first_pr_merged: {
    icon: '🤝',
    rank: 'A',
    titleKo: '각성',
    titleEn: 'The Awakening',
    subtitleKo: (d) => `다른 레포에 첫 기여`,
    subtitleEn: (d) => `First contribution to another repo`,
    descKo: (d) => `오픈소스 세계에 첫 발을 내딛었습니다. PR이 머지되었습니다!`,
    descEn: (d) => `Stepped into the open source world. A PR has been merged!`,
  },
  first_star: {
    icon: '⭐',
    rank: 'B',
    titleKo: '인정',
    titleEn: 'Recognition',
    subtitleKo: () => `첫 번째 스타를 받았습니다`,
    subtitleEn: () => `Received the first star`,
    descKo: () => `누군가 당신의 코드를 인정했습니다. 첫 번째 별이 빛납니다!`,
    descEn: () => `Someone recognized your code. The first star shines!`,
  },
  first_follower: {
    icon: '👤',
    rank: 'B',
    titleKo: '동료 획득',
    titleEn: 'Companion Joined',
    subtitleKo: () => `첫 팔로워가 생겼습니다`,
    subtitleEn: () => `Gained the first follower`,
    descKo: () => `당신의 모험을 따르는 동료가 나타났습니다!`,
    descEn: () => `A companion who follows your adventure has appeared!`,
  },
  streak_30: {
    icon: '🔥',
    rank: 'S',
    titleKo: '불꽃의 시련',
    titleEn: 'The Grind',
    subtitleKo: (d) => `${d.days || 30}일 연속 커밋 달성!`,
    subtitleEn: (d) => `Achieved ${d.days || 30}-day commit streak!`,
    descKo: (d) => `${d.days || 30}일 연속으로 코드를 작성했습니다. 당신의 의지는 강철보다 단단합니다!`,
    descEn: (d) => `Coded for ${d.days || 30} consecutive days. Your will is harder than steel!`,
  },
  new_language: {
    icon: '🌍',
    rank: 'B',
    titleKo: '새로운 무기 습득',
    titleEn: 'New Weapon Acquired',
    subtitleKo: (d) => `${d.language || '새 언어'}를 배웠습니다`,
    subtitleEn: (d) => `Learned ${d.language || 'a new language'}`,
    descKo: (d) => `${d.language}의 힘을 얻었습니다! "${d.repo}" 프로젝트에서 처음 사용했습니다.`,
    descEn: (d) => `Gained the power of ${d.language}! First used in "${d.repo}" project.`,
  },
  stars_100: {
    icon: '👑',
    rank: 'S',
    titleKo: '떠오르는 별',
    titleEn: 'Rising Star',
    subtitleKo: (d) => `총 ${d.totalStars || 100}개의 스타 달성!`,
    subtitleEn: (d) => `Achieved ${d.totalStars || 100} total stars!`,
    descKo: (d) => `당신의 별이 100개를 넘었습니다. 이제 밤하늘에서도 보입니다!`,
    descEn: (d) => `Your stars exceeded 100. Now visible even in the night sky!`,
  },
  repo_created: {
    icon: '🏗️',
    rank: 'C',
    titleKo: '새로운 탐험',
    titleEn: 'New Expedition',
    subtitleKo: (d) => `"${d.repoName}" 레포 생성`,
    subtitleEn: (d) => `Created "${d.repoName}" repository`,
    descKo: (d) => `새로운 프로젝트 "${d.repoName}"를 시작했습니다.${d.language ? ` (${d.language})` : ''}`,
    descEn: (d) => `Started new project "${d.repoName}".${d.language ? ` (${d.language})` : ''}`,
  },
};

// ── 랭크별 EXP ──────────────────────────

const RANK_EXP: Record<ChapterRank, number> = {
  S: 500,
  A: 300,
  B: 200,
  C: 100,
  D: 50,
};

// ── 분석 함수 ──────────────────────────

/**
 * GitHub 데이터를 분석하여 연대기 프로파일을 생성합니다.
 */
export function analyzeChronicle(
  data: GitHubData,
  maxChapters: number,
  state: ChronicleState
): ChronicleProfile {
  const milestones = data.milestones;

  // 1. 마일스톤을 챕터로 변환
  const allChapters = convertToChapters(milestones);

  // 2. 중복 제거 및 중요도 순 정렬, 상위 N개 선택
  const filteredChapters = filterAndPrioritize(allChapters, maxChapters);

  // 3. 챕터 번호 재부여
  filteredChapters.forEach((ch, i) => {
    ch.number = i + 1;
  });

  // 4. 활성 퀘스트 감지
  const activeQuest = detectActiveQuest(data, filteredChapters);

  // 5. 요약 통계 계산
  const summary = calculateSummary(data, filteredChapters);

  // 6. 칭호 결정
  const devTitle = determineDevTitle(data, filteredChapters);

  // 7. 레벨 & EXP 계산
  const totalExp = filteredChapters.reduce((sum, ch) => sum + RANK_EXP[ch.rank], 0);
  const devLevel = Math.max(1, Math.floor(totalExp / 200) + 1);

  return {
    chapters: filteredChapters,
    activeQuest,
    summary,
    devTitle,
    devLevel,
    totalExp,
  };
}

/**
 * 마일스톤을 챕터로 변환합니다.
 */
function convertToChapters(milestones: MilestoneEvent[]): ChronicleChapter[] {
  return milestones.map((ms, idx) => {
    const template = MILESTONE_TEMPLATES[ms.type];
    if (!template) {
      return {
        number: idx + 1,
        title: 'Unknown Event',
        subtitle: '',
        date: ms.date,
        icon: '❓',
        rank: 'D' as ChapterRank,
        descriptionKo: '알 수 없는 이벤트',
        descriptionEn: 'Unknown event',
        details: ms.details,
        type: ms.type,
      };
    }

    return {
      number: idx + 1,
      title: template.titleEn,
      subtitle: template.subtitleEn(ms.details),
      date: ms.date,
      icon: template.icon,
      rank: template.rank,
      descriptionKo: template.descKo(ms.details),
      descriptionEn: template.descEn(ms.details),
      details: ms.details,
      type: ms.type,
    };
  });
}

/**
 * 중복 필터링 및 우선순위 정렬을 합니다.
 * - first_commit, first_repo, first_pr_merged: 최대 1개씩
 * - repo_created: 최대 3개 (가장 중요한 것)
 * - new_language: 최대 3개
 * - 나머지: 각 최대 1개
 */
function filterAndPrioritize(
  chapters: ChronicleChapter[],
  maxChapters: number
): ChronicleChapter[] {
  const RANK_PRIORITY: Record<ChapterRank, number> = { S: 5, A: 4, B: 3, C: 2, D: 1 };

  // 유형별 그룹핑
  const groups = new Map<MilestoneType, ChronicleChapter[]>();
  for (const ch of chapters) {
    if (!groups.has(ch.type)) {
      groups.set(ch.type, []);
    }
    groups.get(ch.type)!.push(ch);
  }

  const selected: ChronicleChapter[] = [];

  // 유니크 이벤트는 1개만 (가장 오래된 것)
  const uniqueTypes: MilestoneType[] = [
    'first_commit', 'first_repo', 'first_pr_merged',
    'first_star', 'first_follower', 'streak_30', 'stars_100',
  ];
  for (const type of uniqueTypes) {
    const group = groups.get(type);
    if (group && group.length > 0) {
      selected.push(group[0]);
    }
  }

  // new_language: 상위 3개
  const langGroup = groups.get('new_language') || [];
  selected.push(...langGroup.slice(0, 3));

  // repo_created: 상위 3개 (first_repo와 겹치지 않게)
  const repoGroup = groups.get('repo_created') || [];
  const firstRepoName = groups.get('first_repo')?.[0]?.details?.repoName;
  const filteredRepos = repoGroup.filter(ch => ch.details.repoName !== firstRepoName);
  selected.push(...filteredRepos.slice(0, 3));

  // 날짜순 정렬 후 상위 N개
  selected.sort((a, b) => {
    // 먼저 날짜순
    const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
    if (dateCompare !== 0) return dateCompare;
    // 같은 날짜라면 랭크 높은 것 먼저
    return RANK_PRIORITY[b.rank] - RANK_PRIORITY[a.rank];
  });

  return selected.slice(0, maxChapters);
}

/**
 * 현재 진행 중인 퀘스트를 감지합니다.
 */
function detectActiveQuest(
  data: GitHubData,
  chapters: ChronicleChapter[]
): ActiveQuest | null {
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  const languageCount = Object.keys(data.languages).length;
  const unlockedTypes = new Set(chapters.map(ch => ch.type));

  // 아직 달성하지 못한 목표를 퀘스트로 설정
  if (!unlockedTypes.has('streak_30')) {
    // 연속 커밋 퀘스트
    let currentStreak = 0;
    for (let i = data.contributionCalendar.length - 1; i >= 0; i--) {
      if (data.contributionCalendar[i].count > 0) {
        currentStreak++;
      } else {
        break;
      }
    }
    return {
      name: 'The Grind',
      description: '30일 연속 커밋 달성하기',
      icon: '🔥',
      progress: Math.min(100, Math.round((currentStreak / 30) * 100)),
      target: `${currentStreak}/30일`,
    };
  }

  if (totalStars < 100) {
    return {
      name: 'Rising Star',
      description: '스타 100개 모으기',
      icon: '⭐',
      progress: Math.min(100, Math.round((totalStars / 100) * 100)),
      target: `${totalStars}/100 ⭐`,
    };
  }

  if (languageCount < 5) {
    return {
      name: 'Polyglot',
      description: '5개 이상 언어 사용하기',
      icon: '🌍',
      progress: Math.min(100, Math.round((languageCount / 5) * 100)),
      target: `${languageCount}/5 언어`,
    };
  }

  if (data.repositories.length < 20) {
    return {
      name: 'City Builder',
      description: '20개 레포지토리 만들기',
      icon: '🏙️',
      progress: Math.min(100, Math.round((data.repositories.length / 20) * 100)),
      target: `${data.repositories.length}/20 repos`,
    };
  }

  return null;
}

/**
 * 요약 통계를 계산합니다.
 */
function calculateSummary(
  data: GitHubData,
  chapters: ChronicleChapter[]
): ChronicleSummary {
  const dates = chapters.map(ch => new Date(ch.date).getTime());
  const firstDate = dates.length > 0 ? Math.min(...dates) : Date.now();
  const latestDate = dates.length > 0 ? Math.max(...dates) : Date.now();

  const journeyDays = Math.max(
    1,
    Math.ceil((latestDate - firstDate) / (1000 * 60 * 60 * 24))
  );

  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);

  return {
    totalChapters: chapters.length,
    firstEventDate: new Date(firstDate).toISOString().split('T')[0],
    latestEventDate: new Date(latestDate).toISOString().split('T')[0],
    journeyDays,
    languagesLearned: Object.keys(data.languages).length,
    reposCreated: data.repositories.length,
    totalStars,
    totalCommits: data.commitHistory.length,
  };
}

/**
 * 개발자 칭호를 결정합니다 (가장 두드러진 특성 기반).
 */
function determineDevTitle(
  data: GitHubData,
  chapters: ChronicleChapter[]
): string {
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  const langCount = Object.keys(data.languages).length;
  const commitCount = data.commitHistory.length;
  const repoCount = data.repositories.length;
  const hasStreak = chapters.some(ch => ch.type === 'streak_30');

  // 등급별 칭호
  if (totalStars >= 100 && commitCount >= 1000) return 'Legendary Developer';
  if (hasStreak && commitCount >= 500) return 'Relentless Warrior';
  if (langCount >= 5 && repoCount >= 15) return 'Polyglot Adventurer';
  if (totalStars >= 50) return 'Rising Star';
  if (commitCount >= 300) return 'Dedicated Coder';
  if (repoCount >= 10) return 'Prolific Builder';
  if (langCount >= 3) return 'Versatile Explorer';
  if (commitCount >= 100) return 'Apprentice Developer';
  if (repoCount >= 3) return 'Novice Builder';
  return 'Young Adventurer';
}

/**
 * 챕터 제목을 한국어로 반환합니다.
 */
export function getChapterTitleKo(chapter: ChronicleChapter): string {
  const template = MILESTONE_TEMPLATES[chapter.type];
  return template?.titleKo || chapter.title;
}

/**
 * 챕터 부제목을 한국어로 반환합니다.
 */
export function getChapterSubtitleKo(chapter: ChronicleChapter): string {
  const template = MILESTONE_TEMPLATES[chapter.type];
  return template?.subtitleKo(chapter.details) || chapter.subtitle;
}

/**
 * 랭크 색상을 반환합니다.
 */
export function getRankColor(rank: ChapterRank): string {
  const colors: Record<ChapterRank, string> = {
    S: '#FFD700',
    A: '#FF6B6B',
    B: '#4ECDC4',
    C: '#45B7D1',
    D: '#96CEB4',
  };
  return colors[rank];
}

/**
 * 날짜를 포맷합니다.
 */
export function formatDate(dateStr: string, locale: 'ko' | 'en'): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;

    if (locale === 'ko') {
      return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
    }
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
                    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  } catch {
    return dateStr;
  }
}
