import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const CATEGORIES = [
  { value: 'audience_insight', label: 'Audience Insight' },
  { value: 'proven_hook',      label: 'Proven Hook' },
  { value: 'failed_hook',      label: 'Failed Hook' },
  { value: 'objection',        label: 'Objection' },
  { value: 'campaign_result',  label: 'Campaign Result' },
  { value: 'local_insight',    label: 'Montreal Insight' },
  { value: 'testimonial',      label: 'Testimonial' },
  { value: 'custom',           label: 'Custom' },
];

const AGENTS = ['all', 'strategy', 'content', 'email', 'leads'];

const CATEGORY_COLORS = {
  audience_insight: '#9B7CE8',
  proven_hook:      '#3DBF8A',
  failed_hook:      '#E8714A',
  objection:        '#4A9EE8',
  campaign_result:  '#E8B84B',
  local_insight:    '#2ABFAA',
  testimonial:      '#3DBF8A',
  custom:           'var(--text3)',
};

const empty = {
  agentType: 'all',
  category:  'audience_insight',
  title:     '',
  content:   '',
  priority:  2,
  tags:      '',
};

export default function KnowledgePage() {
  const { showToast } = useToast();
  const [items,   setItems]   = useState([]);
  const [form,    setForm]    = useState(empty);
  const [editing, setEditing] = useState(null);
  const [filter,  setFilter]  = useState('all');
  const [loading, setLoading] = useState(true);
  const [saving,  setSaving]  = useState(false);

  const fetchItems = async () => {
    setLoading(true);
    try {
      const params = filter !== 'all' ? { agentType: filter } : {};
      const { data } = await api.get('/knowledge', { params });
      setItems(data.items);
    } catch {
      showToast('⚠ Failed to load knowledge base');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchItems(); }, [filter]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.title || !form.content) return showToast('⚠ Title and content are required');
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()) : [],
      };
      if (editing) {
        await api.put(`/knowledge/${editing}`, payload);
        showToast('✓ Knowledge updated');
      } else {
        await api.post('/knowledge', payload);
        showToast('✓ Knowledge added — Claude will use this from now on');
      }
      setForm(empty);
      setEditing(null);
      fetchItems();
    } catch {
      showToast('⚠ Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (item) => {
    setEditing(item._id);
    setForm({ ...item, tags: item.tags?.join(', ') || '' });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/knowledge/${id}`);
      showToast('✓ Deleted');
      fetchItems();
    } catch {
      showToast('⚠ Delete failed');
    }
  };

  const handleToggle = async (item) => {
    try {
      await api.put(`/knowledge/${item._id}`, { isActive: !item.isActive });
      fetchItems();
    } catch {
      showToast('⚠ Update failed');
    }
  };

  return (
    <>
      <Topbar title="Knowledge Base" subtitle="Teach Claude what works for Elev8 Montreal" />
      <div className="page-content fade-in">

        {/* Stats */}
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 22 }}>
          {[
            { label: 'Total entries',  value: items.length },
            { label: 'Active',         value: items.filter(i => i.isActive).length },
            { label: 'Proven hooks',   value: items.filter(i => i.category === 'proven_hook').length },
            { label: 'Campaign data',  value: items.filter(i => i.category === 'campaign_result').length },
          ].map((s) => (
            <div key={s.label} className="stat-card">
              <div className="s-label">{s.label}</div>
              <div className="s-value">{s.value}</div>
            </div>
          ))}
        </div>

        <div className="agent-layout">

          {/* Form */}
          <form className="card" onSubmit={handleSave}>
            <div className="form-card-title">
              {editing ? 'Edit entry' : 'Add knowledge'}
              <span className="badge">Claude will learn this</span>
            </div>

            <div className="field-row">
              <div className="field">
                <label>Applies to agent</label>
                <select value={form.agentType} onChange={set('agentType')}>
                  {AGENTS.map(a => (
                    <option key={a} value={a}>
                      {a === 'all' ? 'All agents' : a.charAt(0).toUpperCase() + a.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>Category</label>
                <select value={form.category} onChange={set('category')}>
                  {CATEGORIES.map(c => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="field">
              <label>Title</label>
              <input value={form.title} onChange={set('title')} placeholder="e.g. Montreal realtors respond to ROI numbers" />
            </div>

            <div className="field">
              <label>Content — what Claude should know</label>
              <textarea
                rows={4}
                value={form.content}
                onChange={set('content')}
                placeholder={
                  form.category === 'proven_hook'
                    ? 'e.g. "Are you still trading time for money?" — 4.2% CTR on cold Montreal realtors aged 35-50'
                    : form.category === 'campaign_result'
                    ? 'e.g. Week 1 Meta campaign: CPL $4.20, 47 leads, 12 booked calls, 3 tickets sold'
                    : form.category === 'objection'
                    ? 'e.g. Most common: "I need to check with my wife" — use scarcity response: only 14 seats left'
                    : form.category === 'local_insight'
                    ? 'e.g. Montreal audience prefers French subject lines — 23% higher open rate than English'
                    : 'Enter what Claude should know and apply...'
                }
              />
            </div>

            <div className="field-row">
              <div className="field">
                <label>Priority</label>
                <select value={form.priority} onChange={set('priority')}>
                  <option value={1}>Low</option>
                  <option value={2}>Medium</option>
                  <option value={3}>High — always include</option>
                </select>
              </div>
              <div className="field">
                <label>Tags (comma separated)</label>
                <input value={form.tags} onChange={set('tags')} placeholder="realtor, montreal, cold-audience" />
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editing ? '✓ Update entry' : '+ Add to knowledge base'}
              </button>
              {editing && (
                <button className="btn btn-ghost" type="button"
                  onClick={() => { setEditing(null); setForm(empty); }}>
                  Cancel
                </button>
              )}
            </div>
          </form>

          {/* List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>

            {/* Filter */}
            <div className="agent-tabs" style={{ marginBottom: 4 }}>
              {AGENTS.map((a) => (
                <div key={a} className={`agent-tab${filter === a ? ' active' : ''}`}
                  onClick={() => setFilter(a)}>
                  {a === 'all' ? 'All' : a.charAt(0).toUpperCase() + a.slice(1)}
                </div>
              ))}
            </div>

            {loading && <div style={{ color: 'var(--text3)', fontSize: 13, padding: 16 }}>Loading…</div>}

            {!loading && items.length === 0 && (
              <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, opacity: 0.4, marginBottom: 12 }}>🧠</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>No knowledge entries yet</div>
                <div style={{ fontSize: 12 }}>Add your first entry to start training Claude on your specific market.</div>
              </div>
            )}

            {items.map((item) => (
              <div key={item._id} className="card" style={{
                padding: '14px 18px',
                opacity: item.isActive ? 1 : 0.5,
                borderLeft: `3px solid ${CATEGORY_COLORS[item.category] || 'var(--border)'}`,
                borderRadius: 0,
                borderTopRightRadius: 'var(--r)',
                borderBottomRightRadius: 'var(--r)',
              }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{item.title}</span>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4,
                        background: 'var(--bg4)', color: CATEGORY_COLORS[item.category] || 'var(--text3)',
                        border: '1px solid var(--border)',
                      }}>
                        {CATEGORIES.find(c => c.value === item.category)?.label}
                      </span>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4,
                        background: 'var(--bg4)', color: 'var(--text3)',
                        border: '1px solid var(--border)',
                      }}>
                        {item.agentType === 'all' ? 'All agents' : item.agentType}
                      </span>
                      {item.priority === 3 && (
                        <span style={{
                          fontSize: 10, padding: '2px 7px', borderRadius: 4,
                          background: 'rgba(201,151,58,0.15)',
                          color: '#E8B84B',
                          border: '1px solid rgba(201,151,58,0.3)',
                        }}>
                          High priority
                        </span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                      {item.content}
                    </div>
                    {item.tags?.length > 0 && (
                      <div className="tag-row" style={{ marginTop: 8 }}>
                        {item.tags.map(t => <span key={t} className="tag-pill">{t}</span>)}
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => handleEdit(item)}>Edit</button>
                    <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }}
                      onClick={() => handleToggle(item)}>
                      {item.isActive ? 'Disable' : 'Enable'}
                    </button>
                    <button className="btn btn-ghost"
                      style={{ fontSize: 11, padding: '4px 10px', color: '#E8714A', borderColor: '#E8714A' }}
                      onClick={() => handleDelete(item._id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}