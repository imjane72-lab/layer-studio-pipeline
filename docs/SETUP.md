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
 
- **Node.js 20.x LTS** 이상
- **pnpm 9.x**
- **PostgreSQL 15+**
- **FFmpeg** (Supertone 문장별 오디오 병합용)
- **Git**
**FFmpeg 설치:**
```bash
# Mac
brew install ffmpeg
 
# Ubuntu/Debian
sudo apt-get install ffmpeg
 
# 확인
ffmpeg -version
```
 
### 권장 도구
 
- **VSCode** + 확장프로그램 (ESLint, Prettier, Prisma, GitLens)
- **TablePlus** 또는 **DBeaver**
### 계정 필수
 
- GitHub 계정 (`imjane72-lab`)
- AWS 계정 (S3용)
- Google 계정 (YouTube, Gmail) × 2 (채널별)
- Anthropic 계정 (Claude API)
- **Supertone 계정** (Play Creator 플랜 이상 권장)
- Pexels 계정
- Notion 계정
- Slack 워크스페이스
---
 
## 🚀 프로젝트 초기화
 
### 1. 리포 클론
 
```bash
cd ~/Documents
git clone https://github.com/imjane72-lab/layer-studio-pipeline.git
cd layer-studio-pipeline
```
 
### 2. 의존성 설치
 
```bash
pnpm install
```
 
### 3. 환경 변수 파일 생성
 
```bash
cp .env.example .env
# .env 파일 열어서 값 입력
```
 
---
 
## 🗄️ 데이터베이스 설정
 
### 옵션 A: Docker (권장)
 
```bash
docker-compose up -d postgres
```
 
**docker-compose.yml:**
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
 
### Prisma 마이그레이션
 
```bash
pnpm prisma generate
pnpm prisma migrate dev --name init
pnpm prisma db seed  # 옵션
```
 
### DB 확인
 
```bash
pnpm prisma studio
```
 
---
 
## 🔑 외부 서비스 키 발급
 
### 1. Anthropic (Claude API)
 
