// ═══════════════════════════════════════════════════════════════
// 🏙️ Metro City Renderer - 독립형 현대 도시 건설 시각화 모듈
// ═══════════════════════════════════════════════════════════════
//
// dev-city와 완전히 분리된 독자 렌더러.
// 8가지 새로운 건물 타입 + 낮 시간대 현대 메트로폴리스 테마.
// "도시가 건설되는" 느낌을 주는 공사 크레인·비계 포함.

import { ThemeColors } from '../../types';
import {
  MetroType, MetroCityTier, MetroWeather, MetroTraffic,
  MetroStats, MetroBuilding, MetroCityProfile,
} from './metro-analyzer';

// ── 캔버스 상수 ──────────────────────────────────────────────
const SW = 800, SH = 500;
const HH = 50, FH = 52;          // Header/Footer 높이
const CY_START = HH;
const CITY_H = SH - HH - FH;

// 아이소메트릭 그리드 원점
const OX = 400, OY = 278;
const TW = 112, TH = 58;

// ── 타입 ─────────────────────────────────────────────────────
interface Pt { x: number; y: number; }

// ── 팔레트 ───────────────────────────────────────────────────
interface MP {
  skyTop: string; skyMid: string; skyBottom: string; haze: string;
  gnd: string; gndB: string; grass: string; water: string;
  road: string; lane: string;
  text: string; textMuted: string; border: string; outline: string;
  shadow: string; glow: string; window: string;
}

const PAL: MP = {
  skyTop:    '#4A8EC0', skyMid:   '#7ABAE0', skyBottom: '#C4E8F4',
  haze:      'rgba(255,255,255,0.38)',
  gnd:       '#B0BCAA', gndB:     '#869477',
  grass:     '#68B84E', water:    '#4E98C0',
  road:      '#383838', lane:     '#F0F0F0',
  text:      '#1A2030', textMuted: '#5A6070',
  border:    '#7888A0', outline:  '#384450',
  shadow:    'rgba(0,0,0,0.26)', glow: '#FF8E0A',
  window:    '#B4DCF0',
};

// ── 유틸리티 ──────────────────────────────────────────────────
function n(v: number): string { return v.toFixed(1); }
function clamp(v: number, lo: number, hi: number): number { return Math.max(lo, Math.min(hi, v)); }
function escXml(s: string): string {
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
          .replace(/"/g,'&quot;').replace(/'/g,'&apos;');
}

function lighten(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `#${Math.min(255,Math.round(r+(255-r)*amt)).toString(16).padStart(2,'0')}${Math.min(255,Math.round(g+(255-g)*amt)).toString(16).padStart(2,'0')}${Math.min(255,Math.round(b+(255-b)*amt)).toString(16).padStart(2,'0')}`;
}
function darken(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
  return `#${Math.round(r*(1-amt)).toString(16).padStart(2,'0')}${Math.round(g*(1-amt)).toString(16).padStart(2,'0')}${Math.round(b*(1-amt)).toString(16).padStart(2,'0')}`;
}
function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = (h * 16777619) >>> 0; }
  return h;
}

function isoXY(r: number, l: number, top: number): Pt {
  return { x: OX + (r - l) * (TW / 2), y: OY + (r + l) * (TH / 2) - top };
}
function gridXY(col: number, row: number, grid: { cols: number; rows: number; cc: number; cr: number }): Pt {
  return isoXY(col - grid.cc, row - grid.cr, 0);
}
function mkGrid(cnt: number) {
  const cols = Math.min(5, Math.max(1, cnt));
  const rows = Math.max(1, Math.ceil(Math.max(1, cnt) / cols));
  return { cols, rows, cc: (cols - 1) / 2, cr: (rows - 1) / 2 };
}
function corners(grid: ReturnType<typeof mkGrid>, pad: number) {
  return {
    back:  gridXY(-pad, -pad, grid),
    right: gridXY(grid.cols - 1 + pad, -pad, grid),
    front: gridXY(grid.cols - 1 + pad, grid.rows - 1 + pad, grid),
    left:  gridXY(-pad, grid.rows - 1 + pad, grid),
  };
}

// ── 건물 색상 테이블 ──────────────────────────────────────────
const METRO_COLORS: Record<MetroType, { main: string; accent: string }> = {
  skyscraper:   { main: '#A8C8E0', accent: '#4888C8' },
  hospital:     { main: '#E8F2FA', accent: '#D02828' },
  school:       { main: '#E4D470', accent: '#A88820' },
  stadium:      { main: '#8AB84E', accent: '#487820' },
  hotel:        { main: '#C8B480', accent: '#785830' },
  church:       { main: '#CCCAC0', accent: '#8A7462' },
  bank:         { main: '#E0D8A8', accent: '#988638' },
  construction: { main: '#E89818', accent: '#C05800' },
};

// ── 건물 질량 프로파일 ─────────────────────────────────────────
function massOf(t: MetroType): { hw: number; hd: number; hScale: number } {
  const base = { hw: 24, hd: 12 };
  switch (t) {
    case 'skyscraper':   return { ...base, hScale: 1.58 };
    case 'hospital':     return { hw: 32, hd: 15, hScale: 0.74 };
    case 'school':       return { hw: 30, hd: 14, hScale: 0.70 };
    case 'stadium':      return { hw: 34, hd: 16, hScale: 0.54 };
    case 'hotel':        return { hw: 24, hd: 12, hScale: 1.10 };
    case 'church':       return { hw: 27, hd: 13, hScale: 0.90 };
    case 'bank':         return { hw: 29, hd: 14, hScale: 0.76 };
    case 'construction': return { hw: 22, hd: 11, hScale: 1.14 };
  }
}

