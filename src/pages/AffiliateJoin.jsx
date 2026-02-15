import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabaseClient";
import { AffiliateService } from "../services/affiliateService";
import { createCheckout } from "../services/stripeService";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Separator } from "../components/ui/separator";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import {
  Loader2,
  Mail,
  Lock,
  User,
  Building2,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Shield,
  Search,
  LayoutDashboard,
  ClipboardList,
  BarChart3,
} from "lucide-react";

const features = [
  { icon: Search, text: "Import SIRENE illimité" },
  { icon: LayoutDashboard, text: "Pipeline multi-vues (Kanban, liste, carte)" },
  { icon: ClipboardList, text: "Gestion de tâches intégrée" },
  { icon: BarChart3, text: "Dashboard analytique complet" },
];

export default function AffiliateJoin() {
  const { code } = useParams();
  const navigate = useNavigate();
  const { signup, signin, signInWithOAuth, user } = useAuth();

  // Validation state
  const [validating, setValidating] = useState(true);
  const [affiliate, setAffiliate] = useState(null);
  const [codeError, setCodeError] = useState("");

  // Auth state
  const [authMode, setAuthMode] = useState("signup");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Login form
  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  // Signup form
  const [signupForm, setSignupForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    company: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });

  // Validate affiliate code on mount
  useEffect(() => {
    async function validateCode() {
      if (!code) {
        setCodeError("Aucun code d'affiliation fourni.");
        setValidating(false);
        return;
      }

      const { data, error } = await supabase
        .from("affiliates")
        .select("id, affiliate_code, is_active")
        .eq("affiliate_code", code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (error || !data) {
        setCodeError("Ce code d'affiliation est invalide ou a expiré.");
        setValidating(false);
        return;
      }

      setAffiliate(data);
      setValidating(false);

      // Track the click in background
      AffiliateService.trackClick(code.toUpperCase()).catch(() => {});

      // Store code in localStorage as backup
      localStorage.setItem("kanveo_ref", code.toUpperCase());
    }

    validateCode();
  }, [code]);

  // If user is already logged in, track + redirect to checkout
  useEffect(() => {
    if (user && affiliate) {
      AffiliateService.trackSignup(code.toUpperCase(), user.id)
        .catch(() => {})
        .then(() => {
          createCheckout().catch(() => navigate("/subscribe"));
        });
    }
  }, [user, affiliate]);

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSignupChange = (e) => {
    const { name, value } = e.target;
    setSignupForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!loginForm.email || !loginForm.password) {
      setError("Veuillez remplir tous les champs");
      setIsLoading(false);
      return;
    }

    try {
      await signin(loginForm.email, loginForm.password);

      // Track the referral
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (authUser) {
        await AffiliateService.trackSignup(code.toUpperCase(), authUser.id);
        localStorage.removeItem("kanveo_ref");
      }

      setSuccess("Connexion réussie ! Redirection vers le paiement...");

      // Redirect to Stripe checkout
      setTimeout(async () => {
        try {
          await createCheckout();
        } catch {
          navigate("/subscribe");
        }
      }, 1000);
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (
      !signupForm.firstName ||
      !signupForm.lastName ||
      !signupForm.email ||
      !signupForm.company ||
      !signupForm.password
    ) {
      setError("Veuillez remplir tous les champs obligatoires");
      setIsLoading(false);
      return;
    }

    if (signupForm.password !== signupForm.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (!signupForm.terms) {
      setError("Vous devez accepter les conditions d'utilisation");
      setIsLoading(false);
      return;
    }

    try {
      const fullName = `${signupForm.firstName} ${signupForm.lastName}`;
      await signup(signupForm.email, signupForm.password, fullName, signupForm.company);

      // Track the referral with the new user
      try {
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (authUser) {
          await AffiliateService.trackSignup(code.toUpperCase(), authUser.id);
        }
      } catch (_) {}

      setSuccess(
        "Inscription réussie ! Vérifiez votre email pour confirmer votre compte, puis connectez-vous ci-dessous pour finaliser votre abonnement."
      );
      setSignupForm({
        firstName: "",
        lastName: "",
        email: "",
        company: "",
        password: "",
        confirmPassword: "",
        terms: false,
      });
      // Switch to login tab after signup
      setTimeout(() => setAuthMode("login"), 3000);
    } catch (err) {
      setError(err.message || "Erreur lors de l'inscription");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setIsLoading(true);
      // Store code before OAuth redirect
      localStorage.setItem("kanveo_ref", code.toUpperCase());
      await signInWithOAuth("google");
    } catch (err) {
      setError(err.message || "Erreur lors de la connexion avec Google.");
      setIsLoading(false);
    }
  };

  // Loading state
  if (validating) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Vérification du code d'affiliation...</p>
        </div>
      </div>
    );
  }

  // Invalid code
  if (codeError) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="pt-8 pb-8 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-bold mb-2">Code invalide</h2>
            <p className="text-muted-foreground mb-6">{codeError}</p>
            <Button asChild>
              <Link to="/pricing">Voir nos offres</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-12 sm:py-16">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-3xl" />
          <div className="absolute bottom-10 right-1/4 w-[300px] h-[300px] bg-violet-500/5 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-3xl mx-auto px-4 text-center">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/10 mb-4">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>

          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-foreground mb-3">
            Rejoignez{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Kanveo
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-3">
            Vous avez été invité par un partenaire
          </p>

          <Badge className="text-sm px-4 py-1.5 bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/10">
            -20% — Offre partenaire
          </Badge>
        </div>
      </section>

      {/* Pricing Card */}
      <section className="pb-6 -mt-2">
        <div className="max-w-lg mx-auto px-4">
          <Card className="border-primary/20 shadow-lg">
            <CardHeader className="text-center pb-3">
              <CardTitle className="text-xl">Abonnement Kanveo</CardTitle>
              <div className="flex items-center justify-center gap-3 mt-2">
                <span className="text-3xl font-extrabold text-primary">15€</span>
                <span className="text-muted-foreground">/mois</span>
                <span className="text-lg text-muted-foreground line-through">19€</span>
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                La 1ère année · Sans engagement
              </p>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {features.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/10 flex-shrink-0">
                      <feature.icon className="h-3.5 w-3.5 text-primary" />
                    </div>
                    <span className="text-sm">{feature.text}</span>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground pt-1">
                <Shield className="h-3.5 w-3.5" />
                Paiement sécurisé par Stripe
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Auth Section — always visible */}
      <section className="pb-16 pt-2">
        <div className="max-w-md mx-auto px-4">
          <Card className="border-border/50 shadow-xl rounded-2xl">
            <Tabs
              value={authMode}
              onValueChange={(v) => {
                setAuthMode(v);
                setError("");
                setSuccess("");
              }}
              className="w-full"
            >
              <CardHeader className="pb-4">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="signup">Inscription</TabsTrigger>
                  <TabsTrigger value="login">Connexion</TabsTrigger>
                </TabsList>
              </CardHeader>

              <CardContent className="pt-2">
                {error && (
                  <Alert variant="destructive" className="mb-4">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                {success && (
                  <Alert className="mb-4 border-green-500/50 bg-green-500/10">
                    <CheckCircle2 className="h-4 w-4 text-green-500" />
                    <AlertDescription className="text-green-600 dark:text-green-400">
                      {success}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Signup Tab */}
                <TabsContent value="signup" className="mt-0 space-y-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="ref-firstName">Prénom *</Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <Input
                            id="ref-firstName"
                            type="text"
                            name="firstName"
                            value={signupForm.firstName}
                            onChange={handleSignupChange}
                            placeholder="Jean"
                            className="pl-10"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="ref-lastName">Nom *</Label>
                        <Input
                          id="ref-lastName"
                          type="text"
                          name="lastName"
                          value={signupForm.lastName}
                          onChange={handleSignupChange}
                          placeholder="Dupont"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref-signup-email">Email professionnel *</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-signup-email"
                          type="email"
                          name="email"
                          value={signupForm.email}
                          onChange={handleSignupChange}
                          placeholder="jean@entreprise.com"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref-company">Entreprise *</Label>
                      <div className="relative">
                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-company"
                          type="text"
                          name="company"
                          value={signupForm.company}
                          onChange={handleSignupChange}
                          placeholder="Acme Inc"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref-signup-password">Mot de passe *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-signup-password"
                          type="password"
                          name="password"
                          value={signupForm.password}
                          onChange={handleSignupChange}
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref-confirmPassword">Confirmer le mot de passe *</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-confirmPassword"
                          type="password"
                          name="confirmPassword"
                          value={signupForm.confirmPassword}
                          onChange={handleSignupChange}
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="ref-terms"
                        checked={signupForm.terms}
                        onCheckedChange={(checked) =>
                          setSignupForm((prev) => ({ ...prev, terms: checked }))
                        }
                        className="mt-1"
                      />
                      <Label
                        htmlFor="ref-terms"
                        className="text-sm font-normal text-muted-foreground cursor-pointer leading-relaxed"
                      >
                        J'accepte les{" "}
                        <a
                          href="/terms"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          conditions d'utilisation
                        </a>{" "}
                        et la{" "}
                        <a
                          href="/privacy"
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline"
                        >
                          politique de confidentialité
                        </a>
                      </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Création en cours..." : "Créer mon compte"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleGoogleLogin} className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    S'inscrire avec Google
                  </Button>
                </TabsContent>

                {/* Login Tab */}
                <TabsContent value="login" className="mt-0 space-y-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="ref-login-email">Email</Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-login-email"
                          type="email"
                          name="email"
                          value={loginForm.email}
                          onChange={handleLoginChange}
                          placeholder="votre@email.com"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="ref-login-password">Mot de passe</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="ref-login-password"
                          type="password"
                          name="password"
                          value={loginForm.password}
                          onChange={handleLoginChange}
                          placeholder="••••••••"
                          className="pl-10"
                        />
                      </div>
                    </div>

                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      {isLoading ? "Connexion en cours..." : "Se connecter et s'abonner"}
                    </Button>
                  </form>

                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <Separator className="w-full" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-card px-2 text-muted-foreground">ou</span>
                    </div>
                  </div>

                  <Button variant="outline" onClick={handleGoogleLogin} className="w-full">
                    <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24">
                      <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    </svg>
                    Continuer avec Google
                  </Button>
                </TabsContent>
              </CardContent>
            </Tabs>
          </Card>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 Kanveo. Tous les droits réservés.
          </p>
        </div>
      </section>
    </div>
  );
}
