import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Item } from '../types';
import { matchesSearchQuery } from '../utils/searchItems';
import { useLang } from '../contexts/LanguageContext';

export default function Admin() {
  const { i18n } = useLang();
  const [items, setItems] = useState<Item[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const navigate = useNavigate();

  const fetchItems = () => {
    fetch('http://localhost:3001/api/items')
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error('Error:', err));
  };

  useEffect(() => {
    fetchItems();
  }, []);

  const handleDelete = async (id: number, name: string) => {
    const isConfirmed = window.confirm(i18n.manage.deleteConfirm(name));

    if (!isConfirmed) return;
    try {
      const response = await fetch(`http://localhost:3001/api/items/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert(i18n.manage.deleteSuccess);
        fetchItems();
      } else {
        alert(i18n.manage.deleteFailed);
      }
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const filteredItems = items.filter((item) => matchesSearchQuery(item, searchQuery));

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #9ca3af', paddingBottom: '10px', marginBottom: '20px' }}>
        <h2 style={{ color: '#374151', margin: 0 }}>{i18n.manage.title}</h2>

        <input
          type="text"
          placeholder={i18n.manage.searchPlaceholder}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ flex: 1, padding: '12px', fontSize: '16px', border: '1px solid #d1d5db', borderRadius: '8px', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)', margin: '0 16px' }}
        />

        <button
          onClick={() => navigate('/manage/new')}
          style={{ padding: '10px 20px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
        >
          {i18n.manage.addButton}
        </button>
      </div>

      <div style={{ overflowX: 'auto', backgroundColor: 'white', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>

        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>

          <thead style={{ backgroundColor: '#f3f4f6', borderBottom: '2px solid #d1d5db' }}>
            <tr>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>{i18n.manage.colId}</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>{i18n.manage.colName}</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>{i18n.manage.colStock}</th>
              <th style={{ padding: '12px 16px', color: '#4b5563' }}>{i18n.manage.colThreshold}</th>
              <th style={{ padding: '12px 16px', color: '#4b5563', textAlign: 'center' }}>{i18n.manage.colAction}</th>
            </tr>
          </thead>

          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} style={{ borderBottom: '1px solid #e5e7eb' }}>
                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.id}</td>
                <td style={{ padding: '12px 16px', fontWeight: 'bold', color: '#111827' }}>{item.name}</td>

                <td style={{ padding: '12px 16px' }}>
                  <span style={{
                    color: item.quantity <= item.minThreshold ? '#dc2626' : '#111827',
                    fontWeight: item.quantity <= item.minThreshold ? 'bold' : 'normal'
                  }}>
                    {item.quantity}
                  </span>
                </td>

                <td style={{ padding: '12px 16px', color: '#6b7280' }}>{item.minThreshold}</td>

                <td style={{ padding: '12px 16px', textAlign: 'center' }}>
                  <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                    <button
                      onClick={() => navigate(`/manage/${item.id}`)}
                      style={{ padding: '6px 12px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '4px', cursor: 'pointer' }}>
                      {i18n.manage.editButton}
                    </button>

                    <button
                      onClick={() => handleDelete(item.id, item.name)}
                      style={{ padding: '6px 12px', backgroundColor: '#fef2f2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: '4px', cursor: 'pointer' }}>
                      {i18n.manage.deleteButton}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>

        </table>
      </div>
    </div>
  );
}
