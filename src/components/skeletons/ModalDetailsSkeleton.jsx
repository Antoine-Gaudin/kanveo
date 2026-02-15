// src/components/skeletons/ModalDetailsSkeleton.jsx
// Squelette pour les modales de détails

export default function ModalDetailsSkeleton() {
  return (
    <div className="space-y-4">
      {/* Header du modal */}
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-8 w-48 bg-muted rounded-lg"></div>
          <div className="h-8 w-8 bg-muted rounded-full"></div>
        </div>
      </div>

      {/* Informations principales */}
      <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
        <div className="flex items-start gap-4 mb-4">
          {/* Avatar/Logo */}
          <div className="w-16 h-16 bg-muted rounded-full flex-shrink-0"></div>

          {/* Informations */}
          <div className="flex-1 space-y-2">
            <div className="h-6 w-64 bg-muted rounded"></div>
            <div className="h-4 w-48 bg-muted rounded"></div>
            <div className="flex gap-2">
              <div className="h-6 w-24 bg-muted rounded-full"></div>
              <div className="h-6 w-32 bg-muted rounded-full"></div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs de navigation */}
      <div className="flex gap-2 border-b border-border animate-pulse">
        <div className="h-10 w-24 bg-muted rounded-t-lg"></div>
        <div className="h-10 w-32 bg-muted rounded-t-lg"></div>
        <div className="h-10 w-28 bg-muted rounded-t-lg"></div>
      </div>

      {/* Contenu des tabs - Informations générales */}
      <div className="space-y-4">
        {/* Section contact */}
        <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-5 w-32 bg-muted rounded mb-3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="h-3 w-16 bg-muted rounded"></div>
              <div className="h-4 w-40 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-20 bg-muted rounded"></div>
              <div className="h-4 w-32 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-muted rounded"></div>
              <div className="h-4 w-48 bg-muted rounded"></div>
            </div>
            <div className="space-y-2">
              <div className="h-3 w-28 bg-muted rounded"></div>
              <div className="h-4 w-36 bg-muted rounded"></div>
            </div>
          </div>
        </div>

        {/* Section entreprise */}
        <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-5 w-36 bg-muted rounded mb-3"></div>
          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <div className="h-3 w-12 bg-muted rounded mb-1"></div>
                <div className="h-4 w-32 bg-muted rounded"></div>
              </div>
              <div>
                <div className="h-3 w-16 bg-muted rounded mb-1"></div>
                <div className="h-4 w-28 bg-muted rounded"></div>
              </div>
              <div>
                <div className="h-3 w-20 bg-muted rounded mb-1"></div>
                <div className="h-4 w-40 bg-muted rounded"></div>
              </div>
              <div>
                <div className="h-3 w-24 bg-muted rounded mb-1"></div>
                <div className="h-4 w-24 bg-muted rounded"></div>
              </div>
            </div>
            <div>
              <div className="h-3 w-32 bg-muted rounded mb-1"></div>
              <div className="h-4 w-64 bg-muted rounded"></div>
            </div>
          </div>
        </div>

        {/* Section actions */}
        <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-5 w-28 bg-muted rounded mb-3"></div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-10 w-full bg-muted rounded"></div>
            ))}
          </div>
        </div>

        {/* Section notes */}
        <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-5 w-20 bg-muted rounded mb-3"></div>
          <div className="space-y-2">
            <div className="h-4 w-full bg-muted rounded"></div>
            <div className="h-4 w-3/4 bg-muted rounded"></div>
            <div className="h-4 w-5/6 bg-muted rounded"></div>
          </div>
        </div>

        {/* Section historique */}
        <div className="bg-card border border-border rounded-lg p-4 animate-pulse">
          <div className="h-5 w-24 bg-muted rounded mb-3"></div>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border-l-4 border-border pl-4">
                <div className="flex justify-between items-start mb-2">
                  <div className="h-4 w-32 bg-muted rounded"></div>
                  <div className="h-3 w-24 bg-muted rounded"></div>
                </div>
                <div className="h-3 w-full bg-muted rounded"></div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actions du modal */}
      <div className="flex justify-end gap-3 pt-4 border-t border-border animate-pulse">
        <div className="h-10 w-24 bg-muted rounded"></div>
        <div className="h-10 w-32 bg-muted rounded"></div>
        <div className="h-10 w-28 bg-muted rounded"></div>
      </div>
    </div>
  );
}