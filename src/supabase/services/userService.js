import { supabase } from '../../lib/supabase';

// Map DB snake_case to UI camelCase
const mapUserToUI = (dbUser) => {
  if (!dbUser) return null;
  return {
    ...dbUser,
    uid: dbUser.id,
    displayName: dbUser.full_name,
    photoURL: dbUser.avatar_url,
    createdAt: dbUser.created_at ? new Date(dbUser.created_at) : null,
    updatedAt: dbUser.updated_at ? new Date(dbUser.updated_at) : null,
  };
};

const mapPortfolioSettingsToUI = (dbSettings) => {
  if (!dbSettings) return null;
  return {
    ...dbSettings,
    uid: dbSettings.user_id,
    websiteTitle: dbSettings.title,
    accentColor: dbSettings.accent_color,
    seoTitle: dbSettings.seo_title,
    seoDescription: dbSettings.seo_description,
    customDomain: dbSettings.custom_domain,
  };
};

const mapPortfolioSettingsToDB = (uiSettings) => {
  if (!uiSettings) return {};
  const db = { ...uiSettings };
  if (db.websiteTitle !== undefined) { db.title = db.websiteTitle; delete db.websiteTitle; }
  if (db.accentColor !== undefined) { db.accent_color = db.accentColor; delete db.accentColor; }
  if (db.seoTitle !== undefined) { db.seo_title = db.seoTitle; delete db.seoTitle; }
  if (db.seoDescription !== undefined) { db.seo_description = db.seoDescription; delete db.seoDescription; }
  if (db.customDomain !== undefined) { db.custom_domain = db.customDomain; delete db.customDomain; }
  return db;
};

export const checkUsernameAvailable = async (username) => {
  if (!username) return false;
  try {
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .ilike('username', username)
      .maybeSingle();
      
    if (error) throw error;
    return data === null; // Available if no user is found
  } catch (err) {
    console.error("Error checking username:", err);
    throw err;
  }
};

export const createUserProfile = async (uid, email, username, displayName, photoURL = "") => {
  try {
    const lowerUsername = username.toLowerCase();
    
    // Create user doc
    const { error: userError } = await supabase.from('users').insert({
      id: uid,
      username: lowerUsername,
      full_name: displayName || email.split('@')[0],
      avatar_url: photoURL
    });

    if (userError) throw userError;

    // Create default portfolio settings
    const { error: settingsError } = await supabase.from('portfolio_settings').insert({
      user_id: uid,
      theme: "minimal",
      accent_color: "#000000",
      title: displayName || email.split('@')[0],
      seo_title: "",
      seo_description: "",
      custom_domain: "",
      instagram: "",
      linkedin: "",
      behance: "",
      dribbble: ""
    });

    if (settingsError) throw settingsError;

    return true;
  } catch (err) {
    console.error("Error creating user profile:", err);
    throw err;
  }
};

export const getUserProfile = async (uid) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', uid)
      .maybeSingle();

    if (error) throw error;
    return mapUserToUI(data);
  } catch (err) {
    console.error("Error fetching user profile:", err);
    throw err;
  }
};

export const getUsersPage = async (lastVisible = 0, pageSize = 20) => {
  try {
    const from = lastVisible || 0;
    const to = from + pageSize - 1;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .range(from, to)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return {
      users: data.map(mapUserToUI),
      lastDoc: data.length === pageSize ? to + 1 : null,
      hasMore: data.length === pageSize
    };
  } catch (err) {
    console.error("Error fetching users page:", err);
    throw err;
  }
};

export const getUserByUsername = async (username) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .ilike('username', username)
      .maybeSingle();

    if (error) throw error;
    return mapUserToUI(data);
  } catch (err) {
    console.error("Error fetching user by username:", err);
    throw err;
  }
};

export const getPortfolioSettings = async (uid) => {
  try {
    const { data, error } = await supabase
      .from('portfolio_settings')
      .select('*')
      .eq('user_id', uid)
      .maybeSingle();

    if (error) throw error;
    return mapPortfolioSettingsToUI(data);
  } catch (err) {
    console.error("Error fetching portfolio settings:", err);
    throw err;
  }
};

export const updatePortfolioSettings = async (uid, settingsData) => {
  try {
    const dbData = mapPortfolioSettingsToDB(settingsData);
    const { error } = await supabase
      .from('portfolio_settings')
      .update(dbData)
      .eq('user_id', uid);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error("Error updating portfolio settings:", err);
    throw err;
  }
};

export const deleteUserDocs = async (uid) => {
  await supabase.from('portfolio_settings').delete().eq('user_id', uid);
  await supabase.from('users').delete().eq('id', uid);
};