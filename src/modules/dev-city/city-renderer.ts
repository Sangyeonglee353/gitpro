import { ThemeColors, DevCityConfig } from '../../types';
import { CityProfile, CityBuilding, CityTraffic, CityStats, ContributionDay } from './city-analyzer';
import { CityTier, WeatherInfo, BuildingType } from './building-mapper';

// ── 캔버스 상수 ──────────────────────────
const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const HEADER_HEIGHT = 50;
const FOOTER_HEIGHT = 52;
const CITY_Y = HEADER_HEIGHT;
const CITY_HEIGHT = SVG_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

// ── 아이소메트릭 그리드 ──────────────────
const GRID_ORIGIN_X = 400;
const GRID_ORIGIN_Y = 278;
const TILE_W = 112;
const TILE_H = 58;

type CityStyle = 'tycoon' | 'simcity' | 'neon';
type BuildingZone = 'residential' | 'commercial' | 'industrial' | 'civic';
type TimeBand = 'morning' | 'day' | 'evening' | 'night';

interface GridInfo {
  cols: number;
  rows: number;
  centerCol: number;
  centerRow: number;
}

interface Pt { x: number; y: number; }

interface Palette {
  skyTop: string;
  skyMid: string;
  skyBottom: string;
  haze: string;
  groundTop: string;
  groundBottom: string;
  grass: string;
  water: string;
  road: string;
  lane: string;
  text: string;
  textMuted: string;
  border: string;
  outline: string;
  shadow: string;
  glow: string;
  window: string;
}

// ── 유틸리티 ────────────────────────────

function n(v: number): string { return v.toFixed(1); }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }

function escapeXml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&apos;');
}

function lightenHex(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amt));
  const ng = Math.min(255, Math.round(g + (255 - g) * amt));
  const nb = Math.min(255, Math.round(b + (255 - b) * amt));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * (1 - amt));
  const ng = Math.round(g * (1 - amt));
  const nb = Math.round(b * (1 - amt));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function isoToScreen(right: number, left: number, top: number): Pt {
  return {
    x: GRID_ORIGIN_X + (right - left) * (TILE_W / 2),
    y: GRID_ORIGIN_Y + (right + left) * (TILE_H / 2) - top,
  };
}

function hashCode(text: string): number {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i);
    h += (h << 1) + (h << 4) + (h << 7) + (h << 8) + (h << 24);
  }
  return Math.abs(h >>> 0);
}

function gridToScreen(col: number, row: number, grid: GridInfo): Pt {
  return isoToScreen(col - grid.centerCol, row - grid.centerRow, 0);
}

function getGrid(buildingCount: number): GridInfo {
  const cols = Math.min(5, Math.max(1, buildingCount));
  const rows = Math.max(1, Math.ceil(Math.max(1, buildingCount) / cols));
  return { cols, rows, centerCol: (cols - 1) / 2, centerRow: (rows - 1) / 2 };
}

function getZone(type: BuildingType): BuildingZone {
  switch (type) {
    case 'factory': case 'warehouse': case 'garage': return 'industrial';
    case 'mall': case 'arcade': case 'telecom': case 'lab': return 'commercial';
    case 'cityhall': return 'civic';
    default: return 'residential';
  }
}

// ── 팔레트 ──────────────────────────────

function getPalette(style: CityStyle, _theme: ThemeColors): Palette {
  switch (style) {
    case 'tycoon': return {
      skyTop: '#050d1c',
      skyMid: '#0e2440',
      skyBottom: '#1c4272',
      haze: 'rgba(80,140,220,0.14)',
      groundTop: '#3d6e38',
      groundBottom: '#243f22',
      grass: '#5a9248',
      water: '#2970b8',
      road: '#3a4450',
      lane: '#e8c840',
      text: '#deeeff',
      textMuted: '#90b4d4',
      border: '#1a3454',
      outline: '#0e1e34',
      shadow: 'rgba(0,0,0,0.42)',
      glow: '#ffb830',
      window: '#ffe060',
    };
    case 'simcity': return {
      skyTop: '#3090e0',
      skyMid: '#65b8f8',
      skyBottom: '#b8e4ff',
      haze: 'rgba(255,255,255,0.35)',
      groundTop: '#58a048',
      groundBottom: '#3a6e2e',
      grass: '#72b85e',
      water: '#44a0d8',
      road: '#586068',
      lane: '#ffe860',
      text: '#142030',
      textMuted: '#385060',
      border: '#68a0be',
      outline: '#264460',
      shadow: 'rgba(0,0,0,0.22)',
      glow: '#ffc820',
      window: '#fff0a0',
    };
    case 'neon': return {
      skyTop: '#020008',
      skyMid: '#070020',
      skyBottom: '#0c0038',
      haze: 'rgba(0,240,200,0.09)',
      groundTop: '#0c0820',
      groundBottom: '#040210',
      grass: '#141a30',
      water: '#0e1e44',
      road: '#0c1022',
      lane: '#00ffe4',
      text: '#00ffd8',
      textMuted: '#ff50d8',
      border: '#280f60',
      outline: '#00d8c0',
      shadow: 'rgba(0,240,210,0.10)',
      glow: '#ff20c8',
      window: '#00ffea',
    };
  }
}

// ── SVG 정의 (그라디언트/필터) ────────────

