// ═══════════════════════════════════════════
// ⚔️ Stats Calculator - 카드 스탯 산출
// ═══════════════════════════════════════════

import { GitHubData } from '../../types';

export interface CardStats {
  atk: number;  // 공격력: 커밋 + PR 머지
  def: number;  // 방어력: 이슈 해결 + 리뷰
  int: number;  // 지능: 언어 다양성 + 스타
  spd: number;  // 스피드: 커밋 빈도
  total: number;
}

export type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

export interface RarityInfo {
  name: Rarity;
  label: string;
  color: string;
  glowColor: string;
  borderColor: string;
}

/**
 * GitHub 데이터로부터 카드 스탯을 산출합니다.
 */
export function calculateStats(data: GitHubData): CardStats {
  const atk = calculateATK(data);
  const def = calculateDEF(data);
  const int = calculateINT(data);
  const spd = calculateSPD(data);

  return {
    atk,
    def,
    int,
    spd,
    total: atk + def + int + spd,
  };
}

/**
 * ⚔️ ATK (공격력) - 코드를 얼마나 밀어넣는가
 * - 총 커밋 수 (최대 500점)
 * - PR 머지 비율 (최대 500점)
 */
function calculateATK(data: GitHubData): number {
  // 커밋 기반 점수 (log 스케일로 보정)
  const totalCommits = data.repositories.reduce((sum, r) => sum + r.totalCommits, 0);
  const commitScore = Math.min(500, Math.round(Math.log2(totalCommits + 1) * 50));

  // PR 머지 기반 점수
  const mergeRate = data.pullRequests.total > 0
    ? data.pullRequests.merged / data.pullRequests.total
    : 0;
  const prScore = Math.min(500, Math.round(data.pullRequests.merged * 5 * mergeRate));

  return Math.min(999, commitScore + prScore);
}

/**
 * 🛡 DEF (방어력) - 버그로부터 코드를 지키는가
 * - 이슈 해결률 (최대 500점)
 * - 총 해결 이슈 수 (최대 500점)
 */
function calculateDEF(data: GitHubData): number {
  // 이슈 해결률 점수
  const closeRate = data.issues.total > 0
    ? data.issues.closed / data.issues.total
    : 0;
  const closeRateScore = Math.round(closeRate * 300);

  // 해결 이슈 수 점수
  const closedScore = Math.min(500, Math.round(Math.log2(data.issues.closed + 1) * 60));

  // 비활성 레포가 적을수록 보너스
  const activeRepos = data.repositories.filter(r => !r.isArchived).length;
  const totalRepos = data.repositories.length;
  const maintenanceBonus = totalRepos > 0
    ? Math.round((activeRepos / totalRepos) * 199)
    : 0;

  return Math.min(999, closeRateScore + closedScore + maintenanceBonus);
}

/**
 * 🧠 INT (지능) - 얼마나 폭넓고 영향력 있는가
 * - 사용 언어 다양성 (최대 400점)
 * - 총 스타 수 (최대 400점)
 * - 토픽 다양성 (최대 200점)
 */
function calculateINT(data: GitHubData): number {
  // 언어 다양성 점수
  const langCount = Object.keys(data.languages).length;
  const langScore = Math.min(400, langCount * 40);

  // 스타 점수 (log 스케일)
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  const starScore = Math.min(400, Math.round(Math.log2(totalStars + 1) * 50));

  // 토픽 다양성
  const allTopics = new Set<string>();
  data.repositories.forEach(r => r.topics.forEach(t => allTopics.add(t)));
  const topicScore = Math.min(200, allTopics.size * 15);

  return Math.min(999, langScore + starScore + topicScore);
}

/**
 * ⚡ SPD (스피드) - 얼마나 빠르게 움직이는가
 * - 최근 커밋 빈도 (최대 500점)
 * - 연속 기여일 (최대 500점)
 */
