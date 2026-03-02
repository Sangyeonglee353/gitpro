import { analyzeMetroCity } from '../../src/modules/metro-city/metro-analyzer';
import {
  createMockGitHubData,
  createMockRepositories,
} from '../helpers/mock-data';
import { CityState, GitHubRepository } from '../../src/types';

describe('analyzeMetroCity', () => {
  const defaultState: CityState = {
    tier: 0,
    population: 0,
    buildings: 0,
    lastWeather: 'cloudy',
  };

  it('returns a complete profile shape', () => {
    const data = createMockGitHubData();
    const profile = analyzeMetroCity(data, defaultState);

    expect(profile).toHaveProperty('buildings');
    expect(profile).toHaveProperty('tier');
    expect(profile).toHaveProperty('weather');
    expect(profile).toHaveProperty('traffic');
    expect(profile).toHaveProperty('stats');
    expect(profile).toHaveProperty('stateUpdate');
  });

  it('filters forked repositories from buildings', () => {
    const repos: GitHubRepository[] = [
      ...createMockRepositories(),
      {
        name: 'forked-repo',
        description: 'fork',
        primaryLanguage: 'TypeScript',
        stars: 10,
        forks: 3,
        totalCommits: 25,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z',
        pushedAt: '2026-01-01T00:00:00Z',
        isArchived: false,
        isFork: true,
        topics: [],
      },
    ];

    const data = createMockGitHubData({ repositories: repos });
    const profile = analyzeMetroCity(data, defaultState);

    expect(profile.buildings.some(b => b.repoName === 'forked-repo')).toBe(false);
  });

  it('marks archived or stale repositories as dormant', () => {
    const now = new Date().toISOString();
    const staleDate = '2020-01-01T00:00:00Z';
    const repos: GitHubRepository[] = [
      {
        name: 'stale-repo',
        description: 'old updates',
        primaryLanguage: 'TypeScript',
        stars: 1,
        forks: 0,
        totalCommits: 10,
        createdAt: staleDate,
        updatedAt: staleDate,
        pushedAt: staleDate,
        isArchived: false,
        isFork: false,
        topics: [],
      },
      {
        name: 'active-repo',
        description: 'fresh updates',
        primaryLanguage: 'TypeScript',
        stars: 1,
        forks: 0,
        totalCommits: 10,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: now,
        pushedAt: now,
        isArchived: false,
        isFork: false,
        topics: [],
      },
      {
        name: 'archived-repo',
        description: 'archived',
        primaryLanguage: 'TypeScript',
        stars: 1,
        forks: 0,
        totalCommits: 10,
        createdAt: '2025-01-01T00:00:00Z',
        updatedAt: now,
        pushedAt: now,
        isArchived: true,
        isFork: false,
        topics: [],
      },
    ];

    const data = createMockGitHubData({ repositories: repos });
    const profile = analyzeMetroCity(data, defaultState);

    expect(profile.buildings.find(b => b.repoName === 'stale-repo')?.isDormant).toBe(true);
    expect(profile.buildings.find(b => b.repoName === 'active-repo')?.isDormant).toBe(false);
    expect(profile.buildings.find(b => b.repoName === 'archived-repo')?.isDormant).toBe(true);
  });
});
