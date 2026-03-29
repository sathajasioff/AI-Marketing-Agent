import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const clientSchema = new mongoose.Schema(
  {
    // ── Identity ──
    name:         { type: String, required: true },
    email:        { type: String, required: true, unique: true, lowercase: true },
    password:     { type: String, required: true },
    role:         { type: String, enum: ['admin', 'client', 'viewer'], default: 'client' },

    // ── Business info ──
    companyName:  { type: String, default: '' },
    phone:        { type: String, default: '' },
    avatar:       { type: String, default: '' },

    // ── Plan ──
    plan:         { type: String, enum: ['starter', 'growth', 'agency'], default: 'starter' },
    isActive:     { type: Boolean, default: true },
    generationsUsed:  { type: Number, default: 0 },
    generationsLimit: { type: Number, default: 100 },

    // ── GHL per client ──
    ghlApiKey:    { type: String, default: '' },
    ghlLocationId:{ type: String, default: '' },
    ghlConnected: { type: Boolean, default: false },

    // ── Meta per client ──
    metaAccessToken:  { type: String, default: '' },
    metaAdAccountId:  { type: String, default: '' },
    metaConnected:    { type: Boolean, default: false },
    metaAccountName:  { type: String, default: '' },

    // ── Timestamps ──
    lastLoginAt:  { type: Date, default: null },
  },
  { timestamps: true }
);

// Hash password before save
clientSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
clientSchema.methods.comparePassword = async function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

// Never return password in JSON
clientSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.ghlApiKey;
  delete obj.metaAccessToken;
  return obj;
};

const Client = mongoose.model('Client', clientSchema);
export default Client;