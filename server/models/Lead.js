import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema(
  {
    ghlContactId: { type: String, required: true },
    ghlAccountId: { type: mongoose.Schema.Types.ObjectId, ref: 'GHLAccount', default: null, index: true },
    ghlAccountName: { type: String, default: '' },
    ghlLocationId: { type: String, default: null, index: true },
    firstName:    { type: String, default: '' },
    lastName:     { type: String, default: '' },
    email:        { type: String, default: '' },
    phone:        { type: String, default: '' },
    tags:         { type: [String], default: [] },
    source:       { type: String, default: '' },
    ghlCreatedAt: { type: Date, default: null },
    lastSyncedAt: { type: Date, default: Date.now },

    aiScore:         { type: Number, min: 0, max: 100, default: null },
    aiSegment: {
      type: String,
      enum: ['cold', 'warm', 'hot', 'buyer', null],
      default: null,
    },
    clientId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },
    aiOutput:        { type: String, default: null },
    recommendedTags: { type: [String], default: [] },
    recommendedFlow: { type: String, default: null },
    promptHash:      { type: String, default: null },
    qualifiedAt:     { type: Date, default: null },

    outcome: {
      type: String,
      enum: ['pending', 'converted', 'lost', 'nurturing'],
      default: 'pending',
    },
    outcomeNote:      { type: String, default: '' },
    outcomeSetAt:     { type: Date, default: null },

    tagsPushedToGHL:   { type: Boolean, default: false },
    notePushedToGHL:   { type: Boolean, default: false },
    workflowTriggered: { type: Boolean, default: false },
  },
  
  { timestamps: true }
);



leadSchema.virtual('fullName').get(function () {
  return `${this.firstName} ${this.lastName}`.trim() || this.email || 'Unknown';
});

leadSchema.index({ aiScore: -1 });
leadSchema.index({ aiSegment: 1 });
leadSchema.index({ outcome: 1 });
leadSchema.index({ clientId: 1, ghlContactId: 1, ghlAccountId: 1 }, { unique: true });

const Lead = mongoose.model('Lead', leadSchema);
export default Lead;