// ── 아이소메트릭 기본 도형 헬퍼 ──────────────────────────────
function prism(cx: number, cy: number, hw: number, hd: number, h: number,
               tC: string, rC: string, lC: string, ol: string): string {
  return (
    `<polygon points="${n(cx)},${n(cy-h)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-2*hd-h)} ${n(cx-hw)},${n(cy-hd-h)}" fill="${tC}" stroke="${ol}" stroke-width="0.5"/>` +
    `<polygon points="${n(cx)},${n(cy)} ${n(cx+hw)},${n(cy-hd)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(cy-h)}" fill="${rC}" stroke="${ol}" stroke-width="0.5"/>` +
    `<polygon points="${n(cx)},${n(cy)} ${n(cx)},${n(cy-h)} ${n(cx-hw)},${n(cy-hd-h)} ${n(cx-hw)},${n(cy-hd)}" fill="${lC}" stroke="${ol}" stroke-width="0.5"/>`
  );
}
function hipRoof(cx: number, cy: number, hw: number, hd: number, h: number, rh: number,
                 rC: string, lC: string, ol: string): string {
  const py = cy - hd - h - rh;
  return (
    `<polygon points="${n(cx)},${n(cy-h)} ${n(cx+hw)},${n(cy-hd-h)} ${n(cx)},${n(py)}" fill="${rC}" stroke="${ol}" stroke-width="0.5"/>` +
    `<polygon points="${n(cx)},${n(cy-h)} ${n(cx-hw)},${n(cy-hd-h)} ${n(cx)},${n(py)}" fill="${lC}" stroke="${ol}" stroke-width="0.5"/>`
  );
}
function spire(cx: number, cy: number, hw: number, hd: number, h: number, sh: number,
               rC: string, lC: string, ol: string): string {
  const sw = hw * 0.12, sd = hd * 0.12;
  return (
    `<polygon points="${n(cx)},${n(cy-h)} ${n(cx+sw)},${n(cy-sd-h)} ${n(cx)},${n(cy-sd-h-sh)}" fill="${rC}" stroke="${ol}" stroke-width="0.4"/>` +
    `<polygon points="${n(cx)},${n(cy-h)} ${n(cx-sw)},${n(cy-sd-h)} ${n(cx)},${n(cy-sd-h-sh)}" fill="${lC}" stroke="${ol}" stroke-width="0.4"/>`
  );
}
function dome(cx: number, cy: number, rx: number, ry: number, dh: number, col: string, ol: string): string {
  let s = '';
  for (let i = 0; i <= 7; i++) {
    const t = i / 7, r = Math.sqrt(1 - t * t);
    s += `<ellipse cx="${n(cx)}" cy="${n(cy - dh * t)}" rx="${n(rx * r)}" ry="${n(ry * r)}" fill="${lighten(col, t * 0.36)}" stroke="${i === 0 ? ol : 'none'}" stroke-width="0.4"/>`;
  }
  return s;
}

// ── 건물 본체 ─────────────────────────────────────────────────
function renderBody(t: MetroType, cx: number, cy: number,
                    hw: number, hd: number, h: number,
                    top: string, right: string, left: string, ol: string): string {
  switch (t) {

    // 마천루: 로비 기단 + 두꺼운 샤프트 + 세트백 + 첨탑
    case 'skyscraper': {
      const lH = h * 0.10;
      const sW = hw * 0.60, sD = hd * 0.56, sH = h * 0.60;
      const uW = hw * 0.38, uD = hd * 0.34, uH = h * 0.22;
      const sT = lighten(top, 0.16), sL = darken(left, 0.06);
      const uT = lighten(top, 0.32), uL = lighten(left, 0.08);
      return (
        prism(cx, cy, hw, hd, lH, darken(top,0.08), darken(right,0.12), darken(left,0.18), ol) +
        prism(cx, cy-lH, sW, sD, sH, sT, right, sL, ol) +
        prism(cx, cy-lH-sH, uW, uD, uH, uT, lighten(right,0.12), uL, ol) +
        spire(cx, cy-lH-sH, uW, uD, uH, h*0.20, lighten(uT,0.36), lighten(uL,0.22), ol)
      );
    }

    // 병원: H자형 평면 (좌우 날개 + 중앙 높은 블록)
    case 'hospital': {
      const wW = hw*0.52, wD = hd*0.48, wH = h*0.65;
      const wT = lighten(top,0.08), wR = darken(right,0.04), wL = darken(left,0.08);
      return (
        prism(cx-hw*0.50, cy+hd*0.10, wW, wD, wH, top, right, left, ol) +
        prism(cx+hw*0.50, cy-hd*0.10, wW, wD, wH, wT, wR, wL, ol) +
        prism(cx, cy, hw*0.46, hd*0.42, h, lighten(top,0.14), top, darken(left,0.04), ol) +
        hipRoof(cx-hw*0.50, cy+hd*0.10, wW, wD, wH, wH*0.20, lighten(right,0.24), lighten(left,0.16), ol) +
        hipRoof(cx+hw*0.50, cy-hd*0.10, wW, wD, wH, wH*0.20, lighten(right,0.24), lighten(left,0.16), ol)
      );
    }

    // 학교: 넓은 정면 + 좌우 익관 + hip 지붕
    case 'school': {
      const mH = h*0.64, sW = hw*0.36, sD = hd*0.32, sH = h*0.50;
      const rC = darken(top,0.06);
      return (
        prism(cx, cy, hw, hd, mH, top, right, left, ol) +
        prism(cx-hw*0.72, cy+hd*0.18, sW, sD, sH, darken(top,0.04), darken(right,0.06), darken(left,0.10), ol) +
        prism(cx+hw*0.72, cy-hd*0.18, sW, sD, sH, darken(top,0.04), darken(right,0.06), darken(left,0.10), ol) +
        hipRoof(cx, cy, hw, hd, mH, mH*0.28, lighten(right,0.28), lighten(left,0.20), ol) +
        hipRoof(cx-hw*0.72, cy+hd*0.18, sW, sD, sH, sH*0.24, lighten(rC,0.22), lighten(rC,0.14), ol) +
        hipRoof(cx+hw*0.72, cy-hd*0.18, sW, sD, sH, sH*0.24, lighten(rC,0.22), lighten(rC,0.14), ol)
      );
    }

    // 경기장: 타원형 외벽 링 + 내부 관람석 단
    case 'stadium': {
      const ouH = h*0.38;
      const sT = lighten(top,0.20), sR = darken(right,0.04), sL = darken(left,0.08);
      return (
        prism(cx, cy, hw, hd, ouH, top, right, left, ol) +
        prism(cx-hw*0.34, cy+hd*0.08, hw*0.30, hd*0.26, h*0.64, sT, sR, sL, ol) +
        prism(cx+hw*0.34, cy-hd*0.08, hw*0.30, hd*0.26, h*0.64, sT, sR, sL, ol) +
        prism(cx, cy-hd*0.28, hw*0.82, hd*0.26, h*0.52, lighten(sT,0.10), darken(sR,0.03), darken(sL,0.06), ol)
      );
    }

    // 호텔: 넓은 로비 + 슬림 타워 + 펜트하우스
    case 'hotel': {
      const pH = h*0.16, tW = hw*0.52, tD = hd*0.48, tH = h*0.76;
      const tT = lighten(top,0.12), tL = darken(left,0.06);
      return (
        prism(cx, cy, hw, hd, pH, darken(top,0.06), darken(right,0.10), darken(left,0.14), ol) +
        prism(cx, cy-pH, tW, tD, tH, tT, right, tL, ol) +
        prism(cx, cy-pH-tH, tW*0.70, tD*0.68, h*0.10, lighten(tT,0.20), lighten(right,0.14), lighten(tL,0.10), ol)
      );
    }

    // 교회: 본당 + hip 지붕 + 종탑 + 첨탑
    case 'church': {
      const nW = hw*0.74, nD = hd*0.68, nH = h*0.52;
      const tW = hw*0.22, tD = hd*0.20, tH = h*1.22;
      const sT = darken(top,0.04);
      return (
        prism(cx-hw*0.22, cy+hd*0.06, nW, nD, nH, sT, right, left, ol) +
        hipRoof(cx-hw*0.22, cy+hd*0.06, nW, nD, nH, nH*0.48, lighten(right,0.32), lighten(left,0.22), ol) +
        prism(cx+hw*0.68, cy-hd*0.22, tW, tD, tH, lighten(sT,0.10), darken(right,0.05), darken(left,0.10), ol) +
        spire(cx+hw*0.68, cy-hd*0.22, tW, tD, tH, h*0.38, lighten(top,0.44), lighten(left,0.26), ol)
      );
    }

    // 은행: 계단 기단 + 고전 본관 + 페디먼트
    case 'bank': {
      const bH = h*0.14, bdW = hw*0.88, bdD = hd*0.82, bdH = h*0.70;
      return (
        prism(cx, cy, hw, hd, bH, darken(top,0.12), darken(right,0.16), darken(left,0.22), ol) +
        prism(cx, cy-bH, bdW, bdD, bdH, lighten(top,0.18), darken(right,0.02), darken(left,0.06), ol) +
        hipRoof(cx, cy-bH, bdW, bdD, bdH, bdH*0.22, lighten(right,0.28), lighten(left,0.20), ol)
      );
    }

    // 건설현장: 콘크리트 코어 + 부분 벽체 + 타워 크레인
    case 'construction': {
      const cW = hw*0.56, cD = hd*0.52, cH = h*0.58;
      const cT = darken(top,0.08), cR = darken(right,0.12), cL = darken(left,0.18);
      const mX = cx + hw*0.44, mTopY = cy - h*1.38;
      const orange = '#DA8A14';
      return (
        prism(cx, cy, cW, cD, cH, cT, cR, cL, ol) +
        prism(cx+hw*0.48, cy-hd*0.06, hw*0.12, hd*0.10, h*0.36, cT, cR, cL, ol) +
        prism(cx-hw*0.48, cy+hd*0.06, hw*0.12, hd*0.10, h*0.44, cT, cR, cL, ol) +
        // 크레인 마스트
        `<line x1="${n(mX)}" y1="${n(cy)}" x2="${n(mX)}" y2="${n(mTopY)}" stroke="${orange}" stroke-width="2.0" stroke-linecap="round" opacity="0.92"/>` +
        // 주 지브
        `<line x1="${n(mX)}" y1="${n(mTopY)}" x2="${n(mX+hw*1.80)}" y2="${n(mTopY+hd*0.88)}" stroke="${orange}" stroke-width="1.4" opacity="0.90"/>` +
        // 카운터 지브
        `<line x1="${n(mX)}" y1="${n(mTopY)}" x2="${n(mX-hw*0.82)}" y2="${n(mTopY+hd*0.40)}" stroke="${orange}" stroke-width="1.4" opacity="0.88"/>` +
        // 크레인 캡
        `<rect x="${n(mX-3)}" y="${n(mTopY-3)}" width="6" height="5" rx="1" fill="${orange}" opacity="0.90"/>` +
        // 후크 와이어
        `<line x1="${n(mX+hw*1.40)}" y1="${n(mTopY+hd*0.68)}" x2="${n(mX+hw*1.40)}" y2="${n(mTopY+hd*0.68+h*0.70)}" stroke="#a8b0b8" stroke-width="0.7" stroke-dasharray="2.5 2" opacity="0.68"/>`
      );
    }
  }
}

