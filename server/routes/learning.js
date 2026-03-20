import express from 'express';
import {
  recordLeadOutcome,
  getStats,
  getTopPrompts,
  getChampionPrompt,
  recordGenerationFeedback,
} from '../controllers/learningController.js';

const router = express.Router();

router.post('/outcome',            recordLeadOutcome);
router.post('/feedback',           recordGenerationFeedback);
router.get('/stats',               getStats);
router.get('/top-prompts',         getTopPrompts);
router.get('/champion/:agentType', getChampionPrompt);

export default router;