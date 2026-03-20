import { useToast } from '../../context/ToastContext';

function renderMarkdown(text) {
  return text
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^### (.+)$/gm, '<h3>$1</h3>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    .replace(/^---$/gm, '<hr/>')
    .replace(/\n/g, '<br/>');
}

export default function OutputCard({ title, output, loading, error, placeholder, icon }) {
  const { showToast } = useToast();

  const handleCopy = () => {
    if (!output) return;
    navigator.clipboard.writeText(output).then(() => showToast('✓ Copied to clipboard!'));
  };

  return (
    <div className="output-card">
      <div className="card-header">
        <span className="card-title">{title || 'Output'}</span>
        <div style={{ display: 'flex', gap: 8 }}>
          {output && (
            <button className="btn btn-ghost" onClick={handleCopy}>
              Copy for GHL
            </button>
          )}
        </div>
      </div>

      <div className="output-body">
        {loading && (
          <div className="loading-wrap">
            <div className="loading-dots">
              <span /><span /><span />
            </div>
            <span>Agent thinking…</span>
          </div>
        )}

        {!loading && error && (
          <div style={{ color: 'var(--coral)', fontSize: 13, padding: '4px 0' }}>
            ⚠ {error}
          </div>
        )}

        {!loading && !error && output && (
          <div
            className="ai-output fade-in"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(output) }}
          />
        )}

        {!loading && !error && !output && (
          <div className="output-placeholder">
            <div className="icon">{icon || '✨'}</div>
            <p>{placeholder || 'Fill in the form and generate output.'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
