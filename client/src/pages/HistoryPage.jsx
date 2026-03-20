import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { getHistory, getGenerationById, deleteGeneration } from '../services/api';
import { useToast } from '../context/ToastContext';

const AGENT_LABELS = {
  strategy: { label: 'Strategy',      color: 'var(--purple)' },
  content:  { label: 'Content & Copy', color: 'var(--coral)' },
  email:    { label: 'Email',          color: 'var(--teal)' },
  leads:    { label: 'Lead Qualify',   color: 'var(--blue)' },
};

function renderMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n/g, '<br/>');
}

export default function HistoryPage() {
  const { showToast } = useToast();
  const [items,    setItems]    = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [filter,   setFilter]   = useState('all');

  useEffect(() => {
    setLoading(true);
    getHistory({ limit: 50, agentType: filter === 'all' ? undefined : filter })
      .then(({ data }) => setItems(data.items))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [filter]);

  const openItem = async (id) => {
    const { data } = await getGenerationById(id);
    setSelected(data.generation);
  };

  const handleDelete = async (id) => {
    await deleteGeneration(id);
    setItems((prev) => prev.filter((i) => i._id !== id));
    if (selected?._id === id) setSelected(null);
    showToast('Generation deleted');
  };

  const handleCopy = () => {
    if (!selected?.output) return;
    navigator.clipboard.writeText(selected.output).then(() => showToast('✓ Copied!'));
  };

  const timeAgo = (date) => {
    const s = Math.floor((Date.now() - new Date(date)) / 1000);
    if (s < 60) return `${s}s ago`;
    if (s < 3600) return `${Math.floor(s / 60)}m ago`;
    if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
    return `${Math.floor(s / 86400)}d ago`;
  };

  return (
    <>
      <Topbar title="History" subtitle="Browse all past AI generations saved to MongoDB" />
      <div className="page-content fade-in">

        {/* Filter bar */}
        <div className="agent-tabs" style={{ maxWidth: 500, marginBottom: 20 }}>
          {['all', 'strategy', 'content', 'email', 'leads'].map((f) => (
            <div key={f} className={`agent-tab${filter === f ? ' active' : ''}`} onClick={() => setFilter(f)}>
              {f === 'all' ? 'All' : AGENT_LABELS[f].label}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 20, alignItems: 'start' }}>

          {/* List */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading && (
              <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Loading…</div>
            )}
            {!loading && items.length === 0 && (
              <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>
                No generations found. Run an agent to get started.
              </div>
            )}
            {items.map((item) => {
              const ag = AGENT_LABELS[item.agentType] || {};
              return (
                <div
                  key={item._id}
                  onClick={() => openItem(item._id)}
                  style={{
                    padding: '14px 16px',
                    borderBottom: '1px solid var(--border)',
                    cursor: 'pointer',
                    background: selected?._id === item._id ? 'var(--bg3)' : 'transparent',
                    transition: 'background 0.1s',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      border: `1px solid ${ag.color}30`, color: ag.color,
                      background: `${ag.color}12`,
                    }}>
                      {ag.label}
                    </span>
                    {item.subType && (
                      <span style={{ fontSize: 10, color: 'var(--text3)' }}>{item.subType}</span>
                    )}
                    <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 'auto' }}>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--text2)' }}>
                    {item.tokensUsed} tokens used
                  </div>
                </div>
              );
            })}
          </div>

          {/* Detail */}
          <div className="output-card">
            <div className="card-header">
              <span className="card-title">
                {selected ? `${AGENT_LABELS[selected.agentType]?.label} — ${selected.subType || ''}` : 'Select a generation'}
              </span>
              {selected && (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button className="btn btn-ghost" onClick={handleCopy}>Copy</button>
                  <button className="btn btn-ghost" style={{ color: 'var(--coral)' }} onClick={() => handleDelete(selected._id)}>Delete</button>
                </div>
              )}
            </div>
            <div className="output-body">
              {!selected && (
                <div className="output-placeholder">
                  <div className="icon">🗂️</div>
                  <p>Select a generation from the list to view it</p>
                </div>
              )}
              {selected && (
                <div
                  className="ai-output fade-in"
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(selected.output) }}
                />
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  );
}
