// ═══════════════════════════════════════════
// 🧪 Theme Manager 테스트
// ═══════════════════════════════════════════

import {
  getTheme,
  getAvailableThemes,
  generateThemePreview,
  getLanguageColor,
} from '../../src/core/theme-manager';
import { ThemeName, CustomThemeColors } from '../../src/types';

describe('Theme Manager', () => {
  describe('getTheme', () => {
    it('dark 테마를 올바르게 반환한다', () => {
      const theme = getTheme('dark');
      expect(theme.name).toBe('dark');
      expect(theme.background).toBe('#0d1117');
      expect(theme.text).toBe('#e6edf3');
      expect(theme.accent).toBe('#58a6ff');
    });

    it('light 테마를 올바르게 반환한다', () => {
      const theme = getTheme('light');
      expect(theme.name).toBe('light');
      expect(theme.background).toBe('#ffffff');
    });

    it('모든 빌트인 테마를 로드할 수 있다', () => {
      const themeNames: ThemeName[] = [
        'dark', 'light', 'cyberpunk', 'retro', 'pastel',
        'ocean', 'forest', 'dracula', 'nord', 'sunset',
      ];

      for (const name of themeNames) {
        const theme = getTheme(name);
        expect(theme.name).toBe(name);
        expect(theme.background).toBeDefined();
        expect(theme.text).toBeDefined();
        expect(theme.accent).toBeDefined();
        expect(theme.border).toBeDefined();
        expect(theme.success).toBeDefined();
        expect(theme.warning).toBeDefined();
        expect(theme.error).toBeDefined();
        expect(theme.cardGradientStart).toBeDefined();
        expect(theme.cardGradientEnd).toBeDefined();
      }
    });

    it('custom 테마에 사용자 정의 색상을 사용한다', () => {
      const customColors: CustomThemeColors = {
        background: '#111111',
        backgroundSecondary: '#222222',
        text: '#ffffff',
        textSecondary: '#cccccc',
        accent: '#ff0000',
        accentSecondary: '#00ff00',
        border: '#333333',
      };

      const theme = getTheme('custom', customColors);
      expect(theme.name).toBe('custom');
      expect(theme.background).toBe('#111111');
      expect(theme.text).toBe('#ffffff');
      expect(theme.accent).toBe('#ff0000');
    });

    it('custom 테마인데 색상이 없으면 dark를 사용한다', () => {
      const theme = getTheme('custom');
      expect(theme.name).toBe('dark');
    });

    it('알 수 없는 테마는 dark로 폴백한다', () => {
      const theme = getTheme('nonexistent' as ThemeName);
      expect(theme.background).toBe('#0d1117');
    });
  });

  describe('getAvailableThemes', () => {
    it('모든 테마 이름을 반환한다', () => {
      const themes = getAvailableThemes();

      expect(themes).toContain('dark');
      expect(themes).toContain('light');
      expect(themes).toContain('cyberpunk');
      expect(themes).toContain('retro');
      expect(themes).toContain('pastel');
      expect(themes).toContain('ocean');
      expect(themes).toContain('forest');
      expect(themes).toContain('dracula');
      expect(themes).toContain('nord');
      expect(themes).toContain('sunset');
      expect(themes).toContain('custom');
    });

    it('최소 11개 테마가 있다', () => {
      expect(getAvailableThemes().length).toBeGreaterThanOrEqual(11);
    });
  });

  describe('generateThemePreview', () => {
    it('유효한 SVG를 생성한다', () => {
      const svg = generateThemePreview('dark');

      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    });

    it('테마 이름을 SVG에 포함한다', () => {
      const svg = generateThemePreview('cyberpunk');
      expect(svg).toContain('cyberpunk');
    });

    it('테마 색상을 SVG에 포함한다', () => {
      const svg = generateThemePreview('dracula');
      expect(svg).toContain('#282a36'); // dracula background
    });
  });

  describe('getLanguageColor', () => {
    it('TypeScript 색상을 반환한다', () => {
      expect(getLanguageColor('TypeScript')).toBe('#3178c6');
    });

    it('JavaScript 색상을 반환한다', () => {
      expect(getLanguageColor('JavaScript')).toBe('#f1e05a');
    });

    it('Python 색상을 반환한다', () => {
      expect(getLanguageColor('Python')).toBe('#3572A5');
    });

    it('알 수 없는 언어는 기본 색상을 반환한다', () => {
      expect(getLanguageColor('UnknownLang')).toBe('#8b949e');
    });

    it('Rust 색상을 반환한다', () => {
      expect(getLanguageColor('Rust')).toBe('#dea584');
    });

    it('Go 색상을 반환한다', () => {
      expect(getLanguageColor('Go')).toBe('#00ADD8');
    });
  });
});
