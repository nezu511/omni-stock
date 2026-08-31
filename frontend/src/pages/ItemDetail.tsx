import { useEffect, useState } from 'react';
import { apiFetch, resolveImageUrl } from '../config';
import { useNavigate, useParams } from 'react-router-dom';
import type { Item } from '../types';
import { useLang } from '../contexts/LanguageContext';
import { estimateDailyConsumptionRate, estimateDaysUntilEmpty, estimateLeadTimeDays } from '../utils/predictInventory';

const STATUS_COLORS = {
  NONE: { color: '#374151', bg: '#f3f4f6' },
  REQUESTED: { color: '#1d4ed8', bg: '#eff6ff' },
  ORDERED: { color: '#92400e', bg: '#fef3c7' },
  ARRIVED: { color: '#059669', bg: '#ecfdf5' },
} as const;

type StatusKey = keyof typeof STATUS_COLORS;

type ItemFormData = Pick<Item, 'name' | 'englishName' | 'minThreshold' | 'unitPerBox' | 'keywords' | 'imageUrl' | 'orderUrl' | 'auditEnabled'>;

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { i18n } = useLang();

  const [item, setItem] = useState<Item | null>(null);
  const [quantityDraft, setQuantityDraft] = useState<number>(0);
  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    englishName: '',
    minThreshold: 5,
    unitPerBox: 1,
    keywords: '',
    imageUrl: '',
    orderUrl: '',
    auditEnabled: false,
  });

  const statusLabels = {
    NONE: { label: i18n.itemDetail.statuses.NONE, ...STATUS_COLORS.NONE },
    REQUESTED: { label: i18n.itemDetail.statuses.REQUESTED, ...STATUS_COLORS.REQUESTED },
    ORDERED: { label: i18n.itemDetail.statuses.ORDERED, ...STATUS_COLORS.ORDERED },
    ARRIVED: { label: i18n.itemDetail.statuses.ARRIVED, ...STATUS_COLORS.ARRIVED },
  };

  const fetchItem = () => {
    apiFetch(`/api/items/${id}`)
      .then((res) => res.json())
      .then((data: Item) => {
        setItem(data);
        setQuantityDraft(data.quantity);
        setFormData({
          name: data.name,
          englishName: data.englishName ?? '',
          minThreshold: data.minThreshold,
          unitPerBox: data.unitPerBox ?? 1,
          keywords: data.keywords ?? '',
          imageUrl: data.imageUrl ?? '',
          orderUrl: data.orderUrl ?? '',
          auditEnabled: data.auditEnabled ?? false,
        });
      })
      .catch((err) => console.error('Error:', err));
  };

  useEffect(() => {
    fetchItem();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    const parsedValue = type === 'checkbox' ? checked : type === 'number' ? Number(value) : value;
    setFormData((prev) => ({ ...prev, [name]: parsedValue }));
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const uploadData = new FormData();
    uploadData.append('image', file);

    try {
      const response = await apiFetch(`/api/upload`, {
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
      const response = await apiFetch(`/api/items/${id}`, {
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

  const handleQuantitySave = async () => {
    if (!item) return;
    const delta = quantityDraft - item.quantity;
    if (delta === 0) return;

    try {
      const res = await apiFetch(`/api/quantity_change`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId: Number(id),
          quantity_change: delta,
          actionType: 'QUANTITY_UPDATE',
        }),
      });
      if (res.ok) {
        alert(i18n.itemDetail.quantityUpdateSuccess);
        fetchItem();
      } else {
        alert(i18n.itemDetail.quantityUpdateFailed);
      }
    } catch (err) {
      console.error('Error:', err);
    }
  };

  const handleChangeStatus = async (orderStatus: string) => {
    try {
      const res = await apiFetch(`/api/change_status`, {
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

  const histories = item.histories ?? [];
  const consumptionRate = estimateDailyConsumptionRate(histories);
  const daysUntilEmpty = estimateDaysUntilEmpty(item.quantity, histories);
  const leadTime = estimateLeadTimeDays(histories);

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
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
              type="number"
              min="0"
              value={quantityDraft}
              onChange={(e) => setQuantityDraft(Number(e.target.value))}
              style={{
                width: '90px',
                fontSize: '28px',
                fontWeight: 'bold',
                color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                padding: '2px 6px',
              }}
            />
            <button
              onClick={handleQuantitySave}
              disabled={quantityDraft === item.quantity}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #d1d5db',
                backgroundColor: quantityDraft === item.quantity ? '#e5e7eb' : '#2563eb',
                color: quantityDraft === item.quantity ? '#9ca3af' : 'white',
                fontWeight: 'bold',
                cursor: quantityDraft === item.quantity ? 'default' : 'pointer',
              }}
            >
              {i18n.itemDetail.quantityUpdateButton}
            </button>
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

      <div style={{ marginBottom: '20px', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
        <div style={{ fontSize: '14px', fontWeight: 'bold', color: '#374151', marginBottom: '8px' }}>{i18n.itemDetail.predictionTitle}</div>
        <div style={{ fontSize: '14px', color: '#4b5563', lineHeight: 1.8 }}>
          <div>
            {consumptionRate !== null && daysUntilEmpty !== null
              ? `${i18n.itemDetail.consumptionRateLabel(consumptionRate.toFixed(1))} ／ ${i18n.itemDetail.daysUntilEmptyLabel(daysUntilEmpty.toFixed(0))}`
              : i18n.itemDetail.predictionInsufficientData}
          </div>
          <div>
            {leadTime !== null
              ? i18n.itemDetail.leadTimeLabel(leadTime.avgDays.toFixed(1), leadTime.sampleCount)
              : i18n.itemDetail.predictionInsufficientData}
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

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <input
            type="checkbox"
            id="auditEnabled"
            name="auditEnabled"
            checked={formData.auditEnabled}
            onChange={handleChange}
            style={{ width: '16px', height: '16px' }}
          />
          <label htmlFor="auditEnabled" style={{ fontWeight: 'bold', color: '#4b5563', cursor: 'pointer' }}>{i18n.itemDetail.auditEnabledLabel}</label>
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', position: 'relative' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.itemDetail.imageLabel}</label>
          {formData.imageUrl && (
            <button
              type="button"
              onClick={() => setFormData((prev) => ({ ...prev, imageUrl: '' }))}
              style={{ position: 'absolute', top: 0, right: 0, padding: '4px 10px', fontSize: '12px', backgroundColor: 'white', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '6px', cursor: 'pointer' }}
            >
              {i18n.itemDetail.removeImageButton}
            </button>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', background: 'white' }}
          />
          {formData.imageUrl && (
            <div style={{ marginTop: '10px' }}>
              <img src={resolveImageUrl(formData.imageUrl) ?? undefined} alt="Preview" style={{ height: '150px', borderRadius: '8px', objectFit: 'cover', border: '1px solid #e5e7eb' }} />
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
            {(() => {
              const latestQtyHistId = [...(item.histories ?? [])]
                .filter(h => h.amountChange !== 0)
                .sort((a, b) => b.id - a.id)[0]?.id;
              return item.histories!.map((history) => (
              <div key={history.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', borderBottom: '1px solid #f3f4f6', fontSize: '14px' }}>
                <span style={{ color: '#6b7280', flexShrink: 0 }}>{new Date(history.timestamp).toLocaleString('ja-JP')}</span>
                <span style={{ color: '#374151', fontWeight: 'bold', margin: '0 8px' }}>{i18n.itemDetail.actions[history.actionType] ?? history.actionType}</span>
                <span style={{ color: history.amountChange > 0 ? '#059669' : history.amountChange < 0 ? '#dc2626' : '#9ca3af', marginRight: 'auto' }}>
                  {history.amountChange > 0 ? `+${history.amountChange}` : history.amountChange}
                </span>
                {history.id === latestQtyHistId && (
                  <button
                    onClick={async () => {
                      if (!window.confirm(i18n.itemDetail.undoConfirm)) return;
                      const res = await apiFetch(`/api/history/${history.id}`, { method: 'DELETE' });
                      if (!res.ok) {
                        alert(i18n.itemDetail.undoFailed);
                        return;
                      }
                      const updated = await res.json();
                      setItem(updated);
                      setQuantityDraft(updated.quantity);
                      setFormData({
                        name: updated.name,
                        englishName: updated.englishName ?? '',
                        minThreshold: updated.minThreshold,
                        unitPerBox: updated.unitPerBox ?? 1,
                        keywords: updated.keywords ?? '',
                        imageUrl: updated.imageUrl ?? '',
                        orderUrl: updated.orderUrl ?? '',
                        auditEnabled: updated.auditEnabled ?? false,
                      });
                    }}
                    style={{ flexShrink: 0, padding: '3px 10px', fontSize: '12px', backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}
                  >
                    {i18n.itemDetail.undoButton}
                  </button>
                )}
              </div>
              ));
            })()}
          </div>
        ) : (
          <p style={{ color: '#6b7280' }}>{i18n.itemDetail.noHistory}</p>
        )}
      </div>

    </div>
  );
}
