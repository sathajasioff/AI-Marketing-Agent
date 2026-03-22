import KnowledgeBase from '../models/KnowledgeBase.js';

export const getKnowledge = async (req, res, next) => {
  try {
    const { agentType, category } = req.query;
    const query = { isActive: true };
    if (agentType) query.$or = [{ agentType }, { agentType: 'all' }];
    if (category)  query.category = category;

    const items = await KnowledgeBase.find(query)
      .sort({ priority: -1, createdAt: -1 });
    res.json({ success: true, items });
  } catch (err) { next(err); }
};

export const createKnowledge = async (req, res, next) => {
  try {
    const item = await KnowledgeBase.create(req.body);
    res.json({ success: true, item });
  } catch (err) { next(err); }
};

export const updateKnowledge = async (req, res, next) => {
  try {
    const item = await KnowledgeBase.findByIdAndUpdate(
      req.params.id, req.body, { new: true }
    );
    res.json({ success: true, item });
  } catch (err) { next(err); }
};

export const deleteKnowledge = async (req, res, next) => {
  try {
    await KnowledgeBase.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) { next(err); }
};

// Called by agents to get relevant knowledge for their prompt
export const getKnowledgeForAgent = async (agentType) => {
  const items = await KnowledgeBase.find({
    isActive: true,
    $or: [{ agentType }, { agentType: 'all' }],
  }).sort({ priority: -1 }).limit(10);

  if (!items.length) return '';

  const sections = {
    audience_insight: [],
    proven_hook:      [],
    failed_hook:      [],
    objection:        [],
    campaign_result:  [],
    local_insight:    [],
    testimonial:      [],
  };

  items.forEach((item) => {
    if (sections[item.category]) {
      sections[item.category].push(item.content);
    }
  });

  let knowledgePrompt = '\n\nKNOWLEDGE BASE — use this real data in your output:\n';

  if (sections.audience_insight.length)
    knowledgePrompt += `\nAUDIENCE INSIGHTS:\n${sections.audience_insight.map(i => `- ${i}`).join('\n')}`;

  if (sections.proven_hook.length)
    knowledgePrompt += `\nPROVEN HOOKS (high CTR):\n${sections.proven_hook.map(i => `- ${i}`).join('\n')}`;

  if (sections.failed_hook.length)
    knowledgePrompt += `\nFAILED HOOKS (avoid these):\n${sections.failed_hook.map(i => `- ${i}`).join('\n')}`;

  if (sections.campaign_result.length)
    knowledgePrompt += `\nREAL CAMPAIGN RESULTS:\n${sections.campaign_result.map(i => `- ${i}`).join('\n')}`;

  if (sections.objection.length)
    knowledgePrompt += `\nCOMMON OBJECTIONS:\n${sections.objection.map(i => `- ${i}`).join('\n')}`;

  if (sections.local_insight.length)
    knowledgePrompt += `\nMONTREAL LOCAL INSIGHTS:\n${sections.local_insight.map(i => `- ${i}`).join('\n')}`;

  if (sections.testimonial.length)
    knowledgePrompt += `\nSOCIAL PROOF:\n${sections.testimonial.map(i => `- ${i}`).join('\n')}`;

  return knowledgePrompt;
};