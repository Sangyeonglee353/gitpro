// ═══════════════════════════════════════════
// 🎴 DNA Renderer - Code DNA SVG 렌더링
// ═══════════════════════════════════════════
//
// 4가지 DNA 시각화 형태를 지원합니다:
//   - circular: 원형 DNA + 동심원 링 + 나선 오버레이
//   - helix: 이중 나선 DNA 가닥
//   - spiral: 피보나치 나선 패턴
//   - fingerprint: 지문 스타일 동심선

import { ThemeColors, CodeDNAConfig } from '../../types';
import { DNAProfile, getCodingStyleInfo, WeekdayRing, KeywordFrequency } from './dna-analyzer';
import { DNAColorPalette, getLanguageDNAColor } from './dna-colors';

const SVG_WIDTH = 520;
const SVG_HEIGHT = 520;
const CENTER_X = SVG_WIDTH / 2;
const CENTER_Y = 240;

export interface DNARenderData {
  username: string;
  profile: DNAProfile;
  palette: DNAColorPalette;
  config: CodeDNAConfig;
  theme: ThemeColors;
}

/**
 * Code DNA SVG를 렌더링합니다.
 */
export function renderDNA(data: DNARenderData): string {
  const shape = data.config.shape || 'circular';

  switch (shape) {
    case 'helix':
      return renderHelixDNA(data);
    case 'spiral':
      return renderSpiralDNA(data);
    case 'fingerprint':
      return renderFingerprintDNA(data);
    case 'circular':
    default:
      return renderCircularDNA(data);
  }
}

// ═══════════════════════════════════════════
// 🔵 CIRCULAR DNA - 원형 DNA (기본)
// ═══════════════════════════════════════════

