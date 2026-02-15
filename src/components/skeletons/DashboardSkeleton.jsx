/**
 * Loading Skeleton pour la page Dashboard
 */
export default function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-card rounded-lg border border-border p-8 animate-pulse">
        <div className="h-10 bg-muted rounded w-1/3 mb-3"></div>
        <div className="h-5 bg-muted rounded w-2/3"></div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-6 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/2 mb-3"></div>
            <div className="h-12 bg-muted rounded w-3/4"></div>
          </div>
        ))}
      </div>

      {/* Graphique */}
      <div className="bg-card border border-border rounded-lg p-8 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/3 mb-6"></div>
        <div className="h-64 bg-muted rounded"></div>
      </div>

      {/* Liste */}
      <div className="bg-card border border-border rounded-lg p-8 animate-pulse">
        <div className="h-6 bg-muted rounded w-1/4 mb-6"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 p-4 bg-muted/50 rounded">
              <div className="h-12 w-12 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-2">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
