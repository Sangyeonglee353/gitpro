// ═══════════════════════════════════════════
// 🧪 테스트용 목 데이터
// ═══════════════════════════════════════════

import {
  GitHubData,
  GitProConfig,
  GitProState,
  ThemeColors,
  CommitRecord,
  ContributionDay,
  GitHubRepository,
} from '../../src/types';

/** 테스트용 기본 GitHub 데이터 */
export function createMockGitHubData(overrides?: Partial<GitHubData>): GitHubData {
  return {
    user: {
      login: 'testuser',
      name: 'Test User',
      avatarUrl: 'https://avatars.githubusercontent.com/u/123456',
      bio: 'Full-stack developer',
      followers: 50,
      following: 30,
      createdAt: '2020-01-01T00:00:00Z',
      publicRepos: 15,
    },
    repositories: createMockRepositories(),
    commitHistory: createMockCommitHistory(),
    pullRequests: { total: 25, merged: 20, open: 3 },
    issues: { total: 30, closed: 25, open: 5 },
    languages: {
      TypeScript: 50000,
      JavaScript: 30000,
      Python: 15000,
      Go: 8000,
      HTML: 5000,
      CSS: 3000,
    },
    contributionCalendar: createMockContributionCalendar(),
    milestones: [
      { type: 'first_repo', date: '2020-01-15T00:00:00Z', details: { repoName: 'my-first-repo' } },
      { type: 'first_commit', date: '2020-01-16T00:00:00Z', details: { repo: 'my-first-repo', message: 'Initial commit' } },
      { type: 'new_language', date: '2020-06-01T00:00:00Z', details: { language: 'Python', repo: 'ml-project' } },
    ],
    ...overrides,
  };
}

/** 테스트용 레포지토리 목록 */
export function createMockRepositories(): GitHubRepository[] {
  return [
    {
      name: 'awesome-project',
      description: 'An awesome TypeScript project',
      primaryLanguage: 'TypeScript',
      stars: 120,
      forks: 15,
      totalCommits: 350,
      createdAt: '2021-01-01T00:00:00Z',
      updatedAt: '2026-02-01T00:00:00Z',
      pushedAt: '2026-02-01T00:00:00Z',
      isArchived: false,
      isFork: false,
      topics: ['typescript', 'nodejs', 'api'],
    },
    {
      name: 'web-app',
      description: 'A React web application',
      primaryLanguage: 'JavaScript',
      stars: 45,
      forks: 8,
      totalCommits: 200,
      createdAt: '2021-06-01T00:00:00Z',
      updatedAt: '2026-01-15T00:00:00Z',
      pushedAt: '2026-01-15T00:00:00Z',
      isArchived: false,
      isFork: false,
      topics: ['react', 'frontend'],
    },
    {
      name: 'ml-project',
      description: 'Machine learning experiments',
      primaryLanguage: 'Python',
      stars: 30,
      forks: 5,
      totalCommits: 100,
      createdAt: '2022-03-01T00:00:00Z',
      updatedAt: '2026-01-10T00:00:00Z',
      pushedAt: '2026-01-10T00:00:00Z',
      isArchived: false,
      isFork: false,
      topics: ['machine-learning', 'python', 'ai'],
    },
    {
      name: 'old-project',
      description: 'Archived project',
      primaryLanguage: 'Java',
      stars: 5,
      forks: 1,
      totalCommits: 50,
      createdAt: '2020-01-15T00:00:00Z',
      updatedAt: '2021-01-01T00:00:00Z',
      pushedAt: '2021-01-01T00:00:00Z',
      isArchived: true,
      isFork: false,
      topics: [],
    },
    {
      name: 'go-cli',
      description: 'CLI tool in Go',
      primaryLanguage: 'Go',
      stars: 10,
      forks: 2,
      totalCommits: 80,
      createdAt: '2023-01-01T00:00:00Z',
      updatedAt: '2026-01-20T00:00:00Z',
      pushedAt: '2026-01-20T00:00:00Z',
      isArchived: false,
      isFork: false,
      topics: ['golang', 'cli'],
    },
  ];
}