function calculateSPD(data: GitHubData): number {
  // 최근 30일 커밋 빈도
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const recentContributions = data.contributionCalendar.filter(
    d => new Date(d.date) >= thirtyDaysAgo
  );
  const avgDaily = recentContributions.reduce((sum, d) => sum + d.count, 0) / 30;
  const frequencyScore = Math.min(500, Math.round(avgDaily * 100));

  // 현재 연속 기여일
  let currentStreak = 0;
  const sortedCalendar = [...data.contributionCalendar].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
  for (const day of sortedCalendar) {
    if (day.count > 0) {
      currentStreak++;
    } else {
      break;
    }
  }
  const streakScore = Math.min(500, currentStreak * 10);

  return Math.min(999, frequencyScore + streakScore);
}

/**
 * 총합 점수로 레어도를 판정합니다.
 */
export function determineRarity(totalStats: number): RarityInfo {
  if (totalStats >= 3500) {
    return {
      name: 'legendary',
      label: '✦ LEGENDARY ✦',
      color: '#FFD700',
      glowColor: '#FFA500',
      borderColor: '#FFD700',
    };
  }
  if (totalStats >= 2000) {
    return {
      name: 'epic',
      label: '◆ EPIC ◆',
      color: '#A855F7',
      glowColor: '#7C3AED',
      borderColor: '#A855F7',
    };
  }
  if (totalStats >= 1000) {
    return {
      name: 'rare',
      label: '◇ RARE ◇',
      color: '#3B82F6',
      glowColor: '#2563EB',
      borderColor: '#3B82F6',
    };
  }
  if (totalStats >= 500) {
    return {
      name: 'uncommon',
      label: '○ UNCOMMON ○',
      color: '#22C55E',
      glowColor: '#16A34A',
      borderColor: '#22C55E',
    };
  }
  return {
    name: 'common',
    label: '· COMMON ·',
    color: '#9CA3AF',
    glowColor: '#6B7280',
    borderColor: '#9CA3AF',
  };
}

/**
 * 주 사용 언어에 따른 캐릭터 타입을 결정합니다.
 */
export function determineCharacterType(languages: Record<string, number>): {
  type: string;
  title: string;
  element: string;
  emoji: string;
} {
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  const primaryLang = sorted.length > 0 ? sorted[0][0] : 'Unknown';

  const types: Record<string, { type: string; title: string; element: string; emoji: string }> = {
    TypeScript: { type: 'Mage', title: 'TypeScript Mage', element: '⚡', emoji: '🐲' },
    JavaScript: { type: 'Trickster', title: 'JavaScript Trickster', element: '💨', emoji: '🐿️' },
    Python: { type: 'Sage', title: 'Python Sage', element: '🔥', emoji: '🐍' },
    Java: { type: 'Guardian', title: 'Java Guardian', element: '🪨', emoji: '🐘' },
    Go: { type: 'Scout', title: 'Go Scout', element: '🌿', emoji: '🐹' },
    Rust: { type: 'Blacksmith', title: 'Rust Blacksmith', element: '⚙️', emoji: '🦀' },
    'C++': { type: 'Ancient', title: 'C++ Ancient', element: '🌍', emoji: '🦕' },
    C: { type: 'Primal', title: 'C Primal', element: '🌍', emoji: '🦖' },
    'C#': { type: 'Paladin', title: 'C# Paladin', element: '✨', emoji: '🛡️' },
    Ruby: { type: 'Enchanter', title: 'Ruby Enchanter', element: '❄️', emoji: '💎' },
    PHP: { type: 'Alchemist', title: 'PHP Alchemist', element: '🧪', emoji: '⚗️' },
    Swift: { type: 'Hawk', title: 'Swift Hawk', element: '💨', emoji: '🦅' },
    Kotlin: { type: 'Fox', title: 'Kotlin Fox', element: '✨', emoji: '🦊' },
    Dart: { type: 'Ranger', title: 'Dart Ranger', element: '🎯', emoji: '🏹' },
    Shell: { type: 'Hacker', title: 'Shell Hacker', element: '💻', emoji: '🖥️' },
    HTML: { type: 'Architect', title: 'HTML Architect', element: '🏗️', emoji: '🏛️' },
    CSS: { type: 'Artist', title: 'CSS Artist', element: '🎨', emoji: '🖌️' },
    Vue: { type: 'Artisan', title: 'Vue Artisan', element: '🌿', emoji: '🍃' },
  };

  return types[primaryLang] || { type: 'Coder', title: `${primaryLang} Coder`, element: '💻', emoji: '⌨️' };
}
