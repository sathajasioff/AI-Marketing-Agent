import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import ContextBar from '../components/ui/ContextBar';
import OutputCard from '../components/ui/OutputCard';
import FeedbackBar from '../components/ui/FeedbackBar';
import BrandVoiceSelector from '../components/ui/BrandVoiceSelector';
import { useAgent } from '../hooks/useAgent';
import { runLeads } from '../services/api';
import api from '../services/api';

const ACTION_OPTIONS = [
  'Opted into freebie',
  'Visited ticket page',
  'Opened 3+ emails',
  'Clicked CTA button',
  'Replied to email',
  'Watched VSL',
  "Added to cart, didn't buy",
];

const SEGMENT_COLORS = {
  cold:   '#4A9EE8',
  warm:   '#E8B84B',
  hot:    '#E8714A',
  buyer:  '#3DBF8A',
};

const SOURCE_LABELS = {
  'meta-ad':  'Meta Ad',
  'organic':  'Organic',
  'referral': 'Referral',
  'email':    'Email',
  'other':    'Other',
};

// Map GHL source string to form source value
const mapSource = (src = '') => {
  const s = src.toLowerCase();
  if (s.includes('facebook') || s.includes('instagram') || s.includes('meta') || s.includes('fb')) return 'meta-ad';
  if (s.includes('organic') || s.includes('social'))   return 'organic';
  if (s.includes('referral') || s.includes('friend'))  return 'referral';
  if (s.includes('email'))                              return 'email';
  return 'other';
};

// Map GHL tags / industry to form industry value
const mapIndustry = (tags = [], customFields = {}) => {
  const all = [...tags].join(' ').toLowerCase();
  if (all.includes('realtor') || all.includes('real estate agent')) return 'realtor';
  if (all.includes('investor'))    return 'investor';
  if (all.includes('sales'))       return 'sales';
  if (all.includes('market'))      return 'marketer';
  if (all.includes('executive') || all.includes('manager')) return 'executive';
  return 'entrepreneur';
};

