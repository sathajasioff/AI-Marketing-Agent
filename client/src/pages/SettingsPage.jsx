import { useState, useEffect } from 'react';
import Topbar from '../components/layout/Topbar';
import { useSettings } from '../context/SettingsContext';
import { useToast } from '../context/ToastContext';

export default function SettingsPage() {
  const { settings, saving, saveSettings } = useSettings();
  const { showToast } = useToast();
  const [form, setForm] = useState(settings);

  useEffect(() => { setForm(settings); }, [settings]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await saveSettings(form);
    if (result.success) showToast('✓ Event context saved!');
    else showToast(`⚠ ${result.message}`);
  };

  return (
    <>
      <Topbar title="Event Context" subtitle="Configure your event details — injected into all agents" />
      <div className="page-content fade-in">
        <form className="card" style={{ maxWidth: 580 }} onSubmit={handleSubmit}>
          <div className="form-card-title">
            Elev8 Montreal — Event Details
          </div>

          <div className="field">
            <label>Event Name</label>
            <input value={form.eventName || ''} onChange={set('eventName')} />
          </div>

          <div className="field-row">
            <div className="field">
              <label>Event Date / Year</label>
              <input value={form.eventDate || ''} onChange={set('eventDate')} />
            </div>
            <div className="field">
              <label>Ticket Price</label>
              <input value={form.ticketPrice || ''} onChange={set('ticketPrice')} />
            </div>
          </div>

          <div className="field">
            <label>Event Location</label>
            <input value={form.eventLocation || ''} onChange={set('eventLocation')} />
          </div>

          <div className="field">
            <label>Target Audience Description</label>
            <textarea rows={2} value={form.targetAudience || ''} onChange={set('targetAudience')} />
          </div>

          <div className="field">
            <label>Main Value Propositions</label>
            <textarea rows={3} value={form.valuePropositions || ''} onChange={set('valuePropositions')} />
          </div>

          <div className="field">
            <label>Brand Voice / Tone</label>
            <select value={form.brandVoice || ''} onChange={set('brandVoice')}>
              <option>Professional, Ambitious, Results-Focused</option>
              <option>Bold, Energetic, Motivational</option>
              <option>Warm, Community-Oriented, Supportive</option>
              <option>Luxury, Exclusive, High-Status</option>
            </select>
          </div>

          <button className="btn btn-primary" type="submit" disabled={saving} style={{ maxWidth: 220 }}>
            {saving ? 'Saving…' : '✓ Save Event Context'}
          </button>
        </form>
      </div>
    </>
  );
}
