// src/components/dashboard/DashboardStats.jsx
// Composant pour afficher les KPI principales du dashboard
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, Users, Phone, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

export default function DashboardStats({ analytics, settings }) {
  const stats = [
    {
      title: "Total Prospects",
      value: analytics.total,
      icon: Users,
      description: "prospects dans le pipeline",
      variant: "default"
    },
    {
      title: "Taux de conversion",
      value: `${analytics.conversionRate}%`,
      icon: TrendingUp,
      description: "Prospects → Clients",
      variant: "success"
    },
    {
      title: "Taux de contact",
      value: `${analytics.contactRate ?? 0}%`,
      icon: Phone,
      description: "Prospects contactés",
      variant: "info"
    }
  ];

  // Ajouter la carte rappels si activé
  if (settings.enableReminders) {
    const todayCount = analytics.todayReminders?.length || 0;
    const overdueCount = analytics.overdueReminders?.length || 0;
    stats.push({
      title: "À relancer",
      value: todayCount + overdueCount,
      icon: Clock,
      description: overdueCount > 0 
        ? `${overdueCount} en retard`
        : "rappels en attente",
      variant: overdueCount > 0 ? "warning" : "default"
    });
  }

  const variantStyles = {
    default: {
      icon: "bg-primary/10 text-primary",
      card: ""
    },
    success: {
      icon: "bg-green-500/10 text-green-500",
      card: "border-green-500/20"
    },
    info: {
      icon: "bg-blue-500/10 text-blue-500",
      card: "border-blue-500/20"
    },
    warning: {
      icon: "bg-amber-500/10 text-amber-500",
      card: "border-amber-500/20"
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        const styles = variantStyles[stat.variant];
        
        return (
          <Card 
            key={index} 
            className={cn(
              "group hover:shadow-lg transition-all duration-200",
              styles.card
            )}
          >
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.description}
                  </p>
                </div>
                <div className={cn(
                  "flex h-12 w-12 items-center justify-center rounded-xl transition-transform duration-200 group-hover:scale-110",
                  styles.icon
                )}>
                  <Icon className="h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
