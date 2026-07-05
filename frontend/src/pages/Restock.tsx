import { useEffect, useState, useCallback } from 'react';
import { apiFetch } from '../config';
import { Link } from 'react-router-dom';
import type { Item, Reagent, ReagentRequest } from '../types';
import { matchesSearchQuery } from '../utils/searchItems';
import { formatBoxQuantity } from '../utils/formatQuantity';
import { useLang } from '../contexts/LanguageContext';

type RequestWithReagent = ReagentRequest & { reagent: Reagent };

export default function Restock() {
  const { i18n } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: number]: number | '' }>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [orderedReagentRequests, setOrderedReagentRequests] = useState<RequestWithReagent[]>([]);
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);

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

  const fetchReagents = () => {
    apiFetch(`/api/reagents`)
      .then((res) => res.json())
      .then((reagents: Reagent[]) => {
        const ordered: RequestWithReagent[] = reagents.flatMap((r) =>
          r.requests
            .filter((req) => req.status === 'ORDERED')
            .map((req) => ({ ...req, reagent: r }))
        );
        setOrderedReagentRequests(ordered);
      })
      .catch((err) => console.error('Error:', err));
  };

  useEffect(() => {
    fetchItems();
    fetchReagents();
  }, []);

  const handleRestock = async (itemId: number, restockAmount: number) => {
    if (restockAmount <= 0) return;

    try {
      const response = await apiFetch(`/api/quantity_change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: restockAmount,
          actionType: 'RESTOCK',
        }),
      });

      if (response.ok) {
        setItems((prev) => prev.map((item) =>
          item.id === itemId
            ? { ...item, quantity: item.quantity + restockAmount, orderStatus: item.orderStatus === 'ORDERED' ? 'ARRIVED' : item.orderStatus }
            : item
        ));
        setInputValues((prev) => ({ ...prev, [itemId]: '' }));
      } else {
        alert(i18n.restock.updateFailed);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleReagentArrive = async (requestId: number) => {
    const res = await apiFetch(`/api/reagent_requests/${requestId}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'ARRIVED' }),
    });
    if (!res.ok) {
      alert(i18n.restock.reagentArriveFailed);
      return;
    }
    setOrderedReagentRequests((prev) => prev.filter((r) => r.id !== requestId));
  };

  // 検索ワードが空のときは「注文済み（入荷待ち）」とその他のアイテムをセクション分けして表示し、
  // 検索が始まったらorderStatusに関係なく名前・キーワードで絞り込む
  const isDefaultView = searchQuery.trim() === '';
  const orderedItems = items.filter((item) => item.orderStatus === 'ORDERED');
  const otherItems = items.filter((item) => item.orderStatus !== 'ORDERED');
  const searchResults = items.filter((item) => matchesSearchQuery(item, searchQuery));

  const renderReagentRequestCard = (req: RequestWithReagent) => (
    <div key={req.id} style={{
      backgroundColor: 'white',
      border: '2px solid #ddd6fe',
      padding: '15px',
      borderRadius: '12px',
      boxShadow: '0 2px 4px rgba(0, 0, 0, 0.06)',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <div style={{ fontSize: '11px', fontWeight: 'bold', color: '#7c3aed', backgroundColor: '#f5f3ff', padding: '3px 8px', borderRadius: '4px', display: 'inline-block', marginBottom: '8px' }}>
        {i18n.restock.reagentBadge}
      </div>
      <h3 style={{ margin: '0 0 4px', fontSize: '18px', color: '#1f2937' }}>{req.reagent.name}</h3>
      {req.reagent.englishName && (
        <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '6px' }}>{req.reagent.englishName}</div>
      )}
      {req.requestedBy && (
        <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
          {i18n.restock.requestedBy} {req.requestedBy}
        </div>
      )}
      {req.reagent.site_url && (
        <a href={req.reagent.site_url} target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '13px', color: '#3b82f6', display: 'block', marginBottom: '10px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          🔗 {req.reagent.site_url}
        </a>
      )}
      <hr style={{ border: 'none', borderTop: '1px dashed #ddd6fe', margin: '10px 0' }} />
      <button
        onClick={() => handleReagentArrive(req.id)}
        style={{ width: '100%', padding: '10px', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
      >
        {i18n.restock.reagentArriveButton}
      </button>
    </div>
  );

  const renderItemCard = (item: Item) => (
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
          src={item.imageUrl}
          alt={item.name}
          onClick={() => setEnlargedImage(item.imageUrl!)}
          style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'zoom-in' }}
        />
      ) : (
        <Link to={`/manage/${item.id}`}>
          <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer' }}>
            {i18n.restock.noImage}
          </div>
        </Link>
      )}

      <h3 style={{ margin: '10px 0 6px', fontSize: '16px', color: '#1f2937', lineHeight: 1.3 }}>{item.name}</h3>

      <div style={{ marginBottom: '4px' }}>
        <div style={{ fontSize: '11px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{i18n.restock.stockLeft}</div>
        <div style={{ fontSize: '26px', fontWeight: 'bold', lineHeight: 1.1, color: '#059669' }}>
          {formatBoxQuantity(item.quantity, item.unitPerBox)}
          {item.unitPerBox > 1 && <span style={{ fontSize: '12px', fontWeight: 'normal', color: '#6b7280', marginLeft: '6px' }}>{i18n.restock.boxHint(item.unitPerBox)}</span>}
        </div>
      </div>

      <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '15px 0' }} />

      <button
        onClick={() => handleRestock(item.id, item.unitPerBox > 1 ? item.unitPerBox : 1)}
        style={{ width: '100%', padding: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', transition: 'background 0.2s' }}
      >
        {item.unitPerBox > 1 ? i18n.restock.quickBoxButton : i18n.restock.quickButton}
      </button>

      <div style={{ display: 'flex', gap: '5px' }}>
        <input
          type="number"
          min="1"
          placeholder={item.unitPerBox > 1 ? i18n.restock.boxPlaceholder : i18n.restock.quantityPlaceholder}
          value={inputValues[item.id] || ''}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            setInputValues((prev) => ({ ...prev, [item.id]: isNaN(val) ? '' : val }));
          }}
          style={{ flex: 1, minWidth: 0, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '14px' }}
        />
        <button
          onClick={() => handleRestock(item.id, (inputValues[item.id] as number) * (item.unitPerBox > 1 ? item.unitPerBox : 1))}
          disabled={!inputValues[item.id]}
          style={{ flexShrink: 0, padding: '8px 10px', background: inputValues[item.id] ? '#059669' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold', fontSize: '14px' }}
        >
          {i18n.restock.restockButton}
        </button>
      </div>

      <Link
        to={`/manage/${item.id}`}
        style={{ display: 'block', textAlign: 'center', marginTop: '10px', backgroundColor: '#f9fafb', color: '#6b7280', textDecoration: 'none', borderRadius: '6px', padding: '7px', fontSize: '13px', border: '1px solid #e5e7eb' }}
      >
        {i18n.restock.detailButton}
      </Link>

    </div>
  );

  return (
    <div>
      <h2 style={{ color: '#059669', borderBottom: '2px solid #6ee7b7', paddingBottom: '10px' }}>
        {i18n.restock.title}
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>{i18n.restock.subtitle}</p>

      <div style={{ display: 'flex', gap: '10px', margin: '0 auto 30px', maxWidth: '600px' }}>
        <input
          type="text"
          placeholder={i18n.restock.searchPlaceholder}
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

      {isDefaultView ? (
        <>
          <h3 style={{ color: '#92400e', marginBottom: '15px' }}>{i18n.restock.orderedSection}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px', marginBottom: '30px' }}>
            {orderedItems.map(renderItemCard)}
            {orderedReagentRequests.map(renderReagentRequestCard)}

            {orderedItems.length === 0 && orderedReagentRequests.length === 0 && (
              <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px' }}>
                {i18n.restock.noOrdered}
              </p>
            )}
          </div>

          <h3 style={{ color: '#92400e', marginBottom: '15px' }}>{i18n.restock.othersSection}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
            {otherItems.map(renderItemCard)}

            {otherItems.length === 0 && (
              <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px' }}>
                {i18n.restock.noOthers}
              </p>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
          {searchResults.map(renderItemCard)}

          {searchResults.length === 0 && (
            <p style={{ color: '#6b7280', gridColumn: '1 / -1', textAlign: 'center', marginTop: '20px' }}>
              {i18n.restock.notFound(searchQuery)}
            </p>
          )}
        </div>
      )}
      {enlargedImage && (
        <div
          onClick={closeImage}
          style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, cursor: 'zoom-out' }}
        >
          <img
            src={enlargedImage}
            alt="拡大"
            onClick={(e) => e.stopPropagation()}
            style={{ maxWidth: '90vw', maxHeight: '90vh', objectFit: 'contain', borderRadius: '8px', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' }}
          />
        </div>
      )}
    </div>
  );
}
