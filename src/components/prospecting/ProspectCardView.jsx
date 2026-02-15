// src/components/prospecting/ProspectCardView.jsx
import { useState, useMemo, memo } from "react";
import ProspectDetailsModal from "./ProspectDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { STATUS_CONFIG } from "../../config/constants";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Mail, Phone, Building2, MapPin, Trash2, PhoneCall, Search, Inbox, Calendar, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const ProspectCardView = memo(function ProspectCardView({
  prospects,
  onMoveProspect,
  onDeleteProspect,
  onUpdateProspect,
  onAddContact,
  board = null,
}) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  // Obtenir les colonnes du tableau
  const boardColumns = useMemo(() => {
    if (!board?.statuses || !Array.isArray(board.statuses)) {
      return [
        { id: "prospect", label: "🆕 Prospects", color: "blue" },
        { id: "contacte", label: "📞 Contactés", color: "yellow" },
        { id: "attente", label: "⏳ En attente", color: "orange" },
        { id: "client", label: "✅ Client", color: "green" },
        { id: "perdu", label: "❌ Perdu", color: "red" }
      ];
    }

    const firstStatus = board.statuses[0];
    if (typeof firstStatus === 'object' && firstStatus !== null) {
      return board.statuses;
    } else {
      return board.statuses.map(status => ({
        id: status,
        label: STATUS_CONFIG[status]?.label || status,
        icon: STATUS_CONFIG[status]?.icon || "📋",
        color: STATUS_CONFIG[status]?.color || "slate"
      }));
    }
  }, [board]);

  // Filtrer les prospects
  const filteredProspects = useMemo(() => {
    let filtered = prospects;

    // Filtrer par statut
    if (filterStatus !== 'all') {
      filtered = filtered.filter(p => p.status === filterStatus);
    }

    // Filtrer par terme de recherche
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(p =>
        (p.company && p.company.toLowerCase().includes(term)) ||
        (p.name && p.name.toLowerCase().includes(term)) ||
        (p.email && p.email.toLowerCase().includes(term)) ||
        (p.siret && p.siret.includes(term)) ||
        (p.juridicalForm && p.juridicalForm.toLowerCase().includes(term))
      );
    }

    return filtered;
  }, [prospects, filterStatus, searchTerm]);

  const handleDeleteWithConfirm = (prospect) => {
    confirm({
      title: "Supprimer ce prospect ?",
      message: `Voulez-vous vraiment supprimer "${prospect.name || prospect.company}" ? Cette action est irréversible.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => onDeleteProspect(prospect.id)
    });
  };

  const handleStatusChange = (prospectId, newStatus) => {
    onMoveProspect(prospectId, newStatus);
  };

  const getStatusColor = (statusId) => {
    const column = boardColumns.find(c => c.id === statusId);
    return column?.color || "slate";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now - date);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Aujourd'hui";
    if (diffDays === 1) return "Hier";
    if (diffDays < 7) return `Il y a ${diffDays} jours`;
    if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} semaines`;
    if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
    return `Il y a ${Math.floor(diffDays / 365)} ans`;
  };

  const getStatusBadge = (statusId) => {
    const status = boardColumns.find(c => c.id === statusId);
    const color = getStatusColor(statusId);

    const colorClasses = {
      blue: 'bg-blue-600/20 border-blue-500/50 text-blue-300',
      green: 'bg-green-600/20 border-green-500/50 text-green-300',
      yellow: 'bg-yellow-600/20 border-yellow-500/50 text-yellow-300',
      orange: 'bg-orange-600/20 border-orange-500/50 text-orange-300',
      red: 'bg-red-600/20 border-red-500/50 text-red-300',
      neutral: 'bg-muted/50 border-border text-muted-foreground'
    };

    return (
      <div className={`inline-flex items-center gap-1 px-2 py-1 text-xs rounded-full border ${colorClasses[color] || colorClasses.slate}`}>
        <span>{status?.icon || "📋"}</span>
        <span>{status?.label || statusId}</span>
      </div>
    );
  };

  return (
    <>
      {/* Barre de filtre et recherche */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Recherche */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Rechercher par nom, email, SIRET..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Filtre par statut */}
            <div className="md:w-48">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Tous les statuts" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  {boardColumns.map(column => (
                    <SelectItem key={column.id} value={column.id}>
                      {column.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Statistiques */}
            <div className="text-sm text-muted-foreground flex items-center">
              {filteredProspects.length} / {prospects.length} prospects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Grille de cartes */}
      {filteredProspects.length === 0 ? (
        <Card className="p-12">
          <div className="text-center space-y-4">
            <Inbox className="w-12 h-12 mx-auto text-muted-foreground" />
            <h3 className="text-xl font-semibold">Aucun prospect trouvé</h3>
            <p className="text-muted-foreground">
              {searchTerm || filterStatus !== 'all'
                ? "Essayez de modifier vos filtres pour voir plus de résultats"
                : "Commencez par ajouter des prospects à votre pipeline"
              }
            </p>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProspects.map(prospect => (
            <Card
              key={prospect.id}
              className="cursor-pointer group hover:border-primary/50 transition-all"
              onClick={() => setSelectedProspect(prospect)}
            >
              <CardContent className="p-4">
                {/* Header avec statut et actions */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold truncate group-hover:text-primary transition-colors">
                      {prospect.name || prospect.company || "Prospect sans nom"}
                    </h3>
                    {prospect.siret && (
                      <p className="text-xs text-muted-foreground font-mono mt-1">
                        SIRET: {prospect.siret}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 ml-2">
                    {/* Actions rapides */}
                    {prospect.email && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation();
                          window.open(`mailto:${prospect.email}`, "_blank");
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-purple-500 hover:text-purple-600"
                        title={`Envoyer un email à ${prospect.email}`}
                      >
                        <Mail className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        onUpdateProspect(prospect.id, {
                          ...(prospect.contact_count || 0) > 0 ? { last_contact: new Date().toISOString() } : {},
                          contact_count: (prospect.contact_count || 0) + 1
                        });
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-primary"
                      title="Contacter"
                    >
                      <PhoneCall className="w-4 h-4" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteWithConfirm(prospect);
                      }}
                      className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 text-destructive"
                      title="Supprimer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {/* Informations de contact */}
                <div className="space-y-2 mb-3 text-sm">
                  {prospect.email && (
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Mail className="w-3 h-3" /> <span className="truncate">{prospect.email}</span>
                    </p>
                  )}
                  {prospect.phone && (
                    <p className="text-muted-foreground flex items-center gap-2">
                      <Phone className="w-3 h-3" /> <span>{prospect.phone}</span>
                    </p>
                  )}
                  {prospect.address && (
                    <p className="text-muted-foreground text-xs flex items-start gap-2">
                      <MapPin className="w-3 h-3 mt-0.5" /> <span className="line-clamp-2">{prospect.address}</span>
                    </p>
                  )}
                </div>

                {/* Informations entreprise */}
                {prospect.juridicalForm && (
                  <div className="mb-3">
                    <Badge variant="secondary" className="text-xs">
                      <Building2 className="w-3 h-3 mr-1" />
                      {prospect.juridicalForm}
                    </Badge>
                  </div>
                )}

                {/* Statut et dates */}
                <div className="space-y-2">
                  {/* Sélecteur de statut */}
                  <Select
                    value={prospect.status}
                    onValueChange={(value) => handleStatusChange(prospect.id, value)}
                  >
                    <SelectTrigger 
                      className="w-full h-8 text-xs"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {boardColumns.map(col => (
                        <SelectItem key={col.id} value={col.id}>
                          {col.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Dates */}
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> {formatDate(prospect.created_at)}
                    </span>
                    {prospect.last_contact && (
                      <span className="flex items-center gap-1 text-primary">
                        <PhoneCall className="w-3 h-3" /> {formatDate(prospect.last_contact)}
                      </span>
                    )}
                  </div>

                  {/* Badge de contact */}
                  {prospect.contact_count > 0 && (
                    <div className="text-center">
                      <Badge variant="outline" className="text-xs">
                        <MessageSquare className="w-3 h-3 mr-1" />
                        {prospect.contact_count} contact(s)
                      </Badge>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de détails du prospect */}
      {selectedProspect && (
        <ProspectDetailsModal
          prospect={selectedProspect}
          onClose={() => setSelectedProspect(null)}
          onUpdate={(updatedProspect) => {
            onUpdateProspect(selectedProspect.id, updatedProspect);
            setSelectedProspect(updatedProspect);
          }}
          onDelete={() => {
            onDeleteProspect(selectedProspect.id);
            setSelectedProspect(null);
          }}
          onAddContact={onAddContact}
          board={board}
          allProspects={filteredProspects}
          onNavigate={(p) => setSelectedProspect(p)}
        />
      )}

      {/* Dialogue de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        title={confirmConfig.title}
        message={confirmConfig.message}
        confirmText={confirmConfig.confirmText}
        cancelText={confirmConfig.cancelText}
        type={confirmConfig.type}
        onConfirm={confirmConfig.onConfirm}
        onCancel={close}
      />
    </>
  );
});

export default ProspectCardView;