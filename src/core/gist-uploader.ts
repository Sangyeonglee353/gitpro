// ═══════════════════════════════════════════
// 📌 Gist Uploader - Gist 연동 모듈
// ═══════════════════════════════════════════
//
// Pinned Gist에 gitpro 출력물을 업로드합니다.
// 사용자의 GitHub 프로필에 Pinned Gist로 표시됩니다.
// SVG 대신 마크다운 파일로 업로드하여 Gist 페이지에서 이미지가 렌더링됩니다.

import { Octokit } from '@octokit/rest';
import { GistConfig } from '../types';
import { ModuleResult } from './module-runner';

/**
 * 모듈 결과를 Gist에 업로드합니다.
 * SVG를 직접 업로드하는 대신, 마크다운 파일에 <img> 태그로 SVG를 임베드합니다.
 * → 핀 카드에서 텍스트 미리보기가 정상 표시되고,
 * → Gist 페이지에서는 SVG 이미지가 렌더링됩니다.
 */
export async function uploadToGist(
  token: string,
  gistConfig: GistConfig,
  results: ModuleResult[],
  username: string
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
    const files: Record<string, { content: string } | null> = {};

    // 기존 파일 정리: gitpro.md를 제외한 모든 기존 파일 삭제
    // (처음 Gist 생성 시 임의로 넣은 파일도 자동 정리됨)
    if (existingGist.files) {
      for (const filename of Object.keys(existingGist.files)) {
        if (filename !== 'gitpro.md') {
          (files as any)[filename] = null; // null → 파일 삭제
        }
      }
    }

    // 메인 마크다운 파일 생성 (SVG를 이미지로 임베드)
    const markdownContent = generateGistMarkdown(username, targetModules);
    files['gitpro.md'] = { content: markdownContent };

    // Gist 업데이트
    await octokit.gists.update({
      gist_id: gistConfig.gist_id,
      description: `🎮 gitpro — ${username}'s GitHub Profile Suite`,
      files: files as any,
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
 * Gist용 마크다운을 생성합니다.
 * repo의 output/ SVG를 <img> 태그로 임베드하여 Gist 페이지에서 이미지로 렌더링됩니다.
 */
function generateGistMarkdown(username: string, results: ModuleResult[]): string {
  const MODULE_INFO: Record<string, { name: string; width: number }> = {
    'trading-card': { name: '🃏 Dev Trading Card', width: 420 },
    'code-dna': { name: '🧬 Code DNA', width: 520 },
    chronicle: { name: '📜 Dev Chronicle', width: 520 },
    'code-pet': { name: '🐾 Code Pet', width: 480 },
    constellation: { name: '🌌 Commit Constellation', width: 800 },
    'dev-city': { name: '🏙️ Dev City', width: 800 },
  };

  let content = `# 🎮 gitpro — ${username}\n\n`;

  for (const result of results) {
    const info = MODULE_INFO[result.id] || { name: result.id, width: 520 };
    const imgUrl = `https://raw.githubusercontent.com/${username}/gitpro/main/output/${result.id}.svg`;
    content += `### ${info.name}\n\n`;
    content += `<img src="${imgUrl}" alt="${result.id}" width="${info.width}" />\n\n`;
  }

  content += `---\n\n`;
  content += `*🕐 마지막 업데이트: ${new Date().toISOString()}*\n\n`;
  content += `*🔗 Powered by [gitpro](https://github.com/Sangyeonglee353/gitpro)*\n`;

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
      'gitpro.md': {
        content: '# 🎮 gitpro\n\n> 설정 준비 중입니다...\n',
      },
    },
  });

  console.log(`📌 새 Gist 생성 완료: ${data.id}`);
  console.log(`   gitpro.config.yml의 gist.gist_id에 "${data.id}"를 설정해주세요.`);

  return data.id!;
}
