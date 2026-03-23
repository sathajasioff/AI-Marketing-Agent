import express from 'express';
import {
  getAccounts,
  createAccount,
  activateAccount,
  updateAccount,
  deleteAccount,
} from '../controllers/ghlAccountController.js';

const router = express.Router();

router.get('/', getAccounts);
router.post('/', createAccount);
router.patch('/:id/activate', activateAccount);
router.put('/:id', updateAccount);
router.delete('/:id', deleteAccount);

export default router;