1. [console.anthropic.com](https://console.anthropic.com) 가입
2. Settings → API Keys → Create Key
3. 키 복사 → `.env`의 `ANTHROPIC_API_KEY`
4. 결제 수단 등록
5. **예상 비용:** 월 $15-25
### 2. Supertone Play (한국어 Voice Cloning) 🇰🇷
 
**중요: 한국어 음성 복제**
 
**Step 1: Play 웹에서 보이스 클로닝 생성**
 
1. [supertone.ai/ko/play](https://www.supertone.ai/ko/play) 가입
2. **Creator 플랜 구독** (월 100,000 크레딧, 약 170분)
   - Free 플랜(월 3,000 크레딧)으로도 초기 테스트 가능
3. 보이스 클로닝 메뉴 진입
4. **한국어 샘플 15초~1분 녹음** 업로드 또는 직접 녹음
   - 조용한 환경, 좋은 마이크 (스마트폰 기본 마이크도 가능)
   - Supertone이 제공하는 **스크립트 읽기** 필수
5. AI 학습 대기 (수 초 ~ 1분, ElevenLabs보다 훨씬 빠름)
6. **생성된 보이스 ID 확인** → `.env`의 `SUPERTONE_VOICE_ID_KO`
   - Play 내 보이스 상세 페이지 또는 API Get Voices 호출로 확인 가능
**Step 2: API 키 발급**
 
1. [console.supertoneapi.com](https://console.supertoneapi.com) 접속
2. 같은 계정으로 로그인 (Play와 크레딧 통합)
3. API Key 발급 → `.env`의 `SUPERTONE_API_KEY`
> 💡 **크레딧은 Play ↔ API 통합 관리**. 어느 쪽에서 써도 동일 풀에서 차감됨.
 
**음성 샘플 녹음 팁:**
- 15초만으로도 충분하지만, 풍부한 감정 표현을 원하면 1분 권장
- 유튜브 쇼츠 스타일의 전문 주제 설명 톤
- 너무 딱딱하지 않게
- 조용한 환경, 에어컨/키보드 소음 주의
**발음 체크 필수 단어 (Play 웹 미리듣기로 확인):**
- 브랜드명: "Claude", "Anthropic", "GPT-5"
- 약어: "API", "MCP", "SDK", "TTS"
- 성분명 (Skin 채널): "나이아신아마이드", "레티놀", "세라마이드"
- 숫자: "25%", "3시간", "45초"
**크리에이터 제휴 프로그램 (선택):**
- Supertone은 크리에이터 제휴 프로그램 운영 중
- Level 3 달성 시 **Pro Plan + API 무료** 혜택
- 채널 성장 후 전환 고려
- 자세한 내용: [supertone.ai/ko/creator](https://www.supertone.ai/ko/creator)
### 3. Pexels API
 
1. [pexels.com/api](https://www.pexels.com/api/) 가입
2. API Key 발급 (무료)
3. 키 복사 → `.env`의 `PEXELS_API_KEY`
### 4. YouTube Data API
 
**Google Cloud Console 설정:**
 
1. [console.cloud.google.com](https://console.cloud.google.com)
2. 새 프로젝트: "Layer Studio"
3. API 라이브러리 → "YouTube Data API v3" 활성화
4. 사용자 인증 정보 → OAuth 2.0 클라이언트 ID
   - 애플리케이션 유형: 데스크톱 앱
   - 이름: "Layer Studio CLI"
5. 클라이언트 ID/Secret 추출
**OAuth 토큰 발급 (채널별):**
 
```bash
# AI 채널 토큰
pnpm ts-node scripts/get-youtube-token.ts --channel=ai
# Layer AI Studio 계정으로 로그인
 
# Skin 채널 토큰
pnpm ts-node scripts/get-youtube-token.ts --channel=skin
# Layer Skin Studio 계정으로 로그인
```
 
### 5. Notion API
 
1. [notion.so/my-integrations](https://www.notion.so/my-integrations)
2. "New integration" → "Layer Studio"
3. Internal Integration Token → `.env`의 `NOTION_API_KEY`
**DB 생성 (채널별 2개):**
 
**Layer AI Studio Videos:**
1. 새 데이터베이스 생성
2. 필드:
   - Title (title, 한국어)
   - Title En (text, 영어)
   - Channel (select: AI, Skin)
   - Status (select: Pending, Approved, Rejected, Published)
   - Script Ko (text)
   - Script En (text)
   - Video Preview (url)
   - Audio Preview (url)
   - SRT File (url)
   - TTS Credits (number)            # Supertone 크레딧 소모량
   - Approved (checkbox)
   - Scheduled At (date)
   - Created At (date)
3. Connections → Layer Studio 추가
4. DB ID 추출 → `.env`의 `NOTION_DATABASE_ID_AI`
**Layer Skin Studio Videos:** 동일하게 생성 → `NOTION_DATABASE_ID_SKIN`
 
### 6. Slack Webhook
 
1. [api.slack.com/apps](https://api.slack.com/apps) → Create New App
2. "From scratch" → "Layer Studio Bot"
3. Incoming Webhooks 활성화
4. Add New Webhook → 채널 선택
5. Webhook URL → `.env`의 `SLACK_WEBHOOK_URL`
### 7. AWS S3
 
1. AWS 콘솔 → S3 → 버킷 생성
   - 이름: `layer-studio-assets`
   - 리전: `ap-northeast-2` (서울)
2. IAM → 사용자 생성: "layer-studio-backend"
3. 정책 연결: S3FullAccess
4. Access Key 발급 → `.env`에 저장
---
 
## 🔐 환경 변수 설정
 
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
 
# ========== Supertone Play (Korean TTS) ==========
SUPERTONE_API_KEY=xxx
SUPERTONE_API_BASE=https://supertoneapi.com
SUPERTONE_VOICE_ID_KO=xxx             # Play에서 생성한 클론 보이스 ID
SUPERTONE_MODEL=sona_speech_1         # 최신 TTS 모델
SUPERTONE_LANGUAGE=ko
SUPERTONE_STYLE=neutral               # 채널별 오버라이드 (ai=neutral, skin=warm)
SUPERTONE_PITCH_SHIFT=0
SUPERTONE_PITCH_VARIANCE=1
SUPERTONE_SPEED=1
SUPERTONE_TIMEOUT_MS=60000
SUPERTONE_RATE_LIMIT_PER_MIN=20       # 분당 20회 제한
SUPERTONE_CREDIT_WARN_THRESHOLD=80000 # 월 크레딧 80% 도달 시 경고
 
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
# AI 채널 (한국 + 글로벌)
RSS_FEEDS_AI=https://news.hada.io/rss/news,https://techcrunch.com/category/artificial-intelligence/feed/,https://www.anthropic.com/rss
 
# Skin 채널 (한국 + 글로벌)
RSS_FEEDS_SKIN=https://www.beautynury.com/rss,https://www.allure.com/feed/rss
```
 
**⚠️ `.env` 파일은 절대 Git에 올리지 않기!**
 
---
 
## 🏃 첫 실행
 
### NestJS 개발 서버
 
```bash
pnpm dev
# http://localhost:3000
```
 
### 헬스체크
 
```bash
curl http://localhost:3000/health
```
 
### 외부 API 연결 테스트
 
```bash
curl http://localhost:3000/health/dependencies
```
 
### 🇰🇷 Supertone 한국어 TTS 테스트 (중요!)
 
프로젝트 전체 돌리기 전에 **한국어 TTS가 잘 되는지** 먼저 확인:
 
```bash
pnpm test:supertone
```
 
**스크립트 예시 (`scripts/test-supertone.ts`):**
```typescript
import { SupertoneProvider } from '../src/modules/tts/providers/supertone.provider';
import { ConfigService } from '@nestjs/config';
 
async function test() {
  const configService = new ConfigService();
  const provider = new SupertoneProvider(configService);
  
  const testSentences = [
    "안녕하세요. 이건 한국어 음성 테스트입니다.",
    "Claude와 GPT-5 같은 영어 단어도 잘 읽히는지 확인해봅시다.",
    "MCP는 에이전트 개발을 바꾸고 있어요.",
    "3시간 걸리던 작업이 45초 만에 끝났습니다.",
  ];
  
  // Predict Duration (크레딧 차감 전)
  console.log('📏 Predicting duration...');
  const estimates = await Promise.all(
    testSentences.map(s => provider.predictDuration(s))
  );
  const totalEstimated = estimates.reduce((a, b) => a + b, 0);
  console.log(`Estimated total: ${totalEstimated.toFixed(2)}s`);
  
  // 실제 합성
  console.log('\n🎙️  Synthesizing...');
  let totalCredits = 0;
  let cumulativeTime = 0;
  
  for (const [i, sentence] of testSentences.entries()) {
    const result = await provider.synthesize(sentence);
    console.log(
      `[${i + 1}] ${result.duration.toFixed(2)}s | ` +
      `${result.credits} credits | "${sentence}"`
    );
    totalCredits += result.credits;
    cumulativeTime += result.duration;
  }
  
  console.log(`\n✅ Total: ${cumulativeTime.toFixed(2)}s, ${totalCredits} credits`);
}
 
test().catch(console.error);
```
 
**체크 사항:**
- [ ] 음성이 자연스럽게 들리는지
- [ ] 영어 단어 섞인 부분 발음 OK인지 ("Claude", "GPT-5", "MCP")
- [ ] 숫자 읽기 자연스러운지 ("3시간", "45초")
- [ ] 문장별 duration이 정확히 반환되는지
- [ ] 레이트 리밋(분당 20회)이 정상 작동하는지
- [ ] 크레딧 소모량이 예측값과 비슷한지
### 파이프라인 수동 실행
 
```bash
curl -X POST http://localhost:3000/pipeline/run \
  -H "Content-Type: application/json" \
  -d '{"channel": "AI"}'
```
 
### Remotion 미리보기
 
```bash
pnpm remotion:dev
# http://localhost:3001
```
 
Remotion Studio에서 영상 컴포지션 시각적 확인 가능.
 
---
 
## 🔄 개발 워크플로
 
### 일반 흐름
 
```bash
# 1. 최신 코드
git checkout dev
git pull origin dev
 
# 2. feature 브랜치
git checkout -b feat/supertone-tts-module
 
# 3. 개발
# ...
 
# 4. 로컬 테스트
pnpm test
pnpm lint
pnpm build
 
# 5. 커밋 & 푸시
git add .
git commit -m "feat: add Supertone TTS provider with rate limiting"
git push origin feat/supertone-tts-module
 
# 6. PR 생성 (dev로)
# 7. 리뷰 후 머지
```
 
### 자주 쓰는 명령어
 
```bash
pnpm dev                    # 개발 서버
pnpm test                   # 전체 테스트
pnpm test -- supertone      # 특정 모듈 테스트
pnpm lint                   # Lint
pnpm build                  # 빌드
pnpm prisma migrate dev --name describe_changes
pnpm prisma studio
pnpm remotion:dev           # Remotion Studio
pnpm remotion:render LayerAIStudio out.mp4
pnpm test:supertone         # Supertone TTS 테스트
```
 
### Claude Code 활용
 
```
"CLAUDE.md와 docs/CONTENT.md 참고해서,
 src/modules/claude/scriptwriter-ko 서비스를 구현해줘.
 Claude Sonnet으로 한국어 스크립트를 생성하고,
 sentences_ko 배열이 영어 번역 및 Supertone 문장별 호출에 
 사용 가능한 구조여야 해."
 
"docs/WORKFLOW.md의 6번 단계(Supertone TTS)를
 src/modules/tts/providers/supertone.provider.ts로 구현해줘.
 bottleneck으로 분당 20회 레이트 리밋 제어,
 문장별 개별 합성 후 FFmpeg concat으로 병합."
 
"remotion/components/EnglishSubtitle.tsx를 만들어줘.
 SubtitleSegment 배열을 받아서 문장 단위로 자막 표시.
 theme prop으로 AI/Skin 스타일 분리."
```
 
---
 
## 🐛 트러블슈팅
 
### 일반 문제
 
```bash
# Cannot find module
pnpm install
pnpm prisma generate
 
# Prisma 에러
pnpm prisma migrate reset  # 개발 환경만!
 
# 포트 충돌
lsof -i :3000
kill -9 <PID>
 
# FFmpeg not found (Supertone 문장 병합 시)
which ffmpeg
# 없으면 brew install ffmpeg 또는 apt install ffmpeg
```
 
### API 관련
 
#### Claude API 401
- API 키, 결제 수단, 레이트 리밋 확인
#### Supertone 한국어 발음 이상 🇰🇷
- Play 웹에서 클론 보이스 **미리듣기** 먼저 확인
- 미리듣기도 어색하면 **클론 보이스 재생성** (15초 샘플 다시 녹음)
- `pitch_variance` 조정 (1 → 1.2로 올리면 더 자연스러움)
- `style` 변경 시도 (`neutral` ↔ `warm` ↔ `reading`)
- 문장 분할 호출이라 **특정 문장만 재시도** 가능
#### Supertone 429 (Rate limit)
- 분당 20회 제한
- `bottleneck` 라이브러리 설정 확인
- 지수 백오프로 재시도
```typescript
reservoir: 20,
reservoirRefreshAmount: 20,
reservoirRefreshInterval: 60 * 1000,
maxConcurrent: 5,
```
 
#### Supertone 크레딧 부족
- Play 웹에서 크레딧 잔량 확인
- 플랜 업그레이드 또는 단건 충전
- **주의**: Play 웹 ↔ API 크레딧 공유. Play에서 테스트 음성 많이 만들면 API용도 줄어듦
- 월 크레딧은 매월 1일 초기화, **이월 불가**
#### Supertone 보이스 ID 못 찾음
```bash
# 등록된 보이스 목록 조회
curl -H "x-sup-api-key: $SUPERTONE_API_KEY" \
  https://supertoneapi.com/v1/voices
```
 
#### Supertone 타임아웃
- 문장이 길면 (30자 초과) 분할 권장
- `SUPERTONE_TIMEOUT_MS=90000`으로 여유 두기
- 네트워크 이슈 시 retry 적용
#### 문장 병합 오디오 품질 이슈
- FFmpeg concat 시 samplerate/채널 불일치 → 정규화 필요
```bash
# 각 문장을 동일 포맷으로 변환 후 concat
ffmpeg -i input.mp3 -ar 44100 -ac 2 -b:a 192k normalized.mp3
```
- 문장 간 자연스러운 연결을 위해 각 문장 끝에 100~200ms silence 패딩 고려
#### YouTube 업로드 403
- OAuth 토큰 만료 (refresh token 재발급)
- 쿼터 확인 (10,000/일)
#### YouTube 자막 업로드 실패
- 자막 파일이 valid SRT 포맷인지 확인
- `language: 'en'` 파라미터 맞는지
#### Pexels 검색 결과 없음
- 키워드 일반화
- 가로 포맷 fallback
### Remotion 관련
 
#### 렌더링 실패
```bash
rm -rf node_modules/.remotion-cache
pnpm remotion:dev  # 시각적 확인
```
 
#### 한국어 폰트 안 보임
- `remotion/public/fonts/Pretendard-Variable.woff2` 확인
- `Root.tsx`에 폰트 로드 코드 있는지
#### 자막 타이밍 이상
- `subtitleSegments` JSON 구조 확인
- Supertone 문장별 duration 누적 계산이 정확한지 확인
- 각 문장의 `start`/`end`가 연속인지 검증 (갭이나 겹침 없음)
### Docker
 
```bash
docker ps
docker-compose restart postgres
docker logs layer-studio-db
```
 
---
 
## 🔐 보안 주의사항
 
1. `.env` 절대 커밋 X
2. API 키 노출 시 즉시 재발급
3. AWS 키 IAM 정책 최소화
4. OAuth 토큰 암호화 저장
5. **Supertone 보이스 ID 공유 주의** — 타인이 네 복제 음성으로 콘텐츠 생성 가능
---
 
## 📦 배포 (추후)
 
### 권장: **Railway**
 
- PostgreSQL 내장
- 자동 배포
- 월 $5~20
- Remotion 렌더링도 같은 서버 OK
- **FFmpeg 지원** (Nixpacks 빌드팩에 포함)
**배포 개요:**
1. Railway 계정 + GitHub 연결
2. 새 프로젝트 → layer-studio-pipeline
3. PostgreSQL 추가
4. 환경 변수 복사 (Supertone 키 포함)
5. 자동 배포
**FFmpeg 확인:**
```bash
# Railway 배포 후 shell로 확인
railway shell
ffmpeg -version
```
 
---
 
## 📞 도움 요청
 
1. `docs/` 재확인
2. 로그 체크
3. GitHub Issues
4. Supertone API 관련: [docs.supertoneapi.com](https://docs.supertoneapi.com)
---
 
_Last updated: 2026-04-22_
 
