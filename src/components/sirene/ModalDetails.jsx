// src/components/sirene/ModalDetails.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from '@tanstack/react-query';
import { CopyButton } from "../../utils/clipboard.jsx";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../context/AuthContext";
import useKanbanBoards from "../../hooks/useKanbanBoards";
import { supabase } from "../../lib/supabaseClient";
import BoardSelectorModal from "./BoardSelectorModal";
import { getJuridicalFormLabel, getJuridicalFormShort } from "../../data/juridical-forms";
import {
  formatSiret,
  buildFullAddress,
  buildPersonFullName,
  getApeLabel,
  getDenomination
} from "../../utils/sirene-formatter";
import { formatDate } from "../../utils/date-formatter";
import ModalDetailsSkeleton from "../skeletons/ModalDetailsSkeleton";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  X, 
  Copy, 
  Building2, 
  MapPin, 
  Calendar, 
  Briefcase, 
  Target, 
  ExternalLink,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Globe,
  Mail,
  Phone,
  Users,
  Twitter,
  Linkedin,
  Info
} from "lucide-react";

export default function ModalDetails({ row, rowIndex, onUpdateField, onClose }) {
  const navigate = useNavigate();
  const [editedData, setEditedData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [hideEmptyFields, setHideEmptyFields] = useState(true);
  const [showBoardSelector, setShowBoardSelector] = useState(false);
  const [addingToBoard, setAddingToBoard] = useState(false);
  const { addToast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Hook pour gérer les tableaux Kanban
  const { boards, activeBoard } = useKanbanBoards();

  useEffect(() => {
    function onEsc(e) {
      if (e.key === "Escape") onClose?.();
    }
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  // Helper pour récupérer un champ (édité ou original)
  const getField = (key) => {
    const value = editedData[key] !== undefined ? editedData[key] : (row[key] || "");
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    return String(value);
  };

  // Helper pour trouver les valeurs dans l'objet row
  const getFieldWithCandidates = (candidates) => {
    const candidatesArray = Array.isArray(candidates) ? candidates : [candidates];

    for (const candidate of candidatesArray) {
      if (!candidate || typeof candidate !== 'string') continue;

      if (editedData[candidate] !== undefined && editedData[candidate] !== '_' && editedData[candidate] !== null && editedData[candidate] !== '') {
        return editedData[candidate];
      }

      if (row[candidate] !== undefined && row[candidate] !== '_' && row[candidate] !== null && row[candidate] !== '') {
        return row[candidate];
      }

      const lowerCandidate = candidate.toLowerCase();
      const foundKey = Object.keys(row).find(k =>
        typeof k === 'string' && k.toLowerCase() === lowerCandidate
      );

      if (foundKey && row[foundKey] !== undefined && row[foundKey] !== '_' && row[foundKey] !== null && row[foundKey] !== '') {
        return row[foundKey];
      }
    }

    return "";
  };

  const getPersonName = () => buildPersonFullName(row, getField);
  const getFullAddressFromRow = () => buildFullAddress(row, getField);

  const handleFieldChange = (key, value) => {
    setEditedData((prev) => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const handleSave = () => {
    Object.entries(editedData).forEach(([key, value]) => {
      if (value !== row[key]) {
        onUpdateField(rowIndex, key, value);
      }
    });
    setHasChanges(false);
  };

  const handleAddToProspecting = () => {
    handleSave();
    setShowBoardSelector(true);
  };

  const handleAddToBoard = async (selectedBoardIds) => {
    if (selectedBoardIds.length === 0) return;

    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();

    if (authError || !authUser?.id) {
      addToast("Erreur d'authentification", "error");
      setAddingToBoard(false);
      return;
    }

    setAddingToBoard(true);

    try {
      const personName = buildPersonFullName(row, getField);
      const companyName = getDenomination(row, editedData) || getField("denomination") || getField("denominationunitelegale") || "";
      const prospectName = personName || companyName || "Prospect SIRENE";

      const prospectData = {
        name: prospectName,
        company: companyName,
        siret: getFieldWithCandidates(["siret", "siretetablissement"]) || "",
        email: "",
        phone: "",
        address: buildFullAddress(row, getField),
        juridicalForm: getJuridicalFormShort(getFieldWithCandidates(["categorieJuridiqueUniteLegale"])),
        activityCode: getFieldWithCandidates(["activitePrincipaleEtablissement", "activitePrincipaleUniteLegale"]) || "",
        activityLabel: getApeLabel(getFieldWithCandidates(["activitePrincipaleEtablissement", "activitePrincipaleUniteLegale"])) || "",
        creationDate: formatDate(getFieldWithCandidates(["dateCreationEtablissement", "dateCreationUniteLegale"])) || "",
        notes: `Prospect importé du registre SIRENE
Date création: ${formatDate(getFieldWithCandidates(["dateCreationEtablissement", "dateCreationUniteLegale"])) || "N/A"}
Forme juridique: ${getJuridicalFormShort(getFieldWithCandidates(["categorieJuridiqueUniteLegale"])) || "N/A"}
${personName ? `Personne: ${personName}` : ''}
${companyName ? `Entreprise: ${companyName}` : ''}
SIRET: ${getFieldWithCandidates(["siret", "siretetablissement"]) || "N/A"}`,
        sireneRaw: row,
      };

      const addedProspects = [];

      for (const boardId of selectedBoardIds) {
        try {
          const insertData = {
            user_id: authUser.id,
            name: prospectData.name,
            company: prospectData.company || null,
            status: "prospect",
            notes: prospectData.notes || null,
            tags: [],
          };

          if (boardId) {
            insertData.board_id = boardId;
          }

          let newProspect, error;

          try {
            const result = await supabase
              .from("prospects")
              .insert([insertData])
              .select()
              .single();

            newProspect = result.data;
            error = result.error;

            if (error) throw error;

          } catch (insertError) {
            const { data: tempProspect, error: tempError } = await supabase
              .from("prospects")
              .insert([{
                user_id: authUser.id,
                name: prospectData.name,
                company: prospectData.company || null,
                status: "prospect",
                notes: prospectData.notes || null,
                tags: []
              }])
              .select()
              .single();

            if (tempError) throw tempError;

            const { data: updatedProspect, error: updateError } = await supabase
              .from("prospects")
              .update({ board_id: boardId })
              .eq("id", tempProspect.id)
              .select()
              .single();

            newProspect = updateError ? tempProspect : updatedProspect;
            error = null;
          }

          if (error && !newProspect) throw error;

          const sireneData = {
            prospect_id: newProspect.id,
            siret: prospectData.siret || null,
            creation_date: prospectData.creationDate || null,
            legal_form: prospectData.juridicalForm || null,
            ape_code: prospectData.activityCode || null,
            address: prospectData.address || null,
            sector: prospectData.activityLabel || null,
            raw: prospectData.sireneRaw || null,
          };

          await supabase.from("sirene_infos").insert([sireneData]);

          addedProspects.push({ boardId, prospect: newProspect });
        } catch (error) {
          addToast(`Erreur lors de l'ajout au pipeline: ${error.message}`, "error");
        }
      }

      if (addedProspects.length > 0) {
        const boardNames = selectedBoardIds.map(id => {
          const board = boards.find(b => b.id === id);
          return board?.name || `Tableau ${id}`;
        });

        addToast(
          `Prospect ajouté à ${addedProspects.length} pipeline(s): ${boardNames.join(', ')}`,
          "success"
        );

        // Invalider le cache pour que les listes se mettent à jour
        queryClient.invalidateQueries({ queryKey: ['prospects'] });
        queryClient.invalidateQueries({ queryKey: ['kanban'] });

        onClose();
        navigate('/prospecting');
      } else {
        addToast("Erreur lors de l'ajout du prospect", "error");
      }
    } catch (error) {
      addToast("Erreur lors de l'ajout du prospect", "error");
    } finally {
      setAddingToBoard(false);
    }
  };

  const handleSearchOnInternet = async () => {
    const companyName = getField("denominationunitelegale") || "";
    const personName = buildPersonFullName(row, getField) || "";
    const siretRaw = getField(["siret", "siretetablissement"]) || "";
    const siret = formatSiret(siretRaw);
    const siretClean = siret.replace(/[-\s.]/g, "").trim();
    
    setShowSearchModal(true);
    setSearchLoading(true);
    setSearchError(null);
    setSearchResults(null);

    try {
      const clearbitQuery = companyName || personName;
      
      if (!clearbitQuery) {
        setSearchError("Aucune information disponible pour effectuer une recherche");
        setSearchLoading(false);
        return;
      }

      let clearbitData = null;
      try {
        const clearbitResponse = await fetch(
          `https://autocomplete.clearbit.com/v1/companies?query=${encodeURIComponent(companyName || personName)}`
        );
        
        if (clearbitResponse.ok) {
          const clearbitResults = await clearbitResponse.json();
          
          if (clearbitResults && clearbitResults.length > 0) {
            const company = clearbitResults[0];
            clearbitData = {
              name: company.name,
              domain: company.domain,
              logo: company.logo,
              description: company.description,
              website: `https://${company.domain}`,
              location: company.location,
              employees: company.employees,
              linkedin: company.linkedin ? `https://linkedin.com/company/${company.linkedin.handle}` : null,
              twitter: company.twitter ? `https://twitter.com/${company.twitter.handle}` : null,
              phone: company.phone || null,
              email: company.email || null,
              founded: company.founded,
              industry: company.industry,
              type: company.type
            };
          }
        }
      } catch (clearbitError) {
        // Erreur Clearbit non-bloquante
      }

      const searches = [];
      
      if (companyName) {
        searches.push({ type: "Entreprise", query: companyName });
      }
      if (personName) {
        searches.push({ type: "Personne", query: personName });
      }
      if (siretClean && siretClean.length === 14) {
        searches.push({ type: "SIRET", query: siretClean });
      }
      if (personName) {
        const linkedinQuery = `${personName} site:linkedin.com`;
        searches.push({ type: "LinkedIn", query: linkedinQuery, isLinkedinSearch: true });
      }

      const searchResults = await Promise.all(
        searches.map(async (search) => {
          try {
            const response = await fetch(
              `https://api.duckduckgo.com/?q=${encodeURIComponent(search.query)}&format=json`
            );
            
            if (!response.ok) {
              return { type: search.type, query: search.query, success: false, error: `Erreur HTTP ${response.status}` };
            }

            const data = await response.json();
            const results = [];
            
            if (data.AbstractText) {
              results.push({
                title: data.AbstractTitle || "Résultat direct",
                description: data.AbstractText,
                url: data.AbstractURL,
                type: "instant"
              });
            }

            if (data.Results && data.Results.length > 0) {
              data.Results.slice(0, 5).forEach(result => {
                results.push({
                  title: result.Title,
                  description: result.Text,
                  url: result.FirstURL,
                  type: "search"
                });
              });
            }

            if (data.Topics && data.Topics.length > 0) {
              data.Topics.slice(0, 3).forEach(topic => {
                results.push({
                  title: topic.Name,
                  description: topic.FirstTopic,
                  url: topic.FirstURL,
                  type: "topic"
                });
              });
            }

            return {
              type: search.type,
              query: search.query,
              success: true,
              results: results.slice(0, 5)
            };
          } catch (error) {
            return { type: search.type, query: search.query, success: false, error: error.message };
          }
        })
      );

      setSearchResults({
        companyName,
        personName,
        siret: siretClean,
        clearbit: clearbitData,
        searches: searchResults,
        totalResults: searchResults.filter(s => s.success).length,
        hasClearbitData: !!clearbitData
      });

      setSearchLoading(false);
    } catch (error) {
      setSearchError(`Erreur lors des recherches: ${error.message}`);
      setSearchLoading(false);
    }
  };

  if (!row) return null;

  return (
    <>
      {/* Modal principale */}
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <Card className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <CardHeader className="border-b bg-gradient-to-r from-primary/10 to-primary/5">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle className="text-2xl">Détails du prospect</CardTitle>
                <CardDescription>
                  Modifiez les informations ou ajoutez au pipeline de prospection
                </CardDescription>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </CardHeader>

          {/* Content */}
          <ScrollArea className="flex-1">
            <CardContent className="p-6 space-y-6">
              {/* En-tête avec infos principales */}
              <Card className="bg-primary text-primary-foreground">
                <CardContent className="pt-6 space-y-4">
                  {getPersonName() && (
                    <p className="text-sm opacity-90 font-medium">{getPersonName()}</p>
                  )}

                  {getField("denominationunitelegale") && (
                    <h1 className="text-3xl font-bold">{getField("denominationunitelegale")}</h1>
                  )}
                  
                  {getField("siret") && (
                    <div className="flex items-center gap-3">
                      <a
                        href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${getField("siret").replace(/[\s.-]/g, "")}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:opacity-80 transition-opacity"
                        title="Voir sur l'Annuaire des Entreprises"
                      >
                        <Badge variant="secondary" className="font-mono text-sm gap-1.5 cursor-pointer">
                          <ExternalLink className="w-3 h-3" />
                          SIRET: {formatSiret(getField("siret"))}
                        </Badge>
                      </a>
                      <CopyButton
                        text={formatSiret(getField("siret"))}
                        label="SIRET"
                        className="text-xs"
                        onCopy={() => addToast("SIRET copié !", "success")}
                      />
                    </div>
                  )}

                  <Separator className="bg-primary-foreground/20" />

                  <div>
                    <p className="text-sm opacity-80">Forme juridique</p>
                    <p className="text-lg font-semibold">
                      {(() => {
                        const label = getJuridicalFormLabel(getField("categorieJuridiqueUniteLegale"));
                        if (!label || typeof label !== "string") return "N/A";
                        return label.split("(")[0].trim();
                      })()}
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* Informations détaillées */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Adresse */}
                {getFullAddressFromRow() && (
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <MapPin className="w-4 h-4" />
                        Adresse
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground/80 whitespace-pre-wrap">
                          {getFullAddressFromRow()}
                        </p>
                        <CopyButton
                          text={getFullAddressFromRow()}
                          label="Adresse"
                          className="text-xs shrink-0"
                          onCopy={() => addToast("Adresse copiée !", "success")}
                        />
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Date de création */}
                {getField("dateCreationEtablissement") && (
                  <Card className="bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Calendar className="w-4 h-4" />
                        Date de Création
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-xl font-semibold text-foreground">
                        {formatDate(getField("dateCreationEtablissement"))}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Activité Principale */}
                {getField("activitePrincipaleEtablissement") && (
                  <Card className="md:col-span-2 bg-card">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base flex items-center gap-2 text-foreground">
                        <Briefcase className="w-4 h-4" />
                        Secteur d'Activité
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <Badge variant="secondary">
                        Code APE : {getField("activitePrincipaleEtablissement")}
                      </Badge>
                      <p className="text-lg font-semibold text-foreground">
                        {getApeLabel(getField("activitePrincipaleEtablissement"))}
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </CardContent>
          </ScrollArea>

          {/* Footer */}
          <div className="border-t p-4 flex items-center justify-end gap-3 bg-muted/50">
            <Button
              onClick={handleAddToProspecting}
              disabled={addingToBoard}
              className="gap-2"
            >
              {addingToBoard ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Target className="w-4 h-4" />
              )}
              {addingToBoard ? 'Ajout...' : 'Ajouter aux pipelines'}
            </Button>
            <Button variant="secondary" onClick={onClose} disabled={addingToBoard}>
              Fermer
            </Button>
          </div>

          {/* Modal de sélection de tableaux */}
          <BoardSelectorModal
            isOpen={showBoardSelector}
            onClose={() => setShowBoardSelector(false)}
            boards={boards}
            selectedBoards={activeBoard ? [activeBoard.id] : []}
            onConfirm={handleAddToBoard}
            loading={addingToBoard}
          />
        </Card>
      </div>

      {/* Modal de recherche */}
      {showSearchModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
            <CardHeader className="border-b bg-gradient-to-r from-purple-500/10 to-purple-500/5">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Search className="w-5 h-5" />
                    Recherche Internet
                  </CardTitle>
                  <CardDescription>{searchResults?.companyName || ""}</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setShowSearchModal(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>
            </CardHeader>

            <ScrollArea className="flex-1">
              <CardContent className="p-6 space-y-4">
                {searchLoading && <ModalDetailsSkeleton />}

                {searchError && !searchLoading && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Information</AlertTitle>
                    <AlertDescription>{searchError}</AlertDescription>
                  </Alert>
                )}

                {searchResults && !searchLoading && (
                  <div className="space-y-4">
                    {/* Bouton Annuaire */}
                    {searchResults.siret && (
                      <Card className="bg-primary/10 border-primary/30">
                        <CardContent className="pt-6">
                          <h4 className="font-bold mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5" />
                            Annuaire officiel
                          </h4>
                          <Button asChild className="gap-2">
                            <a
                              href={`https://annuaire-entreprises.data.gouv.fr/etablissement/${searchResults.siret}`}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              <ExternalLink className="w-4 h-4" />
                              Consulter sur Annuaire Entreprises
                            </a>
                          </Button>
                        </CardContent>
                      </Card>
                    )}

                    {/* Données Clearbit */}
                    {searchResults.hasClearbitData && searchResults.clearbit && (
                      <Card className="bg-green-500/10 border-green-500/30">
                        <CardContent className="pt-6 space-y-4">
                          <h4 className="font-bold flex items-center gap-2">
                            <Globe className="w-5 h-5" />
                            Informations Clearbit
                          </h4>
                          
                          {searchResults.clearbit.description && (
                            <p className="text-sm text-muted-foreground">
                              {searchResults.clearbit.description}
                            </p>
                          )}
                          
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            {searchResults.clearbit.website && (
                              <div className="flex items-center gap-2">
                                <Globe className="w-4 h-4 text-muted-foreground" />
                                <a href={searchResults.clearbit.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline truncate">
                                  {searchResults.clearbit.website}
                                </a>
                              </div>
                            )}
                            
                            {searchResults.clearbit.email && (
                              <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4 text-muted-foreground" />
                                <a href={`mailto:${searchResults.clearbit.email}`} className="text-primary hover:underline">
                                  {searchResults.clearbit.email}
                                </a>
                              </div>
                            )}
                            
                            {searchResults.clearbit.phone && (
                              <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4 text-muted-foreground" />
                                <span>{searchResults.clearbit.phone}</span>
                              </div>
                            )}
                            
                            {searchResults.clearbit.employees && (
                              <div className="flex items-center gap-2">
                                <Users className="w-4 h-4 text-muted-foreground" />
                                <span>{searchResults.clearbit.employees} employés</span>
                              </div>
                            )}
                          </div>

                          {(searchResults.clearbit.linkedin || searchResults.clearbit.twitter) && (
                            <>
                              <Separator />
                              <div className="flex gap-2">
                                {searchResults.clearbit.linkedin && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={searchResults.clearbit.linkedin} target="_blank" rel="noopener noreferrer">
                                      <Linkedin className="w-4 h-4 mr-2" />
                                      LinkedIn
                                    </a>
                                  </Button>
                                )}
                                {searchResults.clearbit.twitter && (
                                  <Button variant="outline" size="sm" asChild>
                                    <a href={searchResults.clearbit.twitter} target="_blank" rel="noopener noreferrer">
                                      <Twitter className="w-4 h-4 mr-2" />
                                      Twitter
                                    </a>
                                  </Button>
                                )}
                              </div>
                            </>
                          )}
                        </CardContent>
                      </Card>
                    )}

                    {/* Résumé */}
                    <Card>
                      <CardContent className="pt-6 space-y-2 text-sm">
                        <h4 className="font-bold mb-3">Résumé des recherches</h4>
                        {searchResults.companyName && (
                          <p><Building2 className="w-4 h-4 inline mr-2" /><span className="font-medium">Entreprise :</span> {searchResults.companyName}</p>
                        )}
                        {searchResults.personName && (
                          <p><Users className="w-4 h-4 inline mr-2" /><span className="font-medium">Personne :</span> {searchResults.personName}</p>
                        )}
                        {searchResults.siret && (
                          <p className="font-mono"><span className="font-medium">SIRET :</span> {searchResults.siret}</p>
                        )}
                        <Badge variant="outline" className="mt-2">
                          <CheckCircle2 className="w-3 h-3 mr-1" />
                          {searchResults.totalResults} recherche(s) réussie(s)
                        </Badge>
                      </CardContent>
                    </Card>

                    {/* Résultats des recherches */}
                    {searchResults.searches && searchResults.searches.map((search, idx) => (
                      <Card key={idx}>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-sm flex items-center gap-2">
                            {search.success ? (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-destructive" />
                            )}
                            Recherche : <Badge variant="secondary">{search.type}</Badge>
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          {search.success && search.results && search.results.length > 0 ? (
                            <div className="space-y-2">
                              {search.results.map((result, resultIdx) => (
                                <div key={resultIdx} className="p-3 bg-muted/50 rounded-lg">
                                  <a
                                    href={result.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-primary hover:underline font-medium text-sm truncate block"
                                  >
                                    {result.title}
                                  </a>
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {result.description}
                                  </p>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <p className="text-sm text-muted-foreground">
                              {search.error || `Aucun résultat pour : ${search.query}`}
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </ScrollArea>

            <div className="border-t p-4 flex justify-end">
              <Button variant="outline" onClick={() => setShowSearchModal(false)}>
                Fermer
              </Button>
            </div>
          </Card>
        </div>
      )}
    </>
  );
}
