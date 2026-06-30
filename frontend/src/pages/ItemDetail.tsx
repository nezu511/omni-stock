import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import type { Item } from '../types';
import { useLang } from '../contexts/LanguageContext';

const STATUS_COLORS = {
  NONE: { color: '#374151', bg: '#f3f4f6' },
  ORDERED: { color: '#92400e', bg: '#fef3c7' },
  ARRIVED: { color: '#059669', bg: '#ecfdf5' },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

type ItemFormData = Pick<Item, 'name' | 'englishName' | 'minThreshold' | 'unitPerBox' | 'keywords' | 'imageUrl' | 'orderUrl'>;

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useLang();

  const [item, setItem] = useState<Item | null>(null);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    englishName: '',
    minThreshold: 5,
    unitPerBox: 1,
    keywords: '',
    imageUrl: '',
    orderUrl: '',
  });

  const statusLabels = {
    NONE: { label: i18n.itemDetail.statuses.NONE, ...STATUS_COLORS.NONE },
    ORDERED: { label: i18n.itemDetail.statuses.ORDERED, ...STATUS_COLORS.ORDERED },
    ARRIVED: { label: i18n.itemDetail.statuses.ARRIVED, ...STATUS_COLORS.ARRIVED },
  };

  const fetchItem = () => {
    fetch(`http://localhost:3001/api/items/${id}`)
      .then((res) => res.json())
      .then((data: Item) => {
        setItem(data);
        setFormData({
          name: data.name,
          englishName: data.englishName ?? '',
          minThreshold: data.minThreshold,
          unitPerBox: data.unitPerBox ?? 1,
          keywords: data.keywords ?? '',
          imageUrl: data.imageUrl ?? '',
          orderUrl: data.orderUrl ?? '',
        });
      })
      .catch((err) => console.error('Error:', err));
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    const parsedValue = type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

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
      console.error('Image upload failed:', error);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`http://localhost:3001/api/items/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          englishName: formData.englishName || null,
        }),
      });

      if (response.ok) {
        alert(i18n.itemDetail.saveSuccess);
        fetchItem();
      } else {
        alert(i18n.itemDetail.saveFailed);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

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
        alert(i18n.itemDetail.statusUpdateFailed);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  if (!item) {
    return <p style={{ textAlign: 'center', color: '#6b7280' }}>{i18n.itemDetail.loading}</p>;
  }

  const currentStatus = statusLabels[item.orderStatus as StatusKey] ?? statusLabels.NONE;

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>{i18n.itemDetail.title}</h2>
        <button onClick={() => navigate('/manage')} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
          {i18n.itemDetail.backButton}
        </button>
      </div>

      <div style={{ display: 'flex', gap: '20px', marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{i18n.itemDetail.currentStock}</div>
          <div style={{ fontSize: '28px', fontWeight: 'bold', color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827' }}>
            {item.quantity}
          </div>
        </div>

        <div style={{ flex: 2 }}>
          <div style={{ fontSize: '14px', color: '#6b7280', marginBottom: '4px' }}>{i18n.itemDetail.statusLabel}</div>
          <div style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px', fontWeight: 'bold', color: currentStatus.color, backgroundColor: currentStatus.bg, marginBottom: '8px' }}>
            {currentStatus.label}
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            {(Object.keys(statusLabels) as StatusKey[]).map((status) => (
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
                {i18n.itemDetail.setToStatus(statusLabels[status].label)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.nameLabel} <span style={{ color: 'red' }}>*</span></label>
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
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.englishNameLabel}</label>
          <input
            type="text"
            name="englishName"
            value={formData.englishName ?? ''}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.thresholdLabel}</label>
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
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.unitPerBoxLabel}</label>
          <input
            type="number"
            name="unitPerBox"
            min="1"
            value={formData.unitPerBox}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.keywordsLabel}</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords ?? ''}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.urlLabel}</label>
          <input
            type="text"
            name="orderUrl"
            value={formData.orderUrl ?? ''}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.imageLabel}</label>
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
          {i18n.itemDetail.saveButton}
        </button>

      </form>

      <div style={{ marginTop: '20px', backgroundColor: 'white', padding: '20px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <h3 style={{ marginTop: 0, color: '#374151' }}>{i18n.itemDetail.historyTitle}</h3>
        {item.histories && item.histories.length > 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {item.histories.map((history) => (
              <div key={history.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <span style={{ color: '#6b7280' }}>{new Date(history.timestamp).toLocaleString('ja-JP')}</span>
                <span style={{ color: '#374151', fontWeight: 'bold' }}>{i18n.itemDetail.actions[history.actionType] ?? history.actionType}</span>
                <span style={{ color: history.amountChange > 0 ? '#059669' : history.amountChange < 0 ? '#dc2626' : '#9ca3af' }}>
                  {history.amountChange > 0 ? `+${history.amountChange}` : history.amountChange}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>{i18n.itemDetail.noHistory}</p>
        )}
      </div>

    </div>
  );
}
