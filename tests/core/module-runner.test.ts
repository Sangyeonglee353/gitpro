// ═══════════════════════════════════════════
// 🧪 Module Runner 테스트
// ═══════════════════════════════════════════

import * as fs from 'fs';
import { runModules } from '../../src/core/module-runner';
import { createMockGitHubData, createMockConfig, createMockState, createMockTheme } from '../helpers/mock-data';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

// 모듈 팩토리를 모킹
jest.mock('../../src/modules/trading-card', () => ({
  TradingCardModule: class {
    readonly id = 'trading-card';
    readonly name = 'Trading Card';
    readonly description = 'Test';
    readonly icon = '🃏';
    async generate() {
      return { svg: '<svg>trading-card</svg>', markdown: '![card](./output/trading-card.svg)' };
    }
  },
}));

jest.mock('../../src/modules/code-dna', () => ({
  CodeDNAModule: class {
    readonly id = 'code-dna';
    readonly name = 'Code DNA';
    readonly description = 'Test';
    readonly icon = '🧬';
    async generate() {
      return { svg: '<svg>code-dna</svg>', markdown: '![dna](./output/code-dna.svg)' };
    }
  },
}));

jest.mock('../../src/modules/chronicle', () => ({
  ChronicleModule: class {
    readonly id = 'chronicle';
    readonly name = 'Chronicle';
    readonly description = 'Test';
    readonly icon = '📜';
    async generate() {
      throw new Error('Chronicle generation failed');
    }
  },
}));

jest.mock('../../src/modules/code-pet', () => ({
  CodePetModule: class {
    readonly id = 'code-pet';
    readonly name = 'Code Pet';
    readonly description = 'Test';
    readonly icon = '🐾';
    async generate() {
      return {
        svg: '<svg>code-pet</svg>',
        markdown: '![pet](./output/code-pet.svg)',
        stateUpdate: { pet: { exp: 100 } },
      };
    }
  },
}));

jest.mock('../../src/modules/constellation', () => ({
  ConstellationModule: class {
    readonly id = 'constellation';
    readonly name = 'Constellation';
    readonly description = 'Test';
    readonly icon = '🌌';
    async generate() {
      return { svg: '<svg>constellation</svg>', markdown: '![const](./output/constellation.svg)' };
    }
  },
}));

jest.mock('../../src/modules/dev-city', () => ({
  DevCityModule: class {
    readonly id = 'dev-city';
    readonly name = 'Dev City';
    readonly description = 'Test';
    readonly icon = '🏙️';
    async generate() {
      return { svg: '<svg>dev-city</svg>', markdown: '![city](./output/dev-city.svg)' };
    }
  },
}));

describe('Module Runner', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFs.existsSync.mockReturnValue(true);
    mockFs.mkdirSync.mockReturnValue(undefined as any);
    mockFs.writeFileSync.mockReturnValue(undefined);
  });

  it('활성화된 모듈을 실행하고 결과를 반환한다', async () => {
    const config = createMockConfig();
    // trading-card와 code-dna만 활성화
    config.modules['trading-card'].enabled = true;
    config.modules['code-dna'].enabled = true;
    config.modules.chronicle.enabled = false;
    config.modules['code-pet'].enabled = false;
    config.modules.constellation.enabled = false;
    config.modules['dev-city'].enabled = false;

    const { results, errors } = await runModules(
      config,
      createMockGitHubData(),
      createMockState(),
      createMockTheme()
    );

    expect(results).toHaveLength(2);
    expect(results[0].id).toBe('trading-card');
    expect(results[1].id).toBe('code-dna');
    expect(errors).toHaveLength(0);
  });

  it('모듈이 없으면 빈 결과를 반환한다', async () => {
    const config = createMockConfig();
    Object.values(config.modules).forEach((mod: any) => {
      mod.enabled = false;
    });

    const { results, errors } = await runModules(
      config,
      createMockGitHubData(),
      createMockState(),
      createMockTheme()
    );

    expect(results).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  it('모듈 실패 시 다른 모듈은 계속 실행된다', async () => {
    const config = createMockConfig();
    config.modules['trading-card'].enabled = true;
    config.modules.chronicle.enabled = true; // 이 모듈은 에러를 던짐
    config.modules['code-dna'].enabled = false;
    config.modules['code-pet'].enabled = false;
    config.modules.constellation.enabled = false;
    config.modules['dev-city'].enabled = false;

    const { results, errors } = await runModules(
      config,
      createMockGitHubData(),
      createMockState(),
      createMockTheme()
    );

    // trading-card는 성공
    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('trading-card');

    // chronicle은 에러
    expect(errors).toHaveLength(1);
    expect(errors[0].moduleId).toBe('chronicle');
    expect(errors[0].message).toBe('Chronicle generation failed');
  });

  it('SVG 파일을 output 디렉토리에 저장한다', async () => {
    const config = createMockConfig();
    config.modules['trading-card'].enabled = true;
    config.modules['code-dna'].enabled = false;
    config.modules.chronicle.enabled = false;
    config.modules['code-pet'].enabled = false;
    config.modules.constellation.enabled = false;
    config.modules['dev-city'].enabled = false;

    await runModules(
      config,
      createMockGitHubData(),
      createMockState(),
      createMockTheme()
    );

    expect(mockFs.writeFileSync).toHaveBeenCalledWith(
      expect.stringContaining('trading-card.svg'),
      '<svg>trading-card</svg>',
      'utf-8'
    );
  });

  it('stateUpdate를 포함한 결과를 반환한다', async () => {
    const config = createMockConfig();
    config.modules['trading-card'].enabled = false;
    config.modules['code-dna'].enabled = false;
    config.modules.chronicle.enabled = false;
    config.modules['code-pet'].enabled = true;
    config.modules.constellation.enabled = false;
    config.modules['dev-city'].enabled = false;

    const { results } = await runModules(
      config,
      createMockGitHubData(),
      createMockState(),
      createMockTheme()
    );

    expect(results).toHaveLength(1);
    expect(results[0].output.stateUpdate).toBeDefined();
  });
});
