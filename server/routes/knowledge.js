import express from 'express';
import {
  getKnowledge,
  createKnowledge,
  updateKnowledge,
  deleteKnowledge,
} from '../controllers/knowledgeController.js';

const router = express.Router();

router.get('/',    getKnowledge);
router.post('/',   createKnowledge);
router.put('/:id', updateKnowledge);
router.delete('/:id', deleteKnowledge);

export default router;