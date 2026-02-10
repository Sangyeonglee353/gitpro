// ═══════════════════════════════════════════
// 🧪 Trading Card 모듈 테스트
// ═══════════════════════════════════════════

import {
  calculateStats,
  determineRarity,
  determineCharacterType,
} from '../../src/modules/trading-card/stats-calculator';
import { detectAbilities } from '../../src/modules/trading-card/ability-detector';
import { createMockGitHubData } from '../helpers/mock-data';

describe('Trading Card Module', () => {
  describe('calculateStats', () => {
    it('GitHub 데이터로 스탯을 산출한다', () => {
      const data = createMockGitHubData();
      const stats = calculateStats(data);

      expect(stats.atk).toBeGreaterThanOrEqual(0);
      expect(stats.atk).toBeLessThanOrEqual(999);
      expect(stats.def).toBeGreaterThanOrEqual(0);
      expect(stats.def).toBeLessThanOrEqual(999);
      expect(stats.int).toBeGreaterThanOrEqual(0);
      expect(stats.int).toBeLessThanOrEqual(999);
      expect(stats.spd).toBeGreaterThanOrEqual(0);
      expect(stats.spd).toBeLessThanOrEqual(999);
      expect(stats.total).toBe(stats.atk + stats.def + stats.int + stats.spd);
    });

    it('활동이 많을수록 높은 스탯을 갖는다', () => {
      const lowActivity = createMockGitHubData({
        commitHistory: [],
        pullRequests: { total: 0, merged: 0, open: 0 },
        issues: { total: 0, closed: 0, open: 0 },
        languages: {},
        repositories: [],
        contributionCalendar: [],
      });
      const highActivity = createMockGitHubData();

      const lowStats = calculateStats(lowActivity);
      const highStats = calculateStats(highActivity);

      expect(highStats.total).toBeGreaterThan(lowStats.total);
    });

    it('PR 머지가 많으면 ATK가 높다', () => {
      const data = createMockGitHubData({
        pullRequests: { total: 50, merged: 45, open: 3 },
      });

      const stats = calculateStats(data);
      expect(stats.atk).toBeGreaterThan(0);
    });

    it('이슈 해결률이 높으면 DEF가 높다', () => {
      const data = createMockGitHubData({
        issues: { total: 50, closed: 48, open: 2 },
      });

      const stats = calculateStats(data);
      expect(stats.def).toBeGreaterThan(0);
    });

    it('언어가 다양하면 INT가 높다', () => {
      const data = createMockGitHubData({
        languages: {
          TypeScript: 50000,
          Python: 30000,
          Go: 20000,
          Rust: 15000,
          Java: 10000,
          Ruby: 8000,
          Kotlin: 5000,
        },
      });

      const stats = calculateStats(data);
      expect(stats.int).toBeGreaterThan(200);
    });
  });

  describe('determineRarity', () => {
    it('0~499 총합은 Common이다', () => {
      expect(determineRarity(0).name).toBe('common');
      expect(determineRarity(499).name).toBe('common');
    });

    it('500~999 총합은 Uncommon이다', () => {
      expect(determineRarity(500).name).toBe('uncommon');
      expect(determineRarity(999).name).toBe('uncommon');
    });

    it('1000~1999 총합은 Rare이다', () => {
      expect(determineRarity(1000).name).toBe('rare');
      expect(determineRarity(1999).name).toBe('rare');
    });

    it('2000~3499 총합은 Epic이다', () => {
      expect(determineRarity(2000).name).toBe('epic');
      expect(determineRarity(3499).name).toBe('epic');
    });

    it('3500+ 총합은 Legendary이다', () => {
      expect(determineRarity(3500).name).toBe('legendary');
      expect(determineRarity(5000).name).toBe('legendary');
    });

    it('각 레어도에 올바른 라벨이 있다', () => {
      expect(determineRarity(0).label).toContain('COMMON');
      expect(determineRarity(500).label).toContain('UNCOMMON');
      expect(determineRarity(1000).label).toContain('RARE');
      expect(determineRarity(2000).label).toContain('EPIC');
      expect(determineRarity(3500).label).toContain('LEGENDARY');
    });

    it('각 레어도에 색상이 있다', () => {
      const rarities = [0, 500, 1000, 2000, 3500];
      for (const total of rarities) {
        const rarity = determineRarity(total);
        expect(rarity.color).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(rarity.glowColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
        expect(rarity.borderColor).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('determineCharacterType', () => {
    it('TypeScript 주 언어는 Mage를 반환한다', () => {
      const result = determineCharacterType({ TypeScript: 50000, JavaScript: 10000 });
      expect(result.type).toBe('Mage');
      expect(result.title).toContain('TypeScript');
      expect(result.emoji).toBe('🐲');
    });

    it('Python 주 언어는 Sage를 반환한다', () => {
      const result = determineCharacterType({ Python: 50000, JavaScript: 10000 });
      expect(result.type).toBe('Sage');
      expect(result.emoji).toBe('🐍');
    });

    it('JavaScript 주 언어는 Trickster를 반환한다', () => {
      const result = determineCharacterType({ JavaScript: 50000 });
      expect(result.type).toBe('Trickster');
      expect(result.emoji).toBe('🐿️');
    });

    it('Rust 주 언어는 Blacksmith를 반환한다', () => {
      const result = determineCharacterType({ Rust: 50000 });
      expect(result.type).toBe('Blacksmith');
      expect(result.emoji).toBe('🦀');
    });

    it('알 수 없는 언어는 Coder를 반환한다', () => {
      const result = determineCharacterType({ Haskell: 50000 });
      expect(result.type).toBe('Coder');
      expect(result.title).toContain('Haskell');
    });

    it('빈 언어 맵은 Unknown Coder를 반환한다', () => {
      const result = determineCharacterType({});
      expect(result.type).toBe('Coder');
      expect(result.title).toContain('Unknown');
    });
  });

  describe('detectAbilities', () => {
    it('야간 커밋 70% 이상이면 Midnight Surge를 감지한다', () => {
      const nightCommits = Array.from({ length: 80 }, (_, i) => ({
        date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T23:00:00Z`,
        hour: 23,
        dayOfWeek: i % 7,
        repo: 'test',
        additions: 10,
        deletions: 5,
        message: 'night commit',
      }));
      const dayCommits = Array.from({ length: 20 }, (_, i) => ({
        date: `2024-01-${String(i % 28 + 1).padStart(2, '0')}T14:00:00Z`,
        hour: 14,
        dayOfWeek: i % 7,
        repo: 'test',
        additions: 10,
        deletions: 5,
        message: 'day commit',
      }));

      const data = createMockGitHubData({
        commitHistory: [...nightCommits, ...dayCommits],
      });

      const abilities = detectAbilities(data);
      expect(abilities.find(a => a.name === 'Midnight Surge')).toBeDefined();
    });

    it('5개 이상 언어 사용 시 Polyglot을 감지한다', () => {
      const data = createMockGitHubData({
        languages: {
          TypeScript: 50000,
          JavaScript: 30000,
          Python: 15000,
          Go: 8000,
          Rust: 5000,
        },
      });

      const abilities = detectAbilities(data);
      expect(abilities.find(a => a.name === 'Polyglot')).toBeDefined();
    });

    it('스타 100개 이상이면 Star Collector를 감지한다', () => {
      const data = createMockGitHubData({
        repositories: [
          ...createMockGitHubData().repositories,
          {
            name: 'popular-repo',
            description: 'Popular',
            primaryLanguage: 'TypeScript',
            stars: 200,
            forks: 50,
            totalCommits: 500,
            createdAt: '2023-01-01T00:00:00Z',
            updatedAt: '2024-12-01T00:00:00Z',
            pushedAt: '2024-12-01T00:00:00Z',
            isArchived: false,
            isFork: false,
            topics: [],
          },
        ],
      });

      const abilities = detectAbilities(data);
      expect(abilities.find(a => a.name === 'Star Collector')).toBeDefined();
    });

    it('최대 2개의 어빌리티만 반환한다', () => {
      const data = createMockGitHubData();
      const abilities = detectAbilities(data);
      expect(abilities.length).toBeLessThanOrEqual(2);
    });

    it('활동이 없으면 어빌리티가 없다', () => {
      const data = createMockGitHubData({
        commitHistory: [],
        repositories: [],
        pullRequests: { total: 0, merged: 0, open: 0 },
        issues: { total: 0, closed: 0, open: 0 },
        languages: {},
        contributionCalendar: [],
      });

      const abilities = detectAbilities(data);
      expect(abilities).toHaveLength(0);
    });
  });
});
