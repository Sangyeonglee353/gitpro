// ═══════════════════════════════════════════
// 🧪 Header Generator 테스트
// ═══════════════════════════════════════════

import { generateHeaderSVG } from '../../src/core/header-generator';
import { createMockTheme } from '../helpers/mock-data';

describe('Header Generator', () => {
  const theme = createMockTheme();
  const color = '#6C63FF';
  const text = 'Hello, World! 👋';

  describe('generateHeaderSVG', () => {
    it('none 타입은 null을 반환한다', () => {
      const result = generateHeaderSVG('none', text, color, theme);
      expect(result).toBeNull();
    });

    it('wave 헤더를 생성한다', () => {
      const svg = generateHeaderSVG('wave', text, color, theme);

      expect(svg).not.toBeNull();
      expect(svg).toContain('<svg');
      expect(svg).toContain('</svg>');
      expect(svg).toContain('Hello, World!');
      expect(svg).toContain('waveGrad');
      expect(svg).toContain('@keyframes waveMove1');
    });

    it('typing 헤더를 생성한다', () => {
      const svg = generateHeaderSVG('typing', text, color, theme);

      expect(svg).not.toBeNull();
      expect(svg).toContain('<svg');
      expect(svg).toContain('~/profile');
      expect(svg).toContain('@keyframes typing');
      expect(svg).toContain('@keyframes blink');
    });

    it('gradient 헤더를 생성한다', () => {
      const svg = generateHeaderSVG('gradient', text, color, theme);

      expect(svg).not.toBeNull();
      expect(svg).toContain('<svg');
      expect(svg).toContain('gradBg');
      expect(svg).toContain('@keyframes sparkle');
    });

    it('XML 특수문자를 이스케이프한다', () => {
      const dangerousText = 'Hello <World> & "Friends"';
      const svg = generateHeaderSVG('wave', dangerousText, color, theme);

      expect(svg).toContain('&lt;World&gt;');
      expect(svg).toContain('&amp;');
      expect(svg).toContain('&quot;Friends&quot;');
    });

    it('wave 헤더에 올바른 크기가 설정된다', () => {
      const svg = generateHeaderSVG('wave', text, color, theme);

      expect(svg).toContain('width="850"');
      expect(svg).toContain('height="230"');
    });

    it('typing 헤더에 터미널 스타일 장식이 있다', () => {
      const svg = generateHeaderSVG('typing', text, color, theme);

      // 터미널 창 버튼 (빨, 노, 초)
      expect(svg).toContain('#ff5f57');
      expect(svg).toContain('#febc2e');
      expect(svg).toContain('#28c840');
    });

    it('gradient 헤더에 반짝이 효과가 있다', () => {
      const svg = generateHeaderSVG('gradient', text, color, theme);

      expect(svg).toContain('sparkle');
      expect(svg).toContain('gradGlow');
    });
  });
});
