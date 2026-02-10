<p align="center">
  <img src="https://img.shields.io/badge/gitpro-v1.0.0-6C63FF?style=for-the-badge&logo=github&logoColor=white" alt="gitpro version" />
  <img src="https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/GitHub_Actions-2088FF?style=for-the-badge&logo=github-actions&logoColor=white" alt="GitHub Actions" />
  <img src="https://img.shields.io/badge/License-MIT-green?style=for-the-badge" alt="MIT License" />
</p>

<h1 align="center">🎮 gitpro</h1>
<p align="center">
  <strong>All-in-One GitHub Profile Suite</strong><br/>
  6개의 독창적인 시각화 모듈로 당신의 GitHub 프로필을 꾸며보세요
</p>

<p align="center">
  <a href="#-모듈-소개">모듈 소개</a> •
  <a href="#-빠른-시작">빠른 시작</a> •
  <a href="#%EF%B8%8F-설정">설정</a> •
  <a href="#-테마">테마</a> •
  <a href="#-고급-사용법">고급 사용법</a> •
  <a href="#-기여하기">기여하기</a>
</p>

---

## ✨ 특징

- 🎮 **6개의 독창적인 모듈** — 트레이딩 카드, 코드 DNA, 연대기, 코드 펫, 별자리, 개발자 도시
- 🎨 **11가지 빌트인 테마** + 커스텀 테마 지원
- ⚡ **YAML 설정 파일 하나로 모든 모듈 제어** — `gitpro.config.yml`
- 🔄 **GitHub Actions 자동화** — 6시간마다 자동 업데이트
- 📌 **Gist 연동** — Pinned Gist에 SVG 업로드
- 🌍 **다국어 지원** — 한국어, 영어, 일본어
- 💾 **영구 상태 관리** — 펫 성장, 도시 발전, 연대기 진행 등이 누적

---

## 🎯 모듈 소개

### 🃏 Dev Trading Card
GitHub 활동을 기반으로 ATK, DEF, INT, SPD 스탯이 계산되는 **개발자 트레이딩 카드**를 생성합니다.
- 레어도 시스템: Common → Uncommon → Rare → Epic → Legendary
- 특수 어빌리티 자동 감지 (Midnight Surge, Polyglot 등)
- 스타일: `hologram` | `pixel` | `minimal` | `anime`

### 🧬 Code DNA
커밋 패턴, 언어 분포, 코딩 시간대를 분석하여 당신만의 **코드 DNA 지문**을 시각화합니다.
- 고유 DNA 시드 생성 (동일 데이터 = 동일 패턴)
- 코딩 스타일 분류: 야행성, 아침형, 주간형, 밸런스
- 형태: `circular` | `helix` | `spiral` | `fingerprint`

### 📜 Dev Chronicle
GitHub 마일스톤을 RPG 스타일의 **개발자 연대기**로 변환합니다.
- 챕터 자동 생성 (첫 커밋, 첫 PR, 새 언어 학습 등)
- 활성 퀘스트 감지 (30일 연속 커밋 등)
- 개발자 칭호 시스템

### 🐾 Code Pet
커밋, PR, 이슈 활동에 따라 성장하는 **코드 펫**을 키워보세요.
- EXP 시스템으로 펫 진화
- 기분(mood)과 배고픔(hunger) 상태 관리
- 활동이 없으면 펫이 잠들거나 가출!

### 🌌 Commit Constellation
레포지토리를 별자리로, 커밋을 별로, PR을 유성으로 변환하는 **커밋 별자리 맵**입니다.
- 레포별 별자리 자동 생성 (이름, 유형별 매핑)
- 유성(PR 머지), 성운(오픈 이슈) 시각화
- 하늘 테마: `midnight` | `aurora` | `sunset` | `deep_space`

