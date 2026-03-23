import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';

// ── Helpers ──
const fmt  = (n, dec = 2) => parseFloat(n || 0).toFixed(dec);
const fmtN = (n) => parseInt(n || 0).toLocaleString();
const fmtD = (n) => `$${fmt(n)}`;

// ── Stat card ──
function Stat({ label, value, sub, color = 'var(--text)' }) {
  return (
    <div className="stat-card">
      <div className="s-label">{label}</div>
      <div className="s-value" style={{ color, fontSize: String(value).length > 8 ? 18 : undefined, marginTop: 4 }}>
        {value}
      </div>
      {sub && <div className="s-sub">{sub}</div>}
    </div>
  );
}

// ── Trend line ──
function TrendLine({ data, valueKey, color = '#4A9EE8', height = 80 }) {
  if (!data.length) return <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0' }}>No data</div>;
  const max  = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)), 1);
  const W    = 600, H = height, pad = 8;
  const pts  = data.map((d, i) => {
    const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
    const y = pad + (1 - parseFloat(d[valueKey] || 0) / max) * (H - pad * 2);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" style={{ display: 'block' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((d, i) => {
          const x = pad + (i / Math.max(data.length - 1, 1)) * (W - pad * 2);
          const y = pad + (1 - parseFloat(d[valueKey] || 0) / max) * (H - pad * 2);
          return <circle key={i} cx={x} cy={y} r="3" fill={color} />;
        })}
      </svg>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
        {[data[0], data[Math.floor(data.length / 2)], data[data.length - 1]].filter(Boolean).map((d, i) => (
          <div key={i} style={{ fontSize: 10, color: 'var(--text3)' }}>
            {d.date_start?.slice(5) || ''}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bar chart ──
function BarChart({ data, valueKey, labelKey, color = '#4A9EE8', height = 130 }) {
  const max = Math.max(...data.map(d => parseFloat(d[valueKey] || 0)), 1);
  return (
    <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height }}>
      {data.map((d, i) => {
        const pct   = (parseFloat(d[valueKey] || 0) / max) * 100;
        const label = String(d[labelKey] || '').slice(0, 10);
        return (
          <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, height: '100%', justifyContent: 'flex-end' }}>
            <div style={{ fontSize: 9, fontWeight: 600, color: 'var(--text2)' }}>{parseFloat(d[valueKey] || 0).toFixed(1)}</div>
            <div style={{ width: '100%', height: `${Math.max(pct, 3)}%`, background: color, borderRadius: '4px 4px 0 0', opacity: 0.8, minHeight: 3 }} />
            <div style={{ fontSize: 9, color: 'var(--text3)', textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '100%' }}>
              {label}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── Date preset selector ──
function DateSelect({ value, onChange }) {
  return (
    <select value={value} onChange={e => onChange(e.target.value)}
      style={{ background: 'var(--bg3)', border: '1px solid var(--border2)', borderRadius: 6, color: 'var(--text)', fontSize: 12, padding: '6px 10px', outline: 'none' }}>
      <option value="last_7d">Last 7 days</option>
      <option value="last_14d">Last 14 days</option>
      <option value="last_30d">Last 30 days</option>
      <option value="this_month">This month</option>
      <option value="last_month">Last month</option>
    </select>
  );
}

export default function MetaPerformancePage() {
  const navigate            = useNavigate();
  const [datePreset,   setDatePreset]   = useState('last_14d');
  const [data,         setData]         = useState(null);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState(null);
  const [activeTab,    setActiveTab]    = useState('overview');

  const load = () => {
    setLoading(true);
    setError(null);
    api.get('/meta/dashboard', { params: { datePreset } })
      .then(({ data: res }) => setData(res.data))
      .catch(err => setError(err.response?.data?.message || 'Could not load Meta data'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [datePreset]);

  const s         = data?.summary   || null;
  const campaigns = data?.campaigns || [];
  const daily     = data?.daily     || [];
  const topAds    = data?.topAds    || [];

  // ── Not connected state ──
  if (!loading && error) {
    return (
      <>
        <Topbar title="Meta Ads Performance" subtitle="Facebook & Instagram campaign analytics" />
        <div className="page-content fade-in">
          <div style={{ maxWidth: 520, margin: '60px auto', textAlign: 'center' }}>
            <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.4 }}>📘</div>
            <div style={{ fontFamily: 'var(--font-display)', fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
              Meta Ads not connected
            </div>
            <div style={{ fontSize: 13, color: 'var(--text3)', lineHeight: 1.7, marginBottom: 24 }}>
              {error}
            </div>
            <button className="btn btn-primary" style={{ width: 'auto', padding: '10px 28px', margin: '0 auto' }}
              onClick={() => navigate('/integrations')}>
              Go to Integrations → Connect Meta
            </button>
            <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 14 }}>
              You need a Meta Access Token and Ad Account ID from developers.facebook.com
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar title="Meta Ads Performance" subtitle="Facebook & Instagram campaign analytics" />
      <div className="page-content fade-in">

        {/* ── Toolbar ── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div className="agent-tabs" style={{ marginBottom: 0 }}>
            {['overview', 'campaigns', 'trends', 'ads'].map(t => (
              <div key={t} className={`agent-tab${activeTab === t ? ' active' : ''}`}
                onClick={() => setActiveTab(t)}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <DateSelect value={datePreset} onChange={setDatePreset} />
            <button className="btn btn-ghost" style={{ fontSize: 12, padding: '6px 12px' }} onClick={load}>
              ↻ Refresh
            </button>
          </div>
        </div>

        {loading && (
          <div className="loading-wrap">
            <div className="loading-dots"><span /><span /><span /></div>
            <span>Loading Meta performance data…</span>
          </div>
        )}

        {!loading && (
          <>

            {/* ════════════ OVERVIEW TAB ════════════ */}
            {activeTab === 'overview' && (
              <>
                {/* Row 1 — Spend & reach */}
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 16 }}>
                  <Stat label="Total spend"   value={fmtD(s?.spend)}        color="#E8714A" sub="Ad budget used" />
                  <Stat label="Impressions"   value={fmtN(s?.impressions)}  color="#9B7CE8" sub="Total ad views" />
                  <Stat label="Reach"          value={fmtN(s?.reach)}        color="#4A9EE8" sub="Unique people" />
                  <Stat label="Frequency"      value={fmt(s?.frequency)}     color="var(--text)" sub="Avg times seen" />
                </div>

                {/* Row 2 — Engagement & conversions */}
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 20 }}>
                  <Stat label="Link clicks"   value={fmtN(s?.clicks)}       color="#4A9EE8" sub="Clicks to funnel" />
                  <Stat label="CTR"            value={`${fmt(s?.ctr)}%`}    color="#E8B84B" sub="Click-through rate" />
                  <Stat label="CPC"            value={fmtD(s?.cpc)}         color="var(--text)" sub="Cost per click" />
                  <Stat label="CPP"            value={fmtD(s?.cpp)}         color="var(--text)" sub="Cost per 1K reached" />
                </div>

                {/* Row 3 — Lead metrics */}
                <div className="dash-grid" style={{ gridTemplateColumns: 'repeat(4,1fr)', marginBottom: 24 }}>
                  <Stat label="Leads"          value={fmtN(s?.leads)}                                  color="#3DBF8A" sub="Via Meta lead forms" />
                  <Stat label="CPL"            value={s?.cpl > 0 ? fmtD(s?.cpl) : '—'}               color="#3DBF8A" sub="Cost per lead" />
                  <Stat label="Lead rate"      value={s?.clicks > 0 ? `${((s?.leads / s?.clicks) * 100).toFixed(2)}%` : '—'} color="#3DBF8A" sub="Leads per click" />
                  <Stat label="Active campaigns" value={campaigns.length}                              color="var(--text)" sub="Running campaigns" />
                </div>

                {/* Summary charts */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div className="card">
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Daily spend</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Ad budget per day</div>
                    <TrendLine data={daily} valueKey="spend" color="#E8714A" />
                  </div>
                  <div className="card">
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Daily clicks</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 14 }}>Link clicks per day</div>
                    <TrendLine data={daily} valueKey="clicks" color="#4A9EE8" />
                  </div>
                </div>
              </>
            )}

            {/* ════════════ CAMPAIGNS TAB ════════════ */}
            {activeTab === 'campaigns' && (
              <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
                {/* Table header */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '10px 18px', background: 'var(--bg3)', borderBottom: '1px solid var(--border)' }}>
                  {['Campaign name', 'Spend', 'Impressions', 'Clicks', 'CTR', 'CPC', 'Leads'].map(h => (
                    <div key={h} style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{h}</div>
                  ))}
                </div>

                {campaigns.length === 0 && (
                  <div style={{ padding: '24px 18px', fontSize: 13, color: 'var(--text3)', textAlign: 'center' }}>
                    No campaigns found for this date range
                  </div>
                )}

                {campaigns.map((c, i) => {
                  const leads = parseInt(c.actions?.find(a => a.action_type === 'lead')?.value || 0);
                  return (
                    <div key={i} style={{
                      display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr',
                      gap: 10, padding: '13px 18px', borderBottom: '1px solid var(--border)',
                      alignItems: 'center',
                      background: i % 2 === 0 ? 'transparent' : 'var(--bg3)',
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {c.campaign_name}
                      </div>
                      <div style={{ fontSize: 13, color: '#E8714A', fontWeight: 600 }}>{fmtD(c.spend)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtN(c.impressions)}</div>
                      <div style={{ fontSize: 13, color: '#4A9EE8', fontWeight: 600 }}>{fmtN(c.clicks)}</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmt(c.ctr)}%</div>
                      <div style={{ fontSize: 12, color: 'var(--text2)' }}>{fmtD(c.cpc)}</div>
                      <div style={{ fontSize: 13, color: leads > 0 ? '#3DBF8A' : 'var(--text3)', fontWeight: leads > 0 ? 600 : 400 }}>
                        {leads > 0 ? leads : '—'}
                      </div>
                    </div>
                  );
                })}

                {/* Totals row */}
                {campaigns.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 1fr 1fr', gap: 10, padding: '12px 18px', background: 'var(--bg4)', borderTop: '1px solid var(--border2)' }}>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>Total</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#E8714A' }}>{fmtD(s?.spend)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{fmtN(s?.impressions)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#4A9EE8' }}>{fmtN(s?.clicks)}</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{fmt(s?.ctr)}%</div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>{fmtD(s?.cpc)}</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#3DBF8A' }}>{fmtN(s?.leads)}</div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ TRENDS TAB ════════════ */}
            {activeTab === 'trends' && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                {[
                  { label: 'Daily spend',      sub: 'Budget used per day',     key: 'spend',       color: '#E8714A' },
                  { label: 'Daily impressions', sub: 'Ad views per day',        key: 'impressions', color: '#9B7CE8' },
                  { label: 'Daily clicks',      sub: 'Link clicks per day',     key: 'clicks',      color: '#4A9EE8' },
                  { label: 'Daily CTR',         sub: 'Click-through rate %',    key: 'ctr',         color: '#E8B84B' },
                ].map((chart) => (
                  <div key={chart.key} className="card">
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 2 }}>{chart.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>{chart.sub}</div>
                    {daily.length > 1
                      ? <TrendLine data={daily} valueKey={chart.key} color={chart.color} height={90} />
                      : <div style={{ fontSize: 12, color: 'var(--text3)', padding: '20px 0' }}>Not enough data for this date range</div>
                    }
                  </div>
                ))}

                {/* Spend vs clicks comparison */}
                {daily.length > 1 && (
                  <div className="card" style={{ gridColumn: '1 / -1' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Spend vs clicks by day</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)', marginBottom: 16 }}>Compare budget efficiency over time</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
                      <div>
                        <div style={{ fontSize: 11, color: '#E8714A', marginBottom: 8, fontWeight: 500 }}>Spend ($)</div>
                        <BarChart data={daily} valueKey="spend" labelKey="date_start" color="#E8714A" height={100} />
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: '#4A9EE8', marginBottom: 8, fontWeight: 500 }}>Clicks</div>
                        <BarChart data={daily} valueKey="clicks" labelKey="date_start" color="#4A9EE8" height={100} />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ════════════ ADS TAB ════════════ */}
            {activeTab === 'ads' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

                {topAds.length === 0 && (
                  <div className="card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                    <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>📢</div>
                    <div style={{ fontSize: 14 }}>No ads found for this date range</div>
                  </div>
                )}

                {topAds.map((ad, i) => {
                  const maxClicks = parseInt(topAds[0]?.clicks || 1);
                  const pct       = Math.round((parseInt(ad.clicks || 0) / maxClicks) * 100);
                  return (
                    <div key={i} className="card" style={{ padding: '16px 20px' }}>
                      {/* Ad name + rank */}
                      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 14 }}>
                        <div style={{ width: 28, height: 28, borderRadius: 6, background: i === 0 ? 'rgba(232,184,75,0.15)' : 'var(--bg4)', border: `1px solid ${i === 0 ? 'rgba(232,184,75,0.4)' : 'var(--border)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: i === 0 ? '#E8B84B' : 'var(--text3)', flexShrink: 0 }}>
                          #{i + 1}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{ad.ad_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text3)' }}>{ad.adset_name}</div>
                        </div>
                        {i === 0 && (
                          <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(232,184,75,0.15)', color: '#E8B84B', border: '1px solid rgba(232,184,75,0.3)', flexShrink: 0 }}>
                            Top performer
                          </span>
                        )}
                      </div>

                      {/* Metrics row */}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 10, marginBottom: 14 }}>
                        {[
                          { label: 'Spend',       value: fmtD(ad.spend),       color: '#E8714A' },
                          { label: 'Impressions', value: fmtN(ad.impressions), color: '#9B7CE8' },
                          { label: 'Clicks',      value: fmtN(ad.clicks),      color: '#4A9EE8' },
                          { label: 'CTR',         value: `${fmt(ad.ctr)}%`,   color: '#E8B84B' },
                          { label: 'CPC',         value: fmtD(ad.cpc),         color: 'var(--text)' },
                        ].map((m) => (
                          <div key={m.label} style={{ background: 'var(--bg3)', padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border)' }}>
                            <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.label}</div>
                            <div style={{ fontSize: 15, fontWeight: 700, fontFamily: 'var(--font-display)', color: m.color }}>{m.value}</div>
                          </div>
                        ))}
                      </div>

                      {/* Click performance bar */}
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 11, color: 'var(--text3)' }}>
                          <span>Click performance vs top ad</span>
                          <span style={{ color: '#4A9EE8', fontWeight: 600 }}>{pct}%</span>
                        </div>
                        <div style={{ height: 5, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: '#4A9EE8', borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </>
        )}
      </div>
    </>
  );
}