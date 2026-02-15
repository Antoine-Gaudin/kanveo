// src/components/prospecting/ProspectCard.jsx
import { useState, useMemo, memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  TooltipProvider,
} from "@/components/ui/tooltip";
import { Mail, Phone, ArrowUpRight, Trash2, CheckCircle2, AlertTriangle, AlertCircle, MessageSquare, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  TAG_COLOR_MAP,
  getStatusColor,
  getStatusLabel,
  getTagLabel,
  getTagColor,
  getDisplayName,
  getDisplaySubtitle,
} from "@/config/prospectConstants";

const ProspectCard = memo(function ProspectCard({
  prospect,
  onMove,
  onDelete,
  onView,
  onAddContact,
  allStatuses,
  variant = "default",
}) {
  const compact = variant === "compact";
  const [showMenu, setShowMenu] = useState(false);

  // Calcul du statut de rappel
  const reminderStatus = useMemo(() => {
    try {
      if (!prospect.contacts || prospect.contacts.length === 0) {
        // Gérer le cas où createdAt peut ne pas exister ou être invalide
        let daysSinceCreation = 0;
        const createdAtValue = prospect.createdAt || prospect.created_at;
        if (createdAtValue) {
          const creationDate = new Date(createdAtValue);
          if (!isNaN(creationDate.getTime())) {
            daysSinceCreation = Math.floor(
              (new Date() - creationDate) / (1000 * 60 * 60 * 24)
            );
          }
        }

        return {
          daysSince: daysSinceCreation,
          type: daysSinceCreation > 14 ? "overdue" : daysSinceCreation > 7 ? "warning" : "ok",
        };
      }

      // Gérer le cas où le contact peut avoir une date invalide
      const lastContactDate = new Date(prospect.contacts[prospect.contacts.length - 1].date);
      if (isNaN(lastContactDate.getTime())) {
        return { daysSince: 0, type: "ok" };
      }

      const daysSince = Math.floor((new Date() - lastContactDate) / (1000 * 60 * 60 * 24));

      return {
        daysSince,
        type: daysSince > 14 ? "overdue" : daysSince > 7 ? "warning" : "ok",
      };
    } catch (error) {
      return { daysSince: 0, type: "ok" };
    }
  }, [prospect.contacts, prospect.createdAt]);

  // Résoudre la liste des statuts
  const resolvedStatuses = useMemo(() => {
    if (!allStatuses || allStatuses.length === 0) return [];
    return allStatuses.map((s) =>
      typeof s === "object" ? s : { id: s, label: s, icon: "" }
    );
  }, [allStatuses]);



  // Détecter les tags prioritaires pour le style de la card
  const hasPriorityHigh = prospect.tags?.includes("priority-high");
  const isQualified = prospect.tags?.includes("qualified");

  return (
    <Card
      onClick={() => onView()}
      className={cn(
        "cursor-pointer group hover:shadow-lg hover:border-primary/50 transition-all relative",
        hasPriorityHigh && "border-l-3 border-l-red-500",
        isQualified && "border-l-3 border-l-emerald-500"
      )}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        {/* Status Badge + Reminder Status */}
        <div className={cn("flex items-center justify-between gap-2", compact ? "mb-2" : "mb-3")}>
          {/* Status Badge — masqué en compact (la colonne le montre déjà) */}
          {!compact && (
            <Badge className={cn("text-xs font-bold bg-gradient-to-r text-white", getStatusColor(prospect.status, allStatuses))}>
              {getStatusLabel(prospect.status, allStatuses)}
            </Badge>
          )}

          {/* Reminder Status Indicator */}
          <Badge 
            variant="outline" 
            className={cn(
              "flex items-center gap-1 text-xs font-semibold",
              reminderStatus.type === "ok" && "border-green-500/50 text-green-500",
              reminderStatus.type === "warning" && "border-amber-500/50 text-amber-500",
              reminderStatus.type === "overdue" && "border-red-500/50 text-red-500"
            )}
          >
            {reminderStatus.type === "ok" && <CheckCircle2 className="w-3 h-3" />}
            {reminderStatus.type === "warning" && <AlertTriangle className="w-3 h-3" />}
            {reminderStatus.type === "overdue" && <AlertCircle className="w-3 h-3" />}
            <span>{reminderStatus.daysSince}j</span>
          </Badge>
        </div>

        {/* Header with name and company */}
        <div className={compact ? "mb-2" : "mb-3"}>
          <h4 className={cn(
            "font-bold text-foreground leading-tight group-hover:text-primary transition line-clamp-1",
            compact ? "text-xs" : "text-sm line-clamp-2"
          )}>
            {getDisplayName(prospect)}
          </h4>
          {getDisplaySubtitle(prospect) && (
            <p className="text-xs text-muted-foreground mt-0.5 truncate">{getDisplaySubtitle(prospect)}</p>
          )}
        </div>

        {/* Tags Display */}
        {prospect.tags && prospect.tags.length > 0 && (
          <div className={cn(compact ? "mb-2" : "mb-3 pb-2 border-b")}>
            <div className="flex flex-wrap gap-1">
              {prospect.tags.slice(0, compact ? 2 : 3).map((tag) => (
                <Badge 
                  key={tag} 
                  variant="outline"
                  className={cn("text-xs font-medium", compact && "text-[10px] px-1.5 py-0", TAG_COLOR_MAP[getTagColor(tag)])}
                >
                  {getTagLabel(tag)}
                </Badge>
              ))}
              {prospect.tags.length > (compact ? 2 : 3) && (
                <TooltipProvider delayDuration={200}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="text-xs text-muted-foreground px-1 py-0.5 cursor-help">
                        +{prospect.tags.length - (compact ? 2 : 3)}
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="top" className="max-w-48">
                      <p className="text-xs">
                        {prospect.tags.slice(compact ? 2 : 3).map(getTagLabel).join(", ")}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              )}
            </div>
          </div>
        )}

        {/* Contact info */}
        {compact ? (
          /* Compact: icons only on one line */
          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
            {prospect.email && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Mail className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{prospect.email}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {prospect.phone && (
              <TooltipProvider delayDuration={200}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Phone className="w-3 h-3" />
                  </TooltipTrigger>
                  <TooltipContent><p className="text-xs">{prospect.phone}</p></TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            {prospect.contacts && prospect.contacts.length > 0 && (
              <span className="text-[10px] font-semibold text-primary">
                {prospect.contacts.length} contact{prospect.contacts.length > 1 ? "s" : ""}
              </span>
            )}
            {(!prospect.contacts || prospect.contacts.length === 0) && (
              <AlertTriangle className="w-3 h-3 text-amber-500" />
            )}
          </div>
        ) : (
          /* Default: full contact info */
          <div className="space-y-1.5 mb-3 text-xs">
          {prospect.email && (
            <div className="flex items-center gap-2 text-muted-foreground truncate">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate text-xs">{prospect.email}</span>
            </div>
          )}
          {prospect.phone && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{prospect.phone}</span>
            </div>
          )}
          {!prospect.email && !prospect.phone && (
            <p className="text-xs text-muted-foreground/60 italic">Pas de coordonnées</p>
          )}
          </div>
        )}

        {/* Notes preview — hidden in compact */}
        {!compact && prospect.notes && (
          <div className="mb-3 pb-2 border-b">
            <div className="flex items-start gap-1.5">
              <MessageSquare className="w-3 h-3 text-muted-foreground shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{prospect.notes}</p>
            </div>
          </div>
        )}

        {/* Contact history with stats — hidden in compact */}
        {!compact && prospect.contacts && prospect.contacts.length > 0 && (
          <div className="mb-3 pb-2 border-t pt-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">
                Contacts: <span className="text-primary font-bold">{prospect.contacts.length}</span>
              </p>
              <div className="flex gap-1">
                {prospect.contacts.slice(-3).map((contact) => {
                  const typeMap = {
                    email: { emoji: "📧", label: "Email" },
                    phone: { emoji: "☎️", label: "Appel" },
                    message: { emoji: "💬", label: "Message" },
                    meeting: { emoji: "🤝", label: "Rendez-vous" },
                    contact: { emoji: "📌", label: "Contact" },
                  };
                  const info = typeMap[contact.type] || { emoji: "📌", label: "Contact" };
                  return (
                    <span key={contact.id} title={info.label} aria-label={info.label} role="img" className="text-xs">
                      {info.emoji}
                    </span>
                  );
                })}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Dernier : {new Date(prospect.contacts[prospect.contacts.length - 1].date).toLocaleDateString("fr-FR")}
            </p>
          </div>
        )}

        {/* No contacts warning — hidden in compact (shown inline above) */}
        {!compact && (!prospect.contacts || prospect.contacts.length === 0) && (
          <div className="mb-3 pb-2 border-t pt-2">
            <p className="text-xs text-amber-500 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              Aucun contact enregistré
            </p>
          </div>
        )}

        {/* Date de création — hidden in compact */}
        {!compact && (prospect.createdAt || prospect.created_at) && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-muted-foreground/60">
            <Calendar className="w-3 h-3" />
            <span>Ajouté le {new Date(prospect.createdAt || prospect.created_at).toLocaleDateString("fr-FR")}</span>
          </div>
        )}

        {/* Action buttons - visible on hover */}
        <div className={cn(
          "flex gap-1 opacity-0 group-hover:opacity-100 transform group-hover:translate-y-0 translate-y-2 transition-all duration-150",
          compact && "gap-1 mt-1"
        )}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                size="sm"
                onClick={(e) => e.stopPropagation()}
                className={cn("flex-1 text-xs", compact && "h-7")}
                title="Changer statut"
              >
                <ArrowUpRight className="w-3 h-3 mr-1" />
                Statut
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" onClick={(e) => e.stopPropagation()}>
              {resolvedStatuses
                .filter((s) => s.id !== prospect.status)
                .map((s) => (
                  <DropdownMenuItem
                    key={s.id}
                    onClick={() => onMove(s.id)}
                  >
                    <Badge
                      className={cn(
                        "text-xs mr-2 bg-gradient-to-r text-white",
                        getStatusColor(s.id, allStatuses)
                      )}
                    >
                      {s.icon || ""}
                    </Badge>
                    {s.label}
                  </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
          {prospect.email && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`mailto:${prospect.email}`, "_blank");
              }}
              title={`Email: ${prospect.email}`}
              className={cn("text-purple-500 border-purple-500/30 hover:bg-purple-500/10", compact && "h-7 w-7")}
            >
              <Mail className="w-3 h-3" />
            </Button>
          )}
          {prospect.phone && (
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                window.open(`tel:${prospect.phone}`, "_blank");
              }}
              title={`Appeler: ${prospect.phone}`}
              className={cn("text-green-500 border-green-500/30 hover:bg-green-500/10", compact && "h-7 w-7")}
            >
              <Phone className="w-3 h-3" />
            </Button>
          )}
          <Button
            size="sm"
            variant="destructive"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            title="Supprimer"
            className={cn(compact && "h-7 w-7")}
          >
            <Trash2 className="w-3 h-3" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
});

export default ProspectCard;