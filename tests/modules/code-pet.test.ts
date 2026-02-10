// ═══════════════════════════════════════════
// 🧪 Code Pet 모듈 테스트
// ═══════════════════════════════════════════

import {
  calculateExp,
  calculatePetAge,
  getActivityStatus,
} from '../../src/modules/code-pet/exp-calculator';
import { createMockGitHubData, createMockState } from '../helpers/mock-data';
import { PetState, ContributionDay } from '../../src/types';

describe('Code Pet Module', () => {
  describe('calculateExp', () => {
    it('커밋에서 EXP를 획득한다', () => {
      const data = createMockGitHubData();
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      expect(report.totalGained).toBeGreaterThan(0);
      expect(report.breakdown.find(b => b.icon === '📝')).toBeDefined();
    });

    it('PR에서 EXP를 획득한다', () => {
      const data = createMockGitHubData({
        pullRequests: { total: 10, merged: 8, open: 2 },
      });
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      // PR 생성 EXP
      const prItem = report.breakdown.find(b => b.icon === '🔀');
      expect(prItem).toBeDefined();
      expect(prItem!.amount).toBe(10 * 50);

      // PR 머지 EXP
      const mergeItem = report.breakdown.find(b => b.icon === '🎉');
      expect(mergeItem).toBeDefined();
      expect(mergeItem!.amount).toBe(8 * 120);
    });

    it('이슈 해결에서 EXP를 획득한다', () => {
      const data = createMockGitHubData({
        issues: { total: 20, closed: 15, open: 5 },
      });
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      const issueItem = report.breakdown.find(b => b.icon === '🐛');
      expect(issueItem).toBeDefined();
      expect(issueItem!.amount).toBe(15 * 80);
    });

    it('스타에서 EXP를 획득한다', () => {
      const data = createMockGitHubData();
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      const starItem = report.breakdown.find(b => b.icon === '⭐');
      expect(starItem).toBeDefined();
    });

    it('새 총 EXP가 올바르게 계산된다', () => {
      const data = createMockGitHubData();
      const petState: PetState = {
        species: 'TypeScriptodon',
        stage: 1,
        exp: 1000,
        mood: 50,
        hunger: 50,
        lastFed: '2024-12-01T00:00:00Z',
        birthDate: '2024-06-01T00:00:00Z',
        abilities: [],
      };

      const report = calculateExp(data, petState);
      expect(report.newTotalExp).toBe(petState.exp + report.totalGained);
    });

    it('활동이 있으면 배고픔이 감소한다', () => {
      const data = createMockGitHubData();
      const petState: PetState = {
        species: 'TypeScriptodon',
        stage: 1,
        exp: 1000,
        mood: 50,
        hunger: 80,
        lastFed: new Date().toISOString(),
        birthDate: '2024-06-01T00:00:00Z',
        abilities: [],
      };

      const report = calculateExp(data, petState);
      expect(report.newHunger).toBeLessThanOrEqual(petState.hunger);
    });

    it('활동이 없으면 EXP가 0이다', () => {
      const data = createMockGitHubData({
        commitHistory: [],
        pullRequests: { total: 0, merged: 0, open: 0 },
        issues: { total: 0, closed: 0, open: 0 },
        repositories: [],
        languages: {},
      });
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);
      expect(report.totalGained).toBe(0);
    });

    it('mood와 hunger가 0~100 범위 내이다', () => {
      const data = createMockGitHubData();
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      expect(report.newMood).toBeGreaterThanOrEqual(0);
      expect(report.newMood).toBeLessThanOrEqual(100);
      expect(report.newHunger).toBeGreaterThanOrEqual(0);
      expect(report.newHunger).toBeLessThanOrEqual(100);
    });

    it('반응 메시지가 생성된다', () => {
      const data = createMockGitHubData();
      const petState = createMockState().pet;

      const report = calculateExp(data, petState);

      // 활동이 있으므로 반응이 있어야 함
      expect(report.reactions.length).toBeGreaterThan(0);
      for (const reaction of report.reactions) {
        expect(reaction.message).toBeDefined();
        expect(reaction.messageKo).toBeDefined();
        expect(reaction.icon).toBeDefined();
      }
    });
  });

  describe('calculatePetAge', () => {
    it('생일이 null이면 0을 반환한다', () => {
      expect(calculatePetAge(null)).toBe(0);
    });

    it('오늘 태어났으면 0일이다', () => {
      const today = new Date().toISOString();
      expect(calculatePetAge(today)).toBe(0);
    });

    it('30일 전에 태어나면 약 30일이다', () => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const age = calculatePetAge(thirtyDaysAgo.toISOString());
      expect(age).toBeGreaterThanOrEqual(29);
      expect(age).toBeLessThanOrEqual(31);
    });
  });

  describe('getActivityStatus', () => {
    it('최근 7일간 커밋 10회 이상이면 active이다', () => {
      const recentCalendar: ContributionDay[] = [];
      const now = new Date();

      // 최근 7일간 활발한 활동
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        recentCalendar.push({
          date: d.toISOString().split('T')[0],
          count: 3,
        });
      }

      const data = createMockGitHubData({
        contributionCalendar: recentCalendar,
      });

      const status = getActivityStatus(data);
      expect(status.status).toBe('active');
    });

    it('최근 7일 활동이 없으면 sleeping이다', () => {
      const calendar: ContributionDay[] = [];
      const now = new Date();

      // 2주 전에는 활동, 최근 7일은 없음
      for (let i = 14; i >= 8; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        calendar.push({
          date: d.toISOString().split('T')[0],
          count: 5,
        });
      }
      for (let i = 7; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        calendar.push({
          date: d.toISOString().split('T')[0],
          count: 0,
        });
      }

      const data = createMockGitHubData({ contributionCalendar: calendar });
      const status = getActivityStatus(data);
      expect(status.status).toBe('sleeping');
    });

    it('2주간 활동이 전혀 없으면 runaway이다', () => {
      const calendar: ContributionDay[] = [];
      const now = new Date();

      for (let i = 14; i >= 0; i--) {
        const d = new Date(now);
        d.setDate(d.getDate() - i);
        calendar.push({
          date: d.toISOString().split('T')[0],
          count: 0,
        });
      }

      const data = createMockGitHubData({ contributionCalendar: calendar });
      const status = getActivityStatus(data);
      expect(status.status).toBe('runaway');
    });
  });
});