function buildDefs(p: Palette, isNeon: boolean): string {
  return `<defs>
  <linearGradient id="dcSky" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${p.skyTop}"/>
    <stop offset="48%" stop-color="${p.skyMid}"/>
    <stop offset="100%" stop-color="${p.skyBottom}"/>
  </linearGradient>
  <linearGradient id="dcGround" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${p.groundTop}"/>
    <stop offset="100%" stop-color="${p.groundBottom}"/>
  </linearGradient>
  <linearGradient id="dcAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${lightenHex(p.road, 0.10)}"/>
    <stop offset="100%" stop-color="${darkenHex(p.road, 0.15)}"/>
  </linearGradient>
  <linearGradient id="dcGlass" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.26"/>
    <stop offset="55%" stop-color="#ffffff" stop-opacity="0.09"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
  </linearGradient>
  <linearGradient id="dcDepthFog" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${p.skyBottom}" stop-opacity="0.0"/>
    <stop offset="100%" stop-color="${p.skyBottom}" stop-opacity="0.28"/>
  </linearGradient>
  <pattern id="dcNoise" width="5" height="5" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="1.5" r="0.35" fill="#000" opacity="0.12"/>
    <circle cx="3.5" cy="3.8" r="0.3" fill="#fff" opacity="0.07"/>
  </pattern>
  <filter id="dcGlow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="${isNeon ? '2.8' : '1.4'}" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="dcBloom" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="dcShadow">
    <feDropShadow dx="1" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity="0.38"/>
  </filter>
  <filter id="dcLampGlow" x="-200%" y="-200%" width="500%" height="500%">
    <feGaussianBlur stdDeviation="3" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;
}

function buildStyles(animate: boolean): string {
  const motion = animate
    ? `@keyframes dcTwinkle{0%,100%{opacity:0.38}50%{opacity:1}}
       @keyframes dcIdle{0%,100%{transform:translateY(0)}50%{transform:translateY(-0.7px)}}
       @keyframes dcNeonPulse{0%,100%{opacity:0.7}50%{opacity:1}}
       @keyframes dcFlicker{0%,100%{opacity:0.9}48%{opacity:0.85}50%{opacity:0.4}52%{opacity:0.9}}
       .dc-win{animation:dcTwinkle 3.4s ease-in-out infinite}
       .dc-idle{animation:dcIdle 1.8s ease-in-out infinite}
       .dc-neon{animation:dcNeonPulse 2s ease-in-out infinite}
       .dc-flicker{animation:dcFlicker 8s steps(1) infinite}`
    : '.dc-win{opacity:0.72}.dc-neon{opacity:0.88}';
  return `<style>
  .dc-text{font-family:'Segoe UI','Noto Sans KR',sans-serif}
  .dc-title{font-size:13px;font-weight:700;letter-spacing:1.2px}
  .dc-sub{font-size:9px;font-weight:500}
  .dc-small{font-size:7px;font-weight:500}
  ${motion}
</style>`;
}

// ── 아이소메트릭 기여 지형 (jasonlong/isometric-contributions 스타일) ──────

/**
 * GitHub 기여 캘린더를 아이소메트릭 3D 컬럼 그리드로 렌더링합니다.
 * 각 컬럼은 하루의 커밋 수를 높이로 표현하며,
 * 52주 × 7일 그리드를 도시 배경에 배치합니다.
 */
function renderContributionTerrain(
  calendar: ContributionDay[],
  p: Palette,
  style: CityStyle
): string {
  if (!calendar || calendar.length === 0) return '';

  const sorted = [...calendar].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // 최근 52주 (364일)
  const recentDays = sorted.slice(-364);
  if (recentDays.length === 0) return '';

  const maxCount = Math.max(1, ...recentDays.map(d => d.count));

  // 스타일별 5단계 색상 스케일 (empty, very_low, low, high, very_high)
  const SCALES: Record<CityStyle, [string, string, string, string, string]> = {
    tycoon:  ['#081524', '#13285a', '#1c509e', '#c07828', '#ffb830'],  // navy → gold
    simcity: ['#d6ecd3', '#98d290', '#5ab058', '#2c8834', '#185e22'],  // pale → deep green
    neon:    ['#08001e', '#00202e', '#004458', '#008898', '#00e8c8'],  // void → cyan
  };
  const scale = SCALES[style];

  const getColor = (count: number): string => {
    if (count === 0) return scale[0];
    const r = count / maxCount;
    if (r < 0.12) return scale[1];
    if (r < 0.32) return scale[2];
    if (r < 0.62) return scale[3];
    return scale[4];
  };

  // 그리드 파라미터 (건물 그리드와 동일 기준점 사용)
  const CX = 400;   // 중앙 x — GRID_ORIGIN_X와 동일
  const CY = 282;   // 중앙 y — 건물 지면 GRID_ORIGIN_Y=278에 맞춤
  const CW = 10;    // 셀 반폭: 52주가 화면 너비(x≈110~680px)를 채우는 크기
  const CD = 5;     // 셀 반깊이 (2:1 아이소메트릭 비율)
  const MAX_H = 80; // 최대 컬럼 높이: jasonlong 스타일 드라마틱 높이
  const WEEK_OFF = 26, DAY_OFF = 3;

  interface Cell { week: number; day: number; count: number; }
  const cells: Cell[] = recentDays.map((d, i) => ({
    week: Math.floor(i / 7),
    day: i % 7,
    count: d.count,
  }));

  // 화가 알고리즘: 뒤에서 앞으로 (week+day 오름차순)
  cells.sort((a, b) => (a.week + a.day) - (b.week + b.day));

  let out = '';
  for (const { week, day, count } of cells) {
    const baseCol = getColor(count);
    const h = count === 0 ? 1.5 : Math.max(2.5, (count / maxCount) * MAX_H);

    const cx = CX + (week - WEEK_OFF) * CW - (day - DAY_OFF) * CW;
    const cy = CY + (week - WEEK_OFF) * CD + (day - DAY_OFF) * CD;
    const hw = CW * 0.88;
    const hd = CD * 0.88;

    const topCol   = lightenHex(baseCol, 0.46);
    const rightCol = darkenHex(baseCol, 0.07);
    const leftCol  = darkenHex(baseCol, 0.34);
    const op = count === 0 ? '0.22' : '0.86';

    const edgeCol = darkenHex(baseCol, 0.50);
    if (h > 1.5) {
      // 오른쪽 면
      out += `<polygon points="${n(cx)},${n(cy)} ${n(cx+hw)},${n(cy-hd)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-h)}" fill="${rightCol}" stroke="${edgeCol}" stroke-width="0.3" opacity="${op}"/>`;
      // 왼쪽 면
      out += `<polygon points="${n(cx)},${n(cy)} ${n(cx)},${n(cy-h)} ${n(cx-hw)},${n(cy-hd-h)} ${n(cx-hw)},${n(cy-hd)}" fill="${leftCol}" stroke="${edgeCol}" stroke-width="0.3" opacity="${op}"/>`;
    }
    // 위쪽 면 (항상 렌더링, 비어있는 날도 미니 슬래브로 표현)
    out += `<polygon points="${n(cx)},${n(cy-h)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-2*hd-h)} ${n(cx-hw)},${n(cy-hd-h)}" fill="${topCol}" stroke="${edgeCol}" stroke-width="0.3" opacity="${count === 0 ? '0.22' : '0.88'}"/>`;
  }

  // 하단 레이블
  const labelX = CX + 25 * CW - 3 * CW;
  const labelY = CY + 25 * CD + 3 * CD + 14;
  const labelFill = style === 'simcity' ? p.textMuted : lightenHex(scale[2], 0.4);

  return `<g opacity="0.80">
  ${out}
  <text x="${n(labelX)}" y="${n(labelY)}" text-anchor="middle" class="dc-text dc-small" fill="${labelFill}" opacity="0.60">contributions</text>
</g>`;
}

// ── 루프 코너 ─────────────────────────────

function loopCorners(grid: GridInfo, pad: number): { back: Pt; right: Pt; front: Pt; left: Pt } {
  return {
    back:  gridToScreen(-pad, -pad, grid),
    right: gridToScreen(grid.cols - 1 + pad, -pad, grid),
    front: gridToScreen(grid.cols - 1 + pad, grid.rows - 1 + pad, grid),
    left:  gridToScreen(-pad, grid.rows - 1 + pad, grid),
  };
}

// ── 배경 스카이라인 ───────────────────────

function renderBackdropSkyline(tier: CityTier, p: Palette, style: CityStyle): string {
  const depth = tier.tier >= 4 ? 16 : tier.tier >= 2 ? 13 : 10;
  let blocks = '';

  for (let i = 0; i < depth; i++) {
    const x = 10 + i * (780 / depth);
    const w = 22 + ((i * 13) % 28);
    const h = 30 + ((i * 29) % 90) + tier.tier * 5;
    const y = 200 - h;
    const tint = style === 'neon' ? '#1a0840' : style === 'simcity' ? '#7aa8cc' : '#3e5a7e';
    const shade = i % 3 === 0 ? lightenHex(tint, 0.12) : i % 3 === 1 ? tint : darkenHex(tint, 0.10);
    const op = style === 'neon' ? '0.38' : '0.28';

    blocks += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${shade}" opacity="${op}"/>`;

    // 계단식 세트백
    if (h > 60 && i % 3 === 0) {
      const sw = w * 0.60, sh = h * 0.35;
      blocks += `<rect x="${n(x + w * 0.20)}" y="${n(y - sh)}" width="${n(sw)}" height="${n(sh)}" fill="${lightenHex(shade, 0.08)}" opacity="${op}"/>`;
    }
    // 안테나 / metro 크레인 실루엣
    if (h > 48 && i % 4 === 0) {
      const ax = x + w * 0.5;
      blocks += `<line x1="${n(ax)}" y1="${n(y)}" x2="${n(ax)}" y2="${n(y - 20)}" stroke="${lightenHex(shade, 0.40)}" stroke-width="0.9" opacity="${style === 'neon' ? '0.62' : '0.40'}"/>`;
      if (style === 'neon') {
        blocks += `<circle cx="${n(ax)}" cy="${n(y - 21)}" r="1.4" fill="${p.glow}" opacity="0.70"><animate attributeName="opacity" values="0.70;0.18;0.70" dur="2.4s" repeatCount="indefinite"/></circle>`;
      }
    }
    // 창문 픽셀 (tycoon/neon)
    if (style !== 'simcity' && h > 40 && w > 20) {
      for (let wy = 0; wy < Math.min(4, Math.floor(h / 12)); wy++) {
        for (let wx = 0; wx < Math.min(2, Math.floor(w / 9)); wx++) {
          if ((i + wy + wx) % 3 !== 0) {
            const wox = x + 4 + wx * 9;
            const woy = y + 4 + wy * 11;
            const wCol = style === 'neon' ? p.window : '#ffe0a0';
            blocks += `<rect x="${n(wox)}" y="${n(woy)}" width="4" height="5" fill="${wCol}" opacity="0.35"/>`;
          }
        }
      }
    }
  }

  // 대기 효과
  const ambience = style !== 'neon'
    ? `<g opacity="0.20">
        <ellipse cx="148" cy="54" rx="46" ry="14" fill="white"/>
        <ellipse cx="118" cy="63" rx="28" ry="12" fill="white"/>
        <ellipse cx="188" cy="62" rx="34" ry="12" fill="white"/>
      </g>
      <g opacity="0.13">
        <ellipse cx="598" cy="68" rx="52" ry="15" fill="white"/>
        <ellipse cx="562" cy="78" rx="32" ry="13" fill="white"/>
        <ellipse cx="638" cy="76" rx="38" ry="13" fill="white"/>
      </g>`
    : `<g opacity="0.68">
        <circle cx="72" cy="22" r="0.9" fill="white"/>
        <circle cx="148" cy="12" r="1.1" fill="#cceeff"/>
        <circle cx="210" cy="32" r="0.8" fill="white"/>
        <circle cx="298" cy="17" r="1.0" fill="#f0b8ff"/>
        <circle cx="410" cy="26" r="0.9" fill="white"/>
        <circle cx="502" cy="15" r="0.8" fill="#a8ffe8"/>
        <circle cx="608" cy="21" r="1.0" fill="white"/>
        <circle cx="692" cy="12" r="0.9" fill="#ffb8f0"/>
        <circle cx="742" cy="35" r="0.8" fill="white"/>
        <circle cx="330" cy="37" r="0.7" fill="#c8eeff"/>
        <circle cx="458" cy="9" r="0.8" fill="white"/>
        <circle cx="555" cy="29" r="0.7" fill="#ffd8ff"/>
      </g>`;

  const haze = `<rect x="0" y="110" width="800" height="140" fill="${p.haze}" opacity="${style === 'neon' ? '0.24' : '0.32'}"/>`;
  return `<g>${blocks}${ambience}${haze}</g>`;
}

// ── 대기 효과 ─────────────────────────────

function renderAtmosphere(p: Palette, style: CityStyle): string {
  const fog = `<ellipse cx="400" cy="220" rx="340" ry="80" fill="${p.haze}" opacity="${style === 'neon' ? '0.20' : '0.28'}"/>`;
  const beam = style === 'neon'
    ? `<polygon points="400,16 470,225 330,225" fill="#00ffd5" opacity="0.06"/>`
    : `<polygon points="400,14 490,235 310,235" fill="#ffffff" opacity="0.07"/>`;
  const vignette = `<rect x="0" y="0" width="800" height="398" fill="none" stroke="#000" stroke-width="40" opacity="0.10"/>`;
  // 깊이 안개 (원거리)
  const depthFog = `<rect x="0" y="60" width="800" height="180" fill="url(#dcDepthFog)" opacity="0.24"/>`;
  return `<g>${beam}${depthFog}${fog}${vignette}</g>`;
}

// ── 지면 ──────────────────────────────────

function renderGround(grid: GridInfo, p: Palette, style: CityStyle): string {
  const terrain = loopCorners(grid, 1.40);
  const pts = `${n(terrain.back.x)},${n(terrain.back.y)} ${n(terrain.right.x)},${n(terrain.right.y)} ${n(terrain.front.x)},${n(terrain.front.y)} ${n(terrain.left.x)},${n(terrain.left.y)}`;

  let gridLines = '';
  for (let r = -0.2; r <= grid.rows - 1 + 0.2; r++) {
    const a = gridToScreen(0, r, grid), b = gridToScreen(grid.cols - 1, r, grid);
    gridLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${p.border}" stroke-width="0.45" opacity="0.30"/>`;
  }
  for (let c = -0.2; c <= grid.cols - 1 + 0.2; c++) {
    const a = gridToScreen(c, 0, grid), b = gridToScreen(c, grid.rows - 1, grid);
    gridLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${p.border}" stroke-width="0.45" opacity="0.30"/>`;
  }

  const river = style === 'simcity'
    ? `<polygon points="${n(terrain.left.x + 20)},${n(terrain.left.y - 14)} ${n(terrain.front.x - 30)},${n(terrain.front.y - 8)} ${n(terrain.front.x - 8)},${n(terrain.front.y + 10)} ${n(terrain.left.x + 44)},${n(terrain.left.y + 8)}"
        fill="${p.water}" opacity="0.65"/>`
    : '';

  let lots = '';
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const nw = gridToScreen(c, r, grid), ne = gridToScreen(c + 1, r, grid);
      const se = gridToScreen(c + 1, r + 1, grid), sw = gridToScreen(c, r + 1, grid);
      const alt = (r + c) % 2 === 0;
      lots += `<polygon points="${n(nw.x)},${n(nw.y)} ${n(ne.x)},${n(ne.y)} ${n(se.x)},${n(se.y)} ${n(sw.x)},${n(sw.y)}"
        fill="${alt ? lightenHex(p.grass, 0.12) : darkenHex(p.grass, 0.10)}" opacity="0.24" stroke="${p.border}" stroke-width="0.30" stroke-opacity="0.48"/>`;
    }
  }

  return `<g>
  <polygon points="${pts}" fill="url(#dcGround)" stroke="${p.border}" stroke-width="0.9"/>
  <polygon points="${n(terrain.back.x)},${n(terrain.back.y + 16)} ${n(terrain.right.x)},${n(terrain.right.y + 16)} ${n(terrain.right.x - 12)},${n(terrain.right.y + 32)} ${n(terrain.back.x + 12)},${n(terrain.back.y + 32)}" fill="${p.haze}" opacity="0.55"/>
  ${river}${lots}${gridLines}
</g>`;
}

