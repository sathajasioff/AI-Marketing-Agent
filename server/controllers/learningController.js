import Lead from '../models/Lead.js';
import Generation from '../models/Generation.js';
import PromptPerformance from '../models/PromptPerformance.js';
import { recordOutcome, getAllPerformanceStats, getWinningPrompt } from '../services/learningService.js';

// ── POST /api/learning/outcome ──
export const recordLeadOutcome = async (req, res, next) => {
  try {
    const { leadId, outcome, note } = req.body;

    const lead = await Lead.findOne({
      _id:      leadId,
      clientId: req.clientId,                          // ← scoped
    });
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });

    await Lead.findOneAndUpdate(
      { _id: leadId, clientId: req.clientId },         // ← scoped
      { outcome, outcomeNote: note || '', outcomeSetAt: new Date() }
    );

    let perfUpdate = null;
    if (lead.promptHash && (outcome === 'converted' || outcome === 'lost')) {
      perfUpdate = await recordOutcome({
        clientId:  req.clientId,                       // ← scoped
        agentType: 'leads',
        subType:   null,
        promptHash: lead.promptHash,
        outcome,
      });
    }

    res.json({
      success: true,
      message: `Outcome "${outcome}" recorded${perfUpdate ? ` — prompt now at ${perfUpdate.successRate}% success rate` : ''}`,
      promptPerformance: perfUpdate,
    });
  } catch (err) { next(err); }
};

// ── GET /api/learning/stats ──
export const getStats = async (req, res, next) => {
  try {
    const q = { clientId: req.clientId };              // ← scoped

    const [performanceStats, generationStats, leadSummary] = await Promise.all([
      getAllPerformanceStats(req.clientId),             // ← pass clientId
      Generation.aggregate([
        { $match: q },                                 // ← scoped
        {
          $group: {
            _id:             { agentType: '$agentType', subType: '$subType' },
            generationCount: { $sum: 1 },
            totalTokens:     { $sum: '$tokensUsed' },
          },
        },
        { $sort: { '_id.agentType': 1 } },
      ]),
      Lead.aggregate([
        { $match: q },                                 // ← scoped
        { $group: { _id: '$outcome', count: { $sum: 1 }, avgScore: { $avg: '$aiScore' } } },
      ]),
    ]);

    const performanceMap = new Map(
      performanceStats.map(stat => [`${stat.agentType}::${stat.subType || ''}`, stat])
    );
    const generationMap = new Map(
      generationStats.map(stat => [`${stat._id.agentType}::${stat._id.subType || ''}`, stat])
    );

    const statKeys   = new Set([...performanceMap.keys(), ...generationMap.keys()]);
    const agentStats = [...statKeys].map(key => {
      const perf = performanceMap.get(key);
      const gens = generationMap.get(key);
      const [agentType, rawSubType] = key.split('::');
      return {
        agentType,
        subType:          rawSubType || null,
        totalUses:        perf?.totalUses        || gens?.generationCount || 0,
        conversions:      perf?.conversions      || 0,
        losses:           perf?.losses           || 0,
        variants:         perf?.variants         || (gens?.generationCount ? 1 : 0),
        bestSuccessRate:  perf?.bestSuccessRate  || 0,
        overallRate:      perf?.overallRate      || 0,
        totalGenerations: gens?.generationCount  || 0,
        totalTokens:      gens?.totalTokens      || 0,
      };
    });

    const totalLeads     = await Lead.countDocuments(q);
    const qualified      = await Lead.countDocuments({ ...q, aiScore: { $ne: null } });
    const converted      = leadSummary.find(s => s._id === 'converted')?.count || 0;
    const conversionRate = qualified > 0 ? Math.round((converted / qualified) * 100) : 0;
    const totalGenerations = generationStats.reduce((sum, s) => sum + (s.generationCount || 0), 0);

    res.json({
      success: true,
      stats: {
        agentStats,
        leadSummary,
        overview: { totalLeads, qualified, converted, conversionRate, totalGenerations },
      },
    });
  } catch (err) { next(err); }
};

// ── GET /api/learning/top-prompts ──
export const getTopPrompts = async (req, res, next) => {
  try {
    const { agentType } = req.query;
    const query = {
      clientId:  req.clientId,                         // ← scoped
      totalUses: { $gte: 3 },
    };
    if (agentType) query.agentType = agentType;

    const prompts = await PromptPerformance.find(query)
      .sort({ successRate: -1, totalUses: -1 })
      .limit(20)
      .select('-promptSnapshot');

    res.json({ success: true, prompts });
  } catch (err) { next(err); }
};

// ── GET /api/learning/champion/:agentType ──
export const getChampionPrompt = async (req, res, next) => {
  try {
    const { agentType } = req.params;
    const { subType }   = req.query;
    const winner = await getWinningPrompt(agentType, subType || null, req.clientId); // ← pass clientId
    res.json({ success: true, champion: winner });
  } catch (err) { next(err); }
};

// ── POST /api/learning/feedback ──
export const recordGenerationFeedback = async (req, res, next) => {
  try {
    const { promptHash, agentType, subType, feedback } = req.body;
    if (!['positive', 'negative'].includes(feedback))
      return res.status(400).json({ success: false, message: 'feedback must be positive or negative' });

    const outcome = feedback === 'positive' ? 'converted' : 'lost';
    const perf    = await recordOutcome({
      clientId:  req.clientId,                         // ← scoped
      agentType,
      subType:   subType || null,
      promptHash,
      outcome,
    });

    res.json({ success: true, message: 'Feedback recorded', performance: perf });
  } catch (err) { next(err); }
};