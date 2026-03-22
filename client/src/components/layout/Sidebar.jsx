import { NavLink } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext';

const navItems = [
  { to: '/',         label: 'Dashboard',       icon: '🏠', dot: 'dot-gold',   section: 'Overview' },
  { to: '/strategy', label: 'Strategy Agent',  icon: '🧠', dot: 'dot-purple', section: 'AI Agents' },
  { to: '/content',  label: 'Content & Copy',  icon: '✍️', dot: 'dot-coral' },
  { to: '/email',    label: 'Email Agent',      icon: '📧', dot: 'dot-teal' },
  { to: '/leads',    label: 'Lead Agent',       icon: '🎯', dot: 'dot-blue' },
  { to: '/settings', label: 'Event Context',    icon: '⚙️', dot: null,         section: 'Settings' },
  { to: '/history',  label: 'History',          icon: '🗂️', dot: null },
  { to: '/pipeline', label: 'GHL Pipeline',     icon: '🔗', dot: 'dot-teal',   section: 'GHL Integration' },
  { to: '/performance', label: 'AI Performance', icon: '📈', dot: 'dot-gold' },
  { to: '/knowledge', label: 'Knowledge Base', icon: '📚', dot: 'dot-gold', section: 'Skill Development' },
];

export default function Sidebar() {
  const { settings } = useSettings();

  return (
    <nav className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-badge">Elev8 MTL</div>
        <div className="logo-title">AI Marketing<br />Command Center</div>
        <div className="logo-sub">Powered by Claude · GHL Ready</div>
      </div>

      <div className="sidebar-nav">
        {navItems.map((item) => (
          <div key={item.to}>
            {item.section && (
              <div className="nav-section-label">{item.section}</div>
            )}
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
        Connected to <span>GoHighLevel</span>
      </div>
    </nav>
  );
}
