import { buildEnhancedSystemPrompt } from '../services/learningService.js';
import { getKnowledgeForAgent } from './knowledgeController.js';
import { getClientContext, getBrandVoiceContext, callClaude, streamAgent } from './agentUtils.js';

// ══════════════════════════════════════════
// CONTENT AGENT
// ══════════════════════════════════════════
export const runContent = async (req, res, next) => {
  try {
    const { subType, brandVoiceId, ...params } = req.body;
    const clientId = req.clientId;
    const client   = req.client;

    if (!subType) {
      return res.status(400).json({ success: false, message: 'Missing required field: subType' });
    }

    const clientContext    = await getClientContext(clientId);
    const knowledgeContext = await getKnowledgeForAgent('content', clientId);
    const brandVoice       = await getBrandVoiceContext(brandVoiceId, clientId);

    const businessName = client.companyName || 'this business';
    const industry     = client.industry    || 'business';

    const baseSystemPrompt = `You are an expert direct-response copywriter specializing in ${industry} marketing in Canada.
You write compelling, high-converting copy for ${businessName}.
Your copy is punchy, benefit-driven, and speaks directly to the target audience.

CLIENT: ${businessName}
INDUSTRY: ${industry}

Format with ## for variants or sections, ### for sub-elements.
Include character counts where relevant for Meta ad compliance.`;

    const { systemPrompt } = await buildEnhancedSystemPrompt(
      'content', subType, baseSystemPrompt,
      clientContext + knowledgeContext + brandVoice
    );

    let userPrompt = '';

    // ── Meta Ads ──
    if (subType === 'meta') {
      const { adType, persona, pain, variants } = params;
      if (!adType || !persona) {
        return res.status(400).json({ success: false, message: 'Missing required fields: adType, persona' });
      }
      userPrompt = `Write ${variants || 3} Meta ad variants for ${businessName}.
Ad Type: ${adType}
Target Persona: ${persona}
Pain Point / Desire: ${pain || 'wants to grow their business and income'}

For each variant provide:
### Variant [N] — [Hook Style]
**Hook (first line, max 125 chars):**
**Primary Text (max 280 chars):**
**Headline (max 40 chars):**
**Description (max 30 chars):**
**CTA Button:** [Register Now / Get Tickets / Shop Now / Learn More]
**Why this works:** [1 sentence]`;

    // ── Funnel / Landing Page ──
    } else if (subType === 'funnel') {
      const { pageType, audience, headline } = params;
      if (!pageType || !audience) {
        return res.status(400).json({ success: false, message: 'Missing required fields: pageType, audience' });
      }
      userPrompt = `Write complete ${pageType} page copy for ${businessName}.
Audience: ${audience}
Headline Direction: ${headline || 'grow their business and income'}
Include: headline, subheadline, hero section, benefits/bullets, social proof placeholders, CTA, urgency element.`;

    // ── Social Media Posts ──
    } else if (subType === 'social') {
      const { platform, postType, count } = params;
      if (!platform || !postType) {
        return res.status(400).json({ success: false, message: 'Missing required fields: platform, postType' });
      }
      userPrompt = `Write ${count || 5} ${platform} posts for ${businessName}.
Content Type: ${postType}
Include: caption text, emojis, hashtags (for Instagram/TikTok), clear CTA in each post.`;

    // ── VSL Script ──
    } else if (subType === 'vsl') {
      const { length, audience, cta } = params;
      if (!audience) {
        return res.status(400).json({ success: false, message: 'Missing required field: audience' });
      }
      userPrompt = `Write a complete ${length || '5-minute'} VSL script for ${businessName}.
Audience: ${audience}
CTA: ${cta || 'Sign up now'}
Include sections: [HOOK], [PROBLEM], [AGITATE], [SOLUTION], [SOCIAL PROOF], [OFFER], [CTA]
Add speaker notes and timing markers throughout.`;

    // ── Blog / Article ──
    } else if (subType === 'blog') {
      const { topic, keywords, wordCount } = params;
      if (!topic) {
        return res.status(400).json({ success: false, message: 'Missing required field: topic' });
      }
      userPrompt = `Write a ${wordCount || 800}-word blog article for ${businessName}.
Topic: ${topic}
SEO Keywords: ${keywords || 'Not specified'}
Format: engaging intro, 3-5 subheadings (##), practical tips, strong conclusion with CTA.`;

    } else {
      return res.status(400).json({ success: false, message: `Invalid content subType: ${subType}` });
    }

    if (req.query.stream === 'true') {
      return streamAgent({ req, res, systemPrompt, userPrompt, agentType: 'content', subType, clientId });
    }

    const result = await callClaude({
      systemPrompt,
      userPrompt,
      agentType:  'content',
      subType,
      inputParams: req.body,
      clientId,
    });

    res.json({ success: true, ...result });
  } catch (err) { next(err); }
};