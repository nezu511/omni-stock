import { Link } from 'react-router-dom';
import { API_BASE } from '../config';
import { useState, useEffect } from 'react';
import type { Item, Reagent, ReagentRequest } from '../types';
import { formatQuantity } from '../utils/formatQuantity';
import { useLang } from '../contexts/LanguageContext';

type RequestWithReagent = ReagentRequest & { reagent: Reagent };

function Home() {
  const { i18n } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [reagents, setReagents] = useState<Reagent[]>([]);
  // ARRIVED試薬は最終状態（DBステータスを戻す先がない）なのでlocalStorageで確認済みを管理
  const [dismissedReagentRequestIds, setDismissedReagentRequestIds] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem('dismissedReagentRequestIds');
      return saved ? new Set<number>(JSON.parse(saved)) : new Set<number>();
    } catch {
      return new Set<number>();
    }
  });

  useEffect(() => {
    fetch(`${API_BASE}/api/items`)
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('Error:', err));
    fetch(`${API_BASE}/api/reagents`)
      .then((res) => res.json())
      .then((data) => setReagents(data))
      .catch((err) => console.error('Error:', err));
  }, []);

  const needsOrder = items.filter(item => item.quantity <= item.minThreshold && item.orderStatus === 'NONE');
  const orderedLowStock = items.filter(item => item.quantity <= item.minThreshold && item.orderStatus === 'ORDERED');
  const lowStockItems = [...needsOrder, ...orderedLowStock];
  const arrivedItems = items.filter(item => item.orderStatus === 'ARRIVED');

  // REQUESTED 状態のリクエストを持つ試薬（承認待ち）
  const pendingReagents = reagents.filter(r => r.requests.some(req => req.status === 'REQUESTED'));

  // ARRIVED 状態のリクエスト（未確認・未非表示）
  const arrivedReagentRequests: RequestWithReagent[] = reagents.flatMap(r =>
    r.requests
      .filter(req => req.status === 'ARRIVED' && !dismissedReagentRequestIds.has(req.id))
      .map(req => ({ ...req, reagent: r }))
  );

  const handleChangeStatus = async (itemId: number, orderStatus: string) => {
    try {
      const res = await fetch(`${API_BASE}/api/change_status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, orderStatus }),
      });
      const updated = await res.json();
      setItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, orderStatus: updated.orderStatus } : item)
      );
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const dismissReagentRequest = (requestId: number) => {
    setDismissedReagentRequestIds(prev => {
      const next = new Set([...prev, requestId]);
      localStorage.setItem('dismissedReagentRequestIds', JSON.stringify([...next]));
      return next;
    });
  };

  const bigButtonStyle = (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '240px',
    height: '180px',
    backgroundColor: color,
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    textDecoration: 'none',
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s',
  });

  const wideButtonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '10px',
    width: '100%',
    maxWidth: '780px',
    padding: '18px',
    backgroundColor: '#7c3aed',
    color: 'white',
    fontSize: '20px',
    fontWeight: 'bold',
    textDecoration: 'none',
    borderRadius: '12px',
    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  } as const;

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2 style={{ color: '#4b5563', marginBottom: '40px' }}>{i18n.home.question}</h2>

      {/* 3つのメインボタン */}
      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '20px' }}>
        <Link to="/consume" style={bigButtonStyle('#ef4444')}>📤 {i18n.nav.consume}</Link>
        <Link to="/restock" style={bigButtonStyle('#10b981')}>📥 {i18n.nav.restock}</Link>
        <Link to="/manage" style={bigButtonStyle('#4b5563')}>⚙️ {i18n.nav.manage}</Link>
      </div>

      {/* 試薬ボタン（横長） */}
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '60px' }}>
        <Link to="/reagents" style={wideButtonStyle}>
          {i18n.home.reagentButton}
        </Link>
      </div>

      {/* 在庫低下アラート */}
      {lowStockItems.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', backgroundColor: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#dc2626', marginTop: 0 }}>
            {i18n.home.lowStockAlert(lowStockItems.length)}
          </h3>
          <p style={{ color: '#991b1b', marginBottom: '20px' }}>
            {i18n.home.lowStockDesc}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {lowStockItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>{i18n.home.stockLeft} {formatQuantity(item.quantity, item.unitPerBox)}</span>
                  <span style={{ color: '#6b7280' }}>{i18n.home.thresholdLabel} {item.minThreshold}</span>
                </div>
                {item.orderStatus === 'ORDERED' ? (
                  <div style={{ textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '14px', fontWeight: 'bold', padding: '8px', borderRadius: '6px' }}>
                    {i18n.home.orderedBadge}
                  </div>
                ) : (
                  <button
                    onClick={() => handleChangeStatus(item.id, 'ORDERED')}
                    style={{ width: '100%', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    {i18n.home.orderButton}
                  </button>
                )}
                <Link
                  to={`/manage/${item.id}`}
                  style={{ display: 'block', textAlign: 'center', marginTop: '8px', backgroundColor: '#e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}
                >
                  {i18n.home.detailButton}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 消耗品 入荷確認 */}
      {arrivedItems.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '40px auto 0', textAlign: 'left', backgroundColor: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#059669', marginTop: 0 }}>
            {i18n.home.arrivedAlert(arrivedItems.length)}
          </h3>
          <p style={{ color: '#065f46', marginBottom: '20px' }}>
            {i18n.home.arrivedDesc}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {arrivedItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #a7f3d0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{item.name}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                  {i18n.home.stockLabel} {item.quantity}
                </div>
                <button
                  onClick={() => handleChangeStatus(item.id, 'NONE')}
                  style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {i18n.home.confirmButton}
                </button>
                <Link
                  to={`/manage/${item.id}`}
                  style={{ display: 'block', textAlign: 'center', marginTop: '8px', backgroundColor: '#e5e7eb', color: '#374151', textDecoration: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}
                >
                  {i18n.home.detailButton}
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 試薬 到着確認 */}
      {arrivedReagentRequests.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '40px auto 0', textAlign: 'left', backgroundColor: '#f5f3ff', border: '2px solid #c4b5fd', borderRadius: '12px', padding: '20px' }}>
          <h3 style={{ color: '#6d28d9', marginTop: 0 }}>
            {i18n.home.reagentArrivedAlert(arrivedReagentRequests.length)}
          </h3>
          <p style={{ color: '#5b21b6', marginBottom: '20px' }}>
            {i18n.home.reagentArrivedDesc}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {arrivedReagentRequests.map((req) => (
              <div key={req.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #ddd6fe', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{req.reagent.name}</div>
                {req.reagent.englishName && (
                  <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{req.reagent.englishName}</div>
                )}
                {req.requestedBy && (
                  <div style={{ fontSize: '13px', color: '#374151', marginBottom: '8px' }}>
                    {i18n.reagentManage.requestedBy} {req.requestedBy}
                  </div>
                )}
                <button
                  onClick={() => dismissReagentRequest(req.id)}
                  style={{ width: '100%', backgroundColor: '#7c3aed', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  {i18n.home.reagentConfirmButton}
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 試薬 承認待ちリクエスト */}
      {pendingReagents.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '40px auto 0', textAlign: 'left', backgroundColor: '#fefce8', border: '2px solid #fde047', borderRadius: '12px', padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
            <h3 style={{ color: '#a16207', marginTop: 0 }}>
              {i18n.home.reagentRequestAlert(pendingReagents.length)}
            </h3>
            <Link
              to="/reagents/manage"
              style={{ fontSize: '14px', color: '#a16207', textDecoration: 'none', fontWeight: 'bold', whiteSpace: 'nowrap' }}
            >
              {i18n.home.reagentManageButton}
            </Link>
          </div>
          <p style={{ color: '#713f12', marginBottom: '16px' }}>{i18n.home.reagentRequestDesc}</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {pendingReagents.map((r) => {
              const pendingCount = r.requests.filter(req => req.status === 'REQUESTED').length;
              return (
                <div key={r.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fde68a', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                  <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '4px' }}>{r.name}</div>
                  {r.englishName && <div style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>{r.englishName}</div>}
                  <div style={{ fontSize: '13px', color: '#92400e', marginBottom: '10px' }}>
                    {pendingCount} pending
                  </div>
                  <Link
                    to="/reagents/manage"
                    style={{ display: 'block', textAlign: 'center', backgroundColor: '#d97706', color: 'white', textDecoration: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold' }}
                  >
                    {i18n.home.reagentManageButton.replace('→ ', '')}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
