import { useState, useMemo, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, X, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

const AVAILABLE_TAGS = [
  { id: "priority-high", label: "Priorité haute", color: "red" },
  { id: "priority-medium", label: "Priorité moyenne", color: "amber" },
  { id: "priority-low", label: "Priorité basse", color: "blue" },
  { id: "decision-maker", label: "Décideur", color: "purple" },
  { id: "needs-proposal", label: "Demande de devis", color: "green" },
  { id: "qualified", label: "Qualifié", color: "emerald" },
  { id: "unqualified", label: "Non qualifié", color: "gray" },
  { id: "follow-up", label: "À relancer", color: "orange" },
];

export default function SearchFilter({ prospects, onFilter, statuses }) {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("all");
  const [selectedTags, setSelectedTags] = useState([]);
  const [dateRange, setDateRange] = useState({ from: "", to: "" });

  // Fonction pour obtenir le label d'un tag
  const getTagLabel = (tagId) => {
    const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
    return tag?.label || tagId;
  };

  // Fonction pour obtenir la couleur d'un tag
  const getTagColor = (tagId) => {
    const tag = AVAILABLE_TAGS.find((t) => t.id === tagId);
    return tag?.color || "slate";
  };

  // Map des couleurs pour les tags
  const colorBgMap = {
    red: "bg-red-600/20 border-red-500/50 text-red-300",
    amber: "bg-amber-600/20 border-amber-500/50 text-amber-300",
    blue: "bg-blue-600/20 border-blue-500/50 text-blue-300",
    purple: "bg-purple-600/20 border-purple-500/50 text-purple-300",
    green: "bg-green-600/20 border-green-500/50 text-green-300",
    emerald: "bg-emerald-600/20 border-emerald-500/50 text-emerald-300",
    gray: "bg-gray-600/20 border-gray-500/50 text-gray-300",
    orange: "bg-orange-600/20 border-orange-500/50 text-orange-300",
  };

  // Extraire les tags uniques
  const uniqueTags = useMemo(() => {
    const tags = new Set();
    prospects.forEach((p) => {
      (p.tags || []).forEach((tag) => tags.add(tag));
    });
    return Array.from(tags);
  }, [prospects]);

  // Filtrer les prospects
  const filtered = useMemo(() => {
    return prospects.filter((prospect) => {
      // Filtrer par terme de recherche
      if (searchTerm.trim()) {
        const searchLower = searchTerm.toLowerCase();
        const matchesSearch =
          (prospect.name?.toLowerCase().includes(searchLower)) ||
          (prospect.company?.toLowerCase().includes(searchLower)) ||
          (prospect.email?.toLowerCase().includes(searchLower)) ||
          (prospect.phone?.includes(searchTerm)) ||
          (prospect.notes?.toLowerCase().includes(searchLower));

        if (!matchesSearch) return false;
      }

      // Filtrer par statut
      if (selectedStatus !== "all" && prospect.status !== selectedStatus) {
        return false;
      }

      // Filtrer par tags
      if (selectedTags.length > 0) {
        const prospectTags = prospect.tags || [];
        const hasAllTags = selectedTags.every((tag) => prospectTags.includes(tag));
        if (!hasAllTags) return false;
      }

      // Filtrer par date
      if (dateRange.from || dateRange.to) {
        const createdDate = new Date(prospect.createdAt || prospect.created_at);
        if (dateRange.from) {
          const fromDate = new Date(dateRange.from);
          if (createdDate < fromDate) return false;
        }
        if (dateRange.to) {
          const toDate = new Date(dateRange.to);
          toDate.setHours(23, 59, 59, 999); // Inclure le jour complet
          if (createdDate > toDate) return false;
        }
      }

      return true;
    });
  }, [prospects, searchTerm, selectedStatus, selectedTags, dateRange]);

  // Appeler le callback avec les résultats filtrés
  useEffect(() => {
    onFilter?.(filtered);
  }, [filtered, onFilter]);

  const handleToggleTag = (tag) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    selectedStatus !== "all" ||
    selectedTags.length > 0 ||
    dateRange.from !== "" ||
    dateRange.to !== "";

  return (
    <Card>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Search className="w-5 h-5" />
            Recherche Avancée
          </CardTitle>
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedStatus("all");
                setSelectedTags([]);
                setDateRange({ from: "", to: "" });
              }}
              className="text-primary hover:text-primary/80"
            >
              <X className="w-4 h-4 mr-1" />
              Réinitialiser
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Rechercher par nom, entreprise, email, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Status Filter */}
          <div className="space-y-2">
            <Label>Statut</Label>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                {(statuses || ["prospect", "contacte", "attente", "client", "perdu"]).map((s) => {
                  const label = typeof s === 'object' ? s.label : s;
                  const value = typeof s === 'object' ? s.id : s;
                  return (
                    <SelectItem key={value} value={value}>{label}</SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label>Du</Label>
              <Input
                type="date"
                value={dateRange.from}
                onChange={(e) =>
                  setDateRange({ ...dateRange, from: e.target.value })
                }
              />
            </div>
            <div className="space-y-2">
              <Label>Au</Label>
              <Input
                type="date"
                value={dateRange.to}
                onChange={(e) =>
                  setDateRange({ ...dateRange, to: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        {/* Tags Filter */}
        {uniqueTags.length > 0 && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Filter className="w-4 h-4" />
              Tags
            </Label>
            <div className="flex flex-wrap gap-2">
              {uniqueTags.map((tag) => (
                <Badge
                  key={tag}
                  variant="outline"
                  onClick={() => handleToggleTag(tag)}
                  className={cn(
                    "cursor-pointer transition-all",
                    selectedTags.includes(tag)
                      ? `${colorBgMap[getTagColor(tag)]} opacity-100`
                      : `${colorBgMap[getTagColor(tag)]} opacity-50 hover:opacity-100`
                  )}
                >
                  {getTagLabel(tag)}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Results */}
        <div className="pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{filtered.length}</span>{" "}
            résultat
            {filtered.length !== 1 ? "s" : ""} trouvé
            {filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
