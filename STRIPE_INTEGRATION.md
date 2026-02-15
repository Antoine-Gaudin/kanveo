# Stripe + Codes Influenceurs — Prompt d'implémentation

> Specs pour un LLM / développeur. Aucun code inclus — uniquement les instructions pour coder le front et le back.
> Les actions manuelles sur Stripe (produit, coupon, codes promo, webhook, portail client) sont déjà faites par l'admin via le dashboard Stripe. Voir `FEUILLE_DE_ROUTE.md` pour ces étapes.
> Le code ne crée rien dans Stripe — il interagit uniquement avec ce qui existe déjà.

---

## Contexte du projet

- **App** : Kanveo — SaaS de prospection commerciale
- **Stack front** : React + Vite + Tailwind + Shadcn/ui + React Router
- **Stack back** : Supabase (Auth, Postgres, Edge Functions en Deno/TypeScript)
- **Paiement** : Stripe (Checkout, Webhooks, Billing Portal, Coupons)
- **Prix** : 19 €/mois — réduction Early Adopter à 15 €/mois pendant 12 mois (-21%)
- **PAS d'essai gratuit** — paiement immédiat à l'inscription
- **Codes influenceurs** : commission de 4 €/mois × 12 mois par utilisateur référé

---

## Prérequis Stripe (déjà configurés manuellement)

Avant de coder quoi que ce soit, l'admin a déjà fait dans le dashboard Stripe :
- **Produit** "Kanveo Pro" créé à 19 €/mois récurrent → un `price_id` existe
- **Coupon** "Early Adopter -21%" : 4 € off × 12 mois → un `coupon_id` existe
- **Codes promo** influenceurs (ex: `THOMAS30`) liés au coupon, avec metadata :
  - `influencer_name`, `influencer_email`, `commission_amount` (en centimes), `commission_months`
- **Webhook** configuré vers l'URL de l'Edge Function (4 événements) → un `whsec_...` existe
- **Portail client** (Billing Portal) activé (annulation, changement carte, factures)
- **Secrets Supabase** configurés : `STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`

---

## PARTIE 1 — Backend (Supabase)

### 1.1 — Table `user_profiles` : colonnes à ajouter

Ajouter dans la table `user_profiles` existante :
- `stripe_customer_id` (TEXT) — ID client Stripe
- `subscription_id` (TEXT) — ID de l'abonnement Stripe actif
- `subscription_status` (TEXT, défaut `'none'`) — valeurs possibles : `none`, `active`, `past_due`, `canceled`, `incomplete`
- `current_period_end` (TIMESTAMPTZ) — fin de la période de facturation en cours

**Ne PAS ajouter** `trial_end` — il n'y a pas d'essai gratuit.

### 1.2 — Table `referrals` : tracking des codes influenceurs

Créer une table `referrals` avec :
- `id` (UUID, PK, auto-généré)
- `user_id` (UUID, FK → auth.users) — l'utilisateur qui a utilisé le code
- `stripe_promotion_code_id` (TEXT) — ID du promotion code Stripe
- `promo_code` (TEXT) — le code texte en majuscules (ex: `THOMAS30`)
- `influencer_name` (TEXT, nullable)
- `influencer_email` (TEXT, nullable)
- `commission_amount` (INTEGER, défaut 400) — en centimes (4 €)
- `commission_months` (INTEGER, défaut 12)
- `months_paid` (INTEGER, défaut 0) — compteur de mois déjà versés
- `started_at` (TIMESTAMPTZ, défaut now())
- `expires_at` (TIMESTAMPTZ) — started_at + 12 mois
- `status` (TEXT, défaut `'active'`) — `active` | `completed` | `cancelled`
- `created_at` (TIMESTAMPTZ, défaut now())

Index sur : `user_id`, `status`, `promo_code`.

### 1.3 — Vue SQL `referral_summary`

