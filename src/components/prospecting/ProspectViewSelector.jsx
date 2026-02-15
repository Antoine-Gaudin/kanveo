// src/components/prospecting/ProspectViewSelector.jsx
import { LayoutGrid, List, Grid3X3, Table2, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

const VIEW_OPTIONS = [
  {
    id: 'kanban',
    name: 'Kanban',
    icon: LayoutGrid,
    description: 'Vue en colonnes glissantes'
  },
  {
    id: 'list',
    name: 'Liste',
    icon: List,
    description: 'Vue liste compacte'
  },
  {
    id: 'cards',
    name: 'Cartes',
    icon: Grid3X3,
    description: 'Vue en grille de cartes'
  },
  {
    id: 'table',
    name: 'Tableau',
    icon: Table2,
    description: 'Vue tableau avec tri et filtres'
  }
];

export default function ProspectViewSelector({ currentView, onViewChange }) {
  const currentViewConfig = VIEW_OPTIONS.find(view => view.id === currentView) || VIEW_OPTIONS[0];
  const CurrentIcon = currentViewConfig.icon;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <CurrentIcon className="h-4 w-4" />
          <span>{currentViewConfig.name}</span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {VIEW_OPTIONS.map((view) => {
          const Icon = view.icon;
          return (
            <DropdownMenuItem
              key={view.id}
              onClick={() => onViewChange(view.id)}
              className={cn(
                "flex items-center gap-3 cursor-pointer",
                currentView === view.id && "bg-accent"
              )}
            >
              <Icon className="h-4 w-4 text-muted-foreground" />
              <div className="flex-1">
                <div className="font-medium">{view.name}</div>
                <div className="text-xs text-muted-foreground">{view.description}</div>
              </div>
              {currentView === view.id && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}