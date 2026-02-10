// ═══════════════════════════════════════════
// 🌌 Constellation Renderer - 별자리 SVG 렌더링
// ═══════════════════════════════════════════
//
// 커밋 별자리를 아름다운 밤하늘 SVG로 렌더링합니다.
// sky_theme 설정에 따라 4가지 하늘 스타일을 지원합니다:
//   - midnight: 깊은 밤 + 은하수
//   - aurora: 오로라 빛
//   - sunset: 보라색 석양
//   - deep_space: 우주 공간

import { ThemeColors, ConstellationConfig } from '../../types';
import {
  ConstellationProfile,
  Constellation,
  Star,
  Meteor,
  Nebula,
  SkyBackground,
  ConstellationStats,
} from './constellation-analyzer';
import {
  getSkyThemeColors,
  SkyThemeColors,
  getRepoTypeIcon,
} from './star-mapper';

const SVG_WIDTH = 800;
const SVG_HEIGHT = 500;
const HEADER_HEIGHT = 40;
const FOOTER_HEIGHT = 45;
const SKY_Y = HEADER_HEIGHT;
const SKY_HEIGHT = SVG_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT;

export interface ConstellationRenderData {
  username: string;
  profile: ConstellationProfile;
  config: ConstellationConfig;
  theme: ThemeColors;
}

/**
 * Constellation SVG를 렌더링합니다.
 */
