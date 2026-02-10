// ═══════════════════════════════════════════
// 🍖 EXP Calculator - 펫 경험치 & 먹이 산출
// ═══════════════════════════════════════════
//
// GitHub 활동을 기반으로 펫에게 줄 경험치를 계산합니다.
// 경험치는 누적되며, 일정 EXP 도달 시 진화합니다.

import { GitHubData, PetState } from '../../types';

/** 경험치 산출 결과 */
export interface ExpReport {
  /** 이번 업데이트에서 획득한 총 EXP */
  totalGained: number;
  /** 새로운 총 EXP */
  newTotalExp: number;
  /** 개별 EXP 항목 */
  breakdown: ExpItem[];
  /** 새 mood 값 (0~100) */
  newMood: number;
  /** 새 hunger 값 (0~100) */
  newHunger: number;
  /** 펫 반응 메시지 */
  reactions: PetReaction[];
}

export interface ExpItem {
  source: string;
  sourceKo: string;
  amount: number;
  icon: string;
}

export interface PetReaction {
  message: string;
  messageKo: string;
  icon: string;
}

/**
 * GitHub 데이터와 현재 상태를 기반으로 EXP를 산출합니다.
 */
export function calculateExp(
  data: GitHubData,
  currentState: PetState
): ExpReport {
  const breakdown: ExpItem[] = [];
  const reactions: PetReaction[] = [];

  // 1. 커밋 EXP (+10~30 per commit, 변경 라인 수 비례)
  const totalCommits = data.commitHistory.length;
  if (totalCommits > 0) {
    const avgLinesPerCommit = data.commitHistory.reduce(
      (sum, c) => sum + c.additions + c.deletions, 0
    ) / totalCommits;

    // 커밋당 10~30 EXP, 변경량이 많으면 보너스
    const perCommitBase = 10;
    const perCommitBonus = Math.min(20, Math.floor(avgLinesPerCommit / 10));
    const commitExp = totalCommits * (perCommitBase + perCommitBonus);

    breakdown.push({
      source: `${totalCommits} commits`,
      sourceKo: `커밋 ${totalCommits}회`,
      amount: commitExp,
      icon: '📝',
    });

    if (totalCommits >= 10) {
      reactions.push({
        message: 'Nom nom! Delicious code!',
        messageKo: '냠냠! 맛있는 코드다!',
        icon: '😋',
      });
    }
  }

  // 2. PR 생성 EXP (+50 per PR)
  if (data.pullRequests.total > 0) {
    const prExp = data.pullRequests.total * 50;
    breakdown.push({
      source: `${data.pullRequests.total} PRs created`,
      sourceKo: `PR ${data.pullRequests.total}개 생성`,
      amount: prExp,
      icon: '🔀',
    });

    reactions.push({
      message: 'A new adventure!',
      messageKo: '새로운 모험이다!',
      icon: '⚔️',
    });
  }

  // 3. PR 머지 EXP (+120 per merged PR)
  if (data.pullRequests.merged > 0) {
    const mergeExp = data.pullRequests.merged * 120;
    breakdown.push({
      source: `${data.pullRequests.merged} PRs merged`,
      sourceKo: `PR ${data.pullRequests.merged}개 머지`,
      amount: mergeExp,
      icon: '🎉',
    });

    reactions.push({
      message: 'Great victory! 🎉',
      messageKo: '대승리! 🎉',
      icon: '🏆',
    });
  }

  // 4. 이슈 해결 EXP (+80 per closed issue)
  if (data.issues.closed > 0) {
    const issueExp = data.issues.closed * 80;
    breakdown.push({
      source: `${data.issues.closed} issues resolved`,
      sourceKo: `이슈 ${data.issues.closed}개 해결`,
      amount: issueExp,
      icon: '🐛',
    });

    reactions.push({
      message: 'Monster defeated!',
      messageKo: '몬스터를 처치했다!',
      icon: '⚔️',
    });
  }

  // 5. 스타 EXP (+200 per star across all repos)
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  if (totalStars > 0) {
    const starExp = totalStars * 200;
    breakdown.push({
      source: `${totalStars} stars received`,
      sourceKo: `스타 ${totalStars}개 획득`,
      amount: starExp,
      icon: '⭐',
    });

    if (totalStars >= 10) {
      reactions.push({
        message: 'We have fans! ⭐',
        messageKo: '팬이 생겼어! ⭐',
        icon: '🌟',
      });
    }
  }

  // 6. 레포지토리 수 보너스 (레포당 30 EXP)
  const repoCount = data.repositories.length;
  if (repoCount > 0) {
    const repoExp = repoCount * 30;
    breakdown.push({
      source: `${repoCount} repositories`,
      sourceKo: `레포지토리 ${repoCount}개`,
      amount: repoExp,
      icon: '📦',
    });
  }

  // 7. 언어 다양성 보너스 (언어당 50 EXP)
  const langCount = Object.keys(data.languages).length;
  if (langCount > 1) {
    const langExp = langCount * 50;
    breakdown.push({
      source: `${langCount} languages mastered`,
      sourceKo: `${langCount}개 언어 습득`,
      amount: langExp,
      icon: '🌍',
    });
  }

  // 총 획득 EXP 계산
  const totalGained = breakdown.reduce((sum, item) => sum + item.amount, 0);
  const newTotalExp = currentState.exp + totalGained;

  // Mood & Hunger 계산
  const { newMood, newHunger } = calculateMoodAndHunger(
    currentState,
    data,
    totalGained
  );

  // 비활동 패널티 반응
  if (newHunger > 70) {
    reactions.push({
      message: "...I'm hungry 😢",
      messageKo: '...배고파 😢',
      icon: '🍽️',
    });
  }

  return {
    totalGained,
    newTotalExp,
    breakdown,
    newMood,
    newHunger,
    reactions,
  };
}

