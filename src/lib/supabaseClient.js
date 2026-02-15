import { createClient } from '@supabase/supabase-js';

// Utilisation des variables d'environnement (définies dans .env.local)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Vérification que les variables d'environnement sont bien définies
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variables Supabase manquantes dans .env.local');
}

// Singleton : éviter de créer plusieurs GoTrueClient lors du HMR Vite
let _supabaseClient = null;
function getSupabaseClient() {
  // Réutiliser le client existant s'il a déjà été créé (HMR)
  if (_supabaseClient) {
    return _supabaseClient;
  }

  const client = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: window.localStorage,
    },
  });

  _supabaseClient = client;
  return client;
}

export const supabase = getSupabaseClient();
