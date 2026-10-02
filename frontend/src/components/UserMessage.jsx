import React from 'react';

/**
 * UserMessage Component
 * Displays user's conversational turn (right-aligned).
 */
export default function UserMessage({ message }) {
  const { query, query_type, refined_query, timestamp } = message;

  return (
    <div className="chat-message user-message-wrapper" style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
      <div
        className="user-message-bubble"
        style={{
          maxWidth: '82%',
          background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.3), rgba(30, 58, 138, 0.25))',
          border: '1px solid rgba(59, 130, 246, 0.45)',
          borderRadius: '18px 18px 4px 18px',
          padding: '14px 18px',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.25)',
          color: '#f8fafc'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', marginBottom: '6px' }}>
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#93c5fd', letterSpacing: '0.04em' }}>
            👤 You
          </span>
          {query_type && (
            <span
              style={{
                fontSize: '10.5px',
                padding: '2px 8px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.08)',
                color: '#cbd5e1',
                border: '1px solid rgba(255, 255, 255, 0.12)'
              }}
            >
              {query_type.charAt(0).toUpperCase() + query_type.slice(1)}
            </span>
          )}
        </div>

        <div style={{ fontSize: '14.5px', lineHeight: '1.6', wordBreak: 'break-word' }}>
          {query}
        </div>

        {refined_query && refined_query !== query && (
          <div
            style={{
              marginTop: '8px',
              paddingTop: '6px',
              borderTop: '1px solid rgba(255, 255, 255, 0.1)',
              fontSize: '12px',
              color: '#6ee7b7',
              display: 'flex',
              alignItems: 'center',
              gap: '4px'
            }}
          >
            <span>🧠 Context Resolved:</span>
            <em style={{ color: '#a7f3d0' }}>"{refined_query}"</em>
          </div>
        )}
      </div>
    </div>
  );
}
