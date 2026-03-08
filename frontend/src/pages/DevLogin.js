import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const API = process.env.REACT_APP_BACKEND_URL + '/api';

export default function DevLogin() {
  const [email, setEmail] = useState('sukrit.chawla@gmail.com');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.post(API + '/auth/dev-login',
        { email, secret: 'caesura-dev-2026' },
        { withCredentials: true }
      );
      const user = res.data.user;
      let dest = user.role === 'admin' ? '/admin' : user.role === 'buyer' ? '/explore' : '/dashboard';
      navigate(dest, { replace: true, state: { user } });
    } catch (e) {
      setError(e.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', background: '#0A0A0B', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ background: '#141416', border: '1px solid rgba(255,255,255,0.1)', padding: '48px', width: '400px', borderRadius: '4px' }}>
        <h1 style={{ color: '#FAFAF9', fontFamily: 'sans-serif', marginBottom: '8px', fontSize: '20px' }}>Dev Login</h1>
        <p style={{ color: '#5A5A5E', fontFamily: 'sans-serif', fontSize: '13px', marginBottom: '32px' }}>Local dev only</p>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: '100%', padding: '12px', background: '#0A0A0B', border: '1px solid rgba(255,255,255,0.15)', color: '#FAFAF9', fontFamily: 'sans-serif', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
        />
        {error && <p style={{ color: '#FF3D00', fontFamily: 'sans-serif', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}
        <button
          onClick={handleLogin}
          disabled={loading}
          style={{ width: '100%', padding: '14px', background: '#C8FF00', border: 'none', color: '#0A0A0B', fontFamily: 'sans-serif', fontWeight: 700, fontSize: '14px', cursor: loading ? 'not-allowed' : 'pointer', opacity: loading ? 0.6 : 1 }}
        >
          {loading ? 'Logging in...' : 'Log In'}
        </button>
      </div>
    </div>
  );
}