// ── 도로 ──────────────────────────────────

function renderRoads(grid: GridInfo, p: Palette): string {
  const outer = loopCorners(grid, 1.08);
  const inner = loopCorners(grid, 0.48);
  const op = (pad: { back: Pt; right: Pt; front: Pt; left: Pt }): string =>
    `M ${n(pad.back.x)} ${n(pad.back.y)} L ${n(pad.right.x)} ${n(pad.right.y)} L ${n(pad.front.x)} ${n(pad.front.y)} L ${n(pad.left.x)} ${n(pad.left.y)} Z`;

  const outerPath = op(outer), innerPath = op(inner);

  const crosswalk = (x: number, y: number, w: number, h: number, rot: number): string =>
    `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">${[0, 1, 2, 3].map(i =>
      `<rect x="${n(-w/2)}" y="${n(-h/2 + i*(h/4) + 0.3)}" width="${n(w)}" height="0.8" fill="#f8fafc" opacity="0.58"/>`
    ).join('')}</g>`;

  const lights = [
    { x: outer.back.x - 11, y: outer.back.y + 5 },
    { x: outer.right.x - 6, y: outer.right.y + 10 },
    { x: outer.front.x + 11, y: outer.front.y - 3 },
    { x: outer.left.x + 5, y: outer.left.y - 9 },
  ];

  return `<g>
  <path d="${outerPath}" fill="none" stroke="${darkenHex(p.road, 0.22)}" stroke-width="20" opacity="0.28"/>
  <path d="${innerPath}" fill="none" stroke="${darkenHex(p.road, 0.22)}" stroke-width="16" opacity="0.24"/>
  <path id="dcRoadOuter" d="${outerPath}" fill="none" stroke="url(#dcAsphalt)" stroke-width="17" opacity="0.82"/>
  <path id="dcRoadInner" d="${innerPath}" fill="none" stroke="url(#dcAsphalt)" stroke-width="14" opacity="0.76"/>
  <path d="${outerPath}" fill="none" stroke="url(#dcNoise)" stroke-width="17" opacity="0.38"/>
  <path d="${innerPath}" fill="none" stroke="url(#dcNoise)" stroke-width="14" opacity="0.32"/>
  <path d="${outerPath}" fill="none" stroke="${p.lane}" stroke-width="1.1" opacity="0.48" stroke-dasharray="9 8"/>
  <path d="${innerPath}" fill="none" stroke="${p.lane}" stroke-width="1.0" opacity="0.40" stroke-dasharray="6 7"/>
  ${crosswalk(outer.back.x - 2, outer.back.y + 1, 9, 7, -32)}
  ${crosswalk(outer.right.x - 2, outer.right.y + 4, 9, 7, 32)}
  ${crosswalk(outer.front.x + 4, outer.front.y + 1, 9, 7, -32)}
  ${crosswalk(outer.left.x + 2, outer.left.y - 2, 9, 7, 32)}
  ${lights.map((l, i) => `<g>
    <line x1="${n(l.x)}" y1="${n(l.y)}" x2="${n(l.x)}" y2="${n(l.y - 10)}" stroke="${darkenHex(p.border, 0.22)}" stroke-width="1"/>
    <circle cx="${n(l.x)}" cy="${n(l.y - 11)}" r="2.0" fill="${i % 2 === 0 ? '#ffdda0' : '#c4d8ff'}" opacity="0.80" filter="url(#dcLampGlow)"/>
    <circle cx="${n(l.x)}" cy="${n(l.y - 11)}" r="4.5" fill="${i % 2 === 0 ? '#ffcc80' : '#a8c8ff'}" opacity="0.22"/>
  </g>`).join('')}
</g>`;
}

// ── 건물 기하 도형 헬퍼 ──────────────────

function prism(cx: number, cy: number, hw: number, hd: number, h: number, top: string, right: string, left: string, outline: string): string {
  return `<polygon points="${n(cx)},${n(cy-h)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-2*hd-h)} ${n(cx-hw)},${n(cy-hd-h)}" fill="${top}" stroke="${outline}" stroke-width="0.5"/>
  <polygon points="${n(cx)},${n(cy)} ${n(cx+hw)},${n(cy-hd)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-h)}" fill="${right}" stroke="${outline}" stroke-width="0.5"/>
  <polygon points="${n(cx)},${n(cy)} ${n(cx)},${n(cy-h)} ${n(cx-hw)},${n(cy-hd-h)} ${n(cx-hw)},${n(cy-hd)}" fill="${left}" stroke="${outline}" stroke-width="0.5"/>`;
}

function hipRoof(cx: number, cy: number, hw: number, hd: number, h: number, ridgeH: number, rCol: string, lCol: string, outline: string): string {
  const ax = cx, ay = cy - h;
  const bx = cx + hw, by = cy - hd - h;
  const dx = cx - hw, dy = cy - hd - h;
  const px = cx, py = cy - hd - h - ridgeH;
  return (
    `<polygon points="${n(ax)},${n(ay)} ${n(bx)},${n(by)} ${n(px)},${n(py)}" fill="${rCol}" stroke="${outline}" stroke-width="0.5"/>` +
    `<polygon points="${n(ax)},${n(ay)} ${n(dx)},${n(dy)} ${n(px)},${n(py)}" fill="${lCol}" stroke="${outline}" stroke-width="0.5"/>`
  );
}

function isoSpire(cx: number, cy: number, hw: number, hd: number, h: number, spH: number, rCol: string, lCol: string, outline: string): string {
  const sw = hw * 0.12, sd = hd * 0.12;
  const bx = cx + sw, by = cy - sd - h;
  const dx = cx - sw, dy = cy - sd - h;
  const py = by - spH;
  return (
    `<polygon points="${n(cx)},${n(cy-h)} ${n(bx)},${n(by)} ${n(cx)},${n(py)}" fill="${rCol}" stroke="${outline}" stroke-width="0.4"/>` +
    `<polygon points="${n(cx)},${n(cy-h)} ${n(dx)},${n(dy)} ${n(cx)},${n(py)}" fill="${lCol}" stroke="${outline}" stroke-width="0.4"/>`
  );
}

function isoDome(baseCX: number, baseCY: number, rx: number, ry: number, domeH: number, col: string, outline: string): string {
  const steps = 8;
  let svg = '';
  for (let i = 0; i <= steps; i++) {
    const t = i / steps;
    const r = Math.sqrt(1 - t * t);
    const ey = baseCY - domeH * t;
    const bright = lightenHex(col, t * 0.36);
    svg += `<ellipse cx="${n(baseCX)}" cy="${n(ey)}" rx="${n(rx * r)}" ry="${n(ry * r)}" fill="${bright}" stroke="${i === 0 ? outline : 'none'}" stroke-width="0.4" opacity="${(0.88 + t * 0.10).toFixed(2)}"/>`;
  }
  return svg;
}

// ── 건물 본체 렌더링 ─────────────────────

