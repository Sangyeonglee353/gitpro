// ═══════════════════════════════════════════
// 🏙️ City Renderer - 아이소메트릭 도시 SVG 렌더링
// ═══════════════════════════════════════════
//
// Dev City를 아이소메트릭 픽셀아트 스타일의 도시 SVG로 렌더링합니다.
// 4가지 도시 스타일: pixel, isometric, flat, neon
// 건물, 도로, 날씨 효과, 교통, 장식 요소를 포함합니다.

import { ThemeColors, DevCityConfig } from '../../types';
import {
  CityProfile,
  CityBuilding,
  CityTraffic,
  CityStats,
} from './city-analyzer';
import { CityTier, WeatherInfo, BuildingType } from './building-mapper';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const HEADER_HEIGHT = 45;
const FOOTER_HEIGHT = 50;
const CITY_Y = HEADER_HEIGHT;
const CITY_HEIGHT = SVG_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

// 아이소메트릭 상수
const ISO_TILE_W = 80;
const ISO_TILE_H = 40;
const BUILDING_BASE_W = 60;

export interface CityRenderData {
  username: string;
  profile: CityProfile;
  config: DevCityConfig;
  theme: ThemeColors;
}

/**
 * Dev City SVG를 렌더링합니다.
 */
export function renderCity(data: CityRenderData): string {
  const { username, profile, config, theme } = data;
  const cityStyle = config.city_style || 'pixel';

  const colors = getCityStyleColors(cityStyle, theme);
  const defs = buildDefs(colors, profile.weather, cityStyle);
  const styles = buildStyles(colors, config.animation !== false);

  const cityElements = [
    renderGround(colors, profile.tier, cityStyle),
    renderRoads(profile.buildings, colors),
    renderBuildings(profile.buildings, colors, cityStyle),
    config.show_traffic !== false ? renderTrafficVehicles(profile.traffic, colors) : '',
    config.show_weather !== false ? renderWeatherEffects(profile.weather, colors) : '',
    renderDecorations(profile.tier, colors, cityStyle),
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
${defs}
${styles}

<!-- 외곽 배경 -->
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="${colors.skyTop}"/>

<!-- 하늘 그라데이션 -->
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#skyGrad)"/>

<!-- 헤더 -->
${renderHeader(username, profile.tier, profile.weather, colors)}

<!-- 도시 영역 -->
<g transform="translate(0, ${CITY_Y})">
  ${cityElements}
</g>

<!-- 푸터 -->
${renderFooter(profile.stats, profile.tier, colors)}

<!-- 외곽 테두리 -->
<rect x="1" y="1" width="${SVG_WIDTH - 2}" height="${SVG_HEIGHT - 2}" rx="15"
      fill="none" stroke="${colors.border}" stroke-width="1" opacity="0.5"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🎨 도시 스타일 색상 시스템
// ═══════════════════════════════════════════

export interface CityStyleColors {
  skyTop: string;
  skyBottom: string;
  groundMain: string;
  groundAccent: string;
  roadColor: string;
  roadLine: string;
  textColor: string;
  textSecondary: string;
  border: string;
  buildingOutline: string;
  shadowColor: string;
  glowColor: string;
  vehicleColor: string;
}

function getCityStyleColors(
  style: 'pixel' | 'isometric' | 'flat' | 'neon',
  theme: ThemeColors
): CityStyleColors {
  switch (style) {
    case 'pixel':
      return {
        skyTop: '#1a1a2e',
        skyBottom: '#16213e',
        groundMain: '#2d5016',
        groundAccent: '#3a6b1e',
        roadColor: '#444444',
        roadLine: '#cccc66',
        textColor: '#e6edf3',
        textSecondary: '#8b949e',
        border: '#30363d',
        buildingOutline: '#222222',
        shadowColor: 'rgba(0,0,0,0.3)',
        glowColor: '#ffdd57',
        vehicleColor: '#ff6b6b',
      };
    case 'isometric':
      return {
        skyTop: '#0f1b4c',
        skyBottom: '#1a2980',
        groundMain: '#4a7c59',
        groundAccent: '#5c946e',
        roadColor: '#555555',
        roadLine: '#e8d44d',
        textColor: '#f0f6fc',
        textSecondary: '#9eaab6',
        border: '#2a3a4e',
        buildingOutline: '#1a1a2e',
        shadowColor: 'rgba(0,0,0,0.25)',
        glowColor: '#ffd700',
        vehicleColor: '#4ecdc4',
      };
    case 'flat':
      return {
        skyTop: '#74b9ff',
        skyBottom: '#a29bfe',
        groundMain: '#55efc4',
        groundAccent: '#00b894',
        roadColor: '#636e72',
        roadLine: '#ffeaa7',
        textColor: '#2d3436',
        textSecondary: '#636e72',
        border: '#b2bec3',
        buildingOutline: '#2d3436',
        shadowColor: 'rgba(0,0,0,0.15)',
        glowColor: '#fdcb6e',
        vehicleColor: '#e17055',
      };
    case 'neon':
      return {
        skyTop: '#0a0014',
        skyBottom: '#1a0033',
        groundMain: '#111122',
        groundAccent: '#1a1a33',
        roadColor: '#222233',
        roadLine: '#00ffcc',
        textColor: '#00ffcc',
        textSecondary: '#ff00ff',
        border: '#330066',
        buildingOutline: '#00ffcc',
        shadowColor: 'rgba(0,255,204,0.1)',
        glowColor: '#ff00ff',
        vehicleColor: '#00ffcc',
      };
  }
}

// ═══════════════════════════════════════════
// 📐 Defs (그라데이션, 필터 등)
// ═══════════════════════════════════════════

function buildDefs(
  colors: CityStyleColors,
  weather: WeatherInfo,
  style: string
): string {
  const isNeon = style === 'neon';

  return `<defs>
    <!-- 하늘 그라데이션 -->
    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.skyTop}"/>
      <stop offset="100%" stop-color="${colors.skyBottom}"/>
    </linearGradient>

    <!-- 지면 그라데이션 -->
    <linearGradient id="groundGrad" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${colors.groundMain}"/>
      <stop offset="100%" stop-color="${colors.groundAccent}"/>
    </linearGradient>

    <!-- 건물 그림자 -->
    <filter id="buildingShadow">
      <feDropShadow dx="2" dy="3" stdDeviation="2" flood-color="${colors.shadowColor}" flood-opacity="0.5"/>
    </filter>

    <!-- 글로우 효과 -->
    <filter id="cityGlow">
      <feGaussianBlur stdDeviation="${isNeon ? '3' : '1.5'}" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 네온 강한 글로우 -->
    ${isNeon ? `<filter id="neonGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>` : ''}

    <!-- 비/눈 입자용 -->
    <filter id="weatherBlur">
      <feGaussianBlur stdDeviation="0.5"/>
    </filter>

    <!-- 건물 윈도우 패턴 -->
    <pattern id="windowPattern" x="0" y="0" width="12" height="14" patternUnits="userSpaceOnUse">
      <rect width="8" height="8" x="2" y="3" rx="1" fill="${colors.glowColor}" opacity="0.6"/>
    </pattern>

    <!-- 도로 패턴 -->
    <pattern id="roadDash" x="0" y="0" width="20" height="4" patternUnits="userSpaceOnUse">
      <rect width="10" height="2" y="1" fill="${colors.roadLine}" opacity="0.6"/>
    </pattern>
  </defs>`;
}

// ═══════════════════════════════════════════
// 💫 Styles (애니메이션)
// ═══════════════════════════════════════════

function buildStyles(colors: CityStyleColors, animate: boolean): string {
  const animBlock = animate ? `
    @keyframes dc-blink {
      0%, 100% { opacity: 0.3; }
      50% { opacity: 0.9; }
    }

    @keyframes dc-vehicle-move {
      0% { transform: translateX(-60px); }
      100% { transform: translateX(860px); }
    }

    @keyframes dc-vehicle-move-rev {
      0% { transform: translateX(860px); }
      100% { transform: translateX(-60px); }
    }

    @keyframes dc-rain {
      0% { transform: translateY(-20px); opacity: 0; }
      20% { opacity: 1; }
      100% { transform: translateY(420px); opacity: 0.3; }
    }

    @keyframes dc-snow {
      0% { transform: translate(0, -20px); opacity: 0; }
      20% { opacity: 0.9; }
      100% { transform: translate(20px, 420px); opacity: 0; }
    }

    @keyframes dc-firework {
      0% { r: 0; opacity: 1; }
      50% { opacity: 0.8; }
      100% { r: 15; opacity: 0; }
    }

    @keyframes dc-smoke {
      0% { transform: translateY(0); opacity: 0.6; }
      100% { transform: translateY(-30px); opacity: 0; }
    }

    @keyframes dc-fadeIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }

    @keyframes dc-rainbow {
      0% { opacity: 0; }
      30% { opacity: 0.4; }
      70% { opacity: 0.4; }
      100% { opacity: 0; }
    }

    @keyframes dc-neon-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }

    .dc-window { animation: dc-blink 4s ease-in-out infinite; }
    .dc-vehicle { animation: dc-vehicle-move 12s linear infinite; }
    .dc-vehicle-rev { animation: dc-vehicle-move-rev 15s linear infinite; }
    .dc-rain-drop { animation: dc-rain 1.5s linear infinite; }
    .dc-snow-flake { animation: dc-snow 4s ease-in-out infinite; }
    .dc-firework { animation: dc-firework 2s ease-out infinite; }
    .dc-smoke { animation: dc-smoke 3s ease-out infinite; }
    .dc-building { animation: dc-fadeIn 0.6s ease-out forwards; opacity: 0; }
    .dc-rainbow { animation: dc-rainbow 8s ease-in-out infinite; }
    .dc-neon { animation: dc-neon-pulse 2s ease-in-out infinite; }
  ` : `
    .dc-window { opacity: 0.6; }
    .dc-building { opacity: 1; }
  `;

  return `<style>
    .dc-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .dc-title { font-size: 13px; font-weight: 700; letter-spacing: 1.5px; }
    .dc-subtitle { font-size: 9px; font-weight: 500; }
    .dc-label { font-size: 7px; font-weight: 500; }
    .dc-label-sm { font-size: 6px; font-weight: 400; }
    .dc-footer-text { font-size: 9px; font-weight: 500; }
    .dc-footer-val { font-size: 10px; font-weight: 700; }
    ${animBlock}
  </style>`;
}

// ═══════════════════════════════════════════
// 🌿 지면 렌더링
// ═══════════════════════════════════════════

function renderGround(
  colors: CityStyleColors,
  tier: CityTier,
  style: string
): string {
  const groundY = CITY_HEIGHT * 0.6;
  const groundH = CITY_HEIGHT - groundY;

  // 기본 지면
  let ground = `<rect x="0" y="${groundY}" width="${SVG_WIDTH}" height="${groundH}" fill="url(#groundGrad)"/>`;

  // Tier에 따른 도로 밀도
  if (tier.tier >= 1) {
    // 메인 도로
    ground += `<rect x="0" y="${groundY + 20}" width="${SVG_WIDTH}" height="16"
                     fill="${colors.roadColor}"/>`;
    ground += `<rect x="0" y="${groundY + 27}" width="${SVG_WIDTH}" height="2"
                     fill="url(#roadDash)"/>`;
  }

  if (tier.tier >= 3) {
    // 세로 도로
    ground += `<rect x="${SVG_WIDTH * 0.5 - 8}" y="${groundY}" width="16" height="${groundH}"
                     fill="${colors.roadColor}"/>`;
  }

  // 지면 텍스처 (풀/패턴)
  if (style !== 'neon') {
    for (let i = 0; i < 20; i++) {
      const x = ((i * 173 + 29) % SVG_WIDTH);
      const y = groundY + 45 + ((i * 47) % (groundH - 50));
      const size = 1 + ((i * 31) % 3);
      ground += `<circle cx="${x}" cy="${y}" r="${size}" fill="${colors.groundAccent}" opacity="0.3"/>`;
    }
  }

  return `<g>${ground}</g>`;
}

// ═══════════════════════════════════════════
// 🛣️ 도로 렌더링
// ═══════════════════════════════════════════

function renderRoads(
  buildings: CityBuilding[],
  colors: CityStyleColors
): string {
  if (buildings.length < 3) return '';

  // 건물 행 사이에 작은 길 추가
  const groundY = CITY_HEIGHT * 0.6;
  let roads = '';

  // 가로등 (도시 분위기)
  const lampCount = Math.min(6, Math.ceil(buildings.length / 3));
  for (let i = 0; i < lampCount; i++) {
    const x = 60 + i * (SVG_WIDTH - 120) / Math.max(1, lampCount - 1);
    const y = groundY + 16;
    roads += renderStreetLamp(x, y, colors);
  }

  return `<g>${roads}</g>`;
}

function renderStreetLamp(x: number, y: number, colors: CityStyleColors): string {
  return `<g>
    <rect x="${x - 1}" y="${y - 18}" width="2" height="18" fill="#666" rx="0.5"/>
    <circle cx="${x}" cy="${y - 20}" r="3" fill="${colors.glowColor}" opacity="0.7"/>
    <circle cx="${x}" cy="${y - 20}" r="6" fill="${colors.glowColor}" opacity="0.15"/>
  </g>`;
}

// ═══════════════════════════════════════════
// 🏢 건물 렌더링
// ═══════════════════════════════════════════

function renderBuildings(
  buildings: CityBuilding[],
  colors: CityStyleColors,
  style: string
): string {
  if (buildings.length === 0) {
    return renderEmptyCity(colors);
  }

  const groundY = CITY_HEIGHT * 0.6;
  const isNeon = style === 'neon';

  // 건물을 행별로 분류하여 뒤→앞 순서로 렌더링 (z-order)
  const maxRow = Math.max(...buildings.map(b => b.gridRow));
  const maxCol = Math.max(...buildings.map(b => b.gridCol));

  // 건물 배치 영역
  const cityLeft = 40;
  const cityRight = SVG_WIDTH - 40;
  const cityWidth = cityRight - cityLeft;

  let allBuildings = '';

  for (let row = 0; row <= maxRow; row++) {
    const rowBuildings = buildings.filter(b => b.gridRow === row);
    const rowY = groundY - 10 - row * 65; // 뒤로 갈수록 위로

    rowBuildings.forEach((building, colIdx) => {
      const colCount = Math.max(1, maxCol + 1);
      const spacing = cityWidth / (colCount + 1);
      const x = cityLeft + spacing * (building.gridCol + 0.5) + (row % 2) * spacing * 0.3;
      const delay = (row * 0.15 + colIdx * 0.1).toFixed(2);

      allBuildings += renderSingleBuilding(
        building, x, rowY, delay, colors, isNeon
      );
    });
  }

  return `<g>${allBuildings}</g>`;
}

function renderSingleBuilding(
  building: CityBuilding,
  x: number,
  baseY: number,
  delay: string,
  colors: CityStyleColors,
  isNeon: boolean
): string {
  const { info, height, isDormant, repoName, stars, buildingType } = building;
  const w = BUILDING_BASE_W;
  const h = height;
  const y = baseY - h;

  // 비활성 건물은 어둡게
  const dormantOpacity = isDormant ? 0.5 : 1;

  // 건물 메인 색상
  const mainColor = isDormant ? '#555555' : info.colorMain;
  const accentColor = isDormant ? '#444444' : info.colorAccent;

  // 건물 형태 (타입별로 다른 모양)
  const buildingShape = getBuildingShape(buildingType, x, y, w, h, mainColor, accentColor, colors, isNeon);

  // 창문 (높이에 따라 행 수 결정)
  const windowRows = Math.max(1, Math.floor(h / 18));
  const windowCols = 3;
  let windows = '';

  for (let wr = 0; wr < windowRows; wr++) {
    for (let wc = 0; wc < windowCols; wc++) {
      const wx = x - w / 2 + 10 + wc * 16;
      const wy = y + 8 + wr * 16;
      const wDelay = (wr * 0.7 + wc * 1.3 + parseFloat(delay) * 2).toFixed(1);
      const windowColor = isNeon ? colors.glowColor : colors.glowColor;
      const winOpacity = isDormant ? 0.1 : 0.4 + ((wr * 3 + wc * 7) % 10) / 20;

      windows += `<rect x="${wx}" y="${wy}" width="7" height="7" rx="1"
                        fill="${windowColor}" opacity="${winOpacity.toFixed(2)}"
                        class="dc-window" style="animation-delay: ${wDelay}s"/>`;
    }
  }

  // 건물 이름 (최대 10자)
  const displayName = repoName.length > 10 ? repoName.substring(0, 10) + '…' : repoName;
  const starBadge = stars > 0 ? ` ⭐${stars}` : '';

  // 네온 테두리 효과
  const neonOutline = isNeon
    ? `<rect x="${x - w / 2 - 1}" y="${y - 1}" width="${w + 2}" height="${h + 2}" rx="3"
            fill="none" stroke="${colors.buildingOutline}" stroke-width="1"
            class="dc-neon" style="animation-delay: ${delay}s"/>` : '';

  // 건물 아이콘
  const iconY = y - 10;

  return `<g class="dc-building" style="animation-delay: ${delay}s" opacity="${dormantOpacity}">
    <!-- 건물 그림자 -->
    <ellipse cx="${x + 3}" cy="${baseY + 2}" rx="${w / 2 - 5}" ry="4" fill="${colors.shadowColor}" opacity="0.4"/>

    <!-- 건물 본체 -->
    ${buildingShape}

    <!-- 창문 -->
    ${windows}

    <!-- 네온 효과 -->
    ${neonOutline}

    <!-- 건물 아이콘 -->
    <text x="${x}" y="${iconY}" text-anchor="middle" class="dc-text" font-size="12">
      ${info.icon}</text>

    <!-- 건물 이름 -->
    <text x="${x}" y="${baseY + 14}" text-anchor="middle"
          class="dc-text dc-label" fill="${colors.textSecondary}" opacity="0.8">
      ${escapeXml(displayName)}${starBadge}</text>
  </g>`;
}

/**
 * 건물 타입에 따라 다른 형태의 SVG 요소를 생성합니다.
 */
function getBuildingShape(
  type: BuildingType,
  x: number,
  y: number,
  w: number,
  h: number,
  mainColor: string,
  accentColor: string,
  colors: CityStyleColors,
  isNeon: boolean
): string {
  const left = x - w / 2;

  switch (type) {
    case 'mall':
      // 🏬 쇼핑몰: 넓고 낮은 건물 + 유리 느낌
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="3" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <rect x="${left}" y="${y}" width="${w}" height="8" rx="3" fill="${accentColor}"/>
              <rect x="${left + 4}" y="${y + 2}" width="${w - 8}" height="4" rx="1" fill="${mainColor}" opacity="0.5"/>`;

    case 'factory':
      // 🏗️ 공장: 굴뚝이 있는 건물
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="2" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <rect x="${left + 5}" y="${y - 15}" width="8" height="15" fill="${accentColor}"/>
              <rect x="${left + w - 18}" y="${y - 10}" width="6" height="10" fill="${accentColor}"/>
              <circle cx="${left + 9}" cy="${y - 17}" r="4" fill="#999" opacity="0.4" class="dc-smoke" style="animation-delay: 0s"/>
              <circle cx="${left + 9}" cy="${y - 22}" r="3" fill="#999" opacity="0.3" class="dc-smoke" style="animation-delay: 0.5s"/>`;

    case 'warehouse':
      // 📦 창고: 박스 형태
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="1" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <rect x="${left}" y="${y}" width="${w}" height="${h * 0.15}" fill="${accentColor}"/>
              <line x1="${left}" y1="${y + h * 0.5}" x2="${left + w}" y2="${y + h * 0.5}" stroke="${accentColor}" stroke-width="0.5" opacity="0.4"/>`;

    case 'garage':
      // 🔧 정비소: 낮은 건물 + 셔터
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="2" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <rect x="${left + 8}" y="${y + h * 0.4}" width="${w - 16}" height="${h * 0.55}" rx="2" fill="${accentColor}" opacity="0.7"/>
              <line x1="${left + 10}" y1="${y + h * 0.5}" x2="${left + w - 10}" y2="${y + h * 0.5}" stroke="${mainColor}" stroke-width="1" opacity="0.5"/>
              <line x1="${left + 10}" y1="${y + h * 0.6}" x2="${left + w - 10}" y2="${y + h * 0.6}" stroke="${mainColor}" stroke-width="1" opacity="0.5"/>
              <line x1="${left + 10}" y1="${y + h * 0.7}" x2="${left + w - 10}" y2="${y + h * 0.7}" stroke="${mainColor}" stroke-width="1" opacity="0.5"/>`;

    case 'lab':
      // 🔬 연구소: 안테나 + 돔
      return `<rect x="${left}" y="${y + 8}" width="${w}" height="${h - 8}" rx="2" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <ellipse cx="${x}" cy="${y + 8}" rx="${w / 2}" ry="8" fill="${accentColor}"/>
              <line x1="${x}" y1="${y - 10}" x2="${x}" y2="${y + 4}" stroke="${accentColor}" stroke-width="1.5"/>
              <circle cx="${x}" cy="${y - 12}" r="2" fill="${isNeon ? colors.glowColor : '#ff4444'}" class="dc-neon"/>`;

    case 'library':
      // 📚 도서관: 기둥이 있는 클래식 건물
      return `<rect x="${left}" y="${y + 6}" width="${w}" height="${h - 6}" rx="2" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <polygon points="${left},${y + 6} ${x},${y - 4} ${left + w},${y + 6}" fill="${accentColor}"/>
              <rect x="${left + 8}" y="${y + 8}" width="3" height="${h - 16}" fill="${accentColor}" opacity="0.6"/>
              <rect x="${left + w - 11}" y="${y + 8}" width="3" height="${h - 16}" fill="${accentColor}" opacity="0.6"/>`;

    case 'arcade':
      // 🎮 오락실: 화려한 네온 간판
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="3" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <rect x="${left + 4}" y="${y + 3}" width="${w - 8}" height="10" rx="2" fill="${accentColor}" filter="url(#cityGlow)"/>
              <rect x="${left + 3}" y="${y + h - 18}" width="${w - 6}" height="14" rx="2" fill="#111" opacity="0.6"/>`;

    case 'telecom':
      // 📱 통신사: 안테나 타워
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="2" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <line x1="${x + 10}" y1="${y - 20}" x2="${x + 10}" y2="${y}" stroke="${accentColor}" stroke-width="2"/>
              <line x1="${x + 5}" y1="${y - 15}" x2="${x + 15}" y2="${y - 15}" stroke="${accentColor}" stroke-width="1"/>
              <line x1="${x + 7}" y1="${y - 10}" x2="${x + 13}" y2="${y - 10}" stroke="${accentColor}" stroke-width="1"/>
              <circle cx="${x + 10}" cy="${y - 22}" r="1.5" fill="${isNeon ? colors.glowColor : '#ff0000'}" class="dc-neon"/>`;

    case 'cityhall':
      // 🏛️ 시청: 가장 크고 중앙에
      return `<rect x="${left}" y="${y + 10}" width="${w}" height="${h - 10}" rx="3" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <polygon points="${left - 3},${y + 10} ${x},${y - 5} ${left + w + 3},${y + 10}" fill="${accentColor}"/>
              <rect x="${x - 6}" y="${y + h - 22}" width="12" height="18" rx="2" fill="${accentColor}" opacity="0.6"/>
              <rect x="${left + 6}" y="${y + 12}" width="3" height="${h - 26}" fill="${accentColor}" opacity="0.4"/>
              <rect x="${left + w - 9}" y="${y + 12}" width="3" height="${h - 26}" fill="${accentColor}" opacity="0.4"/>
              <rect x="${x - 3}" y="${y - 18}" width="1.5" height="16" fill="${accentColor}"/>
              <polygon points="${x - 3},${y - 22} ${x + 4},${y - 22} ${x + 4},${y - 18} ${x - 3},${y - 18}" fill="#ff4444"/>`;

    case 'ruin':
      // 🏚️ 폐허: 금 간 벽
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="1" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>
              <line x1="${left + 5}" y1="${y}" x2="${left + 15}" y2="${y + h * 0.4}" stroke="#555" stroke-width="0.8" opacity="0.6"/>
              <line x1="${left + w - 10}" y1="${y + h * 0.2}" x2="${left + w - 5}" y2="${y + h * 0.7}" stroke="#555" stroke-width="0.8" opacity="0.6"/>
              <circle cx="${left + w * 0.7}" cy="${y + h * 0.3}" r="3" fill="#888" opacity="0.2"/>`;

    default:
      return `<rect x="${left}" y="${y}" width="${w}" height="${h}" rx="3" fill="${mainColor}" stroke="${colors.buildingOutline}" stroke-width="0.5"/>`;
  }
}

