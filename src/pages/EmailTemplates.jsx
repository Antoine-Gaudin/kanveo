import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useSettings } from "../hooks/useSettings";
import useKanbanBoards from "../hooks/useKanbanBoards";
import EmailModal from "../components/prospecting/EmailModal";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../components/ui/dialog";
import {
  FileText,
  Plus,
  Pencil,
  Trash2,
  Save,
  X,
  Info,
  CheckCircle2,
  Mail,
  BookOpen,
  ArrowRight,
  Send,
  Megaphone,
  ChevronLeft,
} from "lucide-react";
import { cn } from "../lib/utils";

// ──────────────────────────────
// Variables disponibles pour les templates
// ──────────────────────────────
const AVAILABLE_VARIABLES = [
  { key: "firstName",     label: "Prénom" },
  { key: "lastName",      label: "Nom" },
  { key: "company",       label: "Entreprise" },
  { key: "sector",        label: "Secteur" },
  { key: "email",         label: "Email" },
  { key: "phone",         label: "Téléphone" },
  { key: "address",       label: "Adresse" },
  { key: "city",          label: "Ville" },
  { key: "postalCode",    label: "Code postal" },
  { key: "juridicalForm", label: "Forme juridique" },
  { key: "siret",         label: "SIRET" },
  { key: "activityCode",  label: "Code APE" },
  { key: "creationDate",  label: "Date création" },
  { key: "status",        label: "Statut pipeline" },
  { key: "notes",         label: "Notes" },
  { key: "tags",          label: "Tags" },
  { key: "content",       label: "Contenu libre" },
];

// Données fictives pour la prévisualisation
const PREVIEW_DATA = {
  firstName: "Jean", lastName: "Dupont", company: "SARL Dupont & Fils",
  sector: "Bâtiment - Travaux publics", email: "j.dupont@email.fr",
  phone: "06 12 34 56 78", address: "12 rue de la Paix", city: "Lyon",
  postalCode: "69001", juridicalForm: "SARL", siret: "12345678901234",
  activityCode: "43.21A", creationDate: "15/03/2010", status: "prospect",
  notes: "À rappeler lundi", tags: "BTP, urgent",
  content: "[Votre texte personnalisé]",
};

function previewReplace(text) {
  if (!text) return "";
  let result = text;
  // 1) Parameterized variables: {{key : "default"}} → use PREVIEW_DATA value (or default if empty)
  result = result.replace(
    /\{\{(\w+)\s*:\s*(?:"([^"]*)"|'([^']*)'|([^}]*))\}\}/g,
    (_, key, dq, sq, uq) => {
      const val = PREVIEW_DATA[key];
      const fallback = dq ?? sq ?? uq?.trim() ?? "";
      return val || fallback;
    }
  );
  // 2) Simple variables: {{key}}
  result = Object.entries(PREVIEW_DATA).reduce(
    (acc, [key, val]) => acc.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), val),
    result
  );
  return result;
}