Créer une vue agrégeant par `promo_code` / `influencer_name` / `influencer_email` :
- `total_users` — nombre total de referrals
- `active_users` — referrals avec status = active
- `total_paid_eur` — somme déjà versée (commission_amount × months_paid / 100)
- `remaining_to_pay_eur` — commission restante pour les actifs

### 1.4 — Edge Function `create-checkout`

**But** : créer une session Stripe Checkout et retourner l'URL de paiement.
Le produit, le coupon et les codes promo existent déjà dans Stripe (créés manuellement par l'admin). Cette fonction crée juste la session de paiement.

Comportement :
1. Vérifier l'authentification Supabase via le header `Authorization`
2. Récupérer ou créer le customer Stripe (sauvegarder `stripe_customer_id` dans `user_profiles`)
3. Recevoir `{ priceId }` dans le body (le Price ID du produit existant dans Stripe)
4. Créer une `checkout.sessions.create` avec :
   - `mode: "subscription"`
   - **PAS de `trial_period_days`** — paiement immédiat
   - `allow_promotion_codes: true` — Stripe affiche le champ code promo automatiquement, les codes promo existent déjà dans Stripe
   - `success_url` → `/settings?session_id={CHECKOUT_SESSION_ID}`
   - `cancel_url` → `/pricing`
5. Retourner `{ url }` en JSON

CORS : autoriser toutes les origines avec les headers `authorization, x-client-info, apikey, content-type`.

### 1.5 — Edge Function `stripe-webhook`

**But** : recevoir les notifications automatiques de Stripe et synchroniser la base Supabase.
Le webhook a été configuré manuellement dans le dashboard Stripe (URL + événements). Cette fonction reçoit et traite les événements.

Événements à traiter :

**`customer.subscription.created`** :
- Mettre à jour `user_profiles` : `subscription_id`, `subscription_status`, `current_period_end`
- **Détecter le code promo** : si `subscription.discount.promotion_code` existe → le code promo a été appliqué lors du paiement. Dans ce cas :
  - Récupérer les détails du promotion code via `stripe.promotionCodes.retrieve()` (pour lire les metadata ajoutées manuellement par l'admin dans Stripe)
  - Trouver le `user_id` correspondant au `stripe_customer_id`
  - Insérer une ligne dans `referrals` avec les metadata de l'influenceur (`influencer_name`, `influencer_email`, `commission_amount`, `commission_months`)
  - `expires_at` = now + 12 mois

**`customer.subscription.updated`** :
- Mettre à jour `user_profiles` : `subscription_id`, `subscription_status`, `current_period_end`

**`customer.subscription.deleted`** :
- Mettre à jour `user_profiles` : `subscription_status` → `canceled`, `subscription_id` → null
- Passer tous les referrals actifs de cet utilisateur en status `cancelled`

**`invoice.payment_succeeded`** :
- Seulement si `billing_reason === "subscription_cycle"` (paiement mensuel récurrent, pas le tout premier)
- Trouver le `user_id` via `stripe_customer_id`
- Incrémenter `months_paid` dans `referrals` pour ce user (si status = active)
- Si `months_paid >= commission_months` → passer le status à `completed`

Validation : vérifier la signature du webhook avec `STRIPE_WEBHOOK_SECRET`.
Utiliser `SUPABASE_SERVICE_ROLE_KEY` (pas anon key) pour les écritures.

### 1.6 — Edge Function `create-portal-session`

**But** : créer un lien vers le portail client Stripe (déjà configuré manuellement par l'admin) pour que l'utilisateur gère son abonnement.

Comportement :
1. Vérifier l'authentification Supabase
2. Récupérer le `stripe_customer_id` depuis `user_profiles`
3. Créer une `billingPortal.sessions.create` avec `return_url` → `/settings`
4. Retourner `{ url }` en JSON

### 1.7 — Secrets Supabase requis

Déjà configurés par l'admin via `supabase secrets set` :
- `STRIPE_SECRET_KEY` — clé secrète Stripe
- `STRIPE_WEBHOOK_SECRET` — signing secret du webhook

---

## PARTIE 2 — Frontend (React)

### 2.1 — Page `/pricing` (Pricing.jsx)

Afficher :
- Prix barré ~~19 €~~ → **15 €/mois**
- Badge **"-21% la 1ère année"** (en pourcentage, pas en €)
- Sous-titre : "pendant 12 mois, puis 19 €/mois"
- **PAS de badge "Essai gratuit"** — aucune mention d'essai gratuit nulle part
- **PAS de "Bientôt disponible"** — remplacer par "Fonctionnalités à venir"
- CTA : **"S'abonner maintenant"** (pas "Démarrer l'essai gratuit")
- Sous le CTA : "Annulation à tout moment · Code promo accepté"
- FAQ : question sur les codes influenceurs (pas sur l'essai gratuit)

Au clic sur le CTA :
1. Rediriger vers `/auth` si non connecté
2. Si connecté : appeler l'Edge Function `create-checkout` avec le `priceId`
3. Rediriger vers l'URL Stripe Checkout retournée — Stripe gère le paiement, les codes promo, etc.

### 2.2 — `AuthContext.jsx`

Exposer `subscription_status` depuis le profil utilisateur chargé à la connexion.
Valeurs utiles : `none`, `active`, `past_due`, `canceled`.

### 2.3 — `ProtectedRoute.jsx`

Vérifier `subscription_status` :
- Si `active` → accès autorisé
- Si `none`, `canceled`, ou absent → rediriger vers `/pricing`
- Si `past_due` → afficher un avertissement mais autoriser l'accès temporairement

### 2.4 — Page `/settings` (Settings.jsx)

Section "Abonnement" :
- Afficher le statut actuel (`Actif`, `Annulé`, etc.)
- Afficher la date de fin de période
- Bouton "Gérer mon abonnement" → appeler `create-portal-session` → ouvrir l'URL du portail Stripe
- Si `session_id` dans l'URL (retour de Checkout) → afficher un message de confirmation

### 2.5 — Aucune mention d'essai gratuit

Vérifier partout dans l'app :
- Aucun texte "essai gratuit", "7 jours", "trial", "sans carte bancaire"
- Aucun badge "Essai gratuit"
- Le CTA principal est "S'abonner maintenant" partout

---

## Flux complet résumé

1. L'utilisateur va sur `/pricing` → clique "S'abonner maintenant"
2. S'il n'est pas connecté → `/auth` → revient sur `/pricing`
3. Appel `create-checkout` → redirigé vers Stripe Checkout
4. Stripe Checkout affiche le champ "Code promo" (les codes existent déjà dans Stripe)
5. L'utilisateur paie immédiatement 15 € (avec coupon) ou 19 € (sans coupon)
6. Webhook `customer.subscription.created` → met à jour `user_profiles` + crée un `referral` si code promo
7. Redirigé vers `/settings?session_id=xxx` → message de bienvenue
8. L'utilisateur accède à toutes les fonctionnalités (`subscription_status = active`)
9. Chaque mois → `invoice.payment_succeeded` → incrémente le compteur referral
10. Après 12 mois → le coupon expire automatiquement côté Stripe → 19 €/mois
11. L'admin consulte `referral_summary` dans Supabase → paie les influenceurs par virement

---

## Checklist — Code à implémenter

- [ ] Colonnes ajoutées à `user_profiles` (sans `trial_end`)
- [ ] Table `referrals` + vue `referral_summary` créées
- [ ] Edge Function `create-checkout` (sans trial, avec `allow_promotion_codes`)
- [ ] Edge Function `stripe-webhook` (4 événements, tracking referrals via metadata)
- [ ] Edge Function `create-portal-session`
- [ ] Frontend : Pricing sans essai gratuit, CTA "S'abonner maintenant", badge "-21%"
- [ ] Frontend : Settings avec gestion abonnement
- [ ] AuthContext expose `subscription_status`
- [ ] ProtectedRoute vérifie le statut d'abonnement

