import { useState } from 'react';
import { API_BASE } from '../config';

export default function PasswordGate({ children }: { children: React.ReactNode }) {
  const [authenticated, setAuthenticated] = useState(() => {
    return !!localStorage.getItem('omni-stock-token');
  });
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        localStorage.setItem('omni-stock-token', password);
        setAuthenticated(true);
      } else {
        setError('パスワードが正しくありません');
        setPassword('');
      }
    } catch {
      setError('サーバーに接続できません');
    } finally {
      setLoading(false);
    }
  }

  if (authenticated) return <>{children}</>;

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f9fafb' }}>
      <div style={{ backgroundColor: 'white', padding: '40px 48px', borderRadius: '12px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', maxWidth: '380px', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ fontSize: '40px', marginBottom: '8px' }}>📦</div>
          <h1 style={{ margin: '0 0 6px', fontSize: '22px', fontWeight: 'bold', color: '#111827' }}>Omni-Stock</h1>
          <p style={{ margin: 0, color: '#6b7280', fontSize: '14px' }}>ラボ在庫管理システム</p>
        </div>
        <form onSubmit={handleSubmit}>
          <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '600', color: '#374151' }}>
            パスワード
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力"
            autoFocus
            style={{ display: 'block', width: '100%', padding: '10px 12px', border: `1px solid ${error ? '#fca5a5' : '#d1d5db'}`, borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '8px', outline: 'none' }}
          />
          {error && (
            <p style={{ margin: '0 0 10px', color: '#dc2626', fontSize: '13px' }}>{error}</p>
          )}
          <button
            type="submit"
            disabled={loading || !password}
            style={{ width: '100%', padding: '11px', backgroundColor: loading || !password ? '#d1d5db' : '#3b82f6', color: 'white', border: 'none', borderRadius: '8px', fontSize: '15px', fontWeight: 'bold', cursor: loading || !password ? 'default' : 'pointer', marginTop: error ? '0' : '4px' }}
          >
            {loading ? '確認中...' : 'ログイン'}
          </button>
        </form>
      </div>
    </div>
  );
}
