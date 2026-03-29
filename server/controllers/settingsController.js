import EventSettings from '../models/EventSettings.js';

// GET /api/settings
export const getSettings = async (req, res, next) => {
  try {
    let settings = await EventSettings.findOne({
      clientId: req.clientId,                          // ← scope by clientId
    });
    if (!settings) {
      settings = await EventSettings.create({
        clientId: req.clientId,                        // ← scope by clientId
        singleton: `elev8_${req.clientId}`,            // unique per client
      });
    }
    res.json({ success: true, settings });
  } catch (err) { next(err); }
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
      { clientId: req.clientId },  
      { eventName, eventDate, eventLocation, ticketPrice, targetAudience, valuePropositions, brandVoice },
      { new: true, upsert: true, runValidators: true }
    );

    res.json({ success: true, settings, message: 'Event context saved successfully' });
  } catch (err) {
    next(err);
  }
};