export default function EmailTemplates() {
  const { settings, updateSettings } = useSettings();
  const { boards, activeBoard } = useKanbanBoards();

  const [editingTemplate, setEditingTemplate] = useState(null);
  const [templateForm, setTemplateForm] = useState({ title: "", subject: "", body: "" });
  const [templateSuccess, setTemplateSuccess] = useState(false);

  // ── Campaign state ──
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [campaignTemplate, setCampaignTemplate] = useState(null);

  const userTemplates = settings?.emailTemplates || [];

  // ── Campaign launch handler (direct from template list) ──
  const handleLaunchCampaign = (template) => {
    setCampaignTemplate(template);
    setShowCampaignModal(true);
  };

  // ── Handlers ────────────────────
  const handleSaveTemplate = () => {
    if (!templateForm.title.trim() || !templateForm.body.trim()) return;

    const newTemplate = {
      id: editingTemplate === "new" ? `custom_${Date.now()}` : editingTemplate.id,
      title: templateForm.title.trim(),
      subject: templateForm.subject.trim(),
      body: templateForm.body.trim(),
      isCustom: true,
      updatedAt: new Date().toISOString(),
    };

    let updatedTemplates;
    if (editingTemplate === "new") {
      updatedTemplates = [...userTemplates, newTemplate];
    } else {
      updatedTemplates = userTemplates.map((t) => (t.id === newTemplate.id ? newTemplate : t));
    }

    updateSettings({ emailTemplates: updatedTemplates });
    setEditingTemplate(null);
    setTemplateForm({ title: "", subject: "", body: "" });
    setTemplateSuccess(true);
    setTimeout(() => setTemplateSuccess(false), 3000);
  };

  const handleDeleteTemplate = (templateId) => {
    const updatedTemplates = userTemplates.filter((t) => t.id !== templateId);
    updateSettings({ emailTemplates: updatedTemplates });
  };

  const handleEditTemplate = (template) => {
    setEditingTemplate(template);
    setTemplateForm({ title: template.title, subject: template.subject || "", body: template.body });
  };

  const handleInsertVariable = (varKey, field = "body") => {
    setTemplateForm((prev) => ({
      ...prev,
      [field]: prev[field] + `{{${varKey}}}`,
    }));
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <Card className="max-w-md w-full mx-4 shadow-lg border-primary/20">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
            <Info className="h-7 w-7 text-primary" />
          </div>
          <CardTitle className="text-xl">En cours de développement</CardTitle>
          <CardDescription className="text-sm mt-1">
            Cette fonctionnalité est actuellement en cours de développement et sera bientôt disponible.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex justify-center pt-2 pb-6">
          <Button asChild>
            <Link to="/prospecting">Retour à la prospection</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  // ── Le reste du composant est désactivé pendant le développement ──
  // eslint-disable-next-line no-unreachable
  return (
    <div className="space-y-6 max-w-5xl mx-auto relative">
      {/* ====== HEADER ====== */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-3">
            <Mail className="h-7 w-7 text-primary" />
            Templates Email
          </h1>
          <p className="text-muted-foreground text-sm mt-1">
            Créez et gérez vos modèles d'email réutilisables avec des variables dynamiques.
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild className="gap-2">
            <Link to="/docs">
              <BookOpen className="h-4 w-4" />
              Voir la documentation
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          {editingTemplate === null && (
            <Button
              onClick={() => {
                setEditingTemplate("new");
                setTemplateForm({ title: "", subject: "", body: "" });
              }}
              variant="outline"
              className="gap-2"
            >
              <Plus className="h-4 w-4" />
              Nouveau template
            </Button>
          )}
          <Button
            onClick={() => setShowCampaignModal(true)}
            className="gap-2"
          >
            <Megaphone className="h-4 w-4" />
            Lancer une campagne
          </Button>
        </div>
      </div>

      {/* ====== FORMULAIRE CRÉATION / ÉDITION ====== */}
      {editingTemplate !== null && (
        <Card className="border-2 border-primary/30">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">
                {editingTemplate === "new" ? "Nouveau template" : `Modifier « ${editingTemplate.title} »`}
              </CardTitle>
              <Button
                size="icon"
                variant="ghost"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ title: "", subject: "", body: "" });
                }}
                className="h-8 w-8"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-5">
            {/* Variables rapides */}
            <div className="p-3 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-2">
                <Info className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-medium text-foreground">Variables — cliquez pour insérer dans le corps</p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {AVAILABLE_VARIABLES.map((v) => (
                  <Badge
                    key={v.key}
                    variant="secondary"
                    className={`text-xs font-mono cursor-pointer hover:bg-primary/20 transition-colors ${v.key === "content" ? "border-purple-500/50 text-purple-600 dark:text-purple-400" : ""}`}
                    title={v.label}
                    onClick={() => handleInsertVariable(v.key, "body")}
                  >
                    {`{{${v.key}}}`}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Champs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tpl-title">Nom du template *</Label>
                <Input
                  id="tpl-title"
                  value={templateForm.title}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, title: e.target.value }))}
                  placeholder="Ex : Relance prestation web"
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="tpl-subject">Objet de l'email</Label>
                  <div className="flex gap-1 flex-wrap">
                    {AVAILABLE_VARIABLES.filter(v => !["content","notes","tags"].includes(v.key)).slice(0, 5).map((v) => (
                      <Button
                        key={v.key}
                        type="button"
                        size="sm"
                        variant="ghost"
                        onClick={() => handleInsertVariable(v.key, "subject")}
                        className="h-6 text-xs font-mono px-1.5 text-muted-foreground"
                        title={`Insérer {{${v.key}}} dans l'objet`}
                      >
                        {v.label}
                      </Button>
                    ))}
                  </div>
                </div>
                <Input
                  id="tpl-subject"
                  value={templateForm.subject}
                  onChange={(e) => setTemplateForm((f) => ({ ...f, subject: e.target.value }))}
                  placeholder="Ex : Proposition pour {{company}}"
                  className="font-mono text-sm"
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="tpl-body">Corps du message *</Label>
                <div className="flex gap-1 flex-wrap">
                  {AVAILABLE_VARIABLES.map((v) => (
                    <Button
                      key={v.key}
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => handleInsertVariable(v.key, "body")}
                      className={`h-7 text-xs font-mono px-2 ${v.key === "content" ? "text-purple-500 font-semibold" : ""}`}
                      title={`Insérer {{${v.key}}}`}
                    >
                      {v.label}
                    </Button>
                  ))}
                </div>
              </div>
              <Textarea
                id="tpl-body"
                value={templateForm.body}
                onChange={(e) => setTemplateForm((f) => ({ ...f, body: e.target.value }))}
                placeholder={"Bonjour {{firstName}},\n\n{{content}}\n\nCordialement"}
                rows={10}
                className="font-mono text-sm resize-none"
              />
            </div>

            {/* Prévisualisation */}
            {(templateForm.subject || templateForm.body) && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Aperçu (avec données fictives)</Label>
                <div className="p-4 rounded-lg bg-background border text-sm space-y-2">
                  {templateForm.subject && (
                    <div>
                      <span className="text-xs text-muted-foreground">Objet : </span>
                      <span className="font-medium">{previewReplace(templateForm.subject)}</span>
                    </div>
                  )}
                  {templateForm.subject && templateForm.body && <Separator />}
                  {templateForm.body && (
                    <div className="whitespace-pre-wrap">{previewReplace(templateForm.body)}</div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center gap-3">
              <Button onClick={handleSaveTemplate} disabled={!templateForm.title.trim() || !templateForm.body.trim()}>
                <Save className="h-4 w-4 mr-2" />
                {editingTemplate === "new" ? "Créer le template" : "Enregistrer"}
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  setEditingTemplate(null);
                  setTemplateForm({ title: "", subject: "", body: "" });
                }}
              >
                Annuler
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* ====== LISTE DES TEMPLATES ====== */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            <FileText className="h-5 w-5 text-primary" />
            <div>
              <CardTitle>Mes templates ({userTemplates.length})</CardTitle>
              <CardDescription>
                {userTemplates.length === 0
                  ? "Aucun template pour l'instant. Créez-en un pour gagner du temps !"
                  : "Cliquez sur un template pour le modifier, ou créez-en un nouveau."}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {userTemplates.length === 0 && editingTemplate === null ? (
            <div className="text-center py-12 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-20" />
              <p className="text-sm font-medium">Aucun template personnalisé</p>
              <p className="text-xs mt-1 mb-4">
                Créez votre premier template pour envoyer des emails personnalisés en un clic.
              </p>
              <Button
                onClick={() => {
                  setEditingTemplate("new");
                  setTemplateForm({ title: "", subject: "", body: "" });
                }}
                variant="outline"
                className="gap-2"
              >
                <Plus className="h-4 w-4" />
                Créer un template
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {userTemplates.map((template) => (
                <div
                  key={template.id}
                  className="flex items-start justify-between p-4 rounded-lg border bg-card hover:border-primary/30 hover:shadow-sm transition-all cursor-pointer"
                  onClick={() => handleEditTemplate(template)}
                >
                  <div className="flex-1 min-w-0 mr-4">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-medium text-sm text-foreground">{template.title}</p>
                      <Badge variant="outline" className="text-xs">Personnalisé</Badge>
                      {template.updatedAt && (
                        <span className="text-xs text-muted-foreground">
                          — modifié le{" "}
                          {new Date(template.updatedAt).toLocaleDateString("fr-FR", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      )}
                    </div>
                    {template.subject && (
                      <p className="text-xs text-muted-foreground mb-1">
                        <span className="font-medium">Objet :</span> {template.subject}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground line-clamp-2 font-mono">{template.body}</p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <Button size="sm" variant="outline" onClick={() => handleLaunchCampaign(template)} className="h-8 gap-1.5 text-xs" title="Lancer une campagne">
                      <Send className="h-3.5 w-3.5 text-primary" />
                      Campagne
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleEditTemplate(template)} className="h-8 w-8" title="Modifier">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDeleteTemplate(template.id)} className="h-8 w-8 text-destructive hover:text-destructive" title="Supprimer">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {templateSuccess && (
            <div className="mt-4">
              <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Template sauvegardé avec succès
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ====== CAMPAIGN WIZARD MODAL ====== */}
      <CampaignWizardModal
        open={showCampaignModal}
        onOpenChange={(val) => {
          setShowCampaignModal(val);
          if (!val) setCampaignTemplate(null);
        }}
        userTemplates={userTemplates}
        boards={boards}
        activeBoard={activeBoard}
        initialTemplate={campaignTemplate}
      />
    </div>
  );
}

/**
 * CampaignWizardModal — 2-step flow:
 *  Step 1 → Pick a template from the user's own templates
 *  Step 2 → Edit / adjust subject & body, preview, then launch EmailModal
 */
const DEFAULT_MODELS = [
  {
    id: "model_initial",
    title: "Premier contact",
    subject: "Prise de contact — {{company}}",
    body: "Bonjour {{firstName}},\n\nJe me permets de vous contacter au sujet de {{company}}.\n\nNous serions ravis d'échanger avec vous sur une éventuelle collaboration.\n\nCordialement,",
    isModel: true,
  },
  {
    id: "model_followup",
    title: "Relance",
    subject: "Suivi — {{company}}",
    body: "Bonjour {{firstName}},\n\nSuite à mon précédent message, je souhaitais savoir si vous aviez eu l'occasion d'y réfléchir.\n\nJe reste disponible pour en discuter.\n\nCordialement,",
    isModel: true,
  },
  {
    id: "model_rdv",
    title: "Proposition de RDV",
    subject: "Rendez-vous — {{company}}",
    body: "Bonjour {{firstName}},\n\nSeriez-vous disponible pour un court échange cette semaine ou la suivante ?\n\nJe m'adapte à votre planning.\n\nCordialement,",
    isModel: true,
  },
];

function CampaignWizardModal({ open, onOpenChange, userTemplates, boards, activeBoard, initialTemplate }) {
  const [step, setStep] = useState(1);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editedSubject, setEditedSubject] = useState("");
  const [editedBody, setEditedBody] = useState("");
  const [showEmailModal, setShowEmailModal] = useState(false);

  const hasCustomTemplates = userTemplates.length > 0;

  // When modal opens with an initialTemplate, skip to step 2
  useEffect(() => {
    if (open && initialTemplate) {
      setSelectedTemplate(initialTemplate);
      setEditedSubject(initialTemplate.subject || "");
      setEditedBody(initialTemplate.body || "");
      setStep(2);
    }
  }, [open, initialTemplate]);

  const handleOpenChange = (val) => {
    if (!val) {
      setStep(1);
      setSelectedTemplate(null);
      setEditedSubject("");
      setEditedBody("");
    }
    onOpenChange(val);
  };

  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template);
    setEditedSubject(template.subject || "");
    setEditedBody(template.body || "");
    setStep(2);
  };

  const handleBack = () => {
    setStep(1);
    setSelectedTemplate(null);
  };

  const handleLaunch = () => {
    handleOpenChange(false);
    setShowEmailModal(true);
  };

  const campaignPayload = selectedTemplate
    ? { ...selectedTemplate, subject: editedSubject, body: editedBody }
    : null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Megaphone className="h-5 w-5 text-primary" />
              {step === 1 ? "Choisir un template" : "Personnaliser avant envoi"}
            </DialogTitle>
            <DialogDescription>
              {step === 1
                ? "Sélectionnez l'un de vos templates comme base pour la campagne."
                : "Ajustez l'objet et le contenu si nécessaire, puis lancez la campagne."}
            </DialogDescription>
          </DialogHeader>

          {/* ── STEP 1 : Template picker ── */}
          {step === 1 && (
            <div className="space-y-4 mt-2">
              {/* User's own templates */}
              {hasCustomTemplates && (
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Mes templates</p>
                  {userTemplates.map((tpl) => (
                    <TemplatePicker key={tpl.id} template={tpl} onSelect={handleSelectTemplate} />
                  ))}
                </div>
              )}

              {/* Default models — always visible as fallback / inspiration */}
              <div className="space-y-2">
                {hasCustomTemplates && (
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Modèles prêts à l'emploi</p>
                )}
                {!hasCustomTemplates && (
                  <p className="text-xs text-muted-foreground">Vous n'avez pas encore de template. Utilisez un modèle ci-dessous et personnalisez-le avant l'envoi.</p>
                )}
                {DEFAULT_MODELS.map((tpl) => (
                  <TemplatePicker key={tpl.id} template={tpl} onSelect={handleSelectTemplate} isModel />
                ))}
              </div>
            </div>
          )}

          {/* ── STEP 2 : Edit & preview ── */}
          {step === 2 && selectedTemplate && (
            <div className="space-y-4 mt-2">
              <Button variant="ghost" size="sm" onClick={handleBack} className="gap-1 -ml-2 text-muted-foreground">
                <ChevronLeft className="h-4 w-4" />
                Changer de template
              </Button>

              <div className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="camp-subject">Objet</Label>
                  <Input
                    id="camp-subject"
                    value={editedSubject}
                    onChange={(e) => setEditedSubject(e.target.value)}
                    placeholder="Objet de l'email"
                    className="font-mono text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="camp-body">Corps du message</Label>
                  <Textarea
                    id="camp-body"
                    value={editedBody}
                    onChange={(e) => setEditedBody(e.target.value)}
                    rows={8}
                    className="font-mono text-sm resize-none"
                  />
                </div>
              </div>

              {/* Preview */}
              {(editedSubject || editedBody) && (
                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">Aperçu (données fictives)</Label>
                  <div className="p-3 rounded-lg bg-muted/40 border text-sm space-y-1.5">
                    {editedSubject && (
                      <div>
                        <span className="text-xs text-muted-foreground">Objet : </span>
                        <span className="font-medium">{previewReplace(editedSubject)}</span>
                      </div>
                    )}
                    {editedSubject && editedBody && <Separator />}
                    {editedBody && (
                      <div className="whitespace-pre-wrap text-sm">{previewReplace(editedBody)}</div>
                    )}
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <Button variant="outline" onClick={() => handleOpenChange(false)}>Annuler</Button>
                <Button onClick={handleLaunch} disabled={!editedBody.trim()} className="gap-2">
                  <Send className="h-4 w-4" />
                  Choisir les prospects
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* EmailModal opens after wizard completes */}
      <EmailModal
        open={showEmailModal}
        onOpenChange={setShowEmailModal}
        boards={boards}
        activeBoard={activeBoard}
        allProspects={[]}
        campaignTemplate={campaignPayload}
      />
    </>
  );
}

/** Small reusable row for template / model selection */
function TemplatePicker({ template, onSelect, isModel = false }) {
  return (
    <button
      onClick={() => onSelect(template)}
      className={cn(
        "w-full text-left p-4 rounded-lg border transition-all group",
        isModel
          ? "border-dashed border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-primary/5"
      )}
    >
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <FileText className={cn("h-4 w-4", isModel ? "text-primary/60" : "text-muted-foreground")} />
          <span className="font-medium text-sm">{template.title}</span>
          {isModel && (
            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
              Modèle
            </Badge>
          )}
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      {template.subject && (
        <p className="text-xs text-muted-foreground truncate">
          <span className="font-medium">Objet :</span> {template.subject}
        </p>
      )}
      <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">{template.body}</p>
    </button>
  );
}
