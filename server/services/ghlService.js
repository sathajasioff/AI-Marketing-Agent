import { env } from '../config/env.js';
import GHLAccount from '../models/GHLAccount.js';

const GHL_BASE_URL = 'https://services.leadconnectorhq.com';

const getCredentials = async () => {
  const activeAccount = await GHLAccount.findOne({ isActive: true }).sort({ updatedAt: -1 });

  if (activeAccount?.apiKey && activeAccount?.locationId) {
    return {
      accountId: activeAccount._id,
      accountName: activeAccount.name,
      apiKey: activeAccount.apiKey,
      locationId: activeAccount.locationId,
    };
  }

  return {
    accountId: null,
    accountName: 'Environment Default',
    apiKey: env.GHL_API_KEY,
    locationId: env.GHL_LOCATION_ID,
  };
};

export const getActiveGhlCredentials = async () => getCredentials();

export const getActiveLocationId = async () => {
  const credentials = await getCredentials();
  return credentials.locationId || null;
};

export const getActiveLeadScope = async () => {
  const credentials = await getCredentials();

  if (credentials.accountId) {
    return { ghlAccountId: credentials.accountId };
  }

  return { ghlLocationId: credentials.locationId || null, ghlAccountId: null };
};

const getHeaders = async () => {
  const credentials = await getCredentials();

  if (!credentials.apiKey || !credentials.locationId) {
    throw new Error('Missing GHL_API_KEY or GHL_LOCATION_ID in environment configuration');
  }

  return {
    Authorization: `Bearer ${credentials.apiKey}`,
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
  const headers = await getHeaders();
  const response = await fetch(`${GHL_BASE_URL}${path}`, {
    ...options,
    headers: {
      ...headers,
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
  const credentials = await getCredentials();
  const params = new URLSearchParams({
    locationId: credentials.locationId,
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
