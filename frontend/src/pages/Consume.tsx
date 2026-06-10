import { useEffect, useState } from 'react';

// アイテムの型定義
interface Item {
  id: number;
  name: string;
  quantity: number;
  minThreshold: number;
  imageUrl: string | null;
}

export default function Consume() {
  //useState：監視の登録(Reactへの依頼)
  //<Item[]> : 型の指定，Stateの中に入れうデータを教えている．Itemが複数集まった配列．
  //([]):これがuseState関数の引数．初期値．つまり，中身が空っぽの配列[]から始まる．
  //useStateの関数は戻り値が，２つの要素が入った配列
  //0番目：現在のデータの中身（変数）
  //1番目：データを書き換えるための専用スイッチ（関数)
  const [items, setItems] = useState<Item[]>([]);

  // 新機能：各アイテムの「入力フォームの数字」を個別に記憶するメモリ
  // {}は辞書型
  // keyは[key: number]で絵遅疑しており，任意の数字が
  const [inputValues, setInputValues] = useState<{ [key: number]: number | '' }>({});

  // データの取得
  const fetchItems = () => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('エラー:', err));
  };

  useEffect(fetchItems, []);

  // 🌟 在庫を減らす通信処理（消費なのでマイナスにして送る）
  const handleConsume = async (itemId: number, consumeAmount: number) => {
    if (consumeAmount <= 0) return; // 0やマイナスの入力は無視する

    try {
      const response = await fetch('http://localhost:3001/api/quantity_change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: itemId,
          quantity_change: -consumeAmount, // 👈 ここでマイナスに反転させて送信！
          actionType: 'CONSUME',
        }),
      });

      if (response.ok) {
        fetchItems(); // 成功したら一覧を再取得
        // 入力フォームの数字を空っぽにリセットする
        setInputValues((prev) => ({ ...prev, [itemId]: '' }));
      } else {
        alert('在庫の更新に失敗しました');
      }
    } catch (error) {
      console.error('通信エラー:', error);
    }
  };

  return (
    <div>
      <h2 style={{ color: '#dc2626', borderBottom: '2px solid #fca5a5', paddingBottom: '10px' }}>
        📤 物品の使用（消費）
      </h2>
      <p style={{ color: '#6b7280', marginBottom: '20px' }}>使用した分だけ在庫からマイナスします。</p>

      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        {items.map((item) => (
          <div key={item.id} style={{
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            padding: '15px',
            borderRadius: '12px',
            width: '240px',
            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
          }}>

            {/* 画像エリア */}
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} style={{ width: '100%', height: '140px', objectFit: 'cover', borderRadius: '8px' }} />
            ) : (
              <div style={{ width: '100%', height: '140px', backgroundColor: '#f3f4f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                画像なし
              </div>
            )}

            <h3 style={{ margin: '12px 0 5px 0', fontSize: '18px', color: '#1f2937' }}>{item.name}</h3>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
              <p style={{ fontSize: '28px', fontWeight: 'bold', margin: '0', color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827' }}>
                残: {item.quantity}
              </p>
            </div>

            <hr style={{ border: 'none', borderTop: '1px dashed #e5e7eb', margin: '15px 0' }} />

            {/* 🌟 1個だけ使う時のクイックボタン */}
            <button
              onClick={() => handleConsume(item.id, 1)}
              style={{ width: '100%', padding: '10px', background: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', marginBottom: '10px', transition: 'background 0.2s' }}
            >
              -1 ボタン
            </button>

            {/* 🌟 まとめて使う時の入力フォーム */}
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
                onClick={() => handleConsume(item.id, inputValues[item.id] as number)}
                disabled={!inputValues[item.id]} // 入力されていない時はボタンを無効化
                style={{ padding: '8px 12px', background: inputValues[item.id] ? '#dc2626' : '#d1d5db', color: 'white', border: 'none', borderRadius: '6px', cursor: inputValues[item.id] ? 'pointer' : 'not-allowed', fontWeight: 'bold' }}
              >
                使用
              </button>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
}