### 🏙️ Dev City
GitHub 레포지토리를 건물로 변환하는 **아이소메트릭 개발자 도시**입니다.
- 레포 유형별 건물 매핑 (쇼핑몰, 공장, 연구소 등)
- 도시 Tier 시스템: Campsite → Village → Town → City → Metropolis → Megacity
- 실시간 날씨 (커밋 활동 기반) & 교통량 시스템

---

## 🚀 빠른 시작

### 1단계: 레포지토리 준비

GitHub 프로필 레포지토리(`username/username`)에 gitpro를 설정합니다.

### 2단계: Personal Access Token 생성

1. [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens) 이동
2. **Generate new token (classic)** 클릭
3. 다음 스코프 선택:
   - `repo` (프로필 README 업데이트)
   - `gist` (Gist 연동 시)
4. 토큰 복사 후 레포의 **Settings → Secrets and variables → Actions** 에서 `GH_TOKEN` 이름으로 저장

### 3단계: 설정 파일 생성

프로젝트 루트에 `gitpro.config.yml` 파일을 생성합니다:

```yaml
username: "your-github-username"
timezone: "Asia/Seoul"
locale: "ko"              # ko | en | ja
theme: "dark"              # dark | light | cyberpunk | retro | pastel 등

modules:
  trading-card:
    enabled: true
    style: "hologram"
  code-dna:
    enabled: true
    shape: "circular"
  chronicle:
    enabled: true
    max_chapters: 8
  code-pet:
    enabled: true
    animation: true
  constellation:
    enabled: true
    sky_theme: "midnight"
  dev-city:
    enabled: true
    city_style: "pixel"

readme:
  auto_update: true
  layout: "grid"
  header:
    type: "wave"
    text: "Hello, I'm YourName! 👋"
    color: "#6C63FF"
```

> 💡 사용하지 않을 모듈은 `enabled: false`로 비활성화하면 됩니다.

### 4단계: GitHub Actions 워크플로우 추가

`.github/workflows/gitpro.yml` 파일을 생성합니다:

```yaml
name: 🎮 gitpro - Update Profile

on:
  schedule:
    - cron: '0 */6 * * *'  # 6시간마다 자동 실행
  workflow_dispatch:        # 수동 실행 지원
  push:
    branches: [main]
    paths:
      - 'gitpro.config.yml'

jobs:
  generate:
    runs-on: ubuntu-latest
    permissions:
      contents: write
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run build
      - name: 🎮 Run gitpro
        env:
          GH_TOKEN: ${{ secrets.GH_TOKEN }}
        run: npm start
      - name: 📤 Commit changes
        run: |
          git config --local user.email "github-actions[bot]@users.noreply.github.com"
          git config --local user.name "github-actions[bot]"
          git add -A output/ state/ README.md
          git diff --staged --quiet || git commit -m "🎮 gitpro: Update profile" && git push
```

### 5단계: 실행!

- **자동 실행**: Push 하면 Actions가 자동으로 실행됩니다.
- **수동 실행**: Actions 탭 → `gitpro - Update Profile` → Run workflow

---

## ⚙️ 설정

### 전체 설정 항목

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `username` | `string` | *필수* | GitHub 사용자 이름 |
| `timezone` | `string` | `"UTC"` | 타임존 (예: `Asia/Seoul`) |
| `locale` | `string` | `"en"` | 언어 (`ko`, `en`, `ja`) |
| `theme` | `string` | `"dark"` | 테마 이름 |

### 모듈별 설정

<details>
<summary>🃏 <strong>trading-card</strong> (트레이딩 카드)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `style` | `string` | `"hologram"` | 카드 스타일 (`hologram`, `pixel`, `minimal`, `anime`) |
| `show_ability` | `boolean` | `true` | 어빌리티 표시 |
| `show_skills` | `boolean` | `true` | 스킬(언어) 표시 |
| `max_skills` | `number` | `5` | 표시할 최대 스킬 수 |
| `custom_title` | `string` | `""` | 커스텀 타이틀 (빈 값이면 자동 생성) |

</details>