// ── 건물 장식 ─────────────────────────────────────────────────
function renderAccessory(
  t: MetroType, detail: 'high' | 'mid',
  cx: number, cy: number, hw: number, hd: number, h: number,
  accent: string, main: string
): string {
  switch (t) {
    case 'skyscraper': {
      // 유리 커튼월 광택
      const sheen = `<polygon points="${n(cx+hw*0.08)},${n(cy-hd*0.08-h*0.12)} ${n(cx+hw*0.20)},${n(cy-hd*0.20-h*0.24)} ${n(cx+hw*0.18)},${n(cy-hd*0.18-h*0.90)} ${n(cx+hw*0.06)},${n(cy-hd*0.06-h*0.78)}" fill="#fff" opacity="0.18"/>`;
      // 헬리패드 H (고상도)
      const heliY = cy - h*1.14 - hd*0.36 - 2;
      const hp = detail === 'high'
        ? `<ellipse cx="${n(cx)}" cy="${n(heliY)}" rx="5.0" ry="2.2" fill="none" stroke="#fff" stroke-width="0.7" opacity="0.60"/><text x="${n(cx)}" y="${n(heliY+1.4)}" text-anchor="middle" font-size="5" fill="white" opacity="0.58" font-family="sans-serif">H</text>`
        : '';
      return sheen + hp;
    }
    case 'hospital': {
      // 정면 붉은 십자
      const cX = cx+hw*0.14, cY = cy-hd*0.14-h*0.50, cW = hw*0.04, cH = h*0.12;
      const cross = detail === 'high'
        ? `<polygon points="${n(cX-cW)},${n(cY-cH*0.38)} ${n(cX+cW)},${n(cY-cH*0.38)} ${n(cX+cW)},${n(cY+cH*0.38)} ${n(cX-cW)},${n(cY+cH*0.38)}" fill="${accent}" opacity="0.90"/>
           <polygon points="${n(cX-cH*0.38)},${n(cY-cW)} ${n(cX+cH*0.38)},${n(cY-cW)} ${n(cX+cH*0.38)},${n(cY+cW)} ${n(cX-cH*0.38)},${n(cY+cW)}" fill="${accent}" opacity="0.90"/>`
        : `<rect x="${n(cX-cW)}" y="${n(cY-cH*0.38)}" width="${n(cW*2)}" height="${n(cH*0.76)}" fill="${accent}" opacity="0.80"/>`;
      const lamp = detail === 'high'
        ? `<circle cx="${n(cx-hw*0.56)}" cy="${n(cy+hd*0.18)}" r="1.6" fill="#d02828" opacity="0.86" filter="url(#mcGlow)"/>` : '';
      return cross + lamp;
    }
    case 'school': {
      // 국기봉 + 깃발
      const fpX = cx-hw*0.04, fpBase = cy-hd*0.04-h*0.68, poleH = h*0.28, flagH = hd*0.14;
      return (
        `<line x1="${n(fpX)}" y1="${n(fpBase)}" x2="${n(fpX)}" y2="${n(fpBase-poleH)}" stroke="#c8b870" stroke-width="0.8" opacity="0.90"/>` +
        `<polygon points="${n(fpX)},${n(fpBase-poleH)} ${n(fpX+hw*0.22)},${n(fpBase-poleH+flagH*0.5)} ${n(fpX)},${n(fpBase-poleH+flagH)}" fill="${accent}" opacity="0.88"/>` +
        `<polygon points="${n(cx-hw*0.30)},${n(cy+hd*0.22)} ${n(cx+hw*0.30)},${n(cy+hd*0.22)} ${n(cx+hw*0.22)},${n(cy+hd*0.36)} ${n(cx-hw*0.22)},${n(cy+hd*0.36)}" fill="${lighten(main,0.28)}" opacity="0.80"/>`
      );
    }
    case 'stadium': {
      // 조명탑 마스트
      let out = '';
      for (const [mx, my] of [[cx-hw*0.88, cy+hd*0.18],[cx+hw*0.88, cy-hd*0.18]] as const) {
        out += `<line x1="${n(mx)}" y1="${n(my)}" x2="${n(mx)}" y2="${n(my-h*0.68)}" stroke="#b8c8d0" stroke-width="1.0" opacity="0.78"/>`;
        if (detail === 'high')
          out += `<rect x="${n(mx-4)}" y="${n(my-h*0.68-2)}" width="8" height="2.5" rx="0.8" fill="${PAL.glow}" opacity="0.68" filter="url(#mcGlow)"/>`;
      }
      // 전광판
      out += `<polygon points="${n(cx+hw*0.08)},${n(cy-hd*0.08-h*0.60)} ${n(cx+hw*0.52)},${n(cy-hd*0.52-h*0.60)} ${n(cx+hw*0.52)},${n(cy-hd*0.52-h*0.70)} ${n(cx+hw*0.08)},${n(cy-hd*0.08-h*0.70)}" fill="${darken(main,0.30)}" opacity="0.84" stroke="#3a4a5c" stroke-width="0.5"/>`;
      return out;
    }
    case 'hotel': {
      const sign = `<polygon points="${n(cx+hw*0.08)},${n(cy-hd*0.08-h*0.56)} ${n(cx+hw*0.46)},${n(cy-hd*0.46-h*0.56)} ${n(cx+hw*0.46)},${n(cy-hd*0.46-h*0.66)} ${n(cx+hw*0.08)},${n(cy-hd*0.08-h*0.66)}" fill="${lighten(accent,0.38)}" opacity="0.78" stroke="${lighten(accent,0.56)}" stroke-width="0.6"/>`;
      const canopy = `<line x1="${n(cx+hw*0.08)}" y1="${n(cy-hd*0.08-h*0.17)}" x2="${n(cx+hw*0.46)}" y2="${n(cy-hd*0.46-h*0.17)}" stroke="${accent}" stroke-width="2.0" opacity="0.76"/>`;
      const pool = detail === 'high'
        ? `<ellipse cx="${n(cx-hw*0.04)}" cy="${n(cy-h*1.10-hd*0.02)}" rx="${n(hw*0.24)}" ry="${n(hd*0.16)}" fill="#60a8d0" opacity="0.50" stroke="#4888b0" stroke-width="0.5"/>` : '';
      return sign + canopy + pool;
    }
    case 'church': {
      // 십자가 (첨탑 위)
      const cX = cx+hw*0.68, cTopY = cy-hd*0.22-h*1.60-4;
      const cross = `<line x1="${n(cX)}" y1="${n(cTopY)}" x2="${n(cX)}" y2="${n(cTopY+6)}" stroke="#d0c8b8" stroke-width="1.0" opacity="0.86"/>
        <line x1="${n(cX-2.8)}" y1="${n(cTopY+1.8)}" x2="${n(cX+2.8)}" y2="${n(cTopY+1.8)}" stroke="#d0c8b8" stroke-width="1.0" opacity="0.86"/>`;
      const arch = `<polygon points="${n(cx+hw*0.10)},${n(cy)} ${n(cx+hw*0.46)},${n(cy)} ${n(cx+hw*0.46)},${n(cy-h*0.30)} ${n(cx+hw*0.10)},${n(cy-h*0.30)}" fill="#1a1f28" opacity="0.52" stroke="#3a4650" stroke-width="0.5"/>`;
      const rose = detail === 'high'
        ? `<ellipse cx="${n(cx-hw*0.18)}" cy="${n(cy-hd*0.18-h*0.36)}" rx="${n(hw*0.12)}" ry="${n(hd*0.16)}" fill="${accent}" opacity="0.44" stroke="${lighten(accent,0.40)}" stroke-width="0.6"/>` : '';
      return arch + rose + cross;
    }
    case 'bank': {
      const marC = lighten(main, 0.50);
      let cols = '';
      for (const cu of [0.08, 0.20, 0.34, 0.48]) {
        cols += `<polygon points="${n(cx+cu*hw)},${n(cy-cu*hd-h*0.14)} ${n(cx+(cu+0.028)*hw)},${n(cy-(cu+0.028)*hd-h*0.14)} ${n(cx+(cu+0.028)*hw)},${n(cy-(cu+0.028)*hd-h*0.74)} ${n(cx+cu*hw)},${n(cy-cu*hd-h*0.74)}" fill="${marC}" opacity="0.88" stroke="${PAL.outline}" stroke-width="0.5"/>`;
      }
      const steps = `<polygon points="${n(cx-hw*0.38)},${n(cy+hd*0.24)} ${n(cx+hw*0.38)},${n(cy+hd*0.24)} ${n(cx+hw*0.30)},${n(cy+hd*0.40)} ${n(cx-hw*0.30)},${n(cy+hd*0.40)}" fill="${lighten(main,0.22)}" opacity="0.80"/>`;
      const ent = `<polygon points="${n(cx+hw*0.06)},${n(cy)} ${n(cx+hw*0.48)},${n(cy)} ${n(cx+hw*0.48)},${n(cy-h*0.26)} ${n(cx+hw*0.06)},${n(cy-h*0.26)}" fill="#1a1f2a" opacity="0.62" stroke="#3a4a5c" stroke-width="0.5"/>`;
      return ent + cols + steps;
    }
    case 'construction': {
      let sc = '';
      for (let lv = 0.22; lv < 0.62; lv += 0.18) {
        sc += `<line x1="${n(cx)}" y1="${n(cy-lv*h)}" x2="${n(cx+hw*0.56)}" y2="${n(cy-hd*0.56-lv*h)}" stroke="#DA8A14" stroke-width="0.9" opacity="0.66"/>`;
        sc += `<line x1="${n(cx)}" y1="${n(cy-lv*h)}" x2="${n(cx-hw*0.56)}" y2="${n(cy-hd*0.56-lv*h)}" stroke="#DA8A14" stroke-width="0.9" opacity="0.58"/>`;
      }
      const fence = `<polygon points="${n(cx-hw*0.72)},${n(cy+hd*0.26)} ${n(cx+hw*0.72)},${n(cy+hd*0.26)} ${n(cx+hw*0.60)},${n(cy+hd*0.46)} ${n(cx-hw*0.60)},${n(cy+hd*0.46)}" fill="${accent}" opacity="0.30" stroke="${darken(accent,0.20)}" stroke-width="0.6" stroke-dasharray="4 3"/>`;
      return sc + fence;
    }
  }
}

