// import { useState } from 'react';
// import Topbar from '../components/layout/Topbar';
// import ContextBar from '../components/ui/ContextBar';
// import OutputCard from '../components/ui/OutputCard';
// import { useAgent } from '../hooks/useAgent';
// import { useToast } from '../context/ToastContext';
// import { runStrategy } from '../services/api';
// import api from '../services/api';

// export default function StrategyPage() {
//   const { output, loading, error, run, generationId } = useAgent(runStrategy);
//   const { showToast } = useToast();
//   const [feedbackSent, setFeedbackSent] = useState(false);

//   const [form, setForm] = useState({
//     goal:     'Sell 200 event tickets in 60 days',
//     price:    '$497',
//     budget:   '$2,000/mo',
//     audience: 'entrepreneurs',
//     timeline: '60',
//     offers:   '',
//   });

//   const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

//   const handleSubmit = (e) => {
//     e.preventDefault();
//     setFeedbackSent(false);
//     run(form);
//   };

//   const handleFeedback = async (feedback) => {
//     if (!generationId) return;
//     try {
//       const { data } = await api.get(`/history/${generationId}`);
//       await api.post('/learning/feedback', {
//         promptHash: data.generation.promptHash,
//         agentType:  'strategy',
//         subType:    null,
//         feedback,
//       });
//       setFeedbackSent(true);
//       showToast(
//         feedback === 'positive'
//           ? '✓ Positive feedback saved — Claude will use this approach again'
//           : '✓ Feedback saved — Claude will improve on this'
//       );
//     } catch {
//       showToast('⚠ Could not record feedback');
//     }
//   };

//   return (
//     <>
//       <Topbar title="Strategy Agent" subtitle="Build your full campaign strategy for Elev8 Montreal" />
//       <div className="page-content fade-in">
//         <ContextBar items={[{ label: 'Agent', value: 'Campaign Strategy' }]} />

//         <div className="agent-layout">
//           {/* ── Form ── */}
//           <form className="card" onSubmit={handleSubmit}>
//             <div className="form-card-title">
//               Campaign Parameters <span className="badge">Strategy</span>
//             </div>

//             <div className="field">
//               <label>Campaign Goal</label>
//               <input value={form.goal} onChange={set('goal')} placeholder="e.g. Sell 200 tickets in 60 days" />
//             </div>

//             <div className="field-row">
//               <div className="field">
//                 <label>Ticket Price</label>
//                 <input value={form.price} onChange={set('price')} placeholder="$497" />
//               </div>
//               <div className="field">
//                 <label>Ad Budget / Month</label>
//                 <input value={form.budget} onChange={set('budget')} placeholder="$2,000/mo" />
//               </div>
//             </div>

//             <div className="field">
//               <label>Primary Audience</label>
//               <select value={form.audience} onChange={set('audience')}>
//                 <option value="entrepreneurs">Entrepreneurs & Business Owners</option>
//                 <option value="realtors">Real Estate Professionals</option>
//                 <option value="sales">Sales & Marketing Professionals</option>
//                 <option value="mixed">Mixed — All of the above</option>
//               </select>
//             </div>

//             <div className="field">
//               <label>Campaign Timeline</label>
//               <select value={form.timeline} onChange={set('timeline')}>
//                 <option value="30">30 days to event</option>
//                 <option value="60">60 days to event</option>
//                 <option value="90">90 days to event</option>
//               </select>
//             </div>

//             <div className="field">
//               <label>Key Speakers / Offer Points (optional)</label>
//               <textarea
//                 rows={3}
//                 value={form.offers}
//                 onChange={set('offers')}
//                 placeholder="e.g. 3 keynote speakers on real estate investing, sales mastery…"
//               />
//             </div>

//             <button className="btn btn-primary" type="submit" disabled={loading}>
//               {loading ? 'Generating…' : '⚡ Generate Strategy'}
//             </button>
//           </form>

//           {/* ── Output ── */}
//           <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
//             <OutputCard
//               title="Strategy Output"
//               output={output}
//               loading={loading}
//               error={error}
//               icon="🧠"
//               placeholder="Fill in your campaign parameters and click Generate Strategy"
//             />

