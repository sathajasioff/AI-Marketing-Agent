import EventSettings from '../models/EventSettings.js';

// GET /api/settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await EventSettings.findOne({ singleton: 'elev8' });
    if (!settings) {
      settings = await EventSettings.create({ singleton: 'elev8' });
    }
    res.json({ success: true, settings });
  } catch (err) {
    next(err);
  }
};

// PUT /api/settings
export const updateSettings = async (req, res, next) => {
  try {
    const {
      eventName,
      eventDate,
      eventLocation,
      ticketPrice,
      targetAudience,
      valuePropositions,
      brandVoice,
    } = req.body;

    const settings = await EventSettings.findOneAndUpdate(
      { singleton: 'elev8' },
      { eventName, eventDate, eventLocation, ticketPrice, targetAudience, valuePropositions, brandVoice },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, settings, message: 'Event context saved successfully' });
  } catch (err) {
    next(err);
  }
};
