import { createContext, useContext, useState, useEffect } from 'react';
import { getSettings, updateSettings } from '../services/api';

const SettingsContext = createContext(null);

const defaults = {
  eventName: 'Elev8 Montreal',
  eventDate: '2025',
  eventLocation: 'Montreal, Quebec, Canada',
  ticketPrice: '$497',
  targetAudience:
    'Entrepreneurs, business owners, real estate professionals, sales and marketing professionals in Montreal and Quebec',
  valuePropositions:
    'Learn proven real estate investment strategies, master sales and closing techniques, discover cutting-edge marketing methods, network with 500+ successful business people in Montreal, access to top speakers and industry leaders',
  brandVoice: 'Professional, Ambitious, Results-Focused',
};

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(defaults);
  const [loading, setLoading]   = useState(true);
  const [saving,  setSaving]    = useState(false);

  useEffect(() => {
    getSettings()
      .then(({ data }) => setSettings(data.settings))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const saveSettings = async (values) => {
    setSaving(true);
    try {
      const { data } = await updateSettings(values);
      setSettings(data.settings);
      return { success: true };
    } catch (err) {
      return { success: false, message: err.response?.data?.message || 'Save failed' };
    } finally {
      setSaving(false);
    }
  };

  return (
    <SettingsContext.Provider value={{ settings, loading, saving, saveSettings }}>
      {children}
    </SettingsContext.Provider>
  );
}

export const useSettings = () => useContext(SettingsContext);
