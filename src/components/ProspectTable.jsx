import { useState } from "react";

export default function ProspectTable({ prospects = [], onRefresh = null }) {
  const [selectedProspect, setSelectedProspect] = useState(null);

  if (!prospects || prospects.length === 0) {
    return (
      <div className="bg-card border border-border rounded-lg p-8 text-center">
        <p className="text-muted-foreground">Aucun prospect à afficher</p>
      </div>
    );
  }

  // Colonnes à afficher
  const columns = [
    { key: "company_name", label: "Entreprise" },
    { key: "contact_name", label: "Contact" },
    { key: "email", label: "Email" },
    { key: "phone", label: "Téléphone" },
    { key: "status", label: "Statut" },
  ];

  return (
    <div className="bg-card border border-border rounded-lg overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-muted border-b border-border">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold text-muted-foreground"
                >
                  {col.label}
                </th>
              ))}
              <th className="px-4 py-3 text-left font-semibold text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {prospects.map((prospect, idx) => (
              <tr
                key={prospect.id || idx}
                className="border-b border-border hover:bg-muted/50 transition"
              >
                {columns.map((col) => (
                  <td key={col.key} className="px-4 py-3 text-foreground">
                    {prospect[col.key] || "-"}
                  </td>
                ))}
                <td className="px-4 py-3">
                  <button
                    onClick={() => setSelectedProspect(prospect)}
                    className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 text-sm font-medium"
                  >
                    Détails
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal détails */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border rounded-lg p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold text-foreground">
                {selectedProspect.company_name || "Détails"}
              </h2>
              <button
                onClick={() => setSelectedProspect(null)}
                className="text-muted-foreground hover:text-foreground text-2xl"
              >
                ×
              </button>
            </div>

            <div className="space-y-3">
              {Object.entries(selectedProspect).map(([key, value]) => (
                <div key={key} className="border-b border-border pb-2">
                  <p className="text-xs uppercase text-muted-foreground font-semibold">
                    {key.replace(/_/g, " ")}
                  </p>
                  <p className="text-foreground break-words">{value || "-"}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