function renderEmptyCity(colors: CityStyleColors): string {
  const groundY = CITY_HEIGHT * 0.6;
  return `<g>
    <text x="${SVG_WIDTH / 2}" y="${groundY - 30}" text-anchor="middle"
          class="dc-text dc-subtitle" fill="${colors.textSecondary}">
      🏕️ 아직 건물이 없습니다... 레포를 만들어보세요!</text>
    <!-- 텐트 -->
    <polygon points="${SVG_WIDTH / 2 - 20},${groundY - 5} ${SVG_WIDTH / 2},${groundY - 30} ${SVG_WIDTH / 2 + 20},${groundY - 5}"
             fill="#8B4513" opacity="0.7"/>
    <!-- 모닥불 -->
    <circle cx="${SVG_WIDTH / 2 + 35}" cy="${groundY - 3}" r="4" fill="#ff6600" opacity="0.8"/>
    <circle cx="${SVG_WIDTH / 2 + 35}" cy="${groundY - 7}" r="3" fill="#ff9900" opacity="0.6"/>
  </g>`;
}

// ═══════════════════════════════════════════
// 🚗 교통 렌더링
// ═══════════════════════════════════════════

function renderTrafficVehicles(
  traffic: CityTraffic,
  colors: CityStyleColors
): string {
  if (traffic.vehicleCount === 0) return '';

  const groundY = CITY_HEIGHT * 0.6;
  const roadY = groundY + 22;
  let vehicles = '';

  const vehicleColors = ['#ff6b6b', '#48dbfb', '#feca57', '#54a0ff', '#5f27cd', '#01a3a4'];

  for (let i = 0; i < traffic.vehicleCount; i++) {
    const color = vehicleColors[i % vehicleColors.length];
    const delay = (i * 2.5 + ((i * 37) % 10) / 3).toFixed(1);
    const y = roadY + (i % 2 === 0 ? -3 : 3);
    const animClass = i % 2 === 0 ? 'dc-vehicle' : 'dc-vehicle-rev';

    vehicles += `<g class="${animClass}" style="animation-delay: ${delay}s">
      <rect x="0" y="${y - 3}" width="14" height="6" rx="2" fill="${color}"/>
      <rect x="2" y="${y - 5}" width="5" height="3" rx="1" fill="${color}" opacity="0.8"/>
      <circle cx="3" cy="${y + 4}" r="1.5" fill="#333"/>
      <circle cx="11" cy="${y + 4}" r="1.5" fill="#333"/>
    </g>`;
  }

  return `<g>${vehicles}</g>`;
}

