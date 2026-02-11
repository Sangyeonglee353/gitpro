// ═══════════════════════════════════════════
// 📄 Config Loader - gitpro.config.yml 파싱
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { GitProConfig } from '../types';

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
  gist: {
    enabled: false,
    gist_id: '',
    modules: [],
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
}

/**
 * 활성화된 모듈 ID 목록을 반환합니다.
 */
export function getEnabledModules(config: GitProConfig): string[] {
  return Object.entries(config.modules)
    .filter(([_, modConfig]) => (modConfig as { enabled: boolean }).enabled)
    .map(([id]) => id);
}

/**
 * 깊은 병합 유틸리티
 */
function deepMerge(target: Record<string, unknown>, source: Record<string, unknown>): Record<string, unknown> {
  const result: Record<string, unknown> = { ...target };

  for (const key of Object.keys(source)) {
    const targetVal = target[key];
    const sourceVal = source[key];

    if (
      sourceVal &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      targetVal &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal)
    ) {
      result[key] = deepMerge(
        targetVal as Record<string, unknown>,
        sourceVal as Record<string, unknown>
      );
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }

  return result;
}
