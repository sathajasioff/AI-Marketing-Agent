import axios from 'axios';

const GHL_BASE = 'https://rest.gohighlevel.com/v1';

const ghl = axios.create({
  baseURL: GHL_BASE,
  headers: {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
  },
});

const LOCATION_ID = process.env.GHL_LOCATION_ID;

export const getContacts = async ({ limit = 100, skip = 0, query = '' } = {}) => {
  const params = { locationId: LOCATION_ID, limit, skip };
  if (query) params.query = query;
  const { data } = await ghl.get('/contacts/', { params });
  return data.contacts || [];
};

export const getContactById = async (contactId) => {
  const { data } = await ghl.get(`/contacts/${contactId}`);
  return data.contact;
};

export const updateContactTags = async (contactId, newTags = []) => {
  const contact = await getContactById(contactId);
  const existing = contact.tags || [];
  const merged = [...new Set([...existing, ...newTags])];
  const { data } = await ghl.put(`/contacts/${contactId}`, { tags: merged });
  return data.contact;
};

export const addContactNote = async (contactId, body) => {
  const { data } = await ghl.post(`/contacts/${contactId}/notes`, { body });
  return data.note;
};

export const triggerWorkflow = async (contactId, workflowTag) => {
  return updateContactTags(contactId, [workflowTag]);
};

export const getPipelines = async () => {
  const { data } = await ghl.get('/pipelines/', { params: { locationId: LOCATION_ID } });
  return data.pipelines || [];
};

export const createOpportunity = async ({ contactId, pipelineId, stageId, title, monetaryValue }) => {
  const { data } = await ghl.post('/opportunities/', {
    locationId: LOCATION_ID,
    contactId,
    pipelineId,
    pipelineStageId: stageId,
    title: title || 'Elev8 Montreal Lead',
    monetaryValue: monetaryValue || 0,
    status: 'open',
  });
  return data.opportunity;
};

export default ghl;