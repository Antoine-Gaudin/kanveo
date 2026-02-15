// src/components/prospecting/ProspectTableView.jsx
import { useState, useMemo } from "react";
import ProspectDetailsModal from "./ProspectDetailsModal";
import ConfirmDialog from "../ConfirmDialog";
import { useConfirm } from "../../hooks/useConfirm";
import { STATUS_CONFIG } from "../../config/constants";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, MapPin, Trash2, PhoneCall, ArrowUpDown, Inbox, Mail } from "lucide-react";
import { cn } from "@/lib/utils";

export default function ProspectTableView({
  prospects,
  onMoveProspect,
  onDeleteProspect,
  onUpdateProspect,
  onAddContact,
  board = null,
}) {
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [editingStatus, setEditingStatus] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' });
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

  // Filtrer et trier les prospects
  const filteredAndSortedProspects = useMemo(() => {
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

    // Trier
    const sorted = [...filtered].sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (sortConfig.key === 'created_at' || sortConfig.key === 'last_contact') {
        aValue = aValue ? new Date(aValue) : new Date(0);
        bValue = bValue ? new Date(bValue) : new Date(0);
      }

      if (typeof aValue === 'string') {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return sorted;
  }, [prospects, filterStatus, searchTerm, sortConfig]);

  const handleSort = (key) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

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
    setEditingStatus(null);
  };

  const getStatusColor = (statusId) => {
    const column = boardColumns.find(c => c.id === statusId);
    return column?.color || "slate";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return '↕️';
    return sortConfig.direction === 'asc' ? '↑' : '↓';
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
              {filteredAndSortedProspects.length} / {prospects.length} prospects
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead
                onClick={() => handleSort('company')}
                className="cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  Entreprise
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('juridicalForm')}
                className="cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  Forme juridique
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('status')}
                className="cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  Statut
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead
                onClick={() => handleSort('created_at')}
                className="cursor-pointer hover:text-foreground"
              >
                <div className="flex items-center gap-1">
                  Date création
                  <ArrowUpDown className="w-4 h-4" />
                </div>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredAndSortedProspects.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="h-32 text-center">
                  <div className="space-y-2">
                    <Inbox className="w-10 h-10 mx-auto text-muted-foreground" />
                    <p className="text-muted-foreground">Aucun prospect trouvé</p>
                    <p className="text-sm text-muted-foreground">
                      {searchTerm || filterStatus !== 'all'
                        ? "Essayez de modifier vos filtres"
                        : "Commencez par ajouter des prospects"
                      }
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              filteredAndSortedProspects.map(prospect => (
                <TableRow
                  key={prospect.id}
                  className="cursor-pointer"
                  onClick={() => setSelectedProspect(prospect)}
                >
                  <TableCell>
                    <div>
                      <p className="font-medium">
                        {prospect.name || prospect.company || "Prospect sans nom"}
                      </p>
                      {prospect.address && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <MapPin className="w-3 h-3" /> {prospect.address}
                        </p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {prospect.juridicalForm || "-"}
                  </TableCell>
                  <TableCell>
                    <Select
                      value={prospect.status}
                      onValueChange={(value) => handleStatusChange(prospect.id, value)}
                    >
                      <SelectTrigger 
                        className="w-[140px] h-8 text-xs"
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
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {formatDate(prospect.created_at)}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center justify-end gap-1">
                      {prospect.email && (
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            window.open(`mailto:${prospect.email}`, "_blank");
                          }}
                          className="h-8 w-8 text-purple-500 hover:text-purple-600"
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
                        className="h-8 w-8 text-primary"
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
                        className="h-8 w-8 text-destructive"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

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
          allProspects={filteredAndSortedProspects}
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
}