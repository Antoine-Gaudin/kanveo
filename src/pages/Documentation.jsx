import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Search,
  DatabaseIcon,
  Users,
  ArrowRight,
  Download,
  Upload,
  Filter,
  Eye,
  MousePointerClick,
  Plus,
  Columns3,
  GripVertical,
  LayoutGrid,
  List,
  Table2,
  Kanban,
  CheckCircle2,
  CheckSquare,
  Tag,
  UserPlus,
  Trash2,
  FileSpreadsheet,
  Settings2,
  ChevronRight,
  ExternalLink,
  Info,
  Lightbulb,
  Star,
  ArrowLeftRight,
  ClipboardCopy,
  ListTodo,
  CalendarDays,
  MessageSquare,
  Grid3X3,
  Palette,
  Wallet,
  FileText,
  Receipt,
  BarChart3,
  CreditCard,
  Building2,
  Mail,
  Copy,
  Send,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// Composant étape numérotée
function Step({ number, title, children, icon: Icon }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <div className="w-10 h-10 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center text-primary font-bold text-sm flex-shrink-0">
          {number}
        </div>
        <div className="w-0.5 flex-1 bg-border mt-2" />
      </div>
      <div className="pb-8 flex-1">
        <h4 className="font-semibold text-foreground flex items-center gap-2 mb-2">
          {Icon && <Icon className="h-4 w-4 text-primary" />}
          {title}
        </h4>
        <div className="text-muted-foreground text-sm leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
}

// Composant astuce
function Tip({ children }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 mt-3">
      <Lightbulb className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-amber-200/80">{children}</p>
    </div>
  );
}

// Composant info
function InfoBox({ children }) {
  return (
    <div className="flex gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20 mt-3">
      <Info className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
      <p className="text-sm text-blue-200/80">{children}</p>
    </div>
  );
}

// Section : card compacte → accordion pleine largeur avec animation
function Section({ id, title, icon: Icon, iconColor, gradient, isOpen, onToggle, emoji, description, borderColor, children }) {
  const contentRef = useRef(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (isOpen && contentRef.current) {
      // Petit délai pour que le DOM se mette à jour
      const timer = setTimeout(() => {
        setHeight(contentRef.current.scrollHeight);
      }, 10);
      return () => clearTimeout(timer);
    } else {
      setHeight(0);
    }
  }, [isOpen]);

  // Mode card compacte (fermé)
  if (!isOpen) {
    return (
      <button
        onClick={() => onToggle(id)}
        className={cn(
          "group relative text-left p-5 rounded-xl border-2 transition-all duration-300",
          "hover:shadow-lg hover:-translate-y-1",
          borderColor || "border-border hover:border-primary/30"
        )}
      >
        <div className="flex items-start gap-4">
          <div className={cn(
            "w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br text-2xl flex-shrink-0 transition-transform duration-300 group-hover:scale-110",
            gradient
          )}>
            {emoji || <Icon className={cn("h-6 w-6", iconColor)} />}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-foreground">{title}</h3>
              <ArrowRight className="h-4 w-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
            </div>
            {description && (
              <p className="text-xs text-muted-foreground leading-relaxed">{description}</p>
            )}
          </div>
        </div>
      </button>
    );
  }

  // Mode accordion ouvert (pleine largeur)
  return (
    <Card className="col-span-full border-2 border-primary/30 shadow-xl shadow-primary/5 animate-in fade-in-0 duration-300">
      <button
        onClick={() => onToggle(id)}
        className="w-full text-left"
      >
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center bg-gradient-to-br text-2xl", gradient)}>
                {emoji || <Icon className={cn("h-6 w-6", iconColor)} />}
              </div>
              <div>
                <CardTitle className="text-xl">{title}</CardTitle>
                <p className="text-xs text-muted-foreground mt-0.5">Cliquez pour réduire</p>
              </div>
            </div>
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-primary/10">
              <ChevronRight className="h-5 w-5 text-primary rotate-90 transition-transform duration-300" />
            </div>
          </div>
        </CardHeader>
      </button>
      <div
        className="overflow-hidden transition-all duration-500 ease-in-out"
        style={{ maxHeight: height ? `${height}px` : '0px', opacity: height ? 1 : 0 }}
      >
        <div ref={contentRef}>
          <CardContent className="pt-0">
            <Separator className="mb-8" />
            {children}
          </CardContent>
        </div>
      </div>
    </Card>
  );
}