/**
 * 마지막 먹이 시간과 현재 활동량에 따라 기분과 배고픔을 계산합니다.
 */
function calculateMoodAndHunger(
  state: PetState,
  data: GitHubData,
  expGained: number
): { newMood: number; newHunger: number } {
  // 최근 활동 기반으로 계산
  const now = new Date();
  const lastFed = state.lastFed ? new Date(state.lastFed) : null;

  let hoursSinceLastFed = 0;
  if (lastFed) {
    hoursSinceLastFed = (now.getTime() - lastFed.getTime()) / (1000 * 60 * 60);
  } else {
    hoursSinceLastFed = 168; // 첫 실행이면 7일로 간주
  }

  // 최근 30일 일평균 커밋
  const recentDays = data.contributionCalendar.slice(-30);
  const recentDailyAvg = recentDays.length > 0
    ? recentDays.reduce((sum, d) => sum + d.count, 0) / recentDays.length
    : 0;

  // 배고픔: 시간이 지날수록 증가, 활동이 있으면 감소
  let newHunger = state.hunger;
  if (expGained > 0) {
    // 먹이를 줬으므로 배고픔 감소
    const hungerReduction = Math.min(50, Math.floor(expGained / 100));
    newHunger = Math.max(0, newHunger - hungerReduction);
  }
  if (hoursSinceLastFed > 24) {
    // 24시간 이상 무활동이면 배고픔 증가
    const daysPassed = Math.floor(hoursSinceLastFed / 24);
    newHunger = Math.min(100, newHunger + daysPassed * 10);
  }

  // 기분: 배고픔이 낮고 활동이 많으면 행복
  let newMood = state.mood;
  if (expGained > 0) {
    // 활동이 있으면 기분 상승
    const moodBoost = Math.min(30, Math.floor(expGained / 200));
    newMood = Math.min(100, newMood + moodBoost);
  }
  // 배고픔이 높으면 기분 감소
  if (newHunger > 60) {
    const moodPenalty = Math.floor((newHunger - 60) / 10) * 5;
    newMood = Math.max(0, newMood - moodPenalty);
  }
  // 최근 활동이 활발하면 기분 보너스
  if (recentDailyAvg >= 3) {
    newMood = Math.min(100, newMood + 10);
  }

  return {
    newMood: Math.max(0, Math.min(100, newMood)),
    newHunger: Math.max(0, Math.min(100, newHunger)),
  };
}

/**
 * 펫의 나이를 계산합니다 (일 단위).
 */
export function calculatePetAge(birthDate: string | null): number {
  if (!birthDate) return 0;
  const birth = new Date(birthDate);
  const now = new Date();
  return Math.floor((now.getTime() - birth.getTime()) / (1000 * 60 * 60 * 24));
}

/**
 * 최근 활동 상태를 요약합니다 (펫 상태 메시지용).
 */
export function getActivityStatus(data: GitHubData): {
  status: 'active' | 'idle' | 'sleeping' | 'runaway';
  statusKo: string;
  icon: string;
} {
  const recentDays = data.contributionCalendar.slice(-7);
  const recentCommits = recentDays.reduce((sum, d) => sum + d.count, 0);

  if (recentCommits >= 10) {
    return { status: 'active', statusKo: '활발하게 놀고 있어요!', icon: '🎮' };
  }
  if (recentCommits >= 1) {
    return { status: 'idle', statusKo: '심심해하고 있어요...', icon: '💤' };
  }

  // 최근 7일간 활동 없음
  const recentWeeks = data.contributionCalendar.slice(-14);
  const twoWeekCommits = recentWeeks.reduce((sum, d) => sum + d.count, 0);

  if (twoWeekCommits === 0) {
    return { status: 'runaway', statusKo: '여기... 아무도 없나요?', icon: '🚪' };
  }

  return { status: 'sleeping', statusKo: 'zzZ 💤', icon: '😴' };
}
