import express from 'express';
import {
  getIntegrations,
  saveMeta,
  testMeta,
  disconnectMeta,
} from '../controllers/integrationController.js';

const router = express.Router();

router.get('/',             getIntegrations);
router.put('/meta',         saveMeta);
router.post('/meta/test',   testMeta);
router.delete('/meta',      disconnectMeta);

export default router;