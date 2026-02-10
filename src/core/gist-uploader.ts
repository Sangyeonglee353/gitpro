// ═══════════════════════════════════════════
// 📌 Gist Uploader - Gist 연동 모듈
// ═══════════════════════════════════════════
//
// Pinned Gist에 gitpro 출력물을 업로드합니다.
// 사용자의 GitHub 프로필에 Pinned Gist로 표시됩니다.

import * as fs from 'fs';
import * as path from 'path';
import { Octokit } from '@octokit/rest';
import { GistConfig } from '../types';
import { ModuleResult } from './module-runner';

/**
 * 모듈 결과를 Gist에 업로드합니다.
 */
export async function uploadToGist(
  token: string,
  gistConfig: GistConfig,
  results: ModuleResult[]
): Promise<void> {
  if (!gistConfig.enabled) {
    return;
  }

  if (!gistConfig.gist_id) {
    console.warn('⚠️  Gist ID가 설정되지 않았습니다. gist.gist_id를 설정해주세요.');
    return;
  }

  console.log('📌 Gist 업로드 시작...');

  const octokit = new Octokit({ auth: token });

  // 업로드할 모듈 필터링
  const targetModules = gistConfig.modules && gistConfig.modules.length > 0
    ? results.filter(r => gistConfig.modules.includes(r.id))
    : results;

  if (targetModules.length === 0) {
    console.warn('⚠️  Gist에 업로드할 모듈이 없습니다.');
    return;
  }

  try {
    // 기존 Gist 정보 가져오기
    const { data: existingGist } = await octokit.gists.get({
      gist_id: gistConfig.gist_id,
    });

    // Gist 파일 구성
    const files: Record<string, { content: string }> = {};

    for (const result of targetModules) {
      // SVG 파일
      const svgFileName = `gitpro-${result.id}.svg`;
      files[svgFileName] = { content: result.output.svg };
    }

    // 요약 마크다운 파일 추가
    const summaryContent = generateGistSummary(targetModules);
    files['gitpro-summary.md'] = { content: summaryContent };

    // Gist 업데이트
    await octokit.gists.update({
      gist_id: gistConfig.gist_id,
      description: '🎮 gitpro - GitHub Profile Suite',
      files,
    });

    console.log(`  ✅ Gist 업데이트 완료! (${targetModules.length}개 모듈)`);
    console.log(`  📎 https://gist.github.com/${gistConfig.gist_id}`);
  } catch (error: any) {
    if (error.status === 404) {
      console.error('  ❌ Gist를 찾을 수 없습니다. gist_id를 확인해주세요.');
    } else if (error.status === 401 || error.status === 403) {
      console.error('  ❌ Gist 권한이 없습니다. GH_TOKEN에 gist 스코프가 필요합니다.');
    } else {
      console.error('  ❌ Gist 업로드 실패:', error.message || error);
    }
  }
}

/**
 * Gist 요약 마크다운을 생성합니다.
 */
function generateGistSummary(results: ModuleResult[]): string {
  const MODULE_NAMES: Record<string, string> = {
    'trading-card': '🃏 Dev Trading Card',
    'code-dna': '🧬 Code DNA',
    chronicle: '📜 Dev Chronicle',
    'code-pet': '🐾 Code Pet',
    constellation: '🌌 Commit Constellation',
    'dev-city': '🏙️ Dev City',
  };

  let content = `# 🎮 gitpro - GitHub Profile Suite\n\n`;
  content += `> 자동 생성된 GitHub 프로필 시각화\n\n`;
  content += `## 📦 포함된 모듈\n\n`;

  for (const result of results) {
    const name = MODULE_NAMES[result.id] || result.id;
    content += `- ${name}\n`;
  }

  content += `\n---\n\n`;
  content += `*🕐 마지막 업데이트: ${new Date().toISOString()}*\n`;
  content += `*🔗 [gitpro](https://github.com/Sangyeonglee353/gitpro)로 생성됨*\n`;

  return content;
}

/**
 * 새로운 Gist를 생성합니다 (최초 설정 시 사용).
 */
export async function createGist(token: string): Promise<string> {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.gists.create({
    description: '🎮 gitpro - GitHub Profile Suite',
    public: true,
    files: {
      'gitpro-summary.md': {
        content: '# 🎮 gitpro\n\n> 설정 준비 중입니다...\n',
      },
    },
  });

  console.log(`📌 새 Gist 생성 완료: ${data.id}`);
  console.log(`   gitpro.config.yml의 gist.gist_id에 "${data.id}"를 설정해주세요.`);

  return data.id!;
}
