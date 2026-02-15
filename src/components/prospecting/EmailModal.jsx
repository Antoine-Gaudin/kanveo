// src/components/prospecting/EmailModal.jsx
import { useState, useMemo, useEffect, useCallback } from "react";
import { useSettings } from "../../hooks/useSettings";
import { useAuth } from "../../context/AuthContext";
import { supabase } from "../../lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Mail,
  Send,
  Copy,
  Check,
  FileText,
  Users,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  MessageSquare,
  Filter,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

// Templates prédéfinis
const TEMPLATES = [
  {
    id: "initial",
    title: "Premier contact",
    subject: "Prise de contact — {{company}}",
    body: `Bonjour {{firstName}},

Je vous contacte suite à l'intérêt manifesté pour {{company}}.

Nous serions heureux de discuter ensemble de comment nous pourrions collaborer.

Cordialement,`,
  },
  {
    id: "followup1",
    title: "Premier suivi",
    subject: "Suivi — {{company}}",
    body: `Bonjour {{firstName}},

Suite à notre contact précédent, j'aimerais relancer auprès de vous concernant {{company}}.

Avez-vous eu un moment pour y réfléchir ?

Cordialement,`,
  },
  {
    id: "followup2",
    title: "Deuxième suivi",
    subject: "Relance — {{company}}",
    body: `Bonjour {{firstName}},

Je remarque que {{company}} opère dans le secteur {{sector}}, un domaine qui nous intéresse particulièrement.

Pensez-vous qu'une discussion serait pertinente ?

Cordialement,`,
  },
  {
    id: "proposal",
    title: "Proposition de RDV",
    subject: "Proposition de rendez-vous — {{company}}",
    body: `Bonjour {{firstName}},

Suite à nos échanges, je vous propose un rendez-vous pour présenter notre solution en détail.

Seriez-vous disponible la semaine prochaine ?

Cordialement,`,
  },
];

// ── Interpolation ───────────────────────
// Supports parameterized syntax: {{variable : "default value"}}
// {{content : "Au fait j'ai trouvé cette info {{firstName}}"}}
// All variables can have a fallback: {{phone : "non renseigné"}}
function interpolateTemplate(text, prospect, contentValue = "") {
  if (!text) return "";
  const vars = {
    firstName: prospect?.name?.split(" ")[0] || prospect?.company?.split(" ")[0] || "",
    lastName: prospect?.name?.split(" ").slice(1).join(" ") || "",
    company: prospect?.company || "",
    sector: prospect?.sector || prospect?.activityLabel || "",
    email: prospect?.email || "",
    phone: prospect?.phone || "",
    address: prospect?.address || "",
    city: prospect?.city || "",
    postalCode: prospect?.postalCode || "",
    juridicalForm: prospect?.juridicalForm || "",
    siret: prospect?.siret || "",
    activityCode: prospect?.activityCode || "",
    creationDate: prospect?.creationDate || prospect?.creation_date || "",
    status: prospect?.status || "",
    notes: prospect?.notes || "",
    tags: Array.isArray(prospect?.tags) ? prospect.tags.join(", ") : (prospect?.tags || ""),
    content: contentValue || "",
  };

  let result = text;

  // 1. Handle parameterized variables: {{key : "default value"}}
  //    Match {{key : "..."}} or {{key : '...'}} or {{key : ...}}
  result = result.replace(
    /\{\{(\w+)\s*:\s*"([^"]*)"\}\}|\{\{(\w+)\s*:\s*'([^']*)'\}\}|\{\{(\w+)\s*:\s*([^}]*)\}\}/g,
    (match, k1, v1, k2, v2, k3, v3) => {
      const key = k1 || k2 || k3;
      const fallback = (v1 ?? v2 ?? v3 ?? "").trim();
      const prospectValue = vars[key];
      // Use prospect value if available, otherwise use fallback
      const resolved = prospectValue || fallback;
      return resolved;
    }
  );

  // 2. Handle simple variables: {{key}}
  Object.entries(vars).forEach(([key, value]) => {
    result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value);
  });

  // 3. Remove any remaining unknown {{...}}
  result = result.replace(/\{\{[^}]+\}\}/g, "");
  return result;
}

