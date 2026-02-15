// src/components/sirene/MultiplePipelineSelector.jsx
import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { buildPersonFullName, buildFullAddress, getDenomination, getApeLabel } from "../../utils/sirene-formatter";
import { getJuridicalFormShort } from "../../data/juridical-forms";
import { formatDate } from "../../utils/date-formatter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  X, 
  Loader2, 
  AlertCircle, 
  CheckCircle2, 
  Star,
  Users,
  Building2
} from "lucide-react";

export default function MultiplePipelineSelector({
  isOpen,
  onClose,
  selectedProspects,
  onSuccess
}) {
  const [boards, setBoards] = useState([]);
  const [selectedBoardIds, setSelectedBoardIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [progress, setProgress] = useState({ current: 0, total: 0, currentProspect: 0, totalProspects: 0 });
  const { user } = useAuth();

  // Charger les tableaux disponibles à l'ouverture du modal
  const loadBoards = async () => {
    if (!user?.id) {
      setError("Utilisateur non authentifié");
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser?.id) {
        setError("Erreur d'authentification: " + (authError?.message || "Utilisateur non trouvé"));
        return;
      }

      const { data: kanbanBoards, error: boardsError } = await supabase
        .from('kanban_boards')
        .select('*')
        .eq('user_id', authUser.id)
        .order('created_at', { ascending: true });

      if (boardsError) {
        setError("Erreur lors du chargement des tableaux: " + boardsError.message);
        return;
      }

      setBoards(kanbanBoards || []);

      const defaultBoard = kanbanBoards?.find(b => b.is_default);
      if (defaultBoard) {
        setSelectedBoardIds([defaultBoard.id]);
      }

    } catch (err) {
      setError("Erreur inattendue: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBoardToggle = (boardId) => {
    setSelectedBoardIds(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      } else {
        return [...prev, boardId];
      }
    });
  };

  const handleAddMultipleToBoards = async () => {
    if (selectedBoardIds.length === 0) {
      setError("Veuillez sélectionner au moins un tableau");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

      if (authError || !authUser?.id) {
        setError("Erreur d'authentification: " + (authError?.message || "Utilisateur non trouvé"));
        return;
      }

      let totalSuccess = 0;
      const errors = [];
      const totalOperations = selectedProspects.length * selectedBoardIds.length;
      let currentOperation = 0;

      setProgress({
        current: 0,
        total: totalOperations,
        currentProspect: 0,
        totalProspects: selectedProspects.length
      });

      for (let prospectIdx = 0; prospectIdx < selectedProspects.length; prospectIdx++) {
        const { row, idx } = selectedProspects[prospectIdx];

        setProgress(prev => ({ ...prev, currentProspect: prospectIdx + 1 }));

        const getField = (row, candidates) => {
          const candidatesArray = Array.isArray(candidates) ? candidates : [candidates];
          for (const candidate of candidatesArray) {
            if (!candidate || typeof candidate !== 'string') continue;
            if (row[candidate] !== undefined && row[candidate] !== '_') {
              return row[candidate];
            }
            const lowerCandidate = candidate.toLowerCase();
            const foundKey = Object.keys(row).find(k =>
              k && typeof k === 'string' && k.toLowerCase() === lowerCandidate
            );
            if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '_') {
              return row[foundKey];
            }
          }
          return "";
        };

        // Utiliser les fonctions partagées depuis sirene-formatter
        const getFieldWrapper = (key) => getField(row, [key]);
        const personName = buildPersonFullName(row, getFieldWrapper);
        const companyName = getDenomination(row) || "";
        let prospectName = personName || companyName || "Entreprise SIRENE";
        if (!prospectName || prospectName === "_" || prospectName.trim() === "") {
          prospectName = "Entreprise SIRENE";
        }

        const siretValue = getField(row, ["siret", "siretetablissement"]);
        const creationDateValue = getField(row, ["dateCreationEtablissement"]) || null;
        const legalFormValue = getJuridicalFormShort(getField(row, ["categorieJuridiqueUniteLegale"]));
        const activityCodeValue = getField(row, ["activitePrincipaleEtablissement"]);
        const activityLabelValue = getApeLabel(activityCodeValue);
        const addressValue = buildFullAddress(row, getFieldWrapper);

        const prospectData = {
          name: prospectName.trim(),
          company: companyName || prospectName.trim(),
          siret: siretValue || "",
          address: addressValue,
          juridicalForm: legalFormValue,
          activityCode: activityCodeValue,
          activityLabel: activityLabelValue,
          creationDate: creationDateValue,
          notes: `Prospect importé du registre SIRENE\nDate création: ${creationDateValue || "N/A"}\nForme juridique: ${legalFormValue || "N/A"}`,
          sireneRaw: row,
        };

        for (const boardId of selectedBoardIds) {
          try {
            currentOperation++;
            setProgress(prev => ({ ...prev, current: currentOperation }));

            const insertData = {
              user_id: authUser.id,
              name: prospectData.name || null,
              company: prospectData.company || null,
              status: "prospect",
              notes: prospectData.notes || null,
              tags: [],
              board_id: boardId
            };

            const { data: newProspect, error: insertError } = await supabase
              .from("prospects")
              .insert([insertData])
              .select()
              .single();

            if (insertError) throw insertError;

            const sireneData = {
              prospect_id: newProspect.id,
              siret: siretValue || null,
              creation_date: creationDateValue || null,
              legal_form: legalFormValue || null,
              ape_code: activityCodeValue || null,
              address: addressValue || null,
              sector: activityLabelValue || null,
              raw: prospectData.sireneRaw || null,
            };

            await supabase.from("sirene_infos").insert([sireneData]);

            totalSuccess++;

          } catch (boardError) {
            errors.push(`Tableau ${boardId}: ${boardError.message}`);
          }
        }
      }

      if (totalSuccess > 0) {
        const boardNames = selectedBoardIds.map(id => {
          const board = boards.find(b => b.id === id);
          return board?.name || `Tableau ${id}`;
        });

        onSuccess({
          totalProspects: selectedProspects.length,
          totalBoards: selectedBoardIds.length,
          totalSuccess,
          boardNames,
          errors
        });

        onClose();
      } else {
        setError("Aucun prospect n'a pu être ajouté. Vérifiez les erreurs.");
      }

    } catch (err) {
      setError("Erreur lors de l'ajout des prospects: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (isOpen && boards.length === 0 && !loading && !error) {
    loadBoards();
  }

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <CardHeader className="border-b">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Ajouter {selectedProspects.length} prospect{selectedProspects.length > 1 ? 's' : ''} aux pipelines
              </CardTitle>
              <CardDescription>
                Sélectionnez les pipelines de destination
              </CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} disabled={loading}>
              <X className="w-5 h-5" />
            </Button>
          </div>
        </CardHeader>

        <ScrollArea className="flex-1">
          <CardContent className="p-6 space-y-6">
            {/* Liste des prospects sélectionnés */}
            <div>
              <Label className="text-sm font-semibold mb-3 block">Prospects à ajouter :</Label>
              <Card className="bg-muted/50">
                <ScrollArea className="h-32">
                  <CardContent className="pt-4 space-y-2">
                    {selectedProspects.map(({ row }, index) => {
                      const getField = (row, candidates) => {
                        const key = Object.keys(row).find((k) =>
                          candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase().trim())
                        );
                        return key ? row[key] : "";
                      };

                      const nom = getField(row, ["nom", "nomunitelegale"]);
                      const societe = getField(row, ["denomination", "denominationunitelegale"]);
                      const siret = getField(row, ["siret", "siretetablissement"]);

                      return (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Building2 className="w-4 h-4 text-muted-foreground" />
                          <span className="font-medium text-foreground">
                            {(societe && societe !== "_") ? societe : (nom && nom !== "_") ? nom : "Entrée sans nom"}
                          </span>
                          {siret && (
                            <Badge variant="secondary" className="text-xs font-mono">
                              {siret}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </CardContent>
                </ScrollArea>
              </Card>
            </div>

            {/* Erreur */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Chargement initial */}
            {loading && boards.length === 0 && (
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>Chargement des tableaux disponibles...</AlertDescription>
              </Alert>
            )}

            {/* Sélection des tableaux */}
            {!loading && !error && boards.length > 0 && (
              <div>
                <Label className="text-sm font-semibold mb-3 block">
                  Sélectionnez les pipelines ({selectedBoardIds.length} sélectionné{selectedBoardIds.length > 1 ? 's' : ''}) :
                </Label>
                <div className="space-y-2">
                  {boards.map((board) => (
                    <Card
                      key={board.id}
                      className={`cursor-pointer transition-all ${
                        selectedBoardIds.includes(board.id)
                          ? 'ring-2 ring-primary bg-primary/5'
                          : 'hover:bg-muted/50'
                      }`}
                      onClick={() => handleBoardToggle(board.id)}
                    >
                      <CardContent className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <Checkbox
                            checked={selectedBoardIds.includes(board.id)}
                            onCheckedChange={() => handleBoardToggle(board.id)}
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{board.name}</span>
                              {board.is_default && (
                                <Badge variant="secondary" className="gap-1">
                                  <Star className="w-3 h-3" />
                                  Par défaut
                                </Badge>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mt-1">
                              {board.statuses?.join(" → ") || "Prospect → Contacté → En attente → Client → Perdu"}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            )}

            {/* Aucun tableau */}
            {!loading && !error && boards.length === 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Aucun tableau Kanban trouvé. Créez d'abord un tableau depuis la page de prospection.
                </AlertDescription>
              </Alert>
            )}

            {/* Barre de progression pendant l'ajout */}
            {loading && progress.total > 0 && (
              <Card className="bg-muted/50">
                <CardContent className="pt-6 space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Ajout en cours...
                    </span>
                    <Badge variant="secondary">
                      {progress.currentProspect}/{progress.totalProspects} prospects
                    </Badge>
                  </div>

                  <Progress 
                    value={(progress.current / progress.total) * 100} 
                    className="h-2"
                  />

                  <p className="text-xs text-muted-foreground text-center">
                    {Math.round((progress.current / progress.total) * 100)}% complété
                  </p>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </ScrollArea>

        <Separator />

        <div className="p-4 flex gap-3">
          <Button
            variant="secondary"
            onClick={onClose}
            disabled={loading}
            className="flex-1"
          >
            Annuler
          </Button>
          <Button
            onClick={handleAddMultipleToBoards}
            disabled={loading || selectedBoardIds.length === 0}
            className="flex-1 gap-2"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Traitement...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Ajouter ({selectedProspects.length} × {selectedBoardIds.length})
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  );
}
