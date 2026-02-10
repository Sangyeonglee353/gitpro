// ═══════════════════════════════════════════
// 🧪 Code DNA 모듈 테스트
// ═══════════════════════════════════════════

import { analyzeDNA, getCodingStyleInfo } from '../../src/modules/code-dna/dna-analyzer';
import { createMockGitHubData } from '../helpers/mock-data';

describe('Code DNA Module', () => {
  describe('analyzeDNA', () => {
    it('DNA 프로파일을 올바르게 생성한다', () => {
      const data = createMockGitHubData();
      const profile = analyzeDNA(data);

      expect(profile.languageDistribution).toBeDefined();
      expect(profile.hourlyPattern).toHaveLength(24);
      expect(profile.weekdayActivity).toHaveLength(7);
      expect(profile.repoDiversity).toBeGreaterThanOrEqual(0);
      expect(profile.repoDiversity).toBeLessThanOrEqual(1);
      expect(profile.activityDensity).toBeGreaterThanOrEqual(0);
      expect(profile.activityDensity).toBeLessThanOrEqual(1);
      expect(profile.uniqueSeed).toBeGreaterThanOrEqual(0);
    });

    it('언어 분포를 올바르게 분석한다', () => {
      const data = createMockGitHubData();
      const profile = analyzeDNA(data);

      expect(profile.languageDistribution.length).toBeGreaterThan(0);
      expect(profile.languageDistribution.length).toBeLessThanOrEqual(8);

      // 퍼센트 합이 대략 100%
      const totalPercent = profile.languageDistribution.reduce((sum, l) => sum + l.percent, 0);
      expect(totalPercent).toBeGreaterThan(90);
      expect(totalPercent).toBeLessThanOrEqual(100.1);
    });

    it('시간대별 패턴이 0~1로 정규화된다', () => {
      const data = createMockGitHubData();
      const profile = analyzeDNA(data);

      for (const value of profile.hourlyPattern) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(1);
      }
    });

    it('요일별 활동량이 올바른 구조를 가진다', () => {
      const data = createMockGitHubData();
      const profile = analyzeDNA(data);

      expect(profile.weekdayActivity).toHaveLength(7);
      const dayNames = profile.weekdayActivity.map(w => w.day);
      expect(dayNames).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']);

      for (const ring of profile.weekdayActivity) {
        expect(ring.activity).toBeGreaterThanOrEqual(0);
        expect(ring.activity).toBeLessThanOrEqual(1);
        expect(ring.rawCommits).toBeGreaterThanOrEqual(0);
      }
    });

    it('커밋 메시지 키워드를 분석한다', () => {
      const data = createMockGitHubData();
      // 모든 커밋이 feat: 로 시작
      data.commitHistory = data.commitHistory.map(c => ({
        ...c,
        message: 'feat: implement feature',
      }));

      const profile = analyzeDNA(data);

      expect(profile.messageKeywords.length).toBeGreaterThan(0);
      const featKeyword = profile.messageKeywords.find(k => k.keyword === 'feat');
      expect(featKeyword).toBeDefined();
      expect(featKeyword!.icon).toBe('⭐');
    });

    it('코딩 스타일을 올바르게 결정한다', () => {
      const data = createMockGitHubData();
      const profile = analyzeDNA(data);

      expect(['night_owl', 'early_bird', 'day_worker', 'balanced']).toContain(profile.codingStyle);
    });

    it('고유 시드가 일관적이다 (같은 데이터 = 같은 시드)', () => {
      const data = createMockGitHubData();
      const profile1 = analyzeDNA(data);
      const profile2 = analyzeDNA(data);

      expect(profile1.uniqueSeed).toBe(profile2.uniqueSeed);
    });

    it('빈 데이터를 처리한다', () => {
      const data = createMockGitHubData({
        commitHistory: [],
        repositories: [],
        languages: {},
        contributionCalendar: [],
      });

      const profile = analyzeDNA(data);

      expect(profile.languageDistribution).toHaveLength(0);
      expect(profile.totalCommits).toBe(0);
      expect(profile.codingStyle).toBe('balanced');
    });
  });

  describe('getCodingStyleInfo', () => {
    it('night_owl 정보를 반환한다', () => {
      const info = getCodingStyleInfo('night_owl');
      expect(info.labelKo).toContain('야간형');
      expect(info.icon).toBe('🌙');
    });

    it('early_bird 정보를 반환한다', () => {
      const info = getCodingStyleInfo('early_bird');
      expect(info.labelKo).toContain('새벽형');
      expect(info.icon).toBe('🌅');
    });

    it('day_worker 정보를 반환한다', () => {
      const info = getCodingStyleInfo('day_worker');
      expect(info.labelKo).toContain('주간형');
      expect(info.icon).toBe('☀️');
    });

    it('balanced 정보를 반환한다', () => {
      const info = getCodingStyleInfo('balanced');
      expect(info.labelKo).toContain('균형형');
      expect(info.icon).toBe('⚖️');
    });
  });
});