function renderCircularDNA(data: DNARenderData): string {
  const { username, profile, palette, theme, config } = data;
  const isDetailed = config.complexity === 'detailed';
  const styleInfo = getCodingStyleInfo(profile.codingStyle);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <defs>
    <linearGradient id="dnaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgGradient[0]}"/>
      <stop offset="100%" stop-color="${palette.bgGradient[1]}"/>
    </linearGradient>
    <radialGradient id="dnaGlow" cx="50%" cy="46%" r="40%">
      <stop offset="0%" stop-color="${palette.glowColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${palette.glowColor}" stop-opacity="0"/>
    </radialGradient>
    <filter id="dnaShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    <filter id="dnaBlur">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${palette.strandColors.map((color, i) => `
    <radialGradient id="ringGrad${i}" cx="50%" cy="50%" r="50%">
      <stop offset="60%" stop-color="${color}" stop-opacity="0.6"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.1"/>
    </radialGradient>`).join('')}
  </defs>

  <style>
    .dna-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .dna-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .dna-username { font-size: 12px; font-weight: 600; }
    .dna-label { font-size: 10px; font-weight: 500; }
    .dna-value { font-size: 10px; font-weight: 700; }
    .dna-small { font-size: 9px; opacity: 0.7; }
    .dna-keyword { font-size: 9px; font-weight: 600; }

    @keyframes dna-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes dna-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes dna-wave {
      0%, 100% { transform: scaleY(1); }
      50% { transform: scaleY(1.2); }
    }
    .dna-ring-rotate { animation: dna-rotate 60s linear infinite; transform-origin: ${CENTER_X}px ${CENTER_Y}px; }
    .dna-ring-rotate-reverse { animation: dna-rotate 80s linear infinite reverse; transform-origin: ${CENTER_X}px ${CENTER_Y}px; }
    .dna-pulse { animation: dna-pulse 3s ease-in-out infinite; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dnaBg)"/>
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dnaGlow)"/>

  <!-- 제목 영역 -->
  <text x="${CENTER_X}" y="28" text-anchor="middle" class="dna-text dna-title" fill="${palette.glowColor}">
    🧬 CODE DNA</text>
  <text x="${CENTER_X}" y="46" text-anchor="middle" class="dna-text dna-username" fill="${theme.text}">
    ${username}</text>

  <!-- 동심원 링 (7개 요일) -->
  <g class="dna-ring-rotate">
    ${renderWeekdayRings(profile.weekdayActivity, palette, CENTER_X, CENTER_Y, isDetailed)}
  </g>

  <!-- 나선 파형 오버레이 -->
  <g class="dna-ring-rotate-reverse">
    ${renderWaveOverlay(profile.hourlyPattern, palette, CENTER_X, CENTER_Y, profile.uniqueSeed)}
  </g>

  <!-- 중앙 코어 -->
  ${renderCentralCore(profile, palette, theme, CENTER_X, CENTER_Y)}

  <!-- 언어 색상 레전드 (좌측 하단) -->
  ${renderLanguageLegend(profile, palette, theme, isDetailed)}

  <!-- 키워드 장식 -->
  ${isDetailed ? renderKeywordDecorations(profile.messageKeywords, palette, theme) : ''}

  <!-- 하단 정보 영역 -->
  ${renderBottomInfo(profile, styleInfo, palette, theme)}

  <!-- 외곽 장식 테두리 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${SVG_HEIGHT - 4}" rx="15"
        fill="none" stroke="${palette.glowColor}" stroke-width="1" opacity="0.3"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🌀 HELIX DNA - 이중 나선 DNA
// ═══════════════════════════════════════════

function renderHelixDNA(data: DNARenderData): string {
  const { username, profile, palette, theme, config } = data;
  const isDetailed = config.complexity === 'detailed';
  const styleInfo = getCodingStyleInfo(profile.codingStyle);

  const helixCenterX = CENTER_X;
  const helixStartY = 70;
  const helixEndY = 370;
  const helixAmplitude = 80;
  const steps = 40;

  // 이중 나선 경로 생성
  const strand1Points: Array<{ x: number; y: number }> = [];
  const strand2Points: Array<{ x: number; y: number }> = [];
  const bridgeLines: string[] = [];

  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const y = helixStartY + t * (helixEndY - helixStartY);

    // 파형 변조: hourlyPattern 적용
    const hourIdx = Math.floor(t * 23);
    const amplitudeModulation = 0.5 + profile.hourlyPattern[hourIdx] * 0.5;

    const angle = t * Math.PI * 6; // 3회전
    const x1 = helixCenterX + Math.sin(angle) * helixAmplitude * amplitudeModulation;
    const x2 = helixCenterX - Math.sin(angle) * helixAmplitude * amplitudeModulation;

    strand1Points.push({ x: x1, y });
    strand2Points.push({ x: x2, y });

    // 가교(bridge) - 매 4스텝마다
    if (i % 4 === 0 && i > 0 && i < steps) {
      const colorIdx = Math.floor((i / steps) * palette.strandColors.length) % palette.strandColors.length;
      bridgeLines.push(`<line x1="${x1}" y1="${y}" x2="${x2}" y2="${y}"
        stroke="${palette.strandColors[colorIdx]}" stroke-width="2" opacity="0.5"/>`);
    }
  }

  const path1 = pointsToSmoothPath(strand1Points);
  const path2 = pointsToSmoothPath(strand2Points);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <defs>
    <linearGradient id="dnaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgGradient[0]}"/>
      <stop offset="100%" stop-color="${palette.bgGradient[1]}"/>
    </linearGradient>
    <linearGradient id="strand1Grad" x1="0%" y1="0%" x2="0%" y2="100%">
      ${palette.strandColors.slice(0, 3).map((c, i) =>
        `<stop offset="${(i / 2) * 100}%" stop-color="${c}"/>`
      ).join('')}
    </linearGradient>
    <linearGradient id="strand2Grad" x1="0%" y1="0%" x2="0%" y2="100%">
      ${palette.strandColors.slice(Math.min(3, palette.strandColors.length - 1)).map((c, i, arr) =>
        `<stop offset="${(i / Math.max(arr.length - 1, 1)) * 100}%" stop-color="${c}"/>`
      ).join('')}
    </linearGradient>
    <filter id="helixGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="dnaShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <style>
    .dna-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .dna-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .dna-username { font-size: 12px; font-weight: 600; }
    .dna-label { font-size: 10px; font-weight: 500; }
    .dna-value { font-size: 10px; font-weight: 700; }
    .dna-small { font-size: 9px; opacity: 0.7; }
    .dna-keyword { font-size: 9px; font-weight: 600; }

    @keyframes helix-flow {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -60; }
    }
    .helix-strand { animation: helix-flow 4s linear infinite; stroke-dasharray: 12 4; }
    .helix-strand-reverse { animation: helix-flow 4s linear infinite reverse; stroke-dasharray: 12 4; }

    @keyframes bridge-pulse {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.8; }
    }
    .bridge-line { animation: bridge-pulse 2s ease-in-out infinite; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dnaBg)"/>

  <!-- 제목 영역 -->
  <text x="${CENTER_X}" y="28" text-anchor="middle" class="dna-text dna-title" fill="${palette.glowColor}">
    🧬 CODE DNA</text>
  <text x="${CENTER_X}" y="46" text-anchor="middle" class="dna-text dna-username" fill="${theme.text}">
    ${username}</text>

  <!-- 요일 활동 바 (좌측) -->
  ${renderWeekdayBars(profile.weekdayActivity, palette, theme, 20, helixStartY, 40, helixEndY - helixStartY)}

  <!-- 이중 나선 가교 -->
  <g class="bridge-line">
    ${bridgeLines.join('\n    ')}
  </g>

  <!-- 이중 나선 가닥 1 -->
  <path d="${path1}" fill="none" stroke="url(#strand1Grad)" stroke-width="4"
        stroke-linecap="round" class="helix-strand" filter="url(#helixGlow)"/>

  <!-- 이중 나선 가닥 2 -->
  <path d="${path2}" fill="none" stroke="url(#strand2Grad)" stroke-width="4"
        stroke-linecap="round" class="helix-strand-reverse" filter="url(#helixGlow)"/>

  <!-- 나선 위 데이터 포인트 -->
  ${renderHelixDataPoints(strand1Points, strand2Points, profile, palette)}

  <!-- 시간대 파형 (우측) -->
  ${renderHourlyWaveform(profile.hourlyPattern, palette, theme, SVG_WIDTH - 70, helixStartY, 40, helixEndY - helixStartY)}

  <!-- 언어 레전드 -->
  ${renderLanguageLegend(profile, palette, theme, isDetailed)}

  <!-- 키워드 장식 -->
  ${isDetailed ? renderKeywordDecorations(profile.messageKeywords, palette, theme) : ''}

  <!-- 하단 정보 -->
  ${renderBottomInfo(profile, styleInfo, palette, theme)}

  <!-- 외곽 테두리 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${SVG_HEIGHT - 4}" rx="15"
        fill="none" stroke="${palette.glowColor}" stroke-width="1" opacity="0.3"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🌀 SPIRAL DNA - 피보나치 나선 패턴
// ═══════════════════════════════════════════

function renderSpiralDNA(data: DNARenderData): string {
  const { username, profile, palette, theme, config } = data;
  const isDetailed = config.complexity === 'detailed';
  const styleInfo = getCodingStyleInfo(profile.codingStyle);

  // 나선 경로 생성
  const spiralPaths = generateSpiralPaths(profile, palette, CENTER_X, CENTER_Y);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <defs>
    <linearGradient id="dnaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgGradient[0]}"/>
      <stop offset="100%" stop-color="${palette.bgGradient[1]}"/>
    </linearGradient>
    <radialGradient id="spiralGlow" cx="50%" cy="46%" r="45%">
      <stop offset="0%" stop-color="${palette.glowColor}" stop-opacity="0.2"/>
      <stop offset="100%" stop-color="${palette.glowColor}" stop-opacity="0"/>
    </radialGradient>
    <filter id="spiralBlur">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="dnaShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <style>
    .dna-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .dna-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .dna-username { font-size: 12px; font-weight: 600; }
    .dna-label { font-size: 10px; font-weight: 500; }
    .dna-value { font-size: 10px; font-weight: 700; }
    .dna-small { font-size: 9px; opacity: 0.7; }
    .dna-keyword { font-size: 9px; font-weight: 600; }

    @keyframes spiral-rotate {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    @keyframes spiral-dash {
      0% { stroke-dashoffset: 0; }
      100% { stroke-dashoffset: -100; }
    }
    .spiral-path { animation: spiral-dash 8s linear infinite; stroke-dasharray: 20 6; }
    .spiral-rotate-slow { animation: spiral-rotate 120s linear infinite; transform-origin: ${CENTER_X}px ${CENTER_Y}px; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dnaBg)"/>
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#spiralGlow)"/>

  <!-- 제목 영역 -->
  <text x="${CENTER_X}" y="28" text-anchor="middle" class="dna-text dna-title" fill="${palette.glowColor}">
    🧬 CODE DNA</text>
  <text x="${CENTER_X}" y="46" text-anchor="middle" class="dna-text dna-username" fill="${theme.text}">
    ${username}</text>

  <!-- 나선 경로들 -->
  <g class="spiral-rotate-slow">
    ${spiralPaths}
  </g>

  <!-- 중앙 코어 -->
  ${renderCentralCore(profile, palette, theme, CENTER_X, CENTER_Y)}

  <!-- 데이터 포인트 (나선 위 언어 점) -->
  ${renderSpiralDataPoints(profile, palette, CENTER_X, CENTER_Y)}

  <!-- 언어 레전드 -->
  ${renderLanguageLegend(profile, palette, theme, isDetailed)}

  <!-- 키워드 장식 -->
  ${isDetailed ? renderKeywordDecorations(profile.messageKeywords, palette, theme) : ''}

  <!-- 하단 정보 -->
  ${renderBottomInfo(profile, styleInfo, palette, theme)}

  <!-- 외곽 테두리 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${SVG_HEIGHT - 4}" rx="15"
        fill="none" stroke="${palette.glowColor}" stroke-width="1" opacity="0.3"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 👆 FINGERPRINT DNA - 지문 스타일
// ═══════════════════════════════════════════

function renderFingerprintDNA(data: DNARenderData): string {
  const { username, profile, palette, theme, config } = data;
  const isDetailed = config.complexity === 'detailed';
  const styleInfo = getCodingStyleInfo(profile.codingStyle);

  // 지문 라인 생성
  const fingerprintLines = generateFingerprintLines(profile, palette, CENTER_X, CENTER_Y);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
  <defs>
    <linearGradient id="dnaBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${palette.bgGradient[0]}"/>
      <stop offset="100%" stop-color="${palette.bgGradient[1]}"/>
    </linearGradient>
    <radialGradient id="fpGlow" cx="50%" cy="46%" r="38%">
      <stop offset="0%" stop-color="${palette.glowColor}" stop-opacity="0.1"/>
      <stop offset="100%" stop-color="${palette.glowColor}" stop-opacity="0"/>
    </radialGradient>
    <filter id="fpBlur">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="dnaShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="6" flood-color="#000" flood-opacity="0.3"/>
    </filter>
  </defs>

  <style>
    .dna-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .dna-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .dna-username { font-size: 12px; font-weight: 600; }
    .dna-label { font-size: 10px; font-weight: 500; }
    .dna-value { font-size: 10px; font-weight: 700; }
    .dna-small { font-size: 9px; opacity: 0.7; }
    .dna-keyword { font-size: 9px; font-weight: 600; }

    @keyframes fp-draw {
      0% { stroke-dashoffset: 600; }
      100% { stroke-dashoffset: 0; }
    }
    @keyframes fp-pulse {
      0%, 100% { opacity: 0.5; }
      50% { opacity: 0.9; }
    }
    .fp-line { stroke-dasharray: 600; animation: fp-draw 3s ease-out forwards; }
    .fp-pulse { animation: fp-pulse 4s ease-in-out infinite; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dnaBg)"/>
  <rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#fpGlow)"/>

  <!-- 제목 영역 -->
  <text x="${CENTER_X}" y="28" text-anchor="middle" class="dna-text dna-title" fill="${palette.glowColor}">
    🧬 CODE DNA</text>
  <text x="${CENTER_X}" y="46" text-anchor="middle" class="dna-text dna-username" fill="${theme.text}">
    ${username}</text>

  <!-- 지문 라인들 -->
  <g class="fp-pulse">
    ${fingerprintLines}
  </g>

  <!-- 중앙 코어 (작게) -->
  <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="8" fill="${palette.glowColor}" opacity="0.8"/>
  <circle cx="${CENTER_X}" cy="${CENTER_Y}" r="4" fill="${theme.background}"/>

  <!-- 언어 레전드 -->
  ${renderLanguageLegend(profile, palette, theme, isDetailed)}

  <!-- 키워드 장식 -->
  ${isDetailed ? renderKeywordDecorations(profile.messageKeywords, palette, theme) : ''}

  <!-- 하단 정보 -->
  ${renderBottomInfo(profile, styleInfo, palette, theme)}

  <!-- 외곽 테두리 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${SVG_HEIGHT - 4}" rx="15"
        fill="none" stroke="${palette.glowColor}" stroke-width="1" opacity="0.3"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🧩 공통 렌더링 헬퍼
// ═══════════════════════════════════════════

/** 요일별 동심원 링 렌더링 (circular용) */
function renderWeekdayRings(
  weekdays: WeekdayRing[],
  palette: DNAColorPalette,
  cx: number,
  cy: number,
  isDetailed: boolean
): string {
  let svg = '';
  const baseRadius = 40;
  const maxAdditionalRadius = 120;

  weekdays.forEach((day, i) => {
    const radius = baseRadius + (i + 1) * (maxAdditionalRadius / 7);
    const thickness = 2 + day.activity * 8; // 활동량에 따라 두께 변화 (2~10)
    const color = palette.ringColors[i % palette.ringColors.length];
    const opacity = 0.3 + day.activity * 0.5;

    svg += `
    <circle cx="${cx}" cy="${cy}" r="${radius}" fill="none"
            stroke="${color}" stroke-width="${thickness}" opacity="${opacity}"
            stroke-dasharray="${4 + day.activity * 8} ${2 + (1 - day.activity) * 6}"/>`;

    // 요일 레이블 (상세 모드에서만)
    if (isDetailed) {
      const labelAngle = -Math.PI / 2 + (i / 7) * Math.PI * 2;
      const lx = cx + Math.cos(labelAngle) * (radius + 14);
      const ly = cy + Math.sin(labelAngle) * (radius + 14);
      svg += `
    <text x="${lx}" y="${ly}" text-anchor="middle" dominant-baseline="middle"
          class="dna-text dna-small" fill="${color}" font-size="8">${day.dayKo}</text>`;
    }
  });

  return svg;
}

/** 파형 오버레이 렌더링 (circular용) */
function renderWaveOverlay(
  hourlyPattern: number[],
  palette: DNAColorPalette,
  cx: number,
  cy: number,
  seed: number
): string {
  let svg = '';
  const baseRadius = 50;
  const maxRadius = 150;

  // 24시간 데이터를 원형 파형으로 변환
  const points: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 360; i += 3) {
    const hourIdx = Math.floor((i / 360) * 24);
    const amplitude = hourlyPattern[hourIdx] * 30;
    const noise = Math.sin(i * 0.1 + seed * 0.01) * 5;
    const r = baseRadius + (maxRadius - baseRadius) * 0.5 + amplitude + noise;

    const rad = (i * Math.PI) / 180;
    points.push({
      x: cx + Math.cos(rad) * r,
      y: cy + Math.sin(rad) * r,
    });
  }

  // 부드러운 폐곡선 경로
  const path = pointsToClosedSmoothPath(points);

  svg += `<path d="${path}" fill="none" stroke="${palette.waveColor}" stroke-width="1.5"
          opacity="0.6" filter="url(#dnaBlur)"/>`;

  // 두 번째 파형 (위상 차이)
  const points2: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < 360; i += 3) {
    const hourIdx = Math.floor(((i + 120) % 360 / 360) * 24);
    const amplitude = hourlyPattern[hourIdx] * 25;
    const noise = Math.cos(i * 0.08 + seed * 0.02) * 4;
    const r = baseRadius + (maxRadius - baseRadius) * 0.5 + amplitude + noise;

    const rad = (i * Math.PI) / 180;
    points2.push({
      x: cx + Math.cos(rad) * r,
      y: cy + Math.sin(rad) * r,
    });
  }

  const path2 = pointsToClosedSmoothPath(points2);
  svg += `<path d="${path2}" fill="none" stroke="${palette.decorColor}" stroke-width="1"
          opacity="0.4" stroke-dasharray="4 3"/>`;

  return svg;
}

/** 중앙 코어 렌더링 */
function renderCentralCore(
  profile: DNAProfile,
  palette: DNAColorPalette,
  theme: ThemeColors,
  cx: number,
  cy: number
): string {
  const densityRadius = 15 + profile.activityDensity * 20;

  return `
  <!-- 코어 글로우 -->
  <circle cx="${cx}" cy="${cy}" r="${densityRadius + 10}" fill="${palette.glowColor}" opacity="0.05" class="dna-pulse"/>
  <circle cx="${cx}" cy="${cy}" r="${densityRadius + 5}" fill="${palette.glowColor}" opacity="0.1"/>

  <!-- 코어 -->
  <circle cx="${cx}" cy="${cy}" r="${densityRadius}" fill="${theme.backgroundSecondary}"
          stroke="${palette.glowColor}" stroke-width="2" opacity="0.9"/>

  <!-- 코어 텍스트 -->
  <text x="${cx}" y="${cy - 4}" text-anchor="middle" dominant-baseline="middle"
        class="dna-text" font-size="16" font-weight="700" fill="${palette.glowColor}">
    ${profile.totalCommits}</text>
  <text x="${cx}" y="${cy + 12}" text-anchor="middle" dominant-baseline="middle"
        class="dna-text dna-small" fill="${theme.textSecondary}" font-size="8">commits</text>`;
}

/** 언어 색상 레전드 렌더링 */
function renderLanguageLegend(
  profile: DNAProfile,
  palette: DNAColorPalette,
  theme: ThemeColors,
  isDetailed: boolean
): string {
  const startX = 20;
  const startY = SVG_HEIGHT - 120;
  const maxLangs = isDetailed ? 6 : 4;

  let svg = `<text x="${startX}" y="${startY - 8}" class="dna-text dna-label"
        fill="${theme.textSecondary}" letter-spacing="1">LANGUAGES</text>`;

  profile.languageDistribution.slice(0, maxLangs).forEach((lang, i) => {
    const y = startY + i * 16;
    const color = getLanguageDNAColor(lang.name);

    svg += `
    <circle cx="${startX + 5}" cy="${y + 4}" r="3" fill="${color}"/>
    <text x="${startX + 14}" y="${y + 8}" class="dna-text" font-size="9" fill="${theme.text}">
      ${lang.name}</text>
    <text x="${startX + 100}" y="${y + 8}" class="dna-text dna-small" fill="${theme.textSecondary}" font-size="8">
      ${lang.percent.toFixed(1)}%</text>`;
  });

  return svg;
}

/** 커밋 키워드 장식 렌더링 */
function renderKeywordDecorations(
  keywords: KeywordFrequency[],
  palette: DNAColorPalette,
  theme: ThemeColors
): string {
  if (keywords.length === 0) return '';

  const startX = SVG_WIDTH - 130;
  const startY = SVG_HEIGHT - 120;

  let svg = `<text x="${startX}" y="${startY - 8}" class="dna-text dna-label"
        fill="${theme.textSecondary}" letter-spacing="1">PATTERNS</text>`;

  keywords.slice(0, 5).forEach((kw, i) => {
    const y = startY + i * 16;
    svg += `
    <text x="${startX}" y="${y + 8}" class="dna-text dna-keyword" fill="${palette.decorColor}">
      ${kw.icon} ${kw.keyword}</text>
    <text x="${startX + 80}" y="${y + 8}" class="dna-text dna-small" fill="${theme.textSecondary}" font-size="8">
      ×${kw.count}</text>`;
  });

  return svg;
}

/** 하단 정보 영역 렌더링 */
function renderBottomInfo(
  profile: DNAProfile,
  styleInfo: { labelKo: string; labelEn: string; icon: string },
  palette: DNAColorPalette,
  theme: ThemeColors
): string {
  const y = SVG_HEIGHT - 24;

  return `
  <!-- 코딩 스타일 -->
  <text x="20" y="${y}" class="dna-text" font-size="10" fill="${palette.glowColor}">
    ${styleInfo.icon} ${styleInfo.labelKo}</text>

  <!-- 다양성 지수 -->
  <text x="${CENTER_X}" y="${y}" text-anchor="middle" class="dna-text" font-size="9" fill="${theme.textSecondary}">
    다양성: ${(profile.repoDiversity * 100).toFixed(0)}% · 밀도: ${(profile.activityDensity * 100).toFixed(0)}%</text>

  <!-- 레포/언어 수 -->
  <text x="${SVG_WIDTH - 20}" y="${y}" text-anchor="end" class="dna-text" font-size="9" fill="${theme.textSecondary}">
    ${profile.totalRepos} repos · ${profile.languageCount} langs</text>`;
}

/** 요일별 수직 바 차트 (helix용) */
function renderWeekdayBars(
  weekdays: WeekdayRing[],
  palette: DNAColorPalette,
  theme: ThemeColors,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  let svg = `<text x="${x + width / 2}" y="${y - 6}" text-anchor="middle"
        class="dna-text dna-small" fill="${theme.textSecondary}" font-size="8">WEEKLY</text>`;

  const barWidth = 4;
  const gap = (width - barWidth * 7) / 6;

  weekdays.forEach((day, i) => {
    const bx = x + i * (barWidth + gap);
    const barH = Math.max(2, day.activity * (height - 20));
    const by = y + height - barH;
    const color = palette.ringColors[i % palette.ringColors.length];

    svg += `
    <rect x="${bx}" y="${by}" width="${barWidth}" height="${barH}" rx="2" fill="${color}" opacity="0.7"/>
    <text x="${bx + barWidth / 2}" y="${y + height + 10}" text-anchor="middle"
          class="dna-text" font-size="7" fill="${theme.textSecondary}">${day.dayKo}</text>`;
  });

  return svg;
}

/** 시간대 파형 차트 (helix 우측용) */
function renderHourlyWaveform(
  hourly: number[],
  palette: DNAColorPalette,
  theme: ThemeColors,
  x: number,
  y: number,
  width: number,
  height: number
): string {
  let svg = `<text x="${x + width / 2}" y="${y - 6}" text-anchor="middle"
        class="dna-text dna-small" fill="${theme.textSecondary}" font-size="8">24H</text>`;

  const barH = height / 24;

  hourly.forEach((val, i) => {
    const by = y + i * barH;
    const barW = Math.max(1, val * width);
    const color = palette.waveColor;

    svg += `
    <rect x="${x + width - barW}" y="${by}" width="${barW}" height="${barH - 1}" rx="1"
          fill="${color}" opacity="${0.3 + val * 0.6}"/>`;
  });

  // 시간 레이블 (6시간 단위)
  [0, 6, 12, 18].forEach(h => {
    const ly = y + (h / 24) * height;
    svg += `
    <text x="${x + width + 4}" y="${ly + barH / 2}" dominant-baseline="middle"
          class="dna-text" font-size="7" fill="${theme.textSecondary}">${h}h</text>`;
  });

  return svg;
}

/** Helix 데이터 포인트 렌더링 */
function renderHelixDataPoints(
  strand1: Array<{ x: number; y: number }>,
  strand2: Array<{ x: number; y: number }>,
  profile: DNAProfile,
  palette: DNAColorPalette
): string {
  let svg = '';
  const langs = profile.languageDistribution;

  // 주요 언어별 데이터 포인트
  langs.slice(0, 4).forEach((lang, i) => {
    const pointIdx = Math.floor((i / 4) * strand1.length * 0.8) + Math.floor(strand1.length * 0.1);
    if (pointIdx < strand1.length) {
      const p = i % 2 === 0 ? strand1[pointIdx] : strand2[pointIdx];
      const color = getLanguageDNAColor(lang.name);
      const r = 3 + lang.percent / 20;

      svg += `
    <circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${color}" opacity="0.8"/>`;
    }
  });

  return svg;
}