export default function LeadsPage() {
  const { output, loading, error, run, generationId } = useAgent(runLeads);

  const [brandVoiceId, setBrandVoiceId] = useState(null);

  // GHL leads state
  const [ghlLeads,       setGhlLeads]       = useState([]);
  const [ghlLoading,     setGhlLoading]      = useState(true);
  const [ghlError,       setGhlError]        = useState(null);
  const [selectedLead,   setSelectedLead]    = useState(null);
  const [inputMode,      setInputMode]       = useState('ghl'); // 'ghl' | 'manual'
  const [searchQuery,    setSearchQuery]     = useState('');
  const [segmentFilter,  setSegmentFilter]   = useState('all');

  // Form state
  const [form, setForm] = useState({
    name:     '',
    source:   'meta-ad',
    industry: 'entrepreneur',
    notes:    '',
  });
  const [actions, setActions] = useState([]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const toggleAction = (val) =>
    setActions((prev) =>
      prev.includes(val) ? prev.filter((a) => a !== val) : [...prev, val]
    );

  // ── Load GHL leads ──
  const loadGHLLeads = () => {
    setGhlLoading(true);
    setGhlError(null);
    api.get('/ghl/leads', { params: { limit: 100 } })
      .then(({ data }) => setGhlLeads(data.leads || []))
      .catch(() => setGhlError('Could not load GHL leads. Make sure GHL is connected.'))
      .finally(() => setGhlLoading(false));
  };

  useEffect(() => { loadGHLLeads(); }, []);

  // ── When user selects a GHL lead, auto-fill the form ──
  const handleSelectLead = (lead) => {
    setSelectedLead(lead);

    // Auto-populate form from GHL data
    const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.trim();
    const city     = lead.city ? `, ${lead.city}` : '';

    setForm({
      name:     `${fullName}${city}`,
      source:   mapSource(lead.source || ''),
      industry: mapIndustry(lead.tags || []),
      notes:    buildNotes(lead),
    });

    // Auto-tick actions based on GHL tags
    const autoActions = [];
    const tags = (lead.tags || []).join(' ').toLowerCase();
    if (tags.includes('opted') || tags.includes('optin'))         autoActions.push('Opted into freebie');
    if (tags.includes('ticket') || tags.includes('sales-page'))   autoActions.push('Visited ticket page');
    if (tags.includes('email-open'))                               autoActions.push('Opened 3+ emails');
    if (tags.includes('clicked') || tags.includes('cta'))         autoActions.push('Clicked CTA button');
    if (tags.includes('replied'))                                  autoActions.push('Replied to email');
    if (tags.includes('vsl') || tags.includes('watched'))         autoActions.push('Watched VSL');
    if (tags.includes('cart') || tags.includes('abandoned'))      autoActions.push("Added to cart, didn't buy");
    setActions(autoActions);
  };

  // Build a notes string from GHL lead data
  const buildNotes = (lead) => {
    const parts = [];
    if (lead.email)   parts.push(`Email: ${lead.email}`);
    if (lead.phone)   parts.push(`Phone: ${lead.phone}`);
    if (lead.tags?.length)  parts.push(`GHL Tags: ${lead.tags.join(', ')}`);
    if (lead.aiScore) parts.push(`Previous AI score: ${lead.aiScore}/100`);
    if (lead.aiSegment) parts.push(`Previous segment: ${lead.aiSegment}`);
    if (lead.aiOutput) parts.push(`Previous qualification: ${lead.aiOutput.slice(0, 300)}...`);
    return parts.join('\n');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name) return;
    run({
      ...form,
      actions:      actions.join(', ') || 'None recorded',
      brandVoiceId,
      ghlLeadId:    selectedLead?._id || null,
    });
  };

  const handleClearSelection = () => {
    setSelectedLead(null);
    setForm({ name: '', source: 'meta-ad', industry: 'entrepreneur', notes: '' });
    setActions([]);
  };

  // ── Filtered leads for display ──
  const filteredLeads = ghlLeads.filter((lead) => {
    const fullName = `${lead.firstName || ''} ${lead.lastName || ''}`.toLowerCase();
    const matchSearch = !searchQuery || fullName.includes(searchQuery.toLowerCase()) ||
      (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchSegment = segmentFilter === 'all' || lead.aiSegment === segmentFilter;
    return matchSearch && matchSegment;
  });

  const qualifiedCount   = ghlLeads.filter(l => l.aiScore !== null).length;
  const unqualifiedCount = ghlLeads.filter(l => l.aiScore === null).length;

  return (
    <>
      <Topbar title="Lead Qualification Agent" subtitle="Select a GHL lead and get an AI qualification report" />
      <div className="page-content fade-in">
        <ContextBar items={[
          { label: 'GHL Leads',    value: ghlLeads.length },
          { label: 'Qualified',    value: qualifiedCount },
          { label: 'Pending',      value: unqualifiedCount },
          { label: 'Brand Voice',  value: brandVoiceId ? 'Active' : 'Default' },
        ]} />

        <div className="agent-layout">

          {/* ── LEFT: Lead selector + form ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

            {/* ── Mode toggle ── */}
            <div className="agent-tabs" style={{ marginBottom: 0 }}>
              <div className={`agent-tab${inputMode === 'ghl' ? ' active' : ''}`}
                onClick={() => { setInputMode('ghl'); handleClearSelection(); }}>
                🔗 From GHL Pipeline
              </div>
              <div className={`agent-tab${inputMode === 'manual' ? ' active' : ''}`}
                onClick={() => { setInputMode('manual'); handleClearSelection(); }}>
                ✏️ Manual Entry
              </div>
            </div>

            {/* ══════════════════════════════
                GHL LEAD PICKER
            ══════════════════════════════ */}
            {inputMode === 'ghl' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>

                {/* Search + filter bar */}
                <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <input
                    value={searchQuery}
                    onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Search by name or email…"
                    style={{ flex: 1, fontSize: 12 }}
                  />
                  <select
                    value={segmentFilter}
                    onChange={e => setSegmentFilter(e.target.value)}
                    style={{ fontSize: 12, padding: '6px 8px', background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', outline: 'none', flexShrink: 0 }}>
                    <option value="all">All segments</option>
                    <option value="cold">Cold</option>
                    <option value="warm">Warm</option>
                    <option value="hot">Hot</option>
                    <option value="buyer">Buyer</option>
                  </select>
                  <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 10px', flexShrink: 0 }}
                    onClick={loadGHLLeads}>
                    ↻
                  </button>
                </div>

                {/* Segment filter pills */}
                <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {['all', 'cold', 'warm', 'hot', 'buyer'].map(seg => (
                    <button key={seg} onClick={() => setSegmentFilter(seg)}
                      style={{
                        padding: '3px 10px', borderRadius: 12, fontSize: 11, cursor: 'pointer',
                        border: `1px solid ${segmentFilter === seg ? (SEGMENT_COLORS[seg] || 'var(--gold)') : 'var(--border)'}`,
                        background: segmentFilter === seg ? `${SEGMENT_COLORS[seg] || 'var(--gold)'}18` : 'var(--bg4)',
                        color: segmentFilter === seg ? (SEGMENT_COLORS[seg] || 'var(--gold)') : 'var(--text3)',
                        fontWeight: segmentFilter === seg ? 600 : 400,
                        textTransform: 'capitalize',
                      }}>
                      {seg === 'all' ? 'All' : seg}
                    </button>
                  ))}
                </div>

                {/* Lead list */}
                <div style={{ maxHeight: 360, overflowY: 'auto' }}>
                  {ghlLoading && (
                    <div style={{ padding: '20px 16px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                      Loading leads from GHL…
                    </div>
                  )}
                  {ghlError && (
                    <div style={{ padding: '16px', fontSize: 12, color: '#E8714A', lineHeight: 1.6 }}>
                      ⚠ {ghlError}
                      <div style={{ marginTop: 8 }}>
                        <button className="btn btn-ghost" style={{ fontSize: 11 }} onClick={loadGHLLeads}>Retry</button>
                      </div>
                    </div>
                  )}
                  {!ghlLoading && !ghlError && filteredLeads.length === 0 && (
                    <div style={{ padding: '24px 16px', fontSize: 12, color: 'var(--text3)', textAlign: 'center' }}>
                      {ghlLeads.length === 0
                        ? 'No leads found. Go to GHL Pipeline and sync first.'
                        : 'No leads match your search or filter.'}
                    </div>
                  )}
                  {filteredLeads.map((lead) => {
                    const isSelected = selectedLead?._id === lead._id;
                    const fullName   = `${lead.firstName || ''} ${lead.lastName || ''}`.trim() || 'Unknown';
                    return (
                      <div
                        key={lead._id}
                        onClick={() => handleSelectLead(lead)}
                        style={{
                          padding: '11px 16px',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer',
                          background: isSelected ? 'rgba(201,151,58,0.08)' : 'transparent',
                          borderLeft: isSelected ? '3px solid #C9973A' : '3px solid transparent',
                          transition: 'all 0.1s',
                          display: 'flex', alignItems: 'center', gap: 12,
                        }}
                        onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'var(--bg3)'; }}
                        onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                      >
                        {/* Avatar */}
                        <div style={{
                          width: 34, height: 34, borderRadius: '50%', flexShrink: 0,
                          background: lead.aiSegment ? `${SEGMENT_COLORS[lead.aiSegment]}18` : 'var(--bg4)',
                          border: `1px solid ${lead.aiSegment ? SEGMENT_COLORS[lead.aiSegment] + '40' : 'var(--border)'}`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 700,
                          color: lead.aiSegment ? SEGMENT_COLORS[lead.aiSegment] : 'var(--text3)',
                        }}>
                          {(lead.firstName?.[0] || '?').toUpperCase()}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 2 }}>
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {fullName}
                            </span>
                            {lead.aiSegment && (
                              <span style={{
                                fontSize: 10, padding: '1px 6px', borderRadius: 8,
                                background: `${SEGMENT_COLORS[lead.aiSegment]}18`,
                                color: SEGMENT_COLORS[lead.aiSegment],
                                border: `1px solid ${SEGMENT_COLORS[lead.aiSegment]}35`,
                                textTransform: 'capitalize', flexShrink: 0,
                              }}>
                                {lead.aiSegment}
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: 11, color: 'var(--text3)', display: 'flex', gap: 8 }}>
                            <span>{lead.source || 'Unknown source'}</span>
                            {lead.tags?.length > 0 && (
                              <span style={{ color: 'var(--text3)', opacity: 0.7 }}>· {lead.tags.slice(0, 2).join(', ')}</span>
                            )}
                          </div>
                        </div>

                        {/* Score */}
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          {lead.aiScore !== null && lead.aiScore !== undefined ? (
                            <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: lead.aiSegment ? SEGMENT_COLORS[lead.aiSegment] : 'var(--text)' }}>
                              {lead.aiScore}
                            </div>
                          ) : (
                            <div style={{ fontSize: 10, color: 'var(--text3)', background: 'var(--bg4)', padding: '2px 7px', borderRadius: 8, border: '1px solid var(--border)' }}>
                              Not qualified
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Footer count */}
                <div style={{ padding: '8px 16px', borderTop: '1px solid var(--border)', fontSize: 11, color: 'var(--text3)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>{filteredLeads.length} leads shown</span>
                  <a href="/pipeline" style={{ color: 'var(--gold)', textDecoration: 'none', fontSize: 11 }}>
                    Manage in GHL Pipeline →
                  </a>
                </div>
              </div>
            )}

            {/* ══════════════════════════════
                QUALIFICATION FORM
            ══════════════════════════════ */}
            <form className="card" onSubmit={handleSubmit}>
              <div className="form-card-title">
                {inputMode === 'ghl' && selectedLead
                  ? `Qualify: ${selectedLead.firstName} ${selectedLead.lastName || ''}`
                  : 'Lead Information'}
                <span className="badge">Qualification</span>
              </div>

              {/* Selected lead summary banner */}
              {inputMode === 'ghl' && selectedLead && (
                <div style={{ background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 8, padding: '10px 14px', marginBottom: 16, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                    <strong style={{ color: 'var(--text)' }}>
                      {selectedLead.firstName} {selectedLead.lastName}
                    </strong>
                    {selectedLead.email && <span style={{ color: 'var(--text3)' }}> · {selectedLead.email}</span>}
                    <br />
                    <span style={{ fontSize: 11, color: 'var(--text3)' }}>
                      Source: {selectedLead.source || 'Unknown'}
                      {selectedLead.aiScore !== null && selectedLead.aiScore !== undefined
                        ? ` · Previous score: ${selectedLead.aiScore}/100`
                        : ' · First qualification'}
                    </span>
                  </div>
                  <button type="button" className="btn btn-ghost"
                    style={{ fontSize: 11, padding: '4px 10px', flexShrink: 0, marginLeft: 10 }}
                    onClick={handleClearSelection}>
                    Clear
                  </button>
                </div>
              )}

              {/* No lead selected prompt (GHL mode) */}
              {inputMode === 'ghl' && !selectedLead && (
                <div style={{ background: 'var(--bg3)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px', marginBottom: 16, fontSize: 12, color: 'var(--text3)', textAlign: 'center', lineHeight: 1.6 }}>
                  ↑ Select a lead from the list above to auto-fill this form
                </div>
              )}

              {/* Brand Voice */}
              <BrandVoiceSelector value={brandVoiceId} onChange={setBrandVoiceId} />

              {/* Name field — editable in both modes */}
              <div className="field">
                <label>Lead Name & Basic Info</label>
                <input
                  value={form.name}
                  onChange={set('name')}
                  placeholder="e.g. John Dupont, 38, Montreal"
                />
              </div>

              <div className="field">
                <label>How They Found the Event</label>
                <select value={form.source} onChange={set('source')}>
                  <option value="meta-ad">Meta Ad (Facebook/Instagram)</option>
                  <option value="organic">Organic social (post/story)</option>
                  <option value="referral">Referral from friend/colleague</option>
                  <option value="email">Email marketing</option>
                  <option value="other">Other / Unknown</option>
                </select>
              </div>

              <div className="field">
                <label>Lead's Industry / Profession</label>
                <select value={form.industry} onChange={set('industry')}>
                  <option value="realtor">Real Estate Agent</option>
                  <option value="investor">Real Estate Investor</option>
                  <option value="entrepreneur">Entrepreneur / Business Owner</option>
                  <option value="sales">Sales Professional</option>
                  <option value="marketer">Marketer</option>
                  <option value="executive">Executive / Manager</option>
                </select>
              </div>

              <div className="field">
                <label>Actions Taken</label>
                <div className="tag-row">
                  {ACTION_OPTIONS.map((a) => (
                    <div
                      key={a}
                      className={`tag-pill${actions.includes(a) ? ' active' : ''}`}
                      onClick={() => toggleAction(a)}
                    >
                      {a}
                    </div>
                  ))}
                </div>
              </div>

              <div className="field" style={{ marginTop: 12 }}>
                <label>Additional Notes / Context</label>
                <textarea
                  rows={3}
                  value={form.notes}
                  onChange={set('notes')}
                  placeholder="e.g. Said they're interested but need to check budget. Mentioned they did $2M in real estate last year."
                />
              </div>

              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || (inputMode === 'ghl' && !selectedLead && !form.name)}
              >
                {loading
                  ? 'Qualifying…'
                  : selectedLead
                  ? `⚡ Qualify ${selectedLead.firstName}`
                  : '⚡ Qualify This Lead'}
              </button>
            </form>
          </div>

          {/* ── RIGHT: Output ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* Empty state when nothing selected */}
            {!output && !loading && inputMode === 'ghl' && !selectedLead && (
              <div className="output-card">
                <div className="output-body">
                  <div className="output-placeholder">
                    <div className="icon">🎯</div>
                    <p>Select a lead from the GHL pipeline on the left, review their details, then click Qualify to get a full AI qualification report.</p>
                  </div>
                </div>
              </div>
            )}

            <OutputCard
              title={selectedLead
                ? `Qualification Report — ${selectedLead.firstName} ${selectedLead.lastName || ''}`
                : 'Qualification Report'}
              output={output}
              loading={loading}
              error={error}
              icon="🎯"
              generationId={generationId}
              agentType="leads"
              placeholder="Select a lead and qualify them"
            />

            {output && generationId && (
              <FeedbackBar generationId={generationId} agentType="leads" />
            )}
          </div>

        </div>
      </div>
    </>
  );
}