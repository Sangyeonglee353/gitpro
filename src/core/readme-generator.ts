// ═══════════════════════════════════════════
// 📄 README Generator - 프로필 README 자동 생성
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { GitProConfig, ThemeColors } from '../types';
import { ModuleResult } from './module-runner';
import { generateHeaderSVG } from './header-generator';
import { getTheme } from './theme-manager';

const GITPRO_START = '<!-- GITPRO:START -->';
const GITPRO_END = '<!-- GITPRO:END -->';

/** 모듈별 제목 */
const MODULE_TITLES: Record<string, { icon: string; title: string; description: string }> = {
  'trading-card': { icon: '🃏', title: 'Dev Trading Card', description: '나만의 개발자 수집 카드' },
  'code-dna': { icon: '🧬', title: 'Code DNA', description: '세상에 하나뿐인 코드 지문' },
  chronicle: { icon: '📜', title: 'Dev Chronicle', description: '개발자 RPG 연대기' },
  'code-pet': { icon: '🐾', title: 'Code Pet', description: 'GitHub 활동으로 키우는 펫' },
  constellation: { icon: '🌌', title: 'Commit Constellation', description: '커밋 별자리 지도' },
  'dev-city': { icon: '🏙️', title: 'Dev City', description: '나만의 개발자 도시' },
};

/**
 * README.md를 업데이트합니다.
 * GITPRO:START ~ GITPRO:END 사이의 내용을 교체합니다.
 */
export function updateReadme(config: GitProConfig, results: ModuleResult[]): void {
  const readmePath = path.resolve(process.cwd(), 'README.md');

  // 기존 README 로드 또는 새로 생성
  let readmeContent: string;
  if (fs.existsSync(readmePath)) {
    readmeContent = fs.readFileSync(readmePath, 'utf-8');
  } else {
    readmeContent = generateNewReadme(config);
  }

  // 헤더 SVG 생성 & 저장
  generateAndSaveHeader(config);

  // 모듈 순서 적용
  const orderedResults = applyModuleOrder(results, config.readme.module_order);

  // GITPRO 섹션 생성
  const gitproSection = generateGitproSection(config, orderedResults);

  // 기존 GITPRO 섹션 교체 또는 추가
  if (readmeContent.includes(GITPRO_START) && readmeContent.includes(GITPRO_END)) {
    const startIdx = readmeContent.indexOf(GITPRO_START);
    const endIdx = readmeContent.indexOf(GITPRO_END) + GITPRO_END.length;
    readmeContent =
      readmeContent.substring(0, startIdx) +
      gitproSection +
      readmeContent.substring(endIdx);
  } else {
    readmeContent += '\n\n' + gitproSection;
  }

  fs.writeFileSync(readmePath, readmeContent, 'utf-8');
  console.log('📄 README.md 업데이트 완료!');
}

/**
 * 새 README.md 기본 내용을 생성합니다.
 */
function generateNewReadme(config: GitProConfig): string {
  const headerText = config.readme.header.text || `Hello, I'm ${config.username}! 👋`;

  return `# ${headerText}

${GITPRO_START}
${GITPRO_END}
`;
}

/**
 * 헤더 SVG를 생성하고 output 디렉토리에 저장합니다.
 */
function generateAndSaveHeader(config: GitProConfig): void {
  const { type, text, color } = config.readme.header;

  if (type === 'none') return;

  const theme = getTheme(config.theme, config.custom_theme);
  const headerSVG = generateHeaderSVG(type, text, color, theme);

  if (headerSVG) {
    const outputDir = path.resolve(process.cwd(), 'output');
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    const filePath = path.join(outputDir, 'header.svg');
    fs.writeFileSync(filePath, headerSVG, 'utf-8');
    console.log('  🌊 헤더 SVG 생성 완료!');
  }
}

/**
 * 사용자가 지정한 순서대로 모듈 결과를 정렬합니다.
 */
function applyModuleOrder(results: ModuleResult[], moduleOrder: string[]): ModuleResult[] {
  if (!moduleOrder || moduleOrder.length === 0) {
    return results;
  }

  const ordered: ModuleResult[] = [];

  // 1. 사용자 지정 순서대로
  for (const moduleId of moduleOrder) {
    const found = results.find(r => r.id === moduleId);
    if (found) {
      ordered.push(found);
    }
  }

  // 2. 나머지는 뒤에 추가
  for (const result of results) {
    if (!ordered.find(r => r.id === result.id)) {
      ordered.push(result);
    }
  }

  return ordered;
}

