import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Phone, Clock, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ContactHistory({ prospect }) {
  const contactStats = useMemo(() => {
    if (!prospect || !prospect.contacts) return { total: 0, lastContact: null };

    const lastContact = prospect.contacts.length > 0 
      ? new Date(prospect.contacts[prospect.contacts.length - 1].date)
      : null;

    const daysSinceLastContact = lastContact
      ? Math.floor((new Date() - lastContact) / (1000 * 60 * 60 * 24))
      : null;

    return {
      total: prospect.contacts.length,
      lastContact,
      daysSinceLastContact,
    };
  }, [prospect, prospect?.contacts]);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Phone className="w-4 h-4" />
              Total contacts
            </div>
            <p className="text-3xl font-bold">{contactStats.total}</p>
          </CardContent>
        </Card>

        {contactStats.daysSinceLastContact !== null ? (
          <Card className={cn(
            contactStats.daysSinceLastContact > 7 
              ? "border-red-500/50 bg-red-500/10" 
              : "border-green-500/50 bg-green-500/10"
          )}>
            <CardContent className="p-4">
              <div className={cn(
                "flex items-center gap-2 text-sm mb-1",
                contactStats.daysSinceLastContact > 7 
                  ? "text-red-500" 
                  : "text-green-500"
              )}>
                <Clock className="w-4 h-4" />
                Dernier contact
              </div>
              <p className={cn(
                "text-3xl font-bold",
                contactStats.daysSinceLastContact > 7 
                  ? "text-red-500" 
                  : "text-green-500"
              )}>
                {contactStats.daysSinceLastContact}j
              </p>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-amber-500/50 bg-amber-500/10">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 text-amber-500 text-sm mb-1">
                <Clock className="w-4 h-4" />
                Dernier contact
              </div>
              <p className="text-3xl font-bold text-amber-500">Jamais</p>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
              <Calendar className="w-4 h-4" />
              Créé le
            </div>
            <p className="text-sm font-mono">
              {new Date(prospect.createdAt || prospect.created_at).toLocaleDateString("fr-FR")}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
