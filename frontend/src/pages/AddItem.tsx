import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// 1. 前回完璧に設計した「完全な構造体」の型定義
interface ItemFormData {
  name: string;
  quantity: number;
  minThreshold: number;
  imageUrl: string;
}

export default function AddItem() {
  const navigate = useNavigate();

  // 2. デフォルト値をすべて埋めた、万能の辞書型State
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    quantity: 1,
    minThreshold: 5,
    imageUrl: '',
  });

  // 🌟 万能のメモリ更新関数（テキスト＆数字入力の割り込みハンドラ）
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // どの入力欄（name）に、どんな値（value）が、何の型（type）で打ち込まれたかを取得
    const { name, value, type } = e.target;

    // HTMLの入力はすべて「文字列」になってしまうため、number型の場合は数値にキャストする
    const parsedValue = type === 'number' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      // 👈 [name] にすることで、「name欄」なら name が、「quantity欄」なら quantity が動的に上書きされる！
      [name]: parsedValue,
    }));
  };

  // 🌟 画像アップロード処理（ファイル選択時の割り込みハンドラ）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 画像ファイルをFormDataという特殊なカプセルに入れる
    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      // Step.1: まず別サーバー（Express）に画像だけを投げて保存させる
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();

      // Step.2: 返ってきたURLを formData の imageUrl の場所だけに上書き記録する
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      console.error('画像アップロード失敗:', error);
    }
  };

  // 🌟 最終的なデータ送信処理（確定ボタン）
  const handleSubmit = async (e: React.FormEvent) => {
    // ⚠️ 超重要: ブラウザが持っている「フォーム送信時に画面をリロードする」という古い仕様をブロックする
    e.preventDefault();

    try {
      // 辞書データ（formData）をそのままJSONにして丸投げ！
      const response = await fetch('http://localhost:3001/api/items', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('アイテムを登録しました！');
        navigate('/manage'); // 成功したら管理画面トップへ自動で戻る
      } else {
        alert('登録に失敗しました。');
      }
    } catch (error) {
      console.error('通信エラー:', error);
    }
  };

  // ==============================================
  // 画面の設計図（HTML）
  // ==============================================
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

      {/* ヘッダー部分 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>✨ 新規アイテム追加</h2>
        <button onClick={() => navigate('/manage')} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
          ← 戻る
        </button>
      </div>

      {/* <form> タグで囲み、onSubmit に関数をセットすることで、
        「Enterキーを押した時」にも自動で handleSubmit が発火するようになります。
      */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* 1. アイテム名入力 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>アイテム名 <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            name="name" // 👈 この name="name" が、handleChange の [name] と合体します
            value={formData.name}
            onChange={handleChange}
            required
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        {/* 2. 数量と閾値（横並びレイアウト） */}
        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            <label style={{ fontWeight: 'bold', color: '#4b5563' }}>初期在庫数</label>
            <input
              type="number"
              name="quantity" // 👈 ここも State のキーと完全に一致させる
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            <label style={{ fontWeight: 'bold', color: '#4b5563' }}>警告アラートのしきい値</label>
            <input
              type="number"
              name="minThreshold" // 👈 ここも一致させる
              min="0"
              value={formData.minThreshold}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>
        </div>

        {/* 3. 画像アップロード機能 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>アイテム画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white' }}
          />
          {/* 画像がアップロードされて State に URL が入ったら、即座にプレビューを表示！ */}
          {formData.imageUrl && (
            <div style={{ marginTop: '10px' }}>
              <img src={formData.imageUrl} alt="Preview" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
            </div>
          )}
        </div>

        {/* 4. 確定・送信ボタン */}
        <button
          type="submit"
          disabled={!formData.name} // 名前が空っぽの時はボタンを押せないようにするガード
          style={{
            marginTop: '10px',
            padding: '15px',
            backgroundColor: formData.name ? '#2563eb' : '#9ca3af',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '18px',
            fontWeight: 'bold',
            cursor: formData.name ? 'pointer' : 'not-allowed',
            transition: 'background 0.2s'
          }}
        >
          データベースに登録
        </button>

      </form>
    </div>
  );
}