/** 나선 경로들 생성 (spiral용) */
function generateSpiralPaths(
  profile: DNAProfile,
  palette: DNAColorPalette,
  cx: number,
  cy: number
): string {
  let svg = '';
  const turns = 4 + profile.activityDensity * 2; // 활동 많을수록 회전 수 증가
  const maxRadius = 150;
  const numStrands = Math.min(palette.strandColors.length, 4);

  for (let s = 0; s < numStrands; s++) {
    const phaseOffset = (s / numStrands) * Math.PI * 2;
    const points: Array<{ x: number; y: number }> = [];

    for (let i = 0; i <= 200; i++) {
      const t = i / 200;
      const angle = t * turns * Math.PI * 2 + phaseOffset;
      const r = t * maxRadius;

      // 요일 활동 데이터로 변조
      const dayIdx = Math.floor((angle / (Math.PI * 2)) * 7) % 7;
      const modulation = 0.7 + profile.weekdayActivity[dayIdx].activity * 0.3;

      const x = cx + Math.cos(angle) * r * modulation;
      const y = cy + Math.sin(angle) * r * modulation;
      points.push({ x, y });
    }

    const path = pointsToSmoothPath(points);
    const color = palette.strandColors[s];

    svg += `
    <path d="${path}" fill="none" stroke="${color}" stroke-width="${2 - s * 0.3}"
          opacity="${0.7 - s * 0.1}" class="spiral-path" filter="url(#spiralBlur)"/>`;
  }

  return svg;
}

