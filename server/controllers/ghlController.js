import Anthropic from '@anthropic-ai/sdk';
import Lead from '../models/Lead.js';
import EventSettings from '../models/EventSettings.js';
import {
  getContacts,
  addContactTags,
  addContactNote,
  addContactToWorkflow,
  getActiveGhlCredentials,
  getActiveLeadScope,
} from '../services/ghlService.js';
import { recordPromptUse, hashPrompt } from '../services/learningService.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const buildDedupedLeadPipeline = (baseQuery = {}) => ([
  { $match: baseQuery },
  // Keep the newest copy when historical duplicate lead docs exist for the same GHL contact.
  { $sort: { lastSyncedAt: -1, updatedAt: -1, createdAt: -1, _id: -1 } },
  { $group: { _id: '$ghlContactId', doc: { $first: '$$ROOT' } } },
  { $replaceRoot: { newRoot: '$doc' } },
]);

const getScopedLeadScope = async (clientId) => {
  const baseQuery = await getActiveLeadScope();
  return clientId ? { ...baseQuery, clientId } : baseQuery;
};

export const getLeads = async (req, res, next) => {
  try {
    const { segment, outcome, limit = 100, page = 1 } = req.query;
    const pageNumber = Math.max(1, Number(page) || 1);
    const pageSize = Math.max(1, Number(limit) || 100);
    const baseQuery = await getScopedLeadScope(req.clientId);

    const filteredMatch = {};
    if (segment) filteredMatch.aiSegment = segment;
    if (outcome) filteredMatch.outcome = outcome;

    const [result] = await Lead.aggregate([
      ...buildDedupedLeadPipeline(baseQuery),
      ...(Object.keys(filteredMatch).length ? [{ $match: filteredMatch }] : []),
      {
        $facet: {
          metadata: [{ $count: 'total' }],
          leads: [
            { $sort: { aiScore: -1, createdAt: -1, _id: -1 } },
            { $skip: (pageNumber - 1) * pageSize },
            { $limit: pageSize },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      total: result?.metadata?.[0]?.total || 0,
      page: pageNumber,
      limit: pageSize,
      leads: result?.leads || [],
    });
  } catch (err) { next(err); }
};

// ── POST /api/ghl/sync ──
export const syncLeadsFromGHL = async (req, res, next) => {
  try {
    const batchSize  = Math.min(Number(req.body?.batchSize) || 100, 250);
    const credentials = await getActiveGhlCredentials();
    const leadScope = await getActiveLeadScope();
    let page         = 1;
    let synced       = 0;
    let created      = 0;
    let batchCount   = 0;

    while (true) {
      const contacts = await getContacts({ limit: batchSize, page, clientId: req.clientId });
      if (!contacts.length) break;

      const uniqueContacts = Array.from(
        new Map(contacts.filter((contact) => contact?.id).map((contact) => [contact.id, contact])).values()
      );

      const operations = uniqueContacts
        .map(contact => ({
          updateOne: {
            filter: {
              ghlContactId: contact.id,
              clientId:     req.clientId,              // ← scoped
              ...(leadScope.ghlAccountId
                ? { ghlAccountId: leadScope.ghlAccountId }
                : { ghlLocationId: leadScope.ghlLocationId }),
            },
            update: {
              $set: {
                clientId:     req.clientId,            // ← scoped
                ghlContactId: contact.id,
                ghlAccountId: leadScope.ghlAccountId,
                ghlAccountName: credentials.accountName || '',
                ghlLocationId: leadScope.ghlLocationId,
                firstName:    contact.firstName || '',
                lastName:     contact.lastName  || '',
                email:        contact.email     || '',
                phone:        contact.phone     || '',
                tags:         contact.tags      || [],
                source:       contact.source    || '',
                ghlCreatedAt: contact.dateAdded ? new Date(contact.dateAdded) : null,
                lastSyncedAt: new Date(),
              },
            },
            upsert: true,
          },
        }));

      if (operations.length) {
        const result = await Lead.bulkWrite(operations, { ordered: false });
        created += result.upsertedCount || 0;
      }

      synced     += uniqueContacts.length;
      batchCount += 1;
      page       += 1;

      if (contacts.length < batchSize) break;
    }

    res.json({
      success:  true,
      synced,
      created,
      batches:  batchCount,
      message:  `Synced ${synced} contacts from GHL (${created} new)`,
    });
  } catch (err) { next(err); }
};

// ── POST /api/ghl/qualify/:id ──
export const qualifyLead = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({
      _id:      req.params.id,
      clientId: req.clientId,                          // ← scoped
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    const settings     = await EventSettings.findOne({ clientId: req.clientId }); // ← scoped
    const eventContext = settings
      ? `EVENT: ${settings.eventName}\nTICKET PRICE: ${settings.ticketPrice}\nAUDIENCE: ${settings.targetAudience}`
      : 'EVENT: Elev8 Montreal\nTICKET PRICE: $497';

    const systemPrompt = `You are a lead qualification specialist for the Elev8 Montreal business event. You score leads 0-100 and recommend specific GoHighLevel actions.

${eventContext}

Scoring: 0-30=Cold, 31-55=Warm, 56-80=Hot, 81-100=Buyer-Ready

ALWAYS respond in this exact format:
SCORE: [number]
SEGMENT: [cold/warm/hot/buyer]
SUMMARY: [2 sentences max]
BUYING_SIGNALS: [bullet list]
OBJECTIONS: [bullet list]
GHL_TAGS: [comma-separated tags, prefix with elev8-]
GHL_TRIGGER_TAG: [one trigger tag to apply in GHL, or "none"]
FOLLOW_UP: [one personalized message to send this lead right now]`;

    const userPrompt = `Qualify this lead for Elev8 Montreal:
Name: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Phone: ${lead.phone}
Existing GHL tags: ${lead.tags.join(', ') || 'none'}
Source: ${lead.source || 'unknown'}`;

    const promptHash = hashPrompt(systemPrompt, userPrompt);

    const message = await client.messages.create({
      model:      'claude-sonnet-4-20250514',
      max_tokens: 800,
      system:     systemPrompt,
      messages:   [{ role: 'user', content: userPrompt }],
    });

    const output = message.content.map(b => b.text || '').join('');

    const score    = parseInt(output.match(/SCORE:\s*(\d+)/)?.[1] || '0');
    const segment  = output.match(/SEGMENT:\s*(\w+)/)?.[1]?.toLowerCase() || 'cold';
    const tagsLine = output.match(/GHL_TAGS:\s*(.+)/)?.[1] || '';
    const recommendedTags = tagsLine.split(',').map(t => t.trim()).filter(Boolean);
    const flowLine =
      output.match(/GHL_TRIGGER_TAG:\s*(.+)/)?.[1]?.trim() ||
      output.match(/GHL_SEQUENCE:\s*(.+)/)?.[1]?.trim() ||
      null;
    const recommendedFlow    = flowLine && flowLine.toLowerCase() !== 'none' ? flowLine : null;
    const validSegments      = ['cold', 'warm', 'hot', 'buyer'];
    const validSegment       = validSegments.includes(segment) ? segment : 'cold';

    const updated = await Lead.findOneAndUpdate(
      { _id: req.params.id, clientId: req.clientId },  // ← scoped
      { aiScore: score, aiSegment: validSegment, aiOutput: output, recommendedTags, recommendedFlow, promptHash, qualifiedAt: new Date() },
      { new: true }
    );

    await recordPromptUse({
      clientId:  req.clientId,                         // ← scoped
      agentType: 'leads',
      promptHash,
      promptSnapshot: { systemPrompt, userPromptTemplate: userPrompt },
    });

    res.json({ success: true, lead: updated });
  } catch (err) { next(err); }
};

// ── POST /api/ghl/push-tags/:id ──
export const pushTagsToGHL = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, clientId: req.clientId }); // ← scoped
    if (!lead)                         return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.ghlContactId)            return res.status(400).json({ success: false, message: 'No GHL contact ID' });
    if (!lead.recommendedTags?.length) return res.status(400).json({ success: false, message: 'No tags to push' });

    await addContactTags(lead.ghlContactId, lead.recommendedTags, req.clientId);
    await Lead.findOneAndUpdate(
      { _id: req.params.id, clientId: req.clientId },  // ← scoped
      { tagsPushedToGHL: true }
    );

    res.json({ success: true, message: `Pushed ${lead.recommendedTags.length} tags to GHL`, tags: lead.recommendedTags });
  } catch (err) { next(err); }
};