/**
 * GITPRO 섹션 마크다운을 생성합니다.
 */
function generateGitproSection(config: GitProConfig, results: ModuleResult[]): string {
  const layout = config.readme.layout || 'vertical';

  let markdown = `${GITPRO_START}\n\n`;

  // 헤더 이미지 삽입
  if (config.readme.header.type !== 'none') {
    markdown += `<div align="center">\n\n`;
    markdown += `<img src="./output/header.svg" alt="header" width="100%" />\n\n`;
    markdown += `</div>\n\n`;
  }

  // 모듈 레이아웃
  switch (layout) {
    case 'grid':
      markdown += generateGridLayout(results);
      break;
    case 'tabs':
      markdown += generateTabsLayout(results);
      break;
    case 'vertical':
    default:
      markdown += generateVerticalLayout(results);
      break;
  }

  // 마지막 업데이트 시간 표시
  if (config.readme.show_last_updated) {
    const now = new Date();
    const timeStr = now.toLocaleString('ko-KR', { timeZone: config.timezone || 'UTC' });
    markdown += `\n<p align="center"><sub>🕐 마지막 업데이트: ${timeStr}</sub></p>\n\n`;
  }

  // 푸터
  markdown += generateFooter(config);

  markdown += GITPRO_END;

  return markdown;
}

/**
 * 세로 나열 레이아웃
 */
function generateVerticalLayout(results: ModuleResult[]): string {
  let markdown = `<div align="center">\n\n`;

  for (const result of results) {
    const info = MODULE_TITLES[result.id] || { icon: '📦', title: result.id, description: '' };
    markdown += `### ${info.icon} ${info.title}\n\n`;
    if (info.description) {
      markdown += `<sub>${info.description}</sub>\n\n`;
    }
    markdown += `<img src="./output/${result.id}.svg" alt="${info.title}" />\n\n`;
    markdown += `---\n\n`;
  }

  markdown += `</div>\n\n`;
  return markdown;
}

/**
 * 2열 그리드 레이아웃
 */
function generateGridLayout(results: ModuleResult[]): string {
  let markdown = `<div align="center">\n\n`;

  // 2개씩 묶어서 테이블로
  for (let i = 0; i < results.length; i += 2) {
    const left = results[i];
    const right = results[i + 1];
    const leftInfo = MODULE_TITLES[left.id] || { icon: '📦', title: left.id, description: '' };

    if (right) {
      const rightInfo = MODULE_TITLES[right.id] || { icon: '📦', title: right.id, description: '' };
      markdown += `<table><tr>\n`;
      markdown += `<td align="center" width="50%">\n\n`;
      markdown += `### ${leftInfo.icon} ${leftInfo.title}\n`;
      if (leftInfo.description) markdown += `<sub>${leftInfo.description}</sub>\n\n`;
      markdown += `<img src="./output/${left.id}.svg" width="400" />\n\n</td>\n`;
      markdown += `<td align="center" width="50%">\n\n`;
      markdown += `### ${rightInfo.icon} ${rightInfo.title}\n`;
      if (rightInfo.description) markdown += `<sub>${rightInfo.description}</sub>\n\n`;
      markdown += `<img src="./output/${right.id}.svg" width="400" />\n\n</td>\n`;
      markdown += `</tr></table>\n\n`;
    } else {
      markdown += `### ${leftInfo.icon} ${leftInfo.title}\n\n`;
      if (leftInfo.description) markdown += `<sub>${leftInfo.description}</sub>\n\n`;
      markdown += `<img src="./output/${left.id}.svg" />\n\n`;
    }
  }

  markdown += `</div>\n\n`;
  return markdown;
}

/**
 * 탭(접기) 레이아웃
 */
function generateTabsLayout(results: ModuleResult[]): string {
  let markdown = `<div align="center">\n\n`;

  for (let i = 0; i < results.length; i++) {
    const result = results[i];
    const info = MODULE_TITLES[result.id] || { icon: '📦', title: result.id, description: '' };
    const isOpen = i === 0 ? ' open' : '';

    markdown += `<details${isOpen}>\n`;
    markdown += `<summary>${info.icon} <b>${info.title}</b>`;
    if (info.description) markdown += ` — <i>${info.description}</i>`;
    markdown += `</summary>\n\n`;
    markdown += `<br/>\n\n`;
    markdown += `<img src="./output/${result.id}.svg" alt="${info.title}" />\n\n`;
    markdown += `</details>\n\n`;
  }

  markdown += `</div>\n\n`;
  return markdown;
}

