import { ThemeColors, DevCityConfig } from '../../types';
import { CityProfile, CityBuilding, CityTraffic, CityStats } from './city-analyzer';
import { CityTier, WeatherInfo, BuildingType } from './building-mapper';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const HEADER_HEIGHT = 50;
const FOOTER_HEIGHT = 52;
const CITY_Y = HEADER_HEIGHT;
const CITY_HEIGHT = SVG_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

const GRID_ORIGIN_X = 400;
const GRID_ORIGIN_Y = 276;
const TILE_W = 110;
const TILE_H = 56;

type CityStyle = 'tycoon' | 'simcity' | 'neon';
type BuildingZone = 'residential' | 'commercial' | 'industrial' | 'civic';
type TimeBand = 'morning' | 'day' | 'evening' | 'night';

interface GridInfo {
  cols: number;
  rows: number;
  centerCol: number;
  centerRow: number;
}

interface Pt {
  x: number;
  y: number;
}

interface Palette {
  skyTop: string;
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

function n(v: number): string {
  return v.toFixed(1);
}

function clamp(v: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, v));
}

function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function lightenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.min(255, Math.round(r + (255 - r) * amount));
  const ng = Math.min(255, Math.round(g + (255 - g) * amount));
  const nb = Math.min(255, Math.round(b + (255 - b) * amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

function darkenHex(hex: string, amount: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const nr = Math.round(r * (1 - amount));
  const ng = Math.round(g * (1 - amount));
  const nb = Math.round(b * (1 - amount));
  return `#${nr.toString(16).padStart(2, '0')}${ng.toString(16).padStart(2, '0')}${nb.toString(16).padStart(2, '0')}`;
}

// right/left/top coordinates inspired by @elchininet/isometric.
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
  return {
    cols,
    rows,
    centerCol: (cols - 1) / 2,
    centerRow: (rows - 1) / 2,
  };
}

function getZone(type: BuildingType): BuildingZone {
  switch (type) {
    case 'factory':
    case 'warehouse':
    case 'garage':
      return 'industrial';
    case 'mall':
    case 'arcade':
    case 'telecom':
    case 'lab':
      return 'commercial';
    case 'cityhall':
      return 'civic';
    default:
      return 'residential';
  }
}

function getPalette(style: CityStyle, _theme: ThemeColors): Palette {
  switch (style) {
    case 'tycoon':
      return {
        skyTop: '#203459',
        skyBottom: '#3e6c93',
        haze: 'rgba(255,255,255,0.10)',
        groundTop: '#5d8b54',
        groundBottom: '#345a33',
        grass: '#7eac66',
        water: '#4a8fd1',
        road: '#52606d',
        lane: '#f7d67e',
        text: '#ecf4ff',
        textMuted: '#c5d8eb',
        border: '#27435e',
        outline: '#1d2d3d',
        shadow: 'rgba(0,0,0,0.30)',
        glow: '#ffd978',
        window: '#ffe39a',
      };
    case 'simcity':
      return {
        skyTop: '#79b8ff',
        skyBottom: '#dbf1ff',
        haze: 'rgba(255,255,255,0.25)',
        groundTop: '#73ab5e',
        groundBottom: '#4f7d41',
        grass: '#92c876',
        water: '#73b7e9',
        road: '#6c737b',
        lane: '#fff1a3',
        text: '#203040',
        textMuted: '#4d6478',
        border: '#8eaec4',
        outline: '#37536e',
        shadow: 'rgba(0,0,0,0.20)',
        glow: '#ffd05a',
        window: '#fff4ba',
      };
    case 'neon':
      return {
        skyTop: '#06000e',
        skyBottom: '#140021',
        haze: 'rgba(0,255,204,0.09)',
        groundTop: '#130e2a',
        groundBottom: '#070512',
        grass: '#1f2f4f',
        water: '#1a2f5f',
        road: '#181a33',
        lane: '#00ffd5',
        text: '#00ffd5',
        textMuted: '#ff54d8',
        border: '#392461',
        outline: '#00ffd5',
        shadow: 'rgba(0,255,213,0.10)',
        glow: '#ff39cf',
        window: '#00ffd5',
      };
  }
}

function buildDefs(p: Palette, isNeon: boolean): string {
  return `<defs>
  <linearGradient id="dcSky" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${p.skyTop}"/>
    <stop offset="100%" stop-color="${p.skyBottom}"/>
  </linearGradient>
  <linearGradient id="dcGround" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="${p.groundTop}"/>
    <stop offset="100%" stop-color="${p.groundBottom}"/>
  </linearGradient>
  <linearGradient id="dcAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%" stop-color="${lightenHex(p.road, 0.08)}"/>
    <stop offset="100%" stop-color="${darkenHex(p.road, 0.12)}"/>
  </linearGradient>
  <linearGradient id="dcGlass" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%" stop-color="#ffffff" stop-opacity="0.24"/>
    <stop offset="60%" stop-color="#ffffff" stop-opacity="0.08"/>
    <stop offset="100%" stop-color="#ffffff" stop-opacity="0.02"/>
  </linearGradient>
  <pattern id="dcAsphaltNoise" width="6" height="6" patternUnits="userSpaceOnUse">
    <circle cx="1" cy="2" r="0.4" fill="#000" opacity="0.13"/>
    <circle cx="4.5" cy="4.2" r="0.35" fill="#fff" opacity="0.08"/>
  </pattern>
  <filter id="dcGlow"><feGaussianBlur stdDeviation="${isNeon ? '2.4' : '1.2'}" result="g"/><feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  <filter id="dcShadow"><feDropShadow dx="1" dy="2" stdDeviation="1.4" flood-color="#000" flood-opacity="0.35"/></filter>
</defs>`;
}

function buildStyles(animate: boolean): string {
  const motion = animate
    ? `
    @keyframes dcTwinkle { 0%,100%{opacity:0.35} 50%{opacity:1} }
    @keyframes dcIdle { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-0.6px)} }
    .dc-win{animation:dcTwinkle 3.2s ease-in-out infinite}
    .dc-idle{animation:dcIdle 1.7s ease-in-out infinite}
    `
    : '.dc-win{opacity:0.7}';

  return `<style>
  .dc-text{font-family:'Segoe UI','Noto Sans KR',sans-serif}
  .dc-title{font-size:13px;font-weight:700;letter-spacing:1.2px}
  .dc-sub{font-size:9px;font-weight:500}
  .dc-small{font-size:7px;font-weight:500}
  ${motion}
</style>`;
}

function loopCorners(grid: GridInfo, pad: number): { back: Pt; right: Pt; front: Pt; left: Pt } {
  return {
    back: gridToScreen(-pad, -pad, grid),
    right: gridToScreen(grid.cols - 1 + pad, -pad, grid),
    front: gridToScreen(grid.cols - 1 + pad, grid.rows - 1 + pad, grid),
    left: gridToScreen(-pad, grid.rows - 1 + pad, grid),
  };
}

function renderGround(grid: GridInfo, p: Palette, style: CityStyle): string {
  const terrain = loopCorners(grid, 1.35);
  const terrainPts = `${n(terrain.back.x)},${n(terrain.back.y)} ${n(terrain.right.x)},${n(terrain.right.y)} ${n(terrain.front.x)},${n(terrain.front.y)} ${n(terrain.left.x)},${n(terrain.left.y)}`;

  let gridLines = '';
  for (let r = -0.2; r <= grid.rows - 1 + 0.2; r += 1) {
    const a = gridToScreen(0, r, grid);
    const b = gridToScreen(grid.cols - 1, r, grid);
    gridLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${p.border}" stroke-width="0.45" opacity="0.28"/>`;
  }
  for (let c = -0.2; c <= grid.cols - 1 + 0.2; c += 1) {
    const a = gridToScreen(c, 0, grid);
    const b = gridToScreen(c, grid.rows - 1, grid);
    gridLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${p.border}" stroke-width="0.45" opacity="0.28"/>`;
  }

  const river = style === 'simcity'
    ? `<polygon points="${n(terrain.left.x + 18)},${n(terrain.left.y - 12)} ${n(terrain.front.x - 28)},${n(terrain.front.y - 6)} ${n(terrain.front.x - 6)},${n(terrain.front.y + 8)} ${n(terrain.left.x + 42)},${n(terrain.left.y + 6)}"
        fill="${p.water}" opacity="0.62"/>`
    : '';
  let lots = '';
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const t = gridToScreen(c, r, grid);
      const alt = (r + c) % 2 === 0;
      lots += `<polygon points="${n(t.x)},${n(t.y - 12.5)} ${n(t.x + 24)},${n(t.y)} ${n(t.x)},${n(t.y + 12.5)} ${n(t.x - 24)},${n(t.y)}"
        fill="${alt ? lightenHex(p.grass, 0.06) : darkenHex(p.grass, 0.06)}" opacity="0.12"/>`;
    }
  }

  return `<g>
  <polygon points="${terrainPts}" fill="url(#dcGround)" stroke="${p.border}" stroke-width="0.8"/>
  <polygon points="${n(terrain.back.x)},${n(terrain.back.y + 14)} ${n(terrain.right.x)},${n(terrain.right.y + 14)} ${n(terrain.right.x - 10)},${n(terrain.right.y + 30)} ${n(terrain.back.x + 10)},${n(terrain.back.y + 30)}" fill="${p.haze}"/>
  ${river}
  ${lots}
  ${gridLines}
</g>`;
}

