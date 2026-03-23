import express from 'express';
import {
  getAudienceSummary,
  generateAdCopyFromLeads,
  generatePersonalizedEmail,
  generateBulkPersonalizedEmails,
  generateStrategyFromPipeline,
  analyzeLeadPatterns,
  pushEmailToGHL,
} from '../controllers/leadIntelligenceController.js';

const router = express.Router();

router.get('/audience-summary',           getAudienceSummary);
router.get('/patterns',                   analyzeLeadPatterns);
router.post('/ad-copy-from-leads',        generateAdCopyFromLeads);
router.post('/email-lead/:id',            generatePersonalizedEmail);
router.post('/bulk-email',                generateBulkPersonalizedEmails);
router.post('/strategy-from-pipeline',    generateStrategyFromPipeline);
router.post('/push-email-to-ghl/:leadId', pushEmailToGHL);

export default router;