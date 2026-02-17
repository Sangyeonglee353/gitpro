// ═══════════════════════════════════════════
// 🧪 Dev City 모듈 테스트
// ═══════════════════════════════════════════

import { analyzeCity } from '../../src/modules/dev-city/city-analyzer';
import {
  classifyBuilding,
  getBuildingInfo,
  getBuildingIcon,
  getCityTier,
  getWeatherInfo,
} from '../../src/modules/dev-city/building-mapper';
import {
  createMockGitHubData,
  createMockRepositories,
  createMockState,
} from '../helpers/mock-data';
import { GitHubRepository, CityState } from '../../src/types';

// ── analyzeCity 테스트 ──────────────

describe('analyzeCity', () => {
  const defaultState: CityState = {
    tier: 0,
    population: 0,
    buildings: 0,
    lastWeather: 'cloudy',
  };

  it('도시 프로파일 전체 구조를 올바르게 생성한다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile).toHaveProperty('buildings');
    expect(profile).toHaveProperty('tier');
    expect(profile).toHaveProperty('weather');
    expect(profile).toHaveProperty('traffic');
    expect(profile).toHaveProperty('stats');
    expect(profile).toHaveProperty('stateUpdate');
  });

  it('Fork가 아닌 레포만 건물로 변환한다', () => {
    const repos: GitHubRepository[] = [
      ...createMockRepositories(),
      {
        name: 'forked-repo',
        description: 'A forked repo',
        primaryLanguage: 'JavaScript',
        stars: 0,
        forks: 0,
        totalCommits: 10,
        createdAt: '2023-01-01T00:00:00Z',
        updatedAt: '2024-12-01T00:00:00Z',
        pushedAt: '2024-12-01T00:00:00Z',
        isArchived: false,
        isFork: true,
        topics: [],
      },
    ];
    const data = createMockGitHubData({ repositories: repos });
    const profile = analyzeCity(data, defaultState);

    const forkBuilding = profile.buildings.find(b => b.repoName === 'forked-repo');
    expect(forkBuilding).toBeUndefined();
  });

  it('건물 수가 최대 30개로 제한된다', () => {
    const manyRepos: GitHubRepository[] = Array.from({ length: 50 }, (_, i) => ({
      name: `repo-${i}`,
      description: `Repo ${i}`,
      primaryLanguage: 'TypeScript',
      stars: i,
      forks: 0,
      totalCommits: 50 + i,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2024-12-01T00:00:00Z',
      pushedAt: '2024-12-01T00:00:00Z',
      isArchived: false,
      isFork: false,
      topics: [],
    }));
    const data = createMockGitHubData({ repositories: manyRepos });
    const profile = analyzeCity(data, defaultState);

    expect(profile.buildings.length).toBeLessThanOrEqual(30);
  });

  it('건물에 올바른 그리드 위치가 할당된다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    for (const b of profile.buildings) {
      expect(b.gridRow).toBeGreaterThanOrEqual(0);
      expect(b.gridCol).toBeGreaterThanOrEqual(0);
    }
  });

  it('건물 높이가 양수이다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    for (const b of profile.buildings) {
      expect(b.height).toBeGreaterThan(0);
    }
  });

  it('도시 Tier가 건물 수에 따라 결정된다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile.tier).toBeDefined();
    expect(profile.tier.tier).toBeGreaterThanOrEqual(0);
    expect(profile.tier.tier).toBeLessThanOrEqual(5);
  });

  it('날씨 정보가 올바른 구조를 가진다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile.weather.type).toBeTruthy();
    expect(profile.weather.icon).toBeTruthy();
    expect(profile.weather.label).toBeTruthy();
    expect(profile.weather.labelKo).toBeTruthy();
  });

  it('교통 정보가 올바른 범위를 가진다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile.traffic.level).toBeGreaterThanOrEqual(0);
    expect(profile.traffic.level).toBeLessThanOrEqual(5);
    expect(profile.traffic.vehicleCount).toBeGreaterThanOrEqual(0);
    expect(profile.traffic.description).toBeTruthy();
  });

  it('커밋 히스토리가 없으면 교통량 0이다', () => {
    const data = createMockGitHubData({ commitHistory: [] });
    const profile = analyzeCity(data, defaultState);

    expect(profile.traffic.level).toBe(0);
    expect(profile.traffic.vehicleCount).toBe(0);
  });

  it('통계가 올바르게 계산된다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile.stats.totalBuildings).toBe(profile.buildings.length);
    expect(profile.stats.totalCommits).toBe(data.commitHistory.length);
    expect(profile.stats.totalRepos).toBe(data.repositories.filter(r => !r.isFork).length);
    expect(profile.stats.totalStars).toBeGreaterThanOrEqual(0);
    expect(profile.stats.population).toBeGreaterThan(0);
    expect(profile.stats.topLanguage).toBeTruthy();
    expect(profile.stats.streakDays).toBeGreaterThanOrEqual(0);
  });

  it('상태 업데이트가 올바르게 생성된다', () => {
    const data = createMockGitHubData();
    const profile = analyzeCity(data, defaultState);

    expect(profile.stateUpdate.tier).toBe(profile.tier.tier);
    expect(profile.stateUpdate.population).toBe(profile.stats.population);
    expect(profile.stateUpdate.buildings).toBe(profile.buildings.length);
    expect(profile.stateUpdate.lastWeather).toBe(profile.weather.type);
  });

  it('빈 데이터를 처리한다', () => {
    const data = createMockGitHubData({
      repositories: [],
      commitHistory: [],
      contributionCalendar: [],
    });
    const profile = analyzeCity(data, defaultState);

    expect(profile.buildings).toHaveLength(0);
    expect(profile.stats.totalBuildings).toBe(0);
  });

  it('기여 캘린더가 비어있으면 cloudy 날씨를 반환한다', () => {
    const data = createMockGitHubData({ contributionCalendar: [] });
    const profile = analyzeCity(data, defaultState);

    expect(profile.weather.type).toBe('cloudy');
  });

  it('PR 머지가 많으면 fireworks 날씨일 수 있다', () => {
    const data = createMockGitHubData({
      pullRequests: { total: 30, merged: 25, open: 5 },
    });
    const profile = analyzeCity(data, defaultState);

    expect(profile.weather.type).toBe('fireworks');
  });

  it('오픈 이슈가 많으면 volcano 날씨일 수 있다', () => {
    const data = createMockGitHubData({
      pullRequests: { total: 5, merged: 3, open: 2 },
      issues: { total: 50, closed: 20, open: 30 },
    });
    const profile = analyzeCity(data, defaultState);

    expect(profile.weather.type).toBe('volcano');
  });
});

