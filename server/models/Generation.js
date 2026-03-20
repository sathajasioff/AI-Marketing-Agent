import mongoose from 'mongoose';

const generationSchema = new mongoose.Schema(
  {
    agentType: {
      type: String,
      enum: ['strategy', 'content', 'email', 'leads'],
      required: true,
    },
    subType: {
      type: String, // e.g. 'meta', 'funnel', 'social', 'vsl' for content agent
      default: null,
    },
    inputParams: {
      type: mongoose.Schema.Types.Mixed, // stores the form inputs used
      required: true,
    },
    output: {
      type: String,
      required: true,
    },
    tokensUsed: {
      type: Number,
      default: 0,
    },
    isSaved: {
      type: Boolean,
      default: false,
    },
    label: {
      type: String,
      default: null, // user-given name for saved outputs
    },
    promptHash: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

// Index for fast querying by agent type
generationSchema.index({ agentType: 1, createdAt: -1 });

const Generation = mongoose.model('Generation', generationSchema);

export default Generation;
