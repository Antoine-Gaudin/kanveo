import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Building2, Mail, Phone, Briefcase, MapPin, FileText, Info, Plus } from "lucide-react";

export default function ManualProspectModal({ onClose, onAddProspect }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    activityLabel: "",
    address: "",
    notes: "",
  });
  const [formError, setFormError] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setFormError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    
    // Validation basique
    if (!formData.name && !formData.company) {
      setFormError("Veuillez entrer au minimum un nom ou une entreprise");
      return;
    }

    try {
      const newProspect = {
        ...formData,
        status: "prospect",
        createdAt: new Date().toISOString(),
      };

      await onAddProspect(newProspect);
      
      setFormData({
        name: "",
        email: "",
        phone: "",
        company: "",
        activityLabel: "",
        address: "",
        notes: "",
      });
      
      onClose();
    } catch (error) {
      setFormError("Erreur lors de l'ajout du prospect. Veuillez réessayer.");
    }
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-2xl">
            <Plus className="w-6 h-6" />
            Ajouter un prospect
          </DialogTitle>
          <DialogDescription>
            Créer un nouveau prospect manuellement
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {formError && (
            <Alert variant="destructive">
              <AlertDescription>{formError}</AlertDescription>
            </Alert>
          )}
          {/* Row 1 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Nom du contact
              </Label>
              <Input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Jean Dupont"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Entreprise
              </Label>
              <Input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleChange}
                placeholder="Acme Inc"
              />
            </div>
          </div>

          {/* Row 2 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Mail className="w-4 h-4" />
                Email
              </Label>
              <Input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="jean@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Phone className="w-4 h-4" />
                Téléphone
              </Label>
              <Input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>

          {/* Row 3 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Briefcase className="w-4 h-4" />
              Secteur d'activité
            </Label>
            <Input
              type="text"
              name="activityLabel"
              value={formData.activityLabel}
              onChange={handleChange}
              placeholder="Ex: Services informatiques"
            />
          </div>

          {/* Row 4 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Adresse
            </Label>
            <Input
              type="text"
              name="address"
              value={formData.address}
              onChange={handleChange}
              placeholder="123 rue de la Paix, 75000 Paris"
            />
          </div>

          {/* Row 5 */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Notes
            </Label>
            <Textarea
              name="notes"
              value={formData.notes}
              onChange={handleChange}
              placeholder="Ajouter des notes sur ce prospect..."
              rows={4}
            />
          </div>

          {/* Info */}
          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Le nom ou l'entreprise est obligatoire. Les autres champs sont optionnels.
            </AlertDescription>
          </Alert>

          {/* Buttons */}
          <DialogFooter className="gap-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button type="submit" className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 mr-2" />
              Ajouter le prospect
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
