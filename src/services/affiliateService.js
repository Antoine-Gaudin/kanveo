// src/services/affiliateService.js
import { supabase } from "../lib/supabaseClient";

export const AffiliateService = {
  /**
   * Récupérer le profil affilié de l'utilisateur connecté
   */
  async getMyAffiliate() {
    const { data, error } = await supabase
      .from("affiliates")
      .select("*")
      .single();

    if (error && error.code !== "PGRST116") throw error; // PGRST116 = no rows
    return data;
  },

  /**
   * Devenir partenaire : génère un code et crée le profil affilié
   */
  async becomeAffiliate(userId) {
    // Générer un code unique via la fonction SQL
    const { data: codeData, error: codeError } = await supabase
      .rpc("generate_affiliate_code");

    if (codeError) throw codeError;

    const { data, error } = await supabase
      .from("affiliates")
      .insert({
        user_id: userId,
        affiliate_code: codeData,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Récupérer les statistiques de l'affilié
   */
  async getAffiliateStats(affiliateId) {
    const { data: referrals, error } = await supabase
      .from("affiliate_referrals")
      .select("*")
      .eq("affiliate_id", affiliateId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    const clicks = referrals?.length || 0;
    const signups = referrals?.filter(r => r.status !== "clicked").length || 0;
    const subscribed = referrals?.filter(r => ["subscribed", "paid"].includes(r.status)).length || 0;
    const paid = referrals?.filter(r => r.status === "paid").length || 0;
    // 5€/mois récurrent par abonné actif
    const pendingEarnings = subscribed * 5; // gains mensuels récurrents
    const paidEarnings = paid * 5; // total déjà versé

    return {
      clicks,
      signups,
      subscribed,
      paid,
      pendingEarnings,
      paidEarnings,
      referrals: referrals || [],
    };
  },

  /**
   * Enregistrer un clic sur un lien affilié (côté visiteur)
   */
  async trackClick(affiliateCode) {
    // Déduplication par session : ne pas réenregistrer un clic pour le même code
    const sessionKey = `aff_click_${affiliateCode}`;
    if (sessionStorage.getItem(sessionKey)) return null;

    // Trouver l'affilié par code
    const { data: affiliate, error: affError } = await supabase
      .from("affiliates")
      .select("id")
      .eq("affiliate_code", affiliateCode)
      .eq("is_active", true)
      .single();

    if (affError || !affiliate) return null;

    // Enregistrer le clic
    const { data, error } = await supabase
      .from("affiliate_referrals")
      .insert({
        affiliate_id: affiliate.id,
        status: "clicked",
      })
      .select()
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Mettre à jour un referral quand le visiteur s'inscrit
   */
  async trackSignup(affiliateCode, userId) {
    // Trouver l'affilié
    const { data: affiliate } = await supabase
      .from("affiliates")
      .select("id")
      .eq("affiliate_code", affiliateCode)
      .eq("is_active", true)
      .single();

    if (!affiliate) return null;

    // Vérifier si un referral existe déjà pour cet utilisateur + affilié
    const { data: existing } = await supabase
      .from("affiliate_referrals")
      .select("id")
      .eq("affiliate_id", affiliate.id)
      .eq("referred_user_id", userId)
      .maybeSingle();

    if (existing) return existing; // Déjà tracké

    // Créer le referral
    const { data, error } = await supabase
      .from("affiliate_referrals")
      .insert({
        affiliate_id: affiliate.id,
        referred_user_id: userId,
        status: "signed_up",
      })
      .select()
      .single();

    if (error) return null;
    return data;
  },

  /**
   * Mettre à jour les coordonnées bancaires
   */
  async updateBankDetails(affiliateId, { bank_holder_name, bank_iban, bank_bic }) {
    // Validation basique de l'IBAN
    const cleanIban = bank_iban?.replace(/\s/g, "").toUpperCase() || null;
    if (cleanIban) {
      if (cleanIban.length < 15 || cleanIban.length > 34) {
        throw new Error("L'IBAN doit contenir entre 15 et 34 caractères.");
      }
      if (!/^[A-Z]{2}\d{2}[A-Z0-9]+$/.test(cleanIban)) {
        throw new Error("Format d'IBAN invalide. Il doit commencer par 2 lettres suivies de 2 chiffres.");
      }
    }

    const { data, error } = await supabase
      .from("affiliates")
      .update({
        bank_holder_name: bank_holder_name?.trim() || null,
        bank_iban: cleanIban,
        bank_bic: bank_bic?.trim().toUpperCase() || null,
        bank_updated_at: new Date().toISOString(),
      })
      .eq("id", affiliateId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Construire l'URL d'affiliation
   */
  getAffiliateUrl(code) {
    const baseUrl = window.location.origin;
    return `${baseUrl}/ref/${code}`;
  },
};
