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

  // ③ 通信（Fetch）: 画面が最初に表示されたタイミングで、1回だけバックエンドにリクエストを送る
  useEffect(() => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())               // 返ってきた箱（Response）からJSONを取り出す
      .then((data) => setItems(data))          // 取り出したデータをState（メモリ）に保存する
      .catch((err) => console.error('エラー:', err));
  }, []);

  // ④ 描画（マッピング）: Stateに入っている配列データをループ処理して、HTMLに変換する
  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>オムニシステム</h1>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {/* items配列の中身を1つずつ取り出して、カード型のUIに変形 */}
        {items.map((item) => (
          <div key={item.id} style={{ border: '1px solid #ccc', padding: '15px', borderRadius: '8px', width: '200px' }}>

            {/* 画像URLがあれば表示する */}
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '150px', objectFit: 'cover' }} />
            ) : (
              <div style={{ width: '100%', height: '150px', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                画像なし
              </div>
            )}

            <h3>{item.name}</h3>
            <p style={{ fontSize: '24px', fontWeight: 'bold', margin: '10px 0' }}>
              残数: {item.quantity}
            </p>
            <p style={{ color: 'gray', fontSize: '12px' }}>
              しきい値: {item.minThreshold}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}

export default App