// ═══════════════════════════════════════════
// 🌦️ 날씨 효과 렌더링
// ═══════════════════════════════════════════

function renderWeatherEffects(
  weather: WeatherInfo,
  colors: CityStyleColors
): string {
  switch (weather.type) {
    case 'sunny':
      return renderSun(colors);
    case 'cloudy_s':
      return renderClouds(2, colors, 0.4);
    case 'cloudy':
      return renderClouds(4, colors, 0.6);
    case 'rainy':
      return renderRain(colors);
    case 'snowy':
      return renderSnow(colors);
    case 'rainbow':
      return renderRainbow(colors);
    case 'fireworks':
      return renderFireworks(colors);
    case 'volcano':
      return renderVolcano(colors);
    default:
      return '';
  }
}

function renderSun(colors: CityStyleColors): string {
  return `<g>
    <circle cx="680" cy="35" r="20" fill="#ffd700" opacity="0.9" filter="url(#cityGlow)"/>
    <circle cx="680" cy="35" r="28" fill="#ffd700" opacity="0.15"/>
    <circle cx="680" cy="35" r="36" fill="#ffd700" opacity="0.06"/>
  </g>`;
}

function renderClouds(count: number, colors: CityStyleColors, opacity: number): string {
  let clouds = '';
  for (let i = 0; i < count; i++) {
    const x = 80 + i * 180 + ((i * 67) % 40);
    const y = 15 + ((i * 29) % 25);
    const scale = 0.6 + ((i * 41) % 40) / 100;
    clouds += `<g transform="translate(${x}, ${y}) scale(${scale.toFixed(2)})" opacity="${opacity}">
      <ellipse cx="0" cy="0" rx="35" ry="12" fill="#cccccc"/>
      <ellipse cx="-15" cy="3" rx="22" ry="9" fill="#bbbbbb"/>
      <ellipse cx="18" cy="2" rx="25" ry="10" fill="#bbbbbb"/>
    </g>`;
  }
  return `<g>${clouds}</g>`;
}

