// src/test/performance.test.jsx
// Tests Performance : lazy loading, memo, useMemo, React Query cache, skeletons
import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import fs from 'fs';
import path from 'path';

// ─── Mock Supabase (pour les imports indirects) ───────────
vi.mock('../lib/supabaseClient', () => ({
  supabase: {
    auth: {
      onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    },
    from: vi.fn(() => ({
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: null }),
    })),
  },
}));

// ═══════════════════════════════════════════════════════════
// 1. LAZY LOADING
// ═══════════════════════════════════════════════════════════
describe('Performance — Lazy Loading', () => {
  const appSource = fs.readFileSync(
    path.resolve(__dirname, '../App.jsx'),
    'utf-8'
  );

  it('utilise React.lazy pour les pages secondaires', () => {
    const lazyImportCount = (appSource.match(/lazy\(\(\) =>/g) || []).length;
    expect(lazyImportCount).toBeGreaterThanOrEqual(15);
  });

  it('Landing est importé en eager (pas lazy)', () => {
    expect(appSource).toContain('import Landing from');
    expect(appSource).not.toContain('lazy(() => import("./pages/Landing")');
  });

  it('chaque lazy import est un dynamic import()', () => {
    const lazyMatches = appSource.match(/lazy\(\(\) => import\([^)]+\)\)/g) || [];
    expect(lazyMatches.length).toBeGreaterThanOrEqual(15);

    lazyMatches.forEach((match) => {
      expect(match).toMatch(/lazy\(\(\) => import\("\.\/pages\/\w+"\)\)/);
    });
  });

  it('Suspense est présent avec un fallback', () => {
    expect(appSource).toContain('<Suspense');
    expect(appSource).toContain('fallback=');
  });

  it('PageLoader est défini comme composant de fallback', () => {
    expect(appSource).toContain('function PageLoader()');
    expect(appSource).toContain('Chargement...');
  });
});

// ═══════════════════════════════════════════════════════════
// 2. REACT.MEMO
// ═══════════════════════════════════════════════════════════
describe('Performance — React.memo', () => {
  const memoFiles = [
    { file: 'components/prospecting/ProspectCard.jsx', name: 'ProspectCard' },
    { file: 'components/prospecting/ProspectCardView.jsx', name: 'ProspectCardView' },
    { file: 'components/tasks/TaskCard.jsx', name: 'TaskCard' },
    { file: 'components/tasks/TaskCardView.jsx', name: 'TaskCardView' },
  ];

  memoFiles.forEach(({ file, name }) => {
    it(`${name} est enveloppé dans memo()`, () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, '..', file),
        'utf-8'
      );
      expect(source).toMatch(/import\s+{[^}]*memo[^}]*}\s+from\s+['"]react['"]/);
      expect(source).toContain('memo(');
    });
  });
});

// ═══════════════════════════════════════════════════════════
// 3. USEMEMO
// ═══════════════════════════════════════════════════════════
describe('Performance — useMemo', () => {
  const useMemoFiles = [
    { file: 'components/prospecting/ProspectCard.jsx', hooks: ['reminderStatus', 'resolvedStatuses'] },
    { file: 'components/prospecting/SearchFilter.jsx', hooks: ['uniqueTags', 'filtered'] },
    { file: 'components/prospecting/KanbanBoard.jsx', hooks: ['statusStats'] },
    { file: 'pages/Dashboard.jsx', hooks: ['stats', 'financialData', 'recentProspects'] },
    { file: 'pages/Tasks.jsx', hooks: ['filteredTasks', 'stats', 'statusOptions'] },
    { file: 'components/tasks/KanbanTaskBoard.jsx', hooks: ['resolvedColumns', 'filteredTasks', 'statusStats'] },
    { file: 'components/sirene/useSireneData.js', hooks: ['filteredRows'] },
    { file: 'components/clients/FinancialDashboard.jsx', hooks: ['summary', 'clientStats', 'monthlyData'] },
  ];

  useMemoFiles.forEach(({ file, hooks }) => {
    describe(file, () => {
      const source = fs.readFileSync(
        path.resolve(__dirname, '..', file),
        'utf-8'
      );

      it('importe useMemo depuis react', () => {
        expect(source).toMatch(/import\s+{[^}]*useMemo[^}]*}\s+from\s+['"]react['"]/);
      });

      hooks.forEach((hookVar) => {
        it(`utilise useMemo pour ${hookVar}`, () => {
          const pattern = new RegExp(`const\\s+(?:\\{[^}]*\\}|${hookVar})\\s*=\\s*useMemo`);
          expect(source).toMatch(pattern);
        });
      });
    });
  });
});

