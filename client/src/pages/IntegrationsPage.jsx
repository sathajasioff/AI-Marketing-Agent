import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

function StatusBadge({ connected }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 6,
      padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 500,
      background: connected ? 'rgba(61,191,138,0.12)' : 'rgba(92,88,80,0.12)',
      color:      connected ? '#3DBF8A' : 'var(--text3)',
      border:     `1px solid ${connected ? 'rgba(61,191,138,0.3)' : 'var(--border)'}`,
    }}>
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: connected ? '#3DBF8A' : 'var(--text3)', display: 'inline-block' }} />
      {connected ? 'Connected' : 'Not connected'}
    </span>
  );
}

export default function IntegrationsPage() {
  const { showToast } = useToast();

  const [data,     setData]     = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [saving,   setSaving]   = useState(false);
  const [testing,  setTesting]  = useState(false);
  const [removing, setRemoving] = useState(false);
  const [showToken, setShowToken] = useState(false);

  const [metaForm, setMetaForm] = useState({
    metaAccessToken: '',
    metaAdAccountId: '',
  });

  const load = () => {
    setLoading(true);
    api.get('/integrations')
      .then(({ data: res }) => {
        setData(res.integrations);
        setMetaForm(f => ({
          ...f,
          metaAdAccountId: res.integrations.metaAdAccountId || '',
        }));
      })
      .catch(() => showToast('⚠ Could not load integrations'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleSave = async () => {
    if (!metaForm.metaAccessToken || !metaForm.metaAdAccountId)
      return showToast('⚠ Fill in both fields');
    setSaving(true);
    try {
      await api.put('/integrations/meta', metaForm);
      showToast('✓ Meta credentials saved');
      setMetaForm(f => ({ ...f, metaAccessToken: '' }));
      load();
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Save failed'}`);
    } finally { setSaving(false); }
  };

  const handleTest = async () => {
    setTesting(true);
    try {
      const { data: res } = await api.post('/integrations/meta/test');
      showToast(`✓ ${res.message}`);
      load();
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Connection failed'}`);
    } finally { setTesting(false); }
  };

  const handleDisconnect = async () => {
    setRemoving(true);
    try {
      await api.delete('/integrations/meta');
      showToast('✓ Meta disconnected');
      setMetaForm({ metaAccessToken: '', metaAdAccountId: '' });
      load();
    } catch { showToast('⚠ Disconnect failed'); }
    finally { setRemoving(false); }
  };

  return (
    <>
      <Topbar title="Integrations" subtitle="Connect your Meta Ads account to see performance data" />
      <div className="page-content fade-in">

        <div style={{ maxWidth: 620 }}>

          {/* ── Meta Ads Card ── */}
          <div className="card">

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 20, paddingBottom: 16, borderBottom: '1px solid var(--border)' }}>
              <div style={{ width: 46, height: 46, borderRadius: 10, background: 'linear-gradient(135deg, #1877F2, #0C5BB5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                📘
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                  <span style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>Meta Ads</span>
                  {!loading && <StatusBadge connected={data?.metaConnected} />}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>
                  Connect your Facebook/Instagram ad account to see spend, impressions, clicks, CPL and campaign performance in the dashboard.
                </div>
              </div>
            </div>

            {/* Connected state */}
            {data?.metaConnected && (
              <div style={{ background: 'rgba(61,191,138,0.08)', border: '1px solid rgba(61,191,138,0.2)', borderRadius: 8, padding: '12px 16px', marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: '#3DBF8A', marginBottom: 2 }}>
                    ✓ Connected{data.metaAccountName ? ` — ${data.metaAccountName}` : ''}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>
                    Account ID: act_{data.metaAdAccountId}
                    {data.metaTestedAt && ` · Last tested: ${new Date(data.metaTestedAt).toLocaleDateString()}`}
                  </div>
                </div>
                <button className="btn btn-ghost"
                  style={{ fontSize: 12, color: '#E8714A', borderColor: '#E8714A', opacity: removing ? 0.5 : 1 }}
                  onClick={handleDisconnect} disabled={removing}>
                  {removing ? 'Removing…' : 'Disconnect'}
                </button>
              </div>
            )}

            {/* How to get token guide */}
            <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 16px', marginBottom: 20, fontSize: 12, color: 'var(--text2)', lineHeight: 1.8 }}>
              <div style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 6, fontSize: 13 }}>How to get your credentials</div>
              <div><span style={{ color: 'var(--text3)' }}>1.</span> Go to <strong>developers.facebook.com</strong> → My Apps → Create App → Business</div>
              <div><span style={{ color: 'var(--text3)' }}>2.</span> Go to <strong>Tools → Graph API Explorer</strong></div>
              <div><span style={{ color: 'var(--text3)' }}>3.</span> Select your app → Generate Access Token → select <code style={{ background: 'var(--bg4)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>ads_read</code> + <code style={{ background: 'var(--bg4)', padding: '1px 5px', borderRadius: 4, fontSize: 11 }}>read_insights</code></div>
              <div><span style={{ color: 'var(--text3)' }}>4.</span> Go to <strong>business.facebook.com</strong> → Ad Accounts → copy your Account ID (numbers only)</div>
            </div>

            {/* Form */}
            <div className="field">
              <label>Meta Access Token</label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showToken ? 'text' : 'password'}
                  value={metaForm.metaAccessToken}
                  onChange={e => setMetaForm(f => ({ ...f, metaAccessToken: e.target.value }))}
                  placeholder={data?.hasMetaToken ? 'Enter new token to replace existing' : 'EAAxxxxxxxxxxxxxxxxxx'}
                  style={{ paddingRight: 80 }}
                />
                <button
                  type="button"
                  onClick={() => setShowToken(s => !s)}
                  style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 11, color: 'var(--text3)', padding: '2px 6px' }}>
                  {showToken ? 'Hide' : 'Show'}
                </button>
              </div>
              {data?.hasMetaToken && (
                <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                  Current token: {data.metaAccessToken} — leave blank to keep existing
                </div>
              )}
            </div>

            <div className="field">
              <label>Ad Account ID (numbers only — no "act_" prefix)</label>
              <input
                type="text"
                value={metaForm.metaAdAccountId}
                onChange={e => setMetaForm(f => ({ ...f, metaAdAccountId: e.target.value.replace(/\D/g, '') }))}
                placeholder="123456789012345"
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                Found in Facebook Business Manager → Ad Accounts → your account ID
              </div>
            </div>

            {/* Buttons */}
            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button className="btn btn-primary" style={{ flex: 1 }}
                onClick={handleSave} disabled={saving || (!metaForm.metaAccessToken && !metaForm.metaAdAccountId)}>
                {saving ? 'Saving…' : '💾 Save credentials'}
              </button>
              <button className="btn btn-ghost"
                style={{ flexShrink: 0, opacity: data?.hasMetaToken ? 1 : 0.4 }}
                onClick={handleTest} disabled={testing || !data?.hasMetaToken}>
                {testing ? 'Testing…' : '⚡ Test connection'}
              </button>
            </div>

            {/* What you get */}
            <div style={{ marginTop: 20, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 10 }}>What you unlock</div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  'Total spend + daily spend trend',
                  'Impressions, reach, frequency',
                  'Clicks, CTR, CPC',
                  'Cost per lead (CPL)',
                  'Campaign breakdown table',
                  'Top performing ads ranked',
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text2)' }}>
                    <span style={{ color: '#3DBF8A', fontSize: 14 }}>✓</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ── Info note ── */}
          <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.7, padding: '0 4px' }}>
            Your credentials are stored securely in MongoDB. They are never exposed in the browser — the server fetches Meta data on your behalf. Access tokens expire after 60 days — use a System User Token from Business Manager for a permanent token.
          </div>

        </div>
      </div>
    </>
  );
}