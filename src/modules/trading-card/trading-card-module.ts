// ═══════════════════════════════════════════
// 🃏 Trading Card Module - 메인 모듈 클래스
// ═══════════════════════════════════════════

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  TradingCardConfig,
} from '../../types';
import { calculateStats, determineRarity, determineCharacterType } from './stats-calculator';
import { detectAbilities } from './ability-detector';
import { renderCard } from './card-renderer';

function normalizeTradingCardConfig(
  config: Partial<TradingCardConfig> | undefined
): TradingCardConfig {
  const style = config?.style;
  const safeStyle =
    style === 'hologram' || style === 'pixel' || style === 'minimal' || style === 'anime'
      ? style
      : 'hologram';

  const maxSkillsRaw = config?.max_skills;
  const max_skills =
    typeof maxSkillsRaw === 'number' && Number.isFinite(maxSkillsRaw)
      ? Math.max(1, Math.min(10, Math.floor(maxSkillsRaw)))
      : 5;

  const custom_title = (config?.custom_title || '').slice(0, 80);

  return {
    enabled: config?.enabled ?? true,
    style: safeStyle,
    show_ability: config?.show_ability ?? true,
    show_skills: config?.show_skills ?? true,
    max_skills,
    custom_title,
  };
}

export class TradingCardModule implements GitProModule {
  readonly id = 'trading-card';
  readonly name = 'Dev Trading Card';
  readonly description = '포켓몬 스타일 개발자 트레이딩 카드를 생성합니다.';
  readonly icon = '🃏';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, state, theme } = context;
    const config = normalizeTradingCardConfig(moduleConfig as Partial<TradingCardConfig>);

    // 1. 스탯 산출
    const stats = calculateStats(githubData);
    console.log(`    📊 스탯 산출: ATK=${stats.atk} DEF=${stats.def} INT=${stats.int} SPD=${stats.spd} (총합: ${stats.total})`);

    // 2. 레어도 판정
    const rarity = determineRarity(stats.total);
    console.log(`    ✨ 레어도: ${rarity.label}`);

    // 3. 캐릭터 타입 결정
    const characterType = determineCharacterType(githubData.languages);
    console.log(`    🎭 캐릭터: ${characterType.emoji} ${characterType.title}`);

    // 4. 스페셜 어빌리티 감지
    const abilities = config.show_ability ? detectAbilities(githubData) : [];
    if (abilities.length > 0) {
      console.log(`    🔥 어빌리티: ${abilities.map(a => `${a.icon} ${a.name}`).join(', ')}`);
    }

    // 5. 상위 언어 추출
    const totalLangSize = Object.values(githubData.languages).reduce((a, b) => a + b, 0);
    const topLanguages = Object.entries(githubData.languages)
      .sort((a, b) => b[1] - a[1])
      .slice(0, config.max_skills)
      .map(([name, size]) => ({
        name,
        percent: totalLangSize > 0 ? (size / totalLangSize) * 100 : 0,
      }));

    // 6. 카드 SVG 렌더링
    const svg = renderCard({
      username: globalConfig.username,
      characterType,
      stats,
      rarity,
      abilities,
      topLanguages,
      customTitle: config.custom_title,
      config,
      theme,
      seasonNumber: state.card.seasonNumber,
      cardNumber: state.card.cardNumber,
    });

    // 7. README 마크다운 생성
    const markdown = `<img src="./output/trading-card.svg" alt="Dev Trading Card" width="420" />`;

    // 8. 상태 업데이트
    const stateUpdate = {
      card: {
        ...state.card,
        highestRarity:
          getRarityRank(rarity.name) > getRarityRank(state.card.highestRarity)
            ? rarity.name
            : state.card.highestRarity,
      },
    };

    return { svg, markdown, stateUpdate };
  }
}

function getRarityRank(rarity: string): number {
  const ranks: Record<string, number> = {
    common: 0,
    uncommon: 1,
    rare: 2,
    epic: 3,
    legendary: 4,
  };
  return ranks[rarity] || 0;
}
