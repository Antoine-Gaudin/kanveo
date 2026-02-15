import { createContext, useContext, useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { queryClient } from '../lib/queryClient';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const loadingRef = useRef(true);

  const finishLoading = () => {
    if (loadingRef.current) {
      loadingRef.current = false;
      setLoading(false);
    }
  };

  // Pattern recommandé Supabase v2 : tout passe par onAuthStateChange
  useEffect(() => {
    let isMounted = true;
    // Seule source de vérité : onAuthStateChange
    // Le premier event (INITIAL_SESSION ou SIGNED_IN) donne l'état initial
    // IMPORTANT: le callback ne doit PAS être async — appeler Supabase depuis 
    // onAuthStateChange pendant la restauration de session crée un deadlock interne
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMounted) return;
        if (session?.user) {
          setUser(session.user);

          // Charger le profil EN DEHORS du callback (setTimeout pour éviter le deadlock Supabase)
          // IMPORTANT : finishLoading seulement APRÈS le profil chargé pour éviter
          // que ProtectedRoute redirige avant que isAdmin/isSubscribed soient dispo
          setTimeout(() => {
            supabase
              .from('user_profiles')
              .select('*')
              .eq('id', session.user.id)
              .single()
              .then(({ data }) => {
                if (isMounted && data) {
                  setProfile(data);
                }
              })
              .catch((err) => {
                console.warn('Erreur chargement profil:', err?.message);
              })
              .finally(() => {
                if (isMounted) finishLoading();
              });
          }, 0);
        } else {
          setUser(null);
          setProfile(null);
          // Pas de user → on peut finir le loading immédiatement
          if (isMounted) finishLoading();
        }
      }
    );

    // Fallback de sécurité : si onAuthStateChange ne fire jamais (improbable), débloquer après 5s
    const fallbackTimer = setTimeout(() => {
      if (isMounted) finishLoading();
    }, 5000);

    // Keepalive : quand l'onglet redevient visible après avoir été caché,
    // forcer un refresh de session pour garder le JWT valide
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        supabase.auth.getSession().then(({ data: { session }, error }) => {
          if (error) {
            // NE PAS mettre user à null — les requêtes Supabase échoueront naturellement
            return;
          }
          if (session?.user) {
            if (isMounted) setUser(session.user);
          } else {
            if (isMounted) {
              setUser(null);
              setProfile(null);
              queryClient.clear(); // Vider le cache React Query
            }
          }
        });
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      isMounted = false;
      clearTimeout(fallbackTimer);
      subscription?.unsubscribe();
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  const signup = async (email, password, fullName, company) => {
    try {
      setError(null);

      // Séparer prénom et nom si fullName contient un espace
      const parts = fullName.trim().split(' ');
      const firstName = parts[0] || '';
      const lastName = parts.slice(1).join(' ') || '';

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name: firstName,
            last_name: lastName,
            company_name: company
          }
        }
      });

      if (error) throw error;

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signin = async (email, password) => {
    try {
      setError(null);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;
      // Le profil sera chargé automatiquement via onAuthStateChange (SIGNED_IN)
      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signout = async () => {
    try {
      // Vider le cache React Query
      queryClient.clear();
      // Force la mise à jour immédiate AVANT Supabase
      setUser(null);
      setProfile(null);
      setError(null);

      // Puis logout Supabase
      try {
        await supabase.auth.signOut();
      } catch (supabaseErr) {
      }

      return { success: true };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const signInWithOAuth = async (provider) => {
    try {
      setError(null);

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        }
      });

      if (error) throw error;

      return { success: true, data };
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const isAdmin = () => {
    return profile?.role_level === 3;
  };

  const isTeamLead = () => {
    return profile?.role_level === 2;
  };

  const subscriptionStatus = profile?.subscription_status || 'none';
  const isSubscribed = ['active', 'trialing'].includes(subscriptionStatus);

  const refreshProfile = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single();
    if (data) setProfile(data);
  };

  return (
    <AuthContext.Provider value={{
      user,
      profile,
      loading,
      error,
      signup,
      signin,
      signout,
      signInWithOAuth,
      isAdmin,
      isTeamLead,
      subscriptionStatus,
      isSubscribed,
      refreshProfile,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    // Ne pas crasher pendant le HMR — retourner un état "loading" par défaut
    return {
      user: null,
      profile: null,
      loading: true,
      error: null,
      signup: async () => {},
      signin: async () => {},
      signout: async () => {},
      signInWithOAuth: async () => {},
      isAdmin: () => false,
      isTeamLead: () => false,
      subscriptionStatus: 'none',
      isSubscribed: false,
      refreshProfile: async () => {},
    };
  }
  return context;
}