import { supabase } from '../lib/supabaseClient';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

/**
 * Call a Supabase Edge Function with auth headers
 */
async function callEdgeFunction(functionName, body = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) throw new Error('Non authentifié');

  const response = await fetch(`${SUPABASE_URL}/functions/v1/${functionName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
      'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
    body: JSON.stringify(body),
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error(`Erreur serveur (${response.status})`);
  }
  if (!response.ok) throw new Error(data.error || 'Erreur serveur');
  return data;
}

/**
 * Create a Stripe Checkout session and redirect
 */
export async function createCheckout(promoCode = null, billing = 'monthly') {
  const body = {
    success_url: `${window.location.origin}/checkout-success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${window.location.origin}/pricing`,
    billing_interval: billing, // 'monthly' | 'annual'
  };
  if (promoCode) body.promo_code = promoCode;

  const { url } = await callEdgeFunction('create-checkout', body);
  if (!url || (!url.startsWith('https://checkout.stripe.com') && !url.startsWith(window.location.origin))) {
    throw new Error('URL de redirection invalide');
  }
  window.location.href = url;
}

/**
 * Open the Stripe billing portal
 */
export async function openBillingPortal() {
  const { url } = await callEdgeFunction('create-portal-session', {
    return_url: `${window.location.origin}/settings`,
  });
  if (!url || (!url.startsWith('https://billing.stripe.com') && !url.startsWith('https://checkout.stripe.com') && !url.startsWith(window.location.origin))) {
    throw new Error('URL de redirection invalide');
  }
  window.location.href = url;
}

/**
 * Create a Stripe Connect Express account for an affiliate and get onboarding link
 */
export async function createConnectAccount(influencerCodeId) {
  return await callEdgeFunction('create-connect-account', {
    influencer_code_id: influencerCodeId,
    refresh_url: `${window.location.origin}/admin`,
    return_url: `${window.location.origin}/admin`,
  });
}

/**
 * Validate an influencer code against Supabase
 */
export async function validateInfluencerCode(code) {
  const { data, error } = await supabase
    .from('influencer_codes')
    .select('code, influencer_name, max_uses, current_uses, is_active')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .single();

  if (error || !data) return { valid: false };
  if (data.max_uses !== null && data.current_uses >= data.max_uses) return { valid: false, reason: 'Code expiré' };
  return { valid: true, influencer_name: data.influencer_name };
}
