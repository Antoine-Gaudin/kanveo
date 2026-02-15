/**
 * Loading Skeleton pour les cartes de prospects dans le Kanban
 */
export default function ProspectCardSkeleton() {
  return (
    <div className="bg-card rounded-lg p-4 border border-border animate-pulse">
      {/* En-tête avec entreprise */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </div>
        <div className="h-8 w-8 bg-muted rounded-full ml-2"></div>
      </div>

      {/* Informations */}
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-muted rounded w-full"></div>
        <div className="h-3 bg-muted rounded w-5/6"></div>
      </div>

      {/* Tags */}
      <div className="flex gap-2 mb-3">
        <div className="h-6 bg-muted rounded-full w-16"></div>
        <div className="h-6 bg-muted rounded-full w-20"></div>
      </div>

      {/* Footer avec actions */}
      <div className="flex gap-2">
        <div className="h-8 bg-muted rounded flex-1"></div>
        <div className="h-8 bg-muted rounded flex-1"></div>
      </div>
    </div>
  );
}
