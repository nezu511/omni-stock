import { useEffect, useState, useCallback } from 'react';
import { apiFetch, resolveImageUrl } from '../config';
import { Link } from 'react-router-dom';
import type { Item } from '../types';
import { matchesSearchQuery } from '../utils/searchItems';
import { getDisplayName } from '../utils/getDisplayName';
import { useLang } from '../contexts/LanguageContext';
import AuditConfirmModal from '../components/AuditConfirmModal';

export default function Consume() {
  const { i18n, lang } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: number]: number | '' }>({});
  const [consumeMode, setConsumeMode] = useState<{ [key: number]: 'unit' | 'box' }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [auditModalItem, setAuditModalItem] = useState<Item | null>(null);

  const closeImage = useCallback(() => setEnlargedImage(null), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') closeImage(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [closeImage]);

  const fetchItems = () => {
    apiFetch(`/api/items`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('Error:', err));
  };

  useEffect(fetchItems, []);

  const handleConsume = async (itemId: number, consumeAmount: number) => {
    if (consumeAmount <= 0) return;

    try {
      const response = await apiFetch(`/api/quantity_change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: -consumeAmount,
          actionType: 'CONSUME',
        }),
      });

      if (response.ok) {
        const updated: Item & { auditRequested?: boolean } = await response.json();
        setItems((prev) => prev.map((item) => (item.id === itemId ? { ...item, ...updated } : item)));
        setInputValues((prev) => ({ ...prev, [itemId]: '' }));
        if (updated.auditRequested) {
          setAuditModalItem(updated);
        }
      } else {
        alert(i18n.consume.updateFailed);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredItems = items.filter((item) => matchesSearchQuery(item, searchQuery));

  return (
    <div>
      <h2 style={{ color: '#dc2626', borderBottom: '2px solid #fca5a5', paddingBottom: '10px' }}>
        {i18n.consume.title}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>{i18n.consume.subtitle}</p>

      <div style={{ display: 'flex', gap: '10px', margin: '0 auto 30px', maxWidth: '600px' }}>
        <input
          type="text"
          placeholder={i18n.consume.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
        />
        <button
          onClick={() => alert('Camera feature coming soon!')}
          style={{ padding: '0 20px', fontSize: '20px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          📷
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
        {filteredItems.map((item) => {
          const itemName = getDisplayName(item.name, item.englishName, lang);
          return (
          <div key={item.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '15px',
            borderRadius: '12px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
            display: 'flex',
            flexDirection: 'column',
          }}>

            {item.imageUrl ? (
              <img
                src={resolveImageUrl(item.imageUrl) ?? undefined}
                alt={item.name}
                onClick={() => setEnlargedImage(item.imageUrl!)}
                style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in' }}
              />
            ) : (
              <Link to={`/manage/${item.id}`}>
                <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer' }}>
                  {i18n.consume.noImage}
                </div>
              </Link>
            )}

            <h3 style={{ margin: '10px 0 6px', fontSize: '16px', color: '#1f2937', lineHeight: 1.3 }}>{itemName.primary}</h3>
            {itemName.secondary && <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '-4px', marginBottom: '6px' }}>{itemName.secondary}</div>}

            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i18n.consume.stockLeft}</div>
              <div style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.1, color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827' }}>
                {item.quantity}
                {item.unitPerBox > 1 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '6px' }}>{i18n.consume.boxHint(item.unitPerBox)}</span>}
              </div>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '15px 0' }} />

            {item.unitPerBox > 1 && (
              <div style={{ display: 'flex', gap: '6px', marginBottom: '10px' }}>
                <button
                  onClick={() => setConsumeMode((prev) => ({ ...prev, [item.id]: 'unit' }))}
                  style={{
                    flex: 1, padding: '6px', fontSize: '13px', fontWeight: 'bold', borderRadius: '6px',
                    border: '1px solid #fca5a5', cursor: 'pointer',
                    background: (consumeMode[item.id] ?? 'unit') === 'unit' ? '#dc2626' : '#fff',
                    color: (consumeMode[item.id] ?? 'unit') === 'unit' ? 'white' : '#dc2626',
                  }}
                >
                  {i18n.consume.unitModeButton}
                </button>
                <button
                  onClick={() => setConsumeMode((prev) => ({ ...prev, [item.id]: 'box' }))}
                  style={{
                    flex: 1, padding: '6px', fontSize: '13px', fontWeight: 'bold', borderRadius: '6px',
                    border: '1px solid #fca5a5', cursor: 'pointer',
                    background: consumeMode[item.id] === 'box' ? '#dc2626' : '#fff',
                    color: consumeMode[item.id] === 'box' ? 'white' : '#dc2626',
                  }}
                >
                  {i18n.consume.boxModeButton}
                </button>
              </div>
            )}

            <button
              onClick={() => handleConsume(item.id, 1)}
              style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', transition: 'background 0.2s' }}
            >
              {i18n.consume.quickButton}
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="number"
                min="1"
                placeholder={item.unitPerBox > 1 && consumeMode[item.id] === 'box' ? `${i18n.consume.boxModeButton}数` : i18n.consume.quantityPlaceholder}
                value={inputValues[item.id] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setInputValues((prev) => ({ ...prev, [item.id]: isNaN(val) ? '' : val }));
                }}
                style={{ flex: 1, minWidth: 0, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
              />
              <button
                onClick={() => {
                  const raw = inputValues[item.id] as number;
                  const isBox = item.unitPerBox > 1 && consumeMode[item.id] === 'box';
                  handleConsume(item.id, isBox ? raw * item.unitPerBox : raw);
                }}
                disabled={!inputValues[item.id]}
                style={{ flexShrink: 0, padding: '8px 10px', background: inputValues[item.id] ? '#dc2626' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px' }}
              >
                {i18n.consume.useButton}
              </button>
            </div>

            <Link
              to={`/manage/${item.id}`}
              style={{ display: 'block', textAlign: 'center', marginTop: '10px', backgroundColor: '#f9fafb', color: '#6b7280', textDecoration: 'none', borderRadius: '6px', padding: '7px', fontSize: '13px', border: '1px solid #e5e7eb' }}
            >
              {i18n.consume.detailButton}
            </Link>

          </div>
          );
        })}
      </div>
      {enlargedImage && (
        <div
          onClick={closeImage}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}
        >
          <img
            src={resolveImageUrl(enlargedImage) ?? undefined}
            alt="拡大"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
      {auditModalItem && (
        <AuditConfirmModal
          itemId={auditModalItem.id}
          itemName={getDisplayName(auditModalItem.name, auditModalItem.englishName, lang).primary}
          currentQuantity={auditModalItem.quantity}
          onClose={() => setAuditModalItem(null)}
          onUpdated={(updated) => setItems((prev) => prev.map((item) => (item.id === updated.id ? { ...item, ...updated } : item)))}
        />
      )}
    </div>
  );
}
