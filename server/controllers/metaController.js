import {
    getAccountSummary,
    getCampaignInsights,
    getDailyInsights,
    getTopAds,
  } from '../services/metaService.js';
  
  export const getMetaDashboard = async (req, res, next) => {
    try {
      const { datePreset = 'last_14d' } = req.query;
      const clientId = req.clientId;   
      const [summary, campaigns, daily, topAds] = await Promise.allSettled([
        getAccountSummary({ datePreset, clientId }),             // ← pass clientId
      getCampaignInsights({ datePreset, clientId }),           // ← pass clientId
      getDailyInsights({ days: 14, clientId }),                // ← pass clientId
      getTopAds({ datePreset, limit: 5, clientId }), 
      ]);
      res.json({
        success: true,
        data: {
          summary:   summary.status   === 'fulfilled' ? summary.value   : null,
          campaigns: campaigns.status === 'fulfilled' ? campaigns.value : [],
          daily:     daily.status     === 'fulfilled' ? daily.value     : [],
          topAds:    topAds.status    === 'fulfilled' ? topAds.value    : [],
        },
      });
    } catch (err) { next(err); }
  };
  
  export const getSummary = async (req, res, next) => {
    try {
      const { datePreset = 'last_14d' } = req.query;
      const summary = await getAccountSummary({ datePreset });
      res.json({ success: true, summary });
    } catch (err) { next(err); }
  };

  
  
  export const getCampaigns = async (req, res, next) => {
    try {
      const { datePreset = 'last_14d' } = req.query;
      const campaigns = await getCampaignInsights({ datePreset });
      res.json({ success: true, campaigns });
    } catch (err) { next(err); }
  };