// src/components/dashboard/DashboardReminders.jsx
// Composant pour les rappels et derniers contacts du dashboard
import { AlertTriangle, Clock, Phone, Calendar, User, Building, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

export default function DashboardReminders({ analytics, settings }) {
  // Vérifications de sécurité
  const safeAnalytics = {
    overdueReminders: analytics?.overdueReminders || [],
    todayReminders: analytics?.todayReminders || []
  };

  const ReminderCard = ({ prospect, variant = "default" }) => {
    const variantStyles = {
      overdue: {
        badge: "bg-red-500/10 text-red-500 border-red-500/20",
        icon: "bg-red-500/10 text-red-500"
      },
      warning: {
        badge: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        icon: "bg-amber-500/10 text-amber-500"
      },
      default: {
        badge: "bg-muted text-muted-foreground",
        icon: "bg-muted text-muted-foreground"
      }
    };

    const styles = variantStyles[variant];

    return (
      <div className="group flex items-start gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors duration-200">
        <div className={cn("flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0", styles.icon)}>
          <User className="h-4 w-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="font-medium text-foreground text-sm truncate">
              {prospect.name || prospect.company}
            </p>
            <Badge variant="outline" className={cn("text-xs flex-shrink-0", styles.badge)}>
              {prospect.daysSinceContact}j
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
            <Building className="h-3 w-3" />
            <span className="truncate">{prospect.status}</span>
            {prospect.email && (
              <>
                <span>•</span>
                <span className="truncate">{prospect.email}</span>
              </>
            )}
          </div>
          {prospect.lastContact && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-muted-foreground">
              <Calendar className="h-3 w-3" />
              <span>Dernier contact: {prospect.lastContact}</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Rappels en retard */}
      {settings.enableReminders && safeAnalytics.overdueReminders.length > 0 && (
        <Card className="border-red-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500/10 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-red-500">
                    Rappels en retard
                  </CardTitle>
                  <CardDescription>
                    {safeAnalytics.overdueReminders.length} prospect(s) à relancer
                  </CardDescription>
                </div>
              </div>
              <Badge variant="destructive">Urgent</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {safeAnalytics.overdueReminders.slice(0, 10).map((prospect) => (
                  <ReminderCard
                    key={prospect.id}
                    prospect={prospect}
                    variant="overdue"
                  />
                ))}
                {safeAnalytics.overdueReminders.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ... et {safeAnalytics.overdueReminders.length - 10} autre(s) prospect(s)
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Rappels pour cette semaine */}
      {settings.enableReminders && safeAnalytics.todayReminders.length > 0 && (
        <Card className="border-amber-500/20">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10 text-amber-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle className="text-amber-500">
                    À relancer cette semaine
                  </CardTitle>
                  <CardDescription>
                    {safeAnalytics.todayReminders.length} prospect(s) planifié(s)
                  </CardDescription>
                </div>
              </div>
              <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
                Planifié
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-2">
                {safeAnalytics.todayReminders.slice(0, 10).map((prospect) => (
                  <ReminderCard
                    key={prospect.id}
                    prospect={prospect}
                    variant="warning"
                  />
                ))}
                {safeAnalytics.todayReminders.length > 10 && (
                  <p className="text-center text-sm text-muted-foreground py-2">
                    ... et {safeAnalytics.todayReminders.length - 10} autre(s) prospect(s)
                  </p>
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Pas de rappels */}
      {settings.enableReminders && safeAnalytics.overdueReminders.length === 0 && safeAnalytics.todayReminders.length === 0 && (
        <Card className="border-green-500/20">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mb-4">
              <CheckCircle2 className="h-8 w-8" />
            </div>
            <h3 className="text-lg font-semibold text-green-500 mb-2">
              Tous les contacts sont à jour !
            </h3>
            <p className="text-muted-foreground text-center">
              Aucun rappel en attente. Continuez comme ça !
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}