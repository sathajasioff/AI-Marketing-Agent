import mongoose from 'mongoose';

const promptPerformanceSchema = new mongoose.Schema(
  {
    agentType: {
      type: String,
      enum: ['strategy', 'content', 'email', 'leads'],
      required: true,
    },
    subType:    { type: String, default: null },
    promptHash: { type: String, required: true },

    promptSnapshot: {
      systemPrompt:      { type: String, default: '' },
      userPromptTemplate: { type: String, default: '' },
    },
    clientId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },

    totalUses:   { type: Number, default: 0 },
    conversions: { type: Number, default: 0 },
    losses:      { type: Number, default: 0 },
    successRate: { type: Number, default: 0 },
    isChampion:  { type: Boolean, default: false },
  },
  { timestamps: true }
);

promptPerformanceSchema.index({ agentType: 1, subType: 1, successRate: -1 });
promptPerformanceSchema.index({ promptHash: 1 }, { unique: true });

const PromptPerformance = mongoose.model('PromptPerformance', promptPerformanceSchema);
export default PromptPerformance;