function renderRain(colors: CityStyleColors): string {
  let drops = '';
  drops += renderClouds(3, colors, 0.7);

  for (let i = 0; i < 30; i++) {
    const x = ((i * 167 + 43) % SVG_WIDTH);
    const delay = ((i * 89 + 13) % 30) / 20;
    const length = 6 + ((i * 31) % 4);
    drops += `<line x1="${x}" y1="0" x2="${x - 2}" y2="${length}"
              stroke="#6699cc" stroke-width="1" opacity="0.5"
              class="dc-rain-drop" style="animation-delay: ${delay.toFixed(2)}s"/>`;
  }

  return `<g>${drops}</g>`;
}

function renderSnow(colors: CityStyleColors): string {
  let flakes = '';
  flakes += renderClouds(3, colors, 0.5);

  for (let i = 0; i < 25; i++) {
    const x = ((i * 173 + 37) % SVG_WIDTH);
    const delay = ((i * 97 + 19) % 40) / 10;
    const size = 1.5 + ((i * 53) % 3);
    flakes += `<circle cx="${x}" cy="0" r="${size}" fill="white" opacity="0.8"
               class="dc-snow-flake" style="animation-delay: ${delay.toFixed(1)}s"/>`;
  }

  return `<g>${flakes}</g>`;
}

