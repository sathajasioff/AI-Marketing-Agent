import Anthropic from '@anthropic-ai/sdk';
import Lead from '../models/Lead.js';
import Generation from '../models/Generation.js';
import EventSettings from '../models/EventSettings.js';
import { getKnowledgeForAgent } from './knowledgeController.js';
import { hashPrompt, recordPromptUse } from '../services/learningService.js';
import { addContactNote, addContactTags } from '../services/ghlService.js';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// ── Helpers ──
const getEventContext = async (clientId) => {
  const settings = await EventSettings.findOne({ clientId }); // ← scoped
  if (!settings) return 'EVENT: Elev8 Montreal\nTICKET PRICE: $497\nAUDIENCE: Entrepreneurs and business professionals';
  return `EVENT: ${settings.eventName}
DATE: ${settings.eventDate}, ${settings.eventLocation}
TICKET PRICE: ${settings.ticketPrice}
AUDIENCE: ${settings.targetAudience}
VALUE PROPS: ${settings.valuePropositions}
BRAND VOICE: ${settings.brandVoice}`;
};

const buildLeadProfile = (lead) => `Name: ${lead.firstName} ${lead.lastName}
Email: ${lead.email}
Source: ${lead.source || 'Unknown'}
AI Score: ${lead.aiScore || 'Not qualified'}/100
Segment: ${lead.aiSegment || 'Unknown'}
GHL Tags: ${lead.tags?.join(', ') || 'None'}
Buying Signals: ${lead.aiOutput?.match(/BUYING_SIGNALS:([\s\S]*?)(?=OBJECTIONS:|GHL_TAGS:|$)/)?.[1]?.trim() || 'Unknown'}
Objections: ${lead.aiOutput?.match(/OBJECTIONS:([\s\S]*?)(?=GHL_TAGS:|GHL_SEQUENCE:|$)/)?.[1]?.trim() || 'Unknown'}
Recommended Sequence: ${lead.recommendedFlow || 'Not set'}`;

// ── GET /api/intelligence/audience-summary ──
export const getAudienceSummary = async (req, res, next) => {
  try {
    const q = { clientId: req.clientId };              // ← scoped

    const [total, bySegment, bySource, byOutcome, topLeads] = await Promise.all([
      Lead.countDocuments(q),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$aiSegment', count: { $sum: 1 }, avgScore: { $avg: '$aiScore' } } }]),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$outcome', count: { $sum: 1 } } }]),
      Lead.find({ ...q, aiScore: { $gte: 70 } }).sort({ aiScore: -1 }).limit(10).select('firstName lastName email aiScore aiSegment source tags'),
    ]);

    res.json({ success: true, summary: { total, bySegment, bySource, byOutcome, topLeads } });
  } catch (err) { next(err); }
};