<details>
<summary>🧬 <strong>code-dna</strong> (코드 DNA)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `shape` | `string` | `"circular"` | DNA 형태 (`circular`, `helix`, `spiral`, `fingerprint`) |
| `color_scheme` | `string` | `"language"` | 색상 스킴 (`language`, `mood`, `rainbow`, `monochrome`) |
| `complexity` | `string` | `"detailed"` | 복잡도 (`simple`, `detailed`) |

</details>

<details>
<summary>📜 <strong>chronicle</strong> (개발자 연대기)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `max_chapters` | `number` | `8` | 최대 챕터 수 |
| `style` | `string` | `"rpg"` | 스타일 (`rpg`, `book`, `timeline`, `comic`) |
| `language` | `string` | `"ko"` | 연대기 텍스트 언어 (`ko`, `en`) |

</details>

<details>
<summary>🐾 <strong>code-pet</strong> (코드 펫)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `custom_name` | `string` | `""` | 펫 이름 (빈 값이면 자동 생성) |
| `show_mood` | `boolean` | `true` | 기분 표시 |
| `show_stats` | `boolean` | `true` | 스탯 표시 |
| `animation` | `boolean` | `true` | 애니메이션 활성화 |

</details>

<details>
<summary>🌌 <strong>constellation</strong> (커밋 별자리)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `sky_theme` | `string` | `"midnight"` | 하늘 테마 (`midnight`, `aurora`, `sunset`, `deep_space`) |
| `show_meteors` | `boolean` | `true` | 유성 표시 |
| `show_nebula` | `boolean` | `true` | 성운 표시 |
| `max_constellations` | `number` | `10` | 최대 별자리 수 |

</details>

<details>
<summary>🏙️ <strong>dev-city</strong> (개발자 도시)</summary>

| 항목 | 타입 | 기본값 | 설명 |
|------|------|--------|------|
| `enabled` | `boolean` | `true` | 모듈 활성화 여부 |
| `city_style` | `string` | `"pixel"` | 도시 스타일 (`pixel`, `isometric`, `flat`, `neon`) |
| `show_weather` | `boolean` | `true` | 날씨 표시 |
| `show_traffic` | `boolean` | `true` | 교통 표시 |
| `animation` | `boolean` | `true` | 애니메이션 활성화 |

</details>

---

## 🎨 테마

11가지 빌트인 테마를 제공합니다:

| 테마 | 설명 |
|------|------|
| `dark` | 🌙 깔끔한 다크 모드 (기본) |
| `light` | ☀️ 밝은 라이트 모드 |
| `cyberpunk` | 🤖 네온 사이버펑크 |
| `retro` | 🕹️ 레트로 게이밍 |
| `pastel` | 🎀 부드러운 파스텔 |
| `ocean` | 🌊 바다 블루 |
| `forest` | 🌲 포레스트 그린 |
| `dracula` | 🧛 드라큘라 |
| `nord` | ❄️ 노드 |
| `sunset` | 🌅 선셋 |
| `custom` | 🎨 사용자 정의 |

### 커스텀 테마

`theme: "custom"` 설정 후 `custom_theme`에 색상을 정의합니다:

```yaml
theme: "custom"
custom_theme:
  background: "#1a1b26"
  backgroundSecondary: "#24283b"
  text: "#c0caf5"
  textSecondary: "#565f89"
  accent: "#7aa2f7"
  accentSecondary: "#bb9af7"
  border: "#3b4261"
```

---

## 🔧 고급 사용법

### Gist 연동

SVG를 GitHub Gist에 업로드하여 프로필에 고정할 수 있습니다:

```yaml
gist:
  enabled: true
  gist_id: "your-gist-id"
  modules: ["trading-card", "code-pet"]  # 빈 배열이면 전부 업로드
```

### README 레이아웃

