// ═══════════════════════════════════════════
// 🏙️ City Renderer - 아이소메트릭 도시 SVG 렌더링
// ═══════════════════════════════════════════
//
// Dev City를 진짜 아이소메트릭 3D 픽셀아트 도시 SVG로 렌더링합니다.
// - 3면(top/left/right) 폴리곤 기반 아이소메트릭 건물
// - 아이소메트릭 지면 다이아몬드 + 그리드 라인
// - 건물 타입별 고유 장식 (굴뚝, 안테나, 돔 등)
// - 아이소메트릭 창문 (면 기울기에 맞춤)
// - 정확한 z-order (뒤→앞 렌더링)
// - 4가지 도시 스타일: pixel, isometric, flat, neon

import { ThemeColors, DevCityConfig } from '../../types';
import {
  CityProfile,
  CityBuilding,
  CityTraffic,
  CityStats,
} from './city-analyzer';
import { CityTier, WeatherInfo, BuildingType } from './building-mapper';

// ═══════════════════════════════════════════
// 📐 상수
// ═══════════════════════════════════════════

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 50;
const CITY_Y = HEADER_HEIGHT;
const CITY_HEIGHT = SVG_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT; // 405

// 아이소메트릭 그리드
const GRID_ORIGIN_X = 400;
const GRID_ORIGIN_Y = 275;
const TILE_W = 110;
const TILE_H = 55;

// 건물 치수
const BUILDING_HW = 25;  // 반폭 (half-width)
const BUILDING_HD = 12.5; // 반깊이 (half-depth)

// ═══════════════════════════════════════════
// 🔧 유틸리티
// ═══════════════════════════════════════════

