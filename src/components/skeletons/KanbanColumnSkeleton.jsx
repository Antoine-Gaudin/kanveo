import ProspectCardSkeleton from './ProspectCardSkeleton';

/**
 * Loading Skeleton pour une colonne Kanban complète
 */
export default function KanbanColumnSkeleton() {
  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="bg-card rounded-t-lg px-6 py-4 border-b-2 border-border animate-pulse">
        <div className="flex items-center justify-between mb-3">
          <div className="h-6 bg-muted rounded w-1/2"></div>
          <div className="h-8 w-12 bg-muted rounded-full"></div>
        </div>
      </div>

      {/* Cards */}
      <div className="flex-1 rounded-b-lg border-2 border-border border-t-0 bg-card/50 p-4 space-y-3 overflow-y-auto">
        <ProspectCardSkeleton />
        <ProspectCardSkeleton />
        <ProspectCardSkeleton />
      </div>
    </div>
  );
}