function renderBuildingBody(
  type: BuildingType,
  isDormant: boolean,
  kit: number,
  pos: Pt,
  hw: number, hd: number, h: number,
  top: string, right: string, left: string,
  outline: string
): string {
  const cx = pos.x, cy = pos.y;

  if (isDormant) {
    return (
      prism(cx - hw * 0.14, cy, hw * 0.72, hd * 0.70, h * 0.50, top, right, left, outline) +
      prism(cx + hw * 0.38, cy + hd * 0.10, hw * 0.38, hd * 0.36, h * 0.26,
        darkenHex(top, 0.12), darkenHex(right, 0.14), darkenHex(left, 0.16), outline) +
      `<line x1="${n(cx - hw*0.14)}" y1="${n(cy - h*0.50)}" x2="${n(cx + hw*0.20)}" y2="${n(cy - h*0.58)}" stroke="${darkenHex(outline, 0.2)}" stroke-width="0.6" opacity="0.5"/>`
    );
  }

  switch (type) {
    // 쇼핑몰: 넓고 낮은 베이스 + 유리 아트리움 타워 + hip 지붕
    case 'mall': {
      const bh = h * 0.42;
      const aw = hw * 0.52, ad = hd * 0.48, ah = h * 0.48;
      const aT = lightenHex(top, 0.24), aR = lightenHex(right, 0.16), aL = lightenHex(left, 0.10);
      return (
        prism(cx, cy, hw, hd, bh, top, right, left, outline) +
        prism(cx, cy - bh, aw, ad, ah, aT, aR, aL, outline) +
        hipRoof(cx, cy - bh, aw, ad, ah, ah * 0.38, lightenHex(aR, 0.32), lightenHex(aL, 0.20), outline)
      );
    }

    // 공장: 넓고 낮은 셰드 + 아주 높은 굴뚝
    case 'factory': {
      const mh = h * 0.58;
      const cw = hw * 0.14, cd = hd * 0.13, ch = h * 1.15;
      return (
        prism(cx, cy, hw, hd, mh, top, right, left, outline) +
        prism(cx + hw * 0.68, cy - hd * 0.06, cw, cd, ch,
          darkenHex(top, 0.05), darkenHex(right, 0.15), darkenHex(left, 0.20), outline) +
        `<ellipse cx="${n(cx + hw*0.68)}" cy="${n(cy - hd*0.06 - cd*2 - ch)}" rx="${n(cw*1.6)}" ry="${n(cd*1.6)}" fill="${darkenHex(top, 0.04)}" stroke="${outline}" stroke-width="0.5" opacity="0.82"/>` +
        // 연기
        `<ellipse cx="${n(cx + hw*0.68)}" cy="${n(cy - hd*0.06 - cd*2 - ch - 8)}" rx="${n(cw*2.2)}" ry="${n(cd*2.4)}" fill="#a0a8b0" opacity="0.28"/>`
      );
    }

    // 창고: 매우 낮고 넓음 + 큰 hip 경사 지붕
    case 'warehouse': {
      const wh = h * 0.36;
      return (
        prism(cx, cy, hw, hd, wh, top, right, left, outline) +
        hipRoof(cx, cy, hw, hd, wh, wh * 0.34, lightenHex(right, 0.26), lightenHex(left, 0.18), outline)
      );
    }

    // 차고/정비소: L자형 (낮은 앞동 + 높은 뒷동)
    case 'garage': {
      const fh = h * 0.70, rh = h;
      const rw = hw * 0.48, rd = hd * 0.44;
      return (
        prism(cx + hw * 0.44, cy - hd * 0.14, rw, rd, rh,
          lightenHex(top, 0.08), darkenHex(right, 0.08), darkenHex(left, 0.13), outline) +
        prism(cx - hw * 0.12, cy, hw * 0.86, hd * 0.82, fh, top, right, left, outline) +
        hipRoof(cx - hw * 0.12, cy, hw * 0.86, hd * 0.82, fh, fh * 0.28,
          lightenHex(right, 0.26), lightenHex(left, 0.18), outline)
      );
    }

    // 연구소: 박스 본체 + 크고 뚜렷한 반구 돔
    case 'lab': {
      const bh = h * 0.66;
      const domeCX = cx - hw * 0.12;
      const domeCY = cy - hd - bh;
      return (
        prism(cx, cy, hw, hd, bh, top, right, left, outline) +
        isoDome(domeCX, domeCY, hw * 0.54, hd * 0.52, h * 0.62, lightenHex(top, 0.28), outline)
      );
    }

    // 도서관: 전통 박스 + 큰 hip 경사 지붕
    case 'library': {
      return (
        prism(cx, cy, hw, hd, h, top, right, left, outline) +
        hipRoof(cx, cy, hw, hd, h, h * 0.40, lightenHex(right, 0.30), lightenHex(left, 0.22), outline)
      );
    }

    // 오락실: 3단 계단형 지구라트 + 첨탑
    case 'arcade': {
      const t1h = h * 0.30, t2h = h * 0.28, t3h = h * 0.34;
      return (
        prism(cx, cy,          hw,        hd,        t1h, top, right, left, outline) +
        prism(cx, cy - t1h,    hw * 0.74, hd * 0.72, t2h,
          lightenHex(top, 0.10), darkenHex(right, 0.02), darkenHex(left, 0.05), outline) +
        prism(cx, cy-t1h-t2h,  hw * 0.50, hd * 0.48, t3h,
          lightenHex(top, 0.20), lightenHex(right, 0.10), lightenHex(left, 0.08), outline) +
        isoSpire(cx, cy-t1h-t2h, hw * 0.50, hd * 0.48, t3h, h * 0.32,
          lightenHex(top, 0.38), lightenHex(left, 0.20), outline)
      );
    }

    // 통신사/앱: 넓은 좌대 + 아주 좁고 높은 타워 + 첨탑
    case 'telecom': {
      const pedH = h * 0.16;
      const tw = hw * 0.34, td = hd * 0.32, tH = h * 0.88;
      const pw = hw * 0.24, pd = hd * 0.22;
      return (
        prism(cx, cy, hw * 0.76, hd * 0.72, pedH,
          darkenHex(top, 0.06), darkenHex(right, 0.10), darkenHex(left, 0.14), outline) +
        prism(cx, cy - pedH, tw, td, tH,
          lightenHex(top, 0.08), darkenHex(right, 0.02), darkenHex(left, 0.07), outline) +
        prism(cx - hw * 0.46, cy - pedH - tH * 0.36, pw, pd, tH * 0.22,
          lightenHex(top, 0.14), darkenHex(right, 0.06), darkenHex(left, 0.10), outline) +
        prism(cx + hw * 0.46, cy - pedH - tH * 0.36 - hd * 0.12, pw, pd, tH * 0.22,
          lightenHex(top, 0.16), darkenHex(right, 0.04), darkenHex(left, 0.08), outline) +
        isoSpire(cx, cy - pedH, tw, td, tH, h * 0.40,
          lightenHex(top, 0.42), lightenHex(left, 0.24), outline)
      );
    }

    // 시청: 좌우 날개 + 중앙 높은 블록 + 크고 뚜렷한 돔
    case 'cityhall': {
      const wW = hw * 0.46, wD = hd * 0.42, wH = h * 0.66;
      const cW = hw * 0.52, cD = hd * 0.48;
      const domeCX = cx, domeCY = cy - cD - h;
      return (
        prism(cx - hw * 0.52, cy + hd * 0.04, wW, wD, wH, top, darkenHex(right, 0.05), darkenHex(left, 0.09), outline) +
        prism(cx + hw * 0.52, cy - hd * 0.04, wW, wD, wH, lightenHex(top, 0.06), darkenHex(right, 0.03), darkenHex(left, 0.07), outline) +
        prism(cx, cy, cW, cD, h, lightenHex(top, 0.14), top, darkenHex(left, 0.04), outline) +
        isoDome(domeCX, domeCY, cW * 0.82, cD * 0.82, h * 0.50, lightenHex(top, 0.32), outline)
      );
    }

    case 'ruin':
      return prism(cx, cy, hw * 0.64, hd * 0.60, h * 0.54, top, right, left, outline);

    // 기타: 해시 기반 3가지 형태
    default: {
      const v = kit % 3;
      if (v === 0) {
        return (
          prism(cx, cy, hw, hd, h, top, right, left, outline) +
          hipRoof(cx, cy, hw, hd, h, h * 0.28, lightenHex(right, 0.26), lightenHex(left, 0.18), outline)
        );
      }
      if (v === 1) {
        const rW = hw * 0.46, rD = hd * 0.42, rH = h * 0.58;
        return (
          prism(cx + hw * 0.46, cy - hd * 0.14, rW, rD, rH,
            lightenHex(top, 0.08), darkenHex(right, 0.07), darkenHex(left, 0.12), outline) +
          prism(cx - hw * 0.12, cy, hw * 0.84, hd * 0.80, h, top, right, left, outline) +
          hipRoof(cx - hw * 0.12, cy, hw * 0.84, hd * 0.80, h, h * 0.26,
            lightenHex(right, 0.24), lightenHex(left, 0.16), outline)
        );
      }
      return (
        prism(cx - hw * 0.32, cy + hd * 0.04, hw * 0.58, hd * 0.54, h * 0.72,
          top, darkenHex(right, 0.05), darkenHex(left, 0.08), outline) +
        prism(cx + hw * 0.30, cy - hd * 0.04, hw * 0.58, hd * 0.54, h,
          lightenHex(top, 0.10), darkenHex(right, 0.02), darkenHex(left, 0.05), outline) +
        hipRoof(cx + hw * 0.30, cy - hd * 0.04, hw * 0.58, hd * 0.54, h, h * 0.24,
          lightenHex(right, 0.22), lightenHex(left, 0.14), outline)
      );
    }
  }
}

// ── 건물 타입 전용 장식 ──────────────────

function getMassProfile(type: BuildingType, zone: BuildingZone): {
  hwScale: number; hdScale: number; hScale: number;
  facade: 'grid' | 'ribs' | 'panels' | 'stack' | 'sparse';
} {
  switch (type) {
    case 'factory':      return { hwScale: 1.30, hdScale: 1.22, hScale: 0.70, facade: 'panels' };
    case 'warehouse':    return { hwScale: 1.36, hdScale: 1.18, hScale: 0.66, facade: 'panels' };
    case 'garage':       return { hwScale: 1.24, hdScale: 1.10, hScale: 0.76, facade: 'stack'  };
    case 'mall':         return { hwScale: 1.24, hdScale: 1.12, hScale: 0.88, facade: 'ribs'   };
    case 'arcade':       return { hwScale: 1.10, hdScale: 1.04, hScale: 1.06, facade: 'ribs'   };
    case 'telecom':      return { hwScale: 0.98, hdScale: 0.96, hScale: 1.30, facade: 'grid'   };
    case 'lab':          return { hwScale: 1.06, hdScale: 1.02, hScale: 1.04, facade: 'grid'   };
    case 'cityhall':     return { hwScale: 1.20, hdScale: 1.10, hScale: 1.08, facade: 'sparse' };
    case 'library':      return { hwScale: 1.12, hdScale: 1.06, hScale: 0.92, facade: 'sparse' };
    default:
      if (zone === 'industrial') return { hwScale: 1.22, hdScale: 1.14, hScale: 0.80, facade: 'panels' };
      if (zone === 'commercial') return { hwScale: 1.08, hdScale: 1.02, hScale: 1.06, facade: 'grid'   };
      if (zone === 'civic')      return { hwScale: 1.16, hdScale: 1.08, hScale: 1.04, facade: 'sparse' };
      return { hwScale: 1.04, hdScale: 1.00, hScale: 0.96, facade: 'stack' };
  }
}

