// src/test/routes.test.jsx
// Tests de routes : lazy loading, rendering, navigation
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClientProvider, QueryClient } from '@tanstack/react-query';
import { Suspense } from 'react';
import { AuthContext } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import fs from 'fs';
import path from 'path';

// ─── Mock Supabase ────────────────────────────────────────
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      is: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
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

const baseAuthValue = {
  user: null,
  profile: null,
  loading: false,
  error: null,
  isSubscribed: false,
  isAdmin: () => false,
  isTeamLead: () => false,
  subscriptionStatus: 'none',
  signup: vi.fn(),
  signin: vi.fn(),
  signout: vi.fn(),
  signInWithOAuth: vi.fn(),
  refreshProfile: vi.fn(),
};

// Simple mock components
function MockLanding() { return <div data-testid="landing-page">Landing Page</div>; }
function MockAuth() { return <div data-testid="auth-page">Auth Page</div>; }
function MockPricing() { return <div data-testid="pricing-page">Pricing</div>; }
function MockDashboard() { return <div data-testid="dashboard-page">Dashboard</div>; }
function MockSettings() { return <div data-testid="settings-page">Settings</div>; }
function MockProspecting() { return <div data-testid="prospecting-page">Prospecting</div>; }
function MockTasks() { return <div data-testid="tasks-page">Tasks</div>; }
function MockClients() { return <div data-testid="clients-page">Clients</div>; }
function MockNotFound() { return <div data-testid="notfound-page">Page Introuvable</div>; }

function renderApp(route = '/', authOverrides = {}) {
  const qc = createTestQueryClient();
  const authValue = { ...baseAuthValue, ...authOverrides };

  return render(
    <MemoryRouter initialEntries={[route]}>
      <QueryClientProvider client={qc}>
        <AuthContext.Provider value={authValue}>
          <Suspense fallback={<div>Loading...</div>}>
            <Routes>
              <Route path="/" element={<MockLanding />} />
              <Route path="/auth" element={<MockAuth />} />
              <Route path="/pricing" element={<MockPricing />} />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <MockDashboard />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/settings"
                element={
                  <ProtectedRoute requireSubscription={false}>
                    <MockSettings />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/prospecting"
                element={
                  <ProtectedRoute>
                    <MockProspecting />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/tasks"
                element={
                  <ProtectedRoute>
                    <MockTasks />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/clients"
                element={
                  <ProtectedRoute>
                    <MockClients />
                  </ProtectedRoute>
                }
              />
              <Route path="*" element={<MockNotFound />} />
            </Routes>
          </Suspense>
        </AuthContext.Provider>
      </QueryClientProvider>
    </MemoryRouter>
  );
}

// ─── Tests de Routes ──────────────────────────────────────
describe('Routes', () => {
  describe('Pages publiques', () => {
    it('affiche la page Landing sur /', () => {
      renderApp('/');
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('affiche la page Auth sur /auth', () => {
      renderApp('/auth');
      expect(screen.getByTestId('auth-page')).toBeInTheDocument();
    });

    it('affiche la page Pricing sur /pricing', () => {
      renderApp('/pricing');
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
    });

    it('affiche 404 sur une route inconnue', () => {
      renderApp('/route-qui-nexiste-pas');
      expect(screen.getByTestId('notfound-page')).toBeInTheDocument();
    });
  });

  describe('Pages protégées - non authentifié', () => {
    it('redirige /dashboard vers / quand non connecté', () => {
      renderApp('/dashboard');
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('redirige /prospecting vers / quand non connecté', () => {
      renderApp('/prospecting');
      expect(screen.queryByTestId('prospecting-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('landing-page')).toBeInTheDocument();
    });

    it('redirige /tasks vers / quand non connecté', () => {
      renderApp('/tasks');
      expect(screen.queryByTestId('tasks-page')).not.toBeInTheDocument();
    });

    it('redirige /clients vers / quand non connecté', () => {
      renderApp('/clients');
      expect(screen.queryByTestId('clients-page')).not.toBeInTheDocument();
    });
  });

  describe('Pages protégées - authentifié + abonné', () => {
    const authed = {
      user: { id: 'u-1', email: 'test@test.com' },
      profile: { id: 'u-1', role_level: 1, subscription_status: 'active' },
      loading: false,
      isSubscribed: true,
      isAdmin: () => false,
    };

    it('affiche /dashboard quand connecté et abonné', () => {
      renderApp('/dashboard', authed);
      expect(screen.getByTestId('dashboard-page')).toBeInTheDocument();
    });

    it('affiche /prospecting quand connecté et abonné', () => {
      renderApp('/prospecting', authed);
      expect(screen.getByTestId('prospecting-page')).toBeInTheDocument();
    });

    it('affiche /tasks quand connecté et abonné', () => {
      renderApp('/tasks', authed);
      expect(screen.getByTestId('tasks-page')).toBeInTheDocument();
    });

    it('affiche /clients quand connecté et abonné', () => {
      renderApp('/clients', authed);
      expect(screen.getByTestId('clients-page')).toBeInTheDocument();
    });

    it('affiche /settings quand connecté même sans abonnement', () => {
      renderApp('/settings', { ...authed, isSubscribed: false });
      expect(screen.getByTestId('settings-page')).toBeInTheDocument();
    });
  });

  describe('Pages protégées - authentifié sans abonnement', () => {
    const unsubscribed = {
      user: { id: 'u-1' },
      loading: false,
      isSubscribed: false,
      isAdmin: () => false,
      subscriptionStatus: 'none',
    };

    it('redirige /dashboard vers /pricing quand pas abonné', () => {
      renderApp('/dashboard', unsubscribed);
      expect(screen.queryByTestId('dashboard-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
    });

    it('redirige /prospecting vers /pricing quand pas abonné', () => {
      renderApp('/prospecting', unsubscribed);
      expect(screen.queryByTestId('prospecting-page')).not.toBeInTheDocument();
      expect(screen.getByTestId('pricing-page')).toBeInTheDocument();
    });
  });
});

// ─── Tests lazy loading structure ─────────────────────────
describe('Lazy loading', () => {
  const appSource = fs.readFileSync(
    path.resolve(__dirname, '../App.jsx'),
    'utf-8'
  );

  it('App.jsx utilise lazy() pour les pages secondaires', () => {
    const lazyPages = [
      'Auth', 'Dashboard', 'Prospecting', 'Settings',
      'Tasks', 'Clients', 'NotFound', 'Pricing',
    ];

    lazyPages.forEach((page) => {
      expect(appSource).toContain(`lazy(() => import("./pages/${page}")`);
    });
  });

  it('Landing est importé en eager (pas lazy)', () => {
    expect(appSource).toContain('import Landing from "./pages/Landing"');
    expect(appSource).not.toContain('lazy(() => import("./pages/Landing")');
  });

  it('Suspense enveloppe les routes', () => {
    expect(appSource).toContain('<Suspense');
    expect(appSource).toContain('PageLoader');
  });
});
