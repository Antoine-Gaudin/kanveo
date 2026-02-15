import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { Loader2 } from 'lucide-react';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          setError(error.message);
          setTimeout(() => navigate('/auth'), 3000);
          return;
        }

        if (session) {
          const { data: profile, error: profileError } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (profileError && profileError.code === 'PGRST116') {
            await supabase
              .from('user_profiles')
              .insert([{
                id: session.user.id,
                email: session.user.email,
                full_name: session.user.user_metadata?.full_name || session.user.user_metadata?.name || '',
                first_name: session.user.user_metadata?.given_name || '',
                last_name: session.user.user_metadata?.family_name || '',
                avatar_url: session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture,
                company_name: session.user.user_metadata?.company_name || '',
              }]);
          }

          setTimeout(() => navigate('/success'), 500);
        } else {
          setTimeout(() => navigate('/auth'), 2000);
        }
      } catch (err) {
        setError(err.message);
        setTimeout(() => navigate('/auth'), 3000);
      }
    };

    handleCallback();
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center space-y-4">
        {error ? (
          <>
            <div className="text-destructive text-lg font-semibold">
              Erreur d'authentification
            </div>
            <p className="text-muted-foreground">{error}</p>
            <p className="text-sm text-muted-foreground">Redirection vers la page de connexion...</p>
          </>
        ) : (
          <>
            <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
            <div className="text-lg font-semibold">Connexion en cours...</div>
            <p className="text-muted-foreground">Veuillez patienter</p>
          </>
        )}
      </div>
    </div>
  );
}
