import React, { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import UploadPanel from './components/UploadPanel';
import DocumentList from './components/DocumentList';
import QueryPanel from './components/QueryPanel';
import QueryAnalysis from './components/QueryAnalysis';
import AgentPipeline from './components/AgentPipeline';
import RetrievalResults from './components/RetrievalResults';
import ResponsePanel from './components/ResponsePanel';
import { healthCheck, getDocuments, getSystemStats, queryKnowledgeBase } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('ask-ai');
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total_documents: 0, total_chunks: 0, status: 'connecting' });
  
  // Query State
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Agent Pipeline Real-time animation states
  const [pipelineState, setPipelineState] = useState({
    query: 'idle',
    understanding: 'idle',
    retrieval: 'idle',
    generation: 'idle',
    output: 'idle',
    clarification: 'idle'
  });

  // Check health and fetch initial state
  const refreshData = useCallback(async () => {
    try {
      const health = await healthCheck();
      if (health && health.status === 'ok') {
        setIsConnected(true);
        const [docsData, statsData] = await Promise.all([
          getDocuments().catch(() => []),
          getSystemStats().catch(() => ({ total_documents: 0, total_chunks: 0, status: 'online' }))
        ]);
        setDocuments(docsData);
        setStats(statsData);
      } else {
        setIsConnected(false);
      }
    } catch (_) {
      setIsConnected(false);
    }
  }, []);

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 5000);
    return () => clearInterval(interval);
  }, [refreshData]);

  // Execute Query with Multi-Agent Step Animations
  const handleQuery = async (customQuery) => {
    const q = customQuery || query;
    if (!q.trim() || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');
    setQueryResponse(null);

    // Initial pipeline state
    setPipelineState({
      query: 'completed',
      understanding: 'processing',
      retrieval: 'idle',
      generation: 'idle',
      output: 'idle',
      clarification: 'idle'
    });

    try {
      // Small simulated tick for visual understanding stage
      await new Promise((r) => setTimeout(r, 250));
      setPipelineState((prev) => ({
        ...prev,
        understanding: 'completed',
        retrieval: 'processing'
      }));

      const res = await queryKnowledgeBase(q, topK);

      const isAmbiguous = res.route === 'clarification_required';

      if (isAmbiguous) {
        setPipelineState({
          query: 'completed',
          understanding: 'completed',
          retrieval: 'idle',
          clarification: 'completed',
          generation: 'completed',
          output: 'completed'
        });
      } else {
        setPipelineState({
          query: 'completed',
          understanding: 'completed',
          retrieval: 'completed',
          generation: 'completed',
          output: 'completed',
          clarification: 'idle'
        });
      }

      setQueryResponse(res);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to process query');
      setPipelineState({
        query: 'completed',
        understanding: 'error',
        retrieval: 'error',
        generation: 'error',
        output: 'error',
        clarification: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickQuery = (sampleQ) => {
    setQuery(sampleQ);
    setActiveTab('ask-ai');
    handleQuery(sampleQ);
  };

  return (
    <div className="app-container">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      <div className="main-content">
        <Header isConnected={isConnected} />

        <main className="content-wrapper">
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <Dashboard stats={stats} onSelectQuery={handleQuickQuery} />
          )}

          {/* Knowledge Base Tab */}
          {activeTab === 'knowledge' && (
            <div>
              <UploadPanel onUploadSuccess={refreshData} />
              <DocumentList documents={documents} onRefresh={refreshData} />
            </div>
          )}

          {/* Ask AI Tab */}
          {activeTab === 'ask-ai' && (
            <div>
              <QueryPanel
                query={query}
                setQuery={setQuery}
                topK={topK}
                setTopK={setTopK}
                onSearch={() => handleQuery()}
                isLoading={isLoading}
              />

              {errorMessage && (
                <div style={{
                  padding: '14px 18px',
                  borderRadius: 'var(--radius-md)',
                  background: 'rgba(239, 68, 68, 0.15)',
                  border: '1px solid rgba(239, 68, 68, 0.3)',
                  color: 'var(--danger)',
                  marginBottom: '20px',
                  fontSize: '14px'
                }}>
                  ❌ {errorMessage}
                </div>
              )}

              {/* Agent Pipeline Visualizer */}
              {(isLoading || queryResponse) && (
                <AgentPipeline
                  pipelineState={pipelineState}
                  pipelineTrace={queryResponse?.pipeline_trace}
                  isAmbiguous={queryResponse?.route === 'clarification_required'}
                />
              )}

              {/* Query Understanding Card */}
              {queryResponse && (
                <QueryAnalysis analysis={{
                  query: queryResponse.query,
                  query_type: queryResponse.query_type,
                  classification_confidence: queryResponse.classification_confidence,
                  route: queryResponse.route,
                  reasoning: queryResponse.pipeline_trace?.[0]?.details
                }} />
              )}

              {/* AI Response Container */}
              {queryResponse && (
                <ResponsePanel responseData={queryResponse} />
              )}

              {/* Retrieved Chunks Results */}
              {queryResponse && queryResponse.route !== 'clarification_required' && (
                <RetrievalResults
                  results={queryResponse.retrieval?.results}
                  noSufficientInfo={queryResponse.retrieval?.no_sufficient_information}
                />
              )}
            </div>
          )}

          {/* Analytics Tab */}
          {activeTab === 'analytics' && (
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
                📈 Retrieval Analytics & Quality Metrics
              </h2>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginTop: '16px' }}>
                <div className="analysis-item">
                  <div className="analysis-label">Vector Embedding Model</div>
                  <div className="analysis-val">all-MiniLM-L6-v2</div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-label">Embedding Dimensions</div>
                  <div className="analysis-val">384 Dimensions</div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-label">Distance Metric</div>
                  <div className="analysis-val">Cosine Distance</div>
                </div>
                <div className="analysis-item">
                  <div className="analysis-label">Default Relevance Threshold</div>
                  <div className="analysis-val">0.35 (Configurable)</div>
                </div>
              </div>
              <p style={{ marginTop: '20px', fontSize: '13.5px', color: 'var(--text-secondary)' }}>
                Similarity scores represent normalized cosine values calculated as <code>1 - (distance / 2)</code>. 
                Queries with chunks failing to exceed the threshold are flagged with low confidence and prevent hallucinations.
              </p>
            </div>
          )}

          {/* System Architecture Tab */}
          {activeTab === 'architecture' && (
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
                🏛️ Multi-Agent Architecture (Milestones 1 & 2)
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '16px' }}>
                The architecture decouples monolithic search into specialized autonomous agents:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>1. Query Understanding Agent:</strong> Classifies queries into <code>factual</code>, <code>procedural</code>, <code>comparative</code>, or <code>ambiguous</code> with confidence metrics.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>2. Retrieval Agent:</strong> Performs 384-d semantic search in ChromaDB, ranks results, and applies relevance thresholds.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>3. Response Generation Agent:</strong> Synthesizes grounded answers strictly from retrieved context with zero hallucination.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>4. Clarification Agent:</strong> Formulates guided prompts when queries lack clear subject context.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>5. Conversation Memory Agent:</strong> Maintains session turn history as an architectural foundation component.
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
                ⚙️ System Configuration
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>FastAPI Server URL</label>
                  <input
                    type="text"
                    className="query-input"
                    value="http://127.0.0.1:8000"
                    readOnly
                    style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', marginTop: '6px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>ChromaDB Storage Directory</label>
                  <input
                    type="text"
                    className="query-input"
                    value="./data/chroma"
                    readOnly
                    style={{ background: 'rgba(15, 23, 42, 0.5)', border: '1px solid var(--border-subtle)', borderRadius: '8px', padding: '8px 12px', marginTop: '6px', width: '100%' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)' }}>Default Chunk Size / Overlap</label>
                  <div style={{ fontSize: '14px', color: 'var(--text-primary)', marginTop: '4px' }}>
                    700 characters / 120 characters overlap
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
