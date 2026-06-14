import { Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import type { Item } from '../types';

function Home() {

  const [items, setItems] = useState<Item[]>([]);

  useEffect(() => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('エラー:', err));
  }, []);

  const needsOrder = items.filter(item => item.quantity <= item.minThreshold && item.orderStatus === 'NONE');
  const orderedLowStock = items.filter(item => item.quantity <= item.minThreshold && item.orderStatus === 'ORDERED');
  const lowStockItems = [...needsOrder, ...orderedLowStock];
  const arrivedItems = items.filter(item => item.orderStatus === 'ARRIVED');

  const handleChangeStatus = async (itemId: number, orderStatus: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/change_status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId, orderStatus }),
      });
      const updated = await res.json();
      setItems(prev =>
        prev.map(item => item.id === itemId ? { ...item, orderStatus: updated.orderStatus } : item)
      );
    } catch (err) {
      console.error('エラー:', err);
    }
  };

  // 巨大ボタンの共通スタイル
  const buttonStyle = (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '240px',
    height: '180px',
    backgroundColor: color,
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    textDecoration: 'none', // リンクの下線を消す
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s', // カーソルを乗せた時のアニメーション準備
  });

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2 style={{ color: '#4b5563', marginBottom: '40px' }}>本日はどの作業を行いますか？</h2>

      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap', marginBottom: '60px' }}>
        {/* Linkコンポーネントを使うと、ページをリロードせずに一瞬で画面が切り替わります */}
        <Link to="/consume" style={buttonStyle('#ef4444')}>📤 使用</Link>
        <Link to="/restock" style={buttonStyle('#10b981')}>📥 入荷</Link>
        <Link to="/manage" style={buttonStyle('#4b5563')}>⚙️ 管理</Link>
      </div>

      {lowStockItems.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '0 auto', textAlign: 'left', backgroundColor: '#fef2f2', border: '2px solid #fca5a5', borderRadius: '12px', padding: '20px' }}>

          <h3 style={{ color: '#dc2626', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            ⚠️ 在庫低下アラート ({lowStockItems.length}件)
          </h3>

          <p style={{ color: '#991b1b', marginBottom: '20px' }}>
            以下のアイテムがしきい値を下回っています。補充を検討してください。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {lowStockItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #fecaca', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{item.name}</div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '10px' }}>
                  <span style={{ color: '#dc2626', fontWeight: 'bold' }}>残: {item.quantity}</span>
                  <span style={{ color: '#6b7280' }}>/ 閾値: {item.minThreshold}</span>
                </div>
                {item.orderStatus === 'ORDERED' ? (
                  <div style={{ textAlign: 'center', backgroundColor: '#fef3c7', color: '#92400e', fontSize: '14px', fontWeight: 'bold', padding: '8px', borderRadius: '6px' }}>
                    📦 注文済み
                  </div>
                ) : (
                  <button
                    onClick={() => handleChangeStatus(item.id, 'ORDERED')}
                    style={{ width: '100%', backgroundColor: '#dc2626', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                  >
                    注文した
                  </button>
                )}
              </div>
            ))}
          </div>

        </div>
      )}

      {arrivedItems.length > 0 && (
        <div style={{ maxWidth: '800px', margin: '40px auto 0', textAlign: 'left', backgroundColor: '#ecfdf5', border: '2px solid #6ee7b7', borderRadius: '12px', padding: '20px' }}>

          <h3 style={{ color: '#059669', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
            ✅ 入荷確認 ({arrivedItems.length}件)
          </h3>

          <p style={{ color: '#065f46', marginBottom: '20px' }}>
            以下のアイテムが入荷済みです。確認したら「確認した」を押してください。
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '15px' }}>
            {arrivedItems.map((item) => (
              <div key={item.id} style={{ backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #a7f3d0', boxShadow: '0 2px 4px rgba(0,0,0,0.05)' }}>
                <div style={{ fontWeight: 'bold', color: '#111827', marginBottom: '8px' }}>{item.name}</div>
                <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '10px' }}>
                  在庫: {item.quantity}
                </div>
                <button
                  onClick={() => handleChangeStatus(item.id, 'NONE')}
                  style={{ width: '100%', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', padding: '8px', fontSize: '14px', fontWeight: 'bold', cursor: 'pointer' }}
                >
                  確認した
                </button>
              </div>
            ))}
          </div>

        </div>
      )}
    </div>
  );
}

export default Home;
