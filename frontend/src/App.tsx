import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Consume from './pages/Consume';
import Restock from './pages/Restock';
import Manage from './pages/Manage';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import ReagentRequest from './pages/ReagentRequest';
import ReagentManage from './pages/ReagentManage';
import { LanguageProvider, useLang } from './contexts/LanguageContext';
import { useNotifications } from './hooks/useNotifications';

function NavBar() {
  const { i18n, toggleLanguage } = useLang();
  const { permission, requestPermission } = useNotifications();

  const bellLabel =
    permission === 'granted'  ? '🔔' :
    permission === 'denied'   ? '🔕' :
    permission === 'unsupported' ? null : '🔔?';

  const bellTitle =
    permission === 'granted'     ? (i18n.nav.notifyGranted ?? 'Notifications enabled') :
    permission === 'denied'      ? (i18n.nav.notifyDenied  ?? 'Notifications blocked — enable in browser settings') :
    permission === 'unsupported' ? '' :
                                   (i18n.nav.notifyRequest ?? 'Click to enable notifications');

  return (
    <nav style={{ backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#111827' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>📦 Omni-Stock</h1>
      </Link>
      <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto', alignItems: 'center' }}>
        <Link to="/consume" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.consume}</Link>
        <Link to="/restock" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.restock}</Link>
        <Link to="/reagents" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.reagent}</Link>
        <Link to="/manage" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.manage}</Link>

        {/* 通知ベルボタン — permission === 'unsupported' のときは非表示（iOS Safari 等） */}
        {bellLabel && (
          <button
            onClick={permission === 'granted' || permission === 'denied' ? undefined : requestPermission}
            title={bellTitle}
            style={{
              fontSize: '18px',
              background: 'none',
              border: 'none',
              cursor: permission === 'granted' || permission === 'denied' ? 'default' : 'pointer',
              padding: '2px 4px',
              opacity: permission === 'denied' ? 0.4 : 1,
            }}
          >
            {bellLabel}
          </button>
        )}

        <button
          onClick={toggleLanguage}
          style={{ padding: '6px 14px', fontSize: '14px', backgroundColor: '#f3f4f6', color: '#374151', border: '1px solid #d1d5db', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}
        >
          {i18n.nav.langToggle}
        </button>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <LanguageProvider>
        <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>
          <NavBar />
          <div style={{ padding: '20px' }}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/consume" element={<Consume />} />
              <Route path="/restock" element={<Restock />} />
              <Route path="/manage" element={<Manage />} />
              <Route path="/manage/new" element={<AddItem />} />
              <Route path="/manage/:id" element={<ItemDetail />} />
              <Route path="/reagents" element={<ReagentRequest />} />
              <Route path="/reagents/manage" element={<ReagentManage />} />
            </Routes>
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
