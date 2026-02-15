import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useState, useEffect } from 'react';
import {
  Menu,
  X,
  Search,
  LayoutDashboard,
  Users,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  DatabaseIcon,
  BookOpen,
  ListTodo,
  Wallet,
  FileText,
  ShieldCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';

// Logo SVG Kanveo (reproduit le favicon.svg)
function KanveoLogo({ className = 'w-9 h-9' }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className={className}>
      <defs>
        <linearGradient id="kanveo-bg" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
      </defs>
      <rect width="512" height="512" rx="96" ry="96" fill="url(#kanveo-bg)" />
      <g transform="translate(256,256)" fill="white">
        <path d="M0,-120 C10,-40 40,-10 120,0 C40,10 10,40 0,120 C-10,40 -40,10 -120,0 C-40,-10 -10,-40 0,-120Z" />
        <path d="M100,-140 C104,-120 110,-114 130,-110 C110,-106 104,-100 100,-80 C96,-100 90,-106 70,-110 C90,-114 96,-120 100,-140Z" opacity="0.7" />
        <path d="M-110,90 C-106,110 -100,116 -80,120 C-100,124 -106,130 -110,150 C-114,130 -120,124 -140,120 C-120,116 -114,110 -110,90Z" opacity="0.5" />
      </g>
    </svg>
  );
}

