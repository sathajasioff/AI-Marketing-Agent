import jwt from 'jsonwebtoken';
import Client from '../models/Client.js';

const JWT_SECRET = process.env.JWT_SECRET || 'elev8-secret-change-in-production';

// ── Generate token ──
export const generateToken = (clientId) => {
  return jwt.sign({ clientId }, JWT_SECRET, { expiresIn: '7d' });
};

// ── Protect routes — must be logged in ──
export const protect = async (req, res, next) => {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'Not authenticated' });
    }

    const token   = header.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    const client  = await Client.findById(decoded.clientId);

    if (!client || !client.isActive) {
      return res.status(401).json({ success: false, message: 'Account not found or disabled' });
    }

    req.client   = client;
    req.clientId = client._id;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ success: false, message: 'Session expired — please log in again' });
    }
    res.status(401).json({ success: false, message: 'Invalid token' });
  }
};

// ── Admin only ──
export const adminOnly = (req, res, next) => {
  if (req.client?.role !== 'admin') {
    return res.status(403).json({ success: false, message: 'Admin access required' });
  }
  next();
};

// ── Check generation limit ──
export const checkLimit = async (req, res, next) => {
  const client = req.client;
  if (client.generationsUsed >= client.generationsLimit) {
    return res.status(403).json({
      success: false,
      message: `Generation limit reached (${client.generationsLimit}/month). Upgrade your plan to continue.`,
      limitReached: true,
    });
  }
  next();
};