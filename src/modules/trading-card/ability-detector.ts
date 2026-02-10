// ═══════════════════════════════════════════
// 🔥 Ability Detector - 스페셜 어빌리티 감지
// ═══════════════════════════════════════════

import { GitHubData } from '../../types';

export interface SpecialAbility {
  name: string;
  icon: string;
  description: string;
  descriptionKo: string;
}

/**
 * GitHub 데이터에서 특수 어빌리티를 감지합니다.
 */
export function detectAbilities(data: GitHubData): SpecialAbility[] {
  const abilities: SpecialAbility[] = [];

  // 🌙 Midnight Surge - 야간 커밋이 70% 이상
  const nightCommits = data.commitHistory.filter(c => c.hour >= 22 || c.hour < 6).length;
  const totalCommits = data.commitHistory.length;
  if (totalCommits > 0 && nightCommits / totalCommits >= 0.7) {
    abilities.push({
      name: 'Midnight Surge',
      icon: '🌙',
      description: 'ATK doubles during night commits',
      descriptionKo: '야간 커밋 시 공격력 2배',
    });
  }

  // 🌅 Dawn Breaker - 새벽 커밋이 30% 이상
  const dawnCommits = data.commitHistory.filter(c => c.hour >= 4 && c.hour < 8).length;
  if (totalCommits > 0 && dawnCommits / totalCommits >= 0.3) {
    abilities.push({
      name: 'Dawn Breaker',
      icon: '🌅',
      description: 'SPD boost from early morning commits',
      descriptionKo: '새벽 커밋으로 스피드 부스트',
    });
  }

  // 🔥 Streak Master - 30일 이상 연속 커밋
  let currentStreak = 0;
  let maxStreak = 0;
  const calendar = [...data.contributionCalendar].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  for (const day of calendar) {
    if (day.count > 0) {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else {
      currentStreak = 0;
    }
  }
  if (maxStreak >= 30) {
    abilities.push({
      name: 'Streak Master',
      icon: '🔥',
      description: `${maxStreak}-day streak! DEF greatly increased`,
      descriptionKo: `${maxStreak}일 연속 커밋! 방어력 대폭 상승`,
    });
  }

  // 🌍 Polyglot - 5개 이상 언어 사용
  const langCount = Object.keys(data.languages).length;
  if (langCount >= 5) {
    abilities.push({
      name: 'Polyglot',
      icon: '🌍',
      description: `Mastered ${langCount} languages. INT increased`,
      descriptionKo: `${langCount}개 언어 마스터. 지능 상승`,
    });
  }

  // 👑 Star Collector - 받은 스타 100개 이상
  const totalStars = data.repositories.reduce((sum, r) => sum + r.stars, 0);
  if (totalStars >= 100) {
    abilities.push({
      name: 'Star Collector',
      icon: '👑',
      description: `${totalStars} stars collected! All stats boosted`,
      descriptionKo: `스타 ${totalStars}개 수집! 전체 스탯 부스트`,
    });
  }

  // 🐙 Open Source Hero - 많은 PR 기여
  if (data.pullRequests.merged >= 10) {
    abilities.push({
      name: 'Open Source Hero',
      icon: '🐙',
      description: `${data.pullRequests.merged} PRs merged! Team synergy up`,
      descriptionKo: `PR ${data.pullRequests.merged}개 머지! 팀 시너지 업`,
    });
  }

  // 🎯 Bug Slayer - 이슈 많이 해결
  if (data.issues.closed >= 50) {
    abilities.push({
      name: 'Bug Slayer',
      icon: '🎯',
      description: `${data.issues.closed} bugs slain! DEF greatly increased`,
      descriptionKo: `버그 ${data.issues.closed}개 퇴치! 방어력 대폭 상승`,
    });
  }

  // 🏗️ Architect - 레포 20개 이상
  if (data.repositories.length >= 20) {
    abilities.push({
      name: 'Architect',
      icon: '🏗️',
      description: `Built ${data.repositories.length} projects. INT increased`,
      descriptionKo: `${data.repositories.length}개 프로젝트 건설. 지능 상승`,
    });
  }

  // 최대 2개만 반환 (가장 인상적인 것)
  return abilities.slice(0, 2);
}
