// src/services/adminService.js
import { supabase } from '../lib/supabaseClient';

export class AdminService {
  // ═══════════════════════════════════════
  // UTILISATEURS
  // ═══════════════════════════════════════

  static async getAllUsers() {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async updateUserRole(userId, roleLevel) {
    const { data, error } = await supabase
      .from('user_profiles')
      .update({ role_level: roleLevel, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════
  // CODES INFLUENCEURS
  // ═══════════════════════════════════════

  static async getAllInfluencerCodes() {
    const { data, error } = await supabase
      .from('influencer_codes')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createInfluencerCode({ code, influencer_name, email, stripe_coupon_id, max_uses }) {
    const { data, error } = await supabase
      .from('influencer_codes')
      .insert([{
        code: code.toUpperCase(),
        influencer_name,
        email: email || null,
        stripe_coupon_id: stripe_coupon_id || 'GZD8vrdX',
        max_uses: max_uses || null,
      }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async updateInfluencerCode(codeId, updates) {
    const { data, error } = await supabase
      .from('influencer_codes')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', codeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static async toggleInfluencerCode(codeId, isActive) {
    const { data, error } = await supabase
      .from('influencer_codes')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', codeId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════
  // REFERRALS (PARRAINAGES)
  // ═══════════════════════════════════════

  static async getAllReferrals() {
    const { data, error } = await supabase
      .from('referrals')
      .select('*, user_profiles:user_id!referrals_user_id_user_profiles_fkey(id, first_name, last_name, email, company_name), influencer_codes:influencer_code_id(id, code, influencer_name)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async createReferral({ user_id, influencer_code_id }) {
    const { data, error } = await supabase
      .from('referrals')
      .upsert({
        user_id,
        influencer_code_id,
        subscription_status: 'active',
        subscribed_at: new Date().toISOString(),
      }, { onConflict: 'user_id' })
      .select('*, user_profiles:user_id!referrals_user_id_user_profiles_fkey(id, first_name, last_name, email, company_name), influencer_codes:influencer_code_id(id, code, influencer_name)')
      .single();
    if (error) throw error;
    return data;
  }

  // ═══════════════════════════════════════
  // COMMISSIONS AFFILIES
  // ═══════════════════════════════════════

  static async getAllCommissions() {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .select('*, influencer_codes:influencer_code_id(id, code, influencer_name), referrals:referral_id(id, user_id), user_profiles:user_id!affiliate_commissions_user_id_user_profiles_fkey(id, first_name, last_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async retryFailedCommission(commissionId) {
    const { data, error } = await supabase
      .from('affiliate_commissions')
      .update({ status: 'pending', error_message: null, updated_at: new Date().toISOString() })
      .eq('id', commissionId)
      .select()
      .single();
    if (error) throw error;
    return data;
  }

  static computeCommissionStats(commissions) {
    const statsMap = {};
    for (const c of commissions) {
      const code = c.influencer_codes;
      if (!code) continue;
      const key = code.id;
      if (!statsMap[key]) {
        statsMap[key] = {
          influencer_code_id: code.id,
          code: code.code,
          influencer_name: code.influencer_name,
          total: 0,
          transferred_cents: 0,
          pending: 0,
          failed: 0,
        };
      }
      statsMap[key].total += 1;
      if (c.status === 'transferred') {
        statsMap[key].transferred_cents += c.amount_cents;
      } else if (c.status === 'pending') {
        statsMap[key].pending += 1;
      } else if (c.status === 'failed') {
        statsMap[key].failed += 1;
      }
    }
    return Object.values(statsMap);
  }

  // ═══════════════════════════════════════
  // PARTENAIRES AFFILIES
  // ═══════════════════════════════════════

  static async getAllAffiliates() {
    const { data, error } = await supabase
      .from('affiliates')
      .select('*, user_profiles:user_id!affiliates_user_id_user_profiles_fkey(id, first_name, last_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async getAllAffiliateReferrals() {
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .select('*, affiliates:affiliate_id!affiliate_referrals_affiliate_id_fkey(id, affiliate_code, user_id, user_profiles:user_id!affiliates_user_id_user_profiles_fkey(id, first_name, last_name, email)), referred_profile:user_profiles!affiliate_referrals_referred_user_id_user_profiles_fkey(id, first_name, last_name, email)')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  }

  static async updateAffiliateReferralStatus(referralId, status) {
    const updates = { status };
    if (status === 'subscribed') updates.converted_at = new Date().toISOString();
    if (status === 'paid') updates.paid_at = new Date().toISOString();
    const { data, error } = await supabase
      .from('affiliate_referrals')
      .update(updates)
      .eq('id', referralId)
      .select('*, affiliates:affiliate_id!affiliate_referrals_affiliate_id_fkey(id, affiliate_code, user_id, user_profiles:user_id!affiliates_user_id_user_profiles_fkey(id, first_name, last_name, email)), referred_profile:user_profiles!affiliate_referrals_referred_user_id_user_profiles_fkey(id, first_name, last_name, email)')
      .single();
    if (error) throw error;
    return data;
  }

  static async toggleAffiliate(affiliateId, isActive) {
    const { data, error } = await supabase
      .from('affiliates')
      .update({ is_active: isActive, updated_at: new Date().toISOString() })
      .eq('id', affiliateId)
      .select('*, user_profiles:user_id!affiliates_user_id_user_profiles_fkey(id, first_name, last_name, email)')
      .single();
    if (error) throw error;
    return data;
  }

  static async deleteInfluencerCode(codeId) {
    const { error } = await supabase
      .from('influencer_codes')
      .delete()
      .eq('id', codeId);
    if (error) throw error;
  }

  static computeAffiliateStats(affiliates, referrals) {
    const statsMap = {};
    for (const a of affiliates) {
      const profile = a.user_profiles;
      statsMap[a.id] = {
        affiliate_id: a.id,
        code: a.affiliate_code,
        name: profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() || profile.email : '—',
        email: profile?.email || '—',
        is_active: a.is_active,
        clicks: 0,
        signups: 0,
        subscribed: 0,
        paid: 0,
        earnings: 0,
      };
    }
    for (const r of referrals) {
      const key = r.affiliate_id;
      if (!statsMap[key]) continue;
      statsMap[key].clicks += 1;
      if (['signed_up', 'subscribed', 'paid'].includes(r.status)) statsMap[key].signups += 1;
      if (['subscribed', 'paid'].includes(r.status)) { statsMap[key].subscribed += 1; statsMap[key].earnings += Number(r.commission_amount || 5); }
      if (r.status === 'paid') { statsMap[key].paid += 1; }
    }
    return Object.values(statsMap);
  }

  // Aggregation client-side : stats par influenceur
  static computeInfluencerStats(referrals) {
    const statsMap = {};
    for (const r of referrals) {
      const code = r.influencer_codes;
      if (!code) continue;
      const key = code.id;
      if (!statsMap[key]) {
        statsMap[key] = {
          influencer_code_id: code.id,
          code: code.code,
          influencer_name: code.influencer_name,
          total: 0,
          active: 0,
          lost: 0,
        };
      }
      statsMap[key].total += 1;
      if (r.subscription_status === 'active' || r.subscription_status === 'trialing') {
        statsMap[key].active += 1;
      } else {
        statsMap[key].lost += 1;
      }
    }
    return Object.values(statsMap);
  }
}
