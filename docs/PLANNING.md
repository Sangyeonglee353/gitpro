# 🎮 gitpro - All-in-One GitHub Profile Suite

> GitHub 활동 데이터를 기반으로 6가지 독창적인 시각화 모듈을 제공하는 통합 프로필 꾸미기 프로젝트

---

## 📋 프로젝트 개요

| 항목 | 내용 |
|------|------|
| **프로젝트명** | `gitpro` - All-in-One GitHub Profile Suite |
| **목적** | GitHub 프로필을 6가지 혁신적 방식으로 자동 시각화 |
| **핵심 기술** | GitHub Actions, GitHub GraphQL API, GitHub REST API, Node.js, TypeScript |
| **아키텍처** | Config-Driven 모듈 플러그인 시스템 |
| **레포** | `Sangyeonglee353/gitpro` |

---

## 🎯 6가지 핵심 모듈

### 🃏 모듈 1: Dev Trading Card (개발자 트레이딩 카드)

> 포켓몬/유희왕 카드처럼 **나만의 개발자 수집 카드**를 자동 생성

#### 카드 디자인

```
┌─────────────────────────────────┐
│  ✦ LEGENDARY ✦                  │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │    ⚡ TypeScript Mage ⚡   │  │
│  │                           │  │
│  │      (픽셀아트 캐릭터)      │  │
│  │                           │  │
│  └───────────────────────────┘  │
│                                 │
│  Sangyeonglee353                │
│  "The Midnight Coder"           │
│                                 │
│  ┌──────┬──────┬──────┬──────┐  │
│  │ ⚔ATK │ 🛡DEF │ 🧠INT │ ⚡SPD │
│  │  847  │  623  │  952  │  789  │
│  └──────┴──────┴──────┴──────┘  │
│                                 │
│  🔥 Special: "Midnight Surge"   │
│  야간 커밋 시 공격력 2배         │
│                                 │
│  ── SKILLS ──────────────────── │
│  TypeScript ████████░░ Lv.8     │
│  Python     ██████░░░░ Lv.6     │
│  React      ███████░░░ Lv.7     │
│                                 │
│  #0001          Season 1 / 2026 │
└─────────────────────────────────┘
```

#### 스탯 산출 방식

| 스탯 | 산출 기준 | 설명 |
|------|----------|------|
| ⚔ **ATK** (공격력) | 총 커밋 수 + PR 머지 비율 | 코드를 얼마나 밀어넣는가 |
| 🛡 **DEF** (방어력) | 이슈 해결률 + 코드 리뷰 수 | 버그로부터 코드를 지키는가 |
| 🧠 **INT** (지능) | 사용 언어 다양성 + 스타 수 | 얼마나 폭넓고 영향력 있는가 |
| ⚡ **SPD** (스피드) | PR 평균 처리 시간 + 커밋 빈도 | 얼마나 빠르게 움직이는가 |

#### 레어도 시스템

| 레어도 | 조건 | 카드 효과 |
|--------|------|----------|
| 🟤 Common | 총합 < 500 | 기본 카드 |
| 🟢 Uncommon | 총합 500~1000 | 카드 테두리 반짝임 |
| 🔵 Rare | 총합 1000~2000 | 은색 홀로그램 효과 |
| 🟣 Epic | 총합 2000~3500 | 금색 홀로그램 + 파티클 |
| 🟡 Legendary | 총합 3500+ | 무지개 홀로그램 + 애니메이션 |

#### 스페셜 어빌리티 (자동 부여)

- 🌙 **"Midnight Surge"** — 야간 커밋이 70% 이상
- 🌅 **"Dawn Breaker"** — 새벽 커밋이 30% 이상
- 🔥 **"Streak Master"** — 30일 이상 연속 커밋
- 🌍 **"Polyglot"** — 5개 이상 언어 사용
- 👑 **"Star Collector"** — 받은 스타 100개 이상
- 🐙 **"Open Source Hero"** — 10개 이상 레포에 기여

---

### 🧬 모듈 2: Code DNA (코드 DNA 지문)

> 개발자의 코딩 패턴으로 생성되는 **세상에 단 하나뿐인 시각적 지문**

#### DNA 생성 알고리즘

| 데이터 | 시각적 매핑 | 의미 |
|--------|------------|------|
| 주 사용 언어 | 색상 (JS=노랑, TS=파랑, Py=초록...) | DNA 가닥 색상 |
| 커밋 시간 분포 | 파형의 진폭/주기 | 밤형은 긴 파장, 아침형은 짧은 파장 |
| 요일별 활동량 | 7개 동심원 링 두께 | 활동 많은 요일은 두꺼운 링 |
| 레포 다양성 | 분기(branch) 수 | 다양할수록 더 복잡한 구조 |
| 커밋 메시지 키워드 | 장식 아이콘 | feat→⭐, fix→🔧, docs→📝 |
| 총 활동량 | 전체 밀도/복잡도 | 활동이 많을수록 촘촘 |

