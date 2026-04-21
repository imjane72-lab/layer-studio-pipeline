# CLAUDE.md

> Claude Code가 이 프로젝트를 개발할 때 매번 자동으로 참조하는 파일입니다.
> 이 문서는 한국어로 작성되었으며, 코드와 주석은 영어로 작성합니다.

---

## 🎯 프로젝트 한 줄 요약

**Layer Studio**는 Claude Agent SDK 기반으로, AI 분석 채널과 K-Beauty 과학 채널 두 개의 영어권 YouTube Shorts를 자동 생성·업로드하는 단일 NestJS 프로젝트입니다.

---

## 🏗️ 핵심 아키텍처 원칙

### 단일 프로젝트 구조 (필수)

```
layer-studio-pipeline/
├── src/                      # NestJS 메인 소스
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/               # 설정 관리
│   ├── common/               # 공통 모듈 (filters, guards 등)
│   ├── modules/              # 기능 모듈
│   │   ├── pipeline/         # 파이프라인 오케스트레이션
│   │   ├── news/             # RSS 뉴스 수집
│   │   ├── claude/           # Claude API 래퍼
│   │   ├── pexels/           # Pexels B-roll
│   │   ├── elevenlabs/       # ElevenLabs TTS
│   │   ├── video-renderer/   # Remotion 호출 서비스
│   │   ├── notion/           # Notion API
│   │   ├── slack/            # Slack 알림
│   │   ├── youtube/          # YouTube Data API
│   │   └── videos/           # 영상 CRUD
│   └── prisma/               # Prisma 서비스
│
├── remotion/                 # Remotion 영상 렌더링 코드
│   ├── Root.tsx              # Remotion 엔트리
│   ├── compositions/         # 채널별 컴포지션
│   │   ├── LayerAIStudio.tsx
│   │   └── LayerSkinStudio.tsx
│   └── components/           # 재사용 컴포넌트
│       ├── Subtitle.tsx
│       ├── BRollScene.tsx
│       └── BrandOverlay.tsx
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .github/
│   └── workflows/            # GitHub Actions
│
├── docs/                     # 프로젝트 문서
│   ├── SPEC.md
│   ├── WORKFLOW.md
│   ├── CONTENT.md
│   └── SETUP.md
│
├── CLAUDE.md                 # 이 파일
├── README.md
├── .env.example
├── .gitignore
├── .nvmrc                    # Node 버전 (20)
├── package.json              # 의존성 통합 관리
├── tsconfig.json             # NestJS용
├── remotion.config.ts        # Remotion 설정
└── docker-compose.yml        # 로컬 PostgreSQL
```

**이유:** 단일 프로젝트로 1인 개발 최적화, 빠른 MVP, 설정 복잡도 최소화. Remotion은 백엔드가 호출하는 도구이므로 같은 프로젝트에 포함.

### 패키지 매니저

- **pnpm** 사용 (npm/yarn 아님)
- 이유: 빠르고, 디스크 공간 절약, Node_modules 구조 개선

### Node.js 버전

- Node.js **25.x** (현재 사용 중)
- 최소 요구사항: Node 20 이상 (package.json `engines` 기준)
- `.nvmrc` 파일로 고정

---

## 📝 코딩 스타일 규칙

### TypeScript
- **strict mode** 반드시 활성화 (`"strict": true`)
- `any` 타입 사용 **금지** (대신 `unknown` + type guard)
- 함수 리턴 타입 명시 권장
- `interface` vs `type`: 객체는 `interface`, 유니온/인터섹션은 `type`

### 명명 규칙
- **파일명:** `kebab-case` (예: `news-curator.service.ts`)
- **클래스명:** `PascalCase` (예: `NewsCuratorService`)
- **변수/함수:** `camelCase` (예: `fetchNewsItems`)
- **상수:** `UPPER_SNAKE_CASE` (예: `MAX_SCRIPT_LENGTH`)
- **enum:** `PascalCase` 멤버 `PascalCase` (예: `VideoStatus.Pending`)

### 함수 스타일
- 화살표 함수 선호 (클래스 메서드 제외)
- 함수 하나는 **30줄 이하** 지향
- 매개변수 3개 초과 시 **객체로 묶기**
- 순수 함수 선호

### 에러 처리
- 명시적 에러 처리 (try-catch 적극 활용)
- NestJS에서는 **HttpException** 또는 커스텀 예외 사용
- Logger 써서 에러 로깅 (console.log 금지)

