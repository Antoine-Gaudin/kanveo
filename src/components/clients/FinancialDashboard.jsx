// src/components/clients/FinancialDashboard.jsx
import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import {
  Receipt,
  BarChart3,
  Users,
  Target,
  Wallet,
  CreditCard,
  CheckCircle,
  Clock,
  FileText,
  ArrowDownRight,
} from 'lucide-react';
import { ClientService } from '@/services/clientService';
import { CATEGORIES } from './ExpenseFormModal';
import { cn } from '@/lib/utils';

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(amount || 0);
}

function formatCurrencyShort(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function FinancialDashboard({ clients, contracts, expenses }) {
  const summary = useMemo(
    () => ClientService.getFinancialSummary(contracts, expenses),
    [contracts, expenses]
  );

  const clientStats = useMemo(() => ({
    total: clients.length,
    active: clients.filter(c => c.status === 'active').length,
  }), [clients]);

  // ── Données mensuelles pour le graphique ──
  const currentYear = new Date().getFullYear();
  const [chartYear, setChartYear] = useState(currentYear);

  const monthlyData = useMemo(() => {
    const MONTHS = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];
    const data = MONTHS.map((name, i) => ({ name, month: i, ca: 0, charges: 0, encaisse: 0 }));

    // CA contrats par mois de start_date
    contracts.forEach(c => {
      if (!c.start_date || c.status === 'cancelled') return;
      const d = new Date(c.start_date);
      if (d.getFullYear() !== chartYear) return;
      const m = d.getMonth();
      data[m].ca += Number(c.amount) || 0;
      data[m].encaisse += Number(c.paid_amount) || 0;
    });

    // Charges par mois
    expenses.forEach(e => {
      const amount = Number(e.amount) || 0;
      const expenseDate = e.date ? new Date(e.date) : null;
      const expMonth = expenseDate ? expenseDate.getMonth() : 0;
      const expYear = expenseDate ? expenseDate.getFullYear() : chartYear;

      if (e.recurrence === 'monthly') {
        // Charge mensuelle → s'applique à partir du mois de création
        const startMonth = (expYear === chartYear) ? expMonth : 0;
        if (expYear <= chartYear) {
          for (let m = startMonth; m < 12; m++) {
            data[m].charges += amount;
          }
        }
      } else if (e.recurrence === 'quarterly') {
        // Trimestrielle → 4 fois par an à partir de la date
        [0, 3, 6, 9].forEach(m => {
          if (expYear < chartYear || (expYear === chartYear && m >= expMonth)) {
            data[m].charges += amount;
          }
        });
      } else if (e.recurrence === 'yearly') {
        // Annuelle → au mois de la date de dépense
        if (expYear <= chartYear) {
          data[expMonth].charges += amount;
        }
      } else {
        // Ponctuelle → au mois de la date
        if (expenseDate && expYear === chartYear) {
          data[expMonth].charges += amount;
        }
      }
    });

    return data;
  }, [contracts, expenses, chartYear, summary.totalContractValue]);

  const hasChartData = monthlyData.some(d => d.ca > 0 || d.charges > 0 || d.encaisse > 0);

  const topCategories = useMemo(() => {
    return Object.entries(summary.expensesByCategory)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 5);
  }, [summary]);

  const totalCategoryAmount = topCategories.reduce((s, [, v]) => s + v, 0);

  const hasData = clients.length > 0 || contracts.length > 0 || expenses.length > 0;

  if (!hasData) {
    return (
      <div className="text-center py-16">
        <Wallet className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
        <h3 className="text-lg font-semibold text-foreground mb-2">Aucune donnée financière</h3>
        <p className="text-sm text-muted-foreground max-w-md mx-auto">
          Commencez par ajouter des clients, des contrats ou des charges dans les onglets correspondants pour voir votre bilan financier ici.
        </p>
      </div>
    );
  }

  const paidPercent = summary.totalContractValue > 0
    ? Math.min(100, (summary.totalPaid / summary.totalContractValue) * 100)
    : 0;

  const activeAndCompleted = summary.activeContracts + summary.completedContracts;

  return (
    <div className="space-y-6">

      {/* ═══════════════════════════════════════
          4 KPIs : CA | Encaissé | Charges | Clients
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">

        {/* CA Total */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  CA Contrats
                </p>
                <p className="text-2xl font-bold text-green-500">
                  {formatCurrencyShort(summary.totalContractValue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {activeAndCompleted} contrat{activeAndCompleted !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-green-500/10">
                <FileText className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Encaissé */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Encaissé
                </p>
                <p className="text-2xl font-bold text-emerald-500">
                  {formatCurrencyShort(summary.totalPaid)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {summary.totalUnpaid > 0 ? (
                    <span className="text-amber-500">{formatCurrencyShort(summary.totalUnpaid)} en attente</span>
                  ) : summary.totalContractValue > 0 ? (
                    <span className="text-green-500">Tout encaissé</span>
                  ) : (
                    <span>—</span>
                  )}
                </p>
              </div>
              <div className="p-2 rounded-lg bg-emerald-500/10">
                {summary.totalUnpaid > 0 ? (
                  <Clock className="h-5 w-5 text-amber-500" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charges / mois */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Charges / mois
                </p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrencyShort(summary.monthlyExpenses)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrencyShort(summary.yearlyExpenses)} / an
                </p>
              </div>
              <div className="p-2 rounded-lg bg-red-500/10">
                <ArrowDownRight className="h-5 w-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Clients actifs */}
        <Card className="relative overflow-hidden">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Clients actifs
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {clientStats.active}
                </p>
                <p className="text-xs text-muted-foreground">
                  {clientStats.total} au total
                </p>
              </div>
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════
          Détails (2 colonnes)
          ═══════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Suivi financier */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Suivi financier
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* CA contrats */}
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  <span className="text-sm">CA total contrats</span>
                </div>
                <span className="font-mono font-medium text-green-500">
                  {formatCurrency(summary.totalContractValue)}
                </span>
              </div>

              {/* Détail récurrent vs ponctuel (informatif, seulement si mix) */}
              {summary.recurringContracts > 0 && summary.oneTimeContracts > 0 && (
                <div className="pl-4 space-y-1.5 border-l-2 border-muted ml-1">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{summary.recurringContracts} récurrent{summary.recurringContracts !== 1 ? 's' : ''}</span>
                    <span className="font-mono">{formatCurrency(summary.recurringMonthly)}/mois</span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{summary.oneTimeContracts} ponctuel{summary.oneTimeContracts !== 1 ? 's' : ''}</span>
                    <span className="font-mono">{formatCurrency(summary.oneTimeTotal)}</span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between py-1.5">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  <span className="text-sm">Charges mensuelles</span>
                </div>
                <span className="font-mono font-medium text-red-500">
                  -{formatCurrency(summary.monthlyExpenses)}
                </span>
              </div>
            </div>

            {/* Encaissements */}
            {summary.totalContractValue > 0 && (
              <>
                <Separator />
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm flex items-center gap-1.5">
                      <CreditCard className="h-3.5 w-3.5" />
                      Encaissement
                    </span>
                    <span className="text-xs font-medium">
                      {formatCurrencyShort(summary.totalPaid)} / {formatCurrencyShort(summary.totalContractValue)}
                    </span>
                  </div>
                  <Progress value={paidPercent} className="h-2.5" />
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-muted-foreground">
                      {paidPercent.toFixed(0)}% encaissé
                    </span>
                    {summary.totalUnpaid > 0 && (
                      <span className="text-xs text-amber-500 font-medium">
                        {formatCurrencyShort(summary.totalUnpaid)} restant
                      </span>
                    )}
                  </div>
                </div>
              </>
            )}

            {/* Résultat net */}
            <Separator />
            <div className="space-y-2">
              <div className="flex items-center justify-between py-1.5">
                <span className="text-sm font-semibold">Encaissé − Charges annuelles</span>
                <span className={cn(
                  "font-mono font-bold text-lg",
                  (summary.totalPaid - summary.yearlyExpenses) >= 0 ? "text-green-500" : "text-red-500"
                )}>
                  {formatCurrency(summary.totalPaid - summary.yearlyExpenses)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {formatCurrencyShort(summary.totalPaid)} reçu − {formatCurrencyShort(summary.yearlyExpenses)} de charges
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Répartition des charges */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              Répartition des charges
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topCategories.length === 0 ? (
              <div className="text-center py-8">
                <Receipt className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">Aucune charge enregistrée</p>
                <p className="text-xs text-muted-foreground mt-1">Ajoutez vos charges dans l'onglet "Charges"</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topCategories.map(([category, amount]) => {
                  const cat = CATEGORIES[category] || CATEGORIES.other;
                  const pct = totalCategoryAmount > 0 ? (amount / totalCategoryAmount) * 100 : 0;
                  return (
                    <div key={category}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm">{cat.label}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">{pct.toFixed(0)}%</span>
                          <span className="text-sm font-mono font-medium">{formatCurrency(amount)}/mois</span>
                        </div>
                      </div>
                      <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className="h-full rounded-full bg-primary/60 transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <Separator />
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium">Total charges mensuelles</span>
                  <span className="font-mono font-bold text-red-500">{formatCurrency(summary.monthlyExpenses)}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ═══════════════════════════════════════
          Aperçu global
          ═══════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Aperçu global
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="text-center p-3 rounded-lg bg-muted/50">
              <p className="text-2xl font-bold text-foreground">{clientStats.total}</p>
              <p className="text-xs text-muted-foreground">Clients</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-green-500/10">
              <p className="text-2xl font-bold text-green-500">{clientStats.active}</p>
              <p className="text-xs text-muted-foreground">Actifs</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-blue-500/10">
              <p className="text-2xl font-bold text-blue-500">{activeAndCompleted}</p>
              <p className="text-xs text-muted-foreground">Contrats</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-primary/10">
              <p className="text-2xl font-bold text-primary">{formatCurrencyShort(summary.totalContractValue)}</p>
              <p className="text-xs text-muted-foreground">CA total</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-500">{formatCurrencyShort(summary.totalPaid)}</p>
              <p className="text-xs text-muted-foreground">Encaissé</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-red-500/10">
              <p className="text-2xl font-bold text-red-500">{formatCurrencyShort(summary.yearlyExpenses)}</p>
              <p className="text-xs text-muted-foreground">Charges / an</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* ═══════════════════════════════════════
          Évolution mensuelle
          ═══════════════════════════════════════ */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-base flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              Évolution mensuelle
            </CardTitle>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setChartYear(y => y - 1)}
                className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-muted-foreground"
              >
                ←
              </button>
              <span className="text-sm font-medium min-w-[3rem] text-center">{chartYear}</span>
              <button
                onClick={() => setChartYear(y => y + 1)}
                disabled={chartYear >= currentYear}
                className="px-2 py-1 text-xs rounded hover:bg-muted transition-colors text-muted-foreground disabled:opacity-30"
              >
                →
              </button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {!hasChartData ? (
            <div className="text-center py-12">
              <BarChart3 className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">Aucune donnée pour {chartYear}</p>
              <p className="text-xs text-muted-foreground mt-1">
                Les contrats apparaissent selon leur date de début
              </p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={monthlyData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 12 }}
                  className="fill-muted-foreground"
                />
                <YAxis
                  tick={{ fontSize: 11 }}
                  className="fill-muted-foreground"
                  tickFormatter={v => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}
                />
                <RechartsTooltip
                  cursor={{ fill: 'hsl(var(--muted) / 0.3)' }}
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '13px',
                    color: 'hsl(var(--foreground))',
                  }}
                  labelStyle={{ color: 'hsl(var(--muted-foreground))', marginBottom: '4px' }}
                  formatter={(value, name) => [
                    formatCurrency(value),
                    name === 'ca' ? 'CA signé' : name === 'encaisse' ? 'Encaissé' : 'Charges'
                  ]}
                />
                <Legend
                  formatter={(value) =>
                    value === 'ca' ? 'CA signé' : value === 'encaisse' ? 'Encaissé' : 'Charges'
                  }
                  wrapperStyle={{ fontSize: '12px' }}
                />
                <Bar dataKey="ca" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} activeBar={false} />
                <Bar dataKey="encaisse" fill="hsl(142, 71%, 45%)" radius={[4, 4, 0, 0]} activeBar={false} />
                <Bar dataKey="charges" fill="hsl(0, 84%, 60%)" radius={[4, 4, 0, 0]} activeBar={false} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
