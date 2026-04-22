# 파이프라인 워크플로 (WORKFLOW.md)
 
> Layer Studio의 콘텐츠 파이프라인 상세 동작 방식.
> **한국어 음성 + 영어 자막** 전략에 맞춘 플로우입니다.
 
---
 
## 📋 목차
 
1. [전체 흐름 개요](#전체-흐름-개요)
2. [단계별 상세 스펙](#단계별-상세-스펙)
3. [타이밍 & 스케줄](#타이밍--스케줄)
4. [에러 처리](#에러-처리)
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
│  19:00~03   │ [1] 뉴스 RSS 수집 (한국 + 글로벌)            │
│  19:03~05   │ [2] Haiku 큐레이션 (주제 선정)               │
│  19:05~06   │ [3] Sonnet 한국어 스크립트 생성              │
│  19:06~07   │ [4] Sonnet 영어 자막 번역                    │
│  19:07~08   │ [5] Pexels B-roll 검색 & 다운로드           │
│  19:08~10   │ [6] Supertone 한국어 TTS (문장별 분할 호출) │
│  19:10~11   │ [7] 영어 자막 타이밍 매칭 + SRT 생성         │
│  19:11~13   │ [8] Remotion 영상 렌더링 (한국어 + 영어 자막)│
│  19:13      │ [9] S3 업로드, Notion DB 기록              │
│  19:14      │ [10] Slack 알림 발송                        │
│                                                           │
│  19:14~21   │ [11] 지혜씨 승인 (Notion 체크박스)          │
│                                                           │
│  19:16~21   │ [12] YouTube 예약 업로드 + 자막 파일 업로드  │
│                                                           │
├──────────────────────────────────────────────────────────┤
│                    업로드 날 (D-Day)                      │
├──────────────────────────────────────────────────────────┤
│                                                           │
│  07:00 KST  │ YouTube 자동 공개                           │
│             │   = 미국 동부 전날 18:00                    │
│                                                           │
└──────────────────────────────────────────────────────────┘
```
 
### 주기
- **이틀에 한 번** (AI + Skin 동시 실행)
- 한 번에 2개 영상 생성
---
 
## 🔧 단계별 상세 스펙
 
### 1️⃣ 뉴스 RSS 수집
 
**목적:** 최근 24~48시간 내 한국 및 글로벌 뉴스 수집
 
**입력:**
- 환경변수: `RSS_FEEDS_AI`, `RSS_FEEDS_SKIN`
- 파라미터: `channel: Channel`
**처리:**
```typescript
1. RSS 피드 병렬 fetch
2. 각 아이템: title, description, link, pubDate 추출
3. 언어 감지 (ko / en) → sourceLang 필드
4. 제목 해시 SHA-256 → 중복 검사
5. 24~48시간 이내 필터
6. DB 저장
```
 
**출력:** NewsItem 레코드 (50~200개)
 
**라이브러리:** `rss-parser`
 
**주요 RSS 소스:**
 
**AI 채널:**
- 한국: news.hada.io, velog 인기글, 44bits.io
- 글로벌: TechCrunch AI, Anthropic Blog, OpenAI Blog
**Skin 채널:**
- 한국: 뷰티누리, 식약처(MFDS), 화장품뷰티산업회
- 글로벌: Allure, Beauty Independent
---
 
### 2️⃣ Haiku 큐레이션
 
**목적:** 최적 주제 1개 선정
 
**입력:** NewsItem 배열 (한국어 + 영어 혼합)
 
**프롬프트 (AI 채널):**
```
당신은 Layer AI Studio 채널의 콘텐츠 큐레이터입니다.
 
이 채널은:
- 한국인이 한국어로 전달
- 영어 자막으로 글로벌 시청자 타겟
- 영어권 K-tech 관심자 + 한국 개발자 듀얼 타겟
 
선정 기준:
1. 한국 시장 내부자 관점 살릴 수 있는 주제
2. 글로벌도 관심 가질 수 있는 보편성
3. 60초 안에 핵심 전달 가능
4. 시청자가 실무에 쓸 수 있는 내용
 
제외:
- 단순 주가/투자 뉴스
- 지역 특수한 내용 (번역해도 이해 안 가는)
- 최근 다룬 주제: {recent_topics}
 
뉴스:
{news_items_json}
 
출력 (JSON):
{
  "selected_id": "id",
  "reason": "선정 이유 (한국어)",
  "angle": "핵심 앵글 (한국어)",
  "broll_keywords_en": ["keyword1", "keyword2"]  // B-roll 검색용 (영어)
}
```
 
**모델:** Claude Haiku  
**비용:** 약 $0.01~0.02/실행
 
---
 
### 3️⃣ 한국어 스크립트 생성
 
**목적:** 한국어로 60초 분량 스크립트 작성
 
**입력:**
- 선택된 뉴스
- 채널 정보
- 최근 영상 목록 (중복 회피)
**프롬프트 (AI 채널 한국어):**
```
당신은 Layer AI Studio의 한국어 스크립트 작가입니다.
 
채널 특성:
- 음성: 한국어 (원어민)
- 자막: 영어 (글로벌 시청자용)
- 톤: 분석적, 빌더 관점, 진지하되 지루하지 않게
- 길이: 약 60초 = 한국어 400자 내외
 
필수 규칙:
1. 첫 문장 = 훅 (3초 안에 궁금증 유발)
2. 짧고 명확한 문장 (한 문장 20자 내외)
3. 영어 번역하기 쉬운 구조 (은유 남발 금지)
4. 빌더/개발자 관점 유지
5. 구체적 숫자/사실 포함
6. 끝은 "생각 유도"로 마무리
 
문장 구조 원칙:
- 각 문장은 독립적 (영어 자막과 1:1 매칭 가능)
- 긴 복문 피하기
- 대명사 최소화 (자막 매칭 어려움)
- 문장 구분자 명확 (마침표/물음표/느낌표)
  → Supertone 문장별 분할 호출 및 타이밍 정확도와 직결
 
뉴스:
{news_content}
 
출력 (JSON):
{
  "hook_ko": "첫 3초 훅 (한국어)",
  "script_ko": "전체 한국어 스크립트 (400자 내외)",
  "sentences_ko": [
    "첫 문장",
    "두 번째 문장",
    ...
  ],
  "broll_plan": [
    {
      "sentence_index": 0,
      "text_ko": "해당 한국어 문장",
      "keywords_en": ["primary", "secondary"],
      "duration_seconds": 4
    }
  ]
}
```
 
**모델:** Claude Sonnet  
**비용:** 약 $0.05~0.08/실행
 
**검증:**
- 전체 길이 350~450자 (한국어)
- 각 문장 독립적
- `sentences_ko`가 올바르게 분리됨 (Supertone 분할 호출의 기초)
---
 
### 4️⃣ 영어 자막 번역
 
**목적:** 한국어 문장 → 영어 자막 번역 (문장 단위)
 
**입력:** `sentences_ko` 배열
 
**프롬프트:**
```
You are translating Korean YouTube Shorts subtitles to English.
 
Context:
- Korean audio (native Korean speaker)
- English subtitles for global viewers
- Sentence-level matching is critical
 
Rules:
1. One-to-one mapping: Each Korean sentence → One English sentence
2. Natural English (not literal translation)
3. Short and readable (fits on mobile screen)
4. Same tone as Korean (analytical, builder's perspective)
5. Preserve technical terms in their common English form
6. Numbers stay as numbers
 
Korean sentences:
{sentences_ko_json}
 
Output (JSON):
{
  "sentences_en": [
    "Translation of sentence 1",
    "Translation of sentence 2",
    ...
  ]
}
 
Important: Output array length MUST match input array length.
```
 
**모델:** Claude Sonnet  
**비용:** 약 $0.02~0.04/실행
 
**검증:**
- `sentences_en.length === sentences_ko.length`
- 각 영어 문장 100자 이내 (모바일 가독성)
- 각 문장이 실제로 번역됨 (빈 문자열 X)
---
 
### 5️⃣ Pexels B-roll 검색
 
기존과 동일. 변경 없음.
 
**입력:** `broll_plan` (영어 키워드 사용)
 
**처리:**
```typescript
for (const plan of brollPlan) {
  const results = await pexels.search({
    query: plan.keywords_en.join(' '),
    orientation: 'portrait',
    per_page: 10,
  });
  
  const best = pickBestMatch(results.videos, plan.duration_seconds);
  const s3Url = await downloadAndUpload(best.video_files[0].link);
  plan.videoUrl = s3Url;
}
```
 
**출력:** 각 문장에 대응되는 비디오 URL 리스트
 
---
 
### 6️⃣ Supertone 한국어 TTS 생성
 
**목적:** 한국어 스크립트 → 한국어 음성 + 문장별 타임스탬프
 
**핵심 전략: 문장 단위 분할 호출**
 
Supertone API는 단어별 타임스탬프를 반환하지 않으므로, **한국어 문장을 개별적으로 API 호출**하고 각 응답의 duration을 누적해 타임스탬프를 직접 구성한다. 이 방식의 장점:
 
1. **정확한 문장별 타이밍** — API 응답의 duration이 곧 자막 종료 시각
2. **영어 자막과 1:1 매칭** — 이미 Step 3-4에서 문장 경계가 맞춰져 있음
3. **부분 실패 시 재시도 용이** — 실패한 문장만 다시 호출 가능
4. **병렬 처리 가능** — 단, 레이트 리밋(분당 20회) 고려
**사전 단계: Predict Duration (선택)**
 
크레딧 소모 전 전체 길이를 미리 계산해 예산 체크:
```typescript
const totalEstimated = await Promise.all(
  sentencesKo.map(s => supertone.predictDuration(s))
);
const estimatedDuration = totalEstimated.reduce((a, b) => a + b, 0);
// 예상 크레딧 = 대략 duration * 10
```
 
**API 호출 (문장별):**
```typescript
import Bottleneck from 'bottleneck';
 
// 레이트 리밋 (분당 20회 → 3초에 1회 안전)
const limiter = new Bottleneck({
  reservoir: 20,
  reservoirRefreshAmount: 20,
  reservoirRefreshInterval: 60 * 1000,
  maxConcurrent: 5,
});
 
const synthesizeSentence = limiter.wrap(async (text: string) => {
  const response = await axios.post(
    `${SUPERTONE_API_BASE}/v1/text-to-speech/${voiceIdKo}`,
    {
      text,
      language: 'ko',
      style: 'neutral',
      model: 'sona_speech_1',
      voice_settings: {
        pitch_shift: 0,
        pitch_variance: 1,
        speed: 1,
      },
      output_format: 'mp3',
    },
    {
      headers: { 'x-sup-api-key': SUPERTONE_API_KEY },
      responseType: 'arraybuffer',
      timeout: 60000,
    }
  );
  
  return {
    audioBuffer: Buffer.from(response.data),
    duration: Number(response.headers['x-duration-seconds']),
    credits: Number(response.headers['x-credits-used']),
  };
});
```
 
**응답 처리:**
 
```typescript
// 1. 모든 문장 병렬 합성 (레이트 리밋 자동 적용)
const results = await Promise.all(
  sentencesKo.map(s => synthesizeSentence(s))
);
 
// 2. 문장별 누적 타임스탬프 계산
const segments: SentenceSegment[] = [];
let cumulativeTime = 0;
let totalCredits = 0;
 
for (const [i, result] of results.entries()) {
  segments.push({
    index: i,
    textKo: sentencesKo[i],
    textEn: sentencesEn[i],
    start: cumulativeTime,
    end: cumulativeTime + result.duration,
    audioBuffer: result.audioBuffer,
  });
  cumulativeTime += result.duration;
  totalCredits += result.credits;
}
 
// 3. 오디오 버퍼 순차 연결 (FFmpeg concat)
const mergedAudio = await ffmpegConcat(
  results.map(r => r.audioBuffer)
);
 
// 4. S3 업로드
const audioUrl = await s3.upload({ Bucket, Key, Body: mergedAudio });
 
// 5. DB 기록 (크레딧 소모량 포함)
await prisma.video.update({
  where: { id: videoId },
  data: {
    audioUrl,
    ttsCredits: totalCredits,
    ttsDurationSec: cumulativeTime,
    subtitleSegments: segments.map(({ audioBuffer, ...rest }) => rest),
  },
});
```
 
**출력:**
- 오디오 URL (S3) — 문장별 합쳐진 최종 MP3
- `subtitleSegments` — 각 문장의 ko/en 텍스트 + start/end 타임스탬프
- 크레딧 소모량 (모니터링용)
**주의사항:**
- **레이트 리밋** — 분당 20회 (`bottleneck` 라이브러리로 큐잉)
- **한국어 특수 발음** — "GPT-5", "100%" 등 숫자·영어 혼용 발음 사전 체크
- **FFmpeg 의존** — 문장별 MP3 이어붙이기 위해 필요 (Docker 이미지에 포함)
- **클론 보이스 생성** — Play 웹 UI에서만 가능 (15초 샘플), API는 호출만 지원
- **크레딧 공유** — Play 웹과 API가 동일 크레딧 풀 사용 (월 초기화)
**비용 (Creator 플랜 기준):**
- 월 100,000 크레딧 = 약 170분 오디오
- 쇼츠 1편 ~45초 = ~450 크레딧
- 월 30편 (2채널 × 이틀 1편) = ~13,500 크레딧 → 여유 매우 많음
---
 
### 7️⃣ 영어 자막 타이밍 매칭 + SRT 생성
 
**목적:** 문장별 타임스탬프로 영어 자막 SRT 파일 생성
 
**입력:** `subtitleSegments` (Step 6에서 이미 완성됨)
 
> 💡 Supertone 문장별 분할 호출 방식 덕분에 **별도 매칭 로직이 필요 없음**. Step 6에서 이미 각 문장의 start/end가 확정됨. ElevenLabs 단어 매칭 방식 대비 로직이 훨씬 단순해짐.
 
**처리 알고리즘:**
 
```typescript
function generateSrt(segments: SentenceSegment[]): string {
  return segments
    .map((seg, i) => {
      const startStr = formatSrtTime(seg.start);
      const endStr = formatSrtTime(seg.end);
      return `${i + 1}\n${startStr} --> ${endStr}\n${seg.textEn}\n`;
    })
    .join('\n');
}
 
function formatSrtTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const ms = Math.floor((seconds % 1) * 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)},${pad(ms, 3)}`;
}
```
 
**SRT 파일 예시:**
 
```srt
1
00:00:00,000 --> 00:00:02,500
Claude recently released a new Agent SDK.
 
2
00:00:02,500 --> 00:00:05,200
This changes everything for builders.
 
...
```
 
**라이브러리:** `subtitle` (npm) — SRT 표준 포맷팅에 도움
 
**출력:**
- SRT 파일 (S3 업로드)
- `subtitleSegments` (이미 DB에 저장됨, Remotion에서 재사용)
---
 
### 8️⃣ Remotion 영상 렌더링
 
**목적:** B-roll + 한국어 음성 + 영어 자막 합성
 
**입력:**
- B-roll 계획
- 오디오 URL (한국어, Supertone 생성)
- Subtitle segments (영어, 문장 단위)
- 채널 테마
**Remotion 컴포지션:**
 
```typescript
// remotion/compositions/LayerAIStudio.tsx
export const LayerAIStudio: React.FC<VideoProps> = ({
  brollScenes,
  audioUrl,
  subtitleSegments,
}) => {
  return (
    <AbsoluteFill style={{ backgroundColor: '#0A0A0A' }}>
      {/* 배경: B-roll */}
      <Sequence from={0}>
        <BRollSequence scenes={brollScenes} />
      </Sequence>
      
      {/* 영어 자막 (문장 단위) */}
      <Sequence from={0}>
        <EnglishSubtitle 
          segments={subtitleSegments}
          theme="ai"
        />
      </Sequence>
      
      {/* 한국어 오디오 (Supertone 생성) */}
      <Audio src={audioUrl} />
      
      {/* 브랜드 워터마크 */}
      <BrandOverlay channel="ai" />
    </AbsoluteFill>
  );
};
```
 
**자막 스타일 (`EnglishSubtitle.tsx`):**
 
```typescript
const EnglishSubtitle: React.FC<{ 
  segments: SubtitleSegment[];
  theme: 'ai' | 'skin';
}> = ({ segments, theme }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTime = frame / fps;
  
  // 현재 시간에 해당하는 세그먼트 찾기
  const current = segments.find(
    s => currentTime >= s.start && currentTime < s.end
  );
  
  if (!current) return null;
  
  return (
    <div style={{
      position: 'absolute',
      bottom: '15%',
      left: '5%',
      right: '5%',
      textAlign: 'center',
      padding: '16px',
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      borderRadius: '12px',
      fontFamily: 'Inter, sans-serif',
      fontSize: '48px',
      fontWeight: 600,
      color: '#FFFFFF',
      lineHeight: 1.3,
    }}>
      {current.textEn}
    </div>
  );
};
```
 
**설정:**
- 해상도: 1080x1920 (9:16)
- 프레임레이트: 30fps
- 영상 길이: 오디오 길이 (50~65초)
- 코덱: H.264
**성능:**
- 로컬 렌더링: 약 2~3분/영상
---
 
### 9️⃣ S3 업로드 & Notion 카드 생성
 
**S3 구조:**
```
s3://layer-studio-assets/
├── videos/
│   └── 2026-04-21/
│       ├── ai_{videoId}.mp4
│       └── skin_{videoId}.mp4
├── audio/
│   └── 2026-04-21/
│       ├── ai_{videoId}_ko.mp3     # 한국어 음성 (Supertone)
│       └── skin_{videoId}_ko.mp3
└── subtitles/
    └── 2026-04-21/
        ├── ai_{videoId}_en.srt     # 영어 자막
        └── skin_{videoId}_en.srt
```
 
**Notion 페이지 필드:**
```
제목: [Title Ko] (한국어 제목)
Title En: [Title En] (YouTube용 영어 제목)
Channel: AI / Skin
Status: Pending Review
Script Ko: [한국어 스크립트 전문]
Script En: [영어 자막 전문]
Video: [S3 presigned URL]
Audio: [S3 presigned URL, 한국어]
SRT: [S3 presigned URL, 영어 자막]
TTS Credits: [Supertone 소모 크레딧]
Metadata:
  - YouTube Title (English)
  - YouTube Description (English)
  - YouTube Tags
Created At: [timestamp]
Approved: ☐
Scheduled At: [다음날 07:00 KST]
```
 
---
 
### 🔟 Slack 알림
 
```
🎬 *[Layer AI Studio]* 새 영상 준비됨
 
🇰🇷 KO: "Claude가 새 SDK를 공개했다"
🇺🇸 EN: "Claude Unveils New SDK for Builders"
 
음성 길이: 58초 (580 크레딧 / 100,000)
예약: 내일 07:00 KST
 
📝 <Notion 링크|스크립트 & 미리보기 확인>
✅ 1-2분 내 승인 필요
```
 
---
 
### 1️⃣1️⃣ 승인
 
**흐름:**
1. Slack 알림
2. Notion 앱에서 미리보기 확인
3. 한국어 스크립트 & 영어 자막 체크
4. Approved 체크박스
5. Notion Webhook → 백엔드
**수정 가능 영역:**
- Title En (YouTube 제목)
- Description En
- Script Ko (한국어 수정 시 해당 문장만 Supertone 재호출 + 오디오 재병합 가능)
- Script En (영어 자막만 수정 가능, TTS 재호출 불필요)
> 💡 문장별 분할 호출 방식이라 **특정 문장만 재생성**하는 부분 수정이 가능함 → 승인 피드백 반영 비용이 낮음.
 
---
 
### 1️⃣2️⃣ YouTube 업로드 + 자막
 
**Step 1: 영상 업로드**
```typescript
await youtube.videos.insert({
  // ...
  requestBody: {
    snippet: {
      title: titleEn,              // 영어
      description: descriptionEn,   // 영어
      tags: tagsEn,
      defaultLanguage: 'en',        // 자막 언어
      defaultAudioLanguage: 'ko',   // 오디오 언어
      categoryId: '28',
    },
    status: {
      privacyStatus: 'private',
      publishAt: scheduledTime,
    },
  },
  media: { body: videoStream },
});
```
 
**Step 2: 자막 파일 별도 업로드**
```typescript
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
  media: { body: srtStream },
});
```
 
**효과:**
- 공식 영어 자막으로 등록 → YouTube 검색에 영어 키워드 노출
- 영상에 구워진 자막 + 공식 자막 **둘 다** 제공 → Shorts 시청자(번인 자막 의존) + 검색 유입(공식 자막 인덱싱) 모두 커버
- 공식 영어 자막이 YouTube **3차 언어 자동 번역의 소스**가 됨 → 스페인어·독일어·일본어 자동 다국어 도달 (공짜)
---
 
## ⏰ 타이밍 & 스케줄
 
### Cron
 
```yaml
# .github/workflows/daily-pipeline-ai.yml
on:
  schedule:
    - cron: '0 10 1,3,5,7,9,11,13,15,17,19,21,23,25,27,29,31 * *'
    # KST 19:00 = UTC 10:00, 이틀에 한 번
```
 
### 시간대
- **모든 시간 저장:** UTC
- **표시:** KST
- **업로드:** KST 07:00 = UTC 22:00 (전날)
---
 
## 🚨 에러 처리
 
| 단계 | 실패 시 |
|---|---|
| RSS 수집 | 부분 실패 허용 |
| 큐레이션 | 3회 재시도 |
| 한국어 스크립트 | 3회 재시도 |
| 영어 번역 | 3회 재시도, 실패 시 DeepL fallback |
| B-roll | 키워드 변경 재시도 |
| 한국어 TTS (Supertone) | **문장별 개별 재시도** (3회), 레이트 리밋 에러 시 지수 백오프 |
| 크레딧 부족 | 파이프라인 중단, Slack 긴급 알림 (수동 크레딧 충전 필요) |
| 자막 SRT 생성 | 실패 시 Remotion 내부 자막으로 fallback (공식 자막 업로드는 스킵) |
| 렌더링 | 2회 재시도 |
| YouTube 영상 업로드 | 5회 재시도 |
| YouTube 자막 업로드 | 3회 재시도, 실패해도 영상 자체는 유지 (번인 자막으로 커버) |
 
### Supertone 특화 에러 처리
 
```typescript
async function synthesizeWithRetry(text: string, retries = 3): Promise<SynthResult> {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await synthesizeSentence(text);
    } catch (error) {
      if (isRateLimitError(error)) {
        // 레이트 리밋: 지수 백오프
        await sleep(2 ** attempt * 1000);
        continue;
      }
      if (isCreditExhaustedError(error)) {
        // 크레딧 부족: 즉시 중단, 관리자 알림
        await slack.sendUrgent('Supertone credits exhausted');
        throw error;
      }
      if (attempt === retries - 1) throw error;
      await sleep(1000);
    }
  }
  throw new Error('Unreachable');
}
```
 
---
 
## 📊 모니터링
 
### 핵심 지표
1. 파이프라인 성공률 (목표 95%+)
2. 평균 실행 시간 (목표 8분 이내)
3. 단계별 병목
4. API 비용 (Claude + **Supertone 크레딧**)
5. **번역 품질** (샘플링 검토)
6. **Supertone 크레딧 잔량** (월 한도 대비)
### 번역 품질 모니터링
- 주 1회: 10개 영상 샘플 수동 검토
- 어색한 번역 → 프롬프트 개선
- 자주 틀리는 용어 → 번역 가이드 추가
### Supertone 크레딧 모니터링
- 매 파이프라인 실행마다 누적 크레딧 기록 (`ApiCost` 테이블)
- 월 사용량 80% 도달 시 Slack 경고
- 월 사용량 95% 도달 시 파이프라인 일시 중단
---
 
_Last updated: 2026-04-22_
 