function renderRoads(grid: GridInfo, p: Palette): string {
  const outer = loopCorners(grid, 1.05);
  const inner = loopCorners(grid, 0.45);
  const outerPath = `M ${n(outer.back.x)} ${n(outer.back.y)} L ${n(outer.right.x)} ${n(outer.right.y)} L ${n(outer.front.x)} ${n(outer.front.y)} L ${n(outer.left.x)} ${n(outer.left.y)} Z`;
  const innerPath = `M ${n(inner.back.x)} ${n(inner.back.y)} L ${n(inner.right.x)} ${n(inner.right.y)} L ${n(inner.front.x)} ${n(inner.front.y)} L ${n(inner.left.x)} ${n(inner.left.y)} Z`;
  const crosswalk = (x: number, y: number, w: number, h: number, rot: number): string =>
    `<g transform="translate(${n(x)} ${n(y)}) rotate(${n(rot)})">${[0, 1, 2, 3].map((i) =>
      `<rect x="${n(-w / 2)}" y="${n(-h / 2 + i * (h / 4) + 0.3)}" width="${n(w)}" height="0.7" fill="#f8fafc" opacity="0.55"/>`).join('')}</g>`;

  const lights = [
    { x: outer.back.x - 10, y: outer.back.y + 4 },
    { x: outer.right.x - 5, y: outer.right.y + 9 },
    { x: outer.front.x + 10, y: outer.front.y - 4 },
    { x: outer.left.x + 4, y: outer.left.y - 8 },
  ];
  return `<g>
  <path d="${outerPath}" fill="none" stroke="${darkenHex(p.road, 0.2)}" stroke-width="19" opacity="0.25"/>
  <path d="${innerPath}" fill="none" stroke="${darkenHex(p.road, 0.2)}" stroke-width="15" opacity="0.22"/>
  <path id="dcRoadOuter" d="${outerPath}" fill="none" stroke="url(#dcAsphalt)" stroke-width="16" opacity="0.78"/>
  <path id="dcRoadInner" d="${innerPath}" fill="none" stroke="url(#dcAsphalt)" stroke-width="13" opacity="0.72"/>
  <path d="${outerPath}" fill="none" stroke="url(#dcAsphaltNoise)" stroke-width="16" opacity="0.35"/>
  <path d="${innerPath}" fill="none" stroke="url(#dcAsphaltNoise)" stroke-width="13" opacity="0.3"/>
  <path d="${outerPath}" fill="none" stroke="${p.lane}" stroke-width="1" opacity="0.45" stroke-dasharray="9 8"/>
  <path d="${innerPath}" fill="none" stroke="${p.lane}" stroke-width="0.9" opacity="0.36" stroke-dasharray="6 7"/>
  ${crosswalk(outer.back.x - 2, outer.back.y + 1, 8, 6, -32)}
  ${crosswalk(outer.right.x - 2, outer.right.y + 3, 8, 6, 32)}
  ${crosswalk(outer.front.x + 3, outer.front.y + 1, 8, 6, -32)}
  ${crosswalk(outer.left.x + 1, outer.left.y - 2, 8, 6, 32)}
  ${lights.map((l, i) => `<g>
    <line x1="${n(l.x)}" y1="${n(l.y)}" x2="${n(l.x)}" y2="${n(l.y - 9)}" stroke="${darkenHex(p.border, 0.2)}" stroke-width="1"/>
    <circle cx="${n(l.x)}" cy="${n(l.y - 9.8)}" r="1.6" fill="${i % 2 === 0 ? '#ffe08a' : '#c7deff'}" opacity="0.75"/>
  </g>`).join('')}
</g>`;
}

function prism(cx: number, cy: number, hw: number, hd: number, h: number, top: string, right: string, left: string, outline: string): string {
  return `<polygon points="${n(cx)},${n(cy - h)} ${n(cx + hw)},${n(cy - hd - h)} ${n(cx)},${n(cy - 2 * hd - h)} ${n(cx - hw)},${n(cy - hd - h)}" fill="${top}" stroke="${outline}" stroke-width="0.5"/>
  <polygon points="${n(cx)},${n(cy)} ${n(cx + hw)},${n(cy - hd)} ${n(cx + hw)},${n(cy - hd - h)} ${n(cx)},${n(cy - h)}" fill="${right}" stroke="${outline}" stroke-width="0.5"/>
  <polygon points="${n(cx)},${n(cy)} ${n(cx)},${n(cy - h)} ${n(cx - hw)},${n(cy - hd - h)} ${n(cx - hw)},${n(cy - hd)}" fill="${left}" stroke="${outline}" stroke-width="0.5"/>`;
}

type RoofKind = 'flat' | 'mech' | 'spire' | 'dome' | 'gable' | 'saw' | 'terrace';
type FacadeKind = 'grid' | 'ribs' | 'panels' | 'stack' | 'sparse';
type DetailLevel = 'high' | 'mid' | 'low';

interface MassProfile {
  hwScale: number;
  hdScale: number;
  hScale: number;
  facade: FacadeKind;
  roof: RoofKind;
  podium: boolean;
  setback: boolean;
}

function getArchetype(type: BuildingType, zone: BuildingZone): 'tower' | 'campus' | 'plant' | 'civic' | 'resi' {
  if (type === 'telecom' || type === 'arcade') return 'tower';
  if (type === 'mall' || type === 'lab' || type === 'library') return 'campus';
  if (type === 'factory' || type === 'warehouse' || type === 'garage' || zone === 'industrial') return 'plant';
  if (type === 'cityhall' || zone === 'civic') return 'civic';
  return 'resi';
}

function renderArchetypeMass(
  archetype: 'tower' | 'campus' | 'plant' | 'civic' | 'resi',
  detail: DetailLevel,
  pos: Pt,
  hw: number,
  hd: number,
  h: number,
  top: string,
  right: string,
  left: string,
  outline: string
): string {
  if (detail === 'low') return '';
  if (archetype === 'tower') {
    return prism(pos.x, pos.y - h * 0.28, hw * 0.22, hd * 0.22, h * 0.48, lightenHex(top, 0.12), lightenHex(right, 0.06), lightenHex(left, 0.04), outline);
  }
  if (archetype === 'campus') {
    return `${prism(pos.x - hw * 0.36, pos.y + hd * 0.04, hw * 0.34, hd * 0.32, h * 0.28, lightenHex(top, 0.06), darkenHex(right, 0.04), darkenHex(left, 0.07), outline)}
      ${detail === 'high' ? prism(pos.x + hw * 0.28, pos.y - hd * 0.03, hw * 0.26, hd * 0.26, h * 0.22, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline) : ''}`;
  }
  if (archetype === 'plant') {
    return `${prism(pos.x - hw * 0.28, pos.y + hd * 0.02, hw * 0.3, hd * 0.28, h * 0.18, lightenHex(top, 0.04), darkenHex(right, 0.06), darkenHex(left, 0.09), outline)}
      ${prism(pos.x + hw * 0.26, pos.y + hd * 0.03, hw * 0.24, hd * 0.24, h * 0.16, lightenHex(top, 0.02), darkenHex(right, 0.08), darkenHex(left, 0.1), outline)}`;
  }
  if (archetype === 'civic') {
    return prism(pos.x, pos.y - h * 0.08, hw * 0.48, hd * 0.4, h * 0.24, lightenHex(top, 0.08), darkenHex(right, 0.02), darkenHex(left, 0.04), outline);
  }
  return detail === 'high'
    ? prism(pos.x + hw * 0.22, pos.y - h * 0.06, hw * 0.22, hd * 0.22, h * 0.2, lightenHex(top, 0.06), darkenHex(right, 0.04), darkenHex(left, 0.06), outline)
    : '';
}

