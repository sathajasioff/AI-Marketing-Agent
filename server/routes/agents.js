// import express from 'express';
// import {
//   runStrategy,
//   runContent,
//   runEmail,
//   runLeads,
// } from '../controllers/agentController.js';

// const router = express.Router();

// router.post('/strategy', runStrategy);
// router.post('/content',  runContent);
// router.post('/email',    runEmail);
// router.post('/leads',    runLeads);

// export default router;

import express from 'express';
import { protect, checkLimit } from '../middleware/auth.js';
import { runStrategy }        from '../controllers/strategyAgent.js';
import { runContent }         from '../controllers/contentAgent.js';
import { runEmail, runLeads } from '../controllers/emailAndLeadAgent.js';

const router = express.Router();

// ── All agent routes require authentication + generation limit check ──
router.use(protect);
router.use(checkLimit);

// ── Agent endpoints ──
// Append ?stream=true to any route for Server-Sent Events streaming
router.post('/strategy', runStrategy);
router.post('/content',  runContent);
router.post('/email',    runEmail);
router.post('/leads',    runLeads);

export default router;