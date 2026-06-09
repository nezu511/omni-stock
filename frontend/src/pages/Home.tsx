import { Link } from 'react-router-dom';

function Home() {
  // 巨大ボタンの共通スタイル
  const buttonStyle = (color: string) => ({
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '240px',
    height: '180px',
    backgroundColor: color,
    color: 'white',
    fontSize: '32px',
    fontWeight: 'bold',
    textDecoration: 'none', // リンクの下線を消す
    borderRadius: '16px',
    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
    transition: 'transform 0.2s', // カーソルを乗せた時のアニメーション準備
  });

  return (
    <div style={{ textAlign: 'center', marginTop: '40px' }}>
      <h2 style={{ color: '#4b5563', marginBottom: '40px' }}>本日はどの作業を行いますか？</h2>

      <div style={{ display: 'flex', gap: '30px', justifyContent: 'center', flexWrap: 'wrap' }}>
        {/* Linkコンポーネントを使うと、ページをリロードせずに一瞬で画面が切り替わります */}
        <Link to="/consume" style={buttonStyle('#ef4444')}>📤 使用</Link>
        <Link to="/restock" style={buttonStyle('#10b981')}>📥 入荷</Link>
        <Link to="/manage" style={buttonStyle('#4b5563')}>⚙️ 管理</Link>
      </div>
    </div>
  );
}

export default Home;
