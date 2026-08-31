import { useEffect, useState } from 'react';
import { apiFetch } from '../config';
import { useLang } from '../contexts/LanguageContext';
import type { Item } from '../types';

interface AuditConfirmModalProps {
  itemId: number;
  itemName: string;
  currentQuantity: number;
  onClose: () => void;
  onUpdated: (updated: Item) => void;
}

export default function AuditConfirmModal({ itemId, itemName, currentQuantity, onClose, onUpdated }: AuditConfirmModalProps) {
  const { i18n } = useLang();
  const t = i18n.auditConfirm;
  const [value, setValue] = useState<number>(currentQuantity);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function handleSubmit() {
    const delta = value - currentQuantity;
    setSubmitting(true);
    try {
      const res = await apiFetch('/api/quantity_change', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemId,
          quantity_change: delta,
          actionType: delta === 0 ? 'AUDIT_CONFIRMED' : 'AUDIT_CORRECTED',
        }),
      });
      if (!res.ok) {
        alert(t.updateFailed);
        return;
      }
      const updated: Item = await res.json();
      onUpdated(updated);
      onClose();
    } catch {
      alert(t.updateFailed);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      onClick={onClose}
      style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{ backgroundColor: 'white', borderRadius: '12px', padding: '24px', maxWidth: '360px', width: '90%', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}
      >
        <h3 style={{ margin: '0 0 8px', fontSize: '18px', color: '#111827' }}>{t.title}</h3>
        <p style={{ margin: '0 0 6px', fontWeight: 'bold', color: '#374151' }}>{itemName}</p>
        <p style={{ margin: '0 0 16px', fontSize: '13px', color: '#6b7280' }}>{t.description}</p>

        <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: 'bold', color: '#374151' }}>{t.inputLabel}</label>
        <input
          type="number"
          min="0"
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          autoFocus
          style={{ display: 'block', width: '100%', padding: '10px 12px', border: '1px solid #d1d5db', borderRadius: '8px', fontSize: '18px', fontWeight: 'bold', boxSizing: 'border-box', marginBottom: '20px' }}
        />

        <button
          onClick={handleSubmit}
          disabled={submitting}
          style={{ width: '100%', padding: '10px', backgroundColor: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold', cursor: submitting ? 'default' : 'pointer', marginBottom: '8px' }}
        >
          {t.confirmButton}
        </button>
        <button
          onClick={onClose}
          disabled={submitting}
          style={{ width: '100%', padding: '10px', backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '8px', cursor: submitting ? 'default' : 'pointer' }}
        >
          {t.skipButton}
        </button>
      </div>
    </div>
  );
}
