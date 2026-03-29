import axios from 'axios';
import { getMetaCredentials } from '../controllers/integrationController.js';

const META_BASE = 'https://graph.facebook.com/v19.0';

const getConfig = async (clientId) => {
  const creds = await getMetaCredentials(clientId);
  if (!creds.accessToken) throw new Error('Meta access token not configured. Add it in Integrations page.');
  if (!creds.adAccountId) throw new Error('Meta Ad Account ID not configured. Add it in Integrations page.');
  return { token: creds.accessToken, account: `act_${creds.adAccountId}` };
};

export const getAccountSummary = async ({ datePreset = 'last_14d', clientId } = {}) => {
  const { token, account } = await getConfig(clientId);
  const { data } = await axios.get(`${META_BASE}/${account}/insights`, {
    params: {
      access_token: token,
      date_preset:  datePreset,
      level:        'account',
      fields:       'spend,impressions,reach,clicks,ctr,cpc,cpp,actions,frequency',
    },
    timeout: 12000,
  });
  const s       = data.data?.[0] || {};
  const actions = s.actions || [];
  const leads   = parseInt(actions.find(a => a.action_type === 'lead')?.value || 0);
  return {
    spend:       parseFloat(s.spend       || 0).toFixed(2),
    impressions: parseInt(s.impressions   || 0),
    reach:       parseInt(s.reach         || 0),
    clicks:      parseInt(s.clicks        || 0),
    ctr:         parseFloat(s.ctr         || 0).toFixed(2),
    cpc:         parseFloat(s.cpc         || 0).toFixed(2),
    cpp:         parseFloat(s.cpp         || 0).toFixed(2),
    frequency:   parseFloat(s.frequency   || 0).toFixed(2),
    leads,
    cpl: leads > 0 ? (parseFloat(s.spend || 0) / leads).toFixed(2) : '0.00',
  };
};

export const getCampaignInsights = async ({ datePreset = 'last_14d', clientId } = {}) => {
  const { token, account } = await getConfig(clientId);
  const { data } = await axios.get(`${META_BASE}/${account}/insights`, {
    params: {
      access_token: token,
      date_preset:  datePreset,
      level:        'campaign',
      fields:       'campaign_name,spend,impressions,clicks,ctr,cpc,actions',
      limit:        20,
    },
    timeout: 12000,
  });
  return data.data || [];
};

export const getDailyInsights = async ({ days = 14, clientId } = {}) => {
  const { token, account } = await getConfig(clientId);
  const since = new Date(Date.now() - days * 86400000).toISOString().split('T')[0];
  const until = new Date().toISOString().split('T')[0];
  const { data } = await axios.get(`${META_BASE}/${account}/insights`, {
    params: {
      access_token:   token,
      time_range:     JSON.stringify({ since, until }),
      time_increment: 1,
      level:          'account',
      fields:         'spend,impressions,clicks,ctr,date_start',
      limit:          days + 2,
    },
    timeout: 12000,
  });
  return data.data || [];
};

export const getTopAds = async ({ datePreset = 'last_14d', limit = 5, clientId } = {}) => {
  const { token, account } = await getConfig(clientId);
  const { data } = await axios.get(`${META_BASE}/${account}/insights`, {
    params: {
      access_token: token,
      date_preset:  datePreset,
      level:        'ad',
      fields:       'ad_name,adset_name,spend,impressions,clicks,ctr,cpc',
      sort:         'clicks_descending',
      limit,
    },
    timeout: 12000,
  });
  return data.data || [];
};
