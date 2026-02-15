import { useState, useMemo, useEffect, useCallback } from "react";
import TagManager from "./TagManager";
import { CopyButton } from "../../utils/clipboard.jsx";
import { useToast } from "../../hooks/useToast";
import { useConfirm } from "../../hooks/useConfirm";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import { convertDateFormat } from "../../utils/date-formatter";
import { getJuridicalFormShort } from "../../data/juridical-forms";
import ConfirmDialog from "../ConfirmDialog";
import {
  getStatusColor,
  getStatusLabel,
  getDisplayName,
  getDisplaySubtitle,
} from "@/config/prospectConstants";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  X,
  User,
  Building2,
  Hash,
  Scale,
  Mail,
  Phone,
  Calendar,
  Briefcase,
  MapPin,
  FileText,
  Tag,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  ChevronLeft,
  Plus,
  Check,
  Loader2,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Helper pour extraire les données depuis le raw SIRENE
const extractSireneData = (raw) => {
  if (!raw || typeof raw !== 'object') return null;

  const getField = (candidates) => {
    const candidatesArray = Array.isArray(candidates) ? candidates : [candidates];
    for (const candidate of candidatesArray) {
      if (raw[candidate] !== undefined && raw[candidate] !== '_' && raw[candidate] !== null && raw[candidate] !== '') {
        return raw[candidate];
      }
      // Recherche insensible à la casse
      const lowerCandidate = candidate.toLowerCase();
      const foundKey = Object.keys(raw).find(k =>
        typeof k === 'string' && k.toLowerCase() === lowerCandidate
      );
      if (foundKey && raw[foundKey] !== undefined && raw[foundKey] !== '_' && raw[foundKey] !== null && raw[foundKey] !== '') {
        return raw[foundKey];
      }
    }
    return null;
  };

  // Construire le nom/prénom avec civilité M/F
  const buildName = () => {
    const civiliteCode = getField(["civilite", "civiliteUniteLegale"]);
    const nom = getField(["nom", "nomUniteLegale", "nomUsageUniteLegale"]);
    const prenom = getField(["prenom", "prenomUsuelUniteLegale"]);

    // Convertir M/F en Mr/Mme
    let civilite = null;
    if (civiliteCode && civiliteCode !== '_') {
      if (civiliteCode === 'M') civilite = 'Mr';
      else if (civiliteCode === 'F') civilite = 'Mme';
      else if (civiliteCode && civiliteCode.length > 1) civilite = civiliteCode; // Si déjà une civilité complète
    }

    const parts = [];
    if (civilite && civilite !== '_') parts.push(civilite);
    if (prenom && prenom !== '_') parts.push(prenom);
    if (nom && nom !== '_') parts.push(nom);

    return parts.length > 0 ? parts.join(' ') : null;
  };

  // Construire l'entreprise
  const buildCompany = () => {
    const denomination = getField(["denomination", "denominationUniteLegale", "denominationUsuelle1UniteLegale"]);
    if (denomination && denomination !== '_') return denomination;
    return null;
  };

  // Construire l'adresse complète
  const buildAddress = () => {
    const numeroVoie = getField(["numeroVoieEtablissement"]);
    const typeVoie = getField(["typeVoieEtablissement"]);
    const libelleVoie = getField(["libelleVoieEtablissement"]);
    const codePostal = getField(["codePostalEtablissement"]);
    const libelleCommune = getField(["libelleCommuneEtablissement"]);

    const addressParts = [];
    if (numeroVoie && numeroVoie !== '_') addressParts.push(numeroVoie);
    if (typeVoie && typeVoie !== '_') addressParts.push(typeVoie);
    if (libelleVoie && libelleVoie !== '_') addressParts.push(libelleVoie);
    if (codePostal && codePostal !== '_') {
      addressParts.push(codePostal);
      if (libelleCommune && libelleCommune !== '_') addressParts.push(libelleCommune);
    }

    return addressParts.length > 0 ? addressParts.join(' ') : null;
  };

  // Formatter la date de création en jj/mm/aaaa
  const formatCreationDate = () => {
    const dateStr = getField(["dateCreationEtablissement", "dateCreationUniteLegale"]);
    if (!dateStr || dateStr === '_') return null;

    // Si la date est au format YYYY-MM-DD, la convertir en DD/MM/YYYY
    if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    }

    // Sinon retourner la date brute
    return dateStr;
  };

  // Récupérer la forme juridique avec le mapping
  const getJuridicalForm = () => {
    const code = getField(["categorieJuridiqueUniteLegale"]);
    if (!code || code === '_') return null;
    return getJuridicalFormShort(code);
  };

  return {
    name: buildName(),
    company: buildCompany(),
    siret: getField(["siret", "siretetablissement"]),
    address: buildAddress(),
    creationDate: formatCreationDate(),
    juridicalForm: getJuridicalForm(),
    email: getField(["email", "mail", "courriel"]),
    phone: getField(["telephone", "tel", "phone"])
  };
};

