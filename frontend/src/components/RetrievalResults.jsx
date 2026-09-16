import React from 'react';

export default function RetrievalResults({ results, noSufficientInfo }) {
  if (!results || results.length === 0) {
    if (noSufficientInfo) {
      return (
        <div className="glass-card">
          <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px' }}>🔎 Retrieved Knowledge</h3>
          <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
            No relevant chunks exceeded the similarity threshold.
          </p>
        </div>
      );
    }
    return null;
  }

  // Generates ASCII-like visual progress bar e.g. █████████░ 91%
  const renderAsciiBar = (pct) => {
    const totalBlocks = 10;
    const filledBlocks = Math.round((pct / 100) * totalBlocks);
    const emptyBlocks = totalBlocks - filledBlocks;
    return '█'.repeat(filledBlocks) + '░'.repeat(emptyBlocks);
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ fontSize: '16px', fontWeight: 600 }}>🔎 Retrieved Knowledge Chunks</h3>
        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
          {results.length} Candidates Retrieved
        </span>
      </div>

      <div className="results-grid">
        {results.map((chunk, idx) => {
          const score = chunk.relevance_score || 0;
          const scorePct = Math.round(score * 100);
          const asciiBar = renderAsciiBar(scorePct);

          return (
            <div key={idx} className="chunk-card">
              <div className="chunk-meta">
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <span className="chunk-tag">📄 {chunk.document_name}</span>
                  <span className="chunk-tag">{chunk.chunk_id}</span>
                  {chunk.page_number && (
                    <span className="chunk-tag">Page {chunk.page_number}</span>
                  )}
                  {chunk.section && (
                    <span className="chunk-tag">{chunk.section}</span>
                  )}
                </div>

                <div className="relevance-bar-container">
                  <span style={{ letterSpacing: '1px', color: 'var(--accent-primary)' }}>
                    {asciiBar}
                  </span>
                  <span style={{ fontWeight: 700 }}>{scorePct}%</span>
                </div>
              </div>

              <div className="chunk-text">
                {chunk.content}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
