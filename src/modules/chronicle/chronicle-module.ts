// ═══════════════════════════════════════════
// 📜 Chronicle Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// GitHub 활동을 RPG 퀘스트 로그처럼 시각화하는
// 개발자 연대기를 생성합니다.
// 4가지 스타일: rpg, book, timeline, comic

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  ChronicleConfig,
  ChronicleState,
} from '../../types';
import { analyzeChronicle, getChapterTitleKo } from './chronicle-analyzer';
import { renderChronicle } from './chronicle-renderer';

export class ChronicleModule implements GitProModule {
  readonly id = 'chronicle';
  readonly name = 'Dev Chronicle';
  readonly description = 'GitHub 활동을 RPG 퀘스트 로그 형식의 개발자 연대기로 시각화합니다.';
  readonly icon = '📜';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, theme, state } = context;
    const config = moduleConfig as unknown as ChronicleConfig;
    const chronicleState = state.chronicle;

    // 1. 연대기 분석
    console.log('    📖 연대기 분석 시작...');
    const maxChapters = config.max_chapters || 8;
    const profile = analyzeChronicle(githubData, maxChapters, chronicleState);

    console.log(`    📊 총 ${profile.chapters.length}개 챕터 감지됨`);
    console.log(`    🏷️ 칭호: ${profile.devTitle}`);
    console.log(`    📈 레벨: Lv.${profile.devLevel} (EXP: ${profile.totalExp})`);

    // 2. 챕터 요약 로그
    for (const ch of profile.chapters) {
      const title = config.language === 'en' ? ch.title : getChapterTitleKo(ch);
      console.log(`    ${ch.icon} Ch.${ch.number} [${ch.rank}] ${title}`);
    }

    // 3. 활성 퀘스트 로그
    if (profile.activeQuest) {
      console.log(`    🎯 진행 중: ${profile.activeQuest.name} (${profile.activeQuest.progress}%)`);
    }

    // 4. 여정 통계 로그
    console.log(`    🗓️ 여정: ${profile.summary.journeyDays}일 (${profile.summary.firstEventDate} ~ ${profile.summary.latestEventDate})`);
    console.log(`    💻 총 ${profile.summary.totalCommits} 커밋 · ${profile.summary.reposCreated} 레포 · ${profile.summary.languagesLearned} 언어`);

    // 5. SVG 렌더링
    console.log(`    🎴 스타일: ${config.style || 'rpg'} / 언어: ${config.language || 'ko'}`);
    const svg = renderChronicle({
      username: globalConfig.username,
      profile,
      config,
      theme,
    });

    // 6. README 마크다운 생성
    const markdown = `<img src="./output/chronicle.svg" alt="Dev Chronicle - ${profile.devTitle}" width="520" />`;

    // 7. 상태 업데이트
    const stateUpdate: Partial<{ chronicle: ChronicleState }> = {
      chronicle: {
        currentChapter: profile.chapters.length,
        unlockedTitles: profile.chapters.map(ch => ch.title),
        currentQuest: profile.activeQuest
          ? {
              type: profile.activeQuest.name,
              progress: profile.activeQuest.progress,
            }
          : null,
      },
    };

    return { svg, markdown, stateUpdate: stateUpdate as Record<string, unknown> };
  }
}
