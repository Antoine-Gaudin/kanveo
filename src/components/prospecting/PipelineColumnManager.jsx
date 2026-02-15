import { useState } from "react";
import { useConfirm } from "../../hooks/useConfirm";
import ConfirmDialog from "../ConfirmDialog";

const COLOR_OPTIONS = [
  { value: "blue", label: "Bleu", class: "bg-blue-600" },
  { value: "purple", label: "Violet", class: "bg-purple-600" },
  { value: "amber", label: "Ambre", class: "bg-amber-600" },
  { value: "green", label: "Vert", class: "bg-green-600" },
  { value: "red", label: "Rouge", class: "bg-red-600" },
  { value: "pink", label: "Rose", class: "bg-pink-600" },
  { value: "indigo", label: "Indigo", class: "bg-indigo-600" },
  { value: "cyan", label: "Cyan", class: "bg-cyan-600" },
  { value: "orange", label: "Orange", class: "bg-orange-600" },
  { value: "slate", label: "Gris", class: "bg-slate-600" },
];

// Static class map to avoid dynamic Tailwind class generation (purged in production)
const COLOR_CLASSES = {
  blue:   { header: "bg-gradient-to-r from-blue-600/20 to-blue-500/10 border-l-4 border-blue-500",   badge: "bg-blue-600/20 text-blue-300" },
  purple: { header: "bg-gradient-to-r from-purple-600/20 to-purple-500/10 border-l-4 border-purple-500", badge: "bg-purple-600/20 text-purple-300" },
  amber:  { header: "bg-gradient-to-r from-amber-600/20 to-amber-500/10 border-l-4 border-amber-500",  badge: "bg-amber-600/20 text-amber-300" },
  green:  { header: "bg-gradient-to-r from-green-600/20 to-green-500/10 border-l-4 border-green-500",  badge: "bg-green-600/20 text-green-300" },
  red:    { header: "bg-gradient-to-r from-red-600/20 to-red-500/10 border-l-4 border-red-500",    badge: "bg-red-600/20 text-red-300" },
  pink:   { header: "bg-gradient-to-r from-pink-600/20 to-pink-500/10 border-l-4 border-pink-500",   badge: "bg-pink-600/20 text-pink-300" },
  indigo: { header: "bg-gradient-to-r from-indigo-600/20 to-indigo-500/10 border-l-4 border-indigo-500", badge: "bg-indigo-600/20 text-indigo-300" },
  cyan:   { header: "bg-gradient-to-r from-cyan-600/20 to-cyan-500/10 border-l-4 border-cyan-500",   badge: "bg-cyan-600/20 text-cyan-300" },
  orange: { header: "bg-gradient-to-r from-orange-600/20 to-orange-500/10 border-l-4 border-orange-500", badge: "bg-orange-600/20 text-orange-300" },
  slate:  { header: "bg-gradient-to-r from-slate-600/20 to-slate-500/10 border-l-4 border-slate-500",  badge: "bg-slate-600/20 text-slate-300" },
};

const ICON_OPTIONS = [
  "🆕", "📞", "⏳", "✅", "❌", "📧", "💼", "🎯", "🚀", "⭐",
  "📋", "📊", "💰", "🔔", "⚡", "🔥", "💡", "🎉", "📈", "🏆"
];

