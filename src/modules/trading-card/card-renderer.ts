// ═══════════════════════════════════════════
// 🎴 Card Renderer - 트레이딩 카드 SVG 렌더링
// ═══════════════════════════════════════════
//
// 4가지 카드 스타일을 지원합니다:
//   - hologram: 홀로그램 효과 + 화려한 애니메이션 (기본)
//   - pixel: 레트로 픽셀아트 + 8비트 스타일
//   - minimal: 심플하고 깔끔한 모던 디자인
//   - anime: 애니메이션 만화풍 역동적 디자인

import { ThemeColors, TradingCardConfig } from '../../types';
import { getLanguageColor } from '../../core/theme-manager';
import { CardStats, RarityInfo } from './stats-calculator';
import { SpecialAbility } from './ability-detector';
import { renderPixelArtCharacter } from './pixel-art';

const CARD_WIDTH = 420;
const CARD_HEIGHT = 580;

export interface CardRenderData {
  username: string;
  characterType: { type: string; title: string; element: string; emoji: string };
  stats: CardStats;
  rarity: RarityInfo;
  abilities: SpecialAbility[];
  topLanguages: Array<{ name: string; percent: number }>;
  customTitle: string;
  config: TradingCardConfig;
  theme: ThemeColors;
  seasonNumber: number;
  cardNumber: number;
}

/**
 * 트레이딩 카드 SVG를 렌더링합니다.
 * config.style에 따라 다른 스타일로 렌더링됩니다.
 */
export function renderCard(renderData: CardRenderData): string {
  const style = renderData.config.style || 'hologram';

  switch (style) {
    case 'pixel':
      return renderPixelStyle(renderData);
    case 'minimal':
      return renderMinimalStyle(renderData);
    case 'anime':
      return renderAnimeStyle(renderData);
    case 'hologram':
    default:
      return renderHologramStyle(renderData);
  }
}

// ═══════════════════════════════════════════
// 🌈 HOLOGRAM STYLE - 홀로그램 카드
// ═══════════════════════════════════════════

