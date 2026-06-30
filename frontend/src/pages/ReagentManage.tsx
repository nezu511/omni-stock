import { useState, useEffect } from 'react';
import { API_BASE } from '../config';
import { useNavigate } from 'react-router-dom';
import { useLang } from '../contexts/LanguageContext';
import type { Reagent, ReagentRequest } from '../types';

type RequestWithReagent = ReagentRequest & { reagent: Reagent };

export default function ReagentManage() {
  const { i18n } = useLang();
  const t = i18n.reagentManage;
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RequestWithReagent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAll();
  }, []);

  async function fetchAll() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/reagents`);
      const reagents: Reagent[] = await res.json();
      // 全リクエストをフラットに展開し、reagent情報を付与
      const all: RequestWithReagent[] = reagents.flatMap((r) =>
        r.requests.map((req) => ({ ...req, reagent: r }))
      );
      // 新しい順に並べる
      all.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRequests(all);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function cancelRequest(id: number) {
    const res = await fetch(`${API_BASE}/api/reagent_requests/${id}`, { method: 'DELETE' });
    if (!res.ok) { alert(t.cancelFailed); return; }
    setRequests(prev => prev.filter(r => r.id !== id));
  }

  async function updateStatus(id: number, status: string, errorMsg: string) {
    const res = await fetch(`${API_BASE}/api/reagent_requests/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      alert(errorMsg);
      return;
    }
    const updated: RequestWithReagent = await res.json();
    setRequests((prev) =>
      prev.map((r) => (r.id === id ? { ...updated, reagent: r.reagent } : r))
    );
  }

  const requested = requests.filter((r) => r.status === 'REQUESTED');
  const ordered = requests.filter((r) => r.status === 'ORDERED');
  const arrived = requests.filter((r) => r.status === 'ARRIVED');

  function formatDate(iso: string) {
    return new Date(iso).toLocaleString();
  }

  const sectionTitle: React.CSSProperties = {
    fontSize: '16px',
    fontWeight: 'bold',
    margin: '0 0 12px',
    padding: '8px 12px',
    borderRadius: '6px',
  };

  function RequestCard({ req, actions }: { req: RequestWithReagent; actions: React.ReactNode }) {
    return (
      <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '12px 16px', backgroundColor: 'white', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '15px' }}>{req.reagent.name}</div>
            {req.reagent.englishName && (
              <div style={{ fontSize: '13px', color: '#6b7280' }}>{req.reagent.englishName}</div>
            )}
            {req.requestedBy && (
              <div style={{ fontSize: '13px', color: '#374151', marginTop: '4px' }}>
                {t.requestedBy} {req.requestedBy}
              </div>
            )}
            <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>
              {t.requestedAt} {formatDate(req.createdAt)}
            </div>
            {req.reagent.site_url && (
              <a
                href={req.reagent.site_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: '13px', color: '#3b82f6', display: 'block', marginTop: '4px' }}
              >
                {t.siteUrl} {req.reagent.site_url}
              </a>
            )}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flexShrink: 0, marginLeft: '12px' }}>
            {actions}
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <p style={{ color: '#6b7280' }}>{t.loading}</p>;
  }

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
        <h2 style={{ margin: 0 }}>{t.title}</h2>
        <button
          onClick={() => navigate('/reagents')}
          style={{ fontSize: '14px', color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          {t.requestLink}
        </button>
      </div>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>{t.subtitle}</p>

      {/* REQUESTED セクション */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ ...sectionTitle, backgroundColor: '#fef3c7', color: '#92400e' }}>
          {t.requestedSection} ({requested.length})
        </h3>
        {requested.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '0 4px' }}>{t.noRequested}</p>
        ) : (
          requested.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              actions={
                <>
                  <button
                    onClick={() => updateStatus(req.id, 'ORDERED', t.orderFailed)}
                    style={{ padding: '6px 14px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {t.orderButton}
                  </button>
                  <button
                    onClick={() => cancelRequest(req.id)}
                    style={{ padding: '6px 14px', backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {t.cancelButton}
                  </button>
                </>
              }
            />
          ))
        )}
      </div>

      {/* ORDERED セクション */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ ...sectionTitle, backgroundColor: '#dbeafe', color: '#1e40af' }}>
          {t.orderedSection} ({ordered.length})
        </h3>
        {ordered.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '0 4px' }}>{t.noOrdered}</p>
        ) : (
          ordered.map((req) => (
            <RequestCard
              key={req.id}
              req={req}
              actions={
                <>
                  <button
                    onClick={() => updateStatus(req.id, 'ARRIVED', t.arriveFailed)}
                    style={{ padding: '6px 14px', backgroundColor: '#10b981', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {t.arriveButton}
                  </button>
                  <button
                    onClick={() => cancelRequest(req.id)}
                    style={{ padding: '6px 14px', backgroundColor: 'white', color: '#6b7280', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', whiteSpace: 'nowrap' }}
                  >
                    {t.cancelButton}
                  </button>
                </>
              }
            />
          ))
        )}
      </div>

      {/* ARRIVED セクション */}
      <div style={{ marginBottom: '28px' }}>
        <h3 style={{ ...sectionTitle, backgroundColor: '#d1fae5', color: '#065f46' }}>
          {t.arrivedSection} ({arrived.length})
        </h3>
        {arrived.length === 0 ? (
          <p style={{ color: '#9ca3af', padding: '0 4px' }}>{t.noArrived}</p>
        ) : (
          arrived.map((req) => (
            <RequestCard key={req.id} req={req} actions={null} />
          ))
        )}
      </div>
    </div>
  );
}
