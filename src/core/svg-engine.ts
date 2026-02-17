// ═══════════════════════════════════════════
// 🖼️ SVG Engine - SVG 생성 공통 엔진
// ═══════════════════════════════════════════

import { ThemeColors } from '../types';
import { escapeXml } from './utils';

/**
 * SVG 빌더 - 체이닝 방식으로 SVG를 구성합니다.
 */
export class SVGEngine {
  private theme: ThemeColors;

  constructor(theme: ThemeColors) {
    this.theme = theme;
  }

  /**
   * 새로운 SVG 문서를 생성합니다.
   */
  createDocument(width: number, height: number): SVGBuilder {
    return new SVGBuilder(width, height, this.theme);
  }

  getTheme(): ThemeColors {
    return this.theme;
  }
}

export class SVGBuilder {
  private width: number;
  private height: number;
  private theme: ThemeColors;
  private defs: string[] = [];
  private styles: string[] = [];
  private elements: string[] = [];

  constructor(width: number, height: number, theme: ThemeColors) {
    this.width = width;
    this.height = height;
    this.theme = theme;
  }

  // ── Defs (정의) ──────────────────────────

  /**
   * 선형 그라데이션을 추가합니다.
   */
  addLinearGradient(
    id: string,
    x1: string,
    y1: string,
    x2: string,
    y2: string,
    stops: Array<{ offset: string; color: string; opacity?: number }>
  ): SVGBuilder {
    const stopsStr = stops
      .map(
        s =>
          `<stop offset="${s.offset}" stop-color="${s.color}"${s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : ''}/>`
      )
      .join('\n        ');

    this.defs.push(`
      <linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">
        ${stopsStr}
      </linearGradient>
    `);
    return this;
  }

  /**
   * 방사형 그라데이션을 추가합니다.
   */
  addRadialGradient(
    id: string,
    cx: string,
    cy: string,
    r: string,
    stops: Array<{ offset: string; color: string; opacity?: number }>
  ): SVGBuilder {
    const stopsStr = stops
      .map(
        s =>
          `<stop offset="${s.offset}" stop-color="${s.color}"${s.opacity !== undefined ? ` stop-opacity="${s.opacity}"` : ''}/>`
      )
      .join('\n        ');

    this.defs.push(`
      <radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">
        ${stopsStr}
      </radialGradient>
    `);
    return this;
  }

  /**
   * 필터를 추가합니다 (그림자, 블러 등).
   */
  addFilter(id: string, filterContent: string): SVGBuilder {
    this.defs.push(`<filter id="${id}">${filterContent}</filter>`);
    return this;
  }

  /**
   * 클립 패스를 추가합니다.
   */
  addClipPath(id: string, pathData: string): SVGBuilder {
    this.defs.push(`<clipPath id="${id}"><path d="${pathData}"/></clipPath>`);
    return this;
  }

  // ── Styles ──────────────────────────

  /**
   * CSS 스타일을 추가합니다.
   */
  addStyle(css: string): SVGBuilder {
    this.styles.push(css);
    return this;
  }

  /**
   * 키프레임 애니메이션을 추가합니다.
   */
  addKeyframeAnimation(name: string, keyframes: string): SVGBuilder {
    this.styles.push(`@keyframes ${name} { ${keyframes} }`);
    return this;
  }

  // ── Elements ──────────────────────────

  /**
   * 사각형을 추가합니다.
   */
  addRect(
    x: number,
    y: number,
    width: number,
    height: number,
    options: {
      fill?: string;
      rx?: number;
      ry?: number;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      className?: string;
      filter?: string;
    } = {}
  ): SVGBuilder {
    const attrs = [
      `x="${x}"`,
      `y="${y}"`,
      `width="${width}"`,
      `height="${height}"`,
      options.fill ? `fill="${options.fill}"` : '',
      options.rx ? `rx="${options.rx}"` : '',
      options.ry ? `ry="${options.ry}"` : '',
      options.stroke ? `stroke="${options.stroke}"` : '',
      options.strokeWidth ? `stroke-width="${options.strokeWidth}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
      options.className ? `class="${options.className}"` : '',
      options.filter ? `filter="url(#${options.filter})"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<rect ${attrs}/>`);
    return this;
  }

  /**
   * 원을 추가합니다.
   */
  addCircle(
    cx: number,
    cy: number,
    r: number,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      className?: string;
    } = {}
  ): SVGBuilder {
    const attrs = [
      `cx="${cx}"`,
      `cy="${cy}"`,
      `r="${r}"`,
      options.fill ? `fill="${options.fill}"` : '',
      options.stroke ? `stroke="${options.stroke}"` : '',
      options.strokeWidth ? `stroke-width="${options.strokeWidth}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
      options.className ? `class="${options.className}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<circle ${attrs}/>`);
    return this;
  }

