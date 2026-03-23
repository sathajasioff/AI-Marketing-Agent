import express from 'express';
import { protect, adminOnly } from '../middleware/auth.js';
import { getAllClients, getClientStats, updateClient, createClient, deleteClient } from '../controllers/adminController.js';

const router = express.Router();

router.use(protect, adminOnly); // all admin routes require admin role

router.get('/clients',      getAllClients);
router.post('/clients',     createClient);
router.get('/clients/:id/stats', getClientStats);
router.put('/clients/:id',  updateClient);
router.delete('/clients/:id', deleteClient);

export default router;