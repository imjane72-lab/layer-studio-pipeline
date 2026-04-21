# Layer Studio

> Claude Agent SDK 기반 YouTube 쇼츠 자동 생성 파이프라인

AI 분석 채널과 K-Beauty 과학 채널, 영어권 글로벌 시청자 대상 두 개 채널을 자동화하는 풀스택 프로젝트입니다.

[![Status](https://img.shields.io/badge/상태-개발중-yellow)]()
[![License](https://img.shields.io/badge/라이선스-MIT-blue.svg)](./LICENSE)
[![NestJS](https://img.shields.io/badge/NestJS-E0234E?logo=nestjs&logoColor=white)]()
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?logo=typescript&logoColor=white)]()
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-4169E1?logo=postgresql&logoColor=white)]()

---

## 🎯 프로젝트 개요

Layer Studio는 YouTube 쇼츠 제작의 전 과정을 자동화하는 프로덕션 레벨의 콘텐츠 파이프라인입니다.

- 📰 **뉴스 큐레이션** — 15개 이상의 테크/뷰티 소스에서 최신 뉴스 수집
- ✍️ **스크립트 생성** — Claude Sonnet 기반 편집 퀄리티의 스크립트 자동 작성
- 🎙️ **음성 합성** — 개인 복제 목소리(ElevenLabs)로 영어 나레이션
- 🎬 **영상 합성** — 9:16 세로 포맷, 스톡 B-roll + 동적 자막
- 📤 **자동 업로드** — 두 YouTube 채널에 자동 배포

**결과:** 약 7분의 자동 처리로 프로덕션 퀄리티의 쇼츠 1편 완성. 사용자 승인은 Notion 대시보드에서 1-2분.

---

## 📺 운영 채널

| 채널 | 주제 | 핸들 |
|---------|-------|--------|
| **Layer AI Studio** | AI 도구, 트렌드, 빌더 인사이트 | [@LayerAIStudio](https://youtube.com/@LayerAIStudio) |
| **Layer Skin Studio** | K-Beauty 성분 과학 | [@LayerSkinStudio](https://youtube.com/@LayerSkinStudio) |

두 채널 모두 영어 faceless 쇼츠 포맷으로, 글로벌 영어권 시청자를 타겟합니다. 업로드 주기는 각 채널 이틀에 한 번입니다.

---

## 🏗️ 시스템 아키텍처

```
┌──────────────────────────────────────────────────────────┐
│        GitHub Actions Cron (한국 시간 오후 7시, 격일)      │
└────────────────────────┬─────────────────────────────────┘
                         │
                         ▼
┌──────────────────────────────────────────────────────────┐
│              NestJS 오케스트레이션 레이어                  │
│  ┌──────────┐  ┌───────────┐  ┌──────────┐  ┌────────┐   │
│  │ RSS/News │─▶│Claude SDK │─▶│ Pexels   │─▶│Eleven  │   │
│  │ Ingestor │  │  + MCP    │  │  B-roll  │  │  Labs  │   │
│  └──────────┘  └───────────┘  └──────────┘  └────────┘   │
│                                                  │        │
│                                                  ▼        │
│                                          ┌────────────┐   │
│                                          │ Remotion   │   │
│                                          │ 렌더링      │   │
│                                          └─────┬──────┘   │
└────────────────────────────────────────────────┼─────────┘
                                                 ▼
                                         ┌────────────┐
                                         │  Notion    │
                                         │ DB 카드    │
                                         └─────┬──────┘
                                               │
                                  ┌────────────┴─────────┐
                                  ▼                      ▼
                          ┌──────────────┐      ┌────────────┐
                          │ Slack 알림   │      │ 승인 Webhook│
                          │              │      │             │
                          └──────────────┘      └─────┬──────┘
                                                      ▼
                                              ┌────────────┐
                                              │YouTube API │
                                              │예약 업로드  │
                                              └────────────┘
```

---

## 🛠️ 기술 스택

### 핵심 스택
- **백엔드:** NestJS + TypeScript
- **데이터베이스:** PostgreSQL + Prisma
- **AI 오케스트레이션:** Claude Agent SDK + Model Context Protocol (MCP)
- **스크립트 생성:** Claude Sonnet & Haiku
- **음성 합성:** ElevenLabs Voice Cloning API
- **영상 합성:** Remotion (React 기반)
- **B-roll 수급:** Pexels API

### 인프라
- **스케줄링:** GitHub Actions (cron)
- **승인 워크플로:** Notion API
- **알림:** Slack Webhooks
- **스토리지:** AWS S3
- **배포:** Railway (예정)

---

## 🎬 콘텐츠 파이프라인

격일 기준 한국 시간 오후 7시에 실행:

1. **뉴스 수집** — RSS 피드에서 최근 48시간 기사 수집
2. **주제 선정** — Haiku가 채널별로 최적 주제 1개 선별
3. **스크립트 작성** — Sonnet이 150단어 내외 스크립트와 문장별 B-roll 키워드 생성
4. **B-roll 매칭** — Pexels API로 각 키워드에 맞는 9:16 세로 영상 수급
5. **음성 합성** — ElevenLabs로 나레이션 + 단어 단위 타임스탬프 생성
6. **영상 렌더링** — Remotion으로 영상 + 자막 합성
7. **알림** — Notion 카드 생성 + Slack 푸시
8. **사용자 승인** — 1-2분 내 Notion 체크박스로 승인
9. **예약 업로드** — YouTube Data API로 다음날 오전 7시 자동 공개

업로드된 영상은 한국 시간 오전 7시에 공개됩니다. 이는 미국 동부 시간 전날 오후 6시로, 영어권 시청 피크 타임입니다.

---

## 📚 문서

- [CLAUDE.md](./CLAUDE.md) — Claude Code를 위한 개발 가이드라인
- [docs/SPEC.md](./docs/SPEC.md) — 상세 기술 스펙
- [docs/WORKFLOW.md](./docs/WORKFLOW.md) — 파이프라인 워크플로 상세
- [docs/CONTENT.md](./docs/CONTENT.md) — 콘텐츠 가이드라인 및 프롬프트
- [docs/SETUP.md](./docs/SETUP.md) — 개발 환경 설정 가이드

---

## 🚧 개발 현황

**활발히 개발 중 — 2026년 4월**

로드맵:
- [x] 브랜드 아이덴티티 및 채널 셋업
- [x] 프로젝트 아키텍처 설계
- [x] 문서화
- [ ] NestJS 백엔드 스캐폴딩
- [ ] Claude Agent SDK 통합
- [ ] 콘텐츠 도구용 MCP 서버
- [ ] Remotion 영상 템플릿
- [ ] ElevenLabs 음성 복제 셋업
- [ ] Pexels B-roll 통합
- [ ] YouTube Data API 통합
- [ ] Notion 승인 워크플로
- [ ] 첫 파이프라인 엔드투엔드 테스트
- [ ] 프로덕션 배포

---

## 💡 프로젝트 배경

기존 제가 개발한 [skindit](https://skindit-web.vercel.app) 프로젝트의 경험을 확장한 프로젝트입니다.

skindit에서 구축한 Claude Agent SDK, MCP 서버, RAG 하이브리드 검색 경험을 바탕으로, 이번에는 **완전 자동화된 콘텐츠 파이프라인**에 도전합니다. 단순히 AI를 호출하는 게 아니라, 에이전트가 여러 도구를 연쇄적으로 사용하는 **실제 프로덕션 규모의 Agentic 워크플로**를 구현하는 것이 목표입니다.

### 왜 두 개 채널인가

AI 분야와 K-Beauty 분야를 함께 다루는 이유는:
- 🧪 **두 분야 모두 "성분 해체"가 핵심** — AI 기술을 뜯어보는 것과 화장품 성분을 분석하는 것은 동일한 접근법입니다
- 🎯 **동일한 파이프라인으로 두 영역 커버** — 채널별 프롬프트만 분리하면 전체 인프라 재활용 가능
- 💼 **같은 "Wisely/Layer Studio" 브랜드의 두 축** — skindit과 시너지

---

## 👤 제작자

**김지혜 (Jihye)** — AI 엔지니어링과 콘텐츠 크리에이션의 교차점을 탐구하는 개발자.

- **skindit** — AI 기반 화장품 성분 분석 서비스 ([skindit-web.vercel.app](https://skindit-web.vercel.app))
- **기술 블로그** — [velog.io/@wisely](https://velog.io/@wisely)
- **GitHub** — [@imjane72-lab](https://github.com/imjane72-lab)

---

## 📜 라이선스

MIT © 2026 Jihye
