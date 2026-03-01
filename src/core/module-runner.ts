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
/** 모듈 실행 결과 */
export interface ModuleResult {
  id: string;
  output: ModuleOutput;
}

/** 모듈 실행 중 발생한 에러 */
export interface ModuleError {
  moduleId: string;
  error: Error;
  message: string;
}

/** 모듈 실행 전체 결과 */
export interface RunModulesResult {
  results: ModuleResult[];
  errors: ModuleError[];
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
  'dev-city': async () => {
    const { DevCityModule } = await import('../modules/dev-city');
    return new DevCityModule();
  },
  'metro-city': async () => {
    const { MetroCityModule } = await import('../modules/metro-city');
    return new MetroCityModule();
  },
};

/**
 * 활성화된 모듈들을 실행하고 결과를 반환합니다.
 */
export async function runModules(
  config: GitProConfig,
  githubData: GitHubData,
  state: GitProState,
  theme: ThemeColors
): Promise<RunModulesResult> {
  // 1. 활성화된 모듈 필터링
  const enabledModuleIds = Object.entries(config.modules)
    .filter(([_, modConfig]) => (modConfig as { enabled: boolean }).enabled)
    .map(([id]) => id)
    .filter(id => id in MODULE_REGISTRY);

  if (enabledModuleIds.length === 0) {
    console.warn('⚠️  활성화된 모듈이 없습니다. gitpro.config.yml을 확인하세요.');
    return { results: [], errors: [] };
  }

  console.log(`🎯 ${enabledModuleIds.length}개 모듈 실행 시작...\n`);

  // 2. 각 모듈 실행
  const results: ModuleResult[] = [];
  const errors: ModuleError[] = [];

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
    } catch (err) {
      const error = err instanceof Error ? err : new Error(String(err));
      errors.push({
        moduleId,
        error,
        message: error.message,
      });
      console.error(`  ❌ [${moduleId}] 오류 발생: ${error.message}`);
    }
  }

  console.log(`\n🎉 총 ${results.length}개 모듈 생성 완료!`);
  if (errors.length > 0) {
    console.warn(`⚠️  ${errors.length}개 모듈에서 오류 발생`);
  }
  return { results, errors };
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
