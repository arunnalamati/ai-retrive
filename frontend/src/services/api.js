/**
 * Centralized API service for communicating with the FastAPI backend.
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

/**
 * Check backend health status
 */
export async function healthCheck() {
  try {
    const res = await fetch(`${API_BASE}/health`, {
      headers: { 'Accept': 'application/json' }
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
}

/**
 * Upload a document (PDF, DOCX, TXT, CSV)
 */
export async function uploadDocument(file) {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/upload`, {
    method: 'POST',
    body: formData
  });

  if (!res.ok) {
    let errorMsg = `Upload failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Retrieve all indexed documents
 */
export async function getDocuments() {
  const res = await fetch(`${API_BASE}/documents`);
  if (!res.ok) {
    throw new Error(`Failed to fetch documents: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Delete an indexed document
 */
export async function deleteDocument(documentId) {
  const res = await fetch(`${API_BASE}/documents/${documentId}`, {
    method: 'DELETE'
  });
  if (!res.ok) {
    throw new Error(`Failed to delete document: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Fetch knowledge base statistics
 */
export async function getSystemStats() {
  const res = await fetch(`${API_BASE}/stats`);
  if (!res.ok) {
    throw new Error(`Failed to fetch system stats: ${res.statusText}`);
  }
  return await res.json();
}

/**
 * Submit query to the multi-agent RAG system (supports M3 conversation_id and clarification and M4 input_mode)
 */
export async function queryKnowledgeBase(query, topK = 3, conversationId = null, userClarification = null, inputMode = 'text') {
  const payload = {
    query: (query || '').trim(),
    top_k: Number(topK),
    input_mode: inputMode || 'text'
  };
  if (conversationId) payload.conversation_id = conversationId;
  if (userClarification) payload.user_clarification = userClarification.trim();

  const res = await fetch(`${API_BASE}/query`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!res.ok) {
    let errorMsg = `Query failed with status ${res.status}`;
    try {
      const errJson = await res.json();
      if (errJson.detail) errorMsg = errJson.detail;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return await res.json();
}

/**
 * Fetch conversation history and active state
 */
export async function getConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`);
  if (!res.ok) throw new Error('Failed to fetch conversation');
  return await res.json();
}

/**
 * Reset conversation session memory
 */
export async function clearConversation(conversationId) {
  const res = await fetch(`${API_BASE}/conversations/${conversationId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to clear conversation');
  return await res.json();
}

/**
 * Milestone 4.1: Query Analytics APIs
 */
export async function getAnalyticsSummary(filters = {}) {
  const params = new URLSearchParams();
  if (filters.domain) params.append('domain', filters.domain);
  if (filters.query_type) params.append('query_type', filters.query_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.confidence) params.append('confidence', filters.confidence);
  if (filters.start_date) params.append('start_date', filters.start_date);
  if (filters.end_date) params.append('end_date', filters.end_date);

  const res = await fetch(`${API_BASE}/analytics/summary?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch analytics summary');
  return await res.json();
}

export async function getAnalyticsQueries(filters = {}, limit = 50, offset = 0) {
  const params = new URLSearchParams({ limit, offset });
  if (filters.domain) params.append('domain', filters.domain);
  if (filters.query_type) params.append('query_type', filters.query_type);
  if (filters.status) params.append('status', filters.status);
  if (filters.confidence) params.append('confidence', filters.confidence);

  const res = await fetch(`${API_BASE}/analytics/queries?${params.toString()}`);
  if (!res.ok) throw new Error('Failed to fetch queries list');
  return await res.json();
}

export async function getAnalyticsDistributions() {
  const res = await fetch(`${API_BASE}/analytics/distributions`);
  if (!res.ok) throw new Error('Failed to fetch analytics distributions');
  return await res.json();
}

export async function getAnalyticsThemes(limit = 15) {
  const res = await fetch(`${API_BASE}/analytics/themes?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch analytics themes');
  return await res.json();
}

export async function getAnalyticsUnanswered(limit = 50) {
  const res = await fetch(`${API_BASE}/analytics/unanswered?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch unanswered queries');
  return await res.json();
}

export async function getAnalyticsKnowledgeGaps(limit = 50) {
  const res = await fetch(`${API_BASE}/analytics/knowledge-gaps?limit=${limit}`);
  if (!res.ok) throw new Error('Failed to fetch knowledge gaps');
  return await res.json();
}

export async function getAnalyticsTrends(days = 7) {
  const res = await fetch(`${API_BASE}/analytics/trends?days=${days}`);
  if (!res.ok) throw new Error('Failed to fetch analytics trends');
  return await res.json();
}