> 핵심: **같은 DNA 패턴은 절대 나오지 않습니다.** SNS 공유 시 "내 코드 DNA는 이렇게 생겼어!" 바이럴 효과

---

### 📜 모듈 3: Dev Chronicle (개발자 연대기)

> GitHub 활동을 **RPG 퀘스트 로그**처럼 시각화하는 타임라인

#### 자동 감지 마일스톤 이벤트

| 이벤트 | 트리거 조건 | 연대기 제목 |
|--------|-----------|------------|
| 🌱 첫 커밋 | 첫 번째 커밋 | "The Beginning" |
| 📦 첫 레포 생성 | 첫 public 레포 | "Laying the Foundation" |
| 🤝 첫 PR 머지 | 다른 레포에 첫 기여 | "The Awakening" |
| ⭐ 첫 스타 | 받은 스타 1개 | "Recognition" |
| 🔥 30일 연속 커밋 | 30일 streak | "The Grind" |
| 🌍 새 언어 습득 | 새 언어로 레포 생성 | "New Weapon Acquired" |
| 👑 스타 100개 | 총 스타 100 | "Rising Star" |
| 🏰 팔로워 50명 | 팔로워 50 | "Building a Kingdom" |

---

### 🐾 모듈 4: Code Pet (코드 펫)

> GitHub 활동으로 키우는 **다마고치 스타일의 가상 펫**

#### 펫 종류 (주 사용 언어 기반 자동 결정)

| 주 언어 | 펫 이름 | 외형 | 속성 |
|---------|---------|------|------|
| TypeScript | **TypeScriptodon** | 🐲 드래곤 | ⚡ 전기 |
| Python | **Pythonix** | 🐍 피닉스뱀 | 🔥 불 |
| JavaScript | **JavaScripmunk** | 🐿️ 다람쥐 | 💨 바람 |
| Java | **Javantine** | 🐘 코끼리 | 🪨 바위 |
| Go | **Gopher** | 🐹 고퍼 | 🌿 풀 |
| Rust | **Rustacean** | 🦀 게 | ⚙️ 강철 |
| C/C++ | **Cplusaur** | 🦕 공룡 | 🌍 대지 |
| Kotlin | **Kotlini** | 🦊 여우 | ✨ 빛 |
| Swift | **Swiftern** | 🦅 독수리 | 💨 바람 |
| Ruby | **Rubeon** | 💎 보석 정령 | ❄️ 얼음 |

#### 진화 시스템

| 단계 | 조건 | 형태 | 이벤트 |
|------|------|------|--------|
| 🥚 **알** | 레포 생성 시 | 알 | "새로운 생명이 태어났습니다!" |
| 🐣 **1진화** | EXP 1,000 | 아기 생물 | 날개/꼬리 등 특징 생성 |
| 🐥 **2진화** | EXP 5,000 | 청소년 생물 | 속성 이펙트 추가 |
| 🐲 **3진화** | EXP 15,000 | 성체 | 풀 애니메이션 + 특수 스킬 |
| 👑 **최종진화** | EXP 50,000 | 전설 형태 | 왕관 + 아우라 + 홀로그램 |

#### 먹이(경험치) 산출

| 행동 | EXP | 펫 반응 |
|------|-----|---------|
| 커밋 1회 | +10~30 (변경 라인 수 비례) | "냠냠! 맛있는 코드다!" |
| PR 생성 | +50 | "새로운 모험이다!" |
| PR 머지 | +120 | "대승리! 🎉" |
| 이슈 해결 | +80 | "몬스터를 처치했다!" |
| 스타 받기 | +200 | "팬이 생겼어! ⭐" |
| 24시간 무활동 | -20 배고픔↑ | "...배고파 😢" |
| 48시간 무활동 | 펫이 잠듦 | "zzZ 💤" |
| 7일 무활동 | 펫이 가출 위기 | "여기... 아무도 없나요?" |

---

### 🌌 모듈 5: Commit Constellation (커밋 별자리)

> 커밋 기록이 **밤하늘의 별자리**로 변환됨

#### 천체 매핑 시스템