function renderHologramStyle(data: CardRenderData): string {
  const {
    username, characterType, stats, rarity,
    abilities, topLanguages, customTitle, theme,
    seasonNumber, cardNumber,
  } = data;

  const title = customTitle || characterType.title;
  const displayTitle = `${characterType.element} ${title} ${characterType.element}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <linearGradient id="cardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <linearGradient id="rarityBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rarity.color}"/>
      <stop offset="50%" stop-color="${rarity.glowColor}"/>
      <stop offset="100%" stop-color="${rarity.color}"/>
    </linearGradient>
    <linearGradient id="hologram" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rarity.color}" stop-opacity="0.1">
        <animate attributeName="stop-opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
      </stop>
      <stop offset="50%" stop-color="${rarity.glowColor}" stop-opacity="0.05">
        <animate attributeName="stop-opacity" values="0.05;0.2;0.05" dur="3s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="${rarity.color}" stop-opacity="0.1">
        <animate attributeName="stop-opacity" values="0.1;0.3;0.1" dur="3s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <filter id="shadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    <filter id="glow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${rarity.name === 'epic' || rarity.name === 'legendary' ? `
    <filter id="particleGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>` : ''}
  </defs>

  <style>
    .card-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .stat-label { font-size: 11px; font-weight: 600; }
    .stat-value { font-size: 16px; font-weight: 700; }
    .title-text { font-size: 14px; font-weight: 700; letter-spacing: 1px; }
    .rarity-text { font-size: 11px; font-weight: 700; letter-spacing: 2px; }
    .username-text { font-size: 16px; font-weight: 700; }
    .ability-text { font-size: 10px; }
    .footer-text { font-size: 9px; opacity: 0.6; }
    .skill-text { font-size: 11px; }

    ${rarity.name === 'legendary' ? `
    @keyframes rainbow {
      0% { stop-color: #ff0000; }
      16% { stop-color: #ff8800; }
      33% { stop-color: #ffff00; }
      50% { stop-color: #00ff00; }
      66% { stop-color: #0088ff; }
      83% { stop-color: #8800ff; }
      100% { stop-color: #ff0000; }
    }
    #rarityBorder stop:nth-child(1) { animation: rainbow 4s linear infinite; }
    #rarityBorder stop:nth-child(2) { animation: rainbow 4s linear infinite 1.3s; }
    #rarityBorder stop:nth-child(3) { animation: rainbow 4s linear infinite 2.6s; }
    ` : ''}

    @keyframes shimmer {
      0% { opacity: 0; transform: translateX(-100%); }
      50% { opacity: 0.5; }
      100% { opacity: 0; transform: translateX(100%); }
    }
    .shimmer { animation: shimmer 3s ease-in-out infinite; }

    ${rarity.name === 'epic' || rarity.name === 'legendary' ? `
    @keyframes particle-float {
      0% { transform: translateY(0) scale(1); opacity: 1; }
      100% { transform: translateY(-40px) scale(0); opacity: 0; }
    }
    .particle { animation: particle-float 2s ease-out infinite; }
    .particle:nth-child(2) { animation-delay: 0.4s; }
    .particle:nth-child(3) { animation-delay: 0.8s; }
    .particle:nth-child(4) { animation-delay: 1.2s; }
    .particle:nth-child(5) { animation-delay: 1.6s; }` : ''}
  </style>

  <!-- 카드 외곽 -->
  <rect x="2" y="2" width="${CARD_WIDTH - 4}" height="${CARD_HEIGHT - 4}" rx="16" ry="16"
        fill="url(#rarityBorder)" filter="url(#shadow)"/>
  <rect x="6" y="6" width="${CARD_WIDTH - 12}" height="${CARD_HEIGHT - 12}" rx="14" ry="14"
        fill="url(#cardBg)"/>
  <rect x="6" y="6" width="${CARD_WIDTH - 12}" height="${CARD_HEIGHT - 12}" rx="14" ry="14"
        fill="url(#hologram)"/>

  <!-- 레어도 배지 -->
  <text x="${CARD_WIDTH / 2}" y="32" text-anchor="middle" class="card-text rarity-text"
        fill="${rarity.color}" filter="url(#glow)">${rarity.label}</text>

  <!-- 캐릭터 영역 -->
  <rect x="30" y="46" width="${CARD_WIDTH - 60}" height="120" rx="10" ry="10"
        fill="${theme.backgroundSecondary}" stroke="${theme.border}" stroke-width="1"/>
  ${renderPixelArtCharacter(characterType.type, 150, 50, 120, 110, {
    glowColor: rarity.color,
    animate: true,
  })}

  <!-- 캐릭터 타이틀 -->
  <text x="${CARD_WIDTH / 2}" y="184" text-anchor="middle" class="card-text title-text"
        fill="${rarity.color}" filter="url(#glow)">${displayTitle}</text>

  <!-- 유저네임 -->
  <text x="${CARD_WIDTH / 2}" y="206" text-anchor="middle" class="card-text username-text"
        fill="${theme.text}">${username}</text>

  <!-- 구분선 -->
  <line x1="30" y1="218" x2="${CARD_WIDTH - 30}" y2="218"
        stroke="${theme.border}" stroke-width="1" opacity="0.5"/>

  <!-- 스탯 영역 -->
  ${renderStatsSection(stats, rarity, theme, 228)}

  <!-- 구분선 -->
  <line x1="30" y1="306" x2="${CARD_WIDTH - 30}" y2="306"
        stroke="${theme.border}" stroke-width="1" opacity="0.5"/>

  <!-- 어빌리티 영역 -->
  ${renderAbilitiesSection(abilities, theme, 320)}

  <!-- 구분선 -->
  <line x1="30" y1="384" x2="${CARD_WIDTH - 30}" y2="384"
        stroke="${theme.border}" stroke-width="1" opacity="0.5"/>

  <!-- 스킬 영역 -->
  ${renderSkillsSection(topLanguages, theme, 398)}

  <!-- 풋터 -->
  <text x="30" y="${CARD_HEIGHT - 18}" class="card-text footer-text" fill="${theme.textSecondary}">
    #${String(cardNumber).padStart(4, '0')}</text>
  <text x="${CARD_WIDTH - 30}" y="${CARD_HEIGHT - 18}" text-anchor="end" class="card-text footer-text"
        fill="${theme.textSecondary}">Season ${seasonNumber} / ${new Date().getFullYear()}</text>

  <!-- 시머 효과 -->
  ${rarity.name !== 'common' && rarity.name !== 'uncommon' ? `
  <rect x="6" y="6" width="${CARD_WIDTH - 12}" height="${CARD_HEIGHT - 12}" rx="14" ry="14"
        fill="url(#hologram)" class="shimmer" opacity="0.3"/>` : ''}

  <!-- 파티클 효과 (Epic/Legendary) -->
  ${rarity.name === 'epic' || rarity.name === 'legendary' ? renderParticles(rarity.color) : ''}
</svg>`;
}

// ═══════════════════════════════════════════
// 🕹️ PIXEL STYLE - 레트로 픽셀아트 카드
// ═══════════════════════════════════════════

function renderPixelStyle(data: CardRenderData): string {
  const {
    username, characterType, stats, rarity,
    abilities, topLanguages, customTitle, theme,
    seasonNumber, cardNumber,
  } = data;

  const title = customTitle || characterType.title;

  // 레트로 색상 팔레트
  const retroBg = '#1a1c2c';
  const retroBgSec = '#262b44';
  const retroText = '#f4f4f4';
  const retroTextSec = '#b8c7d4';
  const retroAccent = rarity.color;
  const retroBorder = '#333c57';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <filter id="pixelShadow">
      <feDropShadow dx="2" dy="2" stdDeviation="0" flood-color="#000" flood-opacity="0.5"/>
    </filter>
    <pattern id="scanlines" patternUnits="userSpaceOnUse" width="4" height="4">
      <rect width="4" height="2" fill="rgba(0,0,0,0.1)"/>
    </pattern>
  </defs>

  <style>
    .pixel-text { font-family: 'Courier New', 'Consolas', monospace; image-rendering: pixelated; }
    .pixel-title { font-size: 12px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }
    .pixel-rarity { font-size: 10px; font-weight: 700; letter-spacing: 3px; }
    .pixel-username { font-size: 14px; font-weight: 700; }
    .pixel-stat-label { font-size: 10px; font-weight: 700; }
    .pixel-stat-value { font-size: 14px; font-weight: 700; }
    .pixel-small { font-size: 9px; }
    .pixel-skill { font-size: 10px; }
    .pixel-footer { font-size: 8px; opacity: 0.5; }

    @keyframes blink {
      0%, 70% { opacity: 1; }
      71%, 100% { opacity: 0; }
    }
    .cursor-blink { animation: blink 1.2s step-end infinite; }

    @keyframes pixel-glow {
      0%, 100% { filter: drop-shadow(0 0 2px ${retroAccent}); }
      50% { filter: drop-shadow(0 0 6px ${retroAccent}); }
    }
    .pixel-glow { animation: pixel-glow 2s ease-in-out infinite; }
  </style>

  <!-- 카드 배경 (이중 테두리 - 레트로 스타일) -->
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="4" ry="4" fill="${retroBorder}"/>
  <rect x="4" y="4" width="${CARD_WIDTH - 8}" height="${CARD_HEIGHT - 8}" rx="2" ry="2" fill="${retroBg}"/>
  <rect x="8" y="8" width="${CARD_WIDTH - 16}" height="${CARD_HEIGHT - 16}" rx="2" ry="2"
        fill="none" stroke="${retroAccent}" stroke-width="2" stroke-dasharray="4 2" opacity="0.5"/>

  <!-- 스캔라인 오버레이 -->
  <rect x="4" y="4" width="${CARD_WIDTH - 8}" height="${CARD_HEIGHT - 8}" fill="url(#scanlines)" opacity="0.3"/>

  <!-- 레어도 배지 -->
  <rect x="30" y="14" width="${CARD_WIDTH - 60}" height="22" rx="2" ry="2" fill="${retroBgSec}" stroke="${retroAccent}" stroke-width="1"/>
  <text x="${CARD_WIDTH / 2}" y="29" text-anchor="middle" class="pixel-text pixel-rarity"
        fill="${retroAccent}">[${rarity.label}]</text>

  <!-- 캐릭터 영역 (점선 보더) -->
  <rect x="30" y="44" width="${CARD_WIDTH - 60}" height="130" rx="2" ry="2"
        fill="${retroBgSec}" stroke="${retroBorder}" stroke-width="2"/>
  ${renderPixelArtCharacter(characterType.type, 150, 50, 120, 115, {
    glowColor: retroAccent,
    animate: false,
  })}

  <!-- 캐릭터 이름 (8비트 스타일) -->
  <text x="${CARD_WIDTH / 2}" y="192" text-anchor="middle" class="pixel-text pixel-title"
        fill="${retroAccent}" filter="url(#pixelShadow)">
    &lt; ${characterType.element} ${title} ${characterType.element} &gt;</text>

  <!-- 유저네임 -->
  <text x="${CARD_WIDTH / 2}" y="214" text-anchor="middle" class="pixel-text pixel-username"
        fill="${retroText}">@${username}<tspan class="cursor-blink" fill="${retroAccent}">_</tspan></text>

  <!-- 구분선 (점선) -->
  <line x1="30" y1="226" x2="${CARD_WIDTH - 30}" y2="226"
        stroke="${retroBorder}" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 스탯 영역 (그리드 박스) -->
  ${renderPixelStatsSection(stats, retroAccent, retroBg, retroBgSec, retroText, retroTextSec, retroBorder, 238)}

  <!-- 구분선 -->
  <line x1="30" y1="318" x2="${CARD_WIDTH - 30}" y2="318"
        stroke="${retroBorder}" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 어빌리티 (콘솔 스타일) -->
  ${renderPixelAbilitiesSection(abilities, retroAccent, retroText, retroTextSec, 332)}

  <!-- 구분선 -->
  <line x1="30" y1="398" x2="${CARD_WIDTH - 30}" y2="398"
        stroke="${retroBorder}" stroke-width="1" stroke-dasharray="4 4"/>

  <!-- 스킬 바 (ASCII 스타일) -->
  ${renderPixelSkillsSection(topLanguages, retroText, retroTextSec, retroBgSec, retroBorder, 412)}

  <!-- 풋터 -->
  <text x="30" y="${CARD_HEIGHT - 16}" class="pixel-text pixel-footer" fill="${retroTextSec}">
    NO.${String(cardNumber).padStart(4, '0')}</text>
  <text x="${CARD_WIDTH - 30}" y="${CARD_HEIGHT - 16}" text-anchor="end" class="pixel-text pixel-footer"
        fill="${retroTextSec}">S${seasonNumber} // ${new Date().getFullYear()}</text>
</svg>`;
}

