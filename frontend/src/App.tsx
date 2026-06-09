import { useEffect, useState } from 'react'

// ① バックエンドから送られてくるデータの「型（構造）」を定義
interface Item {
  id: number;
  name: string;
  quantity: number;
  minThreshold: number;
  imageUrl: string | null;
}

function App() {
  // ② 状態管理（State）: 取得したデータを保存するメモリ。最初は空の配列 []
  const [items, setItems] = useState<Item[]>([]);

  //データを首都する処理を関数として定義
  const fetchItems = () => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('エラー：', err));
  };

  // ③ 通信（Fetch）: 画面が最初に表示されたタイミングで、1回だけバックエンドにリクエストを送る
  useEffect(() => {
    fetchItems();
  }, []);

  //増減命令をバックエンドに送信する関数
  const handleQunatityChange = async (itemId: number, quantity_change: number, actionType: string) => {
    try {
      const response = await fetch('http://localhost:3001/api/quantity_change', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: quantity_change,
          actionType: actionType
        }),
      });

      if (response.ok) {
        fetchItems();
      } else {
        alert('在庫の更新に失敗');
      }
    } catch (error) {
      console.error('通信エラー', error);
    }
  };


  // ④ 描画（マッピング）: Stateに入っている配列データをループ処理して、HTMLに変換する
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
      <h1 style={{ color: '#333', borderBottom: '2px solid #ddd', paddingBottom: '10px' }}>
        📦 オムニ在庫管理システム
      </h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap', marginTop: '20px' }}>
        {items.map((item) => (
          <div key={item.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '15px',
            borderRadius: '12px',
            width: '220px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>

            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '100%', height: '150px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                画像なし
              </div>
            )}

            <h3 style={{ margin: '15px 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p style={{ fontSize: '32px', fontWeight: 'bold', margin: '0', color: item.quantity <= item.minThreshold ? '#dc2626' : '#2563eb' }}>
                {item.quantity}
              </p>
              <span style={{ fontSize: '14px', color: '#6b7280' }}>個</span>
            </div>

            <p style={{ color: '#9ca3af', fontSize: '12px', marginTop: '5px' }}>
              ⚠️ しきい値: {item.minThreshold}
            </p>

            {/* 🌟 ③ ボタンの追加部分 */}
            <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
              <button
                onClick={() => handleQunatityChange(item.id, 1, 'RESTOCK')}
                style={{ flex: 1, padding: '8px', background: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                ＋1 補充
              </button>
              <button
                onClick={() => handleQunatityChange(item.id, -1, 'CONSUME')}
                style={{ flex: 1, padding: '8px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
              >
                －1 消費
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  )
}

export default App
