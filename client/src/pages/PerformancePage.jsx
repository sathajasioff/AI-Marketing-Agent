import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import api from '../services/api';

const AGENT_COLORS = {
  strategy: '#9B7CE8',
  content:  '#E8714A',
  email:    '#2ABFAA',
  leads:    '#4A9EE8',
};

function RateBar({ rate, color }) {
  return (
    <div style={{ height: 6, background: 'var(--bg4)', borderRadius: 3, overflow: 'hidden', marginTop: 6 }}>
      <div style={{ height: '100%', width: `${rate}%`, background: color || '#C9973A', borderRadius: 3, transition: 'width 0.6s ease' }} />
    </div>
  );
}

export default function PerformancePage() {
  const [stats,   setStats]   = useState(null);
  const [prompts, setPrompts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState('overview');
  const [error,   setError]   = useState('');

  useEffect(() => {
    Promise.allSettled([
      api.get('/learning/stats'),
      api.get('/learning/top-prompts'),
    ])
      .then(([statsRes, promptsRes]) => {
        if (statsRes.status === 'fulfilled') {
          setStats(statsRes.value.data.stats);
        }

        if (promptsRes.status === 'fulfilled') {
          setPrompts(promptsRes.value.data.prompts || []);
        }

        if (statsRes.status === 'rejected' && promptsRes.status === 'rejected') {
          setError('Could not load performance data right now.');
        }
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Topbar title="AI Performance" subtitle="Self-learning dashboard" />
        <div className="page-content">
          <div className="loading-wrap"><div className="loading-dots"><span /><span /><span /></div><span>Loading…</span></div>
        </div>
      </>
    );
  }

  const overview = stats?.overview || {};
  const hasAgentActivity = (stats?.agentStats || []).some((s) => (s.totalGenerations || s.totalUses || 0) > 0);

  return (
    <>
      <Topbar title="AI Performance" subtitle="How the agent is learning and improving over time" />
      <div className="page-content fade-in">
        {error && (
          <div className="card" style={{ marginBottom: 20, padding: '14px 18px', color: 'var(--coral)' }}>
            {error}
          </div>
        )}

        <div className="dash-grid" style={{ marginBottom: 24 }}>
          {[
            { label: 'Total leads',    value: overview.totalLeads    || 0, sub: 'Synced from GHL' },
            { label: 'AI qualified',   value: overview.qualified     || 0, sub: 'Scored and segmented' },
            { label: 'Converted',      value: overview.converted     || 0, sub: 'Ticket buyers', green: true },
            { label: 'Conversion rate', value: `${overview.conversionRate || 0}%`, sub: 'Based on outcomes', gold: true },
          ].map((s) => (
            <div key={s.label} className={`stat-card${s.gold ? ' gold' : ''}`}>
              <div className="s-label">{s.label}</div>
              <div className="s-value" style={s.green ? { color: '#3DBF8A' } : {}}>{s.value}</div>
              <div className="s-sub">{s.sub}</div>
            </div>
          ))}
        </div>

        <div className="agent-tabs" style={{ maxWidth: 400, marginBottom: 22 }}>
          {['overview', 'prompts'].map((t) => (
            <div key={t} className={`agent-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {t === 'overview' ? 'Agent performance' : 'Prompt variants'}
            </div>
          ))}
        </div>

        {tab === 'overview' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,1fr)', gap: 16 }}>
            {(stats?.agentStats || []).map((s) => (
              <div key={`${s.agentType}-${s.subType}`} className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                  <div>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 15, fontWeight: 700 }}>
                      {s.agentType.charAt(0).toUpperCase() + s.agentType.slice(1)} agent
                      {s.subType && <span style={{ fontSize: 11, color: 'var(--text3)', marginLeft: 8 }}>{s.subType}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 2 }}>
                      {s.totalGenerations || s.totalUses} generations · {s.variants} prompt variants
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontFamily: 'var(--font-display)', fontSize: 24, fontWeight: 800, color: AGENT_COLORS[s.agentType] }}>{s.bestSuccessRate}%</div>
                    <div style={{ fontSize: 11, color: 'var(--text3)' }}>best rate</div>
                  </div>
                </div>
                <RateBar rate={s.bestSuccessRate} color={AGENT_COLORS[s.agentType]} />
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 8, marginTop: 14 }}>
                  {[
                    { label: 'Uses',        value: s.totalUses },
                    { label: 'Conversions', value: s.conversions },
                    { label: 'Overall',     value: `${s.overallRate}%` },
                  ].map((m) => (
                    <div key={m.label} style={{ background: 'var(--bg3)', padding: '8px 10px', borderRadius: 7, border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: 10, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{m.label}</div>
                      <div style={{ fontSize: 16, fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--text)' }}>{m.value}</div>
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 14, padding: '10px 12px', background: 'var(--bg4)', borderRadius: 8, fontSize: 12, color: 'var(--text2)', lineHeight: 1.6 }}>
                  {s.bestSuccessRate >= 70
                    ? `Strong performance. Claude is using the winning prompt for all new ${s.agentType} generations.`
                    : s.conversions === 0 && s.losses === 0 && (s.totalGenerations || s.totalUses) > 0
                    ? `Activity is being tracked. Mark leads as Converted or Lost to turn generations into learning data.`
                    : s.totalUses < 5
                    ? `Need ${5 - s.totalUses} more uses with outcomes to activate self-learning.`
                    : `Learning in progress. ${s.conversions} positive outcomes recorded.`}
                </div>
              </div>
            ))}
            {(stats?.agentStats || []).length === 0 && (
              <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text3)' }}>
                <div style={{ fontSize: 32, marginBottom: 12, opacity: 0.4 }}>🧠</div>
                <div style={{ fontSize: 14, marginBottom: 6 }}>{hasAgentActivity ? 'No learning outcomes yet' : 'No performance data yet'}</div>
                <div style={{ fontSize: 12 }}>
                  {hasAgentActivity
                    ? 'Generations exist, but no Converted or Lost outcomes have been recorded yet.'
                    : 'Use the agents and mark lead outcomes to activate self-learning.'}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'prompts' && (
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            {prompts.length === 0 && (
              <div style={{ padding: 24, color: 'var(--text3)', fontSize: 13, textAlign: 'center' }}>
                No prompt variants with enough data yet (need 3+ uses).
              </div>
            )}
            {prompts.map((p, i) => (
              <div key={p._id} style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontFamily: 'var(--font-display)', fontSize: 20, fontWeight: 700, color: AGENT_COLORS[p.agentType], minWidth: 44 }}>{p.successRate}%</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 13, fontWeight: 500 }}>
                      {p.agentType}{p.subType ? ` · ${p.subType}` : ''}
                    </span>
                    <span style={{ fontSize: 10, fontFamily: 'monospace', background: 'var(--bg4)', padding: '1px 6px', borderRadius: 4, color: 'var(--text3)' }}>
                      {p.promptHash}
                    </span>
                    {i === 0 && (
                      <span style={{ fontSize: 10, padding: '2px 8px', borderRadius: 4, background: 'rgba(201,151,58,0.15)', color: '#E8B84B', border: '1px solid rgba(201,151,58,0.3)' }}>
                        Champion
                      </span>
                    )}
                  </div>
                  <RateBar rate={p.successRate} color={AGENT_COLORS[p.agentType]} />
                  <div style={{ fontSize: 11, color: 'var(--text3)', marginTop: 5 }}>
                    {p.totalUses} uses · {p.conversions} conversions · {p.losses} losses
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="card" style={{ marginTop: 20, padding: '16px 20px' }}>
          <div style={{ fontFamily: 'var(--font-display)', fontSize: 14, fontWeight: 700, marginBottom: 8 }}>How self-learning works</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.75 }}>
            Every agent output fingerprints the prompt used. When you mark a lead <span style={{ color: '#3DBF8A' }}>Converted</span> or <span style={{ color: '#E8714A' }}>Lost</span> in the pipeline, that outcome is attributed to the prompt that generated the qualification. Once a variant hits 5+ uses and 60%+ success rate it becomes the <span style={{ color: '#E8B84B' }}>Champion</span> — Claude automatically applies its learnings to all future generations.
          </div>
        </div>

      </div>
    </>
  );
}
