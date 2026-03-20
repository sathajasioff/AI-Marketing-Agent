import { useState } from 'react';
import Topbar from '../components/layout/Topbar';
import ContextBar from '../components/ui/ContextBar';
import OutputCard from '../components/ui/OutputCard';
import { useAgent } from '../hooks/useAgent';
import { runEmail } from '../services/api';

export default function EmailPage() {
  const { output, loading, error, run } = useAgent(runEmail);

  const [form, setForm] = useState({
    sequenceType: 'nurture',
    segment:      'cold',
    senderName:   'The Elev8 Team',
    tone:         'professional',
    offer:        '',
  });

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    run(form);
  };

  return (
    <>
      <Topbar title="Email Automation Agent" subtitle="Build GHL-ready email sequences for Elev8 Montreal" />
      <div className="page-content fade-in">
        <ContextBar items={[
          { label: 'Platform', value: 'GoHighLevel Automations' },
          { label: 'Format',   value: 'Subject + Body per email' },
        ]} />

        <div className="agent-layout">
          {/* ── Form ── */}
          <form className="card" onSubmit={handleSubmit}>
            <div className="form-card-title">
              Sequence Builder <span className="badge">GHL Automation</span>
            </div>

            <div className="field">
              <label>Sequence Type</label>
              <select value={form.sequenceType} onChange={set('sequenceType')}>
                <option value="welcome">Welcome / Opt-in confirmation (Day 0)</option>
                <option value="nurture">7-Day Nurture Sequence (Warm leads)</option>
                <option value="urgency">Urgency / Closing Sequence (3-day push)</option>
                <option value="noshow">No-show Re-engagement</option>
                <option value="postevent">Post-event Follow-up</option>
              </select>
            </div>

            <div className="field">
              <label>Lead Segment</label>
              <select value={form.segment} onChange={set('segment')}>
                <option value="cold">Cold lead (just opted in)</option>
                <option value="warm">Warm lead (engaged, not bought)</option>
                <option value="hot">Hot lead (visited sales page)</option>
                <option value="vip">VIP / Past attendee</option>
              </select>
            </div>

            <div className="field">
              <label>Sender Name</label>
              <input value={form.senderName} onChange={set('senderName')} placeholder="e.g. Sarah from Elev8 Montreal" />
            </div>

            <div className="field">
              <label>Tone</label>
              <select value={form.tone} onChange={set('tone')}>
                <option value="professional">Professional & Authoritative</option>
                <option value="friendly">Friendly & Conversational</option>
                <option value="urgent">Urgent & Direct</option>
                <option value="inspirational">Inspirational & Motivating</option>
              </select>
            </div>

            <div className="field">
              <label>Special Offer / Deadline (optional)</label>
              <input value={form.offer} onChange={set('offer')} placeholder="e.g. Early bird ends Friday — save $100" />
            </div>

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Building sequence…' : '⚡ Build Email Sequence'}
            </button>
          </form>

          {/* ── Output ── */}
          <OutputCard
            title="Email Sequence Output"
            output={output}
            loading={loading}
            error={error}
            icon="📧"
            placeholder="Choose your sequence type and generate GHL-ready emails"
          />
        </div>
      </div>
    </>
  );
}
