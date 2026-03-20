import { useNavigate } from 'react-router-dom';
import Topbar from '../components/layout/Topbar';
import { useSettings } from '../context/SettingsContext';

const agents = [
  {
    to: '/strategy',
    color: 'c-gold',
    icon: '🧠',
    title: 'Strategy Agent',
    desc: 'Enter your campaign goal and timeline. Get a complete funnel strategy, audience targeting, and week-by-week action plan for Elev8 Montreal.',
    tag: 'Campaign planning · Funnel map · KPIs',
  },
  {
    to: '/content',
    color: 'c-coral',
    icon: '✍️',
    title: 'Content & Copy Agent',
    desc: 'Generate Meta ad hooks, primary text, headlines, and CTAs. Also creates funnel page copy, VSL scripts, and social content.',
    tag: 'Meta ads · Landing page · Social posts',
  },
  {
    to: '/email',
    color: 'c-teal',
    icon: '📧',
    title: 'Email Automation Agent',
    desc: 'Build full email sequences ready to import into GoHighLevel. Choose from welcome flows, 7-day nurture, urgency, and post-event follow-ups.',
    tag: 'GHL sequences · Drip flows · Automations',
  },
  {
    to: '/leads',
    color: 'c-blue',
    icon: '🎯',
    title: 'Lead Qualification Agent',
    desc: 'Paste a lead\'s info and behavior. Get a score, GHL tag assignments, and the exact follow-up sequence to run.',
    tag: 'Lead scoring · GHL tags · Segmentation',
  },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { settings } = useSettings();

  return (
    <>
      <Topbar title="Dashboard" subtitle="Elev8 Montreal — AI Marketing Command Center" />
      <div className="page-content">
        <div className="dash-grid">
          <div className="stat-card gold">
            <div className="s-label">Event</div>
            <div className="s-value" style={{ fontSize: 18, marginTop: 4 }}>{settings.eventName}</div>
            <div className="s-sub">Real Estate · Sales · Marketing</div>
          </div>
          <div className="stat-card">
            <div className="s-label">AI Agents</div>
            <div className="s-value">4</div>
            <div className="s-sub">Strategy · Copy · Email · Leads</div>
          </div>
          <div className="stat-card green">
            <div className="s-label">GHL Status</div>
            <div className="s-value">Active</div>
            <div className="s-sub">All outputs are copy-paste ready</div>
          </div>
          <div className="stat-card">
            <div className="s-label">Powered By</div>
            <div className="s-value" style={{ fontSize: 18, marginTop: 4 }}>Claude</div>
            <div className="s-sub">Anthropic Sonnet 4</div>
          </div>
        </div>

        <div className="page-heading">Your Marketing Agents</div>
        <div className="page-sub">Click any agent to start generating content for {settings.eventName}</div>

        <div className="agent-cards">
          {agents.map((a) => (
            <div key={a.to} className={`agent-card ${a.color}`} onClick={() => navigate(a.to)}>
              <h3>{a.icon} {a.title}</h3>
              <p>{a.desc}</p>
              <span className="ac-tag">{a.tag}</span>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