| GitHub 요소 | 천체 | 시각적 표현 |
|------------|------|------------|
| **레포지토리** | 별자리 (Constellation) | 레포 내 커밋들이 선으로 연결된 별자리 형태 |
| **단일 커밋** | 별 (Star) | 밝기 = 변경 라인 수, 크기 = 파일 수 |
| **머지된 PR** | 유성 (Meteor) ☄️ | 꼬리가 달린 애니메이션 |
| **오픈 이슈** | 성운 (Nebula) ✦ | 흐릿한 빛 구름 |
| **Fork** | 쌍성 (Binary Star) | 두 개의 별이 궤도를 도는 모션 |
| **Release** | 초신성 (Supernova) | 폭발하는 밝은 빛 이펙트 |
| **스타(받은)** | 별의 밝기 등급 | 스타 많을수록 더 밝은 별 |
| **비활성 레포** | 적색왜성 (Red Dwarf) | 어둡고 붉은 색 |

#### 별자리 이름 자동 생성

| 레포 특성 | 별자리 이름 패턴 | 예시 |
|----------|----------------|------|
| Web 프론트엔드 | "~의 방패" | "React의 방패" |
| API/백엔드 | "~의 탑" | "Node의 탑" |
| 라이브러리/도구 | "~의 망치" | "Utils의 망치" |
| 문서/블로그 | "~의 두루마리" | "Docs의 두루마리" |
| ML/AI | "~의 눈" | "TensorFlow의 눈" |
| 게임 | "~의 검" | "Unity의 검" |

#### 계절/시간 시스템

| 시간대 | 하늘 색상 | 특수 효과 |
|--------|----------|----------|
| 새벽형 개발자 (4~8시) | 보라 → 분홍 그라데이션 | 새벽별 반짝임 |
| 주간형 개발자 (9~17시) | 진한 남색 (석양 느낌) | 태양 잔상 |
| 야간형 개발자 (18~3시) | 깊은 검정 + 은하수 | 은하수 배경 + 밝은 별 |

---

### 🏙️ 모듈 6: Dev City (개발자 도시)

> GitHub가 **아이소메트릭 픽셀아트 도시**로 변환됨

#### 건물 타입 시스템

| 레포 특성 | 건물 타입 | 아이콘 | 시각적 특징 |
|----------|----------|--------|------------|
| 웹 프론트엔드 | 🏬 쇼핑몰 | 유리 외벽 + 간판 | 화려한 네온사인 |
| API/백엔드 | 🏗️ 공장 | 굴뚝 + 기어 | 연기 애니메이션 |
| 라이브러리/패키지 | 📦 창고 | 컨테이너 스타일 | 화물차 드나듦 |
| CLI/도구 | 🔧 정비소 | 공구 간판 | 기계음 이펙트 |
| ML/AI | 🔬 연구소 | 안테나 + 전파 | 전파 발사 모션 |
| 문서/블로그 | 📚 도서관 | 책 아이콘 | 조용한 분위기 |
| 게임 | 🎮 오락실 | 네온 + 조이스틱 | 번쩍이는 효과 |
| 모바일 앱 | 📱 통신사 | 안테나 타워 | 신호 모션 |
| 프로필 README | 🏛️ 시청 | 깃발 | 도시 중심 |
| 비활성 레포 (1년+) | 🏚️ 폐허 | 금 간 벽 | 먼지 + 거미줄 |

#### 도시 발전 레벨

| Tier | 이름 | 조건 | 시각적 변화 |
|------|------|------|------------|
| 🏕️ Tier 0 | 캠핑장 | 레포 1~2개 | 텐트 + 모닥불 |
| 🏘️ Tier 1 | 마을 | 레포 3~5개 | 작은 집들 + 흙길 |
| 🏙️ Tier 2 | 소도시 | 레포 6~10개 | 건물 + 도로 + 가로등 |
| 🌆 Tier 3 | 도시 | 레포 11~20개 | 고층 건물 + 공원 + 자동차 |
| 🏙️ Tier 4 | 메트로폴리스 | 레포 21~40개 | 마천루 + 지하철 + 헬기 |
| 🌃 Tier 5 | 메가시티 | 레포 41개+ | 야경 + 불꽃놀이 + 비행선 |

#### 도시 날씨 (실시간 활동 반영)

| 최근 활동 상태 | 날씨 | 시각 효과 |
|--------------|------|----------|
| 오늘 커밋 5회 이상 | ☀️ 맑음 | 밝은 하늘 + 햇살 |
| 오늘 커밋 1~4회 | 🌤️ 구름 약간 | 구름 약간 |
| 오늘 커밋 없음 | ☁️ 흐림 | 회색 하늘 |
| 3일 무활동 | 🌧️ 비 | 비 내리는 애니메이션 |
| 7일 무활동 | ❄️ 눈 | 눈 내리는 모션 |
| PR 머지 성공 | 🌈 무지개 | 무지개 아치 |
| Release 배포 | 🎆 불꽃놀이 | 폭죽 터지는 모션 |
| 버그 이슈 다수 | 🌋 화산 | 건물에서 연기 |

---

## 🏗️ 기술 아키텍처

### Config-Driven 모듈 시스템

