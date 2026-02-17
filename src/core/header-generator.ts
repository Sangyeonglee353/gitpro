// ═══════════════════════════════════════════
// 🌊 Header Generator - 프로필 헤더 SVG 생성
// ═══════════════════════════════════════════

import { ThemeColors } from '../types';
import { escapeXml } from './utils';

/**
 * 헤더 타입에 따라 SVG 헤더를 생성합니다.
 */
export function generateHeaderSVG(
  type: 'wave' | 'typing' | 'gradient' | 'none',
  text: string,
  color: string,
  theme: ThemeColors
): string | null {
  switch (type) {
    case 'wave':
      return generateWaveHeader(text, color, theme);
    case 'typing':
      return generateTypingHeader(text, color, theme);
    case 'gradient':
      return generateGradientHeader(text, color, theme);
    case 'none':
    default:
      return null;
  }
}

/**
 * 🌊 물결 효과 헤더
 */
function generateWaveHeader(text: string, color: string, theme: ThemeColors): string {
  const width = 850;
  const height = 230;
  const secondaryColor = adjustColor(color, -30);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="waveGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="50%" stop-color="${secondaryColor}"/>
      <stop offset="100%" stop-color="${color}"/>
    </linearGradient>
    <linearGradient id="textGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#e0e0e0"/>
    </linearGradient>
  </defs>
  <style>
    @keyframes waveMove1 {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(-30px); }
    }
    @keyframes waveMove2 {
      0%, 100% { transform: translateX(0); }
      50% { transform: translateX(30px); }
    }
    @keyframes fadeInUp {
      0% { opacity: 0; transform: translateY(20px); }
      100% { opacity: 1; transform: translateY(0); }
    }
    .wave1 { animation: waveMove1 6s ease-in-out infinite; }
    .wave2 { animation: waveMove2 8s ease-in-out infinite; }
    .header-text { animation: fadeInUp 1.5s ease-out forwards; }
  </style>

  <!-- 배경 -->
  <rect width="${width}" height="${height}" fill="url(#waveGrad)"/>

  <!-- 물결 1 -->
  <g class="wave1">
    <path d="M0,${height - 60} C${width * 0.25},${height - 90} ${width * 0.5},${height - 30} ${width},${height - 60} L${width},${height} L0,${height} Z" fill="rgba(255,255,255,0.08)"/>
  </g>

  <!-- 물결 2 -->
  <g class="wave2">
    <path d="M0,${height - 40} C${width * 0.3},${height - 70} ${width * 0.6},${height - 20} ${width},${height - 45} L${width},${height} L0,${height} Z" fill="rgba(255,255,255,0.05)"/>
  </g>

  <!-- 장식 원 -->
  <circle cx="${width - 80}" cy="60" r="40" fill="rgba(255,255,255,0.06)"/>
  <circle cx="${width - 60}" cy="80" r="60" fill="rgba(255,255,255,0.04)"/>
  <circle cx="80" cy="${height - 60}" r="35" fill="rgba(255,255,255,0.05)"/>

  <!-- 메인 텍스트 -->
  <text class="header-text" x="${width / 2}" y="${height / 2 - 10}" 
    text-anchor="middle" dominant-baseline="middle"
    font-size="32" font-weight="bold" fill="url(#textGrad)"
    font-family="'Segoe UI', 'Apple Color Emoji', sans-serif">
    ${escapeXml(text)}
  </text>

  <!-- 서브 라인 -->
  <line x1="${width / 2 - 60}" y1="${height / 2 + 20}" x2="${width / 2 + 60}" y2="${height / 2 + 20}" 
    stroke="rgba(255,255,255,0.3)" stroke-width="2" stroke-linecap="round"/>
</svg>`;
}

/**
 * ⌨️ 타이핑 효과 헤더
 */
function generateTypingHeader(text: string, color: string, theme: ThemeColors): string {
  const width = 850;
  const height = 200;
  const charCount = text.length;
  const typingDuration = Math.max(2, charCount * 0.1);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="typeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.background}"/>
      <stop offset="100%" stop-color="${theme.backgroundSecondary}"/>
    </linearGradient>
  </defs>
  <style>
    @keyframes typing {
      from { width: 0; }
      to { width: ${charCount * 18 + 10}px; }
    }
    @keyframes blink {
      0%, 100% { opacity: 1; }
      50% { opacity: 0; }
    }
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .typing-container {
      animation: fadeIn 0.5s ease-out forwards;
    }
    .cursor-line {
      animation: blink 1s step-end infinite;
    }
    .typing-mask {
      animation: typing ${typingDuration}s steps(${charCount}) ${0.5}s forwards;
    }
  </style>

  <!-- 배경 -->
  <rect width="${width}" height="${height}" rx="12" fill="url(#typeBg)" stroke="${theme.border}" stroke-width="1"/>

  <!-- 터미널 스타일 상단 바 -->
  <rect width="${width}" height="36" rx="12" fill="${theme.backgroundSecondary}"/>
  <rect y="12" width="${width}" height="24" fill="${theme.backgroundSecondary}"/>
  <circle cx="24" cy="18" r="6" fill="#ff5f57"/>
  <circle cx="44" cy="18" r="6" fill="#febc2e"/>
  <circle cx="64" cy="18" r="6" fill="#28c840"/>
  <text x="${width / 2}" y="22" text-anchor="middle" font-size="12" fill="${theme.textSecondary}" font-family="'Courier New', monospace">~/profile</text>

  <!-- 프롬프트 -->
  <g class="typing-container">
    <text x="30" y="${height / 2 + 18}" font-size="14" fill="${theme.success}" font-family="'Courier New', monospace">
      $
    </text>
    <text x="50" y="${height / 2 + 18}" font-size="14" fill="${theme.textSecondary}" font-family="'Courier New', monospace">
      echo
    </text>

    <!-- 타이핑 텍스트 -->
    <text x="95" y="${height / 2 + 18}" font-size="18" font-weight="bold" fill="${color}" font-family="'Courier New', monospace">
      "${escapeXml(text)}"
    </text>

    <!-- 깜빡이는 커서 -->
    <rect class="cursor-line" x="${95 + (charCount + 2) * 10.5}" y="${height / 2 + 2}" width="10" height="22" fill="${color}" opacity="0.8"/>
  </g>

  <!-- 하단 장식 -->
  <text x="30" y="${height - 25}" font-size="11" fill="${theme.textSecondary}" font-family="'Courier New', monospace">
    [gitpro] Profile loaded successfully ✨
  </text>
</svg>`;
}

