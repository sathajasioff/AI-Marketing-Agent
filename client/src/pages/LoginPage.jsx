import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ciftronLogo from '../assets/CIFTRON logo 01-01-01-01.png';

export default function LoginPage() {
  const navigate   = useNavigate();
  const { login, register } = useAuth();

  const [mode,    setMode]    = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState(null);

  const [form, setForm] = useState({
    name:        '',
    email:       '',
    password:    '',
    companyName: '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
      } else {
        await register(form.name, form.email, form.password, form.companyName);
      }
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--bg)',
      padding: '20px',
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <img
            src={ciftronLogo}
            alt="Ciftron"
            style={{
              width: '100%',
              maxWidth: 180,
              height: 'auto',
              marginBottom: 16,
              objectFit: 'contain',
            }}
          />
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 22, fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>
            Ciftron Growth Engine
          </div>
          <div style={{ fontSize: 13, color: 'var(--text3)' }}>
            {mode === 'login' ? 'Sign in to your account' : 'Create your account'}
          </div>
        </div>

        {/* Card */}
        <div className="card" style={{ padding: '28px 30px' }}>

          {error && (
            <div style={{ background: 'rgba(232,113,74,0.1)', border: '1px solid rgba(232,113,74,0.3)', borderRadius: 8, padding: '10px 14px', marginBottom: 18, fontSize: 13, color: '#E8714A' }}>
              ⚠ {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>

            {mode === 'register' && (
              <>
                <div className="field">
                  <label>Full name</label>
                  <input value={form.name} onChange={set('name')} placeholder="John Dupont" required />
                </div>
                <div className="field">
                  <label>Company name</label>
                  <input value={form.companyName} onChange={set('companyName')} placeholder="Elev8 Montreal" />
                </div>
              </>
            )}

            <div className="field">
              <label>Email address</label>
              <input type="email" value={form.email} onChange={set('email')} placeholder="john@company.com" required />
            </div>

            <div className="field">
              <label>Password</label>
              <input type="password" value={form.password} onChange={set('password')} placeholder="Min 8 characters" required minLength={8} />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading
                ? mode === 'login' ? 'Signing in…' : 'Creating account…'
                : mode === 'login' ? 'Sign in' : 'Create account'}
            </button>
          </form>

          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 13, color: 'var(--text3)' }}>
            {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
            <button
              onClick={() => { setMode(m => m === 'login' ? 'register' : 'login'); setError(null); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#C9973A', fontSize: 13, padding: 0 }}>
              {mode === 'login' ? 'Sign up' : 'Sign in'}
            </button>
          </div>
        </div>

        <div style={{ textAlign: 'center', marginTop: 16, fontSize: 11, color: 'var(--text3)' }}>
          Powered by Claude · GoHighLevel · Meta Ads
        </div>
      </div>
    </div>
  );
}
