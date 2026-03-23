import { useState, useEffect } from 'react';
import api from '../../services/api';

export default function BrandVoiceSelector({ value, onChange }) {
  const [voices,  setVoices]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/knowledge/brand-voices')
      .then(({ data }) => setVoices(data.voices || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div style={{
      background: 'var(--bg3)',
      border: `1px solid ${value ? 'rgba(201,151,58,0.4)' : 'var(--border)'}`,
      borderRadius: 10,
      padding: '14px 16px',
      marginBottom: 16,
      transition: 'border-color 0.2s',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        <div style={{
          width: 24, height: 24, borderRadius: 6,
          background: value ? 'rgba(201,151,58,0.15)' : 'var(--bg4)',
          border: `1px solid ${value ? 'rgba(201,151,58,0.35)' : 'var(--border)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, flexShrink: 0,
          transition: 'all 0.2s',
        }}>
          🎙️
        </div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text)' }}>
            Brand Voice
          </div>
          <div style={{ fontSize: 10, color: 'var(--text3)' }}>
            {value
              ? 'Active — agent will write in this style'
              : 'Optional — select to apply a writing style'}
          </div>
        </div>
        {value && (
          <button
            onClick={() => onChange(null)}
            style={{
              marginLeft: 'auto', background: 'none', border: 'none',
              cursor: 'pointer', fontSize: 11, color: 'var(--text3)',
              padding: '2px 6px', borderRadius: 4,
            }}
            title="Clear brand voice"
          >
            ✕ Clear
          </button>
        )}
      </div>

      {/* Selector */}
      {loading ? (
        <div style={{ fontSize: 12, color: 'var(--text3)' }}>Loading brand voices…</div>
      ) : voices.length === 0 ? (
        <div style={{ fontSize: 12, color: 'var(--text3)', lineHeight: 1.6 }}>
          No brand voices found. Go to{' '}
          <a href="/knowledge" style={{ color: 'var(--gold)', textDecoration: 'none' }}>
            Knowledge Base
          </a>{' '}
          and add an entry with a title starting with "Brand voice —"
        </div>
      ) : (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {voices.map((v) => {
            const isSelected = value === v._id;
            // Extract short name after "Brand voice — "
            const shortName  = v.title.replace(/^brand voice\s*[—\-]\s*/i, '').trim();
            return (
              <button
                key={v._id}
                onClick={() => onChange(isSelected ? null : v._id)}
                style={{
                  padding: '6px 12px',
                  borderRadius: 20,
                  border: `1px solid ${isSelected ? 'rgba(201,151,58,0.6)' : 'var(--border)'}`,
                  background: isSelected ? 'rgba(201,151,58,0.12)' : 'var(--bg4)',
                  color: isSelected ? '#C9973A' : 'var(--text2)',
                  fontSize: 12,
                  fontWeight: isSelected ? 600 : 400,
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'rgba(201,151,58,0.35)';
                    e.currentTarget.style.color = 'var(--text)';
                  }
                }}
                onMouseLeave={e => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.color = 'var(--text2)';
                  }
                }}
              >
                {isSelected && <span style={{ marginRight: 4 }}>✓</span>}
                {shortName}
              </button>
            );
          })}
        </div>
      )}

      {/* Active indicator */}
      {value && (
        <div style={{
          marginTop: 10, paddingTop: 10,
          borderTop: '1px solid rgba(201,151,58,0.15)',
          fontSize: 11, color: '#C9973A',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#C9973A', animation: 'pulse 2s infinite' }} />
          Brand voice active — all output will follow this style and framework
        </div>
      )}
    </div>
  );
}