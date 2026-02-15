// src/pages/Promo.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { AffiliateService } from "../services/affiliateService";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { 
  Copy, Check, Code, ExternalLink, Sparkles, 
  Search, LayoutGrid, CheckSquare, LineChart, Users, TrendingUp, Loader2
} from "lucide-react";

const SITE_URL = "https://kanveo.fr";

// ─── Bannière 728x90 (Leaderboard) ───
function BannerLeaderboard() {
  return (
    <div className="w-[728px] h-[90px] rounded-xl overflow-hidden relative bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 flex items-center px-6 gap-5 shadow-2xl">
      {/* Decorative circles */}
      <div className="absolute -top-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
      <div className="absolute -bottom-10 right-20 w-24 h-24 bg-white/5 rounded-full" />
      
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0 z-10">
        <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <span className="text-white font-bold text-xl tracking-tight">Kanveo</span>
      </div>

      {/* Text */}
      <div className="flex-1 z-10">
        <p className="text-white font-semibold text-sm leading-tight">Le CRM de prospection pour indépendants & TPE</p>
        <p className="text-white/70 text-xs mt-0.5">Import SIRENE · Pipeline Kanban · Tâches · Clients & Finances</p>
      </div>

      {/* CTA */}
      <div className="flex items-center gap-3 shrink-0 z-10">
        <div className="text-right">
          <div className="text-white/60 text-xs line-through">19€/mois</div>
          <div className="text-white font-bold text-lg leading-tight">15€<span className="text-white/70 text-xs font-normal"> HT/mois</span></div>
        </div>
        <a 
          href={`${SITE_URL}/pricing`}
          className="bg-white text-indigo-700 font-semibold text-sm px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors no-underline"
        >
          Essayer →
        </a>
      </div>
    </div>
  );
}

