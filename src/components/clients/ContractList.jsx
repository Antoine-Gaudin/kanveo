// src/components/clients/ContractList.jsx
import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Search, Plus, MoreVertical, Pencil, Trash2, FileText, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  active: { label: 'En cours', icon: '✅', class: 'bg-green-600/20 text-green-300' },
  completed: { label: 'Terminé', icon: '🏁', class: 'bg-blue-600/20 text-blue-300' },
  cancelled: { label: 'Annulé', icon: '❌', class: 'bg-red-600/20 text-red-300' },
};

const RECURRENCE_LABELS = {
  one_time: 'Ponctuel',
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
};

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function formatCurrencyShort(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
}

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('fr-FR');
}

function PaymentBadge({ contract }) {
  const total = Number(contract.amount) || 0;
  const paid = Number(contract.paid_amount) || 0;
  if (total === 0) return null;

  const pct = Math.min(100, (paid / total) * 100);
  const remaining = Math.max(0, total - paid);

  if (pct >= 100) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-500">
        <CheckCircle className="h-3 w-3" />
        <span>Payé</span>
      </div>
    );
  }
  if (pct > 0) {
    return (
      <div className="space-y-0.5 min-w-[80px]">
        <div className="flex items-center justify-between text-xs">
          <span className="text-amber-500">{pct.toFixed(0)}%</span>
          <span className="text-muted-foreground">{formatCurrencyShort(remaining)} dû</span>
        </div>
        <Progress value={pct} className="h-1.5" />
      </div>
    );
  }
  return (
    <div className="flex items-center gap-1 text-xs text-muted-foreground">
      <Clock className="h-3 w-3" />
      <span>Non payé</span>
    </div>
  );
}

export default function ContractList({ contracts, onAdd, onEdit, onDelete }) {
  const [search, setSearch] = useState('');

  const filtered = contracts.filter(c => {
    const q = search.toLowerCase();
    return (
      c.title?.toLowerCase().includes(q) ||
      c.clients?.name?.toLowerCase().includes(q) ||
      c.clients?.company?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un contrat..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">Ajouter un contrat</span>
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">
              {contracts.length === 0 ? 'Aucun contrat pour le moment' : 'Aucun résultat'}
            </p>
            {contracts.length === 0 && (
              <Button onClick={onAdd} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Ajouter votre premier contrat
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Contrat</TableHead>
                <TableHead className="hidden md:table-cell">Client</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="hidden sm:table-cell">Type</TableHead>
                <TableHead className="hidden lg:table-cell">Paiement</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="w-10" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(contract => {
                const status = STATUS_CONFIG[contract.status] || STATUS_CONFIG.active;
                const paymentCount = Number(contract.payment_count) || 1;
                return (
                  <TableRow key={contract.id} className="group cursor-pointer" onClick={() => onEdit(contract)}>
                    <TableCell>
                      <p className="font-medium text-foreground">{contract.title}</p>
                      {contract.description && (
                        <p className="text-xs text-muted-foreground truncate max-w-[200px]">{contract.description}</p>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <p className="text-sm text-muted-foreground">
                        {contract.clients?.name || '—'}
                      </p>
                    </TableCell>
                    <TableCell className="text-right">
                      <p className="font-mono font-medium text-foreground">
                        {formatCurrency(contract.amount)}
                      </p>
                      {paymentCount > 1 && (
                        <p className="text-xs text-muted-foreground">
                          {paymentCount} échéances
                        </p>
                      )}
                    </TableCell>
                    <TableCell className="hidden sm:table-cell">
                      <Badge variant="outline" className="text-xs">
                        {RECURRENCE_LABELS[contract.recurrence] || contract.recurrence}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden lg:table-cell">
                      <PaymentBadge contract={contract} />
                    </TableCell>
                    <TableCell>
                      <Badge className={cn('border-0 text-xs', status.class)}>
                        {status.icon} {status.label}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(contract); }}>
                            <Pencil className="h-4 w-4 mr-2" />
                            Modifier
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => { e.stopPropagation(); onDelete(contract.id); }}
                            className="text-destructive"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
