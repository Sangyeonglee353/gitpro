// ═══════════════════════════════════════════
// 🧬 Code DNA Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// 개발자의 코딩 패턴으로 세상에 단 하나뿐인
// 시각적 DNA 지문을 생성합니다.
// 같은 DNA 패턴은 절대 나오지 않습니다!

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  CodeDNAConfig,
} from '../../types';
import { analyzeDNA, getCodingStyleInfo } from './dna-analyzer';
import { generateColorPalette } from './dna-colors';
import { renderDNA } from './dna-renderer';

export class CodeDNAModule implements GitProModule {
  readonly id = 'code-dna';
  readonly name = 'Code DNA';
  readonly description = '개발자의 코딩 패턴으로 고유한 시각적 DNA 지문을 생성합니다.';
  readonly icon = '🧬';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, theme } = context;
    const config = moduleConfig as unknown as CodeDNAConfig;

    // 1. DNA 프로파일 분석
    console.log('    🔬 DNA 분석 시작...');
    const profile = analyzeDNA(githubData);
    console.log(`    📊 총 커밋: ${profile.totalCommits}, 레포: ${profile.totalRepos}, 언어: ${profile.languageCount}`);

    // 2. 코딩 스타일 판정
    const styleInfo = getCodingStyleInfo(profile.codingStyle);
    console.log(`    ${styleInfo.icon} 코딩 스타일: ${styleInfo.labelKo} (${styleInfo.labelEn})`);

    // 3. 색상 팔레트 생성
    const palette = generateColorPalette(
      config.color_scheme || 'language',
      profile.languageDistribution,
      profile.codingStyle,
      theme
    );
    console.log(`    🎨 색상 모드: ${config.color_scheme || 'language'}`);

    // 4. 활동 분석 로그
    console.log(`    🌐 다양성 지수: ${(profile.repoDiversity * 100).toFixed(1)}%`);
    console.log(`    📈 활동 밀도: ${(profile.activityDensity * 100).toFixed(1)}%`);

    // 상위 언어 로그
    if (profile.languageDistribution.length > 0) {
      const topLangs = profile.languageDistribution
        .slice(0, 3)
        .map(l => `${l.name} ${l.percent.toFixed(1)}%`)
        .join(', ');
      console.log(`    💻 상위 언어: ${topLangs}`);
    }

    // 커밋 키워드 로그
    if (profile.messageKeywords.length > 0) {
      const topKw = profile.messageKeywords
        .slice(0, 3)
        .map(k => `${k.icon}${k.keyword}(${k.count})`)
        .join(' ');
      console.log(`    📝 커밋 패턴: ${topKw}`);
    }

    // 요일별 활동 로그
    const mostActiveDay = [...profile.weekdayActivity].sort((a, b) => b.activity - a.activity)[0];
    console.log(`    📅 최다 활동 요일: ${mostActiveDay.dayKo}요일 (${mostActiveDay.rawCommits}커밋)`);

    // 5. DNA SVG 렌더링
    console.log(`    🎴 DNA 형태: ${config.shape || 'circular'} / 복잡도: ${config.complexity || 'detailed'}`);
    const svg = renderDNA({
      username: globalConfig.username,
      profile,
      palette,
      config,
      theme,
    });

    // 6. README 마크다운 생성
    const markdown = `<img src="./output/code-dna.svg" alt="Code DNA - ${styleInfo.labelEn}" width="520" />`;

    // 7. 고유 시드 로그 (재현성)
    console.log(`    🔑 DNA 시드: #${profile.uniqueSeed.toString(16).toUpperCase()}`);

    return { svg, markdown };
  }
}
