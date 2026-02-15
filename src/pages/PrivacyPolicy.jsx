import { Link } from "react-router-dom";
import { ArrowLeft, Linkedin } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

export default function PrivacyPolicy() {
  const sections = [
    {
      title: "1. Introduction",
      content: `Kanveo ("nous", "notre" ou "nos") respecte votre vie privée. Cette politique de confidentialité explique comment nous collectons, utilisons, divulguons et sauvegardons vos informations lorsque vous utilisez notre plateforme.`
    },
    {
      title: "2. Informations que Nous Collectons",
      content: "Nous collectons les informations suivantes :",
      subsections: [
        {
          title: "Informations de Compte",
          items: ["Prénom et nom", "Adresse email", "Nom de l'entreprise", "Mot de passe chiffré"]
        },
        {
          title: "Données de Prospects",
          items: ["Informations importées de SIRENE", "Historique de contacts", "Notes et interactions", "Statut du pipeline"]
        },
        {
          title: "Données d'Utilisation",
          items: ["Adresse IP", "Type de navigateur et système d'exploitation", "Pages visitées et actions effectuées", "Horodatage des activités"]
        }
      ]
    },
    {
      title: "3. Comment Nous Utilisons Vos Informations",
      content: "Nous utilisons les informations collectées pour :",
      items: [
        "Fournir et maintenir le service",
        "Traiter vos demandes et transactions",
        "Envoyer des notifications et mises à jour",
        "Analyser l'utilisation pour améliorer le service",
        "Détecter et prévenir les fraudes et abus",
        "Respecter les obligations légales",
        "Communiquer avec vous concernant le service"
      ]
    },
    {
      title: "4. Partage de Données",
      content: "Nous ne vendons pas vos données. Nous pouvons partager vos informations avec :",
      items: [
        "Prestataires de services qui nous aident à exploiter la plateforme",
        "Partenaires analytiques (données anonymes uniquement)",
        "Autorités légales si légalement requis"
      ],
      note: "Les données de prospects que vous importez restent entièrement vôtres et ne sont jamais utilisées à d'autres fins que le fonctionnement du service."
    },
    {
      title: "5. Sécurité des Données",
      content: "Nous mettons en œuvre des mesures de sécurité appropriées pour protéger vos données :",
      items: [
        "Chiffrement SSL/TLS pour les communications",
        "Mots de passe chiffrés avec hachage sécurisé",
        "Accès restreint aux données sensibles",
        "Audits de sécurité réguliers",
        "Sauvegarde automatique et récupération d'urgence"
      ],
      note: "Cependant, aucun système n'est 100% sécurisé. Vous utilisez le service à vos risques et périls."
    },
    {
      title: "6. Cookies et Suivi",
      content: "Nous utilisons des cookies pour :",
      items: [
        "Maintenir votre session connectée",
        "Mémoriser vos préférences",
        "Analyser comment vous utilisez le service",
        "Améliorer l'expérience utilisateur"
      ],
      note: "Vous pouvez contrôler les cookies via les paramètres de votre navigateur. Désactiver les cookies peut affecter la fonctionnalité du service."
    },
    {
      title: "7. Droits de l'Utilisateur (RGPD)",
      content: "Conformément au Règlement Général sur la Protection des Données (RGPD), vous avez le droit de :",
      items: [
        "Accéder à vos données personnelles",
        "Corriger les données inexactes",
        "Demander la suppression de vos données",
        "Exporter vos données (portabilité)",
        "Vous opposer au traitement de vos données",
        "Retirer votre consentement à tout moment"
      ],
      note: "Pour exercer ces droits, contactez-nous à privacy@kanveo.fr."
    },
    {
      title: "8. Rétention des Données",
      content: "Nous conservons vos données aussi longtemps que nécessaire pour :",
      items: [
        "Fournir le service",
        "Respecter les obligations légales",
        "Résoudre les litiges",
        "Appliquer nos accords"
      ],
      note: "Vous pouvez demander la suppression de vos données à tout moment. Certaines données peuvent être conservées pour des raisons légales."
    },
    {
      title: "9. Authentification Tierce",
      content: "Si vous choisissez de vous connecter via Google ou Microsoft, nous collecterons votre email et informations de profil de base. Veuillez consulter leurs politiques de confidentialité respectives pour comprendre comment ils traitent vos données."
    },
    {
      title: "10. Modifications de la Politique",
      content: "Nous pouvons modifier cette politique à tout moment. Les modifications importantes seront communiquées par email. Votre utilisation continue du service après les modifications constitue votre acceptation de la nouvelle politique."
    }
  ];

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <Badge variant="outline" className="mb-4">Légal</Badge>
          <h1 className="text-4xl font-bold tracking-tight mb-2">
            Politique de Confidentialité
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
                
                {section.subsections && (
                  <div className="space-y-4 ml-4">
                    {section.subsections.map((sub, subIndex) => (
                      <div key={subIndex}>
                        <h3 className="font-semibold mb-2">{sub.title}</h3>
                        <ul className="text-muted-foreground space-y-1 ml-4">
                          {sub.items.map((item, itemIndex) => (
                            <li key={itemIndex}>• {item}</li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                )}

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

            {/* DPO Section */}
            <section>
              <h2 className="text-xl font-bold mb-3">11. Délégué à la Protection des Données</h2>
              <p className="text-muted-foreground mb-4">
                Pour toute question relative à la protection de vos données, vous pouvez nous contacter via LinkedIn :
              </p>
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2">
                  <p className="font-semibold">Délégué à la Protection des Données</p>
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

            {/* Contact Section */}
            <section>
              <h2 className="text-xl font-bold mb-3">12. Contact</h2>
              <p className="text-muted-foreground mb-4">
                Si vous avez des questions sur cette politique, vous pouvez nous contacter via LinkedIn :
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
              © 2026 Kanveo. Tous les droits réservés. Cette politique de confidentialité a été mise à jour le 8 février 2026.
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
