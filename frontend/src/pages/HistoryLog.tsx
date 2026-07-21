import { useEffect, useState } from 'react';
import { apiFetch } from '../config';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { getDisplayName } from '../utils/getDisplayName';
import type { HistoryWithItem } from '../types';

export default function HistoryLog() {
  const { i18n, lang } = useLang();
  const t = i18n.historyLog;
  const navigate = useNavigate();

  const [history, setHistory] = useState<HistoryWithItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch(`/api/history`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter((h) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      h.item.name.toLowerCase().includes(q) ||
      (h.item.englishName ?? '').toLowerCase().includes(q)
    );
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button
          onClick={() => navigate('/manage')}
          style={{ fontSize: '14px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.backButton}
        </button>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>{t.subtitle}</p>

      <input
        type="text"
        placeholder={t.searchPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '16px' }}
      />

      {loading ? (
        <p style={{ color: '#6b7280' }}>{t.loading}</p>
      ) : filtered.length === 0 ? (
        <p style={{ color: '#6b7280' }}>{t.noHistory}</p>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
              <tr>
                <th style={{ padding: '10px 14px', color: '#4b5563', whiteSpace: 'nowrap' }}>{t.colDate}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colItem}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colAction}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563', textAlign: 'right' }}>{t.colAmount}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => {
                const itemName = getDisplayName(h.item.name, h.item.englishName, lang);
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 14px', color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(h.timestamp)}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#111827', fontWeight: 'bold', fontSize: '14px' }}>
                      {itemName.primary}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#374151', fontSize: '14px' }}>
                      {i18n.itemDetail.actions[h.actionType] ?? h.actionType}
                    </td>
                    <td style={{
                      padding: '8px 14px', textAlign: 'right', fontSize: '14px', fontWeight: 'bold',
                      color: h.amountChange > 0 ? '#059669' : h.amountChange < 0 ? '#dc2626' : '#9ca3af',
                    }}>
                      {h.amountChange > 0 ? `+${h.amountChange}` : h.amountChange}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
