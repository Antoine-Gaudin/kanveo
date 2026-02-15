import { Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute({ children, requireSubscription = true, requireAdmin = false }) {
  const { user, loading, isSubscribed, isAdmin, subscriptionStatus } = useAuth();

  // Empêcher l'indexation des pages protégées par les moteurs de recherche
  useEffect(() => {
    let meta = document.querySelector('meta[name="robots"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'robots';
      document.head.appendChild(meta);
    }
    meta.content = 'noindex, nofollow';

    return () => {
      if (meta && meta.parentNode) {
        meta.parentNode.removeChild(meta);
      }
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin">
            <div className="w-12 h-12 border-4 border-muted border-t-primary rounded-full"></div>
          </div>
          <p className="text-muted-foreground mt-4">Chargement...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  // Vérification admin si requis
  if (requireAdmin && !isAdmin()) {
    return <Navigate to="/dashboard" replace />;
  }

  // Les admins (role_level 3) bypassen toujours la vérification d'abonnement
  if (requireSubscription && !isSubscribed && !isAdmin()) {
    return <Navigate to="/pricing" replace />;
  }
  return children;
}
