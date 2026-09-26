import React from 'react';
import VoiceInput from './VoiceInput';

/**
 * Ask AI Query Panel (Milestone 3)
 * Provides:
 * - Query text input with Web Speech Voice input
 * - Top-K chunk selector
 * - Active Conversation Context / Topic indicator
 * - Reset session control
 */
export default function QueryPanel({
  query,
  setQuery,
  topK,
  setTopK,
  onSearch,
  isLoading,
  activeTopic,
  onResetSession
}) {
  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!query.trim() || isLoading) return;
    onSearch(query);
  };

  return (
    <div className="glass-card" style={{ marginBottom: '20px' }}>
      <form onSubmit={handleSubmit} className="query-box">
        {/* Context indicator banner if active session has context */}
        {activeTopic && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '10px',
            padding: '6px 12px',
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: 'var(--radius-sm)',
            fontSize: '12px'
          }}>
            <span style={{ color: '#38bdf8', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>💬</span> Active Topic: {activeTopic}
            </span>
            {onResetSession && (
              <button
                type="button"
                onClick={onResetSession}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  fontSize: '11px',
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
                title="Start a new conversation thread"
              >
                New Thread
              </button>
            )}
          </div>
        )}

        <div className="input-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '18px', color: 'var(--text-muted)', marginLeft: '4px' }}>🔎</span>
          <input
            type="text"
            className="query-input"
            placeholder="Ask AI anything about the indexed documents... (e.g. 'How long can I keep it?')"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            disabled={isLoading}
            style={{ flex: 1 }}
          />
          {query && !isLoading && (
            <button
              type="button"
              onClick={() => setQuery('')}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
                borderRadius: 'var(--radius-sm)',
                padding: '6px 10px',
                fontSize: '12px',
                cursor: 'pointer'
              }}
              title="Clear transcription / query"
            >
              Clear
            </button>
          )}
          <VoiceInput
            onTranscript={(transcribedText) => setQuery(transcribedText)}
            onFinalResult={(finalText) => {
              setQuery(finalText);
              onSearch?.(finalText);
            }}
            isInputDisabled={isLoading}
          />
        </div>

        <div className="query-controls" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '12px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="top-k-selector" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Retrieve Top-K Chunks:</span>
            {[1, 3, 5, 8].map((k) => (
              <button
                key={k}
                type="button"
                className={`top-k-btn ${topK === k ? 'active' : ''}`}
                onClick={() => setTopK(k)}
                disabled={isLoading}
                style={{
                  padding: '4px 10px',
                  fontSize: '12px',
                  borderRadius: 'var(--radius-sm)',
                  border: '1px solid var(--border-subtle)',
                  background: topK === k ? 'var(--accent-primary)' : 'rgba(30, 41, 59, 0.4)',
                  color: topK === k ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer'
                }}
              >
                Top {k}
              </button>
            ))}
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={!query.trim() || isLoading}
            style={{
              padding: '8px 20px',
              fontSize: '13px',
              fontWeight: 600,
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {isLoading ? (
              <>
                <span className="spinner" />
                Processing...
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
