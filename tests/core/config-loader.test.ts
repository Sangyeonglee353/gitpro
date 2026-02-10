// ═══════════════════════════════════════════
// 🧪 Config Loader 테스트
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { loadConfig, getEnabledModules } from '../../src/core/config-loader';
import { createMockConfig } from '../helpers/mock-data';

// fs 모킹
jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('Config Loader', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // 환경변수 초기화
    delete process.env.GITHUB_ACTOR;
    delete process.env.GITHUB_REPOSITORY_OWNER;
  });

  describe('loadConfig', () => {
    it('설정 파일이 없으면 기본값을 반환한다', () => {
      mockFs.existsSync.mockReturnValue(false);
      const config = loadConfig('/nonexistent/path.yml');

      expect(config).toBeDefined();
      expect(config.theme).toBe('dark');
      expect(config.locale).toBe('en');
      expect(config.modules['trading-card'].enabled).toBe(true);
    });

    it('YAML 파일을 올바르게 파싱한다', () => {
      const yamlContent = yaml.dump({
        username: 'testuser',
        timezone: 'Asia/Seoul',
        locale: 'ko',
        theme: 'cyberpunk',
        modules: {
          'trading-card': { enabled: true, style: 'pixel' },
          'code-dna': { enabled: false },
        },
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/test/config.yml');

      expect(config.username).toBe('testuser');
      expect(config.timezone).toBe('Asia/Seoul');
      expect(config.locale).toBe('ko');
      expect(config.theme).toBe('cyberpunk');
      expect(config.modules['trading-card'].style).toBe('pixel');
    });

    it('누락된 설정은 기본값으로 채운다', () => {
      const yamlContent = yaml.dump({
        username: 'testuser',
        theme: 'dark',
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/test/config.yml');

      // 기본값 확인
      expect(config.readme).toBeDefined();
      expect(config.readme.auto_update).toBe(true);
      expect(config.gist).toBeDefined();
      expect(config.gist.enabled).toBe(false);
    });

    it('username이 없으면 환경변수에서 가져온다', () => {
      process.env.GITHUB_ACTOR = 'env-user';

      const yamlContent = yaml.dump({
        username: '',
        theme: 'dark',
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/test/config.yml');
      expect(config.username).toBe('env-user');
    });

    it('잘못된 YAML이면 오류를 발생시킨다', () => {
      const invalidYaml = '{ invalid yaml:: [}';

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(invalidYaml);

      expect(() => loadConfig('/test/config.yml')).toThrow();
    });

    it('잘못된 테마는 dark로 기본 설정한다', () => {
      const yamlContent = yaml.dump({
        username: 'testuser',
        theme: 'nonexistent-theme',
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/test/config.yml');
      expect(config.theme).toBe('dark');
    });

    it('잘못된 로케일은 en으로 기본 설정한다', () => {
      const yamlContent = yaml.dump({
        username: 'testuser',
        locale: 'invalid',
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(yamlContent);

      const config = loadConfig('/test/config.yml');
      expect(config.locale).toBe('en');
    });
  });

  describe('getEnabledModules', () => {
    it('활성화된 모듈 목록을 반환한다', () => {
      const config = createMockConfig();
      const enabled = getEnabledModules(config);

      expect(enabled).toContain('trading-card');
      expect(enabled).toContain('code-dna');
      expect(enabled).toContain('chronicle');
      expect(enabled).toContain('code-pet');
      expect(enabled).toContain('constellation');
      expect(enabled).toContain('dev-city');
      expect(enabled).toHaveLength(6);
    });

    it('비활성화된 모듈은 제외한다', () => {
      const config = createMockConfig();
      config.modules['code-dna'].enabled = false;
      config.modules.constellation.enabled = false;

      const enabled = getEnabledModules(config);

      expect(enabled).not.toContain('code-dna');
      expect(enabled).not.toContain('constellation');
      expect(enabled).toHaveLength(4);
    });

    it('모든 모듈이 비활성이면 빈 배열을 반환한다', () => {
      const config = createMockConfig();
      Object.values(config.modules).forEach((mod: any) => {
        mod.enabled = false;
      });

      const enabled = getEnabledModules(config);
      expect(enabled).toHaveLength(0);
    });
  });
});