// ── Building Mapper 테스트 ──────────────

describe('Building Mapper', () => {
  describe('classifyBuilding', () => {
    it('ML 관련 레포를 lab으로 분류한다', () => {
      const repo = createMockRepositories()[2]; // ml-project (machine-learning topic)
      expect(classifyBuilding(repo)).toBe('lab');
    });

    it('React 웹앱을 mall로 분류한다', () => {
      const repo = createMockRepositories()[1]; // web-app (react, frontend topic)
      expect(classifyBuilding(repo)).toBe('mall');
    });

    it('Go CLI를 garage로 분류한다', () => {
      const repo = createMockRepositories()[4]; // go-cli (golang, cli topic)
      expect(classifyBuilding(repo)).toBe('garage');
    });

    it('API 레포를 factory로 분류한다', () => {
      const repo: GitHubRepository = {
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
      expect(classifyBuilding(repo)).toBe('factory');
    });

    it('아카이브된 레포를 ruin으로 분류한다', () => {
      const repo: GitHubRepository = {
        name: 'abandoned-repo',
        description: 'Long abandoned',
        primaryLanguage: 'JavaScript',
        stars: 5,
        forks: 0,
        totalCommits: 20,
        createdAt: '2018-01-01T00:00:00Z',
        updatedAt: '2020-01-01T00:00:00Z',
        pushedAt: '2020-01-01T00:00:00Z',
        isArchived: true,
        isFork: false,
        topics: [],
      };
      expect(classifyBuilding(repo)).toBe('ruin');
    });
  });

  describe('getBuildingInfo', () => {
    it('건물 정보에 올바른 속성이 있다', () => {
      const repo = createMockRepositories()[0];
      const info = getBuildingInfo('factory', repo);

      expect(info.type).toBe('factory');
      expect(info.icon).toBeTruthy();
      expect(info.name).toBeTruthy();
      expect(info.label).toBeTruthy();
      expect(info.colorMain).toBeTruthy();
      expect(info.colorAccent).toBeTruthy();
      expect(info.heightFactor).toBeGreaterThanOrEqual(1);
      expect(info.heightFactor).toBeLessThanOrEqual(3);
    });

    it('커밋과 스타가 많으면 높이 계수가 높아진다', () => {
      const smallRepo: GitHubRepository = {
        ...createMockRepositories()[0],
        totalCommits: 5,
        stars: 0,
      };
      const bigRepo: GitHubRepository = {
        ...createMockRepositories()[0],
        totalCommits: 500,
        stars: 100,
      };

      const infoSmall = getBuildingInfo('factory', smallRepo);
      const infoBig = getBuildingInfo('factory', bigRepo);

      expect(infoBig.heightFactor).toBeGreaterThan(infoSmall.heightFactor);
    });
  });

  describe('getBuildingIcon', () => {
    it('각 건물 타입에 대해 아이콘을 반환한다', () => {
      expect(getBuildingIcon('mall')).toBe('🏬');
      expect(getBuildingIcon('factory')).toBe('🏗️');
      expect(getBuildingIcon('lab')).toBe('🔬');
      expect(getBuildingIcon('ruin')).toBe('🏚️');
    });
  });

  describe('getCityTier', () => {
    it('레포 0개일 때 Campsite (tier 0)을 반환한다', () => {
      const tier = getCityTier(0);
      expect(tier.tier).toBe(0);
      expect(tier.name).toBe('Campsite');
    });

    it('레포 3개일 때 Village (tier 1)를 반환한다', () => {
      const tier = getCityTier(3);
      expect(tier.tier).toBe(1);
      expect(tier.name).toBe('Village');
    });

    it('레포 6개일 때 Town (tier 2)을 반환한다', () => {
      const tier = getCityTier(6);
      expect(tier.tier).toBe(2);
      expect(tier.name).toBe('Town');
    });

    it('레포 11개일 때 City (tier 3)를 반환한다', () => {
      const tier = getCityTier(11);
      expect(tier.tier).toBe(3);
      expect(tier.name).toBe('City');
    });

    it('레포 21개일 때 Metropolis (tier 4)를 반환한다', () => {
      const tier = getCityTier(21);
      expect(tier.tier).toBe(4);
      expect(tier.name).toBe('Metropolis');
    });

    it('레포 41개 이상일 때 Megacity (tier 5)를 반환한다', () => {
      const tier = getCityTier(50);
      expect(tier.tier).toBe(5);
      expect(tier.name).toBe('Megacity');
    });
  });

  describe('getWeatherInfo', () => {
    it.each([
      ['sunny', '☀️'],
      ['cloudy', '☁️'],
      ['rainy', '🌧️'],
      ['snowy', '❄️'],
      ['rainbow', '🌈'],
      ['fireworks', '🎆'],
      ['volcano', '🌋'],
    ] as const)('%s 날씨에 맞는 아이콘을 반환한다', (type, icon) => {
      const weather = getWeatherInfo(type);
      expect(weather.type).toBe(type);
      expect(weather.icon).toBe(icon);
      expect(weather.label).toBeTruthy();
      expect(weather.labelKo).toBeTruthy();
    });
  });
});
