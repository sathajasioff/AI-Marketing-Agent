import Client from '../models/Client.js';
import Generation from '../models/Generation.js';
import Lead from '../models/Lead.js';

// GET /api/admin/clients
export const getAllClients = async (req, res, next) => {
  try {
    const clients = await Client.find().sort({ createdAt: -1 });
    res.json({ success: true, clients });
  } catch (err) { next(err); }
};

// GET /api/admin/clients/:id/stats
export const getClientStats = async (req, res, next) => {
  try {
    const { id } = req.params;
    const [generations, leads] = await Promise.all([
      Generation.countDocuments({ clientId: id }),
      Lead.countDocuments({ clientId: id }),
    ]);
    res.json({ success: true, stats: { generations, leads } });
  } catch (err) { next(err); }
};

// PUT /api/admin/clients/:id
export const updateClient = async (req, res, next) => {
  try {
    const { isActive, plan, generationsLimit, role } = req.body;
    const client = await Client.findByIdAndUpdate(
      req.params.id,
      { isActive, plan, generationsLimit, role },
      { new: true }
    );
    res.json({ success: true, client: client.toJSON() });
  } catch (err) { next(err); }
};

// POST /api/admin/clients — create client as admin
export const createClient = async (req, res, next) => {
  try {
    const { name, email, password, companyName, plan, generationsLimit } = req.body;
    const client = await Client.create({
      name, email, password, companyName,
      plan:             plan || 'starter',
      generationsLimit: generationsLimit || 100,
    });
    res.status(201).json({ success: true, client: client.toJSON() });
  } catch (err) { next(err); }
};

// DELETE /api/admin/clients/:id
export const deleteClient = async (req, res, next) => {
  try {
    await Client.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Client deleted' });
  } catch (err) { next(err); }
};