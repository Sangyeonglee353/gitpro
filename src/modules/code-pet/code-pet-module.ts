// ═══════════════════════════════════════════
// 🐾 Code Pet Module - 메인 모듈 클래스
// ═══════════════════════════════════════════
//
// GitHub 활동으로 키우는 다마고치 스타일 가상 펫.
// 커밋/PR/이슈 활동이 펫의 먹이가 되어 경험치를 얻고,
// 일정 EXP에 도달하면 진화합니다!

import {
  GitProModule,
  ModuleContext,
  ModuleOutput,
  CodePetConfig,
  PetState,
} from '../../types';
import {
  determineSpecies,
  getEvolutionStage,
  getPetMood,
  EVOLUTION_STAGES,
} from './pet-species';
import { calculateExp, calculatePetAge, getActivityStatus } from './exp-calculator';
import { renderPetCard } from './pet-renderer';

export class CodePetModule implements GitProModule {
  readonly id = 'code-pet';
  readonly name = 'Code Pet';
  readonly description = 'GitHub 활동으로 키우는 다마고치 스타일 가상 펫을 생성합니다.';
  readonly icon = '🐾';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    const { githubData, moduleConfig, globalConfig, state, theme } = context;
    const config = moduleConfig as unknown as CodePetConfig;
    const petState = state.pet;

    // 1. 펫 종류 결정 (첫 실행 or 변경)
    const species = determineSpecies(githubData.languages);
    const isNewPet = petState.species === null;
    const speciesChanged = !isNewPet && petState.species !== species.id;

    if (isNewPet) {
      console.log(`    🥚 새로운 펫 탄생! ${species.emoji} ${species.name}`);
    } else if (speciesChanged) {
      console.log(`    🔄 주 언어 변경으로 펫 종 업데이트: ${species.emoji} ${species.name}`);
    } else {
      console.log(`    🐾 기존 펫 로드: ${species.emoji} ${species.name}`);
    }

    // 2. EXP 계산
    const expReport = calculateExp(githubData, petState);
    console.log(`    📊 EXP 획득: +${expReport.totalGained} (총 ${expReport.newTotalExp})`);

    // 3. 진화 단계 판정
    const previousStage = getEvolutionStage(petState.exp);
    const currentStage = getEvolutionStage(expReport.newTotalExp);
    const evolved = currentStage.stage > previousStage.stage;

    if (evolved) {
      console.log(`    🎉 진화! ${previousStage.emoji} ${previousStage.formTitleKo} → ${currentStage.emoji} ${currentStage.formTitleKo}`);
      console.log(`       "${currentStage.unlockMessageKo}"`);
    } else {
      console.log(`    ${currentStage.emoji} 현재 단계: ${currentStage.formTitleKo} (Stage ${currentStage.stage})`);
    }

    // 4. 기분 & 활동 상태
    const mood = getPetMood(expReport.newMood);
    const activityStatus = getActivityStatus(githubData);
    console.log(`    ${mood.emoji} 기분: ${mood.labelKo} | ${activityStatus.icon} ${activityStatus.statusKo}`);

    // 5. 펫 나이 계산
    const birthDate = petState.birthDate || new Date().toISOString();
    const petAge = calculatePetAge(birthDate);

    // 6. SVG 렌더링
    const svg = renderPetCard({
      username: globalConfig.username,
      species,
      stage: currentStage,
      currentExp: expReport.newTotalExp,
      mood,
      hunger: expReport.newHunger,
      expReport,
      petAge,
      customName: config.custom_name || '',
      activityStatus,
      config,
      theme,
    });

    // 7. README 마크다운 생성
    const markdown = `<img src="./output/code-pet.svg" alt="Code Pet - ${species.name}" width="480" />`;

    // 8. 상태 업데이트
    const newPetState: PetState = {
      species: species.id,
      stage: currentStage.stage,
      exp: expReport.newTotalExp,
      mood: expReport.newMood,
      hunger: expReport.newHunger,
      lastFed: expReport.totalGained > 0 ? new Date().toISOString() : petState.lastFed,
      birthDate,
      abilities: petState.abilities, // 기존 어빌리티 유지
    };

    const stateUpdate = {
      pet: newPetState,
    };

    // EXP 내역 로그
    if (expReport.breakdown.length > 0) {
      console.log('    ── EXP 내역 ──');
      for (const item of expReport.breakdown) {
        console.log(`       ${item.icon} ${item.sourceKo}: +${item.amount}`);
      }
    }

    // 펫 반응 로그
    if (expReport.reactions.length > 0) {
      const r = expReport.reactions[0];
      console.log(`    💬 "${r.messageKo}"`);
    }

    return { svg, markdown, stateUpdate };
  }
}