function renderTypeAccessory(
  building: CityBuilding,
  zone: BuildingZone,
  detail: 'high' | 'mid' | 'low',
  pos: Pt, hw: number, hd: number, h: number,
  p: Palette
): string {
  if (detail === 'low') return '';
  const cx = pos.x, cy = pos.y;
  const topY = cy - hd - h;
  const accent = building.isDormant ? '#6b7280' : building.info.colorAccent;

  const rfPoly = (u1: number, u2: number, v1: number, v2: number, fill: string, opacity: number, stroke?: string): string =>
    `<polygon points="${n(cx+u1*hw)},${n(cy-u1*hd-v1*h)} ${n(cx+u2*hw)},${n(cy-u2*hd-v1*h)} ${n(cx+u2*hw)},${n(cy-u2*hd-v2*h)} ${n(cx+u1*hw)},${n(cy-u1*hd-v2*h)}"
      fill="${fill}" opacity="${opacity.toFixed(2)}"${stroke ? ` stroke="${stroke}" stroke-width="0.6"` : ''}/>`;

  switch (building.buildingType) {
    case 'factory': {
      const door = rfPoly(0.06, 0.54, 0.0, 0.28, '#1a2330', 0.80, '#3d5065');
      let stripes = '';
      for (let i = 1; i <= 4; i++) {
        const sv = i * 0.058;
        stripes += `<line x1="${n(cx+hw*0.06)}" y1="${n(cy-hd*0.06-sv*h)}" x2="${n(cx+hw*0.54)}" y2="${n(cy-hd*0.54-sv*h)}" stroke="#2d3e52" stroke-width="0.55" opacity="0.92"/>`;
      }
      const chimBase = `<ellipse cx="${n(cx - hw*0.32)}" cy="${n(cy + hd*0.18)}" rx="4.4" ry="1.8" fill="#98a3af" opacity="0.82"/>
        <rect x="${n(cx - hw*0.36)}" y="${n(cy - 2.6)}" width="7.6" height="2.4" rx="0.5" fill="#8a96a3" opacity="0.80"/>`;
      return chimBase + door + stripes;
    }
    case 'warehouse': {
      let docks = '';
      for (let i = 0; i < 3; i++) {
        const u1 = 0.04 + i * 0.30, u2 = u1 + 0.24;
        docks += rfPoly(u1, u2, 0.0, 0.24, '#1c2a38', 0.76, '#384d60');
        for (let s = 1; s <= 3; s++) {
          const sv = s * 0.058;
          docks += `<line x1="${n(cx+u1*hw)}" y1="${n(cy-u1*hd-sv*h)}" x2="${n(cx+u2*hw)}" y2="${n(cy-u2*hd-sv*h)}" stroke="#2d3e52" stroke-width="0.52" opacity="0.88"/>`;
        }
      }
      return docks;
    }
    case 'garage': {
      const door = rfPoly(0.06, 0.60, 0.0, 0.34, '#2a3240', 0.76, '#4a5870');
      let stripes = '';
      for (let i = 1; i <= 5; i++) {
        const sv = i * 0.054;
        stripes += `<line x1="${n(cx+hw*0.06)}" y1="${n(cy-hd*0.06-sv*h)}" x2="${n(cx+hw*0.60)}" y2="${n(cy-hd*0.60-sv*h)}" stroke="#3d5068" stroke-width="0.54" opacity="0.90"/>`;
      }
      return door + stripes;
    }
    case 'mall': {
      const entrance = rfPoly(0.04, 0.56, 0.0, 0.30, lightenHex(accent, 0.58), 0.66, lightenHex(accent, 0.38));
      const canopy = `<line x1="${n(cx+hw*0.04)}" y1="${n(cy-hd*0.04-h*0.30)}" x2="${n(cx+hw*0.56)}" y2="${n(cy-hd*0.56-h*0.30)}" stroke="${accent}" stroke-width="1.5" opacity="0.84"/>`;
      const strip = `<rect x="${n(cx - hw*0.46)}" y="${n(cy + hd*0.14)}" width="${n(hw*0.92)}" height="1.3" rx="0.5" fill="#eef2ff" opacity="0.78"/>`;
      return entrance + canopy + strip;
    }
    case 'arcade': {
      const sign = rfPoly(0.04, 0.58, 0.42, 0.56, accent, 0.74, lightenHex(accent, 0.42));
      const glow = detail === 'high'
        ? `<polygon points="${n(cx+hw*0.04)},${n(cy-hd*0.04-h*0.42)} ${n(cx+hw*0.58)},${n(cy-hd*0.58-h*0.42)} ${n(cx+hw*0.58)},${n(cy-hd*0.58-h*0.56)} ${n(cx+hw*0.04)},${n(cy-hd*0.04-h*0.56)}"
          fill="${lightenHex(accent, 0.72)}" opacity="0.30" filter="url(#dcGlow)"/>` : '';
      return sign + glow;
    }
    case 'telecom': {
      return detail === 'high'
        ? `<ellipse cx="${n(cx + hw*0.24)}" cy="${n(topY + h*0.14)}" rx="${n(hw*0.18)}" ry="${n(hd*0.26)}" fill="#d0dff0" opacity="0.82" stroke="${p.outline}" stroke-width="0.5"/>
          <line x1="${n(cx + hw*0.24)}" y1="${n(topY + h*0.14)}" x2="${n(cx + hw*0.16)}" y2="${n(topY + h*0.24)}" stroke="#8aaccb" stroke-width="1.0" opacity="0.78"/>` : '';
    }
    case 'lab': {
      const portR = hw * 0.14;
      const portCX = cx + hw * 0.34, portCY = cy - hd * 0.34 - h * 0.60;
      return detail === 'high'
        ? `<ellipse cx="${n(portCX)}" cy="${n(portCY)}" rx="${n(portR)}" ry="${n(portR * 0.60)}" fill="#98c8ff" opacity="0.78" stroke="${p.outline}" stroke-width="0.6"/>
          <ellipse cx="${n(portCX)}" cy="${n(portCY)}" rx="${n(portR * 0.56)}" ry="${n(portR * 0.34)}" fill="white" opacity="0.34"/>` : '';
    }
    case 'cityhall': {
      const arch = rfPoly(0.04, 0.52, 0.0, 0.38, '#1a1f2a', 0.62, '#3d4a5c');
      let cols = '';
      for (const cu of [0.07, 0.19, 0.30, 0.42]) {
        cols += rfPoly(cu, cu + 0.03, 0.0, 0.38, '#dde5ef', 0.86, p.outline);
      }
      const steps = `<polygon points="${n(cx - hw*0.34)},${n(cy + hd*0.20)} ${n(cx + hw*0.34)},${n(cy + hd*0.20)} ${n(cx + hw*0.26)},${n(cy + hd*0.34)} ${n(cx - hw*0.26)},${n(cy + hd*0.34)}"
        fill="#e8d9c0" opacity="0.82"/>`;
      return arch + cols + steps;
    }
    case 'library': {
      const arch = rfPoly(0.04, 0.56, 0.0, 0.34, '#1a1f2a', 0.54, '#3d4a5c');
      let cols = '';
      for (const cu of [0.08, 0.24, 0.42]) {
        cols += rfPoly(cu, cu + 0.04, 0.0, 0.42, '#dde5ef', 0.84, p.outline);
      }
      const steps = `<polygon points="${n(cx - hw*0.38)},${n(cy + hd*0.22)} ${n(cx + hw*0.38)},${n(cy + hd*0.22)} ${n(cx + hw*0.30)},${n(cy + hd*0.36)} ${n(cx - hw*0.30)},${n(cy + hd*0.36)}"
        fill="#f5efe1" opacity="0.80"/>`;
      return arch + cols + steps;
    }
    case 'ruin': {
      return detail === 'high'
        ? rfPoly(0.14, 0.36, 0.28, 0.50, '#1a2030', 0.57, '#2d3a4a') +
          `<line x1="${n(cx+hw*0.14)}" y1="${n(cy-hd*0.14-h*0.28)}" x2="${n(cx+hw*0.36)}" y2="${n(cy-hd*0.36-h*0.50)}" stroke="#3a4a5c" stroke-width="0.8" opacity="0.74"/>` : '';
    }
    default:
      if (zone === 'residential' && detail === 'high') {
        return `<circle cx="${n(cx - hw*0.58)}" cy="${n(cy + hd*0.22)}" r="1.9" fill="#48a86a" opacity="0.84"/>
          <circle cx="${n(cx + hw*0.54)}" cy="${n(cy - hd*0.16)}" r="1.8" fill="#4cba70" opacity="0.82"/>`;
      }
      return '';
  }
}

// ── 건물 렌더링 ──────────────────────────

