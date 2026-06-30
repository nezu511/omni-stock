import { useEffect, useState } from 'react';
import { API_BASE } from '../config';
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

  const fetchItems = () => {
    fetch(`${API_BASE}/api/items`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('Error:', err));
  };

  const fetchReagents = () => {
    fetch(`${API_BASE}/api/reagents`)
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

  const handleCancelOrder = async (itemId: number) => {
    try {
      const res = await fetch(`${API_BASE}/api/change_status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, orderStatus: 'NONE' }),
      });
      if (res.ok) {
        setItems(prev => prev.map(item =>
          item.id === itemId ? { ...item, orderStatus: 'NONE' } : item
        ));
      } else {
        alert(i18n.restock.cancelFailed);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRestock = async (itemId: number, restockAmount: number) => {
    if (restockAmount <= 0) return;

    try {
      const response = await fetch(`${API_BASE}/api/quantity_change`, {
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
    const res = await fetch(`${API_BASE}/api/reagent_requests/${requestId}/status`, {
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
      width: '240px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
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
      width: '240px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
    }}>

      <Link to={`/manage/${item.id}`}>
        {item.imageUrl ? (
          <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px', cursor: 'pointer' }} />
        ) : (
          <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af', cursor: 'pointer' }}>
            {i18n.restock.noImage}
          </div>
        )}
      </Link>

      <h3 style={{ margin: '12px 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>

      <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
        <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#059669' }}>
          {i18n.restock.stockLeft} {formatBoxQuantity(item.quantity, item.unitPerBox)}
        </p>
      </div>

      {item.unitPerBox > 1 && (
        <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
          {i18n.restock.boxHint(item.unitPerBox)}
        </div>
      )}

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
          style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
        />
        <button
          onClick={() => handleRestock(item.id, (inputValues[item.id] as number) * (item.unitPerBox > 1 ? item.unitPerBox : 1))}
          disabled={!inputValues[item.id]}
          style={{ padding: '8px 12px', background: inputValues[item.id] ? '#059669' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
        >
          {i18n.restock.restockButton}
        </button>
      </div>

      {item.orderStatus === 'ORDERED' && (
        <button
          onClick={() => handleCancelOrder(item.id)}
          style={{ width: '100%', marginTop: '6px', padding: '7px', backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px' }}
        >
          {i18n.restock.cancelButton}
        </button>
      )}

      <Link
        to={`/manage/${item.id}`}
        style={{ display: 'block', textAlign: 'center', marginTop: '10px', backgroundColor: '#e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}
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
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginBottom: '30px' }}>
            {orderedItems.map(renderItemCard)}
            {orderedReagentRequests.map(renderReagentRequestCard)}

            {orderedItems.length === 0 && orderedReagentRequests.length === 0 && (
              <p style={{ color: '#6b7280', width: '100%', textAlign: 'center', marginTop: '20px' }}>
                {i18n.restock.noOrdered}
              </p>
            )}
          </div>

          <h3 style={{ color: '#92400e', marginBottom: '15px' }}>{i18n.restock.othersSection}</h3>
          <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
            {otherItems.map(renderItemCard)}

            {otherItems.length === 0 && (
              <p style={{ color: '#6b7280', width: '100%', textAlign: 'center', marginTop: '20px' }}>
                {i18n.restock.noOthers}
              </p>
            )}
          </div>
        </>
      ) : (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {searchResults.map(renderItemCard)}

          {searchResults.length === 0 && (
            <p style={{ color: '#6b7280', width: '100%', textAlign: 'center', marginTop: '20px' }}>
              {i18n.restock.notFound(searchQuery)}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