const Navbar = () => {
  const { user, signout, isAdmin, isSubscribed } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Fermer le menu mobile quand on change de page
  useEffect(() => {
    setMobileOpen(false);
    setMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSignout = async () => {
    try {
      await signout();
      await new Promise(resolve => setTimeout(resolve, 100));
      navigate('/');
    } catch (err) {
      // ignore
    }
  };

  // Navigation items avec icônes Lucide (ordre logique du workflow)
  const navItems = [
    { to: '/dashboard', icon: BarChart3, label: 'Dashboard', requiresSub: true },
    { to: '/sirene', icon: Search, label: 'SIRENE', requiresSub: true },
    { to: '/database', icon: DatabaseIcon, label: 'Ma Base', requiresSub: true },
    { to: '/prospecting', icon: Users, label: 'Prospection', requiresSub: true },
    { to: '/tasks', icon: ListTodo, label: 'Tâches', requiresSub: true },
    { to: '/clients', icon: Wallet, label: 'Clients & Finances', requiresSub: true },
    { to: '/templates', icon: FileText, label: 'Templates Email', requiresSub: true },
    { to: '/settings', icon: Settings, label: 'Paramètres' },
    { to: '/docs', icon: BookOpen, label: 'Documentation', requiresSub: true },
    ...(isAdmin() ? [{ to: '/admin', icon: ShieldCheck, label: 'Administration' }] : []),
  ];
  const NavItem = ({ item }) => {
    const Icon = item.icon;
    const disabled = item.requiresSub && !isSubscribed && !isAdmin();
    
    if (disabled) {
      return (
        <TooltipProvider delayDuration={0}>
          <Tooltip>
            <TooltipTrigger asChild>
              <div
                className={cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'text-sidebar-foreground/30 cursor-not-allowed select-none'
                )}
                onClick={(e) => e.preventDefault()}
              >
                <Icon className={cn('h-5 w-5 flex-shrink-0', !sidebarOpen && 'mx-auto')} />
                {sidebarOpen && <span className="truncate">{item.label}</span>}
              </div>
            </TooltipTrigger>
            <TooltipContent side="right" className="font-medium">
              Abonnement requis
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <TooltipProvider delayDuration={0}>
        <Tooltip>
          <TooltipTrigger asChild>
            <NavLink
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'relative flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium',
                  'transition-all duration-200',
                  'group',
                  isActive 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30' 
                    : 'text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground'
                )
              }
            >
              <Icon className={cn('h-5 w-5 flex-shrink-0', !sidebarOpen && 'mx-auto')} />
              {sidebarOpen && <span className="truncate">{item.label}</span>}
              {item.badge > 0 && (
                <Badge 
                  variant="destructive" 
                  className={cn(
                    'ml-auto h-5 min-w-5 flex items-center justify-center text-xs',
                    !sidebarOpen && 'absolute -top-1 -right-1 h-4 min-w-4 text-[10px]'
                  )}
                >
                  {item.badge > 9 ? '9+' : item.badge}
                </Badge>
              )}
            </NavLink>
          </TooltipTrigger>
          {!sidebarOpen && (
            <TooltipContent side="right" className="font-medium">
              {item.label}
            </TooltipContent>
          )}
        </Tooltip>
      </TooltipProvider>
    );
  };

  // Navigation non-connecté (haut)
  if (!user) {
    return (
      <nav className="bg-background border-b border-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <NavLink to="/" className="flex items-center gap-3">
              <KanveoLogo className="w-9 h-9 shadow-md rounded-xl" />
              <span className="text-foreground font-bold text-lg">Kanveo</span>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold">Beta</Badge>
            </NavLink>

            {/* Desktop links */}
            <div className="hidden sm:flex gap-2 items-center">
              <Button variant="ghost" asChild>
                <NavLink to="/pricing">Tarification</NavLink>
              </Button>
              <Button variant="ghost" asChild>
                <NavLink to="/about">À propos</NavLink>
              </Button>
              <Button asChild>
                <NavLink to="/auth">Connexion</NavLink>
              </Button>
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="icon"
              className="sm:hidden"
              aria-label={mobileMenuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          </div>

          {/* Mobile dropdown */}
          {mobileMenuOpen && (
            <div className="sm:hidden pb-4 flex flex-col gap-1 border-t border-border pt-3">
              <Button variant="ghost" className="justify-start" asChild>
                <NavLink to="/pricing">Tarification</NavLink>
              </Button>
              <Button variant="ghost" className="justify-start" asChild>
                <NavLink to="/about">À propos</NavLink>
              </Button>
              <Button className="justify-start" asChild>
                <NavLink to="/auth">Connexion</NavLink>
              </Button>
            </div>
          )}
        </div>
      </nav>
    );
  }

  // Navigation connecté (barre latérale gauche)
  return (
    <TooltipProvider>
      {/* Mobile top bar */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 bg-sidebar border-b border-sidebar-border z-50 flex items-center justify-between px-3">
        <NavLink to="/" className="flex items-center gap-2">
          <KanveoLogo className="w-8 h-8 shadow-md rounded-xl" />
          <span className="text-sidebar-foreground font-bold text-lg">Kanveo</span>
          <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold">Beta</Badge>
        </NavLink>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMobileOpen(!mobileOpen)}
          className="text-sidebar-foreground"
          aria-label={mobileOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </Button>
      </div>

      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={cn(
          'fixed left-0 top-0 h-screen bg-sidebar border-r border-sidebar-border transition-all duration-300 z-40 flex flex-col',
          // Desktop: normal sidebar behavior
          'hidden md:flex',
          sidebarOpen ? 'w-64' : 'w-[68px]',
          // Mobile: overlay sidebar
          mobileOpen && '!flex w-64 z-50 top-14 h-[calc(100vh-3.5rem)]'
        )}
      >
        {/* Logo - desktop only (mobile has the top bar) */}
        <div className="h-16 border-b border-sidebar-border items-center justify-between px-3 hidden md:flex">
          <NavLink to="/" className="flex items-center gap-3">
            <KanveoLogo className="w-9 h-9 shadow-md rounded-xl flex-shrink-0" />
            {sidebarOpen && (
              <>
                <span className="text-sidebar-foreground font-bold text-lg truncate">Kanveo</span>
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10 font-semibold flex-shrink-0">Beta</Badge>
              </>
            )}
          </NavLink>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="h-8 w-8 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent"
              >
                {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              {sidebarOpen ? 'Réduire' : 'Agrandir'}
            </TooltipContent>
          </Tooltip>
        </div>

        {/* Navigation items */}
        <ScrollArea className="flex-1 px-3 py-4">
          <nav className="flex flex-col gap-1">
            {navItems.map((item) => (
              <NavItem key={item.to} item={item} />
            ))}
          </nav>
        </ScrollArea>

        {/* User info + Thème + Déconnexion */}
        <div className="border-t border-sidebar-border bg-sidebar-accent/30 p-3">
          <div className="flex flex-col gap-3">
            <div className={cn(
              'flex items-center gap-3 px-2 py-2 rounded-lg bg-sidebar-accent/50',
              !sidebarOpen && 'justify-center px-0'
            )}>
              <Avatar className="h-9 w-9 flex-shrink-0">
                <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-sm font-semibold">
                  {user.email?.[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <span className="text-sm text-sidebar-foreground/80 truncate font-medium">
                  {user.email}
                </span>
              )}
            </div>
            
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  onClick={handleSignout}
                  className={cn(
                    'text-destructive hover:text-destructive hover:bg-destructive/10 transition-all',
                    sidebarOpen ? 'w-full justify-start gap-3' : 'w-full justify-center'
                  )}
                >
                  <LogOut className="h-4 w-4" />
                  {sidebarOpen && <span>Déconnexion</span>}
                </Button>
              </TooltipTrigger>
              {!sidebarOpen && (
                <TooltipContent side="right">Déconnexion</TooltipContent>
              )}
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Main content spacer - desktop only */}
      <div className={cn(
        'transition-all duration-300',
        'hidden md:block',
        sidebarOpen ? 'ml-64' : 'ml-[68px]'
      )} />
    </TooltipProvider>
  );
};

export default Navbar;