/**
 * 🌈 그라데이션 효과 헤더
 */
function generateGradientHeader(text: string, color: string, theme: ThemeColors): string {
  const width = 850;
  const height = 200;
  const color2 = shiftHue(color, 60);
  const color3 = shiftHue(color, 120);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <defs>
    <linearGradient id="gradBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${color}"/>
      <stop offset="50%" stop-color="${color2}"/>
      <stop offset="100%" stop-color="${color3}"/>
    </linearGradient>
    <linearGradient id="gradText" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="50%" stop-color="#f0f0f0"/>
      <stop offset="100%" stop-color="#ffffff"/>
    </linearGradient>
    <filter id="gradGlow">
      <feGaussianBlur stdDeviation="3" result="glow"/>
      <feMerge>
        <feMergeNode in="glow"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>
  </defs>
  <style>
    @keyframes gradientShift {
      0% { stop-color: ${color}; }
      33% { stop-color: ${color2}; }
      66% { stop-color: ${color3}; }
      100% { stop-color: ${color}; }
    }
    @keyframes sparkle {
      0%, 100% { opacity: 0.2; transform: scale(0.8); }
      50% { opacity: 0.8; transform: scale(1.2); }
    }
    .sparkle { animation: sparkle 3s ease-in-out infinite; }
    .sparkle:nth-child(2) { animation-delay: 0.5s; }
    .sparkle:nth-child(3) { animation-delay: 1s; }
    .sparkle:nth-child(4) { animation-delay: 1.5s; }
    .sparkle:nth-child(5) { animation-delay: 2s; }
  </style>

  <!-- 배경 -->
  <rect width="${width}" height="${height}" rx="16" fill="url(#gradBg)"/>

  <!-- 패턴 오버레이 -->
  <rect width="${width}" height="${height}" rx="16" fill="rgba(0,0,0,0.1)"/>

  <!-- 반짝이 효과 -->
  <g>
    <circle class="sparkle" cx="120" cy="40" r="2" fill="white"/>
    <circle class="sparkle" cx="300" cy="60" r="1.5" fill="white"/>
    <circle class="sparkle" cx="550" cy="35" r="2" fill="white"/>
    <circle class="sparkle" cx="700" cy="55" r="1.5" fill="white"/>
    <circle class="sparkle" cx="780" cy="150" r="2" fill="white"/>
  </g>

  <!-- 메인 텍스트 -->
  <text x="${width / 2}" y="${height / 2}" 
    text-anchor="middle" dominant-baseline="middle"
    font-size="36" font-weight="bold" fill="url(#gradText)" filter="url(#gradGlow)"
    font-family="'Segoe UI', 'Apple Color Emoji', sans-serif">
    ${escapeXml(text)}
  </text>

  <!-- 하단 장식 바 -->
  <rect x="${width / 2 - 100}" y="${height / 2 + 30}" width="200" height="3" rx="2" fill="rgba(255,255,255,0.4)"/>
</svg>`;
}

// ── 유틸리티 함수 ──────────────────────────

/**
 * 색상을 밝기 조정합니다.
 */
function adjustColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.max(0, ((num >> 16) & 0xff) + amount));
  const g = Math.min(255, Math.max(0, ((num >> 8) & 0xff) + amount));
  const b = Math.min(255, Math.max(0, (num & 0xff) + amount));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

/**
 * HSL 기반 색상 회전
 */
function shiftHue(hex: string, degrees: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  let r = ((num >> 16) & 0xff) / 255;
  let g = ((num >> 8) & 0xff) / 255;
  let b = (num & 0xff) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  let h = 0;
  let s = 0;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

    if (max === r) h = ((g - b) / d + (g < b ? 6 : 0)) / 6;
    else if (max === g) h = ((b - r) / d + 2) / 6;
    else h = ((r - g) / d + 4) / 6;
  }

  // Shift hue
  h = ((h * 360 + degrees) % 360) / 360;

  // HSL to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };

  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }

  const toHex = (c: number) =>
    Math.round(c * 255)
      .toString(16)
      .padStart(2, '0');

  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}
