// ═══════════════════════════════════════════
// 📜 Chronicle Renderer - 연대기 SVG 렌더링
// ═══════════════════════════════════════════
//
// 4가지 연대기 시각화 스타일을 지원합니다:
//   - rpg: RPG 퀘스트 로그 (기본)
//   - book: 책/챕터 스타일
//   - timeline: 깔끔한 타임라인
//   - comic: 만화 패널 스타일

import { ThemeColors, ChronicleConfig } from '../../types';
import {
  ChronicleProfile,
  ChronicleChapter,
  ActiveQuest,
  ChronicleSummary,
  getRankColor,
  formatDate,
  getChapterTitleKo,
  getChapterSubtitleKo,
  ChapterRank,
} from './chronicle-analyzer';

const SVG_WIDTH = 520;
const CHAPTER_HEIGHT = 68;
const HEADER_HEIGHT = 100;
const QUEST_HEIGHT = 60;
const FOOTER_HEIGHT = 50;
const PADDING = 16;

export interface ChronicleRenderData {
  username: string;
  profile: ChronicleProfile;
  config: ChronicleConfig;
  theme: ThemeColors;
}

/**
 * Chronicle SVG를 렌더링합니다.
 */
export function renderChronicle(data: ChronicleRenderData): string {
  const style = data.config.style || 'rpg';

  switch (style) {
    case 'book':
      return renderBookStyle(data);
    case 'timeline':
      return renderTimelineStyle(data);
    case 'comic':
      return renderComicStyle(data);
    case 'rpg':
    default:
      return renderRPGStyle(data);
  }
}

// ═══════════════════════════════════════════
// ⚔️ RPG STYLE - 퀘스트 로그 스타일 (기본)
// ═══════════════════════════════════════════

