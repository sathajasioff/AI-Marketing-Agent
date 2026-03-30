import { buildEnhancedSystemPrompt } from '../services/learningService.js';
import { getKnowledgeForAgent } from './knowledgeController.js';
import { getClientContext, getBrandVoiceContext, callClaude, streamAgent } from './agentUtils.js';

// ══════════════════════════════════════════
// EMAIL AGENT
// ══════════════════════════════════════════
export const runEmail = async (req, res, next) => {
  try {
    const { sequenceType, segment, senderName, tone, offer, brandVoiceId } = req.body;
    const clientId = req.clientId;
    const client   = req.client;

    if (!sequenceType || !segment) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: sequenceType, segment',
      });
    }

    const clientContext    = await getClientContext(clientId);
    const knowledgeContext = await getKnowledgeForAgent('email', clientId);
    const brandVoice       = await getBrandVoiceContext(brandVoiceId, clientId);

    const businessName = client.companyName || 'this business';

    const baseSystemPrompt = `You are an expert email marketing specialist for ${businessName}.
You write high-converting email sequences that nurture leads and drive sales.
All emails must be formatted for easy import into GoHighLevel automations.

CLIENT: ${businessName}
INDUSTRY: ${client.industry || 'Business'}

CRITICAL FORMAT for each email:
### Email [N] — [Day/Trigger] — [Purpose]
**Subject Line:** [subject]
**Preview Text:** [preview text, max 90 chars]
**Body:**
[full email body using GHL tokens like {{contact.first_name}}]
**CTA:** [button text + link placeholder]
**Timing note:** [when to send this email]
---`;

    const { systemPrompt } = await buildEnhancedSystemPrompt(
      'email', null, baseSystemPrompt,
      clientContext + knowledgeContext + brandVoice
    );

    const userPrompt = `Write a complete ${sequenceType} email sequence for ${businessName}.
Lead Segment: ${segment}
Sender Name: ${senderName || client.name || 'The Team'}
Tone: ${tone || 'professional and warm'}
${offer ? `Special Offer/Deadline: ${offer}` : ''}

Use GHL merge tags: {{contact.first_name}}, {{contact.email}}
Include all emails with proper spacing/timing notes between each one.
Make each email feel personal and valuable, not salesy.`;

    if (req.query.stream === 'true') {
      return streamAgent({ req, res, systemPrompt, userPrompt, agentType: 'email', clientId });
    }

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType:  'email',
      inputParams: req.body,
      clientId,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};

// ══════════════════════════════════════════
// LEAD QUALIFICATION AGENT
// ══════════════════════════════════════════
export const runLeads = async (req, res, next) => {
  try {
    const { name, source, industry, actions, notes, brandVoiceId } = req.body;
    const clientId = req.clientId;
    const client   = req.client;

    if (!source) {
      return res.status(400).json({
        success: false,
        message: 'Missing required field: source',
      });
    }

    const clientContext    = await getClientContext(clientId);
    const knowledgeContext = await getKnowledgeForAgent('leads', clientId);
    const brandVoice       = await getBrandVoiceContext(brandVoiceId, clientId);

    const businessName = client.companyName || 'this business';
    const avgDealSize  = client.plan === 'agency' ? '$5,000+' : client.plan === 'growth' ? '$1,000–$5,000' : '$500–$1,000';

    const baseSystemPrompt = `You are a lead qualification specialist for ${businessName}.
You analyze lead behavior and profile data to score leads and recommend precise follow-up actions in GoHighLevel.

CLIENT: ${businessName}
INDUSTRY: ${client.industry || 'Business'}
TYPICAL DEAL SIZE: ${avgDealSize}

Lead Scoring Scale:
0–30  = Cold     → Nurture only, no direct sales
31–55 = Warm     → Light touch, educational content
56–80 = Hot      → Active sales pursuit, book a call
81–100 = Buyer-Ready → Immediate follow-up, close now`;

    const { systemPrompt } = await buildEnhancedSystemPrompt(
      'leads', null, baseSystemPrompt,
      clientContext + knowledgeContext + brandVoice
    );

    const userPrompt = `Qualify this lead for ${businessName}:

Lead Name: ${name || 'Unknown Lead'}
Industry/Role: ${industry || 'Not specified'}
Lead Source: ${source}
Actions Taken: ${actions || 'None recorded'}
Additional Notes: ${notes || 'None'}

Provide a full qualification report:
## Lead Score: [X/100] — [Cold/Warm/Hot/Buyer-Ready]
## Profile Summary (2-3 sentences)
## Buying Signals Identified (bullet list)
## Objections / Friction Points (bullet list)
## GHL Tags to Apply (3–5 specific tags, e.g. warm-lead, realtor, visited-pricing)
## Recommended GHL Automation Sequence to Activate
## Personalized Follow-Up Message (ready to copy-paste into GHL)
## Next Best Action (specific, within 24 hours)`;

    if (req.query.stream === 'true') {
      return streamAgent({ req, res, systemPrompt, userPrompt, agentType: 'leads', clientId });
    }

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType:  'leads',
      inputParams: req.body,
      clientId,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};