import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import ContactFormModal from './feedback/ContactFormModal';

const Footer = () => {
  const [contactOpen, setContactOpen] = useState(false);

  return (
    <footer className="bg-card border-t border-border mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">K</span>
              </div>
              <span className="text-foreground font-bold">Kanveo</span>
            </div>
            <p className="text-muted-foreground text-sm">
              Simplifiez votre prospection commerciale avec des outils modernes et intelligents.
            </p>
          </div>

          {/* Produit */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Produit</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/pricing" className="text-muted-foreground hover:text-foreground text-sm transition">
                  Tarification
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground text-sm transition">
                  À propos
                </Link>
              </li>
              <li>
                <Link to="/partenaire" className="text-muted-foreground hover:text-foreground text-sm transition">
                  Devenir partenaire
                </Link>
              </li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Légal</h3>
            <ul className="space-y-2">
              <li>
                <Link to="/terms" className="text-muted-foreground hover:text-foreground text-sm transition">
                  Conditions d'utilisation
                </Link>
              </li>
              <li>
                <Link to="/privacy" className="text-muted-foreground hover:text-foreground text-sm transition">
                  Politique de confidentialité
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-foreground font-semibold mb-4">Contact</h3>
            <ul className="space-y-3">
              <li>
                <button
                  onClick={() => setContactOpen(true)}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm transition"
                >
                  <Mail size={16} />
                  Support
                </button>
              </li>
            </ul>
          </div>
        </div>

        {/* Divider */}
        <div className="border-t border-border pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-muted-foreground text-sm">
              © 2026 Kanveo. Tous droits réservés.
            </p>
          </div>
        </div>
      </div>

      <ContactFormModal open={contactOpen} onOpenChange={setContactOpen} />
    </footer>
  );
};

export default Footer;
