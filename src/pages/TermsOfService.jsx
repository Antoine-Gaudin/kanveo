import { Link } from "react-router-dom";
import { ArrowLeft, Linkedin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function TermsOfService() {
  const sections = [
    {
      title: "1. Acceptance des Conditions",
      content: "En accédant et en utilisant Kanveo, vous acceptez d'être lié par ces conditions d'utilisation. Si vous n'acceptez pas ces conditions, veuillez ne pas utiliser ce service. Nous nous réservons le droit de modifier ces conditions à tout moment, et votre utilisation continue du service constitue votre acceptation des modifications."
    },
    {
      title: "2. Description du Service",
      content: "Kanveo est une plateforme de gestion de pipeline de prospection commerciale. Le service permet aux utilisateurs de :",
      items: [
        "Importer et gérer des données de prospects",
        "Organiser les prospects dans un pipeline Kanban",
        "Suivre les contacts et interactions",
        "Analyser les métriques de conversion",
        "Gérer les paramètres et configurations"
      ]
    },
    {
      title: "3. Compte Utilisateur",
      content: "Lors de la création d'un compte, vous êtes responsable de :",
      items: [
        "Fournir des informations exactes et complètes",
        "Maintenir la confidentialité de vos identifiants",
        "Notifier immédiatement de tout accès non autorisé",
        "Assurer que vous êtes autorisé à utiliser le service dans votre juridiction"
      ]
    },
    {
      title: "4. Droits d'Utilisation",
      content: "Kanveo vous octroie une licence personnelle, non exclusive, non transférable et révocable pour utiliser le service. Vous acceptez de ne pas :",
      items: [
        "Reproduire, copier ou distribuer le service ou son contenu",
        "Modifier ou dériver des travaux à partir du service",
        "Utiliser le service à des fins illégales ou non autorisées",
        "Accéder ou interférer avec les serveurs ou systèmes de Kanveo",
        "Utiliser de robots, scraper ou outils d'automatisation non autorisés"
      ]
    },
    {
      title: "5. Données Utilisateur",
      content: "Vous conservez tous les droits sur vos données. Kanveo peut utiliser vos données pour :",
      items: [
        "Fournir et améliorer le service",
        "Générer des statistiques et rapports anonymes",
        "Assurer la conformité légale et la sécurité"
      ],
      note: "Vous pouvez demander la suppression de vos données à tout moment en contactant notre équipe support."
    },
    {
      title: "6. Limitation de Responsabilité",
      content: 'Kanveo est fourni "tel quel" sans garanties. Nous ne sommes pas responsables de :',
      items: [
        "Dommages indirects ou consécutifs",
        "Pertes de données ou interruptions de service",
        "Erreurs ou inexactitudes des données",
        "Actions tierces ou forces majeures"
      ]
    },
    {
      title: "7. Propriété Intellectuelle",
      content: "Kanveo et tout son contenu, y compris les textes, graphiques, logos, images et code, sont la propriété exclusive de Kanveo ou de ses fournisseurs de contenu. Tous les droits sont réservés."
    },
    {
      title: "8. Résiliation",
      content: "Nous pouvons résilier ou suspendre votre accès à Kanveo à tout moment, pour quelque raison que ce soit, y compris violation de ces conditions. Vous pouvez résilier votre compte à tout moment en contactant notre équipe."
    },
    {
      title: "9. Modifications du Service",
      content: "Nous nous réservons le droit de modifier, suspendre ou discontinuer le service à tout moment, avec ou sans préavis. Nous ne serons pas responsables envers vous ou tiers pour les modifications, suspensions ou discontinuation du service."
    },
    {
      title: "10. Gouvernance et Juridiction",
      content: "Ces conditions sont régies par les lois françaises. Vous consentez à la juridiction exclusive des tribunaux français pour tout litige découlant de ces conditions ou du service."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">Légal</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Conditions d'Utilisation
          </h1>
          <p className="text-muted-foreground">
            Dernière mise à jour : 8 février 2026
          </p>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6 space-y-8">
            {sections.map((section, index) => (
              <section key={index}>
                <h2 className="text-xl font-bold mb-3">{section.title}</h2>
                <p className="text-muted-foreground leading-relaxed mb-3">
                  {section.content}
                </p>
                
                {section.items && (
                  <ul className="text-muted-foreground space-y-1 ml-4">
                    {section.items.map((item, itemIndex) => (
                      <li key={itemIndex}>• {item}</li>
                    ))}
                  </ul>
                )}

                {section.note && (
                  <p className="text-muted-foreground mt-3 text-sm italic">
                    {section.note}
                  </p>
                )}
              </section>
            ))}

            <Separator />

            {/* Contact Section */}
            <section>
              <h2 className="text-xl font-bold mb-3">11. Contact</h2>
              <p className="text-muted-foreground mb-4">
                Pour toute question concernant ces conditions, vous pouvez nous contacter via LinkedIn :
              </p>
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <p className="font-semibold">Kanveo</p>
                  <a
                    href="https://www.linkedin.com/in/antoine-gaudin-298240150/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <Linkedin className="w-4 h-4" /> LinkedIn — Antoine Gaudin
                  </a>
                </CardContent>
              </Card>
            </section>

            <Separator />

            {/* Footer */}
            <p className="text-sm text-muted-foreground">
              © 2026 Kanveo. Tous les droits réservés. Ces conditions d'utilisation ont été mises à jour le 8 février 2026.
            </p>
          </CardContent>
        </Card>

        {/* Back Button */}
        <div className="mt-8">
          <Button variant="ghost" asChild>
            <Link to="/auth">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Retour à l'authentification
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
