// ═══════════════════════════════════════════
// 🧪 Constellation 모듈 테스트
// ═══════════════════════════════════════════

import { analyzeConstellation } from '../../src/modules/constellation/constellation-analyzer';
import {
  classifyRepoType,
  getConstellationName,
  getConstellationNameKo,
  getStarColor,
  getSkyThemeColors,
  getRepoTypeIcon,
} from '../../src/modules/constellation/star-mapper';
import { createMockGitHubData, createMockRepositories } from '../helpers/mock-data';

// ── analyzeConstellation 테스트 ──────────────

describe('analyzeConstellation', () => {
  it('별자리 프로파일 전체 구조를 올바르게 생성한다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    expect(profile).toHaveProperty('constellations');
    expect(profile).toHaveProperty('meteors');
    expect(profile).toHaveProperty('nebulas');
    expect(profile).toHaveProperty('sky');
    expect(profile).toHaveProperty('stats');
  });

  it('Fork가 아닌 레포만 별자리로 변환한다', () => {
    const data = createMockGitHubData();
    const nonForkCount = data.repositories.filter(r => !r.isFork).length;
    const profile = analyzeConstellation(data, 20);

    expect(profile.constellations.length).toBeLessThanOrEqual(nonForkCount);
  });

  it('maxConstellations 제한을 올바르게 적용한다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 2);

    expect(profile.constellations.length).toBeLessThanOrEqual(2);
  });

  it('별자리마다 최소 1개 이상의 별이 있다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    for (const c of profile.constellations) {
      expect(c.stars.length).toBeGreaterThanOrEqual(1);
    }
  });

  it('별자리 구조가 올바르다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    for (const c of profile.constellations) {
      expect(c.repoName).toBeTruthy();
      expect(c.constellationName).toBeTruthy();
      expect(c.cx).toBeGreaterThanOrEqual(0.12);
      expect(c.cx).toBeLessThanOrEqual(0.88);
      expect(c.cy).toBeGreaterThanOrEqual(0.15);
      expect(c.cy).toBeLessThanOrEqual(0.85);
      expect(c.radius).toBeGreaterThan(0);
      expect(c.radius).toBeLessThanOrEqual(0.15);
    }
  });

  it('별의 좌표가 유효 범위 내에 있다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    for (const c of profile.constellations) {
      for (const star of c.stars) {
        expect(star.x).toBeGreaterThanOrEqual(0.05);
        expect(star.x).toBeLessThanOrEqual(0.95);
        expect(star.y).toBeGreaterThanOrEqual(0.05);
        expect(star.y).toBeLessThanOrEqual(0.95);
        expect(star.brightness).toBeGreaterThanOrEqual(0.2);
        expect(star.brightness).toBeLessThanOrEqual(1);
        expect(star.size).toBeGreaterThanOrEqual(1);
        expect(star.size).toBeLessThanOrEqual(5);
      }
    }
  });

  it('유성이 항상 1개 이상 생성된다 (최소 보장)', () => {
    const data = createMockGitHubData({
      pullRequests: { total: 0, merged: 0, open: 0 },
    });
    const profile = analyzeConstellation(data, 10);

    // buildMeteors: Math.min(8, Math.max(1, ceil(0/5))) = 1
    expect(profile.meteors.length).toBeGreaterThanOrEqual(1);
  });

  it('PR 머지 수가 많을수록 유성이 더 많다', () => {
    const dataLow = createMockGitHubData({
      pullRequests: { total: 5, merged: 3, open: 2 },
    });
    const dataHigh = createMockGitHubData({
      pullRequests: { total: 100, merged: 80, open: 5 },
    });

    const profileLow = analyzeConstellation(dataLow, 10);
    const profileHigh = analyzeConstellation(dataHigh, 10);

    expect(profileHigh.meteors.length).toBeGreaterThanOrEqual(profileLow.meteors.length);
  });

  it('유성 최대 8개로 제한된다', () => {
    const data = createMockGitHubData({
      pullRequests: { total: 1000, merged: 999, open: 1 },
    });
    const profile = analyzeConstellation(data, 10);

    expect(profile.meteors.length).toBeLessThanOrEqual(8);
  });

  it('성운이 오픈 이슈에 따라 생성된다', () => {
    const data = createMockGitHubData({
      issues: { total: 20, closed: 10, open: 10 },
    });
    const profile = analyzeConstellation(data, 10);

    expect(profile.nebulas.length).toBeGreaterThan(0);
    expect(profile.nebulas.length).toBeLessThanOrEqual(5);
  });

  it('하늘 배경이 올바른 타입을 가진다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    expect(['dawn', 'day', 'night']).toContain(profile.sky.type);
    expect(profile.sky.colors.length).toBeGreaterThanOrEqual(3);
    expect(typeof profile.sky.peakHour).toBe('number');
    expect(typeof profile.sky.showMilkyWay).toBe('boolean');
  });

  it('커밋 히스토리가 없으면 night 하늘을 반환한다', () => {
    const data = createMockGitHubData({ commitHistory: [] });
    const profile = analyzeConstellation(data, 10);

    expect(profile.sky.type).toBe('night');
    expect(profile.sky.showMilkyWay).toBe(true);
  });

  it('통계가 정확하게 계산된다', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    expect(profile.stats.totalConstellations).toBe(profile.constellations.length);
    expect(profile.stats.totalMeteors).toBe(profile.meteors.length);
    expect(profile.stats.totalNebulas).toBe(profile.nebulas.length);
    expect(profile.stats.totalCommits).toBe(data.commitHistory.length);
    expect(profile.stats.totalStars).toBeGreaterThanOrEqual(0);
    expect(profile.stats.totalGitHubStars).toBeGreaterThanOrEqual(0);
  });

  it('레포지토리가 없으면 빈 별자리 목록을 반환한다', () => {
    const data = createMockGitHubData({
      repositories: [],
      commitHistory: [],
    });
    const profile = analyzeConstellation(data, 10);

    expect(profile.constellations).toHaveLength(0);
    expect(profile.stats.totalConstellations).toBe(0);
  });

  it('중요도순으로 별자리가 정렬된다 (커밋+스타 기반)', () => {
    const data = createMockGitHubData();
    const profile = analyzeConstellation(data, 10);

    // 커밋 수 * 2 + 스타 수 * 10 으로 정렬
    for (let i = 1; i < profile.constellations.length; i++) {
      const scoreA = profile.constellations[i - 1].totalCommits * 2 + profile.constellations[i - 1].starCount * 10;
      const scoreB = profile.constellations[i].totalCommits * 2 + profile.constellations[i].starCount * 10;
      expect(scoreA).toBeGreaterThanOrEqual(scoreB);
    }
  });
});