function renderMassKit(
  kit: number,
  detail: DetailLevel,
  pos: Pt,
  hw: number,
  hd: number,
  h: number,
  top: string,
  right: string,
  left: string,
  outline: string
): string {
  if (detail === 'low') return '';
  switch (kit % 24) {
    case 0:
      return prism(pos.x - hw * 0.18, pos.y - h * 0.16, hw * 0.28, hd * 0.28, h * 0.34, lightenHex(top, 0.1), lightenHex(right, 0.05), lightenHex(left, 0.04), outline);
    case 1:
      return `${prism(pos.x + hw * 0.22, pos.y - h * 0.12, hw * 0.24, hd * 0.24, h * 0.3, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}
        ${detail === 'high' ? prism(pos.x - hw * 0.24, pos.y - h * 0.08, hw * 0.2, hd * 0.2, h * 0.22, lightenHex(top, 0.06), darkenHex(right, 0.05), darkenHex(left, 0.07), outline) : ''}`;
    case 2:
      return prism(pos.x, pos.y - h * 0.22, hw * 0.2, hd * 0.2, h * 0.4, lightenHex(top, 0.12), lightenHex(right, 0.06), lightenHex(left, 0.04), outline);
    case 3:
      return `${prism(pos.x - hw * 0.3, pos.y + hd * 0.04, hw * 0.26, hd * 0.24, h * 0.2, lightenHex(top, 0.05), darkenHex(right, 0.06), darkenHex(left, 0.08), outline)}
        ${prism(pos.x + hw * 0.28, pos.y + hd * 0.03, hw * 0.24, hd * 0.22, h * 0.18, lightenHex(top, 0.03), darkenHex(right, 0.08), darkenHex(left, 0.1), outline)}`;
    case 4:
      return `<ellipse cx="${n(pos.x - hw * 0.2)}" cy="${n(pos.y - h * 0.18)}" rx="${n(hw * 0.17)}" ry="${n(hd * 0.16)}" fill="${lightenHex(top, 0.12)}" stroke="${outline}" stroke-width="0.45" opacity="0.9"/>
        <rect x="${n(pos.x - hw * 0.36)}" y="${n(pos.y - h * 0.18)}" width="${n(hw * 0.32)}" height="${n(h * 0.28)}" fill="${darkenHex(right, 0.03)}" opacity="0.82"/>`;
    case 5:
      return `${prism(pos.x + hw * 0.14, pos.y - h * 0.18, hw * 0.33, hd * 0.3, h * 0.25, lightenHex(top, 0.1), darkenHex(right, 0.04), darkenHex(left, 0.07), outline)}
        <polygon points="${n(pos.x + hw * 0.1)},${n(pos.y - h * 0.43)} ${n(pos.x + hw * 0.26)},${n(pos.y - h * 0.3)} ${n(pos.x + hw * 0.08)},${n(pos.y - h * 0.18)} ${n(pos.x - hw * 0.06)},${n(pos.y - h * 0.3)}"
          fill="${lightenHex(top, 0.18)}" opacity="0.85" stroke="${outline}" stroke-width="0.4"/>`;
    case 6:
      return `${prism(pos.x - hw * 0.1, pos.y - h * 0.1, hw * 0.3, hd * 0.28, h * 0.2, lightenHex(top, 0.07), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}
        ${prism(pos.x + hw * 0.24, pos.y - h * 0.22, hw * 0.16, hd * 0.16, h * 0.34, lightenHex(top, 0.12), lightenHex(right, 0.08), lightenHex(left, 0.06), outline)}`;
    case 7:
      return `${prism(pos.x, pos.y - h * 0.14, hw * 0.24, hd * 0.24, h * 0.24, lightenHex(top, 0.08), darkenHex(right, 0.02), darkenHex(left, 0.04), outline)}
        ${detail === 'high' ? `<rect x="${n(pos.x - hw * 0.14)}" y="${n(pos.y - h * 0.35)}" width="${n(hw * 0.28)}" height="${n(h * 0.1)}" rx="0.8" fill="${lightenHex(top, 0.2)}" opacity="0.82"/>` : ''}`;
    case 8:
      return `${prism(pos.x - hw * 0.32, pos.y - h * 0.06, hw * 0.22, hd * 0.2, h * 0.18, lightenHex(top, 0.05), darkenHex(right, 0.05), darkenHex(left, 0.08), outline)}
        ${prism(pos.x + hw * 0.08, pos.y - h * 0.22, hw * 0.2, hd * 0.2, h * 0.34, lightenHex(top, 0.14), lightenHex(right, 0.08), lightenHex(left, 0.06), outline)}`;
    case 9:
      return `${prism(pos.x + hw * 0.26, pos.y - h * 0.08, hw * 0.2, hd * 0.2, h * 0.2, lightenHex(top, 0.06), darkenHex(right, 0.04), darkenHex(left, 0.07), outline)}
        <ellipse cx="${n(pos.x - hw * 0.24)}" cy="${n(pos.y - h * 0.14)}" rx="${n(hw * 0.15)}" ry="${n(hd * 0.14)}" fill="${lightenHex(top, 0.16)}" stroke="${outline}" stroke-width="0.4" opacity="0.9"/>`;
    case 10:
      return `${prism(pos.x, pos.y - h * 0.3, hw * 0.16, hd * 0.16, h * 0.5, lightenHex(top, 0.18), lightenHex(right, 0.1), lightenHex(left, 0.08), outline)}
        ${detail === 'high' ? prism(pos.x - hw * 0.18, pos.y - h * 0.08, hw * 0.16, hd * 0.16, h * 0.22, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.06), outline) : ''}`;
    case 11:
      return `${prism(pos.x - hw * 0.18, pos.y + hd * 0.04, hw * 0.2, hd * 0.18, h * 0.16, lightenHex(top, 0.03), darkenHex(right, 0.07), darkenHex(left, 0.1), outline)}
        ${prism(pos.x + hw * 0.18, pos.y + hd * 0.02, hw * 0.22, hd * 0.2, h * 0.15, lightenHex(top, 0.02), darkenHex(right, 0.08), darkenHex(left, 0.1), outline)}
        ${prism(pos.x, pos.y - h * 0.06, hw * 0.18, hd * 0.18, h * 0.22, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}`;
    case 12:
      return `${prism(pos.x + hw * 0.14, pos.y - h * 0.14, hw * 0.28, hd * 0.26, h * 0.26, lightenHex(top, 0.1), darkenHex(right, 0.04), darkenHex(left, 0.07), outline)}
        <polygon points="${n(pos.x + hw * 0.04)},${n(pos.y - h * 0.36)} ${n(pos.x + hw * 0.22)},${n(pos.y - h * 0.24)} ${n(pos.x + hw * 0.03)},${n(pos.y - h * 0.1)} ${n(pos.x - hw * 0.12)},${n(pos.y - h * 0.24)}"
          fill="${lightenHex(top, 0.2)}" opacity="0.82" stroke="${outline}" stroke-width="0.4"/>`;
    case 13:
      return `${prism(pos.x - hw * 0.24, pos.y - h * 0.18, hw * 0.22, hd * 0.22, h * 0.3, lightenHex(top, 0.1), lightenHex(right, 0.05), lightenHex(left, 0.04), outline)}
        ${prism(pos.x + hw * 0.22, pos.y - h * 0.06, hw * 0.16, hd * 0.16, h * 0.18, lightenHex(top, 0.05), darkenHex(right, 0.04), darkenHex(left, 0.06), outline)}`;
    case 14:
      return `<ellipse cx="${n(pos.x)}" cy="${n(pos.y - h * 0.22)}" rx="${n(hw * 0.2)}" ry="${n(hd * 0.18)}" fill="${lightenHex(top, 0.18)}" stroke="${outline}" stroke-width="0.45" opacity="0.9"/>
        <rect x="${n(pos.x - hw * 0.14)}" y="${n(pos.y - h * 0.22)}" width="${n(hw * 0.28)}" height="${n(h * 0.28)}" fill="${darkenHex(right, 0.05)}" opacity="0.84"/>`;
    case 15:
      return `${prism(pos.x - hw * 0.08, pos.y - h * 0.12, hw * 0.22, hd * 0.22, h * 0.24, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}
        ${detail === 'high' ? prism(pos.x + hw * 0.2, pos.y - h * 0.26, hw * 0.14, hd * 0.14, h * 0.32, lightenHex(top, 0.14), lightenHex(right, 0.08), lightenHex(left, 0.06), outline) : ''}`;
    case 16:
      return `${prism(pos.x - hw * 0.26, pos.y - h * 0.1, hw * 0.2, hd * 0.2, h * 0.2, lightenHex(top, 0.07), darkenHex(right, 0.05), darkenHex(left, 0.08), outline)}
        ${prism(pos.x + hw * 0.06, pos.y - h * 0.26, hw * 0.18, hd * 0.18, h * 0.36, lightenHex(top, 0.15), lightenHex(right, 0.09), lightenHex(left, 0.07), outline)}`;
    case 17:
      return `${prism(pos.x + hw * 0.26, pos.y - h * 0.1, hw * 0.22, hd * 0.22, h * 0.24, lightenHex(top, 0.09), darkenHex(right, 0.03), darkenHex(left, 0.06), outline)}
        <rect x="${n(pos.x - hw * 0.3)}" y="${n(pos.y - h * 0.22)}" width="${n(hw * 0.26)}" height="${n(h * 0.24)}" fill="${darkenHex(right, 0.08)}" opacity="0.76"/>`;
    case 18:
      return `${prism(pos.x, pos.y - h * 0.28, hw * 0.14, hd * 0.14, h * 0.52, lightenHex(top, 0.2), lightenHex(right, 0.12), lightenHex(left, 0.1), outline)}
        ${detail === 'high' ? `<ellipse cx="${n(pos.x)}" cy="${n(pos.y - h * 0.32)}" rx="${n(hw * 0.12)}" ry="${n(hd * 0.1)}" fill="${lightenHex(top, 0.24)}" opacity="0.88"/>` : ''}`;
    case 19:
      return `${prism(pos.x - hw * 0.2, pos.y + hd * 0.02, hw * 0.2, hd * 0.18, h * 0.14, lightenHex(top, 0.03), darkenHex(right, 0.08), darkenHex(left, 0.1), outline)}
        ${prism(pos.x + hw * 0.22, pos.y + hd * 0.01, hw * 0.2, hd * 0.18, h * 0.14, lightenHex(top, 0.02), darkenHex(right, 0.09), darkenHex(left, 0.11), outline)}
        ${prism(pos.x, pos.y - h * 0.08, hw * 0.18, hd * 0.18, h * 0.24, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}`;
    case 20:
      return `<ellipse cx="${n(pos.x - hw * 0.08)}" cy="${n(pos.y - h * 0.18)}" rx="${n(hw * 0.18)}" ry="${n(hd * 0.16)}" fill="${lightenHex(top, 0.18)}" stroke="${outline}" stroke-width="0.42" opacity="0.9"/>
        <rect x="${n(pos.x - hw * 0.24)}" y="${n(pos.y - h * 0.18)}" width="${n(hw * 0.32)}" height="${n(h * 0.24)}" fill="${darkenHex(right, 0.04)}" opacity="0.8"/>`;
    case 21:
      return `${prism(pos.x + hw * 0.12, pos.y - h * 0.16, hw * 0.28, hd * 0.26, h * 0.26, lightenHex(top, 0.1), darkenHex(right, 0.04), darkenHex(left, 0.07), outline)}
        <polygon points="${n(pos.x + hw * 0.02)},${n(pos.y - h * 0.38)} ${n(pos.x + hw * 0.2)},${n(pos.y - h * 0.24)} ${n(pos.x + hw * 0.02)},${n(pos.y - h * 0.1)} ${n(pos.x - hw * 0.14)},${n(pos.y - h * 0.24)}"
          fill="${lightenHex(top, 0.22)}" opacity="0.84" stroke="${outline}" stroke-width="0.4"/>`;
    case 22:
      return `${prism(pos.x - hw * 0.22, pos.y - h * 0.2, hw * 0.2, hd * 0.2, h * 0.28, lightenHex(top, 0.11), lightenHex(right, 0.06), lightenHex(left, 0.05), outline)}
        ${prism(pos.x + hw * 0.22, pos.y - h * 0.08, hw * 0.16, hd * 0.16, h * 0.2, lightenHex(top, 0.05), darkenHex(right, 0.04), darkenHex(left, 0.06), outline)}
        ${detail === 'high' ? prism(pos.x, pos.y - h * 0.32, hw * 0.12, hd * 0.12, h * 0.2, lightenHex(top, 0.2), lightenHex(right, 0.1), lightenHex(left, 0.08), outline) : ''}`;
    default:
      return `${prism(pos.x - hw * 0.06, pos.y - h * 0.1, hw * 0.22, hd * 0.22, h * 0.22, lightenHex(top, 0.08), darkenHex(right, 0.03), darkenHex(left, 0.05), outline)}
        ${detail === 'high' ? `<rect x="${n(pos.x - hw * 0.16)}" y="${n(pos.y - h * 0.34)}" width="${n(hw * 0.32)}" height="${n(h * 0.1)}" rx="0.8" fill="${lightenHex(top, 0.2)}" opacity="0.82"/>` : ''}`;
  }
}

