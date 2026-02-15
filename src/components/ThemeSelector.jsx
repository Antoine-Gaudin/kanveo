// src/components/ThemeSelector.jsx
import { useTheme, THEMES } from '../hooks/useTheme';
import { Moon, Sun } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

export default function ThemeSelector() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === THEMES.DARK;

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        'w-full px-3 py-2.5 rounded-lg font-medium transition-all duration-200',
        'flex items-center justify-between group',
        'bg-sidebar-accent/50 hover:bg-sidebar-accent',
        'text-sidebar-foreground border border-sidebar-border'
      )}
      title={isDark ? "Passer en mode clair" : "Passer en mode sombre"}
    >
      <div className="flex items-center gap-3">
        {isDark ? (
          <Moon className="h-4 w-4 text-sidebar-foreground/70" />
        ) : (
          <Sun className="h-4 w-4 text-sidebar-foreground/70" />
        )}
        <span className="text-sm text-sidebar-foreground/80">
          {isDark ? 'Mode Sombre' : 'Mode Clair'}
        </span>
      </div>

      {/* Toggle switch */}
      <div className="relative">
        <div className={cn(
          'w-11 h-6 rounded-full transition-colors duration-200',
          isDark ? 'bg-sidebar-primary' : 'bg-sidebar-accent'
        )}>
          <div className={cn(
            'absolute top-0.5 w-5 h-5 bg-sidebar-foreground rounded-full transition-transform duration-200 shadow-sm',
            isDark ? 'translate-x-5' : 'translate-x-0.5'
          )} />
        </div>
      </div>
    </button>
  );
}