// ═══════════════════════════════════════════
// ✨ MINIMAL STYLE - 미니멀 모던 카드
// ═══════════════════════════════════════════

function renderMinimalStyle(data: CardRenderData): string {
  const {
    username, characterType, stats, rarity,
    abilities, topLanguages, customTitle, theme,
    seasonNumber, cardNumber,
  } = data;

  const title = customTitle || characterType.title;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <linearGradient id="minBg" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.background}"/>
      <stop offset="100%" stop-color="${theme.backgroundSecondary}"/>
    </linearGradient>
    <linearGradient id="accentLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${rarity.color}" stop-opacity="0"/>
      <stop offset="50%" stop-color="${rarity.color}"/>
      <stop offset="100%" stop-color="${rarity.color}" stop-opacity="0"/>
    </linearGradient>
  </defs>

  <style>
    .min-text { font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif; }
    .min-title { font-size: 18px; font-weight: 300; letter-spacing: 3px; }
    .min-username { font-size: 24px; font-weight: 700; letter-spacing: -0.5px; }
    .min-rarity { font-size: 10px; font-weight: 600; letter-spacing: 4px; text-transform: uppercase; }
    .min-stat-label { font-size: 9px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase; }
    .min-stat-value { font-size: 22px; font-weight: 300; }
    .min-ability { font-size: 11px; font-weight: 400; }
    .min-skill { font-size: 10px; font-weight: 500; }
    .min-footer { font-size: 8px; font-weight: 400; letter-spacing: 1px; opacity: 0.4; }
  </style>

  <!-- 배경 -->
  <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="20" ry="20" fill="url(#minBg)"/>

  <!-- 상단 레어도 악센트 라인 -->
  <rect x="40" y="12" width="${CARD_WIDTH - 80}" height="2" fill="url(#accentLine)"/>

  <!-- 레어도 -->
  <text x="${CARD_WIDTH / 2}" y="38" text-anchor="middle" class="min-text min-rarity"
        fill="${rarity.color}">${rarity.name.toUpperCase()}</text>

  <!-- 유저네임 (대형) -->
  <text x="${CARD_WIDTH / 2}" y="80" text-anchor="middle" class="min-text min-username"
        fill="${theme.text}">${username}</text>

  <!-- 타이틀 (부제) -->
  <text x="${CARD_WIDTH / 2}" y="104" text-anchor="middle" class="min-text min-title"
        fill="${theme.textSecondary}">${characterType.element} ${title}</text>

  <!-- 미니 캐릭터 이모지 -->
  <text x="${CARD_WIDTH / 2}" y="160" text-anchor="middle" font-size="48">${characterType.emoji}</text>

  <!-- 악센트 라인 -->
  <rect x="40" y="186" width="${CARD_WIDTH - 80}" height="1" fill="url(#accentLine)" opacity="0.5"/>

  <!-- 4개 스탯 (미니멀 레이아웃) -->
  ${renderMinimalStatsSection(stats, theme, rarity)}

  <!-- 악센트 라인 -->
  <rect x="40" y="310" width="${CARD_WIDTH - 80}" height="1" fill="url(#accentLine)" opacity="0.5"/>

  <!-- 어빌리티 (작은 태그 스타일) -->
  ${renderMinimalAbilitiesSection(abilities, theme, rarity)}

  <!-- 스킬 (얇은 바 스타일) -->
  ${renderMinimalSkillsSection(topLanguages, theme)}

  <!-- 하단 악센트 라인 -->
  <rect x="40" y="${CARD_HEIGHT - 40}" width="${CARD_WIDTH - 80}" height="1" fill="url(#accentLine)" opacity="0.3"/>

  <!-- 풋터 -->
  <text x="40" y="${CARD_HEIGHT - 18}" class="min-text min-footer" fill="${theme.textSecondary}">
    ${String(cardNumber).padStart(4, '0')}</text>
  <text x="${CARD_WIDTH - 40}" y="${CARD_HEIGHT - 18}" text-anchor="end" class="min-text min-footer"
        fill="${theme.textSecondary}">S${seasonNumber} · ${new Date().getFullYear()}</text>
