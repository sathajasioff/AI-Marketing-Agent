import mongoose from 'mongoose';

const eventSettingsSchema = new mongoose.Schema(
  {
    // Only one settings document — we always upsert the same record
    singleton: {
      type: String,
      default: 'elev8',
      unique: true,
    },
    eventName: {
      type: String,
      default: 'Elev8 Montreal',
    },
    eventDate: {
      type: String,
      default: '2025',
    },
    eventLocation: {
      type: String,
      default: 'Montreal, Quebec, Canada',
    },
    ticketPrice: {
      type: String,
      default: '$497',
    },
    targetAudience: {
      type: String,
      default:
        'Entrepreneurs, business owners, real estate professionals, sales and marketing professionals in Montreal and Quebec',
    },
    valuePropositions: {
      type: String,
      default:
        'Learn proven real estate investment strategies, master sales and closing techniques, discover cutting-edge marketing methods, network with 500+ successful business people in Montreal, access to top speakers and industry leaders',
    },
    brandVoice: {
      type: String,
      default: 'Professional, Ambitious, Results-Focused',
    },
    clientId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      'Client',
      required: true,
      index:    true,
    },
  },
  { timestamps: true }
);

const EventSettings = mongoose.model('EventSettings', eventSettingsSchema);

export default EventSettings;
