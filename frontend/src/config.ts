// バックエンドのベースURL。
// VITE_API_PORT が設定されている場合（開発時など、フロントとバックエンドが別ポート）は
// そのポートを使う。未設定の場合（本番ビルド・Cloudflare Tunnel経由など、フロントと
// バックエンドが同一オリジンで配信される構成）は window.location.origin をそのまま使う。
// 固定で :3001 を付けてしまうと、Tunnel経由（443のみ公開）で外から繋がらなくなるため。
const explicitApiPort = import.meta.env.VITE_API_PORT;
export const API_BASE = explicitApiPort
  ? `http://${window.location.hostname}:${explicitApiPort}`
  : window.location.origin;

// 画像URLを現在のアクセス経路（API_BASE）に合わせて解決する。
// DBには相対パス（例: /uploads/xxx.jpg）が保存されているが、Tunnel経由の
// 移行前に登録された古いデータには絶対URL（例: http://192.168.x.x:3001/uploads/xxx.jpg）が
// 残っている場合があるため、その場合もパス部分だけ取り出して現在のoriginで組み直す。
export function resolveImageUrl(imageUrl: string | null | undefined): string | null {
  if (!imageUrl) return null;
  if (!imageUrl.startsWith('http')) return `${API_BASE}${imageUrl}`;
  try {
    return `${API_BASE}${new URL(imageUrl).pathname}`;
  } catch {
    return imageUrl;
  }
}

export function getAuthToken(): string {
  return localStorage.getItem('omni-stock-token') ?? '';
}

export function clearAuthToken(): void {
  localStorage.removeItem('omni-stock-token');
}

export async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  const token = getAuthToken();
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      ...(options.headers as Record<string, string>),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });
  if (res.status === 401) {
    clearAuthToken();
    window.location.reload();
  }
  return res;
}
