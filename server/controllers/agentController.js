import Anthropic from '@anthropic-ai/sdk';
import Generation from '../models/Generation.js';
import EventSettings from '../models/EventSettings.js';
import { env, requireEnv } from '../config/env.js';
import { hashPrompt, recordPromptUse } from '../services/learningService.js';

requireEnv('ANTHROPIC_API_KEY');

const client = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });

const DEFAULT_EVENT_CONTEXT = `EVENT: Elev8 Montreal
DATE: 2025, Montreal, Quebec, Canada
TICKET PRICE: $497
TARGET AUDIENCE: Entrepreneurs, business owners, real estate professionals
VALUE PROPOSITIONS: Real estate strategies, sales mastery, marketing methods, networking
BRAND VOICE: Professional, Ambitious, Results-Focused`;

const getEventContext = async () => {
  const settings = await EventSettings.findOne({ singleton: 'elev8' });

  if (!settings) {
    return DEFAULT_EVENT_CONTEXT;
  }

  return `EVENT: ${settings.eventName}
DATE: ${settings.eventDate}, ${settings.eventLocation}
TICKET PRICE: ${settings.ticketPrice}
TARGET AUDIENCE: ${settings.targetAudience}
VALUE PROPOSITIONS: ${settings.valuePropositions}
BRAND VOICE: ${settings.brandVoice}`;
};

const callClaude = async ({ systemPrompt, userPrompt, agentType, subType, inputParams }) => {
  const message = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1800,
    system: systemPrompt,
    messages: [{ role: 'user', content: userPrompt }],
  });

  const output = message.content.map((block) => block.text || '').join('');
  const tokensUsed = (message.usage?.input_tokens || 0) + (message.usage?.output_tokens || 0);
  const promptHash = hashPrompt(systemPrompt, userPrompt);

  await recordPromptUse({
    agentType,
    subType: subType || null,
    promptHash,
    promptSnapshot: {
      systemPrompt,
      userPromptTemplate: userPrompt,
    },
  });

  const generation = await Generation.create({
    agentType,
    subType: subType || null,
    inputParams,
    output,
    tokensUsed,
    promptHash,
  });

  return { output, generationId: generation._id, tokensUsed };
};

