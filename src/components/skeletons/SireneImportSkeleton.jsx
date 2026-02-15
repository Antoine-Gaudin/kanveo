// src/components/skeletons/SireneImportSkeleton.jsx
// Squelette pour la page d'import SIRENE

export default function SireneImportSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="animate-pulse">
        <div className="h-8 w-56 bg-gray-200 dark:bg-muted rounded-lg mb-2"></div>
        <div className="h-4 w-96 bg-gray-200 dark:bg-muted rounded"></div>
      </div>

      {/* Cartes de statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 animate-pulse">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="h-10 w-10 bg-gray-200 dark:bg-muted rounded-lg"></div>
              <div className="h-4 w-16 bg-gray-200 dark:bg-muted rounded"></div>
            </div>
            <div className="h-6 w-20 bg-gray-200 dark:bg-muted rounded"></div>
          </div>
        ))}
      </div>

      {/* Section d'importation */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-6 animate-pulse">
        <div className="h-6 w-32 bg-gray-200 dark:bg-muted rounded mb-4"></div>

        {/* Options d'importation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <div className="h-4 w-24 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-muted rounded"></div>
          </div>
          <div className="space-y-2">
            <div className="h-4 w-32 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-10 w-full bg-gray-200 dark:bg-muted rounded"></div>
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-3">
          <div className="h-12 w-32 bg-gray-200 dark:bg-muted rounded"></div>
          <div className="h-12 w-40 bg-gray-200 dark:bg-muted rounded"></div>
        </div>
      </div>

      {/* Section de recherche */}
      <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-lg p-6 animate-pulse">
        <div className="h-6 w-24 bg-gray-200 dark:bg-muted rounded mb-4"></div>

        {/* Barre de recherche */}
        <div className="flex gap-3 mb-6">
          <div className="flex-1 h-12 bg-gray-200 dark:bg-muted rounded-lg"></div>
          <div className="h-12 w-32 bg-gray-200 dark:bg-muted rounded-lg"></div>
          <div className="h-12 w-20 bg-gray-200 dark:bg-muted rounded-lg"></div>
        </div>

        {/* Filtres */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 w-full bg-gray-200 dark:bg-muted rounded"></div>
          ))}
        </div>

        {/* Tableau de résultats */}
        <div className="border border-gray-200 dark:border-border rounded-lg overflow-hidden">
          <div className="bg-gray-50 dark:bg-muted/50 p-3 border-b border-gray-200 dark:border-border">
            <div className="flex items-center gap-3">
              <div className="h-5 w-5 bg-gray-200 dark:bg-muted rounded"></div>
              <div className="h-4 w-32 bg-gray-200 dark:bg-muted rounded"></div>
            </div>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-border">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="p-3 hover:bg-gray-50 dark:hover:bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-5 w-5 bg-gray-200 dark:bg-muted rounded"></div>
                    <div className="space-y-1">
                      <div className="h-4 w-32 bg-gray-200 dark:bg-muted rounded"></div>
                      <div className="h-3 w-24 bg-gray-200 dark:bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-16 bg-gray-200 dark:bg-muted rounded"></div>
                    <div className="h-8 w-8 bg-gray-200 dark:bg-muted rounded"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Pagination */}
        <div className="flex justify-between items-center mt-4">
          <div className="h-4 w-24 bg-gray-200 dark:bg-muted rounded"></div>
          <div className="flex gap-2">
            <div className="h-8 w-8 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-muted rounded"></div>
            <div className="h-8 w-8 bg-gray-200 dark:bg-muted rounded"></div>
          </div>
        </div>
      </div>

      {/* Animation de chargement si importation en cours */}
      <div className="flex flex-col items-center justify-center py-12 animate-pulse">
        <div className="w-16 h-16 border-4 border-gray-200 dark:border-border border-t-blue-500 rounded-full mb-4"></div>
        <div className="h-4 w-32 bg-gray-200 dark:bg-muted rounded"></div>
        <div className="h-3 w-48 bg-gray-200 dark:bg-muted rounded mt-2"></div>
      </div>
    </div>
  );
}