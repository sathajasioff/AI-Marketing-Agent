import express from 'express';
import {
  getHistory,
  getGenerationById,
  saveGeneration,
  deleteGeneration,
} from '../controllers/historyController.js';

const router = express.Router();

router.get('/',        getHistory);
router.get('/:id',     getGenerationById);
router.patch('/:id/save', saveGeneration);
router.delete('/:id',  deleteGeneration);

export default router;