function renderTypeAccessory(
  building: CityBuilding,
  zone: BuildingZone,
  detail: DetailLevel,
  pos: Pt,
  hw: number,
  hd: number,
  h: number,
  p: Palette
): string {
  if (detail === 'low') return '';
  const topY = pos.y - hd - h;
  const accent = building.isDormant ? '#6b7280' : building.info.colorAccent;
  switch (building.buildingType) {
    case 'factory':
      return `<ellipse cx="${n(pos.x - hw * 0.34)}" cy="${n(pos.y + hd * 0.18)}" rx="4.2" ry="1.7" fill="#98a3af" opacity="0.8"/>
        <rect x="${n(pos.x - hw * 0.38)}" y="${n(pos.y - 2.4)}" width="7.4" height="2.2" rx="0.5" fill="#8a96a3" opacity="0.78"/>`;
    case 'warehouse':
      return `<rect x="${n(pos.x - hw * 0.62)}" y="${n(pos.y + hd * 0.24)}" width="${n(hw * 0.34)}" height="2.5" rx="0.4" fill="#8f9dad" opacity="0.72"/>
        <rect x="${n(pos.x + hw * 0.26)}" y="${n(pos.y - hd * 0.08)}" width="${n(hw * 0.3)}" height="2.5" rx="0.4" fill="#8f9dad" opacity="0.72"/>`;
    case 'garage':
      return `<polygon points="${n(pos.x - hw * 0.48)},${n(pos.y + hd * 0.06)} ${n(pos.x - hw * 0.16)},${n(pos.y + hd * 0.24)} ${n(pos.x - hw * 0.08)},${n(pos.y + hd * 0.2)} ${n(pos.x - hw * 0.4)},${n(pos.y + hd * 0.02)}"
        fill="#f3f4f6" opacity="0.68"/>`;
    case 'mall':
      return `<rect x="${n(pos.x - hw * 0.52)}" y="${n(pos.y - hd * 0.1)}" width="${n(hw * 1.04)}" height="3.2" rx="0.7" fill="${accent}" opacity="0.32"/>
        <rect x="${n(pos.x - hw * 0.48)}" y="${n(pos.y + hd * 0.14)}" width="${n(hw * 0.96)}" height="1.2" rx="0.5" fill="#eef2ff" opacity="0.75"/>`;
    case 'arcade':
      return `<rect x="${n(pos.x - hw * 0.36)}" y="${n(topY + 5)}" width="${n(hw * 0.72)}" height="2.1" rx="0.6" fill="${accent}" opacity="0.45"/>`;
    case 'telecom':
      return detail === 'high'
        ? `<ellipse cx="${n(pos.x + hw * 0.18)}" cy="${n(topY - 8)}" rx="4.1" ry="1.5" fill="#d7e2f0" opacity="0.78" stroke="${p.outline}" stroke-width="0.4"/>`
        : '';
    case 'lab':
      return `<polygon points="${n(pos.x - hw * 0.26)},${n(topY + 2)} ${n(pos.x - hw * 0.02)},${n(topY + 0.8)} ${n(pos.x + hw * 0.1)},${n(topY + 4)} ${n(pos.x - hw * 0.14)},${n(topY + 5.3)}"
        fill="#9ac4ff" opacity="0.72"/>`;
    case 'cityhall':
      return `<rect x="${n(pos.x - hw * 0.26)}" y="${n(pos.y - h * 0.34)}" width="${n(hw * 0.1)}" height="${n(h * 0.28)}" fill="#dde5ef" opacity="0.8"/>
        <rect x="${n(pos.x - hw * 0.06)}" y="${n(pos.y - h * 0.34)}" width="${n(hw * 0.1)}" height="${n(h * 0.28)}" fill="#dde5ef" opacity="0.8"/>
        <rect x="${n(pos.x + hw * 0.14)}" y="${n(pos.y - h * 0.34)}" width="${n(hw * 0.1)}" height="${n(h * 0.28)}" fill="#dde5ef" opacity="0.8"/>`;
    case 'library':
      return `<polygon points="${n(pos.x - hw * 0.4)},${n(pos.y + hd * 0.22)} ${n(pos.x + hw * 0.4)},${n(pos.y + hd * 0.22)} ${n(pos.x + hw * 0.32)},${n(pos.y + hd * 0.34)} ${n(pos.x - hw * 0.32)},${n(pos.y + hd * 0.34)}"
        fill="#f5efe1" opacity="0.78"/>`;
    default:
      if (zone === 'residential' && detail === 'high') {
        return `<circle cx="${n(pos.x - hw * 0.56)}" cy="${n(pos.y + hd * 0.2)}" r="1.8" fill="#49a967" opacity="0.82"/>
          <circle cx="${n(pos.x + hw * 0.52)}" cy="${n(pos.y - hd * 0.14)}" r="1.7" fill="#4db970" opacity="0.8"/>`;
      }
      return '';
  }
}

function getMassProfile(type: BuildingType, zone: BuildingZone): MassProfile {
  switch (type) {
    case 'factory':
      return { hwScale: 1.28, hdScale: 1.2, hScale: 0.72, facade: 'panels', roof: 'saw', podium: true, setback: false };
    case 'warehouse':
      return { hwScale: 1.35, hdScale: 1.16, hScale: 0.68, facade: 'panels', roof: 'flat', podium: true, setback: false };
    case 'garage':
      return { hwScale: 1.22, hdScale: 1.08, hScale: 0.78, facade: 'stack', roof: 'flat', podium: true, setback: false };
    case 'mall':
      return { hwScale: 1.22, hdScale: 1.1, hScale: 0.9, facade: 'ribs', roof: 'terrace', podium: true, setback: false };
    case 'arcade':
      return { hwScale: 1.08, hdScale: 1.02, hScale: 1.08, facade: 'ribs', roof: 'spire', podium: false, setback: true };
    case 'telecom':
      return { hwScale: 0.96, hdScale: 0.94, hScale: 1.28, facade: 'grid', roof: 'spire', podium: false, setback: true };
    case 'lab':
      return { hwScale: 1.04, hdScale: 1.0, hScale: 1.06, facade: 'grid', roof: 'mech', podium: true, setback: true };
    case 'cityhall':
      return { hwScale: 1.18, hdScale: 1.08, hScale: 1.1, facade: 'sparse', roof: 'dome', podium: true, setback: false };
    case 'library':
      return { hwScale: 1.1, hdScale: 1.04, hScale: 0.94, facade: 'sparse', roof: 'gable', podium: true, setback: false };
    default:
      if (zone === 'industrial') return { hwScale: 1.2, hdScale: 1.12, hScale: 0.82, facade: 'panels', roof: 'flat', podium: true, setback: false };
      if (zone === 'commercial') return { hwScale: 1.06, hdScale: 1.0, hScale: 1.08, facade: 'grid', roof: 'mech', podium: false, setback: true };
      if (zone === 'civic') return { hwScale: 1.15, hdScale: 1.06, hScale: 1.05, facade: 'sparse', roof: 'dome', podium: true, setback: false };
      return { hwScale: 1.02, hdScale: 0.98, hScale: 0.98, facade: 'stack', roof: 'gable', podium: true, setback: false };
  }
}