// ── 건물 렌더링 ───────────────────────────────────────────────
function renderBuilding(
  b: MetroBuilding,
  grid: ReturnType<typeof mkGrid>,
  idx: number,
  total: number
): string {
  const pos = gridXY(b.gridCol, b.gridRow, grid);
  const mt = b.buildingType;
  const { hw: bw, hd: bd, hScale } = massOf(mt);
  const depth = clamp((b.gridCol + b.gridRow) / Math.max(1, grid.cols + grid.rows - 2), 0, 1);
  const near = 1 - depth * 0.18;
  const h = clamp(b.height, 46, 146) * hScale * near;
  const hw = bw, hd = bd;

  const col = METRO_COLORS[mt];
  const base = col.main;
  const top   = lighten(base, 0.54);
  const right = darken(base, 0.03);
  const left  = darken(base, 0.42);
  const accent = col.accent;

  const densityP = total >= 22 ? 0.28 : total >= 14 ? 0.16 : total >= 10 ? 0.08 : 0;
  const lod = clamp(depth + densityP, 0, 1.15);
  const detail: 'high' | 'mid' | 'low' = lod > 0.90 ? 'low' : lod > 0.62 ? 'mid' : 'high';

  // 기반 판
  const platH = 4;
  const lotC = '#8aaa7a';
  const lot = `<g opacity="0.32">${prism(pos.x, pos.y+platH, hw*1.10, hd*1.10, platH, lighten(lotC,0.10), darken(lotC,0.24), darken(lotC,0.32), PAL.outline)}</g>`;

  const body = renderBody(mt, pos.x, pos.y, hw, hd, h, top, right, left, PAL.outline);

  // 창문
  let windows = '';
  if (detail !== 'low') {
    const rows = detail === 'high' ? 6 : 4;
    const cols = detail === 'high' ? 4 : 3;
    const wu = 0.092, wv = 0.058;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const u = 0.12 + c * (0.66 - wu) / Math.max(1, cols-1);
        const v = 0.12 + r * (0.76 - 0.12) / Math.max(1, rows);
        const lit = !b.isDormant && (r + c + (hash(`${b.repoName}:${mt}`) % 24)) % 4 !== 0;
        const op = b.isDormant ? 0.10 : lit ? 0.62 : 0.06;
        const mkW = (sign: number) => {
          const x1 = pos.x+sign*u*hw, y1 = pos.y-u*hd-v*h;
          const x2 = pos.x+sign*(u+wu)*hw, y2 = pos.y-(u+wu)*hd-v*h;
          const x3 = pos.x+sign*(u+wu)*hw, y3 = pos.y-(u+wu)*hd-(v+wv)*h;
          const x4 = pos.x+sign*u*hw, y4 = pos.y-u*hd-(v+wv)*h;
          return `<polygon points="${n(x1)},${n(y1)} ${n(x2)},${n(y2)} ${n(x3)},${n(y3)} ${n(x4)},${n(y4)}" fill="${PAL.window}" opacity="${(sign===1?op:op*0.72).toFixed(2)}" class="mc-win"/>`;
        };
        windows += mkW(1) + mkW(-1);
      }
    }
  }

  // 유리 광택
  const glass = detail === 'low' ? '' :
    `<polygon points="${n(pos.x+hw*0.08)},${n(pos.y-hd*0.08-h*0.10)} ${n(pos.x+hw*0.22)},${n(pos.y-hd*0.22-h*0.22)} ${n(pos.x+hw*0.20)},${n(pos.y-hd*0.20-h*0.88)} ${n(pos.x+hw*0.06)},${n(pos.y-hd*0.06-h*0.76)}" fill="url(#mcGlass)" opacity="0.75"/>`;

  const shadow = `<ellipse cx="${n(pos.x+2)}" cy="${n(pos.y+5)}" rx="${n(hw+7)}" ry="${n(hd+4)}" fill="${PAL.shadow}" opacity="0.32"/>`;
  const depthShade = `<polygon points="${n(pos.x)},${n(pos.y-h)} ${n(pos.x+hw)},${n(pos.y-hd-h)} ${n(pos.x+hw)},${n(pos.y-hd)} ${n(pos.x)},${n(pos.y)}" fill="#000" opacity="${(0.04+depth*0.10).toFixed(2)}"/>`;

  const name = b.repoName.length > 13 ? `${b.repoName.slice(0,13)}…` : b.repoName;
  const label = detail === 'high'
    ? `<text x="${n(pos.x)}" y="${n(pos.y+hd+13)}" text-anchor="middle" class="mc-text mc-small" fill="${PAL.textMuted}" opacity="0.90">${escXml(name)}</text>` : '';

  const acc = detail !== 'low' ? renderAccessory(mt, detail, pos.x, pos.y, hw, hd, h, accent, base) : '';

  return `<g style="animation-delay:${(idx*0.06).toFixed(2)}s" filter="url(#mcShadow)">${shadow}${lot}${body}${depthShade}${windows}${glass}${acc}${label}</g>`;
}

