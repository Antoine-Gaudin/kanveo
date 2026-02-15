// src/components/admin/AdminUserList.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Search, Users, ArrowUpDown, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROLE_OPTIONS = [
  { value: '1', label: 'Membre' },
  { value: '2', label: "Chef d'équipe" },
  { value: '3', label: 'Admin' },
];

const SUB_STATUS_CONFIG = {
  active: { label: 'Actif', class: 'bg-green-600/20 text-green-300' },
  trialing: { label: 'Essai', class: 'bg-blue-600/20 text-blue-300' },
  past_due: { label: 'Impayé', class: 'bg-amber-600/20 text-amber-300' },
  canceled: { label: 'Annulé', class: 'bg-red-600/20 text-red-300' },
  none: { label: 'Aucun', class: 'bg-gray-600/20 text-gray-400' },
};

const PAGE_SIZE = 20;

export default function AdminUserList({ users, loading, onUpdateRole, onConfirm }) {
  const [search, setSearch] = useState('');
  const [subFilter, setSubFilter] = useState('all');
  const [sortKey, setSortKey] = useState('created_at');
  const [sortDir, setSortDir] = useState('desc');
  const [page, setPage] = useState(0);

  const toggleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('asc'); }
    setPage(0);
  };

  const SortHeader = ({ colKey, children, className }) => (
    <TableHead className={cn('cursor-pointer select-none', className)} onClick={() => toggleSort(colKey)}>
      <span className="flex items-center gap-1">
        {children}
        {sortKey === colKey && <ArrowUpDown className="h-3 w-3 opacity-70" />}
      </span>
    </TableHead>
  );

  const filtered = useMemo(() => {
    let list = users;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(u =>
        u.first_name?.toLowerCase().includes(q) ||
        u.last_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.company_name?.toLowerCase().includes(q)
      );
    }
    if (subFilter !== 'all') {
      list = list.filter(u => (u.subscription_status || 'none') === subFilter);
    }
    const dir = sortDir === 'asc' ? 1 : -1;
    list = [...list].sort((a, b) => {
      switch (sortKey) {
        case 'name': {
          const va = `${a.first_name || ''} ${a.last_name || ''}`.toLowerCase();
          const vb = `${b.first_name || ''} ${b.last_name || ''}`.toLowerCase();
          return va.localeCompare(vb) * dir;
        }
        case 'role':
          return ((a.role_level || 1) - (b.role_level || 1)) * dir;
        case 'subscription':
          return (a.subscription_status || '').localeCompare(b.subscription_status || '') * dir;
        case 'created_at':
        default:
          return (new Date(a.created_at || 0) - new Date(b.created_at || 0)) * dir;
      }
    });
    return list;
  }, [users, search, subFilter, sortKey, sortDir]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const exportCSV = () => {
    const headers = ['Nom', 'Prénom', 'Email', 'Entreprise', 'Rôle', 'Abonnement', 'Fin abo.', 'Inscription'];
    const rows = filtered.map(u => [
      u.last_name || '', u.first_name || '', u.email || '', u.company_name || '',
      ROLE_OPTIONS.find(r => r.value === String(u.role_level || 1))?.label || 'Membre',
      SUB_STATUS_CONFIG[u.subscription_status]?.label || 'Aucun',
      u.current_period_end ? new Date(u.current_period_end).toLocaleDateString('fr-FR') : '',
      u.created_at ? new Date(u.created_at).toLocaleDateString('fr-FR') : '',
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `utilisateurs_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRoleChange = async (userId, newRole) => {
    if (onConfirm) {
      const ok = await onConfirm(`Changer le rôle de cet utilisateur en "${ROLE_OPTIONS.find(r => r.value === String(newRole))?.label}" ?`);
      if (!ok) return;
    }
    onUpdateRole(userId, newRole);
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
    <div className="space-y-4">
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
          <Select value={subFilter} onValueChange={(v) => { setSubFilter(v); setPage(0); }}>
            <SelectTrigger className="w-[130px] h-9 text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous</SelectItem>
              <SelectItem value="active">Actif</SelectItem>
              <SelectItem value="trialing">Essai</SelectItem>
              <SelectItem value="past_due">Impayé</SelectItem>
              <SelectItem value="canceled">Annulé</SelectItem>
              <SelectItem value="none">Aucun</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="text-xs">{filtered.length} utilisateur{filtered.length > 1 ? 's' : ''}</Badge>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <SortHeader colKey="name">Nom</SortHeader>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Entreprise</TableHead>
                <SortHeader colKey="role">Rôle</SortHeader>
                <SortHeader colKey="subscription">Abonnement</SortHeader>
                <SortHeader colKey="created_at" className="hidden lg:table-cell">Fin abo.</SortHeader>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(user => {
                const subStatus = SUB_STATUS_CONFIG[user.subscription_status] || SUB_STATUS_CONFIG.none;
                return (
                  <TableRow key={user.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {user.first_name || ''} {user.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground md:hidden">{user.email}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {user.email}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                      {user.company_name || '—'}
                    </TableCell>
                    <TableCell>
                      <Select
                        value={String(user.role_level || 1)}
                        onValueChange={(v) => handleRoleChange(user.id, Number(v))}
                      >
                        <SelectTrigger className="h-8 w-[140px] text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {ROLE_OPTIONS.map(r => (
                            <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border-0 text-xs', subStatus.class)}>
                        {subStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {user.current_period_end
                        ? new Date(user.current_period_end).toLocaleDateString('fr-FR')
                        : '—'}
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
