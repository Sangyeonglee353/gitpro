import { ModuleContext } from '../../src/types';
import { TradingCardModule } from '../../src/modules/trading-card';
import { CodeDNAModule } from '../../src/modules/code-dna';
import { ChronicleModule } from '../../src/modules/chronicle';
import { CodePetModule } from '../../src/modules/code-pet';
import { ConstellationModule } from '../../src/modules/constellation';
import { DevCityModule } from '../../src/modules/dev-city';
import { MetroCityModule } from '../../src/modules/metro-city';
import {
  createMockConfig,
  createMockGitHubData,
  createMockState,
  createMockTheme,
} from '../helpers/mock-data';

function createBaseContext(moduleConfig: Record<string, unknown>): ModuleContext {
  return {
    githubData: createMockGitHubData(),
    moduleConfig,
    globalConfig: createMockConfig(),
    state: createMockState(),
    theme: createMockTheme(),
  };
}

describe('Module config normalization', () => {
  it('trading-card handles invalid config values', async () => {
    const module = new TradingCardModule();
    const context = createBaseContext({
      enabled: true,
      style: 'invalid-style',
      show_ability: undefined,
      show_skills: undefined,
      max_skills: -3,
      custom_title: 'x'.repeat(500),
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('trading-card.svg');
  });

  it('code-dna handles invalid config values', async () => {
    const module = new CodeDNAModule();
    const context = createBaseContext({
      enabled: true,
      shape: 'invalid-shape',
      color_scheme: 'invalid-scheme',
      complexity: 'invalid-complexity',
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('code-dna.svg');
  });

  it('chronicle handles invalid config values', async () => {
    const module = new ChronicleModule();
    const context = createBaseContext({
      enabled: true,
      max_chapters: 0,
      style: 'invalid-style',
      language: 'ja',
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('chronicle.svg');
  });

  it('code-pet handles invalid config values', async () => {
    const module = new CodePetModule();
    const context = createBaseContext({
      enabled: true,
      custom_name: 'p'.repeat(500),
      show_mood: undefined,
      show_stats: undefined,
      animation: undefined,
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('code-pet.svg');
  });

  it('constellation handles invalid config values', async () => {
    const module = new ConstellationModule();
    const context = createBaseContext({
      enabled: true,
      sky_theme: 'invalid-theme',
      show_meteors: undefined,
      show_nebula: undefined,
      max_constellations: -5,
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('constellation.svg');
  });

  it('dev-city handles invalid config values', async () => {
    const module = new DevCityModule();
    const context = createBaseContext({
      enabled: true,
      city_style: 'invalid-style',
      show_weather: undefined,
      show_traffic: undefined,
      animation: undefined,
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('dev-city.svg');
  });

  it('metro-city handles invalid config values', async () => {
    const module = new MetroCityModule();
    const context = createBaseContext({
      enabled: true,
      show_weather: undefined,
      show_traffic: undefined,
      animation: undefined,
    });

    const output = await module.generate(context);
    expect(output.svg).toContain('<svg');
    expect(output.markdown).toContain('metro-city.svg');
  });
});