</svg>`;
}

// ═══════════════════════════════════════════
// 🎌 ANIME STYLE - 애니메이션 만화풍 카드
// ═══════════════════════════════════════════

function renderAnimeStyle(data: CardRenderData): string {
  const {
    username, characterType, stats, rarity,
    abilities, topLanguages, customTitle, theme,
    seasonNumber, cardNumber,
  } = data;

  const title = customTitle || characterType.title;
  const displayTitle = `${characterType.element} ${title} ${characterType.element}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <linearGradient id="animeBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="40%" stop-color="${theme.background}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <linearGradient id="animeBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${rarity.color}">
        <animate attributeName="stop-color" values="${rarity.color};${rarity.glowColor};${rarity.color}" dur="2s" repeatCount="indefinite"/>
      </stop>
      <stop offset="100%" stop-color="${rarity.glowColor}">
        <animate attributeName="stop-color" values="${rarity.glowColor};${rarity.color};${rarity.glowColor}" dur="2s" repeatCount="indefinite"/>
      </stop>
    </linearGradient>
    <filter id="animeShadow">
      <feDropShadow dx="3" dy="3" stdDeviation="2" flood-color="#000" flood-opacity="0.4"/>
    </filter>
    <filter id="animeGlow">
      <feGaussianBlur stdDeviation="4" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="cardClip">
      <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" rx="18" ry="18"/>
    </clipPath>
  </defs>

  <style>
    .anime-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .anime-title { font-size: 16px; font-weight: 900; letter-spacing: 1px; }
    .anime-rarity { font-size: 12px; font-weight: 900; letter-spacing: 3px; }
    .anime-username { font-size: 18px; font-weight: 700; }
    .anime-stat-label { font-size: 10px; font-weight: 700; }
    .anime-stat-value { font-size: 18px; font-weight: 900; }
    .anime-ability { font-size: 11px; font-weight: 600; }
    .anime-skill { font-size: 10px; font-weight: 600; }
    .anime-footer { font-size: 9px; font-weight: 600; opacity: 0.5; }

    @keyframes speed-lines {
      0% { transform: translateX(0); opacity: 0.6; }
      100% { transform: translateX(30px); opacity: 0; }
    }
    .speed-line { animation: speed-lines 0.8s linear infinite; }
    .speed-line:nth-child(2) { animation-delay: 0.2s; }
    .speed-line:nth-child(3) { animation-delay: 0.4s; }
    .speed-line:nth-child(4) { animation-delay: 0.6s; }

    @keyframes anime-pulse {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.05); }
    }
    .anime-pulse { animation: anime-pulse 2s ease-in-out infinite; transform-origin: center; }

    @keyframes spark {
      0% { opacity: 0; transform: scale(0) rotate(0deg); }
      50% { opacity: 1; transform: scale(1) rotate(180deg); }
      100% { opacity: 0; transform: scale(0) rotate(360deg); }
    }
    .spark { animation: spark 1.5s ease-in-out infinite; }
  </style>

  <g clip-path="url(#cardClip)">
    <!-- 배경 -->
    <rect x="0" y="0" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" fill="url(#animeBg)"/>

    <!-- 대각선 집중선 효과 -->
    ${renderSpeedLines(CARD_WIDTH, CARD_HEIGHT, rarity.color)}

    <!-- 테두리 -->
    <rect x="3" y="3" width="${CARD_WIDTH - 6}" height="${CARD_HEIGHT - 6}" rx="16" ry="16"
          fill="none" stroke="url(#animeBorder)" stroke-width="3"/>

    <!-- 레어도 배너 (사선) -->
    <g transform="translate(${CARD_WIDTH - 100}, 0)">
      <polygon points="30,0 100,0 100,50 0,50" fill="${rarity.color}" opacity="0.9"/>
      <text x="65" y="22" text-anchor="middle" class="anime-text" font-size="8" font-weight="900"
            fill="#fff" letter-spacing="1">${rarity.name.toUpperCase()}</text>
    </g>

    <!-- 캐릭터 영역 (다이나믹) -->
    <rect x="25" y="40" width="${CARD_WIDTH - 50}" height="140" rx="12" ry="12"
          fill="${theme.backgroundSecondary}" stroke="${rarity.color}" stroke-width="2" opacity="0.9"/>

    <!-- 캐릭터 + 효과 -->
    <g class="anime-pulse">
      ${renderPixelArtCharacter(characterType.type, 145, 48, 130, 125, {
        glowColor: rarity.color,
        animate: true,
      })}
    </g>

    <!-- 타이틀 (볼드 + 그림자) -->
    <text x="${CARD_WIDTH / 2}" y="200" text-anchor="middle" class="anime-text anime-title"
          fill="${rarity.color}" filter="url(#animeShadow)">${displayTitle}</text>

    <!-- 유저네임 -->
    <text x="${CARD_WIDTH / 2}" y="224" text-anchor="middle" class="anime-text anime-username"
          fill="${theme.text}" filter="url(#animeShadow)">${username}</text>

    <!-- 스탯 (역동적 바 스타일) -->
    ${renderAnimeStatsSection(stats, rarity, theme, 244)}

    <!-- 어빌리티 (만화 말풍선 스타일) -->
    ${renderAnimeAbilitiesSection(abilities, theme, rarity, 340)}

    <!-- 스킬 -->
    ${renderAnimeSkillsSection(topLanguages, theme, rarity, 412)}

    <!-- 스파크 효과 -->
    ${rarity.name !== 'common' ? renderSparks(rarity.color) : ''}

    <!-- 풋터 -->
    <text x="30" y="${CARD_HEIGHT - 16}" class="anime-text anime-footer" fill="${theme.textSecondary}">
      #${String(cardNumber).padStart(4, '0')}</text>
    <text x="${CARD_WIDTH - 30}" y="${CARD_HEIGHT - 16}" text-anchor="end"
          class="anime-text anime-footer" fill="${theme.textSecondary}">
      S${seasonNumber} / ${new Date().getFullYear()}</text>
  </g>
</svg>`;
}

// ═══════════════════════════════════════════
// 🧩 공통 렌더링 헬퍼
// ═══════════════════════════════════════════

/** Hologram 스타일 스탯 렌더링 */
function renderStatsSection(stats: CardStats, rarity: RarityInfo, theme: ThemeColors, startY: number): string {
  const statItems = [
    { label: '⚔ ATK', value: stats.atk, color: '#EF4444' },
    { label: '🛡 DEF', value: stats.def, color: '#3B82F6' },
    { label: '🧠 INT', value: stats.int, color: '#A855F7' },
    { label: '⚡ SPD', value: stats.spd, color: '#F59E0B' },
  ];

  const boxWidth = 80;
  const gap = 15;
  const totalW = boxWidth * 4 + gap * 3;
  const startX = (CARD_WIDTH - totalW) / 2;

  let svg = '';
  statItems.forEach((stat, i) => {
    const x = startX + i * (boxWidth + gap);
    svg += `
    <g>
      <rect x="${x}" y="${startY}" width="${boxWidth}" height="65" rx="8" ry="8"
            fill="${theme.backgroundSecondary}" stroke="${stat.color}" stroke-width="1" opacity="0.8"/>
      <text x="${x + boxWidth / 2}" y="${startY + 22}" text-anchor="middle"
            class="card-text stat-label" fill="${stat.color}">${stat.label}</text>
      <text x="${x + boxWidth / 2}" y="${startY + 50}" text-anchor="middle"
            class="card-text stat-value" fill="${theme.text}">${stat.value}</text>
    </g>`;
  });
  return svg;
}

/** Hologram 스타일 어빌리티 렌더링 */
function renderAbilitiesSection(abilities: SpecialAbility[], theme: ThemeColors, startY: number): string {
  if (abilities.length === 0) {
    return `<text x="${CARD_WIDTH / 2}" y="${startY + 20}" text-anchor="middle"
        class="card-text ability-text" fill="${theme.textSecondary}" opacity="0.5">
      No special abilities detected yet...</text>`;
  }

  let svg = '';
  abilities.forEach((ability, i) => {
    const y = startY + i * 28;
    svg += `
    <text x="40" y="${y}" class="card-text" font-size="12" font-weight="600" fill="${theme.accent}">
      ${ability.icon} ${ability.name}</text>
    <text x="40" y="${y + 14}" class="card-text ability-text" fill="${theme.textSecondary}">
      ${ability.descriptionKo}</text>`;
  });
  return svg;
}

/** Hologram 스타일 스킬 렌더링 */
function renderSkillsSection(
  topLanguages: Array<{ name: string; percent: number }>,
  theme: ThemeColors,
  startY: number
): string {
  let svg = `
  <text x="40" y="${startY}" class="card-text" font-size="11" font-weight="600"
        fill="${theme.textSecondary}" letter-spacing="1">── SKILLS ──</text>`;

  const barWidth = 120;
  const barHeight = 8;
  const itemStartY = startY + 14;

  topLanguages.slice(0, 5).forEach((lang, i) => {
    const y = itemStartY + i * 22;
    const langColor = getLanguageColor(lang.name);
    const level = Math.max(1, Math.round(lang.percent / 10));
    const filledWidth = Math.round((lang.percent / 100) * barWidth);

    svg += `
    <text x="40" y="${y + 10}" class="card-text skill-text" fill="${theme.text}">${lang.name}</text>
    <rect x="160" y="${y + 2}" width="${barWidth}" height="${barHeight}" rx="4" ry="4"
          fill="${theme.backgroundSecondary}"/>
    <rect x="160" y="${y + 2}" width="${filledWidth}" height="${barHeight}" rx="4" ry="4"
          fill="${langColor}"/>
    <text x="${160 + barWidth + 10}" y="${y + 10}" class="card-text skill-text"
          fill="${theme.textSecondary}">Lv.${level}</text>
    <text x="${CARD_WIDTH - 40}" y="${y + 10}" text-anchor="end" class="card-text skill-text"
          fill="${theme.textSecondary}">${lang.percent.toFixed(1)}%</text>`;
  });
  return svg;
}

// ── Pixel Style 헬퍼 ──────────────────────────

function renderPixelStatsSection(
  stats: CardStats,
  accent: string, bg: string, bgSec: string,
  text: string, textSec: string, border: string,
  startY: number
): string {
  const statItems = [
    { label: 'ATK', icon: '⚔', value: stats.atk, color: '#EF4444' },
    { label: 'DEF', icon: '🛡', value: stats.def, color: '#3B82F6' },
    { label: 'INT', icon: '🧠', value: stats.int, color: '#A855F7' },
    { label: 'SPD', icon: '⚡', value: stats.spd, color: '#F59E0B' },
  ];

  const boxW = 82;
  const gap = 10;
  const totalW = boxW * 4 + gap * 3;
  const startX = (CARD_WIDTH - totalW) / 2;

  let svg = '';
  statItems.forEach((stat, i) => {
    const x = startX + i * (boxW + gap);
    svg += `
    <rect x="${x}" y="${startY}" width="${boxW}" height="68" rx="2" ry="2"
          fill="${bgSec}" stroke="${stat.color}" stroke-width="2"/>
    <text x="${x + boxW / 2}" y="${startY + 18}" text-anchor="middle"
          class="pixel-text pixel-stat-label" fill="${stat.color}">[${stat.label}]</text>
    <text x="${x + boxW / 2}" y="${startY + 46}" text-anchor="middle"
          class="pixel-text pixel-stat-value" fill="${text}">${stat.value}</text>
    <rect x="${x + 6}" y="${startY + 54}" width="${boxW - 12}" height="6" rx="1" ry="1" fill="${bg}"/>
    <rect x="${x + 6}" y="${startY + 54}" width="${Math.round((stat.value / 999) * (boxW - 12))}" height="6" rx="1" ry="1" fill="${stat.color}"/>`;
  });
  return svg;
}

function renderPixelAbilitiesSection(
  abilities: SpecialAbility[],
  accent: string, text: string, textSec: string,
  startY: number
): string {
  if (abilities.length === 0) {
    return `<text x="40" y="${startY}" class="pixel-text pixel-small" fill="${textSec}">
      &gt; NO ABILITIES DETECTED...</text>`;
  }

  let svg = `<text x="40" y="${startY}" class="pixel-text pixel-small" fill="${accent}">&gt; ABILITIES:</text>`;
  abilities.forEach((ability, i) => {
    const y = startY + 18 + i * 26;
    svg += `
    <text x="40" y="${y}" class="pixel-text" font-size="11" font-weight="700" fill="${accent}">
      ${ability.icon} ${ability.name}</text>
    <text x="40" y="${y + 13}" class="pixel-text pixel-small" fill="${textSec}">
      └─ ${ability.descriptionKo}</text>`;
  });
  return svg;
}

function renderPixelSkillsSection(
  topLanguages: Array<{ name: string; percent: number }>,
  text: string, textSec: string, bgSec: string, border: string,
  startY: number
): string {
  let svg = `<text x="40" y="${startY}" class="pixel-text pixel-skill" fill="${textSec}">
    ─── SKILLS ───</text>`;

  topLanguages.slice(0, 5).forEach((lang, i) => {
    const y = startY + 18 + i * 20;
    const langColor = getLanguageColor(lang.name);
    const barLen = 16;
    const filled = Math.round((lang.percent / 100) * barLen);
    const bar = '█'.repeat(filled) + '░'.repeat(barLen - filled);

    svg += `
    <text x="40" y="${y}" class="pixel-text pixel-skill" fill="${text}">
      ${lang.name.padEnd(12)} </text>
    <text x="160" y="${y}" class="pixel-text pixel-skill" fill="${langColor}">
      ${bar}</text>
    <text x="${CARD_WIDTH - 40}" y="${y}" text-anchor="end" class="pixel-text pixel-skill" fill="${textSec}">
      ${lang.percent.toFixed(0)}%</text>`;
  });
  return svg;
}

// ── Minimal Style 헬퍼 ──────────────────────────

function renderMinimalStatsSection(stats: CardStats, theme: ThemeColors, rarity: RarityInfo): string {
  const statItems = [
    { label: 'ATK', value: stats.atk },
    { label: 'DEF', value: stats.def },
    { label: 'INT', value: stats.int },
    { label: 'SPD', value: stats.spd },
  ];

  const boxW = 80;
  const gap = 10;
  const totalW = boxW * 4 + gap * 3;
  const startX = (CARD_WIDTH - totalW) / 2;
  const y = 206;

  let svg = '';
  statItems.forEach((stat, i) => {
    const x = startX + i * (boxW + gap);
    // 얇은 상단 악센트 라인
    svg += `
    <rect x="${x}" y="${y}" width="${boxW}" height="2" rx="1" ry="1" fill="${rarity.color}" opacity="0.5"/>
    <text x="${x + boxW / 2}" y="${y + 24}" text-anchor="middle"
          class="min-text min-stat-label" fill="${theme.textSecondary}">${stat.label}</text>
    <text x="${x + boxW / 2}" y="${y + 60}" text-anchor="middle"
          class="min-text min-stat-value" fill="${theme.text}">${stat.value}</text>
    <text x="${x + boxW / 2}" y="${y + 80}" text-anchor="middle"
          class="min-text" font-size="8" fill="${theme.textSecondary}" opacity="0.5">/ 999</text>`;
  });
  return svg;
}

function renderMinimalAbilitiesSection(abilities: SpecialAbility[], theme: ThemeColors, rarity: RarityInfo): string {
  const startY = 326;
  if (abilities.length === 0) {
    return `<text x="${CARD_WIDTH / 2}" y="${startY}" text-anchor="middle"
        class="min-text" font-size="10" fill="${theme.textSecondary}" opacity="0.4">
      — no abilities —</text>`;
  }

  let svg = '';
  const tagGap = 12;
  let currentX = 40;

  abilities.forEach((ability) => {
    const textWidth = ability.name.length * 7 + 30;
    svg += `
    <rect x="${currentX}" y="${startY - 12}" width="${textWidth}" height="24" rx="12" ry="12"
          fill="none" stroke="${rarity.color}" stroke-width="1" opacity="0.6"/>
    <text x="${currentX + textWidth / 2}" y="${startY + 2}" text-anchor="middle"
          class="min-text min-ability" fill="${theme.text}">
      ${ability.icon} ${ability.name}</text>`;
    currentX += textWidth + tagGap;
  });
  return svg;
}

function renderMinimalSkillsSection(topLanguages: Array<{ name: string; percent: number }>, theme: ThemeColors): string {
  const startY = 368;
  let svg = '';

  topLanguages.slice(0, 5).forEach((lang, i) => {
    const y = startY + i * 28;
    const langColor = getLanguageColor(lang.name);
    const barWidth = 200;
    const filledWidth = Math.round((lang.percent / 100) * barWidth);

    svg += `
    <text x="40" y="${y + 4}" class="min-text min-skill" fill="${theme.text}">${lang.name}</text>
    <rect x="140" y="${y - 4}" width="${barWidth}" height="4" rx="2" ry="2" fill="${theme.backgroundSecondary}"/>
    <rect x="140" y="${y - 4}" width="${filledWidth}" height="4" rx="2" ry="2" fill="${langColor}"/>
    <text x="${CARD_WIDTH - 40}" y="${y + 4}" text-anchor="end" class="min-text min-skill"
          fill="${theme.textSecondary}">${lang.percent.toFixed(1)}%</text>`;
  });
  return svg;
}

// ── Anime Style 헬퍼 ──────────────────────────

function renderAnimeStatsSection(stats: CardStats, rarity: RarityInfo, theme: ThemeColors, startY: number): string {
  const statItems = [
    { label: 'ATK', value: stats.atk, color: '#EF4444', icon: '⚔' },
    { label: 'DEF', value: stats.def, color: '#3B82F6', icon: '🛡' },
    { label: 'INT', value: stats.int, color: '#A855F7', icon: '🧠' },
    { label: 'SPD', value: stats.spd, color: '#F59E0B', icon: '⚡' },
  ];

  const barWidth = 180;
  let svg = '';

  statItems.forEach((stat, i) => {
    const y = startY + i * 22;
    const filledW = Math.round((stat.value / 999) * barWidth);

    svg += `
    <text x="40" y="${y + 12}" class="anime-text anime-stat-label" fill="${stat.color}">
      ${stat.icon} ${stat.label}</text>
    <rect x="110" y="${y + 2}" width="${barWidth}" height="12" rx="6" ry="6"
          fill="${theme.backgroundSecondary}" stroke="${stat.color}" stroke-width="1" opacity="0.4"/>
    <rect x="110" y="${y + 2}" width="${filledW}" height="12" rx="6" ry="6" fill="${stat.color}" opacity="0.8"/>
    <text x="${110 + barWidth + 12}" y="${y + 14}" class="anime-text anime-stat-value"
          fill="${theme.text}" font-size="14">${stat.value}</text>`;
  });
  return svg;
}

function renderAnimeAbilitiesSection(abilities: SpecialAbility[], theme: ThemeColors, rarity: RarityInfo, startY: number): string {
  if (abilities.length === 0) {
    return `<text x="${CARD_WIDTH / 2}" y="${startY + 14}" text-anchor="middle"
        class="anime-text" font-size="10" fill="${theme.textSecondary}" opacity="0.5">
      ??? ABILITY LOCKED ???</text>`;
  }

  let svg = '';
  abilities.forEach((ability, i) => {
    const y = startY + i * 32;
    // 말풍선 배경
    svg += `
    <rect x="35" y="${y - 8}" width="${CARD_WIDTH - 70}" height="28" rx="8" ry="8"
          fill="${theme.backgroundSecondary}" stroke="${rarity.color}" stroke-width="1" opacity="0.7"/>
    <text x="50" y="${y + 8}" class="anime-text anime-ability" fill="${rarity.color}">
      ${ability.icon} ${ability.name}</text>
    <text x="${CARD_WIDTH - 50}" y="${y + 8}" text-anchor="end"
          class="anime-text" font-size="9" fill="${theme.textSecondary}">
      ${ability.descriptionKo}</text>`;
  });
  return svg;
}

function renderAnimeSkillsSection(
  topLanguages: Array<{ name: string; percent: number }>,
  theme: ThemeColors, rarity: RarityInfo, startY: number
): string {
  let svg = `<text x="40" y="${startY}" class="anime-text anime-skill" fill="${rarity.color}"
      font-weight="900" letter-spacing="2">▸ SKILLS</text>`;

  topLanguages.slice(0, 4).forEach((lang, i) => {
    const y = startY + 16 + i * 22;
    const langColor = getLanguageColor(lang.name);
    const barWidth = 140;
    const filledW = Math.round((lang.percent / 100) * barWidth);
    const level = Math.max(1, Math.round(lang.percent / 10));

    svg += `
    <circle cx="48" cy="${y + 3}" r="3" fill="${langColor}"/>
    <text x="58" y="${y + 7}" class="anime-text anime-skill" fill="${theme.text}">${lang.name}</text>
    <rect x="160" y="${y - 2}" width="${barWidth}" height="10" rx="5" ry="5"
          fill="${theme.backgroundSecondary}"/>
    <rect x="160" y="${y - 2}" width="${filledW}" height="10" rx="5" ry="5" fill="${langColor}">
      <animate attributeName="width" from="0" to="${filledW}" dur="1s" fill="freeze"/>
    </rect>
    <text x="${160 + barWidth + 10}" y="${y + 7}" class="anime-text anime-skill"
          fill="${theme.textSecondary}">Lv.${level}</text>`;
  });
  return svg;
}

// ── 이펙트 렌더링 ──────────────────────────

/** 파티클 효과 (Epic/Legendary용) */
function renderParticles(color: string): string {
  const particles = [
    { cx: 50, cy: 520, r: 2, delay: '0s' },
    { cx: 120, cy: 540, r: 1.5, delay: '0.5s' },
    { cx: 200, cy: 510, r: 2.5, delay: '1s' },
    { cx: 300, cy: 530, r: 1.5, delay: '1.5s' },
    { cx: 370, cy: 515, r: 2, delay: '0.3s' },
    { cx: 80, cy: 500, r: 1, delay: '0.8s' },
    { cx: 340, cy: 545, r: 1.5, delay: '1.2s' },
  ];

  return particles
    .map(
      (p) => `
    <circle cx="${p.cx}" cy="${p.cy}" r="${p.r}" fill="${color}" filter="url(#particleGlow)" class="particle">
      <animate attributeName="cy" from="${p.cy}" to="${p.cy - 60}" dur="2.5s" repeatCount="indefinite" begin="${p.delay}"/>
      <animate attributeName="opacity" from="1" to="0" dur="2.5s" repeatCount="indefinite" begin="${p.delay}"/>
      <animate attributeName="r" from="${p.r}" to="0" dur="2.5s" repeatCount="indefinite" begin="${p.delay}"/>
    </circle>`
    )
    .join('');
}

/** 스피드 라인 효과 (Anime 스타일용) */
function renderSpeedLines(width: number, height: number, color: string): string {
  const lines = [];
  for (let i = 0; i < 8; i++) {
    const y = 40 + Math.random() * (height - 80);
    const len = 20 + Math.random() * 40;
    const opacity = 0.05 + Math.random() * 0.1;
    lines.push(
      `<line x1="${width - len}" y1="${y}" x2="${width}" y2="${y}"
        stroke="${color}" stroke-width="1" opacity="${opacity}" class="speed-line"/>`
    );
  }
  return lines.join('\n');
}

/** 스파크 효과 (Anime 스타일용) */
function renderSparks(color: string): string {
  const sparks = [
    { x: 60, y: 50, size: 8, delay: '0s' },
    { x: 350, y: 80, size: 6, delay: '0.5s' },
    { x: 380, y: 300, size: 5, delay: '1s' },
    { x: 40, y: 400, size: 7, delay: '1.5s' },
  ];

  return sparks
    .map(
      (s) => `
    <text x="${s.x}" y="${s.y}" font-size="${s.size}" fill="${color}" class="spark"
          style="animation-delay: ${s.delay}">✦</text>`
    )
    .join('');
}