// ── POST /api/intelligence/ad-copy-from-leads ──
export const generateAdCopyFromLeads = async (req, res, next) => {
  try {
    const { segment, adType, variants = 3 } = req.body;
    const q = { clientId: req.clientId, aiScore: { $ne: null } }; // ← scoped
    if (segment && segment !== 'all') q.aiSegment = segment;

    const leads = await Lead.find(q).sort({ aiScore: -1 }).limit(20)
      .select('firstName aiScore aiSegment source tags aiOutput');

    if (!leads.length)
      return res.status(400).json({ success: false, message: 'No qualified leads found. Qualify some leads first in GHL Pipeline.' });

    const eventContext     = await getEventContext(req.clientId);
    const knowledgeContext = await getKnowledgeForAgent('content', req.clientId);

    const painPoints = leads.map(l => l.aiOutput?.match(/BUYING_SIGNALS:([\s\S]*?)(?=OBJECTIONS:|$)/)?.[1]).filter(Boolean).slice(0, 5).join('\n');
    const objections = leads.map(l => l.aiOutput?.match(/OBJECTIONS:([\s\S]*?)(?=GHL_TAGS:|$)/)?.[1]).filter(Boolean).slice(0, 5).join('\n');
    const sourceSummary = [...new Set(leads.map(l => l.source).filter(Boolean))].join(', ');
    const avgScore = Math.round(leads.reduce((sum, l) => sum + (l.aiScore || 0), 0) / leads.length);

    const systemPrompt = `You are an expert Meta ad copywriter for Elev8 Montreal. You write high-converting ads using REAL data from actual leads — not generic marketing language.\n\n${eventContext}\n${knowledgeContext}`;

    const userPrompt = `Write ${variants} Meta ad variants for ${adType || 'Top of Funnel — Cold'} targeting the ${segment || 'all'} segment.

REAL DATA FROM YOUR ACTUAL ${leads.length} LEADS:
Average AI Score: ${avgScore}/100
Lead Sources: ${sourceSummary}

REAL BUYING SIGNALS from your leads (use these as hooks):
${painPoints || 'Not available — qualify leads first'}

REAL OBJECTIONS from your leads (address these in copy):
${objections || 'Not available — qualify leads first'}

For each variant:
### Variant [N] — [Hook Type]
**Hook (max 125 chars):**
**Primary Text (max 280 chars):**
**Headline (max 40 chars):**
**CTA:**
**Why this works for your actual leads:** [1 sentence referencing the real data]`;

    const promptHash = hashPrompt(systemPrompt, userPrompt);
    const message    = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1500, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
    const output     = message.content.map(b => b.text || '').join('');

    await recordPromptUse({ clientId: req.clientId, agentType: 'content', subType: 'leads-ad', promptHash, promptSnapshot: { systemPrompt, userPromptTemplate: userPrompt } });

    const generation = await Generation.create({
      clientId:   req.clientId,                        // ← scoped
      agentType:  'content',
      subType:    'leads-ad',
      inputParams: { ...req.body, leadsAnalyzed: leads.length, avgScore },
      output,
      tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
      promptHash,
    });

    res.json({ success: true, output, generationId: generation._id, leadsAnalyzed: leads.length, avgScore });
  } catch (err) { next(err); }
};

// ── POST /api/intelligence/email-lead/:id ──
export const generatePersonalizedEmail = async (req, res, next) => {
  try {
    const lead = await Lead.findOne({ _id: req.params.id, clientId: req.clientId }); // ← scoped
    if (!lead)          return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.aiScore)  return res.status(400).json({ success: false, message: 'Qualify this lead with AI first' });

    const eventContext     = await getEventContext(req.clientId);
    const knowledgeContext = await getKnowledgeForAgent('email', req.clientId);

    const systemPrompt = `You are a world-class email copywriter who writes hyper-personalized emails for high-ticket events. You write ONE email for ONE specific person using everything you know about them. The email should feel like it was written specifically for them — not a template.\n\n${eventContext}\n${knowledgeContext}`;

    const userPrompt = `Write ONE personalized email for this specific lead for Elev8 Montreal.

${buildLeadProfile(lead)}

INSTRUCTIONS:
- Use their first name naturally
- Reference their specific industry and what they care about
- Address their specific objections directly
- Connect the event to their buying signals
- Match the tone to their score: ${lead.aiScore >= 70 ? 'DIRECT and urgent — they are close to buying' : lead.aiScore >= 40 ? 'WARM and helpful — build trust' : 'EDUCATIONAL — they need nurturing first'}
- DO NOT use generic phrases like "I hope this email finds you well"
- End with a very specific, low-friction CTA matching their segment

Output format:
**Subject Line:**
**Preview Text:**
**Email Body:**
**CTA:**
**GHL Tag to add after sending:**`;

    const promptHash = hashPrompt(systemPrompt, userPrompt);
    const message    = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1000, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
    const output     = message.content.map(b => b.text || '').join('');

    await recordPromptUse({ clientId: req.clientId, agentType: 'email', subType: 'personalized', promptHash, promptSnapshot: { systemPrompt, userPromptTemplate: userPrompt } });

    const generation = await Generation.create({
      clientId:   req.clientId,                        // ← scoped
      agentType:  'email',
      subType:    'personalized',
      inputParams: { leadId: lead._id, leadName: `${lead.firstName} ${lead.lastName}`, aiScore: lead.aiScore },
      output,
      tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
      promptHash,
    });

    res.json({ success: true, output, generationId: generation._id, lead: { name: `${lead.firstName} ${lead.lastName}`, score: lead.aiScore, segment: lead.aiSegment } });
  } catch (err) { next(err); }
};