function renderBuilding(
  building: CityBuilding,
  grid: GridInfo,
  p: Palette,
  isNeon: boolean,
  idx: number,
  totalBuildings: number
): string {
  const pos = gridToScreen(building.gridCol, building.gridRow, grid);
  const zone = getZone(building.buildingType);
  const profile = getMassProfile(building.buildingType, zone);
  const modelKit = hashCode(`${building.repoName}:${building.buildingType}`) % 24;
  const depth = clamp((building.gridCol + building.gridRow) / Math.max(1, grid.cols + grid.rows - 2), 0, 1);
  const densityPenalty = totalBuildings >= 26 ? 0.28 : totalBuildings >= 18 ? 0.16 : totalBuildings >= 12 ? 0.08 : 0;
  const lodScore = clamp(depth + densityPenalty, 0, 1.15);
  const detail: 'high' | 'mid' | 'low' = lodScore > 0.90 ? 'low' : lodScore > 0.62 ? 'mid' : 'high';
  const nearBoost = 1 - depth * 0.18;

  let hw = 24, hd = 12;
  let h = clamp(building.height, 46, 146);
  hw *= profile.hwScale;
  hd *= profile.hdScale;
  h  *= profile.hScale * nearBoost;

  const base   = building.isDormant ? '#6b7280' : building.info.colorMain;
  const top    = building.isDormant ? '#9aa3ae' : lightenHex(base, 0.56);
  const right  = building.isDormant ? '#7a8490' : darkenHex(base, 0.03);
  const left   = building.isDormant ? '#525e6a' : darkenHex(base, 0.44);
  const lotFill = zone === 'industrial' ? '#8aaa7a' : zone === 'commercial' ? '#88aac8' : zone === 'civic' ? '#a0aac8' : '#78aa68';

  const body = renderBuildingBody(building.buildingType, building.isDormant, modelKit, pos, hw, hd, h, top, right, left, p.outline);

  const platH = 4;
  const lot = `<g opacity="0.34">${prism(pos.x, pos.y + platH, hw * 1.10, hd * 1.10, platH,
    lightenHex(lotFill, 0.10), darkenHex(lotFill, 0.24), darkenHex(lotFill, 0.32), p.outline)}</g>`;

  const lotProps = detail === 'low' ? '' : zone === 'residential'
    ? `<circle cx="${n(pos.x - hw*0.62)}" cy="${n(pos.y + hd*0.20)}" r="2.9" fill="#3ea866" opacity="0.82"/>
      <circle cx="${n(pos.x + hw*0.58)}" cy="${n(pos.y - hd*0.16)}" r="2.6" fill="#48ba6e" opacity="0.76"/>`
    : zone === 'commercial'
      ? `<rect x="${n(pos.x - hw*0.54)}" y="${n(pos.y + hd*0.14)}" width="${n(hw*0.22)}" height="3.6" rx="0.7" fill="#d6e2f6" opacity="0.68"/>
        <rect x="${n(pos.x + hw*0.32)}" y="${n(pos.y - hd*0.22)}" width="${n(hw*0.24)}" height="3.6" rx="0.7" fill="#d6e2f6" opacity="0.68"/>`
      : zone === 'industrial'
        ? `<rect x="${n(pos.x - hw*0.56)}" y="${n(pos.y + hd*0.06)}" width="${n(hw*0.36)}" height="2.5" rx="0.5" fill="#8b98a4" opacity="0.68"/>
          <rect x="${n(pos.x + hw*0.24)}" y="${n(pos.y - hd*0.22)}" width="${n(hw*0.32)}" height="2.5" rx="0.5" fill="#8b98a4" opacity="0.68"/>`
        : `<circle cx="${n(pos.x - hw*0.50)}" cy="${n(pos.y + hd*0.12)}" r="2.5" fill="#c4d2e8" opacity="0.78"/>
          <circle cx="${n(pos.x + hw*0.46)}" cy="${n(pos.y - hd*0.18)}" r="2.5" fill="#c4d2e8" opacity="0.78"/>`;

  // 창문 렌더링
  const rowsBase = detail === 'high' ? 7 : detail === 'mid' ? 5 : 3;
  const colsBase = detail === 'high' ? 4 : detail === 'mid' ? 3 : 2;
  const rows = Math.min(rowsBase, Math.max(1, Math.floor(h / (detail === 'low' ? 24 : 18))));
  const facadeType = profile.facade;
  const colsRaw = facadeType === 'grid' ? colsBase : facadeType === 'ribs' ? Math.max(2, colsBase - 1) : facadeType === 'panels' ? Math.max(2, colsBase - 1) : 2;
  const cols = detail === 'low' ? Math.min(2, colsRaw) : colsRaw;
  const wu = facadeType === 'grid' ? (detail === 'high' ? 0.092 : 0.108) : facadeType === 'ribs' ? 0.112 : facadeType === 'panels' ? 0.122 : 0.158;
  const wv = 0.058;
  const uStart = facadeType === 'sparse' ? 0.20 : 0.12;
  const uStep = cols > 1 ? ((facadeType === 'sparse' ? 0.56 : 0.66) - wu) / (cols - 1) : 0;
  const bodyH = profile.hScale < 0.76 ? 0.46 : profile.hScale < 0.92 ? 0.64 : 0.78;

  let windows = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (facadeType === 'stack'  && c === 1 && r % 2 === 1) continue;
      if (facadeType === 'sparse' && (r % 2 === 1 || c === 1)) continue;
      if (detail === 'low' && r % 2 === 1) continue;
      const u = uStart + c * uStep;
      const v = 0.12 + r * ((bodyH - 0.12) / Math.max(1, rows));
      const lit = !building.isDormant && (r + c + modelKit) % 4 !== 0;
      const baseOp = zone === 'industrial' ? 0.36 : 0.64;
      const op = building.isDormant ? 0.12 : lit ? baseOp + (r % 2) * 0.14 : 0.07;
      const winStroke = lit ? lightenHex(p.window, 0.40) : darkenHex(p.window, 0.18);

      const mkWin = (ux: number, sign: number): string => {
        const x1 = pos.x + sign * ux * hw, y1 = pos.y - ux * hd - v * h;
        const x2 = pos.x + sign * (ux + wu) * hw, y2 = pos.y - (ux + wu) * hd - v * h;
        const x3 = pos.x + sign * (ux + wu) * hw, y3 = pos.y - (ux + wu) * hd - (v + wv) * h;
        const x4 = pos.x + sign * ux * hw, y4 = pos.y - ux * hd - (v + wv) * h;
        const winOp = sign === 1 ? op : op * 0.72;
        return `<polygon points="${n(x1)},${n(y1)} ${n(x2)},${n(y2)} ${n(x3)},${n(y3)} ${n(x4)},${n(y4)}"
          fill="${p.window}" opacity="${clamp(winOp, 0.05, 0.88).toFixed(2)}" stroke="${winStroke}" stroke-width="0.5" class="dc-win"/>`;
      };
      windows += mkWin(u, 1) + mkWin(u, -1);
    }
  }

  // 수직 리브 (ribs 파사드)
  if (facadeType === 'ribs' && detail === 'high') {
    for (let i = 1; i <= 3; i++) {
      const u = 0.14 + i * 0.16;
      const rx = pos.x + u * hw, lx = pos.x - u * hw;
      const ry1 = pos.y - u * hd - h * 0.08, ry2 = pos.y - u * hd - h * 0.94;
      windows += `<line x1="${n(rx)}" y1="${n(ry1)}" x2="${n(rx)}" y2="${n(ry2)}" stroke="${lightenHex(right, 0.44)}" stroke-width="0.9" opacity="0.52"/>`;
      windows += `<line x1="${n(lx)}" y1="${n(ry1)}" x2="${n(lx)}" y2="${n(ry2)}" stroke="${lightenHex(left, 0.44)}" stroke-width="0.9" opacity="0.45"/>`;
    }
  }

  const glassRight = detail === 'low' ? '' : `<polygon points="${n(pos.x+hw*0.08)},${n(pos.y-hd*0.08-h*0.10)} ${n(pos.x+hw*0.22)},${n(pos.y-hd*0.22-h*0.22)} ${n(pos.x+hw*0.20)},${n(pos.y-hd*0.20-h*0.88)} ${n(pos.x+hw*0.06)},${n(pos.y-hd*0.06-h*0.76)}"
    fill="url(#dcGlass)" opacity="${zone === 'commercial' ? '0.82' : '0.65'}"/>`;
  const glassLeft = detail === 'low' ? '' : `<polygon points="${n(pos.x-hw*0.06)},${n(pos.y-hd*0.06-h*0.14)} ${n(pos.x-hw*0.19)},${n(pos.y-hd*0.19-h*0.24)} ${n(pos.x-hw*0.17)},${n(pos.y-hd*0.17-h*0.80)} ${n(pos.x-hw*0.04)},${n(pos.y-hd*0.04-h*0.70)}"
    fill="url(#dcGlass)" opacity="${zone === 'commercial' ? '0.60' : '0.46'}"/>`;

  const topY = pos.y - hd - h;
  const roofDecor = isNeon && detail !== 'low'
    ? `<rect x="${n(pos.x - 9)}" y="${n(topY - 2)}" width="18" height="2" fill="${p.glow}" opacity="0.48" filter="url(#dcGlow)"/>`
    : '';

  const shortName = building.repoName.length > 13 ? `${building.repoName.slice(0, 13)}…` : building.repoName;
  const badge = building.stars > 0 ? ` ★${building.stars}` : '';
  const label = detail === 'high'
    ? `<text x="${n(pos.x)}" y="${n(pos.y + hd + 13)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.92">${escapeXml(shortName)}${badge}</text>`
    : detail === 'mid'
      ? `<text x="${n(pos.x)}" y="${n(pos.y + hd + 12)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.78">${escapeXml(shortName.slice(0, 8))}</text>`
      : '';

  const shadow = `<ellipse cx="${n(pos.x + 2)}" cy="${n(pos.y + 5)}" rx="${n(hw + 7)}" ry="${n(hd + 4)}" fill="${p.shadow}" opacity="0.34"/>`;
  const depthShade = `<polygon points="${n(pos.x)},${n(pos.y-h)} ${n(pos.x+hw)},${n(pos.y-hd-h)} ${n(pos.x+hw)},${n(pos.y-hd)} ${n(pos.x)},${n(pos.y)}"
    fill="#000" opacity="${(0.05 + depth * 0.12).toFixed(2)}"/>`;
  const depthFog = `<ellipse cx="${n(pos.x)}" cy="${n(pos.y - h*0.44)}" rx="${n(hw*0.76)}" ry="${n(hd*0.56)}" fill="#fff" opacity="${(0.02 + depth * 0.06).toFixed(2)}"/>`;
  const accessory = renderTypeAccessory(building, zone, detail, pos, hw, hd, h, p);

  return `<g style="animation-delay:${(idx * 0.06).toFixed(2)}s" filter="url(#dcShadow)">
    ${shadow}${lot}${lotProps}${body}${depthShade}${windows}${glassRight}${glassLeft}${depthFog}${accessory}${roofDecor}${label}
  </g>`;
}

function renderBuildings(buildings: CityBuilding[], grid: GridInfo, p: Palette, isNeon: boolean): string {
  if (buildings.length === 0) {
    return `<text x="400" y="260" text-anchor="middle" class="dc-text dc-sub" fill="${p.textMuted}">No buildings yet</text>`;
  }
  const sorted = [...buildings].sort((a, b) => (a.gridCol + a.gridRow) - (b.gridCol + b.gridRow));
  return `<g>${sorted.map((b, i) => renderBuilding(b, grid, p, isNeon, i, buildings.length)).join('')}</g>`;
}

// ── 구역 오버레이 ─────────────────────────

function renderDistrictBlocks(buildings: CityBuilding[], grid: GridInfo, p: Palette): string {
  if (buildings.length === 0) return '';
  const zones = ['residential', 'commercial', 'industrial', 'civic'] as BuildingZone[];
  const zoneColor = (z: BuildingZone) =>
    z === 'industrial' ? '#f0ba62' : z === 'commercial' ? '#77b9ff' : z === 'civic' ? '#d8b4fe' : '#8fe19b';
  const zoneLabel = (z: BuildingZone) =>
    z === 'industrial' ? 'IND' : z === 'commercial' ? 'COM' : z === 'civic' ? 'CIV' : 'RES';

  let out = '';
  for (const z of zones) {
    const items = buildings.filter(b => getZone(b.buildingType) === z);
    if (items.length === 0) continue;
    const pts = items.map(b => gridToScreen(b.gridCol, b.gridRow, grid));
    const minX = Math.min(...pts.map(pt => pt.x)), maxX = Math.max(...pts.map(pt => pt.x));
    const minY = Math.min(...pts.map(pt => pt.y)), maxY = Math.max(...pts.map(pt => pt.y));
    const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
    const padX = 36, padY = 20;
    out += `<polygon points="${n(cx)},${n(minY-padY)} ${n(maxX+padX)},${n(cy)} ${n(cx)},${n(maxY+padY)} ${n(minX-padX)},${n(cy)}"
      fill="${zoneColor(z)}" opacity="0.08" stroke="${zoneColor(z)}" stroke-width="0.8" stroke-dasharray="5 4"/>`;
    out += `<text x="${n(cx)}" y="${n(minY-padY-3)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.72">${zoneLabel(z)}</text>`;
  }
  return `<g>${out}</g>`;
}

function renderSimcityZoning(buildings: CityBuilding[], grid: GridInfo, p: Palette): string {
  let out = '';
  for (const b of buildings) {
    const pos = gridToScreen(b.gridCol, b.gridRow, grid);
    const zone = getZone(b.buildingType);
    const zColor = zone === 'industrial' ? '#f8ca7a' : zone === 'commercial' ? '#7ec1ff' : zone === 'civic' ? '#d7c4ff' : '#8fe19b';
    const zLabel = zone === 'industrial' ? 'I' : zone === 'commercial' ? 'C' : zone === 'civic' ? 'S' : 'R';
    out += `<polygon points="${n(pos.x)},${n(pos.y-11)} ${n(pos.x+22)},${n(pos.y+1)} ${n(pos.x)},${n(pos.y+13)} ${n(pos.x-22)},${n(pos.y+1)}" fill="${zColor}" opacity="0.22"/>
      <text x="${n(pos.x)}" y="${n(pos.y+4)}" text-anchor="middle" class="dc-text dc-small" fill="${p.text}" opacity="0.68">${zLabel}</text>`;
  }
  return `<g>${out}</g>`;
}

