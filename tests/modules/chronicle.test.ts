// ═══════════════════════════════════════════
// 🧪 Chronicle 모듈 테스트
// ═══════════════════════════════════════════

import {
  analyzeChronicle,
  getChapterTitleKo,
  getRankColor,
  formatDate,
} from '../../src/modules/chronicle/chronicle-analyzer';
import { createMockGitHubData, createMockState } from '../helpers/mock-data';

describe('Chronicle Module', () => {
  describe('analyzeChronicle', () => {
    it('연대기 프로파일을 생성한다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      expect(profile.chapters).toBeDefined();
      expect(profile.chapters.length).toBeGreaterThan(0);
      expect(profile.chapters.length).toBeLessThanOrEqual(8);
      expect(profile.devLevel).toBeGreaterThanOrEqual(1);
      expect(profile.totalExp).toBeGreaterThan(0);
    });

    it('챕터에 올바른 구조가 있다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      for (const chapter of profile.chapters) {
        expect(chapter.number).toBeGreaterThan(0);
        expect(chapter.title).toBeDefined();
        expect(chapter.date).toBeDefined();
        expect(chapter.icon).toBeDefined();
        expect(['S', 'A', 'B', 'C', 'D']).toContain(chapter.rank);
        expect(chapter.descriptionKo).toBeDefined();
        expect(chapter.descriptionEn).toBeDefined();
      }
    });

    it('maxChapters를 초과하지 않는다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;

      const profile3 = analyzeChronicle(data, 3, state);
      expect(profile3.chapters.length).toBeLessThanOrEqual(3);

      const profile10 = analyzeChronicle(data, 10, state);
      expect(profile10.chapters.length).toBeLessThanOrEqual(10);
    });

    it('활성 퀘스트를 감지한다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      // 활성 퀘스트가 있거나 null일 수 있음
      if (profile.activeQuest) {
        expect(profile.activeQuest.name).toBeDefined();
        expect(profile.activeQuest.progress).toBeGreaterThanOrEqual(0);
        expect(profile.activeQuest.progress).toBeLessThanOrEqual(100);
      }
    });

    it('요약 통계를 계산한다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      expect(profile.summary.totalChapters).toBe(profile.chapters.length);
      expect(profile.summary.journeyDays).toBeGreaterThanOrEqual(1);
      expect(profile.summary.languagesLearned).toBeGreaterThan(0);
    });

    it('개발자 칭호를 부여한다', () => {
      const data = createMockGitHubData();
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      expect(profile.devTitle).toBeDefined();
      expect(typeof profile.devTitle).toBe('string');
      expect(profile.devTitle.length).toBeGreaterThan(0);
    });

    it('빈 마일스톤으로도 동작한다', () => {
      const data = createMockGitHubData({ milestones: [] });
      const state = createMockState().chronicle;
      const profile = analyzeChronicle(data, 8, state);

      expect(profile.chapters).toHaveLength(0);
      expect(profile.devLevel).toBeGreaterThanOrEqual(1);
    });
  });

  describe('getRankColor', () => {
    it('S 랭크는 금색이다', () => {
      expect(getRankColor('S')).toBe('#FFD700');
    });

    it('모든 랭크에 색상이 있다', () => {
      const ranks: Array<'S' | 'A' | 'B' | 'C' | 'D'> = ['S', 'A', 'B', 'C', 'D'];
      for (const rank of ranks) {
        expect(getRankColor(rank)).toMatch(/^#[0-9A-Fa-f]{6}$/);
      }
    });
  });

  describe('formatDate', () => {
    it('한국어 포맷으로 변환한다', () => {
      const result = formatDate('2024-06-15T00:00:00Z', 'ko');
      expect(result).toBe('2024.06.15');
    });

    it('영어 포맷으로 변환한다', () => {
      const result = formatDate('2024-06-15T00:00:00Z', 'en');
      expect(result).toContain('Jun');
      expect(result).toContain('2024');
    });

    it('잘못된 날짜는 원본을 반환한다', () => {
      const result = formatDate('invalid-date', 'ko');
      expect(result).toBe('invalid-date');
    });
  });
});