// ── Email resolution ────────────────────
function resolveEmail(prospect) {
  if (prospect?.email) return prospect.email;
  if (prospect?.contacts?.length > 0) {
    const contactWithEmail = prospect.contacts.find((c) => c.email);
    if (contactWithEmail) return contactWithEmail.email;
  }
  return "";
}

// ── Mailto builder ──────────────────────
function buildMailtoUrl(to, subject, body) {
  const params = new URLSearchParams();
  if (subject) params.set("subject", subject);
  if (body) params.set("body", body);
  const query = params.toString();
  return `mailto:${encodeURIComponent(to)}${query ? "?" + query : ""}`;
}

// ── Helper: detect if template uses {{content}} ──
function templateUsesContent(subject, body) {
  return /\{\{content\}\}/i.test(subject || "") || /\{\{content\}\}/i.test(body || "");
}

// ── Helper: get board columns ──
function getBoardColumns(board) {
  if (!board?.statuses) return [];
  const statuses = board.statuses;
  if (statuses.length > 0 && typeof statuses[0] === "object") {
    return statuses;
  }
  const defaultLabels = {
    prospect: "🆕 Prospects",
    contacte: "📞 Contactés",
    attente: "⏳ En attente",
    client: "✅ Client",
    perdu: "❌ Perdu",
  };
  return statuses.map((s) => ({
    id: s,
    label: defaultLabels[s] || s,
    icon: "",
  }));
}

/**
 * EmailModal — Modal d'envoi d'email via mailto:
 *
 * Props:
 * - open / onOpenChange : contrôle de la modale
 * - prospect : prospect unique (mode individuel depuis l'extérieur)
 * - prospects : array pré-sélectionné (mode bulk depuis BulkActions)
 * - boards : array de boards (pipelines) pour la sélection interne
 * - allProspects : all prospects from active board for selection
 * - activeBoard : the currently active board
 */