// ═══════════════════════════════════════════════════════════
// 4. REACT QUERY CACHE
// ═══════════════════════════════════════════════════════════
describe('Performance — React Query Cache', () => {
  const qcSource = fs.readFileSync(
    path.resolve(__dirname, '../lib/queryClient.js'),
    'utf-8'
  );

  it('queryClient a staleTime de 5 minutes', () => {
    expect(qcSource).toContain('staleTime');
    expect(qcSource).toMatch(/staleTime:\s*5\s*\*\s*60\s*\*\s*1000/);
  });

  it('queryClient a gcTime de 10 minutes', () => {
    expect(qcSource).toContain('gcTime');
    expect(qcSource).toMatch(/gcTime:\s*10\s*\*\s*60\s*\*\s*1000/);
  });

  it('queryClient a retry: 1', () => {
    expect(qcSource).toMatch(/retry:\s*1/);
  });

  it('refetchOnWindowFocus est désactivé', () => {
    expect(qcSource).toMatch(/refetchOnWindowFocus:\s*false/);
  });

  it('QueryClientProvider enveloppe l\'application', () => {
    const appSource = fs.readFileSync(
      path.resolve(__dirname, '../App.jsx'),
      'utf-8'
    );
    expect(appSource).toContain('QueryClientProvider');
    expect(appSource).toContain('import { queryClient }');
  });
});

// ═══════════════════════════════════════════════════════════
// 5. SKELETONS
// ═══════════════════════════════════════════════════════════
describe('Performance — Skeletons', () => {
  const skeletonDir = path.resolve(__dirname, '../components/skeletons');

  it('le dossier skeletons existe', () => {
    expect(fs.existsSync(skeletonDir)).toBe(true);
  });

  const expectedSkeletons = [
    'DashboardSkeleton.jsx',
    'ProspectCardSkeleton.jsx',
    'KanbanColumnSkeleton.jsx',
    'TableRowSkeleton.jsx',
    'SireneImportSkeleton.jsx',
    'ProspectingSkeleton.jsx',
    'ModalDetailsSkeleton.jsx',
  ];

  expectedSkeletons.forEach((skeleton) => {
    it(`${skeleton} existe`, () => {
      expect(fs.existsSync(path.join(skeletonDir, skeleton))).toBe(true);
    });
  });

  it('index.js exporte tous les skeletons principaux', () => {
    const indexSource = fs.readFileSync(
      path.join(skeletonDir, 'index.js'),
      'utf-8'
    );
    expect(indexSource).toContain('DashboardSkeleton');
    expect(indexSource).toContain('ProspectCardSkeleton');
    expect(indexSource).toContain('KanbanColumnSkeleton');
    expect(indexSource).toContain('TableRowSkeleton');
    expect(indexSource).toContain('SireneImportSkeleton');
    expect(indexSource).toContain('ProspectingSkeleton');
  });

  describe('Skeleton rendering', () => {
    it('DashboardSkeleton rend avec animate-pulse', async () => {
      const { default: DashboardSkeleton } = await import('../components/skeletons/DashboardSkeleton');
      const { container } = render(<DashboardSkeleton />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('DashboardSkeleton contient des blocs KPI', async () => {
      const { default: DashboardSkeleton } = await import('../components/skeletons/DashboardSkeleton');
      const { container } = render(<DashboardSkeleton />);
      const mutedBlocks = container.querySelectorAll('.bg-muted');
      expect(mutedBlocks.length).toBeGreaterThan(5);
    });

    it('ProspectCardSkeleton rend correctement', async () => {
      const { default: ProspectCardSkeleton } = await import('../components/skeletons/ProspectCardSkeleton');
      const { container } = render(<ProspectCardSkeleton />);
      const pulseElements = container.querySelectorAll('.animate-pulse');
      expect(pulseElements.length).toBeGreaterThan(0);
    });

    it('KanbanColumnSkeleton rend plusieurs cartes', async () => {
      const { default: KanbanColumnSkeleton } = await import('../components/skeletons/KanbanColumnSkeleton');
      const { container } = render(<KanbanColumnSkeleton />);
      const cards = container.querySelectorAll('.animate-pulse');
      expect(cards.length).toBeGreaterThanOrEqual(1);
    });

    it('TableRowSkeleton rend des lignes', async () => {
      const { default: TableRowSkeleton } = await import('../components/skeletons/TableRowSkeleton');
      const { container } = render(
        <table>
          <tbody>
            <TableRowSkeleton columns={5} />
          </tbody>
        </table>
      );
      const rows = container.querySelectorAll('tr');
      expect(rows.length).toBeGreaterThan(0);
    });
  });
});
