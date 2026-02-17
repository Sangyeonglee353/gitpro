// ═══════════════════════════════════════════
// 🎮 gitpro - All-in-One GitHub Profile Suite
// ═══════════════════════════════════════════
//
// 메인 엔트리포인트
// GitHub 데이터를 수집하고 활성화된 모듈들을 실행합니다.
// 8주차: 전체 통합 (README 자동 생성 + Gist 업로드 + 테마 시스템 + 성능 로깅)

import { loadConfig, getEnabledModules } from './core/config-loader';
import { GitHubClient } from './core/github-client';
import { collectGitHubData } from './core/data-collector';
import { getTheme, getAvailableThemes } from './core/theme-manager';
import { StateManager } from './core/state-manager';
import { runModules } from './core/module-runner';
import { updateReadme } from './core/readme-generator';

/** 성능 측정용 타이머 */
class PerfTimer {
  private timers: Map<string, number> = new Map();
  private results: Array<{ label: string; duration: number }> = [];

  start(label: string): void {
    this.timers.set(label, Date.now());
  }

  end(label: string): number {
    const start = this.timers.get(label);
    if (!start) return 0;
    const duration = Date.now() - start;
    this.results.push({ label, duration });
    this.timers.delete(label);
    return duration;
  }

  printSummary(): void {
    console.log('');
    console.log('⏱️  성능 요약:');
    for (const { label, duration } of this.results) {
      const sec = (duration / 1000).toFixed(2);
      const bar = '█'.repeat(Math.min(20, Math.ceil(duration / 500)));
      console.log(`   ${label.padEnd(25)} ${sec}s ${bar}`);
    }
    const total = this.results.reduce((sum, r) => sum + r.duration, 0);
    console.log(`   ${'총 실행 시간'.padEnd(25)} ${(total / 1000).toFixed(2)}s`);
  }
}

/** 디버그 모드 확인 */
const isDebug = process.env.GITPRO_DEBUG === 'true';

function debugLog(...args: unknown[]): void {
  if (isDebug) {
    console.log('  🔍 [DEBUG]', ...args);
  }
}

async function main(): Promise<void> {
  const perf = new PerfTimer();
  perf.start('전체 실행');

  console.log('');
  console.log('╔═══════════════════════════════════════════╗');
  console.log('║  🎮 gitpro - GitHub Profile Suite         ║');
  console.log('║  All-in-One Profile Visualization Engine  ║');
  console.log('╚═══════════════════════════════════════════╝');
  console.log('');

  try {
    // ── 1. 설정 파일 로드 ──────────────────────────
    perf.start('설정 로드');
    console.log('📄 설정 파일 로드 중...');
    const configPath = process.env.INPUT_CONFIG_PATH || undefined;
    const config = loadConfig(configPath);
    const enabledModules = getEnabledModules(config);
    console.log(`   사용자: ${config.username}`);
    console.log(`   테마: ${config.theme}`);
    console.log(`   로케일: ${config.locale}`);
    console.log(`   활성 모듈: ${enabledModules.join(', ') || '없음'}`);
    console.log(`   README 자동 업데이트: ${config.readme.auto_update ? '✅' : '❌'}`);
    debugLog('사용 가능한 테마:', getAvailableThemes().join(', '));
    perf.end('설정 로드');
    console.log('');

    if (enabledModules.length === 0) {
      console.log('⚠️  활성화된 모듈이 없습니다. gitpro.config.yml을 확인하세요.');
      return;
    }

    // ── 2. GitHub 토큰 확인 ──────────────────────────
    const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
    if (!token) {
      throw new Error(
        '❌ GitHub 토큰이 설정되지 않았습니다.\n' +
        '   환경변수 GH_TOKEN 또는 GITHUB_TOKEN을 설정해주세요.\n' +
        '   (GitHub Actions에서는 secrets.GH_TOKEN을 사용합니다)'
      );
    }

    // ── 3. GitHub 데이터 수집 ──────────────────────────
    perf.start('데이터 수집');
    const client = new GitHubClient(token, config.username, config.include_private);
    const githubData = await collectGitHubData(client, config.timezone);
    debugLog(`커밋 수: ${githubData.commitHistory.length}`);
    debugLog(`레포 수: ${githubData.repositories.length}`);
    debugLog(`언어 수: ${Object.keys(githubData.languages).length}`);
    perf.end('데이터 수집');

    // ── 4. 테마 & 상태 로드 ──────────────────────────
    perf.start('테마 & 상태');
    const theme = getTheme(config.theme, config.custom_theme);
    const stateManager = new StateManager();
    const state = stateManager.getState();
    debugLog('현재 펫 EXP:', state.pet.exp);
    debugLog('현재 도시 티어:', state.city.tier);
    perf.end('테마 & 상태');

    // ── 5. 모듈 실행 ──────────────────────────
    perf.start('모듈 실행');
    const { results, errors } = await runModules(config, githubData, state, theme);
    perf.end('모듈 실행');

    // ── 6. 상태 업데이트 및 저장 ──────────────────────────
    perf.start('상태 저장');
    for (const result of results) {
      if (result.output.stateUpdate) {
        stateManager.merge(result.output.stateUpdate);
      }
    }
    await stateManager.save();
    perf.end('상태 저장');

    // ── 7. README 업데이트 ──────────────────────────
    if (config.readme.auto_update && results.length > 0) {
      perf.start('README 업데이트');
      console.log('');
      console.log('📄 README 업데이트 중...');
      updateReadme(config, results);
      perf.end('README 업데이트');
    }

    // ── 8. 실행 완료 요약 ──────────────────────────
    perf.end('전체 실행');

    console.log('');
    console.log('═══════════════════════════════════════════');
    console.log('  🎉 gitpro 실행 완료!');
    console.log(`  📦 ${results.length}개 SVG 생성됨 → output/ 디렉토리`);
    console.log(`  🎨 테마: ${config.theme}`);
    if (config.readme.auto_update) {
      console.log(`  📄 README.md 업데이트됨 (레이아웃: ${config.readme.layout})`);
    }
    if (errors.length > 0) {
      console.log('');
      console.log(`  ⚠️  ${errors.length}개 모듈 오류:`);
      for (const err of errors) {
        console.log(`     - [${err.moduleId}] ${err.message}`);
      }
    }
    console.log('═══════════════════════════════════════════');

    // 성능 요약 출력
    perf.printSummary();

    console.log('');
  } catch (error) {
    perf.end('전체 실행');
    console.error('');
    console.error('╔═══════════════════════════════════════════╗');
    console.error('║  ❌ gitpro 실행 오류                       ║');
    console.error('╚═══════════════════════════════════════════╝');
    console.error('');

    if (error instanceof Error) {
      console.error('  오류 메시지:', error.message);
      if (isDebug && error.stack) {
        console.error('');
        console.error('  스택 트레이스:');
        console.error(error.stack);
      }
    } else {
      console.error('  알 수 없는 오류:', error);
    }

    console.error('');
    console.error('  💡 문제 해결 가이드:');
    console.error('  1. GH_TOKEN이 올바르게 설정되었는지 확인하세요.');
    console.error('  2. gitpro.config.yml의 username이 올바른지 확인하세요.');
    console.error('  3. GitHub API rate limit에 걸리지 않았는지 확인하세요.');
    console.error('  4. 디버그 모드: GITPRO_DEBUG=true로 실행해보세요.');
    console.error('');

    process.exit(1);
  }
}

main();
