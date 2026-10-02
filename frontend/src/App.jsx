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
import ChatInterface from './components/ChatInterface';
import AnalyticsDashboard from './components/AnalyticsDashboard';
import { healthCheck, getDocuments, getSystemStats, queryKnowledgeBase } from './services/api';
import './App.css';

export default function App() {
  const [activeTab, setActiveTab] = useState('ask-ai');
  const [isConnected, setIsConnected] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [stats, setStats] = useState({ total_documents: 0, total_chunks: 0, status: 'connecting' });
  
  // Query & Conversation State (Milestone 3)
  const [query, setQuery] = useState('');
  const [topK, setTopK] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [queryResponse, setQueryResponse] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [conversationHistory, setConversationHistory] = useState([]);
  const [activeTopic, setActiveTopic] = useState(null);

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

  // Execute Query with Multi-Agent Step Animations (supports M3 conversation & clarification and M4 input_mode)
  const handleQuery = async (customQuery, userClarification = null, inputMode = 'text') => {
    const rawQ = customQuery !== undefined && customQuery !== null ? customQuery : query;
    const q = typeof rawQ === 'string' ? rawQ.trim() : '';
    if ((!q && !userClarification) || isLoading) return;

    setIsLoading(true);
    setErrorMessage('');

    // Pipeline animation sequence
    setPipelineState({
      query: 'completed',
      understanding: 'processing',
      retrieval: 'idle',
      generation: 'idle',
      output: 'idle',
      clarification: 'idle'
    });

    try {
      await new Promise((r) => setTimeout(r, 150));
      setPipelineState((prev) => ({
        ...prev,
        understanding: 'completed',
        retrieval: 'processing'
      }));

      const res = await queryKnowledgeBase(q, topK, conversationId, userClarification, inputMode || 'text');

      if (res.conversation_id) {
        setConversationId(res.conversation_id);
      }
      if (res.active_topic) {
        setActiveTopic(res.active_topic);
      }

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
      setConversationHistory((prev) => {
        return [...prev, res];
      });

      if (!userClarification) {
        setQuery('');
      }
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

  const handleClarificationSubmit = (clarificationText) => {
    handleQuery('', clarificationText);
  };

  const handleResetSession = () => {
    setConversationId(null);
    setConversationHistory([]);
    setActiveTopic(null);
    setQueryResponse(null);
    setQuery('');
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

          {/* Ask AI Tab (Milestone 4 Modern Chat UI) */}
          {activeTab === 'ask-ai' && (
            <ChatInterface
              conversationHistory={conversationHistory}
              activeTopic={activeTopic}
              onSendMessage={(msg, mode) => handleQuery(msg, null, mode || 'text')}
              onSubmitClarification={handleClarificationSubmit}
              isLoading={isLoading}
              topK={topK}
              setTopK={setTopK}
              onResetSession={handleResetSession}
              pipelineState={pipelineState}
              errorMessage={errorMessage}
            />
          )}

          {/* Retrieval Analytics Dashboard Tab (Milestone 4.1) */}
          {activeTab === 'analytics' && (
            <AnalyticsDashboard />
          )}

          {/* Architecture Tab */}
          {activeTab === 'architecture' && (
            <div className="glass-card">
              <h2 style={{ fontSize: '18px', fontWeight: 700, fontFamily: 'var(--font-heading)', marginBottom: '12px' }}>
                🏗️ Multi-Agent Architecture
              </h2>
              <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '16px' }}>
                The architecture decouples monolithic search into specialized autonomous agents:
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>1. Conversation Memory Agent (M3.2):</strong> Maintains multi-turn context, resolves coreference ('its' → 'RAG'), and preserves session topic isolation without writing to ChromaDB.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>2. Query Understanding Agent:</strong> Classifies queries into <code>factual</code>, <code>procedural</code>, <code>comparative</code>, or <code>ambiguous</code> with confidence metrics.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>3. Clarification Agent (M3.1):</strong> Detects missing parameters or vague referents, formulating targeted follow-up prompts before retrieval.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>4. Retrieval Agent:</strong> Performs 384-d semantic search in ChromaDB, supports multi-part subqueries, and applies relevance thresholds.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>5. Response Generation Agent:</strong> Synthesizes grounded answers strictly from retrieved context with zero hallucination.
                </div>
                <div style={{ padding: '12px', background: 'rgba(15, 23, 42, 0.4)', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                  <strong>6. Response Transparency Panel (M3.4):</strong> Audits supporting chunks, document provenance, and exact relevance scores.
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
