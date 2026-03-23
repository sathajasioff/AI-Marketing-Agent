import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../context/ToastContext';
import { useGHLAccounts } from '../context/GHLAccountsContext';
import api from '../services/api';

export default function GHLAccountsPage() {
  const { showToast } = useToast();
  const {
    accounts,
    activeAccount,
    loading,
    switching,
    refreshAccounts,
    setActiveAccount,
  } = useGHLAccounts();
  const [saving,   setSaving]   = useState(false);
  const [form, setForm] = useState({
    name: '', apiKey: '', locationId: '', notes: '',
  });

  const fetch = () => {
    refreshAccounts()
      .catch(() => showToast('⚠ Failed to load accounts'))
      .finally(() => {});
  };

  useEffect(() => { fetch(); }, []);

  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.apiKey || !form.locationId) {
      return showToast('⚠ Name, API Key, and Location ID are all required');
    }
    setSaving(true);
    try {
      await api.post('/ghl-accounts', form);
      showToast('✓ Account added and credentials verified');
      setForm({ name: '', apiKey: '', locationId: '', notes: '' });
      fetch();
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Failed to add account'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleActivate = async (id, name) => {
    const result = await setActiveAccount(id);
    if (result.success) {
      showToast(`✓ "${name}" is now the active GHL account`);
    } else {
      showToast(`⚠ ${result.message}`);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/ghl-accounts/${id}`);
      showToast('✓ Account deleted');
      fetch();
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Delete failed'}`);
    }
  };

  return (
    <>
      <Topbar title="GHL Accounts" subtitle="Manage multiple GoHighLevel subaccounts" />
      <div className="page-content fade-in">

        <div className="card" style={{ marginBottom: 18 }}>
          <div className="form-card-title">
            Active GHL integration <span className="badge">Used by sync, tags, notes, workflows</span>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Select connected account</label>
            <select
              value={activeAccount?._id || ''}
              onChange={(e) => {
                const selected = accounts.find((account) => account._id === e.target.value);
                if (selected) handleActivate(selected._id, selected.name);
              }}
              disabled={loading || switching || accounts.length === 0}
            >
              <option value="">
                {accounts.length === 0 ? 'No connected GHL accounts yet' : 'Choose active GHL account'}
              </option>
              {accounts.map((account) => (
                <option key={account._id} value={account._id}>
                  {account.name} - {account.locationId}
                </option>
              ))}
            </select>
          </div>
          <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 10 }}>
            {activeAccount
              ? `Currently connected: ${activeAccount.name} (${activeAccount.locationId})`
              : 'No active GHL account selected yet.'}
          </div>
        </div>

        <div className="agent-layout">

          {/* Add account form */}
          <form className="card" onSubmit={handleAdd}>
            <div className="form-card-title">
              Add GHL account <span className="badge">Credentials verified on save</span>
            </div>

            <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.7 }}>
              Your API key is stored securely in MongoDB and never shown in full after saving. You can add as many subaccounts as you need and switch the active one at any time.
            </div>

            <div className="field">
              <label>Account name</label>
              <input
                value={form.name}
                onChange={set('name')}
                placeholder="e.g. Elev8 Montreal — Main Account"
              />
            </div>

            <div className="field">
              <label>GHL API Key</label>
              <input
                value={form.apiKey}
                onChange={set('apiKey')}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                type="password"
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                GHL → Settings → API Keys → Create new key
              </div>
            </div>

            <div className="field">
              <label>Location ID</label>
              <input
                value={form.locationId}
                onChange={set('locationId')}
                placeholder="aBcDeFgHiJkLmNoPqRsT"
              />
              <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 4 }}>
                GHL → Settings → Business Info → Location ID
              </div>
            </div>

            <div className="field">
              <label>Notes (optional)</label>
              <input
                value={form.notes}
                onChange={set('notes')}
                placeholder="e.g. Client name, event name, date"
              />
            </div>

            <button className="btn btn-primary" type="submit" disabled={saving}>
              {saving ? 'Verifying + saving…' : '+ Add GHL account'}
            </button>
          </form>

          {/* Account list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
              Connected accounts ({accounts.length})
            </div>

            {loading && (
              <div className="loading-wrap">
                <div className="loading-dots"><span/><span/><span/></div>
                <span>Loading accounts…</span>
              </div>
            )}

            {!loading && accounts.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 28, opacity: 0.4, marginBottom: 10 }}>🔗</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>No accounts added yet</div>
                <div style={{ fontSize: 12 }}>Add your first GHL subaccount using the form.</div>
              </div>
            )}

            {accounts.map(account => (
              <div key={account._id} className="card" style={{
                borderColor: account.isActive ? 'rgba(42,191,170,0.4)' : 'var(--border)',
                position: 'relative',
              }}>
                {account.isActive && (
                  <div style={{
                    position: 'absolute', top: 12, right: 14,
                    fontSize: 10, padding: '3px 10px', borderRadius: 20,
                    background: 'rgba(42,191,170,0.12)',
                    color: '#2ABFAA',
                    border: '1px solid rgba(42,191,170,0.3)',
                    fontWeight: 600,
                    letterSpacing: '0.04em',
                  }}>
                    ACTIVE
                  </div>
                )}

                <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700, marginBottom: 8 }}>
                  {account.name}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
                  {[
                    { label: 'API Key',      value: account.apiKey },
                    { label: 'Location ID',  value: account.locationId },
                  ].map(f => (
                    <div key={f.label} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 3 }}>{f.label}</div>
                      <div style={{ fontSize: 12, fontFamily: 'monospace', color: 'var(--text2)' }}>{f.value}</div>
                    </div>
                  ))}
                </div>

                {account.notes && (
                  <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 14 }}>{account.notes}</div>
                )}

                <div style={{ display: 'flex', gap: 8 }}>
                  {!account.isActive && (
                    <button
                      className="btn btn-ghost"
                      style={{ color: '#2ABFAA', borderColor: '#2ABFAA', fontSize: 12 }}
                      onClick={() => handleActivate(account._id, account.name)}
                      disabled={switching}
                    >
                      {switching ? 'Switching…' : 'Set as active'}
                    </button>
                  )}
                  {account.isActive && (
                    <button className="btn btn-ghost" style={{ fontSize: 12, opacity: 0.5, cursor: 'not-allowed' }} disabled>
                      Currently active
                    </button>
                  )}
                  <button
                    className="btn btn-ghost"
                    style={{ fontSize: 12, color: '#E8714A', borderColor: '#E8714A' }}
                    onClick={() => handleDelete(account._id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            {accounts.length > 0 && (
              <div style={{ fontSize: 12, color: 'var(--text3)', padding: '10px 14px', background: 'var(--bg2)', borderRadius: 8, border: '1px solid var(--border)', lineHeight: 1.7 }}>
                Only one account is active at a time. All GHL sync, qualify, push-tags, and workflow operations use the active account. Switch accounts at any time — the leads already in MongoDB stay linked to their original account.
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
