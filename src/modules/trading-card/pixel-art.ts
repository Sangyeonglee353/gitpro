// ═══════════════════════════════════════════
// 🎨 Pixel Art Generator - SVG 픽셀아트 캐릭터
// ═══════════════════════════════════════════
//
// 각 캐릭터 타입에 맞는 8x8 ~ 12x12 픽셀아트를
// SVG rect 그리드로 렌더링합니다.

/**
 * 픽셀아트 데이터 정의
 * 0 = 투명, 1~9 = 팔레트 인덱스
 */
interface PixelArtData {
  grid: number[][];
  palette: Record<number, string>;
}

/**
 * 캐릭터 타입별 픽셀아트 데이터
 */
const CHARACTER_PIXEL_ART: Record<string, PixelArtData> = {
  // 🐲 드래곤 (TypeScript)
  Mage: {
    grid: [
      [0, 0, 0, 1, 1, 0, 0, 0, 0, 0],
      [0, 0, 1, 2, 2, 1, 0, 0, 0, 0],
      [0, 1, 2, 3, 3, 2, 1, 0, 0, 0],
      [0, 1, 3, 4, 4, 3, 1, 0, 0, 0],
      [1, 2, 3, 3, 3, 3, 2, 1, 0, 0],
      [1, 2, 5, 3, 3, 5, 2, 1, 0, 0],
      [0, 1, 3, 6, 6, 3, 1, 0, 0, 0],
      [0, 0, 1, 3, 3, 1, 0, 7, 7, 0],
      [0, 1, 2, 2, 2, 2, 1, 7, 8, 7],
      [1, 2, 2, 2, 2, 2, 2, 1, 7, 0],
      [0, 1, 2, 2, 2, 2, 1, 0, 0, 0],
      [0, 0, 1, 1, 1, 1, 0, 0, 0, 0],
    ],
    palette: {
      1: '#1a1a2e', // 외곽
      2: '#3178c6', // TypeScript 블루
      3: '#4a90d9', // 밝은 블루
      4: '#ffffff', // 눈 하이라이트
      5: '#ff4444', // 눈
      6: '#2d5f9a', // 입
      7: '#ffd700', // 지팡이
      8: '#ff6b6b', // 보석
    },
  },

  // 🐿️ 다람쥐 (JavaScript)
  Trickster: {
    grid: [
      [0, 0, 1, 0, 0, 0, 1, 0, 0, 0],
      [0, 1, 2, 1, 0, 1, 2, 1, 0, 0],
      [0, 1, 2, 2, 1, 2, 2, 1, 0, 0],
      [1, 2, 3, 2, 2, 2, 3, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 2, 1, 0],
      [1, 2, 4, 2, 2, 4, 2, 2, 1, 0],
      [0, 1, 2, 2, 5, 2, 2, 1, 0, 0],
      [0, 0, 1, 2, 2, 2, 1, 0, 0, 0],
      [0, 1, 6, 6, 6, 6, 6, 1, 0, 0],
      [0, 1, 6, 6, 6, 6, 6, 1, 0, 0],
      [0, 0, 1, 1, 0, 1, 1, 0, 0, 7],
      [0, 0, 0, 0, 0, 0, 0, 0, 7, 7],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#d4a574',
      3: '#ffffff',
      4: '#2d2d2d',
      5: '#ff9999',
      6: '#f1e05a', // JS 옐로우
      7: '#c4915e', // 꼬리
    },
  },

  // 🐍 피닉스뱀 (Python)
  Sage: {
    grid: [
      [0, 0, 0, 0, 1, 1, 0, 0, 0, 0],
      [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
      [0, 0, 1, 2, 3, 3, 2, 1, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 2, 4, 2, 4, 2, 2, 1, 0],
      [0, 1, 2, 2, 5, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 6, 6, 6, 6, 2, 2, 1],
      [0, 1, 1, 1, 1, 1, 1, 1, 1, 0],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#3572A5', // Python 블루
      3: '#ffd700', // 왕관
      4: '#ffcc00', // 눈
      5: '#ff6b6b', // 혀
      6: '#4B8BBE', // 밝은 블루
    },
  },

  // 🐘 코끼리 (Java)
  Guardian: {
    grid: [
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 3, 2, 2, 2, 3, 2, 2, 1],
      [1, 2, 2, 2, 4, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 1, 5, 2, 2, 2, 2, 5, 1, 0],
      [0, 1, 5, 2, 2, 2, 2, 5, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 6, 6, 6, 6, 6, 6, 1, 0],
      [0, 1, 6, 6, 6, 6, 6, 6, 1, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#8B8B8B',
      3: '#ffffff',
      4: '#b07219', // Java 오렌지
      5: '#A0A0A0', // 귀
      6: '#b07219', // Java 색상 갑옷
    },
  },

  // 🐹 고퍼 (Go)
  Scout: {
    grid: [
      [0, 0, 1, 1, 1, 1, 1, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [1, 2, 2, 2, 2, 2, 2, 2, 2, 1],
      [1, 2, 3, 4, 2, 2, 3, 4, 2, 1],
      [1, 2, 2, 2, 5, 2, 2, 2, 2, 1],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 6, 6, 2, 1, 0, 0],
      [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
      [0, 0, 1, 7, 7, 7, 7, 1, 0, 0],
      [0, 1, 7, 7, 7, 7, 7, 7, 1, 0],
      [0, 1, 7, 7, 7, 7, 7, 7, 1, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#E0D4B8', // 고퍼 색
      3: '#ffffff',
      4: '#2d2d2d',
      5: '#D4A574', // 코
      6: '#ffffff', // 이
      7: '#00ADD8', // Go 블루
    },
  },

  // 🦀 게 (Rust)
  Blacksmith: {
    grid: [
      [1, 0, 0, 0, 0, 0, 0, 0, 0, 1],
      [1, 1, 0, 0, 0, 0, 0, 0, 1, 1],
      [0, 1, 0, 1, 1, 1, 1, 0, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 2, 3, 2, 2, 3, 2, 1, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 1, 2, 2, 4, 4, 2, 2, 1, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 5, 5, 5, 5, 5, 5, 1, 0],
      [1, 5, 5, 5, 5, 5, 5, 5, 5, 1],
      [1, 1, 5, 5, 5, 5, 5, 5, 1, 1],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#dea584', // Rust 색
      3: '#ffffff',
      4: '#ff6347', // 입
      5: '#B7410E', // 갑각
    },
  },

  // 기본 코더
  Coder: {
    grid: [
      [0, 0, 0, 1, 1, 1, 1, 0, 0, 0],
      [0, 0, 1, 2, 2, 2, 2, 1, 0, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 1, 2, 3, 2, 2, 3, 2, 1, 0],
      [0, 1, 2, 2, 2, 2, 2, 2, 1, 0],
      [0, 0, 1, 2, 4, 4, 2, 1, 0, 0],
      [0, 0, 0, 1, 2, 2, 1, 0, 0, 0],
      [0, 0, 1, 5, 5, 5, 5, 1, 0, 0],
      [0, 1, 5, 5, 6, 6, 5, 5, 1, 0],
      [0, 1, 5, 5, 5, 5, 5, 5, 1, 0],
      [0, 0, 1, 5, 5, 5, 5, 1, 0, 0],
      [0, 0, 1, 1, 0, 0, 1, 1, 0, 0],
    ],
    palette: {
      1: '#1a1a1a',
      2: '#F5CBA7', // 피부
      3: '#2d2d2d', // 눈
      4: '#ff9999', // 입
      5: '#4A4A4A', // 옷
      6: '#6C63FF', // 로고
    },
  },
};

// 추가 캐릭터 매핑 (같은 픽셀아트를 공유)
const CHARACTER_ALIAS: Record<string, string> = {
  Primal: 'Guardian',     // C → Java 스타일 변형
  Paladin: 'Guardian',    // C# → Java 스타일 변형
  Enchanter: 'Sage',      // Ruby → Python 스타일 변형
  Alchemist: 'Sage',      // PHP
  Hawk: 'Trickster',      // Swift
  Fox: 'Trickster',       // Kotlin
  Ranger: 'Scout',        // Dart
  Hacker: 'Coder',        // Shell
  Architect: 'Coder',     // HTML
  Artist: 'Coder',        // CSS
  Artisan: 'Trickster',   // Vue
  Ancient: 'Blacksmith',  // C++
};

/**
 * 캐릭터 타입에 맞는 픽셀아트 SVG를 렌더링합니다.
 */
export function renderPixelArtCharacter(
  characterType: string,
  x: number,
  y: number,
  width: number,
  height: number,
  options: {
    glowColor?: string;
    animate?: boolean;
  } = {}
): string {
  const artKey = CHARACTER_ALIAS[characterType] || characterType;
  const artData = CHARACTER_PIXEL_ART[artKey] || CHARACTER_PIXEL_ART['Coder'];

  const rows = artData.grid.length;
  const cols = artData.grid[0].length;
  const pixelW = width / cols;
  const pixelH = height / rows;

  let svg = '';

  // 글로우 효과 (배경)
  if (options.glowColor) {
    svg += `<rect x="${x - 4}" y="${y - 4}" width="${width + 8}" height="${height + 8}" rx="6" ry="6" fill="${options.glowColor}" opacity="0.15">`;
    if (options.animate) {
      svg += `<animate attributeName="opacity" values="0.1;0.25;0.1" dur="2s" repeatCount="indefinite"/>`;
    }
    svg += `</rect>`;
  }

  // 픽셀 렌더링
  for (let row = 0; row < rows; row++) {
    for (let col = 0; col < cols; col++) {
      const val = artData.grid[row][col];
      if (val === 0) continue;

      const color = artData.palette[val] || '#888888';
      const px = x + col * pixelW;
      const py = y + row * pixelH;

      svg += `<rect x="${px.toFixed(1)}" y="${py.toFixed(1)}" width="${(pixelW + 0.5).toFixed(1)}" height="${(pixelH + 0.5).toFixed(1)}" fill="${color}"/>`;
    }
  }

  // 호흡 애니메이션
  if (options.animate) {
    svg = `<g>
      <animateTransform attributeName="transform" type="translate" values="0,0;0,-2;0,0" dur="3s" repeatCount="indefinite"/>
      ${svg}
    </g>`;
  }

  return svg;
}

/**
 * 간단한 이모지 대체 (SVG 텍스트 기반)
 * 픽셀아트가 없는 경우 폴백으로 사용
 */
export function renderEmojiCharacter(
  emoji: string,
  x: number,
  y: number,
  size: number
): string {
  return `<text x="${x}" y="${y}" text-anchor="middle" dominant-baseline="central" font-size="${size}">${emoji}</text>`;
}
