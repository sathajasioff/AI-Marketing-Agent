import axios from 'axios';

const GHL_BASE    = 'https://rest.gohighlevel.com/v1';
const LOCATION_ID = process.env.GHL_LOCATION_ID;

// ── Axios instance ──
const ghl = axios.create({
  baseURL: GHL_BASE,
  headers: {
    Authorization: `Bearer ${process.env.GHL_API_KEY}`,
    'Content-Type': 'application/json',
  },
  timeout: 15000,
});

// ── Response interceptor — log GHL errors clearly ──
ghl.interceptors.response.use(
  (res) => res,
  (err) => {
    const status  = err.response?.status;
    const message = err.response?.data?.message || err.message;
    console.error(`[GHL API Error] ${status} — ${message}`);

    if (status === 401) throw new Error('GHL API key is invalid or expired. Check your GHL_API_KEY in .env');
    if (status === 429) throw new Error('GHL rate limit hit. Wait 60 seconds and try again.');
    if (status === 404) throw new Error(`GHL resource not found: ${err.config?.url}`);

    throw new Error(`GHL API error: ${message}`);
  }
);

// ── Helper: validate location ID is set ──
const checkLocation = () => {
  if (!LOCATION_ID) throw new Error('GHL_LOCATION_ID is not set in your .env file');
};

// ──────────────────────────────────────────
// CONTACTS
// ──────────────────────────────────────────

// Get all contacts — supports pagination
export const getContacts = async ({ limit = 100, skip = 0, query = '' } = {}) => {
  checkLocation();
  const params = { locationId: LOCATION_ID, limit, skip };
  if (query) params.query = query;
  const { data } = await ghl.get('/contacts/', { params });
  return data.contacts || [];
};

// Get ALL contacts across all pages (for full sync)
export const getAllContacts = async () => {
  checkLocation();
  const allContacts = [];
  let   skip        = 0;
  const limit       = 100;

  while (true) {
    const contacts = await getContacts({ limit, skip });
    allContacts.push(...contacts);
    if (contacts.length < limit) break;
    skip += limit;
  }

  return allContacts;
};

// Get a single contact by GHL contact ID
export const getContactById = async (contactId) => {
  const { data } = await ghl.get(`/contacts/${contactId}`);
  return data.contact;
};

// Search contacts by email or name
export const searchContacts = async (query) => {
  checkLocation();
  const { data } = await ghl.get('/contacts/', {
    params: { locationId: LOCATION_ID, query, limit: 20 },
  });
  return data.contacts || [];
};

// Create a new contact in GHL
export const createContact = async ({ firstName, lastName, email, phone, tags = [], source = '' }) => {
  checkLocation();
  const { data } = await ghl.post('/contacts/', {
    locationId: LOCATION_ID,
    firstName,
    lastName,
    email,
    phone,
    tags,
    source,
  });
  return data.contact;
};

// Update a contact's basic fields
export const updateContact = async (contactId, fields = {}) => {
  const { data } = await ghl.put(`/contacts/${contactId}`, fields);
  return data.contact;
};

// ──────────────────────────────────────────
// TAGS
// ──────────────────────────────────────────

// Add tags to a contact — merges with existing, never removes unrelated tags
export const updateContactTags = async (contactId, newTags = []) => {
  if (!newTags.length) return null;
  const contact  = await getContactById(contactId);
  const existing = contact.tags || [];
  const merged   = [...new Set([...existing, ...newTags])];
  const { data } = await ghl.put(`/contacts/${contactId}`, { tags: merged });
  return data.contact;
};

// Remove specific tags from a contact
export const removeContactTags = async (contactId, tagsToRemove = []) => {
  const contact  = await getContactById(contactId);
  const existing = contact.tags || [];
  const filtered = existing.filter((t) => !tagsToRemove.includes(t));
  const { data } = await ghl.put(`/contacts/${contactId}`, { tags: filtered });
  return data.contact;
};

// Replace ALL tags on a contact
export const setContactTags = async (contactId, tags = []) => {
  const { data } = await ghl.put(`/contacts/${contactId}`, { tags });
  return data.contact;
};