function renderBuildings(buildings: MetroBuilding[], grid: ReturnType<typeof mkGrid>): string {
  if (buildings.length === 0)
    return `<text x="400" y="260" text-anchor="middle" class="mc-text mc-sub" fill="${PAL.textMuted}">No buildings yet — start committing!</text>`;
  const sorted = [...buildings].sort((a,b) => (a.gridCol+a.gridRow)-(b.gridCol+b.gridRow));
  return `<g>${sorted.map((b,i) => renderBuilding(b, grid, i, buildings.length)).join('')}</g>`;
}

// ── SVG 정의 ──────────────────────────────────────────────────
function buildDefs(): string {
  return `<defs>
  <linearGradient id="mcSky" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="${PAL.skyTop}"/>
    <stop offset="45%"  stop-color="${PAL.skyMid}"/>
    <stop offset="100%" stop-color="${PAL.skyBottom}"/>
  </linearGradient>
  <linearGradient id="mcGnd" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="${PAL.gnd}"/>
    <stop offset="100%" stop-color="${PAL.gndB}"/>
  </linearGradient>
  <linearGradient id="mcAsphalt" x1="0%" y1="0%" x2="100%" y2="100%">
    <stop offset="0%"   stop-color="${lighten(PAL.road,0.10)}"/>
    <stop offset="100%" stop-color="${darken(PAL.road,0.15)}"/>
  </linearGradient>
  <linearGradient id="mcGlass" x1="0%" y1="0%" x2="0%" y2="100%">
    <stop offset="0%"   stop-color="#fff" stop-opacity="0.28"/>
    <stop offset="55%"  stop-color="#fff" stop-opacity="0.10"/>
    <stop offset="100%" stop-color="#fff" stop-opacity="0.02"/>
  </linearGradient>
  <filter id="mcGlow" x="-40%" y="-40%" width="180%" height="180%">
    <feGaussianBlur stdDeviation="1.8" result="g"/>
    <feMerge><feMergeNode in="g"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
  <filter id="mcShadow">
    <feDropShadow dx="1" dy="2" stdDeviation="1.6" flood-color="#000" flood-opacity="0.36"/>
  </filter>
  <filter id="mcBloom" x="-80%" y="-80%" width="260%" height="260%">
    <feGaussianBlur stdDeviation="4" result="b"/>
    <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
  </filter>
</defs>`;
}

function buildStyles(anim: boolean): string {
  const motion = anim
    ? `@keyframes mcTwinkle{0%,100%{opacity:0.40}50%{opacity:1}}
       .mc-win{animation:mcTwinkle 3.2s ease-in-out infinite}`
    : '.mc-win{opacity:0.72}';
  return `<style>
  .mc-text{font-family:'Segoe UI','Noto Sans KR',sans-serif}
  .mc-title{font-size:13px;font-weight:700;letter-spacing:1.2px}
  .mc-sub{font-size:9px;font-weight:500}
  .mc-small{font-size:7px;font-weight:500}
  ${motion}
</style>`;
}

