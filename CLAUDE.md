# CLAUDE.md
 
> Claude Code가 이 프로젝트를 개발할 때 매번 자동으로 참조하는 파일입니다.
> 이 문서는 한국어로 작성되었으며, 코드와 주석은 영어로 작성합니다.
 
---
 
## 🎯 프로젝트 한 줄 요약
 
**Layer Studio**는 Claude Agent SDK 기반으로, 두 개의 YouTube Shorts 채널을 자동화하는 단일 NestJS 프로젝트입니다. **한국어 음성 + 영어 자막** 포맷으로 영어권 글로벌 시청자를 대상으로 합니다.
 
---
 
## 🌏 핵심 콘텐츠 전략 (필수 숙지)
 
### "한국인 오리지널 + 한국어 박힌 자막 + 영어 CC"
 
**모든 코드와 프롬프트는 이 전략을 따라야 합니다:**
 
1. **모든 스크립트는 한국어로 먼저 작성**
2. **화면에 박힌 자막(burned-in)은 한국어** — Remotion이 픽셀에 그림
3. **영어 자막은 YouTube 캡션 트랙(CC)으로 별도 업로드** — 한국어 원본의 자연스러운 번역
4. **Supertone Play 음성 복제는 한국어 모델 사용**
5. **자막 타이밍은 한국어 음성 기준**
### 이유
- Shorts 알고리즘은 업로더 지역(한국) 초기 시청 engagement → 글로벌 확산 순서
  → **한국인 시청 유지가 전제**, 박힌 자막은 한국어여야 초기 이탈 방지
- 영어 CC는 해외 시청자가 선택적으로 켤 수 있고 YouTube 자동번역(스·일 등) 베이스로도 사용
- 한국인 개발자이자 K-Beauty 내부자 — "진정성"이 차별점
- YouTube AI 탐지 정책에 안전

### 포맷 템플릿 레이어
전달 방식은 [`docs/FORMATS.md`](./docs/FORMATS.md)에서 정의한 **포맷 A (정보전달)** /
**포맷 C (하우투)** 중 큐레이터가 주제에 따라 자동 선택합니다.
채널(AI / Skin)과 포맷(A / C)은 독립 차원입니다.
---
 
## 🏗️ 핵심 아키텍처 원칙
 
### 단일 프로젝트 구조 (필수)
 
```
layer-studio-pipeline/
├── src/                      # NestJS 메인 소스
│   ├── main.ts
│   ├── app.module.ts
│   ├── config/               # 설정 관리
│   ├── common/               # 공통 모듈
│   ├── modules/              # 기능 모듈
│   │   ├── pipeline/         # 파이프라인 오케스트레이션
│   │   ├── news/             # RSS 뉴스 수집
│   │   ├── claude/           # Claude API (한국어 스크립트 + 영어 번역)
│   │   ├── pexels/           # Pexels B-roll
│   │   ├── supertone/        # Supertone Play 한국어 TTS
│   │   ├── subtitle/         # 영어 자막 생성 (SRT)
│   │   ├── video-renderer/   # Remotion 호출
│   │   ├── notion/
│   │   ├── slack/
│   │   ├── youtube/
│   │   └── videos/
│   └── prisma/
│
├── remotion/                 # Remotion 영상 렌더링
│   ├── Root.tsx
│   ├── compositions/
│   │   ├── LayerAIStudio.tsx
│   │   └── LayerSkinStudio.tsx
│   └── components/
│       ├── KoreanAudio.tsx   # 한국어 음성 컴포넌트
│       ├── EnglishSubtitle.tsx # 영어 자막 (단어별)
│       ├── BRollScene.tsx
│       └── BrandOverlay.tsx
│
├── prisma/
├── .github/workflows/
├── docs/
├── CLAUDE.md
├── README.md
├── .env.example
├── .gitignore
├── .nvmrc
├── package.json
├── tsconfig.json
├── remotion.config.ts
└── docker-compose.yml
```
 
### 패키지 매니저
- **pnpm** 사용
### Node.js 버전
- **20.x LTS** (필수)
---
 
## 📝 코딩 스타일 규칙
 
### TypeScript
- **strict mode** 필수 (`"strict": true`)
- `any` 금지 (대신 `unknown` + type guard)
- 리턴 타입 명시 권장
### 명명 규칙
- **파일명:** `kebab-case` (예: `korean-tts.service.ts`)
- **클래스명:** `PascalCase`
- **변수/함수:** `camelCase`
- **상수:** `UPPER_SNAKE_CASE`
- **enum:** `PascalCase`
### 함수
- 화살표 함수 선호
- 30줄 이하 지향
- 매개변수 3개 초과 시 객체로
### 에러 처리
- try-catch 필수
- NestJS `Logger` 사용 (console.log 금지)
### 비동기
- `async/await` 사용
- `Promise.all()` 활용
---
 
## 🚫 금지사항
 
1. **`console.log` 금지** → NestJS `Logger` 사용
2. **`any` 타입 금지** → `unknown` + type guard
3. **하드코딩된 시크릿 금지** → `.env` 사용
4. **`fetch` 대신 `axios`**
5. **매직 넘버 금지**
6. **`moment.js` 금지** → `date-fns`
---
 