// ── 공원 / 나무 ───────────────────────────

function renderParks(grid: GridInfo, p: Palette): string {
  const cells = [
    gridToScreen(-0.62, 0.82, grid),
    gridToScreen(grid.cols - 0.16, grid.rows - 0.26, grid),
    gridToScreen(grid.cols / 2 - 0.22, -0.62, grid),
  ];

  function isoTree(cx: number, cy: number, s: number, dark: string, light: string): string {
    return [
      `<ellipse cx="${n(cx+s*0.08)}" cy="${n(cy-s*0.50)}" rx="${n(s*0.96)}" ry="${n(s*0.48)}" fill="${darkenHex(dark, 0.20)}" opacity="0.82"/>`,
      `<ellipse cx="${n(cx)}" cy="${n(cy-s*0.90)}" rx="${n(s*0.90)}" ry="${n(s*0.45)}" fill="${dark}" opacity="0.94"/>`,
      `<ellipse cx="${n(cx-s*0.08)}" cy="${n(cy-s*1.22)}" rx="${n(s*0.68)}" ry="${n(s*0.34)}" fill="${dark}" opacity="0.92"/>`,
      `<ellipse cx="${n(cx-s*0.12)}" cy="${n(cy-s*1.48)}" rx="${n(s*0.44)}" ry="${n(s*0.22)}" fill="${light}" opacity="0.90"/>`,
      `<rect x="${n(cx-s*0.15)}" y="${n(cy-s*0.09)}" width="${n(s*0.30)}" height="${n(s*0.74)}" rx="${n(s*0.10)}" fill="#5a3810" opacity="0.78"/>`,
    ].join('');
  }

  return `<g>${cells.map(c => `
    <polygon points="${n(c.x)},${n(c.y-13)} ${n(c.x+21)},${n(c.y+1)} ${n(c.x)},${n(c.y+13)} ${n(c.x-21)},${n(c.y+1)}" fill="${p.grass}" opacity="0.54"/>
    ${isoTree(c.x - 5, c.y - 4, 4.6, '#28784a', '#42c266')}
    ${isoTree(c.x + 6, c.y - 2, 3.7, '#226040', '#3aa858')}`).join('')}</g>`;
}

// ── 랜드마크 ──────────────────────────────

function renderLandmarks(tier: CityTier, grid: GridInfo, p: Palette): string {
  const plaza = gridToScreen(grid.cols / 2 - 0.4, grid.rows + 0.48, grid);
  let out = `<ellipse cx="${n(plaza.x)}" cy="${n(plaza.y)}" rx="26" ry="11" fill="#d6e6f2" opacity="0.36" stroke="${p.border}" stroke-width="0.7"/>
    <circle cx="${n(plaza.x)}" cy="${n(plaza.y - 1)}" r="4.5" fill="#88c4ff" opacity="0.58"/>`;
  if (tier.tier >= 3) {
    const wt = gridToScreen(-0.95, -0.16, grid);
    out += `<rect x="${n(wt.x - 2)}" y="${n(wt.y - 34)}" width="4" height="25" fill="#96a5b2" opacity="0.90"/>
      <ellipse cx="${n(wt.x)}" cy="${n(wt.y - 35)}" rx="10" ry="4.5" fill="#b8c6d2" opacity="0.90"/>`;
  }
  if (tier.tier >= 4) {
    const st = gridToScreen(grid.cols + 0.56, 0.12, grid);
    out += `<ellipse cx="${n(st.x)}" cy="${n(st.y - 5)}" rx="22" ry="9" fill="#b2d3ed" opacity="0.36" stroke="#7aa2c4" stroke-width="0.6"/>
      <rect x="${n(st.x - 15)}" y="${n(st.y - 5)}" width="30" height="8" rx="3" fill="#9cbcd6" opacity="0.48"/>`;
  }
  if (tier.tier >= 5) {
    const mon = gridToScreen(grid.cols / 2 + 0.76, -0.96, grid);
    out += `<rect x="${n(mon.x - 5)}" y="${n(mon.y - 30)}" width="10" height="21" fill="#ced8e0" opacity="0.92"/>
      <polygon points="${n(mon.x - 7)},${n(mon.y - 30)} ${n(mon.x)},${n(mon.y - 39)} ${n(mon.x + 7)},${n(mon.y - 30)}" fill="#a2bcd2" opacity="0.94"/>`;
  }
  return `<g>${out}</g>`;
}

// ── 거리 생활 ─────────────────────────────

function renderStreetLife(grid: GridInfo, p: Palette): string {
  const corners = loopCorners(grid, 1.04);
  const props = [
    { x: corners.back.x + 11, y: corners.back.y + 9, s: 1 },
    { x: corners.right.x - 10, y: corners.right.y + 13, s: 0.96 },
    { x: corners.front.x - 6, y: corners.front.y - 1, s: 1.06 },
    { x: corners.left.x + 10, y: corners.left.y - 8, s: 0.92 },
  ];
  return `<g>${props.map((it, i) => `<g transform="translate(${n(it.x)} ${n(it.y)}) scale(${n(it.s)})">
    <ellipse cx="0" cy="2.5" rx="5.0" ry="2.2" fill="${p.shadow}" opacity="0.24"/>
    <rect x="-0.48" y="-6.5" width="0.96" height="8.2" fill="${darkenHex(p.border, 0.22)}"/>
    <rect x="-3.5" y="-7.6" width="7.0" height="1.5" rx="0.5" fill="${lightenHex(p.border, 0.22)}"/>
    ${i % 2 === 0
      ? `<circle cx="2.3" cy="-5.6" r="1.7" fill="#ffd070" opacity="0.30"/><circle cx="2.3" cy="-5.6" r="1.1" fill="#ffd070" opacity="0.94" filter="url(#dcLampGlow)"/>`
      : `<circle cx="-2.3" cy="-5.6" r="1.7" fill="#9cc8ff" opacity="0.30"/><circle cx="-2.3" cy="-5.6" r="1.1" fill="#9cc8ff" opacity="0.94" filter="url(#dcLampGlow)"/>`}
  </g>`).join('')}</g>`;
}

// ── 시간대 ────────────────────────────────