사용자는 `gitpro.config.yml` 파일 하나만 편집하여 모든 모듈을 제어합니다.

### 모듈 플러그인 인터페이스

모든 모듈은 `GitProModule` 인터페이스를 구현합니다:

```typescript
export interface GitProModule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  generate(context: ModuleContext): Promise<ModuleOutput>;
}

export interface ModuleContext {
  githubData: GitHubData;
  moduleConfig: Record<string, any>;
  globalConfig: GlobalConfig;
  state: StateManager;
  svgEngine: SVGEngine;
}

export interface ModuleOutput {
  svg: string;
  markdown: string;
  stateUpdate?: Record<string, any>;
}
```

### 데이터 수집 최적화

GitHub API를 **1회만 호출**하고 전 모듈이 공유합니다:

| 모듈 | 주로 사용하는 데이터 |
|------|-------------------|
| 🃏 Trading Card | `languages`, `commitHistory`, `pullRequests`, `issues` |
| 🧬 Code DNA | `commitHistory`, `languages`, `contributionCalendar` |
| 📜 Chronicle | `milestones`, `repositories`, `commitHistory` |
| 🐾 Code Pet | `commitHistory` (최근), `languages`, `pullRequests` |
| 🌌 Constellation | `repositories`, `commitHistory`, `pullRequests`, `issues` |
| 🏙️ Dev City | `repositories`, `commitHistory`, `languages`, `contributionCalendar` |

### 영구 상태 관리

축적 데이터(펫 EXP, 도시 레벨 등)는 `state/gitpro-state.json`에 보존됩니다.

---

## 🗂️ 프로젝트 구조

```
gitpro/
├── gitpro.config.yml              # ⭐ 사용자 설정 파일
├── .github/
│   └── workflows/
│       └── gitpro.yml             # 단일 통합 워크플로우
├── src/
│   ├── core/                      # 핵심 엔진
│   │   ├── config-loader.ts
│   │   ├── module-runner.ts
│   │   ├── github-client.ts
│   │   ├── data-collector.ts
│   │   ├── svg-engine.ts
│   │   ├── animation-engine.ts
│   │   ├── pixel-art-engine.ts
│   │   ├── theme-manager.ts
│   │   ├── state-manager.ts
│   │   └── readme-generator.ts
│   ├── modules/
│   │   ├── trading-card/
│   │   ├── code-dna/
│   │   ├── chronicle/
│   │   ├── code-pet/
│   │   ├── constellation/
│   │   └── dev-city/
│   ├── types/
│   │   └── index.ts
│   └── index.ts
├── assets/
├── state/
├── output/
├── templates/
├── docs/
│   └── PLANNING.md
├── action.yml
├── package.json
└── tsconfig.json
```

---

## 🚀 사용자 플로우 (3단계)

1. **Fork** — gitpro 레포를 Fork
2. **Configure** — `gitpro.config.yml`에서 원하는 모듈을 `enabled: true` 설정
3. **Secret 등록** — Settings > Secrets에 `GH_TOKEN` 추가

→ 6시간마다 자동으로 프로필이 업데이트됩니다!

---

## 📅 구현 로드맵

| 주차 | 내용 | 산출물 |
|------|------|--------|
| 1주차 | 프로젝트 세팅 + Core 엔진 | 핵심 인프라 |
| 2주차 | 🃏 Trading Card 모듈 | `trading-card.svg` |
| 3주차 | 🐾 Code Pet 모듈 + state 시스템 | `code-pet.svg` |
| 4주차 | 🧬 Code DNA 모듈 | `code-dna.svg` |
| 5주차 | 📜 Dev Chronicle 모듈 | `chronicle.svg` |
| 6주차 | 🌌 Constellation 모듈 | `constellation.svg` |
| 7주차 | 🏙️ Dev City 모듈 | `dev-city.svg` |
| 8주차 | README 자동 생성기 + Actions + 테마 | 전체 통합 |
| 9주차 | 테스트 + 문서화 + 데모 | 공개 준비 완료 |

---

## 🎯 바이럴 포인트

| 기존 프로젝트들 | **gitpro** |
|---------------|-----------|
| 숫자/그래프 나열 | 🃏 게임 카드 형태 → 수집 본능 자극 |
| 모두 비슷한 디자인 | 🧬 세상에 하나뿐인 고유 DNA 패턴 |
| 현재 시점의 스냅샷만 | 📜 성장 스토리를 RPG로 표현 |
| 공유 동기 부족 | "내 레어도가 Legendary야!" → SNS 공유 욕구↑ |
| 단순 읽기 전용 | "내 펫이 진화했어!" → 재방문 동기↑ |
| 개발자만 이해 | 비개발자도 흥미를 느낄 수 있는 게이미피케이션 |
