import { useState, useEffect } from 'react';
import { apiFetch } from '../config';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import { getDisplayName } from '../utils/getDisplayName';
import type { Reagent } from '../types';

export default function ReagentRequest() {
  const { i18n, lang } = useLang();
  const t = i18n.reagentRequest;
  const navigate = useNavigate();

  const [reagents, setReagents] = useState<Reagent[]>([]);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Reagent | null>(null);
  const [requestedBy, setRequestedBy] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [note, setNote] = useState('');
  const [message, setMessage] = useState('');

  // 新規試薬登録フォーム
  const [tab, setTab] = useState<'existing' | 'new'>('existing');
  const [newName, setNewName] = useState('');
  const [newEnglishName, setNewEnglishName] = useState('');
  const [newCatalogNumber, setNewCatalogNumber] = useState('');
  const [newSiteUrl, setNewSiteUrl] = useState('');

  useEffect(() => {
    apiFetch(`/api/reagents`)
      .then((r) => r.json())
      .then(setReagents)
      .catch(console.error);
  }, []);

  const filtered = reagents.filter((r) => {
    const q = query.toLowerCase();
    return (
      r.name.toLowerCase().includes(q) ||
      (r.englishName ?? '').toLowerCase().includes(q) ||
      (r.catalogNumber ?? '').toLowerCase().includes(q)
    );
  });

  async function submitRequest(reagentId: number) {
    const res = await apiFetch(`/api/reagent_requests`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reagentId, requestedBy, quantity, note: note.trim() || null }),
    });
    if (!res.ok) {
      setMessage(t.submitFailed);
      return;
    }
    setMessage(t.submitSuccess);
    setSelected(null);
    setRequestedBy('');
    setQuantity(1);
    setNote('');
    setQuery('');
  }

  async function handleRegisterAndRequest() {
    if (!newName.trim()) return;

    const regRes = await apiFetch(`/api/reagents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName, englishName: newEnglishName, catalogNumber: newCatalogNumber, site_url: newSiteUrl }),
    });
    if (!regRes.ok) {
      setMessage(t.registerFailed);
      return;
    }
    const created: Reagent = await regRes.json();
    setReagents((prev) => [...prev, { ...created, requests: [] }]);

    await submitRequest(created.id);
    setTab('existing');
    setNewName('');
    setNewEnglishName('');
    setNewCatalogNumber('');
    setNewSiteUrl('');
  }

  const card: React.CSSProperties = {
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '12px 16px',
    backgroundColor: 'white',
    cursor: 'pointer',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  };

  const selectedCard: React.CSSProperties = {
    ...card,
    borderColor: '#3b82f6',
    backgroundColor: '#eff6ff',
  };

  return (
    <div style={{ maxWidth: '640px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button
          onClick={() => navigate('/reagents/manage')}
          style={{ fontSize: '14px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.manageLink}
        </button>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>{t.subtitle}</p>

      {message && (
        <div style={{ padding: '10px 14px', borderRadius: '6px', marginBottom: '16px', backgroundColor: message === t.submitSuccess ? '#d1fae5' : '#fee2e2', color: message === t.submitSuccess ? '#065f46' : '#991b1b' }}>
          {message}
        </div>
      )}

      {/* タブ切り替え */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button
          onClick={() => setTab('existing')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
            border: tab === 'existing' ? '2px solid #3b82f6' : '1px solid #d1d5db',
            backgroundColor: tab === 'existing' ? '#eff6ff' : 'white',
            color: tab === 'existing' ? '#1d4ed8' : '#374151',
          }}
        >
          {t.existingTabLabel}
        </button>
        <button
          onClick={() => setTab('new')}
          style={{
            flex: 1, padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px', cursor: 'pointer',
            border: tab === 'new' ? '2px solid #10b981' : '1px solid #d1d5db',
            backgroundColor: tab === 'new' ? '#ecfdf5' : 'white',
            color: tab === 'new' ? '#065f46' : '#374151',
          }}
        >
          {t.newTabLabel}
        </button>
      </div>

      {tab === 'existing' && (
        <>
          {/* 検索 */}
          <input
            type="text"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
            placeholder={t.searchPlaceholder}
            style={{ width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '15px', boxSizing: 'border-box', marginBottom: '12px' }}
          />

          {/* 試薬リスト */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
            {filtered.length === 0 && query && (
              <p style={{ color: '#9ca3af', textAlign: 'center' }}>{t.noResults}</p>
            )}
            {filtered.map((r) => {
              const reagentName = getDisplayName(r.name, r.englishName, lang);
              return (
              <div
                key={r.id}
                style={selected?.id === r.id ? selectedCard : card}
                onClick={() => setSelected(selected?.id === r.id ? null : r)}
              >
                <div>
                  <div style={{ fontWeight: 'bold' }}>{reagentName.primary}</div>
                  {reagentName.secondary && <div style={{ fontSize: '13px', color: '#6b7280' }}>{reagentName.secondary}</div>}
                  {r.catalogNumber && <div style={{ fontSize: '12px', color: '#9ca3af' }}># {r.catalogNumber}</div>}
                </div>
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>
                  {r.requests.length > 0 ? `${r.requests.length} req` : ''}
                </span>
              </div>
              );
            })}
          </div>

          {/* 選択済み → requestedBy + 提出 */}
          {selected && (
            <div style={{ border: '1px solid #3b82f6', borderRadius: '8px', padding: '16px', backgroundColor: '#eff6ff', marginBottom: '16px' }}>
              <div style={{ fontWeight: 'bold', marginBottom: '10px' }}>📌 {getDisplayName(selected.name, selected.englishName, lang).primary}</div>
              <label style={{ fontSize: '14px', color: '#374151' }}>{t.requestedByLabel}</label>
              <input
                type="text"
                value={requestedBy}
                onChange={(e) => setRequestedBy(e.target.value)}
                placeholder={t.requestedByPlaceholder}
                style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
              />
              <label style={{ fontSize: '14px', color: '#374151' }}>{t.quantityLabel}</label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                style={{ display: 'block', width: '100px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
              />
              <label style={{ fontSize: '14px', color: '#374151' }}>{t.noteLabel}</label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder={t.notePlaceholder}
                rows={2}
                style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
              />
              <button
                onClick={() => submitRequest(selected.id)}
                style={{ padding: '8px 20px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                {t.submitButton}
              </button>
            </div>
          )}
        </>
      )}

      {tab === 'new' && (
        <div style={{ border: '1px solid #d1fae5', borderRadius: '8px', padding: '16px', backgroundColor: 'white' }}>
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.nameLabel} *</label>
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.englishNameLabel}</label>
          <input
            type="text"
            value={newEnglishName}
            onChange={(e) => setNewEnglishName(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.catalogNumberLabel}</label>
          <input
            type="text"
            value={newCatalogNumber}
            onChange={(e) => setNewCatalogNumber(e.target.value)}
            placeholder={t.catalogNumberPlaceholder}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.urlLabel}</label>
          <input
            type="text"
            value={newSiteUrl}
            onChange={(e) => setNewSiteUrl(e.target.value)}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '10px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.requestedByLabel}</label>
          <input
            type="text"
            value={requestedBy}
            onChange={(e) => setRequestedBy(e.target.value)}
            placeholder={t.requestedByPlaceholder}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.quantityLabel}</label>
          <input
            type="number"
            min="1"
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
            style={{ display: 'block', width: '100px', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box' }}
          />
          <label style={{ fontSize: '14px', fontWeight: 'bold' }}>{t.noteLabel}</label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder={t.notePlaceholder}
            rows={2}
            style={{ display: 'block', width: '100%', padding: '8px 10px', border: '1px solid #d1d5db', borderRadius: '6px', marginTop: '4px', marginBottom: '12px', boxSizing: 'border-box', resize: 'vertical', fontFamily: 'inherit' }}
          />
          <button
            onClick={handleRegisterAndRequest}
            disabled={!newName.trim()}
            style={{ padding: '8px 20px', backgroundColor: newName.trim() ? '#10b981' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: newName.trim() ? 'pointer' : 'default', fontWeight: 'bold' }}
          >
            {t.registerAndRequest}
          </button>
        </div>
      )}
    </div>
  );
}
