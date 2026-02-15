import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useTheme, THEMES } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";
import { supabase } from "../lib/supabaseClient";
import Toast from "../components/Toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Separator } from "../components/ui/separator";
import { Badge } from "../components/ui/badge";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import {
  Settings as SettingsIcon,
  User,
  Palette,
  Shield,
  AlertTriangle,
  Save,
  Moon,
  Sun,
  KeyRound,
  LogOut,
  Trash2,
  Download,
  CheckCircle2,
  Loader2,
  Mail,
  CreditCard,
  ExternalLink,
  Handshake,
  Link2,
  Copy,
  Check,
  BarChart3,
  Landmark,
  ShieldCheck,
  Lock,
  MessageSquarePlus,
} from "lucide-react";

import { openBillingPortal } from "../services/stripeService";
import { AffiliateService } from "../services/affiliateService";
import { FeedbackService } from "../services/feedbackService";
import FeedbackFormModal from "../components/feedback/FeedbackFormModal";
import FeedbackList from "../components/feedback/FeedbackList";

export default function Settings() {
  const { user, profile, signout, subscriptionStatus, isSubscribed } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const { toasts, addToast, removeToast } = useToast();
  // État du profil
  const [profileForm, setProfileForm] = useState({
    full_name: "",
    first_name: "",
    last_name: "",
    company_name: "",
  });
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState(false);

  // État sécurité
  const [passwordForm, setPasswordForm] = useState({
    newPassword: "",
    confirmPassword: "",
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState("");

  // État abonnement
  const [billingLoading, setBillingLoading] = useState(false);

  // État danger zone
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);

  // État partenaire
  const [affiliate, setAffiliate] = useState(null);
  const [affiliateLoading, setAffiliateLoading] = useState(false);
  const [affiliateCopied, setAffiliateCopied] = useState(false);
  const [bankForm, setBankForm] = useState({ bank_holder_name: "", bank_iban: "", bank_bic: "" });
  const [bankSaving, setBankSaving] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);

  // Charger le profil affilié
  useEffect(() => {
    if (user?.id) {
      AffiliateService.getMyAffiliate().then(data => {
        setAffiliate(data);
        if (data) {
          setBankForm({
            bank_holder_name: data.bank_holder_name || "",
            bank_iban: data.bank_iban || "",
            bank_bic: data.bank_bic || "",
          });
        }
      }).catch(() => {});
    }
  }, [user?.id]);
  const [exportLoading, setExportLoading] = useState(false);

  // État feedback
  const [feedbackModal, setFeedbackModal] = useState(false);
  const [feedbacks, setFeedbacks] = useState([]);
  const [feedbackLoading, setFeedbackLoading] = useState(false);

  // Charger les feedbacks de l'utilisateur
  useEffect(() => {
    if (user?.id) {
      setFeedbackLoading(true);
      FeedbackService.getUserFeedback(user.id)
        .then(setFeedbacks)
        .catch(() => {})
        .finally(() => setFeedbackLoading(false));
    }
  }, [user?.id]);

  // Charger le profil
  useEffect(() => {
    if (profile) {
      setProfileForm({
        full_name: profile.full_name || "",
        first_name: profile.first_name || "",
        last_name: profile.last_name || "",
        company_name: profile.company_name || "",
      });
    }
  }, [profile]);

  // Sauvegarder le profil
  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileSuccess(false);
    try {
      const { error } = await supabase
        .from("user_profiles")
        .update({
          full_name: profileForm.full_name,
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          company_name: profileForm.company_name,
        })
        .eq("id", user.id);

      if (error) throw error;
      setProfileSuccess(true);
      setTimeout(() => setProfileSuccess(false), 3000);
    } catch (err) {
      addToast(err.message || 'Erreur lors de la sauvegarde du profil', 'error');
    } finally {
      setProfileLoading(false);
    }
  };

  // Changer le mot de passe
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setPasswordSuccess(false);

    if (passwordForm.newPassword.length < 6) {
      setPasswordError("Le mot de passe doit contenir au moins 6 caractères");
      return;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Les mots de passe ne correspondent pas");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: passwordForm.newPassword,
      });
      if (error) throw error;
      setPasswordSuccess(true);
      setPasswordForm({ newPassword: "", confirmPassword: "" });
      setTimeout(() => setPasswordSuccess(false), 3000);
    } catch (err) {
      setPasswordError(err.message);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Exporter les données
  const handleExportData = async () => {
    setExportLoading(true);
    try {
      // Récupérer les données utilisateur (export RGPD complet)
      const [prospectsRes, tasksRes, clientsRes, contractsRes, expensesRes, kanbanRes] = await Promise.all([
        supabase.from("prospects").select("*").eq("user_id", user.id),
        supabase.from("tasks").select("*").eq("user_id", user.id),
        supabase.from("clients").select("*").eq("user_id", user.id),
        supabase.from("contracts").select("*").eq("user_id", user.id),
        supabase.from("expenses").select("*").eq("user_id", user.id),
        supabase.from("kanban_boards").select("*").eq("user_id", user.id),
      ]);

      const exportData = {
        exported_at: new Date().toISOString(),
        user_email: user.email,
        profile: profile,
        prospects: prospectsRes.data || [],
        tasks: tasksRes.data || [],
        clients: clientsRes.data || [],
        contracts: contractsRes.data || [],
        expenses: expensesRes.data || [],
        kanban_boards: kanbanRes.data || [],
      };

      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `kanveo-export-${new Date().toISOString().split("T")[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      addToast(err.message || 'Erreur lors de l\'export des données', 'error');
    } finally {
      setExportLoading(false);
    }
  };

  // Supprimer le compte
  const handleDeleteAccount = async () => {
    if (deleteConfirm !== "SUPPRIMER") return;
    setDeleteLoading(true);
    try {
      // Appeler la fonction DB qui supprime l'entrée auth.users (cascade sur tout)
      const { error } = await supabase.rpc('delete_own_account');
      if (error) throw error;
      await signout();
    } catch (err) {
      addToast(err.message || 'Erreur lors de la suppression du compte', 'error');
    } finally {
      setDeleteLoading(false);
    }
  };

  const getInitials = () => {
    if (profileForm.first_name && profileForm.last_name) {
      return `${profileForm.first_name[0]}${profileForm.last_name[0]}`.toUpperCase();
    }
    if (profileForm.full_name) {
      return profileForm.full_name.substring(0, 2).toUpperCase();
    }
    return user?.email?.substring(0, 2).toUpperCase() || "?";
  };

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <SettingsIcon className="h-6 w-6" />
              </div>
              <div>
                <CardTitle className="text-3xl font-bold tracking-tight">Paramètres</CardTitle>
                <CardDescription className="text-base mt-1">
                  Gérez votre profil, apparence et sécurité
                </CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* ===================== 1. PROFIL ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <User className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Profil utilisateur</CardTitle>
                <CardDescription>Vos informations personnelles</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Avatar et email */}
              <div className="flex items-center gap-4 p-4 rounded-lg bg-muted/50">
                <Avatar className="h-16 w-16 text-lg">
                  <AvatarFallback className="bg-primary/20 text-primary text-lg font-bold">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold text-foreground">
                    {profileForm.full_name || user?.email}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">{user?.email}</span>
                  </div>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {profile?.role_level === 3
                      ? "Administrateur"
                      : profile?.role_level === 2
                      ? "Chef d'équipe"
                      : "Membre"}
                  </Badge>
                </div>
              </div>

              {/* Champs du formulaire */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="first_name">Prénom</Label>
                  <Input
                    id="first_name"
                    value={profileForm.first_name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, first_name: e.target.value }))
                    }
                    placeholder="Votre prénom"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="last_name">Nom</Label>
                  <Input
                    id="last_name"
                    value={profileForm.last_name}
                    onChange={(e) =>
                      setProfileForm((p) => ({ ...p, last_name: e.target.value }))
                    }
                    placeholder="Votre nom"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nom complet</Label>
                <Input
                  id="full_name"
                  value={profileForm.full_name}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, full_name: e.target.value }))
                  }
                  placeholder="Prénom Nom"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="company_name">Entreprise</Label>
                <Input
                  id="company_name"
                  value={profileForm.company_name}
                  onChange={(e) =>
                    setProfileForm((p) => ({ ...p, company_name: e.target.value }))
                  }
                  placeholder="Nom de votre entreprise"
                />
              </div>

              <div className="flex items-center gap-3">
                <Button type="submit" disabled={profileLoading}>
                  {profileLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Save className="h-4 w-4 mr-2" />
                  )}
                  Sauvegarder
                </Button>
                {profileSuccess && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Profil mis à jour
                  </span>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        {/* ===================== 2. ABONNEMENT ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <CreditCard className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Abonnement</CardTitle>
                <CardDescription>Gérez votre abonnement et votre facturation</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-medium text-foreground">Statut</p>
                  {isSubscribed ? (
                    <Badge className="bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/50">
                      Actif
                    </Badge>
                  ) : subscriptionStatus === 'past_due' ? (
                    <Badge variant="destructive">Paiement en retard</Badge>
                  ) : subscriptionStatus === 'canceled' ? (
                    <Badge variant="secondary">Annulé</Badge>
                  ) : (
                    <Badge variant="outline">Aucun abonnement</Badge>
                  )}
                </div>
                {profile?.current_period_end && isSubscribed && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Prochain renouvellement : {new Date(profile.current_period_end).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                )}
              </div>
              {isSubscribed || subscriptionStatus === 'past_due' ? (
                <Button
                  variant="outline"
                  onClick={async () => {
                    setBillingLoading(true);
                    try {
                      await openBillingPortal();
                    } catch {
                      setBillingLoading(false);
                    }
                  }}
                  disabled={billingLoading}
                  className="gap-2"
                >
                  {billingLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="h-4 w-4" />
                  )}
                  Gérer l'abonnement
                </Button>
              ) : (
                <Button asChild className="gap-2">
                  <Link to="/subscribe">
                    <CreditCard className="h-4 w-4" />
                    S'abonner
                  </Link>
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ===================== 3. APPARENCE ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Palette className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Apparence</CardTitle>
                <CardDescription>Personnalisez l'interface</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                {isDark ? (
                  <Moon className="h-5 w-5 text-muted-foreground" />
                ) : (
                  <Sun className="h-5 w-5 text-yellow-500" />
                )}
                <div>
                  <p className="font-medium text-foreground">
                    Thème {isDark ? "sombre" : "clair"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {isDark
                      ? "Interface sombre, idéale pour travailler de nuit"
                      : "Interface claire, idéale pour travailler de jour"}
                  </p>
                </div>
              </div>
              <Button variant="outline" onClick={toggleTheme} className="gap-2">
                {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
                {isDark ? "Mode clair" : "Mode sombre"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 4. PARTENAIRE ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Handshake className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Programme Partenaire</CardTitle>
                <CardDescription>Gagnez 5€/mois par abonné parrainé via votre lien</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {affiliate ? (
              <>
                <div className="p-4 rounded-lg bg-muted/50 space-y-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Link2 className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">Votre lien d'affiliation</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm bg-background px-3 py-2 rounded border font-mono truncate">
                      {AffiliateService.getAffiliateUrl(affiliate.affiliate_code)}
                    </code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => {
                        navigator.clipboard.writeText(AffiliateService.getAffiliateUrl(affiliate.affiliate_code));
                        setAffiliateCopied(true);
                        setTimeout(() => setAffiliateCopied(false), 2000);
                      }}
                    >
                      {affiliateCopied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Code : <span className="font-mono font-medium">{affiliate.affiliate_code}</span>
                  </p>
                </div>

                <Button variant="outline" asChild className="gap-2 w-full sm:w-auto">
                  <Link to="/partenaire/dashboard">
                    <BarChart3 className="h-4 w-4" />
                    Voir mon dashboard partenaire
                  </Link>
                </Button>
                {/* Coordonnées bancaires */}                <Separator />
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Landmark className="h-4 w-4 text-primary" />
                    <p className="font-medium text-sm">Coordonnées bancaires</p>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Pour recevoir vos commissions, renseignez votre IBAN ci-dessous.
                  </p>

                  <div className="space-y-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="bank_holder">Titulaire du compte</Label>
                      <Input
                        id="bank_holder"
                        value={bankForm.bank_holder_name}
                        onChange={e => setBankForm(f => ({ ...f, bank_holder_name: e.target.value }))}
                        placeholder="Jean Dupont"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bank_iban">IBAN</Label>
                      <Input
                        id="bank_iban"
                        value={bankForm.bank_iban}
                        onChange={e => setBankForm(f => ({ ...f, bank_iban: e.target.value }))}
                        placeholder="FR76 1234 5678 9012 3456 7890 123"
                        className="font-mono"
                        autoComplete="off"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="bank_bic">BIC / SWIFT</Label>
                      <Input
                        id="bank_bic"
                        value={bankForm.bank_bic}
                        onChange={e => setBankForm(f => ({ ...f, bank_bic: e.target.value }))}
                        placeholder="BNPAFRPP"
                        className="font-mono"
                      />
                    </div>
                  </div>

                  <Button
                    onClick={async () => {
                      setBankSaving(true);
                      setBankSaved(false);
                      try {
                        const updated = await AffiliateService.updateBankDetails(affiliate.id, bankForm);
                        setAffiliate(updated);
                        setBankSaved(true);
                        setTimeout(() => setBankSaved(false), 3000);
                      } catch (err) {
                        addToast(err.message || 'Erreur lors de la sauvegarde des coordonnées bancaires', 'error');
                      } finally {
                        setBankSaving(false);
                      }
                    }}
                    disabled={bankSaving || !bankForm.bank_holder_name || !bankForm.bank_iban}
                    className="gap-2"
                  >
                    {bankSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : bankSaved ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                    {bankSaved ? "Enregistré !" : "Enregistrer"}
                  </Button>

                  {/* Sécurité */}
                  <div className="rounded-lg bg-green-500/5 border border-green-500/20 p-3 space-y-2">
                    <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-sm font-medium">Vos données sont sécurisées</p>
                    </div>
                    <ul className="text-xs text-muted-foreground space-y-1 ml-6">
                      <li className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 flex-shrink-0" />
                        Connexion chiffrée SSL/TLS de bout en bout
                      </li>
                      <li className="flex items-center gap-1.5">
                        <ShieldCheck className="h-3 w-3 flex-shrink-0" />
                        Hébergé chez Supabase (infrastructure certifiée SOC2)
                      </li>
                      <li className="flex items-center gap-1.5">
                        <Lock className="h-3 w-3 flex-shrink-0" />
                        Accès restreint : seul vous et l'administrateur pouvez voir vos coordonnées
                      </li>
                    </ul>
                  </div>
                </div>
              </>
            ) : (
              <div className="p-4 rounded-lg border border-dashed border-primary/30 bg-primary/5 text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center">
                  <Handshake className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-medium mb-1">Devenez partenaire Kanveo</p>
                  <p className="text-sm text-muted-foreground">
                    Partagez votre lien d'affiliation et gagnez 5€/mois pour chaque abonné parrainé, tant qu'il reste abonné.
                  </p>
                </div>
                <Button
                  onClick={async () => {
                    setAffiliateLoading(true);
                    try {
                      const data = await AffiliateService.becomeAffiliate(user.id);
                      setAffiliate(data);
                    } catch (err) {
                      // Déjà affilié ou erreur
                    } finally {
                      setAffiliateLoading(false);
                    }
                  }}
                  disabled={affiliateLoading}
                  className="gap-2"
                >
                  {affiliateLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Link2 className="h-4 w-4" />
                  )}
                  Générer mon lien d'affiliation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* ===================== 5. SÉCURITÉ ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <Shield className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Sécurité</CardTitle>
                <CardDescription>Gérez votre mot de passe et vos sessions</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Changer le mot de passe */}
            <form onSubmit={handleChangePassword} className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <KeyRound className="h-4 w-4 text-muted-foreground" />
                <p className="font-medium text-foreground">Changer le mot de passe</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input
                    id="newPassword"
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={passwordForm.confirmPassword}
                    onChange={(e) =>
                      setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                    }
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              </div>

              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}

              <div className="flex items-center gap-3">
                <Button
                  type="submit"
                  variant="outline"
                  disabled={passwordLoading || !passwordForm.newPassword}
                >
                  {passwordLoading ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <KeyRound className="h-4 w-4 mr-2" />
                  )}
                  Mettre à jour
                </Button>
                {passwordSuccess && (
                  <span className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" />
                    Mot de passe modifié
                  </span>
                )}
              </div>
            </form>

            <Separator />

            {/* Déconnexion */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-foreground">Se déconnecter</p>
                <p className="text-sm text-muted-foreground">
                  Fermer votre session sur cet appareil
                </p>
              </div>
              <Button variant="outline" onClick={signout} className="gap-2">
                <LogOut className="h-4 w-4" />
                Déconnexion
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* ===================== 6. FEEDBACK ===================== */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <MessageSquarePlus className="h-5 w-5 text-primary" />
                <div>
                  <CardTitle>Feedback & Support</CardTitle>
                  <CardDescription>Signalez un bug, posez une question ou suggérez une amélioration</CardDescription>
                </div>
              </div>
              <Button onClick={() => setFeedbackModal(true)} className="gap-2">
                <MessageSquarePlus className="h-4 w-4" />
                Nouveau feedback
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <FeedbackList
              feedbacks={feedbacks}
              loading={feedbackLoading}
              isAdmin={false}
            />
          </CardContent>
        </Card>

        {/* ===================== 7. DANGER ZONE ===================== */}
        <Card className="border-destructive/50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              <div>
                <CardTitle className="text-destructive">Zone de danger</CardTitle>
                <CardDescription>Actions irréversibles sur votre compte</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Exporter les données */}
            <div className="flex items-center justify-between p-4 rounded-lg border border-border">
              <div>
                <p className="font-medium text-foreground">Exporter mes données</p>
                <p className="text-sm text-muted-foreground">
                  Téléchargez une copie de toutes vos données (prospects, tâches)
                </p>
              </div>
              <Button variant="outline" onClick={handleExportData} disabled={exportLoading} className="gap-2">
                {exportLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Exporter
              </Button>
            </div>

            <Separator />

            {/* Supprimer le compte */}
            <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
              <div className="mb-4">
                <p className="font-medium text-destructive">Supprimer mon compte</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Cette action est définitive. Toutes vos données seront supprimées et
                  ne pourront pas être récupérées.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <Input
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder='Tapez "SUPPRIMER" pour confirmer'
                  className="max-w-xs border-destructive/30 focus-visible:ring-destructive"
                />
                <Button
                  variant="destructive"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirm !== "SUPPRIMER" || deleteLoading}
                  className="gap-2"
                >
                  {deleteLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                  Supprimer
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      {/* Feedback modal */}
      <FeedbackFormModal
        open={feedbackModal}
        onOpenChange={setFeedbackModal}
        onSave={async (form) => {
          const feedback = await FeedbackService.createFeedback({
            userId: user.id,
            userEmail: user.email,
            userName: profile?.full_name || null,
            category: form.category,
            subject: form.subject,
            message: form.message,
            pageUrl: window.location.pathname,
          });
          setFeedbacks(prev => [feedback, ...prev]);
          addToast('Merci pour votre retour ! Nous le traiterons rapidement.', 'success');
        }}
      />

      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
