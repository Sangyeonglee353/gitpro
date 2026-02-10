// ═══════════════════════════════════════════
// 🐾 Pet Species - 펫 종류 & 진화 시스템
// ═══════════════════════════════════════════
//
// 주 사용 언어에 따라 펫이 자동 결정됩니다.
// 각 펫은 5단계 진화 시스템을 가집니다.

/** 펫 종 정보 */
export interface PetSpecies {
  id: string;
  name: string;
  emoji: string;
  element: string;
  elementEmoji: string;
  color: string;
  secondaryColor: string;
}

/** 진화 단계 정보 */
export interface EvolutionStage {
  stage: number;
  name: string;
  emoji: string;
  requiredExp: number;
  formTitle: string;
  formTitleKo: string;
  unlockMessage: string;
  unlockMessageKo: string;
}

/** 펫 기분 상태 */
export interface PetMood {
  id: string;
  emoji: string;
  label: string;
  labelKo: string;
  range: [number, number]; // [min, max] mood 값 범위
}

// ── 펫 종류 매핑 (주 언어 → 펫) ──────────────────

const SPECIES_MAP: Record<string, PetSpecies> = {
  TypeScript: {
    id: 'typescriptodon',
    name: 'TypeScriptodon',
    emoji: '🐲',
    element: 'Electric',
    elementEmoji: '⚡',
    color: '#3178c6',
    secondaryColor: '#235a97',
  },
  Python: {
    id: 'pythonix',
    name: 'Pythonix',
    emoji: '🐍',
    element: 'Fire',
    elementEmoji: '🔥',
    color: '#3572A5',
    secondaryColor: '#ffd43b',
  },
  JavaScript: {
    id: 'javascripmunk',
    name: 'JavaScripmunk',
    emoji: '🐿️',
    element: 'Wind',
    elementEmoji: '💨',
    color: '#f1e05a',
    secondaryColor: '#d4a574',
  },
  Java: {
    id: 'javantine',
    name: 'Javantine',
    emoji: '🐘',
    element: 'Rock',
    elementEmoji: '🪨',
    color: '#b07219',
    secondaryColor: '#8B8B8B',
  },
  Go: {
    id: 'gopher',
    name: 'Gopher',
    emoji: '🐹',
    element: 'Grass',
    elementEmoji: '🌿',
    color: '#00ADD8',
    secondaryColor: '#E0D4B8',
  },
  Rust: {
    id: 'rustacean',
    name: 'Rustacean',
    emoji: '🦀',
    element: 'Steel',
    elementEmoji: '⚙️',
    color: '#dea584',
    secondaryColor: '#B7410E',
  },
  C: {
    id: 'cplusaur',
    name: 'Cplusaur',
    emoji: '🦕',
    element: 'Earth',
    elementEmoji: '🌍',
    color: '#555555',
    secondaryColor: '#A8B9CC',
  },
  'C++': {
    id: 'cplusaur',
    name: 'Cplusaur',
    emoji: '🦕',
    element: 'Earth',
    elementEmoji: '🌍',
    color: '#f34b7d',
    secondaryColor: '#00599C',
  },
  Kotlin: {
    id: 'kotlini',
    name: 'Kotlini',
    emoji: '🦊',
    element: 'Light',
    elementEmoji: '✨',
    color: '#A97BFF',
    secondaryColor: '#F88909',
  },
  Swift: {
    id: 'swiftern',
    name: 'Swiftern',
    emoji: '🦅',
    element: 'Wind',
    elementEmoji: '💨',
    color: '#F05138',
    secondaryColor: '#FF8C38',
  },
  Ruby: {
    id: 'rubeon',
    name: 'Rubeon',
    emoji: '💎',
    element: 'Ice',
    elementEmoji: '❄️',
    color: '#701516',
    secondaryColor: '#CC342D',
  },
};

const DEFAULT_SPECIES: PetSpecies = {
  id: 'codemander',
  name: 'Codemander',
  emoji: '🐣',
  element: 'Neutral',
  elementEmoji: '💻',
  color: '#6C63FF',
  secondaryColor: '#4A4A4A',
};

// ── 진화 단계 ──────────────────

