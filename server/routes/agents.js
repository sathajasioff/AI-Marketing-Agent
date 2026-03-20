import express from 'express';
import {
  runStrategy,
  runContent,
  runEmail,
  runLeads,
} from '../controllers/agentController.js';

const router = express.Router();

router.post('/strategy', runStrategy);
router.post('/content',  runContent);
router.post('/email',    runEmail);
router.post('/leads',    runLeads);

export default router;
