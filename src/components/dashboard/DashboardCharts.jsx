// src/components/dashboard/DashboardCharts.jsx
// Composant pour les graphiques et visualisations du dashboard

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Target, Users, Clock, CheckCircle2, XCircle, BarChart3, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardCharts({ analytics, STATUSES }) {
  const statusConfig = {
    "prospect": { icon: Target, label: "Prospects", color: "blue" },
    "contacte": { icon: Users, label: "Contactés", color: "purple" },
    "attente": { icon: Clock, label: "En attente", color: "amber" },
    "client": { icon: CheckCircle2, label: "Clients", color: "green" },
    "perdu": { icon: XCircle, label: "Perdus", color: "red" },
  };

  const colorClasses = {
    blue: { bg: "bg-blue-500/10", text: "text-blue-500", progress: "bg-blue-500" },
    purple: { bg: "bg-purple-500/10", text: "text-purple-500", progress: "bg-purple-500" },
    amber: { bg: "bg-amber-500/10", text: "text-amber-500", progress: "bg-amber-500" },
    green: { bg: "bg-green-500/10", text: "text-green-500", progress: "bg-green-500" },
    red: { bg: "bg-red-500/10", text: "text-red-500", progress: "bg-red-500" },
  };

  // Vérifications de sécurité
  const safeAnalytics = {
    total: analytics?.total || 0,
    byStatus: analytics?.byStatus || {},
    avgDaysPerStatus: analytics?.avgDaysPerStatus || {}
  };

  const StatusCard = ({ status, count, avgDays }) => {
    const config = statusConfig[status] || statusConfig.prospect;
    const colors = colorClasses[config.color];
    const Icon = config.icon;
    const percentage = safeAnalytics.total > 0 ? Math.round((count / safeAnalytics.total) * 100) : 0;

    return (
      <Card className="group hover:shadow-lg transition-all duration-200 overflow-hidden">
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className={cn("flex h-10 w-10 items-center justify-center rounded-lg transition-transform duration-200 group-hover:scale-110", colors.bg)}>
              <Icon className={cn("h-5 w-5", colors.text)} />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-foreground">{count}</p>
              <p className="text-xs text-muted-foreground">{percentage}%</p>
            </div>
          </div>
          
          <p className="text-sm font-medium text-foreground mb-2">{config.label}</p>
          
          {/* Barre de progression */}
          <div className="w-full bg-muted rounded-full h-1.5 mb-2">
            <div
              className={cn("h-1.5 rounded-full transition-all duration-500", colors.progress)}
              style={{ width: `${percentage}%` }}
            />
          </div>

          {avgDays !== undefined && (
            <p className="text-xs text-muted-foreground">
              {avgDays} jours en moyenne
            </p>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-6">
      {/* Répartition par statut */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <BarChart3 className="h-5 w-5" />
            </div>
            <div>
              <CardTitle>Répartition du Pipeline</CardTitle>
              <CardDescription>Vue d'ensemble par statut</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {STATUSES.map((status) => (
              <StatusCard
                key={status}
                status={status}
                count={safeAnalytics.byStatus[status] || 0}
                avgDays={safeAnalytics.avgDaysPerStatus[status]}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Graphique en barres */}
      {safeAnalytics.total > 0 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <TrendingUp className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>Évolution du Pipeline</CardTitle>
                <CardDescription>Répartition des prospects par statut</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={STATUSES.map(status => ({
                  name: statusConfig[status]?.label || status,
                  count: safeAnalytics.byStatus[status] || 0,
                }))}>
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.5}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <YAxis
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    axisLine={{ stroke: 'hsl(var(--border))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--popover))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                      color: 'hsl(var(--popover-foreground))'
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 'bold' }}
                    itemStyle={{ color: 'hsl(var(--muted-foreground))' }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#colorGradient)"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}