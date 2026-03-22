import { useState } from 'react';
import Topbar from '../components/layout/Topbar';
import ContextBar from '../components/ui/ContextBar';
import OutputCard from '../components/ui/OutputCard';
import { useAgent } from '../hooks/useAgent';
import { runContent } from '../services/api';
import FeedbackBar from '../components/ui/FeedbackBar';

const TABS = ['meta', 'funnel', 'social', 'vsl'];
const TAB_LABELS = { meta: 'Meta Ads', funnel: 'Funnel Copy', social: 'Social Posts', vsl: 'VSL Script' };

export default function ContentPage() {
  const { output, loading, error, run, generationId } = useAgent(runContent);
  const [tab, setTab] = useState('meta');

  // ── Per-tab form state ──
  const [meta, setMeta] = useState({ adType: 'tof', persona: 'entrepreneur', pain: '', variants: '3' });
  const [funnel, setFunnel] = useState({ pageType: 'optin', audience: 'Entrepreneurs & Business Owners', headline: '' });
  const [social, setSocial] = useState({ platform: 'Instagram (caption + hashtags)', postType: 'hype', count: '5' });
  const [vsl, setVsl] = useState({ length: 'medium', audience: 'Entrepreneurs & Business Owners', cta: 'Register for free — capture email' });

  const fieldOf = (setter) => (k) => (e) => setter((f) => ({ ...f, [k]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    const payloads = { meta, funnel, social, vsl };
    run({ subType: tab, ...payloads[tab] });
  };

  return (
    <>
      <Topbar title="Content & Copy Agent" subtitle="Generate Meta ads, funnel copy, and social content" />
      <div className="page-content fade-in">
        <ContextBar items={[{ label: 'Platform', value: 'Meta Ads (FB + IG)' }, { label: 'Active Tab', value: TAB_LABELS[tab] }]} />

        <div className="agent-tabs">
          {TABS.map((t) => (
            <div key={t} className={`agent-tab${tab === t ? ' active' : ''}`} onClick={() => setTab(t)}>
              {TAB_LABELS[t]}
            </div>
          ))}
        </div>

        <div className="agent-layout">
          {/* ── Form ── */}
          <form className="card" onSubmit={handleSubmit}>

            {/* META ADS */}
            {tab === 'meta' && (
              <>
                <div className="form-card-title">Meta Ad Generator <span className="badge">FB + IG</span></div>
                <div className="field">
                  <label>Ad Type</label>
                  <select value={meta.adType} onChange={fieldOf(setMeta)('adType')}>
                    <option value="tof">Top of Funnel — Awareness (Cold)</option>
                    <option value="mof">Middle of Funnel — Engagement (Warm)</option>
                    <option value="bof">Bottom of Funnel — Conversion (Hot/Retarget)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Target Persona</label>
                  <select value={meta.persona} onChange={fieldOf(setMeta)('persona')}>
                    <option value="entrepreneur">Entrepreneur / Business Owner</option>
                    <option value="realtor">Real Estate Agent / Investor</option>
                    <option value="sales">Sales Professional</option>
                    <option value="marketer">Marketing Professional</option>
                  </select>
                </div>
                <div className="field">
                  <label>Pain Point / Desire to Address</label>
                  <input value={meta.pain} onChange={fieldOf(setMeta)('pain')} placeholder="e.g. Stuck at $100K, wants to scale to $500K" />
                </div>
                <div className="field">
                  <label>Number of Variants</label>
                  <select value={meta.variants} onChange={fieldOf(setMeta)('variants')}>
                    <option value="2">2 variants</option>
                    <option value="3">3 variants</option>
                    <option value="5">5 variants</option>
                  </select>
                </div>
              </>
            )}

            {/* FUNNEL COPY */}
            {tab === 'funnel' && (
              <>
                <div className="form-card-title">Funnel Page Copy <span className="badge">Landing Page</span></div>
                <div className="field">
                  <label>Page Type</label>
                  <select value={funnel.pageType} onChange={fieldOf(setFunnel)('pageType')}>
                    <option value="optin">Opt-in / Lead capture page</option>
                    <option value="sales">Sales / Ticket page</option>
                    <option value="thankyou">Thank you / Confirmation page</option>
                    <option value="webinar">Webinar registration page</option>
                  </select>
                </div>
                <div className="field">
                  <label>Primary Audience</label>
                  <select value={funnel.audience} onChange={fieldOf(setFunnel)('audience')}>
                    <option>Entrepreneurs & Business Owners</option>
                    <option>Real Estate Professionals</option>
                    <option>Sales & Marketing Professionals</option>
                  </select>
                </div>
                <div className="field">
                  <label>Main Promise / Headline Direction</label>
                  <input value={funnel.headline} onChange={fieldOf(setFunnel)('headline')} placeholder="e.g. Learn to close 7-figure real estate deals" />
                </div>
              </>
            )}

            {/* SOCIAL POSTS */}
            {tab === 'social' && (
              <>
                <div className="form-card-title">Social Content <span className="badge">Organic</span></div>
                <div className="field">
                  <label>Platform</label>
                  <select value={social.platform} onChange={fieldOf(setSocial)('platform')}>
                    <option>Instagram (caption + hashtags)</option>
                    <option>Facebook post</option>
                    <option>LinkedIn post</option>
                  </select>
                </div>
                <div className="field">
                  <label>Content Type</label>
                  <select value={social.postType} onChange={fieldOf(setSocial)('postType')}>
                    <option value="hype">Event hype / Countdown</option>
                    <option value="testimonial">Social proof / Testimonial style</option>
                    <option value="edu">Educational / Value post</option>
                    <option value="behindscenes">Behind the scenes</option>
                  </select>
                </div>
                <div className="field">
                  <label>Number of Posts</label>
                  <select value={social.count} onChange={fieldOf(setSocial)('count')}>
                    <option value="3">3 posts</option>
                    <option value="5">5 posts</option>
                    <option value="7">7 posts</option>
                  </select>
                </div>
              </>
            )}

            {/* VSL SCRIPT */}
            {tab === 'vsl' && (
              <>
                <div className="form-card-title">VSL Script <span className="badge">Video</span></div>
                <div className="field">
                  <label>Video Length Target</label>
                  <select value={vsl.length} onChange={fieldOf(setVsl)('length')}>
                    <option value="short">60–90 seconds (short hook)</option>
                    <option value="medium">3–5 minutes (lead gen)</option>
                    <option value="long">10–15 minutes (full sales)</option>
                  </select>
                </div>
                <div className="field">
                  <label>Target Audience</label>
                  <select value={vsl.audience} onChange={fieldOf(setVsl)('audience')}>
                    <option>Entrepreneurs & Business Owners</option>
                    <option>Real Estate Professionals</option>
                    <option>Sales & Marketing Professionals</option>
                  </select>
                </div>
                <div className="field">
                  <label>CTA at End</label>
                  <select value={vsl.cta} onChange={fieldOf(setVsl)('cta')}>
                    <option>Register for free — capture email</option>
                    <option>Buy ticket now — direct sales</option>
                    <option>Book a call — high-ticket</option>
                  </select>
                </div>
              </>
            )}

            <button className="btn btn-primary" type="submit" disabled={loading}>
              {loading ? 'Generating…' : `⚡ Generate ${TAB_LABELS[tab]}`}
            </button>
          </form>

          {/* ── Output ── */}
          <OutputCard
            title="Copy Output"
            output={output}
            loading={loading}
            error={error}
            icon="✍️"
            placeholder="Select your content type and generate copy"
          />

          <FeedbackBar
            generationId={generationId}
            agentType="content"
            subType={tab}
          />

        </div>
      </div>
    </>
  );
}
