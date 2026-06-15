import type { Item } from '../types';

// アイテム名・キーワードのいずれかに検索語が含まれていればヒットとする
// keywords は null の場合があるため '' にフォールバックしてから検索する
export function matchesSearchQuery(item: Item, query: string): boolean {
  const lowerQuery = query.toLowerCase();
  return (
    item.name.toLowerCase().includes(lowerQuery) ||
    (item.keywords ?? '').toLowerCase().includes(lowerQuery)
  );
}
