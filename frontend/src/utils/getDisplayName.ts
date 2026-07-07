import type { Lang } from '../locales';

// 英語モードかつ英語名がある場合のみ英語名を主表示にする。
// 英語名が無い場合は英語モードでも日本語名にフォールバックする。
export function getDisplayName(
  name: string,
  englishName: string | null | undefined,
  lang: Lang
): { primary: string; secondary: string | null } {
  if (lang === 'en' && englishName) {
    return { primary: englishName, secondary: name };
  }
  return { primary: name, secondary: englishName || null };
}
