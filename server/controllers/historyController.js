import Generation from '../models/Generation.js';

// GET /api/history?agentType=strategy&limit=20
export const getHistory = async (req, res, next) => {
  try {
    const { agentType, limit = 20, page = 1 } = req.query;
    const query = agentType ? { agentType } : {};

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
    const gen = await Generation.findById(req.params.id);
    if (!gen) return res.status(404).json({ success: false, message: 'Generation not found' });
    res.json({ success: true, generation: gen });
  } catch (err) {
    next(err);
  }
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
    await Generation.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Generation deleted' });
  } catch (err) {
    next(err);
  }
};
