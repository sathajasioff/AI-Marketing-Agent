import GHLAccount from '../models/GHLAccount.js';

const verifyCredentials = async ({ apiKey, locationId }) => {
  const params = new URLSearchParams({
    locationId,
    limit: '1',
    page: '1',
  });

  const response = await fetch(`https://services.leadconnectorhq.com/contacts/?${params.toString()}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: '2021-07-28',
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const error = new Error(text || `Credential verification failed with status ${response.status}`);
    error.statusCode = response.status;
    throw error;
  }
};

// GET /api/ghl-accounts
export const getAccounts = async (req, res, next) => {
  try {
    const accounts = await GHLAccount.find().sort({ createdAt: -1 });
    // Never return the full API key — mask it
    const masked = accounts.map(a => ({
      ...a.toObject(),
      apiKey: `****${a.apiKey.slice(-6)}`,
    }));
    res.json({ success: true, accounts: masked });
  } catch (err) { next(err); }
};

// POST /api/ghl-accounts
export const createAccount = async (req, res, next) => {
  try {
    const name = req.body?.name?.trim();
    const apiKey = req.body?.apiKey?.trim();
    const locationId = req.body?.locationId?.trim();
    const notes = req.body?.notes?.trim() || '';

    if (!name || !apiKey || !locationId) {
      return res.status(400).json({ success: false, message: 'Name, API key and Location ID are required' });
    }

    const existing = await GHLAccount.findOne({ locationId });
    if (existing) {
      return res.status(400).json({ success: false, message: 'A GHL account with this Location ID already exists' });
    }

    // Test the credentials before saving using the same API family as the live app.
    try {
      await verifyCredentials({ apiKey, locationId });
    } catch (error) {
      const message =
        error.statusCode === 401
          ? 'Invalid GHL API key for this subaccount'
          : error.statusCode === 403
          ? 'This GHL API key does not have access to that Location ID'
          : error.statusCode === 404
          ? 'Location ID not found for this GHL account'
          : 'Invalid GHL credentials — could not connect to this account';

      return res.status(400).json({ success: false, message });
    }

    const hasActiveAccount = await GHLAccount.exists({ isActive: true });
    const account = await GHLAccount.create({
      name,
      apiKey,
      locationId,
      notes,
      isActive: !hasActiveAccount,
    });

    res.json({ success: true, account: { ...account.toObject(), apiKey: `****${apiKey.slice(-6)}` } });
  } catch (err) { next(err); }
};

// PATCH /api/ghl-accounts/:id/activate — set as active account
export const activateAccount = async (req, res, next) => {
  try {
    // Deactivate all first
    await GHLAccount.updateMany({}, { isActive: false });
    // Activate the selected one
    const account = await GHLAccount.findByIdAndUpdate(
      req.params.id,
      { isActive: true },
      { new: true }
    );
    if (!account) return res.status(404).json({ success: false, message: 'Account not found' });
    res.json({ success: true, message: `"${account.name}" is now the active GHL account`, account });
  } catch (err) { next(err); }
};

// PUT /api/ghl-accounts/:id — update name/notes only (not credentials)
export const updateAccount = async (req, res, next) => {
  try {
    const { name, notes } = req.body;
    const account = await GHLAccount.findByIdAndUpdate(
      req.params.id, { name, notes }, { new: true }
    );
    res.json({ success: true, account });
  } catch (err) { next(err); }
};

// DELETE /api/ghl-accounts/:id
export const deleteAccount = async (req, res, next) => {
  try {
    const account = await GHLAccount.findById(req.params.id);
    if (account?.isActive) {
      return res.status(400).json({ success: false, message: 'Cannot delete the active account. Activate another account first.' });
    }
    await GHLAccount.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Account deleted' });
  } catch (err) { next(err); }
};

// Helper used by ghlService — get active account credentials
export const getActiveCredentials = async () => {
  const account = await GHLAccount.findOne({ isActive: true });
  if (account) {
    return { apiKey: account.apiKey, locationId: account.locationId };
  }
  // Fall back to .env if no account is set up yet
  return {
    apiKey:     process.env.GHL_API_KEY,
    locationId: process.env.GHL_LOCATION_ID,
  };
};