### 비동기
- `async/await` 사용 (`.then()` 체이닝 금지)
- `Promise.all()` 활용해서 병렬 처리
- 무한 대기 방지용 timeout 설정

---

## 🚫 금지사항 (매우 중요)

1. **`console.log` 직접 사용 금지**
   - 대신 NestJS `Logger` 쓰기
   - 이유: 운영 환경에서 제어 불가

2. **`any` 타입 금지**
   - 대신 `unknown` + 타입 가드
   - 불가피하면 주석으로 이유 명시

3. **하드코딩된 시크릿 금지**
   - API 키, 토큰은 모두 `.env`로
   - `process.env.VARIABLE_NAME` 사용

4. **`fetch` 대신 `axios` 사용**
   - 일관된 에러 처리, 인터셉터 활용

5. **매직 넘버 금지**
   - 의미 있는 상수로 추출 (예: `const MAX_RETRIES = 3;`)

6. **Node 내장 `https` 모듈 직접 쓰지 말 것**
   - `axios` 사용

7. **`moment.js` 금지**
   - `date-fns` 또는 native `Date` 사용

---

## 🧪 테스트 규칙

### 테스트 프레임워크
- **Jest** (NestJS 기본)
- E2E는 **Supertest**

### 커버리지 목표
- Service 레이어: **80% 이상**
- Controller 레이어: **60% 이상**
- Util/Helper: **90% 이상**

### 테스트 파일 위치
- 소스와 같은 폴더에 `*.spec.ts`
- 예: `news-curator.service.ts` ↔ `news-curator.service.spec.ts`

### 테스트 원칙
- AAA 패턴 (Arrange-Act-Assert)
- Mock은 필요할 때만 (과도한 mock 지양)
- 외부 API 호출은 반드시 mock

---

## 📐 NestJS 모듈 구조

각 모듈은 아래 구조를 따릅니다:

```
src/modules/news/
├── news.module.ts
├── news.service.ts
├── news.service.spec.ts
├── news.controller.ts (필요시)
├── dto/
│   └── fetch-news.dto.ts
├── interfaces/
│   └── news-item.interface.ts
└── README.md (모듈별 간단 설명, 선택)
```

### DTO 검증
- **class-validator** + **class-transformer** 사용
- ValidationPipe 글로벌 적용

### 의존성 주입
- 생성자 주입 사용 (property 주입 X)
- `private readonly` 선언

---

## 🔌 외부 서비스 통합 원칙

모든 외부 API (Claude, Pexels, ElevenLabs, YouTube, Notion, Slack)는 다음 원칙을 따릅니다:

1. **전용 모듈 생성**
   - 예: `src/modules/claude/`, `src/modules/pexels/`
   - 각 모듈은 자체 service, DTO, interface 보유

2. **재시도 로직** 필수
   - 지수 백오프 (Exponential backoff)
   - 최대 3회 재시도
   - 429 (rate limit) 특별 처리

3. **타임아웃 설정**
   - Claude API: 60초
   - ElevenLabs: 120초 (긴 음성 생성)
   - Pexels: 10초
   - 기타: 30초

4. **로깅**
   - 요청/응답 주요 정보 로깅
   - API 호출 실패 시 상세 로그

5. **환경 변수로 설정**
   - API 키, 엔드포인트, 타임아웃 등

---

## 🗄️ 데이터베이스 (Prisma)

### 스키마 원칙
- 모든 테이블에 `id` (cuid), `createdAt`, `updatedAt` 필수
- Soft delete 쓰는 경우 `deletedAt`
- 외래 키는 명시적 이름 (예: `userId` not `user_id`)

### 마이그레이션
- `pnpm prisma migrate dev --name description` 형태로
- 프로덕션은 `migrate deploy`
- 이름은 **snake_case 영어**

### 쿼리
- Raw SQL 최대한 피하기
- 복잡한 쿼리는 Prisma 쿼리 빌더로
- N+1 문제 주의 (`include` 적절히 사용)

---

## 🤖 Claude 사용 원칙

### 모델 선택
- **Claude Haiku** — 큐레이션, 필터링, 간단 분류
- **Claude Sonnet** — 스크립트 작성, 분석, 메타데이터 생성
- **Claude Opus** — 기본 사용 금지 (비용)

### 프롬프트 관리
- 모든 프롬프트는 `src/modules/claude/prompts/`에 저장
- 템플릿 리터럴로 동적 삽입
- 버전 관리 (`v1`, `v2`)

### 비용 관리
- 토큰 사용량 로깅
- 월 예산 한도 설정
- 큐레이션 단계에서 Haiku로 **먼저 필터**

