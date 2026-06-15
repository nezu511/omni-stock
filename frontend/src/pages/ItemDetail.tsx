import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Item } from '../types';

// 注文ステータスの表示用ラベルと色
const STATUS_LABELS: { [key: string]: { label: string; color: string; bg: string } } = {
  NONE: { label: 'None', color: '#374151', bg: '#f3f4f6' },
  ORDERED: { label: '注文済み', color: '#92400e', bg: '#fef3c7' },
  ARRIVED: { label: '入荷済み（未確認）', color: '#059669', bg: '#ecfdf5' },
};

// 履歴の actionType を日本語ラベルに変換
const ACTION_LABELS: { [key: string]: string } = {
  CREATE: '作成',
  QUANTITY_UPDATE: '数量変更',
  CONSUME: '使用',
  RESTOCK: '入荷',
  ORDERED: '注文済みに変更',
  ARRIVED: '入荷済みに変更',
  NONE: 'Noneに変更',
};

type ItemFormData = Pick<Item, 'name' | 'minThreshold' | 'keywords' | 'imageUrl' | 'orderUrl'>;

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [item, setItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    minThreshold: 5,
    keywords: '',
    imageUrl: '',
    orderUrl: '',
  });

  const fetchItem = () => {
    fetch(`http://localhost:3001/api/items/${id}`)
      .then((res) => res.json())
      .then((data: Item) => {
        setItem(data);
        setFormData({
          name: data.name,
          minThreshold: data.minThreshold,
          keywords: data.keywords ?? '',
          imageUrl: data.imageUrl ?? '',
          orderUrl: data.orderUrl ?? '',
        });
      })
      .catch((err) => console.error('エラー:', err));
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 万能の入力フォーム更新関数（AddItem.tsxと同じパターン）
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? Number(value) : value;

    setFormData((prev) => ({
      ...prev,
      [name]: parsedValue,
    }));
  };

  // 画像アップロード処理（AddItem.tsxと同じパターン）
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await fetch('http://localhost:3001/api/upload', {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      console.error('画像アップロード失敗:', error);
    }
  };

  // 編集内容の保存
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:3001/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert('保存しました');
        fetchItem();
      } else {
        alert('保存に失敗しました');
      }
    } catch (error) {
      console.error('通信エラー:', error);
    }
  };

  // 注文ステータスの変更（Home.tsxと同じ呼び出し方）
  const handleChangeStatus = async (orderStatus: string) => {
    try {
      const res = await fetch('http://localhost:3001/api/change_status', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: Number(id), orderStatus }),
      });
      if (res.ok) {
        fetchItem();
      } else {
        alert('ステータスの更新に失敗しました');
      }
    } catch (err) {
      console.error('エラー:', err);
    }
  };

  if (!item) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>読み込み中...</p>;
  }

  const currentStatus = STATUS_LABELS[item.orderStatus] ?? STATUS_LABELS.NONE;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

      {/* ヘッダー部分 */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>📝 アイテム詳細・編集</h2>
        <button onClick={() => navigate('/manage')} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
          ← 管理画面に戻る
        </button>
      </div>

      {/* 現在庫・注文ステータス */}
      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>現在庫</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827' }}>
            {item.quantity}
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>注文ステータス</div>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', color: currentStatus.color, backgroundColor: currentStatus.bg, marginBottom: '8px' }}>
            {currentStatus.label}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {Object.keys(STATUS_LABELS).map((status) => (
              <button
                key={status}
                onClick={() => handleChangeStatus(status)}
                disabled={item.orderStatus === status}
                style={{
                  padding: '6px 10px',
                  fontSize: '13px',
                  borderRadius: '6px',
                  border: '1px solid #d1d5db',
                  cursor: item.orderStatus === status ? 'default' : 'pointer',
                  backgroundColor: item.orderStatus === status ? '#e5e7eb' : 'white',
                  color: '#374151',
                }}
              >
                {STATUS_LABELS[status].label}にする
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 編集フォーム */}
      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>アイテム名 <span style={{ color: 'red' }}>*</span></label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            required
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>警告アラートのしきい値</label>
          <input
            type="number"
            name="minThreshold"
            min="0"
            value={formData.minThreshold}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>キーワード</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords ?? ''}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>商品購入用URL</label>
          <input
            type="text"
            name="orderUrl"
            value={formData.orderUrl ?? ''}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>アイテム画像</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white' }}
          />
          {formData.imageUrl && (
            <div style={{ marginTop: '10px' }}>
              <img src={formData.imageUrl} alt="Preview" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
            </div>
          )}
        </div>

        <button
          type="submit"
          disabled={!formData.name}
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
          保存する
        </button>

      </form>

      {/* 履歴一覧 */}
      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, color: '#374151' }}>📜 履歴</h3>
        {item.histories && item.histories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {item.histories.map((history) => (
              <div key={history.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>{new Date(history.timestamp).toLocaleString('ja-JP')}</span>
                <span style={{ color: '#374151', fontWeight: 'bold' }}>{ACTION_LABELS[history.actionType] ?? history.actionType}</span>
                <span style={{ color: history.amountChange > 0 ? '#059669' : history.amountChange < 0 ? '#dc2626' : '#9ca3af' }}>
                  {history.amountChange > 0 ? `+${history.amountChange}` : history.amountChange}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>履歴はありません。</p>
        )}
      </div>

    </div>
  );
}
