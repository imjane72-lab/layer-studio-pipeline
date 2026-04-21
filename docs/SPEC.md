# 기술 스펙 (SPEC.md)

> Layer Studio 프로젝트의 상세 기술 스펙 문서입니다.
> 환경 변수, API, DB 스키마, 외부 서비스 연동 정보를 담고 있습니다.

---

## 📋 목차

1. [환경 변수](#환경-변수)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [외부 API 스펙](#외부-api-스펙)
4. [내부 API 엔드포인트](#내부-api-엔드포인트)
5. [디렉토리 구조 상세](#디렉토리-구조-상세)

---

## 🔐 환경 변수

프로젝트 루트 `.env` 파일에 저장. `.env.example`을 템플릿으로 사용.

### Core
```bash
# 환경
NODE_ENV=development              # development | staging | production
PORT=3000
LOG_LEVEL=debug                   # debug | info | warn | error

# 데이터베이스
DATABASE_URL=postgresql://user:pass@localhost:5432/layer_studio

# 타임존
TZ=Asia/Seoul
```

### Claude API
```bash
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_MODEL_HAIKU=claude-haiku-4-5-20251001
CLAUDE_MODEL_SONNET=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
CLAUDE_TIMEOUT_MS=60000
```

### ElevenLabs
```bash
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=xxx           # 지혜씨 clone된 voice ID
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.75
ELEVENLABS_TIMEOUT_MS=120000
```

### Pexels
```bash
PEXELS_API_KEY=xxx
PEXELS_PER_PAGE=15
PEXELS_TIMEOUT_MS=10000
```

### YouTube Data API
```bash
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN_AI=xxx      # Layer AI Studio 계정
YOUTUBE_REFRESH_TOKEN_SKIN=xxx    # Layer Skin Studio 계정
YOUTUBE_CHANNEL_ID_AI=UCxxx
YOUTUBE_CHANNEL_ID_SKIN=UCxxx
```

### Notion
```bash
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID_AI=xxx         # AI 채널 영상 관리 DB
NOTION_DATABASE_ID_SKIN=xxx       # Skin 채널 영상 관리 DB
```

### Slack
```bash
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
SLACK_CHANNEL=#layer-studio
```

### AWS S3
```bash
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=layer-studio-assets
```

### RSS 피드 (뉴스 수집용)
```bash
# AI 채널용 RSS
RSS_FEEDS_AI=https://techcrunch.com/feed/,https://www.theverge.com/rss/index.xml,https://www.anthropic.com/rss

# K-Beauty 채널용 RSS
RSS_FEEDS_SKIN=https://www.allure.com/feed/rss,https://www.beautyindependent.com/feed/
```

---

## 🗄️ 데이터베이스 스키마

PostgreSQL + Prisma 사용. `prisma/schema.prisma` 파일에 정의.

### schema.prisma 기본 틀

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

// ==================== 채널 ====================

enum Channel {
  AI
  SKIN
}

// ==================== 뉴스 소스 ====================

model NewsItem {
  id          String   @id @default(cuid())
  channel     Channel
  title       String
  description String?  @db.Text
  url         String   @unique
  source      String   // "TechCrunch", "Allure" 등
  publishedAt DateTime
  fetchedAt   DateTime @default(now())
  
  // 중복 검사용 해시
  titleHash   String   @unique
  
  // 상태
  selected    Boolean  @default(false)  // 이 주제로 영상 제작됨
  
  videos      Video[]
  
  @@index([channel, publishedAt])
  @@index([fetchedAt])
}

// ==================== 영상 ====================

enum VideoStatus {
  PENDING       // 파이프라인 생성 중
  READY         // 생성 완료, 승인 대기
  APPROVED      // 승인됨
  REJECTED      // 거절됨
  SCHEDULED     // 업로드 예약됨
  PUBLISHED     // YouTube 공개됨
  FAILED        // 에러 발생
}

model Video {
  id             String      @id @default(cuid())
  channel        Channel
  status         VideoStatus @default(PENDING)
  
  // 콘텐츠
  title          String
  description    String      @db.Text
  tags           String[]
  script         String      @db.Text
  
  // 소스
  newsItemId     String?
  newsItem       NewsItem?   @relation(fields: [newsItemId], references: [id])
  
  // 에셋
  videoUrl       String?     // S3 URL
  thumbnailUrl   String?
  audioUrl       String?     // ElevenLabs TTS 결과
  
  // YouTube
  youtubeVideoId String?
  publishedAt    DateTime?
  scheduledAt    DateTime?
  
  // Notion
  notionPageId   String?
  
  // 분석
  viewCount      Int         @default(0)
  likeCount      Int         @default(0)
  commentCount   Int         @default(0)
  lastAnalyzedAt DateTime?
  
  // 에러
  errorLog       String?     @db.Text
  retryCount     Int         @default(0)
  
  // 타임스탬프
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  assets         VideoAsset[]
  
  @@index([channel, status])
  @@index([status, createdAt])
  @@index([publishedAt])
}

// ==================== 영상 에셋 (B-roll 등) ====================

enum AssetType {
  B_ROLL          // Pexels 스톡 영상
  IMAGE           // 이미지
  AUDIO_NARRATION // TTS 나레이션
  AUDIO_BGM       // 배경음악
  SUBTITLE_DATA   // 자막 타임스탬프
}

model VideoAsset {
  id        String    @id @default(cuid())
  videoId   String
  video     Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  type      AssetType
  url       String    // S3 URL 또는 외부 URL
  metadata  Json      // 타임스탬프, 키워드, 출처 등
  
  order     Int       @default(0)
  
  createdAt DateTime  @default(now())
  
  @@index([videoId, type])
}

// ==================== 파이프라인 실행 로그 ====================

enum PipelineStep {
  NEWS_FETCH
  NEWS_CURATE
  SCRIPT_GENERATE
  BROLL_FETCH
  TTS_GENERATE
  VIDEO_RENDER
  NOTION_CREATE
  SLACK_NOTIFY
  APPROVAL
  YOUTUBE_UPLOAD
}

enum StepStatus {
  STARTED
  SUCCESS
  FAILED
  SKIPPED
}

model PipelineRun {
  id        String    @id @default(cuid())
  channel   Channel
  videoId   String?
  
  startedAt DateTime  @default(now())
  endedAt   DateTime?
  status    String    // "running" | "completed" | "failed"
  
  logs      PipelineLog[]
  
  @@index([channel, startedAt])
}

model PipelineLog {
  id            String       @id @default(cuid())
  runId         String
  run           PipelineRun  @relation(fields: [runId], references: [id], onDelete: Cascade)
  
  step          PipelineStep
  status        StepStatus
  message       String?      @db.Text
  metadata      Json?
  
  startedAt     DateTime     @default(now())
  durationMs    Int?
  
  @@index([runId, step])
}

// ==================== 비용 추적 ====================

model ApiCost {
  id         String   @id @default(cuid())
  service    String   // "claude" | "elevenlabs" | "pexels" | "youtube"
  endpoint   String?
  
  tokensIn   Int?
  tokensOut  Int?
  charCount  Int?     // ElevenLabs용
  
  cost       Decimal  @db.Decimal(10, 4)  // USD
  
  videoId    String?
  createdAt  DateTime @default(now())
  
  @@index([service, createdAt])
}
```

---

## 🌐 외부 API 스펙

### Claude API (Anthropic)

**엔드포인트:** `https://api.anthropic.com/v1/messages`

**용도:**
- Haiku: 뉴스 큐레이션, 관련성 점수
- Sonnet: 스크립트 작성, 메타데이터 생성

**SDK:** `@anthropic-ai/sdk`

**예시:**
```typescript
const response = await anthropic.messages.create({
  model: process.env.CLAUDE_MODEL_SONNET,
  max_tokens: 4096,
  messages: [{ role: 'user', content: prompt }],
});
```

**비용 주의:**
- Haiku: $0.80/MTok input, $4/MTok output
- Sonnet: $3/MTok input, $15/MTok output
- 매월 예산 한도 체크

---

### ElevenLabs API

**엔드포인트 (Voice Cloning):** `https://api.elevenlabs.io/v1/text-to-speech/{voice_id}/with-timestamps`

**용도:** 지혜씨 복제된 목소리로 영어 나레이션 생성 + 단어별 타임스탬프

**요청 본문:**
```json
{
  "text": "Script here...",
  "model_id": "eleven_multilingual_v2",
  "voice_settings": {
    "stability": 0.5,
    "similarity_boost": 0.75
  }
}
```

**응답:**
- `audio_base64`: MP3 base64
- `alignment`: 단어별 시작/종료 시간

**비용:**
- Creator 플랜 $11/월 = 100,000 characters
- 영상당 약 1,500 characters 사용 = 월 60개 가능

---

### Pexels API

**엔드포인트:** `https://api.pexels.com/videos/search`

**용도:** B-roll 영상 검색 (9:16 세로 포맷 선호)

**파라미터:**
```
query: "typing keyboard"
orientation: "portrait"  // 9:16용
per_page: 15
```

**인증:** `Authorization: YOUR_API_KEY` 헤더

**비용:** 무료 (레이트 리밋: 200 req/hour)

---

### YouTube Data API v3

**엔드포인트:** `https://www.googleapis.com/youtube/v3/videos`

**용도:** 영상 업로드, 메타데이터 업데이트, 분석 데이터 수집

**SDK:** `googleapis`

**업로드 시 주의:**
- resumable upload 사용 (대용량)
- `privacyStatus`: `"private"` → 승인 후 `"public"`
- `publishAt` 필드로 예약 공개

**쿼터:** 
- 일일 10,000 유닛
- 업로드 1건 = 1,600 유닛
- 하루 6개 업로드 가능 (여유 충분)

---

### Notion API

**엔드포인트:** `https://api.notion.com/v1/pages`

**용도:** 
- 영상 생성 시 DB에 페이지 생성
- 승인 상태 webhook 받기

**승인 흐름:**
1. 새 영상 → Notion DB 페이지 생성
2. 지혜씨가 Notion에서 ✅ 체크박스 클릭
3. Notion Webhook → 백엔드로 승인 알림
4. 백엔드가 YouTube 업로드 시작

**스키마 필드:**
- Title (제목)
- Channel (AI/Skin)
- Status (Pending/Approved/Rejected)
- Script (스크립트 전문)
- Preview (영상 미리보기 URL)
- Approved (체크박스)
- Scheduled At (예약 시간)

---

### Slack Webhook

**용도:** 영상 준비 완료 시 즉시 알림

**예시 메시지:**
```
🎬 [Layer AI Studio] 새 영상 준비됨
제목: "Claude Design Explained for Builders"
스크립트 길이: 147 words
미리보기: [Notion 링크]
승인 대기 중 ⏳
```

---

## 🔌 내부 API 엔드포인트

### 파이프라인 트리거
- `POST /pipeline/run` — 수동 파이프라인 실행
  - body: `{ channel: "AI" | "SKIN" }`

### 영상 관리
- `GET /videos?channel=&status=` — 영상 리스트
- `GET /videos/:id` — 영상 상세
- `PATCH /videos/:id/approve` — 승인
- `PATCH /videos/:id/reject` — 거절
- `DELETE /videos/:id` — 삭제

### Webhook
- `POST /webhooks/notion/approval` — Notion 승인 webhook
- `POST /webhooks/youtube/analytics` — YouTube 분석 데이터 (옵션)

### 헬스체크
- `GET /health` — 서비스 상태
- `GET /health/dependencies` — 외부 서비스 연결 상태

---

## 📂 디렉토리 구조 상세

```
layer-studio-pipeline/
├── src/                                   # NestJS 메인 소스
│   ├── main.ts                            # 애플리케이션 엔트리
│   ├── app.module.ts                      # 루트 모듈
│   │
│   ├── config/                            # 설정 관리
│   │   ├── env.validation.ts              # 환경변수 검증
│   │   └── app.config.ts
│   │
│   ├── common/                            # 공통 모듈
│   │   ├── filters/
│   │   │   └── http-exception.filter.ts
│   │   ├── interceptors/
│   │   │   └── logging.interceptor.ts
│   │   ├── guards/
│   │   │   └── webhook-auth.guard.ts
│   │   └── decorators/
│   │
│   ├── modules/                           # 기능 모듈
│   │   │
│   │   ├── pipeline/                      # 오케스트레이션 (핵심)
│   │   │   ├── pipeline.module.ts
│   │   │   ├── pipeline.service.ts
│   │   │   ├── pipeline.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── news/                          # RSS 뉴스 수집
│   │   │   ├── news.module.ts
│   │   │   ├── news.service.ts
│   │   │   ├── rss-parser.service.ts
│   │   │   └── news.service.spec.ts
│   │   │
│   │   ├── claude/                        # Claude API 래퍼
│   │   │   ├── claude.module.ts
│   │   │   ├── claude.service.ts
│   │   │   ├── curator.service.ts         # Haiku 큐레이션
│   │   │   ├── scriptwriter.service.ts    # Sonnet 스크립트
│   │   │   └── prompts/                   # 프롬프트 모음
│   │   │       ├── curation/
│   │   │       │   ├── ai.prompt.ts
│   │   │       │   └── skin.prompt.ts
│   │   │       └── scripting/
│   │   │           ├── ai.prompt.ts
│   │   │           └── skin.prompt.ts
│   │   │
│   │   ├── pexels/                        # B-roll 수급
│   │   │   ├── pexels.module.ts
│   │   │   ├── pexels.service.ts
│   │   │   └── interfaces/
│   │   │
│   │   ├── elevenlabs/                    # TTS
│   │   │   ├── elevenlabs.module.ts
│   │   │   ├── elevenlabs.service.ts
│   │   │   └── interfaces/
│   │   │
│   │   ├── video-renderer/                # Remotion 호출
│   │   │   ├── video-renderer.module.ts
│   │   │   ├── video-renderer.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── notion/                        # Notion 연동
│   │   │   ├── notion.module.ts
│   │   │   ├── notion.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── slack/                         # Slack 알림
│   │   │   ├── slack.module.ts
│   │   │   └── slack.service.ts
│   │   │
│   │   ├── youtube/                       # YouTube Data API
│   │   │   ├── youtube.module.ts
│   │   │   ├── youtube.service.ts
│   │   │   ├── oauth.service.ts
│   │   │   └── dto/
│   │   │
│   │   ├── videos/                        # 영상 CRUD
│   │   │   ├── videos.module.ts
│   │   │   ├── videos.service.ts
│   │   │   ├── videos.controller.ts
│   │   │   └── dto/
│   │   │
│   │   └── webhooks/                      # 웹훅 수신
│   │       ├── webhooks.module.ts
│   │       ├── webhooks.controller.ts
│   │       └── handlers/
│   │
│   ├── prisma/                            # Prisma 서비스
│   │   └── prisma.service.ts
│   │
│   └── health/                            # 헬스체크
│       ├── health.module.ts
│       └── health.controller.ts
│
├── remotion/                              # Remotion 영상 렌더링
│   ├── Root.tsx                           # Remotion 엔트리
│   ├── compositions/
│   │   ├── LayerAIStudio.tsx              # AI 채널 컴포지션
│   │   └── LayerSkinStudio.tsx            # Skin 채널 컴포지션
│   ├── components/
│   │   ├── Subtitle.tsx                   # 단어별 팝업 자막
│   │   ├── BRollScene.tsx                 # B-roll 영상
│   │   ├── BrandOverlay.tsx               # 브랜드 워터마크
│   │   ├── Intro.tsx
│   │   └── Outro.tsx
│   ├── themes/
│   │   ├── ai.theme.ts                    # AI 채널 컬러/폰트
│   │   └── skin.theme.ts                  # Skin 채널 컬러/폰트
│   └── public/
│       ├── fonts/
│       └── logos/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .github/
│   └── workflows/
│       ├── ci.yml                         # PR 체크
│       ├── daily-pipeline-ai.yml          # AI 채널 크론
│       └── daily-pipeline-skin.yml        # Skin 채널 크론
│
├── docs/
│   ├── SPEC.md                            # 이 파일
│   ├── WORKFLOW.md
│   ├── CONTENT.md
│   ├── SETUP.md
│   └── images/
│
├── scripts/                               # 유틸 스크립트
│   ├── seed-db.ts
│   ├── test-pipeline.ts
│   └── get-youtube-token.ts
│
├── test/                                  # E2E 테스트
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── output/                                # Remotion 렌더링 출력
│
├── CLAUDE.md
├── README.md
├── LICENSE
├── .env.example
├── .env                                   # (gitignore)
├── .gitignore
├── .nvmrc                                 # Node 버전
├── .eslintrc.js
├── .prettierrc
├── package.json                           # 통합 의존성
├── pnpm-lock.yaml
├── tsconfig.json                          # NestJS용
├── tsconfig.remotion.json                 # Remotion용 (필요시)
├── nest-cli.json
├── remotion.config.ts
└── docker-compose.yml                     # 로컬 PostgreSQL
```

---

## 📦 주요 의존성 (package.json)

```json
{
  "name": "layer-studio-pipeline",
  "version": "0.1.0",
  "scripts": {
    "dev": "nest start --watch",
    "build": "nest build",
    "start:prod": "node dist/main",
    "test": "jest",
    "lint": "eslint \"{src,test,remotion}/**/*.ts\" --fix",
    "remotion:dev": "remotion studio",
    "remotion:render": "remotion render",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  },
  "dependencies": {
    "@nestjs/common": "^10.x",
    "@nestjs/core": "^10.x",
    "@nestjs/config": "^3.x",
    "@nestjs/schedule": "^4.x",
    "@prisma/client": "^5.x",
    "@anthropic-ai/sdk": "^0.x",
    "@remotion/renderer": "^4.x",
    "@remotion/bundler": "^4.x",
    "remotion": "^4.x",
    "axios": "^1.x",
    "rss-parser": "^3.x",
    "googleapis": "^140.x",
    "@notionhq/client": "^2.x",
    "@aws-sdk/client-s3": "^3.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "date-fns": "^3.x",
    "react": "^18.x",
    "react-dom": "^18.x"
  },
  "devDependencies": {
    "@nestjs/cli": "^10.x",
    "@nestjs/testing": "^10.x",
    "prisma": "^5.x",
    "jest": "^29.x",
    "supertest": "^6.x",
    "typescript": "^5.x",
    "ts-node": "^10.x",
    "@types/node": "^20.x",
    "eslint": "^8.x",
    "prettier": "^3.x"
  }
}
```

---

## 🔄 버전 관리

### 프로덕션 업데이트 시
1. `dev` 브랜치에서 충분히 테스트
2. `dev` → `main` PR 생성
3. 리뷰 후 머지
4. 자동 배포 트리거

### 환경변수 추가 시
1. `.env.example` 업데이트 필수
2. `src/config/env.validation.ts` 검증 추가
3. 이 문서의 "환경 변수" 섹션 업데이트

---

_Last updated: 2026-04-21_
