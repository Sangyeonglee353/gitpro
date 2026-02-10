// ═══════════════════════════════════════════
// 🎴 Pet Renderer - 코드 펫 SVG 카드 렌더링
// ═══════════════════════════════════════════

import { ThemeColors, CodePetConfig } from '../../types';
import { PetSpecies, EvolutionStage, PetMood, getExpToNextEvolution } from './pet-species';
import { ExpReport } from './exp-calculator';
import { renderPetPixelArt } from './pet-pixel-art';

const CARD_WIDTH = 480;
const CARD_HEIGHT = 320;

export interface PetRenderData {
  username: string;
  species: PetSpecies;
  stage: EvolutionStage;
  currentExp: number;
  mood: PetMood;
  hunger: number;
  expReport: ExpReport;
  petAge: number;
  customName: string;
  activityStatus: { status: string; statusKo: string; icon: string };
  config: CodePetConfig;
  theme: ThemeColors;
}

/**
 * 코드 펫 카드 SVG를 렌더링합니다.
 */
export function renderPetCard(data: PetRenderData): string {
  const {
    username, species, stage, currentExp, mood,
    hunger, expReport, petAge, customName,
    activityStatus, config, theme,
  } = data;

  const petName = customName || species.name;
  const evolution = getExpToNextEvolution(currentExp);
  const isLegend = stage.stage >= 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${CARD_WIDTH}" height="${CARD_HEIGHT}" viewBox="0 0 ${CARD_WIDTH} ${CARD_HEIGHT}">
  <defs>
    <linearGradient id="petCardBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <linearGradient id="petBorder" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${species.color}"/>
      <stop offset="50%" stop-color="${species.secondaryColor}"/>
      <stop offset="100%" stop-color="${species.color}"/>
    </linearGradient>
    <linearGradient id="expBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${species.color}"/>
      <stop offset="100%" stop-color="${species.secondaryColor}"/>
    </linearGradient>
    <linearGradient id="moodBar" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${theme.error}"/>
      <stop offset="50%" stop-color="${theme.warning}"/>
      <stop offset="100%" stop-color="${theme.success}"/>
    </linearGradient>
    <filter id="petShadow">
      <feDropShadow dx="0" dy="2" stdDeviation="4" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    <filter id="petGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    ${isLegend ? `
    <filter id="legendGlow">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>` : ''}
  </defs>

  <style>
    .pet-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .pet-name { font-size: 18px; font-weight: 700; }
    .pet-species { font-size: 11px; font-weight: 500; letter-spacing: 1px; }
    .pet-label { font-size: 10px; font-weight: 600; letter-spacing: 0.5px; }
    .pet-value { font-size: 12px; font-weight: 700; }
    .pet-small { font-size: 9px; opacity: 0.7; }
    .pet-reaction { font-size: 10px; font-weight: 500; }
    .pet-status { font-size: 10px; font-weight: 600; }
    .pet-stage { font-size: 10px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; }

    @keyframes petBounce {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-4px); }
    }
    .pet-bounce { animation: petBounce 2s ease-in-out infinite; }

    @keyframes sparkle {
      0%, 100% { opacity: 0; }
      50% { opacity: 1; }
    }
    .sparkle { animation: sparkle 1.5s ease-in-out infinite; }

    @keyframes heartbeat {
      0%, 100% { transform: scale(1); }
      50% { transform: scale(1.1); }
    }
    .heartbeat { animation: heartbeat 1.5s ease-in-out infinite; transform-origin: center; }

    ${isLegend ? `
    @keyframes legendShimmer {
      0% { opacity: 0; transform: translateX(-50px); }
      50% { opacity: 0.3; }
      100% { opacity: 0; transform: translateX(50px); }
    }
    .legend-shimmer { animation: legendShimmer 3s ease-in-out infinite; }

    @keyframes rainbowBorder {
      0% { stop-color: #ff0000; }
      16% { stop-color: #ff8800; }
      33% { stop-color: #ffff00; }
      50% { stop-color: #00ff00; }
      66% { stop-color: #0088ff; }
      83% { stop-color: #8800ff; }
      100% { stop-color: #ff0000; }
    }
    #petBorder stop:nth-child(1) { animation: rainbowBorder 4s linear infinite; }
    #petBorder stop:nth-child(2) { animation: rainbowBorder 4s linear infinite 1.3s; }
    #petBorder stop:nth-child(3) { animation: rainbowBorder 4s linear infinite 2.6s; }
    ` : ''}
  </style>

  <!-- 카드 외곽 -->
  <rect x="2" y="2" width="${CARD_WIDTH - 4}" height="${CARD_HEIGHT - 4}" rx="16" ry="16"
        fill="url(#petBorder)" filter="url(#petShadow)"/>
  <rect x="5" y="5" width="${CARD_WIDTH - 10}" height="${CARD_HEIGHT - 10}" rx="14" ry="14"
        fill="url(#petCardBg)"/>

  <!-- ═══ 좌측 영역: 펫 + 스테이지 ═══ -->

  <!-- 펫 영역 배경 -->
  <rect x="16" y="16" width="180" height="200" rx="12" ry="12"
        fill="${theme.backgroundSecondary}" stroke="${species.color}" stroke-width="1" opacity="0.8"/>

  <!-- 진화 단계 배지 -->
  <rect x="26" y="22" width="160" height="20" rx="10" ry="10"
        fill="${species.color}" opacity="0.2"/>
  <text x="106" y="36" text-anchor="middle" class="pet-text pet-stage"
        fill="${species.color}" ${isLegend ? 'filter="url(#legendGlow)"' : ''}>
    ${stage.emoji} ${stage.formTitleKo}</text>

  <!-- 펫 픽셀아트 -->
  <g class="${config.animation ? 'pet-bounce' : ''}">
    ${renderPetPixelArt(species, stage.stage, 46, 50, 120, 110, {
      animate: config.animation,
      glowColor: species.color,
      showAura: isLegend,
    })}
  </g>

  <!-- 기분 이모지 -->
  ${config.show_mood ? `
  <text x="156" y="54" font-size="16" class="${config.animation ? 'heartbeat' : ''}">${mood.emoji}</text>
  ` : ''}

  <!-- 활동 상태 -->
  <rect x="26" y="170" width="160" height="18" rx="9" ry="9"
        fill="${theme.backgroundSecondary}" stroke="${theme.border}" stroke-width="0.5"/>
  <text x="106" y="183" text-anchor="middle" class="pet-text pet-status"
        fill="${theme.textSecondary}">${activityStatus.icon} ${activityStatus.statusKo}</text>

  <!-- 속성 태그 -->
  <rect x="26" y="194" width="70" height="16" rx="8" ry="8"
        fill="${species.color}" opacity="0.15"/>
  <text x="61" y="205" text-anchor="middle" class="pet-text pet-small"
        fill="${species.color}">${species.elementEmoji} ${species.element}</text>

  <!-- 나이 -->
  <text x="116" y="205" class="pet-text pet-small" fill="${theme.textSecondary}">
    Day ${petAge}</text>

  <!-- ═══ 우측 영역: 정보 + EXP ═══ -->

  <!-- 펫 이름 -->
  <text x="214" y="38" class="pet-text pet-name"
        fill="${theme.text}">${species.emoji} ${petName}</text>
  <text x="214" y="54" class="pet-text pet-species"
        fill="${theme.textSecondary}">@${username}'s companion</text>

  <!-- 구분선 -->
  <line x1="214" y1="62" x2="${CARD_WIDTH - 20}" y2="62"
        stroke="${theme.border}" stroke-width="0.5" opacity="0.5"/>

  <!-- EXP 바 -->
  <text x="214" y="80" class="pet-text pet-label" fill="${theme.textSecondary}">EXP</text>
  <text x="${CARD_WIDTH - 20}" y="80" text-anchor="end" class="pet-text pet-value"
        fill="${species.color}">${formatExp(currentExp)}</text>
  <rect x="214" y="86" width="${CARD_WIDTH - 234}" height="8" rx="4" ry="4"
        fill="${theme.backgroundSecondary}"/>
  <rect x="214" y="86" width="${Math.round((evolution.progress / 100) * (CARD_WIDTH - 234))}" height="8" rx="4" ry="4"
        fill="url(#expBar)">
    ${config.animation ? `<animate attributeName="width" from="0" to="${Math.round((evolution.progress / 100) * (CARD_WIDTH - 234))}" dur="1.5s" fill="freeze"/>` : ''}
  </rect>
  ${evolution.next ? `
  <text x="214" y="106" class="pet-text pet-small" fill="${theme.textSecondary}">
    다음 진화까지: ${formatExp(evolution.remaining)} EXP (${evolution.progress}%)</text>
  ` : `
  <text x="214" y="106" class="pet-text pet-small" fill="${species.color}">
    ✦ 최종 진화 달성! ✦</text>
  `}

  ${config.show_stats ? renderStatsSection(data, 214, 116) : ''}

  <!-- 최근 획득 EXP -->
  <line x1="214" y1="${config.show_stats ? 212 : 170}" x2="${CARD_WIDTH - 20}" y2="${config.show_stats ? 212 : 170}"
        stroke="${theme.border}" stroke-width="0.5" opacity="0.3"/>
  ${renderRecentExp(expReport, theme, species, config, config.show_stats ? 226 : 184)}

  <!-- 펫 반응 메시지 -->
  ${renderReaction(expReport, theme, species, config)}

  <!-- 풋터 -->
  <line x1="16" y1="${CARD_HEIGHT - 28}" x2="${CARD_WIDTH - 16}" y2="${CARD_HEIGHT - 28}"
        stroke="${theme.border}" stroke-width="0.5" opacity="0.3"/>
  <text x="20" y="${CARD_HEIGHT - 12}" class="pet-text pet-small" fill="${theme.textSecondary}">
    🐾 gitpro Code Pet</text>
  <text x="${CARD_WIDTH - 20}" y="${CARD_HEIGHT - 12}" text-anchor="end" class="pet-text pet-small"
        fill="${theme.textSecondary}">${new Date().toISOString().split('T')[0]}</text>

  <!-- 전설 시머 효과 -->
  ${isLegend ? `
  <rect x="5" y="5" width="${CARD_WIDTH - 10}" height="${CARD_HEIGHT - 10}" rx="14" ry="14"
        fill="url(#petBorder)" opacity="0.05" class="legend-shimmer"/>
  ` : ''}

  <!-- 스파클 효과 (stage 3+) -->
  ${stage.stage >= 3 && config.animation ? renderSparkles(species.color) : ''}
</svg>`;
}

// ── 스탯 영역 렌더링 ──────────────────

function renderStatsSection(data: PetRenderData, startX: number, startY: number): string {
  const { mood, hunger, theme, config, species } = data;
  const barWidth = CARD_WIDTH - startX - 20;

  let svg = '';

  // Mood 바
  svg += `
  <text x="${startX}" y="${startY + 14}" class="pet-text pet-label" fill="${theme.textSecondary}">
    ${mood.emoji} 기분</text>
  <text x="${startX + barWidth}" y="${startY + 14}" text-anchor="end" class="pet-text pet-label"
        fill="${theme.text}">${mood.labelKo}</text>
  <rect x="${startX}" y="${startY + 20}" width="${barWidth}" height="6" rx="3" ry="3"
        fill="${theme.backgroundSecondary}"/>
  <rect x="${startX}" y="${startY + 20}" width="${Math.round((data.expReport.newMood / 100) * barWidth)}" height="6" rx="3" ry="3"
        fill="${theme.success}"/>`;

  // Hunger 바
  if (config.show_mood) {
    const hungerPercent = Math.max(0, 100 - hunger);
    svg += `
    <text x="${startX}" y="${startY + 46}" class="pet-text pet-label" fill="${theme.textSecondary}">
      🍖 포만감</text>
    <text x="${startX + barWidth}" y="${startY + 46}" text-anchor="end" class="pet-text pet-label"
          fill="${theme.text}">${hungerPercent}%</text>
    <rect x="${startX}" y="${startY + 52}" width="${barWidth}" height="6" rx="3" ry="3"
          fill="${theme.backgroundSecondary}"/>
    <rect x="${startX}" y="${startY + 52}" width="${Math.round((hungerPercent / 100) * barWidth)}" height="6" rx="3" ry="3"
          fill="${species.color}"/>`;
  }

  // 총 EXP 획득량 미니 배지
  if (data.expReport.totalGained > 0) {
    svg += `
    <rect x="${startX}" y="${startY + 68}" width="auto" height="18" rx="9" ry="9"
          fill="${species.color}" opacity="0.1"/>
    <text x="${startX + 8}" y="${startY + 80}" class="pet-text pet-label"
          fill="${species.color}">+${formatExp(data.expReport.totalGained)} EXP earned!</text>`;
  }

  return svg;
}

// ── 최근 획득 EXP 렌더링 ──────────────────

function renderRecentExp(
  expReport: ExpReport,
  theme: ThemeColors,
  species: PetSpecies,
  config: CodePetConfig,
  startY: number
): string {
  const startX = 214;
  let svg = `<text x="${startX}" y="${startY}" class="pet-text pet-label"
      fill="${theme.textSecondary}">📊 EXP 내역</text>`;

  // 상위 3개 항목만 표시
  const topItems = expReport.breakdown
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 3);

  topItems.forEach((item, i) => {
    const y = startY + 16 + i * 16;
    svg += `
    <text x="${startX + 4}" y="${y}" class="pet-text pet-small" fill="${theme.text}">
      ${item.icon} ${item.sourceKo}</text>
    <text x="${CARD_WIDTH - 20}" y="${y}" text-anchor="end" class="pet-text pet-small"
          fill="${species.color}">+${formatExp(item.amount)}</text>`;
  });

  return svg;
}

// ── 펫 반응 렌더링 ──────────────────

function renderReaction(
  expReport: ExpReport,
  theme: ThemeColors,
  species: PetSpecies,
  config: CodePetConfig
): string {
  if (expReport.reactions.length === 0) return '';

  // 랜덤이 아닌 첫 번째 반응 표시
  const reaction = expReport.reactions[0];

  return `
  <rect x="16" y="${CARD_HEIGHT - 50}" width="180" height="18" rx="9" ry="9"
        fill="${species.color}" opacity="0.1"/>
  <text x="106" y="${CARD_HEIGHT - 38}" text-anchor="middle" class="pet-text pet-reaction"
        fill="${species.color}">"${reaction.messageKo}"</text>`;
}

// ── 스파클 이펙트 ──────────────────

function renderSparkles(color: string): string {
  const sparkles = [
    { x: 30, y: 20, delay: '0s' },
    { x: 170, y: 30, delay: '0.5s' },
    { x: 450, y: 50, delay: '1s' },
    { x: 400, y: 280, delay: '1.5s' },
    { x: 220, y: 290, delay: '0.8s' },
  ];

  return sparkles
    .map(
      s => `<text x="${s.x}" y="${s.y}" font-size="8" fill="${color}" class="sparkle"
        style="animation-delay: ${s.delay}">✦</text>`
    )
    .join('');
}

// ── 유틸리티 ──────────────────

function formatExp(exp: number): string {
  if (exp >= 1_000_000) return `${(exp / 1_000_000).toFixed(1)}M`;
  if (exp >= 1_000) return `${(exp / 1_000).toFixed(1)}k`;
  return exp.toString();
}