function renderBuilding(building: CityBuilding, grid: GridInfo, p: Palette, isNeon: boolean, idx: number, totalBuildings: number): string {
  const pos = gridToScreen(building.gridCol, building.gridRow, grid);
  const zone = getZone(building.buildingType);
  const profile = getMassProfile(building.buildingType, zone);
  const archetype = getArchetype(building.buildingType, zone);
  const modelKit = hashCode(`${building.repoName}:${building.buildingType}`) % 24;
  const depth = clamp((building.gridCol + building.gridRow) / Math.max(1, grid.cols + grid.rows - 2), 0, 1);
  const densityPenalty = totalBuildings >= 26 ? 0.26 : totalBuildings >= 18 ? 0.14 : totalBuildings >= 12 ? 0.06 : 0;
  const lodScore = clamp(depth + densityPenalty, 0, 1.15);
  const detail: DetailLevel = lodScore > 0.9 ? 'low' : lodScore > 0.62 ? 'mid' : 'high';
  const nearBoost = 1 - depth * 0.18;

  let hw = 24;
  let hd = 12;
  let h = clamp(building.height, 46, 142);
  hw *= profile.hwScale;
  hd *= profile.hdScale;
  h *= profile.hScale * nearBoost;

  const base = building.isDormant ? '#6b7280' : building.info.colorMain;
  const accent = building.isDormant ? '#4b5563' : building.info.colorAccent;
  const top = building.isDormant ? '#838c98' : lightenHex(base, 0.28);
  const right = base;
  const left = building.isDormant ? '#5d6672' : darkenHex(base, 0.2);
  const lotFill = zone === 'industrial' ? '#9aa488' : zone === 'commercial' ? '#95aebb' : zone === 'civic' ? '#a7b0ca' : '#87a97e';

  let body = prism(pos.x, pos.y, hw, hd, h, top, right, left, p.outline);
  if (profile.podium) {
    const podiumHScale = zone === 'commercial' ? 0.22 : zone === 'industrial' ? 0.15 : zone === 'civic' ? 0.2 : 0.16;
    const podiumWScale = zone === 'commercial' ? 1.08 : zone === 'industrial' ? 1.02 : zone === 'civic' ? 1.06 : 1.03;
    body = prism(
      pos.x,
      pos.y,
      hw * podiumWScale,
      hd * podiumWScale,
      Math.max(9, h * podiumHScale),
      lightenHex(top, 0.08),
      darkenHex(right, 0.04),
      darkenHex(left, 0.08),
      p.outline
    ) + body;
  }
  if (profile.setback) {
    body += prism(
      pos.x,
      pos.y - h * 0.26,
      hw * 0.72,
      hd * 0.74,
      h * 0.4,
      lightenHex(top, 0.14),
      lightenHex(right, 0.05),
      lightenHex(left, 0.03),
      p.outline
    );
  }
  body += renderArchetypeMass(archetype, detail, pos, hw, hd, h, top, right, left, p.outline);
  body += renderMassKit(modelKit, detail, pos, hw, hd, h, top, right, left, p.outline);
  const silhouetteVariant = hashCode(building.repoName) % 4;
  if (detail !== 'low') {
    if (silhouetteVariant === 0) {
      body += prism(
        pos.x - hw * 0.24,
        pos.y - h * 0.14,
        hw * 0.32,
        hd * 0.32,
        h * 0.36,
        lightenHex(top, 0.1),
        lightenHex(right, 0.04),
        lightenHex(left, 0.03),
        p.outline
      );
    } else if (silhouetteVariant === 1) {
      body += prism(
        pos.x + hw * 0.22,
        pos.y - h * 0.1,
        hw * 0.28,
        hd * 0.28,
        h * 0.3,
        lightenHex(top, 0.08),
        darkenHex(right, 0.03),
        darkenHex(left, 0.05),
        p.outline
      );
      if (detail === 'high') {
        body += prism(
          pos.x - hw * 0.18,
          pos.y - h * 0.08,
          hw * 0.24,
          hd * 0.24,
          h * 0.24,
          lightenHex(top, 0.06),
          darkenHex(right, 0.05),
          darkenHex(left, 0.08),
          p.outline
        );
      }
    } else if (silhouetteVariant === 2) {
      body += prism(
        pos.x,
        pos.y - h * 0.2,
        hw * 0.22,
        hd * 0.22,
        h * 0.42,
        lightenHex(top, 0.14),
        lightenHex(right, 0.08),
        lightenHex(left, 0.06),
        p.outline
      );
    } else {
      body += prism(
        pos.x + hw * 0.1,
        pos.y - h * 0.16,
        hw * 0.4,
        hd * 0.35,
        h * 0.2,
        lightenHex(top, 0.07),
        darkenHex(right, 0.04),
        darkenHex(left, 0.07),
        p.outline
      );
    }
  }
  if (detail === 'high' && (building.buildingType === 'mall' || building.buildingType === 'lab' || building.buildingType === 'cityhall')) {
    body += prism(
      pos.x - hw * 0.34,
      pos.y + hd * 0.03,
      hw * 0.38,
      hd * 0.36,
      h * 0.34,
      lightenHex(top, 0.06),
      darkenHex(right, 0.06),
      darkenHex(left, 0.1),
      p.outline
    );
  }
  const lot = `<polygon points="${n(pos.x)},${n(pos.y - hd * 1.05)} ${n(pos.x + hw * 1.08)},${n(pos.y)} ${n(pos.x)},${n(pos.y + hd * 1.08)} ${n(pos.x - hw * 1.08)},${n(pos.y)}"
    fill="${lotFill}" opacity="0.28" stroke="${p.border}" stroke-width="0.35"/>`;
  const lotProps = detail === 'low' ? '' : zone === 'residential'
    ? `<circle cx="${n(pos.x - hw * 0.62)}" cy="${n(pos.y + hd * 0.18)}" r="2.8" fill="#3fa764" opacity="0.8"/>
      <circle cx="${n(pos.x + hw * 0.58)}" cy="${n(pos.y - hd * 0.14)}" r="2.5" fill="#4bb76e" opacity="0.74"/>`
    : zone === 'commercial'
      ? `<rect x="${n(pos.x - hw * 0.56)}" y="${n(pos.y + hd * 0.12)}" width="${n(hw * 0.2)}" height="3.5" rx="0.7" fill="#d8e4f7" opacity="0.65"/>
        <rect x="${n(pos.x + hw * 0.32)}" y="${n(pos.y - hd * 0.22)}" width="${n(hw * 0.22)}" height="3.5" rx="0.7" fill="#d8e4f7" opacity="0.65"/>`
      : zone === 'industrial'
        ? `<rect x="${n(pos.x - hw * 0.58)}" y="${n(pos.y + hd * 0.05)}" width="${n(hw * 0.34)}" height="2.4" rx="0.5" fill="#8b95a1" opacity="0.66"/>
          <rect x="${n(pos.x + hw * 0.26)}" y="${n(pos.y - hd * 0.24)}" width="${n(hw * 0.3)}" height="2.4" rx="0.5" fill="#8b95a1" opacity="0.66"/>`
        : `<circle cx="${n(pos.x - hw * 0.5)}" cy="${n(pos.y + hd * 0.1)}" r="2.4" fill="#c6d4eb" opacity="0.75"/>
          <circle cx="${n(pos.x + hw * 0.46)}" cy="${n(pos.y - hd * 0.16)}" r="2.4" fill="#c6d4eb" opacity="0.75"/>`;

  const rowsBase = detail === 'high' ? 7 : detail === 'mid' ? 5 : 3;
  const colsBase = detail === 'high' ? 4 : detail === 'mid' ? 3 : 2;
  const rows = Math.min(rowsBase, Math.max(1, Math.floor(h / (detail === 'low' ? 24 : 18))));
  const colsRaw = profile.facade === 'grid' ? colsBase : profile.facade === 'ribs' ? Math.max(2, colsBase - 1) : profile.facade === 'panels' ? Math.max(2, colsBase - 1) : 2;
  const cols = detail === 'low' ? Math.min(2, colsRaw) : colsRaw;
  const wu = profile.facade === 'grid' ? (detail === 'high' ? 0.095 : 0.11) : profile.facade === 'ribs' ? 0.115 : profile.facade === 'panels' ? 0.125 : 0.16;
  const wv = 0.06;
  const uStart = profile.facade === 'sparse' ? 0.2 : 0.12;
  const uStep = cols > 1 ? ((profile.facade === 'sparse' ? 0.55 : 0.66) - wu) / (cols - 1) : 0;

  let windows = '';
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (profile.facade === 'stack' && c === 1 && r % 2 === 1) continue;
      if (profile.facade === 'sparse' && (r % 2 === 1 || c === 1)) continue;
      if (detail === 'low' && r % 2 === 1) continue;
      const u = uStart + c * uStep;
      const v = 0.12 + r * (0.72 / Math.max(1, rows));
      const op = building.isDormant ? 0.12 : (zone === 'industrial' ? 0.2 : 0.28) + ((r + c) % 3) * 0.07;

      const rx1 = pos.x + u * hw;
      const ry1 = pos.y - u * hd - v * h;
      const rx2 = pos.x + (u + wu) * hw;
      const ry2 = pos.y - (u + wu) * hd - v * h;
      const rx3 = pos.x + (u + wu) * hw;
      const ry3 = pos.y - (u + wu) * hd - (v + wv) * h;
      const rx4 = pos.x + u * hw;
      const ry4 = pos.y - u * hd - (v + wv) * h;
      windows += `<polygon points="${n(rx1)},${n(ry1)} ${n(rx2)},${n(ry2)} ${n(rx3)},${n(ry3)} ${n(rx4)},${n(ry4)}" fill="${p.window}" opacity="${clamp(op, 0.1, 0.8).toFixed(2)}" class="dc-win"/>`;

      const lx1 = pos.x - u * hw;
      const ly1 = pos.y - u * hd - v * h;
      const lx2 = pos.x - (u + wu) * hw;
      const ly2 = pos.y - (u + wu) * hd - v * h;
      const lx3 = pos.x - (u + wu) * hw;
      const ly3 = pos.y - (u + wu) * hd - (v + wv) * h;
      const lx4 = pos.x - u * hw;
      const ly4 = pos.y - u * hd - (v + wv) * h;
      windows += `<polygon points="${n(lx1)},${n(ly1)} ${n(lx2)},${n(ly2)} ${n(lx3)},${n(ly3)} ${n(lx4)},${n(ly4)}" fill="${p.window}" opacity="${clamp(op * 0.65, 0.1, 0.65).toFixed(2)}" class="dc-win"/>`;
    }
  }

  if (profile.facade === 'ribs' && detail === 'high') {
    for (let i = 1; i <= 3; i++) {
      const u = 0.14 + i * 0.16;
      const rx = pos.x + u * hw;
      const ry1 = pos.y - u * hd - h * 0.08;
      const ry2 = pos.y - u * hd - h * 0.95;
      const lx = pos.x - u * hw;
      const ly1 = pos.y - u * hd - h * 0.08;
      const ly2 = pos.y - u * hd - h * 0.95;
      windows += `<line x1="${n(rx)}" y1="${n(ry1)}" x2="${n(rx)}" y2="${n(ry2)}" stroke="${lightenHex(right, 0.42)}" stroke-width="0.9" opacity="0.5"/>`;
      windows += `<line x1="${n(lx)}" y1="${n(ly1)}" x2="${n(lx)}" y2="${n(ly2)}" stroke="${lightenHex(left, 0.42)}" stroke-width="0.9" opacity="0.43"/>`;
    }
  }
  const glassRight = detail === 'low' ? '' : `<polygon points="${n(pos.x + hw * 0.08)},${n(pos.y - hd * 0.08 - h * 0.1)} ${n(pos.x + hw * 0.22)},${n(pos.y - hd * 0.22 - h * 0.22)} ${n(pos.x + hw * 0.2)},${n(pos.y - hd * 0.2 - h * 0.88)} ${n(pos.x + hw * 0.06)},${n(pos.y - hd * 0.06 - h * 0.76)}"
    fill="url(#dcGlass)" opacity="${zone === 'commercial' ? '0.75' : '0.58'}"/>`;
  const glassLeft = detail === 'low' ? '' : `<polygon points="${n(pos.x - hw * 0.06)},${n(pos.y - hd * 0.06 - h * 0.14)} ${n(pos.x - hw * 0.19)},${n(pos.y - hd * 0.19 - h * 0.24)} ${n(pos.x - hw * 0.17)},${n(pos.y - hd * 0.17 - h * 0.8)} ${n(pos.x - hw * 0.04)},${n(pos.y - hd * 0.04 - h * 0.7)}"
    fill="url(#dcGlass)" opacity="${zone === 'commercial' ? '0.52' : '0.4'}"/>`;

  const topY = pos.y - hd - h;
  let roof = '';
  if (profile.roof === 'saw') {
    for (let i = -1; i <= 1; i++) {
      const cx = pos.x + i * hw * 0.24;
      roof += `<polygon points="${n(cx - hw * 0.18)},${n(topY + 8)} ${n(cx)},${n(topY - 5)} ${n(cx + hw * 0.18)},${n(topY + 8)}" fill="#b7c1ca" opacity="0.78" stroke="${p.outline}" stroke-width="0.4"/>`;
    }
  } else if (profile.roof === 'mech') {
    roof = `${prism(pos.x - hw * 0.22, pos.y - h - hd * 0.18, 4.6, 2.4, 6.5, '#aab4be', '#8f98a1', '#7a848f', p.outline)}
      ${prism(pos.x + hw * 0.24, pos.y - h - hd * 0.3, 3.6, 1.9, 4.9, '#94a3b8', '#7f8d9f', '#6a7687', p.outline)}
      <rect x="${n(pos.x - hw * 0.3)}" y="${n(topY - 2)}" width="${n(hw * 0.6)}" height="2.4" rx="0.6" fill="${accent}" opacity="0.32"/>`;
  } else if (profile.roof === 'spire') {
    roof = `<polygon points="${n(pos.x)},${n(topY - 18)} ${n(pos.x + hw * 0.2)},${n(topY + 1)} ${n(pos.x)},${n(topY + 8)} ${n(pos.x - hw * 0.2)},${n(topY + 1)}" fill="${lightenHex(accent, 0.3)}" opacity="0.86" stroke="${p.outline}" stroke-width="0.5"/>`;
  } else if (profile.roof === 'dome') {
    roof = `<ellipse cx="${n(pos.x)}" cy="${n(topY)}" rx="${n(hw * 0.34)}" ry="${n(hd * 0.58)}" fill="#d3deea" stroke="${p.outline}" stroke-width="0.5" opacity="0.92"/>`;
  } else if (profile.roof === 'gable') {
    roof = `<polygon points="${n(pos.x)},${n(topY - 12)} ${n(pos.x + hw * 0.52)},${n(topY - 1)} ${n(pos.x)},${n(topY + 8)} ${n(pos.x - hw * 0.52)},${n(topY - 1)}" fill="${lightenHex(accent, 0.2)}" opacity="0.48"/>`;
  } else if (profile.roof === 'terrace') {
    roof = `${prism(pos.x, pos.y - h - hd * 0.22, hw * 0.44, hd * 0.42, 7.4, '#dbeafe', '#bdd9ff', '#9fc4f5', p.outline)}
      <rect x="${n(pos.x - hw * 0.28)}" y="${n(topY - 1.8)}" width="${n(hw * 0.56)}" height="3.2" rx="0.8" fill="${accent}" opacity="0.32"/>`;
  } else {
    roof = `<rect x="${n(pos.x - hw * 0.23)}" y="${n(topY + 2)}" width="${n(hw * 0.46)}" height="1.8" rx="0.6" fill="${lightenHex(top, 0.25)}" opacity="0.55"/>`;
  }
  if (detail !== 'low') {
    if (zone === 'commercial') {
      roof += `<rect x="${n(pos.x - hw * 0.3)}" y="${n(topY + 1.1)}" width="${n(hw * 0.6)}" height="1.4" rx="0.5" fill="#d8e9ff" opacity="0.7"/>`;
    } else if (zone === 'industrial') {
      roof += `<rect x="${n(pos.x - hw * 0.24)}" y="${n(topY + 1.3)}" width="${n(hw * 0.16)}" height="1.8" rx="0.3" fill="#adb8c3" opacity="0.74"/>
        <rect x="${n(pos.x + hw * 0.08)}" y="${n(topY + 1.1)}" width="${n(hw * 0.18)}" height="1.9" rx="0.3" fill="#a4afbb" opacity="0.74"/>`;
    } else if (zone === 'civic') {
      roof += `<rect x="${n(pos.x - hw * 0.2)}" y="${n(topY + 1.3)}" width="${n(hw * 0.4)}" height="1.6" rx="0.5" fill="#f7efd8" opacity="0.8"/>`;
    } else if (detail === 'high') {
      roof += `<rect x="${n(pos.x - hw * 0.16)}" y="${n(topY + 1.5)}" width="${n(hw * 0.32)}" height="1.3" rx="0.4" fill="#d8e6d6" opacity="0.62"/>`;
    }
  }
  if (detail === 'high') {
    if (archetype === 'tower') {
      roof += `<rect x="${n(pos.x - 4.8)}" y="${n(topY - 1.6)}" width="9.6" height="1.8" rx="0.6" fill="#dbe8f9" opacity="0.72"/>`;
    } else if (archetype === 'plant') {
      roof += `<ellipse cx="${n(pos.x - hw * 0.18)}" cy="${n(topY + 2.6)}" rx="3.8" ry="1.4" fill="#c3ccd6" opacity="0.75"/>
        <ellipse cx="${n(pos.x + hw * 0.2)}" cy="${n(topY + 2.1)}" rx="3.1" ry="1.2" fill="#bac4ce" opacity="0.72"/>`;
    } else if (archetype === 'campus') {
      roof += `<polygon points="${n(pos.x - hw * 0.24)},${n(topY + 1.5)} ${n(pos.x + hw * 0.04)},${n(topY + 0.2)} ${n(pos.x + hw * 0.18)},${n(topY + 3.1)} ${n(pos.x - hw * 0.1)},${n(topY + 4.3)}"
        fill="#7cc0ff" opacity="0.42"/>`;
    } else if (archetype === 'civic') {
      roof += `<rect x="${n(pos.x - hw * 0.18)}" y="${n(topY + 1.4)}" width="${n(hw * 0.36)}" height="1.8" rx="0.6" fill="#f2ead1" opacity="0.78"/>`;
    }
  }
  if (detail !== 'low') {
    if (modelKit === 2 || modelKit === 6 || modelKit === 10 || modelKit === 13 || modelKit === 18 || modelKit === 22) {
      roof += `<ellipse cx="${n(pos.x)}" cy="${n(topY + 1.8)}" rx="${n(hw * 0.16)}" ry="${n(hd * 0.13)}" fill="#d8e3ef" opacity="0.78"/>`;
    } else if (modelKit === 4 || modelKit === 14 || modelKit === 20) {
      roof += `<rect x="${n(pos.x - hw * 0.22)}" y="${n(topY + 1.2)}" width="${n(hw * 0.44)}" height="1.9" rx="0.6" fill="#d9e8fa" opacity="0.72"/>`;
    } else if ((modelKit === 7 || modelKit === 12 || modelKit === 15 || modelKit === 21 || modelKit === 23) && detail === 'high') {
      roof += `<polygon points="${n(pos.x - hw * 0.18)},${n(topY + 1.2)} ${n(pos.x + hw * 0.02)},${n(topY - 3.2)} ${n(pos.x + hw * 0.2)},${n(topY + 1.2)} ${n(pos.x + hw * 0.02)},${n(topY + 4.2)}"
        fill="#c8d7eb" opacity="0.78" stroke="${p.outline}" stroke-width="0.4"/>`;
    }
  }
  if (building.buildingType === 'telecom' && detail !== 'low') {
    roof += `<line x1="${n(pos.x)}" y1="${n(topY - 17)}" x2="${n(pos.x)}" y2="${n(topY - 30)}" stroke="#e8eef7" stroke-width="1.2"/>
      <circle cx="${n(pos.x)}" cy="${n(topY - 31.5)}" r="2.2" fill="${p.glow}" opacity="0.52"/>`;
  } else if (building.buildingType === 'cityhall' && detail !== 'low') {
    roof += `<rect x="${n(pos.x - 6.2)}" y="${n(topY + 1.8)}" width="12.4" height="2.2" rx="0.6" fill="#f6f1d1" opacity="0.82"/>`;
  } else if (building.buildingType === 'factory' && detail === 'high') {
    roof += `<rect x="${n(pos.x + hw * 0.3)}" y="${n(topY - 8.5)}" width="2.4" height="8.5" fill="#8d99a6" opacity="0.9"/>
      <ellipse cx="${n(pos.x + hw * 0.31)}" cy="${n(topY - 9.3)}" rx="2.6" ry="1.1" fill="#d4d9de" opacity="0.58"/>`;
  }

  const roofDecor = isNeon && detail !== 'low' ? `<rect x="${n(pos.x - 8)}" y="${n(topY - 2)}" width="16" height="2" fill="${p.glow}" opacity="0.45" filter="url(#dcGlow)"/>` : '';
  const icon = detail === 'low' ? '' : `<text x="${n(pos.x)}" y="${n(topY - 9)}" text-anchor="middle" font-size="13">${building.info.icon}</text>`;

  const shortName = building.repoName.length > 13 ? `${building.repoName.slice(0, 13)}…` : building.repoName;
  const badge = building.stars > 0 ? ` ★${building.stars}` : '';
  const label = detail === 'high'
    ? `<text x="${n(pos.x)}" y="${n(pos.y + hd + 12)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.92">${escapeXml(shortName)}${badge}</text>`
    : detail === 'mid'
      ? `<text x="${n(pos.x)}" y="${n(pos.y + hd + 11)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.78">${escapeXml(shortName.slice(0, 8))}</text>`
      : '';

  const shadow = `<ellipse cx="${n(pos.x + 2)}" cy="${n(pos.y + 4)}" rx="${n(hw + 6)}" ry="${n(hd + 3)}" fill="${p.shadow}" opacity="0.25"/>`;
  const depthShade = `<polygon points="${n(pos.x)},${n(pos.y - h)} ${n(pos.x + hw)},${n(pos.y - hd - h)} ${n(pos.x + hw)},${n(pos.y - hd)} ${n(pos.x)},${n(pos.y)}"
    fill="#000" opacity="${(0.05 + depth * 0.11).toFixed(2)}"/>`;
  const depthFog = `<ellipse cx="${n(pos.x)}" cy="${n(pos.y - h * 0.42)}" rx="${n(hw * 0.75)}" ry="${n(hd * 0.55)}" fill="#fff" opacity="${(0.02 + depth * 0.06).toFixed(2)}"/>`;
  const accessory = renderTypeAccessory(building, zone, detail, pos, hw, hd, h, p);

  return `<g style="animation-delay:${(idx * 0.06).toFixed(2)}s" filter="url(#dcShadow)">${shadow}${lot}${lotProps}${body}${depthShade}${roof}${windows}${glassRight}${glassLeft}${depthFog}${accessory}${roofDecor}${icon}${label}</g>`;
}

