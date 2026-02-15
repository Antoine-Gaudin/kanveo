// src/pages/Partner.jsx
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Handshake,
  Link2,
  Share2,
  Wallet,
  ArrowRight,
  CheckCircle2,
  Users,
  TrendingUp,
  Sparkles,
} from "lucide-react";

const steps = [
  {
    icon: Users,
    title: "Inscrivez-vous",
    description: "Créez votre compte Kanveo gratuitement et activez votre statut partenaire dans les paramètres.",
  },
  {
    icon: Link2,
    title: "Générez votre lien",
    description: "Obtenez votre lien d'affiliation unique en un clic depuis votre espace paramètres.",
  },
  {
    icon: Share2,
    title: "Partagez",
    description: "Partagez votre lien avec votre réseau, sur les réseaux sociaux, ou par email.",
  },
  {
    icon: Wallet,
    title: "Gagnez 5€/mois",
    description: "Recevez 5€ chaque mois, tant que la personne parrainée reste abonnée.",
  },
];

const advantages = [
  "Aucun frais d'inscription",
  "Commission récurrente de 5€/mois",
  "Lien d'affiliation unique et permanent",
  "Dashboard de suivi en temps réel",
  "Paiement simple et transparent",
  "Aucun engagement, arrêtez quand vous voulez",
];

export default function Partner() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/10" />
        <div className="relative max-w-5xl mx-auto px-4 text-center">
          <Badge variant="outline" className="mb-6 px-4 py-1.5 text-sm border-primary/30 text-primary">
            <Handshake className="w-4 h-4 mr-2" />
            Programme Partenaire
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground mb-6">
            Devenez partenaire{" "}
            <span className="bg-gradient-to-r from-primary to-blue-500 bg-clip-text text-transparent">
              Kanveo
            </span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            Recommandez Kanveo à votre réseau et gagnez{" "}
            <span className="font-bold text-foreground">5€/mois par abonné</span>{" "}
            parrainé via votre lien, pendant toute la durée de son abonnement.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="gap-2 text-base px-8">
              <Link to="/auth">
                <Sparkles className="w-5 h-5" />
                Rejoindre le programme
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">Comment ça marche ?</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-xl mx-auto">
            4 étapes simples pour commencer à gagner de l'argent avec Kanveo
          </p>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, i) => (
              <Card key={i} className="relative overflow-hidden group hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <div className="absolute top-3 right-3 text-5xl font-extrabold text-muted-foreground/10">
                    {i + 1}
                  </div>
                  <div className="w-14 h-14 mx-auto mb-4 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <step.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Commission */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4">
          <div className="rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/20 p-8 sm:p-12 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-10 h-10 text-primary" />
            </div>
            <h2 className="text-3xl font-bold mb-4">
              5€/mois par abonné parrainé
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto mb-8 text-lg">
              Chaque mois, tant que la personne parrainée reste abonnée à Kanveo,
              vous gagnez <span className="font-bold text-foreground">5€</span> de commission récurrente.
              Pas de plafond, pas de limite.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 max-w-lg mx-auto text-left">
              {advantages.map((adv, i) => (
                <div key={i} className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                  <span className="text-sm">{adv}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Prêt à rejoindre le programme ?</h2>
          <p className="text-muted-foreground mb-8 text-lg">
            Connectez-vous ou créez votre compte, puis rendez-vous dans{" "}
            <span className="font-medium text-foreground">Paramètres</span> pour activer
            votre statut partenaire et générer votre lien.
          </p>
          <Button size="lg" asChild className="gap-2 text-base px-8">
            <Link to="/auth">
              Commencer maintenant
              <ArrowRight className="w-4 h-4" />
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
