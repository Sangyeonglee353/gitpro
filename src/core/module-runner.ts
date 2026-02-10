// ═══════════════════════════════════════════
// 🚀 Module Runner - 모듈 오케스트레이터
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import {
  GitProConfig,
  GitHubData,
  GitProModule,
  ModuleContext,
  ModuleOutput,
  ModuleId,
  GitProState,
  ThemeColors,
} from '../types';
import { SVGEngine } from './svg-engine';

/** 모듈 실행 결과 */
export interface ModuleResult {
  id: string;
  output: ModuleOutput;
}

/** 모듈 레지스트리 - 지연 로딩을 위해 팩토리 패턴 사용 */
const MODULE_REGISTRY: Record<string, () => Promise<GitProModule>> = {
  'trading-card': async () => {
    const { TradingCardModule } = await import('../modules/trading-card');
    return new TradingCardModule();
  },
  'code-pet': async () => {
    const { CodePetModule } = await import('../modules/code-pet');
    return new CodePetModule();
  },
  'code-dna': async () => {
    const { CodeDNAModule } = await import('../modules/code-dna');
    return new CodeDNAModule();
  },
  'chronicle': async () => {
    const { ChronicleModule } = await import('../modules/chronicle');
    return new ChronicleModule();
  },
  'constellation': async () => {
    const { ConstellationModule } = await import('../modules/constellation');
    return new ConstellationModule();
  },
  // 향후 모듈 추가 시 여기에 등록
  // 'dev-city': async () => { ... },
};

/**
 * 활성화된 모듈들을 실행하고 결과를 반환합니다.
 */
export async function runModules(
  config: GitProConfig,
  githubData: GitHubData,
  state: GitProState,
  theme: ThemeColors
): Promise<ModuleResult[]> {
  // 1. 활성화된 모듈 필터링
  const enabledModuleIds = Object.entries(config.modules)
    .filter(([_, modConfig]) => (modConfig as { enabled: boolean }).enabled)
    .map(([id]) => id)
    .filter(id => id in MODULE_REGISTRY);

  if (enabledModuleIds.length === 0) {
    console.warn('⚠️  활성화된 모듈이 없습니다. gitpro.config.yml을 확인하세요.');
    return [];
  }

  console.log(`🎯 ${enabledModuleIds.length}개 모듈 실행 시작...\n`);

  // 2. SVG 엔진 생성
  const svgEngine = new SVGEngine(theme);

  // 3. 각 모듈 실행
  const results: ModuleResult[] = [];

  for (const moduleId of enabledModuleIds) {
    try {
      console.log(`  🔨 [${moduleId}] 생성 중...`);

      const moduleFactory = MODULE_REGISTRY[moduleId];
      if (!moduleFactory) {
        console.warn(`  ⚠️  [${moduleId}] 모듈을 찾을 수 없습니다. 건너뜁니다.`);
        continue;
      }

      const module = await moduleFactory();
      const moduleConfig = (config.modules as unknown as Record<string, unknown>)[moduleId] as Record<string, unknown>;

      const context: ModuleContext = {
        githubData,
        moduleConfig,
        globalConfig: config,
        state,
        theme,
      };

      const output = await module.generate(context);

      // SVG 파일 저장
      await saveSVG(moduleId, output.svg);

      results.push({ id: moduleId, output });
      console.log(`  ✅ [${moduleId}] 완료!`);
    } catch (error) {
      console.error(`  ❌ [${moduleId}] 오류 발생:`, error);
    }
  }

  console.log(`\n🎉 총 ${results.length}개 모듈 생성 완료!`);
  return results;
}

/**
 * SVG 파일을 output/ 디렉토리에 저장합니다.
 */
async function saveSVG(moduleId: string, svgContent: string): Promise<void> {
  const outputDir = path.resolve(process.cwd(), 'output');

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const filePath = path.join(outputDir, `${moduleId}.svg`);
  fs.writeFileSync(filePath, svgContent, 'utf-8');
}