// ── 배경 스카이라인 (낮 + 현대 크레인) ────────────────────────
function renderBackdrop(tier: MetroCityTier): string {
  const depth = tier.tier >= 4 ? 16 : tier.tier >= 2 ? 13 : 10;
  let blocks = '';
  for (let i = 0; i < depth; i++) {
    const x = 10 + i * (780 / depth);
    const w = 22 + ((i * 13) % 28);
    const h = 28 + ((i * 29) % 90) + tier.tier * 5;
    const y = 200 - h;
    const tint = '#8AAABB';
    const shade = i % 3 === 0 ? lighten(tint,0.14) : i % 3 === 1 ? tint : darken(tint,0.10);
    blocks += `<rect x="${n(x)}" y="${n(y)}" width="${n(w)}" height="${n(h)}" fill="${shade}" opacity="0.18"/>`;
    // 세트백
    if (h > 60 && i % 3 === 0) {
      blocks += `<rect x="${n(x+w*0.20)}" y="${n(y-h*0.34)}" width="${n(w*0.60)}" height="${n(h*0.34)}" fill="${lighten(shade,0.08)}" opacity="0.18"/>`;
    }
    // 크레인 실루엣 (every 6th building)
    if (h > 40 && i % 6 === 0) {
      const mX = x + w * 0.72;
      blocks += `<line x1="${n(mX)}" y1="${n(y)}" x2="${n(mX)}" y2="${n(y-38)}" stroke="#7A9AB0" stroke-width="1.0" opacity="0.26"/>`;
      blocks += `<line x1="${n(mX)}" y1="${n(y-38)}" x2="${n(mX+28)}" y2="${n(y-40)}" stroke="#7A9AB0" stroke-width="0.8" opacity="0.26"/>`;
      blocks += `<line x1="${n(mX)}" y1="${n(y-38)}" x2="${n(mX-11)}" y2="${n(y-39)}" stroke="#7A9AB0" stroke-width="0.8" opacity="0.26"/>`;
    }
    // 안테나
    if (h > 48 && i % 5 === 2) {
      const ax = x + w * 0.50;
      blocks += `<line x1="${n(ax)}" y1="${n(y)}" x2="${n(ax)}" y2="${n(y-18)}" stroke="${lighten(shade,0.38)}" stroke-width="0.8" opacity="0.34"/>`;
    }
    // 창문 픽셀
    if (h > 40 && w > 20) {
      for (let wy = 0; wy < Math.min(3, Math.floor(h/12)); wy++) {
        for (let wx = 0; wx < Math.min(2, Math.floor(w/9)); wx++) {
          if ((i+wy+wx)%3 !== 0) {
            blocks += `<rect x="${n(x+4+wx*9)}" y="${n(y+4+wy*11)}" width="4" height="5" fill="#ffe0a0" opacity="0.22"/>`;
          }
        }
      }
    }
  }
  // 구름
  const clouds = `<g opacity="0.28">
    <ellipse cx="140" cy="56" rx="44" ry="13" fill="white"/>
    <ellipse cx="112" cy="64" rx="26" ry="11" fill="white"/>
    <ellipse cx="178" cy="63" rx="32" ry="11" fill="white"/>
  </g>
  <g opacity="0.20">
    <ellipse cx="590" cy="64" rx="50" ry="14" fill="white"/>
    <ellipse cx="556" cy="74" rx="30" ry="12" fill="white"/>
    <ellipse cx="630" cy="72" rx="36" ry="12" fill="white"/>
  </g>`;
  // 대기 안개
  const haze = `<rect x="0" y="110" width="800" height="140" fill="${PAL.haze}" opacity="0.28"/>`;
  return `<g>${blocks}${clouds}${haze}</g>`;
}

// ── 대기 효과 ─────────────────────────────────────────────────
function renderAtmo(): string {
  const fog = `<ellipse cx="400" cy="220" rx="340" ry="80" fill="${PAL.haze}" opacity="0.24"/>`;
  const beam = `<polygon points="400,14 490,235 310,235" fill="#ffffff" opacity="0.06"/>`;
  const vign = `<rect x="0" y="0" width="800" height="398" fill="none" stroke="#000" stroke-width="38" opacity="0.08"/>`;
  return `<g>${beam}${fog}${vign}</g>`;
}

// ── 지면 ──────────────────────────────────────────────────────
function renderGround(grid: ReturnType<typeof mkGrid>): string {
  const ter = corners(grid, 1.40);
  const pts = `${n(ter.back.x)},${n(ter.back.y)} ${n(ter.right.x)},${n(ter.right.y)} ${n(ter.front.x)},${n(ter.front.y)} ${n(ter.left.x)},${n(ter.left.y)}`;
  let gLines = '';
  for (let r = -0.2; r <= grid.rows - 1 + 0.2; r++) {
    const a = gridXY(0, r, grid), b = gridXY(grid.cols-1, r, grid);
    gLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${PAL.border}" stroke-width="0.44" opacity="0.28"/>`;
  }
  for (let c = -0.2; c <= grid.cols - 1 + 0.2; c++) {
    const a = gridXY(c, 0, grid), b = gridXY(c, grid.rows-1, grid);
    gLines += `<line x1="${n(a.x)}" y1="${n(a.y)}" x2="${n(b.x)}" y2="${n(b.y)}" stroke="${PAL.border}" stroke-width="0.44" opacity="0.28"/>`;
  }
  let lots = '';
  for (let r = 0; r < grid.rows; r++) {
    for (let c = 0; c < grid.cols; c++) {
      const nw = gridXY(c, r, grid), ne = gridXY(c+1, r, grid);
      const se = gridXY(c+1, r+1, grid), sw = gridXY(c, r+1, grid);
      const alt = (r+c)%2===0;
      lots += `<polygon points="${n(nw.x)},${n(nw.y)} ${n(ne.x)},${n(ne.y)} ${n(se.x)},${n(se.y)} ${n(sw.x)},${n(sw.y)}" fill="${alt?lighten(PAL.grass,0.12):darken(PAL.grass,0.10)}" opacity="0.22" stroke="${PAL.border}" stroke-width="0.28" stroke-opacity="0.44"/>`;
    }
  }
  return `<g><polygon points="${pts}" fill="url(#mcGnd)" stroke="${PAL.border}" stroke-width="0.8"/>${lots}${gLines}</g>`;
}

