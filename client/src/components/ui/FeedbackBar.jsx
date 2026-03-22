import { useState } from 'react';
import { useToast } from '../../context/ToastContext';
import api from '../../services/api';

export default function FeedbackBar({ generationId, agentType, subType = null }) {
  const { showToast } = useToast();
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);

  if (!generationId) return null;

  const handleFeedback = async (feedback) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/history/${generationId}`);
      await api.post('/learning/feedback', {
        promptHash: data.generation.promptHash,
        agentType,
        subType,
        feedback,
      });
      setSent(true);
      showToast(
        feedback === 'positive'
          ? '✓ Positive feedback saved — Claude will use this approach again'
          : '✓ Feedback saved — Claude will improve on this'
      );
    } catch {
      showToast('⚠ Could not record feedback');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      gap: 12,
      padding: '12px 16px',
      background: 'var(--bg2)',
      borderRadius: 'var(--r)',
      border: '1px solid var(--border)',
      marginTop: 12,
    }}>
      {sent ? (
        <span style={{ fontSize: 12, color: '#3DBF8A' }}>
          ✓ Feedback recorded — Claude is learning from this
        </span>
      ) : (
        <>
          <span style={{ fontSize: 12, color: 'var(--text3)', flex: 1 }}>
            Was this output useful?
          </span>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '5px 14px', color: '#3DBF8A', borderColor: '#3DBF8A' }}
            onClick={() => handleFeedback('positive')}
            disabled={loading}
          >
            👍 Yes, worked well
          </button>
          <button
            className="btn btn-ghost"
            style={{ fontSize: 12, padding: '5px 14px', color: '#E8714A', borderColor: '#E8714A' }}
            onClick={() => handleFeedback('negative')}
            disabled={loading}
          >
            👎 Needs improvement
          </button>
        </>
      )}
    </div>
  );
}