// ─── Bannière 300x250 (Medium Rectangle) ───
function BannerMedium() {
  return (
    <div className="w-[300px] h-[250px] rounded-xl overflow-hidden relative bg-gradient-to-br from-indigo-600 via-violet-600 to-purple-700 flex flex-col items-center justify-between p-5 shadow-2xl">
      {/* Decorative */}
      <div className="absolute -top-12 -right-12 w-36 h-36 bg-white/5 rounded-full" />
      <div className="absolute -bottom-8 -left-8 w-28 h-28 bg-white/5 rounded-full" />
      
      {/* Top */}
      <div className="flex items-center gap-2 z-10">
        <div className="w-8 h-8 rounded-lg bg-white/15 backdrop-blur flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-white" />
        </div>
        <span className="text-white font-bold text-lg tracking-tight">Kanveo</span>
        <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 text-[10px] px-1.5">BETA</Badge>
      </div>

      {/* Center */}
      <div className="text-center z-10">
        <p className="text-white font-bold text-base leading-snug">Le CRM de prospection<br/>pour indépendants & TPE</p>
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {["SIRENE", "Kanban", "Tâches", "Finances"].map(f => (
            <span key={f} className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full">{f}</span>
          ))}
        </div>
      </div>

      {/* Price + CTA */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="flex items-baseline gap-2">
          <span className="text-white/50 text-sm line-through">19€</span>
          <span className="text-white font-bold text-2xl">15€</span>
          <span className="text-white/60 text-xs">HT/mois</span>
        </div>
        <a 
          href={`${SITE_URL}/pricing`}
          className="bg-white text-indigo-700 font-semibold text-sm px-6 py-2 rounded-lg hover:bg-indigo-50 transition-colors no-underline"
        >
          Commencer maintenant →
        </a>
      </div>
    </div>
  );
}

// ─── Bannière 320x50 (Mobile Banner) ───
function BannerMobile() {
  return (
    <div className="w-[320px] h-[50px] rounded-lg overflow-hidden relative bg-gradient-to-r from-indigo-600 to-violet-600 flex items-center px-3 gap-2.5 shadow-xl">
      <div className="flex items-center gap-1.5 shrink-0">
        <div className="w-6 h-6 rounded bg-white/15 flex items-center justify-center">
          <Sparkles className="w-3 h-3 text-white" />
        </div>
        <span className="text-white font-bold text-xs">Kanveo</span>
      </div>
      <p className="text-white/80 text-[10px] flex-1 leading-tight">CRM prospection<br/>indépendants & TPE</p>
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-white font-bold text-sm">15€<span className="text-white/60 text-[9px]">/mois</span></span>
        <a 
          href={`${SITE_URL}/pricing`}
          className="bg-white text-indigo-700 font-semibold text-[10px] px-2.5 py-1 rounded hover:bg-indigo-50 transition-colors no-underline"
        >
          Essayer
        </a>
      </div>
    </div>
  );
}

// ─── Bannière 160x600 (Skyscraper) ───
function BannerSkyscraper() {
  return (
    <div className="w-[160px] h-[600px] rounded-xl overflow-hidden relative bg-gradient-to-b from-indigo-600 via-violet-600 to-purple-700 flex flex-col items-center justify-between py-6 px-3 shadow-2xl">
      <div className="absolute top-20 -left-10 w-28 h-28 bg-white/5 rounded-full" />
      <div className="absolute bottom-32 -right-8 w-24 h-24 bg-white/5 rounded-full" />
      
      {/* Logo */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="w-12 h-12 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-white" />
        </div>
        <span className="text-white font-bold text-lg">Kanveo</span>
        <Badge className="bg-amber-400/20 text-amber-200 border-amber-400/30 text-[10px]">BETA -21%</Badge>
      </div>

      {/* Features */}
      <div className="flex flex-col gap-3 z-10">
        {[
          { icon: Search, label: "Import SIRENE" },
          { icon: LayoutGrid, label: "Pipeline Kanban" },
          { icon: CheckSquare, label: "Gestion tâches" },
          { icon: Users, label: "Clients & CRM" },
          { icon: LineChart, label: "Suivi financier" },
          { icon: TrendingUp, label: "Dashboard" },
        ].map(({ icon: Icon, label }) => (
          <div key={label} className="flex items-center gap-2">
            <Icon className="w-3.5 h-3.5 text-white/70 shrink-0" />
            <span className="text-white/90 text-[11px]">{label}</span>
          </div>
        ))}
      </div>

      {/* Titre */}
      <p className="text-white font-semibold text-center text-xs leading-tight z-10">
        Le CRM pensé pour<br/>les indépendants<br/>& TPE
      </p>

      {/* Price + CTA */}
      <div className="flex flex-col items-center gap-2 z-10">
        <div className="text-center">
          <div className="text-white/50 text-xs line-through">19€/mois</div>
          <div className="text-white font-bold text-xl">15€<span className="text-white/60 text-xs"> HT/mois</span></div>
        </div>
        <a 
          href={`${SITE_URL}/pricing`}
          className="bg-white text-indigo-700 font-semibold text-xs px-4 py-2 rounded-lg hover:bg-indigo-50 transition-colors no-underline"
        >
          Essayer →
        </a>
      </div>
    </div>
  );
}

// ─── Embeddable HTML Code Generator ───
function getEmbedCode(format) {
  const styles = {
    leaderboard: { w: 728, h: 90, direction: "row" },
    medium: { w: 300, h: 250, direction: "column" },
    mobile: { w: 320, h: 50, direction: "row" },
    skyscraper: { w: 160, h: 600, direction: "column" },
  };
  
  const { w, h, direction } = styles[format];

  if (format === "leaderboard") {
    return `<!-- Kanveo Banner ${w}x${h} -->
<a href="${SITE_URL}/pricing" target="_blank" rel="noopener" style="display:flex;align-items:center;width:${w}px;height:${h}px;border-radius:12px;overflow:hidden;background:linear-gradient(to right,#4f46e5,#7c3aed,#9333ea);padding:0 24px;gap:20px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 20px 40px rgba(0,0,0,.2)">
  <div style="display:flex;align-items:center;gap:10px;flex-shrink:0">
    <div style="width:40px;height:40px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"/></svg>
    </div>
    <span style="color:white;font-weight:700;font-size:20px;letter-spacing:-0.5px">Kanveo</span>
  </div>
  <div style="flex:1">
    <div style="color:white;font-weight:600;font-size:13px">Le CRM de prospection pour indépendants & TPE</div>
    <div style="color:rgba(255,255,255,.6);font-size:11px;margin-top:2px">Import SIRENE · Pipeline Kanban · Tâches · Clients & Finances</div>
  </div>
  <div style="display:flex;align-items:center;gap:12px;flex-shrink:0">
    <div style="text-align:right">
      <div style="color:rgba(255,255,255,.5);font-size:11px;text-decoration:line-through">19€/mois</div>
      <div style="color:white;font-weight:700;font-size:18px">15€ <span style="color:rgba(255,255,255,.6);font-size:11px;font-weight:400">HT/mois</span></div>
    </div>
    <span style="background:white;color:#4338ca;font-weight:600;font-size:13px;padding:8px 16px;border-radius:8px">Essayer →</span>
  </div>
</a>`;
  }

  if (format === "medium") {
    return `<!-- Kanveo Banner ${w}x${h} -->
<a href="${SITE_URL}/pricing" target="_blank" rel="noopener" style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:${w}px;height:${h}px;border-radius:12px;overflow:hidden;background:linear-gradient(135deg,#4f46e5,#7c3aed,#7e22ce);padding:20px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 20px 40px rgba(0,0,0,.2)">
  <div style="display:flex;align-items:center;gap:8px">
    <div style="width:32px;height:32px;border-radius:8px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"/></svg>
    </div>
    <span style="color:white;font-weight:700;font-size:18px">Kanveo</span>
    <span style="background:rgba(251,191,36,.2);color:#fde68a;border:1px solid rgba(251,191,36,.3);font-size:9px;padding:2px 6px;border-radius:99px">BETA</span>
  </div>
  <div style="text-align:center">
    <div style="color:white;font-weight:700;font-size:15px;line-height:1.3">Le CRM de prospection<br/>pour indépendants & TPE</div>
    <div style="display:flex;flex-wrap:wrap;justify-content:center;gap:4px;margin-top:8px">
      <span style="font-size:10px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:99px">SIRENE</span>
      <span style="font-size:10px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:99px">Kanban</span>
      <span style="font-size:10px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:99px">Tâches</span>
      <span style="font-size:10px;background:rgba(255,255,255,.1);color:rgba(255,255,255,.8);padding:2px 8px;border-radius:99px">Finances</span>
    </div>
  </div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="display:flex;align-items:baseline;gap:8px">
      <span style="color:rgba(255,255,255,.4);font-size:13px;text-decoration:line-through">19€</span>
      <span style="color:white;font-weight:700;font-size:24px">15€</span>
      <span style="color:rgba(255,255,255,.5);font-size:11px">HT/mois</span>
    </div>
    <span style="background:white;color:#4338ca;font-weight:600;font-size:13px;padding:8px 24px;border-radius:8px">Commencer maintenant →</span>
  </div>
</a>`;
  }

  if (format === "mobile") {
    return `<!-- Kanveo Banner ${w}x${h} -->
<a href="${SITE_URL}/pricing" target="_blank" rel="noopener" style="display:flex;align-items:center;width:${w}px;height:${h}px;border-radius:8px;overflow:hidden;background:linear-gradient(to right,#4f46e5,#7c3aed);padding:0 12px;gap:10px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 8px 24px rgba(0,0,0,.2)">
  <div style="display:flex;align-items:center;gap:6px;flex-shrink:0">
    <div style="width:24px;height:24px;border-radius:4px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"/></svg>
    </div>
    <span style="color:white;font-weight:700;font-size:12px">Kanveo</span>
  </div>
  <div style="flex:1;color:rgba(255,255,255,.8);font-size:10px;line-height:1.3">CRM prospection<br/>indépendants & TPE</div>
  <div style="display:flex;align-items:center;gap:8px;flex-shrink:0">
    <span style="color:white;font-weight:700;font-size:13px">15€<span style="color:rgba(255,255,255,.5);font-size:9px">/mois</span></span>
    <span style="background:white;color:#4338ca;font-weight:600;font-size:10px;padding:4px 10px;border-radius:4px">Essayer</span>
  </div>
</a>`;
  }

  if (format === "skyscraper") {
    return `<!-- Kanveo Banner ${w}x${h} -->
<a href="${SITE_URL}/pricing" target="_blank" rel="noopener" style="display:flex;flex-direction:column;align-items:center;justify-content:space-between;width:${w}px;height:${h}px;border-radius:12px;overflow:hidden;background:linear-gradient(to bottom,#4f46e5,#7c3aed,#7e22ce);padding:24px 12px;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;box-shadow:0 20px 40px rgba(0,0,0,.2)">
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="width:48px;height:48px;border-radius:12px;background:rgba(255,255,255,.15);display:flex;align-items:center;justify-content:center">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M12 2L14.09 8.26L21 9.27L16 14.14L17.18 21.02L12 17.77L6.82 21.02L8 14.14L3 9.27L9.91 8.26L12 2Z"/></svg>
    </div>
    <span style="color:white;font-weight:700;font-size:18px">Kanveo</span>
    <span style="background:rgba(251,191,36,.2);color:#fde68a;border:1px solid rgba(251,191,36,.3);font-size:9px;padding:2px 8px;border-radius:99px">BETA -21%</span>
  </div>
  <div style="display:flex;flex-direction:column;gap:10px">
    <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg><span style="color:rgba(255,255,255,.9);font-size:11px">Import SIRENE</span></div>
    <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg><span style="color:rgba(255,255,255,.9);font-size:11px">Pipeline Kanban</span></div>
    <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><polyline points="9 11 12 14 22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg><span style="color:rgba(255,255,255,.9);font-size:11px">Gestion tâches</span></div>
    <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg><span style="color:rgba(255,255,255,.9);font-size:11px">Clients & CRM</span></div>
    <div style="display:flex;align-items:center;gap:8px"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.7)" stroke-width="2"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg><span style="color:rgba(255,255,255,.9);font-size:11px">Suivi financier</span></div>
  </div>
  <div style="color:white;font-weight:600;text-align:center;font-size:12px;line-height:1.4">Le CRM pensé pour<br/>les indépendants<br/>& TPE</div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:8px">
    <div style="text-align:center">
      <div style="color:rgba(255,255,255,.4);font-size:11px;text-decoration:line-through">19€/mois</div>
      <div style="color:white;font-weight:700;font-size:20px">15€ <span style="color:rgba(255,255,255,.5);font-size:11px;font-weight:400">HT/mois</span></div>
    </div>
    <span style="background:white;color:#4338ca;font-weight:600;font-size:12px;padding:8px 16px;border-radius:8px">Essayer →</span>
  </div>
</a>`;
  }
}

const BANNER_FORMATS = [
  { id: "leaderboard", label: "Leaderboard", size: "728 × 90", desc: "Header / footer de site" },
  { id: "medium", label: "Rectangle", size: "300 × 250", desc: "Sidebar / in-content" },
  { id: "mobile", label: "Mobile", size: "320 × 50", desc: "Bannière mobile" },
  { id: "skyscraper", label: "Skyscraper", size: "160 × 600", desc: "Sidebar verticale" },
];

export default function Promo() {
  const [selectedFormat, setSelectedFormat] = useState("leaderboard");
  const [copied, setCopied] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [checking, setChecking] = useState(!!user);

  // Si l'utilisateur est connect\u00e9 et partenaire, rediriger vers le dashboard partenaire
  useEffect(() => {
    if (!user?.id) { setChecking(false); return; }
    AffiliateService.getMyAffiliate()
      .then(aff => {
        if (aff) {
          navigate("/partenaire/dashboard", { replace: true });
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [user?.id, navigate]);

  if (checking) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleCopy = () => {
    const code = getEmbedCode(selectedFormat);
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="max-w-6xl mx-auto py-12 space-y-12">
      {/* Header */}
      <div className="text-center space-y-4">
        <Badge className="bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20">
          <Sparkles className="w-3 h-3 mr-1" />
          Programme Partenaires
        </Badge>
        <h1 className="text-4xl font-bold tracking-tight">Bannières Promotionnelles</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto">
          Choisissez un format, copiez le code HTML et intégrez la bannière Kanveo sur votre site internet.
        </p>
      </div>

      {/* Format selector */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {BANNER_FORMATS.map(f => (
          <button
            key={f.id}
            onClick={() => setSelectedFormat(f.id)}
            className={`p-4 rounded-xl border-2 text-left transition-all ${
              selectedFormat === f.id 
                ? "border-indigo-500 bg-indigo-500/5" 
                : "border-border hover:border-muted-foreground/30"
            }`}
          >
            <p className="font-semibold text-sm">{f.label}</p>
            <p className="text-xs text-muted-foreground">{f.size}</p>
            <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
          </button>
        ))}
      </div>

      {/* Preview */}
      <div className="space-y-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <ExternalLink className="w-4 h-4" />
          Aperçu
        </h2>
        <div className="bg-muted/30 rounded-2xl border p-8 flex items-center justify-center min-h-[300px] overflow-auto">
          {selectedFormat === "leaderboard" && <BannerLeaderboard />}
          {selectedFormat === "medium" && <BannerMedium />}
          {selectedFormat === "mobile" && <BannerMobile />}
          {selectedFormat === "skyscraper" && <BannerSkyscraper />}
        </div>
      </div>

      {/* Embed code */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Code className="w-4 h-4" />
            Code d'intégration
          </h2>
          <Button onClick={handleCopy} variant={copied ? "default" : "outline"} size="sm" className="gap-2">
            {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            {copied ? "Copié !" : "Copier le code"}
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <pre className="p-4 text-xs text-muted-foreground overflow-auto max-h-[300px] font-mono leading-relaxed">
              <code>{getEmbedCode(selectedFormat)}</code>
            </pre>
          </CardContent>
        </Card>
        <p className="text-xs text-muted-foreground">
          Collez ce code HTML dans votre site web. La bannière est auto-contenue (pas de CSS/JS externe). 
          Elle fonctionne sur tous les navigateurs et s'adapte à n'importe quel fond.
        </p>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comment intégrer la bannière ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">1</span>
            <p>Choisissez le format adapté à l'emplacement sur votre site (header, sidebar, contenu, mobile)</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">2</span>
            <p>Cliquez sur <strong>"Copier le code"</strong> pour copier le HTML dans votre presse-papiers</p>
          </div>
          <div className="flex gap-3">
            <span className="w-6 h-6 rounded-full bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold shrink-0">3</span>
            <p>Collez le code dans votre site WordPress, Wix, Squarespace, ou tout éditeur HTML. Le code ne nécessite aucun fichier externe.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
