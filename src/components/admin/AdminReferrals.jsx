// src/components/admin/AdminReferrals.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, TrendingUp, Users, UserCheck, UserX, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const PAGE_SIZE = 20;

export default function AdminReferrals({ referrals, stats, loading, users, codes, onCreateReferral, addToast }) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState('');
  const [selectedCode, setSelectedCode] = useState('');
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedUser || !selectedCode) return;
    setSaving(true);
    try {
      await onCreateReferral({ user_id: selectedUser, influencer_code_id: selectedCode });
      setDialogOpen(false);
      setSelectedUser('');
      setSelectedCode('');
    } catch {
      // Toast handled in parent
    } finally {
      setSaving(false);
    }
  };

  const filtered = useMemo(() => {
    if (!search) return referrals;
    const q = search.toLowerCase();
    return referrals.filter(r => {
      const p = r.user_profiles;
      const c = r.influencer_codes;
      return (
        p?.first_name?.toLowerCase().includes(q) ||
        p?.last_name?.toLowerCase().includes(q) ||
        p?.email?.toLowerCase().includes(q) ||
        c?.code?.toLowerCase().includes(q) ||
        c?.influencer_name?.toLowerCase().includes(q)
      );
    });
  }, [referrals, search]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Users search in dialog
  const [userSearch, setUserSearch] = useState('');
  const filteredUsers = useMemo(() => {
    if (!userSearch) return users.slice(0, 50);
    const q = userSearch.toLowerCase();
    return users.filter(u =>
      u.first_name?.toLowerCase().includes(q) ||
      u.last_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    ).slice(0, 50);
  }, [users, userSearch]);

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
      {/* Stats par influenceur */}
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
                    <UserCheck className="h-4 w-4" />
                    {s.active} actif{s.active > 1 ? 's' : ''}
                  </span>
                  <span className="flex items-center gap-1 text-red-400">
                    <UserX className="h-4 w-4" />
                    {s.lost} perdu{s.lost > 1 ? 's' : ''}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un parrainage..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(0); }}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="text-xs">{filtered.length} parrainage{filtered.length > 1 ? 's' : ''}</Badge>
          <Button onClick={() => setDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Rattacher un code
          </Button>
        </div>
      </div>

      {/* Table referrals */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun parrainage{search ? ' trouvé' : ' enregistré'}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Utilisateur</TableHead>
                <TableHead className="hidden md:table-cell">Email</TableHead>
                <TableHead>Code utilisé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden lg:table-cell">Inscription</TableHead>
                <TableHead className="hidden lg:table-cell">Annulation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(r => {
                const profile = r.user_profiles;
                const code = r.influencer_codes;
                const isActive = r.subscription_status === 'active' || r.subscription_status === 'trialing';
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {profile?.first_name || ''} {profile?.last_name || ''}
                      </p>
                      <p className="text-xs text-muted-foreground md:hidden">{profile?.email}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {profile?.email || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs">
                        {code?.code || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn(
                        'border-0 text-xs',
                        isActive
                          ? 'bg-green-600/20 text-green-300'
                          : 'bg-red-600/20 text-red-300'
                      )}>
                        {isActive ? 'Actif' : 'Perdu'}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.subscribed_at
                        ? new Date(r.subscribed_at).toLocaleDateString('fr-FR')
                        : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.canceled_at
                        ? new Date(r.canceled_at).toLocaleDateString('fr-FR')
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

      {/* Dialog rattacher un code */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="h-5 w-5 text-primary" />
              Rattacher un code à un utilisateur
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label>Utilisateur</Label>
              <Input
                placeholder="Rechercher un utilisateur..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="mb-2"
              />
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {filteredUsers.map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name || ''} {u.last_name || ''} ({u.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Code influenceur</Label>
              <Select value={selectedCode} onValueChange={setSelectedCode}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un code" />
                </SelectTrigger>
                <SelectContent>
                  {codes.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.influencer_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" disabled={!selectedUser || !selectedCode || saving}>
                {saving ? 'Rattachement...' : 'Rattacher'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
