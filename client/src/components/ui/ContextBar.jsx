import { useSettings } from '../../context/SettingsContext';

export default function ContextBar({ items = [] }) {
  const { settings } = useSettings();

  const defaultItems = [
    { label: 'Event',    value: settings.eventName },
    { label: 'Location', value: settings.eventLocation },
    { label: 'Price',    value: settings.ticketPrice },
  ];

  const allItems = [...defaultItems, ...items];

  return (
    <div className="context-bar">
      {allItems.map((item, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {i > 0 && <div className="ctx-divider" />}
          <div className="ctx-item">
            <span className="ctx-label">{item.label}</span>
            <span className="ctx-val">{item.value}</span>
          </div>
        </div>
      ))}
      <div className="ctx-divider" />
      <div className="ghl-badge">⚡ GHL Ready</div>
    </div>
  );
}
