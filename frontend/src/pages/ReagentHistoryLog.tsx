import { useEffect, useState } from 'react';
import { apiFetch } from '../config';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { getDisplayName } from '../utils/getDisplayName';
import type { ReagentHistoryWithReagent } from '../types';

export default function ReagentHistoryLog() {
  const { i18n, lang } = useLang();
  const t = i18n.reagentHistoryLog;
  const navigate = useNavigate();

  const [history, setHistory] = useState<ReagentHistoryWithReagent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    apiFetch(`/api/reagent-history`)
      .then((res) => res.json())
      .then((data) => setHistory(data))
      .catch((err) => console.error('Error:', err))
      .finally(() => setLoading(false));
  }, []);

  const filtered = history.filter((h) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      h.reagent.name.toLowerCase().includes(q) ||
      (h.reagent.englishName ?? '').toLowerCase().includes(q)
    );
  });

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
  }

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button
          onClick={() => navigate('/reagents/manage')}
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
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colReagent}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colAction}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563', textAlign: 'right' }}>{t.colQuantity}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colRequestedBy}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{t.colNote}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((h) => {
                const reagentName = getDisplayName(h.reagent.name, h.reagent.englishName, lang);
                return (
                  <tr key={h.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                    <td style={{ padding: '8px 14px', color: '#6b7280', fontSize: '13px', whiteSpace: 'nowrap' }}>
                      {formatDate(h.timestamp)}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#111827', fontWeight: 'bold', fontSize: '14px' }}>
                      {reagentName.primary}
                    </td>
                    <td style={{ padding: '8px 14px', color: '#374151', fontSize: '14px' }}>
                      {t.actions[h.actionType] ?? h.actionType}
                    </td>
                    <td style={{ padding: '8px 14px', textAlign: 'right', fontSize: '14px', color: '#374151' }}>
                      {h.quantity ?? '-'}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: '13px', color: '#6b7280' }}>
                      {h.requestedBy ?? '-'}
                    </td>
                    <td style={{ padding: '8px 14px', fontSize: '13px', color: '#92400e', whiteSpace: 'pre-wrap' }}>
                      {h.note ?? ''}
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
