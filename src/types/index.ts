// ═══════════════════════════════════════════
// 🎮 gitpro - 핵심 타입 정의
// ═══════════════════════════════════════════

// ── 모듈 인터페이스 ──────────────────────────

/** 모든 모듈이 구현해야 하는 표준 인터페이스 */
export interface GitProModule {
  /** 모듈 고유 ID */
  readonly id: string;

  /** 모듈 표시 이름 */
  readonly name: string;

  /** 모듈 설명 */
  readonly description: string;

  /** 모듈 아이콘 이모지 */
  readonly icon: string;

  /** 모듈 실행 - GitHub 데이터를 받아 SVG를 생성 */
  generate(context: ModuleContext): Promise<ModuleOutput>;
}

/** 모듈에 전달되는 공유 컨텍스트 */
export interface ModuleContext {
  /** GitHub 데이터 (전 모듈 공유, 1회만 수집) */
  githubData: GitHubData;

  /** 해당 모듈의 config 설정값 */
  moduleConfig: Record<string, unknown>;

  /** 글로벌 설정 (테마, 로케일 등) */
  globalConfig: GitProConfig;

  /** 영구 상태 매니저 */
  state: GitProState;

  /** 테마 설정 */
  theme: ThemeColors;
}

/** 모듈 출력 결과 */
export interface ModuleOutput {
  /** 생성된 SVG 문자열 */
  svg: string;

  /** README에 삽입할 마크다운 (이미지 태그 등) */
  markdown: string;

  /** 다음 실행을 위해 저장할 상태 업데이트 */
  stateUpdate?: Record<string, unknown>;
}

// ── GitHub 데이터 ──────────────────────────

/** GitHub에서 수집한 통합 데이터 */
export interface GitHubData {
  user: GitHubUser;
  repositories: GitHubRepository[];
  commitHistory: CommitRecord[];
  pullRequests: PRStats;
  issues: IssueStats;
  languages: Record<string, number>;
  contributionCalendar: ContributionDay[];
  milestones: MilestoneEvent[];
}

export interface GitHubUser {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  followers: number;
  following: number;
  createdAt: string;
  publicRepos: number;
}

export interface GitHubRepository {
  name: string;
  description: string | null;
  primaryLanguage: string | null;
  stars: number;
  forks: number;
  totalCommits: number;
  createdAt: string;
  updatedAt: string;
  pushedAt: string;
  isArchived: boolean;
  isFork: boolean;
  topics: string[];
}

export interface CommitRecord {
  date: string;
  hour: number;
  dayOfWeek: number;
  repo: string;
  additions: number;
  deletions: number;
  message: string;
}

export interface PRStats {
  total: number;
  merged: number;
  open: number;
}

export interface IssueStats {
  total: number;
  closed: number;
  open: number;
}

export interface ContributionDay {
  date: string;
  count: number;
}

export type MilestoneType =
  | 'first_commit'
  | 'first_repo'
  | 'first_pr_merged'
  | 'first_star'
  | 'first_follower'
  | 'streak_30'
  | 'new_language'
  | 'stars_100'
  | 'repo_created';

export interface MilestoneEvent {
  type: MilestoneType;
  date: string;
  details: Record<string, unknown>;
}

// ── 설정 (Config) ──────────────────────────

export interface GitProConfig {
  username: string;
  timezone: string;
  locale: 'ko' | 'en' | 'ja';
  theme: ThemeName;
  custom_theme?: CustomThemeColors;
  modules: ModulesConfig;
  readme: ReadmeConfig;
  gist: GistConfig;
}

export type ThemeName =
  | 'dark'
  | 'light'
  | 'cyberpunk'
  | 'retro'
  | 'pastel'
  | 'ocean'
  | 'forest'
  | 'dracula'
  | 'nord'
  | 'sunset'
  | 'custom';

export interface ModulesConfig {
  'trading-card': TradingCardConfig;
  'code-dna': CodeDNAConfig;
  chronicle: ChronicleConfig;
  'code-pet': CodePetConfig;
  constellation: ConstellationConfig;
  'dev-city': DevCityConfig;
}

export interface BaseModuleConfig {
  enabled: boolean;
}

export interface TradingCardConfig extends BaseModuleConfig {
  style: 'hologram' | 'pixel' | 'minimal' | 'anime';
  show_ability: boolean;
  show_skills: boolean;
  max_skills: number;
  custom_title: string;
}

export interface CodeDNAConfig extends BaseModuleConfig {
  shape: 'circular' | 'helix' | 'spiral' | 'fingerprint';
  color_scheme: 'language' | 'mood' | 'rainbow' | 'monochrome';
  complexity: 'simple' | 'detailed';
}

export interface ChronicleConfig extends BaseModuleConfig {
  max_chapters: number;
  style: 'rpg' | 'book' | 'timeline' | 'comic';
  language: 'ko' | 'en';
}

export interface CodePetConfig extends BaseModuleConfig {
  custom_name: string;
  show_mood: boolean;
  show_stats: boolean;
  animation: boolean;
}

export interface ConstellationConfig extends BaseModuleConfig {
  sky_theme: 'midnight' | 'aurora' | 'sunset' | 'deep_space';
  show_meteors: boolean;
  show_nebula: boolean;
  max_constellations: number;
}

export interface DevCityConfig extends BaseModuleConfig {
  city_style: 'pixel' | 'isometric' | 'flat' | 'neon';
  show_weather: boolean;
  show_traffic: boolean;
  animation: boolean;
}

export interface ReadmeConfig {
  auto_update: boolean;
  layout: 'grid' | 'vertical' | 'tabs';
  header: {
    type: 'wave' | 'typing' | 'gradient' | 'none';
    text: string;
    color: string;
  };
  footer: {
    enabled: boolean;
    style: 'wave' | 'minimal' | 'stats' | 'none';
    text: string;
  };
  module_order: string[];
  show_last_updated: boolean;
}

export interface GistConfig {
  enabled: boolean;
  gist_id: string;
  modules: string[];
}

export interface CustomThemeColors {
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  border: string;
}

// ── 테마 ──────────────────────────

export interface ThemeColors {
  name: ThemeName;
  background: string;
  backgroundSecondary: string;
  text: string;
  textSecondary: string;
  accent: string;
  accentSecondary: string;
  border: string;
  success: string;
  warning: string;
  error: string;
  cardGradientStart: string;
  cardGradientEnd: string;
}

// ── 영구 상태 ──────────────────────────

export interface GitProState {
  lastUpdated: string | null;
  pet: PetState;
  city: CityState;
  chronicle: ChronicleState;
  card: CardState;
}

export interface PetState {
  species: string | null;
  stage: number;
  exp: number;
  mood: number;
  hunger: number;
  lastFed: string | null;
  birthDate: string | null;
  abilities: string[];
}

export interface CityState {
  tier: number;
  population: number;
  buildings: number;
  lastWeather: string;
}

export interface ChronicleState {
  currentChapter: number;
  unlockedTitles: string[];
  currentQuest: {
    type: string;
    progress: number;
  } | null;
}

export interface CardState {
  seasonNumber: number;
  cardNumber: number;
  highestRarity: string;
}

// ── 유틸리티 타입 ──────────────────────────

export type ModuleId = keyof ModulesConfig;

export interface ModuleRegistryEntry {
  id: ModuleId;
  factory: () => GitProModule;
}