function renderBuildings(buildings: CityBuilding[], grid: GridInfo, p: Palette, isNeon: boolean): string {
  if (buildings.length === 0) {
    return `<text x="400" y="255" text-anchor="middle" class="dc-text dc-sub" fill="${p.textMuted}">No buildings yet</text>`;
  }
  const sorted = [...buildings].sort((a, b) => (a.gridCol + a.gridRow) - (b.gridCol + b.gridRow));
  return `<g>${sorted.map((b, i) => renderBuilding(b, grid, p, isNeon, i, buildings.length)).join('')}</g>`;
}

function renderDistrictBlocks(buildings: CityBuilding[], grid: GridInfo, p: Palette): string {
  if (buildings.length === 0) return '';
  const zones: BuildingZone[] = ['residential', 'commercial', 'industrial', 'civic'];
  const zoneColor = (z: BuildingZone): string =>
    z === 'industrial' ? '#f0ba62' : z === 'commercial' ? '#77b9ff' : z === 'civic' ? '#d8b4fe' : '#8fe19b';
  const zoneLabel = (z: BuildingZone): string =>
    z === 'industrial' ? 'IND' : z === 'commercial' ? 'COM' : z === 'civic' ? 'CIV' : 'RES';

  let out = '';
  for (const z of zones) {
    const items = buildings.filter((b) => getZone(b.buildingType) === z);
    if (items.length === 0) continue;

    const pts = items.map((b) => gridToScreen(b.gridCol, b.gridRow, grid));
    const minX = Math.min(...pts.map((pt) => pt.x));
    const maxX = Math.max(...pts.map((pt) => pt.x));
    const minY = Math.min(...pts.map((pt) => pt.y));
    const maxY = Math.max(...pts.map((pt) => pt.y));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;
    const padX = 34;
    const padY = 18;

    out += `<polygon points="${n(cx)},${n(minY - padY)} ${n(maxX + padX)},${n(cy)} ${n(cx)},${n(maxY + padY)} ${n(minX - padX)},${n(cy)}"
      fill="${zoneColor(z)}" opacity="0.08" stroke="${zoneColor(z)}" stroke-width="0.8" stroke-dasharray="5 4"/>`;
    out += `<text x="${n(cx)}" y="${n(minY - padY - 3)}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}" opacity="0.72">${zoneLabel(z)}</text>`;
  }

  return `<g>${out}</g>`;
}

