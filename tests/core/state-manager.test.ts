// ═══════════════════════════════════════════
// 🧪 State Manager 테스트
// ═══════════════════════════════════════════

import * as fs from 'fs';
import * as path from 'path';
import { StateManager } from '../../src/core/state-manager';

jest.mock('fs');
const mockFs = fs as jest.Mocked<typeof fs>;

describe('StateManager', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('초기화', () => {
    it('상태 파일이 없으면 기본 상태를 생성한다', () => {
      mockFs.existsSync.mockReturnValue(false);

      const manager = new StateManager('/test/state');
      const state = manager.getState();

      expect(state.lastUpdated).toBeNull();
      expect(state.pet.species).toBeNull();
      expect(state.pet.exp).toBe(0);
      expect(state.pet.mood).toBe(50);
      expect(state.pet.hunger).toBe(50);
      expect(state.city.tier).toBe(0);
      expect(state.chronicle.currentChapter).toBe(0);
      expect(state.card.seasonNumber).toBe(1);
    });

    it('기존 상태 파일을 올바르게 로드한다', () => {
      const existingState = JSON.stringify({
        lastUpdated: '2024-12-01T00:00:00Z',
        pet: {
          species: 'TypeScriptodon',
          stage: 3,
          exp: 15000,
          mood: 80,
          hunger: 20,
          lastFed: '2024-12-01T00:00:00Z',
          birthDate: '2024-06-01T00:00:00Z',
          abilities: ['Type Guard'],
        },
        city: { tier: 3, population: 1000, buildings: 15, lastWeather: 'sunny' },
        chronicle: { currentChapter: 5, unlockedTitles: ['Hero'], currentQuest: null },
        card: { seasonNumber: 2, cardNumber: 10, highestRarity: 'epic' },
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(existingState);

      const manager = new StateManager('/test/state');
      const state = manager.getState();

      expect(state.pet.species).toBe('TypeScriptodon');
      expect(state.pet.exp).toBe(15000);
      expect(state.city.tier).toBe(3);
      expect(state.card.highestRarity).toBe('epic');
    });

    it('손상된 상태 파일은 기본값으로 폴백한다', () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockImplementation(() => {
        throw new Error('Parse error');
      });

      const manager = new StateManager('/test/state');
      const state = manager.getState();

      expect(state.pet.exp).toBe(0);
      expect(state.city.tier).toBe(0);
    });
  });

  describe('update', () => {
    it('특정 키의 값을 업데이트한다', () => {
      mockFs.existsSync.mockReturnValue(false);

      const manager = new StateManager('/test/state');
      manager.update('pet', {
        species: 'Pythonix',
        stage: 1,
        exp: 1000,
        mood: 60,
        hunger: 40,
        lastFed: '2024-12-01T00:00:00Z',
        birthDate: '2024-11-01T00:00:00Z',
        abilities: [],
      });

      const state = manager.getState();
      expect(state.pet.species).toBe('Pythonix');
      expect(state.pet.exp).toBe(1000);
    });
  });

  describe('merge', () => {
    it('부분 업데이트를 병합한다', () => {
      mockFs.existsSync.mockReturnValue(false);

      const manager = new StateManager('/test/state');
      manager.merge({
        city: { tier: 2, population: 500, buildings: 8, lastWeather: 'rainy' },
      });

      const state = manager.getState();
      expect(state.city.tier).toBe(2);
      expect(state.city.lastWeather).toBe('rainy');
      // 다른 상태는 유지
      expect(state.pet.exp).toBe(0);
    });

    it('깊은 병합으로 중첩 객체의 다른 속성을 보존한다', () => {
      mockFs.existsSync.mockReturnValue(false);

      const manager = new StateManager('/test/state');
      // pet의 exp만 업데이트해도 species, mood 등이 보존되어야 한다
      manager.merge({ pet: { exp: 100 } } as any);

      const state = manager.getState();
      expect(state.pet.exp).toBe(100);
      expect(state.pet.species).toBeNull();
      expect(state.pet.stage).toBe(0);
      expect(state.pet.mood).toBe(50);
      expect(state.pet.hunger).toBe(50);
      expect(state.pet.abilities).toEqual([]);
    });

    it('여러 번 merge해도 이전 속성이 소실되지 않는다', () => {
      mockFs.existsSync.mockReturnValue(false);

      const manager = new StateManager('/test/state');
      manager.merge({ pet: { species: 'TypeScriptodon' } } as any);
      manager.merge({ pet: { exp: 200 } } as any);
      manager.merge({ city: { tier: 2 } } as any);

      const state = manager.getState();
      expect(state.pet.species).toBe('TypeScriptodon');
      expect(state.pet.exp).toBe(200);
      expect(state.pet.mood).toBe(50);
      expect(state.city.tier).toBe(2);
      expect(state.city.population).toBe(0);
    });
  });

  describe('load (깊은 병합)', () => {
    it('부분 저장 상태에서도 기본값 필드가 보존된다', () => {
      // pet의 일부 필드만 저장된 경우
      const partialState = JSON.stringify({
        pet: { exp: 500 },
        city: { tier: 3 },
      });

      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(partialState);

      const manager = new StateManager('/test/state');
      const state = manager.getState();

      expect(state.pet.exp).toBe(500);
      expect(state.pet.species).toBeNull();
      expect(state.pet.mood).toBe(50);
      expect(state.pet.hunger).toBe(50);
      expect(state.pet.abilities).toEqual([]);
      expect(state.city.tier).toBe(3);
      expect(state.city.population).toBe(0);
    });
  });

  describe('save', () => {
    it('상태를 JSON 파일로 저장한다', async () => {
      mockFs.existsSync.mockReturnValue(true);
      mockFs.readFileSync.mockReturnValue(JSON.stringify({
        lastUpdated: null,
        pet: { species: null, stage: 0, exp: 0, mood: 50, hunger: 50, lastFed: null, birthDate: null, abilities: [] },
        city: { tier: 0, population: 0, buildings: 0, lastWeather: 'sunny' },
        chronicle: { currentChapter: 0, unlockedTitles: [], currentQuest: null },
        card: { seasonNumber: 1, cardNumber: 1, highestRarity: 'common' },
      }));
      mockFs.writeFileSync.mockImplementation(() => {});

      const manager = new StateManager('/test/state');
      await manager.save();

      expect(mockFs.writeFileSync).toHaveBeenCalledTimes(1);
      const [filePath, content] = mockFs.writeFileSync.mock.calls[0] as [string, string, string];
      expect(filePath).toContain('gitpro-state.json');

      const saved = JSON.parse(content);
      expect(saved.lastUpdated).not.toBeNull();
    });

    it('디렉토리가 없으면 생성한다', async () => {
      // 첫 번째 호출은 상태 파일 존재 여부, 두 번째는 디렉토리 존재 여부
      mockFs.existsSync
        .mockReturnValueOnce(false) // load시 파일 없음
        .mockReturnValueOnce(false); // save시 디렉토리 없음
      mockFs.mkdirSync.mockImplementation(() => '' as any);
      mockFs.writeFileSync.mockImplementation(() => {});

      const manager = new StateManager('/test/state');
      await manager.save();

      expect(mockFs.mkdirSync).toHaveBeenCalledWith(
        expect.any(String),
        { recursive: true }
      );
    });
  });
});
