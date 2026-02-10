// ═══════════════════════════════════════════
// 🧪 SVG Engine 테스트
// ═══════════════════════════════════════════

import { SVGEngine, SVGBuilder, createProgressBar, formatNumber } from '../../src/core/svg-engine';
import { createMockTheme } from '../helpers/mock-data';

describe('SVG Engine', () => {
  const theme = createMockTheme();

  describe('SVGEngine', () => {
    it('문서를 생성할 수 있다', () => {
      const engine = new SVGEngine(theme);
      const doc = engine.createDocument(400, 300);

      expect(doc).toBeInstanceOf(SVGBuilder);
    });

    it('테마를 반환할 수 있다', () => {
      const engine = new SVGEngine(theme);
      expect(engine.getTheme()).toEqual(theme);
    });
  });

  describe('SVGBuilder', () => {
    let builder: SVGBuilder;

    beforeEach(() => {
      builder = new SVGBuilder(400, 300, theme);
    });

    it('기본 SVG 문서를 빌드한다', () => {
      const svg = builder.build();

      expect(svg).toContain('<svg xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('width="400"');
      expect(svg).toContain('height="300"');
      expect(svg).toContain('viewBox="0 0 400 300"');
      expect(svg).toContain('</svg>');
    });

    it('사각형을 추가한다', () => {
      const svg = builder
        .addRect(10, 20, 100, 50, { fill: '#ff0000', rx: 5 })
        .build();

      expect(svg).toContain('<rect');
      expect(svg).toContain('x="10"');
      expect(svg).toContain('y="20"');
      expect(svg).toContain('width="100"');
      expect(svg).toContain('height="50"');
      expect(svg).toContain('fill="#ff0000"');
      expect(svg).toContain('rx="5"');
    });

    it('원을 추가한다', () => {
      const svg = builder
        .addCircle(50, 50, 25, { fill: '#00ff00', opacity: 0.8 })
        .build();

      expect(svg).toContain('<circle');
      expect(svg).toContain('cx="50"');
      expect(svg).toContain('cy="50"');
      expect(svg).toContain('r="25"');
      expect(svg).toContain('fill="#00ff00"');
      expect(svg).toContain('opacity="0.8"');
    });

    it('텍스트를 추가한다', () => {
      const svg = builder
        .addText(100, 50, 'Hello World', {
          fontSize: 16,
          fontWeight: 'bold',
          fill: '#ffffff',
          textAnchor: 'middle',
        })
        .build();

      expect(svg).toContain('<text');
      expect(svg).toContain('Hello World');
      expect(svg).toContain('font-size="16"');
      expect(svg).toContain('font-weight="bold"');
      expect(svg).toContain('text-anchor="middle"');
    });

    it('텍스트에서 XML 특수문자를 이스케이프한다', () => {
      const svg = builder
        .addText(10, 10, '<script>alert("xss")</script>')
        .build();

      expect(svg).not.toContain('<script>');
      expect(svg).toContain('&lt;script&gt;');
      expect(svg).toContain('&quot;xss&quot;');
    });

    it('경로를 추가한다', () => {
      const svg = builder
        .addPath('M 10 10 L 90 90', { stroke: '#ff0000', strokeWidth: 2 })
        .build();

      expect(svg).toContain('<path');
      expect(svg).toContain('d="M 10 10 L 90 90"');
      expect(svg).toContain('stroke="#ff0000"');
      expect(svg).toContain('stroke-width="2"');
    });

    it('라인을 추가한다', () => {
      const svg = builder
        .addLine(0, 0, 100, 100, {
          stroke: '#0000ff',
          strokeWidth: 1,
          strokeDasharray: '5,5',
        })
        .build();

      expect(svg).toContain('<line');
      expect(svg).toContain('x1="0"');
      expect(svg).toContain('y2="100"');
      expect(svg).toContain('stroke-dasharray="5,5"');
    });

    it('그룹을 추가한다', () => {
      const svg = builder
        .addGroup('<circle cx="10" cy="10" r="5"/>', {
          transform: 'translate(50, 50)',
          className: 'my-group',
        })
        .build();

      expect(svg).toContain('<g');
      expect(svg).toContain('transform="translate(50, 50)"');
      expect(svg).toContain('class="my-group"');
      expect(svg).toContain('<circle cx="10" cy="10" r="5"/>');
    });

    it('Raw SVG를 추가한다', () => {
      const raw = '<polygon points="100,10 40,198 190,78 10,78 160,198"/>';
      const svg = builder.addRaw(raw).build();

      expect(svg).toContain(raw);
    });

    it('선형 그라데이션을 추가한다', () => {
      const svg = builder
        .addLinearGradient('grad1', '0%', '0%', '100%', '100%', [
          { offset: '0%', color: '#ff0000' },
          { offset: '100%', color: '#0000ff', opacity: 0.5 },
        ])
        .build();

      expect(svg).toContain('<defs>');
      expect(svg).toContain('<linearGradient id="grad1"');
      expect(svg).toContain('stop-color="#ff0000"');
      expect(svg).toContain('stop-opacity="0.5"');
    });

    it('방사형 그라데이션을 추가한다', () => {
      const svg = builder
        .addRadialGradient('rgrad1', '50%', '50%', '50%', [
          { offset: '0%', color: '#ffffff' },
          { offset: '100%', color: '#000000' },
        ])
        .build();

      expect(svg).toContain('<radialGradient id="rgrad1"');
    });

    it('필터를 추가한다', () => {
      const svg = builder
        .addFilter('shadow', '<feDropShadow dx="2" dy="2" stdDeviation="3"/>')
        .build();

      expect(svg).toContain('<filter id="shadow">');
    });

    it('CSS 스타일을 추가한다', () => {
      const svg = builder
        .addStyle('.my-class { fill: red; }')
        .build();

      expect(svg).toContain('<style>');
      expect(svg).toContain('.my-class { fill: red; }');
    });

    it('키프레임 애니메이션을 추가한다', () => {
      const svg = builder
        .addKeyframeAnimation('fadeIn', '0% { opacity: 0; } 100% { opacity: 1; }')
        .build();

      expect(svg).toContain('@keyframes fadeIn');
      expect(svg).toContain('0% { opacity: 0; }');
    });

    it('체이닝이 올바르게 동작한다', () => {
      const svg = builder
        .addRect(0, 0, 400, 300, { fill: theme.background })
        .addCircle(200, 150, 50, { fill: theme.accent })
        .addText(200, 150, 'Test', { textAnchor: 'middle' })
        .addStyle('.glow { filter: blur(5px); }')
        .build();

      expect(svg).toContain('<rect');
      expect(svg).toContain('<circle');
      expect(svg).toContain('<text');
      expect(svg).toContain('<style>');
    });
  });

  describe('createProgressBar', () => {
    it('0%는 모두 빈 블록이다', () => {
      const bar = createProgressBar(0, 10);
      expect(bar).toBe('░░░░░░░░░░');
    });

    it('100%는 모두 채워진 블록이다', () => {
      const bar = createProgressBar(100, 10);
      expect(bar).toBe('██████████');
    });

    it('50%는 절반이 채워진다', () => {
      const bar = createProgressBar(50, 10);
      expect(bar).toBe('█████░░░░░');
    });

    it('기본 길이는 20이다', () => {
      const bar = createProgressBar(100);
      expect(bar.length).toBe(20);
    });

    it('커스텀 길이를 지정할 수 있다', () => {
      const bar = createProgressBar(100, 15);
      expect(bar.length).toBe(15);
    });
  });

  describe('formatNumber', () => {
    it('1000 미만은 그대로 표시한다', () => {
      expect(formatNumber(0)).toBe('0');
      expect(formatNumber(999)).toBe('999');
      expect(formatNumber(42)).toBe('42');
    });

    it('1000 이상은 k로 표시한다', () => {
      expect(formatNumber(1000)).toBe('1.0k');
      expect(formatNumber(1500)).toBe('1.5k');
      expect(formatNumber(15000)).toBe('15.0k');
      expect(formatNumber(999999)).toBe('1000.0k');
    });

    it('1000000 이상은 M으로 표시한다', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
    });
  });
});