// ── POST /api/intelligence/bulk-email ──
export const generateBulkPersonalizedEmails = async (req, res, next) => {
  try {
    const { segment, maxLeads = 10 } = req.body;
    const q = { clientId: req.clientId, aiScore: { $ne: null }, outcome: { $in: ['pending', 'nurturing'] } }; // ← scoped
    if (segment && segment !== 'all') q.aiSegment = segment;

    const leads = await Lead.find(q).sort({ aiScore: -1 }).limit(Number(maxLeads));
    if (!leads.length) return res.status(400).json({ success: false, message: 'No qualified leads found' });

    const eventContext = await getEventContext(req.clientId);
    const results      = [];

    for (const lead of leads) {
      try {
        const systemPrompt = `You are a personalized email writer for Elev8 Montreal. Write short, punchy, hyper-personalized emails. Max 150 words. No fluff.\n\n${eventContext}`;
        const userPrompt   = `Write a personalized email for:
Name: ${lead.firstName} ${lead.lastName}
Score: ${lead.aiScore}/100 (${lead.aiSegment})
Source: ${lead.source || 'Unknown'}
Tags: ${lead.tags?.join(', ') || 'None'}
Key buying signal: ${lead.aiOutput?.match(/BUYING_SIGNALS:([\s\S]*?)(?=OBJECTIONS:|$)/)?.[1]?.split('\n')[0]?.trim() || 'Interested in scaling'}
Main objection: ${lead.aiOutput?.match(/OBJECTIONS:([\s\S]*?)(?=GHL_TAGS:|$)/)?.[1]?.split('\n')[0]?.trim() || 'Needs more info'}

Subject line + email body only. 150 words max. Very specific to this person.`;

        const message = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 400, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
        const output  = message.content.map(b => b.text || '').join('');
        results.push({ leadId: lead._id, leadName: `${lead.firstName} ${lead.lastName}`, email: lead.email, aiScore: lead.aiScore, aiSegment: lead.aiSegment, output, status: 'generated' });
      } catch {
        results.push({ leadId: lead._id, leadName: `${lead.firstName} ${lead.lastName}`, status: 'failed' });
      }
    }

    res.json({ success: true, total: results.length, results });
  } catch (err) { next(err); }
};

// ── POST /api/intelligence/strategy-from-pipeline ──
export const generateStrategyFromPipeline = async (req, res, next) => {
  try {
    const { goal, budget, timeline } = req.body;
    const q = { clientId: req.clientId };              // ← scoped

    const [total, bySegment, bySource, byOutcome] = await Promise.all([
      Lead.countDocuments(q),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$aiSegment', count: { $sum: 1 }, avgScore: { $avg: '$aiScore' } } }]),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$source', count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 5 }]),
      Lead.aggregate([{ $match: q }, { $group: { _id: '$outcome', count: { $sum: 1 } } }]),
    ]);

    const eventContext     = await getEventContext(req.clientId);
    const knowledgeContext = await getKnowledgeForAgent('strategy', req.clientId);

    const segmentSummary = bySegment.map(s => `${s._id || 'unqualified'}: ${s.count} leads (avg score ${Math.round(s.avgScore || 0)})`).join('\n');
    const sourceSummary  = bySource.map(s => `${s._id || 'unknown'}: ${s.count} leads`).join('\n');
    const outcomeSummary = byOutcome.map(o => `${o._id}: ${o.count}`).join('\n');
    const conversionRate = total > 0 ? Math.round(((byOutcome.find(o => o._id === 'converted')?.count || 0) / total) * 100) : 0;

    const systemPrompt = `You are an elite event marketing strategist who makes decisions based on REAL pipeline data, not guesswork.\n\n${eventContext}\n${knowledgeContext}`;

    const userPrompt = `Create a data-driven marketing strategy for Elev8 Montreal using this REAL pipeline data.

REAL PIPELINE DATA (${total} total leads):
Segment breakdown:
${segmentSummary || 'No qualified leads yet'}
Lead sources:
${sourceSummary || 'No source data yet'}
Outcomes:
${outcomeSummary || 'No outcomes recorded'}
Current conversion rate: ${conversionRate}%

Goal: ${goal}
Monthly Budget: ${budget}
Timeline: ${timeline} days

## Pipeline Analysis & Gaps
## Source Scaling Strategy (based on real data)
## Week-by-Week Action Plan
## Budget Allocation (with reasoning from your data)
## Segment-Specific Actions
## KPIs to Track`;

    const promptHash = hashPrompt(systemPrompt, userPrompt);
    const message    = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1800, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
    const output     = message.content.map(b => b.text || '').join('');

    await recordPromptUse({ clientId: req.clientId, agentType: 'strategy', subType: 'pipeline', promptHash, promptSnapshot: { systemPrompt, userPromptTemplate: userPrompt } });

    const generation = await Generation.create({
      clientId:   req.clientId,                        // ← scoped
      agentType:  'strategy',
      subType:    'pipeline',
      inputParams: { ...req.body, pipelineSnapshot: { total, conversionRate } },
      output,
      tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
      promptHash,
    });

    res.json({ success: true, output, generationId: generation._id, pipelineData: { total, bySegment, bySource, byOutcome, conversionRate } });
  } catch (err) { next(err); }
};

