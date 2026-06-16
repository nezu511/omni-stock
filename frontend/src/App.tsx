import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Consume from './pages/Consume';
import Restock from './pages/Restock';
import Manage from './pages/Manage';
import AddItem from './pages/AddItem';
import ItemDetail from './pages/ItemDetail';
import { LanguageProvider, useLang } from './contexts/LanguageContext';

function NavBar() {
  const { i18n, toggleLanguage } = useLang();
  return (
    <nav style={{ backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '20px' }}>
      <Link to="/" style={{ textDecoration: 'none', color: '#111827' }}>
        <h1 style={{ margin: 0, fontSize: '20px' }}>📦 Omni-Stock</h1>
      </Link>
      <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto', alignItems: 'center' }}>
        <Link to="/consume" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.consume}</Link>
        <Link to="/restock" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.restock}</Link>
        <Link to="/manage" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>{i18n.nav.manage}</Link>
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
            </Routes>
          </div>
        </div>
      </LanguageProvider>
    </BrowserRouter>
  );
}

export default App;