  /**
   * 텍스트를 추가합니다.
   */
  addText(
    x: number,
    y: number,
    text: string,
    options: {
      fontSize?: number;
      fontFamily?: string;
      fontWeight?: string;
      fill?: string;
      textAnchor?: 'start' | 'middle' | 'end';
      dominantBaseline?: string;
      opacity?: number;
      className?: string;
    } = {}
  ): SVGBuilder {
    const attrs = [
      `x="${x}"`,
      `y="${y}"`,
      options.fontSize ? `font-size="${options.fontSize}"` : '',
      options.fontFamily ? `font-family="${options.fontFamily}"` : 'font-family="\'Segoe UI\', Tahoma, Geneva, Verdana, sans-serif"',
      options.fontWeight ? `font-weight="${options.fontWeight}"` : '',
      options.fill ? `fill="${options.fill}"` : `fill="${this.theme.text}"`,
      options.textAnchor ? `text-anchor="${options.textAnchor}"` : '',
      options.dominantBaseline ? `dominant-baseline="${options.dominantBaseline}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
      options.className ? `class="${options.className}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<text ${attrs}>${escapeXml(text)}</text>`);
    return this;
  }

  /**
   * 경로를 추가합니다.
   */
  addPath(
    d: string,
    options: {
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
      strokeLinecap?: string;
      opacity?: number;
      className?: string;
    } = {}
  ): SVGBuilder {
    const attrs = [
      `d="${d}"`,
      options.fill ? `fill="${options.fill}"` : 'fill="none"',
      options.stroke ? `stroke="${options.stroke}"` : '',
      options.strokeWidth ? `stroke-width="${options.strokeWidth}"` : '',
      options.strokeLinecap ? `stroke-linecap="${options.strokeLinecap}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
      options.className ? `class="${options.className}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<path ${attrs}/>`);
    return this;
  }

  /**
   * 라인을 추가합니다.
   */
  addLine(
    x1: number,
    y1: number,
    x2: number,
    y2: number,
    options: {
      stroke?: string;
      strokeWidth?: number;
      opacity?: number;
      strokeDasharray?: string;
      className?: string;
    } = {}
  ): SVGBuilder {
    const attrs = [
      `x1="${x1}"`,
      `y1="${y1}"`,
      `x2="${x2}"`,
      `y2="${y2}"`,
      options.stroke ? `stroke="${options.stroke}"` : `stroke="${this.theme.border}"`,
      options.strokeWidth ? `stroke-width="${options.strokeWidth}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
      options.strokeDasharray ? `stroke-dasharray="${options.strokeDasharray}"` : '',
      options.className ? `class="${options.className}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<line ${attrs}/>`);
    return this;
  }

  /**
   * 그룹을 추가합니다.
   */
  addGroup(content: string, options: { transform?: string; className?: string; opacity?: number } = {}): SVGBuilder {
    const attrs = [
      options.transform ? `transform="${options.transform}"` : '',
      options.className ? `class="${options.className}"` : '',
      options.opacity !== undefined ? `opacity="${options.opacity}"` : '',
    ]
      .filter(Boolean)
      .join(' ');

    this.elements.push(`<g ${attrs}>${content}</g>`);
    return this;
  }

  /**
   * Raw SVG 문자열을 추가합니다.
   */
  addRaw(svgContent: string): SVGBuilder {
    this.elements.push(svgContent);
    return this;
  }

  // ── 빌드 ──────────────────────────

  /**
   * 최종 SVG 문자열을 빌드합니다.
   */
  build(): string {
    const defsBlock =
      this.defs.length > 0 ? `<defs>\n${this.defs.join('\n')}\n</defs>` : '';

    const styleBlock =
      this.styles.length > 0
        ? `<style>\n${this.styles.join('\n')}\n</style>`
        : '';

    return `<svg xmlns="http://www.w3.org/2000/svg" width="${this.width}" height="${this.height}" viewBox="0 0 ${this.width} ${this.height}">
${defsBlock}
${styleBlock}
${this.elements.join('\n')}
</svg>`;
  }
}

// ── 유틸리티 ──────────────────────────

/**
 * 프로그레스 바 문자열을 생성합니다.
 * @param percent 0~100
 * @param length 바의 전체 길이 (문자 수)
 */
export function createProgressBar(percent: number, length: number = 20): string {
  const filled = Math.round((percent / 100) * length);
  const empty = length - filled;
  return '█'.repeat(filled) + '░'.repeat(empty);
}

/**
 * 숫자를 K, M 포맷으로 변환합니다.
 */
export function formatNumber(num: number): string {
  if (num >= 1_000_000) return `${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `${(num / 1_000).toFixed(1)}k`;
  return num.toString();
}