// ── POST /api/ghl/push-note/:id ──
export const pushNoteToGHL = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, clientId: req.clientId }); // ← scoped
    if (!lead)              return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.ghlContactId) return res.status(400).json({ success: false, message: 'No GHL contact ID' });

    const noteBody = `[Elev8 AI Agent — ${new Date().toLocaleDateString()}]\n\nAI Score: ${lead.aiScore}/100 (${lead.aiSegment?.toUpperCase()})\n\n${lead.aiOutput}`;
    await addContactNote(lead.ghlContactId, noteBody, req.clientId);
    await Lead.findOneAndUpdate(
      { _id: req.params.id, clientId: req.clientId },  // ← scoped
      { notePushedToGHL: true }
    );

    res.json({ success: true, message: 'AI qualification note pushed to GHL' });
  } catch (err) { next(err); }
};

// ── POST /api/ghl/trigger-workflow/:id ──
export const triggerGHLWorkflow = async (req, res, next) => {
  try {
    const { workflowId, workflowTag } = req.body;
    if (!workflowId && !workflowTag)
      return res.status(400).json({ success: false, message: 'workflowId or workflowTag is required' });

    const lead = await Lead.findOne({ _id: req.params.id, clientId: req.clientId }); // ← scoped
    if (!lead)              return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.ghlContactId) return res.status(400).json({ success: false, message: 'No GHL contact ID' });

    let message = '';
    if (workflowId) {
      await addContactToWorkflow(lead.ghlContactId, workflowId, req.clientId);
      message = `Contact added to workflow ${workflowId}`;
    } else {
      await addContactTags(lead.ghlContactId, [workflowTag], req.clientId);
      message = `Workflow trigger tag applied: ${workflowTag}`;
    }

    await Lead.findOneAndUpdate(
      { _id: req.params.id, clientId: req.clientId },  // ← scoped
      { workflowTriggered: true }
    );

    res.json({ success: true, message });
  } catch (err) { next(err); }
};

