import Generation from '../models/Generation.js';

// GET /api/history?agentType=strategy&limit=20
export const getHistory = async (req, res, next) => {
  try {
    const { agentType, limit = 20, page = 1 } = req.query;
    const query = { clientId: req.clientId }; 
    if (agentType) query.agentType = agentType;
    const total = await Generation.countDocuments(query);
    const items = await Generation.find(query)
      .sort({ createdAt: -1 })
      .limit(Number(limit))
      .skip((Number(page) - 1) * Number(limit))
      .select('-output'); // exclude heavy output field from list

    res.json({ success: true, total, page: Number(page), items });
  } catch (err) {
    next(err);
  }
};

// GET /api/history/:id — fetch single generation with full output
export const getGenerationById = async (req, res, next) => {
  try {
    const item = await Generation.findOne({
      _id: req.params.id,
      clientId: req.clientId,                          // ← scope by clientId
    });
    if (!item) return res.status(404).json({ success: false, message: 'Not found' });
    res.json({ success: true, item });
  } catch (err) { next(err); }
};

// PATCH /api/history/:id/save — toggle saved + label
export const saveGeneration = async (req, res, next) => {
  try {
    const { isSaved, label } = req.body;
    const gen = await Generation.findByIdAndUpdate(
      req.params.id,
      { isSaved, label },
      { new: true }
    );
    if (!gen) return res.status(404).json({ success: false, message: 'Generation not found' });
    res.json({ success: true, generation: gen });
  } catch (err) {
    next(err);
  }
};

// DELETE /api/history/:id
export const deleteGeneration = async (req, res, next) => {
  try {
    await Generation.findOneAndDelete({
      _id: req.params.id,
      clientId: req.clientId,                          // ← scope by clientId
    });
    res.json({ success: true });
  } catch (err) { next(err); }
};