export default function ProspectDetailsModal({
  prospect,
  allStatuses,
  board,
  onClose,
  onMove,
  onDelete,
  onAddContact,
  onUpdate,
  allProspects,
  onNavigate,
}) {
  const { user } = useAuth();
  const { confirm, isOpen: confirmIsOpen, confirmConfig, close: closeConfirm } = useConfirm();

  // Résoudre les statuts disponibles depuis allStatuses OU board.statuses
  const resolvedStatuses = allStatuses || board?.statuses || [];
  const [editMode, setEditMode] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [expandedContactId, setExpandedContactId] = useState(null);
  const [contactData, setContactData] = useState({
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [formData, setFormData] = useState(prospect);
  const [isSavingContact, setIsSavingContact] = useState(false);
  const { addToast } = useToast();

  // Navigation Précédent/Suivant
  const currentIndex = useMemo(() => {
    if (!allProspects || !prospect) return -1;
    return allProspects.findIndex((p) => p.id === prospect.id);
  }, [allProspects, prospect]);

  const canGoPrev = currentIndex > 0;
  const canGoNext = allProspects && currentIndex < allProspects.length - 1;

  const handlePrev = useCallback(() => {
    if (canGoPrev && onNavigate) onNavigate(allProspects[currentIndex - 1]);
  }, [canGoPrev, onNavigate, allProspects, currentIndex]);

  const handleNext = useCallback(() => {
    if (canGoNext && onNavigate) onNavigate(allProspects[currentIndex + 1]);
  }, [canGoNext, onNavigate, allProspects, currentIndex]);

  // Raccourcis clavier Prev/Next
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editMode || showContactForm) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); handlePrev(); }
      if (e.key === "ArrowRight") { e.preventDefault(); handleNext(); }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editMode, showContactForm, handlePrev, handleNext]);

  // Synchroniser formData avec les changements de prospect
  useEffect(() => {
    setFormData(prospect);
  }, [prospect]);

  const handleAddContact = async () => {
    setIsSavingContact(true);
    try {
      await onAddContact(prospect.id, "contact", contactData);
      // Mettre à jour l'état local du modal pour afficher le nouveau contact
      const newContact = {
        id: Date.now().toString(),
        name: contactData.name || "",
        email: contactData.email || "",
        phone: contactData.phone || "",
        notes: contactData.notes || "",
        date: new Date().toISOString(),
        type: "contact",
      };
      setFormData(prev => ({
        ...prev,
        contacts: [...(prev.contacts || []), newContact],
      }));
      addToast("✅ Contact ajouté avec succès!", "success");
      setContactData({ name: "", phone: "", email: "", notes: "" });
      setShowContactForm(false);
    } catch (error) {
      addToast("❌ Erreur lors de l'ajout du contact", "error");
    } finally {
      setIsSavingContact(false);
    }
  };

  const handleDeleteContact = async (contactId) => {
    try {
      // Si le contactId est un UUID Supabase, supprimer de la table contacts
      if (contactId && contactId.length > 10 && contactId.includes('-')) {
        const { error } = await supabase
          .from("contacts")
          .delete()
          .eq("id", contactId);

        if (error) {
          addToast("❌ Erreur lors de la suppression du contact", "error");
        } else {
          addToast("✅ Contact supprimé avec succès!", "success");
          // Mettre à jour l'état local
          const newContacts = formData.contacts.filter(contact => contact.id !== contactId);
          setFormData({ ...formData, contacts: newContacts });
          onUpdate({ ...formData, contacts: newContacts });
        }
      } else {
        // Sinon supprimer localement seulement
        const newContacts = formData.contacts.filter(contact => contact.id !== contactId);
        setFormData({ ...formData, contacts: newContacts });
        onUpdate({ ...formData, contacts: newContacts });
        addToast("✅ Contact supprimé localement", "success");
      }
    } catch (error) {
      addToast("❌ Erreur lors de la suppression du contact", "error");
    }
  };

  const handleSave = () => {
    onUpdate(formData);
    setEditMode(false);
  };

  // Extraire les données SIRENE depuis raw
  const sireneData = useMemo(() => {
    return extractSireneData(prospect.sireneRaw);
  }, [prospect.sireneRaw]);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 gap-0 overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 py-4 border-b bg-gradient-to-r from-primary/10 to-primary/5">
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <DialogTitle className="text-2xl truncate">{getDisplayName(prospect)}</DialogTitle>
              <DialogDescription>
                {getDisplaySubtitle(prospect) || "Détails du prospect"}
              </DialogDescription>
            </div>
            {/* Navigation Prev/Next */}
            {allProspects && allProspects.length > 1 && (
              <div className="flex items-center gap-1 ml-4">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handlePrev}
                  disabled={!canGoPrev}
                  title="Précédent (←)"
                  className="h-8 w-8"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {currentIndex + 1}/{allProspects.length}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleNext}
                  disabled={!canGoNext}
                  title="Suivant (→)"
                  className="h-8 w-8"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="flex-1 max-h-[calc(90vh-180px)]">
          <div className="p-6 space-y-6">
            {/* En-tête prospect - style SIRENE */}
            <Card className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground border-0">
              <CardContent className="p-6">
                <div className="space-y-3">
                  {prospect.name && (
                    <h1 className="text-3xl font-bold">{prospect.name}</h1>
                  )}
                  {prospect.company && (
                    <p className="text-lg opacity-90 font-semibold">{prospect.company}</p>
                  )}
                  <div className="pt-2 border-t border-primary-foreground/30">
                    <p className="opacity-80">Statut</p>
                    <Badge variant="secondary" className="mt-1 text-sm">
                      {getStatusLabel(prospect.status, resolvedStatuses)}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* SIRENE Information - EN PREMIER */}
            {sireneData && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5" />
                    Informations SIRENE
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {sireneData.name && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <User className="w-4 h-4" /> Identité
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sireneData.name}</span>
                          <CopyButton
                            text={sireneData.name}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("Nom copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {sireneData.company && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Building2 className="w-4 h-4" /> Entreprise
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sireneData.company}</span>
                          <CopyButton
                            text={sireneData.company}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("Entreprise copiée !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {sireneData.siret && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Hash className="w-4 h-4" /> SIRET
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-mono">{sireneData.siret}</span>
                          <CopyButton
                            text={sireneData.siret}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("SIRET copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {sireneData.juridicalForm && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Scale className="w-4 h-4" /> Forme juridique
                        </Label>
                        <span className="text-sm">{sireneData.juridicalForm}</span>
                      </div>
                    )}
                    {sireneData.email && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Mail className="w-4 h-4" /> Email SIRENE
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-primary">{sireneData.email}</span>
                          <CopyButton
                            text={sireneData.email}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("Email copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {sireneData.phone && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Phone className="w-4 h-4" /> Téléphone SIRENE
                        </Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{sireneData.phone}</span>
                          <CopyButton
                            text={sireneData.phone}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("Téléphone copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {sireneData.creationDate && (
                      <div className="space-y-1">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Calendar className="w-4 h-4" /> Date de création
                        </Label>
                        <span className="text-sm">{sireneData.creationDate}</span>
                      </div>
                    )}
                    {prospect.activityLabel && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <Briefcase className="w-4 h-4" /> Secteur d'activité
                        </Label>
                        <span className="text-sm">{prospect.activityLabel}</span>
                      </div>
                    )}
                    {sireneData.address && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="flex items-center gap-2 text-muted-foreground">
                          <MapPin className="w-4 h-4" /> Adresse
                        </Label>
                        <div className="flex items-start gap-2">
                          <span className="text-sm leading-relaxed flex-1">{sireneData.address}</span>
                          <a
                            href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(sireneData.address)}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Voir sur Google Maps"
                            className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary/80 shrink-0"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Maps
                          </a>
                          <CopyButton
                            text={sireneData.address}
                            label=""
                            className="text-xs px-1.5 py-0.5"
                            onCopy={() => addToast("Adresse copiée !", "success")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Section informations de contact prospect */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Phone className="w-5 h-5" />
                  Contact Prospect
                </CardTitle>
              </CardHeader>
              <CardContent>
                {prospect.email || prospect.phone ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {prospect.email && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Email</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{prospect.email}</span>
                          <CopyButton
                            text={prospect.email}
                            label="Email"
                            className="text-xs px-2 py-1"
                            onCopy={() => addToast("Email copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                    {prospect.phone && (
                      <div className="space-y-1">
                        <Label className="text-muted-foreground">Téléphone</Label>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{prospect.phone}</span>
                          <CopyButton
                            text={prospect.phone}
                            label="Tél"
                            className="text-xs px-2 py-1"
                            onCopy={() => addToast("Téléphone copié !", "success")}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground italic">Aucune information de contact disponible</p>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            {!editMode && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Tag className="w-5 h-5" />
                    Tags
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <TagManager
                    prospect={formData}
                    onUpdateTags={(newTags) => {
                      const updatedFormData = { ...formData, tags: newTags };
                      setFormData(updatedFormData);
                      onUpdate(updatedFormData);
                    }}
                  />
                </CardContent>
              </Card>
            )}

            {/* Edition mode */}
            {editMode && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Pencil className="w-5 h-5" />
                    Modification
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Nom</Label>
                        <Input
                          value={formData.name || ""}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Nom du prospect"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Entreprise</Label>
                        <Input
                          value={formData.company || ""}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Nom de l'entreprise"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Email</Label>
                        <Input
                          type="email"
                          value={formData.email || ""}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="email@exemple.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Téléphone</Label>
                        <Input
                          type="tel"
                          value={formData.phone || ""}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+33 6 12 34 56 78"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Statut</Label>
                      <Select
                        value={formData.status}
                        onValueChange={(value) => setFormData({ ...formData, status: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {resolvedStatuses && resolvedStatuses.map((s) => {
                            const statusId = typeof s === 'object' ? s.id : s;
                            const statusLbl = typeof s === 'object' ? `${s.icon} ${s.label}` : s;
                            return (
                              <SelectItem key={statusId} value={statusId}>
                                {statusLbl}
                              </SelectItem>
                            );
                          })}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Notes</Label>
                      <Textarea
                        value={formData.notes || ""}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        rows={3}
                        placeholder="Ajouter des notes..."
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}


            {showContactForm && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Phone className="w-5 h-5" />
                    Ajouter un contact
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Nom/Prénom */}
                    <div className="space-y-2">
                      <Label>Nom / Prénom</Label>
                      <Input
                        type="text"
                        placeholder={prospect.name || "Jean Dupont"}
                        value={contactData.name}
                        onChange={(e) => setContactData({ ...contactData, name: e.target.value })}
                      />
                    </div>

                    {/* Email */}
                    <div className="space-y-2">
                      <Label>Email</Label>
                      <Input
                        type="email"
                        placeholder={prospect.email || "jean@example.com"}
                        value={contactData.email}
                        onChange={(e) => setContactData({ ...contactData, email: e.target.value })}
                      />
                    </div>

                    {/* Téléphone */}
                    <div className="space-y-2">
                      <Label>Téléphone</Label>
                      <Input
                        type="tel"
                        placeholder={prospect.phone || "+33 6 12 34 56 78"}
                        value={contactData.phone}
                        onChange={(e) => setContactData({ ...contactData, phone: e.target.value })}
                      />
                    </div>

                    {/* Notes / Description */}
                    <div className="space-y-2">
                      <Label>Notes du contact</Label>
                      <Textarea
                        placeholder="Détails de l'interaction, points discutés, suite à donner…"
                        value={contactData.notes}
                        onChange={(e) => setContactData({ ...contactData, notes: e.target.value })}
                        rows={4}
                      />
                    </div>

                    {/* Boutons d'action */}
                    <div className="flex gap-3 pt-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setShowContactForm(false);
                          setContactData({ name: "", phone: "", email: "", notes: "" });
                        }}
                        className="flex-1"
                      >
                        Annuler
                      </Button>
                      <Button
                        type="button"
                        onClick={handleAddContact}
                        disabled={isSavingContact}
                        className="flex-1 bg-green-600 hover:bg-green-700"
                      >
                        {isSavingContact ? (
                          <>
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            Ajout en cours...
                          </>
                        ) : (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Ajouter le contact
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Contact Information */}
            {!showContactForm && formData.contacts && formData.contacts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between text-base">
                    <span className="flex items-center gap-2">
                      <Phone className="w-5 h-5" />
                      Historique des contacts
                    </span>
                    <Badge variant="secondary">{formData.contacts.length}</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {formData.contacts.map((contact, idx) => (
                    <Collapsible
                      key={`contact-${idx}`}
                      open={expandedContactId === idx}
                      onOpenChange={() => setExpandedContactId(expandedContactId === idx ? null : idx)}
                    >
                      <div className="border rounded-lg overflow-hidden">
                        <CollapsibleTrigger asChild>
                          <button
                            type="button"
                            className="w-full bg-muted/50 hover:bg-muted px-3 py-2 flex items-center justify-between transition cursor-pointer"
                          >
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4 text-muted-foreground" />
                              <div className="text-left">
                                <p className="font-medium text-sm">{contact.name || "Sans nom"}</p>
                                <p className="text-muted-foreground text-xs">
                                  {new Date(contact.date).toLocaleDateString("fr-FR")}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6 text-destructive hover:text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const contactToDelete = formData.contacts[idx];
                                  if (contactToDelete) {
                                    confirm({
                                      title: "Supprimer le contact",
                                      message: `Voulez-vous vraiment supprimer le contact "${contactToDelete.name || 'Sans nom'}" ?`,
                                      onConfirm: () => handleDeleteContact(contactToDelete.id),
                                    });
                                  }
                                }}
                                title="Supprimer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                              {expandedContactId === idx ? (
                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                              )}
                            </div>
                          </button>
                        </CollapsibleTrigger>

                        <CollapsibleContent>
                          <div className="bg-muted/30 px-3 py-3 border-t space-y-2">
                            {contact.email && (
                              <div className="flex items-center gap-2 text-xs">
                                <Mail className="w-3 h-3 text-muted-foreground" />
                                <span className="flex-1">{contact.email}</span>
                                <CopyButton
                                  text={contact.email}
                                  label=""
                                  className="text-xs px-1.5 py-0.5"
                                  onCopy={() => addToast("Email copié !", "success")}
                                />
                              </div>
                            )}
                            {contact.phone && (
                              <div className="flex items-center gap-2 text-xs">
                                <Phone className="w-3 h-3 text-muted-foreground" />
                                <span className="flex-1">{contact.phone}</span>
                                <CopyButton
                                  text={contact.phone}
                                  label=""
                                  className="text-xs px-1.5 py-0.5"
                                  onCopy={() => addToast("Téléphone copié !", "success")}
                                />
                              </div>
                            )}
                            {contact.notes && (
                              <div className="pt-2 border-t">
                                <p className="text-muted-foreground text-xs leading-relaxed">{contact.notes}</p>
                              </div>
                            )}
                          </div>
                        </CollapsibleContent>
                      </div>
                    </Collapsible>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Bouton Ajouter un contact */}
            {!showContactForm && (
              <Button
                type="button"
                onClick={() => setShowContactForm(true)}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un contact
              </Button>
            )}

            {/* Notes du prospect */}
            {!editMode && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <FileText className="w-5 h-5" />
                    Notes du prospect
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{prospect.notes || "Aucune note"}</p>
                </CardContent>
              </Card>
            )}
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="border-t px-6 py-4 gap-2">
          {editMode ? (
            <>
              <Button
                onClick={() => {
                  setEditMode(false);
                  setFormData(prospect);
                }}
                variant="outline"
              >
                Annuler
              </Button>
              <Button
                onClick={handleSave}
                className="bg-green-600 hover:bg-green-700"
              >
                <Check className="w-4 h-4 mr-2" />
                Enregistrer
              </Button>
            </>
          ) : (
            <>
              <Button
                onClick={() => setEditMode(true)}
                variant="outline"
              >
                <Pencil className="w-4 h-4 mr-2" />
                Modifier
              </Button>
              <Button
                onClick={() => {
                  confirm({
                    title: "Supprimer le prospect",
                    message: `Voulez-vous vraiment supprimer "${getDisplayName(prospect)}" ? Cette action est irréversible.`,
                    onConfirm: onDelete,
                  });
                }}
                variant="destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Supprimer
              </Button>
            </>
          )}
        </DialogFooter>

        {/* Dialogue de confirmation */}
        <ConfirmDialog
          isOpen={confirmIsOpen}
          onClose={closeConfirm}
          onCancel={closeConfirm}
          onConfirm={() => {
            confirmConfig?.onConfirm?.();
            closeConfirm();
          }}
          title={confirmConfig?.title}
          message={confirmConfig?.message}
          type="danger"
        />
      </DialogContent>
    </Dialog>
  );
}