/**
 * 푸터를 생성합니다.
 */
function generateFooter(config: GitProConfig): string {
  const footer = config.readme.footer;
  if (!footer || !footer.enabled || footer.style === 'none') {
    return `<p align="center"><sub>🎮 Generated by <a href="https://github.com/Sangyeonglee353/gitpro">gitpro</a></sub></p>\n\n`;
  }

  switch (footer.style) {
    case 'wave':
      return generateWaveFooter(config);
    case 'stats':
      return generateStatsFooter(config);
    case 'minimal':
    default:
      return generateMinimalFooter(config);
  }
}

function generateWaveFooter(config: GitProConfig): string {
  const color = config.readme.header.color || '#6C63FF';
  const footerText = config.readme.footer.text || '';

  // SVG 웨이브 푸터 생성
  const footerSVG = `<svg xmlns="http://www.w3.org/2000/svg" width="850" height="120" viewBox="0 0 850 120">
  <defs>
    <linearGradient id="footGrad" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${color}" stop-opacity="0.8"/>
      <stop offset="100%" stop-color="${color}" stop-opacity="0.4"/>
    </linearGradient>
  </defs>
  <path d="M0,0 C200,80 650,80 850,0 L850,120 L0,120 Z" fill="url(#footGrad)"/>
  <text x="425" y="85" text-anchor="middle" font-size="12" fill="white" font-family="'Segoe UI', sans-serif" opacity="0.9">
    🎮 Generated by gitpro${footerText ? ' | ' + footerText : ''}
  </text>
</svg>`;

  // 푸터 SVG 저장
  const outputDir = path.resolve(process.cwd(), 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  fs.writeFileSync(path.join(outputDir, 'footer.svg'), footerSVG, 'utf-8');

  return `<div align="center">\n\n<img src="./output/footer.svg" alt="footer" width="100%" />\n\n</div>\n\n`;
}

function generateStatsFooter(config: GitProConfig): string {
  const footerText = config.readme.footer.text || '';
  let markdown = `<div align="center">\n\n`;
  markdown += `---\n\n`;
  markdown += `<table>\n<tr>\n`;
  markdown += `<td align="center">\n\n`;
  markdown += `🎮 **gitpro**\n\n`;
  markdown += `*All-in-One GitHub Profile Suite*\n\n`;
  markdown += `</td>\n`;
  markdown += `<td align="center">\n\n`;
  markdown += `📊 **활성 모듈**\n\n`;

  const enabledModules = Object.entries(config.modules)
    .filter(([_, modConfig]) => (modConfig as { enabled: boolean }).enabled)
    .map(([id]) => {
      const info = MODULE_TITLES[id];
      return info ? `${info.icon} ${info.title}` : id;
    });

  markdown += enabledModules.join(' · ') + '\n\n';
  markdown += `</td>\n`;
  markdown += `<td align="center">\n\n`;
  markdown += `🎨 **테마**\n\n`;
  markdown += `\`${config.theme}\`\n\n`;
  markdown += `</td>\n`;
  markdown += `</tr>\n</table>\n\n`;

  if (footerText) {
    markdown += `<sub>${footerText}</sub>\n\n`;
  }

  markdown += `<sub>🎮 Powered by <a href="https://github.com/Sangyeonglee353/gitpro">gitpro</a></sub>\n\n`;
  markdown += `</div>\n\n`;

  return markdown;
}

function generateMinimalFooter(config: GitProConfig): string {
  const footerText = config.readme.footer.text || '';
  let markdown = `<p align="center">\n`;

  if (footerText) {
    markdown += `  <sub>${footerText}</sub><br/>\n`;
  }

  markdown += `  <sub>🎮 Generated by <a href="https://github.com/Sangyeonglee353/gitpro">gitpro</a> · `;
  markdown += `Theme: <code>${config.theme}</code></sub>\n`;
  markdown += `</p>\n\n`;

  return markdown;
}