## 🧪 테스트 규칙
 
- **Jest** (NestJS 기본)
- Service 레이어 커버리지 **80% 이상**
- `*.spec.ts` 파일 소스와 같은 폴더
---
 
## 🌐 언어 정책 (매우 중요)
 
### 코드 주석 & 네이밍
- **영어로 작성**
- 변수명, 함수명 모두 영어
### 프롬프트
- **한국어 스크립트 생성 프롬프트**: 한국어로 작성
- **영어 번역 프롬프트**: 영어로 작성
- 각 채널별로 분리
### 로그 메시지
- 영어로 통일
### 커밋 메시지
- Conventional Commits (`feat:`, `fix:` 등)
- 설명은 영어
---
 
## 🤖 Claude 사용 원칙
 
### 모델 선택
- **Haiku** — 큐레이션, 필터링, 간단 분류
- **Sonnet** — 한국어 스크립트 작성, 영어 번역, 메타데이터 생성
- **Opus** — 기본 금지 (비용)
### 프롬프트 관리
- `src/modules/claude/prompts/`에 저장
- 채널별 + 용도별 분리:
  ```
  prompts/
  ├── curation/
  │   ├── ai.prompt.ts
  │   └── skin.prompt.ts
  ├── scripting-korean/       # 한국어 스크립트 생성
  │   ├── ai.prompt.ts
  │   └── skin.prompt.ts
  ├── translation/            # 한국어 → 영어 자막
  │   ├── ai.prompt.ts
  │   └── skin.prompt.ts
  └── metadata/               # YouTube 메타데이터 (영어)
      ├── title.prompt.ts
      └── description.prompt.ts
  ```
 
### 비용 관리
- 토큰 사용량 로깅
- 월 예산 한도 설정
---
 
## 🎙️ Supertone Play 한국어 TTS 원칙
 
### 핵심
- **한국어 음성 모델 사용** (서울대 음성 AI 연구진 기술)
- 내 목소리 한국어 음성 복제 (15초 샘플로 생성, Play 웹에서 먼저 등록 후 API 호출)
- 생성된 음성의 **초 단위로 크레딧 차감** (약 10 크레딧/초)
- 문장/세그먼트 타임스탬프 확보 (자막 타이밍용)
### 크레딧 시스템
- Play 웹 UI ↔ API 크레딧 통합 (같은 계정 공유)
- Creator 플랜 기준: 월 100,000 크레딧 (약 170분 상당)
- API 요청 제한: **분당 20회** — 파이프라인 내 큐잉/레이트 리미터 필수
### 설정
```typescript
{
  voiceId: process.env.SUPERTONE_VOICE_ID_KO, // Play에서 등록한 클론 보이스 ID
  language: 'ko',
  style: 'neutral',                            // 또는 채널별 스타일
  model: 'sona_speech_1',                      // Supertone 최신 TTS 모델
  voiceSettings: {
    pitchShift: 0,
    pitchVariance: 1,
    speed: 1,
  },
}
```
 
### 환경 변수
```bash
SUPERTONE_API_KEY=...           # API 콘솔에서 발급
SUPERTONE_VOICE_ID_KO=...       # Play에서 생성한 클론 보이스 ID
SUPERTONE_API_BASE=https://supertoneapi.com
```
 
### 주의
- 한국어 특수 발음 체크 필요 (예: 숫자, 영어 섞인 부분)
- 긴 스크립트는 문장 단위로 분할 호출 권장 (타임아웃 및 재시도 용이)
- **Predict Duration API**로 크레딧 차감 전 길이 미리 계산 가능 (무료 호출)
- 클론 보이스 **생성**은 Play 웹에서만 가능, API는 **호출**만 지원
### 추상화 권장
```typescript
// src/modules/tts/tts-provider.interface.ts
export interface TtsProvider {
  synthesize(text: string, options: TtsOptions): Promise<TtsResult>;
  predictDuration(text: string): Promise<number>;
}
```
→ 향후 CLOVA Voice 등 다른 프로바이더로 교체 가능하도록 분리
 
---
 
## 📝 자막 생성 원칙
 
### 영어 자막 생성 방식
 
**Step 1: 한국어 스크립트 완성**
```
"Claude는 최근 새로운 에이전트 SDK를 공개했습니다."
```
 
**Step 2: Claude Sonnet으로 영어 번역**
```
"Claude recently released a new Agent SDK."
```
 
**Step 3: Supertone Play로 한국어 음성 생성**
```json
{
  "audio": "...",
  "duration": 2.5,
  "segments": [
    { "text": "Claude는 최근 새로운 에이전트 SDK를 공개했습니다.", "start": 0.0, "end": 2.5 }
  ]
}
```
 
> ⚠️ Supertone API가 단어 단위 타임스탬프를 반환하지 않는 경우, **문장 단위 분할 호출** 방식으로 각 문장의 duration을 개별적으로 확보한 후 누적 계산.
 