---

## 📹 Remotion 사용 원칙

### 디렉토리 위치
- 프로젝트 루트의 `remotion/` 폴더
- NestJS가 `src/modules/video-renderer/`에서 호출

### 컴포지션 구조
- 재사용 가능한 컴포넌트 위주
- Props로 데이터 받기 (하드코딩 금지)
- 각 채널별 별도 컴포지션 (`LayerAIStudio`, `LayerSkinStudio`)

### 호출 방식
- NestJS에서 `@remotion/renderer` 패키지 사용
- child process로 Remotion 렌더링 실행
- 결과 mp4 파일 경로 리턴

```typescript
// src/modules/video-renderer/video-renderer.service.ts
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';

async renderVideo(props: VideoProps): Promise<string> {
  const bundled = await bundle({ entryPoint: './remotion/Root.tsx' });
  const composition = await selectComposition({
    serveUrl: bundled,
    id: props.channel === 'AI' ? 'LayerAIStudio' : 'LayerSkinStudio',
    inputProps: props,
  });
  await renderMedia({
    composition,
    serveUrl: bundled,
    codec: 'h264',
    outputLocation: `./output/${videoId}.mp4`,
    inputProps: props,
  });
  return outputPath;
}
```

### 성능
- 불필요한 re-render 방지
- 이미지는 WebP 우선
- 영상은 H.264 인코딩

### 타이포
- 자막은 단어 단위 애니메이션
- ElevenLabs의 word-level timestamp 활용

---

## 🔄 Git 컨벤션

### 브랜치 전략
- `main` — 운영 브랜치
- `dev` — 통합 브랜치
- `feat/기능명` — 기능 개발
- `fix/버그명` — 버그 수정
- `docs/문서명` — 문서
- `refactor/범위` — 리팩토링

### 커밋 메시지 (Conventional Commits)
```
<type>: <description>

[optional body]

[optional footer]
```

**Type 종류:**
- `feat:` 새 기능
- `fix:` 버그 수정
- `docs:` 문서
- `style:` 포맷팅
- `refactor:` 리팩토링
- `test:` 테스트
- `chore:` 기타

**예시:**
```
feat: add Pexels B-roll fetching module
fix: handle ElevenLabs 429 rate limit properly
docs: update SPEC.md with new env vars
```

---

## 🎨 환경별 설정

### 개발 환경 (Local)
- `.env.local` 사용
- Hot reload 활성화
- 상세 로그

### 스테이징
- `.env.staging` 사용
- 실제 API 사용하되 YouTube 업로드는 **Draft**로

### 프로덕션
- 환경 변수는 배포 플랫폼 관리
- 최소 로그, 에러만 상세

---

## 🏷️ 두 채널 구분

코드에서 채널은 **enum**으로 관리:

```typescript
export enum Channel {
  AI = 'AI',
  SKIN = 'SKIN',
}
```

- YouTube 채널 ID도 환경변수 분리 (`YOUTUBE_CHANNEL_ID_AI`, `YOUTUBE_CHANNEL_ID_SKIN`)
- 프롬프트도 채널별 분리

---

## 💡 자주 하는 실수 방지

1. **JSON.parse를 try-catch 없이 사용하지 말 것**
2. **외부 API 응답을 그대로 믿지 말 것** (validation 필수)
3. **Date 비교 시 timezone 주의** (UTC 기본, KST 변환은 명시적)
4. **정규표현식 사용 시 성능 체크** (ReDoS 조심)
5. **Promise 에러 잡지 않고 버리지 말 것**

---

## 📞 Claude Code에게 요청할 때 좋은 패턴

지혜씨가 Claude Code에게 작업 요청할 때 이렇게 하면 효과적입니다:

### ✅ 좋은 요청
> "CLAUDE.md와 docs/SPEC.md 참고해서, news 모듈을 만들어줘. RSS 수집 → Haiku로 필터링 → DB 저장 흐름이야."

### ❌ 나쁜 요청
> "뉴스 관리 기능 만들어줘"

**이유:** 구체적 + 문서 참조 + 플로우 명시가 좋은 결과 보장.

---

## 🔗 참조 문서

- [docs/SPEC.md](./docs/SPEC.md) — 상세 기술 스펙
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 파이프라인 흐름
- [docs/CONTENT.md](./docs/CONTENT.md) — 콘텐츠 규칙
- [docs/SETUP.md](./docs/SETUP.md) — 환경 설정

---

_Last updated: 2026-04-21_
