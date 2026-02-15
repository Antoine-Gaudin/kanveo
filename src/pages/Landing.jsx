import { Link, useSearchParams } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { 
  ArrowRight, 
  Search, 
  LineChart, 
  LayoutGrid,
  CheckSquare,
  Users,
  TrendingUp,
  Clock,
  Sparkles,
  ChevronRight,
  Shield,
  Zap
} from "lucide-react";

export default function Landing() {
  // Capturer le code affilié depuis l'URL (?ref=CODE)
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const ref = searchParams.get("ref");
    if (ref) {
      localStorage.setItem("kanveo_ref", ref);
    }
  }, [searchParams]);

  const features = [
    {
      icon: Search,
      title: "Import SIRENE",
      description: "Accédez à la base officielle des entreprises françaises. Importez des prospects qualifiés en quelques clics.",
      color: "from-blue-500/20 to-cyan-500/20",
      iconColor: "text-blue-500",
      borderColor: "hover:border-blue-500/50",
    },
    {
      icon: LayoutGrid,
      title: "Pipeline multi-vues",
      description: "Kanban, liste, carte ou tableau. Choisissez l'affichage qui vous convient pour suivre vos prospects.",
      color: "from-violet-500/20 to-purple-500/20",
      iconColor: "text-violet-500",
      borderColor: "hover:border-violet-500/50",
    },
    {
      icon: CheckSquare,
      title: "Gestion de tâches",
      description: "Organisez vos actions commerciales avec un gestionnaire de tâches intégré à vos prospects.",
      color: "from-amber-500/20 to-orange-500/20",
      iconColor: "text-amber-500",
      borderColor: "hover:border-amber-500/50",
    },
    {
      icon: LineChart,
      title: "Analytics en temps réel",
      description: "Tableau de bord complet avec vos KPIs : taux de conversion, pipeline value, activité.",
      color: "from-emerald-500/20 to-green-500/20",
      iconColor: "text-emerald-500",
      borderColor: "hover:border-emerald-500/50",
    },
  ];

  const benefits = [
    {
      icon: Clock,
      title: "Gagnez 5h par semaine",
      description: "Fini les fichiers Excel. Centralisez tout au même endroit.",
      iconColor: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      icon: Users,
      title: "De 0 à organisé",
      description: "Pipeline visuel pour savoir exactement où en est chaque prospect.",
      iconColor: "text-violet-500",
      bg: "bg-violet-500/10",
    },
    {
      icon: TrendingUp,
      title: "+30% de conversion",
      description: "Ne perdez plus de prospects grâce aux rappels et au suivi structuré.",
      iconColor: "text-emerald-500",
      bg: "bg-emerald-500/10",
    },
    {
      icon: Sparkles,
      title: "Prise en main en 5 min",
      description: "Interface intuitive, zéro formation nécessaire.",
      iconColor: "text-amber-500",
      bg: "bg-amber-500/10",
    },
  ];

  const stats = [
    { value: "10 000+", label: "Entreprises SIRENE accessibles", icon: Search },
    { value: "< 5 min", label: "Pour créer votre premier pipeline", icon: Zap },
    { value: "100%", label: "Données françaises & RGPD", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-[400px] h-[400px] bg-violet-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-[300px] h-[300px] bg-emerald-500/5 rounded-full blur-3xl" />
      </div>

      <div className="mx-auto max-w-7xl px-4 py-16 md:py-24 relative z-10">
        {/* Hero Section */}
        <section className="text-center mb-28">
          <Badge variant="secondary" className="mb-6 px-4 py-1.5 text-sm animate-in fade-in slide-in-from-bottom-2 duration-500">
            <Sparkles className="h-3.5 w-3.5 mr-1.5" />
            CRM de prospection B2B
          </Badge>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight mb-8">
            Transformez vos
            <br />
            <span className="bg-gradient-to-r from-primary via-violet-500 to-primary bg-clip-text text-transparent">
              prospects en clients
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
            Import SIRENE, pipeline multi-vues, tâches, analytics —
            tout pour gérer votre prospection B2B.
          </p>

          <p className="text-base text-muted-foreground/70 mb-10 max-w-lg mx-auto">
            15€ HT/mois la 1ère année (-21%) · Sans engagement
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Button size="lg" asChild className="text-lg px-8 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              <Link to="/auth">
                S'abonner maintenant
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="text-lg px-8 h-14 rounded-xl">
              <Link to="/pricing">
                Voir le tarif
                <ChevronRight className="ml-1 h-5 w-5" />
              </Link>
            </Button>
          </div>

          <p className="text-sm text-muted-foreground/60">
            Pas de carte bancaire requise pour l'essai
          </p>
        </section>

        {/* Stats */}
        <section className="mb-28">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center bg-card/50 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-colors">
                  <CardContent className="pt-8 pb-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary mx-auto mb-4">
                      <Icon className="h-6 w-6" />
                    </div>
                    <div className="text-3xl md:text-4xl font-bold text-foreground mb-2">{stat.value}</div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-28">
          <div className="text-center mb-14">
            <Badge variant="outline" className="mb-4">Fonctionnalités</Badge>
            <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-4">
              Tout pour prospecter
              <span className="bg-gradient-to-r from-primary to-violet-500 bg-clip-text text-transparent"> efficacement</span>
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Un seul outil au lieu de cinq. De l'import de données au suivi client.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 max-w-5xl mx-auto">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index} 
                  className={`group ${feature.borderColor} transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 bg-card/50 backdrop-blur-sm`}
                >
                  <CardHeader className="pb-3">
                    <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${feature.color} ${feature.iconColor} mb-4`}>
                      <Icon className="h-7 w-7" />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription className="text-base leading-relaxed">
                      {feature.description}
                    </CardDescription>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="mb-28">
          <Card className="overflow-hidden border-0 shadow-2xl shadow-primary/5">
            <div className="bg-gradient-to-br from-primary/10 via-violet-500/5 to-primary/10 p-1">
              <div className="bg-card rounded-[calc(var(--radius)-2px)]">
                <CardHeader className="text-center pb-8 pt-10">
                  <Badge variant="outline" className="mx-auto mb-4 w-fit">Avantages</Badge>
                  <CardTitle className="text-3xl md:text-4xl font-bold">
                    Pourquoi choisir Kanveo ?
                  </CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Conçu pour les indépendants et PME qui veulent prospecter sans usine à gaz.
                  </CardDescription>
                </CardHeader>
                <CardContent className="pb-10">
                  <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {benefits.map((benefit, index) => {
                      const Icon = benefit.icon;
                      return (
                        <div key={index} className="flex gap-4 group">
                          <div className="flex-shrink-0">
                            <div className={`flex h-12 w-12 items-center justify-center rounded-xl ${benefit.bg} ${benefit.iconColor} group-hover:scale-110 transition-transform`}>
                              <Icon className="h-6 w-6" />
                            </div>
                          </div>
                          <div>
                            <h3 className="text-lg font-semibold mb-1">{benefit.title}</h3>
                            <p className="text-muted-foreground leading-relaxed">{benefit.description}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </div>
            </div>
          </Card>
        </section>

        {/* CTA Section */}
        <section className="text-center">
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-violet-500/20 to-primary/20 rounded-3xl blur-2xl" />
            <Card className="relative bg-card/80 backdrop-blur-sm border-primary/20 rounded-3xl overflow-hidden">
              <CardContent className="py-16 px-8">
                <Sparkles className="h-10 w-10 text-primary mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
                  Prêt à structurer votre prospection ?
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
                  Dès 149€/an ou 15€/mois, bloqué à vie.
                  Sans engagement, annulation à tout moment.
                </p>
                <Button size="lg" asChild className="text-lg px-10 h-14 rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
                  <Link to="/auth">
                    Commencer maintenant
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </section>
      </div>
    </div>
  );
}