// ── PATCH /api/ghl/outcome/:id ──
export const setLeadOutcome = async (req, res, next) => {
  try {
    const { outcome, note } = req.body;
    const validOutcomes = ['pending', 'converted', 'lost', 'nurturing'];
    if (!validOutcomes.includes(outcome))
      return res.status(400).json({ success: false, message: 'Invalid outcome' });

    const lead = await Lead.findOneAndUpdate(
      { _id: req.params.id, clientId: req.clientId },  // ← scoped
      { outcome, outcomeNote: note || '', outcomeSetAt: new Date() },
      { new: true }
    );
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, lead });
  } catch (err) { next(err); }
};

// ── GET /api/ghl/stats ──
export const getPipelineStats = async (req, res, next) => {
  try {
    const baseQuery = await getScopedLeadScope(req.clientId);
    const [stats] = await Lead.aggregate([
      ...buildDedupedLeadPipeline(baseQuery),
      {
        $facet: {
          total: [{ $count: 'count' }],
          bySegment: [{ $group: { _id: '$aiSegment', count: { $sum: 1 } } }],
          byOutcome: [{ $group: { _id: '$outcome', count: { $sum: 1 } } }],
          withScore: [
            { $match: { aiScore: { $ne: null } } },
            { $count: 'count' },
          ],
        },
      },
    ]);

    res.json({
      success: true,
      stats: {
        total: stats?.total?.[0]?.count || 0,
        bySegment: stats?.bySegment || [],
        byOutcome: stats?.byOutcome || [],
        withScore: stats?.withScore?.[0]?.count || 0,
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/ghl/dashboard ──
export const getDashboardData = async (req, res, next) => {
  try {
    const baseQuery = await getScopedLeadScope(req.clientId);

    const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000);
    const [dashboard] = await Lead.aggregate([
      ...buildDedupedLeadPipeline(baseQuery),
      {
        $facet: {
          totalLeads: [{ $count: 'count' }],
          bySegment: [
            { $group: { _id: '$aiSegment', count: { $sum: 1 }, avgScore: { $avg: '$aiScore' } } },
            { $sort: { count: -1 } },
          ],
          bySource: [
            { $match: { source: { $ne: '' } } },
            { $group: { _id: '$source', count: { $sum: 1 } } },
            { $sort: { count: -1 } },
            { $limit: 6 },
          ],
          byOutcome: [
            { $group: { _id: '$outcome', count: { $sum: 1 } } },
          ],
          recentLeads: [
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 6 },
            { $project: { firstName: 1, lastName: 1, email: 1, aiScore: 1, aiSegment: 1, source: 1, createdAt: 1, outcome: 1 } },
          ],
          qualifiedCount: [
            { $match: { aiScore: { $ne: null } } },
            { $count: 'count' },
          ],
          conversionTrend: [
            { $match: { createdAt: { $gte: fourteenDaysAgo } } },
            {
              $group: {
                _id: {
                  $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
                },
                count: { $sum: 1 },
                qualified: { $sum: { $cond: [{ $ne: ['$aiScore', null] }, 1, 0] } },
                converted: { $sum: { $cond: [{ $eq: ['$outcome', 'converted'] }, 1, 0] } },
              },
            },
            { $sort: { _id: 1 } },
          ],
          avgScore: [
            { $match: { aiScore: { $ne: null } } },
            { $group: { _id: null, avg: { $avg: '$aiScore' } } },
          ],
        },
      },
    ]);

    const totalLeads = dashboard?.totalLeads?.[0]?.count || 0;
    const bySegment = dashboard?.bySegment || [];
    const bySource = dashboard?.bySource || [];
    const byOutcome = dashboard?.byOutcome || [];
    const recentLeads = dashboard?.recentLeads || [];
    const qualifiedCount = dashboard?.qualifiedCount?.[0]?.count || 0;
    const conversionTrend = dashboard?.conversionTrend || [];

    const converted = byOutcome.find((o) => o._id === 'converted')?.count || 0;
    const convRate = qualifiedCount > 0 ? Math.round((converted / qualifiedCount) * 100) : 0;
    const hotBuyer =
      (bySegment.find((s) => s._id === 'hot')?.count || 0) +
      (bySegment.find((s) => s._id === 'buyer')?.count || 0);
    const avgScore = Math.round(dashboard?.avgScore?.[0]?.avg || 0);

    res.json({
      success: true,
      data: {
        stats: { totalLeads, qualifiedCount, converted, hotBuyer, convRate, avgScore },
        bySegment,
        bySource,
        byOutcome,
        recentLeads,
        conversionTrend,
      },
    });
  } catch (err) { next(err); }
};