/** 테스트용 커밋 히스토리 */
export function createMockCommitHistory(): CommitRecord[] {
  const commits: CommitRecord[] = [];
  const repos = ['awesome-project', 'web-app', 'ml-project'];

  // 다양한 시간대의 커밋 생성
  for (let i = 0; i < 50; i++) {
    const hour = (i * 3) % 24;
    const dayOfWeek = i % 7;
    const month = Math.floor(i / 5) + 1;
    const safeMonth = Math.min(month, 12);
    const day = (i % 28) + 1;
    commits.push({
      date: `2026-${String(safeMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:00:00Z`,
      hour,
      dayOfWeek,
      repo: repos[i % repos.length],
      additions: 10 + (i * 7 + 3) % 90,  // 결정론적 값
      deletions: (i * 3 + 1) % 30,        // 결정론적 값
      message: `feat: implement feature ${i}`,
    });
  }

  return commits;
}

/** 테스트용 기여 캘린더 (최근 90일) */
export function createMockContributionCalendar(): ContributionDay[] {
  const days: ContributionDay[] = [];
  const now = new Date();

  for (let i = 90; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    days.push({
      date: date.toISOString().split('T')[0],
      count: i % 3 === 0 ? 0 : Math.floor(Math.random() * 8) + 1,
    });
  }

  return days;
}

/** 테스트용 기본 설정 */
export function createMockConfig(overrides?: Partial<GitProConfig>): GitProConfig {
  return {
    username: 'testuser',
    timezone: 'Asia/Seoul',
    locale: 'ko',
    theme: 'dark',
    modules: {
      'trading-card': {
        enabled: true,
        style: 'hologram',
        show_ability: true,
        show_skills: true,
        max_skills: 5,
        custom_title: '',
      },
      'code-dna': {
        enabled: true,
        shape: 'circular',
        color_scheme: 'language',
        complexity: 'detailed',
      },
      chronicle: {
        enabled: true,
        max_chapters: 8,
        style: 'rpg',
        language: 'ko',
      },
      'code-pet': {
        enabled: true,
        custom_name: '',
        show_mood: true,
        show_stats: true,
        animation: true,
      },
      constellation: {
        enabled: true,
        sky_theme: 'midnight',
        show_meteors: true,
        show_nebula: true,
        max_constellations: 10,
      },
      'dev-city': {
        enabled: true,
        city_style: 'pixel',
        show_weather: true,
        show_traffic: true,
        animation: true,
      },
    },
    readme: {
      auto_update: true,
      layout: 'grid',
      header: {
        type: 'wave',
        text: 'Hello, I\'m testuser! 👋',
        color: '#6C63FF',
      },
      footer: {
        enabled: true,
        style: 'minimal',
        text: '',
      },
      module_order: [],
      show_last_updated: true,
    },
    gist: {
      enabled: false,
      gist_id: '',
      modules: [],
    },
    ...overrides,
  };
}

/** 테스트용 기본 상태 */
export function createMockState(overrides?: Partial<GitProState>): GitProState {
  return {
    lastUpdated: '2026-02-01T00:00:00Z',
    pet: {
      species: 'TypeScriptodon',
      stage: 2,
      exp: 5000,
      mood: 70,
      hunger: 30,
      lastFed: '2026-02-01T00:00:00Z',
      birthDate: '2025-06-01T00:00:00Z',
      abilities: ['Type Guard', 'Generic Blast'],
    },
    city: {
      tier: 2,
      population: 500,
      buildings: 8,
      lastWeather: 'sunny',
    },
    chronicle: {
      currentChapter: 3,
      unlockedTitles: ['The Beginning', 'The Awakening'],
      currentQuest: { type: 'streak_30', progress: 15 },
    },
    card: {
      seasonNumber: 1,
      cardNumber: 5,
      highestRarity: 'rare',
    },
    ...overrides,
  };
}

/** 테스트용 다크 테마 */
export function createMockTheme(): ThemeColors {
  return {
    name: 'dark',
    background: '#0d1117',
    backgroundSecondary: '#161b22',
    text: '#e6edf3',
    textSecondary: '#8b949e',
    accent: '#58a6ff',
    accentSecondary: '#1f6feb',
    border: '#30363d',
    success: '#3fb950',
    warning: '#d29922',
    error: '#f85149',
    cardGradientStart: '#161b22',
    cardGradientEnd: '#0d1117',
  };
}
