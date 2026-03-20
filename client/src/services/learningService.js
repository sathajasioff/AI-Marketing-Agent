import PromptPerformance from '../models/PromptPerformance.js';
import crypto from 'crypto';

export const hashPrompt = (systemPrompt, userPromptTemplate) => {
  return crypto
    .createHash('sha256')
    .update(systemPrompt + '|||' + userPromptTemplate)
    .digest('hex')
    .slice(0, 16);
};

export const recordPromptUse = async ({ agentType, subType, promptHash, promptSnapshot }) => {
  await PromptPerformance.findOneAndUpdate(
    { agentType, subType: subType || null, promptHash },
    {
      $inc: { totalUses: 1 },
      $setOnInsert: { promptSnapshot, agentType, subType: subType || null, promptHash },
    },
    { upsert: true, new: true }
  );
};

export const recordOutcome = async ({ agentType, subType, promptHash, outcome }) => {
  const field = outcome === 'converted' ? 'conversions' : 'losses';
  const perf = await PromptPerformance.findOneAndUpdate(
    { agentType, subType: subType || null, promptHash },
    { $inc: { [field]: 1 } },
    { new: true }
  );
  if (!perf) return null;

  const successRate =
    perf.totalUses > 0
      ? Math.round((perf.conversions / perf.totalUses) * 100)
      : 0;

  await PromptPerformance.updateOne({ _id: perf._id }, { $set: { successRate } });
  return { ...perf.toObject(), successRate };
};

export const getWinningPrompt = async (agentType, subType = null) => {
  const best = await PromptPerformance.findOne({
    agentType,
    subType: subType || null,
    totalUses: { $gte: 5 },
    successRate: { $gte: 60 },
  })
    .sort({ successRate: -1, totalUses: -1 })
    .lean();

  return best || null;
};

export const getAllPerformanceStats = async () => {
  const stats = await PromptPerformance.aggregate([
    {
      $group: {
        _id: { agentType: '$agentType', subType: '$subType' },
        totalUses:   { $sum: '$totalUses' },
        conversions: { $sum: '$conversions' },
        losses:      { $sum: '$losses' },
        variants:    { $sum: 1 },
        bestRate:    { $max: '$successRate' },
      },
    },
    { $sort: { '_id.agentType': 1 } },
  ]);

  return stats.map((s) => ({
    agentType:      s._id.agentType,
    subType:        s._id.subType,
    totalUses:      s.totalUses,
    conversions:    s.conversions,
    losses:         s.losses,
    variants:       s.variants,
    bestSuccessRate: s.bestRate,
    overallRate:
      s.totalUses > 0 ? Math.round((s.conversions / s.totalUses) * 100) : 0,
  }));
};

export const buildEnhancedSystemPrompt = async (agentType, subType, baseSystemPrompt, eventContext) => {
  const winner = await getWinningPrompt(agentType, subType);

  if (!winner) {
    return { systemPrompt: `${baseSystemPrompt}\n\n${eventContext}`, isEnhanced: false };
  }

  const learningNote = `
PERFORMANCE INSIGHT: Based on ${winner.totalUses} past generations, the most successful version of this agent had a ${winner.successRate}% conversion rate. Key pattern from winning outputs: focus on specificity, urgency, and direct benefit statements. Apply these learnings.`;

  return {
    systemPrompt: `${baseSystemPrompt}\n\n${eventContext}\n${learningNote}`,
    isEnhanced:   true,
    promptHash:   winner.promptHash,
    successRate:  winner.successRate,
  };
};