//             {/* Feedback bar — only shows after output is generated */}
//             {output && !loading && (
//               <div style={{
//                 display: 'flex',
//                 alignItems: 'center',
//                 gap: 12,
//                 padding: '12px 16px',
//                 background: 'var(--bg2)',
//                 borderRadius: 'var(--r)',
//                 border: '1px solid var(--border)',
//               }}>
//                 {!feedbackSent ? (
//                   <>
//                     <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>
//                       Did this strategy work for your campaign?
//                     </span>
//                     <button
//                       className="btn btn-ghost"
//                       style={{ fontSize: 12, padding: '5px 14px', color: '#3DBF8A', borderColor: '#3DBF8A' }}
//                       onClick={() => handleFeedback('positive')}
//                     >
//                       👍 Yes, it worked
//                     </button>
//                     <button
//                       className="btn btn-ghost"
//                       style={{ fontSize: 12, padding: '5px 14px', color: '#E8714A', borderColor: '#E8714A' }}
//                       onClick={() => handleFeedback('negative')}
//                     >
//                       👎 Needs improvement
//                     </button>
//                   </>
//                 ) : (
//                   <span style={{ fontSize: 12, color: '#3DBF8A' }}>
//                     ✓ Feedback recorded — Claude is learning from this
//                   </span>
//                 )}
//               </div>
//             )}
//           </div>
//         </div>
//       </div>
//     </>
//   );
// }

import { useState } from 'react';
import BrandVoiceSelector from '../components/ui/BrandVoiceSelector';
import { useAgent } from '../hooks/useAgent';
import { runStrategy } from '../services/api';
import Topbar from '../components/layout/Topbar';
import OutputCard from '../components/ui/OutputCard';
import FeedbackBar from '../components/ui/FeedbackBar';
import { useSettings } from '../context/SettingsContext';

export default function StrategyPage() {
  const { settings }    = useSettings();
  const { output, loading, error, generationId, run, reset } = useAgent(runStrategy);

  const [brandVoiceId, setBrandVoiceId] = useState(null);
  const [form, setForm] = useState({
    goal:        '',
    budget:      '',
    timeline:    '60',
    audience:    settings.targetAudience || '',
    ticketPrice: settings.ticketPrice || '',
  });

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  const handleRun = () => {
    if (!form.goal) return;
    run({ ...form, brandVoiceId });
  };

  return (
    <>
      <Topbar title="Strategy Agent" subtitle="Build a complete campaign strategy" />
      <div className="page-content fade-in">
        <div className="agent-layout">
          <div>
            <div className="card">
              <div className="form-card-title">Campaign parameters</div>

              {/* ── Brand Voice Selector ── */}
              <BrandVoiceSelector value={brandVoiceId} onChange={setBrandVoiceId} />

              <div className="field">
                <label>Campaign goal</label>
                <input value={form.goal} onChange={set('goal')} placeholder="e.g. Sell 200 tickets in 60 days" />
              </div>
              <div className="field-row">
                <div className="field">
                  <label>Monthly budget</label>
                  <input value={form.budget} onChange={set('budget')} placeholder="$2,000/mo" />
                </div>
                <div className="field">
                  <label>Days to event</label>
                  <select value={form.timeline} onChange={set('timeline')}>
                    <option value="30">30 days</option>
                    <option value="60">60 days</option>
                    <option value="90">90 days</option>
                  </select>
                </div>
              </div>
              <div className="field">
                <label>Target audience</label>
                <input value={form.audience} onChange={set('audience')} placeholder="e.g. Montreal entrepreneurs aged 30-50" />
              </div>
              <div className="field">
                <label>Ticket price</label>
                <input value={form.ticketPrice} onChange={set('ticketPrice')} placeholder="e.g. $497" />
              </div>
              <button className="btn btn-primary" onClick={handleRun} disabled={loading || !form.goal}>
                {loading ? 'Building strategy…' : '⚡ Generate Strategy'}
              </button>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <OutputCard
              title="Campaign Strategy"
              output={output}
              loading={loading}
              error={error}
              icon="🧠"
              generationId={generationId}
              agentType="strategy"
              placeholder="Fill in your campaign parameters and click Generate Strategy"
            />
            {output && generationId && (
              <FeedbackBar generationId={generationId} agentType="strategy" />
            )}
          </div>
        </div>
      </div>
    </>
  );
}