function renderRPGStyle(data: ChronicleRenderData): string {
  const { username, profile, config, theme } = data;
  const lang = config.language || 'ko';
  const chapters = profile.chapters;

  const bodyHeight = chapters.length * CHAPTER_HEIGHT;
  const questHeight = profile.activeQuest ? QUEST_HEIGHT : 0;
  const totalHeight = HEADER_HEIGHT + bodyHeight + questHeight + FOOTER_HEIGHT + PADDING;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${totalHeight}" viewBox="0 0 ${SVG_WIDTH} ${totalHeight}">
  <defs>
    <linearGradient id="chrBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <linearGradient id="chrAccent" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0.4"/>
    </linearGradient>
    <filter id="chrGlow">
      <feGaussianBlur stdDeviation="3" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="chrShadow">
      <feDropShadow dx="0" dy="1" stdDeviation="2" flood-color="#000" flood-opacity="0.3"/>
    </filter>
    ${generateRankGradients(theme)}
  </defs>

  <style>
    .chr-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .chr-title { font-size: 15px; font-weight: 700; letter-spacing: 2px; }
    .chr-subtitle { font-size: 11px; font-weight: 500; }
    .chr-chapter-title { font-size: 12px; font-weight: 700; }
    .chr-chapter-sub { font-size: 10px; font-weight: 500; }
    .chr-date { font-size: 9px; font-weight: 400; }
    .chr-desc { font-size: 9px; }
    .chr-rank { font-size: 11px; font-weight: 800; letter-spacing: 1px; }
    .chr-label { font-size: 9px; font-weight: 600; letter-spacing: 1px; }
    .chr-value { font-size: 10px; font-weight: 700; }
    .chr-small { font-size: 8px; }

    @keyframes chr-fadeIn {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }
    @keyframes chr-pulse {
      0%, 100% { opacity: 0.6; }
      50% { opacity: 1; }
    }
    @keyframes chr-glow {
      0%, 100% { filter: brightness(1); }
      50% { filter: brightness(1.3); }
    }
    .chr-chapter { animation: chr-fadeIn 0.5s ease-out forwards; opacity: 0; }
    .chr-quest-pulse { animation: chr-pulse 2s ease-in-out infinite; }
    .chr-rank-glow { animation: chr-glow 3s ease-in-out infinite; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="16" fill="url(#chrBg)"/>

  <!-- 장식: 좌측 세로선 (퀘스트 로그 느낌) -->
  <line x1="50" y1="${HEADER_HEIGHT}" x2="50" y2="${HEADER_HEIGHT + bodyHeight}"
        stroke="url(#chrAccent)" stroke-width="2" stroke-dasharray="4 4" opacity="0.5"/>

  <!-- 헤더 -->
  ${renderRPGHeader(username, profile, theme, lang)}

  <!-- 챕터 목록 -->
  ${chapters.map((ch, i) => renderRPGChapter(ch, i, HEADER_HEIGHT + i * CHAPTER_HEIGHT, theme, lang)).join('\n')}

  <!-- 활성 퀘스트 -->
  ${profile.activeQuest ? renderRPGQuest(profile.activeQuest, HEADER_HEIGHT + bodyHeight + 8, theme, lang) : ''}

  <!-- 푸터 -->
  ${renderRPGFooter(profile.summary, totalHeight - FOOTER_HEIGHT + 8, theme, lang)}

  <!-- 외곽 테두리 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${totalHeight - 4}" rx="15"
        fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.2"/>
</svg>`;
}

function renderRPGHeader(
  username: string,
  profile: ChronicleProfile,
  theme: ThemeColors,
  lang: string
): string {
  const titleText = lang === 'ko' ? '📜 개발자 연대기' : '📜 DEV CHRONICLE';
  const levelLabel = `Lv.${profile.devLevel}`;
  const expLabel = `EXP ${profile.totalExp}`;

  return `
  <text x="${SVG_WIDTH / 2}" y="30" text-anchor="middle" class="chr-text chr-title" fill="${theme.accent}">
    ${titleText}</text>
  <text x="${SVG_WIDTH / 2}" y="48" text-anchor="middle" class="chr-text chr-subtitle" fill="${theme.text}">
    ${escapeXml(username)} — ${escapeXml(profile.devTitle)}</text>

  <!-- 레벨 & EXP 뱃지 -->
  <rect x="16" y="60" width="60" height="22" rx="11" fill="${theme.accent}" opacity="0.15"/>
  <text x="46" y="75" text-anchor="middle" class="chr-text chr-label" fill="${theme.accent}">
    ${levelLabel}</text>

  <rect x="84" y="60" width="80" height="22" rx="11" fill="${theme.accentSecondary}" opacity="0.15"/>
  <text x="124" y="75" text-anchor="middle" class="chr-text chr-small" fill="${theme.accentSecondary}">
    ${expLabel}</text>

  <!-- 챕터 수 -->
  <text x="${SVG_WIDTH - 20}" y="75" text-anchor="end" class="chr-text chr-date" fill="${theme.textSecondary}">
    ${profile.summary.totalChapters} ${lang === 'ko' ? '챕터' : 'chapters'} · ${profile.summary.journeyDays} ${lang === 'ko' ? '일' : 'days'}</text>

  <!-- 구분선 -->
  <line x1="16" y1="90" x2="${SVG_WIDTH - 16}" y2="90"
        stroke="${theme.border}" stroke-width="1" opacity="0.5"/>`;
}

function renderRPGChapter(
  chapter: ChronicleChapter,
  index: number,
  y: number,
  theme: ThemeColors,
  lang: string
): string {
  const rankColor = getRankColor(chapter.rank);
  const title = lang === 'ko' ? getChapterTitleKo(chapter) : chapter.title;
  const subtitle = lang === 'ko' ? getChapterSubtitleKo(chapter) : chapter.subtitle;
  const desc = lang === 'ko' ? chapter.descriptionKo : chapter.descriptionEn;
  const dateStr = formatDate(chapter.date, lang as 'ko' | 'en');
  const delay = (index * 0.15).toFixed(2);

  return `
  <g class="chr-chapter" style="animation-delay: ${delay}s">
    <!-- 타임라인 노드 -->
    <circle cx="50" cy="${y + 28}" r="8" fill="${theme.backgroundSecondary}"
            stroke="${rankColor}" stroke-width="2"/>
    <text x="50" y="${y + 32}" text-anchor="middle" font-size="10">${chapter.icon}</text>

    <!-- 랭크 뱃지 -->
    <rect x="16" y="${y + 12}" width="20" height="16" rx="4" fill="${rankColor}" opacity="0.15"/>
    <text x="26" y="${y + 24}" text-anchor="middle" class="chr-text chr-rank chr-rank-glow" fill="${rankColor}">
      ${chapter.rank}</text>

    <!-- 챕터 내용 -->
    <text x="70" y="${y + 22}" class="chr-text chr-chapter-title" fill="${theme.text}">
      Ch.${chapter.number} ${escapeXml(title)}</text>
    <text x="70" y="${y + 37}" class="chr-text chr-chapter-sub" fill="${theme.textSecondary}">
      ${escapeXml(truncateText(subtitle, 50))}</text>
    <text x="70" y="${y + 52}" class="chr-text chr-desc" fill="${theme.textSecondary}" opacity="0.7">
      ${escapeXml(truncateText(desc, 55))}</text>

    <!-- 날짜 -->
    <text x="${SVG_WIDTH - 20}" y="${y + 22}" text-anchor="end" class="chr-text chr-date" fill="${theme.textSecondary}">
      ${dateStr}</text>

    <!-- 구분선 -->
    <line x1="70" y1="${y + CHAPTER_HEIGHT - 4}" x2="${SVG_WIDTH - 20}" y2="${y + CHAPTER_HEIGHT - 4}"
          stroke="${theme.border}" stroke-width="0.5" opacity="0.3"/>
  </g>`;
}

function renderRPGQuest(
  quest: ActiveQuest,
  y: number,
  theme: ThemeColors,
  lang: string
): string {
  const label = lang === 'ko' ? '🎯 진행 중인 퀘스트' : '🎯 ACTIVE QUEST';
  const progressWidth = Math.max(0, Math.min(300, quest.progress * 3));

  return `
  <!-- 퀘스트 영역 -->
  <rect x="16" y="${y}" width="${SVG_WIDTH - 32}" height="48" rx="8"
        fill="${theme.accent}" opacity="0.06"/>

  <text x="26" y="${y + 16}" class="chr-text chr-label" fill="${theme.accent}">
    ${label}</text>

  <text x="26" y="${y + 32}" class="chr-text chr-chapter-sub" fill="${theme.text}">
    ${quest.icon} ${escapeXml(quest.name)} — ${escapeXml(quest.target)}</text>

  <!-- 프로그레스 바 -->
  <rect x="26" y="${y + 38}" width="300" height="4" rx="2" fill="${theme.border}" opacity="0.3"/>
  <rect x="26" y="${y + 38}" width="${progressWidth}" height="4" rx="2"
        fill="${theme.accent}" class="chr-quest-pulse"/>
  <text x="332" y="${y + 43}" class="chr-text chr-small" fill="${theme.textSecondary}">
    ${quest.progress}%</text>`;
}

function renderRPGFooter(
  summary: ChronicleSummary,
  y: number,
  theme: ThemeColors,
  lang: string
): string {
  const stats = lang === 'ko'
    ? [
        `💻 ${summary.totalCommits} 커밋`,
        `📦 ${summary.reposCreated} 레포`,
        `🌍 ${summary.languagesLearned} 언어`,
        `⭐ ${summary.totalStars} 스타`,
      ]
    : [
        `💻 ${summary.totalCommits} commits`,
        `📦 ${summary.reposCreated} repos`,
        `🌍 ${summary.languagesLearned} langs`,
        `⭐ ${summary.totalStars} stars`,
      ];

  const spacing = (SVG_WIDTH - 40) / stats.length;

  return `
  <line x1="16" y1="${y}" x2="${SVG_WIDTH - 16}" y2="${y}"
        stroke="${theme.border}" stroke-width="1" opacity="0.3"/>
  ${stats.map((stat, i) => `
  <text x="${20 + i * spacing + spacing / 2}" y="${y + 22}" text-anchor="middle"
        class="chr-text chr-small" fill="${theme.textSecondary}">${stat}</text>`).join('')}

  <text x="${SVG_WIDTH / 2}" y="${y + 38}" text-anchor="middle"
        class="chr-text chr-small" fill="${theme.textSecondary}" opacity="0.5">
    ${summary.firstEventDate} ~ ${summary.latestEventDate}</text>`;
}

// ═══════════════════════════════════════════
// 📖 BOOK STYLE - 책/챕터 스타일
// ═══════════════════════════════════════════

function renderBookStyle(data: ChronicleRenderData): string {
  const { username, profile, config, theme } = data;
  const lang = config.language || 'ko';
  const chapters = profile.chapters;

  const bodyHeight = chapters.length * 56;
  const questHeight = profile.activeQuest ? QUEST_HEIGHT : 0;
  const totalHeight = 110 + bodyHeight + questHeight + FOOTER_HEIGHT + PADDING;

  // 책 느낌의 따뜻한 톤
  const paperBg = theme.name === 'dark' ? '#1c1a17' : '#faf6f0';
  const inkColor = theme.name === 'dark' ? '#d4c5a9' : '#3c3028';
  const accentInk = theme.name === 'dark' ? '#c9a96e' : '#8b6914';

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${totalHeight}" viewBox="0 0 ${SVG_WIDTH} ${totalHeight}">
  <defs>
    <linearGradient id="bookBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <filter id="bookShadow">
      <feDropShadow dx="1" dy="1" stdDeviation="1" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <style>
    .chr-text { font-family: 'Georgia', 'Noto Serif KR', serif; }
    .book-title { font-size: 16px; font-weight: 700; letter-spacing: 3px; font-style: italic; }
    .book-author { font-size: 11px; font-weight: 400; font-style: italic; }
    .book-chapter { font-size: 11px; font-weight: 700; }
    .book-content { font-size: 9.5px; font-weight: 400; }
    .book-date { font-size: 8px; font-style: italic; }
    .book-page { font-size: 8px; font-style: italic; }
    .book-small { font-size: 8px; }

    @keyframes book-write {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    .book-entry { animation: book-write 0.6s ease-out forwards; opacity: 0; }
  </style>

  <!-- 배경 (종이 느낌) -->
  <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="12" fill="url(#bookBg)"/>

  <!-- 상단 장식 라인 -->
  <line x1="40" y1="14" x2="${SVG_WIDTH - 40}" y2="14" stroke="${accentInk}" stroke-width="1.5" opacity="0.3"/>
  <line x1="40" y1="18" x2="${SVG_WIDTH - 40}" y2="18" stroke="${accentInk}" stroke-width="0.5" opacity="0.3"/>

  <!-- 제목 -->
  <text x="${SVG_WIDTH / 2}" y="42" text-anchor="middle" class="chr-text book-title" fill="${theme.accent}">
    ${lang === 'ko' ? '📜 개발자 연대기' : '📜 Dev Chronicle'}</text>
  <text x="${SVG_WIDTH / 2}" y="60" text-anchor="middle" class="chr-text book-author" fill="${theme.textSecondary}">
    — ${escapeXml(username)} —</text>
  <text x="${SVG_WIDTH / 2}" y="76" text-anchor="middle" class="chr-text book-small" fill="${theme.textSecondary}" opacity="0.6">
    ${escapeXml(profile.devTitle)} · Lv.${profile.devLevel}</text>

  <!-- 구분선 (장식) -->
  <line x1="60" y1="88" x2="${SVG_WIDTH - 60}" y2="88" stroke="${theme.border}" stroke-width="0.5" opacity="0.5"/>
  <text x="${SVG_WIDTH / 2}" y="92" text-anchor="middle" font-size="8" fill="${theme.textSecondary}" opacity="0.4">✦</text>

  <!-- 챕터 목록 -->
  ${chapters.map((ch, i) => {
    const cy = 110 + i * 56;
    const title = lang === 'ko' ? getChapterTitleKo(ch) : ch.title;
    const desc = lang === 'ko' ? ch.descriptionKo : ch.descriptionEn;
    const dateStr = formatDate(ch.date, lang as 'ko' | 'en');
    const delay = (i * 0.12).toFixed(2);
    const rankColor = getRankColor(ch.rank);

    return `
  <g class="book-entry" style="animation-delay: ${delay}s">
    <text x="30" y="${cy + 14}" class="chr-text book-chapter" fill="${theme.text}">
      ${ch.icon} Chapter ${ch.number}: ${escapeXml(title)}</text>
    <text x="30" y="${cy + 30}" class="chr-text book-content" fill="${theme.textSecondary}">
      ${escapeXml(truncateText(desc, 65))}</text>
    <text x="${SVG_WIDTH - 30}" y="${cy + 14}" text-anchor="end" class="chr-text book-date" fill="${theme.textSecondary}">
      ${dateStr}</text>
    <circle cx="${SVG_WIDTH - 30}" cy="${cy + 28}" r="3" fill="${rankColor}" opacity="0.5"/>
    <line x1="30" y1="${cy + 42}" x2="${SVG_WIDTH - 30}" y2="${cy + 42}"
          stroke="${theme.border}" stroke-width="0.3" opacity="0.3" stroke-dasharray="2 3"/>
  </g>`;
  }).join('\n')}

  <!-- 활성 퀘스트 -->
  ${profile.activeQuest ? renderRPGQuest(profile.activeQuest, 110 + chapters.length * 56 + 8, theme, lang) : ''}

  <!-- 푸터 -->
  ${renderRPGFooter(profile.summary, totalHeight - FOOTER_HEIGHT + 8, theme, lang)}

  <!-- 하단 장식 라인 -->
  <line x1="40" y1="${totalHeight - 14}" x2="${SVG_WIDTH - 40}" y2="${totalHeight - 14}"
        stroke="${theme.border}" stroke-width="0.5" opacity="0.3"/>

  <!-- 외곽 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${totalHeight - 4}" rx="11"
        fill="none" stroke="${theme.border}" stroke-width="1" opacity="0.2"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 📊 TIMELINE STYLE - 깔끔한 타임라인
// ═══════════════════════════════════════════

function renderTimelineStyle(data: ChronicleRenderData): string {
  const { username, profile, config, theme } = data;
  const lang = config.language || 'ko';
  const chapters = profile.chapters;

  const itemHeight = 72;
  const bodyHeight = chapters.length * itemHeight;
  const questHeight = profile.activeQuest ? QUEST_HEIGHT : 0;
  const totalHeight = 90 + bodyHeight + questHeight + FOOTER_HEIGHT + PADDING;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${totalHeight}" viewBox="0 0 ${SVG_WIDTH} ${totalHeight}">
  <defs>
    <linearGradient id="tlBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <linearGradient id="tlLine" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${theme.accent}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${theme.accentSecondary}" stop-opacity="0.2"/>
    </linearGradient>
    <filter id="tlGlow">
      <feGaussianBlur stdDeviation="2" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <style>
    .chr-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .tl-title { font-size: 14px; font-weight: 700; letter-spacing: 2px; }
    .tl-sub { font-size: 10px; font-weight: 500; }
    .tl-event { font-size: 11px; font-weight: 700; }
    .tl-desc { font-size: 9px; font-weight: 400; }
    .tl-date { font-size: 9px; font-weight: 600; }
    .tl-small { font-size: 8px; }

    @keyframes tl-appear {
      from { opacity: 0; transform: translateX(-10px); }
      to { opacity: 1; transform: translateX(0); }
    }
    @keyframes tl-dot-pulse {
      0%, 100% { r: 5; }
      50% { r: 7; }
    }
    .tl-item { animation: tl-appear 0.4s ease-out forwards; opacity: 0; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="16" fill="url(#tlBg)"/>

  <!-- 헤더 -->
  <text x="${SVG_WIDTH / 2}" y="30" text-anchor="middle" class="chr-text tl-title" fill="${theme.accent}">
    📜 ${lang === 'ko' ? '개발자 연대기' : 'DEV CHRONICLE'}</text>
  <text x="${SVG_WIDTH / 2}" y="48" text-anchor="middle" class="chr-text tl-sub" fill="${theme.text}">
    ${escapeXml(username)} · ${escapeXml(profile.devTitle)}</text>
  <text x="${SVG_WIDTH / 2}" y="64" text-anchor="middle" class="chr-text tl-small" fill="${theme.textSecondary}">
    Lv.${profile.devLevel} · EXP ${profile.totalExp}</text>

  <!-- 타임라인 메인 세로선 -->
  <line x1="80" y1="80" x2="80" y2="${80 + bodyHeight}"
        stroke="url(#tlLine)" stroke-width="3" stroke-linecap="round"/>

  <!-- 타임라인 아이템 -->
  ${chapters.map((ch, i) => {
    const cy = 90 + i * itemHeight;
    const title = lang === 'ko' ? getChapterTitleKo(ch) : ch.title;
    const subtitle = lang === 'ko' ? getChapterSubtitleKo(ch) : ch.subtitle;
    const dateStr = formatDate(ch.date, lang as 'ko' | 'en');
    const delay = (i * 0.1).toFixed(2);
    const rankColor = getRankColor(ch.rank);
    const isLeft = i % 2 === 0;

    return `
  <g class="tl-item" style="animation-delay: ${delay}s">
    <!-- 노드 -->
    <circle cx="80" cy="${cy + 16}" r="6" fill="${theme.backgroundSecondary}"
            stroke="${rankColor}" stroke-width="2.5" filter="url(#tlGlow)"/>
    <text x="80" y="${cy + 20}" text-anchor="middle" font-size="7">${ch.icon}</text>

    <!-- 커넥터 라인 -->
    <line x1="90" y1="${cy + 16}" x2="105" y2="${cy + 16}"
          stroke="${rankColor}" stroke-width="1" opacity="0.5"/>

    <!-- 콘텐츠 카드 -->
    <rect x="108" y="${cy}" width="${SVG_WIDTH - 130}" height="56" rx="8"
          fill="${theme.backgroundSecondary}" opacity="0.5" stroke="${rankColor}" stroke-width="0.5" stroke-opacity="0.3"/>

    <!-- 랭크 뱃지 -->
    <rect x="114" y="${cy + 4}" width="18" height="14" rx="3" fill="${rankColor}" opacity="0.15"/>
    <text x="123" y="${cy + 14}" text-anchor="middle" class="chr-text" font-size="9" font-weight="800" fill="${rankColor}">
      ${ch.rank}</text>

    <!-- 제목 -->
    <text x="138" y="${cy + 15}" class="chr-text tl-event" fill="${theme.text}">
      ${escapeXml(title)}</text>

    <!-- 날짜 -->
    <text x="${SVG_WIDTH - 28}" y="${cy + 15}" text-anchor="end" class="chr-text tl-date" fill="${theme.textSecondary}">
      ${dateStr}</text>

    <!-- 설명 -->
    <text x="114" y="${cy + 32}" class="chr-text tl-desc" fill="${theme.textSecondary}">
      ${escapeXml(truncateText(subtitle, 55))}</text>

    <!-- 날짜 (좌측) -->
    <text x="70" y="${cy + 20}" text-anchor="end" class="chr-text tl-small" fill="${theme.textSecondary}" opacity="0.6">
      ${ch.number}</text>
  </g>`;
  }).join('\n')}

  <!-- 활성 퀘스트 -->
  ${profile.activeQuest ? renderRPGQuest(profile.activeQuest, 90 + bodyHeight + 8, theme, lang) : ''}

  <!-- 푸터 -->
  ${renderRPGFooter(profile.summary, totalHeight - FOOTER_HEIGHT + 8, theme, lang)}

  <!-- 외곽 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${totalHeight - 4}" rx="15"
        fill="none" stroke="${theme.accent}" stroke-width="1" opacity="0.15"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 💥 COMIC STYLE - 만화 패널 스타일
// ═══════════════════════════════════════════

function renderComicStyle(data: ChronicleRenderData): string {
  const { username, profile, config, theme } = data;
  const lang = config.language || 'ko';
  const chapters = profile.chapters;

  const panelHeight = 80;
  const cols = 2;
  const rows = Math.ceil(chapters.length / cols);
  const bodyHeight = rows * panelHeight + (rows - 1) * 8;
  const questHeight = profile.activeQuest ? QUEST_HEIGHT : 0;
  const totalHeight = 90 + bodyHeight + questHeight + FOOTER_HEIGHT + PADDING + 16;
  const panelWidth = (SVG_WIDTH - 48) / cols - 4;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${SVG_WIDTH}" height="${totalHeight}" viewBox="0 0 ${SVG_WIDTH} ${totalHeight}">
  <defs>
    <linearGradient id="comicBg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${theme.cardGradientStart}"/>
      <stop offset="100%" stop-color="${theme.cardGradientEnd}"/>
    </linearGradient>
    <filter id="comicShadow">
      <feDropShadow dx="2" dy="2" stdDeviation="0" flood-color="#000" flood-opacity="0.15"/>
    </filter>
  </defs>

  <style>
    .chr-text { font-family: 'Segoe UI', 'Noto Sans KR', sans-serif; }
    .comic-title { font-size: 15px; font-weight: 800; letter-spacing: 2px; }
    .comic-panel-title { font-size: 10px; font-weight: 800; }
    .comic-panel-text { font-size: 8px; font-weight: 500; }
    .comic-panel-date { font-size: 7px; font-weight: 400; }
    .comic-rank { font-size: 10px; font-weight: 900; }
    .comic-small { font-size: 8px; }

    @keyframes comic-pop {
      0% { transform: scale(0.8); opacity: 0; }
      60% { transform: scale(1.05); }
      100% { transform: scale(1); opacity: 1; }
    }
    .comic-panel { animation: comic-pop 0.3s ease-out forwards; opacity: 0; }
  </style>

  <!-- 배경 -->
  <rect width="${SVG_WIDTH}" height="${totalHeight}" rx="16" fill="url(#comicBg)"/>

  <!-- 헤더 -->
  <text x="${SVG_WIDTH / 2}" y="32" text-anchor="middle" class="chr-text comic-title" fill="${theme.accent}">
    📜 ${lang === 'ko' ? '개발자 연대기' : 'DEV CHRONICLE'}</text>
  <text x="${SVG_WIDTH / 2}" y="50" text-anchor="middle" class="chr-text comic-small" fill="${theme.text}">
    ${escapeXml(username)} · ${escapeXml(profile.devTitle)} · Lv.${profile.devLevel}</text>

  <!-- 구분선 -->
  <line x1="20" y1="62" x2="${SVG_WIDTH - 20}" y2="62"
        stroke="${theme.border}" stroke-width="1" opacity="0.3"/>

  <!-- 만화 패널 그리드 -->
  ${chapters.map((ch, i) => {
    const col = i % cols;
    const row = Math.floor(i / cols);
    const px = 20 + col * (panelWidth + 8);
    const py = 74 + row * (panelHeight + 8);
    const title = lang === 'ko' ? getChapterTitleKo(ch) : ch.title;
    const desc = lang === 'ko' ? ch.descriptionKo : ch.descriptionEn;
    const dateStr = formatDate(ch.date, lang as 'ko' | 'en');
    const rankColor = getRankColor(ch.rank);
    const delay = (i * 0.1).toFixed(2);

    return `
  <g class="comic-panel" style="animation-delay: ${delay}s">
    <!-- 패널 테두리 -->
    <rect x="${px}" y="${py}" width="${panelWidth}" height="${panelHeight}" rx="6"
          fill="${theme.backgroundSecondary}" stroke="${theme.border}" stroke-width="1.5"
          filter="url(#comicShadow)"/>

    <!-- 랭크 코너 뱃지 -->
    <rect x="${px}" y="${py}" width="22" height="16" rx="0"
          fill="${rankColor}" opacity="0.2"/>
    <text x="${px + 11}" y="${py + 12}" text-anchor="middle" class="chr-text comic-rank" fill="${rankColor}">
      ${ch.rank}</text>

    <!-- 아이콘 & 제목 -->
    <text x="${px + 28}" y="${py + 14}" class="chr-text comic-panel-title" fill="${theme.text}">
      ${ch.icon} ${escapeXml(truncateText(title, 22))}</text>

    <!-- 날짜 -->
    <text x="${px + panelWidth - 6}" y="${py + 14}" text-anchor="end" class="chr-text comic-panel-date" fill="${theme.textSecondary}">
      ${dateStr}</text>

    <!-- 설명 (2줄) -->
    <text x="${px + 8}" y="${py + 34}" class="chr-text comic-panel-text" fill="${theme.textSecondary}">
      ${escapeXml(truncateText(desc, 30))}</text>
    <text x="${px + 8}" y="${py + 48}" class="chr-text comic-panel-text" fill="${theme.textSecondary}">
      ${escapeXml(truncateText(desc.length > 30 ? desc.substring(30) : '', 30))}</text>

    <!-- 번호 -->
    <text x="${px + panelWidth - 6}" y="${py + panelHeight - 6}" text-anchor="end"
          class="chr-text comic-panel-date" fill="${theme.textSecondary}" opacity="0.4">
      #${ch.number}</text>
  </g>`;
  }).join('\n')}

  <!-- 활성 퀘스트 -->
  ${profile.activeQuest ? renderRPGQuest(profile.activeQuest, 74 + bodyHeight + 16, theme, lang) : ''}

  <!-- 푸터 -->
  ${renderRPGFooter(profile.summary, totalHeight - FOOTER_HEIGHT + 8, theme, lang)}

  <!-- 외곽 -->
  <rect x="2" y="2" width="${SVG_WIDTH - 4}" height="${totalHeight - 4}" rx="15"
        fill="none" stroke="${theme.border}" stroke-width="1.5" opacity="0.2"/>
</svg>`;
}

// ═══════════════════════════════════════════
// 🧩 공통 유틸리티
// ═══════════════════════════════════════════

/** 랭크별 그라데이션 정의 생성 */
function generateRankGradients(theme: ThemeColors): string {
  const ranks: Array<{ id: string; color: string }> = [
    { id: 'rankS', color: '#FFD700' },
    { id: 'rankA', color: '#FF6B6B' },
    { id: 'rankB', color: '#4ECDC4' },
    { id: 'rankC', color: '#45B7D1' },
    { id: 'rankD', color: '#96CEB4' },
  ];

  return ranks.map(r => `
    <linearGradient id="${r.id}" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${r.color}" stop-opacity="0.3"/>
      <stop offset="100%" stop-color="${r.color}" stop-opacity="0.1"/>
    </linearGradient>`).join('');
}

/** XML 특수문자 이스케이프 */
function escapeXml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/** 텍스트를 지정 길이로 자릅니다 */
function truncateText(text: string, maxLen: number): string {
  if (text.length <= maxLen) return text;
  return text.substring(0, maxLen - 1) + '…';
}
