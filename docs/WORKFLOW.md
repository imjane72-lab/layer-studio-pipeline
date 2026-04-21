# 파이프라인 워크플로 (WORKFLOW.md)

> Layer Studio의 컨텐츠 파이프라인 동작 방식을 상세히 설명합니다.
> 실제 개발 시 이 문서를 참고해 각 단계를 구현하세요.

---

## 📋 목차

1. [전체 흐름 개요](#전체-흐름-개요)
2. [단계별 상세 스펙](#단계별-상세-스펙)
3. [타이밍 & 스케줄](#타이밍--스케줄)
4. [에러 처리](#에러-처리)
5. [모니터링](#모니터링)

---

## 🌊 전체 흐름 개요

### 타임라인

```
┌──────────────────────────────────────────────────────────┐
│                    업로드 날 (D-1)                        │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  19:00 KST  │ GitHub Actions Cron 트리거 (AI + Skin)      │
│             │                                             │
│  19:00~03   │ [1] 뉴스 RSS 수집                           │
│  19:03~05   │ [2] Haiku 큐레이션 (주제 선정)               │
│  19:05~06   │ [3] Sonnet 스크립트 생성                    │
│  19:06~07   │ [4] Pexels B-roll 검색 & 다운로드           │
│  19:07~08   │ [5] ElevenLabs TTS + 타임스탬프            │
│  19:08~10   │ [6] Remotion 영상 렌더링 (AI)              │
│  19:10~12   │ [6] Remotion 영상 렌더링 (Skin)            │
│  19:12      │ [7] S3 업로드, Notion DB 기록              │
│  19:13      │ [8] Slack 알림 발송                         │
│                                                           │
│  19:13~21   │ [9] 지혜씨 승인 (Notion 체크박스)           │
│             │                                             │
│  19:15~21   │ [10] 승인된 영상 YouTube 예약 업로드 설정   │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                    업로드 날 (D-Day)                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  07:00 KST  │ YouTube 자동 공개                           │
│             │   = 미국 동부 전날 18:00 (저녁 피크)         │
│             │   = 미국 서부 전날 15:00                    │
│                                                           │
│  익일       │ YouTube Analytics 데이터 수집               │
│                                                           │
└──────────────────────────────────────────────────────────┘
```

### 주기

- **이틀에 한 번** (월/수/금/일 형태)
- AI 채널과 Skin 채널 동시 실행
- 한 번 실행에 2개 영상 (채널별 1개) 생성

---

## 🔧 단계별 상세 스펙

### 1️⃣ 뉴스 RSS 수집

**목적:** 최근 24~48시간 내 관련 뉴스 수집

**입력:**
- 환경변수 `RSS_FEEDS_AI`, `RSS_FEEDS_SKIN`의 RSS URL 리스트
- 파라미터: `channel: Channel`

**처리:**
```typescript
1. 각 RSS 피드 병렬 fetch (Promise.all)
2. 각 아이템 추출: title, description, link, pubDate
3. 제목 해시 (SHA-256) 생성 → 중복 검사
4. 24~48시간 이내 것만 필터
5. DB에 저장 (중복은 skip)
```

**출력:**
- DB에 저장된 NewsItem 레코드 (보통 50~200개)

**라이브러리:** `rss-parser`

**에러 처리:**
- 특정 피드 실패 시 나머지만 진행 (Partial failure OK)
- 전부 실패 시 에러 throw

**예시 RSS 소스:**

**AI 채널용:**
- TechCrunch AI: `https://techcrunch.com/category/artificial-intelligence/feed/`
- The Verge AI: `https://www.theverge.com/rss/index.xml`
- Anthropic News: `https://www.anthropic.com/rss`
- Hacker News AI: 특정 태그 필터
- arXiv cs.AI: `http://arxiv.org/rss/cs.AI`

**K-Beauty 채널용:**
- Allure: `https://www.allure.com/feed/rss`
- Beauty Independent
- 뷰티누리
- 식품의약품안전처(MFDS) 공지
- 한국화장품공업협회

---

### 2️⃣ Haiku 큐레이션

**목적:** 수집된 뉴스 중 영상으로 만들 **최적의 1개 주제** 선정

**입력:** NewsItem 배열 (최근 48시간, 미선택)

**처리:**

**프롬프트 (AI 채널 예시):**
```
당신은 AI 빌더 관점의 콘텐츠 큐레이터입니다.
다음 뉴스 중 Layer AI Studio 채널에 가장 적합한 1개를 선택하세요.

선정 기준:
- 빌더/개발자가 실제로 써볼 수 있는 새 도구/모델
- 기술적 깊이가 있는 분석거리
- 60초 Short에 담기 좋은 주제
- 클릭베이트 아닌 실질적 가치

제외 기준:
- 주식/투자 관점 기사
- CEO 가십/드라마
- 중복 주제 (최근 업로드 확인)

뉴스 리스트:
{news_items_json}

출력 형식 (JSON):
{
  "selected_id": "item_id",
  "reason": "선정 이유 (한국어)",
  "angle": "비디오의 메인 앵글",
  "estimated_broll_needs": ["keyword1", "keyword2", "keyword3"]
}
```

**출력:** 선택된 1개 뉴스 + 메타데이터

**모델:** Claude Haiku

**비용:** 약 $0.01~0.02/실행

---

### 3️⃣ Sonnet 스크립트 생성

**목적:** 60초짜리 YouTube Shorts 스크립트 작성

**입력:**
- 선택된 뉴스
- 채널 정보 (AI or Skin)
- 최근 10개 영상 목록 (중복 회피용)

**프롬프트 (AI 채널 예시):**
```
당신은 Layer AI Studio의 전담 스크립트 작가입니다.

채널 정체성:
- 타겟: 영어권 글로벌 빌더/개발자
- 톤: 분석적, 학자적, 진중하되 지루하지 않게
- 길이: 60초 (약 150 words)
- 포맷: Hook → Context → Key Insight → CTA

필수 규칙:
1. 첫 3초 훅이 가장 중요 (스크롤 멈추게)
2. 짧은 문장 우선 (10단어 이하)
3. 구체적 숫자/사실 포함
4. 빌더 관점 유지 (주식/시장은 근거로만 10~30%)
5. 마지막에 호기심/생각 유도

뉴스:
{news_content}

출력 형식 (JSON):
{
  "hook": "첫 3초 문장 (8단어 이하)",
  "script": "전체 스크립트 (60초, 자연스러운 문장)",
  "broll_plan": [
    {
      "sentence_index": 0,
      "text": "해당 문장",
      "keywords": ["primary_keyword", "secondary"],
      "duration_seconds": 4
    }
  ],
  "metadata": {
    "title": "YouTube 제목 (60자 이내, CTR 고려)",
    "description": "YouTube 설명 (해시태그 포함)",
    "tags": ["tag1", "tag2", ...]
  }
}
```

**출력:** 완성된 스크립트 + B-roll 계획 + 메타데이터

**모델:** Claude Sonnet

**비용:** 약 $0.05~0.10/실행

**검증:**
- 스크립트 길이 120~180 words 범위 확인
- B-roll 키워드 각 문장마다 존재
- 메타데이터 필드 완성도

---

### 4️⃣ Pexels B-roll 검색

**목적:** 각 문장에 맞는 9:16 세로 영상 클립 수집

**입력:** B-roll 계획 (keywords, duration)

**처리:**
```typescript
for (const plan of brollPlan) {
  // 각 키워드로 Pexels 검색
  const results = await pexels.search({
    query: plan.keywords.join(' '),
    orientation: 'portrait',
    size: 'medium',      // 1080x1920 선호
    per_page: 10,
  });
  
  // 1순위: 9:16 비율 정확
  // 2순위: 해상도 1080p 이상
  // 3순위: 길이가 duration 이상
  const best = pickBestMatch(results.videos, plan.duration);
  
  // S3에 다운로드 저장
  const s3Url = await downloadAndUpload(best.video_files[0].link);
  
  plan.videoUrl = s3Url;
}
```

**출력:** 각 문장에 대응되는 비디오 URL 리스트

**캐싱:** 동일 키워드 1주일 캐싱 (Pexels 쿼터 절약)

**주의:**
- 출처 기록 필수 (Pexels requires attribution)
- 저작권 안전 (모두 Pexels 라이선스)

---

### 5️⃣ ElevenLabs TTS 생성

**목적:** 지혜씨 복제 목소리로 영어 나레이션 생성 + 타임스탬프

**입력:** 스크립트 전문

**API 호출:**
```typescript
const response = await fetch(
  `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}/with-timestamps`,
  {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      text: script,
      model_id: 'eleven_multilingual_v2',
      voice_settings: {
        stability: 0.5,
        similarity_boost: 0.75,
      },
    }),
  }
);
```

**응답:**
```json
{
  "audio_base64": "...",
  "alignment": {
    "characters": ["H", "e", "l", "l", "o", ...],
    "character_start_times_seconds": [0, 0.05, 0.10, ...],
    "character_end_times_seconds": [0.05, 0.10, 0.15, ...]
  },
  "normalized_alignment": { ... }
}
```

**처리:**
1. base64 디코딩 → MP3 파일
2. S3 업로드
3. 문자별 타임스탬프 → **단어별 타임스탬프**로 변환
4. DB에 저장

**출력:**
- 오디오 URL
- 단어별 타임스탬프 배열: `[{ word, startTime, endTime }, ...]`

---

### 6️⃣ Remotion 영상 렌더링

**목적:** 스톡 영상 + 나레이션 + 자막 합성 → 최종 영상

**입력:**
- 스크립트 + B-roll 계획
- 오디오 URL
- 단어별 타임스탬프
- 채널 (AI or Skin) → 테마 결정

**Remotion 컴포지션:**

**`apps/remotion/src/compositions/LayerAIStudio.tsx`:**
```typescript
export const LayerAIStudio: React.FC<VideoProps> = ({
  script,
  brollScenes,
  audioUrl,
  wordTimestamps,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* 배경: B-roll 장면들 */}
      <Sequence from={0}>
        <BRollSequence scenes={brollScenes} />
      </Sequence>
      
      {/* 자막: 단어별 팝업 */}
      <Sequence from={0}>
        <WordByWordSubtitles 
          timestamps={wordTimestamps}
          theme="ai"
        />
      </Sequence>
      
      {/* 오디오 */}
      <Audio src={audioUrl} />
      
      {/* 브랜드 워터마크 */}
      <BrandOverlay channel="ai" />
    </AbsoluteFill>
  );
};
```

**렌더링 명령:**
```bash
npx remotion render LayerAIStudio output.mp4 \
  --props='{"script":"...","audioUrl":"..."}'
```

**설정:**
- 해상도: 1080x1920 (9:16)
- 프레임레이트: 30fps
- 길이: 오디오 길이에 맞춤 (보통 50~65초)
- 코덱: H.264
- 비트레이트: 8Mbps

**성능:**
- 로컬 렌더링: 약 2~3분/영상
- 클라우드 렌더링 (Lambda): 약 30초
- 초기엔 로컬, 스케일 필요시 Lambda로 이전

---

### 7️⃣ S3 업로드 & Notion 카드 생성

**S3 업로드:**
```
s3://layer-studio-assets/
├── videos/
│   ├── 2026-04-21/
│   │   ├── ai_{videoId}.mp4
│   │   └── skin_{videoId}.mp4
├── audio/
│   └── 2026-04-21/
│       ├── ai_{videoId}.mp3
│       └── skin_{videoId}.mp3
└── thumbnails/
    └── 2026-04-21/
        ├── ai_{videoId}.jpg
        └── skin_{videoId}.jpg
```

**Notion 페이지 생성:**

Notion DB에 아래 필드로 페이지 생성:
```
제목: [Title from script]
Channel: AI / Skin
Status: Pending Review
Script: [전문 텍스트]
Video: [S3 presigned URL - 24시간]
Audio: [S3 presigned URL]
Thumbnail: [이미지 URL]
Metadata:
  - YouTube Title
  - YouTube Description
  - YouTube Tags
Created At: [ISO timestamp]
Approved: ☐ (체크박스)
Scheduled At: [다음날 07:00 KST]
```

---

### 8️⃣ Slack 알림

**메시지 포맷:**
```
🎬 *[Layer AI Studio]* 새 영상 준비 완료

*제목:* Claude Design Explained for Builders
*길이:* 58초
*예약:* 내일 07:00 KST (미국 저녁 피크)

📝 <Notion 링크|스크립트 & 미리보기 확인>
✅ *1-2분 내 승인 필요*
```

**트리거:**
- 영상 렌더링 완료 직후
- AI/Skin 각각 별도 메시지

---

### 9️⃣ 승인 (Approval)

**흐름:**
1. Slack 알림 → 지혜씨 폰 진동
2. Notion 앱 열어서 미리보기 확인 (30초~1분)
3. 스크립트 이상하면 → Reject
4. OK면 → ✅ Approved 체크박스 클릭
5. Notion Webhook → 백엔드로 승인 신호

**수정 가능 영역 (승인 전):**
- 제목/설명 수정
- 거절 후 재생성 요청

**타임아웃:**
- 3시간 이내 승인 안 되면 Slack 리마인더
- 6시간 지나면 자동 거절

---

### 🔟 YouTube 업로드

**업로드 타이밍:**
- 승인 직후 **즉시 예약 등록** (API 호출)
- `publishAt`: 다음날 07:00 KST
- YouTube가 자동으로 해당 시간에 공개

**업로드 파라미터:**
```typescript
const response = await youtube.videos.insert({
  auth: oauthClient,
  part: ['snippet', 'status'],
  requestBody: {
    snippet: {
      title: metadata.title,
      description: metadata.description,
      tags: metadata.tags,
      categoryId: '28', // Science & Technology
      defaultLanguage: 'en',
      defaultAudioLanguage: 'en',
    },
    status: {
      privacyStatus: 'private',       // 일단 비공개
      publishAt: scheduledTime,        // 예약 공개
      selfDeclaredMadeForKids: false,
    },
  },
  media: {
    body: fs.createReadStream(videoPath),
  },
});
```

**쇼츠 인식:**
- 영상 길이 60초 이하
- 9:16 세로 포맷
- 제목/설명에 `#Shorts` 포함 (권장)
- → 자동으로 Shorts 피드 진입

---

### 📊 분석 (익일)

**YouTube Analytics:**
- 24시간 후 자동 수집
- 조회수, 시청 시간, CTR, 좋아요, 댓글
- DB에 저장해서 향후 큐레이션에 반영

---

## ⏰ 타이밍 & 스케줄

### Cron 스케줄

**GitHub Actions** (`.github/workflows/daily-pipeline-ai.yml`):
```yaml
name: Daily Pipeline - AI Channel
on:
  schedule:
    # KST 19:00 = UTC 10:00
    # 이틀에 한 번: 매월 1,3,5,7,9,...
    - cron: '0 10 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31 * *'
  workflow_dispatch:  # 수동 실행 허용
```

**또는 백엔드 내부 스케줄러** (대안):
- `@nestjs/schedule` 사용
- 서버가 항상 켜져 있어야 함
- GitHub Actions가 더 안정적

### 시간대 정책

- **모든 시간 저장:** UTC
- **표시:** KST 변환
- **업로드:** KST 07:00 = UTC 22:00 (전날)

---

## 🚨 에러 처리

### 각 단계별 에러 정책

| 단계 | 실패 시 |
|---|---|
| RSS 수집 | 일부 피드 실패 허용, 전부 실패 시 중단 |
| 큐레이션 | 3회 재시도, 그래도 실패 시 Slack 알림 |
| 스크립트 | 3회 재시도 (프롬프트 미세 조정), 실패 시 중단 |
| B-roll | 키워드 변경해서 재시도, 안 되면 기본 B-roll |
| TTS | 3회 재시도, 실패 시 중단 |
| 렌더링 | 2회 재시도, 실패 시 중단 |
| Notion | 5회 재시도 (네트워크 이슈 가능성) |
| Slack | 3회 재시도, 실패 시 로그만 |
| YouTube | 5회 재시도, 실패 시 수동 업로드 요청 |

### Dead Letter Queue

- 실패한 실행은 `pipeline_run` 테이블에 `failed` 상태로 저장
- 관리 대시보드에서 재시도 가능

### 알림

- **Critical 에러:** Slack으로 즉시 알림 (`@지혜씨`)
- **Warning:** 일일 요약에 포함
- **Info:** 로그만

---

## 📊 모니터링

### 핵심 지표

1. **파이프라인 성공률**
   - 일별/주별
   - 목표: 95% 이상

2. **평균 실행 시간**
   - 목표: 7분 이내

3. **단계별 병목**
   - 어느 단계에서 가장 오래 걸리는지
   - 최적화 포인트 파악

4. **API 비용**
   - Claude, ElevenLabs 일별 비용 추적
   - 예산 초과 시 알림

5. **영상 성과**
   - 조회수, CTR, 시청 시간
   - 어떤 주제가 잘 되는지 학습

### 대시보드 (추후)

- Grafana 또는 커스텀 Next.js 대시보드
- 초기엔 Notion + Slack으로 충분

---

## 🔄 반복 개선 루프

```
1. 영상 업로드
   ↓
2. 24시간 후 Analytics 수집
   ↓
3. 성과 좋은 주제/앵글 패턴 DB화
   ↓
4. 큐레이션 프롬프트 개선
   ↓
5. 스크립트 템플릿 업데이트
   ↓
6. 다음 영상에 반영
```

**주 1회 리뷰:**
- 조회수 TOP 영상 분석
- 왜 잘 됐는지 가설
- 다음 주 주제 방향 조정

---

_Last updated: 2026-04-21_
