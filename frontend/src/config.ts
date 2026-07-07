// バックエンドのベースURL。
// window.location.hostname を使うことで、localhost でも LAN の IP からでも正しく動作する。
const API_PORT = import.meta.env.VITE_API_PORT ?? '3001';
export const API_BASE = `http://${window.location.hostname}:${API_PORT}`;

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
