import { useState } from 'react';
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';

type ItemFormData = {
  name: string;
  englishName: string;
  quantity: number;
  imageUrl: string;
  minThreshold: number;
  unitPerBox: number;
  keywords: string;
  orderUrl: string;
};

export default function AddItem() {
  const navigate = useNavigate();
  const { i18n } = useLang();

  const [formData, setFormData] = useState<ItemFormData>({
    name: '',
    englishName: '',
    quantity: 1,
    imageUrl: '',
    minThreshold: 5,
    unitPerBox: 1,
    keywords: '',
    orderUrl: '',
  });

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
      const response = await fetch(`${API_BASE}/api/upload`, {
        method: 'POST',
        body: uploadData,
      });
      const data = await response.json();
      setFormData((prev) => ({ ...prev, imageUrl: data.imageUrl }));
    } catch (error) {
      console.error('Image upload failed:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const response = await fetch(`${API_BASE}/api/items`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          englishName: formData.englishName || null,
        }),
      });

      if (response.ok) {
        alert(i18n.addItem.successMessage);
        navigate('/manage');
      } else {
        alert(i18n.addItem.failMessage);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px' }}>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>{i18n.addItem.title}</h2>
        <button onClick={() => navigate('/manage')} style={{ padding: '8px 16px', background: '#f3f4f6', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer' }}>
          {i18n.addItem.backButton}
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.nameLabel} <span style={{ color: 'red' }}>*</span></label>
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
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.englishNameLabel}</label>
          <input
            type="text"
            name="englishName"
            value={formData.englishName}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', gap: '20px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.quantityLabel}</label>
            <input
              type="number"
              name="quantity"
              min="0"
              value={formData.quantity}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', flex: 1 }}>
            <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.thresholdLabel}</label>
            <input
              type="number"
              name="minThreshold"
              min="0"
              value={formData.minThreshold}
              onChange={handleChange}
              style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
            />
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.unitPerBoxLabel}</label>
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
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.keywordsLabel}</label>
          <input
            type="text"
            name="keywords"
            value={formData.keywords}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.urlLabel}</label>
          <input
            type="text"
            name="orderUrl"
            value={formData.orderUrl}
            onChange={handleChange}
            style={{ padding: '10px', border: '1px solid #d1d5db', borderRadius: '6px', fontSize: '16px' }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ fontWeight: 'bold', color: '#4b5563' }}>{i18n.addItem.imageLabel}</label>
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
          {i18n.addItem.submitButton}
        </button>

      </form>
    </div>
  );
}
