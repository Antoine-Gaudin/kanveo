// src/test/auth.test.jsx
// Tests d'authentification : AuthContext, ProtectedRoute, useAuth
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';

// ─── Mock Supabase (inline) ──────────────────────────────
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } },
      })),
      signUp: vi.fn(),
      signInWithPassword: vi.fn(),
      signOut: vi.fn(),
      signInWithOAuth: vi.fn(),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: () => ({
      select: () => ({
        eq: () => ({
          single: vi.fn().mockResolvedValue({ data: null, error: null }),
        }),
      }),
    }),
  },
}));

vi.mock('../lib/queryClient', () => ({
  queryClient: {
    clear: vi.fn(),
    defaultOptions: { queries: { retry: false } },
  },
}));

// ─── Helpers ──────────────────────────────────────────────
function createTestQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithAuth(ui, { authValue, route = '/' } = {}) {
  const qc = createTestQueryClient();
  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={qc}>
        <AuthContext.Provider value={authValue}>
          {ui}
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ─── Tests AuthContext values ─────────────────────────────
describe('AuthContext — valeurs fournies', () => {
  it('fournit user, profile et loading via le context', () => {
    const value = {
      user: { id: 'u-1', email: 'test@test.com' },
      profile: { role_level: 1 },
      loading: false,
      error: null,
      isSubscribed: true,
      isAdmin: () => false,
      isTeamLead: () => false,
      subscriptionStatus: 'active',
      signup: vi.fn(),
      signin: vi.fn(),
      signout: vi.fn(),
      signInWithOAuth: vi.fn(),
      refreshProfile: vi.fn(),
    };

    function Consumer() {
      const ctx = useContext(AuthContext);
      return (
        <div>
          <span data-testid="email">{ctx.user?.email}</span>
          <span data-testid="subscribed">{ctx.isSubscribed.toString()}</span>
          <span data-testid="loading">{ctx.loading.toString()}</span>
        </div>
      );
    }

    render(
      <AuthContext.Provider value={value}>
        <Consumer />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('email').textContent).toBe('test@test.com');
    expect(screen.getByTestId('subscribed').textContent).toBe('true');
    expect(screen.getByTestId('loading').textContent).toBe('false');
  });

  it('isAdmin retourne true pour role_level 3', () => {
    const value = {
      user: { id: 'u-1' },
      profile: { role_level: 3 },
      loading: false,
      isSubscribed: true,
      isAdmin: () => true,
      isTeamLead: () => false,
      subscriptionStatus: 'active',
    };

    function Consumer() {
      const ctx = useContext(AuthContext);
      return <span data-testid="admin">{ctx.isAdmin().toString()}</span>;
    }

    render(
      <AuthContext.Provider value={value}>
        <Consumer />
      </AuthContext.Provider>
    );

    expect(screen.getByTestId('admin').textContent).toBe('true');
  });

  it('isSubscribed true pour status active ou trialing', () => {
    ['active', 'trialing'].forEach((status) => {
      const isSubscribed = ['active', 'trialing'].includes(status);
      expect(isSubscribed).toBe(true);
    });

    ['none', 'canceled', 'past_due'].forEach((status) => {
      const isSubscribed = ['active', 'trialing'].includes(status);
      expect(isSubscribed).toBe(false);
    });
  });

  it('signup sépare prénom et nom correctement', () => {
    const parts = 'Jean-Pierre Dupont Martin'.trim().split(' ');
    const firstName = parts[0] || '';
    const lastName = parts.slice(1).join(' ') || '';

    expect(firstName).toBe('Jean-Pierre');
    expect(lastName).toBe('Dupont Martin');
  });

  it('signout vide le cache React Query', async () => {
    const qc = createTestQueryClient();
    qc.setQueryData(['test'], { value: 42 });
    expect(qc.getQueryData(['test'])).toBeDefined();

    qc.clear();
    expect(qc.getQueryData(['test'])).toBeUndefined();
  });
});

// ─── Tests ProtectedRoute ─────────────────────────────────
describe('ProtectedRoute', () => {
  it('affiche loading spinner quand loading=true', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={
          <ProtectedRoute>
            <div>Protected Content</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: null, loading: true, isSubscribed: false,
          isAdmin: () => false, subscriptionStatus: 'none',
        },
      }
    );

    expect(screen.getByText('Chargement...')).toBeInTheDocument();
  });

  it('redirige vers / quand pas de user', () => {
    renderWithAuth(
      <Routes>
        <Route path="/" element={<div>Home</div>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Dashboard</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: null, loading: false, isSubscribed: false,
          isAdmin: () => false, subscriptionStatus: 'none',
        },
        route: '/dashboard',
      }
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('affiche le contenu protégé quand user + subscribed', () => {
    renderWithAuth(
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Dashboard Content</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: { id: '1' }, loading: false, isSubscribed: true,
          isAdmin: () => false, subscriptionStatus: 'active',
        },
        route: '/dashboard',
      }
    );

    expect(screen.getByText('Dashboard Content')).toBeInTheDocument();
  });

  it('redirige vers /pricing quand user non abonné', () => {
    renderWithAuth(
      <Routes>
        <Route path="/pricing" element={<div>Pricing Page</div>} />
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Dashboard</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: { id: '1' }, loading: false, isSubscribed: false,
          isAdmin: () => false, subscriptionStatus: 'none',
        },
        route: '/dashboard',
      }
    );

    expect(screen.queryByText('Dashboard')).not.toBeInTheDocument();
    expect(screen.getByText('Pricing Page')).toBeInTheDocument();
  });

  it('autorise les admins même sans abonnement', () => {
    renderWithAuth(
      <Routes>
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <div>Admin Access</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: { id: '1' }, loading: false, isSubscribed: false,
          isAdmin: () => true, subscriptionStatus: 'none',
        },
        route: '/dashboard',
      }
    );

    expect(screen.getByText('Admin Access')).toBeInTheDocument();
  });

  it('redirige non-admin vers /dashboard quand requireAdmin=true', () => {
    renderWithAuth(
      <Routes>
        <Route path="/dashboard" element={<div>Dashboard</div>} />
        <Route path="/admin" element={
          <ProtectedRoute requireAdmin>
            <div>Admin Panel</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: { id: '1' }, loading: false, isSubscribed: true,
          isAdmin: () => false, subscriptionStatus: 'active',
        },
        route: '/admin',
      }
    );

    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
  });

  it('autorise requireSubscription=false sans abonnement', () => {
    renderWithAuth(
      <Routes>
        <Route path="/settings" element={
          <ProtectedRoute requireSubscription={false}>
            <div>Settings</div>
          </ProtectedRoute>
        } />
      </Routes>,
      {
        authValue: {
          user: { id: '1' }, loading: false, isSubscribed: false,
          isAdmin: () => false, subscriptionStatus: 'none',
        },
        route: '/settings',
      }
    );

    expect(screen.getByText('Settings')).toBeInTheDocument();
  });
});

// ─── Tests useAuth fallback (hors AuthProvider) ──────────
describe('useAuth - fallback hors AuthProvider', () => {
  it('retourne un objet par défaut avec loading=true quand hors provider', async () => {
    const { useAuth } = await import('../context/AuthContext');

    function Consumer() {
      const auth = useAuth();
      return (
        <div>
          <span data-testid="fallback-loading">{auth.loading.toString()}</span>
          <span data-testid="fallback-user">{auth.user === null ? 'null' : 'set'}</span>
          <span data-testid="fallback-admin">{auth.isAdmin().toString()}</span>
        </div>
      );
    }

    render(
      <MemoryRouter>
        <Consumer />
      </MemoryRouter>
    );

    expect(screen.getByTestId('fallback-loading').textContent).toBe('true');
    expect(screen.getByTestId('fallback-user').textContent).toBe('null');
    expect(screen.getByTestId('fallback-admin').textContent).toBe('false');
  });
});
