import { useSettings } from '../../context/SettingsContext';
import { useGHLAccounts } from '../../context/GHLAccountsContext';

export default function Topbar({ title, subtitle }) {
  const { settings } = useSettings();
  const { activeAccount } = useGHLAccounts();

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {activeAccount && (
          <div className="event-chip" style={{ borderColor: 'rgba(42, 191, 170, 0.3)' }}>
            <div className="pulse" />
            <span>GHL: {activeAccount.name}</span>
          </div>
        )}
        <div className="event-chip">
          <div className="pulse" />
          <span>{settings.eventName} · {settings.eventLocation}</span>
        </div>
      </div>
    </div>
  );
}