function renderRainbow(colors: CityStyleColors): string {
  const cx = SVG_WIDTH / 2;
  const cy = CITY_HEIGHT * 0.6;
  const rainbowColors = ['#ff0000', '#ff8800', '#ffff00', '#00ff00', '#0088ff', '#4400ff', '#8800ff'];

  let arcs = '';
  rainbowColors.forEach((color, i) => {
    const r = 150 - i * 8;
    arcs += `<path d="M${cx - r},${cy} A${r},${r} 0 0,1 ${cx + r},${cy}"
             fill="none" stroke="${color}" stroke-width="4" opacity="0.3"
             class="dc-rainbow" style="animation-delay: ${(i * 0.3).toFixed(1)}s"/>`;
  });

  return `<g>${arcs}</g>`;
}

function renderFireworks(colors: CityStyleColors): string {
  let fireworks = '';
  const fwColors = ['#ff0000', '#00ff00', '#ffff00', '#ff00ff', '#00ffff', '#ff8800'];

  for (let i = 0; i < 6; i++) {
    const x = 80 + ((i * 137 + 41) % (SVG_WIDTH - 160));
    const y = 20 + ((i * 89 + 23) % 60);
    const color = fwColors[i];
    const delay = (i * 1.2).toFixed(1);

    fireworks += `<circle cx="${x}" cy="${y}" r="2" fill="${color}" opacity="0.9"
                  class="dc-firework" style="animation-delay: ${delay}s"/>`;
    // 파티클
    for (let j = 0; j < 6; j++) {
      const angle = (j / 6) * Math.PI * 2;
      const px = x + Math.cos(angle) * 8;
      const py = y + Math.sin(angle) * 8;
      fireworks += `<circle cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" r="1" fill="${color}" opacity="0.6"
                    class="dc-firework" style="animation-delay: ${(parseFloat(delay) + 0.3).toFixed(1)}s"/>`;
    }
  }

  return `<g>${fireworks}</g>`;
}