export default function Documentation() {
  const [openSections, setOpenSections] = useState([]);

  const toggleSection = (id) => {
    setOpenSections(prev =>
      prev.includes(id) ? [] : [id]
    );
    if (!openSections.includes(id)) {
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }
  };

  const scrollToSection = (id) => {
    setOpenSections([id]);
    setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-12">
      {/* ══ HERO ══ */}
      <div className="relative overflow-hidden rounded-2xl border bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-8 md:p-12">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="relative z-10 text-center space-y-4 max-w-3xl mx-auto">
          <div className="text-5xl mb-2">📖</div>
          <Badge variant="secondary" className="text-xs">
            Guide d'utilisation
          </Badge>
          <h1 className="text-4xl font-extrabold text-foreground tracking-tight">
            Maîtrisez Kanveo en 5 minutes
          </h1>
          <p className="text-muted-foreground text-base leading-relaxed">
            6 modules, un seul objectif : <strong className="text-foreground">transformer vos données en clients</strong>. 
            Choisissez un module ci-dessous pour commencer.
          </p>
        </div>
      </div>

      {/* ══ SECTIONS : GRILLE DE CARDS / ACCORDION ══ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 1 : SIRENE                     */}
      {/* ═══════════════════════════════════════ */}
      <div id="sirene" className={cn("scroll-mt-6", openSections.includes('sirene') && "col-span-full")}>
        <Section
          id="sirene"
          title="Import SIRENE"
          icon={Search}
          emoji="🔍"
          iconColor="text-blue-500"
          gradient="from-blue-500/20 to-cyan-500/20"
          borderColor="border-blue-500/20 hover:border-blue-500/50 hover:shadow-blue-500/5 hover:bg-blue-500/5"
          description="Récupérez des entreprises depuis la base officielle INSEE et importez-les dans votre pipeline."
          isOpen={openSections.includes('sirene')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-6">
              La base SIRENE est le <strong className="text-foreground">registre officiel</strong> de toutes
              les entreprises françaises, géré par l'INSEE. Kanveo vous permet d'importer ces données 
              pour trouver des prospects qualifiés.
            </p>

            {/* Étape 1 : Télécharger */}
            <Step number={1} title="Télécharger le fichier SIRENE" icon={Download}>
              <p>
                Rendez-vous sur le site officiel de l'annuaire des entreprises :
              </p>
              <a
                href="https://annuaire-entreprises.data.gouv.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-400 hover:bg-blue-500/20 transition-colors text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                annuaire-entreprises.data.gouv.fr
              </a>
              <div className="mt-3 space-y-1">
                <p>Vous pouvez y rechercher des entreprises par :</p>
                <ul className="list-disc list-inside space-y-1 ml-2 text-muted-foreground">
                  <li>Nom d'entreprise ou dirigeant</li>
                  <li>Code postal ou ville</li>
                  <li>Secteur d'activité (code APE/NAF)</li>
                  <li>Forme juridique (SARL, SAS, etc.)</li>
                </ul>
              </div>
              <p className="mt-3">
                Une fois votre recherche effectuée, <strong className="text-foreground">téléchargez les résultats</strong> au
                format <Badge variant="outline" className="ml-1">CSV</Badge> ou <Badge variant="outline" className="ml-1">XLSX</Badge>.
              </p>
              <Tip>
                Vous pouvez aussi utiliser les exports depuis data.gouv.fr ou tout autre fichier 
                SIRENE du moment qu'il contient des colonnes comme SIRET, dénomination, adresse, etc.
              </Tip>
            </Step>

            {/* Étape 2 : Importer */}
            <Step number={2} title="Importer dans Kanveo" icon={Upload}>
              <p>
                Sur la page <Link to="/sirene" className="text-primary hover:underline font-medium">SIRENE</Link>,
                cliquez sur la zone d'import ou glissez-déposez votre fichier.
              </p>
              <div className="mt-3 space-y-1">
                <p>Kanveo va automatiquement :</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>Détecter le format du fichier (CSV ou Excel)</li>
                  <li>Identifier les colonnes SIRENE (SIRET, adresse, forme juridique…)</li>
                  <li>Importer les données dans votre base Supabase</li>
                  <li>Afficher une barre de progression pendant l'import</li>
                </ul>
              </div>
              <InfoBox>
                Les fichiers sont importés par lots de 10 lignes pour éviter les timeouts. 
                Un fichier de 500 lignes prend environ 10-15 secondes.
              </InfoBox>
            </Step>

            {/* Étape 3 : Filtrer */}
            <Step number={3} title="Explorer et filtrer les données" icon={Filter}>
              <p>
                Une fois importées, vos données apparaissent dans un tableau interactif. 
                Utilisez les filtres pour affiner votre liste :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Badge variant="outline" className="text-xs">Diffusion</Badge>
                  <span>Publique, partielle ou toutes</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Badge variant="outline" className="text-xs">Tri</Badge>
                  <span>Par date croissante ou décroissante</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Badge variant="outline" className="text-xs">Juridique</Badge>
                  <span>SARL, SAS, SASU, EI, etc.</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Badge variant="outline" className="text-xs">Options</Badge>
                  <span>Masquer sans adresse, avec identité</span>
                </div>
              </div>
            </Step>

            {/* Étape 4 : Voir les détails */}
            <Step number={4} title="Consulter les détails d'une entreprise" icon={Eye}>
              <p>
                <strong className="text-foreground">Cliquez sur une ligne</strong> du tableau pour ouvrir 
                la fiche détaillée avec toutes les informations SIRENE :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>SIRET, forme juridique, code APE</li>
                <li>Adresse complète</li>
                <li>Date de création</li>
                <li>Activité / secteur</li>
              </ul>
              <p className="mt-2">
                Vous pouvez modifier les champs directement dans la modale et ajouter des notes.
              </p>
            </Step>

            {/* Étape 5 : Transférer */}
            <Step number={5} title="Transférer vers un pipeline" icon={ArrowRight}>
              <p>
                C'est l'étape clé ! Pour transformer une entreprise en prospect :
              </p>
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">📌 Transfert individuel</p>
                  <p className="text-xs">
                    Depuis la fiche détaillée → bouton <strong className="text-foreground">"Ajouter au pipeline"</strong> → 
                    choisissez un ou plusieurs pipelines de destination.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">📌 Transfert en lot</p>
                  <p className="text-xs">
                    Cochez plusieurs lignes dans le tableau → cliquez sur 
                    <strong className="text-foreground"> "Ajouter au pipeline"</strong> → 
                    sélectionnez les pipelines → toutes les entreprises sont transférées d'un coup.
                  </p>
                </div>
              </div>
              <Tip>
                Vous pouvez aussi exporter vos données filtrées en CSV ou Excel 
                via les boutons d'export en haut du tableau.
              </Tip>
            </Step>
          </div>

          {/* CTA */}
          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/sirene" className="gap-2">
                <Search className="h-4 w-4" />
                Aller à l'import SIRENE
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 2 : BASE DE DONNÉES            */}
      {/* ═══════════════════════════════════════ */}
      <div id="database" className={cn("scroll-mt-6", openSections.includes('database') && "col-span-full")}>
        <Section
          id="database"
          title="Ma Base de données"
          icon={DatabaseIcon}
          emoji="💾"
          iconColor="text-violet-500"
          gradient="from-violet-500/20 to-purple-500/20"
          borderColor="border-violet-500/20 hover:border-violet-500/50 hover:shadow-violet-500/5 hover:bg-violet-500/5"
          description="Importez vos propres fichiers CSV / Excel avec vos colonnes personnalisées."
          isOpen={openSections.includes('database')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-6">
              Contrairement à l'import SIRENE (format fixe), la base de données vous permet 
              d'importer <strong className="text-foreground">n'importe quel fichier</strong> avec 
              vos propres colonnes : fichier client, export CRM, liste Excel…
            </p>

            {/* Étape 1 : Configurer les colonnes */}
            <Step number={1} title="Configurer vos colonnes" icon={Settings2}>
              <p>
                Avant d'importer, définissez les noms de vos colonnes dans l'onglet 
                <strong className="text-foreground"> Configuration</strong>.
              </p>
              <div className="mt-3 p-3 rounded-lg border border-border bg-card">
                <p className="text-xs text-foreground font-medium mb-2">Exemple :</p>
                <code className="text-xs bg-muted px-2 py-1 rounded block">
                  Nom, Entreprise, Email, Téléphone, Adresse, Notes
                </code>
              </div>
              <p className="mt-3">
                Le séparateur (<code className="bg-muted px-1 rounded">,</code> ou <code className="bg-muted px-1 rounded">;</code>) 
                est détecté automatiquement. Les colonnes apparaissent sous forme de badges pour vérification.
              </p>
              <Tip>
                Cette configuration est sauvegardée localement. Vous n'avez besoin de la faire qu'une seule fois,
                sauf si vous changez de structure de fichier.
              </Tip>
            </Step>

            {/* Étape 2 : Importer */}
            <Step number={2} title="Importer vos fichiers" icon={Upload}>
              <p>
                Glissez-déposez ou sélectionnez vos fichiers. Formats supportés :
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge variant="outline">CSV</Badge>
                <Badge variant="outline">Excel (.xlsx, .xls)</Badge>
                <Badge variant="outline">TXT</Badge>
              </div>
              <p className="mt-3">
                Kanveo détecte automatiquement le séparateur (virgule, point-virgule, tabulation, pipe)
                et gère les champs entre guillemets.
              </p>
              <InfoBox>
                Vous pouvez importer plusieurs fichiers les uns après les autres. 
                Chaque fichier est identifié par son nom source.
              </InfoBox>
            </Step>

            {/* Étape 3 : Mapper les colonnes */}
            <Step number={3} title="Mapper les colonnes" icon={ArrowLeftRight}>
              <p>
                Après l'import, Kanveo vous propose un <strong className="text-foreground">mapping automatique</strong> 
                entre les colonnes de votre fichier et les champs Kanveo :
              </p>
              <div className="grid grid-cols-2 gap-2 mt-3">
                {['Nom', 'Entreprise', 'Email', 'Téléphone', 'Adresse', 'Notes'].map(field => (
                  <div key={field} className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                    <ArrowRight className="h-3 w-3 text-primary" />
                    <span className="text-foreground font-medium">{field}</span>
                  </div>
                ))}
              </div>
              <p className="mt-3">
                Un aperçu des 3 premières lignes vous permet de vérifier le mapping. 
                Vous pouvez corriger manuellement si besoin avant de confirmer.
              </p>
            </Step>

            {/* Étape 4 : Exploiter les données */}
            <Step number={4} title="Exploiter vos données" icon={Table2}>
              <p>
                Votre tableau affiche toutes les lignes avec pagination (25/page). Vous pouvez :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Search className="h-3 w-3 text-muted-foreground" />
                  <span>Rechercher dans tous les champs</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <Filter className="h-3 w-3 text-muted-foreground" />
                  <span>Filtrer par fichier source</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <ArrowLeftRight className="h-3 w-3 text-muted-foreground" />
                  <span>Trier par colonne</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <ClipboardCopy className="h-3 w-3 text-muted-foreground" />
                  <span>Copier un champ au clic</span>
                </div>
              </div>
            </Step>

            {/* Étape 5 : Transférer */}
            <Step number={5} title="Transférer vers un pipeline" icon={Users}>
              <p>
                Comme pour SIRENE, vous pouvez envoyer vos lignes vers un ou plusieurs pipelines :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-foreground">Individuel</strong> : cliquez sur une ligne → "Ajouter au pipeline"</li>
                <li><strong className="text-foreground">En lot</strong> : cochez plusieurs lignes → action groupée</li>
              </ul>
              <p className="mt-2">
                Les lignes déjà envoyées sont marquées d'un badge 
                <Badge variant="secondary" className="mx-1 text-xs">Pipeline</Badge>
                pour éviter les doublons.
              </p>
            </Step>
          </div>

          <div className="mt-4 flex justify-center">
            <Button asChild variant="outline">
              <Link to="/database" className="gap-2">
                <DatabaseIcon className="h-4 w-4" />
                Aller à Ma Base de données
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 3 : PIPELINE                   */}
      {/* ═══════════════════════════════════════ */}
      <div id="pipeline" className={cn("scroll-mt-6", openSections.includes('pipeline') && "col-span-full")}>
        <Section
          id="pipeline"
          title="Pipeline de Prospection"
          icon={Users}
          emoji="🎯"
          iconColor="text-emerald-500"
          gradient="from-emerald-500/20 to-green-500/20"
          borderColor="border-emerald-500/20 hover:border-emerald-500/50 hover:shadow-emerald-500/5 hover:bg-emerald-500/5"
          description="Suivez vos prospects en Kanban à travers chaque étape de votre processus commercial."
          isOpen={openSections.includes('pipeline')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-6">
              Le pipeline est le <strong className="text-foreground">cœur de Kanveo</strong>. 
              C'est ici que vous suivez vos prospects à travers les différentes étapes 
              de votre processus commercial.
            </p>

            {/* Étape 1 : Comprendre les pipelines */}
            <Step number={1} title="Comprendre les pipelines" icon={Kanban}>
              <p>
                Un pipeline est un <strong className="text-foreground">tableau Kanban</strong> avec des colonnes 
                représentant les étapes de votre prospection :
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-blue-600/20 text-blue-300 border-0">🆕 Prospect</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
                <Badge className="bg-purple-600/20 text-purple-300 border-0">📞 Contacté</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
                <Badge className="bg-amber-600/20 text-amber-300 border-0">⏳ En attente</Badge>
                <ArrowRight className="h-4 w-4 text-muted-foreground self-center" />
                <Badge className="bg-green-600/20 text-green-300 border-0">✅ Client</Badge>
              </div>
              <p className="mt-3">
                Vous pouvez créer <strong className="text-foreground">plusieurs pipelines</strong> (ex: "Immobilier", 
                "B2B Tech", "Freelances") et basculer entre eux via le sélecteur en haut de page.
              </p>
              <Tip>
                Marquez un pipeline comme <strong>défaut</strong> (étoile ★) pour qu'il s'ouvre automatiquement 
                à chaque visite.
              </Tip>
            </Step>

            {/* Étape 2 : Personnaliser les colonnes */}
            <Step number={2} title="Personnaliser les colonnes" icon={Columns3}>
              <p>
                Cliquez sur <strong className="text-foreground">"Gérer les colonnes"</strong> pour :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li>Ajouter de nouvelles colonnes (ex: "Rendez-vous pris", "Devis envoyé")</li>
                <li>Renommer les colonnes existantes</li>
                <li>Réordonner par glisser-déposer</li>
                <li>Supprimer les colonnes inutiles</li>
                <li>Choisir des icônes et labels personnalisés</li>
              </ul>
              <InfoBox>
                Les colonnes par défaut (Prospect, Contacté, En attente, Client, Perdu) sont 
                créées automatiquement pour chaque nouveau pipeline.
              </InfoBox>
            </Step>

            {/* Étape 3 : Les 4 vues */}
            <Step number={3} title="Choisir votre vue" icon={LayoutGrid}>
              <p>
                Kanveo propose <strong className="text-foreground">4 vues</strong> pour afficher vos prospects :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Kanban className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-foreground text-sm">Kanban</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Colonnes avec drag & drop. Idéal pour le suivi visuel.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <List className="h-4 w-4 text-violet-500" />
                    <span className="font-medium text-foreground text-sm">Liste</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vue linéaire compacte. Idéal pour scanner rapidement.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutGrid className="h-4 w-4 text-emerald-500" />
                    <span className="font-medium text-foreground text-sm">Cartes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Grille de fiches. Idéal pour voir les détails d'un coup d'œil.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Table2 className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-foreground text-sm">Tableau</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Colonnes triables. Idéal pour les gros volumes.
                  </p>
                </div>
              </div>
            </Step>

            {/* Étape 4 : Gérer les prospects */}
            <Step number={4} title="Gérer vos prospects" icon={MousePointerClick}>
              <p>
                <strong className="text-foreground">Cliquez sur un prospect</strong> pour ouvrir sa fiche complète :
              </p>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Eye className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Consulter</strong> : nom, entreprise, SIRET, adresse, activité, date de création</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Settings2 className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Modifier</strong> : tous les champs sont éditables en mode édition</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <GripVertical className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Déplacer</strong> : changer de colonne (ou drag & drop en vue Kanban)</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <ClipboardCopy className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Copier</strong> : copie rapide d'un champ dans le presse-papiers</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Trash2 className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Supprimer</strong> : avec dialogue de confirmation</span>
                </div>
              </div>
            </Step>

            {/* Étape 5 : Contacts et tags */}
            <Step number={5} title="Contacts et tags" icon={Tag}>
              <p>Chaque prospect peut avoir :</p>
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1 flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    Contacts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des personnes de contact (nom, email, téléphone, notes). 
                    Historique horodaté de tous les contacts.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1 flex items-center gap-2">
                    <Tag className="h-4 w-4 text-primary" />
                    Tags
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Ajoutez des tags prédéfinis pour catégoriser vos prospects :
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {['Priorité haute', 'Décideur', 'Demande de devis', 'Qualifié', 'À relancer'].map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                    ))}
                  </div>
                </div>
              </div>
            </Step>

            {/* Étape 6 : Recherche et filtres */}
            <Step number={6} title="Rechercher et filtrer" icon={Filter}>
              <p>Utilisez la barre de recherche et les filtres pour retrouver vos prospects :</p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-foreground">Recherche textuelle</strong> : nom, entreprise, email, téléphone, notes</li>
                <li><strong className="text-foreground">Filtre par statut</strong> : afficher uniquement une colonne</li>
                <li><strong className="text-foreground">Filtre par tags</strong> : sélection multiple</li>
                <li><strong className="text-foreground">Filtre par date</strong> : plage personnalisable</li>
              </ul>
            </Step>

            {/* Étape 7 : Actions groupées */}
            <Step number={7} title="Actions groupées" icon={CheckCircle2}>
              <p>
                Cochez plusieurs prospects pour effectuer des actions en masse :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-foreground">Déplacer</strong> tous les sélectionnés vers une autre colonne</li>
                <li><strong className="text-foreground">Supprimer</strong> tous les sélectionnés en un clic</li>
              </ul>
            </Step>

          </div>

          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/prospecting" className="gap-2">
                <Users className="h-4 w-4" />
                Aller au Pipeline
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 4 : TÂCHES                      */}
      {/* ═══════════════════════════════════════ */}
      <div id="tasks" className={cn("scroll-mt-6", openSections.includes('tasks') && "col-span-full")}>
        <Section
          id="tasks"
          title="Gestion des Tâches"
          icon={ListTodo}
          emoji="✅"
          iconColor="text-orange-500"
          gradient="from-orange-500/20 to-amber-500/20"
          borderColor="border-orange-500/20 hover:border-orange-500/50 hover:shadow-orange-500/5 hover:bg-orange-500/5"
          description="Organisez votre travail avec boards, priorités et 5 vues différentes."
          isOpen={openSections.includes('tasks')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-6">
              La page Tâches est un espace <strong className="text-foreground">indépendant</strong> pour
              organiser votre travail. Créez des boards personnalisés avec des colonnes sur mesure
              et choisissez parmi 5 modes de visualisation.
            </p>

            {/* Étape 1 : Comprendre les boards */}
            <Step number={1} title="Créer et gérer vos boards" icon={Kanban}>
              <p>
                Un board de tâches est un <strong className="text-foreground">espace de travail</strong> avec
                ses propres colonnes et tâches. Vous pouvez créer plusieurs boards pour séparer vos projets.
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Plus className="h-3 w-3 text-primary" />
                  <span><strong className="text-foreground">Créer</strong> un nouveau board via le sélecteur en haut</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Star className="h-3 w-3 text-primary" />
                  <span><strong className="text-foreground">Marquer comme défaut</strong> pour qu'il s'ouvre automatiquement</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <Settings2 className="h-3 w-3 text-primary" />
                  <span><strong className="text-foreground">Renommer ou supprimer</strong> un board existant</span>
                </div>
              </div>
              <Tip>
                Le premier board est créé automatiquement avec les colonnes par défaut :
                📋 À faire, ⚡ En cours, ❌ Bloqué, ✅ Terminé.
              </Tip>
            </Step>

            {/* Étape 2 : Colonnes personnalisables */}
            <Step number={2} title="Personnaliser les colonnes" icon={Columns3}>
              <p>
                Chaque board a ses propres colonnes que vous pouvez entièrement personnaliser :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-foreground">Ajouter</strong> de nouvelles colonnes (bouton "+ Ajouter une colonne")</li>
                <li><strong className="text-foreground">Renommer</strong> une colonne existante</li>
                <li><strong className="text-foreground">Changer l'icône</strong> (emoji) et la <strong className="text-foreground">couleur</strong></li>
                <li><strong className="text-foreground">Réordonner</strong> les colonnes par déplacement</li>
                <li><strong className="text-foreground">Supprimer</strong> une colonne (les tâches sont déplacées)</li>
              </ul>
              <InfoBox>
                Les colonnes sont accessibles via le menu ⋮ de chaque colonne en vue Kanban,
                ou via le bouton "Gérer les colonnes" dans les autres vues.
              </InfoBox>
            </Step>

            {/* Étape 3 : Les 5 vues */}
            <Step number={3} title="Choisir votre vue" icon={LayoutGrid}>
              <p>
                Kanveo propose <strong className="text-foreground">5 modes de vue</strong> pour vos tâches,
                accessibles via le sélecteur en haut à droite :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <LayoutGrid className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-foreground text-sm">Kanban</span>
                    <Badge variant="secondary" className="text-xs ml-auto">Par défaut</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Colonnes avec drag & drop. Création rapide dans chaque colonne.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckSquare className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-foreground text-sm">Todo</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Checklist simple avec barre de progression. Cochez les tâches terminées.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <List className="h-4 w-4 text-violet-500" />
                    <span className="font-medium text-foreground text-sm">Liste</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vue groupée par statut en accordéons. Détails enrichis par tâche.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Grid3X3 className="h-4 w-4 text-pink-500" />
                    <span className="font-medium text-foreground text-sm">Cartes</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Grille de cartes avec recherche et filtre par statut.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card col-span-1 sm:col-span-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Table2 className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-foreground text-sm">Tableau</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Colonnes triables, recherche, filtre par statut, changement de statut inline.
                  </p>
                </div>
              </div>
              <Tip>
                Chaque vue offre un champ de <strong>création rapide</strong> : tapez un titre et appuyez
                sur Entrée pour créer une tâche instantanément.
              </Tip>
            </Step>

            {/* Étape 4 : Créer des tâches */}
            <Step number={4} title="Créer et gérer vos tâches" icon={Plus}>
              <p>
                Deux façons de créer une tâche :
              </p>
              <div className="mt-3 space-y-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">⚡ Création rapide</p>
                  <p className="text-xs text-muted-foreground">
                    Tapez un titre dans le champ de création rapide de n'importe quelle vue.
                    La tâche est créée avec le statut par défaut.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">📝 Création complète</p>
                  <p className="text-xs text-muted-foreground">
                    Cliquez sur <strong className="text-foreground">"+ Nouvelle tâche"</strong> pour ouvrir le formulaire
                    complet : titre, description, statut, priorité et date d'échéance.
                  </p>
                </div>
              </div>
            </Step>

            {/* Étape 5 : Détails d'une tâche */}
            <Step number={5} title="Détails d'une tâche" icon={Eye}>
              <p>
                <strong className="text-foreground">Cliquez sur une tâche</strong> pour ouvrir sa fiche détaillée
                avec 3 onglets :
              </p>
              <div className="mt-3 space-y-2">
                <div className="flex items-center gap-2 text-xs">
                  <Settings2 className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Détails</strong> : statut, priorité (haute/moyenne/basse), date d'échéance, checklist, assignation</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <FileSpreadsheet className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Notes</strong> : éditeur de texte avec sauvegarde automatique</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <MessageSquare className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Commentaires</strong> : discussion + pièces jointes</span>
                </div>
              </div>
              <InfoBox>
                La checklist vous permet de décomposer une tâche en sous-étapes.
                La barre de progression se met à jour en temps réel.
              </InfoBox>
            </Step>

            {/* Étape 6 : Priorités */}
            <Step number={6} title="Priorités et échéances" icon={CalendarDays}>
              <p>Chaque tâche a une priorité et une date d'échéance optionnelle :</p>
              <div className="flex flex-wrap gap-2 mt-3">
                <Badge className="bg-red-600/20 text-red-300 border-0">🔴 Haute</Badge>
                <Badge className="bg-amber-600/20 text-amber-300 border-0">🟡 Moyenne</Badge>
                <Badge className="bg-blue-600/20 text-blue-300 border-0">🔵 Basse</Badge>
              </div>
              <p className="mt-3">
                Les tâches en retard sont automatiquement <strong className="text-foreground">marquées visuellement</strong> avec
                un indicateur rouge sur les cartes.
              </p>
            </Step>
          </div>

          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/tasks" className="gap-2">
                <ListTodo className="h-4 w-4" />
                Aller aux Tâches
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 5 : CLIENTS & FINANCES           */}
      {/* ═══════════════════════════════════════ */}
      <div id="clients" className={cn("scroll-mt-6", openSections.includes('clients') && "col-span-full")}>
        <Section
          id="clients"
          title="Clients & Finances"
          icon={Wallet}
          emoji="💰"
          iconColor="text-pink-500"
          gradient="from-pink-500/20 to-rose-500/20"
          borderColor="border-pink-500/20 hover:border-pink-500/50 hover:shadow-pink-500/5 hover:bg-pink-500/5"
          description="Gérez vos clients, contrats, charges et consultez votre bilan financier."
          isOpen={openSections.includes('clients')}
          onToggle={toggleSection}
        >
          <div className="space-y-2">
            <p className="text-muted-foreground text-sm mb-6">
              La page Clients & Finances vous permet de suivre vos <strong className="text-foreground">clients</strong>,
              leurs <strong className="text-foreground">contrats</strong> et vos <strong className="text-foreground">charges</strong> d'entreprise.
              Un bilan financier avec graphiques annuels vous donne une vue d'ensemble de votre activité.
            </p>

            {/* Étape 1 : Les 4 onglets */}
            <Step number={1} title="Les 4 onglets" icon={LayoutGrid}>
              <p>
                La page est organisée en <strong className="text-foreground">4 onglets</strong> :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <BarChart3 className="h-4 w-4 text-pink-500" />
                    <span className="font-medium text-foreground text-sm">Bilan</span>
                    <Badge variant="secondary" className="text-xs ml-auto">Par défaut</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vue d'ensemble financière avec KPIs, graphiques et répartition des charges.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-500" />
                    <span className="font-medium text-foreground text-sm">Clients</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Liste de vos clients avec recherche, statut (actif/inactif/archivé).
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <FileText className="h-4 w-4 text-green-500" />
                    <span className="font-medium text-foreground text-sm">Contrats</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contrats liés à vos clients avec montant, statut de paiement et récurrence.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <div className="flex items-center gap-2 mb-1">
                    <Receipt className="h-4 w-4 text-amber-500" />
                    <span className="font-medium text-foreground text-sm">Charges</span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Vos dépenses d'entreprise par catégorie avec récurrence.
                  </p>
                </div>
              </div>
            </Step>

            {/* Étape 2 : Gérer les clients */}
            <Step number={2} title="Gérer vos clients" icon={Users}>
              <p>
                Dans l'onglet <strong className="text-foreground">Clients</strong>, ajoutez et gérez vos clients :
              </p>
              <ul className="list-disc list-inside space-y-1 ml-2 mt-2">
                <li><strong className="text-foreground">Nom</strong> du client (obligatoire)</li>
                <li><strong className="text-foreground">Entreprise</strong>, email, téléphone, adresse</li>
                <li><strong className="text-foreground">Notes</strong> libres</li>
                <li><strong className="text-foreground">Statut</strong> : Actif, Inactif ou Archivé</li>
              </ul>
              <p className="mt-3">
                Utilisez la barre de recherche pour retrouver un client par nom, entreprise ou email.
              </p>
              <Tip>
                Un client supprimé entraîne la suppression de ses contrats associés.
                Une confirmation vous sera toujours demandée.
              </Tip>
            </Step>

            {/* Étape 3 : Gérer les contrats */}
            <Step number={3} title="Suivre vos contrats" icon={FileText}>
              <p>
                Dans l'onglet <strong className="text-foreground">Contrats</strong>, créez des contrats liés à vos clients :
              </p>
              <div className="space-y-2 mt-3">
                <div className="flex items-center gap-2 text-xs">
                  <Building2 className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Client</strong> : sélectionnez le client concerné</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <FileText className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Titre et description</strong> du contrat</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <CreditCard className="h-3 w-3 text-muted-foreground" />
                  <span><strong className="text-foreground">Montant</strong> total et <strong className="text-foreground">montant payé</strong></span>
                </div>
              </div>
              <div className="mt-3">
                <p>Chaque contrat a une <strong className="text-foreground">récurrence</strong> :</p>
                <div className="flex flex-wrap gap-2 mt-2">
                  <Badge variant="outline" className="text-xs">💰 Ponctuel</Badge>
                  <Badge variant="outline" className="text-xs">📅 Mensuel</Badge>
                  <Badge variant="outline" className="text-xs">📊 Trimestriel</Badge>
                  <Badge variant="outline" className="text-xs">📆 Annuel</Badge>
                </div>
              </div>
              <p className="mt-3">
                Et un <strong className="text-foreground">statut</strong> :
              </p>
              <div className="flex flex-wrap gap-2 mt-2">
                <Badge className="bg-green-600/20 text-green-300 border-0">Actif</Badge>
                <Badge className="bg-blue-600/20 text-blue-300 border-0">Terminé</Badge>
                <Badge className="bg-red-600/20 text-red-300 border-0">Annulé</Badge>
              </div>
              <InfoBox>
                La barre de progression du paiement se calcule automatiquement :
                montant payé / montant total. Vous voyez en un coup d'œil ce qui reste à encaisser.
              </InfoBox>
            </Step>

            {/* Étape 4 : Gérer les charges */}
            <Step number={4} title="Enregistrer vos charges" icon={Receipt}>
              <p>
                Dans l'onglet <strong className="text-foreground">Charges</strong>, enregistrez vos dépenses d'entreprise :
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3">
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>🏢</span>
                  <span>Loyer / Local</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>💻</span>
                  <span>Logiciels / Abonnements</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>👥</span>
                  <span>Salaires</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>📢</span>
                  <span>Marketing / Publicité</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>🏛️</span>
                  <span>Impôts / Taxes</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>🛡️</span>
                  <span>Assurances</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>📦</span>
                  <span>Fournitures</span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-muted/50 text-xs">
                  <span>✈️</span>
                  <span>Déplacements</span>
                </div>
              </div>
              <p className="mt-3">
                Chaque charge peut être <strong className="text-foreground">ponctuelle, mensuelle, trimestrielle ou annuelle</strong>.
                Les charges récurrentes sont automatiquement réparties dans le bilan annuel.
              </p>
            </Step>

            {/* Étape 5 : Le bilan financier */}
            <Step number={5} title="Consulter le bilan financier" icon={BarChart3}>
              <p>
                L'onglet <strong className="text-foreground">Bilan</strong> affiche une vue d'ensemble de votre activité :
              </p>
              <div className="space-y-3 mt-3">
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">📊 4 KPIs</p>
                  <p className="text-xs text-muted-foreground">
                    CA total des contrats, montant encaissé, total des charges, nombre de clients actifs.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">📈 Graphique annuel</p>
                  <p className="text-xs text-muted-foreground">
                    Barres mensuelles comparant votre CA, les encaissements et les charges.
                    Sélecteur d'année pour naviguer entre les exercices.
                  </p>
                </div>
                <div className="p-3 rounded-lg border border-border bg-card">
                  <p className="font-medium text-foreground text-sm mb-1">🏷️ Répartition des charges</p>
                  <p className="text-xs text-muted-foreground">
                    Top 5 des catégories de dépenses avec barres de progression et pourcentages.
                  </p>
                </div>
              </div>
              <Tip>
                Le bilan se met à jour en temps réel. Chaque contrat ou charge ajouté est immédiatement
                reflété dans les KPIs et les graphiques.
              </Tip>
            </Step>
          </div>

          <div className="mt-4 flex justify-center">
            <Button asChild>
              <Link to="/clients" className="gap-2">
                <Wallet className="h-4 w-4" />
                Aller aux Clients & Finances
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      {/* ═══════════════════════════════════════ */}
      {/* SECTION 6 : TEMPLATES EMAIL             */}
      {/* ═══════════════════════════════════════ */}
      <div id="templates" className={cn("scroll-mt-6", openSections.includes('templates') && "col-span-full")}>
        <Section
          id="templates"
          title="Templates Email"
          icon={Mail}
          emoji="✉️"
          iconColor="text-purple-500"
          gradient="from-purple-500/20 to-fuchsia-500/20"
          borderColor="border-purple-500/20 hover:border-purple-500/50 hover:shadow-purple-500/5 hover:bg-purple-500/5"
          description="Créez des modèles avec variables dynamiques et envoyez en masse."
          isOpen={openSections.includes('templates')}
          onToggle={toggleSection}
        >
          <div className="space-y-8">
            <p className="text-muted-foreground text-sm">
              Les templates transforment vos emails en <strong className="text-foreground">fusées personnalisées</strong> 🚀 —
              écrivez une fois, envoyez à des centaines de prospects avec leurs données automatiquement injectées.
            </p>

            {/* ──── CONCEPT VISUEL : AVANT / APRÈS ──── */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl border-2 border-dashed border-muted-foreground/30 bg-muted/20 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✍️</span>
                  <span className="font-semibold text-sm text-foreground">Vous écrivez :</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-lg border leading-relaxed">
{`Bonjour `}<span className="text-purple-500 font-bold">{`{{firstName}}`}</span>{`,

Je contacte `}<span className="text-purple-500 font-bold">{`{{company}}`}</span>{` car
votre secteur `}<span className="text-purple-500 font-bold">{`{{sector}}`}</span>{` m'intéresse.

`}<span className="text-orange-500 font-bold">{`{{content}}`}</span>{`

📞 `}<span className="text-purple-500 font-bold">{`{{phone : "me contacter"}}`}</span>
                </pre>
              </div>
              <div className="p-4 rounded-xl border-2 border-green-500/30 bg-green-500/5 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-lg">✨</span>
                  <span className="font-semibold text-sm text-foreground">Le prospect reçoit :</span>
                </div>
                <pre className="text-xs font-mono whitespace-pre-wrap bg-background p-3 rounded-lg border border-green-500/20 leading-relaxed">
{`Bonjour `}<span className="text-green-600 font-bold">Jean</span>{`,

Je contacte `}<span className="text-green-600 font-bold">SARL Dupont</span>{` car
votre secteur `}<span className="text-green-600 font-bold">Bâtiment</span>{` m'intéresse.

`}<span className="text-orange-600 font-bold">Au fait, j'ai trouvé cette info pour vous !</span>{`

📞 `}<span className="text-green-600 font-bold">06 12 34 56 78</span>
                </pre>
              </div>
            </div>

            {/* ──── LES VARIABLES : CARTES VISUELLES ──── */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                🏷️ Les variables disponibles
              </h3>
              <p className="text-sm text-muted-foreground">
                Chaque variable est remplacée par la donnée réelle de votre prospect.
                <strong className="text-foreground"> Cliquez pour copier.</strong>
              </p>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                {[
                  { key: "firstName",     emoji: "👤", label: "Prénom",       ex: "Jean" },
                  { key: "lastName",      emoji: "👤", label: "Nom",          ex: "Dupont" },
                  { key: "company",       emoji: "🏢", label: "Entreprise",   ex: "SARL Dupont" },
                  { key: "sector",        emoji: "💼", label: "Secteur",      ex: "Bâtiment" },
                  { key: "email",         emoji: "📧", label: "Email",        ex: "j.dupont@mail.fr" },
                  { key: "phone",         emoji: "📱", label: "Téléphone",    ex: "06 12 34 56 78" },
                  { key: "address",       emoji: "📍", label: "Adresse",      ex: "12 rue de la Paix" },
                  { key: "city",          emoji: "🏙️", label: "Ville",        ex: "Lyon" },
                  { key: "postalCode",    emoji: "📮", label: "Code postal",  ex: "69001" },
                  { key: "juridicalForm", emoji: "⚖️", label: "Forme juridique", ex: "SARL" },
                  { key: "siret",         emoji: "🔢", label: "SIRET",        ex: "12345678901234" },
                  { key: "activityCode",  emoji: "🏭", label: "Code APE",     ex: "43.21A" },
                  { key: "creationDate",  emoji: "📅", label: "Date création", ex: "15/03/2010" },
                  { key: "status",        emoji: "📊", label: "Statut",       ex: "prospect" },
                  { key: "notes",         emoji: "📝", label: "Notes",        ex: "À rappeler lundi" },
                  { key: "tags",          emoji: "🏷️", label: "Tags",         ex: "BTP, urgent" },
                ].map((v) => (
                  <button
                    key={v.key}
                    onClick={() => navigator.clipboard.writeText(`{{${v.key}}}`)}
                    className="group text-left p-3 rounded-lg border border-border hover:border-purple-500/50 hover:bg-purple-500/5 transition-all"
                    title={`Cliquer pour copier {{${v.key}}}`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span>{v.emoji}</span>
                      <span className="font-medium text-xs text-foreground">{v.label}</span>
                    </div>
                    <code className="text-[10px] font-mono text-purple-500 group-hover:text-purple-400">{`{{${v.key}}}`}</code>
                    <p className="text-[10px] text-muted-foreground mt-0.5 italic">→ {v.ex}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* ──── PARAMÈTRES / VALEURS PAR DÉFAUT ──── */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                ⚡ Paramètres et valeurs par défaut
              </h3>
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Toutes les variables</strong> acceptent un paramètre optionnel avec la syntaxe
                <code className="text-purple-500 font-mono bg-purple-500/10 px-1.5 py-0.5 rounded mx-1">{`{{variable : "valeur par défaut"}}`}</code>.
                Si la donnée du prospect est vide, la valeur par défaut est utilisée à la place.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {/* Exemple 1 */}
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-xs font-medium text-foreground">📱 Téléphone avec fallback :</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 rounded bg-muted/50 font-mono text-xs">
                      <span className="text-purple-500">{`{{phone : "nous contacter"}}`}</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-muted-foreground mb-0.5">Si le prospect a un tel :</p>
                      <p className="font-medium text-green-600">06 12 34 56 78</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <p className="text-muted-foreground mb-0.5">Si pas de tel :</p>
                      <p className="font-medium text-amber-600">nous contacter</p>
                    </div>
                  </div>
                </div>

                {/* Exemple 2 */}
                <div className="p-4 rounded-lg border bg-card space-y-2">
                  <p className="text-xs font-medium text-foreground">👤 Prénom avec fallback :</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 p-2 rounded bg-muted/50 font-mono text-xs">
                      Bonjour <span className="text-purple-500">{`{{firstName : "cher client"}}`}</span>,
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 rounded bg-green-500/10 border border-green-500/20">
                      <p className="text-muted-foreground mb-0.5">Si prénom connu :</p>
                      <p className="font-medium text-green-600">Bonjour Jean,</p>
                    </div>
                    <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20">
                      <p className="text-muted-foreground mb-0.5">Si pas de prénom :</p>
                      <p className="font-medium text-amber-600">Bonjour cher client,</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ──── LA STAR : {{content}} ──── */}
            <div className="space-y-4">
              <h3 className="font-bold text-foreground flex items-center gap-2 text-base">
                🌟 La variable magique : <code className="text-purple-500 font-mono bg-purple-500/10 px-2 py-1 rounded">{`{{content}}`}</code>
              </h3>

              <div className="p-5 rounded-xl border-2 border-purple-500/40 bg-gradient-to-br from-purple-500/10 to-fuchsia-500/10 space-y-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">💡</span>
                  <div className="space-y-2">
                    <p className="text-sm text-foreground font-medium">
                      C'est quoi <code className="text-purple-500 font-mono">{`{{content}}`}</code> ?
                    </p>
                    <p className="text-sm text-muted-foreground">
                      C'est un <strong className="text-foreground">texte libre que vous écrivez au moment de l'envoi</strong>,
                      différent pour chaque personne. Idéal pour les envois groupés où vous voulez garder
                      le même template mais personnaliser un paragraphe.
                    </p>
                  </div>
                </div>

                {/* Le concept clé */}
                <div className="p-4 rounded-lg bg-background border space-y-3">
                  <p className="text-xs font-semibold text-foreground">🎯 La syntaxe complète :</p>
                  <div className="p-3 rounded-lg bg-muted/50 font-mono text-sm leading-relaxed">
                    <span className="text-purple-500 font-bold">{`{{content : "Au fait, j'ai trouvé cette info pour {{firstName}} !"}}`}</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-muted-foreground">
                    <p>☝️ Le texte entre guillemets est votre <strong className="text-foreground">contenu personnalisé</strong>.</p>
                    <p>☝️ Vous pouvez utiliser <strong className="text-foreground">d'autres variables dedans</strong> — elles seront remplacées par les données de chaque prospect !</p>
                    <p>☝️ En envoi groupé, vous écrivez un <strong className="text-foreground">contenu différent pour chaque personne</strong>.</p>
                  </div>
                </div>

                {/* Envoi groupé visuel */}
                <div className="space-y-3">
                  <p className="text-xs font-semibold text-foreground">📨 Exemple concret — Envoi groupé à 3 prospects :</p>

                  <div className="p-3 rounded-lg bg-muted/30 border font-mono text-xs mb-3">
                    <span className="text-muted-foreground">Template :</span>
                    <pre className="mt-1 whitespace-pre-wrap leading-relaxed">{`Bonjour `}<span className="text-purple-500">{`{{firstName}}`}</span>{`,
`}<span className="text-orange-500 font-bold">{`{{content}}`}</span>{`
Cordialement`}</pre>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-sm">👨</div>
                        <div>
                          <p className="font-semibold text-xs text-foreground">Jean Dupont</p>
                          <p className="text-[10px] text-muted-foreground">SARL Dupont</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Son contenu :</p>
                        <p className="text-xs italic text-orange-600">"Au fait j'ai trouvé cette info sur le BTP pour toi Jean !"</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                        <p className="text-[10px] text-muted-foreground mb-1">→ Résultat :</p>
                        <p>Bonjour <strong>Jean</strong>,</p>
                        <p className="text-orange-600">Au fait j'ai trouvé cette info sur le BTP pour toi Jean !</p>
                        <p>Cordialement</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center text-sm">👩</div>
                        <div>
                          <p className="font-semibold text-xs text-foreground">Marie Martin</p>
                          <p className="text-[10px] text-muted-foreground">SAS WebDesign</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Son contenu :</p>
                        <p className="text-xs italic text-orange-600">"Suite à notre échange de mardi, voici ma proposition."</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                        <p className="text-[10px] text-muted-foreground mb-1">→ Résultat :</p>
                        <p>Bonjour <strong>Marie</strong>,</p>
                        <p className="text-orange-600">Suite à notre échange de mardi, voici ma proposition.</p>
                        <p>Cordialement</p>
                      </div>
                    </div>

                    <div className="p-3 rounded-lg border bg-card space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-sm">👨‍💼</div>
                        <div>
                          <p className="font-semibold text-xs text-foreground">Paul Bernard</p>
                          <p className="text-[10px] text-muted-foreground">EI Bernard</p>
                        </div>
                      </div>
                      <div className="p-2 rounded bg-orange-500/10 border border-orange-500/20">
                        <p className="text-[10px] text-muted-foreground mb-0.5">Son contenu :</p>
                        <p className="text-xs italic text-orange-600">"Votre expertise à Lyon m'intéresse pour un projet à Lyon !"</p>
                      </div>
                      <div className="p-2 rounded bg-green-500/10 border border-green-500/20 text-xs">
                        <p className="text-[10px] text-muted-foreground mb-1">→ Résultat :</p>
                        <p>Bonjour <strong>Paul</strong>,</p>
                        <p className="text-orange-600">Votre expertise à Lyon m'intéresse pour un projet à Lyon !</p>
                        <p>Cordialement</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Variables dans content */}
                <div className="p-4 rounded-lg bg-background border space-y-3">
                  <p className="text-xs font-semibold text-foreground">🔗 Bonus : des variables dans le contenu !</p>
                  <p className="text-xs text-muted-foreground">
                    Le texte dans <code className="font-mono text-purple-500">{`{{content}}`}</code> peut lui-même contenir
                    <strong className="text-foreground"> n'importe quelle autre variable</strong> — elles seront remplacées par les données de chaque prospect :
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded bg-muted/50 font-mono text-xs space-y-1">
                      <p className="text-muted-foreground text-[10px] mb-1">✍️ Vous écrivez :</p>
                      <p><span className="text-orange-500">{`{{content : "J'ai vu que {{company}} à {{city}} recrute, on en parle {{firstName}} ?"}}`}</span></p>
                    </div>
                    <div className="p-3 rounded bg-green-500/10 border border-green-500/20 font-mono text-xs space-y-1">
                      <p className="text-muted-foreground text-[10px] mb-1">✨ Jean Dupont reçoit :</p>
                      <p className="text-green-600">J'ai vu que <strong>SARL Dupont</strong> à <strong>Lyon</strong> recrute, on en parle <strong>Jean</strong> ?</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ──── RÉSUMÉ RAPIDE ──── */}
            <div className="p-4 rounded-xl bg-muted/30 border space-y-3">
              <h3 className="font-bold text-sm text-foreground">📋 En résumé</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-background border text-center space-y-1">
                  <span className="text-2xl">🏷️</span>
                  <p className="font-semibold text-xs text-foreground">{`{{variable}}`}</p>
                  <p className="text-[10px] text-muted-foreground">Remplacée par la donnée du prospect</p>
                </div>
                <div className="p-3 rounded-lg bg-background border text-center space-y-1">
                  <span className="text-2xl">🛡️</span>
                  <p className="font-semibold text-xs text-foreground">{`{{var : "défaut"}}`}</p>
                  <p className="text-[10px] text-muted-foreground">Avec valeur de secours si donnée vide</p>
                </div>
                <div className="p-3 rounded-lg bg-background border text-center space-y-1">
                  <span className="text-2xl">🌟</span>
                  <p className="font-semibold text-xs text-foreground">{`{{content}}`}</p>
                  <p className="text-[10px] text-muted-foreground">Texte libre personnalisé par prospect</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link to="/templates" className="gap-2">
                <Mail className="h-4 w-4" />
                Créer mon premier template
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </Section>
      </div>

      </div>{/* fin grid */}

      {/* ══ PARCOURS RECOMMANDÉ ══ */}
      <div className="relative overflow-hidden rounded-2xl border-2 border-dashed border-primary/20 bg-gradient-to-br from-primary/5 via-background to-purple-500/5 p-8 md:p-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/5 rounded-full blur-3xl" />
        <div className="text-center space-y-6 relative z-10">
          <div className="text-4xl">🗺️</div>
          <h3 className="font-bold text-xl text-foreground">Parcours recommandé</h3>
          <p className="text-sm text-muted-foreground max-w-lg mx-auto">
            Suivez ces étapes pour tirer le maximum de Kanveo, de l'import à la signature.
          </p>
          <div className="flex items-center justify-center gap-2 flex-wrap max-w-3xl mx-auto">
            {[
              { emoji: "🔍", label: "SIRENE", cls: "bg-blue-500/10 border-blue-500/20 text-blue-500" },
              { emoji: "💾", label: "Base de données", cls: "bg-violet-500/10 border-violet-500/20 text-violet-500" },
              { emoji: "🎯", label: "Pipeline", cls: "bg-emerald-500/10 border-emerald-500/20 text-emerald-500" },
              { emoji: "✉️", label: "Templates", cls: "bg-purple-500/10 border-purple-500/20 text-purple-500" },
              { emoji: "✅", label: "Tâches", cls: "bg-orange-500/10 border-orange-500/20 text-orange-500" },
              { emoji: "💰", label: "Clients", cls: "bg-pink-500/10 border-pink-500/20 text-pink-500" },
              { emoji: "📊", label: "Dashboard", cls: "bg-amber-500/10 border-amber-500/20 text-amber-500" },
            ].map((step, i, arr) => (
              <div key={step.label} className="flex items-center gap-2">
                <div className={cn("flex items-center gap-2 px-4 py-2.5 rounded-xl border-2", step.cls)}>
                  <span className="text-xl">{step.emoji}</span>
                  <span className="text-sm font-semibold">{step.label}</span>
                </div>
                {i < arr.length - 1 && (
                  <ArrowRight className="h-5 w-5 text-muted-foreground/50 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto mt-2">
            Importez vos données → organisez-les dans un pipeline → envoyez vos emails → suivez vos KPIs.
          </p>
        </div>
      </div>
    </div>
  );
}
