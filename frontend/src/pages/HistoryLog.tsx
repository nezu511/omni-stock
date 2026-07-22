import { useEffect, useState } from 'react';
import { apiFetch } from '../config';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { getDisplayName } from '../utils/getDisplayName';
import type { HistoryWithItem, ReagentHistoryWithReagent } from '../types';

type Mode = 'item' | 'reagent';

export default function HistoryLog() {
  const { i18n, lang } = useLang();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const mode: Mode = searchParams.get('type') === 'reagent' ? 'reagent' : 'item';
  const t = mode === 'item' ? i18n.historyLog : i18n.reagentHistoryLog;

  const [itemHistory, setItemHistory] = useState<HistoryWithItem[]>([]);
  const [reagentHistory, setReagentHistory] = useState<ReagentHistoryWithReagent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  async function loadHistory(currentMode: Mode) {
    setLoading(true);
    setSearchQuery('');
    try {
      if (currentMode === 'item') {
        const res = await apiFetch(`/api/history`);
        setItemHistory(await res.json());
      } else {
        const res = await apiFetch(`/api/reagent-history`);
        setReagentHistory(await res.json());
      }
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    (async () => { await loadHistory(mode); })();
  }, [mode]);

  const filteredItemHistory = itemHistory.filter((h) => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      h.item.name.toLowerCase().includes(q) ||
      (h.item.englishName ?? '').toLowerCase().includes(q)
    );
  });

  const filteredReagentHistory = reagentHistory.filter((h) => {
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

  const tabStyle = (active: boolean): React.CSSProperties => ({
    flex: 1,
    padding: '10px',
    borderRadius: '8px',
    fontWeight: 'bold',
    fontSize: '14px',
    cursor: 'pointer',
    border: active ? '2px solid #3b82f6' : '1px solid #d1d5db',
    backgroundColor: active ? '#eff6ff' : 'white',
    color: active ? '#1d4ed8' : '#374151',
  });

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button
          onClick={() => navigate(mode === 'item' ? '/manage' : '/reagents/manage')}
          style={{ fontSize: '14px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.backButton}
        </button>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '16px' }}>{t.subtitle}</p>

      {/* アイテム / 試薬 切り替え */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button style={tabStyle(mode === 'item')} onClick={() => setSearchParams({ type: 'item' })}>
          📦 {i18n.nav.manage}
        </button>
        <button style={tabStyle(mode === 'reagent')} onClick={() => setSearchParams({ type: 'reagent' })}>
          🧪 {i18n.nav.reagent}
        </button>
      </div>

      <input
        type="text"
        placeholder={t.searchPlaceholder}
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '16px' }}
      />

      {loading ? (
        <p style={{ color: '#6b7280' }}>{t.loading}</p>
      ) : mode === 'item' ? (
        filteredItemHistory.length === 0 ? (
          <p style={{ color: '#6b7280' }}>{t.noHistory}</p>
        ) : (
          <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
                <tr>
                  <th style={{ padding: '10px 14px', color: '#4b5563', whiteSpace: 'nowrap' }}>{i18n.historyLog.colDate}</th>
                  <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.historyLog.colItem}</th>
                  <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.historyLog.colAction}</th>
                  <th style={{ padding: '10px 14px', color: '#4b5563', textAlign: 'right' }}>{i18n.historyLog.colAmount}</th>
                </tr>
              </thead>
              <tbody>
                {filteredItemHistory.map((h) => {
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
        )
      ) : filteredReagentHistory.length === 0 ? (
        <p style={{ color: '#6b7280' }}>{t.noHistory}</p>
      ) : (
        <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
              <tr>
                <th style={{ padding: '10px 14px', color: '#4b5563', whiteSpace: 'nowrap' }}>{i18n.reagentHistoryLog.colDate}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.reagentHistoryLog.colReagent}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.reagentHistoryLog.colAction}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563', textAlign: 'right' }}>{i18n.reagentHistoryLog.colQuantity}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.reagentHistoryLog.colRequestedBy}</th>
                <th style={{ padding: '10px 14px', color: '#4b5563' }}>{i18n.reagentHistoryLog.colNote}</th>
              </tr>
            </thead>
            <tbody>
              {filteredReagentHistory.map((h) => {
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
                      {i18n.reagentHistoryLog.actions[h.actionType] ?? h.actionType}
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