export default function EmailModal({
  open,
  onOpenChange,
  prospect = null,
  prospects = [],
  boards = [],
  allProspects = [],
  activeBoard = null,
  campaignTemplate = null,
}) {
  const { settings } = useSettings();
  const { user } = useAuth();
  const externalBulk = prospects.length > 0;

  // ── Selection state (when selecting from pipeline) ──
  const [selectedBoardIds, setSelectedBoardIds] = useState([]);
  const [selectedColumnId, setSelectedColumnId] = useState("__all__");
  const [selectedProspectIds, setSelectedProspectIds] = useState(new Set());
  const [showSelector, setShowSelector] = useState(!prospect && !externalBulk);

  // ── Multi-pipeline prospects loading ──
  const [loadedProspects, setLoadedProspects] = useState({});
  const [loadingBoardId, setLoadingBoardId] = useState(null);

  // ── Email form state ──
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [copied, setCopied] = useState(false);

  // ── Per-recipient {{content}} state ──
  const [contentPerProspect, setContentPerProspect] = useState({});
  const [globalContent, setGlobalContent] = useState("");

  // ── Fetch prospects for a board ──
  const fetchBoardProspects = useCallback(async (boardId) => {
    if (!user?.id || !boardId) return [];
    if (loadedProspects[boardId]) return loadedProspects[boardId];
    
    setLoadingBoardId(boardId);
    try {
      const { data, error } = await supabase
        .from("prospects")
        .select(`*, sirene_infos (siret, creation_date, legal_form, ape_code, address, sector, raw), contacts (id, full_name, email, phone, notes, created_at)`)
        .eq("user_id", user.id)
        .eq("board_id", boardId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const mapped = (data || []).map(p => ({
        ...p,
        siret: p.sirene_infos?.siret || null,
        creationDate: p.sirene_infos?.creation_date || null,
        juridicalForm: p.sirene_infos?.legal_form || null,
        activityCode: p.sirene_infos?.ape_code || null,
        activityLabel: p.sirene_infos?.sector || null,
        contacts: (p.contacts || []).map(c => ({
          id: c.id, name: c.full_name, email: c.email, phone: c.phone, notes: c.notes, date: c.created_at, type: "contact"
        })),
        sirene_infos: undefined,
      }));

      setLoadedProspects(prev => ({ ...prev, [boardId]: mapped }));
      return mapped;
    } catch {
      return [];
    } finally {
      setLoadingBoardId(null);
    }
  }, [user?.id, loadedProspects]);

  // Initialize selected board when modal opens
  useEffect(() => {
    if (open) {
      if (activeBoard) {
        setSelectedBoardIds([activeBoard.id]);
        // Pre-load active board prospects
        if (allProspects.length > 0) {
          setLoadedProspects(prev => ({ ...prev, [activeBoard.id]: allProspects }));
        }
      }
      if (prospect || externalBulk) {
        setShowSelector(false);
      } else {
        setShowSelector(true);
      }
      // Pre-fill template from campaign mode
      if (campaignTemplate) {
        setSelectedTemplate(campaignTemplate.id);
        setSubject(campaignTemplate.subject || "");
        setBody(campaignTemplate.body || "");
      }
    } else {
      // Reset on close
      setSelectedProspectIds(new Set());
      setSelectedBoardIds([]);
      setSelectedTemplate(null);
      setSubject("");
      setBody("");
      setContentPerProspect({});
      setGlobalContent("");
      setSelectedColumnId("__all__");
      setLoadedProspects({});
    }
  }, [open, activeBoard, prospect, externalBulk, campaignTemplate]);

  // ── Toggle board selection (multi-select) ──
  const handleToggleBoard = useCallback(async (boardId) => {
    setSelectedBoardIds(prev => {
      if (prev.includes(boardId)) {
        return prev.filter(id => id !== boardId);
      }
      return [...prev, boardId];
    });
    // Fetch prospects if not already loaded
    await fetchBoardProspects(boardId);
  }, [fetchBoardProspects]);

  // ── All prospects from selected boards ──
  const allSelectedProspects = useMemo(() => {
    const combined = [];
    const seenIds = new Set();
    for (const boardId of selectedBoardIds) {
      const boardProspects = loadedProspects[boardId] || [];
      for (const p of boardProspects) {
        if (!seenIds.has(p.id)) {
          seenIds.add(p.id);
          combined.push(p);
        }
      }
    }
    return combined;
  }, [selectedBoardIds, loadedProspects]);

  // ── Columns from all selected boards ──
  const selectionColumns = useMemo(() => {
    const columnsMap = new Map();
    for (const boardId of selectedBoardIds) {
      const board = boards.find(b => b.id === boardId);
      if (board) {
        const cols = getBoardColumns(board);
        for (const col of cols) {
          if (!columnsMap.has(col.id)) {
            columnsMap.set(col.id, col);
          }
        }
      }
    }
    return Array.from(columnsMap.values());
  }, [selectedBoardIds, boards]);

  // ── Filter prospects by selected column ──
  const filteredProspectsForSelection = useMemo(() => {
    if (selectedColumnId === "__all__") return allSelectedProspects;
    return allSelectedProspects.filter((p) => p.status === selectedColumnId);
  }, [allSelectedProspects, selectedColumnId]);

  // ── Determine final recipients ──
  const finalRecipients = useMemo(() => {
    if (prospect) {
      return [prospect];
    }
    if (externalBulk) {
      return prospects;
    }
    // From selection
    return allSelectedProspects.filter((p) => selectedProspectIds.has(p.id));
  }, [prospect, prospects, externalBulk, allSelectedProspects, selectedProspectIds]);

  const isBulk = finalRecipients.length > 1;

  // ── Templates ──
  const allTemplates = useMemo(() => {
    const userTemplates = (settings?.emailTemplates || []).map((t) => ({
      id: t.id,
      title: t.title,
      subject: t.subject || "{{company}}",
      body: t.body,
      isCustom: true,
    }));
    return [...TEMPLATES, ...userTemplates];
  }, [settings?.emailTemplates]);

  // ── Email resolution ──
  const recipientsWithEmail = useMemo(
    () =>
      finalRecipients
        .map((p) => ({ prospect: p, email: resolveEmail(p) }))
        .filter((r) => r.email),
    [finalRecipients]
  );

  const recipientsWithoutEmail = useMemo(
    () => finalRecipients.filter((p) => !resolveEmail(p)),
    [finalRecipients]
  );

  const hasEmail = recipientsWithEmail.length > 0;
  const usesContent = templateUsesContent(subject, body);

  // ── Handlers ──
  const handleSelectTemplate = (template) => {
    setSelectedTemplate(template.id);
    const targetProspect = isBulk
      ? recipientsWithEmail[0]?.prospect || {}
      : finalRecipients[0] || {};
    // Don't interpolate {{content}} yet — leave it for the user
    const subjectText = template.subject || "";
    const bodyText = template.body || "";
    setSubject(subjectText);
    setBody(bodyText);
    // Reset content fields
    setContentPerProspect({});
    setGlobalContent("");
  };

  const handleSendIndividual = () => {
    const target = finalRecipients[0];
    if (!target) return;
    const email = resolveEmail(target);
    if (!email) return;
    const finalSubject = interpolateTemplate(subject, target, globalContent);
    const finalBody = interpolateTemplate(body, target, globalContent);
    const url = buildMailtoUrl(email, finalSubject, finalBody);
    window.open(url, "_blank");
  };

  const handleSendBulk = () => {
    if (recipientsWithEmail.length === 0) return;

    // For bulk with per-recipient content, open one email per prospect
    if (usesContent && Object.keys(contentPerProspect).length > 0) {
      recipientsWithEmail.forEach(({ prospect: p, email }) => {
        const pContent = contentPerProspect[p.id] || "";
        const finalSubject = interpolateTemplate(subject, p, pContent);
        const finalBody = interpolateTemplate(body, p, pContent);
        const url = buildMailtoUrl(email, finalSubject, finalBody);
        window.open(url, "_blank");
      });
    } else {
      // Standard bulk: BCC all
      const emails = recipientsWithEmail.map((r) => r.email);
      const targetProspect = recipientsWithEmail[0]?.prospect || {};
      const finalSubject = interpolateTemplate(subject, targetProspect, globalContent);
      const finalBody = interpolateTemplate(body, targetProspect, globalContent);
      const params = new URLSearchParams();
      if (finalSubject) params.set("subject", finalSubject);
      if (finalBody) params.set("body", finalBody);
      params.set("bcc", emails.join(","));
      window.open(`mailto:?${params.toString()}`, "_blank");
    }
  };

  const handleCopyEmails = async () => {
    const emails = recipientsWithEmail.map((r) => r.email).join(", ");
    try {
      await navigator.clipboard.writeText(emails);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* noop */
    }
  };

  const toggleProspect = (id) => {
    setSelectedProspectIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    const prospectsList = filteredProspectsForSelection.filter((p) => resolveEmail(p));
    const allSelected = prospectsList.length > 0 && prospectsList.every(p => selectedProspectIds.has(p.id));
    if (allSelected) {
      // Deselect only the filtered ones 
      setSelectedProspectIds(prev => {
        const next = new Set(prev);
        prospectsList.forEach(p => next.delete(p.id));
        return next;
      });
    } else {
      setSelectedProspectIds(prev => {
        const next = new Set(prev);
        prospectsList.forEach(p => next.add(p.id));
        return next;
      });
    }
  };

  const handleUpdateContent = (prospectId, value) => {
    setContentPerProspect((prev) => ({ ...prev, [prospectId]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-primary" />
            {isBulk
              ? `Envoyer un email (${recipientsWithEmail.length} destinataire${recipientsWithEmail.length > 1 ? "s" : ""})`
              : "Envoyer un email"}
          </DialogTitle>
          <DialogDescription>
            {showSelector && !prospect && !externalBulk
              ? "Sélectionnez vos prospects depuis votre pipeline, puis composez votre email."
              : isBulk
                ? "Composez un email à envoyer à vos prospects sélectionnés."
                : `Envoyez un email à ${finalRecipients[0]?.name || finalRecipients[0]?.company || "ce prospect"} via votre client mail.`}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="flex-1 max-h-[calc(90vh-160px)]">
          <div className="space-y-4 py-2 px-1">
            {/* ═══ PROSPECT SELECTION FROM PIPELINE ═══ */}
            {showSelector && !prospect && !externalBulk && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <Filter className="h-4 w-4 text-primary" />
                    Sélectionner des prospects
                  </Label>
                  {finalRecipients.length > 0 && (
                    <Badge variant="secondary">
                      {finalRecipients.length} sélectionné{finalRecipients.length > 1 ? "s" : ""}
                    </Badge>
                  )}
                </div>

                {/* Board + Column filters */}
                <div className="flex gap-3">
                  {boards.length > 0 && (
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">
                        Pipelines ({selectedBoardIds.length} sélectionné{selectedBoardIds.length > 1 ? "s" : ""})
                      </Label>
                      <div className="space-y-1 max-h-32 overflow-y-auto border rounded-lg p-2 bg-muted/20">
                        {boards.map((b) => (
                          <label
                            key={b.id}
                            className={cn(
                              "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer transition-colors text-sm",
                              selectedBoardIds.includes(b.id) ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                            )}
                          >
                            <Checkbox
                              checked={selectedBoardIds.includes(b.id)}
                              onCheckedChange={() => handleToggleBoard(b.id)}
                            />
                            <span className="truncate">{b.name}</span>
                            {b.is_default && <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 shrink-0">⭐</Badge>}
                            {loadingBoardId === b.id && <Loader2 className="h-3 w-3 animate-spin shrink-0" />}
                            {loadedProspects[b.id] && (
                              <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4 shrink-0">
                                {loadedProspects[b.id].length}
                              </Badge>
                            )}
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                  {selectionColumns.length > 0 && (
                    <div className="flex-1">
                      <Label className="text-xs text-muted-foreground mb-1 block">Colonne</Label>
                      <Select value={selectedColumnId} onValueChange={setSelectedColumnId}>
                        <SelectTrigger className="h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__all__">Toutes les colonnes</SelectItem>
                          {selectionColumns.map((col) => (
                            <SelectItem key={col.id} value={col.id}>
                              {col.icon} {col.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>

                {/* Prospect list with checkboxes */}
                {filteredProspectsForSelection.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    {/* Select all header */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-muted/50 border-b">
                      <Checkbox
                        checked={
                          filteredProspectsForSelection.filter((p) => resolveEmail(p)).length > 0 &&
                          filteredProspectsForSelection.filter((p) => resolveEmail(p)).every(p => selectedProspectIds.has(p.id))
                        }
                        onCheckedChange={toggleAll}
                      />
                      <span className="text-xs font-medium text-muted-foreground">
                        Tout sélectionner ({filteredProspectsForSelection.filter((p) => resolveEmail(p)).length} avec email)
                        {selectedProspectIds.size > 0 && ` · ${selectedProspectIds.size} sélectionné${selectedProspectIds.size > 1 ? 's' : ''}`}
                      </span>
                    </div>
                    <div className="max-h-48 overflow-y-auto divide-y divide-border">
                      {filteredProspectsForSelection.map((p) => {
                        const email = resolveEmail(p);
                        const pipelineName = boards.find(b => b.id === p.board_id)?.name;
                        return (
                          <label
                            key={p.id}
                            className={cn(
                              "flex items-center gap-3 px-3 py-2 hover:bg-muted/30 cursor-pointer transition-colors",
                              !email && "opacity-50 cursor-not-allowed",
                              selectedProspectIds.has(p.id) && "bg-primary/5"
                            )}
                          >
                            <Checkbox
                              checked={selectedProspectIds.has(p.id)}
                              onCheckedChange={() => email && toggleProspect(p.id)}
                              disabled={!email}
                            />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-medium truncate">
                                  {p.name || p.company}
                                </span>
                                {p.company && p.name && (
                                  <span className="text-xs text-muted-foreground truncate">
                                    — {p.company}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-xs text-muted-foreground">
                                  {email || "Pas d'email"}
                                </span>
                                {selectedBoardIds.length > 1 && pipelineName && (
                                  <Badge variant="outline" className="text-[10px] px-1 py-0 h-4 border-blue-500/30 text-blue-500">
                                    {pipelineName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <Badge variant="outline" className="text-xs shrink-0">
                              {p.status}
                            </Badge>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-6 text-muted-foreground">
                    <Users className="h-8 w-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Aucun prospect dans cette colonne.</p>
                  </div>
                )}

                {selectedProspectIds.size > 0 && <Separator />}
              </div>
            )}

            {/* ═══ RECIPIENT DISPLAY (when pre-selected) ═══ */}
            {(prospect || externalBulk) && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1.5 block">
                  {isBulk ? "Destinataires" : "Destinataire"}
                </Label>
                {isBulk ? (
                  <div className="space-y-2">
                    <div className="flex flex-wrap gap-1.5 p-2 rounded-lg border bg-muted/30 max-h-20 overflow-y-auto">
                      {recipientsWithEmail.map(({ prospect: p, email }) => (
                        <Badge key={p.id} variant="secondary" className="text-xs">
                          {p.name || p.company} — {email}
                        </Badge>
                      ))}
                    </div>
                    {recipientsWithoutEmail.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-amber-500">
                        <AlertCircle className="h-3.5 w-3.5" />
                        {recipientsWithoutEmail.length} prospect
                        {recipientsWithoutEmail.length > 1 ? "s" : ""} sans email (ignoré
                        {recipientsWithoutEmail.length > 1 ? "s" : ""})
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input
                      value={resolveEmail(finalRecipients[0]) || ""}
                      disabled
                      className="flex-1"
                      placeholder="Aucun email renseigné"
                    />
                    {resolveEmail(finalRecipients[0]) && (
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={handleCopyEmails}
                        className="h-9 w-9"
                        title="Copier l'email"
                      >
                        {copied ? (
                          <Check className="h-4 w-4 text-green-500" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* No email message */}
            {finalRecipients.length > 0 && !hasEmail && (
              <div className="text-center py-6 text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">
                  {isBulk
                    ? "Aucun prospect sélectionné n'a d'email renseigné."
                    : "Ce prospect n'a pas d'adresse email renseignée."}
                </p>
              </div>
            )}

            {/* ═══ EMAIL COMPOSITION ═══ */}
            {(finalRecipients.length > 0 || showSelector) && hasEmail && (
              <>
                {/* Template selection */}
                <div>
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Template</Label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {allTemplates.map((template) => (
                      <button
                        key={template.id}
                        onClick={() => handleSelectTemplate(template)}
                        className={cn(
                          "text-left p-3 rounded-lg border transition-all text-sm",
                          selectedTemplate === template.id
                            ? "border-primary bg-primary/10"
                            : template.isCustom
                              ? "border-purple-500/30 hover:border-purple-500/60 hover:bg-purple-500/5"
                              : "border-border hover:border-primary/30 hover:bg-muted/50"
                        )}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <FileText
                            className={cn(
                              "h-3.5 w-3.5",
                              template.isCustom ? "text-purple-500" : "text-muted-foreground"
                            )}
                          />
                          <span className="font-medium text-xs truncate">{template.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {template.body.split("\n")[0]}
                        </p>
                      </button>
                    ))}
                  </div>
                  {allTemplates.every((t) => !t.isCustom) && (
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Créez vos propres templates dans{" "}
                      <a href="/templates" className="text-primary underline">
                        Templates Email
                      </a>
                    </p>
                  )}
                </div>

                <Separator />

                {/* Subject */}
                <div>
                  <Label htmlFor="email-subject" className="text-xs text-muted-foreground mb-1.5 block">
                    Objet
                  </Label>
                  <Input
                    id="email-subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Objet de l'email..."
                    className="font-mono text-sm"
                  />
                </div>

                {/* Body */}
                <div>
                  <Label htmlFor="email-body" className="text-xs text-muted-foreground mb-1.5 block">
                    Message
                  </Label>
                  <Textarea
                    id="email-body"
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder="Rédigez votre message ou sélectionnez un template..."
                    rows={6}
                    className="resize-none font-mono text-sm"
                  />
                </div>

                {/* ═══ {{content}} SECTION ═══ */}
                {usesContent && (
                  <div className="space-y-3 p-4 rounded-lg border-2 border-purple-500/30 bg-purple-500/5">
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-4 w-4 text-purple-500" />
                      <h4 className="font-medium text-sm text-foreground">
                        Contenu personnalisé — <code className="font-mono text-purple-500">{"{{content}}"}</code>
                      </h4>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Votre template contient la variable <code className="font-mono text-purple-500">{"{{content}}"}</code>.
                      {isBulk
                        ? " Rédigez un texte personnalisé pour chaque destinataire ci-dessous. Ce texte remplacera {{content}} dans l'email de chacun."
                        : " Rédigez le texte qui remplacera cette variable dans votre email."}
                    </p>

                    {!isBulk && (
                      <Textarea
                        value={globalContent}
                        onChange={(e) => setGlobalContent(e.target.value)}
                        placeholder="Votre texte personnalisé ici… (remplacera {{content}} dans l'email)"
                        rows={3}
                        className="resize-none text-sm"
                      />
                    )}

                    {isBulk && (
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recipientsWithEmail.map(({ prospect: p }) => (
                          <div key={p.id} className="space-y-1">
                            <Label className="text-xs font-medium flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">
                                {p.name || p.company}
                              </Badge>
                            </Label>
                            <Textarea
                              value={contentPerProspect[p.id] || ""}
                              onChange={(e) => handleUpdateContent(p.id, e.target.value)}
                              placeholder={`Texte personnalisé pour ${p.name || p.company}…`}
                              rows={2}
                              className="resize-none text-sm"
                            />
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Preview */}
                    {(globalContent || Object.values(contentPerProspect).some(Boolean)) && (
                      <div className="mt-2">
                        <Label className="text-xs text-muted-foreground mb-1 block">Aperçu</Label>
                        {!isBulk && finalRecipients[0] && (
                          <div className="p-3 rounded-lg bg-background border text-xs whitespace-pre-wrap font-mono">
                            {interpolateTemplate(body, finalRecipients[0], globalContent)}
                          </div>
                        )}
                        {isBulk && (
                          <div className="space-y-2">
                            {recipientsWithEmail
                              .filter(({ prospect: p }) => contentPerProspect[p.id])
                              .slice(0, 2)
                              .map(({ prospect: p }) => (
                                <div key={p.id} className="p-2 rounded bg-background border text-xs">
                                  <Badge variant="secondary" className="text-xs mb-1">
                                    {p.name || p.company}
                                  </Badge>
                                  <div className="whitespace-pre-wrap font-mono mt-1">
                                    {interpolateTemplate(body, p, contentPerProspect[p.id] || "")}
                                  </div>
                                </div>
                              ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {isBulk && !usesContent && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
                    <Users className="h-4 w-4" />
                    Les destinataires seront en copie cachée (BCC) pour préserver leur confidentialité.
                  </div>
                )}

                {isBulk && usesContent && (
                  <div className="flex items-center gap-2 text-xs text-purple-500 bg-purple-500/10 p-3 rounded-lg border border-purple-500/20">
                    <MessageSquare className="h-4 w-4" />
                    Chaque prospect recevra un email individuel avec son contenu personnalisé.
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>

        <DialogFooter className="border-t pt-4 gap-2">
          {hasEmail && finalRecipients.length > 0 && (
            <>
              {isBulk && (
                <Button variant="outline" onClick={handleCopyEmails} className="mr-auto">
                  {copied ? (
                    <Check className="h-4 w-4 mr-2 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4 mr-2" />
                  )}
                  {copied ? "Copié !" : `Copier les ${recipientsWithEmail.length} emails`}
                </Button>
              )}
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Annuler
              </Button>
              <Button
                onClick={isBulk ? handleSendBulk : handleSendIndividual}
                disabled={!subject && !body}
                className="gap-2"
              >
                <Send className="h-4 w-4" />
                Ouvrir dans mon client mail
              </Button>
            </>
          )}
          {(!hasEmail || finalRecipients.length === 0) && (
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Fermer
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