function renderVolcano(colors: CityStyleColors): string {
  let smoke = '';
  for (let i = 0; i < 8; i++) {
    const x = 300 + ((i * 47) % 200);
    const y = CITY_HEIGHT * 0.5 + ((i * 31) % 30);
    const size = 4 + ((i * 19) % 6);
    const delay = (i * 0.5).toFixed(1);
    smoke += `<circle cx="${x}" cy="${y}" r="${size}" fill="#ff4444" opacity="0.3"
              class="dc-smoke" style="animation-delay: ${delay}s"/>`;
    smoke += `<circle cx="${x + 5}" cy="${y - 5}" r="${size * 0.7}" fill="#ff6600" opacity="0.2"
              class="dc-smoke" style="animation-delay: ${(parseFloat(delay) + 0.3).toFixed(1)}s"/>`;
  }

  return `<g>${smoke}</g>`;
}

// ═══════════════════════════════════════════
// 🎄 장식 요소
// ═══════════════════════════════════════════

function renderDecorations(
  tier: CityTier,
  colors: CityStyleColors,
  style: string
): string {
  const groundY = CITY_HEIGHT * 0.6;
  let decorations = '';

  // Tier 0: 모닥불만
  if (tier.tier === 0) return '';

  // Tier 1+: 나무
  if (tier.tier >= 1) {
    const treeCount = Math.min(5, tier.tier + 1);
    for (let i = 0; i < treeCount; i++) {
      const x = 20 + ((i * 179 + 53) % (SVG_WIDTH - 40));
      const y = groundY + 42 + ((i * 41) % 30);
      decorations += renderTree(x, y, colors, style);
    }
  }

  // Tier 2+: 공원 벤치
  if (tier.tier >= 2) {
    const benchX = SVG_WIDTH * 0.15;
    const benchY = groundY + 50;
    decorations += `<rect x="${benchX}" y="${benchY}" width="20" height="6" rx="2" fill="#8B4513" opacity="0.6"/>
                    <rect x="${benchX + 2}" y="${benchY - 4}" width="2" height="4" fill="#8B4513" opacity="0.6"/>
                    <rect x="${benchX + 16}" y="${benchY - 4}" width="2" height="4" fill="#8B4513" opacity="0.6"/>`;
  }

  // Tier 3+: 분수/공원
  if (tier.tier >= 3) {
    const fx = SVG_WIDTH * 0.82;
    const fy = groundY + 48;
    decorations += `<ellipse cx="${fx}" cy="${fy}" rx="12" ry="5" fill="#4FC3F7" opacity="0.4"/>
                    <line x1="${fx}" y1="${fy - 10}" x2="${fx}" y2="${fy}" stroke="#4FC3F7" stroke-width="1.5" opacity="0.5"/>
                    <circle cx="${fx}" cy="${fy - 12}" r="2" fill="#4FC3F7" opacity="0.3"/>`;
  }

  // Tier 4+: 헬기
  if (tier.tier >= 4) {
    decorations += renderHelicopter(120, 20, colors);
  }

  // Tier 5: 비행선
  if (tier.tier >= 5) {
    decorations += renderAirship(SVG_WIDTH * 0.7, 15, colors);
  }

  return `<g>${decorations}</g>`;
}