```yaml
readme:
  layout: "grid"        # grid: 2열 그리드 | vertical: 세로 | tabs: 탭
  header:
    type: "wave"        # wave | typing | gradient | none
    text: "Hello! 👋"
    color: "#6C63FF"
  footer:
    enabled: true
    style: "minimal"    # wave | minimal | stats | none
  module_order: ["trading-card", "code-pet", "constellation"]
  show_last_updated: true
```

### 수동 디버그 실행

GitHub Actions의 `workflow_dispatch`에서 디버그 모드를 활성화할 수 있습니다:
- **force_rebuild**: 캐시를 무시하고 전체 재빌드
- **debug_mode**: 상세 로그 출력 및 아티팩트 저장

---

## 🏗️ 프로젝트 구조

```
gitpro/
├── src/
│   ├── index.ts                 # 메인 엔트리포인트
│   ├── types/index.ts           # 핵심 타입 정의
│   ├── core/
│   │   ├── config-loader.ts     # YAML 설정 로더
│   │   ├── theme-manager.ts     # 테마 관리
│   │   ├── state-manager.ts     # 영구 상태 관리
│   │   ├── svg-engine.ts        # SVG 빌더 엔진
│   │   ├── github-client.ts     # GitHub API 클라이언트
│   │   ├── data-collector.ts    # 데이터 수집기
│   │   ├── module-runner.ts     # 모듈 실행기
│   │   ├── header-generator.ts  # 헤더 SVG 생성
│   │   ├── readme-generator.ts  # README 자동 생성
│   │   └── gist-uploader.ts     # Gist 업로더
│   └── modules/
│       ├── trading-card/        # 🃏 트레이딩 카드
│       ├── code-dna/            # 🧬 코드 DNA
│       ├── chronicle/           # 📜 연대기
│       ├── code-pet/            # 🐾 코드 펫
│       ├── constellation/       # 🌌 별자리
│       └── dev-city/            # 🏙️ 개발자 도시
├── tests/
│   ├── helpers/mock-data.ts     # 테스트 목 데이터
│   ├── core/                    # 코어 모듈 테스트
│   └── modules/                 # 플러그인 모듈 테스트
├── state/                       # 영구 상태 저장소
├── output/                      # 생성된 SVG 파일
├── gitpro.config.yml            # 사용자 설정 파일
├── action.yml                   # GitHub Action 정의
└── package.json
```

---

## 🧪 개발

```bash
# 의존성 설치
npm install

# 개발 모드 실행
npm run dev

# TypeScript 빌드
npm run build

# 테스트 실행
npm test

# 커버리지 포함 테스트
npm run test:coverage

# 감시 모드 테스트
npm run test:watch

# 린트
npm run lint

# 정리
npm run clean
```

---

## 🤝 기여하기

기여를 환영합니다! 다음 단계를 따라주세요:

1. 이 레포를 Fork 합니다
2. Feature 브랜치를 생성합니다 (`git checkout -b feature/amazing-feature`)
3. 변경사항을 커밋합니다 (`git commit -m 'feat: Add amazing feature'`)
4. 브랜치를 Push 합니다 (`git push origin feature/amazing-feature`)
5. Pull Request를 생성합니다

### 새 모듈 만들기

`GitProModule` 인터페이스를 구현하면 새 모듈을 추가할 수 있습니다:

```typescript
import { GitProModule, ModuleContext, ModuleOutput } from '../../types';

export class MyModule implements GitProModule {
  readonly id = 'my-module';
  readonly name = 'My Module';
  readonly description = 'My custom module';
  readonly icon = '🚀';

  async generate(context: ModuleContext): Promise<ModuleOutput> {
    // SVG 생성 로직
    return { svg: '<svg>...</svg>', markdown: '![My Module](...)' };
  }
}
```

---

## 📄 라이선스

이 프로젝트는 [MIT 라이선스](LICENSE)로 배포됩니다.

---

<p align="center">
  Made with ❤️ by <a href="https://github.com/Sangyeonglee353">Sangyeonglee353</a>
</p>

<!-- GITPRO:START -->
<!-- GITPRO:END -->
