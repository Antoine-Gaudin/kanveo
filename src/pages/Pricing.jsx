import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, ArrowRight, Sparkles, Shield, Zap, LayoutGrid, Search, LineChart, CheckSquare, Rocket, CalendarDays } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { cn } from "@/lib/utils";

export default function Pricing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState("monthly"); // 'monthly' | 'annual'

  const features = [
    { icon: Search, label: "Import SIRENE illimité" },
    { icon: LayoutGrid, label: "Pipeline multi-vues (Kanban, liste, carte, tableau)" },
    { icon: CheckSquare, label: "Gestion de tâches avec checklist" },
    { icon: LineChart, label: "Dashboard analytique complet" },
    { icon: Zap, label: "Rappels & notifications" },
    { icon: Shield, label: "Export CSV & Excel" },
    { icon: Sparkles, label: "Prospects illimités" },
    { icon: Check, label: "Toutes les mises à jour incluses" },
  ];

  const plans = {
    monthly: {
      price: "15",
      originalPrice: "19",
      suffix: "HT /mois",
      afterPromo: "pendant 12 mois, puis 19€ HT/mois",
      discount: "-21% la 1ère année",
      label: "Abonnement mensuel",
    },
    annual: {
      price: "149",
      originalPrice: "199",
      suffix: "HT /an",
      afterPromo: "pendant 1 an, puis 199€ HT/an",
      discount: "-25% la 1ère année",
      label: "Abonnement annuel",
      savings: "Économisez 31€/an vs mensuel",
    },
  };

  const plan = plans[billing];

  const faqs = [
    {
      question: "Comment fonctionne le tarif Early Adopter ?",
      answer: billing === "monthly"
        ? "Les 12 premiers mois, vous payez 15€ HT/mois au lieu de 19€ HT soit ~21% de réduction. Après la première année, le tarif passe à 19€ HT/mois, bloqué à vie."
        : "La première année, vous payez 149€ HT/an au lieu de 199€ HT soit ~25% de réduction. Après la première année, le tarif passe à 199€ HT/an, bloqué à vie."
    },
    {
      question: "Puis-je utiliser un code promo ?",
      answer: "Oui ! Si un créateur de contenu vous a partagé un code promo, vous pourrez l'entrer à l'étape suivante lors de votre abonnement."
    },
    {
      question: "Puis-je annuler mon abonnement ?",
      answer: "Oui, à tout moment depuis vos paramètres. Pas de préavis, pas de frais d'annulation."
    },
    {
      question: "Les fonctionnalités en cours de dev sont incluses ?",
      answer: "Oui. Le suivi emailing, les relances et toutes les futures fonctionnalités seront incluses sans surcoût pour les Early Adopters."
    },
    {
      question: "Quelle est la différence mensuel vs annuel ?",
      answer: "L'abonnement annuel offre une réduction supplémentaire : 149€/an (soit ~12,42€/mois) vs 15€/mois (180€/an). Vous économisez 31€ la première année."
    },
    {
      question: "Mes données sont-elles sécurisées ?",
      answer: "Oui. Hébergement européen, chiffrement SSL, conformité RGPD. Vos données restent les vôtres."
    },
  ];

  const handleSubscribe = () => {
    if (!user) {
      navigate("/auth", { state: { redirectTo: `/subscribe?billing=${billing}` } });
    } else {
      navigate(`/subscribe?billing=${billing}`);
    }
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant="secondary">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Tarification
            </Badge>
            <Badge variant="outline" className="border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10">
              <Rocket className="h-3.5 w-3.5 mr-1.5" />
              Early Adopter
            </Badge>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Tarif fondateur,
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent"> bloqué à vie</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {billing === "monthly"
              ? "15€ HT/mois la première année, puis 19€ HT/mois bloqué à vie. Ce tarif ne sera plus disponible une fois la beta terminée."
              : "149€ HT/an la première année, puis 199€ HT/an bloqué à vie. Ce tarif ne sera plus disponible une fois la beta terminée."
            }
          </p>
        </div>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center gap-3 mb-12">
          <button
            onClick={() => setBilling("monthly")}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all",
              billing === "monthly"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={cn(
              "px-5 py-2.5 rounded-full text-sm font-medium transition-all relative",
              billing === "annual"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            <CalendarDays className="h-3.5 w-3.5 inline mr-1.5" />
            Annuel
            <Badge className="absolute -top-3 -right-3 text-[10px] px-1.5 py-0.5 bg-green-600 text-white border-0">
              -17%
            </Badge>
          </button>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto mb-24">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary via-violet-500 to-primary rounded-3xl blur-lg opacity-20" />
            <Card className="relative bg-card border-primary/30 rounded-2xl overflow-hidden">
              {/* Gradient accent top */}
              <div className="h-1.5 bg-gradient-to-r from-primary via-violet-500 to-primary" />

              <CardHeader className="text-center pt-10 pb-6">
                <div className="flex items-center justify-center gap-2 mb-4">
                  <Badge variant="outline" className="px-3 py-1 border-amber-500/50 text-amber-600 dark:text-amber-400 bg-amber-500/10">
                    {plan.discount}
                  </Badge>
                  {billing === "annual" && (
                    <Badge variant="outline" className="px-3 py-1 border-green-500/50 text-green-600 dark:text-green-400 bg-green-500/10">
                      {plan.savings}
                    </Badge>
                  )}
                </div>
                <div className="flex items-baseline justify-center gap-2 mb-1">
                  <span className="text-3xl text-muted-foreground line-through decoration-2">{plan.originalPrice}€</span>
                  <span className="text-7xl font-bold tracking-tight">{plan.price}€</span>
                  <span className="text-xl text-muted-foreground">{plan.suffix}</span>
                </div>
                <p className="text-sm text-muted-foreground mb-3">
                  {plan.afterPromo}
                </p>
                {billing === "annual" && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-medium">
                    Soit ~{(149 / 12).toFixed(2)}€/mois la 1ère année
                  </p>
                )}
                <CardDescription className="text-base mt-2">
                  Accès complet + toutes les futures fonctionnalités incluses
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-8 pb-10">
                {/* Features List */}
                <div className="space-y-4">
                  {features.map((feature, index) => {
                    const Icon = feature.icon;
                    return (
                      <div key={index} className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary flex-shrink-0">
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className="text-[15px]">{feature.label}</span>
                      </div>
                    );
                  })}
                </div>

                {/* CTA Button */}
                <Button
                  className="w-full h-14 text-lg rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
                  size="lg"
                  onClick={handleSubscribe}
                >
                  S'abonner maintenant
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>

                <p className="text-sm text-muted-foreground text-center">
                  Annulation à tout moment · Paiement sécurisé via Stripe
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">FAQ</Badge>
            <h2 className="text-3xl font-bold">
              Questions fréquentes
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {faqs.map((faq, index) => (
              <Card key={index} className="bg-card/50 backdrop-blur-sm hover:border-primary/30 transition-colors">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base">{faq.question}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-sm leading-relaxed">{faq.answer}</CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
