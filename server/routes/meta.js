import express from 'express';
import { getMetaDashboard, getSummary, getCampaigns } from '../controllers/metaController.js';

const router = express.Router();

router.get('/dashboard',  getMetaDashboard);
router.get('/summary',    getSummary);
router.get('/campaigns',  getCampaigns);

export default router;