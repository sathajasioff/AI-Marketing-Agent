import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    clientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Client', required: true },
    metaAccessToken: { type: String, default: '' },
    metaAdAccountId: { type: String, default: '' },
    metaConnected:   { type: Boolean, default: false },
    metaTestedAt:    { type: Date, default: null },
    metaAccountName: { type: String, default: '' },
  },
  { timestamps: true }
);

// One integration document per client
integrationSchema.index({ clientId: 1 }, { unique: true });

const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;