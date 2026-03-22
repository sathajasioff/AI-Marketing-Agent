import { useState } from 'react';

/**
 * Generic hook for all agent API calls.
 * @param {Function} apiFn  — the api service function to call
 * @returns { output, generationId, loading, error, run, reset }
 */
export function useAgent(apiFn) {
  const [output,       setOutput]       = useState('');
  const [generationId, setGenerationId] = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState(null);

  const run = async (payload) => {
    setLoading(true);
    setError(null);
    setOutput('');
    setGenerationId(null);
    try {
      const { data } = await apiFn(payload);
      setOutput(data.output);
      setGenerationId(data.generationId);
      return data;
    } catch (err) {
      const msg = err.response?.data?.message || err.message || 'Something went wrong';
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setOutput('');
    setGenerationId(null);
    setError(null);
    setLoading(false);
  };

  return { output, generationId, loading, error, run, reset };
}
