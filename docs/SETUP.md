# 개발 환경 설정 가이드 (SETUP.md)

> Layer Studio 프로젝트를 처음 시작할 때 필요한 모든 셋업 과정을 담고 있습니다.
> 단계별로 따라 하면 로컬 환경에서 파이프라인을 실행할 수 있습니다.

---

## 📋 목차

1. [사전 요구사항](#사전-요구사항)
2. [프로젝트 초기화](#프로젝트-초기화)
3. [데이터베이스 설정](#데이터베이스-설정)
4. [외부 서비스 키 발급](#외부-서비스-키-발급)
5. [환경 변수 설정](#환경-변수-설정)
6. [첫 실행](#첫-실행)
7. [개발 워크플로](#개발-워크플로)
8. [트러블슈팅](#트러블슈팅)

---

## 🛠️ 사전 요구사항

### 필수 설치

- **Node.js 25.x** (현재 프로젝트 기준, 최소 20+)
  - 확인: `node --version`
  - 설치: [nodejs.org](https://nodejs.org) 또는 `nvm install 25`

- **pnpm 9.x**
  - 확인: `pnpm --version`
  - 설치: `npm install -g pnpm`

- **PostgreSQL 15+**
  - 로컬 설치 또는 Docker
  - 확인: `psql --version`

- **Git**
  - 확인: `git --version`

### 권장 도구

- **VSCode** + 확장프로그램:
  - ESLint
  - Prettier
  - Prisma
  - GitLens
  - Thunder Client (API 테스트)

- **TablePlus** 또는 **DBeaver** (DB 관리)

### 계정 필수

- GitHub 계정 (`imjane72-lab`)
- AWS 계정 (S3용)
- Google 계정 (YouTube, Gmail)
- Anthropic 계정 (Claude API)
- ElevenLabs 계정
- Pexels 계정
- Notion 계정
- Slack 워크스페이스

---

## 🚀 프로젝트 초기화

### 1. 리포 클론

```bash
cd ~/Documents  # 또는 원하는 위치
git clone https://github.com/imjane72-lab/layer-studio-pipeline.git
cd layer-studio-pipeline
```

### 2. 의존성 설치

```bash
# 단일 프로젝트이므로 한 번만 설치
pnpm install
```

**이 명령 하나로 NestJS + Remotion 의존성 모두 설치됩니다.**

### 3. 환경 변수 파일 생성

```bash
cp .env.example .env
# .env 파일을 열어서 값 입력 (아래 섹션 참고)
```

---

## 🗄️ 데이터베이스 설정

### 옵션 A: Docker 사용 (권장)

```bash
# docker-compose.yml 사용
docker-compose up -d postgres
```

**docker-compose.yml 예시:**
```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    container_name: layer-studio-db
    ports:
      - '5432:5432'
    environment:
      POSTGRES_USER: layer
      POSTGRES_PASSWORD: layer_dev
      POSTGRES_DB: layer_studio
    volumes:
      - postgres_data:/var/lib/postgresql/data
volumes:
  postgres_data:
```

### 옵션 B: 로컬 설치

**Mac:**
```bash
brew install postgresql@15
brew services start postgresql@15
createdb layer_studio
```

**Windows:** PostgreSQL 공식 인스톨러 사용

### Prisma 마이그레이션

```bash
# Prisma 클라이언트 생성
pnpm prisma generate

# 마이그레이션 실행
pnpm prisma migrate dev --name init

# 시드 데이터 (옵션)
pnpm prisma db seed
```

### DB 확인

```bash
pnpm prisma studio  # 브라우저에서 DB 볼 수 있음
```

---

## 🔑 외부 서비스 키 발급

### 1. Anthropic (Claude API)

1. [console.anthropic.com](https://console.anthropic.com) 가입
2. Settings → API Keys → Create Key
3. 키 복사 → `.env`의 `ANTHROPIC_API_KEY`
4. 결제 수단 등록 (Pay-as-you-go)
5. **예상 비용:** 월 $15-25

### 2. ElevenLabs (Voice Cloning)

1. [elevenlabs.io](https://elevenlabs.io) 가입
2. Creator 플랜 구독 ($11/월)
3. Voice Lab → Professional Voice Cloning
4. 본인 목소리 10분 녹음 업로드
5. Voice ID 확인 → `.env`의 `ELEVENLABS_VOICE_ID`
6. Profile → API Keys → 키 복사

### 3. Pexels API

1. [pexels.com/api](https://www.pexels.com/api/) 가입
2. API Key 발급 (무료)
3. 키 복사 → `.env`의 `PEXELS_API_KEY`

### 4. YouTube Data API

**Google Cloud Console 설정:**

1. [console.cloud.google.com](https://console.cloud.google.com) 접속
2. 새 프로젝트 생성: "Layer Studio"
3. API 라이브러리 → "YouTube Data API v3" 활성화
4. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID 생성
   - 애플리케이션 유형: 데스크톱 앱
   - 이름: "Layer Studio CLI"
5. JSON 다운로드 → 클라이언트 ID/Secret 추출

**OAuth 토큰 발급:**

```bash
# 별도 스크립트로 토큰 발급 (한 번만)
pnpm ts-node scripts/get-youtube-token.ts --channel=ai
# 브라우저 열림 → Layer AI Studio 계정으로 로그인 → 승인
# refresh_token 출력됨 → .env에 저장

pnpm ts-node scripts/get-youtube-token.ts --channel=skin
# Layer Skin Studio 계정으로 동일 과정
```

### 5. Notion API

1. [notion.so/my-integrations](https://www.notion.so/my-integrations) 접속
2. "New integration" 클릭
3. 이름: "Layer Studio", 워크스페이스 선택
4. Internal Integration Token 복사 → `.env`의 `NOTION_API_KEY`

**DB 생성:**

1. Notion에서 새 페이지 → 데이터베이스 → "Layer AI Studio Videos"
2. 필드 추가:
   - Title (title)
   - Status (select: Pending, Approved, Rejected, Published)
   - Script (text)
   - Video Preview (url)
   - Approved (checkbox)
   - Scheduled At (date)
   - Created At (date)
3. 페이지 오른쪽 상단 `...` → Connections → Layer Studio 추가
4. URL에서 DB ID 추출: `notion.so/xxx?v=yyy` → `xxx`가 DB ID
5. `.env`의 `NOTION_DATABASE_ID_AI`에 저장
6. Skin 채널용 DB도 동일하게 생성

### 6. Slack Webhook

1. [api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. "From scratch" → 이름 "Layer Studio Bot"
3. Incoming Webhooks 활성화
4. Add New Webhook to Workspace → 채널 선택
5. Webhook URL 복사 → `.env`의 `SLACK_WEBHOOK_URL`

### 7. AWS S3

1. AWS 콘솔 → S3 → 버킷 생성
   - 이름: `layer-studio-assets`
   - 리전: `ap-northeast-2` (서울)
2. IAM → 사용자 생성: "layer-studio-backend"
3. 정책 연결: S3FullAccess (또는 커스텀 정책)
4. Access Key 발급 → `.env`에 저장

---

## 🔐 환경 변수 설정

`.env` 파일을 아래와 같이 채우세요:

```bash
# ========== Core ==========
NODE_ENV=development
PORT=3000
LOG_LEVEL=debug
DATABASE_URL=postgresql://layer:layer_dev@localhost:5432/layer_studio
TZ=Asia/Seoul

# ========== Claude ==========
ANTHROPIC_API_KEY=sk-ant-xxx
CLAUDE_MODEL_HAIKU=claude-haiku-4-5-20251001
CLAUDE_MODEL_SONNET=claude-sonnet-4-6
CLAUDE_MAX_TOKENS=4096
CLAUDE_TEMPERATURE=0.7
CLAUDE_TIMEOUT_MS=60000

# ========== ElevenLabs ==========
ELEVENLABS_API_KEY=xxx
ELEVENLABS_VOICE_ID=xxx
ELEVENLABS_MODEL_ID=eleven_multilingual_v2
ELEVENLABS_STABILITY=0.5
ELEVENLABS_SIMILARITY_BOOST=0.75
ELEVENLABS_TIMEOUT_MS=120000

# ========== Pexels ==========
PEXELS_API_KEY=xxx
PEXELS_PER_PAGE=15
PEXELS_TIMEOUT_MS=10000

# ========== YouTube ==========
YOUTUBE_CLIENT_ID=xxx.apps.googleusercontent.com
YOUTUBE_CLIENT_SECRET=xxx
YOUTUBE_REFRESH_TOKEN_AI=xxx
YOUTUBE_REFRESH_TOKEN_SKIN=xxx
YOUTUBE_CHANNEL_ID_AI=UCxxx
YOUTUBE_CHANNEL_ID_SKIN=UCxxx

# ========== Notion ==========
NOTION_API_KEY=secret_xxx
NOTION_DATABASE_ID_AI=xxx
NOTION_DATABASE_ID_SKIN=xxx

# ========== Slack ==========
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/xxx/xxx/xxx
SLACK_CHANNEL=#layer-studio

# ========== AWS S3 ==========
AWS_ACCESS_KEY_ID=xxx
AWS_SECRET_ACCESS_KEY=xxx
AWS_REGION=ap-northeast-2
AWS_S3_BUCKET=layer-studio-assets

# ========== RSS Feeds ==========
RSS_FEEDS_AI=https://techcrunch.com/category/artificial-intelligence/feed/,https://www.theverge.com/rss/index.xml
RSS_FEEDS_SKIN=https://www.allure.com/feed/rss
```

**⚠️ 중요:** `.env` 파일은 **절대 Git에 올리면 안 됨**. `.gitignore`에 포함 확인.

---

## 🏃 첫 실행

### NestJS 개발 서버

```bash
pnpm dev
# http://localhost:3000 실행
```

### 헬스체크

```bash
curl http://localhost:3000/health
# 응답: { "status": "ok", "timestamp": "..." }
```

### 외부 API 연결 테스트

```bash
curl http://localhost:3000/health/dependencies
# 각 API 연결 상태 확인
```

### 파이프라인 수동 실행 (전체 플로우 테스트)

```bash
# AI 채널 1회 실행
curl -X POST http://localhost:3000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"channel": "AI"}'
```

로그에서 각 단계 진행 확인 가능.

### Remotion 미리보기

```bash
pnpm remotion:dev
# http://localhost:3001 에서 영상 미리보기
```

**참고:** Remotion Studio는 개발 중 영상 컴포지션을 시각적으로 확인할 때만 사용합니다. 실제 렌더링은 NestJS 백엔드가 프로그래매틱하게 호출합니다.

---

## 🔄 개발 워크플로

### 일반 개발 흐름

```bash
# 1. 최신 코드 pull
git checkout dev
git pull origin dev

# 2. feature 브랜치 생성
git checkout -b feat/news-module

# 3. 개발
# ... 코드 작성 ...

# 4. 로컬 테스트
pnpm test
pnpm lint
pnpm build

# 5. 커밋 & 푸시
git add .
git commit -m "feat: add news module with RSS parser"
git push origin feat/news-module

# 6. GitHub에서 PR 생성 (dev 브랜치로)
# 7. 리뷰 후 머지
```

### 자주 쓰는 명령어

```bash
# 개발 서버 실행
pnpm dev

# 전체 테스트
pnpm test

# 특정 모듈 테스트
pnpm test -- news

# Lint 체크
pnpm lint

# 타입 체크
pnpm type-check

# 빌드
pnpm build

# Prisma 스키마 변경 후
pnpm prisma migrate dev --name describe_changes

# Prisma 스튜디오
pnpm prisma studio

# Remotion Studio
pnpm remotion:dev

# Remotion 렌더링 테스트
pnpm remotion:render LayerAIStudio out.mp4
```

### Claude Code 활용

Claude Code로 개발 시 효과적인 패턴:

```
"CLAUDE.md와 docs/SPEC.md 참고해서,
 src/modules/news 모듈을 구현해줘.
 WORKFLOW.md의 1번 단계(뉴스 RSS 수집)에 맞게 만들어줘."

"docs/CONTENT.md의 AI 채널 스크립트 프롬프트를 
 src/modules/claude/prompts/scripting/ai.prompt.ts로 구현해줘."

"현재 프로젝트 구조 분석하고, 
 src/modules/pipeline 서비스 설계 제안해줘."
```

---

## 🐛 트러블슈팅

### 일반 문제

#### "Cannot find module" 에러
```bash
# 의존성 재설치
pnpm install
pnpm prisma generate
```

#### Prisma 에러
```bash
# 스키마 재생성
pnpm prisma generate
# 마이그레이션 초기화 (개발 환경만!)
pnpm prisma migrate reset
```

#### 포트 충돌
```bash
# 사용 중인 포트 확인
lsof -i :3000
# 프로세스 종료
kill -9 <PID>
```

### API 관련

#### Claude API 401 에러
- API 키 확인
- 계정 결제 수단 확인
- 레이트 리밋 체크

#### ElevenLabs 429 에러
- 크레딧 잔량 확인
- 재시도 간격 증가

#### YouTube 업로드 403
- OAuth 토큰 만료 여부 (refresh token 재발급)
- API 쿼터 확인 (일일 10,000 유닛)

#### Pexels 검색 결과 없음
- 키워드 너무 구체적 (일반화 시도)
- 세로 포맷 없을 수도 (가로 허용으로 fallback)

### Remotion 관련

#### 렌더링 실패
```bash
# Remotion 캐시 클리어
rm -rf node_modules/.remotion-cache

# Remotion Studio에서 먼저 시각적 확인
pnpm remotion:dev
```

#### 폰트 로딩 안 됨
- `remotion/public/fonts/` 경로 확인
- 폰트 파일 포맷 (TTF, WOFF2)
- `remotion/Root.tsx`에 폰트 로드 코드 있는지 확인

#### 메모리 부족 에러
```bash
# Node 메모리 한도 증가
NODE_OPTIONS="--max-old-space-size=4096" pnpm remotion:render
```

### Docker 관련

#### PostgreSQL 접속 안 됨
```bash
# 컨테이너 상태 확인
docker ps
# 재시작
docker-compose restart postgres
# 로그 확인
docker logs layer-studio-db
```

---

## 🔐 보안 주의사항

1. **`.env` 절대 커밋하지 않기**
2. **API 키 노출 시 즉시 재발급**
3. **AWS 키는 IAM 정책 최소화**
4. **프로덕션 DB 비밀번호는 복잡하게**
5. **OAuth 토큰은 DB나 secret manager에 암호화 저장**

---

## 📦 배포 (추후)

### 권장 스택: **Railway**

이유:
- skindit과 유사한 복잡도
- 빠른 배포
- PostgreSQL 편리
- 월 비용 예측 가능 ($5~20)
- Remotion 렌더링도 같은 서버에서 가능

**배포 개요:**
1. Railway 계정 생성, GitHub 연결
2. 새 프로젝트 → layer-studio-pipeline 연결
3. PostgreSQL 추가
4. 환경 변수 전부 복사
5. 자동 배포 설정

---

## 📞 도움 요청

문제 발생 시:

1. `docs/` 폴더 다시 확인
2. 로그 체크
3. GitHub Issues에 등록

---

_Last updated: 2026-04-21_
