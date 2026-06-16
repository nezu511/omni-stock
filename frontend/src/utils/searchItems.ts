import type { Item } from '../types';

// アイテム名・英語名・キーワードのいずれかに検索語が含まれていればヒットとする
// null フィールドは '' にフォールバックしてから検索する
export function matchesSearchQuery(item: Item, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(lowerQuery) ||
    (item.englishName ?? '').toLowerCase().includes(lowerQuery) ||
    (item.keywords ?? '').toLowerCase().includes(lowerQuery)
  );
}
