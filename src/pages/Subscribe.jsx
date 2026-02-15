import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, ArrowLeft, Tag, Loader2, CheckCircle2, X, CreditCard, Sparkles, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { createCheckout, validateInfluencerCode } from "@/services/stripeService";
import { cn } from "@/lib/utils";

export default function Subscribe() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const initialBilling = searchParams.get("billing") === "annual" ? "annual" : "monthly";
  const [billing, setBilling] = useState(initialBilling);
  const [promoCode, setPromoCode] = useState("");
  const [promoStatus, setPromoStatus] = useState(null); // null | 'checking' | 'valid' | 'invalid'
  const [promoInfo, setPromoInfo] = useState(null);
  const [checkoutLoading, setCheckoutLoading] = useState(false);
  const [checkoutError, setCheckoutError] = useState("");

  const handleValidatePromo = async () => {
    if (!promoCode.trim()) return;
    setPromoStatus("checking");
    setPromoInfo(null);
    try {
      const result = await validateInfluencerCode(promoCode.trim());
      if (result.valid) {
        setPromoStatus("valid");
        setPromoInfo(result);
      } else {
        setPromoStatus("invalid");
      }
    } catch {
      setPromoStatus("invalid");
    }
  };

  const clearPromo = () => {
    setPromoCode("");
    setPromoStatus(null);
    setPromoInfo(null);
  };

  const handleCheckout = async () => {
    setCheckoutLoading(true);
    setCheckoutError("");
    try {
      await createCheckout(promoStatus === "valid" ? promoCode.trim() : null, billing);
    } catch (err) {
      setCheckoutError(err.message || "Erreur lors de la redirection vers le paiement");
      setCheckoutLoading(false);
    }
  };

  // Prices based on billing + promo
  const prices = {
    monthly: { base: "15", promo: "9,99", original: "19", suffix: "/mois", label: "mensuel" },
    annual: { base: "149", promo: "99", original: "199", suffix: "/an", label: "annuel" },
  };
  const p = prices[billing];
  const displayPrice = promoStatus === "valid" ? p.promo : p.base;
  const displayOriginal = p.original;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-16">
      <div className="max-w-md w-full space-y-6">
        {/* Back button */}
        <Button variant="ghost" onClick={() => navigate("/pricing")} className="gap-2 -ml-2">
          <ArrowLeft className="h-4 w-4" />
          Retour aux tarifs
        </Button>

        {/* Summary card */}
        <Card>
          <CardHeader className="text-center pb-4">
            <div className="flex justify-center mb-3">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="h-7 w-7 text-primary" />
              </div>
            </div>
            <CardTitle className="text-2xl">Finaliser l'abonnement</CardTitle>
            <CardDescription>
              Vous serez redirigé vers Stripe pour le paiement sécurisé
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Billing toggle */}
            <div className="flex items-center justify-center gap-2 p-1 bg-muted/50 rounded-full">
              <button
                onClick={() => setBilling("monthly")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  billing === "monthly"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                Mensuel
              </button>
              <button
                onClick={() => setBilling("annual")}
                className={cn(
                  "px-4 py-1.5 rounded-full text-xs font-medium transition-all",
                  billing === "annual"
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <CalendarDays className="h-3 w-3 inline mr-1" />
                Annuel
              </button>
            </div>

            {/* Price summary */}
            <div className="p-4 rounded-lg bg-muted/50 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-medium">Kanveo — Abonnement {p.label}</span>
                <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                  <Sparkles className="h-3 w-3 mr-1" />
                  Early Adopter
                </Badge>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold">{displayPrice}€</span>
                <span className="text-muted-foreground">{p.suffix}</span>
                <span className="text-sm text-muted-foreground line-through ml-auto">{displayOriginal}€{p.suffix}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                {promoStatus === "valid"
                  ? `Tarif influenceur pendant ${billing === "monthly" ? "12 mois" : "1 an"}, puis ${displayOriginal}€${p.suffix}`
                  : `Tarif fondateur pendant ${billing === "monthly" ? "12 mois" : "1 an"}, puis ${displayOriginal}€${p.suffix}`
                }
              </p>
              {billing === "annual" && (
                <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                  Économisez {promoStatus === "valid" ? "21" : "31"}€/an vs le mensuel
                </p>
              )}
            </div>

            <Separator />

            {/* Promo code section */}
            <div className="space-y-3">
              <p className="text-sm font-medium">Entrer un code</p>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    value={promoCode}
                    onChange={(e) => {
                      setPromoCode(e.target.value.toUpperCase());
                      if (promoStatus) setPromoStatus(null);
                    }}
                    placeholder="Code promo"
                    className="pl-9 uppercase"
                    disabled={promoStatus === "valid" || checkoutLoading}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleValidatePromo();
                    }}
                  />
                  {promoStatus === "valid" && (
                    <button onClick={clearPromo} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {promoStatus !== "valid" && (
                  <Button
                    variant="outline"
                    onClick={handleValidatePromo}
                    disabled={!promoCode.trim() || promoStatus === "checking" || checkoutLoading}
                  >
                    {promoStatus === "checking" ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Appliquer"
                    )}
                  </Button>
                )}
              </div>
              {promoStatus === "valid" && (
                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Code appliqué — {billing === "monthly" ? "9,99€/mois" : "99€/an"} pendant {billing === "monthly" ? "12 mois" : "1 an"}
                </p>
              )}
              {promoStatus === "invalid" && (
                <p className="text-sm text-destructive">Code invalide ou expiré</p>
              )}
            </div>

            <Separator />

            {/* Checkout button */}
            <Button
              className="w-full h-12 text-base"
              onClick={handleCheckout}
              disabled={checkoutLoading}
            >
              {checkoutLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Redirection vers Stripe...
                </>
              ) : (
                <>
                  Procéder au paiement
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>

            {checkoutError && (
              <p className="text-sm text-destructive text-center">{checkoutError}</p>
            )}

            <p className="text-xs text-muted-foreground text-center">
              Paiement sécurisé par Stripe · Annulation à tout moment
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
