import { Component } from 'react';
import * as Sentry from '@sentry/react';

/**
 * Error Boundary pour capturer les erreurs React
 * Empêche l'application de crasher complètement
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error) {
    // Mise à jour de l'état pour afficher l'UI de fallback
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    // Logging de l'erreur
    // Sauvegarder l'erreur dans le state pour l'affichage
    this.setState({
      error,
      errorInfo
    });

    // Envoyer l'erreur à Sentry en production
    Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // UI de fallback personnalisée
      return this.props.fallback ? (
        this.props.fallback(this.state.error, this.handleReset)
      ) : (
        <div className="min-h-screen bg-background flex items-center justify-center px-4">
          <div className="max-w-2xl w-full bg-card border border-red-500/50 rounded-xl p-8 shadow-2xl">
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">⚠️</div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Une erreur est survenue
              </h1>
              <p className="text-muted-foreground">
                L'application a rencontré un problème inattendu
              </p>
            </div>

            {/* Détails de l'erreur (mode dev) */}
            {import.meta.env.DEV && this.state.error && (
              <div className="bg-red-100 dark:bg-red-900/20 border border-red-300 dark:border-red-500/30 rounded-lg p-4 mb-6">
                <p className="text-red-700 dark:text-red-300 font-mono text-sm mb-2">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="mt-2">
                    <summary className="text-red-600 dark:text-red-400 text-xs cursor-pointer hover:text-red-500 dark:hover:text-red-300">
                      Voir la stack trace
                    </summary>
                    <pre className="text-xs text-red-700 dark:text-red-300 mt-2 overflow-auto max-h-40">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-4">
              <button
                onClick={this.handleReset}
                className="flex-1 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
              >
                Réessayer
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="flex-1 px-6 py-3 bg-muted hover:bg-muted/80 text-foreground rounded-lg font-medium transition-colors"
              >
                Retour à l'accueil
              </button>
            </div>

            {/* Conseils */}
            <div className="mt-6 p-4 bg-blue-100 dark:bg-blue-600/10 border border-blue-300 dark:border-blue-500/30 rounded-lg">
              <p className="text-blue-700 dark:text-blue-300 text-sm">
                💡 <span className="font-semibold">Conseils :</span>
              </p>
              <ul className="text-blue-700 dark:text-blue-300 text-sm mt-2 space-y-1 ml-4 list-disc">
                <li>Rafraîchissez la page</li>
                <li>Videz le cache de votre navigateur</li>
                <li>Vérifiez votre connexion internet</li>
              </ul>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
