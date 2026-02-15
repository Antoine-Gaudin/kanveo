/**
 * Loading Skeleton pour la page Prospecting
 */
export default function ProspectingSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-muted to-muted/80 rounded-lg border border-border p-8 animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="h-10 bg-muted-foreground/20 rounded w-1/3"></div>
          <div className="h-10 bg-muted-foreground/20 rounded w-40"></div>
        </div>
        <div className="h-5 bg-muted-foreground/20 rounded w-2/3 mb-4"></div>
        
        {/* Stats */}
        <div className="grid grid-cols-5 gap-4 mt-6">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="text-center">
              <div className="h-8 bg-muted rounded w-12 mx-auto mb-2"></div>
              <div className="h-3 bg-muted rounded w-20 mx-auto"></div>
            </div>
          ))}
        </div>
      </div>

      {/* Kanban Columns */}
      <div className="grid grid-cols-5 gap-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="bg-card border border-border rounded-lg p-4 animate-pulse">
            <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div key={j} className="bg-muted/50 rounded-lg p-4">
                  <div className="h-4 bg-muted rounded w-full mb-2"></div>
                  <div className="h-3 bg-muted rounded w-2/3"></div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