/** 소수점 1자리 반올림 */
function n(v: number): string {
  return v.toFixed(1);
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatPopulation(pop: number): string {
  if (pop >= 1_000_000) return `${(pop / 1_000_000).toFixed(1)}M`;
  if (pop >= 1_000) return `${(pop / 1_000).toFixed(1)}K`;
  return pop.toString();
}

function lightenHex(hex: string, amount: number): string {
  const rv = parseInt(hex.slice(1, 3), 16);
  const gv = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  const lr = Math.min(255, Math.round(rv + (255 - rv) * amount));
  const lg = Math.min(255, Math.round(gv + (255 - gv) * amount));
  const lb = Math.min(255, Math.round(bv + (255 - bv) * amount));
  return `#${lr.toString(16).padStart(2, '0')}${lg.toString(16).padStart(2, '0')}${lb.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, amount: number): string {
  const rv = parseInt(hex.slice(1, 3), 16);
  const gv = parseInt(hex.slice(3, 5), 16);
  const bv = parseInt(hex.slice(5, 7), 16);
  return `#${Math.round(rv * (1 - amount)).toString(16).padStart(2, '0')}${Math.round(gv * (1 - amount)).toString(16).padStart(2, '0')}${Math.round(bv * (1 - amount)).toString(16).padStart(2, '0')}`;
}

/** 아이소메트릭 그리드 → 스크린 좌표 변환 */
function gridToScreen(
  col: number, row: number,
  centerCol: number, centerRow: number,
): { x: number; y: number } {
  return {
    x: GRID_ORIGIN_X + (col - centerCol - (row - centerRow)) * TILE_W / 2,
    y: GRID_ORIGIN_Y + (col - centerCol + (row - centerRow)) * TILE_H / 2,
  };
}

// ═══════════════════════════════════════════
// 🎨 도시 스타일 색상 시스템
// ═══════════════════════════════════════════

export interface CityStyleColors {
  skyTop: string;
  skyBottom: string;
  groundMain: string;
  groundLight: string;
  groundDark: string;
  roadColor: string;
  roadLine: string;
  gridLine: string;
  textColor: string;
  textSecondary: string;
  border: string;
  buildingOutline: string;
  shadowColor: string;
  glowColor: string;
  windowColor: string;
  vehicleColor: string;
}

function getCityStyleColors(
  style: 'pixel' | 'isometric' | 'flat' | 'neon',
  _theme: ThemeColors
): CityStyleColors {
  switch (style) {
    case 'pixel':
      return {
        skyTop: '#0f0f23',
        skyBottom: '#1a1a3e',
        groundMain: '#3a7d44',
        groundLight: '#4a9a54',
        groundDark: '#2d6033',
        roadColor: '#555555',
        roadLine: '#dddd66',
        gridLine: 'rgba(255,255,255,0.08)',
        textColor: '#e6edf3',
        textSecondary: '#8b949e',
        border: '#30363d',
        buildingOutline: '#1a1a2e',
        shadowColor: 'rgba(0,0,0,0.35)',
        glowColor: '#ffdd57',
        windowColor: '#ffdd57',
        vehicleColor: '#ff6b6b',
      };
    case 'isometric':
      return {
        skyTop: '#0a1628',
        skyBottom: '#162040',
        groundMain: '#4a7c59',
        groundLight: '#5c9a6e',
        groundDark: '#3a6045',
        roadColor: '#666666',
        roadLine: '#e8d44d',
        gridLine: 'rgba(255,255,255,0.06)',
        textColor: '#f0f6fc',
        textSecondary: '#9eaab6',
        border: '#2a3a4e',
        buildingOutline: '#111122',
        shadowColor: 'rgba(0,0,0,0.3)',
        glowColor: '#ffd700',
        windowColor: '#ffd700',
        vehicleColor: '#4ecdc4',
      };
    case 'flat':
      return {
        skyTop: '#74b9ff',
        skyBottom: '#a29bfe',
        groundMain: '#55efc4',
        groundLight: '#6ef5d4',
        groundDark: '#00b894',
        roadColor: '#636e72',
        roadLine: '#ffeaa7',
        gridLine: 'rgba(0,0,0,0.06)',
        textColor: '#2d3436',
        textSecondary: '#636e72',
        border: '#b2bec3',
        buildingOutline: '#2d3436',
        shadowColor: 'rgba(0,0,0,0.15)',
        glowColor: '#fdcb6e',
        windowColor: '#ffeaa7',
        vehicleColor: '#e17055',
      };
    case 'neon':
      return {
        skyTop: '#05000a',
        skyBottom: '#0f001a',
        groundMain: '#0a0a1a',
        groundLight: '#111133',
        groundDark: '#050510',
        roadColor: '#111122',
        roadLine: '#00ffcc',
        gridLine: 'rgba(0,255,204,0.06)',
        textColor: '#00ffcc',
        textSecondary: '#ff00ff',
        border: '#330066',
        buildingOutline: '#00ffcc',
        shadowColor: 'rgba(0,255,204,0.08)',
        glowColor: '#ff00ff',
        windowColor: '#00ffcc',
        vehicleColor: '#00ffcc',
      };
  }
}

// ═══════════════════════════════════════════
// 📐 Defs (그라데이션, 필터)
// ═══════════════════════════════════════════

function buildDefs(colors: CityStyleColors, isNeon: boolean): string {
  return `<defs>
  <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${colors.skyTop}"/>
    <stop offset="100%" stop-color="${colors.skyBottom}"/>
  </linearGradient>
  <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${colors.groundLight}"/>
    <stop offset="100%" stop-color="${colors.groundDark}"/>
  </linearGradient>
  <filter id="bldShadow">
    <feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="black" flood-opacity="0.3"/>
  </filter>
  <filter id="glow">
    <feGaussianBlur stdDeviation="${isNeon ? '3' : '1.5'}" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  ${isNeon ? `<filter id="neonGlow">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>` : ''}
  <filter id="wBlur"><feGaussianBlur stdDeviation="0.5"/></filter>
  <pattern id="roadDash" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
    <rect width="10" height="2" y="1" fill="${colors.roadLine}" opacity="0.6"/>
  </pattern>
</defs>`;
}

// ═══════════════════════════════════════════
// 💫 Styles (애니메이션)
// ═══════════════════════════════════════════

function buildStyles(colors: CityStyleColors, animate: boolean): string {
  const anim = animate ? `
    @keyframes dc-blink { 0%,100%{opacity:0.2} 50%{opacity:0.9} }
    @keyframes dc-vehicle { 0%{transform:translateX(-60px)} 100%{transform:translateX(860px)} }
    @keyframes dc-vehicle-rev { 0%{transform:translateX(860px)} 100%{transform:translateX(-60px)} }
    @keyframes dc-rain { 0%{transform:translateY(-20px);opacity:0} 20%{opacity:1} 100%{transform:translateY(420px);opacity:0.3} }
    @keyframes dc-snow { 0%{transform:translate(0,-20px);opacity:0} 20%{opacity:0.9} 100%{transform:translate(20px,420px);opacity:0} }
    @keyframes dc-firework { 0%{r:0;opacity:1} 50%{opacity:0.8} 100%{r:15;opacity:0} }
    @keyframes dc-smoke { 0%{transform:translateY(0);opacity:0.6} 100%{transform:translateY(-30px);opacity:0} }
    @keyframes dc-fadeIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    @keyframes dc-rainbow { 0%{opacity:0} 30%{opacity:0.4} 70%{opacity:0.4} 100%{opacity:0} }
    @keyframes dc-pulse { 0%,100%{opacity:0.5} 50%{opacity:1} }
    .dc-win{animation:dc-blink 4s ease-in-out infinite}
    .dc-veh{animation:dc-vehicle 12s linear infinite}
    .dc-veh-r{animation:dc-vehicle-rev 15s linear infinite}
    .dc-rain{animation:dc-rain 1.5s linear infinite}
    .dc-snow{animation:dc-snow 4s ease-in-out infinite}
    .dc-fw{animation:dc-firework 2s ease-out infinite}
    .dc-smk{animation:dc-smoke 3s ease-out infinite}
    .dc-bld{animation:dc-fadeIn 0.6s ease-out forwards;opacity:0}
    .dc-rb{animation:dc-rainbow 8s ease-in-out infinite}
    .dc-pls{animation:dc-pulse 2s ease-in-out infinite}
  ` : `
    .dc-win{opacity:0.6} .dc-bld{opacity:1}
  `;

  return `<style>
  .dc-t{font-family:'Segoe UI','Noto Sans KR',sans-serif}
  .dc-title{font-size:13px;font-weight:700;letter-spacing:1.5px}
  .dc-sub{font-size:9px;font-weight:500}
  .dc-lbl{font-size:7.5px;font-weight:500}
  .dc-lbl-s{font-size:6px;font-weight:400}
  .dc-ft{font-size:9px;font-weight:500}
  .dc-fv{font-size:10px;font-weight:700}
  ${anim}
</style>`;
}

// ═══════════════════════════════════════════
// 🌿 아이소메트릭 지면 렌더링
// ═══════════════════════════════════════════

function renderIsometricGround(
  buildings: CityBuilding[],
  colors: CityStyleColors,
  isNeon: boolean,
): string {
  const gridCols = Math.min(4, buildings.length || 1);
  const gridRows = Math.max(1, Math.ceil(buildings.length / gridCols));
  const centerCol = (gridCols - 1) / 2;
  const centerRow = (gridRows - 1) / 2;

  // 지면 다이아몬드 (그리드 + 패딩)
  const pad = 1.2;
  const corners = [
    gridToScreen(-pad, -pad, centerCol, centerRow),           // back (top)
    gridToScreen(gridCols - 1 + pad, -pad, centerCol, centerRow),  // right
    gridToScreen(gridCols - 1 + pad, gridRows - 1 + pad, centerCol, centerRow), // front (bottom)
    gridToScreen(-pad, gridRows - 1 + pad, centerCol, centerRow),  // left
  ];

  const groundDiamond = `<polygon points="${corners.map(c => `${n(c.x)},${n(c.y)}`).join(' ')}"
    fill="url(#groundGrad)" stroke="${colors.groundDark}" stroke-width="0.5"/>`;

  // 그리드 라인 (아이소메트릭 타일)
  let gridLines = '';
  for (let row = -0.5; row <= gridRows + 0.5; row += 1) {
    const s = gridToScreen(-pad, row, centerCol, centerRow);
    const e = gridToScreen(gridCols - 1 + pad, row, centerCol, centerRow);
    gridLines += `<line x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(e.x)}" y2="${n(e.y)}" stroke="${colors.gridLine}" stroke-width="0.5"/>`;
  }
  for (let col = -0.5; col <= gridCols + 0.5; col += 1) {
    const s = gridToScreen(col, -pad, centerCol, centerRow);
    const e = gridToScreen(col, gridRows - 1 + pad, centerCol, centerRow);
    gridLines += `<line x1="${n(s.x)}" y1="${n(s.y)}" x2="${n(e.x)}" y2="${n(e.y)}" stroke="${colors.gridLine}" stroke-width="0.5"/>`;
  }

  // 도로 (지면 하단 가로 스트라이프)
  const roadY = corners[2].y + 5;
  const road = buildings.length >= 3
    ? `<rect x="0" y="${n(roadY)}" width="${SVG_WIDTH}" height="14" fill="${colors.roadColor}"/>
       <rect x="0" y="${n(roadY + 5)}" width="${SVG_WIDTH}" height="2" fill="url(#roadDash)"/>`
    : '';

  return `<g>${groundDiamond}${gridLines}${road}</g>`;
}

// ═══════════════════════════════════════════
// 🧱 아이소메트릭 3D 박스 코어
// ═══════════════════════════════════════════

/**
 * 아이소메트릭 3면 박스를 그립니다.
 * cx, cy: 전면 꼭짓점 (바닥 중앙)
 * hw: 반폭, hd: 반깊이, bh: 높이
 */
function drawIsoBox(
  cx: number, cy: number,
  hw: number, hd: number, bh: number,
  topColor: string, rightColor: string, leftColor: string,
  outline: string,
): string {
  // Left face: (cx,cy) → (cx,cy-bh) → (cx-hw,cy-hd-bh) → (cx-hw,cy-hd)
  const leftFace = `<polygon points="${n(cx)},${n(cy)} ${n(cx)},${n(cy - bh)} ${n(cx - hw)},${n(cy - hd - bh)} ${n(cx - hw)},${n(cy - hd)}" fill="${leftColor}" stroke="${outline}" stroke-width="0.5"/>`;

  // Right face: (cx,cy) → (cx+hw,cy-hd) → (cx+hw,cy-hd-bh) → (cx,cy-bh)
  const rightFace = `<polygon points="${n(cx)},${n(cy)} ${n(cx + hw)},${n(cy - hd)} ${n(cx + hw)},${n(cy - hd - bh)} ${n(cx)},${n(cy - bh)}" fill="${rightColor}" stroke="${outline}" stroke-width="0.5"/>`;

  // Top face: (cx,cy-bh) → (cx+hw,cy-hd-bh) → (cx,cy-2*hd-bh) → (cx-hw,cy-hd-bh)
  const topFace = `<polygon points="${n(cx)},${n(cy - bh)} ${n(cx + hw)},${n(cy - hd - bh)} ${n(cx)},${n(cy - 2 * hd - bh)} ${n(cx - hw)},${n(cy - hd - bh)}" fill="${topColor}" stroke="${outline}" stroke-width="0.5"/>`;

  return `${leftFace}\n    ${rightFace}\n    ${topFace}`;
}

// ═══════════════════════════════════════════
// 🪟 아이소메트릭 창문
// ═══════════════════════════════════════════

function drawIsoWindows(
  cx: number, cy: number,
  hw: number, hd: number, bh: number,
  building: CityBuilding,
  colors: CityStyleColors,
  isNeon: boolean,
): string {
  if (bh < 50) return '';

  const winColor = isNeon ? colors.glowColor : colors.windowColor;
  const windowRows = Math.min(4, Math.floor(bh / 28));
  const windowCols = 2;
  let wins = '';

  // 창문 파라미터 (면 좌표계 u,v)
  const wu = 0.18; // 창문 폭 (면 기준)
  const wv = 0.06; // 창문 높이 (면 기준)

  for (let wr = 0; wr < windowRows; wr++) {
    for (let wc = 0; wc < windowCols; wc++) {
      const u = 0.18 + wc * 0.38;
      const v = 0.12 + wr * (0.72 / Math.max(1, windowRows));
      const baseOp = building.isDormant
        ? 0.05 + ((wr * 7 + wc * 3) % 10) / 80
        : 0.3 + ((wr * 3 + wc * 7) % 10) / 15;
      const animDel = (wr * 0.7 + wc * 1.3).toFixed(1);

      // Right face window
      const rx1 = cx + u * hw;
      const ry1 = cy - u * hd - v * bh;
      const rx2 = cx + (u + wu) * hw;
      const ry2 = cy - (u + wu) * hd - v * bh;
      const rx3 = cx + (u + wu) * hw;
      const ry3 = cy - (u + wu) * hd - (v + wv) * bh;
      const rx4 = cx + u * hw;
      const ry4 = cy - u * hd - (v + wv) * bh;

      wins += `<polygon points="${n(rx1)},${n(ry1)} ${n(rx2)},${n(ry2)} ${n(rx3)},${n(ry3)} ${n(rx4)},${n(ry4)}"
        fill="${winColor}" opacity="${baseOp.toFixed(2)}" class="dc-win" style="animation-delay:${animDel}s"/>`;

      // Left face window (mirrored)
      const lx1 = cx - u * hw;
      const ly1 = cy - u * hd - v * bh;
      const lx2 = cx - (u + wu) * hw;
      const ly2 = cy - (u + wu) * hd - v * bh;
      const lx3 = cx - (u + wu) * hw;
      const ly3 = cy - (u + wu) * hd - (v + wv) * bh;
      const lx4 = cx - u * hw;
      const ly4 = cy - u * hd - (v + wv) * bh;

      const leftOp = baseOp * 0.65; // left face는 더 어두움
      const lAnimDel = (parseFloat(animDel) + 0.5).toFixed(1);
      wins += `<polygon points="${n(lx1)},${n(ly1)} ${n(lx2)},${n(ly2)} ${n(lx3)},${n(ly3)} ${n(lx4)},${n(ly4)}"
        fill="${winColor}" opacity="${leftOp.toFixed(2)}" class="dc-win" style="animation-delay:${lAnimDel}s"/>`;
    }
  }

  return wins;
}

// ═══════════════════════════════════════════
// 🎨 건물 타입별 장식
// ═══════════════════════════════════════════

function drawBuildingDecor(
  type: BuildingType,
  cx: number, cy: number,
  hw: number, hd: number, bh: number,
  mainColor: string, accentColor: string,
  isNeon: boolean, colors: CityStyleColors,
): string {
  // 건물 상단 중심 (top face center)
  const topCy = cy - hd - bh;

  switch (type) {
    case 'factory': {
      // 🏗️ 굴뚝 (작은 아이소 박스 + 연기)
      const chX = cx - hw * 0.25;
      const chY = cy - bh - hd * 0.4;
      return drawIsoBox(chX, chY, 4, 2, 16, '#aaa', '#999', '#888', colors.buildingOutline) +
        `<circle cx="${n(chX)}" cy="${n(chY - 20)}" r="3" fill="#aaa" opacity="0.4" class="dc-smk"/>
         <circle cx="${n(chX)}" cy="${n(chY - 26)}" r="2" fill="#aaa" opacity="0.25" class="dc-smk" style="animation-delay:0.6s"/>`;
    }
    case 'lab':
      // 🔬 안테나 + 빨간 불
      return `<line x1="${n(cx)}" y1="${n(topCy - 18)}" x2="${n(cx)}" y2="${n(topCy + 2)}" stroke="${accentColor}" stroke-width="1.5"/>
        <circle cx="${n(cx)}" cy="${n(topCy - 20)}" r="2.5" fill="${isNeon ? colors.glowColor : '#ff4444'}" class="dc-pls"/>
        <circle cx="${n(cx)}" cy="${n(topCy - 20)}" r="5" fill="${isNeon ? colors.glowColor : '#ff4444'}" opacity="0.15"/>`;

    case 'cityhall': {
      // 🏛️ 깃발
      const flagX = cx;
      const flagY = topCy;
      return `<line x1="${n(flagX)}" y1="${n(flagY - 22)}" x2="${n(flagX)}" y2="${n(flagY + 2)}" stroke="${accentColor}" stroke-width="1"/>
        <polygon points="${n(flagX)},${n(flagY - 22)} ${n(flagX + 9)},${n(flagY - 18)} ${n(flagX)},${n(flagY - 14)}" fill="#ff4444"/>`;
    }
    case 'telecom':
      // 📱 안테나 타워
      return `<line x1="${n(cx + 8)}" y1="${n(topCy - 24)}" x2="${n(cx + 8)}" y2="${n(topCy + 2)}" stroke="${accentColor}" stroke-width="1.5"/>
        <line x1="${n(cx + 3)}" y1="${n(topCy - 18)}" x2="${n(cx + 13)}" y2="${n(topCy - 18)}" stroke="${accentColor}" stroke-width="0.8"/>
        <line x1="${n(cx + 5)}" y1="${n(topCy - 12)}" x2="${n(cx + 11)}" y2="${n(topCy - 12)}" stroke="${accentColor}" stroke-width="0.8"/>
        <circle cx="${n(cx + 8)}" cy="${n(topCy - 26)}" r="1.5" fill="${isNeon ? colors.glowColor : '#ff0000'}" class="dc-pls"/>`;

    case 'library': {
      // 📚 삼각 지붕 (아이소메트릭)
      const roofH = 14;
      const lf = cx - hw;
      const rf = cx + hw;
      const lfY = cy - hd - bh;
      const rfY = cy - hd - bh;
      const peakY = topCy - roofH;
      // 지붕 좌측면
      return `<polygon points="${n(cx)},${n(peakY)} ${n(lf)},${n(lfY)} ${n(cx)},${n(cy - bh)}" fill="${darkenHex(accentColor, 0.15)}" stroke="${colors.buildingOutline}" stroke-width="0.3"/>
        <polygon points="${n(cx)},${n(peakY)} ${n(cx)},${n(cy - bh)} ${n(rf)},${n(rfY)}" fill="${accentColor}" stroke="${colors.buildingOutline}" stroke-width="0.3"/>
        <polygon points="${n(cx)},${n(peakY)} ${n(rf)},${n(rfY)} ${n(cx)},${n(cy - 2 * hd - bh)} ${n(lf)},${n(lfY)}" fill="${lightenHex(accentColor, 0.2)}" stroke="${colors.buildingOutline}" stroke-width="0.3"/>`;
    }
    case 'arcade':
      // 🎮 네온 간판
      return `<rect x="${n(cx - 9)}" y="${n(topCy - 3)}" width="18" height="7" rx="1.5" fill="${accentColor}" opacity="0.85" filter="url(#glow)"/>
        <text x="${n(cx)}" y="${n(topCy + 2.5)}" text-anchor="middle" font-size="4" fill="white" opacity="0.9" class="dc-t">GAME</text>`;

    case 'mall':
      // 🏬 유리 돔
      return `<ellipse cx="${n(cx)}" cy="${n(topCy)}" rx="10" ry="5" fill="${lightenHex(mainColor, 0.5)}" opacity="0.3" stroke="${lightenHex(mainColor, 0.7)}" stroke-width="0.3"/>`;

    case 'warehouse':
      // 📦 지붕 위 화물 표시
      return drawIsoBox(cx + 6, cy - bh - hd * 0.3, 4, 2, 5, '#c4a050', '#b08a40', '#967030', colors.buildingOutline);

    case 'garage':
      // 🔧 셔터 도어 (우측면 하단)
      return `<polygon points="${n(cx)},${n(cy)} ${n(cx + hw * 0.7)},${n(cy - hd * 0.7)} ${n(cx + hw * 0.7)},${n(cy - hd * 0.7 - bh * 0.35)} ${n(cx)},${n(cy - bh * 0.35)}" fill="${darkenHex(accentColor, 0.3)}" opacity="0.6"/>
        <line x1="${n(cx)}" y1="${n(cy - bh * 0.12)}" x2="${n(cx + hw * 0.65)}" y2="${n(cy - hd * 0.65 - bh * 0.12)}" stroke="${mainColor}" stroke-width="0.5" opacity="0.4"/>
        <line x1="${n(cx)}" y1="${n(cy - bh * 0.22)}" x2="${n(cx + hw * 0.65)}" y2="${n(cy - hd * 0.65 - bh * 0.22)}" stroke="${mainColor}" stroke-width="0.5" opacity="0.4"/>`;

    case 'ruin':
      // 🏚️ 균열
      return `<line x1="${n(cx - hw * 0.3)}" y1="${n(cy - bh * 0.2)}" x2="${n(cx - hw * 0.05)}" y2="${n(cy - bh * 0.7)}" stroke="#555" stroke-width="1" opacity="0.5"/>
        <line x1="${n(cx + hw * 0.15)}" y1="${n(cy - bh * 0.5)}" x2="${n(cx + hw * 0.4)}" y2="${n(cy - bh * 0.15)}" stroke="#555" stroke-width="1" opacity="0.4"/>
        <circle cx="${n(cx + hw * 0.3)}" cy="${n(cy - bh * 0.6)}" r="2" fill="#888" opacity="0.15"/>`;

    default:
      return '';
  }
}

// ═══════════════════════════════════════════
// 🏢 건물 렌더링 (메인)
// ═══════════════════════════════════════════

function renderBuildings(
  buildings: CityBuilding[],
  colors: CityStyleColors,
  isNeon: boolean,
): string {
  if (buildings.length === 0) {
    return renderEmptyCity(colors);
  }

  const gridCols = Math.min(4, buildings.length);
  const gridRows = Math.ceil(buildings.length / gridCols);
  const centerCol = (gridCols - 1) / 2;
  const centerRow = (gridRows - 1) / 2;

  // z-order: (col + row) 오름차순 (뒤 → 앞)
  const sorted = [...buildings].sort((a, b) => {
    const depthA = a.gridCol + a.gridRow;
    const depthB = b.gridCol + b.gridRow;
    if (depthA !== depthB) return depthA - depthB;
    return (a.gridCol - a.gridRow) - (b.gridCol - b.gridRow);
  });

  let result = '';
  sorted.forEach((building, idx) => {
    const pos = gridToScreen(building.gridCol, building.gridRow, centerCol, centerRow);
    const delay = idx * 0.08;
    result += renderSingleIsoBuilding(building, pos.x, pos.y, delay, colors, isNeon);
  });

  return `<g>${result}</g>`;
}

function renderSingleIsoBuilding(
  building: CityBuilding,
  cx: number, cy: number,
  delay: number,
  colors: CityStyleColors,
  isNeon: boolean,
): string {
  const hw = BUILDING_HW;
  const hd = BUILDING_HD;
  const bh = building.height;

  // 색상 (비활성은 탈색)
  const mainColor = building.isDormant ? '#777777' : building.info.colorMain;
  const accentColor = building.isDormant ? '#666666' : building.info.colorAccent;
  const topColor = building.isDormant ? '#888888' : lightenHex(mainColor, 0.3);
  const rightColor = mainColor;
  const leftColor = building.isDormant ? '#666666' : darkenHex(mainColor, 0.2);
  const opacity = building.isDormant ? 0.7 : 1;

  // 그림자
  const shadow = `<ellipse cx="${n(cx + 2)}" cy="${n(cy + 3)}" rx="${n(hw + 5)}" ry="${n(hd + 3)}" fill="black" opacity="0.18"/>`;

  // 아이소 3D 박스
  const box = drawIsoBox(cx, cy, hw, hd, bh, topColor, rightColor, leftColor, colors.buildingOutline);

  // 창문
  const windows = drawIsoWindows(cx, cy, hw, hd, bh, building, colors, isNeon);

  // 건물 타입 장식
  const decor = drawBuildingDecor(building.buildingType, cx, cy, hw, hd, bh, mainColor, accentColor, isNeon, colors);

  // 네온 아웃라인
  const neonLine = isNeon ? drawNeonOutline(cx, cy, hw, hd, bh, colors) : '';

  // 아이콘 (건물 위)
  const iconY = cy - hd - bh - (building.buildingType === 'library' ? 22 : building.buildingType === 'factory' ? 28 : building.buildingType === 'cityhall' ? 28 : building.buildingType === 'telecom' ? 32 : 10);
  const icon = `<text x="${n(cx)}" y="${n(iconY)}" text-anchor="middle" font-size="14">${building.info.icon}</text>`;

  // 이름 레이블
  const labelY = cy + hd + 14;
  const maxLen = 12;
  const displayName = building.repoName.length > maxLen
    ? building.repoName.substring(0, maxLen) + '…'
    : building.repoName;
  const starBadge = building.stars > 0 ? ` ⭐${building.stars}` : '';
  const label = `<text x="${n(cx)}" y="${n(labelY)}" text-anchor="middle"
    class="dc-t dc-lbl" fill="${colors.textSecondary}" opacity="0.85">${escapeXml(displayName)}${starBadge}</text>`;

  return `
  <g class="dc-bld" style="animation-delay:${delay.toFixed(2)}s" opacity="${opacity}">
    ${shadow}
    ${box}
    ${windows}
    ${decor}
    ${neonLine}
    ${icon}
    ${label}
  </g>`;
}

function drawNeonOutline(
  cx: number, cy: number,
  hw: number, hd: number, bh: number,
  colors: CityStyleColors,
): string {
  // 건물 외곽을 따라 네온 라인
  const points = [
    `${n(cx)},${n(cy)}`,
    `${n(cx + hw)},${n(cy - hd)}`,
    `${n(cx + hw)},${n(cy - hd - bh)}`,
    `${n(cx)},${n(cy - 2 * hd - bh)}`,
    `${n(cx - hw)},${n(cy - hd - bh)}`,
    `${n(cx - hw)},${n(cy - hd)}`,
  ].join(' ');
  return `<polygon points="${points}" fill="none" stroke="${colors.buildingOutline}" stroke-width="1.5" opacity="0.7" class="dc-pls" filter="url(#neonGlow)"/>`;
}

function renderEmptyCity(colors: CityStyleColors): string {
  const midY = CITY_HEIGHT * 0.45;
  return `<g>
    <text x="${SVG_WIDTH / 2}" y="${midY - 20}" text-anchor="middle"
      class="dc-t dc-sub" fill="${colors.textSecondary}">
      🏕️ 아직 건물이 없습니다... 레포를 만들어보세요!</text>
    <polygon points="${SVG_WIDTH / 2 - 20},${midY + 10} ${SVG_WIDTH / 2},${midY - 20} ${SVG_WIDTH / 2 + 20},${midY + 10}"
      fill="#8B4513" opacity="0.7"/>
    <circle cx="${SVG_WIDTH / 2 + 35}" cy="${midY + 8}" r="4" fill="#ff6600" opacity="0.8"/>
    <circle cx="${SVG_WIDTH / 2 + 35}" cy="${midY + 3}" r="3" fill="#ff9900" opacity="0.6"/>
  </g>`;
}

// ═══════════════════════════════════════════
// 🚗 교통 렌더링
// ═══════════════════════════════════════════

function renderTraffic(
  traffic: CityTraffic,
  buildings: CityBuilding[],
  colors: CityStyleColors,
): string {
  if (traffic.vehicleCount === 0 || buildings.length < 3) return '';

  const gridCols = Math.min(4, buildings.length);
  const gridRows = Math.ceil(buildings.length / gridCols);
  const centerCol = (gridCols - 1) / 2;
  const centerRow = (gridRows - 1) / 2;
  const frontPos = gridToScreen(gridCols / 2, gridRows - 1 + 1.2, centerCol, centerRow);
  const roadY = frontPos.y + 7;

  const vColors = ['#ff6b6b', '#48dbfb', '#feca57', '#54a0ff', '#5f27cd', '#01a3a4'];
  let vehicles = '';

  for (let i = 0; i < traffic.vehicleCount; i++) {
    const color = vColors[i % vColors.length];
    const del = (i * 2.5 + ((i * 37) % 10) / 3).toFixed(1);
    const y = roadY + (i % 2 === 0 ? -3 : 3);
    const cls = i % 2 === 0 ? 'dc-veh' : 'dc-veh-r';

    vehicles += `<g class="${cls}" style="animation-delay:${del}s">
      <rect x="0" y="${n(y - 3)}" width="14" height="6" rx="2" fill="${color}"/>
      <rect x="2" y="${n(y - 5)}" width="5" height="3" rx="1" fill="${color}" opacity="0.8"/>
      <circle cx="3" cy="${n(y + 4)}" r="1.5" fill="#333"/>
      <circle cx="11" cy="${n(y + 4)}" r="1.5" fill="#333"/>
    </g>`;
  }

  return `<g>${vehicles}</g>`;
}

// ═══════════════════════════════════════════
// 🌦️ 날씨 효과
// ═══════════════════════════════════════════

function renderWeather(weather: WeatherInfo, colors: CityStyleColors): string {
  switch (weather.type) {
    case 'sunny': return renderSun();
    case 'cloudy_s': return renderClouds(2, 0.35);
    case 'cloudy': return renderClouds(4, 0.5);
    case 'rainy': return renderRain();
    case 'snowy': return renderSnow();
    case 'rainbow': return renderRainbow();
    case 'fireworks': return renderFireworks();
    case 'volcano': return renderVolcano();
    default: return '';
  }
}

function renderSun(): string {
  return `<g>
    <circle cx="700" cy="40" r="18" fill="#ffd700" opacity="0.9" filter="url(#glow)"/>
    <circle cx="700" cy="40" r="26" fill="#ffd700" opacity="0.12"/>
    <circle cx="700" cy="40" r="35" fill="#ffd700" opacity="0.05"/>
  </g>`;
}

function renderClouds(count: number, opacity: number): string {
  let clouds = '';
  for (let i = 0; i < count; i++) {
    const x = 100 + i * 175 + ((i * 67) % 40);
    const y = 20 + ((i * 29) % 20);
    const sc = 0.6 + ((i * 41) % 40) / 100;
    clouds += `<g transform="translate(${n(x)},${n(y)}) scale(${sc.toFixed(2)})" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="32" ry="10" fill="#ccc"/>
      <ellipse cx="-14" cy="3" rx="20" ry="8" fill="#bbb"/>
      <ellipse cx="16" cy="2" rx="22" ry="9" fill="#bbb"/>
    </g>`;
  }
  return `<g>${clouds}</g>`;
}

function renderRain(): string {
  let drops = renderClouds(3, 0.6);
  for (let i = 0; i < 25; i++) {
    const x = ((i * 167 + 43) % SVG_WIDTH);
    const del = ((i * 89 + 13) % 30) / 20;
    drops += `<line x1="${x}" y1="0" x2="${x - 2}" y2="8"
      stroke="#6699cc" stroke-width="1" opacity="0.4"
      class="dc-rain" style="animation-delay:${del.toFixed(2)}s"/>`;
  }
  return `<g>${drops}</g>`;
}

function renderSnow(): string {
  let flakes = renderClouds(3, 0.4);
  for (let i = 0; i < 20; i++) {
    const x = ((i * 173 + 37) % SVG_WIDTH);
    const del = ((i * 97 + 19) % 40) / 10;
    const sz = 1.5 + ((i * 53) % 3);
    flakes += `<circle cx="${x}" cy="0" r="${sz}" fill="white" opacity="0.7"
      class="dc-snow" style="animation-delay:${del.toFixed(1)}s"/>`;
  }
  return `<g>${flakes}</g>`;
}

function renderRainbow(): string {
  const cx = SVG_WIDTH / 2;
  const cy = CITY_HEIGHT * 0.55;
  const rbColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#4400ff', '#8800ff'];
  let arcs = '';
  rbColors.forEach((col, i) => {
    const r = 140 - i * 7;
    arcs += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}"
      fill="none" stroke="${col}" stroke-width="3.5" opacity="0.25"
      class="dc-rb" style="animation-delay:${(i * 0.3).toFixed(1)}s"/>`;
  });
  return `<g>${arcs}</g>`;
}

function renderFireworks(): string {
  let fw = '';
  const fwColors = ['#ff0000', '#00ff44', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];
  for (let i = 0; i < 6; i++) {
    const x = 100 + ((i * 137 + 41) % (SVG_WIDTH - 200));
    const y = 25 + ((i * 89 + 23) % 50);
    const col = fwColors[i];
    const del = (i * 1.2).toFixed(1);

    fw += `<circle cx="${x}" cy="${y}" r="2" fill="${col}" opacity="0.9" class="dc-fw" style="animation-delay:${del}s"/>`;
    for (let j = 0; j < 8; j++) {
      const a = (j / 8) * Math.PI * 2;
      const px = x + Math.cos(a) * 10;
      const py = y + Math.sin(a) * 10;
      fw += `<circle cx="${n(px)}" cy="${n(py)}" r="1.2" fill="${col}" opacity="0.5" class="dc-fw" style="animation-delay:${(parseFloat(del) + 0.3).toFixed(1)}s"/>`;
    }
  }
  return `<g>${fw}</g>`;
}

function renderVolcano(): string {
  let smoke = '';
  for (let i = 0; i < 6; i++) {
    const x = 320 + ((i * 47) % 160);
    const y = CITY_HEIGHT * 0.45 + ((i * 31) % 25);
    const sz = 4 + ((i * 19) % 5);
    const del = (i * 0.5).toFixed(1);
    smoke += `<circle cx="${x}" cy="${y}" r="${sz}" fill="#ff4444" opacity="0.25" class="dc-smk" style="animation-delay:${del}s"/>
      <circle cx="${x + 5}" cy="${y - 5}" r="${n(sz * 0.6)}" fill="#ff6600" opacity="0.15" class="dc-smk" style="animation-delay:${(parseFloat(del) + 0.3).toFixed(1)}s"/>`;
  }
  return `<g>${smoke}</g>`;
}

// ═══════════════════════════════════════════
// 🎄 장식 요소 (나무, 가로등 등)
// ═══════════════════════════════════════════

function renderDecorations(
  tier: CityTier,
  buildings: CityBuilding[],
  colors: CityStyleColors,
  isNeon: boolean,
): string {
  if (tier.tier === 0 || buildings.length === 0) return '';

  const gridCols = Math.min(4, buildings.length);
  const gridRows = Math.ceil(buildings.length / gridCols);
  const centerCol = (gridCols - 1) / 2;
  const centerRow = (gridRows - 1) / 2;

  let deco = '';

  // 나무 (Tier 1+)
  if (tier.tier >= 1) {
    const treePositions = [
      gridToScreen(-1, 0.5, centerCol, centerRow),
      gridToScreen(gridCols, 0.5, centerCol, centerRow),
      gridToScreen(-0.8, gridRows - 0.5, centerCol, centerRow),
      gridToScreen(gridCols + 0.2, gridRows - 0.5, centerCol, centerRow),
      gridToScreen(gridCols / 2, gridRows + 0.5, centerCol, centerRow),
    ];
    const treeCount = Math.min(treePositions.length, tier.tier + 1);
    for (let i = 0; i < treeCount; i++) {
      deco += renderTree(treePositions[i].x, treePositions[i].y, colors, isNeon);
    }
  }

  // 가로등 (Tier 2+)
  if (tier.tier >= 2) {
    const lampPositions = [
      gridToScreen(-0.3, gridRows - 0.2, centerCol, centerRow),
      gridToScreen(gridCols - 0.7, gridRows + 0.2, centerCol, centerRow),
    ];
    for (const pos of lampPositions) {
      deco += renderStreetLamp(pos.x, pos.y + 10, colors);
    }
  }

  // 분수 (Tier 3+)
  if (tier.tier >= 3) {
    const fPos = gridToScreen(gridCols + 0.8, gridRows * 0.4, centerCol, centerRow);
    deco += `<ellipse cx="${n(fPos.x)}" cy="${n(fPos.y)}" rx="10" ry="5" fill="#4FC3F7" opacity="0.35"/>
      <line x1="${n(fPos.x)}" y1="${n(fPos.y - 10)}" x2="${n(fPos.x)}" y2="${n(fPos.y)}" stroke="#4FC3F7" stroke-width="1.5" opacity="0.4"/>
      <circle cx="${n(fPos.x)}" cy="${n(fPos.y - 12)}" r="2" fill="#4FC3F7" opacity="0.25"/>`;
  }

  // 헬기 (Tier 4+)
  if (tier.tier >= 4) {
    deco += renderHelicopter(130, 25, colors);
  }

  // 비행선 (Tier 5)
  if (tier.tier >= 5) {
    deco += renderAirship(SVG_WIDTH * 0.7, 18, colors);
  }

  return `<g>${deco}</g>`;
}

function renderTree(x: number, y: number, colors: CityStyleColors, isNeon: boolean): string {
  if (isNeon) {
    return `<g>
      <line x1="${n(x)}" y1="${n(y)}" x2="${n(x)}" y2="${n(y - 12)}" stroke="${colors.glowColor}" stroke-width="1" opacity="0.3"/>
      <polygon points="${n(x - 6)},${n(y - 8)} ${n(x)},${n(y - 20)} ${n(x + 6)},${n(y - 8)}" fill="${colors.glowColor}" opacity="0.15"/>
    </g>`;
  }
  return `<g>
    <rect x="${n(x - 1.5)}" y="${n(y - 8)}" width="3" height="8" fill="#8B4513" opacity="0.7"/>
    <polygon points="${n(x - 7)},${n(y - 6)} ${n(x)},${n(y - 20)} ${n(x + 7)},${n(y - 6)}" fill="#2ecc71" opacity="0.7"/>
    <polygon points="${n(x - 5)},${n(y - 12)} ${n(x)},${n(y - 23)} ${n(x + 5)},${n(y - 12)}" fill="#27ae60" opacity="0.6"/>
  </g>`;
}

function renderStreetLamp(x: number, y: number, colors: CityStyleColors): string {
  return `<g>
    <rect x="${n(x - 0.7)}" y="${n(y - 16)}" width="1.5" height="16" fill="#666" rx="0.5"/>
    <circle cx="${n(x)}" cy="${n(y - 18)}" r="2.5" fill="${colors.glowColor}" opacity="0.6"/>
    <circle cx="${n(x)}" cy="${n(y - 18)}" r="6" fill="${colors.glowColor}" opacity="0.1"/>
  </g>`;
}

function renderHelicopter(x: number, y: number, _colors: CityStyleColors): string {
  return `<g opacity="0.5">
    <ellipse cx="${x}" cy="${y}" rx="9" ry="3.5" fill="#555"/>
    <line x1="${x - 11}" y1="${y - 2}" x2="${x + 11}" y2="${y - 2}" stroke="#777" stroke-width="0.8"/>
    <line x1="${x + 7}" y1="${y}" x2="${x + 15}" y2="${y + 2}" stroke="#555" stroke-width="0.8"/>
  </g>`;
}

function renderAirship(x: number, y: number, colors: CityStyleColors): string {
  return `<g opacity="0.45">
    <ellipse cx="${x}" cy="${y}" rx="28" ry="9" fill="#888"/>
    <rect x="${x - 9}" y="${y + 7}" width="18" height="5" rx="1.5" fill="#666"/>
    <text x="${x}" y="${y + 3}" text-anchor="middle" class="dc-t" font-size="4.5" fill="${colors.textColor}" opacity="0.5">GITPRO</text>
  </g>`;
}

// ═══════════════════════════════════════════
// 📊 헤더 & 푸터
// ═══════════════════════════════════════════

function renderHeader(
  username: string,
  tier: CityTier,
  weather: WeatherInfo,
  colors: CityStyleColors,
): string {
  return `<g>
    <text x="${SVG_WIDTH / 2}" y="22" text-anchor="middle"
      class="dc-t dc-title" fill="${colors.textColor}">
      ${tier.icon} ${escapeXml(username)}&apos;s Dev City</text>
    <text x="${SVG_WIDTH / 2}" y="36" text-anchor="middle"
      class="dc-t dc-sub" fill="${colors.textSecondary}">
      ${tier.name} (Tier ${tier.tier}) · ${weather.icon} ${weather.label}</text>
  </g>`;
}

function renderFooter(stats: CityStats, colors: CityStyleColors): string {
  const y = SVG_HEIGHT - FOOTER_HEIGHT;
  const items = [
    { icon: '🏢', label: 'Buildings', value: stats.totalBuildings.toString() },
    { icon: '👥', label: 'Population', value: formatPopulation(stats.population) },
    { icon: '💻', label: 'Commits', value: stats.totalCommits.toString() },
    { icon: '⭐', label: 'Stars', value: stats.totalStars.toString() },
    { icon: '🔥', label: 'Streak', value: `${stats.streakDays}d` },
    { icon: '📊', label: 'Top Lang', value: stats.topLanguage },
  ];
  const sp = SVG_WIDTH / items.length;

  const itemsStr = items.map((item, i) => {
    const x = sp / 2 + i * sp;
    return `<text x="${n(x)}" y="${y + 18}" text-anchor="middle" class="dc-t dc-ft" fill="${colors.textSecondary}">${item.icon} ${item.label}</text>
    <text x="${n(x)}" y="${y + 33}" text-anchor="middle" class="dc-t dc-fv" fill="${colors.textColor}">${escapeXml(item.value)}</text>`;
  }).join('\n    ');

  return `<g>
    <line x1="16" y1="${y + 2}" x2="${SVG_WIDTH - 16}" y2="${y + 2}" stroke="${colors.border}" stroke-width="0.5" opacity="0.5"/>
    ${itemsStr}
  </g>`;
}

// ═══════════════════════════════════════════
// 🎬 메인 렌더 함수
// ═══════════════════════════════════════════

export interface CityRenderData {
  username: string;
  profile: CityProfile;
  config: DevCityConfig;
  theme: ThemeColors;
}

export function renderCity(data: CityRenderData): string {
  const { username, profile, config, theme } = data;
  const style = config.city_style || 'pixel';
  const isNeon = style === 'neon';
  const colors = getCityStyleColors(style, theme);

  const defs = buildDefs(colors, isNeon);
  const styles = buildStyles(colors, config.animation !== false);

  // 도시 요소 (city 좌표계 내부)
  const cityElements = [
    renderIsometricGround(profile.buildings, colors, isNeon),
    renderBuildings(profile.buildings, colors, isNeon),
    renderDecorations(profile.tier, profile.buildings, colors, isNeon),
    config.show_traffic !== false ? renderTraffic(profile.traffic, profile.buildings, colors) : '',
    config.show_weather !== false ? renderWeather(profile.weather, colors) : '',
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
${defs}
${styles}

<!-- 배경 -->
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#skyGrad)"/>

<!-- 헤더 -->
${renderHeader(username, profile.tier, profile.weather, colors)}

<!-- 도시 영역 -->
<g transform="translate(0,${CITY_Y})">
  ${cityElements}
</g>

<!-- 푸터 -->
${renderFooter(profile.stats, colors)}

<!-- 외곽 테두리 -->
<rect x="1" y="1" width="${SVG_WIDTH - 2}" height="${SVG_HEIGHT - 2}" rx="15"
  fill="none" stroke="${colors.border}" stroke-width="1" opacity="0.5"/>
</svg>`;
}
