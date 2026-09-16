import React from 'react';

export default function Sources({ sources }) {
  if (!sources || sources.length === 0) return null;

  return (
    <div style={{ marginTop: '16px' }}>
      <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '8px' }}>
        Sources & Attribution
      </div>
      <div className="source-pills">
        {sources.map((src, idx) => {
          const scorePct = Math.round((src.relevance_score || 0) * 100);
          return (
            <div key={idx} className="source-item">
              <span>📄 <strong>{src.document_name}</strong></span>
              <span>•</span>
              <span>Chunk: {src.chunk_id}</span>
              <span>•</span>
              <span style={{ color: 'var(--accent-primary)', fontWeight: 600 }}>Relevance: {scorePct}%</span>
              {src.page_number && <span>(Pg {src.page_number})</span>}
              {src.section && <span>[{src.section}]</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
