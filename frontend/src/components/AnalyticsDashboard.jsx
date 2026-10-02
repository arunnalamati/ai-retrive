import React, { useState, useEffect, useCallback } from 'react';
import {
  getAnalyticsSummary,
  getAnalyticsQueries,
  getAnalyticsDistributions,
  getAnalyticsThemes,
  getAnalyticsUnanswered,
  getAnalyticsKnowledgeGaps,
  getAnalyticsTrends
} from '../services/api';

/**
 * Analytics Dashboard Component (Milestone 4.1 Query Analytics)
 *
 * Real Data Tracking:
 * - Total Queries, Answered, Unanswered, Low Confidence, Clarification Count,
 *   Average Confidence, Average Response Time, Knowledge Gap Count
 *
 * Charts & Distributions:
 * - Queries by Domain, Queries by Type, Answered vs Unanswered, Confidence Distribution, Common Themes
 *
 * Tables:
 * - Recent Queries, Unanswered Queries, Knowledge Gaps
 *
 * Filters:
 * - Domain, Query Type, Resolution Status, Confidence, Date Range
 */
export default function AnalyticsDashboard() {
  const [summary, setSummary] = useState(null);
  const [distributions, setDistributions] = useState(null);
  const [themes, setThemes] = useState([]);
  const [recentQueries, setRecentQueries] = useState([]);
  const [unansweredQueries, setUnansweredQueries] = useState([]);
  const [knowledgeGaps, setKnowledgeGaps] = useState([]);
  const [trends, setTrends] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTableTab, setActiveTableTab] = useState('recent'); // 'recent' | 'unanswered' | 'gaps'

  // Filter state
  const [filters, setFilters] = useState({
    domain: '',
    query_type: '',
    status: '',
    confidence: '',
    start_date: '',
    end_date: ''
  });

  const fetchAnalyticsData = useCallback(async () => {
    setIsLoading(true);
    try {
      const activeFilters = {};
      if (filters.domain) activeFilters.domain = filters.domain;
      if (filters.query_type) activeFilters.query_type = filters.query_type;
      if (filters.status) activeFilters.status = filters.status;
      if (filters.confidence) activeFilters.confidence = filters.confidence;
      if (filters.start_date) activeFilters.start_date = filters.start_date;
      if (filters.end_date) activeFilters.end_date = filters.end_date;

      const [sumRes, distRes, themeRes, queriesRes, unansRes, gapsRes, trendRes] = await Promise.all([
        getAnalyticsSummary(activeFilters).catch(() => ({})),
        getAnalyticsDistributions().catch(() => ({})),
        getAnalyticsThemes(15).catch(() => ({ themes: [] })),
        getAnalyticsQueries(activeFilters, 25, 0).catch(() => ({ queries: [] })),
        getAnalyticsUnanswered(25).catch(() => ({ unanswered_queries: [] })),
        getAnalyticsKnowledgeGaps(25).catch(() => ({ knowledge_gaps: [] })),
        getAnalyticsTrends(7).catch(() => ({ trends: [] }))
      ]);

      setSummary(sumRes);
      setDistributions(distRes);
      setThemes(themeRes.themes || []);
      setRecentQueries(queriesRes.queries || []);
      setUnansweredQueries(unansRes.unanswered_queries || []);
      setKnowledgeGaps(gapsRes.knowledge_gaps || []);
      setTrends(trendRes.trends || []);
    } catch (err) {
      console.error('Failed to load analytics dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      domain: '',
      query_type: '',
      status: '',
      confidence: '',
      start_date: '',
      end_date: ''
    });
  };

  // Helper formatting
  const total = summary?.total_queries || 0;
  const answered = summary?.answered || 0;
  const unanswered = summary?.unanswered || 0;
  const lowConfidence = summary?.low_confidence || 0;
  const clarificationCount = summary?.clarification_count || 0;
  const knowledgeGapCount = summary?.knowledge_gap_count || 0;
  const avgLatency = summary?.avg_response_latency_ms || 0;
  const avgConfidence = summary?.avg_confidence || 0;

  const answeredRate = total > 0 ? Math.round((answered / total) * 100) : 0;
  const unansweredRate = total > 0 ? Math.round((unanswered / total) * 100) : 0;

  return (
    <div className="analytics-dashboard-view">
      {/* Header & Refresh */}
      <div className="dashboard-header-row glass-card" style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h2 style={{ fontSize: '20px', fontWeight: 700, margin: '0 0 4px 0', fontFamily: 'var(--font-heading)' }}>
            📈 Retrieval & Query Analytics
          </h2>
          <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-muted)' }}>
            Real-time telemetry, knowledge gap detection, resolution rates, and thematic metrics.
          </p>
        </div>

        <button
          type="button"
          className="btn-secondary"
          onClick={fetchAnalyticsData}
          disabled={isLoading}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '8px 16px', borderRadius: 'var(--radius-md)' }}
        >
          <span>{isLoading ? '⏳' : '🔄'}</span>
          <span>Refresh Data</span>
        </button>
      </div>

      {/* ============================================================ */}
      {/* Filters Bar                                                  */}
      {/* ============================================================ */}
      <div className="glass-card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <span>🔍</span> Filter Analytics Records:
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '10px' }}>
          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Domain</label>
            <select
              value={filters.domain}
              onChange={(e) => handleFilterChange('domain', e.target.value)}
              className="filter-select"
            >
              <option value="">All Domains</option>
              <option value="College Library Policy">College Library Policy</option>
              <option value="Hostel Accommodation Policy">Hostel Accommodation Policy</option>
              <option value="Academic Examination Policy">Academic Examination Policy</option>
              <option value="RAG Architecture">RAG Architecture</option>
              <option value="Employee Leave Policy">Employee Leave Policy</option>
              <option value="General">General</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Query Type</label>
            <select
              value={filters.query_type}
              onChange={(e) => handleFilterChange('query_type', e.target.value)}
              className="filter-select"
            >
              <option value="">All Types</option>
              <option value="factual">Factual</option>
              <option value="procedural">Procedural</option>
              <option value="comparative">Comparative</option>
              <option value="ambiguous">Ambiguous</option>
              <option value="multi_part">Multi-part</option>
              <option value="follow_up">Follow-up</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Status</label>
            <select
              value={filters.status}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="filter-select"
            >
              <option value="">All Statuses</option>
              <option value="ANSWERED">ANSWERED</option>
              <option value="LOW_CONFIDENCE">LOW_CONFIDENCE</option>
              <option value="UNANSWERED">UNANSWERED</option>
              <option value="CLARIFICATION_REQUIRED">CLARIFICATION_REQUIRED</option>
              <option value="ERROR">ERROR</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Confidence</label>
            <select
              value={filters.confidence}
              onChange={(e) => handleFilterChange('confidence', e.target.value)}
              className="filter-select"
            >
              <option value="">All Confidence</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>Start Date</label>
            <input
              type="date"
              value={filters.start_date}
              onChange={(e) => handleFilterChange('start_date', e.target.value)}
              className="filter-input"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '11px', color: 'var(--text-muted)', marginBottom: '4px' }}>End Date</label>
            <input
              type="date"
              value={filters.end_date}
              onChange={(e) => handleFilterChange('end_date', e.target.value)}
              className="filter-input"
            />
          </div>
        </div>

        {(filters.domain || filters.query_type || filters.status || filters.confidence || filters.start_date || filters.end_date) && (
          <div style={{ marginTop: '12px', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={handleResetFilters}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--accent-primary)',
                fontSize: '12px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              Reset Filters
            </button>
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* 8 Primary Real Metric KPI Cards                              */}
      {/* ============================================================ */}
      <div className="analytics-metrics-grid">
        <div className="metric-box">
          <div className="metric-icon">💬</div>
          <div className="metric-details">
            <span className="metric-title">Total Queries</span>
            <span className="metric-value">{total}</span>
            <span className="metric-hint">Persistent SQLite logs</span>
          </div>
        </div>

        <div className="metric-box success">
          <div className="metric-icon">✅</div>
          <div className="metric-details">
            <span className="metric-title">Answered Queries</span>
            <span className="metric-value">{answered}</span>
            <span className="metric-hint">{answeredRate}% resolution rate</span>
          </div>
        </div>

        <div className="metric-box danger">
          <div className="metric-icon">❌</div>
          <div className="metric-details">
            <span className="metric-title">Unanswered Queries</span>
            <span className="metric-value">{unanswered}</span>
            <span className="metric-hint">{unansweredRate}% missing info</span>
          </div>
        </div>

        <div className="metric-box warning">
          <div className="metric-icon">⚠️</div>
          <div className="metric-details">
            <span className="metric-title">Low Confidence</span>
            <span className="metric-value">{lowConfidence}</span>
            <span className="metric-hint">Near similarity threshold</span>
          </div>
        </div>

        <div className="metric-box purple">
          <div className="metric-icon">❓</div>
          <div className="metric-details">
            <span className="metric-title">Clarifications Asked</span>
            <span className="metric-value">{clarificationCount}</span>
            <span className="metric-hint">Targeted follow-up turns</span>
          </div>
        </div>

        <div className="metric-box gap">
          <div className="metric-icon">🚨</div>
          <div className="metric-details">
            <span className="metric-title">Knowledge Gaps</span>
            <span className="metric-value">{knowledgeGapCount}</span>
            <span className="metric-hint">Flagged for KB update</span>
          </div>
        </div>

        <div className="metric-box info">
          <div className="metric-icon">🎯</div>
          <div className="metric-details">
            <span className="metric-title">Avg Confidence</span>
            <span className="metric-value">{(avgConfidence * 100).toFixed(1)}%</span>
            <span className="metric-hint">Normalized vector distance</span>
          </div>
        </div>

        <div className="metric-box latency">
          <div className="metric-icon">⚡</div>
          <div className="metric-details">
            <span className="metric-title">Avg Response Latency</span>
            <span className="metric-value">{avgLatency} ms</span>
            <span className="metric-hint">Pipeline execution time</span>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Charts & Visual Distributions                                */}
      {/* ============================================================ */}
      <div className="analytics-charts-grid">
        {/* Queries by Domain */}
        <div className="glass-card chart-card">
          <h3 className="chart-heading">🏢 Queries by Knowledge Domain</h3>
          <div className="chart-content">
            {distributions?.domains && Object.keys(distributions.domains).length > 0 ? (
              <div className="bar-list">
                {Object.entries(distributions.domains).map(([dom, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={dom} className="distribution-row">
                      <div className="dist-label-row">
                        <span className="dist-name">{dom}</span>
                        <span className="dist-meta">{count} queries ({pct}%)</span>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill domain-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart-note">No domain distribution records yet.</div>
            )}
          </div>
        </div>

        {/* Queries by Query Type */}
        <div className="glass-card chart-card">
          <h3 className="chart-heading">🏷️ Queries by Intent Type</h3>
          <div className="chart-content">
            {distributions?.query_types && Object.keys(distributions.query_types).length > 0 ? (
              <div className="bar-list">
                {Object.entries(distributions.query_types).map(([qType, count]) => {
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div key={qType} className="distribution-row">
                      <div className="dist-label-row">
                        <span className="dist-name">{qType.charAt(0).toUpperCase() + qType.slice(1).replace('_', ' ')}</span>
                        <span className="dist-meta">{count} ({pct}%)</span>
                      </div>
                      <div className="meter-track">
                        <div className="meter-fill type-fill" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart-note">No query type records yet.</div>
            )}
          </div>
        </div>

        {/* Confidence Distribution */}
        <div className="glass-card chart-card">
          <h3 className="chart-heading">🎯 Confidence Level Distribution</h3>
          <div className="chart-content">
            {distributions?.confidence ? (
              <div className="bar-list">
                {['High', 'Medium', 'Low'].map((level) => {
                  const count = distributions.confidence[level] || 0;
                  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
                  const colorClass = level.toLowerCase();
                  return (
                    <div key={level} className="distribution-row">
                      <div className="dist-label-row">
                        <span className={`dist-name confidence-tag ${colorClass}`}>
                          {level} Confidence
                        </span>
                        <span className="dist-meta">{count} ({pct}%)</span>
                      </div>
                      <div className="meter-track">
                        <div className={`meter-fill confidence-fill ${colorClass}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="empty-chart-note">No confidence records yet.</div>
            )}
          </div>
        </div>

        {/* Common Query Themes */}
        <div className="glass-card chart-card">
          <h3 className="chart-heading">🧩 Common Query Themes</h3>
          <div className="chart-content">
            {themes.length > 0 ? (
              <div className="themes-ranked-list">
                {themes.slice(0, 7).map((t, idx) => (
                  <div key={idx} className="theme-item-row">
                    <div className="theme-rank-badge">#{idx + 1}</div>
                    <div className="theme-meta">
                      <div className="theme-name">{t.theme}</div>
                      <div className="theme-stats">
                        {t.query_count} queries • {t.answered_count} answered
                        {t.knowledge_gap_count > 0 && (
                          <span className="theme-gap-alert"> • {t.knowledge_gap_count} gaps</span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-chart-note">No recurring query themes identified yet.</div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* Interactive Tables Section                                   */}
      {/* ============================================================ */}
      <div className="glass-card tables-card" style={{ marginTop: '20px', padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
          <div className="table-tabs">
            <button
              type="button"
              className={`table-tab-btn ${activeTableTab === 'recent' ? 'active' : ''}`}
              onClick={() => setActiveTableTab('recent')}
            >
              Recent Queries ({recentQueries.length})
            </button>
            <button
              type="button"
              className={`table-tab-btn ${activeTableTab === 'unanswered' ? 'active' : ''}`}
              onClick={() => setActiveTableTab('unanswered')}
            >
              Unanswered Queries ({unansweredQueries.length})
            </button>
            <button
              type="button"
              className={`table-tab-btn ${activeTableTab === 'gaps' ? 'active' : ''}`}
              onClick={() => setActiveTableTab('gaps')}
            >
              Knowledge Gaps ({knowledgeGaps.length})
            </button>
          </div>
        </div>

        {/* Table 1: Recent Queries */}
        {activeTableTab === 'recent' && (
          <div className="table-responsive">
            <table className="analytics-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Query Text</th>
                  <th>Domain</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Confidence</th>
                  <th>Latency</th>
                  <th>Chunks</th>
                </tr>
              </thead>
              <tbody>
                {recentQueries.length === 0 ? (
                  <tr>
                    <td colSpan="8" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No queries match the active filter criteria.
                    </td>
                  </tr>
                ) : (
                  recentQueries.map((q) => (
                    <tr key={q.query_id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {q.timestamp ? q.timestamp.replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td style={{ maxWidth: '280px', wordBreak: 'break-word', fontWeight: 500 }}>
                        {q.query_text}
                      </td>
                      <td>
                        <span className="domain-chip">{q.domain}</span>
                      </td>
                      <td>
                        <span className="type-chip">{q.query_type}</span>
                      </td>
                      <td>
                        <span className={`status-pill ${q.resolution_status?.toLowerCase()}`}>
                          {q.resolution_status}
                        </span>
                      </td>
                      <td>
                        <span className={`confidence-pill ${q.confidence?.toLowerCase()}`}>
                          {q.confidence}
                        </span>
                      </td>
                      <td style={{ fontSize: '12px' }}>{q.response_latency}ms</td>
                      <td style={{ fontSize: '12px', textAlign: 'center' }}>{q.retrieved_chunks}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 2: Unanswered Queries */}
        {activeTableTab === 'unanswered' && (
          <div className="table-responsive">
            <table className="analytics-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Query Text</th>
                  <th>Domain</th>
                  <th>Status</th>
                  <th>Failure Reason</th>
                </tr>
              </thead>
              <tbody>
                {unansweredQueries.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No unanswered queries recorded.
                    </td>
                  </tr>
                ) : (
                  unansweredQueries.map((q) => (
                    <tr key={q.query_id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {q.timestamp ? q.timestamp.replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td style={{ fontWeight: 500 }}>{q.query_text}</td>
                      <td><span className="domain-chip">{q.domain}</span></td>
                      <td>
                        <span className="status-pill unanswered">{q.resolution_status}</span>
                      </td>
                      <td style={{ fontSize: '12.5px', color: '#fca5a5' }}>
                        {q.failure_reason || 'No relevant chunks exceeding similarity threshold'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Table 3: Knowledge Gaps */}
        {activeTableTab === 'gaps' && (
          <div className="table-responsive">
            <table className="analytics-data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Missing Knowledge Query</th>
                  <th>Domain</th>
                  <th>Theme</th>
                  <th>Reason</th>
                </tr>
              </thead>
              <tbody>
                {knowledgeGaps.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '24px' }}>
                      No knowledge gaps detected yet.
                    </td>
                  </tr>
                ) : (
                  knowledgeGaps.map((g) => (
                    <tr key={g.query_id}>
                      <td style={{ whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {g.timestamp ? g.timestamp.replace('T', ' ').slice(0, 19) : '-'}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fca5a5' }}>{g.query_text}</td>
                      <td><span className="domain-chip">{g.domain}</span></td>
                      <td><span className="type-chip">{g.theme || 'General'}</span></td>
                      <td style={{ fontSize: '12.5px', color: 'var(--text-secondary)' }}>
                        {g.failure_reason || 'Information missing from indexed knowledge chunks.'}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
