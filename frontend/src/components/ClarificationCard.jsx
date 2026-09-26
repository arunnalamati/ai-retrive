import React, { useState } from 'react';

/**
 * Clarification Card Component (Milestone 3.1)
 * Rendered when clarification_required is true.
 * Prompts the user with the targeted follow-up question and captures their clarification.
 */
export default function ClarificationCard({
  clarificationData,
  onSubmitClarification,
  isLoading = false
}) {
  const [clarificationText, setClarificationText] = useState('');

  if (!clarificationData) return null;

  const { clarification_question, original_query, missing_context } = clarificationData;

  const handleSubmit = (e) => {
    e?.preventDefault();
    if (!clarificationText.trim() || isLoading) return;
    onSubmitClarification(clarificationText.trim());
    setClarificationText('');
  };

  const quickOptions = [
    { label: 'Library books', text: 'library books' },
    { label: 'RAG Architecture', text: 'RAG architecture' },
    { label: 'Late return fine', text: 'late return fine' }
  ];

  return (
    <div
      className="clarification-card"
      style={{
        margin: '18px 0',
        padding: '20px',
        background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.85), rgba(15, 23, 42, 0.95))',
        border: '1px solid rgba(245, 158, 11, 0.4)',
        borderRadius: 'var(--radius-lg)',
        boxShadow: '0 8px 24px -4px rgba(245, 158, 11, 0.15)'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
        <span style={{ fontSize: '20px' }}>💡</span>
        <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, color: '#fbbf24', fontFamily: 'var(--font-heading)' }}>
          Need a little more information
        </h3>
      </div>

      <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '12px' }}>
        Your inquiry: <span style={{ color: '#e2e8f0', fontStyle: 'italic' }}>"{original_query}"</span>
        {missing_context && (
          <span style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Note: {missing_context}
          </span>
        )}
      </div>

      <div style={{
        fontSize: '15px',
        fontWeight: 600,
        color: '#f8fafc',
        marginBottom: '16px',
        padding: '12px 16px',
        background: 'rgba(245, 158, 11, 0.08)',
        borderLeft: '4px solid #f59e0b',
        borderRadius: '0 8px 8px 0'
      }}>
        {clarification_question}
      </div>

      {/* Quick response chips */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Quick choices:</span>
        {quickOptions.map((opt, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setClarificationText(opt.text)}
            style={{
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid var(--border-subtle)',
              borderRadius: '16px',
              padding: '3px 10px',
              fontSize: '12px',
              color: 'var(--text-secondary)',
              cursor: 'pointer'
            }}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px' }}>
        <input
          type="text"
          className="query-input"
          value={clarificationText}
          onChange={(e) => setClarificationText(e.target.value)}
          placeholder="Your clarification (e.g. 'library books')..."
          disabled={isLoading}
          style={{
            flex: 1,
            padding: '10px 14px',
            fontSize: '14px',
            background: 'rgba(15, 23, 42, 0.7)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: '#fff'
          }}
          autoFocus
        />
        <button
          type="submit"
          className="btn-primary"
          disabled={isLoading || !clarificationText.trim()}
          style={{
            padding: '10px 20px',
            fontSize: '13px',
            fontWeight: 600,
            whiteSpace: 'nowrap'
          }}
        >
          {isLoading ? 'Refining...' : 'Submit Clarification'}
        </button>
      </form>
    </div>
  );
}
