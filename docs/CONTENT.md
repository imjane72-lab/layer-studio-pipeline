# 콘텐츠 가이드라인 (CONTENT.md)

> Layer Studio 두 채널의 콘텐츠 제작 규칙과 Claude 프롬프트 템플릿입니다.
> 이 문서의 규칙은 스크립트 작성 시 반드시 지켜야 합니다.

---

## 📋 목차

1. [브랜드 정체성](#브랜드-정체성)
2. [Layer AI Studio 가이드라인](#layer-ai-studio-가이드라인)
3. [Layer Skin Studio 가이드라인](#layer-skin-studio-가이드라인)
4. [공통 편집 규칙](#공통-편집-규칙)
5. [프롬프트 템플릿](#프롬프트-템플릿)
6. [금지 사항](#금지-사항)

---

## 🎨 브랜드 정체성

### Layer Studio (마스터 브랜드)

**핵심 메시지:** "우리는 한 층씩 파헤쳐 본질을 보여줍니다."

**슬로건 후보:**
- "Decoded, one layer at a time"
- "Peel back the layers"
- "Where depth meets clarity"

**시각 정체성:**
- 컬러 팔레트: 미니멀 블랙/화이트 + 채널별 액센트
- 폰트: 모던 산세리프 (Inter, Space Grotesk)
- 스타일: 깔끔, 전문적, 트렌디

### 두 채널의 공통점

- 언어: 영어 100%
- 포맷: Faceless Shorts (9:16, 60초 내외)
- 목소리: 지혜씨 복제 목소리 (두 채널 동일)
- 접근: **"분석적", "깊이 있는", "실용적"**
- 타겟 시청자: 글로벌 영어권 (미국 동부 시간대 최적화)

### 차별점

| 측면 | Layer AI Studio | Layer Skin Studio |
|------|-----------------|-------------------|
| **주제** | AI 도구, 트렌드, 빌더 인사이트 | K-Beauty 성분 과학, 피부 건강 |
| **액센트 컬러** | `#6366F1` (바이올렛, 기술) | `#EC9B7F` (웜 베이지, 피부) |
| **톤** | 분석적, 빌더 관점 | 과학적, 에스테티션 관점 |
| **폰트 보조** | JetBrains Mono (코드) | Cormorant (우아함) |
| **타겟** | 개발자, 창업자, AI 애호가 | K-뷰티 마니아, 민감성 피부 보유자 |

---

## 🤖 Layer AI Studio 가이드라인

### 핵심 포지셔닝

**"빌더 관점에서 AI를 해부하는 채널"**

- ❌ 주식 분석가가 아님
- ❌ 뉴스 앵커가 아님  
- ✅ **직접 빌드하는 사람의 시각**으로 전달

### 콘텐츠 유형

**Type 1: Tool Launch Analysis** (60%)
- 새로 나온 AI 도구/모델 분석
- 실제 뭘 할 수 있는지, 왜 중요한지
- 예: "Claude Design explained for builders"

**Type 2: Technique Deep Dive** (20%)
- MCP, Agent SDK, RAG 같은 기술 해부
- 빌더가 실무에 쓸 수 있는 지식
- 예: "Why MCP matters for agent developers"

**Type 3: Builder Story** (15%)
- 내가 직접 만들어본 경험
- skindit 개발 스토리 재활용 가능
- 예: "I built a skincare AI in 2 weeks"

**Type 4: Industry Signal** (5%)
- 주식/시장 동향은 **근거**로만 사용
- 메인 주제는 항상 기술이나 제품
- 예: Anthropic 펀딩 뉴스 → "What this means for Claude's future capabilities"

### 스크립트 구조

```
[0-3초] Hook: 질문 or 충격적 사실
  예: "What if one sentence could build an app?"

[3-15초] Context: 배경/발생한 일
  예: "Anthropic launched Claude Design last week..."

[15-45초] Key Insight: 핵심 인사이트 (빌더 관점)
  예: "Here's what changes for developers:
       You describe what you want. Claude builds a prototype.
       Not a mockup. A working prototype."

[45-55초] Evidence / Example: 구체적 예시
  예: "I tested it with a task that usually takes me 3 hours.
       It took 45 seconds."

[55-60초] CTA: 생각 유도
  예: "What will this mean for designers? Let me know."
```

### 톤 & 매너

- **짧은 문장** (10 단어 이내 선호)
- **능동태** ("Claude builds" not "is built by Claude")
- **구체적 숫자** ("3 hours → 45 seconds")
- **진지하되 건조하지 않게**
- **"I", "my", "we"** 사용 가능 (1인칭)

### 좋은 예 vs 나쁜 예

**❌ 나쁜 예 (주식 중심):**
> "Anthropic's valuation just hit $200 billion. 
> That's a 10x increase in one year. 
> Investors are piling in. 
> This signals AI is the biggest bubble since crypto."

**✅ 좋은 예 (빌더 중심):**
> "Anthropic just shipped Claude 5.
> The new MCP integration lets agents read your entire codebase in one call.
> I tried it on my side project. 
> What took 2 hours now takes 3 seconds.
> This is a new baseline for agent developers."

### 메타데이터 규칙

**제목 (50-60자):**
- 호기심 유발 + 명확한 가치
- 좋은 예: "I Built an AI Agent in 10 Minutes with Claude SDK"
- 나쁜 예: "Amazing AI Tool You Must See"

**설명:**
- 첫 2줄이 중요 (프리뷰에 보임)
- 관련 링크 (skindit, blog)
- 해시태그: #AI #Builders #Claude #SoftwareEngineering

**태그:**
- Primary: `AI`, `Claude`, `Builders`
- Secondary: 관련 도구명, 회사명

---

## 💄 Layer Skin Studio 가이드라인

### 핵심 포지셔닝

**"과학적 관점으로 K-뷰티를 해독하는 채널"**

- ❌ 광고/협찬 중심 리뷰 채널 아님
- ❌ 뷰티 인플루언서 톤 아님
- ✅ **성분 과학자/에스테티션**의 시각

### 콘텐츠 유형

**Type 1: Ingredient Deep Dive** (50%)
- 특정 성분의 과학적 분석
- 연구 데이터 기반
- 예: "PDRN explained: the science behind salmon DNA skincare"

**Type 2: K-Beauty Trend Decoded** (25%)
- 유행 중인 K-뷰티 제품/방법론 분석
- 왜 유행인지, 진짜 효과 있는지
- 예: "Why Korean sunscreens are different (chemistry explained)"

**Type 3: Skin Science Basics** (15%)
- 피부 장벽, 각질, PH 등 기초 과학
- 민감성 피부 관점 강조 (지혜씨 경험 반영)
- 예: "Why your skin barrier keeps breaking"

**Type 4: Ingredient Myth Busting** (10%)
- 잘못 알려진 성분 상식 교정
- 예: "Niacinamide at 10%: myth or magic?"

### 스크립트 구조

```
[0-3초] Hook: 충격적 사실 or 질문
  예: "The truth about niacinamide nobody tells you."

[3-15초] The Claim: 일반 상식 제시
  예: "Most serums use niacinamide at 10%.
       It's marketed as the higher the better."

[15-45초] The Science: 실제 과학
  예: "But studies show that above 5%,
       irritation rates jump by 3x in sensitive skin.
       The sweet spot is 2-4%."

[45-55초] Practical Takeaway: 실용 조언
  예: "If you have sensitive skin, look for products
       with 2-4% niacinamide. Your skin barrier will thank you."

[55-60초] CTA
  예: "What ingredient should I decode next? Comment below."
```

### 톤 & 매너

- **부드럽고 따뜻한 진지함** (AI 채널보다 덜 건조)
- **과학 용어 사용하되 설명** (agnostic listener 배려)
- **데이터 기반** ("studies show", "research suggests")
- **민감성 피부 관점** 자주 언급 (차별점)
- **한국 규제 시각** 가끔 활용 (MFDS 기준 등)

### 주제 선정 원칙

**✅ 다루는 주제:**
- 화장품 성분 과학
- 피부 장벽 건강
- K-뷰티 트렌드의 과학적 배경
- 피부에 영향 주는 수면/영양
- 자외선, 환경 요소와 피부

**⚠️ 제한적으로 다루는 주제:**
- 브랜드 리뷰 (광고처럼 보이면 안 됨)
- 개인 경험담 (과학 뒷받침 없으면 X)

**❌ 다루지 않는 주제:**
- 일반 다이어트/체중 감량
- 일반 운동 (피부와 직결되지 않으면)
- 정신 건강 (영역 밖)
- 의학적 치료 (피부과 영역)

### 메타데이터 규칙

**제목 (50-60자):**
- 과학 + 궁금증 조합
- 좋은 예: "The Science Behind PDRN: Does Salmon DNA Really Work?"
- 나쁜 예: "Best Korean Beauty Products 2026"

**설명:**
- 참고 연구/논문 언급 (신뢰성)
- skindit 링크 자연스럽게
- 해시태그: #KBeauty #Skincare #IngredientScience #SkinBarrier

**태그:**
- Primary: `KBeauty`, `Skincare`, `IngredientScience`
- Secondary: 성분명, 피부 고민 (sensitive skin, barrier)

---

## 📐 공통 편집 규칙

### 언어 & 문법

- **영어만 사용** (한국어 단어 등장 시 영어 설명 병기)
- **US English** 철자 기준 (color not colour)
- **Oxford comma 사용 유지** (clarity 우선)
- **숫자는 숫자로 표기** (대부분), 10 이하는 상황에 따라

### 스크립트 길이

- **목표:** 140-160 words (약 60초)
- **최소:** 120 words
- **최대:** 180 words

**이유:** ElevenLabs 평균 읽기 속도 155 WPM 기준

### 문장 길이

- **평균:** 8-12 단어
- **최대:** 18 단어 (Hook 제외)
- **최소:** 5 단어 (강조할 때)

### 인용/출처

- 특정 데이터 인용 시 출처 확인 필수
- "According to [출처]" 형태로 명시
- 애매한 통계는 빼기 ("많은 사람들이..." → 금지)

### 금지 표현

- ❌ "Let me tell you..." (진부)
- ❌ "Stay tuned..." (쇼츠에 안 맞음)
- ❌ "Don't forget to like and subscribe" (직접적 CTA 금지)
- ❌ "In this video..." (쇼츠 독특함 희석)
- ❌ "As many of you know..." (청자 가정)

### 권장 표현

- ✅ "Here's what happened:"
- ✅ "The twist?"
- ✅ "Now here's why it matters."
- ✅ "Think about it."
- ✅ "What changes today:"

---

## 🤖 프롬프트 템플릿

### 1. AI 채널 큐레이션 프롬프트

```
You are a content curator for Layer AI Studio, a YouTube Shorts channel 
that analyzes AI tools and trends from a builder's perspective.

# Your Task
From the news items below, select EXACTLY ONE that is best suited for 
a 60-second YouTube Short.

# Selection Criteria (in order of importance)

1. **Builder Relevance** — Can a developer or creator actually use/try 
   what's being discussed? Or learn a practical technique?

2. **Technical Depth** — Is there substance beyond surface news? 
   Something to analyze?

3. **Novelty** — Is this actually new, or recycled old news?

4. **Short-friendly** — Can the core insight fit in 60 seconds with 
   impact?

# Rejection Criteria (auto-skip)

- Stock price / investment angle as main topic
- CEO drama or personal gossip
- Vague "AI is the future" type articles with no substance
- Duplicates with our recent videos: {recent_video_topics}

# News Items
{news_items_json}

# Output Format (JSON only, no markdown)

{
  "selected_id": "item_id",
  "reason": "Why this is the best pick (Korean, 2-3 sentences)",
  "angle": "The specific angle we'll take (English, 1 sentence)",
  "estimated_broll_keywords": ["keyword1", "keyword2", "keyword3"]
}
```

### 2. AI 채널 스크립트 작성 프롬프트

```
You are the dedicated script writer for Layer AI Studio.

# Channel Identity
- Target: Global English-speaking builders, developers, AI enthusiasts
- Tone: Analytical, thoughtful, confident but not cocky
- Format: 60-second YouTube Short (faceless)
- Narrator: Cloned voice of the creator (Korean-born dev who built 
  skindit.com)

# Mandatory Rules

1. First 3 seconds = hook (< 8 words, makes people stop scrolling)
2. Short sentences (< 12 words average)
3. Concrete numbers and facts (not vague)
4. Builder perspective (not investor perspective)
5. Stock/market only as evidence (max 20% of script)
6. End with a thought-provoking CTA (not "subscribe")

# Script Structure

- [0-3s] Hook: Question or striking fact
- [3-15s] Context: What happened/background
- [15-45s] Key Insight: The core analytical point
- [45-55s] Evidence: Specific example or number
- [55-60s] CTA: Invite thought, not action

# Topic & Source

{news_content}

# Output Format (JSON only)

{
  "hook": "First 3s hook sentence",
  "script": "Full 150-word script, naturally flowing, one paragraph",
  "broll_plan": [
    {
      "sentence_index": 0,
      "text": "That sentence verbatim",
      "keywords": ["primary", "secondary"],
      "duration_seconds": 4
    }
  ],
  "metadata": {
    "title": "YouTube title (50-60 chars, curiosity + clarity)",
    "description": "YouTube description (first 2 lines critical). 
                    Include skindit.com naturally if relevant. 
                    End with hashtags.",
    "tags": ["AI", "Claude", "Builders", ...]
  }
}
```

### 3. Skin 채널 큐레이션 프롬프트

```
You are a content curator for Layer Skin Studio, a YouTube Shorts 
channel that decodes K-Beauty through ingredient science.

# Your Task
Select EXACTLY ONE news item / topic most suited for a science-forward 
60-second Short.

# Selection Criteria

1. **Scientific Angle** — Is there ingredient science, research, or 
   mechanism to explain?
2. **K-Beauty Relevance** — Connected to Korean beauty industry, 
   products, or regulations?
3. **Practical Value** — Does the viewer learn something useful?
4. **Sensitive Skin Bonus** — Bonus points if relevant to sensitive 
   skin / barrier health

# Rejection Criteria

- Pure marketing / product launches without science
- Celebrity beauty routines
- Vague lifestyle content
- General diet/fitness (outside our scope)
- Medical treatments (outside our scope)
- Duplicates with recent videos: {recent_video_topics}

# News Items
{news_items_json}

# Output Format (same JSON structure as AI channel)
```

### 4. Skin 채널 스크립트 작성 프롬프트

```
You are the dedicated script writer for Layer Skin Studio.

# Channel Identity
- Target: Global skincare enthusiasts, K-Beauty fans, sensitive skin 
  community
- Tone: Scientific but accessible, warm professionalism
- Format: 60-second YouTube Short (faceless)
- Narrator: Cloned voice (Korean-born, deep K-beauty ingredient 
  knowledge from building skindit.com)

# Mandatory Rules

1. First 3s = surprising claim or question
2. Use science terms BUT define them briefly
3. Cite research where possible ("studies show", "research suggests")
4. Mention sensitive skin perspective naturally when relevant
5. Reference Korean regulations (MFDS) or Korean perspective where 
   valuable
6. Avoid product recommendations (no branded content)

# Script Structure

- [0-3s] Hook: Surprising fact or question
- [3-15s] The Claim: Common belief / what people assume
- [15-45s] The Science: What research actually shows
- [45-55s] Practical Takeaway: Actionable insight
- [55-60s] CTA: Invite next topic suggestion

# Topic & Source
{news_content}

# Output Format (same JSON structure)
```

### 5. 메타데이터 최적화 프롬프트

```
Generate SEO-optimized YouTube metadata for this Short.

# Constraints
- Title: 50-60 chars, include primary keyword, curiosity gap
- Description: First 125 chars critical (shown in preview)
- Tags: 10-15 tags, mix of broad + specific
- Include #Shorts hashtag

# Context
Channel: {channel_name}
Script Summary: {script_first_sentence}
Key Keywords: {extracted_keywords}

# Output
{
  "title": "...",
  "description": "...",
  "tags": [...]
}
```

---

## 🚫 금지 사항

### 콘텐츠 수준

- ❌ **정보 판매 훅** ("120만원으로 알아낸...")
- ❌ **부업/수익 보장 언어** ("월 1000만원 버는 법")
- ❌ **과장된 언어** ("Mind-blowing!", "You won't believe!")
- ❌ **정치적 주제**
- ❌ **종교적 주제**
- ❌ **의학적 조언** (skincare는 소비자 교육 수준까지만)

### 윤리

- ❌ **허위 정보**
- ❌ **출처 없는 통계**
- ❌ **타 크리에이터 비방**
- ❌ **특정 브랜드 비방** (분석은 OK, 비방은 NO)

### 저작권

- ❌ **다른 영상 자막 번역 후 올리기**
- ❌ **음악 무단 사용**
- ✅ **Pexels (출처 명시)**, ElevenLabs (본인 목소리), 오리지널 텍스트

### AI 윤리

- ❌ **AI 아바타 (얼굴) 사용**
- ❌ **가짜 인물 설정**
- ✅ **본인 목소리 복제** (투명하게 disclosure)
- ✅ **스크립트는 Claude 도움, 검수는 사람**

---

## 📊 성과 추적 & 피드백 루프

### 주간 리뷰 (매주 일요일)

1. 지난 주 7개 영상 성과 체크
2. TOP 2 / BOTTOM 2 확인
3. 패턴 분석 (어떤 주제/앵글이 잘 됐는지)
4. 프롬프트 수정 (다음 주 반영)

### DB 기록

성과 좋은 영상은 `successful_patterns` 태그 DB에 저장:
- 훅 스타일
- 주제 유형
- 자막 패턴
- 썸네일 스타일

### 분기별 대대적 개선

- 매 3개월마다 프롬프트 전면 재검토
- A/B 테스트 데이터 반영
- 시청자 피드백 (댓글) 통합

---

_Last updated: 2026-04-21_
