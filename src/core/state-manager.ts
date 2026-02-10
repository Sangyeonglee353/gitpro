// ═══════════════════════════════════════════
// 💾 State Manager - 영구 상태 관리
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { GitProState } from '../types';

const DEFAULT_STATE: GitProState = {
  lastUpdated: null,
  pet: {
    species: null,
    stage: 0,
    exp: 0,
    mood: 50,
    hunger: 50,
    lastFed: null,
    birthDate: null,
    abilities: [],
  },
  city: {
    tier: 0,
    population: 0,
    buildings: 0,
    lastWeather: 'sunny',
  },
  chronicle: {
    currentChapter: 0,
    unlockedTitles: [],
    currentQuest: null,
  },
  card: {
    seasonNumber: 1,
    cardNumber: 1,
    highestRarity: 'common',
  },
};

export class StateManager {
  private state: GitProState;
  private filePath: string;

  constructor(stateDir?: string) {
    const dir = stateDir || path.resolve(process.cwd(), 'state');
    this.filePath = path.join(dir, 'gitpro-state.json');
    this.state = this.load();
  }

  /**
   * 상태 파일을 로드합니다. 파일이 없으면 기본값을 반환합니다.
   */
  private load(): GitProState {
    try {
      if (fs.existsSync(this.filePath)) {
        const content = fs.readFileSync(this.filePath, 'utf-8');
        const parsed = JSON.parse(content) as Partial<GitProState>;
        // 기본값과 병합 (새 필드가 추가되어도 안전)
        return { ...DEFAULT_STATE, ...parsed };
      }
    } catch (error) {
      console.warn(`⚠️  상태 파일 로드 실패, 기본값 사용: ${error}`);
    }
    return { ...DEFAULT_STATE };
  }

  /**
   * 현재 상태를 반환합니다.
   */
  getState(): GitProState {
    return this.state;
  }

  /**
   * 특정 모듈의 상태를 업데이트합니다.
   */
  update(key: keyof GitProState, value: unknown): void {
    (this.state as unknown as Record<string, unknown>)[key] = value;
  }

  /**
   * 부분 업데이트를 적용합니다.
   */
  merge(updates: Partial<GitProState>): void {
    this.state = { ...this.state, ...updates };
  }

  /**
   * 상태를 파일에 저장합니다.
   */
  async save(): Promise<void> {
    this.state.lastUpdated = new Date().toISOString();

    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(
      this.filePath,
      JSON.stringify(this.state, null, 2),
      'utf-8'
    );
    console.log(`💾 상태 저장 완료: ${this.filePath}`);
  }
}