export const runStrategy = async (req, res, next) => {
  try {
    const { goal, price, budget, audience, timeline, offers } = req.body;
    const eventContext = await getEventContext();

    const systemPrompt = `You are an elite event marketing strategist specializing in high-ticket business events in Canada. You create detailed, actionable campaign strategies that drive ticket sales through Meta Ads, email marketing, and funnel optimization. All strategies must be practical for GoHighLevel CRM implementation.

${eventContext}

Format your response with clear sections using ## for main headings and ### for sub-sections. Be specific with numbers, timelines, and tactics.`;

    const userPrompt = `Create a complete marketing campaign strategy for Elev8 Montreal:
- Campaign Goal: ${goal}
- Ticket Price: ${price}
- Monthly Ad Budget: ${budget}
- Primary Audience: ${audience}
- Timeline: ${timeline} days
- Key Offers/Speakers: ${offers || 'Not specified'}

Include:
## Campaign Overview & Goals
## Week-by-Week Timeline
## Meta Ads Strategy (audiences, campaign structure, budget allocation)
## Funnel Structure (stages and pages needed)
## Email Marketing Strategy
## GoHighLevel Setup Recommendations
## KPIs & Success Metrics`;

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType: 'strategy',
      inputParams: req.body,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const runContent = async (req, res, next) => {
  try {
    const { subType, ...params } = req.body;
    const eventContext = await getEventContext();

    const systemPrompt = `You are an expert direct-response copywriter specializing in event marketing and Meta advertising in Canada. You write compelling, high-converting copy for business and entrepreneurship events. Your copy is punchy, benefit-driven, and speaks directly to ambitious professionals.

${eventContext}

Format with ## for variants or sections, ### for sub-elements. Include character counts where relevant for Meta ad compliance.`;

    let userPrompt = '';

    if (subType === 'meta') {
      const { adType, persona, pain, variants } = params;
      userPrompt = `Write ${variants} Meta ad variants for Elev8 Montreal.
Ad Type: ${adType}
Target Persona: ${persona}
Pain Point / Desire: ${pain || 'wants to scale their income and business'}

For each variant:
### Variant [N] - [Hook Style]
**Hook (first line, max 125 chars):**
**Primary Text (max 280 chars):**
**Headline (max 40 chars):**
**Description (max 30 chars):**
**CTA Button:** [Register Now / Get Tickets / Learn More]
**Why this works:** [1 sentence]`;
    } else if (subType === 'funnel') {
      const { pageType, audience, headline } = params;
      userPrompt = `Write complete ${pageType} page copy for Elev8 Montreal.
Audience: ${audience}
Headline Direction: ${headline || 'grow their business and income'}
Include: headline, subheadline, hero section, benefits/bullets, social proof placeholders, CTA, urgency element.`;
    } else if (subType === 'social') {
      const { platform, postType, count } = params;
      userPrompt = `Write ${count} ${platform} posts for Elev8 Montreal.
Content Type: ${postType}
Include: caption text, emojis, hashtags (for Instagram), clear CTA in each post.`;
    } else if (subType === 'vsl') {
      const { length, audience, cta } = params;
      userPrompt = `Write a complete ${length} VSL script for Elev8 Montreal.
Audience: ${audience}
CTA: ${cta}
Include: [HOOK], [PROBLEM], [AGITATE], [SOLUTION], [SOCIAL PROOF], [OFFER], [CTA] sections with speaker notes.`;
    } else {
      return res.status(400).json({ success: false, message: 'Invalid content subType' });
    }

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType: 'content',
      subType,
      inputParams: req.body,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const runEmail = async (req, res, next) => {
  try {
    const { sequenceType, segment, senderName, tone, offer } = req.body;
    const eventContext = await getEventContext();

    const systemPrompt = `You are an expert email marketing specialist for live business events. You write high-converting email sequences that nurture leads and drive ticket sales. All emails must be formatted for easy import into GoHighLevel automations.

${eventContext}

CRITICAL FORMAT for each email:
### Email [N] - [Day/Trigger] - [Purpose]
**Subject Line:** [subject]
**Preview Text:** [preview]
**Body:**
[full email body with GHL tokens like {{contact.first_name}}]
**CTA:** [button text + link placeholder]
---`;

    const userPrompt = `Write a complete ${sequenceType} email sequence for Elev8 Montreal.
Lead Segment: ${segment}
Sender Name: ${senderName}
Tone: ${tone}
${offer ? `Special Offer/Deadline: ${offer}` : ''}
Use GHL merge tags: {{contact.first_name}}, {{contact.email}}
Include all emails with proper spacing/timing notes.`;

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType: 'email',
      inputParams: req.body,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};

export const runLeads = async (req, res, next) => {
  try {
    const { name, source, industry, actions, notes } = req.body;
    const eventContext = await getEventContext();

    const systemPrompt = `You are a lead qualification specialist for high-ticket business events. You analyze lead behavior and profile data to score leads and recommend precise follow-up actions in GoHighLevel.

${eventContext}

Scoring: 0-30 = Cold, 31-55 = Warm, 56-80 = Hot, 81-100 = Buyer-Ready`;

    const userPrompt = `Qualify this lead for Elev8 Montreal:

Lead: ${name || 'Unknown Lead'}
Industry: ${industry}
Source: ${source}
Actions Taken: ${actions || 'None recorded'}
Notes: ${notes || 'None'}

Provide:
## Lead Score: [X/100] - [Cold/Warm/Hot/Buyer-Ready]
## Profile Summary
## Buying Signals Identified
## Objections / Friction Points
## GHL Tags to Apply
(list 3-5 tags like: elev8-warm-lead, realtor-montreal, ticket-page-visit)
## Recommended GHL Sequence to Activate
## Personalized Follow-Up Message
## Next Best Action (within 24 hours)`;

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType: 'leads',
      inputParams: req.body,
    });

    res.json({ success: true, ...result });
  } catch (err) {
    next(err);
  }
};
