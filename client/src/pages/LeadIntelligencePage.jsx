import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import OutputCard from '../components/ui/OutputCard';
import { useToast } from '../context/ToastContext';
import api from '../services/api';

const TABS = [
  { id: 'ad-copy',  label: 'Ad copy from leads' },
  { id: 'email',    label: 'Personalize emails' },
  { id: 'strategy', label: 'Strategy from pipeline' },
  { id: 'patterns', label: 'Lead patterns' },
];

const SEGMENT_COLORS = {
  cold: '#4A9EE8', warm: '#E8B84B', hot: '#E8714A', buyer: '#3DBF8A',
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

export default function LeadIntelligencePage() {
  const { showToast } = useToast();
  const [tab,          setTab]          = useState('ad-copy');
  const [summary,      setSummary]      = useState(null);
  const [output,       setOutput]       = useState('');
  const [generationId, setGenerationId] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);
  const [bulkResults,  setBulkResults]  = useState([]);
  const [selectedLead, setSelectedLead] = useState(null);
  const [leads,        setLeads]        = useState([]);
  const [emailMode,    setEmailMode]    = useState('single');
  const [pushingEmail, setPushingEmail] = useState(null);

  const [adForm,    setAdForm]    = useState({ segment: 'all', adType: 'Top of Funnel — Cold', variants: '3' });
  const [bulkForm,  setBulkForm]  = useState({ segment: 'hot', maxLeads: '5' });
  const [stratForm, setStratForm] = useState({ goal: 'Sell 200 tickets', budget: '$2,000/mo', timeline: '60' });

  useEffect(() => {
    api.get('/intelligence/audience-summary')
      .then(({ data }) => setSummary(data.summary))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (tab === 'email' && emailMode === 'single') {
      api.get('/ghl/leads', { params: { limit: 50 } })
        .then(({ data }) => setLeads(data.leads.filter(l => l.aiScore !== null)))
        .catch(() => {});
    }
  }, [tab, emailMode]);

  const run = async (fn) => {
    setLoading(true);
    setError(null);
    setOutput('');
    setGenerationId(null);
    setBulkResults([]);
    try {
      const { data } = await fn();
      if (data.results) {
        setBulkResults(data.results);
      } else {
        setOutput(data.output || '');
        setGenerationId(data.generationId || null);
      }
    } catch (e) {
      setError(e.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handlePushEmailToGHL = async (leadId, emailContent) => {
    setPushingEmail(leadId);
    try {
      await api.post(`/intelligence/push-email-to-ghl/${leadId}`, { emailContent });
      showToast('✓ Email draft pushed to GHL contact note');
    } catch (e) {
      showToast(`⚠ ${e.response?.data?.message || 'Push failed'}`);
    } finally {
      setPushingEmail(null);
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text).then(() => showToast('✓ Copied!'));
  };

  const totalLeads     = summary?.total || 0;
  const qualifiedLeads = summary?.bySegment?.reduce((sum, s) => sum + (s._id ? s.count : 0), 0) || 0;
  const hotBuyer       = (summary?.bySegment?.find(s => s._id === 'hot')?.count || 0) +
                         (summary?.bySegment?.find(s => s._id === 'buyer')?.count || 0);

  return (
    <>
      <Topbar title="Lead Intelligence" subtitle="Use your GHL leads to create smarter content" />
      <div className="page-content fade-in">

        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 22 }}>
          {[
            { label: 'Total leads',  value: totalLeads },
            { label: 'AI qualified', value: qualifiedLeads },
            { label: 'Hot + buyer',  value: hotBuyer, gold: true },
            { label: 'Best source',  value: summary?.bySource?.[0]?._id || '—', sub: `${summary?.bySource?.[0]?.count || 0} leads` },
          ].map(s => (
            <div key={s.label} className={`stat-card${s.gold ? ' gold' : ''}`}>
              <div className="s-label">{s.label}</div>
              <div className="s-value" style={{ fontSize: typeof s.value === 'string' ? 16 : undefined, marginTop: typeof s.value === 'string' ? 6 : undefined }}>{s.value}</div>
              {s.sub && <div className="s-sub">{s.sub}</div>}
            </div>
          ))}
        </div>

        {totalLeads === 0 && (
          <div className="card" style={{ marginBottom: 20, padding: '14px 18px', borderColor: 'rgba(201,151,58,0.3)' }}>
            <div style={{ fontSize: 13, color: 'var(--text2)' }}>
              ⚠ No leads found. Go to <strong>GHL Pipeline</strong> → <strong>Sync from GHL</strong> → <strong>AI Qualify</strong> your leads first.
            </div>
          </div>
        )}

        <div className="agent-tabs" style={{ marginBottom: 22 }}>
          {TABS.map(t => (
            <div key={t.id}
              className={`agent-tab${tab === t.id ? ' active' : ''}`}
              onClick={() => { setTab(t.id); setOutput(''); setError(null); setBulkResults([]); }}>
              {t.label}
            </div>
          ))}
        </div>

        <div className="agent-layout">

          {/* ── LEFT: Forms ── */}
          <div>

            {/* AD COPY */}
            {tab === 'ad-copy' && (
              <div className="card">
                <div className="form-card-title">Ad copy from lead data <span className="badge">Uses real pain points</span></div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
                  Reads actual buying signals and objections from your GHL leads and writes ads that speak directly to what your specific leads care about.
                </div>
                <div className="field">
                  <label>Lead segment to target</label>
                  <select value={adForm.segment} onChange={e => setAdForm(f => ({ ...f, segment: e.target.value }))}>
                    <option value="all">All qualified leads</option>
                    <option value="cold">Cold leads</option>
                    <option value="warm">Warm leads</option>
                    <option value="hot">Hot leads</option>
                    <option value="buyer">Buyer-ready</option>
                  </select>
                </div>
                <div className="field">
                  <label>Ad type</label>
                  <select value={adForm.adType} onChange={e => setAdForm(f => ({ ...f, adType: e.target.value }))}>
                    <option>Top of Funnel — Cold</option>
                    <option>Middle of Funnel — Warm</option>
                    <option>Bottom of Funnel — Retargeting</option>
                    <option>Lookalike audience</option>
                  </select>
                </div>
                <div className="field">
                  <label>Number of variants</label>
                  <select value={adForm.variants} onChange={e => setAdForm(f => ({ ...f, variants: e.target.value }))}>
                    <option value="2">2 variants</option>
                    <option value="3">3 variants</option>
                    <option value="5">5 variants</option>
                  </select>
                </div>
                <button className="btn btn-primary"
                  onClick={() => run(() => api.post('/intelligence/ad-copy-from-leads', adForm))}
                  disabled={loading || !qualifiedLeads}>
                  {loading ? 'Analyzing leads + writing…' : '⚡ Generate from lead data'}
                </button>
                {!qualifiedLeads && <div style={{ fontSize: 11, color: '#E8714A', marginTop: 8 }}>Qualify leads first</div>}
              </div>
            )}

            {/* PERSONALIZED EMAIL */}
            {tab === 'email' && (
              <div className="card">
                <div className="form-card-title">Personalized emails <span className="badge">1-to-1 per lead</span></div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
                  Generate one email written specifically for each lead using their score, buying signals, and objections. Not a template.
                </div>
                <div className="agent-tabs" style={{ marginBottom: 16 }}>
                  <div className={`agent-tab${emailMode === 'single' ? ' active' : ''}`} onClick={() => setEmailMode('single')}>Single lead</div>
                  <div className={`agent-tab${emailMode === 'bulk'   ? ' active' : ''}`} onClick={() => setEmailMode('bulk')}>Bulk by segment</div>
                </div>

                {emailMode === 'single' && (
                  <>
                    <div className="field">
                      <label>Select a lead ({leads.length} qualified)</label>
                      <select onChange={e => setSelectedLead(leads.find(l => l._id === e.target.value) || null)}>
                        <option value="">— Choose a lead —</option>
                        {leads.map(l => (
                          <option key={l._id} value={l._id}>
                            {l.firstName} {l.lastName} — {l.aiSegment} ({l.aiScore}/100)
                          </option>
                        ))}
                      </select>
                    </div>
                    {selectedLead && (
                      <div style={{ background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8, border: '1px solid var(--border)', marginBottom: 14, fontSize: 12, color: 'var(--text2)', lineHeight: 1.7 }}>
                        <strong style={{ color: SEGMENT_COLORS[selectedLead.aiSegment] }}>{selectedLead.aiSegment?.toUpperCase()} — {selectedLead.aiScore}/100</strong><br/>
                        Source: {selectedLead.source || 'Unknown'}<br/>
                        Tags: {selectedLead.tags?.join(', ') || 'None'}
                      </div>
                    )}
                    <button className="btn btn-primary"
                      onClick={() => { if (!selectedLead) return showToast('⚠ Select a lead first'); run(() => api.post(`/intelligence/email-lead/${selectedLead._id}`)); }}
                      disabled={loading || !selectedLead}>
                      {loading ? 'Writing personalized email…' : '⚡ Generate personal email'}
                    </button>
                  </>
                )}

                {emailMode === 'bulk' && (
                  <>
                    <div className="field">
                      <label>Segment to email</label>
                      <select value={bulkForm.segment} onChange={e => setBulkForm(f => ({ ...f, segment: e.target.value }))}>
                        <option value="all">All qualified</option>
                        <option value="hot">Hot leads</option>
                        <option value="warm">Warm leads</option>
                        <option value="buyer">Buyer-ready</option>
                        <option value="cold">Cold leads</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Max leads to process</label>
                      <select value={bulkForm.maxLeads} onChange={e => setBulkForm(f => ({ ...f, maxLeads: e.target.value }))}>
                        <option value="5">5 leads</option>
                        <option value="10">10 leads</option>
                        <option value="20">20 leads</option>
                      </select>
                    </div>
                    <button className="btn btn-primary"
                      onClick={() => run(() => api.post('/intelligence/bulk-email', bulkForm))}
                      disabled={loading}>
                      {loading ? 'Generating emails…' : '⚡ Generate bulk emails'}
                    </button>
                  </>
                )}
              </div>
            )}

            {/* STRATEGY FROM PIPELINE */}
            {tab === 'strategy' && (
              <div className="card">
                <div className="form-card-title">Strategy from pipeline <span className="badge">Uses real data</span></div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
                  Reads your actual pipeline — segments, sources, conversion rates — and builds strategy around your real situation.
                </div>
                {summary && (
                  <div style={{ background: 'var(--bg3)', borderRadius: 8, padding: '12px 14px', marginBottom: 16, border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>Your current pipeline</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {summary.bySegment?.filter(s => s._id).map(s => (
                        <div key={s._id} style={{ fontSize: 12, padding: '4px 10px', borderRadius: 6, background: 'var(--bg4)', border: '1px solid var(--border)', color: SEGMENT_COLORS[s._id] || 'var(--text3)' }}>
                          {s._id}: {s.count} leads
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="field">
                  <label>Campaign goal</label>
                  <input value={stratForm.goal} onChange={e => setStratForm(f => ({ ...f, goal: e.target.value }))} placeholder="e.g. Sell 200 tickets" />
                </div>
                <div className="field-row">
                  <div className="field">
                    <label>Monthly budget</label>
                    <input value={stratForm.budget} onChange={e => setStratForm(f => ({ ...f, budget: e.target.value }))} placeholder="$2,000/mo" />
                  </div>
                  <div className="field">
                    <label>Days to event</label>
                    <select value={stratForm.timeline} onChange={e => setStratForm(f => ({ ...f, timeline: e.target.value }))}>
                      <option value="30">30 days</option>
                      <option value="60">60 days</option>
                      <option value="90">90 days</option>
                    </select>
                  </div>
                </div>
                <button className="btn btn-primary"
                  onClick={() => run(() => api.post('/intelligence/strategy-from-pipeline', stratForm))}
                  disabled={loading}>
                  {loading ? 'Reading pipeline + building strategy…' : '⚡ Generate data-driven strategy'}
                </button>
              </div>
            )}

            {/* PATTERNS */}
            {tab === 'patterns' && (
              <div className="card">
                <div className="form-card-title">Lead pattern analysis <span className="badge">AI reads all data</span></div>
                <div style={{ fontSize: 12, color: 'var(--text3)', marginBottom: 16, lineHeight: 1.6 }}>
                  Claude reads all your qualified leads and finds patterns — best sources, top objections, what's working, what to kill, hidden opportunities.
                </div>
                {summary && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                    {[
                      { label: 'Total leads',    value: totalLeads },
                      { label: 'Qualified',       value: qualifiedLeads },
                      { label: 'With outcomes',   value: summary.byOutcome?.filter(o => o._id !== 'pending').reduce((s, o) => s + o.count, 0) || 0 },
                      { label: 'Sources tracked', value: summary.bySource?.length || 0 },
                    ].map(s => (
                      <div key={s.label} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 7, border: '1px solid var(--border)' }}>
                        <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{s.label}</div>
                        <div style={{ fontSize: 18, fontFamily: 'var(--font-display)', fontWeight: 700 }}>{s.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                <button className="btn btn-primary"
                  onClick={() => run(() => api.get('/intelligence/patterns'))}
                  disabled={loading || qualifiedLeads < 5}>
                  {loading ? 'Analyzing all leads…' : '⚡ Analyze lead patterns'}
                </button>
                {qualifiedLeads < 5 && (
                  <div style={{ fontSize: 11, color: '#E8714A', marginTop: 8 }}>Need at least 5 qualified leads. You have {qualifiedLeads}.</div>
                )}
              </div>
            )}
          </div>

          {/* ── RIGHT: Output ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Bulk results */}
            {bulkResults.length > 0 && (
              <div className="output-card">
                <div className="card-header">
                  <span className="card-title">{bulkResults.length} personalized emails generated</span>
                  <button className="btn btn-ghost"
                    onClick={() => handleCopy(bulkResults.map(r => `=== ${r.leadName} (${r.email}) ===\n${r.output}`).join('\n\n'))}>
                    Copy all
                  </button>
                </div>
                <div className="output-body" style={{ maxHeight: 600 }}>
                  {bulkResults.map((result, i) => (
                    <div key={i} style={{ padding: '16px 0', borderBottom: '1px solid var(--border)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 600 }}>{result.leadName}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{result.email} · {result.aiScore}/100 · {result.aiSegment}</div>
                        </div>
                        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => handleCopy(result.output)}>Copy</button>
                          {result.status === 'generated' && (
                            <button className="btn btn-ghost"
                              style={{ fontSize: 11, padding: '4px 10px', color: '#2ABFAA', borderColor: '#2ABFAA', opacity: pushingEmail === result.leadId ? 0.5 : 1 }}
                              onClick={() => handlePushEmailToGHL(result.leadId, result.output)}
                              disabled={pushingEmail === result.leadId}>
                              {pushingEmail === result.leadId ? 'Pushing…' : '⬆ Push to GHL'}
                            </button>
                          )}
                        </div>
                      </div>
                      {result.status === 'generated'
                        ? <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.7, whiteSpace: 'pre-wrap', background: 'var(--bg3)', padding: '10px 14px', borderRadius: 8 }}>{result.output}</div>
                        : <div style={{ fontSize: 12, color: '#E8714A' }}>Generation failed for this lead</div>
                      }
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Single output */}
            {!bulkResults.length && (
              <div className="output-card">
                <div className="card-header">
                  <span className="card-title">
                    {tab === 'ad-copy'  && 'Ad copy built from your lead data'}
                    {tab === 'email'    && 'Personalized email'}
                    {tab === 'strategy' && 'Data-driven strategy'}
                    {tab === 'patterns' && 'Lead pattern insights'}
                  </span>
                  {output && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-ghost" onClick={() => handleCopy(output)}>Copy</button>
                      {tab === 'email' && selectedLead && output && (
                        <button className="btn btn-ghost"
                          style={{ color: '#2ABFAA', borderColor: '#2ABFAA', opacity: pushingEmail === selectedLead._id ? 0.5 : 1 }}
                          onClick={() => handlePushEmailToGHL(selectedLead._id, output)}
                          disabled={pushingEmail === selectedLead._id}>
                          {pushingEmail === selectedLead._id ? 'Pushing…' : '⬆ Push to GHL'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
                <div className="output-body">
                  {loading && (
                    <div className="loading-wrap">
                      <div className="loading-dots"><span/><span/><span/></div>
                      <span>
                        {tab === 'ad-copy'  && 'Reading your lead data and writing copy…'}
                        {tab === 'email'    && 'Writing a personal email for this specific lead…'}
                        {tab === 'strategy' && 'Analyzing your real pipeline…'}
                        {tab === 'patterns' && 'Reading all your leads and finding patterns…'}
                      </span>
                    </div>
                  )}
                  {!loading && error && <div style={{ color: '#E8714A', fontSize: 13 }}>⚠ {error}</div>}
                  {!loading && !error && output && (
                    <div className="ai-output fade-in" dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }} />
                  )}
                  {!loading && !error && !output && (
                    <div className="output-placeholder">
                      <div className="icon">
                        {tab === 'ad-copy'  && '🎯'}
                        {tab === 'email'    && '✉️'}
                        {tab === 'strategy' && '📊'}
                        {tab === 'patterns' && '🧠'}
                      </div>
                      <p>
                        {tab === 'ad-copy'  && 'Your lead data will be used to write ads that speak directly to what your actual leads care about'}
                        {tab === 'email'    && 'Select a lead and generate an email written just for them'}
                        {tab === 'strategy' && 'Your real pipeline data will drive the strategy'}
                        {tab === 'patterns' && 'Claude will read all your qualified leads and tell you exactly what to do next'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}