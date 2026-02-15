// src/components/sirene/SireneStats.jsx
import { useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, Users, MapPin, Briefcase, AlertTriangle } from "lucide-react";

export default function SireneStats({ rows, duplicateSirets = new Set() }) {
  const stats = useMemo(() => {
    if (!rows.length) return null;

    const getField = (row, candidates) => {
      const key = Object.keys(row).find((k) =>
        candidates.some((c) => k.toLowerCase().trim() === c.toLowerCase().trim())
      );
      return key ? String(row[key]).trim() : "";
    };

    let withIdentity = 0;
    let withCompany = 0;
    let withSiret = 0;
    let duplicateCount = 0;
    const departments = {};
    const juridicalForms = {};

    for (const row of rows) {
      const nom = getField(row, ["nom", "nomunitelegale"]);
      const societe = getField(row, ["denomination", "denominationunitelegale"]);
      const siret = getField(row, ["siret", "siretetablissement"]);
      const cp = getField(row, ["codepostaletablissement", "codepostal"]);
      const jur = getField(row, ["categoriejuridiqueunitelegale"]);

      if (nom && nom !== "_" && nom !== "[ND]") withIdentity++;
      if (societe && societe !== "_" && societe !== "[ND]") withCompany++;
      if (siret) {
        withSiret++;
        if (duplicateSirets.has(siret.replace(/[\s.-]/g, ""))) duplicateCount++;
      }

      if (cp && cp.length >= 2) {
        const dept = cp.substring(0, 2);
        departments[dept] = (departments[dept] || 0) + 1;
      }

      if (jur) {
        juridicalForms[jur] = (juridicalForms[jur] || 0) + 1;
      }
    }

    // Top 3 départements
    const topDepts = Object.entries(departments)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3);

    // Top 3 formes juridiques (simplifiées)
    const jurLabels = {
      "1000": "EI", "5410": "SARL", "5710": "SAS", "5720": "SASU",
      "5520": "SA", "9220": "Asso.", "3210": "SCI", "5790": "SELARL",
      "5110": "SNC", "6110": "Mutuelle",
    };
    const topJur = Object.entries(juridicalForms)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([code, count]) => ({ code, label: jurLabels[code] || code, count }));

    return {
      total: rows.length,
      withIdentity,
      withCompany,
      withSiret,
      duplicateCount,
      topDepts,
      topJur,
      pctIdentity: Math.round((withIdentity / rows.length) * 100),
      pctCompany: Math.round((withCompany / rows.length) * 100),
    };
  }, [rows, duplicateSirets]);

  if (!stats) return null;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Users className="w-4 h-4" />
            <span className="text-xs font-medium">Identités</span>
          </div>
          <p className="text-2xl font-bold">{stats.withIdentity}</p>
          <p className="text-xs text-muted-foreground">{stats.pctIdentity}% des lignes</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Building2 className="w-4 h-4" />
            <span className="text-xs font-medium">Entreprises</span>
          </div>
          <p className="text-2xl font-bold">{stats.withCompany}</p>
          <p className="text-xs text-muted-foreground">{stats.pctCompany}% des lignes</p>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <MapPin className="w-4 h-4" />
            <span className="text-xs font-medium">Départements</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {stats.topDepts.length > 0 ? (
              stats.topDepts.map(([dept, count]) => (
                <Badge key={dept} variant="secondary" className="text-xs">
                  {dept} ({count})
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-4 pb-3 px-4">
          <div className="flex items-center gap-2 text-muted-foreground mb-1">
            <Briefcase className="w-4 h-4" />
            <span className="text-xs font-medium">Formes juridiques</span>
          </div>
          <div className="flex flex-wrap gap-1 mt-1">
            {stats.topJur.length > 0 ? (
              stats.topJur.map(({ code, label, count }) => (
                <Badge key={code} variant="secondary" className="text-xs">
                  {label} ({count})
                </Badge>
              ))
            ) : (
              <span className="text-xs text-muted-foreground">—</span>
            )}
          </div>
          {stats.duplicateCount > 0 && (
            <div className="flex items-center gap-1 mt-2 text-amber-600">
              <AlertTriangle className="w-3 h-3" />
              <span className="text-xs font-medium">{stats.duplicateCount} doublon{stats.duplicateCount > 1 ? 's' : ''}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
