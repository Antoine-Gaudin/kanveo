// src/pages/PartnerDashboard.jsx
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../context/AuthContext";
import { AffiliateService } from "../services/affiliateService";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Separator } from "../components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../components/ui/table";
import {
  Handshake,
  Link2,
  Copy,
  Check,
  MousePointerClick,
  UserPlus,
  CreditCard,
  Wallet,
  TrendingUp,
  Loader2,
  ExternalLink,
  ArrowLeft,
} from "lucide-react";
import { Link } from "react-router-dom";
import PromoBanners from "../components/affiliate/PromoBanners";

const STATUS_MAP = {
  clicked: { label: "Clic", variant: "secondary" },
  signed_up: { label: "Inscrit", variant: "outline" },
  subscribed: { label: "Abonné", variant: "default" },
  paid: { label: "Payé", variant: "default" },
};

export default function PartnerDashboard() {
  const { user } = useAuth();
  const [affiliate, setAffiliate] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const aff = await AffiliateService.getMyAffiliate();
        if (aff) {
          setAffiliate(aff);
          const s = await AffiliateService.getAffiliateStats(aff.id);
          setStats(s);
        }
      } catch (err) {
        // ignore
      } finally {
        setLoading(false);
      }
    }
    if (user?.id) load();
  }, [user?.id]);

  const affiliateUrl = affiliate ? AffiliateService.getAffiliateUrl(affiliate.affiliate_code) : "";

  const copyLink = () => {
    navigator.clipboard.writeText(affiliateUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const conversionRate = useMemo(() => {
    if (!stats || stats.clicks === 0) return 0;
    return Math.round((stats.subscribed / stats.clicks) * 100);
  }, [stats]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!affiliate) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-8 text-center space-y-4">
            <Handshake className="w-12 h-12 mx-auto text-muted-foreground" />
            <h2 className="text-xl font-bold">Pas encore partenaire</h2>
            <p className="text-muted-foreground">
              Activez votre statut partenaire dans vos paramètres pour accéder au dashboard.
            </p>
            <Button asChild className="gap-2">
              <Link to="/settings">
                <ArrowLeft className="w-4 h-4" />
                Aller dans Paramètres
              </Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background -mx-4 -my-8 px-4 py-8">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <Card className="border-border/50">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <Handshake className="h-6 w-6" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold">Dashboard Partenaire</CardTitle>
                  <CardDescription>Suivez vos performances d'affiliation</CardDescription>
                </div>
              </div>
              <Badge variant="outline" className="w-fit gap-1 text-green-600 border-green-500/30 bg-green-500/10">
                <div className="w-2 h-2 rounded-full bg-green-500" />
                Actif
              </Badge>
            </div>
          </CardHeader>
        </Card>

        {/* Lien d'affiliation */}
        <Card>
          <CardContent className="p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="h-4 w-4 text-primary" />
              <p className="font-medium text-sm">Votre lien d'affiliation</p>
            </div>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-sm bg-muted px-3 py-2.5 rounded-lg border font-mono truncate">
                {affiliateUrl}
              </code>
              <Button variant="outline" size="icon" onClick={copyLink}>
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MousePointerClick className="h-5 w-5 text-blue-500" />
                </div>
                <span className="text-sm text-muted-foreground">Clics</span>
              </div>
              <p className="text-3xl font-bold">{stats?.clicks || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <UserPlus className="h-5 w-5 text-purple-500" />
                </div>
                <span className="text-sm text-muted-foreground">Inscrits</span>
              </div>
              <p className="text-3xl font-bold">{stats?.signups || 0}</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CreditCard className="h-5 w-5 text-green-500" />
                </div>
                <span className="text-sm text-muted-foreground">Abonnés</span>
              </div>
              <p className="text-3xl font-bold">{stats?.subscribed || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">Taux : {conversionRate}%</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <Wallet className="h-5 w-5 text-amber-500" />
                </div>
                <span className="text-sm text-muted-foreground">Gains</span>
              </div>
              <p className="text-3xl font-bold">{stats?.pendingEarnings || 0}€<span className="text-base font-normal text-muted-foreground">/mois</span></p>
              <p className="text-xs text-muted-foreground mt-1">
                Dont {stats?.paidEarnings || 0}€ versés au total
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Historique des referrals */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <TrendingUp className="h-5 w-5 text-primary" />
              <div>
                <CardTitle>Historique des parrainages</CardTitle>
                <CardDescription>Liste de toutes les personnes ayant utilisé votre lien</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {stats?.referrals?.length > 0 ? (
              <div className="rounded-lg border overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>Statut</TableHead>
                      <TableHead className="text-right">Commission</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {stats.referrals.map((ref) => {
                      const status = STATUS_MAP[ref.status] || STATUS_MAP.clicked;
                      return (
                        <TableRow key={ref.id}>
                          <TableCell className="text-sm">
                            {new Date(ref.created_at).toLocaleDateString("fr-FR", {
                              day: "2-digit",
                              month: "short",
                              year: "numeric",
                            })}
                          </TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono">
                            {["subscribed", "paid"].includes(ref.status) ? (
                              <span className="text-green-600 font-medium">+{ref.commission_amount}€/mois</span>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <MousePointerClick className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="font-medium">Aucun parrainage pour le moment</p>
                <p className="text-sm mt-1">Partagez votre lien pour commencer à gagner des commissions</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bannières promotionnelles */}
        <PromoBanners affiliateCode={affiliate.affiliate_code} />
      </div>
    </div>
  );
}
