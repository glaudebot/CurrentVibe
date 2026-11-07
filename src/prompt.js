export const PROMPTS = {
  ko: `아래 GitHub 저장소를 분석해줘. 아직 코드나 설정을 수정하지 마.

저장소: {{name}}
주소: {{url}}
설명: {{description}}

다음 순서로 정리해줘.
1. 요약: 이 저장소가 무엇이고 어떻게 동작하는지
2. 적용 가능 여부: 지금 내 프로젝트와 환경에 적용할 수 있는지, 그 이유
3. 사용 가능한 환경: 어떤 AI 도구나 환경에서 쓸 수 있는지(예: Claude Code CLI, Claude 데스크톱 앱, claude.ai 웹, Cursor, ChatGPT, Codex 등), 설치 형태(스킬, 플러그인, MCP 서버, 라이브러리 등)
4. 이점: 적용했을 때 얻는 것
5. 적용 방법: 단계 개요와 예상 변경 범위, 단점과 주의할 점

위 주소를 열 수 없다면 추측하지 말고, README 내용을 붙여 달라고 나에게 요청해.
내 프로젝트나 환경을 볼 수 없다면, 2번에 답하기 전에 내 환경(사용 중인 AI 도구, 언어, 프레임워크)을 먼저 물어봐.

분석이 끝나면 적용할지 나에게 묻고, 내가 승인하기 전까지 아무것도 변경하지 마.`,

  en: `Analyze the GitHub repository below. Do not modify any code or settings yet.

Repository: {{name}}
URL: {{url}}
Description: {{description}}

Report in this order:
1. Summary: what this repository is and how it works
2. Applicability: whether it can be applied to my current project and environment, and why
3. Supported environments: which AI tools or environments it works with (e.g. Claude Code CLI, Claude desktop app, claude.ai web, Cursor, ChatGPT, Codex), and its install form (skill, plugin, MCP server, library, etc.)
4. Benefits: what I gain by applying it
5. How to apply: outline of steps and expected scope of changes, plus downsides and cautions

If you cannot open the URL above, do not guess. Ask me to paste the README instead.
If you cannot see my project or environment, ask about my environment (AI tools, languages, frameworks) before answering item 2.

When the analysis is done, ask me whether to apply it, and change nothing until I approve.`,
};

export function buildPrompt(lang, repo) {
  let tpl = PROMPTS[lang];
  if (!repo.description) tpl = tpl.replace(/^.*\{\{description\}\}.*\n/m, '');
  const values = { name: repo.name, url: repo.url, description: repo.description };
  return tpl.replace(/\{\{(name|url|description)\}\}/g, (_, k) => values[k]);
}