// ── GET /api/intelligence/patterns ──
export const analyzeLeadPatterns = async (req, res, next) => {
  try {
    const leads = await Lead.find({ clientId: req.clientId, aiScore: { $ne: null } }) // ← scoped
      .sort({ createdAt: -1 }).limit(50)
      .select('aiScore aiSegment source tags aiOutput outcome createdAt');

    if (leads.length < 5)
      return res.status(400).json({ success: false, message: `Need at least 5 qualified leads. You have ${leads.length}.` });

    const eventContext  = await getEventContext(req.clientId);
    const leadSummaries = leads.map(l => ({
      score:      l.aiScore,
      segment:    l.aiSegment,
      source:     l.source,
      outcome:    l.outcome,
      tags:       l.tags?.slice(0, 3),
      signals:    l.aiOutput?.match(/BUYING_SIGNALS:([\s\S]*?)(?=OBJECTIONS:|$)/)?.[1]?.split('\n').filter(Boolean).slice(0, 2),
      objections: l.aiOutput?.match(/OBJECTIONS:([\s\S]*?)(?=GHL_TAGS:|$)/)?.[1]?.split('\n').filter(Boolean).slice(0, 2),
    }));

    const systemPrompt = `You are a data analyst and marketing strategist. You analyze lead pipeline data and find actionable patterns.\n\n${eventContext}`;

    const userPrompt = `Analyze these ${leads.length} leads and identify key patterns.

LEAD DATA:
${JSON.stringify(leadSummaries, null, 2)}

## Best Performing Source
## Biggest Drop-off Point
## Top 3 Buying Signals
## Top 3 Objections to Address
## Hidden Opportunity
## Immediate Action Recommendation
## What to Stop Doing

Be direct. Use numbers. Reference actual patterns in the data.`;

    const message    = await client.messages.create({ model: 'claude-sonnet-4-20250514', max_tokens: 1200, system: systemPrompt, messages: [{ role: 'user', content: userPrompt }] });
    const output     = message.content.map(b => b.text || '').join('');

    const generation = await Generation.create({
      clientId:   req.clientId,                        // ← scoped
      agentType:  'strategy',
      subType:    'patterns',
      inputParams: { leadsAnalyzed: leads.length },
      output,
      tokensUsed: (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0),
    });

    res.json({ success: true, output, generationId: generation._id, leadsAnalyzed: leads.length });
  } catch (err) { next(err); }
};

// ── POST /api/intelligence/push-email-to-ghl/:leadId ──
export const pushEmailToGHL = async (req, res, next) => {
  try {
    const { emailContent } = req.body;
    const lead = await Lead.findOne({ _id: req.params.leadId, clientId: req.clientId }); // ← scoped
    if (!lead)              return res.status(404).json({ success: false, message: 'Lead not found' });
    if (!lead.ghlContactId) return res.status(400).json({ success: false, message: 'No GHL contact ID' });

    const noteBody = `[Elev8 AI — Personalized Email Draft — ${new Date().toLocaleDateString()}]\n\n${emailContent}`;
    await addContactNote(lead.ghlContactId, noteBody, req.clientId);
    await addContactTags(lead.ghlContactId, ['elev8-email-ready'], req.clientId);

    res.json({ success: true, message: 'Email draft pushed to GHL contact note + tagged elev8-email-ready' });
  } catch (err) { next(err); }
};