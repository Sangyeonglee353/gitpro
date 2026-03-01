/**
 * Dev City 미리보기 SVG 생성 스크립트
 * 실행: npx ts-node scripts/generate-city-preview.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { renderCity } from '../src/modules/dev-city/city-renderer';
import { analyzeCity } from '../src/modules/dev-city/city-analyzer';
import { renderMetroCity } from '../src/modules/metro-city/metro-renderer';
import { analyzeMetroCity } from '../src/modules/metro-city/metro-analyzer';
import { GitHubData, CityState, ThemeColors } from '../src/types';

// ── 목 데이터 ──────────────────────────────

function makeMockGitHubData(): GitHubData {
  // 기여 캘린더 생성 (364일, 다양한 커밋 패턴)
  const calendar = [];
  const today = new Date();
  for (let i = 363; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    const dayOfWeek = d.getDay();
    // 주중은 더 많은 커밋, 주말은 적게
    const base = dayOfWeek === 0 || dayOfWeek === 6 ? 1 : 4;
    // 파동 패턴 (프로젝트 스프린트 시뮬레이션)
    const wave = Math.sin(i / 14) * 3 + Math.sin(i / 7) * 2;
    const spike = i % 30 < 5 ? 8 : 0; // 월별 스프린트 피크
    const count = Math.max(0, Math.round(base + wave + spike + (Math.random() * 3 - 1)));
    calendar.push({ date: dateStr, count });
  }

  return {
    user: {
      login: 'devcoder',
      name: 'Dev Coder',
      avatarUrl: '',
      bio: 'Building the future, one commit at a time',
      followers: 1420,
      following: 380,
      createdAt: '2018-03-12T00:00:00Z',
      publicRepos: 47,
    },
    repositories: [
      { name: 'next-portfolio',     description: 'Personal portfolio built with Next.js',    primaryLanguage: 'TypeScript', stars: 234, forks: 42,  totalCommits: 380, createdAt: '2022-01-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z', pushedAt: '2025-12-01T00:00:00Z', isArchived: false, isFork: false, topics: ['react', 'nextjs', 'frontend', 'portfolio'] },
      { name: 'api-gateway',        description: 'High-performance REST API gateway service', primaryLanguage: 'Go',         stars: 186, forks: 31,  totalCommits: 520, createdAt: '2021-06-01T00:00:00Z', updatedAt: '2025-11-20T00:00:00Z', pushedAt: '2025-11-20T00:00:00Z', isArchived: false, isFork: false, topics: ['backend', 'api', 'go', 'microservices'] },
      { name: 'ml-vision',          description: 'Computer vision model for object detection', primaryLanguage: 'Python',     stars: 512, forks: 88,  totalCommits: 290, createdAt: '2021-09-01T00:00:00Z', updatedAt: '2025-10-05T00:00:00Z', pushedAt: '2025-10-05T00:00:00Z', isArchived: false, isFork: false, topics: ['machine-learning', 'pytorch', 'ai', 'vision'] },
      { name: 'react-ui-kit',       description: 'Component library for rapid UI development', primaryLanguage: 'TypeScript', stars: 341, forks: 57,  totalCommits: 440, createdAt: '2022-03-01T00:00:00Z', updatedAt: '2025-12-10T00:00:00Z', pushedAt: '2025-12-10T00:00:00Z', isArchived: false, isFork: false, topics: ['react', 'library', 'npm', 'ui'] },
      { name: 'gitpro',             description: 'GitHub profile visualization suite',        primaryLanguage: 'TypeScript', stars: 89,  forks: 14,  totalCommits: 620, createdAt: '2023-01-01T00:00:00Z', updatedAt: '2025-12-20T00:00:00Z', pushedAt: '2025-12-20T00:00:00Z', isArchived: false, isFork: false, topics: ['github', 'cli', 'tool', 'automation'] },
      { name: 'devnotes',           description: 'My coding notes and TIL documentation',     primaryLanguage: 'Markdown',   stars: 67,  forks: 8,   totalCommits: 180, createdAt: '2020-05-01T00:00:00Z', updatedAt: '2025-11-01T00:00:00Z', pushedAt: '2025-11-01T00:00:00Z', isArchived: false, isFork: false, topics: ['docs', 'blog', 'til', 'documentation'] },
      { name: 'algo-arena',         description: 'Competitive programming solutions & games',  primaryLanguage: 'C++',        stars: 145, forks: 22,  totalCommits: 350, createdAt: '2020-08-01T00:00:00Z', updatedAt: '2025-09-01T00:00:00Z', pushedAt: '2025-09-01T00:00:00Z', isArchived: false, isFork: false, topics: ['game', 'algorithm', 'competitive', 'cpp'] },
      { name: 'flutter-shopapp',    description: 'Cross-platform shopping app',               primaryLanguage: 'Dart',       stars: 78,  forks: 19,  totalCommits: 210, createdAt: '2023-05-01T00:00:00Z', updatedAt: '2025-10-01T00:00:00Z', pushedAt: '2025-10-01T00:00:00Z', isArchived: false, isFork: false, topics: ['flutter', 'mobile', 'dart', 'android'] },
      { name: 'data-pipeline',      description: 'ETL pipeline for analytics platform',       primaryLanguage: 'Python',     stars: 55,  forks: 11,  totalCommits: 165, createdAt: '2023-02-01T00:00:00Z', updatedAt: '2025-08-01T00:00:00Z', pushedAt: '2025-08-01T00:00:00Z', isArchived: false, isFork: false, topics: ['backend', 'api', 'python', 'analytics'] },
      { name: 'k8s-config',         description: 'Kubernetes cluster configurations & scripts', primaryLanguage: 'Shell',    stars: 33,  forks: 6,   totalCommits: 95,  createdAt: '2023-08-01T00:00:00Z', updatedAt: '2025-07-01T00:00:00Z', pushedAt: '2025-07-01T00:00:00Z', isArchived: false, isFork: false, topics: ['cli', 'automation', 'kubernetes', 'devops'] },
      { name: 'civic-dashboard',    description: 'Open data civic analytics dashboard',       primaryLanguage: 'TypeScript', stars: 112, forks: 18,  totalCommits: 260, createdAt: '2022-09-01T00:00:00Z', updatedAt: '2025-11-15T00:00:00Z', pushedAt: '2025-11-15T00:00:00Z', isArchived: false, isFork: false, topics: ['profile', 'readme', 'frontend', 'web'] },
      { name: 'legacy-blog',        description: 'Old blog system (archived)',                 primaryLanguage: 'PHP',        stars: 12,  forks: 3,   totalCommits: 80,  createdAt: '2018-01-01T00:00:00Z', updatedAt: '2020-01-01T00:00:00Z', pushedAt: '2020-01-01T00:00:00Z', isArchived: true,  isFork: false, topics: [] },
      { name: 'npm-utils',          description: 'Collection of useful npm utility packages',  primaryLanguage: 'JavaScript', stars: 198, forks: 34,  totalCommits: 315, createdAt: '2021-11-01T00:00:00Z', updatedAt: '2025-09-20T00:00:00Z', pushedAt: '2025-09-20T00:00:00Z', isArchived: false, isFork: false, topics: ['library', 'npm', 'sdk', 'javascript'] },
      { name: 'quantum-sim',        description: 'Quantum circuit simulator in Rust',         primaryLanguage: 'Rust',       stars: 276, forks: 44,  totalCommits: 430, createdAt: '2023-03-01T00:00:00Z', updatedAt: '2025-12-05T00:00:00Z', pushedAt: '2025-12-05T00:00:00Z', isArchived: false, isFork: false, topics: ['machine-learning', 'ai', 'rust', 'simulation'] },
      // ── metro 스타일 테스트용 다양한 건물 타입 레포 ──────────────────
      { name: 'health-tracker',     description: 'Personal health & medical data tracker',     primaryLanguage: 'TypeScript', stars: 58,  forks: 9,   totalCommits: 140, createdAt: '2024-01-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z', pushedAt: '2025-12-01T00:00:00Z', isArchived: false, isFork: false, topics: ['health', 'medical', 'wellness', 'tracker'] },
      { name: 'learn-typescript',   description: 'Interactive TypeScript tutorial & exercises', primaryLanguage: 'TypeScript', stars: 71,  forks: 22,  totalCommits: 190, createdAt: '2023-06-01T00:00:00Z', updatedAt: '2025-11-01T00:00:00Z', pushedAt: '2025-11-01T00:00:00Z', isArchived: false, isFork: false, topics: ['education', 'tutorial', 'learn', 'course'] },
      { name: 'esports-tracker',    description: 'Esports tournament & team statistics',        primaryLanguage: 'Python',     stars: 44,  forks: 7,   totalCommits: 120, createdAt: '2024-03-01T00:00:00Z', updatedAt: '2025-10-01T00:00:00Z', pushedAt: '2025-10-01T00:00:00Z', isArchived: false, isFork: false, topics: ['esport', 'sport', 'statistics', 'community'] },
      { name: 'defi-protocol',      description: 'DeFi lending protocol smart contracts',      primaryLanguage: 'Solidity',   stars: 63,  forks: 14,  totalCommits: 200, createdAt: '2024-05-01T00:00:00Z', updatedAt: '2025-12-01T00:00:00Z', pushedAt: '2025-12-01T00:00:00Z', isArchived: false, isFork: false, topics: ['defi', 'blockchain', 'crypto', 'finance'] },
      { name: 'oss-community',      description: 'Open source community hub and resources',    primaryLanguage: 'Markdown',   stars: 31,  forks: 5,   totalCommits: 85,  createdAt: '2024-07-01T00:00:00Z', updatedAt: '2025-09-01T00:00:00Z', pushedAt: '2025-09-01T00:00:00Z', isArchived: false, isFork: false, topics: ['community', 'open-source', 'nonprofit', 'foundation'] },
      { name: 'next-app-template',  description: 'Production-ready Next.js starter template',  primaryLanguage: 'TypeScript', stars: 48,  forks: 18,  totalCommits: 95,  createdAt: '2024-09-01T00:00:00Z', updatedAt: '2025-12-15T00:00:00Z', pushedAt: '2025-12-15T00:00:00Z', isArchived: false, isFork: false, topics: ['template', 'nextjs', 'starter', 'boilerplate'] },
    ],
    commitHistory: (() => {
      const commits = [];
      const repos = ['next-portfolio', 'api-gateway', 'ml-vision', 'react-ui-kit', 'gitpro', 'devnotes', 'algo-arena', 'quantum-sim'];
      for (let i = 0; i < 480; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - Math.floor(Math.random() * 180));
        commits.push({
          date: d.toISOString().split('T')[0],
          hour: Math.floor(Math.random() * 24),
          dayOfWeek: d.getDay(),
          repo: repos[i % repos.length],
          additions: Math.floor(Math.random() * 200),
          deletions: Math.floor(Math.random() * 80),
          message: 'commit message',
        });
      }
      return commits;
    })(),
    pullRequests: { total: 38, merged: 28, open: 4 },
    issues: { total: 61, open: 7, closed: 54 },
    languages: { TypeScript: 45, Python: 22, Go: 12, Rust: 8, JavaScript: 7, Dart: 4, Shell: 2 },
    contributionCalendar: calendar,
    milestones: [],
  };
}

const today = new Date();
const mockState: CityState = {
  tier: 3,
  population: 84500,
  buildings: 14,
  lastWeather: 'sunny',
};

const mockTheme: ThemeColors = {
  name:                'dark',
  background:          '#1a1a2e',
  backgroundSecondary: '#16213e',
  text:                '#eef5ff',
  textSecondary:       '#90b4d4',
  accent:              '#4FC3F7',
  accentSecondary:     '#CE93D8',
  border:              '#1a3454',
  success:             '#69F0AE',
  warning:             '#FFD740',
  error:               '#FF5252',
  cardGradientStart:   '#0d1f3c',
  cardGradientEnd:     '#1e4878',
};

// ── 생성 실행 ──────────────────────────────

const githubData = makeMockGitHubData();
const profile = analyzeCity(githubData, mockState);
const outDir = path.join(__dirname, '..', 'output');
if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

const styles = ['tycoon', 'simcity', 'neon'] as const;

for (const style of styles) {
  const svg = renderCity({
    username: 'devcoder',
    profile,
    config: {
      city_style: style,
      show_weather: true,
      show_traffic: true,
      animation: true,
    } as any,
    theme: mockTheme,
  });

  const outPath = path.join(outDir, `dev-city-${style}.svg`);
  fs.writeFileSync(outPath, svg, 'utf-8');
  console.log(`✅ ${style.padEnd(8)} → output/dev-city-${style}.svg  (${(svg.length / 1024).toFixed(1)} KB)`);
}

console.log('\n🏙️  Dev City SVG 생성 완료!');

// ── Metro City 미리보기 ──────────────────────────────────────
const metroProfile = analyzeMetroCity(githubData, mockState);

const metroSvg = renderMetroCity({
  username: 'devcoder',
  profile: metroProfile,
  config: { show_weather: true, show_traffic: true, animation: true },
  theme: mockTheme,
});

const metroPath = path.join(outDir, 'metro-city.svg');
fs.writeFileSync(metroPath, metroSvg, 'utf-8');
console.log(`✅ metro    → output/metro-city.svg  (${(metroSvg.length / 1024).toFixed(1)} KB)`);
console.log('\n🏗️  Metro City SVG 생성 완료!');