export const EVOLUTION_STAGES: EvolutionStage[] = [
  {
    stage: 0,
    name: 'Egg',
    emoji: '🥚',
    requiredExp: 0,
    formTitle: 'Egg',
    formTitleKo: '알',
    unlockMessage: 'A new life has been born!',
    unlockMessageKo: '새로운 생명이 태어났습니다!',
  },
  {
    stage: 1,
    name: 'Baby',
    emoji: '🐣',
    requiredExp: 1_000,
    formTitle: 'Baby Form',
    formTitleKo: '아기 형태',
    unlockMessage: 'Your pet has hatched! It looks at you curiously.',
    unlockMessageKo: '펫이 부화했습니다! 호기심 가득한 눈으로 바라봅니다.',
  },
  {
    stage: 2,
    name: 'Teen',
    emoji: '🐥',
    requiredExp: 5_000,
    formTitle: 'Teen Form',
    formTitleKo: '청소년 형태',
    unlockMessage: 'Evolution! Elemental effects have been added!',
    unlockMessageKo: '진화! 속성 이펙트가 추가되었습니다!',
  },
  {
    stage: 3,
    name: 'Adult',
    emoji: '🐲',
    requiredExp: 15_000,
    formTitle: 'Adult Form',
    formTitleKo: '성체',
    unlockMessage: 'Full evolution! Special skills unlocked!',
    unlockMessageKo: '완전 진화! 특수 스킬이 해금되었습니다!',
  },
  {
    stage: 4,
    name: 'Legend',
    emoji: '👑',
    requiredExp: 50_000,
    formTitle: 'Legend Form',
    formTitleKo: '전설 형태',
    unlockMessage: 'LEGENDARY EVOLUTION! Crown + Aura + Hologram!',
    unlockMessageKo: '전설 진화! 왕관 + 아우라 + 홀로그램!',
  },
];

// ── 기분 시스템 ──────────────────

export const PET_MOODS: PetMood[] = [
  { id: 'ecstatic', emoji: '🤩', label: 'Ecstatic', labelKo: '최고 행복', range: [90, 100] },
  { id: 'happy', emoji: '😊', label: 'Happy', labelKo: '행복', range: [70, 89] },
  { id: 'content', emoji: '🙂', label: 'Content', labelKo: '만족', range: [50, 69] },
  { id: 'neutral', emoji: '😐', label: 'Neutral', labelKo: '보통', range: [30, 49] },
  { id: 'hungry', emoji: '😢', label: 'Hungry', labelKo: '배고픔', range: [10, 29] },
  { id: 'sad', emoji: '😭', label: 'Very Hungry', labelKo: '매우 배고픔', range: [0, 9] },
];

// ── 유틸 함수 ──────────────────

/**
 * 주 사용 언어에 따라 펫 종류를 결정합니다.
 */
export function determineSpecies(languages: Record<string, number>): PetSpecies {
  const sorted = Object.entries(languages).sort((a, b) => b[1] - a[1]);
  if (sorted.length === 0) return DEFAULT_SPECIES;

  const primaryLang = sorted[0][0];
  return SPECIES_MAP[primaryLang] || DEFAULT_SPECIES;
}

/**
 * 현재 EXP에 해당하는 진화 단계를 반환합니다.
 */
export function getEvolutionStage(exp: number): EvolutionStage {
  let currentStage = EVOLUTION_STAGES[0];
  for (const stage of EVOLUTION_STAGES) {
    if (exp >= stage.requiredExp) {
      currentStage = stage;
    } else {
      break;
    }
  }
  return currentStage;
}

/**
 * 다음 진화까지 필요한 EXP를 계산합니다.
 */
export function getExpToNextEvolution(exp: number): { next: EvolutionStage | null; remaining: number; progress: number } {
  const currentStage = getEvolutionStage(exp);
  const nextStageIdx = EVOLUTION_STAGES.findIndex(s => s.stage === currentStage.stage) + 1;

  if (nextStageIdx >= EVOLUTION_STAGES.length) {
    return { next: null, remaining: 0, progress: 100 };
  }

  const nextStage = EVOLUTION_STAGES[nextStageIdx];
  const remaining = nextStage.requiredExp - exp;
  const stageRange = nextStage.requiredExp - currentStage.requiredExp;
  const progressInStage = exp - currentStage.requiredExp;
  const progress = stageRange > 0 ? Math.min(100, Math.round((progressInStage / stageRange) * 100)) : 100;

  return { next: nextStage, remaining, progress };
}

/**
 * mood 값에 해당하는 기분을 반환합니다.
 */
export function getPetMood(mood: number): PetMood {
  const clampedMood = Math.max(0, Math.min(100, mood));
  for (const m of PET_MOODS) {
    if (clampedMood >= m.range[0] && clampedMood <= m.range[1]) {
      return m;
    }
  }
  return PET_MOODS[PET_MOODS.length - 1];
}