// ── 도로 ──────────────────────────────────────────────────────
function renderRoads(grid: ReturnType<typeof mkGrid>): string {
  const outer = corners(grid, 1.08), inner = corners(grid, 0.48);
  const op = (c: typeof outer) => `M ${n(c.back.x)} ${n(c.back.y)} L ${n(c.right.x)} ${n(c.right.y)} L ${n(c.front.x)} ${n(c.front.y)} L ${n(c.left.x)} ${n(c.left.y)} Z`;
  const oP = op(outer), iP = op(inner);
  const lamps = [
    {x: outer.back.x-11, y: outer.back.y+5},
    {x: outer.right.x-6, y: outer.right.y+10},
    {x: outer.front.x+11, y: outer.front.y-3},
    {x: outer.left.x+5, y: outer.left.y-9},
  ];
  return `<g>
  <path d="${oP}" fill="none" stroke="${darken(PAL.road,0.20)}" stroke-width="20" opacity="0.26"/>
  <path d="${iP}" fill="none" stroke="${darken(PAL.road,0.20)}" stroke-width="16" opacity="0.22"/>
  <path id="mcRoadOuter" d="${oP}" fill="none" stroke="url(#mcAsphalt)" stroke-width="17" opacity="0.80"/>
  <path id="mcRoadInner" d="${iP}" fill="none" stroke="url(#mcAsphalt)" stroke-width="14" opacity="0.74"/>
  <path d="${oP}" fill="none" stroke="${PAL.lane}" stroke-width="1.0" opacity="0.44" stroke-dasharray="9 8"/>
  <path d="${iP}" fill="none" stroke="${PAL.lane}" stroke-width="0.9" opacity="0.36" stroke-dasharray="6 7"/>
  ${lamps.map(l=>`<g>
    <line x1="${n(l.x)}" y1="${n(l.y)}" x2="${n(l.x)}" y2="${n(l.y-10)}" stroke="${darken(PAL.border,0.20)}" stroke-width="0.9"/>
    <circle cx="${n(l.x)}" cy="${n(l.y-11)}" r="2.0" fill="#ffe4a0" opacity="0.80" filter="url(#mcGlow)"/>
    <circle cx="${n(l.x)}" cy="${n(l.y-11)}" r="4.5" fill="#ffcc70" opacity="0.20"/>
  </g>`).join('')}
</g>`;
}

// ── 공원 / 나무 ───────────────────────────────────────────────
function renderParks(grid: ReturnType<typeof mkGrid>): string {
  const cells = [
    gridXY(-0.60, 0.80, grid),
    gridXY(grid.cols - 0.14, grid.rows - 0.24, grid),
    gridXY(grid.cols / 2 - 0.20, -0.60, grid),
  ];
  function tree(cx: number, cy: number, s: number): string {
    return (
      `<ellipse cx="${n(cx+s*0.08)}" cy="${n(cy-s*0.50)}" rx="${n(s*0.94)}" ry="${n(s*0.46)}" fill="${darken(PAL.grass,0.20)}" opacity="0.80"/>` +
      `<ellipse cx="${n(cx)}" cy="${n(cy-s*0.88)}" rx="${n(s*0.88)}" ry="${n(s*0.44)}" fill="${PAL.grass}" opacity="0.92"/>` +
      `<ellipse cx="${n(cx-s*0.08)}" cy="${n(cy-s*1.20)}" rx="${n(s*0.66)}" ry="${n(s*0.33)}" fill="${PAL.grass}" opacity="0.90"/>` +
      `<ellipse cx="${n(cx-s*0.12)}" cy="${n(cy-s*1.46)}" rx="${n(s*0.42)}" ry="${n(s*0.21)}" fill="${lighten(PAL.grass,0.32)}" opacity="0.88"/>` +
      `<rect x="${n(cx-s*0.14)}" y="${n(cy-s*0.08)}" width="${n(s*0.28)}" height="${n(s*0.72)}" rx="${n(s*0.10)}" fill="#5a3810" opacity="0.76"/>`
    );
  }
  return `<g>${cells.map(c=>`
    <polygon points="${n(c.x)},${n(c.y-12)} ${n(c.x+20)},${n(c.y+1)} ${n(c.x)},${n(c.y+12)} ${n(c.x-20)},${n(c.y+1)}" fill="${PAL.grass}" opacity="0.50"/>
    ${tree(c.x-5, c.y-4, 4.4)}${tree(c.x+6, c.y-2, 3.6)}`).join('')}</g>`;
}

// ── 날씨 효과 ─────────────────────────────────────────────────
function renderWeather(w: MetroWeather): string {
  switch (w.type) {
    case 'sunny':
      return `<g><circle cx="702" cy="68" r="22" fill="#ffd878" opacity="0.10"/><circle cx="702" cy="68" r="16" fill="#ffe090" opacity="0.16"/>
        ${[0,51,103,154,205,257,308].map((a,i)=>{const r=a*Math.PI/180,ex=702+Math.cos(r)*28,ey=68+Math.sin(r)*28;return `<line x1="702" y1="68" x2="${n(ex)}" y2="${n(ey)}" stroke="#ffd060" stroke-width="2.2" stroke-linecap="round" opacity="0.68"/>`;}).join('')}
        <circle cx="702" cy="68" r="12" fill="#ffd870" opacity="0.94" filter="url(#mcGlow)"/></g>`;
    case 'cloudy':
      return `<g opacity="0.54"><ellipse cx="638" cy="72" rx="34" ry="11" fill="#d8e2ee"/><ellipse cx="666" cy="74" rx="24" ry="9" fill="#c2cedd"/><ellipse cx="618" cy="78" rx="19" ry="8" fill="#e0e8f4"/></g>`;
    case 'rainy': {
      let r=''; for(let i=0;i<20;i++){const x=100+((i*37)%600),d=((i*11)%14)/10; r+=`<line x1="${x}" y1="12" x2="${x-3}" y2="24" stroke="#7ab8e4" stroke-width="1.0" opacity="0.44"><animate attributeName="transform" values="translate(0,-12);translate(0,420)" dur="1.6s" begin="${d}s" repeatCount="indefinite"/></line>`;}
      return `<g>${r}</g>`;
    }
    case 'snowy': {
      let s=''; for(let i=0;i<16;i++){const x=120+((i*41)%560),d=((i*7)%20)/10; s+=`<circle cx="${x}" cy="10" r="1.5" fill="#fff" opacity="0.76"><animate attributeName="transform" values="translate(0,-8);translate(18,400)" dur="4.5s" begin="${d}s" repeatCount="indefinite"/></circle>`;}
      return `<g>${s}</g>`;
    }
    case 'rainbow':
      return `<g opacity="0.36"><path d="M202,222 A198,198 0 0,1 598,222" fill="none" stroke="#ff5050" stroke-width="4"/><path d="M210,222 A190,190 0 0,1 590,222" fill="none" stroke="#ff9040" stroke-width="4"/><path d="M218,222 A182,182 0 0,1 582,222" fill="none" stroke="#ffd860" stroke-width="4"/><path d="M226,222 A174,174 0 0,1 574,222" fill="none" stroke="#58d68d" stroke-width="4"/><path d="M234,222 A166,166 0 0,1 566,222" fill="none" stroke="#3aa8ff" stroke-width="4"/></g>`;
    case 'fireworks':
      return `<g><circle cx="152" cy="60" r="3" fill="#ff7f50" opacity="0.92" filter="url(#mcGlow)"/>
        ${[0,60,120,180,240,300].map((a,i)=>{const rad=a*Math.PI/180,ex=152+Math.cos(rad)*20,ey=60+Math.sin(rad)*20;return `<line x1="152" y1="60" x2="${n(ex)}" y2="${n(ey)}" stroke="#ff8050" stroke-width="1.4" opacity="0.76"><animate attributeName="opacity" values="0.76;0.10;0.76" dur="1.6s" begin="${(i*0.25).toFixed(1)}s" repeatCount="indefinite"/></line>`;}).join('')}</g>`;
    default: return '';
  }
}

