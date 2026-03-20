import { useSettings } from '../../context/SettingsContext';

export default function Topbar({ title, subtitle }) {
  const { settings } = useSettings();

  return (
    <div className="topbar">
      <div>
        <div className="topbar-title">{title}</div>
        {subtitle && <div className="topbar-sub">{subtitle}</div>}
      </div>
      <div className="event-chip">
        <div className="pulse" />
        <span>{settings.eventName} · {settings.eventLocation}</span>
      </div>
    </div>
  );
}
