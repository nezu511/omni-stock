import { BrowserRouter, Routes, Route, Link } from 'react-router-dom';
import Home from './pages/Home';
import Consume from './pages/Consume';
import Restock from './pages/Restock';
import Manage from './pages/Manage';
import AddItem from './pages/AddItem';

function App() {
  return (
    // BrowserRouter: この中ではURLによる画面切り替えが有効になる魔法の枠
    <BrowserRouter>
      <div style={{ fontFamily: 'sans-serif', backgroundColor: '#f9fafb', minHeight: '100vh' }}>

        {/* 全てのページで共通して表示されるヘッダー（ナビゲーション） */}
        <nav style={{ backgroundColor: 'white', padding: '15px 20px', borderBottom: '1px solid #e5e7eb', display: 'flex', alignItems: 'center', gap: '20px' }}>
          <Link to="/" style={{ textDecoration: 'none', color: '#111827' }}>
            <h1 style={{ margin: 0, fontSize: '20px' }}>📦 Omni-Stock</h1>
          </Link>
          <div style={{ display: 'flex', gap: '15px', marginLeft: 'auto' }}>
            <Link to="/consume" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>使用</Link>
            <Link to="/restock" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>入荷</Link>
            <Link to="/manage" style={{ textDecoration: 'none', color: '#4b5563', fontWeight: 'bold' }}>管理</Link>
          </div>
        </nav>

        {/* ここがメインの表示エリア。URLによって中身がパッと切り替わる！ */}
        <div style={{ padding: '20px' }}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/consume" element={<Consume />} />
            <Route path="/restock" element={<Restock />} />
            <Route path="/manage" element={<Manage />} />
            <Route path="/manage/new" element={<AddItem />} />
          </Routes>
        </div>

      </div>
    </BrowserRouter>
  );
}

export default App;