export default function PipelineColumnManager({ board, onUpdateBoard, onClose }) {
  const [columns, setColumns] = useState(board?.statuses || []);
  const [editingColumn, setEditingColumn] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const { isOpen, confirmConfig, confirm, close } = useConfirm();

  const [newColumn, setNewColumn] = useState({
    id: "",
    label: "",
    icon: "📋",
    color: "slate",
  });

  // Générer les classes CSS pour un statut (static map)
  const generateClasses = (color) => {
    return COLOR_CLASSES[color] || COLOR_CLASSES.slate;
  };

  // Ajouter une nouvelle colonne
  const handleAddColumn = () => {
    if (!newColumn.id || !newColumn.label) {
      setErrorMsg("L'ID et le label sont requis");
      return;
    }

    // Vérifier que l'ID n'existe pas déjà
    if (columns.some(col => col.id === newColumn.id)) {
      setErrorMsg("Une colonne avec cet ID existe déjà");
      return;
    }

    setErrorMsg("");

    const classes = generateClasses(newColumn.color);
    const columnToAdd = {
      ...newColumn,
      ...classes,
    };

    const updatedColumns = [...columns, columnToAdd];
    setColumns(updatedColumns);
    setShowAddForm(false);
    setNewColumn({ id: "", label: "", icon: "📋", color: "slate" });
  };

  // Modifier une colonne existante
  const handleUpdateColumn = (index, updates) => {
    const updatedColumns = [...columns];
    const classes = generateClasses(updates.color || updatedColumns[index].color);
    updatedColumns[index] = {
      ...updatedColumns[index],
      ...updates,
      ...classes,
    };
    setColumns(updatedColumns);
  };

  // Supprimer une colonne
  const handleDeleteColumn = (index) => {
    const column = columns[index];
    confirm({
      title: "Supprimer cette colonne ?",
      message: `Êtes-vous sûr de vouloir supprimer la colonne "${column.label}" ? Les prospects dans cette colonne devront être déplacés.`,
      confirmText: "Supprimer",
      cancelText: "Annuler",
      type: "danger",
      onConfirm: () => {
        const updatedColumns = columns.filter((_, i) => i !== index);
        setColumns(updatedColumns);
      }
    });
  };

  // Déplacer une colonne vers le haut
  const handleMoveUp = (index) => {
    if (index === 0) return;
    const updatedColumns = [...columns];
    [updatedColumns[index - 1], updatedColumns[index]] =
      [updatedColumns[index], updatedColumns[index - 1]];
    setColumns(updatedColumns);
  };

  // Déplacer une colonne vers le bas
  const handleMoveDown = (index) => {
    if (index === columns.length - 1) return;
    const updatedColumns = [...columns];
    [updatedColumns[index], updatedColumns[index + 1]] =
      [updatedColumns[index + 1], updatedColumns[index]];
    setColumns(updatedColumns);
  };

  // Sauvegarder les modifications
  const handleSave = async () => {
    try {
      await onUpdateBoard(board.id, { statuses: columns });
      onClose();
    } catch (error) {
      setErrorMsg("Erreur lors de la mise à jour des colonnes");
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
        <div className="w-full max-w-4xl rounded-xl border border-border bg-card p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-foreground">
              Gérer les colonnes du pipeline
            </h2>
            <button
              onClick={onClose}
              aria-label="Fermer"
              className="text-muted-foreground hover:text-foreground transition"
            >
              ✕
            </button>
          </div>

          <div className="mb-6 p-4 bg-blue-600/10 border border-blue-600/30 rounded-lg text-blue-300 text-sm">
            💡 Personnalisez les colonnes de votre pipeline : ajoutez, modifiez ou supprimez des colonnes selon vos besoins.
          </div>

          {errorMsg && (
            <div role="alert" className="mb-4 p-3 bg-red-600/10 border border-red-600/30 rounded-lg text-red-400 text-sm">
              {errorMsg}
            </div>
          )}

          {/* Liste des colonnes existantes */}
          <div className="space-y-3 mb-6">
            {columns.map((column, index) => (
              <div
                key={column.id}
                className="bg-muted/50 border border-border rounded-lg p-4"
              >
                {editingColumn === index ? (
                  // Mode édition
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          ID (technique)
                        </label>
                        <input
                          type="text"
                          value={column.id}
                          disabled
                          className="w-full px-3 py-2 bg-background border border-input rounded text-foreground opacity-50 cursor-not-allowed"
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Label
                        </label>
                        <input
                          type="text"
                          value={column.label}
                          onChange={(e) =>
                            handleUpdateColumn(index, { label: e.target.value })
                          }
                          className="w-full px-3 py-2 bg-background border border-input rounded text-foreground focus:border-ring focus:outline-none"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Icône
                        </label>
                        <div className="grid grid-cols-10 gap-2">
                          {ICON_OPTIONS.map((icon) => (
                            <button
                              key={icon}
                              onClick={() =>
                                handleUpdateColumn(index, { icon })
                              }
                              className={`text-2xl p-2 rounded transition flex items-center justify-center ${
                                column.icon === icon
                                  ? "bg-blue-600"
                                  : "bg-muted hover:bg-muted/80"
                              }`}
                            >
                              {icon}
                            </button>
                          ))}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm text-muted-foreground mb-1">
                          Couleur
                        </label>
                        <div className="grid grid-cols-5 gap-2">
                          {COLOR_OPTIONS.map((colorOption) => (
                            <button
                              key={colorOption.value}
                              onClick={() =>
                                handleUpdateColumn(index, {
                                  color: colorOption.value,
                                })
                              }
                              className={`${colorOption.class} h-10 rounded transition ${
                                column.color === colorOption.value
                                  ? "ring-2 ring-white"
                                  : "opacity-70 hover:opacity-100"
                              }`}
                              title={colorOption.label}
                            />
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => setEditingColumn(null)}
                        className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        ✓ Valider
                      </button>
                    </div>
                  </div>
                ) : (
                  // Mode affichage
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{column.icon}</span>
                      <div>
                        <p className="text-foreground font-semibold">{column.label}</p>
                        <p className="text-muted-foreground text-sm">ID: {column.id}</p>
                      </div>
                      <div
                        className={`w-4 h-4 rounded-full ${COLOR_OPTIONS.find(c => c.value === column.color)?.class}`}
                        title={COLOR_OPTIONS.find(c => c.value === column.color)?.label}
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Boutons de déplacement */}
                      <button
                        onClick={() => handleMoveUp(index)}
                        disabled={index === 0}
                        className="px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded transition"
                        title="Déplacer vers le haut"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => handleMoveDown(index)}
                        disabled={index === columns.length - 1}
                        className="px-2 py-1 bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed text-foreground rounded transition"
                        title="Déplacer vers le bas"
                      >
                        ↓
                      </button>

                      {/* Bouton éditer */}
                      <button
                        onClick={() => setEditingColumn(index)}
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded transition"
                      >
                        ✎ Modifier
                      </button>

                      {/* Bouton supprimer */}
                      <button
                        onClick={() => handleDeleteColumn(index)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded transition"
                      >
                        🗑 Supprimer
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Formulaire d'ajout */}
          {showAddForm ? (
            <div className="bg-muted/50 border border-border rounded-lg p-4 mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-3">
                Ajouter une nouvelle colonne
              </h3>
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      ID (technique, minuscules sans espaces)
                    </label>
                    <input
                      type="text"
                      value={newColumn.id}
                      onChange={(e) =>
                        setNewColumn({ ...newColumn, id: e.target.value.toLowerCase().replace(/\s/g, '_') })
                      }
                      placeholder="ex: en_negociation"
                      className="w-full px-3 py-2 bg-background border border-input rounded text-foreground focus:border-ring focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Label affiché
                    </label>
                    <input
                      type="text"
                      value={newColumn.label}
                      onChange={(e) =>
                        setNewColumn({ ...newColumn, label: e.target.value })
                      }
                      placeholder="ex: En négociation"
                      className="w-full px-3 py-2 bg-background border border-input rounded text-foreground focus:border-ring focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Icône
                    </label>
                    <div className="grid grid-cols-10 gap-2">
                      {ICON_OPTIONS.map((icon) => (
                        <button
                          key={icon}
                          onClick={() => setNewColumn({ ...newColumn, icon })}
                          className={`text-2xl p-2 rounded transition flex items-center justify-center ${
                            newColumn.icon === icon
                              ? "bg-blue-600"
                              : "bg-muted hover:bg-muted/80"
                          }`}
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm text-muted-foreground mb-1">
                      Couleur
                    </label>
                    <div className="grid grid-cols-5 gap-2">
                      {COLOR_OPTIONS.map((colorOption) => (
                        <button
                          key={colorOption.value}
                          onClick={() =>
                            setNewColumn({ ...newColumn, color: colorOption.value })
                          }
                          className={`${colorOption.class} h-10 rounded transition ${
                            newColumn.color === colorOption.value
                              ? "ring-2 ring-white"
                              : "opacity-70 hover:opacity-100"
                          }`}
                          title={colorOption.label}
                        />
                      ))}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleAddColumn}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded transition"
                  >
                    ✓ Ajouter
                  </button>
                  <button
                    onClick={() => {
                      setShowAddForm(false);
                      setNewColumn({ id: "", label: "", icon: "📋", color: "slate" });
                    }}
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground rounded transition"
                  >
                    Annuler
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition mb-6"
            >
              ➕ Ajouter une colonne
            </button>
          )}

          {/* Boutons d'action */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 rounded-lg border border-border text-muted-foreground hover:bg-muted font-medium transition"
            >
              Annuler
            </button>
            <button
              onClick={handleSave}
              className="flex-1 px-4 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium transition"
            >
              ✓ Sauvegarder
            </button>
          </div>
        </div>
      </div>

      {/* Dialog de confirmation */}
      <ConfirmDialog
        isOpen={isOpen}
        onClose={close}
        {...confirmConfig}
      />
    </>
  );
}
