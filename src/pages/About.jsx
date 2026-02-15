import { useState } from "react";
import { Link } from "react-router-dom";
import { Target, Users, TrendingUp, Zap, Mail, Shield, ArrowRight, Sparkles } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ContactFormModal from "@/components/feedback/ContactFormModal";

export default function About() {
  const [contactOpen, setContactOpen] = useState(false);

  const audiences = [
    { 
      icon: Users, 
      title: "Indépendants & freelances", 
      description: "Un CRM simple pour organiser vos prospects sans perdre de temps sur des outils complexes.",
      iconColor: "text-blue-500",
      bg: "bg-blue-500/10",
      gradient: "from-blue-500/20 to-cyan-500/20",
    },
    { 
      icon: Target, 
      title: "Équipes commerciales (PME)", 
      description: "Pipeline visuel, suivi des relances et analytics pour piloter votre activité commerciale.",
      iconColor: "text-violet-500", 
      bg: "bg-violet-500/10",
      gradient: "from-violet-500/20 to-purple-500/20",
    },
    { 
      icon: TrendingUp, 
      title: "Créateurs d'entreprise", 
      description: "Importez vos premiers prospects via SIRENE et structurez votre démarche commerciale dès le départ.",
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
      gradient: "from-emerald-500/20 to-green-500/20",
    },
  ];

  const differentiators = [
    {
      icon: Zap,
      title: "Prise en main immédiate",
      description: "Interface intuitive, pas de configuration complexe. Créez votre compte et commencez en 5 minutes.",
      iconColor: "text-amber-500",
      bg: "from-amber-500/20 to-orange-500/20",
    },
    {
      icon: Target,
      title: "Données françaises",
      description: "Import direct depuis la base SIRENE (INSEE). Des données d'entreprises vérifiées et à jour.",
      iconColor: "text-blue-500",
      bg: "from-blue-500/20 to-cyan-500/20",
    },
    {
      icon: Shield,
      title: "RGPD & sécurité",
      description: "Hébergement européen, chiffrement SSL, conformité RGPD. Vos données restent les vôtres.",
      iconColor: "text-emerald-500",
      bg: "from-emerald-500/20 to-green-500/20",
    },
    {
      icon: TrendingUp,
      title: "Tarif accessible",
      description: "15€/mois la 1ère année, puis 19€/mois. Tout inclus, sans mauvaise surprise.",
      iconColor: "text-violet-500",
      bg: "from-violet-500/20 to-purple-500/20",
    },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-20 right-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-40 left-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-5xl px-4 py-16 md:py-24 relative z-10">
        {/* Header */}
        <div className="text-center mb-20">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            À propos
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6">
            Kanveo, c'est
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent"> quoi ?</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Un CRM de prospection B2B conçu pour les indépendants et PME françaises.
            Simple, efficace, sans usine à gaz.
          </p>
        </div>

        {/* Mission */}
        <section className="mb-20">
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/20 via-violet-500/10 to-primary/20 rounded-3xl blur-lg opacity-40" />
            <Card className="relative bg-card/80 backdrop-blur-sm rounded-2xl overflow-hidden">
              <div className="h-1 bg-gradient-to-r from-primary via-violet-500 to-primary" />
              <CardHeader className="pt-8">
                <Badge variant="outline" className="w-fit mb-2">Notre mission</Badge>
                <CardTitle className="text-2xl md:text-3xl">Simplifier la prospection commerciale</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-muted-foreground text-lg leading-relaxed pb-8">
                <p>
                  Nous pensons que la prospection commerciale ne devrait pas nécessiter 
                  5 outils différents et une formation de 3 semaines.
                </p>
                <p>
                  Kanveo regroupe l'import de données SIRENE, le pipeline multi-vues, 
                  la gestion de tâches et l'analytics dans une seule interface claire.
                  <span className="text-foreground font-medium"> Vous vous concentrez sur vos clients, on s'occupe du reste.</span>
                </p>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Ce qui nous différencie */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Avantages</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Ce qui nous différencie</h2>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {differentiators.map((item, index) => {
              const Icon = item.icon;
              return (
                <Card key={index} className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-start gap-4 space-y-0">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${item.bg} ${item.iconColor} flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="text-lg mb-1">{item.title}</CardTitle>
                      <CardDescription className="text-[15px] leading-relaxed">
                        {item.description}
                      </CardDescription>
                    </div>
                  </CardHeader>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Pour qui ? */}
        <section className="mb-20">
          <div className="text-center mb-12">
            <Badge variant="outline" className="mb-4">Public</Badge>
            <h2 className="text-3xl md:text-4xl font-bold">Pour qui ?</h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((audience, index) => {
              const Icon = audience.icon;
              return (
                <Card key={index} className="group hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:-translate-y-1 bg-card/50 backdrop-blur-sm text-center">
                  <CardHeader>
                    <div className={`flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br ${audience.gradient} ${audience.iconColor} mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                      <Icon className="h-8 w-8" />
                    </div>
                    <CardTitle className="text-lg">{audience.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-[15px] leading-relaxed">
                      {audience.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="text-center mb-16">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-3xl blur-2xl" />
            <Card className="relative bg-card/80 backdrop-blur-sm border-primary/20 rounded-2xl overflow-hidden">
              <CardContent className="py-14 px-8">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
                <CardTitle className="text-3xl mb-3">Prêt à essayer ?</CardTitle>
                <CardDescription className="text-lg max-w-xl mx-auto mb-8">
                  15€/mois la 1ère année · Code promo accepté · Sans engagement
                </CardDescription>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" asChild className="text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    <Link to="/auth">
                      Créer mon compte
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Link>
                  </Button>
                  <Button variant="outline" size="lg" asChild className="text-lg px-8 h-14 rounded-xl">
                    <Link to="/pricing">Voir le tarif</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Contact */}
        <section className="text-center">
          <Card className="bg-card/50 backdrop-blur-sm">
            <CardHeader className="text-center">
              <CardTitle className="text-xl">Une question ?</CardTitle>
              <CardDescription>
                Écrivez-nous, on répond rapidement.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center">
              <Button variant="outline" className="rounded-xl" onClick={() => setContactOpen(true)}>
                <Mail className="w-4 h-4 mr-2" />
                Nous contacter
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>

      <ContactFormModal open={contactOpen} onOpenChange={setContactOpen} />
    </div>
  );
}
