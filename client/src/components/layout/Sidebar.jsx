import { NavLink } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';
import { useGHLAccounts } from '../../context/GHLAccountsContext';
import ciftronLogo from '../../assets/CIFTRON logo 01-01-01-01.png';

const navItems = [
  { to: '/',             label: 'Dashboard',         icon: '🏠', dot: 'dot-gold',   section: 'Overview' },
  { to: '/strategy',     label: 'Strategy Agent',    icon: '🧠', dot: 'dot-purple', section: 'AI Agents' },
  { to: '/content',      label: 'Content & Copy',    icon: '✍️', dot: 'dot-coral' },
  { to: '/email',        label: 'Email Agent',        icon: '📧', dot: 'dot-teal' },
  { to: '/leads',        label: 'Lead Agent',         icon: '🎯', dot: 'dot-blue' },
  { to: '/pipeline',     label: 'GHL Pipeline',       icon: '🔗', dot: 'dot-teal',  section: 'GHL Integration' },
  { to: '/intelligence', label: 'Lead Intelligence',  icon: '🧬', dot: 'dot-coral' },
  { to: '/performance',  label: 'AI Performance',     icon: '📈', dot: 'dot-gold' },
  { to: '/knowledge',    label: 'Knowledge Base',     icon: '📚', dot: 'dot-purple', section: 'Skill Development' },
  { to: '/settings',     label: 'Event Context',      icon: '⚙️', dot: null,         section: 'Settings' },
  { to: '/history',      label: 'History',            icon: '🗂️', dot: null },
  { to: '/ghl-accounts', label: 'GHL Accounts', icon: '🔑', dot: 'dot-teal' },
  { to: '/integrations', label: 'Integrations', icon: '🔌', dot: 'dot-teal', section: 'Settings' },
  { to: '/meta', label: 'Meta Ads', icon: '📘', dot: 'dot-blue', section: 'Analytics' },
];

export default function Sidebar() {
  const { settings } = useSettings();
  const { activeAccount } = useGHLAccounts();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">

        {/* ── Your logo ── */}
        <img
          src={ciftronLogo}
          alt="Ciftron Growth Engine"
          style={{
            width: '100%',
            maxWidth: 140,
            height: 'auto',
            marginBottom: 12,
            objectFit: 'contain',
          }}
        />

        {/* Keep or remove these lines depending on whether you want text under the logo */}
        <div className="logo-sub">Powered by Claude · GHL Ready</div>

      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <div key={item.to}>
            {item.section && <div className="nav-section-label">{item.section}</div>}
            <NavLink
              to={item.to}
              end={item.to === '/'}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
            >
              <div className="nav-icon">{item.icon}</div>
              {item.label}
              {item.dot && <div className={`nav-dot ${item.dot}`} />}
            </NavLink>
          </div>
        ))}
      </div>

      <div className="sidebar-footer">
        {settings.eventName}<br />
        {activeAccount ? (
          <>
            Connected to <span>{activeAccount.name}</span><br />
            <span style={{ color: 'var(--text3)', fontWeight: 400 }}>
              {activeAccount.locationId}
            </span>
          </>
        ) : (
          <>Connected to <span>GoHighLevel</span></>
        )}
      </div>
    </nav>
  );
}
