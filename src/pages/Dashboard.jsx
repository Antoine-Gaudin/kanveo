import { useEffect, useState, useMemo } from "react";
import { isTaskOverdue, parseDateOnly, getLocalDateString } from "../utils/task-dates";
import { Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import useKanbanBoards from "../hooks/useKanbanBoards";
import useTasks from "../hooks/useTasks";
import { useClients, useContracts, useExpenses } from "../hooks/useClients";
import { ClientService } from "../services/clientService";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { DashboardSkeleton } from "../components/skeletons";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import {
  BarChart3,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  TrendingUp,
  Building2,
  Calendar,
  ArrowRight,
  ListTodo,
  Layers,
  UserPlus,
  Wallet,
  Receipt,
  Target,
  DollarSign,
} from "lucide-react";
import { cn } from "@/lib/utils";

function formatCurrency(amount) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(amount || 0);
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { boards, loading: boardsLoading, switchToBoard } = useKanbanBoards();
  const { tasks, loading: tasksLoading } = useTasks(user?.id);
  const { clients, loading: clientsLoading } = useClients(user?.id);
  const { contracts, loading: contractsLoading } = useContracts(user?.id);
  const { expenses, loading: expensesLoading } = useExpenses(user?.id);

  // React Query : cache les prospects du dashboard
  const { data: allProspects = [], isLoading: prospectsLoading } = useQuery({
    queryKey: ['allProspects', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("prospects")
        .select("*, sirene_infos(*)")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) {
        throw error;
      }
      return data || [];
    },
    enabled: !!user?.id,
    refetchOnWindowFocus: true,
  });

  const [isLoading, setIsLoading] = useState(true);
  // Gérer le loading global (max 5 secondes)
  useEffect(() => {
    if (!boardsLoading && !prospectsLoading && !tasksLoading && !clientsLoading && !contractsLoading && !expensesLoading) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [boardsLoading, prospectsLoading, tasksLoading, clientsLoading, contractsLoading, expensesLoading]);

  // Fallback : débloquer après 5s max même si les requêtes n'ont pas répondu
  useEffect(() => {
    const failsafe = setTimeout(() => setIsLoading(false), 5000);
    return () => clearTimeout(failsafe);
  }, []);

  // Calculer les statistiques
  const stats = useMemo(() => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    // Prospects stats
    const totalProspects = allProspects.length;
    const prospectsThisWeek = allProspects.filter(p => new Date(p.created_at) >= weekAgo).length;

    // Taux de conversion global
    const byStatus = {};
    allProspects.forEach(p => {
      const status = p.status || 'prospect';
      byStatus[status] = (byStatus[status] || 0) + 1;
    });
    const clientCount = byStatus['client'] || 0;
    const conversionRate = totalProspects > 0
      ? Math.round((clientCount / totalProspects) * 100)
      : 0;

    // Tasks stats
    const totalTasks = tasks?.length || 0;
    const pendingTasks = tasks?.filter(t => t.status === 'pending' || t.status === 'todo').length || 0;
    const inProgressTasks = tasks?.filter(t => t.status === 'in_progress').length || 0;
    const completedTasks = tasks?.filter(t => t.status === 'done' || t.status === 'completed').length || 0;

    // Tâches en retard
    const overdueTasks = tasks?.filter(t => {
      if (t.status === 'done' || t.status === 'completed') return false;
      return isTaskOverdue(t);
    }).length || 0;

    // Tâches à venir (7 jours)
    const todayStr = getLocalDateString();
    const weekLater = new Date();
    weekLater.setDate(weekLater.getDate() + 7);
    const weekLaterStr = `${weekLater.getFullYear()}-${String(weekLater.getMonth() + 1).padStart(2, '0')}-${String(weekLater.getDate()).padStart(2, '0')}`;
    const upcomingTasks = tasks?.filter(t => {
      if (t.status === 'done' || t.status === 'completed') return false;
      const dueDateStr = parseDateOnly(t.due_date);
      if (!dueDateStr) return false;
      return dueDateStr >= todayStr && dueDateStr <= weekLaterStr;
    }) || [];

    return {
      totalProspects,
      prospectsThisWeek,
      byStatus,
      clients: clientCount,
      conversionRate,
      totalTasks,
      pendingTasks,
      inProgressTasks,
      completedTasks,
      overdueTasks,
      upcomingTasks,
      totalPipelines: boards?.length || 0
    };
  }, [allProspects, tasks, boards]);

  // Données financières
  const financialData = useMemo(() => {
    const summary = ClientService.getFinancialSummary(contracts, expenses);
    return {
      ...summary,
      totalClients: clients.length,
      activeClients: clients.filter(c => c.status === 'active').length,
    };
  }, [clients, contracts, expenses]);

  // Derniers prospects (5 plus récents)
  const recentProspects = useMemo(() => {
    return allProspects.slice(0, 5);
  }, [allProspects]);

  // Prospects par pipeline
  const prospectsByPipeline = useMemo(() => {
    const byPipeline = {};
    boards?.forEach(board => {
      byPipeline[board.id] = {
        board,
        prospects: allProspects.filter(p => p.board_id === board.id),
        count: allProspects.filter(p => p.board_id === board.id).length
      };
    });
    return byPipeline;
  }, [allProspects, boards]);

  // Navigation vers un pipeline spécifique
  const goToPipeline = async (boardId) => {
    await switchToBoard(boardId);
    navigate("/prospecting");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
        <div className="max-w-7xl mx-auto">
          <DashboardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden -mx-4 -my-8 px-4 py-8">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 pointer-events-none" />

      <div className="max-w-7xl mx-auto space-y-6 relative z-10">
        {/* Header */}
        <Card className="border-border/50 bg-card/80 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <BarChart3 className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-3xl font-bold tracking-tight">
                    Dashboard
                  </CardTitle>
                  <CardDescription className="text-base mt-1">
                    Vue d'ensemble de votre activité
                  </CardDescription>
                </div>
              </div>
              <Link to="/prospecting">
                <Button className="gap-2">
                  Voir les pipelines
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* KPIs Principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Prospects</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalProspects}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    +{stats.prospectsThisWeek} cette semaine
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-blue-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Pipelines</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalPipelines}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    pipelines actifs
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
                  <Layers className="h-6 w-6 text-purple-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Taux Conversion</p>
                  <p className="text-3xl font-bold mt-1">{stats.conversionRate}%</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.clients} clients gagnés
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Tâches</p>
                  <p className="text-3xl font-bold mt-1">{stats.totalTasks}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {stats.pendingTasks} en attente
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-orange-500/10 flex items-center justify-center">
                  <ListTodo className="h-6 w-6 text-orange-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* KPIs Financières */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">CA Contrats</p>
                  <p className="text-2xl font-bold mt-1 text-green-600">{formatCurrency(financialData.totalContractValue)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialData.activeContracts + financialData.completedContracts} contrat{(financialData.activeContracts + financialData.completedContracts) !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-emerald-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Charges / mois</p>
                  <p className="text-2xl font-bold mt-1">{formatCurrency(financialData.monthlyExpenses)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    toutes catégories
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-red-500/10 flex items-center justify-center">
                  <Receipt className="h-6 w-6 text-red-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Encaissé</p>
                  <p className="text-2xl font-bold mt-1 text-emerald-600">{formatCurrency(financialData.totalPaid)}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialData.totalUnpaid > 0 ? (
                      <span className="text-amber-600">{formatCurrency(financialData.totalUnpaid)} en attente</span>
                    ) : (
                      <span>à jour</span>
                    )}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-green-500/10 flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-border/50">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Clients</p>
                  <p className="text-3xl font-bold mt-1">{financialData.totalClients}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {financialData.activeClients} actif{financialData.activeClients !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="h-12 w-12 rounded-full bg-indigo-500/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-indigo-500" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Section principale : 2 colonnes */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* Colonne gauche : Pipelines */}
          <div className="lg:col-span-2 space-y-6">

            {/* Pipelines */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      <Layers className="h-5 w-5 text-primary" />
                      Mes Pipelines
                    </CardTitle>
                    <CardDescription>
                      Cliquez pour accéder à un pipeline
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {boards?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Layers className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>Aucun pipeline créé</p>
                    <Link to="/prospecting">
                      <Button variant="link" className="mt-2">
                        Créer un pipeline
                      </Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {boards?.map(board => {
                      const pipelineData = prospectsByPipeline[board.id];
                      const count = pipelineData?.count || 0;

                      // Calculer les stats par statut pour ce pipeline
                      const pipelineProspects = pipelineData?.prospects || [];
                      const statuses = board.statuses || [];
                      const isNewFormat = statuses.length > 0 && typeof statuses[0] === 'object';

                      return (
                        <div
                          key={board.id}
                          className="p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors cursor-pointer group"
                          onClick={() => goToPipeline(board.id)}
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "h-10 w-10 rounded-lg flex items-center justify-center",
                                board.is_default ? "bg-primary/10 text-primary" : "bg-muted-foreground/10 text-muted-foreground"
                              )}>
                                <Building2 className="h-5 w-5" />
                              </div>
                              <div>
                                <div className="font-medium flex items-center gap-2">
                                  {board.name}
                                  {board.is_default && (
                                    <Badge variant="secondary" className="text-xs">
                                      Par défaut
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  {count} prospect{count !== 1 ? 's' : ''} • {statuses.length} colonnes
                                </p>
                              </div>
                            </div>
                            <Button variant="ghost" size="sm" className="opacity-0 group-hover:opacity-100 transition-opacity">
                              <ArrowRight className="h-4 w-4" />
                            </Button>
                          </div>

                          {/* Mini stats par colonne */}
                          {count > 0 && statuses.length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                              {(isNewFormat ? statuses : statuses.map(s => ({ id: s, label: s }))).slice(0, 5).map(status => {
                                const statusId = isNewFormat ? status.id : status;
                                const statusLabel = isNewFormat ? status.label : status;
                                const statusCount = pipelineProspects.filter(p => p.status === statusId).length;

                                return (
                                  <Badge
                                    key={statusId}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {isNewFormat && status.icon && <span className="mr-1">{status.icon}</span>}
                                    {statusLabel}: {statusCount}
                                  </Badge>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Colonne droite : Tâches + Derniers prospects */}
          <div className="space-y-6">

            {/* Tâches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ListTodo className="h-5 w-5 text-primary" />
                  Tâches
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Alertes tâches en retard */}
                {stats.overdueTasks > 0 && (
                  <div className="flex items-center gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
                    <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
                    <div>
                      <p className="font-medium text-red-500">
                        {stats.overdueTasks} tâche{stats.overdueTasks !== 1 ? 's' : ''} en retard
                      </p>
                      <p className="text-xs text-red-500/80">
                        Nécessite votre attention
                      </p>
                    </div>
                  </div>
                )}

                {/* Stats tâches */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg bg-yellow-500/10 text-center">
                    <p className="text-2xl font-bold text-yellow-600">{stats.pendingTasks}</p>
                    <p className="text-xs text-muted-foreground">En attente</p>
                  </div>
                  <div className="p-3 rounded-lg bg-blue-500/10 text-center">
                    <p className="text-2xl font-bold text-blue-600">{stats.inProgressTasks}</p>
                    <p className="text-xs text-muted-foreground">En cours</p>
                  </div>
                  <div className="p-3 rounded-lg bg-green-500/10 text-center">
                    <p className="text-2xl font-bold text-green-600">{stats.completedTasks}</p>
                    <p className="text-xs text-muted-foreground">Terminées</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted text-center">
                    <p className="text-2xl font-bold">{stats.totalTasks}</p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>

                {/* Tâches à venir */}
                {stats.upcomingTasks.length > 0 && (
                  <>
                    <Separator />
                    <div>
                      <p className="text-sm font-medium mb-2 flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        À venir (7 jours)
                      </p>
                      <div className="space-y-2">
                        {stats.upcomingTasks.slice(0, 3).map(task => (
                          <div
                            key={task.id}
                            className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm"
                          >
                            <span className="truncate flex-1">{task.title}</span>
                            <Badge variant="outline" className="text-xs ml-2">
                              {new Date(task.due_date + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                            </Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                <Link to="/tasks" className="block">
                  <Button variant="outline" className="w-full">
                    Voir toutes les tâches
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Résumé Financier */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5 text-primary" />
                  Finances
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Résumé */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">CA Contrats</span>
                    <span className="text-sm font-semibold text-green-600">
                      {formatCurrency(financialData.totalContractValue)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Encaissé</span>
                    <span className="text-sm font-semibold text-emerald-600">
                      {formatCurrency(financialData.totalPaid)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Charges / mois</span>
                    <span className="text-sm font-semibold text-red-600">
                      -{formatCurrency(financialData.monthlyExpenses)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Reste à percevoir</span>
                    <span className={cn(
                      "text-sm font-bold",
                      financialData.totalUnpaid > 0 ? "text-amber-600" : "text-green-600"
                    )}>
                      {financialData.totalUnpaid > 0 ? formatCurrency(financialData.totalUnpaid) : 'À jour'}
                    </span>
                  </div>
                </div>

                {/* Encaissement */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs text-muted-foreground">Encaissement</span>
                    <span className="text-xs font-medium">
                      {financialData.totalContractValue > 0 ? ((financialData.totalPaid / financialData.totalContractValue) * 100).toFixed(0) : 0}%
                    </span>
                  </div>
                  <Progress 
                    value={financialData.totalContractValue > 0 ? Math.min(100, (financialData.totalPaid / financialData.totalContractValue) * 100) : 0} 
                    className="h-2" 
                  />
                </div>

                {/* Résultat */}
                <div className="p-3 rounded-lg bg-muted/50">
                  <p className="text-xs text-muted-foreground mb-1">Résultat (encaissé − charges/an)</p>
                  <p className={cn("text-lg font-bold", (financialData.totalPaid - financialData.yearlyExpenses) >= 0 ? "text-green-600" : "text-red-600")}>
                    {formatCurrency(financialData.totalPaid - financialData.yearlyExpenses)}
                  </p>
                </div>

                <Link to="/clients" className="block">
                  <Button variant="outline" className="w-full">
                    Gérer les finances
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Derniers prospects */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5 text-primary" />
                  Derniers prospects
                </CardTitle>
              </CardHeader>
              <CardContent>
                {recentProspects.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-10 w-10 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">Aucun prospect</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {recentProspects.map(prospect => {
                      // Trouver le pipeline du prospect
                      const prospectBoard = boards?.find(b => b.id === prospect.board_id);

                      return (
                        <div
                          key={prospect.id}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                          onClick={() => prospect.board_id && goToPipeline(prospect.board_id)}
                        >
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                            <span className="text-sm font-medium text-primary">
                              {(prospect.company || prospect.name || '?')[0].toUpperCase()}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm truncate">
                              {prospect.company || prospect.name || 'Sans nom'}
                            </p>
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                              {prospectBoard && (
                                <>
                                  <Building2 className="h-3 w-3" />
                                  {prospectBoard.name} •
                                </>
                              )}
                              {new Date(prospect.created_at).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {prospect.status || 'prospect'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link to="/sirene" className="block mt-4">
                  <Button variant="outline" className="w-full">
                    Ajouter des prospects
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
