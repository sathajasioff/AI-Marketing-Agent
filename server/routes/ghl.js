import express from 'express';
import {
  getLeads,
  syncLeadsFromGHL,
  qualifyLead,
  pushTagsToGHL,
  pushNoteToGHL,
  triggerGHLWorkflow,
  setLeadOutcome,
  getPipelineStats,
  getDashboardData,
} from '../controllers/ghlController.js';

const router = express.Router();

router.get('/leads',                 getLeads);
router.get('/stats',                 getPipelineStats);
router.post('/sync',                 syncLeadsFromGHL);
router.post('/qualify/:id',          qualifyLead);
router.post('/push-tags/:id',        pushTagsToGHL);
router.post('/push-note/:id',        pushNoteToGHL);
router.post('/trigger-workflow/:id', triggerGHLWorkflow);
router.patch('/outcome/:id',         setLeadOutcome);
router.get('/dashboard', getDashboardData);

export default router;