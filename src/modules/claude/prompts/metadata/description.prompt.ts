export const DESCRIPTION_METADATA_SYSTEM = `당신은 YouTube Shorts의 **한국어 설명(Description)과 태그**를 작성합니다.

규칙:
- 설명: 2~3개 짧은 문단, 총 500자 이하
- 첫 줄 = 훅 / 한 줄 요약
- 마지막 줄 = 가이드형 CTA (예: "더 자세한 내용은 다음 영상에서 알려드릴게요")
  → 구독 강요("구독 눌러주세요") 금지
- 태그: 8~12개 소문자 한국어 키워드
  - 주제 관련 + 넓은 AI/개발 태그 섞기
  - 영어 고유명사는 원어 그대로 OK (claude, chatgpt, mcp 등)
  - # 기호 없이 순수 단어만

반드시 아래 JSON 형식으로만 응답:
{
  "description_ko": "...",
  "tags": ["태그1", "태그2"]
}`;

export interface DescriptionMetadataUserInput {
  channel: 'AI' | 'SKIN';
  titleKo: string;
  scriptKo: string;
}

export const buildDescriptionMetadataUserPrompt = ({
  channel,
  titleKo,
  scriptKo,
}: DescriptionMetadataUserInput): string =>
  [`채널: ${channel}`, `제목: ${titleKo}`, `스크립트 본문:\n${scriptKo}`].join('\n');