// ──────────────────────────────────────────
// NOTES
// ──────────────────────────────────────────

// Add a note to a contact
export const addContactNote = async (contactId, body) => {
  const { data } = await ghl.post(`/contacts/${contactId}/notes`, { body });
  return data.note;
};

// Get all notes for a contact
export const getContactNotes = async (contactId) => {
  const { data } = await ghl.get(`/contacts/${contactId}/notes`);
  return data.notes || [];
};

// ──────────────────────────────────────────
// TASKS
// ──────────────────────────────────────────

// Add a task/follow-up reminder to a contact
export const addContactTask = async (contactId, { title, dueDate, description = '' }) => {
  const { data } = await ghl.post(`/contacts/${contactId}/tasks`, {
    title,
    dueDate,
    description,
    completed: false,
  });
  return data.task;
};

// ──────────────────────────────────────────
// WORKFLOWS (via trigger tags)
// ──────────────────────────────────────────

// Trigger a GHL workflow by applying a tag
// Set up the workflow in GHL with trigger condition: "Tag Added = [workflowTag]"
export const triggerWorkflow = async (contactId, workflowTag) => {
  return updateContactTags(contactId, [workflowTag]);
};

// Trigger multiple workflows at once
export const triggerMultipleWorkflows = async (contactId, workflowTags = []) => {
  return updateContactTags(contactId, workflowTags);
};

// ──────────────────────────────────────────
// PIPELINES & OPPORTUNITIES
// ──────────────────────────────────────────

// Get all pipelines for the location
export const getPipelines = async () => {
  checkLocation();
  const { data } = await ghl.get('/pipelines/', {
    params: { locationId: LOCATION_ID },
  });
  return data.pipelines || [];
};

// Create an opportunity (contact in a pipeline stage)
export const createOpportunity = async ({
  contactId,
  pipelineId,
  stageId,
  title,
  monetaryValue = 0,
  status = 'open',
}) => {
  checkLocation();
  const { data } = await ghl.post('/opportunities/', {
    locationId:      LOCATION_ID,
    contactId,
    pipelineId,
    pipelineStageId: stageId,
    title:           title || 'Elev8 Montreal Lead',
    monetaryValue,
    status,
  });
  return data.opportunity;
};

// Update an opportunity stage
export const updateOpportunityStage = async (opportunityId, stageId) => {
  const { data } = await ghl.put(`/opportunities/${opportunityId}`, {
    pipelineStageId: stageId,
  });
  return data.opportunity;
};

// ──────────────────────────────────────────
// CUSTOM VALUES (GHL custom fields)
// ──────────────────────────────────────────

// Update a contact's custom field (e.g. AI Score)
export const updateCustomField = async (contactId, customField = {}) => {
  const { data } = await ghl.put(`/contacts/${contactId}`, { customField });
  return data.contact;
};

// ──────────────────────────────────────────
// BULK OPERATIONS
// ──────────────────────────────────────────

// Push AI qualification data to GHL for a contact in one call:
// adds tags + adds a note + optionally triggers a workflow
export const pushAIQualificationToGHL = async ({
  contactId,
  tags       = [],
  noteBody   = '',
  workflowTag = null,
}) => {
  const results = { tags: null, note: null, workflow: null };

  if (tags.length) {
    results.tags = await updateContactTags(contactId, tags);
  }

  if (noteBody) {
    results.note = await addContactNote(contactId, noteBody);
  }

  if (workflowTag) {
    results.workflow = await updateContactTags(contactId, [workflowTag]);
  }

  return results;
};

// ──────────────────────────────────────────
// HEALTH CHECK
// ──────────────────────────────────────────

// Test GHL connection — call this on server startup or from a settings page
export const testGHLConnection = async () => {
  try {
    checkLocation();
    const contacts = await getContacts({ limit: 1 });
    return {
      connected:  true,
      locationId: LOCATION_ID,
      message:    `GHL connected successfully. Found ${contacts.length > 0 ? 'contacts' : 'no contacts yet'}.`,
    };
  } catch (err) {
    return {
      connected: false,
      message:   err.message,
    };
  }
};

export default ghl;