function renderDistrictRoadAccents(buildings: CityBuilding[], grid: GridInfo, p: Palette): string {
  if (buildings.length === 0) return '';
  const zones: BuildingZone[] = ['residential', 'commercial', 'industrial', 'civic'];
  let out = '';

  for (const z of zones) {
    const items = buildings.filter((b) => getZone(b.buildingType) === z);
    if (items.length === 0) continue;

    const pts = items.map((b) => gridToScreen(b.gridCol, b.gridRow, grid));
    const minX = Math.min(...pts.map((pt) => pt.x));
    const maxX = Math.max(...pts.map((pt) => pt.x));
    const minY = Math.min(...pts.map((pt) => pt.y));
    const maxY = Math.max(...pts.map((pt) => pt.y));
    const cx = (minX + maxX) / 2;
    const cy = (minY + maxY) / 2;

    if (z === 'commercial') {
      out += `<g opacity="0.5">
        <line x1="${n(minX - 18)}" y1="${n(cy - 6)}" x2="${n(maxX + 18)}" y2="${n(cy - 6)}" stroke="${p.lane}" stroke-width="0.9" stroke-dasharray="4 3"/>
        <line x1="${n(minX - 18)}" y1="${n(cy + 6)}" x2="${n(maxX + 18)}" y2="${n(cy + 6)}" stroke="${p.lane}" stroke-width="0.9" stroke-dasharray="4 3"/>
      </g>`;
    } else if (z === 'industrial') {
      out += `<g opacity="0.46">
        <rect x="${n(minX - 14)}" y="${n(cy - 2)}" width="7" height="4" rx="0.5" fill="#a9b4bf"/>
        <rect x="${n(maxX + 7)}" y="${n(cy - 2)}" width="7" height="4" rx="0.5" fill="#a9b4bf"/>
        <line x1="${n(minX - 8)}" y1="${n(cy)}" x2="${n(maxX + 8)}" y2="${n(cy)}" stroke="#9ea9b5" stroke-width="0.8" stroke-dasharray="3 4"/>
      </g>`;
    } else if (z === 'civic') {
      out += `<g opacity="0.48">
        <ellipse cx="${n(cx)}" cy="${n(cy)}" rx="${n(Math.max(12, (maxX - minX) * 0.22))}" ry="${n(Math.max(6, (maxY - minY) * 0.18))}" fill="#dce8f5" stroke="#a8bfd6" stroke-width="0.7"/>
        <circle cx="${n(cx)}" cy="${n(cy)}" r="2.2" fill="#91b9df"/>
      </g>`;
    } else {
      out += `<g opacity="0.42">
        <line x1="${n(minX - 12)}" y1="${n(cy - 5)}" x2="${n(maxX + 12)}" y2="${n(cy - 1)}" stroke="#b9dcb2" stroke-width="0.8"/>
        <line x1="${n(minX - 10)}" y1="${n(cy + 3)}" x2="${n(maxX + 10)}" y2="${n(cy + 7)}" stroke="#b9dcb2" stroke-width="0.8"/>
      </g>`;
    }
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
    out += `<polygon points="${n(pos.x)},${n(pos.y - 11)} ${n(pos.x + 22)},${n(pos.y + 1)} ${n(pos.x)},${n(pos.y + 13)} ${n(pos.x - 22)},${n(pos.y + 1)}" fill="${zColor}" opacity="0.22"/>
      <text x="${n(pos.x)}" y="${n(pos.y + 4)}" text-anchor="middle" class="dc-text dc-small" fill="${p.text}" opacity="0.68">${zLabel}</text>`;
  }
  return `<g>${out}</g>`;
}

function renderParks(grid: GridInfo, p: Palette): string {
  const cells = [
    gridToScreen(-0.6, 0.8, grid),
    gridToScreen(grid.cols - 0.15, grid.rows - 0.25, grid),
    gridToScreen(grid.cols / 2 - 0.2, -0.6, grid),
  ];
  return `<g>${cells.map((c) => `<polygon points="${n(c.x)},${n(c.y - 9)} ${n(c.x + 17)},${n(c.y)} ${n(c.x)},${n(c.y + 9)} ${n(c.x - 17)},${n(c.y)}" fill="${p.grass}" opacity="0.58"/>
      <circle cx="${n(c.x - 4)}" cy="${n(c.y - 4)}" r="3" fill="#2f9f57" opacity="0.82"/>
      <circle cx="${n(c.x + 3)}" cy="${n(c.y - 3)}" r="2.6" fill="#3fbf67" opacity="0.76"/>`).join('')}</g>`;
}

function renderLandmarks(tier: CityTier, grid: GridInfo, p: Palette): string {
  const plaza = gridToScreen(grid.cols / 2 - 0.4, grid.rows + 0.45, grid);
  let out = `<ellipse cx="${n(plaza.x)}" cy="${n(plaza.y)}" rx="24" ry="10" fill="#d9e7f4" opacity="0.35" stroke="${p.border}" stroke-width="0.7"/>
    <circle cx="${n(plaza.x)}" cy="${n(plaza.y - 1)}" r="4" fill="#88c7ff" opacity="0.55"/>`;
  if (tier.tier >= 3) {
    const wt = gridToScreen(-0.95, -0.15, grid);
    out += `<rect x="${n(wt.x - 2)}" y="${n(wt.y - 33)}" width="4" height="24" fill="#99a7b4" opacity="0.9"/>
      <ellipse cx="${n(wt.x)}" cy="${n(wt.y - 34)}" rx="9" ry="4.2" fill="#bac8d4" opacity="0.9"/>`;
  }
  if (tier.tier >= 4) {
    const st = gridToScreen(grid.cols + 0.55, 0.1, grid);
    out += `<ellipse cx="${n(st.x)}" cy="${n(st.y - 5)}" rx="20" ry="8" fill="#b7d5ef" opacity="0.35" stroke="#7ca5c7" stroke-width="0.6"/>
      <rect x="${n(st.x - 14)}" y="${n(st.y - 5)}" width="28" height="7" rx="3" fill="#9fbfd9" opacity="0.46"/>`;
  }
  if (tier.tier >= 5) {
    const mon = gridToScreen(grid.cols / 2 + 0.75, -0.95, grid);
    out += `<rect x="${n(mon.x - 5)}" y="${n(mon.y - 28)}" width="10" height="19" fill="#cfd9e1" opacity="0.92"/>
      <polygon points="${n(mon.x - 7)},${n(mon.y - 28)} ${n(mon.x)},${n(mon.y - 37)} ${n(mon.x + 7)},${n(mon.y - 28)}" fill="#a4bfd4" opacity="0.94"/>`;
  }
  return `<g>${out}</g>`;
}

function renderBackdropSkyline(tier: CityTier, p: Palette, style: CityStyle): string {
  const depth = tier.tier >= 4 ? 13 : tier.tier >= 2 ? 10 : 8;
  let blocks = '';
  for (let i = 0; i < depth; i++) {
    const x = 20 + i * (760 / depth);
    const w = 22 + ((i * 13) % 25);
    const h = 30 + ((i * 29) % 78) + tier.tier * 3;
    const y = 204 - h;
    const tint = style === 'neon' ? '#2a2950' : style === 'simcity' ? '#9cc0de' : '#4f6e8e';
    const shade = i % 2 === 0 ? lightenHex(tint, 0.08) : darkenHex(tint, 0.06);
    blocks += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${shade}" opacity="${style === 'neon' ? '0.34' : '0.28'}"/>`;
  }
  const haze = `<rect x="0" y="110" width="800" height="140" fill="${p.haze}" opacity="0.36"/>`;
  return `<g>${blocks}${haze}</g>`;
}

function renderStreetLife(grid: GridInfo, p: Palette): string {
  const corners = loopCorners(grid, 1.02);
  const props = [
    { x: corners.back.x + 10, y: corners.back.y + 8, s: 1 },
    { x: corners.right.x - 9, y: corners.right.y + 12, s: 0.95 },
    { x: corners.front.x - 5, y: corners.front.y - 1, s: 1.05 },
    { x: corners.left.x + 9, y: corners.left.y - 7, s: 0.9 },
  ];
  return `<g>${props.map((it, i) => `<g transform="translate(${n(it.x)} ${n(it.y)}) scale(${n(it.s)})">
    <ellipse cx="0" cy="2.2" rx="4.8" ry="2.1" fill="${p.shadow}" opacity="0.22"/>
    <rect x="-0.45" y="-6.2" width="0.9" height="7.8" fill="${darkenHex(p.border, 0.2)}"/>
    <rect x="-3.3" y="-7.3" width="6.6" height="1.4" rx="0.5" fill="${lightenHex(p.border, 0.2)}"/>
    ${i % 2 === 0 ? `<circle cx="2.2" cy="-5.4" r="0.9" fill="#ffd77a" opacity="0.78"/>` : `<circle cx="-2.2" cy="-5.4" r="0.9" fill="#9cc9ff" opacity="0.78"/>`}
  </g>`).join('')}</g>`;
}

function renderAtmosphere(p: Palette, style: CityStyle): string {
  const fog = `<ellipse cx="400" cy="218" rx="328" ry="72" fill="${p.haze}" opacity="${style === 'neon' ? '0.18' : '0.24'}"/>`;
  const beam = style === 'neon'
    ? `<polygon points="400,18 462,220 338,220" fill="#00ffd5" opacity="0.05"/>`
    : `<polygon points="400,16 484,230 316,230" fill="#ffffff" opacity="0.06"/>`;
  const vignette = `<rect x="0" y="0" width="800" height="398" fill="none" stroke="#000" stroke-width="36" opacity="0.08"/>`;
  return `<g>${beam}${fog}${vignette}</g>`;
}

