import axios from 'axios';

const api = axios.create({ baseURL: '/api' });

// ── Agents ──
export const runStrategy = (data)          => api.post('/agents/strategy', data);
export const runContent  = (data)          => api.post('/agents/content', data);
export const runEmail    = (data)          => api.post('/agents/email', data);
export const runLeads    = (data)          => api.post('/agents/leads', data);

// ── Settings ──
export const getSettings    = ()     => api.get('/settings');
export const updateSettings = (data) => api.put('/settings', data);

// ── History ──
export const getHistory          = (params)  => api.get('/history', { params });
export const getGenerationById   = (id)      => api.get(`/history/${id}`);
export const saveGeneration      = (id, data) => api.patch(`/history/${id}/save`, data);
export const deleteGeneration    = (id)      => api.delete(`/history/${id}`);

// GHL
export const syncLeads       = ()        => api.post('/ghl/sync');
export const getLeads        = (params)  => api.get('/ghl/leads', { params });
export const getPipelineStats= ()        => api.get('/ghl/stats');
export const qualifyLead     = (id)      => api.post(`/ghl/qualify/${id}`);
export const pushTagsToGHL   = (id)      => api.post(`/ghl/push-tags/${id}`);
export const pushNoteToGHL   = (id)      => api.post(`/ghl/push-note/${id}`);
export const triggerWorkflow = (id, data) => api.post(`/ghl/trigger-workflow/${id}`, data);
export const setLeadOutcome  = (id, data)=> api.patch(`/ghl/outcome/${id}`, data);

export const getLearningStats  = ()     => api.get('/learning/stats');
export const getTopPrompts     = (p)    => api.get('/learning/top-prompts', { params: p });
export const recordFeedback    = (data) => api.post('/learning/feedback', data);
export const recordLeadOutcome = (data) => api.post('/learning/outcome', data);

export default api;