function renderTree(x: number, y: number, colors: CityStyleColors, style: string): string {
  if (style === 'neon') {
    return `<g>
      <line x1="${x}" y1="${y}" x2="${x}" y2="${y - 12}" stroke="${colors.glowColor}" stroke-width="1" opacity="0.4"/>
      <polygon points="${x - 6},${y - 8} ${x},${y - 20} ${x + 6},${y - 8}" fill="${colors.glowColor}" opacity="0.2"/>
    </g>`;
  }
  return `<g>
    <rect x="${x - 1.5}" y="${y - 8}" width="3" height="8" fill="#8B4513" opacity="0.7"/>
    <polygon points="${x - 8},${y - 6} ${x},${y - 22} ${x + 8},${y - 6}" fill="#2ecc71" opacity="0.7"/>
    <polygon points="${x - 6},${y - 12} ${x},${y - 24} ${x + 6},${y - 12}" fill="#27ae60" opacity="0.6"/>
  </g>`;
}

function renderHelicopter(x: number, y: number, colors: CityStyleColors): string {
  return `<g opacity="0.6">
    <ellipse cx="${x}" cy="${y}" rx="10" ry="4" fill="#555"/>
    <line x1="${x - 12}" y1="${y - 3}" x2="${x + 12}" y2="${y - 3}" stroke="#777" stroke-width="1"/>
    <line x1="${x + 8}" y1="${y}" x2="${x + 18}" y2="${y + 2}" stroke="#555" stroke-width="1"/>
  </g>`;
}