function getTimeBand(now: Date = new Date()): TimeBand {
  const h = now.getHours();
  if (h >= 6 && h < 10)  return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

// ── 교통 ──────────────────────────────────

function renderTraffic(traffic: CityTraffic, grid: GridInfo, p: Palette): string {
  if (traffic.vehicleCount <= 0) return '';
  const timeBand = getTimeBand();
  const rush = timeBand === 'morning' || timeBand === 'evening' || traffic.level >= 3;

  const outer = loopCorners(grid, 1.08);
  const inner = loopCorners(grid, 0.48);
  const outerPath = `M ${n(outer.back.x)} ${n(outer.back.y)} L ${n(outer.right.x)} ${n(outer.right.y)} L ${n(outer.front.x)} ${n(outer.front.y)} L ${n(outer.left.x)} ${n(outer.left.y)} Z`;
  const innerPath = `M ${n(inner.back.x)} ${n(inner.back.y)} L ${n(inner.right.x)} ${n(inner.right.y)} L ${n(inner.front.x)} ${n(inner.front.y)} L ${n(inner.left.x)} ${n(inner.left.y)} Z`;

  const types = [
    { kind: 'bus',   body: '#ff8f3f', accent: '#ffd6a1', w: 15.5, h: 5.4 },
    { kind: 'truck', body: '#5f8cf5', accent: '#b7ccff', w: 14.3, h: 5.2 },
    { kind: 'taxi',  body: '#ffd447', accent: '#fff1b6', w: 11.2, h: 4.6 },
  ] as const;

  let cars = `<path id="dcCarOuter" d="${outerPath}" fill="none" stroke="none"/>
    <path id="dcCarInner" d="${innerPath}" fill="none" stroke="none"/>`;

  for (let i = 0; i < Math.max(2, traffic.vehicleCount); i++) {
    const t = types[i % types.length];
    const laneOuter = i % 2 === 0;
    const path = laneOuter ? '#dcCarOuter' : '#dcCarInner';
    const delay = (i * 1.15 + ((i * 17) % 7) / 10).toFixed(1);
    const baseDur = t.kind === 'taxi' ? 8.5 : t.kind === 'truck' ? 11.2 : 13;
    const dur = (baseDur + (i % 3) * 0.45).toFixed(1);
    const hl = t.w * 0.42, hd2 = t.h * 0.52;
    const yMid = 1.2, yDown = yMid + t.h * 0.7;

    cars += `<g>
      <g>
        <polygon points="0,${n(-hd2)} ${n(hl)},${n(yMid)} 0,${n(hd2)} ${n(-hl)},${n(yMid)}" fill="${t.body}" opacity="0.95"/>
        <polygon points="${n(hl)},${n(yMid)} ${n(hl)},${n(yDown)} 0,${n(yDown+hd2*0.7)} 0,${n(hd2)}" fill="${darkenHex(t.body, 0.18)}" opacity="0.90"/>
        <polygon points="${n(-hl)},${n(yMid)} 0,${n(hd2)} 0,${n(yDown+hd2*0.7)} ${n(-hl)},${n(yDown)}" fill="${darkenHex(t.body, 0.28)}" opacity="0.88"/>
        <polygon points="0,${n(-hd2-1.9)} ${n(hl*0.55)},${n(-1.8)} 0,${n(hd2-1.8)} ${n(-hl*0.55)},${n(-1.8)}" fill="${t.accent}" opacity="0.90"/>
        <ellipse cx="${n(-hl*0.54)}" cy="${n(yDown+0.9)}" rx="1.2" ry="0.65" fill="#1f2937"/>
        <ellipse cx="${n(hl*0.54)}" cy="${n(yDown+0.9)}" rx="1.2" ry="0.65" fill="#1f2937"/>
      </g>
      <animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" rotate="auto">
        <mpath href="${path}"/>
      </animateMotion>
    </g>`;
  }

  const signalCycle = rush ? 8 : 6;
  const signals = `<g>
    <circle cx="${n(outer.back.x - 18)}" cy="${n(outer.back.y + 9)}" r="2.5" fill="#ef4444" opacity="0.44"><animate attributeName="opacity" values="1;0.25;0.25;1" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
    <circle cx="${n(outer.right.x - 11)}" cy="${n(outer.right.y + 15)}" r="2.5" fill="#22c55e" opacity="0.36"><animate attributeName="opacity" values="0.25;1;0.25;0.25" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
    <circle cx="${n(outer.front.x + 17)}" cy="${n(outer.front.y - 2)}" r="2.5" fill="#f59e0b" opacity="0.30"><animate attributeName="opacity" values="0.25;0.25;1;0.25" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
  </g>`;

  return `<g>${cars}${signals}</g>`;
}

// ── 날씨 효과 ─────────────────────────────

function renderWeather(weather: WeatherInfo, p: Palette): string {
  switch (weather.type) {
    case 'sunny':
      return `<g>
        <circle cx="702" cy="70" r="32" fill="#ffd060" opacity="0.10"/>
        <circle cx="702" cy="70" r="24" fill="#ffe070" opacity="0.16"/>
        <line x1="702" y1="36" x2="702" y2="26" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="726" y1="45" x2="733" y2="39" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="738" y1="70" x2="748" y2="70" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="726" y1="95" x2="733" y2="101" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="678" y1="45" x2="671" y2="39" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="666" y1="70" x2="656" y2="70" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <line x1="678" y1="95" x2="671" y2="101" stroke="#ffd060" stroke-width="2.4" stroke-linecap="round" opacity="0.74"/>
        <circle cx="702" cy="70" r="18" fill="#ffd060" opacity="0.96" filter="url(#dcGlow)"/>
      </g>`;
    case 'cloudy':
    case 'cloudy_s':
      return `<g opacity="0.58">
        <ellipse cx="640" cy="72" rx="36" ry="11" fill="#d8e2ee"/>
        <ellipse cx="672" cy="74" rx="26" ry="10" fill="#c2cedd"/>
        <ellipse cx="618" cy="78" rx="20" ry="8" fill="#e0e8f4"/>
      </g>`;
    case 'rainy': {
      let rain = '';
      for (let i = 0; i < 24; i++) {
        const x = 100 + ((i * 37) % 600);
        const d = ((i * 11) % 14) / 10;
        rain += `<line x1="${x}" y1="12" x2="${x - 3}" y2="24" stroke="#7ab8e4" stroke-width="1.1" opacity="0.46"><animate attributeName="transform" values="translate(0,-12);translate(0,420)" dur="1.6s" begin="${d}s" repeatCount="indefinite"/></line>`;
      }
      return `<g>${rain}</g>`;
    }
    case 'snowy': {
      let snow = '';
      for (let i = 0; i < 20; i++) {
        const x = 120 + ((i * 41) % 560);
        const d = ((i * 7) % 20) / 10;
        snow += `<circle cx="${x}" cy="10" r="1.6" fill="#fff" opacity="0.78"><animate attributeName="transform" values="translate(0,-8);translate(18,400)" dur="4.5s" begin="${d}s" repeatCount="indefinite"/></circle>`;
      }
      return `<g>${snow}</g>`;
    }
    case 'rainbow':
      return `<g opacity="0.40">
        <path d="M202,222 A198,198 0 0,1 598,222" fill="none" stroke="#ff5050" stroke-width="4"/>
        <path d="M210,222 A190,190 0 0,1 590,222" fill="none" stroke="#ff9040" stroke-width="4"/>
        <path d="M218,222 A182,182 0 0,1 582,222" fill="none" stroke="#ffd860" stroke-width="4"/>
        <path d="M226,222 A174,174 0 0,1 574,222" fill="none" stroke="#58d68d" stroke-width="4"/>
        <path d="M234,222 A166,166 0 0,1 566,222" fill="none" stroke="#3aa8ff" stroke-width="4"/>
        <path d="M242,222 A158,158 0 0,1 558,222" fill="none" stroke="#9858f0" stroke-width="4"/>
      </g>`;
    case 'fireworks':
      return `<g>
        <circle cx="152" cy="60" r="3.5" fill="#ff7f50" opacity="0.94" filter="url(#dcGlow)"/>
        ${[0,60,120,180,240,300].map((angle, i) => {
          const rad = angle * Math.PI / 180;
          const ex = 152 + Math.cos(rad) * 22, ey = 60 + Math.sin(rad) * 22;
          return `<line x1="152" y1="60" x2="${n(ex)}" y2="${n(ey)}" stroke="#ff8050" stroke-width="1.6" opacity="0.78"><animate attributeName="opacity" values="0.78;0.12;0.78" dur="1.6s" begin="${(i*0.25).toFixed(1)}s" repeatCount="indefinite"/></line>`;
        }).join('')}
        <circle cx="638" cy="48" r="3.5" fill="#6090ff" opacity="0.94" filter="url(#dcGlow)"/>
        ${[30,90,150,210,270,330].map((angle, i) => {
          const rad = angle * Math.PI / 180;
          const ex = 638 + Math.cos(rad) * 20, ey = 48 + Math.sin(rad) * 20;
          return `<line x1="638" y1="48" x2="${n(ex)}" y2="${n(ey)}" stroke="#7090ff" stroke-width="1.6" opacity="0.78"><animate attributeName="opacity" values="0.12;0.78;0.12" dur="1.6s" begin="${(i*0.22).toFixed(1)}s" repeatCount="indefinite"/></line>`;
        }).join('')}
      </g>`;
    case 'volcano':
      return `<g>
        <ellipse cx="390" cy="182" rx="38" ry="15" fill="#a03030" opacity="0.24"/>
        <polygon points="390,100 350,182 430,182" fill="#8a2828" opacity="0.28"/>
        <circle cx="390" cy="100" r="11" fill="#ff5500" opacity="0.50" filter="url(#dcBloom)">
          <animate attributeName="r" values="8;15;8" dur="1.9s" repeatCount="indefinite"/>
          <animate attributeName="opacity" values="0.32;0.64;0.32" dur="1.9s" repeatCount="indefinite"/>
        </circle>
        ${[{cx:383,cy:115,r:4,d:1.4},{cx:397,cy:108,r:3,d:1.8},{cx:388,cy:122,r:3.5,d:2.1}].map(
          ({cx,cy,r,d}) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="#ff7800" opacity="0.44">
            <animate attributeName="cy" values="${cy};${cy-38};${cy}" dur="${d}s" repeatCount="indefinite"/>
            <animate attributeName="opacity" values="0.44;0;0.44" dur="${d}s" repeatCount="indefinite"/>
          </circle>`).join('')}
      </g>`;
    default:
      return '';
  }
}

// ── 헤더 / 푸터 ──────────────────────────

function fmtPop(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000)     return `${(v / 1_000).toFixed(1)}K`;
  return String(v);
}

function renderHeader(username: string, tier: CityTier, weather: WeatherInfo, p: Palette): string {
  return `<g>
  <text x="400" y="24" text-anchor="middle" class="dc-text dc-title" fill="${p.text}">${tier.icon} ${escapeXml(username)}'s Dev City</text>
  <text x="400" y="39" text-anchor="middle" class="dc-text dc-sub" fill="${p.textMuted}">${tier.name} (Tier ${tier.tier}) · ${weather.icon} ${weather.label}</text>
</g>`;
}

function renderFooter(stats: CityStats, p: Palette): string {
  const y = SVG_HEIGHT - FOOTER_HEIGHT;
  const items: [string, string][] = [
    ['Buildings', String(stats.totalBuildings)],
    ['Population', fmtPop(stats.population)],
    ['Commits', String(stats.totalCommits)],
    ['Stars', String(stats.totalStars)],
    ['Streak', `${stats.streakDays}d`],
    ['Top Lang', stats.topLanguage],
  ];
  const unit = SVG_WIDTH / items.length;
  const labels = items.map(([label, val], i) => {
    const x = unit / 2 + i * unit;
    return `<text x="${n(x)}" y="${y + 19}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}">${label}</text>
    <text x="${n(x)}" y="${y + 35}" text-anchor="middle" class="dc-text dc-sub" fill="${p.text}">${escapeXml(val)}</text>`;
  }).join('');
  return `<g><line x1="18" y1="${y + 3}" x2="782" y2="${y + 3}" stroke="${p.border}" stroke-width="0.8"/>${labels}</g>`;
}

// ── 메인 렌더 ─────────────────────────────

export interface CityRenderData {
  username: string;
  profile: CityProfile;
  config: DevCityConfig;
  theme: ThemeColors;
}

export function renderCity(data: CityRenderData): string {
  const { username, profile, config, theme } = data;
  const style = config.city_style === 'simcity' || config.city_style === 'neon'
    ? config.city_style
    : 'tycoon';
  const isNeon = style === 'neon';
  const p = getPalette(style, theme);
  const animate = config.animation !== false;
  const grid = getGrid(profile.buildings.length);

  const cameraTransform = style === 'neon'
    ? 'translate(-8,4) scale(1.03,0.97)'
    : style === 'simcity'
      ? 'translate(-6,2) scale(1.02,0.98)'
      : 'translate(-4,3) scale(1.015,0.985)';

  const contribTerrain = profile.contributionCalendar?.length
    ? renderContributionTerrain(profile.contributionCalendar, p, style)
    : '';

  // ── 레이어: backdrop → atmosphere → contribution terrain → weather ──
  // dev-city = jasonlong/isometric-contributions 스타일 순수 기여 시각화
  const zoningLayer = style === 'simcity'
    ? renderSimcityZoning(profile.buildings, grid, p)
    : renderDistrictBlocks(profile.buildings, grid, p);

  const layers = [
    renderBackdropSkyline(profile.tier, p, style),
    renderAtmosphere(p, style),
    contribTerrain,
    renderGround(grid, p, style),
    renderRoads(grid, p),
    zoningLayer,
    renderParks(grid, p),
    renderLandmarks(profile.tier, grid, p),
    renderBuildings(profile.buildings, grid, p, isNeon),
    renderStreetLife(grid, p),
    config.show_traffic !== false ? renderTraffic(profile.traffic, grid, p) : '',
    config.show_weather !== false ? renderWeather(profile.weather, p) : '',
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
${buildDefs(p, isNeon)}
${buildStyles(animate)}
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dcSky)"/>
<rect x="0" y="${CITY_Y}" width="${SVG_WIDTH}" height="${CITY_HEIGHT}" fill="${p.haze}" opacity="0.05"/>
${renderHeader(username, profile.tier, profile.weather, p)}
<g transform="translate(0,${CITY_Y}) ${cameraTransform}">${layers}</g>
${renderFooter(profile.stats, p)}
<rect x="1" y="1" width="798" height="498" rx="15" fill="none" stroke="${p.border}" stroke-width="1" opacity="0.60"/>
</svg>`;
}
