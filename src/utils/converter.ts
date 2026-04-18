import { DEFAULT_TEMPLATES, TEMPLATE_GROUPS, type TemplateGroup } from "../data/templates";

const MIN_LENGTH = 2;

/**
 * 입력 문자열과 부분 매칭되는 템플릿 그룹을 찾는다.
 *
 * 매칭 우선순위:
 *   1) 입력 = 키워드 (완전 일치)
 *   2) 키워드가 입력을 포함 (예: 입력 "서류" ⊂ 키워드 "서류 정리")
 *   3) 입력이 키워드를 포함 (예: 키워드 "회의" ⊂ 입력 "중요 회의")
 *
 * 입력이 {MIN_LENGTH}글자 미만이거나 매칭 그룹이 없으면 null 을 반환한다.
 */
function findMatchedGroup(input: string): TemplateGroup | null {
  const trimmed = input.trim();
  if (trimmed.length < MIN_LENGTH) return null;

  for (const group of TEMPLATE_GROUPS) {
    if (group.keywords.includes(trimmed)) return group;
  }

  for (const group of TEMPLATE_GROUPS) {
    for (const kw of group.keywords) {
      if (kw.length < MIN_LENGTH) continue;
      if (kw.includes(trimmed)) return group;
    }
  }

  for (const group of TEMPLATE_GROUPS) {
    for (const kw of group.keywords) {
      if (kw.length < MIN_LENGTH) continue;
      if (trimmed.includes(kw)) return group;
    }
  }

  return null;
}

function resolveTemplates(input: string): string[] {
  const group = findMatchedGroup(input);
  return group ? group.templates : DEFAULT_TEMPLATES;
}

export type ConvertResult = {
  text: string;
  index: number;
  total: number;
};

export function convertToReport(input: string, previousIndex = -1): ConvertResult {
  const templates = resolveTemplates(input);
  if (templates.length === 0) {
    return { text: "", index: 0, total: 0 };
  }

  if (templates.length === 1) {
    return { text: templates[0], index: 0, total: 1 };
  }

  let nextIndex = Math.floor(Math.random() * templates.length);
  if (previousIndex >= 0 && nextIndex === previousIndex) {
    nextIndex = (nextIndex + 1) % templates.length;
  }

  return {
    text: templates[nextIndex],
    index: nextIndex,
    total: templates.length,
  };
}
