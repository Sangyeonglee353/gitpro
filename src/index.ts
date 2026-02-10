// ═══════════════════════════════════════════
// 🎮 gitpro - All-in-One GitHub Profile Suite
// ═══════════════════════════════════════════
//
// 메인 엔트리포인트
// GitHub 데이터를 수집하고 활성화된 모듈들을 실행합니다.

import { loadConfig, getEnabledModules } from './core/config-loader';
import { GitHubClient } from './core/github-client';
import { collectGitHubData } from './core/data-collector';
import { getTheme } from './core/theme-manager';
import { StateManager } from './core/state-manager';
import { runModules } from './core/module-runner';
import { updateReadme } from './core/readme-generator';

async function main(): Promise<void> {
  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🎮 gitpro - GitHub Profile Suite         ║');
  console.log('║  All-in-One Profile Visualization Engine  ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  try {
    // 1. 설정 파일 로드
    console.log('📄 설정 파일 로드 중...');
    const config = loadConfig();
    const enabledModules = getEnabledModules(config);
    console.log(`   사용자: ${config.username}`);
    console.log(`   테마: ${config.theme}`);
    console.log(`   활성 모듈: ${enabledModules.join(', ') || '없음'}`);
    console.log('');

    if (enabledModules.length === 0) {
      console.log('⚠️  활성화된 모듈이 없습니다. gitpro.config.yml을 확인하세요.');
      return;
    }

    // 2. GitHub 토큰 확인
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        '❌ GitHub 토큰이 설정되지 않았습니다.\n' +
        '   환경변수 GH_TOKEN 또는 GITHUB_TOKEN을 설정해주세요.\n' +
        '   (GitHub Actions에서는 secrets.GH_TOKEN을 사용합니다)'
      );
    }

    // 3. GitHub 데이터 수집
    const client = new GitHubClient(token, config.username);
    const githubData = await collectGitHubData(client, config.timezone);

    // 4. 테마 & 상태 로드
    const theme = getTheme(config.theme);
    const stateManager = new StateManager();
    const state = stateManager.getState();

    // 5. 모듈 실행
    const results = await runModules(config, githubData, state, theme);

    // 6. 상태 업데이트 및 저장
    for (const result of results) {
      if (result.output.stateUpdate) {
        stateManager.merge(result.output.stateUpdate as any);
      }
    }
    await stateManager.save();

    // 7. README 업데이트
    if (config.readme.auto_update && results.length > 0) {
      console.log('');
      updateReadme(config, results);
    }

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🎉 gitpro 실행 완료!');
    console.log(`  📦 ${results.length}개 SVG 생성됨 → output/ 디렉토리`);
    console.log('═══════════════════════════════════════════');
    console.log('');
  } catch (error) {
    console.error('');
    console.error('❌ 오류 발생:', error instanceof Error ? error.message : error);
    console.error('');
    process.exit(1);
  }
}

main();
