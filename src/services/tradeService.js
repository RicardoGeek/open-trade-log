import { supabase } from './supabaseClient';

export const tradeService = {
  // --- Storage ---
  uploadScreenshot: async (file, userId) => {
    if (!file) return null;

    // Generate unique filename: userId/timestamp_filename
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from('screenshots')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false // Don't allow overwriting existing files silently
      });

    if (error) throw error;

    // Construct the public URL
    const { data: { publicUrl } } = supabase.storage
      .from('screenshots')
      .getPublicUrl(fileName);

    return publicUrl;
  },

  // --- Reference Data ---
  getSymbols: async () => {
    const { data, error } = await supabase.from('symbols').select('*').order('name');
    if (error) throw error;
    return data;
  },

  getIndicators: async () => {
    const { data, error } = await supabase.from('indicators').select('*').order('name');
    if (error) throw error;
    return data;
  },

  // --- User Preferences via Trade History ---
  getUserSymbolPreference: async (userId, symbolId) => {
    if (!symbolId || !userId) return null;
    const { data, error } = await supabase
      .from('trades')
      .select('pip_value, trade_size')
      .eq('user_id', userId)
      .eq('symbol_id', symbolId)
      .order('entry_time', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Failed to fetch historical symbol preference:", error);
      return null;
    }
    return data;
  },

  // --- Core Trades ---
  getTrades: async (userId) => {
    // We join the 'symbols' table automatically by specifying the foreign relation
    const { data, error } = await supabase
      .from('trades')
      .select('*, symbols(name)')
      .eq('user_id', userId)
      .order('entry_time', { ascending: false });

    if (error) throw error;
    
    // Flatten symbols(name) into symbol for frontend ease
    return data.map(t => ({
      ...t,
      symbol: t.symbols?.name || 'Unknown'
    }));
  },

  getTradeById: async (id, userId) => {
    const { data: trade, error: tradeErr } = await supabase
      .from('trades')
      .select('*, symbols(name)')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (tradeErr) throw tradeErr;

    // Fetch associated indicators
    const { data: indicatorsMap, error: indErr } = await supabase
      .from('trade_indicators')
      .select('*, indicators(name)')
      .eq('trade_id', id);

    if (indErr) throw indErr;

    return { 
      ...trade, 
      symbol: trade.symbols?.name, 
      indicatorConfigs: indicatorsMap || [] 
    };
  },

  addTrade: async (tradeData, userId, complexIndicatorsArray) => {
    // 1. Insert core trade
    const { data: newTrade, error: tradeErr } = await supabase
      .from('trades')
      .insert([{ ...tradeData, user_id: userId }])
      .select()
      .single();

    if (tradeErr) throw tradeErr;

    // 2. Insert any mapped indicators
    if (complexIndicatorsArray && complexIndicatorsArray.length > 0) {
      const inserts = complexIndicatorsArray.map(ind => ({
        trade_id: newTrade.id,
        indicator_id: ind.indicator_id,
        recorded_values: ind.recorded_values // Needs to be an object ready to stringify to JSONB
      }));

      const { error: indErr } = await supabase
        .from('trade_indicators')
        .insert(inserts);

      if (indErr) throw indErr;
    }

    return newTrade;
  },

  updateTrade: async (id, userId, tradeData, updatedIndicatorsArray) => {
    const { data, error } = await supabase
      .from('trades')
      .update(tradeData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;

    // A complete replacement of trade indicators is usually easier than diffing
    if (updatedIndicatorsArray) {
      await supabase.from('trade_indicators').delete().eq('trade_id', id);
      
      if (updatedIndicatorsArray.length > 0) {
        const inserts = updatedIndicatorsArray.map(ind => ({
          trade_id: id,
          indicator_id: ind.indicator_id,
          recorded_values: ind.recorded_values
        }));
        await supabase.from('trade_indicators').insert(inserts);
      }
    }

    return data;
  },

  deleteTrade: async (id, userId) => {
    // 1. Fetch trade first to get screenshot URL for clean up
    const { data: trade } = await supabase
      .from('trades')
      .select('screenshot_url')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (trade && trade.screenshot_url) {
      // The public URL looks like: https://[project].supabase.co/storage/v1/object/public/screenshots/[userId]/[filename]
      // We need to extract just "[userId]/[filename]"
      try {
        const urlParts = trade.screenshot_url.split('/screenshots/');
        if (urlParts.length === 2) {
          const filePath = urlParts[1];
          await supabase.storage.from('screenshots').remove([filePath]);
        }
      } catch (e) {
        console.error("Failed to parse and delete storage file during cascade:", e);
      }
    }

    // 2. Delete the trade (relational indicators will drop via ON DELETE CASCADE)
    const { error } = await supabase
      .from('trades')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    return true;
  }
};