/** 나선 위 데이터 포인트 (spiral용) */
function renderSpiralDataPoints(
  profile: DNAProfile,
  palette: DNAColorPalette,
  cx: number,
  cy: number
): string {
  let svg = '';
  const langs = profile.languageDistribution.slice(0, 6);
  const maxRadius = 140;

  langs.forEach((lang, i) => {
    const angle = (i / langs.length) * Math.PI * 2 - Math.PI / 2;
    const r = maxRadius * 0.4 + (i / langs.length) * maxRadius * 0.5;
    const x = cx + Math.cos(angle) * r;
    const y = cy + Math.sin(angle) * r;
    const color = getLanguageDNAColor(lang.name);
    const dotR = 3 + lang.percent / 15;

    svg += `
    <circle cx="${x}" cy="${y}" r="${dotR}" fill="${color}" opacity="0.7" filter="url(#spiralBlur)"/>`;
  });

  return svg;
}

/** 지문 라인 생성 (fingerprint용) */
function generateFingerprintLines(
  profile: DNAProfile,
  palette: DNAColorPalette,
  cx: number,
  cy: number
): string {
  let svg = '';
  const lineCount = 15 + Math.floor(profile.activityDensity * 10);
  const maxRadius = 150;

  for (let i = 0; i < lineCount; i++) {
    const t = i / lineCount;
    const baseRadius = 20 + t * (maxRadius - 20);

    // 각 라인은 부분 원호 (지문 느낌)
    const points: Array<{ x: number; y: number }> = [];
    const startAngle = -Math.PI * 0.8 + (profile.uniqueSeed * i * 0.01) % 0.5;
    const endAngle = Math.PI * 0.8 - (profile.uniqueSeed * i * 0.02) % 0.5;
    const steps = 60;

    for (let s = 0; s <= steps; s++) {
      const angle = startAngle + (s / steps) * (endAngle - startAngle);

      // 요일 데이터로 반경 변조
      const dayIdx = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 7) % 7;
      const dayMod = 0.85 + profile.weekdayActivity[Math.abs(dayIdx)].activity * 0.15;

      // 시간대 데이터로 노이즈
      const hourIdx = Math.floor(((angle + Math.PI) / (Math.PI * 2)) * 24) % 24;
      const hourNoise = profile.hourlyPattern[hourIdx] * 5;

      const r = baseRadius * dayMod + hourNoise;

      // 비대칭 처리 (지문은 완벽한 원이 아님)
      const asymmetry = 1 + Math.sin(angle * 2 + i * 0.5) * 0.1;

      const x = cx + Math.cos(angle) * r * asymmetry;
      const y = cy + Math.sin(angle) * r * (0.9 + t * 0.1); // 세로로 약간 납작

      points.push({ x, y });
    }

    const path = pointsToSmoothPath(points);
    const colorIdx = i % palette.strandColors.length;
    const opacity = 0.3 + (1 - t) * 0.4;

    svg += `
    <path d="${path}" fill="none" stroke="${palette.strandColors[colorIdx]}"
          stroke-width="${1.5 - t * 0.5}" opacity="${opacity}" class="fp-line"
          style="animation-delay: ${(i * 0.1).toFixed(1)}s"/>`;
  }

  return svg;
}

