// ═══════════════════════════════════════════
// 🏙️ Metro City Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// GitHub 활동을 현대적인 도시 건설 장면으로 변환합니다.
// 8가지 새로운 건물 타입 + 공사 크레인 아이소메트릭 뷰.

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  MetroCityConfig,
} from '../../types';
import { analyzeMetroCity } from './metro-analyzer';
import { renderMetroCity } from './metro-renderer';

function normalizeMetroCityConfig(config: Partial<MetroCityConfig> | undefined): MetroCityConfig {
  return {
    enabled: config?.enabled ?? true,
    show_weather: config?.show_weather ?? true,
    show_traffic: config?.show_traffic ?? true,
    animation: config?.animation ?? true,
  };
}

export class MetroCityModule implements GitProModule {
  readonly id = 'metro-city';
  readonly name = 'Metro City';
  readonly description = 'GitHub 활동을 현대적인 도시 건설 장면으로 시각화합니다.';
  readonly icon = '🏗️';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, state, theme } = context;
    const config = normalizeMetroCityConfig(moduleConfig as Partial<MetroCityConfig>);

    // 1. 도시 데이터 분석 (metro-city 독자 분석기)
    console.log('    🏗️ 메트로 도시 데이터 분석 시작...');
    const profile = analyzeMetroCity(githubData, state.city);

    // 2. 분석 결과 로그
    console.log(`    🏙️ 도시 Tier: ${profile.tier.icon} ${profile.tier.name} (Tier ${profile.tier.tier})`);
    console.log(`    🏢 건물 수: ${profile.stats.totalBuildings}개`);
    console.log(`    ${profile.weather.icon} 날씨: ${profile.weather.labelKo}`);
    console.log(`    🚗 교통: ${profile.traffic.description}`);
    console.log(`    👥 인구: ${profile.stats.population.toLocaleString()}명`);

    // 3. SVG 렌더링
    console.log(`    🌦️ 날씨 표시: ${config.show_weather !== false ? 'ON' : 'OFF'}`);
    console.log(`    🚗 교통 표시: ${config.show_traffic !== false ? 'ON' : 'OFF'}`);
    console.log(`    ✨ 애니메이션: ${config.animation !== false ? 'ON' : 'OFF'}`);

    const svg = renderMetroCity({
      username: globalConfig.username,
      profile,
      config,
      theme,
    });

    // 4. README 마크다운 생성
    const markdown = `<img src="./output/metro-city.svg" alt="Metro City" width="800" />`;

    // 5. 상태 업데이트 (city 상태 공유)
    const stateUpdate = {
      city: profile.stateUpdate,
    };

    return { svg, markdown, stateUpdate };
  }
}
