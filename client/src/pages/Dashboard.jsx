import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { useSettings } from '../context/SettingsContext';
import api from '../services/api';

const SEGMENT_COLORS = {
  cold:   '#4A9EE8',
  warm:   '#E8B84B',
  hot:    '#E8714A',
  buyer:  '#3DBF8A',
  null:   '#5C5850',
};

const OUTCOME_COLORS = {
  pending:   '#5C5850',
  nurturing: '#4A9EE8',
  converted: '#3DBF8A',
  lost:      '#E8714A',
};

// ── Mini bar chart component ──
function BarChart({ data, colorKey, labelKey = '_id', valueKey = 'count', height = 140 }) {
  const max = Math.max(...data.map(d => d[valueKey]), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height, paddingTop: 8 }}>
      {data.map((d, i) => {
        const pct   = Math.round((d[valueKey] / max) * 100);
        const label = d[labelKey] || 'unknown';
        const color = colorKey ? (colorKey[label] || '#4A9EE8') : '#4A9EE8';
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text2)' }}>{d[valueKey]}</div>
            <div style={{
              width: '100%', height: `${Math.max(pct, 4)}%`,
              background: color, borderRadius: '4px 4px 0 0',
              opacity: 0.85, transition: 'height 0.5s ease',
              minHeight: 4,
            }} />
            <div style={{ fontSize: 10, color: 'var(--text3)', textAlign: 'center', textTransform: 'capitalize' }}>
              {label.length > 10 ? label.slice(0, 9) + '…' : label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Donut chart component ──
function DonutChart({ data, colorKey, labelKey = '_id', valueKey = 'count', size = 140 }) {
  const total  = data.reduce((s, d) => s + d[valueKey], 0);
  if (!total) return <div style={{ textAlign: 'center', color: 'var(--text3)', fontSize: 12, padding: 20 }}>No data yet</div>;

  let cumulative = 0;
  const radius   = 52;
  const cx = size / 2;
  const cy = size / 2;

  const slices = data.map((d) => {
    const pct   = d[valueKey] / total;
    const start = cumulative * 2 * Math.PI - Math.PI / 2;
    cumulative  += pct;
    const end   = cumulative * 2 * Math.PI - Math.PI / 2;
    const x1 = cx + radius * Math.cos(start);
    const y1 = cy + radius * Math.sin(start);
    const x2 = cx + radius * Math.cos(end);
    const y2 = cy + radius * Math.sin(end);
    const large = pct > 0.5 ? 1 : 0;
    const label = d[labelKey] || 'unknown';
    const color = colorKey ? (colorKey[label] || '#4A9EE8') : '#4A9EE8';
    return { d: `M ${cx} ${cy} L ${x1} ${y1} A ${radius} ${radius} 0 ${large} 1 ${x2} ${y2} Z`, color, label, count: d[valueKey], pct };
  });

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <svg width={size} height={size} style={{ flexShrink: 0 }}>
        {slices.map((s, i) => (
          <path key={i} d={s.d} fill={s.color} opacity={0.85} stroke="var(--bg2)" strokeWidth="2" />
        ))}
        <circle cx={cx} cy={cy} r={32} fill="var(--bg2)" />
        <text x={cx} y={cy - 6} textAnchor="middle" fontSize="14" fontWeight="700" fill="var(--text)" fontFamily="var(--font-display)">{total}</text>
        <text x={cx} y={cy + 10} textAnchor="middle" fontSize="9" fill="var(--text3)" fontFamily="var(--font-body)">total</text>
      </svg>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
        {slices.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 8, height: 8, borderRadius: 2, background: s.color, flexShrink: 0 }} />
            <span style={{ fontSize: 11, color: 'var(--text2)', textTransform: 'capitalize', flex: 1 }}>{s.label}</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text)' }}>{s.count}</span>
            <span style={{ fontSize: 10, color: 'var(--text3)' }}>{Math.round(s.pct * 100)}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Trend sparkline ──
function Sparkline({ data, color = '#4A9EE8', valueKey = 'count', height = 50 }) {
  if (!data.length) return null;
  const max    = Math.max(...data.map(d => d[valueKey]), 1);
  const width  = 200;
  const padX   = 4;
  const padY   = 4;
  const points = data.map((d, i) => {
    const x = padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2);
    const y = padY + (1 - d[valueKey] / max) * (height - padY * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      {data.map((d, i) => {
        const x = padX + (i / Math.max(data.length - 1, 1)) * (width - padX * 2);
        const y = padY + (1 - d[valueKey] / max) * (height - padY * 2);
        return <circle key={i} cx={x} cy={y} r="2.5" fill={color} />;
      })}
    </svg>
  );
}

// ── Stat card ──
function StatCard({ label, value, sub, color, trend, trendData }) {
  return (
    <div className="stat-card" style={{ borderColor: color ? `${color}40` : undefined }}>
      <div className="s-label">{label}</div>
      <div className="s-value" style={{ color: color || 'var(--text)', fontSize: typeof value === 'string' && value.length > 5 ? 20 : undefined, marginTop: 4 }}>
        {value}
      </div>
      {sub && <div className="s-sub">{sub}</div>}
      {trendData?.length > 1 && (
        <div style={{ marginTop: 8 }}>
          <Sparkline data={trendData} color={color || '#4A9EE8'} />
        </div>
      )}
    </div>
  );
}
function MetaQuickView() {
  const navigate            = useNavigate();
  const [data,    setData]  = useState(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState(null);

  useEffect(() => {
    api.get('/meta/summary', { params: { datePreset: 'last_7d' } })
      .then(({ data: res }) => setData(res.summary))
      .catch(err => setError(err.response?.data?.message || 'Not connected'))
      .finally(() => setLoading(false));
  }, []);

  // Not connected
  if (!loading && error) {
    return (
      <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1877F2,#0C5BB5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📘</div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Meta Ads</div>
              <div style={{ fontSize: 11, color: 'var(--text3)' }}>Not connected</div>
            </div>
          </div>
          <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}
            onClick={() => navigate('/integrations')}>
            Connect →
          </button>
        </div>
      </div>
    );
  }

  const metrics = [
    { label: 'Spend',       value: loading ? '—' : `$${data?.spend || '0.00'}`,         color: '#E8714A' },
    { label: 'Impressions', value: loading ? '—' : parseInt(data?.impressions || 0).toLocaleString(), color: '#9B7CE8' },
    { label: 'Clicks',      value: loading ? '—' : parseInt(data?.clicks || 0).toLocaleString(),      color: '#4A9EE8' },
    { label: 'CTR',         value: loading ? '—' : `${data?.ctr || '0.00'}%`,           color: '#E8B84B' },
    { label: 'CPC',         value: loading ? '—' : `$${data?.cpc || '0.00'}`,           color: 'var(--text)' },
    { label: 'Leads',       value: loading ? '—' : data?.leads || 0,                    color: '#3DBF8A' },
    { label: 'CPL',         value: loading ? '—' : data?.cpl > 0 ? `$${data?.cpl}` : '—', color: '#3DBF8A' },
  ];

  return (
    <div style={{ background: 'var(--bg2)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px 20px', marginBottom: 20 }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg,#1877F2,#0C5BB5)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>📘</div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Meta Ads</div>
            <div style={{ fontSize: 11, color: 'var(--text3)' }}>Last 7 days</div>
          </div>
          {!loading && (
            <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 10, background: 'rgba(61,191,138,0.12)', color: '#3DBF8A', border: '1px solid rgba(61,191,138,0.25)' }}>
              Live
            </span>
          )}
        </div>
        <button className="btn btn-ghost" style={{ fontSize: 11, padding: '5px 12px' }}
          onClick={() => navigate('/meta')}>
          Full report →
        </button>
      </div>

      {/* Metrics row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', gap: 10 }}>
        {metrics.map((m) => (
          <div key={m.label} style={{ textAlign: 'center' }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: m.color, marginBottom: 3 }}>
              {m.value}
            </div>
            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {m.label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const agents = [
  { to: '/strategy',     color: '#9B7CE8', icon: '🧠', title: 'Strategy Agent',    desc: 'Build campaign strategy from your goals and pipeline data.' },
  { to: '/content',      color: '#E8714A', icon: '✍️', title: 'Content & Copy',     desc: 'Generate Meta ads, funnel pages, VSL scripts, social content.' },
  { to: '/email',        color: '#2ABFAA', icon: '📧', title: 'Email Agent',         desc: 'Build GHL-ready email sequences for every lead segment.' },
  { to: '/intelligence', color: '#E8B84B', icon: '🧬', title: 'Lead Intelligence',  desc: 'Use your real leads to generate ads, emails and strategy.' },
];

export default function Dashboard() {
  const navigate     = useNavigate();
  const { settings } = useSettings();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error,   setError]   = useState(null);

  const fetchDashboard = () => {
    setLoading(true);
    api.get('/ghl/dashboard')
      .then(({ data: res }) => { setData(res.data); setError(null); })
      .catch(() => setError('Could not load dashboard data. Make sure your server is running.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDashboard(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      await api.post('/ghl/sync');
      fetchDashboard();
    } catch {
      setError('GHL sync failed — check your API key in .env');
    } finally {
      setSyncing(false);
    }
  };

  const stats    = data?.stats || {};
  const trend    = data?.conversionTrend || [];
  const segments = data?.bySegment?.filter(s => s._id) || [];
  const sources  = data?.bySource || [];
  const outcomes = data?.byOutcome || [];
  const recent   = data?.recentLeads || [];

  const noLeads  = !loading && stats.totalLeads === 0;

  return (
    <>
      <Topbar title="Dashboard" subtitle={`${settings.eventName} — AI Marketing Command Center`} />
      <div className="page-content fade-in">

        {/* Error banner */}
        {error && (
          <div style={{ background: 'rgba(232,113,74,0.1)', border: '1px solid rgba(232,113,74,0.3)', borderRadius: 8, padding: '12px 16px', marginBottom: 18, fontSize: 13, color: '#E8714A' }}>
            ⚠ {error}
          </div>
        )}

        {/* No leads banner */}
        {noLeads && !error && (
          <div style={{ background: 'rgba(201,151,58,0.08)', border: '1px solid rgba(201,151,58,0.25)', borderRadius: 10, padding: '16px 20px', marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 4 }}>No leads yet — connect your GHL subaccount</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Click Sync from GHL to pull your contacts and unlock all dashboard data.</div>
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '9px 20px', flexShrink: 0, marginLeft: 16 }} onClick={handleSync} disabled={syncing}>
              {syncing ? 'Syncing…' : '⟳ Sync from GHL'}
            </button>
          </div>
        )}

        <MetaQuickView />

        {/* ── Top stat row ── */}
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
          <StatCard
            label="Total leads"
            value={loading ? '—' : stats.totalLeads || 0}
            sub="From GHL subaccount"
            color="#4A9EE8"
            trendData={trend}
          />
          <StatCard
            label="AI qualified"
            value={loading ? '—' : stats.qualifiedCount || 0}
            sub={`${stats.totalLeads > 0 ? Math.round((stats.qualifiedCount / stats.totalLeads) * 100) : 0}% of total`}
            color="#9B7CE8"
          />
          <StatCard
            label="Hot + buyer"
            value={loading ? '—' : stats.hotBuyer || 0}
            sub="Ready to close"
            color="#E8714A"
          />
          <StatCard
            label="Conversion rate"
            value={loading ? '—' : `${stats.convRate || 0}%`}
            sub={`${stats.converted || 0} converted`}
            color="#3DBF8A"
          />
        </div>

        {/* ── Second stat row ── */}
        <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 26 }}>
          <StatCard
            label="Avg AI score"
            value={loading ? '—' : `${stats.avgScore || 0}/100`}
            sub="Across all qualified leads"
            color="#E8B84B"
          />
          <StatCard
            label="Pending follow-up"
            value={loading ? '—' : outcomes.find(o => o._id === 'pending')?.count || 0}
            sub="Leads with no outcome set"
            color="#5C5850"
          />
          <StatCard
            label="Nurturing"
            value={loading ? '—' : outcomes.find(o => o._id === 'nurturing')?.count || 0}
            sub="In active sequences"
            color="#4A9EE8"
          />
          <StatCard
            label="Lost leads"
            value={loading ? '—' : outcomes.find(o => o._id === 'lost')?.count || 0}
            sub="Marked as lost"
            color="#E8714A"
          />
        </div>

        {/* ── Charts row ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Lead segments donut */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
              Lead segments
            </div>
            {loading
              ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>Loading…</div>
              : segments.length
                ? <DonutChart data={segments} colorKey={SEGMENT_COLORS} />
                : <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0' }}>No qualified leads yet</div>
            }
          </div>

          {/* Lead sources bar chart */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--text)' }}>
              Lead sources
            </div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 12 }}>Where your leads are coming from</div>
            {loading
              ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>Loading…</div>
              : sources.length
                ? <BarChart data={sources} height={140} />
                : <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0' }}>No source data yet</div>
            }
          </div>

          {/* Outcomes donut */}
          <div className="card">
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 16, color: 'var(--text)' }}>
              Lead outcomes
            </div>
            {loading
              ? <div style={{ color: 'var(--text3)', fontSize: 12 }}>Loading…</div>
              : outcomes.length
                ? <DonutChart data={outcomes} colorKey={OUTCOME_COLORS} />
                : <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0' }}>No outcomes recorded yet</div>
            }
          </div>
        </div>

        {/* ── Trend chart ── */}
        {trend.length > 1 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Lead activity — last 14 days</div>
            <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>New leads added per day</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(14, 1fr)', gap: 6, alignItems: 'flex-end', height: 80 }}>
              {(() => {
                const maxCount = Math.max(...trend.map(t => t.count), 1);
                return trend.map((t, i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
                    <div style={{ fontSize: 9, color: 'var(--text3)', fontWeight: 600 }}>{t.count > 0 ? t.count : ''}</div>
                    <div style={{
                      width: '100%', minHeight: 4,
                      height: `${Math.max((t.count / maxCount) * 100, 5)}%`,
                      background: '#4A9EE8', borderRadius: '3px 3px 0 0', opacity: 0.7,
                    }} />
                    <div style={{ fontSize: 8, color: 'var(--text3)', transform: 'rotate(-45deg)', transformOrigin: 'top left', marginTop: 4, whiteSpace: 'nowrap' }}>
                      {t._id?.slice(5)}
                    </div>
                  </div>
                ));
              })()}
            </div>
          </div>
        )}

        {/* ── Bottom row: Recent leads + Agent cards ── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 16, marginBottom: 20 }}>

          {/* Recent leads table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ padding: '16px 18px 12px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600 }}>Recent leads</div>
              <button className="btn btn-ghost" style={{ fontSize: 11, padding: '4px 10px' }} onClick={() => navigate('/pipeline')}>
                View all →
              </button>
            </div>
            {loading && <div style={{ padding: '16px 18px', fontSize: 12, color: 'var(--text3)' }}>Loading…</div>}
            {!loading && !recent.length && (
              <div style={{ padding: '20px 18px', fontSize: 12, color: 'var(--text3)' }}>
                No leads yet. Sync from GHL to see them here.
              </div>
            )}
            {recent.map((lead, i) => (
              <div key={lead._id || i} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '11px 18px', borderBottom: '1px solid var(--border)',
                cursor: 'pointer', transition: 'background 0.1s',
              }}
                onClick={() => navigate('/pipeline')}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg3)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Avatar */}
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                  background: SEGMENT_COLORS[lead.aiSegment] ? `${SEGMENT_COLORS[lead.aiSegment]}20` : 'var(--bg4)',
                  border: `1px solid ${SEGMENT_COLORS[lead.aiSegment] || 'var(--border)'}40`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 12, fontWeight: 600, color: SEGMENT_COLORS[lead.aiSegment] || 'var(--text3)',
                }}>
                  {(lead.firstName?.[0] || '?').toUpperCase()}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lead.firstName} {lead.lastName}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text3)' }}>{lead.source || 'Unknown source'}</div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  {lead.aiScore !== null && lead.aiScore !== undefined
                    ? <div style={{ fontSize: 13, fontWeight: 700, color: SEGMENT_COLORS[lead.aiSegment] || 'var(--text3)', fontFamily: 'var(--font-display)' }}>{lead.aiScore}</div>
                    : <div style={{ fontSize: 11, color: 'var(--text3)' }}>Not qualified</div>
                  }
                  <div style={{ fontSize: 10, color: OUTCOME_COLORS[lead.outcome] || 'var(--text3)', textTransform: 'capitalize' }}>{lead.outcome || 'pending'}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Quick actions — agent cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Quick actions</div>
            {agents.map((a) => (
              <div
                key={a.to}
                onClick={() => navigate(a.to)}
                style={{
                  background: 'var(--bg2)', border: '1px solid var(--border)',
                  borderLeft: `3px solid ${a.color}`,
                  borderRadius: '0 8px 8px 0',
                  padding: '12px 16px', cursor: 'pointer',
                  transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: 12,
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg3)'; e.currentTarget.style.transform = 'translateX(2px)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg2)'; e.currentTarget.style.transform = 'none'; }}
              >
                <span style={{ fontSize: 18, flexShrink: 0 }}>{a.icon}</span>
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>{a.title}</div>
                  <div style={{ fontSize: 11, color: 'var(--text3)', lineHeight: 1.4 }}>{a.desc}</div>
                </div>
                <div style={{ marginLeft: 'auto', color: 'var(--text3)', fontSize: 14, flexShrink: 0 }}>→</div>
              </div>
            ))}

            {/* Sync button */}
            <button
              className="btn btn-ghost"
              style={{ marginTop: 4, justifyContent: 'center', borderStyle: 'dashed' }}
              onClick={handleSync}
              disabled={syncing}
            >
              {syncing ? '⟳ Syncing from GHL…' : '⟳ Sync leads from GHL'}
            </button>
          </div>
        </div>

        {/* ── Funnel visualization ── */}
        {segments.length > 0 && (
          <div className="card" style={{ marginBottom: 20 }}>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 16 }}>Conversion funnel</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
              {[
                { label: 'Total',     value: stats.totalLeads || 0,    color: '#4A9EE8' },
                { label: 'Qualified', value: stats.qualifiedCount || 0, color: '#9B7CE8' },
                { label: 'Warm+',     value: (segments.find(s => s._id === 'warm')?.count || 0) + (segments.find(s => s._id === 'hot')?.count || 0) + (segments.find(s => s._id === 'buyer')?.count || 0), color: '#E8B84B' },
                { label: 'Hot+Buyer', value: stats.hotBuyer || 0,       color: '#E8714A' },
                { label: 'Converted', value: stats.converted || 0,      color: '#3DBF8A' },
              ].map((stage, i, arr) => {
                const maxVal = arr[0].value || 1;
                const width  = Math.max(Math.round((stage.value / maxVal) * 100), 8);
                return (
                  <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: stage.color }}>{stage.value}</div>
                    <div style={{ width: '100%', height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div style={{
                        width: `${width}%`, height: '100%',
                        background: stage.color, opacity: 0.75, borderRadius: 4,
                        minWidth: 8, transition: 'width 0.5s ease',
                      }} />
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>{stage.label}</div>
                    {i < arr.length - 1 && arr[i + 1].value > 0 && arr[i].value > 0 && (
                      <div style={{ fontSize: 10, color: 'var(--text3)' }}>
                        {Math.round((arr[i + 1].value / arr[i].value) * 100)}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

      </div>
    </>
  );
}
