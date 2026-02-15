// src/components/admin/AdminCommissions.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Wallet, RefreshCw, Users, Clock, AlertTriangle, CheckCircle, Search, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  pending: { label: 'En attente', class: 'bg-amber-600/20 text-amber-300' },
  transferred: { label: 'Transféré', class: 'bg-green-600/20 text-green-300' },
  failed: { label: 'Échoué', class: 'bg-red-600/20 text-red-300' },
  skipped: { label: 'Ignoré', class: 'bg-gray-600/20 text-gray-400' },
};

const PAGE_SIZE = 20;

export default function AdminCommissions({ commissions, stats, loading, onRetryCommission, onConfirm }) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);

  const filtered = useMemo(() => {
    let list = commissions;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(c => {
        const code = c.influencer_codes;
        const profile = c.user_profiles;
        return (
          code?.influencer_name?.toLowerCase().includes(q) ||
          code?.code?.toLowerCase().includes(q) ||
          profile?.email?.toLowerCase().includes(q) ||
          profile?.first_name?.toLowerCase().includes(q) ||
          profile?.last_name?.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== 'all') {
      list = list.filter(c => c.status === statusFilter);
    }
    return list;
  }, [commissions, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Totaux globaux
  const globalStats = useMemo(() => {
    const total = commissions.length;
    const totalEur = commissions.reduce((s, c) => s + (c.amount_cents || 0), 0) / 100;
    const transferred = commissions.filter(c => c.status === 'transferred').reduce((s, c) => s + (c.amount_cents || 0), 0) / 100;
    const pending = commissions.filter(c => c.status === 'pending').length;
    const failed = commissions.filter(c => c.status === 'failed').length;
    return { total, totalEur, transferred, pending, failed };
  }, [commissions]);

  const failedCount = commissions.filter(c => c.status === 'failed').length;

  const handleRetryAll = async () => {
    if (!onRetryCommission) return;
    if (onConfirm) {
      const ok = await onConfirm(`Réessayer les ${failedCount} commission(s) échouée(s) ?`);
      if (!ok) return;
    }
    const failed = commissions.filter(c => c.status === 'failed');
    for (const c of failed) {
      await onRetryCommission(c.id);
    }
  };

  const exportCSV = () => {
    const headers = ['Affilié', 'Code', 'Abonné', 'Email', 'Montant (€)', 'Statut', 'Transfer ID', 'Date'];
    const rows = filtered.map(c => [
      c.influencer_codes?.influencer_name || '',
      c.influencer_codes?.code || '',
      `${c.user_profiles?.first_name || ''} ${c.user_profiles?.last_name || ''}`.trim(),
      c.user_profiles?.email || '',
      ((c.amount_cents || 0) / 100).toFixed(2),
      STATUS_CONFIG[c.status]?.label || c.status,
      c.stripe_transfer_id || '',
      c.created_at ? new Date(c.created_at).toLocaleDateString('fr-FR') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `commissions_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <div className="inline-block h-8 w-8 border-4 border-border border-t-primary rounded-full animate-spin mb-3" />
          <p className="text-muted-foreground text-sm">Chargement...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats globaux */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Wallet className="h-4 w-4" /> Total commissions
            </div>
            <p className="text-2xl font-bold text-foreground">{globalStats.totalEur.toFixed(2)} €</p>
            <p className="text-xs text-muted-foreground">{globalStats.total} commission{globalStats.total > 1 ? 's' : ''}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CheckCircle className="h-4 w-4 text-green-400" /> Transférées
            </div>
            <p className="text-2xl font-bold text-green-400">{globalStats.transferred.toFixed(2)} €</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Clock className="h-4 w-4 text-amber-400" /> En attente
            </div>
            <p className="text-2xl font-bold text-amber-400">{globalStats.pending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <AlertTriangle className="h-4 w-4 text-red-400" /> Échouées
            </div>
            <p className="text-2xl font-bold text-red-400">{globalStats.failed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Stats par affilié */}
      {stats.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {stats.map(s => (
            <Card key={s.influencer_code_id}>
              <CardContent className="pt-5 pb-4 px-5">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">{s.influencer_name}</p>
                    <Badge variant="outline" className="font-mono text-[10px] mt-1">{s.code}</Badge>
                  </div>
                  <div className="flex items-center gap-1 text-lg font-bold text-foreground">
                    <Users className="h-5 w-5 text-muted-foreground" />
                    {s.total}
                  </div>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1 text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    {(s.transferred_cents / 100).toFixed(2)} €
                  </span>
                  <span className="flex items-center gap-1 text-amber-400">
                    <Clock className="h-4 w-4" />
                    {s.pending} en attente
                  </span>
                  {s.failed > 0 && (
                    <span className="flex items-center gap-1 text-red-400">
                      <AlertTriangle className="h-4 w-4" />
                      {s.failed} échouée{s.failed > 1 ? 's' : ''}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex gap-2 items-center flex-1 w-full sm:w-auto">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(0); }}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="transferred">Transféré</SelectItem>
              <SelectItem value="failed">Échoué</SelectItem>
              <SelectItem value="skipped">Ignoré</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          {failedCount > 0 && onRetryCommission && (
            <Button variant="outline" size="sm" onClick={handleRetryAll} className="gap-1.5 text-xs text-red-400">
              <RefreshCw className="h-3.5 w-3.5" /> Réessayer tout ({failedCount})
            </Button>
          )}
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Wallet className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucune commission{search || statusFilter !== 'all' ? ' trouvée' : ' enregistrée'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Affilié</TableHead>
                <TableHead className="hidden md:table-cell">Abonné</TableHead>
                <TableHead>Montant</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Transfer ID</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(c => {
                const code = c.influencer_codes;
                const profile = c.user_profiles;
                const statusConfig = STATUS_CONFIG[c.status] || STATUS_CONFIG.pending;
                return (
                  <TableRow key={c.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">{code?.influencer_name || '—'}</p>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {code?.code || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-foreground">
                        {profile?.first_name || ''} {profile?.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground">{profile?.email || '—'}</p>
                    </TableCell>
                    <TableCell className="font-medium">
                      {((c.amount_cents || 0) / 100).toFixed(2)} €
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border-0 text-xs', statusConfig.class)}>
                        {statusConfig.label}
                      </Badge>
                      {c.error_message && (
                        <p className="text-xs text-red-400 mt-1 max-w-[150px] truncate" title={c.error_message}>
                          {c.error_message}
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                      {c.stripe_transfer_id || '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {c.status === 'failed' && onRetryCommission && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Réessayer"
                          onClick={() => onRetryCommission(c.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Page {page + 1} / {totalPages}</span>
          <div className="flex gap-1">
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="icon" className="h-8 w-8" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
