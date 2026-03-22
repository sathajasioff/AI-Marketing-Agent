import mongoose from 'mongoose';

const knowledgeBaseSchema = new mongoose.Schema(
  {
    agentType: {
      type: String,
      enum: ['strategy', 'content', 'email', 'leads', 'all'],
      required: true,
    },
    category: {
      type: String,
      enum: [
        'audience_insight',   // what you know about your audience
        'proven_hook',        // ad hooks that got high CTR
        'failed_hook',        // hooks that flopped
        'objection',          // common objections you hear
        'campaign_result',    // real campaign numbers
        'audience_segment',   // specific persona detail
        'competitor',         // what competitors are doing
        'local_insight',      // Montreal-specific knowledge
        'testimonial',        // real social proof
        'custom',
      ],
      required: true,
    },
    title:    { type: String, required: true },
    content:  { type: String, required: true },
    tags:     { type: [String], default: [] },
    isActive: { type: Boolean, default: true },
    priority: { type: Number, default: 1 }, // 1=low, 2=medium, 3=high
    source:   { type: String, default: 'manual' }, // manual, campaign, ghl
    metrics: {
      ctr:        { type: Number, default: null },
      cpl:        { type: Number, default: null },
      openRate:   { type: Number, default: null },
      convRate:   { type: Number, default: null },
    },
  },
  { timestamps: true }
);

knowledgeBaseSchema.index({ agentType: 1, category: 1, isActive: 1 });

const KnowledgeBase = mongoose.model('KnowledgeBase', knowledgeBaseSchema);
export default KnowledgeBase;