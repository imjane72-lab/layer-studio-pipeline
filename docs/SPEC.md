# 기술 스펙 (SPEC.md)
 
> Layer Studio 프로젝트의 상세 기술 스펙 문서입니다.
> **한국어 음성 + 영어 자막** 전략에 맞춘 환경 변수, API, DB 스키마를 담고 있습니다.
 
---
 
## 📋 목차
 
1. [환경 변수](#환경-변수)
2. [데이터베이스 스키마](#데이터베이스-스키마)
3. [외부 API 스펙](#외부-api-스펙)
4. [내부 API 엔드포인트](#내부-api-엔드포인트)
5. [디렉토리 구조 상세](#디렉토리-구조-상세)
---
 
## 🔐 환경 변수
 
### Core
```bash
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://user:pass@localhost:5432/layer_studio
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
 
### Supertone Play (한국어 음성)
```bash
SUPERTONE_API_KEY=xxx
SUPERTONE_API_BASE=https://supertoneapi.com
SUPERTONE_VOICE_ID_KO=xxx             # Play 웹에서 등록한 지혜씨 복제 보이스 ID
SUPERTONE_MODEL=sona_speech_1         # 최신 TTS 모델
SUPERTONE_LANGUAGE=ko
SUPERTONE_STYLE=neutral               # 채널별로 오버라이드 (ai=neutral, skin=warm)
SUPERTONE_PITCH_SHIFT=0
SUPERTONE_PITCH_VARIANCE=1
SUPERTONE_SPEED=1
SUPERTONE_TIMEOUT_MS=60000
SUPERTONE_RATE_LIMIT_PER_MIN=20       # API 레이트 리밋 (분당 20회)
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
YOUTUBE_REFRESH_TOKEN_AI=xxx
YOUTUBE_REFRESH_TOKEN_SKIN=xxx
YOUTUBE_CHANNEL_ID_AI=UCxxx
YOUTUBE_CHANNEL_ID_SKIN=UCxxx
```
 
### Notion
```bash
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID_AI=xxx
NOTION_DATABASE_ID_SKIN=xxx
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
 
### RSS 피드
```bash
# AI 채널용 (한국 + 글로벌 혼합)
RSS_FEEDS_AI=https://techcrunch.com/category/artificial-intelligence/feed/,https://www.anthropic.com/rss,https://news.hada.io/rss/news
 
# K-Beauty 채널용 (한국 + 글로벌)
RSS_FEEDS_SKIN=https://www.allure.com/feed/rss,https://www.beautynury.com/rss
```
 
---
 
## 🗄️ 데이터베이스 스키마
 
### schema.prisma
 
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
  source      String
  publishedAt DateTime
  fetchedAt   DateTime @default(now())
  
  titleHash   String   @unique
  selected    Boolean  @default(false)
  
  // 소스 언어 (한국어 뉴스 vs 영어 뉴스)
  sourceLang  String   @default("ko") // "ko" | "en"
  
  videos      Video[]
  
  @@index([channel, publishedAt])
  @@index([fetchedAt])
}
 
// ==================== 영상 ====================
 
enum VideoStatus {
  PENDING
  READY
  APPROVED
  REJECTED
  SCHEDULED
  PUBLISHED
  FAILED
}
 
model Video {
  id             String      @id @default(cuid())
  channel        Channel
  status         VideoStatus @default(PENDING)
  
  // 한국어 원본
  titleKo        String
  scriptKo       String      @db.Text
  
  // 영어 번역 (YouTube에 보여지는 것)
  titleEn        String                    // YouTube 제목
  descriptionEn  String      @db.Text      // YouTube 설명
  scriptEn       String      @db.Text      // 영어 자막 원본
  tags           String[]                  // 영어 태그
  
  // 자막 데이터 (JSON)
  subtitleSegments Json                    // 문장 단위 타임스탬프 (ko ↔ en 매칭)
  
  // 소스
  newsItemId     String?
  newsItem       NewsItem?   @relation(fields: [newsItemId], references: [id])
  
  // 에셋
  videoUrl       String?     // 최종 렌더링 영상
  thumbnailUrl   String?
  audioUrl       String?     // Supertone 한국어 음성
  subtitleUrl    String?     // SRT 자막 파일 (영어)
  
  // TTS 메타데이터
  ttsProvider    String      @default("supertone")
  ttsVoiceId     String?
  ttsCredits     Int?        // 소모 크레딧 (모니터링용)
  ttsDurationSec Float?      // 음성 길이 (초)
  
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
  
  createdAt      DateTime    @default(now())
  updatedAt      DateTime    @updatedAt
  
  assets         VideoAsset[]
  
  @@index([channel, status])
  @@index([status, createdAt])
}
 
// ==================== 영상 에셋 ====================
 
enum AssetType {
  B_ROLL
  IMAGE
  AUDIO_NARRATION_KO    // 한국어 나레이션 (Supertone 생성)
  AUDIO_BGM
  SUBTITLE_SRT_EN       // 영어 SRT 자막
  SUBTITLE_DATA         // 자막 타임스탬프 JSON
}
 
model VideoAsset {
  id        String    @id @default(cuid())
  videoId   String
  video     Video     @relation(fields: [videoId], references: [id], onDelete: Cascade)
  
  type      AssetType
  url       String
  metadata  Json
  order     Int       @default(0)
  
  createdAt DateTime  @default(now())
  
  @@index([videoId, type])
}
 
// ==================== 파이프라인 실행 로그 ====================
 
enum PipelineStep {
  NEWS_FETCH
  NEWS_CURATE
  SCRIPT_GENERATE_KO       // 한국어 스크립트 생성
  SCRIPT_TRANSLATE_EN      // 영어 번역
  BROLL_FETCH
  TTS_GENERATE_KO          // 한국어 TTS (Supertone)
  SUBTITLE_GENERATE_EN     // 영어 자막 생성
  VIDEO_RENDER
  NOTION_CREATE
  SLACK_NOTIFY
  APPROVAL
  YOUTUBE_UPLOAD
  YOUTUBE_CAPTION_UPLOAD   // 공식 영어 자막 별도 업로드
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
  status    String
  
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
  service    String   // "claude" | "supertone" | "pexels" | ...
  endpoint   String?
  
  tokensIn   Int?
  tokensOut  Int?
  charCount  Int?
  credits    Int?     // Supertone 크레딧 등
  
  cost       Decimal  @db.Decimal(10, 4)
  
  videoId    String?
  createdAt  DateTime @default(now())
  
  @@index([service, createdAt])
}
```
 
---
 
## 🌐 외부 API 스펙
 
### Claude API
 
**용도:**
- Haiku: 뉴스 큐레이션
- Sonnet: 한국어 스크립트 작성, 영어 번역, 메타데이터 생성
**주의:** 
- 한국어 스크립트 생성과 영어 번역은 **분리된 호출**로 실행
- 번역 시 원본 한국어의 **문장 경계를 유지**해야 자막 매칭 가능
---
 
### Supertone Play API (한국어)
 
**베이스 URL:** `https://supertoneapi.com`
 
**용도:** 한국어 스크립트 → 복제된 한국어 음성 생성
 
**인증:** HTTP 헤더 `x-sup-api-key: $SUPERTONE_API_KEY`
 
#### Predict Duration (크레딧 차감 전 미리 계산)
 
**엔드포인트:** `POST /v1/text-to-speech/{voice_id}/predict-duration`
 
**요청 본문:**
```json
{
  "text": "Claude는 최근 새로운 에이전트 SDK를 공개했습니다.",
  "language": "ko",
  "style": "neutral",
  "voice_settings": {
    "pitch_shift": 0,
    "pitch_variance": 1,
    "speed": 1
  }
}
```
 
**응답:**
```json
{
  "duration_seconds": 2.48,
  "estimated_credits": 25
}
```
 
> 💡 이 엔드포인트는 **크레딧을 차감하지 않음**. 실제 합성 전 비용 예측용.
 
#### Text-to-Speech (실제 음성 합성)
 
**엔드포인트:** `POST /v1/text-to-speech/{voice_id}`
 
**요청 본문:**
```json
{
  "text": "Claude는 최근 새로운 에이전트 SDK를 공개했습니다.",
  "language": "ko",
  "style": "neutral",
  "model": "sona_speech_1",
  "voice_settings": {
    "pitch_shift": 0,
    "pitch_variance": 1,
    "speed": 1
  },
  "output_format": "mp3"
}
```
 
**응답:**
- `audio`: MP3 바이너리 (또는 base64)
- `duration`: 전체 음성 길이 (초)
- `credits_used`: 차감된 크레딧 수
**레이트 리밋:** 분당 20회 — 병렬 처리 시 큐/레이트 리미터 필수
 
#### 문장 단위 타임스탬프 확보 전략
 
Supertone API는 단어별 타임스탬프를 반환하지 않을 수 있음. 이 경우 **문장 단위 분할 호출** 방식 사용:
 
1. 한국어 스크립트를 문장으로 분할 (마침표/물음표/느낌표 기준)
2. 각 문장을 **개별 API 호출**로 합성 → 각 문장의 duration 획득
3. 문장별 오디오를 순차 연결 (FFmpeg 또는 Remotion 내 audio sequence)
4. 각 문장의 누적 시작 시각이 곧 자막 타임스탬프
**처리 로직 예시:**
```typescript
const sentences = splitSentences(scriptKo);
const segments = [];
let cumulativeTime = 0;
 
for (const [idx, sentence] of sentences.entries()) {
  const { audio, duration } = await supertone.synthesize(sentence);
  segments.push({
    index: idx,
    koText: sentence,
    enText: enSentences[idx],  // 번역에서 문장 경계 유지 전제
    start: cumulativeTime,
    end: cumulativeTime + duration,
    audioBuffer: audio,
  });
  cumulativeTime += duration;
}
```
 
**비용:**
- 크레딧 1초당 약 10 크레딧 소모
- Creator 플랜: 월 100,000 크레딧 (약 170분 상당, 월 $10 수준)
- 쇼츠 1편 약 45초 → 450 크레딧 → 월 30편 × 450 = 13,500 크레딧 (여유 많음)
**주의사항:**
- 클론 보이스 **생성**은 Supertone Play **웹 UI**에서만 가능 (15초 샘플)
- API는 **등록된 보이스 호출만** 지원
- Play 웹과 API는 **동일 크레딧 풀** 공유
---
 
### Pexels API
 
기존과 동일. 변경 없음.
 
---
 
### YouTube Data API v3
 
**주의: 한국어 음성 + 영어 자막 업로드**
 
```typescript
const response = await youtube.videos.insert({
  // ...
  requestBody: {
    snippet: {
      title: metadata.titleEn,           // 영어 제목
      description: metadata.descriptionEn, // 영어 설명
      tags: metadata.tags,
      categoryId: '28',
      defaultLanguage: 'en',             // 영어로 설정 (자막이 영어이므로)
      defaultAudioLanguage: 'ko',        // 오디오는 한국어
    },
    // ...
  },
  media: {
    body: fs.createReadStream(videoPath),
  },
});
```
 
**자막 별도 업로드 (권장):**
```typescript
// SRT 자막 파일을 YouTube에 업로드
await youtube.captions.insert({
  part: ['snippet'],
  requestBody: {
    snippet: {
      videoId,
      language: 'en',
      name: 'English',
      isDraft: false,
    },
  },
  media: {
    body: fs.createReadStream(srtPath),
  },
});
```
 
**장점:** 
- 영어 자막을 공식 자막으로 등록 → YouTube 검색에 영어 키워드로 노출
- 영상에 구워진(번인) 영어 자막 + 공식 영어 자막 **둘 다** 제공
- 이 공식 영어 자막을 소스로 YouTube가 **스페인어/독일어 등 3차 언어 자동 번역** 제공 → 공짜 다국어 도달
- 자동 STT 캡션보다 퀄리티 훨씬 좋음 (한국어 인식 오류 없음)
**왜 YouTube 자동 번역에만 의존하지 않는가:**
- Shorts 시청자는 자막 설정을 건드리지 않음 → 번인 자막 필수
- 한국어 자동 STT 품질이 낮음 (고유명사·성분명 오인식)
- "진정성 있는 퀄리티 콘텐츠" 브랜드 이미지와 충돌
- 검색 인덱싱은 번인 자막 + 공식 자막 기반으로 이루어짐
---
 
### Notion API
 
**승인 카드 필드 (이중 언어):**
- Title Ko (한국어 제목)
- Title En (영어 제목)
- Channel (AI/Skin)
- Status (Pending/Approved/Rejected)
- Script Ko (한국어 스크립트)
- Script En (영어 자막)
- Audio Preview (한국어 음성)
- Video Preview (최종 영상)
- TTS Credits (소모된 Supertone 크레딧)
- Approved (체크박스)
- Scheduled At
---
 
### Slack Webhook
 
메시지에 한국어 + 영어 정보 모두 포함:
```
🎬 [Layer AI Studio] 새 영상 준비됨
KO: "Claude가 새로운 SDK를 공개했다"
EN: "Claude Unveils New SDK for Builders"
음성 길이: 58초 (580 크레딧)
미리보기: [Notion 링크]
```
 
---
 
## 🔌 내부 API 엔드포인트
 
### 파이프라인 트리거
- `POST /pipeline/run` — 수동 실행
  - body: `{ channel: "AI" | "SKIN" }`
### 영상 관리
- `GET /videos?channel=&status=` — 리스트
- `GET /videos/:id` — 상세 (한국어 + 영어 모두)
- `PATCH /videos/:id/approve` — 승인
- `PATCH /videos/:id/reject` — 거절
- `PATCH /videos/:id/script-ko` — 한국어 스크립트 수동 수정
- `PATCH /videos/:id/script-en` — 영어 자막 수동 수정
- `POST /videos/:id/regenerate-audio` — 한국어 음성 재생성 (Supertone)
- `DELETE /videos/:id` — 삭제
### Webhook
- `POST /webhooks/notion/approval`
- `POST /webhooks/youtube/analytics`
### 헬스체크
- `GET /health`
- `GET /health/dependencies`
---
 
## 📂 디렉토리 구조 상세
 
```
layer-studio-pipeline/
├── src/
│   ├── main.ts
│   ├── app.module.ts
│   │
│   ├── config/
│   │   ├── env.validation.ts
│   │   └── app.config.ts
│   │
│   ├── common/
│   │   ├── filters/
│   │   ├── interceptors/
│   │   ├── guards/
│   │   └── decorators/
│   │
│   ├── modules/
│   │   │
│   │   ├── pipeline/                      # 오케스트레이션
│   │   │   ├── pipeline.module.ts
│   │   │   ├── pipeline.service.ts
│   │   │   ├── pipeline.controller.ts
│   │   │   └── dto/
│   │   │
│   │   ├── news/
│   │   │   ├── news.module.ts
│   │   │   ├── news.service.ts
│   │   │   └── rss-parser.service.ts
│   │   │
│   │   ├── claude/                        # Claude API
│   │   │   ├── claude.module.ts
│   │   │   ├── claude.service.ts
│   │   │   ├── curator.service.ts         # Haiku 큐레이션
│   │   │   ├── scriptwriter-ko.service.ts # 한국어 스크립트
│   │   │   ├── translator.service.ts      # 영어 번역
│   │   │   └── prompts/
│   │   │       ├── curation/
│   │   │       ├── scripting-korean/      # 한국어 스크립트 프롬프트
│   │   │       ├── translation/           # 영어 번역 프롬프트
│   │   │       └── metadata/              # YouTube 메타데이터 (영어)
│   │   │
│   │   ├── pexels/
│   │   │   ├── pexels.module.ts
│   │   │   └── pexels.service.ts
│   │   │
│   │   ├── tts/                           # TTS 추상화 레이어
│   │   │   ├── tts.module.ts
│   │   │   ├── tts-provider.interface.ts  # 프로바이더 인터페이스
│   │   │   └── providers/
│   │   │       └── supertone.provider.ts  # Supertone 구현체
│   │   │
│   │   ├── subtitle/                      # 영어 자막 처리
│   │   │   ├── subtitle.module.ts
│   │   │   ├── subtitle.service.ts
│   │   │   ├── srt-generator.service.ts   # SRT 파일 생성
│   │   │   ├── sentence-splitter.service.ts # 문장 분할
│   │   │   └── timing-matcher.service.ts  # 한국어 ↔ 영어 타이밍 매칭
│   │   │
│   │   ├── video-renderer/
│   │   │   ├── video-renderer.module.ts
│   │   │   └── video-renderer.service.ts
│   │   │
│   │   ├── notion/
│   │   │   ├── notion.module.ts
│   │   │   └── notion.service.ts
│   │   │
│   │   ├── slack/
│   │   │   ├── slack.module.ts
│   │   │   └── slack.service.ts
│   │   │
│   │   ├── youtube/
│   │   │   ├── youtube.module.ts
│   │   │   ├── youtube.service.ts
│   │   │   ├── caption-upload.service.ts  # 공식 영어 자막 업로드
│   │   │   └── oauth.service.ts
│   │   │
│   │   ├── videos/
│   │   │   ├── videos.module.ts
│   │   │   ├── videos.service.ts
│   │   │   └── videos.controller.ts
│   │   │
│   │   └── webhooks/
│   │       ├── webhooks.module.ts
│   │       └── webhooks.controller.ts
│   │
│   ├── prisma/
│   │   └── prisma.service.ts
│   │
│   └── health/
│       ├── health.module.ts
│       └── health.controller.ts
│
├── remotion/
│   ├── Root.tsx
│   ├── compositions/
│   │   ├── LayerAIStudio.tsx
│   │   └── LayerSkinStudio.tsx
│   ├── components/
│   │   ├── KoreanAudio.tsx                # 한국어 오디오 (Supertone 생성)
│   │   ├── EnglishSubtitle.tsx            # 영어 자막 (문장별)
│   │   ├── BRollScene.tsx
│   │   ├── BrandOverlay.tsx
│   │   ├── Intro.tsx
│   │   └── Outro.tsx
│   ├── themes/
│   │   ├── ai.theme.ts
│   │   └── skin.theme.ts
│   └── public/
│       ├── fonts/
│       │   ├── Pretendard-Variable.woff2  # 한국어 폰트
│       │   └── Inter-Variable.woff2       # 영어 폰트
│       └── logos/
│
├── prisma/
│   ├── schema.prisma
│   └── migrations/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── daily-pipeline-ai.yml
│       └── daily-pipeline-skin.yml
│
├── docs/
│   ├── SPEC.md
│   ├── WORKFLOW.md
│   ├── CONTENT.md
│   ├── SETUP.md
│   └── images/
│
├── scripts/
│   ├── seed-db.ts
│   ├── test-pipeline.ts
│   ├── test-supertone.ts           # Supertone TTS 테스트
│   └── get-youtube-token.ts
│
├── test/
│   ├── app.e2e-spec.ts
│   └── jest-e2e.json
│
├── output/                         # 렌더링 출력
│
├── CLAUDE.md
├── README.md
├── LICENSE
├── .env.example
├── .env
├── .gitignore
├── .nvmrc
├── .eslintrc.js
├── .prettierrc
├── package.json
├── pnpm-lock.yaml
├── tsconfig.json
├── tsconfig.remotion.json
├── nest-cli.json
├── remotion.config.ts
└── docker-compose.yml
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
    "prisma:migrate": "prisma migrate dev",
    "test:supertone": "ts-node scripts/test-supertone.ts"
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
    "bottleneck": "^2.x",                // Supertone 레이트 리밋용
    "rss-parser": "^3.x",
    "googleapis": "^140.x",
    "@notionhq/client": "^2.x",
    "@aws-sdk/client-s3": "^3.x",
    "class-validator": "^0.14.x",
    "class-transformer": "^0.5.x",
    "date-fns": "^3.x",
    "react": "^18.x",
    "react-dom": "^18.x",
    "subtitle": "^4.x"                   // SRT 파싱/생성
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
 
_Last updated: 2026-04-22_
 