function getTimeBand(now: Date = new Date()): TimeBand {
  const h = now.getHours();
  if (h >= 6 && h < 10) return 'morning';
  if (h >= 10 && h < 17) return 'day';
  if (h >= 17 && h < 21) return 'evening';
  return 'night';
}

function renderTraffic(traffic: CityTraffic, grid: GridInfo, p: Palette): string {
  if (traffic.vehicleCount <= 0) return '';
  const timeBand = getTimeBand();
  const rush = timeBand === 'morning' || timeBand === 'evening' || traffic.level >= 3;

  const outer = loopCorners(grid, 1.05);
  const inner = loopCorners(grid, 0.45);
  const outerPath = `M ${n(outer.back.x)} ${n(outer.back.y)} L ${n(outer.right.x)} ${n(outer.right.y)} L ${n(outer.front.x)} ${n(outer.front.y)} L ${n(outer.left.x)} ${n(outer.left.y)} Z`;
  const innerPath = `M ${n(inner.back.x)} ${n(inner.back.y)} L ${n(inner.right.x)} ${n(inner.right.y)} L ${n(inner.front.x)} ${n(inner.front.y)} L ${n(inner.left.x)} ${n(inner.left.y)} Z`;

  const types = [
    { kind: 'bus', body: '#ff8f3f', accent: '#ffd6a1', w: 15.5, h: 5.4 },
    { kind: 'truck', body: '#5f8cf5', accent: '#b7ccff', w: 14.3, h: 5.2 },
    { kind: 'taxi', body: '#ffd447', accent: '#fff1b6', w: 11.2, h: 4.6 },
  ] as const;

  let cars = `<path id="dcCarOuter" d="${outerPath}" fill="none" stroke="none"/><path id="dcCarInner" d="${innerPath}" fill="none" stroke="none"/>`;
  for (let i = 0; i < Math.max(2, traffic.vehicleCount); i++) {
    const t = types[i % types.length];
    const laneOuter = i % 2 === 0;
    const path = laneOuter ? '#dcCarOuter' : '#dcCarInner';
    const reverse = !laneOuter;
    const delay = (i * 1.15 + ((i * 17) % 7) / 10).toFixed(1);
    const baseDur = t.kind === 'taxi' ? 8.5 : t.kind === 'truck' ? 11.2 : 13;
    const dur = (baseDur + (i % 3) * 0.45).toFixed(1);

    const hl = t.w * 0.42;
    const hd = t.h * 0.52;
    const yMid = 1.2;
    const yDown = yMid + t.h * 0.7;

    cars += `<g>
      <g>
        <polygon points="0,${n(-hd)} ${n(hl)},${n(yMid)} 0,${n(hd)} ${n(-hl)},${n(yMid)}" fill="${t.body}" opacity="0.95"/>
        <polygon points="${n(hl)},${n(yMid)} ${n(hl)},${n(yDown)} 0,${n(yDown + hd * 0.7)} 0,${n(hd)}" fill="${darkenHex(t.body, 0.18)}" opacity="0.9"/>
        <polygon points="${n(-hl)},${n(yMid)} 0,${n(hd)} 0,${n(yDown + hd * 0.7)} ${n(-hl)},${n(yDown)}" fill="${darkenHex(t.body, 0.28)}" opacity="0.88"/>
        <polygon points="0,${n(-hd - 1.9)} ${n(hl * 0.55)},${n(-1.8)} 0,${n(hd - 1.8)} ${n(-hl * 0.55)},${n(-1.8)}" fill="${t.accent}" opacity="0.9"/>
        <ellipse cx="${n(-hl * 0.54)}" cy="${n(yDown + 0.9)}" rx="1.2" ry="0.65" fill="#1f2937"/>
        <ellipse cx="${n(hl * 0.54)}" cy="${n(yDown + 0.9)}" rx="1.2" ry="0.65" fill="#1f2937"/>
      </g>
      <animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" rotate="auto${reverse ? '-reverse' : ''}"><mpath href="${path}"/></animateMotion>
    </g>`;
  }

  const signalCycle = rush ? 8 : 6;
  const signals = `<g>
    <circle cx="${n(outer.back.x - 17)}" cy="${n(outer.back.y + 8)}" r="2.3" fill="#ef4444" opacity="0.42"><animate attributeName="opacity" values="1;0.25;0.25;1" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
    <circle cx="${n(outer.right.x - 10)}" cy="${n(outer.right.y + 14)}" r="2.3" fill="#22c55e" opacity="0.34"><animate attributeName="opacity" values="0.25;1;0.25;0.25" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
    <circle cx="${n(outer.front.x + 16)}" cy="${n(outer.front.y - 2)}" r="2.3" fill="#f59e0b" opacity="0.28"><animate attributeName="opacity" values="0.25;0.25;1;0.25" dur="${signalCycle}s" repeatCount="indefinite"/></circle>
  </g>`;

  return `<g>${cars}${signals}</g>`;
}

function renderWeather(weather: WeatherInfo, p: Palette): string {
  switch (weather.type) {
    case 'sunny':
      return `<g><circle cx="704" cy="72" r="16" fill="#ffd778" opacity="0.9" filter="url(#dcGlow)"/><circle cx="704" cy="72" r="26" fill="#ffd778" opacity="0.18"/></g>`;
    case 'cloudy':
    case 'cloudy_s':
      return `<g opacity="0.55"><ellipse cx="642" cy="72" rx="34" ry="10" fill="#d9e3ef"/><ellipse cx="672" cy="74" rx="24" ry="9" fill="#c4d1df"/></g>`;
    case 'rainy': {
      let rain = '';
      for (let i = 0; i < 22; i++) {
        const x = 120 + ((i * 37) % 560);
        const d = ((i * 11) % 14) / 10;
        rain += `<line x1="${x}" y1="12" x2="${x - 3}" y2="22" stroke="#7fb8e4" stroke-width="1" opacity="0.44"><animate attributeName="transform" values="translate(0,-10);translate(0,410)" dur="1.7s" begin="${d}s" repeatCount="indefinite"/></line>`;
      }
      return `<g>${rain}</g>`;
    }
    case 'snowy': {
      let snow = '';
      for (let i = 0; i < 18; i++) {
        const x = 140 + ((i * 41) % 520);
        const d = ((i * 7) % 20) / 10;
        snow += `<circle cx="${x}" cy="10" r="1.5" fill="#fff" opacity="0.75"><animate attributeName="transform" values="translate(0,-8);translate(16,390)" dur="4.2s" begin="${d}s" repeatCount="indefinite"/></circle>`;
      }
      return `<g>${snow}</g>`;
    }
    case 'rainbow':
      return `<g opacity="0.35"><path d="M220,215 A180,180 0 0,1 580,215" fill="none" stroke="#ff5a5a" stroke-width="4"/><path d="M228,215 A172,172 0 0,1 572,215" fill="none" stroke="#ffd35c" stroke-width="4"/><path d="M236,215 A164,164 0 0,1 564,215" fill="none" stroke="#58d68d" stroke-width="4"/></g>`;
    case 'fireworks':
      return `<g><circle cx="158" cy="64" r="2" fill="#ff7f50"/><circle cx="632" cy="52" r="2" fill="#5f8cf5"/></g>`;
    case 'volcano':
      return `<g><circle cx="390" cy="166" r="8" fill="#ff6b6b" opacity="0.2"/></g>`;
    default:
      return '';
  }
}

function fmtPop(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
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
  const items = [
    ['Buildings', String(stats.totalBuildings)],
    ['Population', fmtPop(stats.population)],
    ['Commits', String(stats.totalCommits)],
    ['Stars', String(stats.totalStars)],
    ['Streak', `${stats.streakDays}d`],
    ['Top', stats.topLanguage],
  ] as const;
  const unit = SVG_WIDTH / items.length;
  const labels = items.map((it, i) => {
    const x = unit / 2 + i * unit;
    return `<text x="${n(x)}" y="${y + 19}" text-anchor="middle" class="dc-text dc-small" fill="${p.textMuted}">${it[0]}</text>
    <text x="${n(x)}" y="${y + 35}" text-anchor="middle" class="dc-text dc-sub" fill="${p.text}">${escapeXml(it[1])}</text>`;
  }).join('');
  return `<g><line x1="18" y1="${y + 3}" x2="782" y2="${y + 3}" stroke="${p.border}" stroke-width="0.8"/>${labels}</g>`;
}

export interface CityRenderData {
  username: string;
  profile: CityProfile;
  config: DevCityConfig;
  theme: ThemeColors;
}

export function renderCity(data: CityRenderData): string {
  const { username, profile, config, theme } = data;
  const style: CityStyle = config.city_style || 'tycoon';
  const isNeon = style === 'neon';
  const p = getPalette(style, theme);
  const cameraTransform = style === 'neon'
    ? 'translate(-8,4) scale(1.03,0.97)'
    : style === 'simcity'
      ? 'translate(-6,2) scale(1.02,0.98)'
      : 'translate(-4,3) scale(1.015,0.985)';

  const grid = getGrid(profile.buildings.length);
  const layers = [
    renderBackdropSkyline(profile.tier, p, style),
    renderAtmosphere(p, style),
    renderGround(grid, p, style),
    renderRoads(grid, p),
    renderStreetLife(grid, p),
    renderDistrictBlocks(profile.buildings, grid, p),
    renderDistrictRoadAccents(profile.buildings, grid, p),
    style === 'simcity' ? renderSimcityZoning(profile.buildings, grid, p) : '',
    style === 'simcity' ? renderParks(grid, p) : '',
    renderBuildings(profile.buildings, grid, p, isNeon),
    style === 'simcity' ? renderLandmarks(profile.tier, grid, p) : '',
    config.show_traffic !== false ? renderTraffic(profile.traffic, grid, p) : '',
    config.show_weather !== false ? renderWeather(profile.weather, p) : '',
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
${buildDefs(p, isNeon)}
${buildStyles(config.animation !== false)}
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="url(#dcSky)"/>
<rect x="0" y="${CITY_Y}" width="${SVG_WIDTH}" height="${CITY_HEIGHT}" fill="${p.haze}" opacity="0.06"/>
${renderHeader(username, profile.tier, profile.weather, p)}
<g transform="translate(0,${CITY_Y}) ${cameraTransform}">${layers}</g>
${renderFooter(profile.stats, p)}
<rect x="1" y="1" width="798" height="498" rx="15" fill="none" stroke="${p.border}" stroke-width="1" opacity="0.58"/>
</svg>`;
}
