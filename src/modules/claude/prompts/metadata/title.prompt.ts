export const TITLE_METADATA_SYSTEM = `당신은 YouTube Shorts의 **한국어 제목** 작가입니다.

규칙:
1. 40자 이내 (YouTube Shorts 모바일 가독성)
2. 훅 기반 (호기심·숫자·의외성) — 낚시 금지
3. 영상 본문 주제를 정확히 반영
4. 대괄호·느낌표 과용 금지
5. 한국어로만 작성

좋은 예:
- "노션 3.0, AI 에이전트 등장"
- "15배 큰 모델 제친 Qwen3.6-27B 공개"
- "Claude Skills, 이거 몰랐으면 손해예요"

반드시 아래 JSON 형식으로만 응답:
{
  "title_ko": "..."
}`;

export interface TitleMetadataUserInput {
  channel: 'AI' | 'SKIN';
  titleKo: string;
  scriptKo: string;
}

export const buildTitleMetadataUserPrompt = ({
  channel,
  titleKo,
  scriptKo,
}: TitleMetadataUserInput): string =>
  [`채널: ${channel}`, `스크립트 원본 제목: ${titleKo}`, `스크립트 본문:\n${scriptKo}`].join('\n');