**Step 4: 한국어 문장 → 영어 문장 매칭**
 
한국어 문장 단위로 영어 문장 매칭:
```json
{
  "segments": [
    {
      "ko_text": "Claude는 최근 새로운 에이전트 SDK를 공개했습니다.",
      "en_text": "Claude recently released a new Agent SDK.",
      "start": 0.0,
      "end": 2.5
    }
  ]
}
```
 
**Step 5: Remotion에서 문장 단위 자막 표시**
- 한국어 음성에 맞춰 영어 자막 표시
- 한 문장씩 팝업 (너무 짧게 끊지 말 것)
---
 
## 📹 Remotion 사용 원칙
 
### 디렉토리 위치
- 프로젝트 루트의 `remotion/` 폴더
### 컴포지션 구조
- 각 채널별 별도 컴포지션
- `LayerAIStudio`, `LayerSkinStudio`
### 자막 스타일
- **문장 단위** 표시 (단어별 아님)
- 하단 배치, 충분한 여백
- 가독성 높은 폰트 (Inter, Pretendard 등)
- 배경 반투명 처리
### 호출 방식
```typescript
import { renderMedia, selectComposition } from '@remotion/renderer';
import { bundle } from '@remotion/bundler';
 
async renderVideo(props: VideoProps): Promise<string> {
  const bundled = await bundle({ entryPoint: './remotion/Root.tsx' });
  // ...
}
```
 
---
 
## 🗄️ 데이터베이스 (Prisma)
 
### 스키마 원칙
- 모든 테이블에 `id` (cuid), `createdAt`, `updatedAt`
- 외래 키는 명시적 이름
### 이중 언어 스키마
```prisma
model Video {
  id              String   @id @default(cuid())
  channel         Channel
  
  // 한국어 원본
  titleKo         String
  scriptKo        String   @db.Text
  
  // 영어 번역
  titleEn         String
  scriptEn        String   @db.Text
  descriptionEn   String   @db.Text
  tags            String[]
  
  // 자막 데이터
  subtitleData    Json     // segment timestamps
  
  // 에셋 URL
  audioUrl        String?  // 한국어 음성 (Supertone)
  videoUrl        String?  // 최종 영상
  
  // TTS 메타데이터
  ttsProvider     String   @default("supertone")
  ttsVoiceId      String?
  ttsCredits      Int?     // 소모된 크레딧 (모니터링용)
  
  // ...
}
```
 
---
 
## 🏷️ 두 채널 구분
 
```typescript
export enum Channel {
  AI = 'AI',
  SKIN = 'SKIN',
}
```
 
각 채널별 분리:
- YouTube 채널 ID
- Notion DB
- RSS 피드
- 프롬프트 (한국어/영어 모두)
- Remotion 테마
- (선택) Supertone 보이스 스타일 — AI 채널은 neutral, Skin 채널은 warm 등
---
 
## 🔄 Git 컨벤션
 
### 브랜치
- `main` — 운영
- `dev` — 통합
- `feat/기능명` — 기능
- `fix/버그명` — 버그
### 커밋 메시지 (Conventional Commits)
```
feat: add Supertone Play TTS module
fix: handle Supertone rate limit (20 req/min)
docs: update CONTENT.md with new subtitle guidelines
```
 
---
 
## 💡 자주 하는 실수 방지
 
1. **한국어 텍스트 인코딩** — UTF-8 필수
2. **자막 타이밍** — 한국어 음성 기준, 영어 자막은 문장 단위 매칭
3. **Supertone 레이트 리밋** — 분당 20회 제한, 병렬 호출 시 큐잉 필요
4. **Supertone 크레딧 관리** — Play와 API가 같은 크레딧 풀 공유, 월 초기화 확인
5. **클론 보이스 생성 경로** — Play 웹에서만 가능 (API는 호출만)
6. **YouTube 메타데이터** — 제목/설명은 **영어**, 스크립트는 한국어
7. **한국어 특수문자** — 이모지, 특수 괄호 주의
8. **숫자/영어 섞인 한국어** — "GPT-5가 나왔어요" → 발음 체크
---
 
## 📞 Claude Code에게 요청할 때 좋은 패턴
 
### ✅ 좋은 요청
> "CLAUDE.md와 docs/CONTENT.md 참고해서, 
> src/modules/claude/scriptwriter 모듈을 구현해줘.
> 한국어 스크립트 생성과 영어 번역을 분리된 메서드로."
 
### ❌ 나쁜 요청
> "스크립트 생성 기능 만들어줘"
 
**구체적 + 문서 참조 + 이중 언어 명시 = 좋은 결과**
 
---
 
## 🔗 참조 문서
 
- [docs/SPEC.md](./docs/SPEC.md) — 상세 기술 스펙
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 파이프라인 흐름
- [docs/CONTENT.md](./docs/CONTENT.md) — 채널·톤·번역 원칙
- [docs/FORMATS.md](./docs/FORMATS.md) — 포맷 A / C 템플릿 (중요!)
- [docs/SETUP.md](./docs/SETUP.md) — 환경 설정
---
 
_Last updated: 2026-04-23_
 
