import mongoose from 'mongoose';

const integrationSchema = new mongoose.Schema(
  {
    singleton:       { type: String, default: 'main', unique: true },
    metaAccessToken: { type: String, default: '' },
    metaAdAccountId: { type: String, default: '' },
    metaConnected:   { type: Boolean, default: false },
    metaTestedAt:    { type: Date, default: null },
    metaAccountName: { type: String, default: '' },
  },
  { timestamps: true }
);

const Integration = mongoose.model('Integration', integrationSchema);
export default Integration;