function renderAirship(x: number, y: number, colors: CityStyleColors): string {
  return `<g opacity="0.5">
    <ellipse cx="${x}" cy="${y}" rx="30" ry="10" fill="#888"/>
    <rect x="${x - 10}" y="${y + 8}" width="20" height="6" rx="2" fill="#666"/>
    <text x="${x}" y="${y + 3}" text-anchor="middle" class="dc-text" font-size="5" fill="${colors.textColor}" opacity="0.6">GITPRO</text>
  </g>`;
}

// ═══════════════════════════════════════════
// 📊 헤더 & 푸터
// ═══════════════════════════════════════════

function renderHeader(
  username: string,
  tier: CityTier,
  weather: WeatherInfo,
  colors: CityStyleColors
): string {
  return `<g>
    <text x="${SVG_WIDTH / 2}" y="22" text-anchor="middle"
          class="dc-text dc-title" fill="${colors.textColor}">
      ${tier.icon} ${escapeXml(username)}&apos;s Dev City</text>
    <text x="${SVG_WIDTH / 2}" y="36" text-anchor="middle"
          class="dc-text dc-subtitle" fill="${colors.textSecondary}">
      ${tier.name} (Tier ${tier.tier}) · ${weather.icon} ${weather.label}</text>
  </g>`;
}

function renderFooter(
  stats: CityStats,
  tier: CityTier,
  colors: CityStyleColors
): string {
  const y = SVG_HEIGHT - FOOTER_HEIGHT;

  const items = [
    { icon: '🏢', label: 'Buildings', value: stats.totalBuildings.toString() },
    { icon: '👥', label: 'Population', value: formatPopulation(stats.population) },
    { icon: '💻', label: 'Commits', value: stats.totalCommits.toString() },
    { icon: '⭐', label: 'Stars', value: stats.totalStars.toString() },
    { icon: '🔥', label: 'Streak', value: `${stats.streakDays}d` },
    { icon: '📊', label: 'Top Lang', value: stats.topLanguage },
  ];

  const spacing = SVG_WIDTH / items.length;

  const itemsStr = items.map((item, i) => {
    const x = spacing / 2 + i * spacing;
    return `
    <text x="${x.toFixed(0)}" y="${y + 18}" text-anchor="middle"
          class="dc-text dc-footer-text" fill="${colors.textSecondary}">
      ${item.icon} ${item.label}</text>
    <text x="${x.toFixed(0)}" y="${y + 33}" text-anchor="middle"
          class="dc-text dc-footer-val" fill="${colors.textColor}">
      ${escapeXml(item.value)}</text>`;
  }).join('');

  return `<g>
    <!-- 구분선 -->
    <line x1="16" y1="${y + 2}" x2="${SVG_WIDTH - 16}" y2="${y + 2}"
          stroke="${colors.border}" stroke-width="0.5" opacity="0.5"/>
    ${itemsStr}
  </g>`;
}

// ═══════════════════════════════════════════
// 🧩 유틸리티
// ═══════════════════════════════════════════

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
