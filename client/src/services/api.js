import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Agents ──
export const runStrategy = (data)         => api.post('/agents/strategy', data);
export const runContent  = (data)         => api.post('/agents/content', data);
export const runEmail    = (data)         => api.post('/agents/email', data);
export const runLeads    = (data)         => api.post('/agents/leads', data);

// ── Settings ──
export const getSettings    = ()     => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// ── History ──
export const getHistory         = (params)   => api.get('/history', { params });
export const getGenerationById  = (id)       => api.get(`/history/${id}`);
export const saveGeneration     = (id, data) => api.patch(`/history/${id}/save`, data);
export const deleteGeneration   = (id)       => api.delete(`/history/${id}`);

// ── GHL ──
export const syncLeads        = ()          => api.post('/ghl/sync');
export const getLeads         = (params)    => api.get('/ghl/leads', { params });
export const getPipelineStats = ()          => api.get('/ghl/stats');
export const qualifyLead      = (id)        => api.post(`/ghl/qualify/${id}`);
export const pushTagsToGHL    = (id)        => api.post(`/ghl/push-tags/${id}`);
export const pushNoteToGHL    = (id)        => api.post(`/ghl/push-note/${id}`);
export const triggerWorkflow  = (id, tag)   => api.post(`/ghl/trigger-workflow/${id}`, { workflowTag: tag });
export const setLeadOutcome   = (id, data)  => api.patch(`/ghl/outcome/${id}`, data);

// ── Learning ──
export const getLearningStats   = ()     => api.get('/learning/stats');
export const getTopPrompts      = (p)    => api.get('/learning/top-prompts', { params: p });
export const recordFeedback     = (data) => api.post('/learning/feedback', data);
export const recordLeadOutcome  = (data) => api.post('/learning/outcome', data);

// ── Lead Intelligence ──
export const getAudienceSummary        = ()         => api.get('/intelligence/audience-summary');
export const analyzeLeadPatterns       = ()         => api.get('/intelligence/patterns');
export const generateAdCopyFromLeads   = (data)     => api.post('/intelligence/ad-copy-from-leads', data);
export const generatePersonalizedEmail = (id)       => api.post(`/intelligence/email-lead/${id}`);
export const generateBulkEmails        = (data)     => api.post('/intelligence/bulk-email', data);
export const generatePipelineStrategy  = (data)     => api.post('/intelligence/strategy-from-pipeline', data);
export const pushEmailToGHL            = (id, data) => api.post(`/intelligence/push-email-to-ghl/${id}`, data);

// ── GHL Accounts ──
export const getGHLAccounts    = ()         => api.get('/ghl-accounts');
export const createGHLAccount  = (data)     => api.post('/ghl-accounts', data);
export const activateGHLAccount = (id)      => api.patch(`/ghl-accounts/${id}/activate`);
export const updateGHLAccount  = (id, data) => api.put(`/ghl-accounts/${id}`, data);
export const deleteGHLAccount  = (id)       => api.delete(`/ghl-accounts/${id}`);

// ── Integrations ──
export const getIntegrations    = ()     => api.get('/integrations');
export const saveMetaCreds      = (data) => api.put('/integrations/meta', data);
export const testMetaConnection = ()     => api.post('/integrations/meta/test');
export const disconnectMeta     = ()     => api.delete('/integrations/meta');

// ── Meta Ads ──
export const getMetaDashboard  = (params) => api.get('/meta/dashboard', { params });
export const getMetaSummary    = (params) => api.get('/meta/summary',   { params });
export const getMetaCampaigns  = (params) => api.get('/meta/campaigns', { params });

export default api;