export function renderConstellation(data: ConstellationRenderData): string {
  const { username, profile, config, theme } = data;
  const skyTheme = config.sky_theme || 'midnight';
  const skyColors = getSkyThemeColors(skyTheme);

  const defs = buildDefs(skyColors, profile.sky, theme);
  const styles = buildStyles(skyColors);

  const skyElements = [
    renderSkyBackground(skyColors, profile.sky),
    config.show_nebula !== false ? renderNebulas(profile.nebulas, skyColors) : '',
    profile.sky.showMilkyWay ? renderMilkyWay(skyColors) : '',
    renderBackgroundStars(),
    renderConstellations(profile.constellations, skyColors),
    config.show_meteors !== false ? renderMeteors(profile.meteors, skyColors) : '',
  ].join('\n');

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${SVG_HEIGHT}" viewBox="0 0 ${SVG_WIDTH} ${SVG_HEIGHT}">
${defs}
${styles}

<!-- 외곽 배경 -->
<rect width="${SVG_WIDTH}" height="${SVG_HEIGHT}" rx="16" fill="${skyColors.bgGradient[0]}"/>

<!-- 헤더 -->
${renderHeader(username, skyColors)}

<!-- 밤하늘 영역 -->
<g transform="translate(0, ${SKY_Y})" clip-path="url(#skyClip)">
  ${skyElements}
</g>

<!-- 푸터 -->
${renderFooter(profile.stats, skyColors)}

<!-- 외곽 테두리 -->
<rect x="1" y="1" width="${SVG_WIDTH - 2}" height="${SVG_HEIGHT - 2}" rx="15"
      fill="none" stroke="${skyColors.borderColor}" stroke-width="1" opacity="0.5"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🎨 Defs (그라데이션, 필터, 클립패스)
// ═══════════════════════════════════════════

function buildDefs(
  skyColors: SkyThemeColors,
  sky: SkyBackground,
  theme: ThemeColors
): string {
  const gradientStops = skyColors.bgGradient
    .map((color, i, arr) => {
      const offset = Math.round((i / (arr.length - 1)) * 100);
      return `<stop offset="${offset}%" stop-color="${color}"/>`;
    })
    .join('\n      ');

  return `<defs>
    <!-- 하늘 배경 그라데이션 -->
    <linearGradient id="skyBg" x1="0%" y1="0%" x2="0%" y2="100%">
      ${gradientStops}
    </linearGradient>

    <!-- 별 빛 그라데이션 -->
    <radialGradient id="starGlow" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stop-color="${skyColors.starGlow}" stop-opacity="0.9"/>
      <stop offset="50%" stop-color="${skyColors.starGlow}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${skyColors.starGlow}" stop-opacity="0"/>
    </radialGradient>

    <!-- 성운 그로우 -->
    <filter id="nebulaBlur">
      <feGaussianBlur stdDeviation="12"/>
    </filter>

    <!-- 별 글로우 -->
    <filter id="starBlur">
      <feGaussianBlur stdDeviation="1.5" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 강한 글로우 -->
    <filter id="strongGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 유성 글로우 -->
    <filter id="meteorGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge>
        <feMergeNode in="blur"/>
        <feMergeNode in="SourceGraphic"/>
      </feMerge>
    </filter>

    <!-- 은하수 그라데이션 -->
    <linearGradient id="milkyWay" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${skyColors.milkyWayColor}" stop-opacity="0"/>
      <stop offset="30%" stop-color="${skyColors.milkyWayColor}" stop-opacity="0.15"/>
      <stop offset="50%" stop-color="${skyColors.milkyWayColor}" stop-opacity="0.25"/>
      <stop offset="70%" stop-color="${skyColors.milkyWayColor}" stop-opacity="0.15"/>
      <stop offset="100%" stop-color="${skyColors.milkyWayColor}" stop-opacity="0"/>
    </linearGradient>

    <!-- 하늘 클립 -->
    <clipPath id="skyClip">
      <rect x="8" y="0" width="${SVG_WIDTH - 16}" height="${SKY_HEIGHT}" rx="8"/>
    </clipPath>

    <!-- 연결선 그라데이션 -->
    <linearGradient id="connLine" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${skyColors.starGlow}" stop-opacity="0.1"/>
      <stop offset="50%" stop-color="${skyColors.starGlow}" stop-opacity="0.35"/>
      <stop offset="100%" stop-color="${skyColors.starGlow}" stop-opacity="0.1"/>
    </linearGradient>
  </defs>`;
}

// ═══════════════════════════════════════════
// 💫 Styles (애니메이션)
// ═══════════════════════════════════════════

function buildStyles(skyColors: SkyThemeColors): string {
  return `<style>
    .cst-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .cst-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .cst-name { font-size: 8px; font-weight: 600; letter-spacing: 0.5px; }
    .cst-label { font-size: 7px; font-weight: 400; }
    .cst-footer { font-size: 9px; font-weight: 500; }
    .cst-footer-val { font-size: 10px; font-weight: 700; }
    .cst-small { font-size: 7px; }

    @keyframes cst-twinkle {
      0%, 100% { opacity: 0.4; }
      50% { opacity: 1; }
    }

    @keyframes cst-twinkle-slow {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 0.9; }
    }

    @keyframes cst-meteor {
      0% { opacity: 0; transform: translate(0, 0); }
      10% { opacity: 1; }
      80% { opacity: 0.8; }
      100% { opacity: 0; transform: translate(120px, 80px); }
    }

    @keyframes cst-nebula-pulse {
      0%, 100% { opacity: 0.12; transform: scale(1); }
      50% { opacity: 0.2; transform: scale(1.05); }
    }

    @keyframes cst-fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    .cst-bg-star { animation: cst-twinkle 3s ease-in-out infinite; }
    .cst-bg-star-slow { animation: cst-twinkle-slow 5s ease-in-out infinite; }
    .cst-constellation { animation: cst-fadeIn 1s ease-out forwards; opacity: 0; }
    .cst-meteor-anim { animation: cst-meteor 3s ease-out infinite; }
    .cst-nebula-anim { animation: cst-nebula-pulse 6s ease-in-out infinite; }
  </style>`;
}

// ═══════════════════════════════════════════
// 🌃 하늘 배경
// ═══════════════════════════════════════════

function renderSkyBackground(skyColors: SkyThemeColors, sky: SkyBackground): string {
  return `<rect x="0" y="0" width="${SVG_WIDTH}" height="${SKY_HEIGHT}" fill="url(#skyBg)"/>`;
}

// ═══════════════════════════════════════════
// 🌌 은하수
// ═══════════════════════════════════════════

function renderMilkyWay(skyColors: SkyThemeColors): string {
  // 대각선으로 흐르는 은하수 밴드
  const w = SVG_WIDTH;
  const h = SKY_HEIGHT;

  return `<g opacity="0.6">
    <!-- 은하수 메인 밴드 -->
    <path d="M${-w * 0.1},${h * 0.3} Q${w * 0.3},${h * 0.15} ${w * 0.5},${h * 0.4}
             Q${w * 0.7},${h * 0.65} ${w * 1.1},${h * 0.5}"
          fill="none" stroke="url(#milkyWay)" stroke-width="80" opacity="0.3"/>
    <!-- 은하수 코어 -->
    <path d="M${-w * 0.1},${h * 0.3} Q${w * 0.3},${h * 0.15} ${w * 0.5},${h * 0.4}
             Q${w * 0.7},${h * 0.65} ${w * 1.1},${h * 0.5}"
          fill="none" stroke="${skyColors.milkyWayColor}" stroke-width="30" opacity="0.15"/>
    <!-- 은하수 내 미세 별 -->
    ${generateMilkyWayDust(40, skyColors)}
  </g>`;
}

function generateMilkyWayDust(count: number, skyColors: SkyThemeColors): string {
  const w = SVG_WIDTH;
  const h = SKY_HEIGHT;
  let dust = '';

  for (let i = 0; i < count; i++) {
    // 은하수 밴드를 따라 분포
    const t = i / count;
    const baseX = t * w;
    const baseY = h * 0.3 + Math.sin(t * Math.PI) * h * 0.15;
    const offsetX = ((i * 137 + 41) % 80) - 40;
    const offsetY = ((i * 211 + 73) % 60) - 30;
    const size = 0.3 + ((i * 89) % 100) / 200;
    const opacity = 0.2 + ((i * 67) % 100) / 200;

    dust += `<circle cx="${(baseX + offsetX).toFixed(1)}" cy="${(baseY + offsetY).toFixed(1)}"
             r="${size.toFixed(2)}" fill="${skyColors.starGlow}" opacity="${opacity.toFixed(2)}"/>`;
  }
  return dust;
}

// ═══════════════════════════════════════════
// ✨ 배경 별 (장식용)
// ═══════════════════════════════════════════

function renderBackgroundStars(): string {
  const w = SVG_WIDTH;
  const h = SKY_HEIGHT;
  let stars = '';

  // 작은 별 60개
  for (let i = 0; i < 60; i++) {
    const x = ((i * 167 + 43) % w);
    const y = ((i * 239 + 71) % h);
    const size = 0.3 + ((i * 53) % 100) / 150;
    const opacity = 0.3 + ((i * 89) % 100) / 200;
    const delay = ((i * 131) % 30) / 10;
    const animClass = i % 3 === 0 ? 'cst-bg-star' : 'cst-bg-star-slow';

    stars += `<circle cx="${x}" cy="${y}" r="${size.toFixed(2)}"
              fill="#ffffff" opacity="${opacity.toFixed(2)}"
              class="${animClass}" style="animation-delay: ${delay.toFixed(1)}s"/>`;
  }

  return `<g>${stars}</g>`;
}

// ═══════════════════════════════════════════
// 🌟 별자리 렌더링
// ═══════════════════════════════════════════

function renderConstellations(
  constellations: Constellation[],
  skyColors: SkyThemeColors
): string {
  return constellations.map((c, i) => {
    const delay = (i * 0.2).toFixed(2);
    return renderSingleConstellation(c, i, delay, skyColors);
  }).join('\n');
}

function renderSingleConstellation(
  constellation: Constellation,
  index: number,
  delay: string,
  skyColors: SkyThemeColors
): string {
  const { cx, cy, radius, stars, connections, isDormant } = constellation;
  const w = SVG_WIDTH;
  const h = SKY_HEIGHT;

  // 별자리 중심의 픽셀 좌표
  const centerX = cx * w;
  const centerY = cy * h;
  const r = radius * Math.min(w, h);

  // 비활성 레포: 적색왜성 (어둡고 붉은 색)
  const dormantTint = isDormant ? 0.4 : 1;
  const dormantColor = isDormant ? '#cc4444' : '';

  // 연결선 렌더링
  const linesStr = connections.map(([from, to]) => {
    const s1 = stars[from];
    const s2 = stars[to];
    if (!s1 || !s2) return '';
    const x1 = centerX + (s1.x - 0.5) * r * 2;
    const y1 = centerY + (s1.y - 0.5) * r * 2;
    const x2 = centerX + (s2.x - 0.5) * r * 2;
    const y2 = centerY + (s2.y - 0.5) * r * 2;

    return `<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
                  x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
                  stroke="${dormantColor || skyColors.starGlow}"
                  stroke-width="0.6" opacity="${(0.25 * dormantTint).toFixed(2)}"
                  stroke-linecap="round"/>`;
  }).join('\n    ');

  // 별 렌더링
  const starsStr = stars.map((star, si) => {
    const sx = centerX + (star.x - 0.5) * r * 2;
    const sy = centerY + (star.y - 0.5) * r * 2;
    const starSize = star.size * (isDormant ? 0.7 : 1);
    const color = dormantColor || star.color;
    const opacity = star.brightness * dormantTint;
    const twinkleDelay = (si * 0.7 + index * 1.3).toFixed(1);

    // 큰 별은 글로우 효과
    const filter = starSize >= 3 ? 'filter="url(#starBlur)"' : '';

    return `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}"
                    r="${starSize.toFixed(1)}" fill="${color}"
                    opacity="${opacity.toFixed(2)}" ${filter}
                    class="cst-bg-star-slow" style="animation-delay: ${twinkleDelay}s"/>
            ${starSize >= 3 ? `<circle cx="${sx.toFixed(1)}" cy="${sy.toFixed(1)}"
                    r="${(starSize * 2.5).toFixed(1)}" fill="${color}"
                    opacity="${(opacity * 0.15).toFixed(3)}"/>` : ''}`;
  }).join('\n    ');

  // 별자리 이름 레이블
  const labelY = centerY + r + 12;
  const icon = getRepoTypeIcon(constellation.repoType);
  const displayName = constellation.constellationName.length > 20
    ? constellation.constellationName.substring(0, 20) + '…'
    : constellation.constellationName;

  // GitHub 스타 수 표시
  const starBadge = constellation.starCount > 0
    ? `<text x="${centerX.toFixed(1)}" y="${(labelY + 10).toFixed(1)}"
            text-anchor="middle" class="cst-text cst-label"
            fill="${skyColors.textSecondary}" opacity="0.5">
        ⭐ ${constellation.starCount}</text>`
    : '';

  return `<g class="cst-constellation" style="animation-delay: ${delay}s">
    <!-- 연결선 -->
    ${linesStr}
    <!-- 별 -->
    ${starsStr}
    <!-- 이름 -->
    <text x="${centerX.toFixed(1)}" y="${labelY.toFixed(1)}"
          text-anchor="middle" class="cst-text cst-name"
          fill="${skyColors.textColor}" opacity="${(0.7 * dormantTint).toFixed(2)}">
      ${icon} ${escapeXml(displayName)}</text>
    ${starBadge}
  </g>`;
}

// ═══════════════════════════════════════════
// ☄️ 유성 렌더링
// ═══════════════════════════════════════════

function renderMeteors(meteors: Meteor[], skyColors: SkyThemeColors): string {
  return meteors.map((m, i) => {
    const x1 = m.x1 * SVG_WIDTH;
    const y1 = m.y1 * SKY_HEIGHT;
    const tailLen = 25 + m.brightness * 35;
    const angle = Math.atan2(m.y2 - m.y1, m.x2 - m.x1);

    const x2 = x1 - Math.cos(angle) * tailLen;
    const y2 = y1 - Math.sin(angle) * tailLen;

    const totalDelay = m.delay.toFixed(1);

    return `<g class="cst-meteor-anim" style="animation-delay: ${totalDelay}s; transform-origin: ${x1.toFixed(0)}px ${y1.toFixed(0)}px;">
      <!-- 유성 꼬리 -->
      <line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}"
            x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"
            stroke="${skyColors.meteorColor}" stroke-width="1.5"
            opacity="${(m.brightness * 0.6).toFixed(2)}"
            stroke-linecap="round" filter="url(#meteorGlow)"/>
      <!-- 유성 헤드 -->
      <circle cx="${x1.toFixed(1)}" cy="${y1.toFixed(1)}" r="2"
              fill="${skyColors.meteorColor}" opacity="${m.brightness.toFixed(2)}"
              filter="url(#strongGlow)"/>
    </g>`;
  }).join('\n');
}

// ═══════════════════════════════════════════
// ✦ 성운 렌더링
// ═══════════════════════════════════════════

function renderNebulas(nebulas: Nebula[], skyColors: SkyThemeColors): string {
  return nebulas.map((n, i) => {
    const x = n.x * SVG_WIDTH;
    const y = n.y * SKY_HEIGHT;
    const size = n.size * Math.min(SVG_WIDTH, SKY_HEIGHT);
    const delay = (i * 2).toFixed(1);

    return `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}"
                    r="${size.toFixed(1)}" fill="${n.color}"
                    opacity="${n.opacity.toFixed(3)}"
                    filter="url(#nebulaBlur)"
                    class="cst-nebula-anim"
                    style="animation-delay: ${delay}s;
                           transform-origin: ${x.toFixed(0)}px ${y.toFixed(0)}px"/>`;
  }).join('\n');
}

// ═══════════════════════════════════════════
// 📊 헤더 & 푸터
// ═══════════════════════════════════════════

function renderHeader(username: string, skyColors: SkyThemeColors): string {
  return `<g>
    <text x="${SVG_WIDTH / 2}" y="26" text-anchor="middle"
          class="cst-text cst-title" fill="${skyColors.textColor}">
      🌌 ${escapeXml(username)}&apos;s Commit Constellation</text>
  </g>`;
}

function renderFooter(stats: ConstellationStats, skyColors: SkyThemeColors): string {
  const y = SVG_HEIGHT - FOOTER_HEIGHT;

  const items = [
    { icon: '⭐', label: 'Stars', value: stats.totalStars.toString() },
    { icon: '🌟', label: 'Constellations', value: stats.totalConstellations.toString() },
    { icon: '☄️', label: 'Meteors', value: stats.totalMeteors.toString() },
    { icon: '✦', label: 'Nebulas', value: stats.totalNebulas.toString() },
    { icon: '💻', label: 'Commits', value: stats.totalCommits.toString() },
    { icon: '⭐', label: 'GitHub Stars', value: stats.totalGitHubStars.toString() },
  ];

  const spacing = SVG_WIDTH / items.length;

  const itemsStr = items.map((item, i) => {
    const x = spacing / 2 + i * spacing;
    return `
    <text x="${x.toFixed(0)}" y="${y + 18}" text-anchor="middle"
          class="cst-text cst-footer" fill="${skyColors.textSecondary}">
      ${item.icon} ${item.label}</text>
    <text x="${x.toFixed(0)}" y="${y + 32}" text-anchor="middle"
          class="cst-text cst-footer-val" fill="${skyColors.textColor}">
      ${item.value}</text>`;
  }).join('');

  return `<g>
    <!-- 구분선 -->
    <line x1="16" y1="${y + 2}" x2="${SVG_WIDTH - 16}" y2="${y + 2}"
          stroke="${skyColors.borderColor}" stroke-width="0.5" opacity="0.5"/>
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
