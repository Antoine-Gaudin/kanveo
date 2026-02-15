// src/components/admin/AdminCodeList.jsx
import { useState, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table';
import { Plus, Pencil, Tag, Link, Search, Copy, Check, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState as useStateCopy } from 'react';

const CONNECT_STATUS_CONFIG = {
  pending: { label: 'Non configuré', class: 'bg-gray-600/20 text-gray-400' },
  onboarding: { label: 'Onboarding', class: 'bg-amber-600/20 text-amber-300' },
  active: { label: 'Actif', class: 'bg-green-600/20 text-green-300' },
  restricted: { label: 'Restreint', class: 'bg-red-600/20 text-red-300' },
  disabled: { label: 'Désactivé', class: 'bg-red-600/20 text-red-300' },
};

export default function AdminCodeList({ codes, loading, onAdd, onEdit, onToggle, onDelete, onGenerateOnboarding, onConfirm }) {
  const [search, setSearch] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filtered = useMemo(() => {
    if (!search) return codes;
    const q = search.toLowerCase();
    return codes.filter(c =>
      c.code?.toLowerCase().includes(q) ||
      c.influencer_name?.toLowerCase().includes(q) ||
      c.email?.toLowerCase().includes(q)
    );
  }, [codes, search]);

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (codeId, checked) => {
    if (onConfirm) {
      const ok = await onConfirm(checked ? 'Activer ce code ?' : 'Désactiver ce code ?');
      if (!ok) return;
    }
    onToggle(codeId, checked);
  };

  const handleDelete = async (codeId) => {
    if (onConfirm) {
      const ok = await onConfirm('Supprimer définitivement ce code ? Cette action est irréversible.');
      if (!ok) return;
    }
    onDelete?.(codeId);
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
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un code..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={onAdd} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouveau code
        </Button>
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Tag className="h-12 w-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Aucun code influenceur{search ? ' trouvé' : ''}</p>
            {!search && (
              <Button onClick={onAdd} variant="outline" className="mt-4 gap-2">
                <Plus className="h-4 w-4" />
                Créer le premier code
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Code</TableHead>
                <TableHead>Influenceur</TableHead>
                <TableHead>Utilisations</TableHead>
                <TableHead className="hidden md:table-cell">Connect</TableHead>
                <TableHead className="hidden lg:table-cell">Commission</TableHead>
                <TableHead className="hidden lg:table-cell">Coupon Stripe</TableHead>
                <TableHead>Actif</TableHead>
                <TableHead className="w-28" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(code => (
                <TableRow key={code.id}>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline" className="font-mono text-xs">
                        {code.code}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => copyCode(code.code, code.id)}
                        title="Copier le code"
                      >
                        {copiedId === code.id
                          ? <Check className="h-3 w-3 text-green-500" />
                          : <Copy className="h-3 w-3" />
                        }
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell className="font-medium">{code.influencer_name}</TableCell>
                  <TableCell>
                    <span className={cn(
                      'text-sm',
                      code.max_uses && code.current_uses >= code.max_uses
                        ? 'text-red-400'
                        : 'text-muted-foreground'
                    )}>
                      {code.current_uses || 0}
                      {code.max_uses ? ` / ${code.max_uses}` : ' / ∞'}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {(() => {
                      const status = code.stripe_connect_status || 'pending';
                      const config = CONNECT_STATUS_CONFIG[status] || CONNECT_STATUS_CONFIG.pending;
                      return (
                        <Badge className={cn('border-0 text-xs', config.class)}>
                          {config.label}
                        </Badge>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground">
                    {((code.commission_amount_cents ?? 500) / 100).toFixed(2)} €
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-xs text-muted-foreground font-mono">
                    {code.stripe_coupon_id || '—'}
                  </TableCell>
                  <TableCell>
                    <Switch
                      checked={code.is_active}
                      onCheckedChange={(checked) => handleToggle(code.id, checked)}
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      {onGenerateOnboarding && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          title="Générer lien onboarding Connect"
                          onClick={() => onGenerateOnboarding(code.id)}
                        >
                          <Link className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => onEdit(code)}
                        title="Modifier"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-red-400 hover:text-red-300"
                          onClick={() => handleDelete(code.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}
    </div>
  );
}
