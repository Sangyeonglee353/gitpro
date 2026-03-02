// ═══════════════════════════════════════════
// 🌌 Constellation Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// 커밋 기록이 밤하늘의 별자리로 변환됩니다.
// 레포지토리 → 별자리, 커밋 → 별, PR → 유성, 이슈 → 성운
// 4가지 하늘 테마: midnight, aurora, sunset, deep_space

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  ConstellationConfig,
} from '../../types';
import { analyzeConstellation } from './constellation-analyzer';
import { renderConstellation } from './constellation-renderer';
import { getRepoTypeIcon } from './star-mapper';

function normalizeConstellationConfig(
  config: Partial<ConstellationConfig> | undefined
): ConstellationConfig {
  const skyTheme = config?.sky_theme;
  const safeSkyTheme =
    skyTheme === 'midnight' ||
    skyTheme === 'aurora' ||
    skyTheme === 'sunset' ||
    skyTheme === 'deep_space'
      ? skyTheme
      : 'midnight';

  const maxConstellationsRaw = config?.max_constellations;
  const max_constellations =
    typeof maxConstellationsRaw === 'number' && Number.isFinite(maxConstellationsRaw)
      ? Math.max(1, Math.min(20, Math.floor(maxConstellationsRaw)))
      : 10;

  return {
    enabled: config?.enabled ?? true,
    sky_theme: safeSkyTheme,
    show_meteors: config?.show_meteors ?? true,
    show_nebula: config?.show_nebula ?? true,
    max_constellations,
  };
}

export class ConstellationModule implements GitProModule {
  readonly id = 'constellation';
  readonly name = 'Commit Constellation';
  readonly description = '커밋 기록을 밤하늘의 별자리로 변환하여 시각화합니다.';
  readonly icon = '🌌';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, theme } = context;
    const config = normalizeConstellationConfig(moduleConfig as Partial<ConstellationConfig>);

    // 1. 별자리 데이터 분석
    console.log('    🔭 별자리 분석 시작...');
    const maxConstellations = config.max_constellations;
    const profile = analyzeConstellation(githubData, maxConstellations);

    // 2. 분석 결과 로그
    console.log(`    🌟 별자리 ${profile.stats.totalConstellations}개 감지됨`);
    console.log(`    ⭐ 총 ${profile.stats.totalStars}개 별 배치`);
    console.log(`    ☄️ 유성 ${profile.stats.totalMeteors}개`);
    console.log(`    ✦ 성운 ${profile.stats.totalNebulas}개`);

    // 3. 별자리 목록 로그
    for (const c of profile.constellations) {
      const icon = getRepoTypeIcon(c.repoType);
      const dormant = c.isDormant ? ' [적색왜성]' : '';
      console.log(`    ${icon} ${c.constellationName} (⭐${c.stars.length} · 💻${c.totalCommits})${dormant}`);
    }

    // 4. 하늘 정보 로그
    const skyTypeLabels = {
      dawn: '🌅 새벽형 (보라→분홍 그라데이션)',
      day: '🌤️ 주간형 (진한 남색)',
      night: '🌙 야간형 (깊은 검정 + 은하수)',
    };
    console.log(`    ${skyTypeLabels[profile.sky.type]}`);
    console.log(`    ⏰ 최다 활동 시각: ${profile.sky.peakHour}시`);

    if (profile.stats.brightestStar) {
      console.log(`    💡 가장 밝은 별: ${profile.stats.brightestStar}`);
    }
    if (profile.stats.largestConstellation) {
      console.log(`    🌌 가장 큰 별자리: ${profile.stats.largestConstellation}`);
    }

    // 5. SVG 렌더링
    console.log(`    🎴 하늘 테마: ${config.sky_theme}`);
    console.log(`    ☄️ 유성 표시: ${config.show_meteors !== false ? 'ON' : 'OFF'}`);
    console.log(`    ✦ 성운 표시: ${config.show_nebula !== false ? 'ON' : 'OFF'}`);

    const svg = renderConstellation({
      username: globalConfig.username,
      profile,
      config,
      theme,
    });

    // 6. README 마크다운 생성
    const markdown = `<img src="./output/constellation.svg" alt="Commit Constellation" width="800" />`;

    return { svg, markdown };
  }
}
