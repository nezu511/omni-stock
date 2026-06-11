import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

// アイテムの型定義（今回は表示用なのでシンプルに）
interface Item {
  id: number;
  name: string;
  quantity: number;
  minThreshold: number;
}

export default function Admin() {
  const [items, setItems] = useState<Item[]>([]);
  // 検索バーに入力された文字を記憶するState
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate(); //遷移用の関数ポインタを取得

  // データ取得（今までと全く同じロジック）
  const fetchItems = () => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('エラー:', err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  // 検索ロジック：itemsの配列から、名前に検索ワードが含まれるものだけを抽出する
  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div>
      {/* 🌟 1. ヘッダーエリア（タイトル ＋ 新規追加ボタン） */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>⚙️ 管理画面（アイテム一覧）</h2>

        <input
          type="text"
          placeholder="🔍 アイテム名で検索..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' }}
        />

        <button
          onClick={() => navigate('/manage/new')}
          style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          ＋ 新規アイテム追加
        </button>
      </div>

      {/* 🌟 2. データテーブル（表）エリア */}
      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>

          {/* 2-1. 表のヘッダー（列の名前） */}
          <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>ID</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>アイテム名</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>現在在庫</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>しきい値</th>
              <th style={{ padding: '12px 16px', color: '#4b5563', textAlign: 'center' }}>操作</th>
            </tr>
          </thead>

          {/* 2-2. 表のボディ（実際のデータ） */}
          <tbody>
            {filteredItems.map((item) => (
              // itemsの数だけ、この <tr>（1行分）を増殖させる
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#111827' }}>{item.name}</td>

                {/* 🌟 しきい値判定：危険なら赤文字にする */}
                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827',
                    fontWeight: item.quantity <= item.minThreshold ? 'bold' : 'normal'
                  }}>
                    {item.quantity}
                  </span>
                </td>

                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.minThreshold}</td>

                {/* 🌟 編集ページへの導線ボタン */}
                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <button
                    onClick={() => alert(`ID: ${item.id} の「詳細・編集ページ」へ遷移します！`)}
                    style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer', transition: 'background 0.2s' }}
                  >
                    📝 詳細・編集
                  </button>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
