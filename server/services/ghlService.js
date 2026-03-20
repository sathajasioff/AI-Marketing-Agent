import { env } from '../config/env.js';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

const getHeaders = () => {
  if (!env.GHL_API_KEY || !env.GHL_LOCATION_ID) {
    throw new Error('Missing GHL_API_KEY or GHL_LOCATION_ID in environment configuration');
  }

  return {
    Authorization: `Bearer ${env.GHL_API_KEY}`,
    Version: '2021-07-28',
    Accept: 'application/json',
    'Content-Type': 'application/json',
  };
};

const parseJson = async (response) => {
  const text = await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
};

const request = async (path, options = {}) => {
  const response = await fetch(`${GHL_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...getHeaders(),
      ...(options.headers || {}),
    },
  });

  const data = await parseJson(response);

  if (!response.ok) {
    const message = data.message || data.msg || data.error || `GHL request failed with status ${response.status}`;
    const error = new Error(message);
    error.statusCode = response.status;
    error.ghlResponse = data;
    throw error;
  }

  return data;
};

export const getContacts = async ({ limit = 100, page = 1, query = '' } = {}) => {
  const params = new URLSearchParams({
    locationId: env.GHL_LOCATION_ID,
    limit: String(limit),
    page: String(page),
  });

  if (query) {
    params.set('query', query);
  }

  const data = await request(`/contacts/?${params.toString()}`, {
    method: 'GET',
  });

  return data.contacts || data.data || [];
};

export const addContactTags = async (contactId, tags = []) => {
  return request(`/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: 'POST',
    body: JSON.stringify({ tags }),
  });
};

export const addContactNote = async (contactId, body) => {
  return request(`/contacts/${encodeURIComponent(contactId)}/notes`, {
    method: 'POST',
    body: JSON.stringify({ body }),
  });
};

export const addContactToWorkflow = async (contactId, workflowId) => {
  return request(`/contacts/${encodeURIComponent(contactId)}/workflow/${encodeURIComponent(workflowId)}`, {
    method: 'POST',
  });
};
