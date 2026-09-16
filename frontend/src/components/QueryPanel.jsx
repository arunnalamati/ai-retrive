import React from 'react';
import VoiceInput from './VoiceInput';

export default function QueryPanel({
  query,
  setQuery,
  topK,
  setTopK,
  onSearch,
  isLoading
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch();
  };

  return (
    <div className="glass-card">
      <form onSubmit={handleSubmit} className="query-box">
        <div className="input-container">
          <span style={{ fontSize: '18px', color: 'var(--text-muted)' }}>🔎</span>
          <input
            type="text"
            className="query-input"
            placeholder="Ask something about your knowledge base... (e.g. What is RAG?)"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
          />
          <VoiceInput onTranscript={(text) => setQuery(text)} />
        </div>

        <div className="query-controls">
          <div className="top-k-selector">
            <span>Retrieve Top-K Chunks:</span>
            {[1, 3, 5].map((k) => (
              <button
                key={k}
                type="button"
                className={`top-k-btn ${topK === k ? 'active' : ''}`}
                onClick={() => setTopK(k)}
                disabled={isLoading}
              >
                Top {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!query.trim() || isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Processing query...
              </>
            ) : (
              <>
                <span>⚡</span>
                Ask AI
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
