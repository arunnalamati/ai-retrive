import React from 'react';

export default function Dashboard({ stats, onSelectQuery }) {
  const statItems = [
    {
      id: 'docs',
      label: 'Indexed Documents',
      value: stats?.total_documents ?? 0,
      icon: '📚'
    },
    {
      id: 'chunks',
      label: 'Total Vector Chunks',
      value: stats?.total_chunks ?? 0,
      icon: '🧩'
    },
    {
      id: 'store',
      label: 'Vector Store',
      value: 'ChromaDB',
      icon: '💾'
    },
    {
      id: 'status',
      label: 'System Status',
      value: stats?.status === 'online' ? 'Operational' : 'Ready',
      icon: '⚡'
    }
  ];

  const quickQueries = [
    { query: 'What is RAG?', type: 'factual', desc: 'Factual query grounded in AI RAG Guide' },
    { query: 'What are the steps in a RAG pipeline?', type: 'procedural', desc: 'Procedural workflow extraction' },
    { query: 'What is the difference between the Retrieval Agent and Response Generation Agent?', type: 'comparative', desc: 'Comparative intent analysis' },
    { query: 'How does it work?', type: 'ambiguous', desc: 'Ambiguous query triggering clarification' },
    { query: "What is the company's maternity leave policy?", type: 'unavailable', desc: 'Out-of-domain query (zero hallucination test)' },
    { query: 'How many annual leave days does an employee receive?', type: 'factual', desc: 'Employee leave policy fact extraction' }
  ];

  return (
    <div>
      {/* Top Statistics Cards */}
      <div className="stats-grid">
        {statItems.map((s) => (
          <div key={s.id} className="stat-card">
            <div className="stat-icon">{s.icon}</div>
            <div className="stat-info">
              <div className="stat-label">{s.label}</div>
              <div className="stat-value">{s.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Architecture & Quick Test Panel */}
      <div className="glass-card">
        <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '8px' }}>
          🚀 Multi-Agent System Overview
        </h2>
        <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          This system implements <strong>Milestone 1</strong> (document ingestion, cleaning, chunking, and ChromaDB vector indexing) 
          and <strong>Milestone 2</strong> (multi-agent orchestration with Query Understanding, Retrieval, Response Generation, 
          and Clarification agents). Embeddings are generated locally using <code>all-MiniLM-L6-v2</code>.
        </p>

        <div style={{ marginTop: '20px' }}>
          <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '10px' }}>
            🧪 Quick Validation Queries (Click to Test):
          </h4>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '12px' }}>
            {quickQueries.map((item, idx) => (
              <div
                key={idx}
                onClick={() => onSelectQuery && onSelectQuery(item.query)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(15, 23, 42, 0.5)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
                onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--border-subtle)'}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                  <span style={{ fontWeight: 600, fontSize: '13px', color: '#fff' }}>"{item.query}"</span>
                  <span className={`type-badge ${item.type}`} style={{ fontSize: '10px' }}>{item.type}</span>
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>{item.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
