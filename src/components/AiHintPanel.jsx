import React, { useState } from 'react';
import { fetchAiHint } from '../utils/aiHint';

export default function AiHintPanel({ question, options, correctIndices, solution }) {
  const [state, setState] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [hint, setHint] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const handleGetHint = async () => {
    if (state === 'loading') return;
    setState('loading');
    setHint('');
    setErrorMsg('');

    try {
      const result = await fetchAiHint({ question, options, correctIndices, solution });
      setHint(result);
      setState('done');
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch AI hint. Please try again.');
      setState('error');
    }
  };

  return (
    <div className="ai-hint-panel">
      {state === 'idle' && (
        <button className="ai-hint-btn" onClick={handleGetHint} id="ai-hint-trigger">
          <span className="ai-hint-icon ms">auto_awesome</span>
          <span>Ask AI to Explain</span>
        </button>
      )}

      {state === 'loading' && (
        <div className="ai-hint-loading">
          <div className="ai-hint-spinner" />
          <span>AI is thinking…</span>
        </div>
      )}

      {state === 'error' && (
        <div className="ai-hint-error">
          <span className="ms">warning</span><span>{errorMsg}</span>
          <button className="ai-hint-retry" onClick={handleGetHint}>Retry</button>
        </div>
      )}

      {state === 'done' && hint && (
        <div className="ai-hint-result">
          <div className="ai-hint-result-header">
            <span className="ai-hint-result-icon ms">smart_toy</span>
            <span className="ai-hint-result-title">AI Explanation</span>
          </div>
          <p className="ai-hint-result-text">{hint}</p>
          <button
            className="ai-hint-again-btn"
            onClick={() => setState('idle')}
            title="Dismiss"
          >
            <span className="ms">close</span> Close
          </button>
        </div>
      )}
    </div>
  );
}
