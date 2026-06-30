import { useEffect, useState } from 'react';
import { API_BASE } from '../config';
import { Link } from 'react-router-dom';
import type { Item } from '../types';
import { matchesSearchQuery } from '../utils/searchItems';
import { useLang } from '../contexts/LanguageContext';

export default function Consume() {
  const { i18n } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: number]: number | '' }>({});
  const [consumeMode, setConsumeMode] = useState<{ [key: number]: 'unit' | 'box' }>({});
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = () => {
    fetch(`${API_BASE}/api/items`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('Error:', err));
  };

  useEffect(fetchItems, []);

  const handleConsume = async (itemId: number, consumeAmount: number) => {
    if (consumeAmount <= 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/quantity_change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: -consumeAmount,
          actionType: 'CONSUME',
        }),
      });

      if (response.ok) {
        setItems((prev) => prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity - consumeAmount } : item
        ));
        setInputValues((prev) => ({ ...prev, [itemId]: '' }));
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

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {filteredItems.map((item) => (
          <div key={item.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '15px',
            borderRadius: '12px',
            width: '240px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>

            <Link to={`/manage/${item.id}`}>
              {item.imageUrl ? (
                <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} />
              ) : (
                <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer' }}>
                  {i18n.consume.noImage}
                </div>
              )}
            </Link>

            <h3 style={{ margin: '12px 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827' }}>
                {i18n.consume.stockLeft} {item.quantity}
              </p>
            </div>

            {item.unitPerBox > 1 && (
              <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                {i18n.consume.boxHint(item.unitPerBox)}
              </div>
            )}

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
                style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
              />
              <button
                onClick={() => {
                  const raw = inputValues[item.id] as number;
                  const isBox = item.unitPerBox > 1 && consumeMode[item.id] === 'box';
                  handleConsume(item.id, isBox ? raw * item.unitPerBox : raw);
                }}
                disabled={!inputValues[item.id]}
                style={{ padding: '8px 12px', background: inputValues[item.id] ? '#dc2626' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                {i18n.consume.useButton}
              </button>
            </div>

            <Link
              to={`/manage/${item.id}`}
              style={{ display: 'block', textAlign: 'center', marginTop: '10px', backgroundColor: '#e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}
            >
              {i18n.consume.detailButton}
            </Link>

          </div>
        ))}
      </div>
    </div>
  );
}
