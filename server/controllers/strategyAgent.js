import Anthropic from '@anthropic-ai/sdk';
import Generation from '../models/Generation.js';
import Client from '../models/Client.js';
import { buildEnhancedSystemPrompt, recordPromptUse, hashPrompt } from '../services/learningService.js';
import { getKnowledgeForAgent } from './knowledgeController.js';
import { getClientContext, getBrandVoiceContext, callClaude } from './agentUtils.js';

// ══════════════════════════════════════════
// STRATEGY AGENT
// ══════════════════════════════════════════
export const runStrategy = async (req, res, next) => {
  try {
    const { goal, price, budget, audience, timeline, offers, brandVoiceId } = req.body;
    const clientId = req.clientId;
    const client   = req.client;

    // ── Validate required fields ──
    if (!goal || !audience || !timeline) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: goal, audience, timeline',
      });
    }

    // ── Build dynamic context from client profile ──
    const clientContext    = await getClientContext(clientId);
    const knowledgeContext = await getKnowledgeForAgent('strategy', clientId);
    const brandVoice       = await getBrandVoiceContext(brandVoiceId, clientId);

    const baseSystemPrompt = `You are an elite marketing strategist specializing in high-ticket businesses in Canada.
You create detailed, actionable campaign strategies that drive leads and sales through Meta Ads, email marketing, and funnel optimization.
All strategies must be practical for GoHighLevel CRM implementation.

CLIENT BUSINESS: ${client.companyName || 'The client'}
INDUSTRY: ${client.industry || 'Business'}

Format your response with clear sections using ## for main headings and ### for sub-sections.
Be specific with numbers, timelines, and tactics tailored to this client's business.`;

    const { systemPrompt } = await buildEnhancedSystemPrompt(
      'strategy', null, baseSystemPrompt,
      clientContext + knowledgeContext + brandVoice
    );

    const userPrompt = `Create a complete marketing campaign strategy for ${client.companyName || 'this business'}:
- Campaign Goal: ${goal}
- Ticket/Product Price: ${price || 'Not specified'}
- Monthly Ad Budget: ${budget || 'Not specified'}
- Primary Audience: ${audience}
- Timeline: ${timeline} days
- Key Offers/Products: ${offers || 'Not specified'}

Include:
## Campaign Overview & Goals
## Week-by-Week Timeline
## Meta Ads Strategy (audiences, campaign structure, budget allocation)
## Funnel Structure (stages and pages needed)
## Email Marketing Strategy
## GoHighLevel Setup Recommendations
## KPIs & Success Metrics`;

    // ── Stream response if client wants it ──
    if (req.query.stream === 'true') {
      return streamAgent({ req, res, systemPrompt, userPrompt, agentType: 'strategy', clientId });
    }

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType:   'strategy',
      inputParams:  req.body,
      clientId,
      maxTokens:   4000,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};