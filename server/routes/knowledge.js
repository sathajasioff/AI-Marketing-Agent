import express from 'express';
import {
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '../controllers/knowledgeController.js';
import KnowledgeBase from '../models/KnowledgeBase.js';

const router = express.Router();

// GET /api/knowledge/brand-voices — fetch only brand voice entries
router.get('/brand-voices', async (req, res, next) => {
  try {
    const voices = await KnowledgeBase.find({
      title: { $regex: /^brand voice/i },
      isActive: true,
    }).sort({ title: 1 }).select('_id title');

    res.json({ success: true, voices });
  } catch (err) { next(err); }
});

router.get('/',    getKnowledge);
router.post('/',   createKnowledge);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);


export default router;
