import Client from '../models/Client.js';
import { generateToken } from '../middleware/auth.js';

const normalizeEmail = (email = '') => email.trim().toLowerCase();

// ── POST /api/auth/register ──
export const register = async (req, res, next) => {
  try {
    const { name, email, password, companyName } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email and password are required' });
    }

    const exists = await Client.findOne({ email: normalizedEmail });
    if (exists) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const client = await Client.create({ name, email: normalizedEmail, password, companyName });
    const token  = generateToken(client._id);

    res.status(201).json({
      success: true,
      token,
      client: client.toJSON(),
      message: 'Account created successfully',
    });
  } catch (err) { next(err); }
};

// ── POST /api/auth/login ──
export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required' });
    }

    const client = await Client.findOne({ email: normalizedEmail });
    if (!client || !(await client.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    if (!client.isActive) {
      return res.status(401).json({ success: false, message: 'Account is disabled. Contact support.' });
    }

    client.lastLoginAt = new Date();
    await client.save();

    const token = generateToken(client._id);

    res.json({
      success: true,
      token,
      client: client.toJSON(),
    });
  } catch (err) { next(err); }
};

// ── GET /api/auth/me ──
export const getMe = async (req, res) => {
  res.json({ success: true, client: req.client.toJSON() });
};

// ── PUT /api/auth/me ──
export const updateMe = async (req, res, next) => {
  try {
    const allowed = ['name', 'companyName', 'phone', 'avatar'];
    const updates = {};
    allowed.forEach(k => { if (req.body[k] !== undefined) updates[k] = req.body[k]; });

    const client = await Client.findByIdAndUpdate(req.clientId, updates, { new: true });
    res.json({ success: true, client: client.toJSON() });
  } catch (err) { next(err); }
};

// ── PUT /api/auth/change-password ──
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const client = await Client.findById(req.clientId);

    if (!(await client.comparePassword(currentPassword))) {
      return res.status(400).json({ success: false, message: 'Current password is incorrect' });
    }

    client.password = newPassword;
    await client.save();

    res.json({ success: true, message: 'Password changed successfully' });
  } catch (err) { next(err); }
};

// ── POST /api/auth/logout ──
export const logout = (req, res) => {
  res.json({ success: true, message: 'Logged out' });
};
