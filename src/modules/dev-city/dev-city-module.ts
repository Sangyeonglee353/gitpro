// ═══════════════════════════════════════════
// 🏙️ Dev City Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// GitHub 활동을 아이소메트릭 픽셀아트 도시로 변환합니다.
// 레포지토리 → 건물, 커밋 → 교통, 활동 → 날씨
// 4가지 도시 스타일: pixel, isometric, flat, neon

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  DevCityConfig,
} from '../../types';
import { analyzeCity } from './city-analyzer';
import { renderCity } from './city-renderer';
import { getBuildingIcon } from './building-mapper';

export class DevCityModule implements GitProModule {
  readonly id = 'dev-city';
  readonly name = 'Dev City';
  readonly description = 'GitHub 활동을 아이소메트릭 픽셀아트 도시로 시각화합니다.';
  readonly icon = '🏙️';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, state, theme } = context;
    const config = moduleConfig as unknown as DevCityConfig;

    // 1. 도시 데이터 분석
    console.log('    🏗️ 도시 데이터 분석 시작...');
    const profile = analyzeCity(githubData, state.city);

    // 2. 분석 결과 로그
    console.log(`    🏙️ 도시 Tier: ${profile.tier.icon} ${profile.tier.name} (Tier ${profile.tier.tier})`);
    console.log(`    🏢 건물 수: ${profile.stats.totalBuildings}개`);
    console.log(`    ${profile.weather.icon} 날씨: ${profile.weather.labelKo}`);
    console.log(`    🚗 교통: ${profile.traffic.description}`);
    console.log(`    👥 인구: ${profile.stats.population.toLocaleString()}명`);

    // 3. 건물 목록 로그
    for (const b of profile.buildings.slice(0, 10)) {
      const icon = getBuildingIcon(b.buildingType);
      const dormant = b.isDormant ? ' [폐허]' : '';
      const lang = b.language ? ` (${b.language})` : '';
      console.log(`    ${icon} ${b.repoName}${lang} · ⭐${b.stars} · 💻${b.totalCommits}${dormant}`);
    }
    if (profile.buildings.length > 10) {
      console.log(`    ... 외 ${profile.buildings.length - 10}개 건물`);
    }

    // 4. SVG 렌더링
    console.log(`    🎴 도시 스타일: ${config.city_style || 'pixel'}`);
    console.log(`    🌦️ 날씨 표시: ${config.show_weather !== false ? 'ON' : 'OFF'}`);
    console.log(`    🚗 교통 표시: ${config.show_traffic !== false ? 'ON' : 'OFF'}`);
    console.log(`    ✨ 애니메이션: ${config.animation !== false ? 'ON' : 'OFF'}`);

    const svg = renderCity({
      username: globalConfig.username,
      profile,
      config,
      theme,
    });

    // 5. README 마크다운 생성
    const markdown = `<img src="./output/dev-city.svg" alt="Dev City" width="800" />`;

    // 6. 상태 업데이트
    const stateUpdate = {
      city: profile.stateUpdate,
    };

    return { svg, markdown, stateUpdate };
  }
}
