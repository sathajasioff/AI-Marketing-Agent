import { useState } from 'react';
import Topbar from '../components/layout/Topbar';
import ContextBar from '../components/ui/ContextBar';
import OutputCard from '../components/ui/OutputCard';
import { useAgent } from '../hooks/useAgent';
import { runLeads } from '../services/api';

const ACTION_OPTIONS = [
  'Opted into freebie',
  'Visited ticket page',
  'Opened 3+ emails',
  'Clicked CTA button',
  'Replied to email',
  'Watched VSL',
  'Added to cart, didn\'t buy',
];

export default function LeadsPage() {
  const { output, loading, error, run } = useAgent(runLeads);

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

  const handleSubmit = (e) => {
    e.preventDefault();
    run({ ...form, actions: actions.join(', ') || 'None recorded' });
  };

  return (
    <>
      <Topbar title="Lead Qualification Agent" subtitle="Score leads and get GHL tag + follow-up recommendations" />
      <div className="page-content fade-in">
        <ContextBar items={[
          { label: 'Output',   value: 'Score · GHL Tag · Next Step' },
          { label: 'Segments', value: 'Cold → Warm → Hot → Buyer' },
        ]} />

        <div className="agent-layout">
          {/* ── Form ── */}
          <form className="card" onSubmit={handleSubmit}>
            <div className="form-card-title">
              Lead Information <span className="badge">Qualification</span>
            </div>

            <div className="field">
              <label>Lead Name & Basic Info</label>
              <input value={form.name} onChange={set('name')} placeholder="e.g. John Dupont, 38, Montreal" />
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

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Qualifying…' : '⚡ Qualify This Lead'}
            </button>
          </form>

          {/* ── Output ── */}
          <OutputCard
            title="Qualification Report"
            output={output}
            loading={loading}
            error={error}
            icon="🎯"
            placeholder="Fill in the lead details and qualify them for Elev8 Montreal"
          />
        </div>
      </div>
    </>
  );
}
