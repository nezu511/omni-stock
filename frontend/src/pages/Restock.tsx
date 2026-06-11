import { useEffect, useState } from 'react';

interface Item {
  id: number;
  name: string;
  quantity: number;
  minThreshold: number;
  imageUrl: string | null;
  // barcode: string | null; // 今後バーコード機能で使います！
}

export default function Restock() {
  const [items, setItems] = useState<Item[]>([]);
  const [inputValues, setInputValues] = useState<{ [key: number]: number | '' }>({});

  // 🌟 新機能：検索バーに入力された文字を記憶するState
  const [searchQuery, setSearchQuery] = useState('');

  const fetchItems = () => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('エラー:', err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 🌟 在庫を増やす通信処理（入荷なのでプラスで送る）
  const handleRestock = async (itemId: number, restockAmount: number) => {
    if (restockAmount <= 0) return;

    try {
      const response = await fetch('http://localhost:3001/api/quantity_change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: restockAmount, // 👈 そのままプラスの数として送信！
          actionType: 'RESTOCK',
        }),
      });

      if (response.ok) {
        fetchItems();
        setInputValues((prev) => ({ ...prev, [itemId]: '' }));
      } else {
        alert('在庫の更新に失敗しました');
      }
    } catch (error) {
      console.error('通信エラー:', error);
    }
  };

  // 🌟 検索ロジック：itemsの配列から、名前に検索ワードが含まれるものだけを抽出する
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      <h2 style={{ color: '#059669', borderBottom: '2px solid #6ee7b7', paddingBottom: '10px' }}>
        📥 物品の入荷（補充）
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>新しく届いた物品を在庫に追加します。</p>

      {/* 🌟 検索バー ＆ カメラボタン のエリア */}
      <div style={{ display: 'flex', gap: '10px', margin: '0 auto 30px', maxWidth: '600px' }}>
        <input
          type="text"
          placeholder="🔍 アイテム名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
        />
        <button
          onClick={() => alert('ここにカメラ起動処理を入れます！')}
          style={{ padding: '0 20px', fontSize: '20px', backgroundColor: '#374151', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
        >
          📷
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* 🌟 itemsではなく、絞り込み済みの filteredItems をループして描画する */}
        {filteredItems.map((item) => (
          <div key={item.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '15px',
            borderRadius: '12px',
            width: '240px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>

            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                画像なし
              </div>
            )}

            <h3 style={{ margin: '12px 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: '#059669' }}>
                残: {item.quantity}
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '15px 0' }} />

            <button
              onClick={() => handleRestock(item.id, 1)}
              style={{ width: '100%', padding: '10px', background: '#ecfdf5', color: '#059669', border: '1px solid #a7f3d0', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', transition: 'background 0.2s' }}
            >
              ＋1 クイック入荷
            </button>

            <div style={{ display: 'flex', gap: '5px' }}>
              <input
                type="number"
                min="1"
                placeholder="個数"
                value={inputValues[item.id] || ''}
                onChange={(e) => {
                  const val = parseInt(e.target.value, 10);
                  setInputValues((prev) => ({ ...prev, [item.id]: isNaN(val) ? '' : val }));
                }}
                style={{ flex: 1, padding: '8px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
              />
              <button
                onClick={() => handleRestock(item.id, inputValues[item.id] as number)}
                disabled={!inputValues[item.id]}
                style={{ padding: '8px 12px', background: inputValues[item.id] ? '#059669' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                入荷
              </button>
            </div>

          </div>
        ))}

        {/* 検索結果がゼロだった時のメッセージ */}
        {filteredItems.length === 0 && (
          <p style={{ color: '#6b7280', width: '100%', textAlign: 'center', marginTop: '20px' }}>
            「{searchQuery}」に一致する物品は見つかりませんでした。
          </p>
        )}
      </div>
    </div>
  );
}
