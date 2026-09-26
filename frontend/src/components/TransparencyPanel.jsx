import React, { useState } from 'react';

/**
 * Response Transparency Panel (Milestone 3.4)
 * Provides comprehensive auditability and citation provenance:
 * 1. AI Generated Answer
 * 2. Retrieval Confidence with rationale
 * 3. Expandable / Collapsible Supporting Evidence chunks
 * 4. Exact Document, Chunk ID, Page/Section metadata
 * 5. Deterministic Relevance Scores
 * 6. Explicit Low-Confidence & Insufficient Information warnings
 */
export default function TransparencyPanel({ responseData }) {
  const [isEvidenceExpanded, setIsEvidenceExpanded] = useState(false);

  if (!responseData) return null;

  const {
    response,
    confidence = 'Low',
    sources = [],
    transparency,
    query_type,
    active_topic
  } = responseData;

  const supportingChunks = transparency?.supporting_chunks || [];
  const hasSufficientEvidence = transparency?.has_sufficient_evidence ?? (confidence !== 'Low');
  const rationale = transparency?.confidence_rationale;

  // Format relevance score consistently
  const formatScore = (score) => {
    if (score === undefined || score === null) return 'N/A';
    const percent = Math.round(score * 100);
    return `${score.toFixed(3)} (${percent}% Match)`;
  };

  return (
    <div className="transparency-panel glass-card" style={{ marginTop: '20px' }}>
      {/* 1. Header & AI Response Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid var(--border-subtle)', paddingBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '20px' }}>🤖</span>
          <h3 style={{ fontSize: '16px', fontWeight: 700, margin: 0, fontFamily: 'var(--font-heading)' }}>
            AI Response & Grounding Transparency
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {active_topic && (
            <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
              Context: {active_topic}
            </span>
          )}
          <span className={`confidence-badge ${confidence.toLowerCase()}`} style={{ fontSize: '11px', padding: '4px 10px', borderRadius: '12px', fontWeight: 700 }}>
            Confidence: {confidence.toUpperCase()}
          </span>
        </div>
      </div>

      {/* Low-Confidence Insufficient Information Alert */}
      {!hasSufficientEvidence && (
        <div style={{
          padding: '12px 16px',
          background: 'rgba(239, 68, 68, 0.12)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>⚠️</span>
          <div>
            <strong style={{ color: '#f87171', fontSize: '13px', display: 'block', marginBottom: '2px' }}>
              Evidence: No sufficiently relevant evidence found.
            </strong>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              Confidence: Low — {rationale || 'Limited supporting evidence was found in the available knowledge base.'}
            </span>
          </div>
        </div>
      )}

      {/* 2. Main Generated Answer */}
      <div style={{ marginBottom: '18px' }}>
        <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px' }}>
          Answer
        </div>
        <div style={{
          fontSize: '15px',
          lineHeight: '1.7',
          color: '#f8fafc',
          background: 'rgba(15, 23, 42, 0.6)',
          padding: '14px 18px',
          borderRadius: 'var(--radius-md)',
          border: '1px solid var(--border-subtle)',
          whiteSpace: 'pre-wrap'
        }}>
          {response}
        </div>
      </div>

      {/* 3. Sources Summary List */}
      {sources.length > 0 && (
        <div style={{ marginBottom: '18px' }}>
          <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
            📚 Cited Documents & Sources
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sources.map((src, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  background: 'rgba(30, 41, 59, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '12px'
                }}
              >
                <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>📄 {src.document_name}</span>
                <span style={{ color: 'var(--text-muted)' }}>({src.chunk_id || 'Metadata not available'})</span>
                <span style={{ color: 'var(--text-secondary)' }}>• {src.section || 'Metadata not available'}</span>
                <span style={{ color: '#10b981', fontWeight: 600, marginLeft: '4px' }}>
                  {formatScore(src.relevance_score)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. Expandable Supporting Evidence Chunks */}
      <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px' }}>
        <button
          onClick={() => setIsEvidenceExpanded(!isEvidenceExpanded)}
          style={{
            background: 'transparent',
            border: 'none',
            color: 'var(--accent-primary)',
            fontSize: '13px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: 0
          }}
        >
          <span>{isEvidenceExpanded ? '▲' : '▼'}</span>
          <span>
            {isEvidenceExpanded ? 'Hide Evidence' : `View Evidence (${supportingChunks.length} chunks)`}
          </span>
        </button>

        {isEvidenceExpanded && (
          <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {supportingChunks.length === 0 ? (
              <div style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic', padding: '8px 0' }}>
                Evidence: No sufficiently relevant evidence found.
              </div>
            ) : (
              supportingChunks.map((chunk, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '12px 16px',
                    background: 'rgba(15, 23, 42, 0.4)',
                    border: '1px solid var(--border-subtle)',
                    borderRadius: 'var(--radius-md)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span style={{ fontWeight: 600, fontSize: '13px', color: '#e2e8f0' }}>
                        Source: {chunk.document_name}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)', padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px' }}>
                        Chunk ID: {chunk.chunk_id || 'Metadata not available'}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--accent-primary)', padding: '2px 6px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '4px' }}>
                        Section: {chunk.section || 'Metadata not available'}
                      </span>
                    </div>
                    <div style={{ fontSize: '12px', fontWeight: 600, color: '#34d399' }}>
                      Similarity: {formatScore(chunk.relevance_score)}
                    </div>
                  </div>

                  <blockquote style={{
                    margin: 0,
                    padding: '8px 12px',
                    borderLeft: '3px solid var(--accent-primary)',
                    background: 'rgba(30, 41, 59, 0.3)',
                    borderRadius: '0 var(--radius-sm) var(--radius-sm) 0',
                    fontSize: '13px',
                    lineHeight: '1.6',
                    color: 'var(--text-secondary)'
                  }}>
                    {chunk.content}
                  </blockquote>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