// ── Star Mapper 테스트 ──────────────

describe('Star Mapper', () => {
  describe('classifyRepoType', () => {
    it('ML 관련 레포를 ml로 분류한다', () => {
      const repo = createMockRepositories()[2]; // ml-project
      expect(classifyRepoType(repo)).toBe('ml');
    });

    it('Go CLI 레포를 cli로 분류한다', () => {
      const repo = createMockRepositories()[4]; // go-cli
      expect(classifyRepoType(repo)).toBe('cli');
    });

    it('React 웹앱을 frontend로 분류한다', () => {
      const repo = createMockRepositories()[1]; // web-app (React)
      expect(classifyRepoType(repo)).toBe('frontend');
    });

    it('API/NodeJS 프로젝트를 backend로 분류한다', () => {
      const repo: any = {
        name: 'my-api-server',
        description: 'REST API backend server',
        primaryLanguage: 'Go',
        stars: 10,
        forks: 2,
        totalCommits: 100,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: '2026-02-01T00:00:00Z',
        pushedAt: '2026-02-01T00:00:00Z',
        isArchived: false,
        isFork: false,
        topics: ['api', 'backend'],
      };
      expect(classifyRepoType(repo)).toBe('backend');
    });
  });

  describe('getConstellationName', () => {
    it('레포 타입에 맞는 영어 별자리 이름을 생성한다', () => {
      const name = getConstellationName('my-project', 'frontend');
      expect(name).toContain('my-project');
      expect(name).toContain("'s Shield");
    });

    it('긴 레포 이름을 12자로 자른다', () => {
      const name = getConstellationName('very-long-repo-name-here', 'backend');
      expect(name.length).toBeLessThan('very-long-repo-name-here'.length + "'s Tower".length);
    });
  });

  describe('getConstellationNameKo', () => {
    it('레포 타입에 맞는 한국어 별자리 이름을 생성한다', () => {
      const name = getConstellationNameKo('my-project', 'ml');
      expect(name).toContain('my-project');
      expect(name).toContain('의 눈');
    });
  });

  describe('getStarColor', () => {
    it('TypeScript를 파란색으로 매핑한다', () => {
      expect(getStarColor('TypeScript')).toBe('#58a6ff');
    });

    it('Python을 녹색으로 매핑한다', () => {
      expect(getStarColor('Python')).toBe('#6bbd6e');
    });

    it('null이면 기본 은빛을 반환한다', () => {
      expect(getStarColor(null)).toBe('#c8d6e5');
    });

    it('알 수 없는 언어면 기본 색상을 반환한다', () => {
      expect(getStarColor('UnknownLang')).toBe('#c8d6e5');
    });
  });

  describe('getSkyThemeColors', () => {
    it.each(['midnight', 'aurora', 'sunset', 'deep_space'] as const)(
      '%s 테마가 올바른 구조를 반환한다',
      (theme) => {
        const colors = getSkyThemeColors(theme);
        expect(colors.bgGradient).toBeDefined();
        expect(colors.bgGradient.length).toBeGreaterThanOrEqual(3);
        expect(colors.starGlow).toBeTruthy();
        expect(colors.textColor).toBeTruthy();
        expect(colors.textSecondary).toBeTruthy();
        expect(colors.milkyWayColor).toBeTruthy();
        expect(colors.meteorColor).toBeTruthy();
        expect(colors.borderColor).toBeTruthy();
      }
    );
  });

  describe('getRepoTypeIcon', () => {
    it('각 레포 타입에 대해 아이콘을 반환한다', () => {
      expect(getRepoTypeIcon('frontend')).toBe('🛡️');
      expect(getRepoTypeIcon('backend')).toBe('🏗️');
      expect(getRepoTypeIcon('game')).toBe('⚔️');
      expect(getRepoTypeIcon('other')).toBe('⭐');
    });
  });
});