// ═══════════════════════════════════════════
// 🛠️ SVG 경로 유틸리티
// ═══════════════════════════════════════════

/** 점 배열을 부드러운 SVG 경로로 변환합니다 (Catmull-Rom 보간) */
function pointsToSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 2) return '';
  if (points.length === 2) {
    return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;
  }

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[Math.min(points.length - 1, i + 1)];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  return d;
}

/** 점 배열을 폐곡선 SVG 경로로 변환합니다 */
function pointsToClosedSmoothPath(points: Array<{ x: number; y: number }>): string {
  if (points.length < 3) return '';

  // 폐곡선을 위해 처음/끝 포인트 복제
  const extended = [points[points.length - 1], ...points, points[0], points[1]];

  let d = `M ${points[0].x.toFixed(1)} ${points[0].y.toFixed(1)}`;

  for (let i = 1; i < extended.length - 2; i++) {
    const p0 = extended[i - 1];
    const p1 = extended[i];
    const p2 = extended[Math.min(extended.length - 1, i + 1)];
    const p3 = extended[Math.min(extended.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(1)},${cp1y.toFixed(1)} ${cp2x.toFixed(1)},${cp2y.toFixed(1)} ${p2.x.toFixed(1)},${p2.y.toFixed(1)}`;
  }

  d += ' Z';
  return d;
}