// ── 교통 ──────────────────────────────────────────────────────
function renderTraffic(traffic: MetroTraffic, grid: ReturnType<typeof mkGrid>): string {
  if (traffic.vehicleCount <= 0) return '';
  const outer = corners(grid, 1.08), inner = corners(grid, 0.48);
  const oP = `M ${n(outer.back.x)} ${n(outer.back.y)} L ${n(outer.right.x)} ${n(outer.right.y)} L ${n(outer.front.x)} ${n(outer.front.y)} L ${n(outer.left.x)} ${n(outer.left.y)} Z`;
  const iP = `M ${n(inner.back.x)} ${n(inner.back.y)} L ${n(inner.right.x)} ${n(inner.right.y)} L ${n(inner.front.x)} ${n(inner.front.y)} L ${n(inner.left.x)} ${n(inner.left.y)} Z`;
  const types = [
    {body:'#ff8f3f',acc:'#ffd6a1',w:15.5,h:5.4},
    {body:'#5f8cf5',acc:'#b7ccff',w:14.3,h:5.2},
    {body:'#ffd447',acc:'#fff1b6',w:11.2,h:4.6},
  ] as const;
  let cars = `<path id="mcOuter" d="${oP}" fill="none" stroke="none"/>
    <path id="mcInner" d="${iP}" fill="none" stroke="none"/>`;
  for (let i=0; i<Math.max(2,traffic.vehicleCount); i++) {
    const t = types[i%3];
    const path = i%2===0 ? '#mcOuter' : '#mcInner';
    const delay = (i*1.15+((i*17)%7)/10).toFixed(1);
    const dur = (t.w===15.5?13:t.w===14.3?11.2:8.5+(i%3)*0.45).toFixed(1);
    const hl=t.w*0.42, hd2=t.h*0.52, yM=1.2, yD=yM+t.h*0.7;
    cars += `<g>
      <g>
        <polygon points="0,${n(-hd2)} ${n(hl)},${n(yM)} 0,${n(hd2)} ${n(-hl)},${n(yM)}" fill="${t.body}" opacity="0.94"/>
        <polygon points="${n(hl)},${n(yM)} ${n(hl)},${n(yD)} 0,${n(yD+hd2*0.7)} 0,${n(hd2)}" fill="${darken(t.body,0.18)}" opacity="0.88"/>
        <polygon points="${n(-hl)},${n(yM)} 0,${n(hd2)} 0,${n(yD+hd2*0.7)} ${n(-hl)},${n(yD)}" fill="${darken(t.body,0.28)}" opacity="0.86"/>
        <polygon points="0,${n(-hd2-1.8)} ${n(hl*0.54)},${n(-1.8)} 0,${n(hd2-1.8)} ${n(-hl*0.54)},${n(-1.8)}" fill="${t.acc}" opacity="0.88"/>
      </g>
      <animateMotion dur="${dur}s" begin="${delay}s" repeatCount="indefinite" rotate="auto"><mpath href="${path}"/></animateMotion>
    </g>`;
  }
  return `<g>${cars}</g>`;
}

// ── 헤더 / 푸터 ──────────────────────────────────────────────
function renderHeader(
  username: string,
  tier: MetroCityTier,
  weather: MetroWeather
): string {
  return `<g>
  <text x="400" y="24" text-anchor="middle" class="mc-text mc-title" fill="${PAL.text}">${tier.icon} ${escXml(username)}'s Metro City</text>
  <text x="400" y="39" text-anchor="middle" class="mc-text mc-sub" fill="${PAL.textMuted}">${tier.name} (Tier ${tier.tier}) · ${weather.icon} ${weather.label} · Under Construction</text>
</g>`;
}

function renderFooter(stats: MetroStats): string {
  const y = SH - FH;
  function fmtPop(v: number): string {
    if (v>=1_000_000) return `${(v/1_000_000).toFixed(1)}M`;
    if (v>=1_000) return `${(v/1_000).toFixed(1)}K`;
    return String(v);
  }
  const items: [string, string][] = [
    ['Buildings', String(stats.totalBuildings)],
    ['Population', fmtPop(stats.population)],
    ['Commits', String(stats.totalCommits)],
    ['Stars', String(stats.totalStars)],
    ['Streak', `${stats.streakDays}d`],
    ['Top Lang', stats.topLanguage],
  ];
  const unit = SW / items.length;
  const labels = items.map(([label,val],i)=>{
    const x = unit/2+i*unit;
    return `<text x="${n(x)}" y="${y+19}" text-anchor="middle" class="mc-text mc-small" fill="${PAL.textMuted}">${label}</text>
    <text x="${n(x)}" y="${y+35}" text-anchor="middle" class="mc-text mc-sub" fill="${PAL.text}">${escXml(val)}</text>`;
  }).join('');
  return `<g><line x1="18" y1="${y+3}" x2="782" y2="${y+3}" stroke="${PAL.border}" stroke-width="0.8"/>${labels}</g>`;
}

// ── 메인 렌더 ─────────────────────────────────────────────────
export interface MetroCityRenderData {
  username: string;
  profile: MetroCityProfile;
  config: { show_weather?: boolean; show_traffic?: boolean; animation?: boolean };
  theme: ThemeColors;
}

export function renderMetroCity(data: MetroCityRenderData): string {
  const { username, profile, config } = data;
  const anim = config.animation !== false;
  const grid = mkGrid(profile.buildings.length);

  const layers = [
    renderBackdrop(profile.tier),
    renderAtmo(),
    renderGround(grid),
    renderRoads(grid),
    renderParks(grid),
    renderBuildings(profile.buildings, grid),
    config.show_traffic !== false ? renderTraffic(profile.traffic, grid) : '',
    config.show_weather !== false ? renderWeather(profile.weather) : '',
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SW}" height="${SH}" viewBox="0 0 ${SW} ${SH}">
${buildDefs()}
${buildStyles(anim)}
<rect width="${SW}" height="${SH}" rx="16" fill="url(#mcSky)"/>
<rect x="0" y="${CY_START}" width="${SW}" height="${CITY_H}" fill="${PAL.haze}" opacity="0.04"/>
${renderHeader(username, profile.tier, profile.weather)}
<g transform="translate(0,${CY_START}) translate(-5,2) scale(1.01,0.99)">${layers}</g>
${renderFooter(profile.stats)}
<rect x="1" y="1" width="798" height="498" rx="15" fill="none" stroke="${PAL.border}" stroke-width="1" opacity="0.58"/>
</svg>`;
}
