// src/components/admin/AdminAffiliates.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import {
  Handshake, MousePointerClick, UserPlus, CreditCard, Euro,
  Search, Download, ChevronLeft, ChevronRight, Eye, Ban,
  ArrowRight, Landmark, ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_LABELS = {
  clicked: 'Clic',
  signed_up: 'Inscrit',
  subscribed: 'Abonné',
  paid: 'Payé',
};

const STATUS_COLORS = {
  clicked: 'bg-blue-600/20 text-blue-300',
  signed_up: 'bg-yellow-600/20 text-yellow-300',
  subscribed: 'bg-green-600/20 text-green-300',
  paid: 'bg-purple-600/20 text-purple-300',
};

const STATUS_OPTIONS = ['clicked', 'signed_up', 'subscribed', 'paid'];

const PAGE_SIZE = 20;

export default function AdminAffiliates({
  affiliates,
  affiliateReferrals,
  stats,
  loading,
  onUpdateReferralStatus,
  onToggleAffiliate,
  onConfirm,
  addToast,
}) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [page, setPage] = useState(0);
  const [bankModal, setBankModal] = useState(null); // affiliate object or null

  // Filtered referrals
  const filtered = useMemo(() => {
    let list = affiliateReferrals;
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(r => {
        const aff = r.affiliates;
        const affProfile = aff?.user_profiles;
        const refProfile = r.referred_profile;
        return (
          affProfile?.first_name?.toLowerCase().includes(q) ||
          affProfile?.last_name?.toLowerCase().includes(q) ||
          affProfile?.email?.toLowerCase().includes(q) ||
          aff?.affiliate_code?.toLowerCase().includes(q) ||
          refProfile?.first_name?.toLowerCase().includes(q) ||
          refProfile?.last_name?.toLowerCase().includes(q) ||
          refProfile?.email?.toLowerCase().includes(q)
        );
      });
    }
    if (statusFilter !== 'all') {
      list = list.filter(r => r.status === statusFilter);
    }
    return list;
  }, [affiliateReferrals, search, statusFilter]);

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Totaux globaux
  const totalClicks = stats.reduce((s, a) => s + a.clicks, 0);
  const totalSignups = stats.reduce((s, a) => s + a.signups, 0);
  const totalSubscribed = stats.reduce((s, a) => s + a.subscribed, 0);
  const totalEarnings = stats.reduce((s, a) => s + a.earnings, 0);

  // Funnel conversion rates
  const clickToSignup = totalClicks > 0 ? ((totalSignups / totalClicks) * 100).toFixed(1) : '0';
  const signupToSub = totalSignups > 0 ? ((totalSubscribed / totalSignups) * 100).toFixed(1) : '0';

  // Status change handler
  const handleStatusChange = async (referralId, newStatus) => {
    if (!onUpdateReferralStatus) return;
    if (onConfirm) {
      const ok = await onConfirm(`Changer le statut en "${STATUS_LABELS[newStatus]}" ?`);
      if (!ok) return;
    }
    try {
      await onUpdateReferralStatus(referralId, newStatus);
      addToast?.('Statut mis à jour', 'success');
    } catch {
      addToast?.('Erreur lors de la mise à jour', 'error');
    }
  };

  // Toggle affiliate active
  const handleToggle = async (affiliateId, isActive) => {
    if (!onToggleAffiliate) return;
    if (onConfirm) {
      const ok = await onConfirm(isActive ? 'Réactiver ce partenaire ?' : 'Désactiver ce partenaire ? Il ne recevra plus de commissions.');
      if (!ok) return;
    }
    try {
      await onToggleAffiliate(affiliateId, isActive);
      addToast?.(isActive ? 'Partenaire activé' : 'Partenaire désactivé', 'success');
    } catch {
      addToast?.('Erreur', 'error');
    }
  };

  // Export CSV
  const exportCSV = () => {
    const headers = ['Partenaire', 'Email', 'Code', 'Actif', 'Clics', 'Inscrits', 'Abonnés', 'Gains (€/mois)', 'IBAN renseigné'];
    const rows = stats.map(s => {
      const aff = affiliates.find(a => a.id === s.affiliate_id);
      return [
        s.name, s.email, s.code,
        s.is_active ? 'Oui' : 'Non',
        s.clicks, s.signups, s.subscribed,
        s.earnings.toFixed(2),
        aff?.bank_iban ? 'Oui' : 'Non',
      ];
    });
    const csv = [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const a = document.createElement('a');
    const url = URL.createObjectURL(blob);
    a.href = url;
    a.download = `partenaires_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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
      {/* Stats globales + funnel */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <MousePointerClick className="h-4 w-4" /> Clics
            </div>
            <p className="text-2xl font-bold text-foreground">{totalClicks}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <UserPlus className="h-4 w-4" /> Inscrits
            </div>
            <p className="text-2xl font-bold text-foreground">{totalSignups}</p>
            <p className="text-xs text-muted-foreground">{clickToSignup}% des clics</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <CreditCard className="h-4 w-4" /> Abonnés
            </div>
            <p className="text-2xl font-bold text-green-400">{totalSubscribed}</p>
            <p className="text-xs text-muted-foreground">{signupToSub}% des inscrits</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5 pb-4 px-5">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Euro className="h-4 w-4" /> Gains récurrents
            </div>
            <p className="text-2xl font-bold text-foreground">{totalEarnings.toFixed(2)} €<span className="text-sm font-normal text-muted-foreground">/mois</span></p>
          </CardContent>
        </Card>
      </div>

      {/* Funnel visuel */}
      {totalClicks > 0 && (
        <Card>
          <CardContent className="py-4 px-5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Funnel de conversion</p>
            <div className="flex items-center gap-2 text-sm">
              <div className="flex items-center gap-1.5">
                <MousePointerClick className="h-4 w-4 text-blue-400" />
                <span className="font-medium">{totalClicks} clics</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <UserPlus className="h-4 w-4 text-yellow-400" />
                <span className="font-medium">{totalSignups} inscrits</span>
                <span className="text-xs text-muted-foreground">({clickToSignup}%)</span>
              </div>
              <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
              <div className="flex items-center gap-1.5">
                <CreditCard className="h-4 w-4 text-green-400" />
                <span className="font-medium">{totalSubscribed} abonnés</span>
                <span className="text-xs text-muted-foreground">({signupToSub}%)</span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats par partenaire */}
      {stats.length > 0 && (
        <>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Par partenaire</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {stats.map(s => {
              const aff = affiliates.find(a => a.id === s.affiliate_id);
              const hasBank = !!aff?.bank_iban;
              return (
                <Card key={s.affiliate_id}>
                  <CardContent className="pt-5 pb-4 px-5">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <p className="font-semibold text-foreground">{s.name}</p>
                        <p className="text-xs text-muted-foreground">{s.email}</p>
                        <Badge variant="outline" className="font-mono text-[10px] mt-1">{s.code}</Badge>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge className={cn('border-0 text-xs', s.is_active ? 'bg-green-600/20 text-green-300' : 'bg-red-600/20 text-red-300')}>
                          {s.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        {onToggleAffiliate && (
                          <Switch
                            checked={s.is_active}
                            onCheckedChange={(checked) => handleToggle(s.affiliate_id, checked)}
                            className="scale-75"
                          />
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm mb-3">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MousePointerClick className="h-3.5 w-3.5" /> {s.clicks} clic{s.clicks > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <UserPlus className="h-3.5 w-3.5" /> {s.signups} inscrit{s.signups > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-green-400">
                        <CreditCard className="h-3.5 w-3.5" /> {s.subscribed} abonné{s.subscribed > 1 ? 's' : ''}
                      </span>
                      <span className="flex items-center gap-1 text-foreground font-medium">
                        <Euro className="h-3.5 w-3.5" /> {s.earnings.toFixed(2)} €/mois
                      </span>
                    </div>
                    {/* Bank status + view */}
                    <div className="flex items-center justify-between border-t border-border pt-2">
                      <div className="flex items-center gap-1.5 text-xs">
                        <Landmark className="h-3.5 w-3.5" />
                        {hasBank ? (
                          <span className="text-green-400">IBAN renseigné</span>
                        ) : (
                          <span className="text-amber-400">IBAN manquant</span>
                        )}
                      </div>
                      {hasBank && aff && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs gap-1"
                          onClick={() => setBankModal(aff)}
                        >
                          <Eye className="h-3 w-3" /> Voir
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </>
      )}

      {/* Toolbar referrals */}
      <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">Tous les referrals</h3>
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
              <SelectItem value="clicked">Clic</SelectItem>
              <SelectItem value="signed_up">Inscrit</SelectItem>
              <SelectItem value="subscribed">Abonné</SelectItem>
              <SelectItem value="paid">Payé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex gap-2 items-center">
          <Badge variant="secondary" className="text-xs">{filtered.length} referral{filtered.length > 1 ? 's' : ''}</Badge>
          <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 text-xs">
            <Download className="h-3.5 w-3.5" /> CSV
          </Button>
        </div>
      </div>

      {/* Table des referrals */}
      {paged.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Handshake className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun referral partenaire{search || statusFilter !== 'all' ? ' trouvé' : ''}</p>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Partenaire</TableHead>
                <TableHead>Utilisateur référé</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="hidden md:table-cell">Commission</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead className="hidden lg:table-cell">Conversion</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map(r => {
                const aff = r.affiliates;
                const affProfile = aff?.user_profiles;
                const refProfile = r.referred_profile;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <p className="font-medium text-foreground">
                        {affProfile ? `${affProfile.first_name || ''} ${affProfile.last_name || ''}`.trim() || affProfile.email : '—'}
                      </p>
                      <Badge variant="outline" className="font-mono text-[10px]">{aff?.affiliate_code || '—'}</Badge>
                    </TableCell>
                    <TableCell>
                      {refProfile ? (
                        <>
                          <p className="font-medium text-foreground">
                            {`${refProfile.first_name || ''} ${refProfile.last_name || ''}`.trim() || refProfile.email}
                          </p>
                          <p className="text-xs text-muted-foreground">{refProfile.email}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground text-sm">Anonyme (clic)</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {onUpdateReferralStatus ? (
                        <Select
                          value={r.status}
                          onValueChange={(v) => handleStatusChange(r.id, v)}
                        >
                          <SelectTrigger className={cn('h-7 w-[110px] text-xs border-0', STATUS_COLORS[r.status] || 'bg-muted')}>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {STATUS_OPTIONS.map(s => (
                              <SelectItem key={s} value={s}>
                                <span className="flex items-center gap-1.5">
                                  <span className={cn('w-2 h-2 rounded-full', STATUS_COLORS[s]?.split(' ')[0])} />
                                  {STATUS_LABELS[s]}
                                </span>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Badge className={cn('border-0 text-xs', STATUS_COLORS[r.status] || 'bg-muted text-muted-foreground')}>
                          {STATUS_LABELS[r.status] || r.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                      {r.commission_amount ? `${Number(r.commission_amount).toFixed(2)} €/mois` : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.created_at ? new Date(r.created_at).toLocaleDateString('fr-FR') : '—'}
                    </TableCell>
                    <TableCell className="hidden lg:table-cell text-xs text-muted-foreground">
                      {r.converted_at ? new Date(r.converted_at).toLocaleDateString('fr-FR') : '—'}
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

      {/* Modal coordonnées bancaires */}
      <Dialog open={!!bankModal} onOpenChange={(open) => !open && setBankModal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Landmark className="h-5 w-5 text-primary" />
              Coordonnées bancaires
            </DialogTitle>
          </DialogHeader>
          {bankModal && (
            <div className="space-y-4">
              <div className="space-y-3">
                <div>
                  <Label className="text-muted-foreground text-xs">Titulaire</Label>
                  <p className="font-medium">{bankModal.bank_holder_name || '—'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">IBAN</Label>
                  <p className="font-mono text-sm bg-muted/50 px-3 py-2 rounded">
                    {bankModal.bank_iban?.replace(/(.{4})/g, '$1 ').trim() || '—'}
                  </p>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">BIC / SWIFT</Label>
                  <p className="font-mono">{bankModal.bank_bic || '—'}</p>
                </div>
                {bankModal.bank_updated_at && (
                  <p className="text-xs text-muted-foreground">
                    Mis à jour le {new Date(bankModal.bank_updated_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                <ShieldCheck className="h-4 w-4 flex-shrink-0" />
                Ces données sont protégées par RLS et chiffrement SSL
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setBankModal(null)}>Fermer</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
