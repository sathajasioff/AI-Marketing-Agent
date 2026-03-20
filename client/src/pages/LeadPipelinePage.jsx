import { useState, useEffect, useCallback } from 'react';
import Topbar from '../components/layout/Topbar';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const SEGMENTS = ['all', 'cold', 'warm', 'hot', 'buyer'];
const SEGMENT_COLORS = {
  cold:  'var(--text3)',
  warm:  '#4A9EE8',
  hot:   '#E8714A',
  buyer: '#2ABFAA',
};
const OUTCOMES = ['pending', 'nurturing', 'converted', 'lost'];
const OUTCOME_COLORS = {
  pending:   'var(--text3)',
  nurturing: '#4A9EE8',
  converted: '#3DBF8A',
  lost:      '#E8714A',
};

export default function LeadPipelinePage() {
  const { showToast } = useToast();
  const [leads,      setLeads]      = useState([]);
  const [stats,      setStats]      = useState(null);
  const [selected,   setSelected]   = useState(null);
  const [filter,     setFilter]     = useState('all');
  const [page,       setPage]       = useState(1);
  const [total,      setTotal]      = useState(0);
  const [loading,    setLoading]    = useState(true);
  const [syncing,    setSyncing]    = useState(false);
  const [qualifying, setQualifying] = useState(null);
  const pageSize = 100;

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: pageSize, page };
      if (filter !== 'all') params.segment = filter;
      const [leadsRes, statsRes] = await Promise.all([
        api.get('/ghl/leads', { params }),
        api.get('/ghl/stats'),
      ]);
      setLeads(leadsRes.data.leads);
      setTotal(leadsRes.data.total || 0);
      setStats(statsRes.data.stats);
    } catch {
      showToast('⚠ Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [filter, page, showToast]);

  useEffect(() => { fetchLeads(); }, [fetchLeads]);
  useEffect(() => { setPage(1); }, [filter]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data } = await api.post('/ghl/sync', { batchSize: 100 });
      showToast(`✓ ${data.message}`);
      setPage(1);
      fetchLeads();
    } catch {
      showToast('⚠ GHL sync failed — check your API key');
    } finally {
      setSyncing(false);
    }
  };

  const handleQualify = async (leadId) => {
    setQualifying(leadId);
    try {
      const { data } = await api.post(`/ghl/qualify/${leadId}`);
      setLeads((prev) => prev.map((l) => l._id === leadId ? data.lead : l));
      if (selected?._id === leadId) setSelected(data.lead);
      showToast('✓ Lead qualified by AI');
    } catch {
      showToast('⚠ Qualification failed');
    } finally {
      setQualifying(null);
    }
  };

  const handlePushTags = async (leadId) => {
    try {
      const { data } = await api.post(`/ghl/push-tags/${leadId}`);
      showToast(`✓ ${data.message}`);
      setLeads((prev) => prev.map((l) => l._id === leadId ? { ...l, tagsPushedToGHL: true } : l));
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Push failed'}`);
    }
  };

  const handlePushNote = async (leadId) => {
    try {
      await api.post(`/ghl/push-note/${leadId}`);
      showToast('✓ AI note pushed to GHL');
      setLeads((prev) => prev.map((l) => l._id === leadId ? { ...l, notePushedToGHL: true } : l));
    } catch {
      showToast('⚠ Note push failed');
    }
  };

  const handleTriggerWorkflow = async (leadId, workflowTag) => {
    if (!workflowTag) return;
    try {
      await api.post(`/ghl/trigger-workflow/${leadId}`, { workflowTag });
      showToast(`✓ Workflow trigger applied: ${workflowTag}`);
      setLeads((prev) => prev.map((l) => l._id === leadId ? { ...l, workflowTriggered: true } : l));
    } catch {
      showToast('⚠ Workflow trigger failed');
    }
  };

  const handleSetOutcome = async (leadId, outcome) => {
    try {
      const { data } = await api.patch(`/ghl/outcome/${leadId}`, { outcome });
      setLeads((prev) => prev.map((l) => l._id === leadId ? data.lead : l));
      if (selected?._id === leadId) setSelected(data.lead);
      showToast(`✓ Outcome set to "${outcome}"`);
    } catch {
      showToast('⚠ Failed to set outcome');
    }
  };

  const fullName = (l) => `${l.firstName} ${l.lastName}`.trim() || l.email || 'Unknown';
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <>
      <Topbar title="Lead Pipeline" subtitle="GHL contacts → AI qualification → push back to GHL" />
      <div className="page-content fade-in">

        {stats && (
          <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
            {[
              { label: 'Total leads',  value: stats.total },
              { label: 'AI qualified', value: stats.withScore },
              { label: 'Hot + buyers', value: (stats.bySegment.find(s => s._id === 'hot')?.count || 0) + (stats.bySegment.find(s => s._id === 'buyer')?.count || 0) },
              { label: 'Converted',    value: stats.byOutcome.find(o => o._id === 'converted')?.count || 0, gold: true },
            ].map((s) => (
              <div key={s.label} className={`stat-card${s.gold ? ' gold' : ''}`}>
                <div className="s-label">{s.label}</div>
                <div className="s-value">{s.value}</div>
              </div>
            ))}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 18, flexWrap: 'wrap' }}>
          <div className="agent-tabs" style={{ marginBottom: 0, flex: 1 }}>
            {SEGMENTS.map((s) => (
              <div key={s} className={`agent-tab${filter === s ? ' active' : ''}`} onClick={() => setFilter(s)}>
                {s.charAt(0).toUpperCase() + s.slice(1)}
              </div>
            ))}
          </div>
          <button className="btn btn-ghost" onClick={handleSync} disabled={syncing} style={{ flexShrink: 0 }}>
            {syncing ? 'Syncing…' : '⟳ Sync from GHL'}
          </button>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 14, flexWrap: 'wrap' }}>
          <div style={{ fontSize: 12, color: 'var(--text3)' }}>
            Showing {leads.length ? (page - 1) * pageSize + 1 : 0}-{Math.min(page * pageSize, total)} of {total} synced leads
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button className="btn btn-ghost" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1 || loading}>
              Prev
            </button>
            <div style={{ fontSize: 12, color: 'var(--text2)', minWidth: 72, textAlign: 'center' }}>
              Page {page} / {totalPages}
            </div>
            <button className="btn btn-ghost" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages || loading}>
              Next
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '340px 1fr', gap: 18, alignItems: 'start' }}>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {loading && <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>Loading leads…</div>}
            {!loading && leads.length === 0 && (
              <div style={{ padding: 20, color: 'var(--text3)', fontSize: 13 }}>
                No leads found. Click "Sync from GHL" to pull your contacts.
              </div>
            )}
            {leads.map((lead) => (
              <div key={lead._id} onClick={() => setSelected(lead)}
                style={{
                  padding: '12px 16px', borderBottom: '1px solid var(--border)',
                  cursor: 'pointer',
                  background: selected?._id === lead._id ? 'var(--bg3)' : 'transparent',
                  transition: 'background 0.1s',
                }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{fullName(lead)}</span>
                  {lead.aiSegment && (
                    <span style={{
                      fontSize: 10, padding: '2px 7px', borderRadius: 4,
                      background: 'var(--bg4)', color: SEGMENT_COLORS[lead.aiSegment] || 'var(--text3)',
                      border: '1px solid var(--border)', marginLeft: 'auto',
                    }}>
                      {lead.aiSegment}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text3)' }}>{lead.email}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                  {lead.aiScore !== null && lead.aiScore !== undefined && (
                    <span style={{ fontSize: 11, color: '#E8B84B', fontWeight: 500 }}>Score: {lead.aiScore}/100</span>
                  )}
                  <span style={{ fontSize: 11, color: OUTCOME_COLORS[lead.outcome] || 'var(--text3)', marginLeft: 'auto' }}>
                    {lead.outcome}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="output-card">
            <div className="card-header">
              <span className="card-title">{selected ? fullName(selected) : 'Select a lead'}</span>
              {selected && !selected.aiScore && (
                <button className="btn btn-primary" style={{ padding: '7px 16px', width: 'auto', fontSize: 12 }}
                  onClick={() => handleQualify(selected._id)}
                  disabled={qualifying === selected._id}>
                  {qualifying === selected._id ? 'Qualifying…' : '⚡ AI Qualify'}
                </button>
              )}
            </div>
            <div className="output-body">
              {!selected && (
                <div className="output-placeholder">
                  <div className="icon">🎯</div>
                  <p>Select a lead from the list to view details and take actions</p>
                </div>
              )}
              {selected && (
                <div className="fade-in">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 18 }}>
                    {[
                      { label: 'Email',  value: selected.email  || '—' },
                      { label: 'Phone',  value: selected.phone  || '—' },
                      { label: 'Source', value: selected.source || '—' },
                      { label: 'GHL ID', value: selected.ghlContactId },
                    ].map((f) => (
                      <div key={f.label} style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text)', wordBreak: 'break-all' }}>{f.value}</div>
                      </div>
                    ))}
                  </div>

                  {selected.tags?.length > 0 && (
                    <div style={{ marginBottom: 16 }}>
                      <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>GHL tags</div>
                      <div className="tag-row">
                        {selected.tags.map((t) => <span key={t} className="tag-pill">{t}</span>)}
                      </div>
                    </div>
                  )}

                  {selected.aiScore !== null && selected.aiScore !== undefined && (
                    <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, marginBottom: 16 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                        <div style={{ fontFamily: 'var(--font-display)', fontSize: 28, fontWeight: 800, color: '#E8B84B' }}>{selected.aiScore}</div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--text3)' }}>AI Score / 100</div>
                          <div style={{ fontSize: 14, fontWeight: 500, color: SEGMENT_COLORS[selected.aiSegment] || 'var(--text)', textTransform: 'capitalize' }}>{selected.aiSegment}</div>
                        </div>
                        {selected.recommendedTags?.length > 0 && (
                          <div style={{ marginLeft: 'auto' }}>
                            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 4 }}>Recommended tags</div>
                            <div className="tag-row" style={{ justifyContent: 'flex-end' }}>
                              {selected.recommendedTags.slice(0, 3).map((t) => <span key={t} className="tag-pill active">{t}</span>)}
                            </div>
                          </div>
                        )}
                      </div>
                      {selected.aiOutput && (
                        <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', maxHeight: 180, overflowY: 'auto' }}>
                          {selected.aiOutput}
                        </div>
                      )}
                    </div>
                  )}

                  {selected.aiScore !== null && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 16 }}>
                      <button className="btn btn-ghost" style={{ justifyContent: 'center', opacity: selected.tagsPushedToGHL ? 0.5 : 1 }}
                        onClick={() => handlePushTags(selected._id)} disabled={selected.tagsPushedToGHL}>
                        {selected.tagsPushedToGHL ? '✓ Tags pushed' : '⬆ Push tags to GHL'}
                      </button>
                      <button className="btn btn-ghost" style={{ justifyContent: 'center', opacity: selected.notePushedToGHL ? 0.5 : 1 }}
                        onClick={() => handlePushNote(selected._id)} disabled={selected.notePushedToGHL}>
                        {selected.notePushedToGHL ? '✓ Note pushed' : '📝 Push note to GHL'}
                      </button>
                      <button className="btn btn-ghost" style={{ justifyContent: 'center', opacity: selected.workflowTriggered ? 0.5 : 1 }}
                        onClick={() => handleTriggerWorkflow(selected._id, selected.recommendedFlow)}
                        disabled={selected.workflowTriggered || !selected.recommendedFlow}>
                        {selected.workflowTriggered ? '✓ Trigger applied' : selected.recommendedFlow ? '⚡ Apply trigger tag' : 'No trigger tag'}
                      </button>
                      <button className="btn btn-ghost" style={{ justifyContent: 'center' }}
                        onClick={() => handleQualify(selected._id)} disabled={qualifying === selected._id}>
                        {qualifying === selected._id ? 'Re-qualifying…' : '↻ Re-qualify'}
                      </button>
                    </div>
                  )}

                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Lead outcome</div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {OUTCOMES.map((o) => (
                        <button key={o} className="btn btn-ghost"
                          style={{ fontSize: 12, padding: '6px 14px', color: selected.outcome === o ? OUTCOME_COLORS[o] : 'var(--text3)', borderColor: selected.outcome === o ? OUTCOME_COLORS[o] : 'var(--border)' }}
                          onClick={() => handleSetOutcome(selected._id, o)}>
                          {o.charAt(0).toUpperCase() + o.slice(1)}
                        </button>
                      ))}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 8 }}>
                      Setting "Converted" or "Lost" trains the AI to improve future qualifications.
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
