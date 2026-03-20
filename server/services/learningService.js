import crypto from 'crypto';
import PromptPerformance from '../models/PromptPerformance.js';

const recalculateSuccessRate = (doc) => {
  const decided = (doc.conversions || 0) + (doc.losses || 0);
  return decided > 0 ? Math.round(((doc.conversions || 0) / decided) * 100) : 0;
};

const refreshChampion = async (agentType, subType = null) => {
  const scope = { agentType, subType: subType || null };

  await PromptPerformance.updateMany(scope, { $set: { isChampion: false } });

  const champion = await PromptPerformance.findOne({
    ...scope,
    totalUses: { $gte: 1 },
  }).sort({ successRate: -1, totalUses: -1, updatedAt: -1 });

  if (champion) {
    champion.isChampion = true;
    await champion.save();
  }

  return champion;
};

export const hashPrompt = (systemPrompt = '', userPrompt = '') =>
  crypto
    .createHash('sha256')
    .update(`${systemPrompt}::${userPrompt}`)
    .digest('hex');

export const recordPromptUse = async ({
  agentType,
  subType = null,
  promptHash,
  promptSnapshot = {},
}) => {
  if (!agentType || !promptHash) {
    return null;
  }

  const doc = await PromptPerformance.findOneAndUpdate(
    { promptHash },
    {
      $setOnInsert: {
        agentType,
        subType,
        promptSnapshot: {
          systemPrompt: promptSnapshot.systemPrompt || '',
          userPromptTemplate: promptSnapshot.userPromptTemplate || '',
        },
      },
      $inc: { totalUses: 1 },
    },
    { upsert: true, new: true }
  );

  return doc;
};

export const recordOutcome = async ({ agentType, subType = null, promptHash, outcome }) => {
  if (!agentType || !promptHash || !['converted', 'lost'].includes(outcome)) {
    return null;
  }

  const updates = outcome === 'converted' ? { conversions: 1 } : { losses: 1 };

  const doc = await PromptPerformance.findOneAndUpdate(
    { promptHash },
    {
      $setOnInsert: {
        agentType,
        subType,
        promptSnapshot: {
          systemPrompt: '',
          userPromptTemplate: '',
        },
      },
      $inc: updates,
    },
    { upsert: true, new: true }
  );

  doc.successRate = recalculateSuccessRate(doc);
  await doc.save();
  await refreshChampion(agentType, subType);

  return doc.toObject();
};

export const getAllPerformanceStats = async () => {
  const stats = await PromptPerformance.aggregate([
    {
      $group: {
        _id: { agentType: '$agentType', subType: '$subType' },
        variants: { $sum: 1 },
        totalUses: { $sum: '$totalUses' },
        conversions: { $sum: '$conversions' },
        losses: { $sum: '$losses' },
        bestRate: { $max: '$successRate' },
      },
    },
    { $sort: { '_id.agentType': 1, bestRate: -1 } },
  ]);

  return stats.map((s) => ({
    agentType: s._id.agentType,
    subType: s._id.subType,
    totalUses: s.totalUses,
    conversions: s.conversions,
    losses: s.losses,
    variants: s.variants,
    bestSuccessRate: s.bestRate || 0,
    overallRate: s.totalUses > 0 ? Math.round((s.conversions / s.totalUses) * 100) : 0,
  }));
};

export const getWinningPrompt = async (agentType, subType = null) => {
  if (!agentType) {
    return null;
  }

  const scope = { agentType, subType: subType || null };

  let champion = await PromptPerformance.findOne({
    ...scope,
    isChampion: true,
  }).lean();

  if (!champion) {
    champion = await PromptPerformance.findOne(scope)
      .sort({ successRate: -1, totalUses: -1, updatedAt: -1 })
      .lean();
  }

  return champion;
};

export const buildEnhancedSystemPrompt = async (
  agentType,
  subType,
  baseSystemPrompt,
  eventContext = ''
) => {
  const champion = await getWinningPrompt(agentType, subType);

  const systemPrompt = champion?.promptSnapshot?.systemPrompt
    ? `${baseSystemPrompt}\n\n${eventContext}\n\nReference high-performing prompt pattern:\n${champion.promptSnapshot.systemPrompt}`
    : `${baseSystemPrompt}\n\n${eventContext}`;

  return { systemPrompt, champion };
};
