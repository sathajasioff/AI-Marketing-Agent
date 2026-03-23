import Integration from '../models/Integration.js';
import axios from 'axios';

const mask = (str) => str ? '••••••' + str.slice(-4) : '';

// ── GET /api/integrations ──
export const getIntegrations = async (req, res, next) => {
  try {
    let doc = await Integration.findOne({ clientId: req.clientId }); // ← scope
    if (!doc) doc = await Integration.create({ clientId: req.clientId });

    res.json({
      success: true,
      integrations: {
        metaAccessToken: doc.metaAccessToken ? mask(doc.metaAccessToken) : '',
        metaAdAccountId: doc.metaAdAccountId || '',
        metaConnected:   doc.metaConnected,
        metaTestedAt:    doc.metaTestedAt,
        metaAccountName: doc.metaAccountName || '',
        hasMetaToken:    !!doc.metaAccessToken,
      },
    });
  } catch (err) { next(err); }
};

// ── PUT /api/integrations/meta ──
export const saveMeta = async (req, res, next) => {
  try {
    const { metaAccessToken, metaAdAccountId } = req.body;
    if (!metaAccessToken || !metaAdAccountId)
      return res.status(400).json({ success: false, message: 'Both Access Token and Ad Account ID are required' });

    await Integration.findOneAndUpdate(
      { clientId: req.clientId },
      { singleton: 'main' },
      { metaAccessToken, metaAdAccountId, metaConnected: false, metaAccountName: '' },
      { upsert: true, new: true }
    );

    res.json({ success: true, message: 'Meta credentials saved. Click Test Connection to verify.' });
  } catch (err) { next(err); }
};

// ── POST /api/integrations/meta/test ──
export const testMeta = async (req, res, next) => {
  try {
    const doc = await Integration.findOne({ clientId: req.clientId });
    if (!doc?.metaAccessToken || !doc?.metaAdAccountId)
      return res.status(400).json({ success: false, message: 'Save your Meta credentials first' });

    try {
      const { data } = await axios.get(
        `https://graph.facebook.com/v19.0/act_${doc.metaAdAccountId}`,
        {
          params:  { access_token: doc.metaAccessToken, fields: 'name,account_status,currency' },
          timeout: 10000,
        }
      );

      await Integration.findOneAndUpdate(
        { singleton: 'main' },
        { metaConnected: true, metaTestedAt: new Date(), metaAccountName: data.name || '' }
      );

      res.json({
        success:   true,
        connected: true,
        message:   `Connected — Ad account: ${data.name}`,
        account:   { name: data.name, status: data.account_status, currency: data.currency },
      });
    } catch (apiErr) {
      const msg = apiErr.response?.data?.error?.message || apiErr.message;
      await Integration.findOneAndUpdate({ singleton: 'main' }, { metaConnected: false });
      res.status(400).json({ success: false, connected: false, message: `Meta error: ${msg}` });
    }
  } catch (err) { next(err); }
};

// ── DELETE /api/integrations/meta ──
export const disconnectMeta = async (req, res, next) => {
  try {
    await Integration.findOneAndUpdate(
      { clientId: req.clientId },  
      { singleton: 'main' },
      { metaAccessToken: '', metaAdAccountId: '', metaConnected: false, metaTestedAt: null, metaAccountName: '' }
    );
    res.json({ success: true, message: 'Meta disconnected' });
  } catch (err) { next(err); }
};

// ── Used internally by metaService ──
export const getMetaCredentials = async (clientId) => {
  const doc = await Integration.findOne({ clientId });
  return {
    accessToken:  doc?.metaAccessToken || process.env.META_ACCESS_TOKEN || '',
    adAccountId:  doc?.metaAdAccountId || process.env.META_AD_ACCOUNT_ID || '',
  };
};
