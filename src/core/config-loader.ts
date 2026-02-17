// ═══════════════════════════════════════════
// 📄 Config Loader - gitpro.config.yml 파싱
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GitProConfig } from '../types';
import { deepMerge } from './utils';

const DEFAULT_CONFIG: GitProConfig = {
  username: '',
  timezone: 'UTC',
  locale: 'en',
  theme: 'dark',
  include_private: false,
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
      enabled: false,
      shape: 'circular',
      color_scheme: 'language',
      complexity: 'detailed',
    },
    chronicle: {
      enabled: false,
      max_chapters: 8,
      style: 'rpg',
      language: 'ko',
    },
    'code-pet': {
      enabled: false,
      custom_name: '',
      show_mood: true,
      show_stats: true,
      animation: true,
    },
    constellation: {
      enabled: false,
      sky_theme: 'midnight',
      show_meteors: true,
      show_nebula: true,
      max_constellations: 10,
    },
    'dev-city': {
      enabled: false,
      city_style: 'pixel',
      show_weather: true,
      show_traffic: true,
      animation: true,
    },
  },
  readme: {
    auto_update: true,
    layout: 'vertical',
    header: {
      type: 'none',
      text: '',
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
};

/**
 * gitpro.config.yml 파일을 로드하고 파싱합니다.
 * 누락된 설정은 기본값으로 채워집니다.
 */
export function loadConfig(configPath?: string): GitProConfig {
  const resolvedPath = configPath || path.resolve(process.cwd(), 'gitpro.config.yml');

  if (!fs.existsSync(resolvedPath)) {
    console.warn(`⚠️  설정 파일을 찾을 수 없습니다: ${resolvedPath}`);
    console.warn('   기본 설정을 사용합니다.');
    return DEFAULT_CONFIG;
  }

  try {
    const fileContent = fs.readFileSync(resolvedPath, 'utf-8');
    const parsed = yaml.load(fileContent) as Record<string, unknown>;

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('설정 파일이 비어있거나 잘못된 형식입니다.');
    }

    // 깊은 병합: 사용자 설정 + 기본값
    const config = deepMerge(
      DEFAULT_CONFIG as unknown as Record<string, unknown>,
      parsed
    ) as unknown as GitProConfig;

    // 유효성 검증
    validateConfig(config);

    return config;
  } catch (error) {
    if (error instanceof yaml.YAMLException) {
      throw new Error(`❌ YAML 파싱 오류: ${error.message}`);
    }
    throw error;
  }
}

/**
 * 설정 유효성을 검증합니다.
 */
function validateConfig(config: GitProConfig): void {
  if (!config.username || config.username.trim() === '') {
    // 환경변수에서 가져오기 시도
    const envUsername = process.env.GITHUB_ACTOR || process.env.GITHUB_REPOSITORY_OWNER;
    if (envUsername) {
      config.username = envUsername;
    } else {
      throw new Error('❌ username이 설정되지 않았습니다. gitpro.config.yml에 username을 입력해주세요.');
    }
  }

  const validThemes = ['dark', 'light', 'cyberpunk', 'retro', 'pastel', 'ocean', 'forest', 'dracula', 'nord', 'sunset', 'custom'];
  if (!validThemes.includes(config.theme)) {
    console.warn(`⚠️  알 수 없는 테마 "${config.theme}", "dark"로 기본 설정됩니다.`);
    config.theme = 'dark';
  }

  const validLocales = ['ko', 'en', 'ja'];
  if (!validLocales.includes(config.locale)) {
    console.warn(`⚠️  알 수 없는 로케일 "${config.locale}", "en"으로 기본 설정됩니다.`);
    config.locale = 'en';
  }

  // 모듈별 설정값 검증
  validateModuleConfigs(config);
}

/**
 * 모듈별 설정값의 유효성을 검증합니다.
 */
function validateModuleConfigs(config: GitProConfig): void {
  const tc = config.modules['trading-card'];
  const validTCStyles = ['hologram', 'pixel', 'minimal', 'anime'];
  if (!validTCStyles.includes(tc.style)) {
    console.warn(`⚠️  trading-card.style "${tc.style}"이(가) 잘못되었습니다. "hologram"으로 기본 설정됩니다.`);
    tc.style = 'hologram';
  }

  const cd = config.modules['code-dna'];
  const validCDShapes = ['circular', 'helix', 'spiral', 'fingerprint'];
  if (!validCDShapes.includes(cd.shape)) {
    console.warn(`⚠️  code-dna.shape "${cd.shape}"이(가) 잘못되었습니다. "circular"로 기본 설정됩니다.`);
    cd.shape = 'circular';
  }
  const validCDColorSchemes = ['language', 'mood', 'rainbow', 'monochrome'];
  if (!validCDColorSchemes.includes(cd.color_scheme)) {
    console.warn(`⚠️  code-dna.color_scheme "${cd.color_scheme}"이(가) 잘못되었습니다. "language"로 기본 설정됩니다.`);
    cd.color_scheme = 'language';
  }
  const validCDComplexity = ['simple', 'detailed'];
  if (!validCDComplexity.includes(cd.complexity)) {
    console.warn(`⚠️  code-dna.complexity "${cd.complexity}"이(가) 잘못되었습니다. "detailed"로 기본 설정됩니다.`);
    cd.complexity = 'detailed';
  }

  const ch = config.modules.chronicle;
  const validChStyles = ['rpg', 'book', 'timeline', 'comic'];
  if (!validChStyles.includes(ch.style)) {
    console.warn(`⚠️  chronicle.style "${ch.style}"이(가) 잘못되었습니다. "rpg"로 기본 설정됩니다.`);
    ch.style = 'rpg';
  }
  const validChLanguages = ['ko', 'en'];
  if (!validChLanguages.includes(ch.language)) {
    console.warn(`⚠️  chronicle.language "${ch.language}"이(가) 잘못되었습니다. "ko"로 기본 설정됩니다.`);
    ch.language = 'ko';
  }

  const cn = config.modules.constellation;
  const validCNSkyThemes = ['midnight', 'aurora', 'sunset', 'deep_space'];
  if (!validCNSkyThemes.includes(cn.sky_theme)) {
    console.warn(`⚠️  constellation.sky_theme "${cn.sky_theme}"이(가) 잘못되었습니다. "midnight"로 기본 설정됩니다.`);
    cn.sky_theme = 'midnight';
  }

  const dc = config.modules['dev-city'];
  const validDCCityStyles = ['pixel', 'isometric', 'flat', 'neon'];
  if (!validDCCityStyles.includes(dc.city_style)) {
    console.warn(`⚠️  dev-city.city_style "${dc.city_style}"이(가) 잘못되었습니다. "pixel"로 기본 설정됩니다.`);
    dc.city_style = 'pixel';
  }
}

/**
 * 활성화된 모듈 ID 목록을 반환합니다.
 */
export function getEnabledModules(config: GitProConfig): string[] {
  return Object.entries(config.modules)
    .filter(([_, modConfig]) => (modConfig as { enabled: boolean }).enabled)
    .map(([id]) => id);
}

