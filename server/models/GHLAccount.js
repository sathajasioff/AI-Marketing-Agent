import mongoose from 'mongoose';

const ghlAccountSchema = new mongoose.Schema(
  {
    name:       { type: String, required: true }, // e.g. "Elev8 Montreal Client"
    apiKey:     { type: String, required: true },
    locationId: { type: String, required: true },
    isActive:   { type: Boolean, default: false }, // only one active at a time
    notes:      { type: String, default: '' },
  },
  { timestamps: true }
);

const GHLAccount = mongoose.model('GHLAccount', ghlAccountSchema);
export default GHLAccount;