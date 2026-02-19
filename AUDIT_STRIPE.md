# Audit Stripe — Compte Rendu (18/02/2026)

## Situation actuelle : 2 comptes Stripe distincts

| | **Compte Production** | **Compte Test** |
|---|---|---|
| Nom | "Gaudin" | "Environnement de test G... Gaudin" |
| Bandeau orange "Environnement de test" | **Non** | **Oui** |
| Produits | **0 produit** | **2 produits** ("Prospeo beta" 19€/mois + "prospeo beta annuel" 199€/an) |

**Le problème est clair** : les produits existent **uniquement dans l'environnement de test**, le compte **production est vide** (0 produit).

---

## Les 7 problèmes identifiés

### 1. ❌ Produits absents en production
Les 2 produits ("Prospeo beta" à 19€/mois et "prospeo beta annuel" à 199€/an) ne sont que dans le mode test. En production (mode live), il n'y a **rien**. Les produits/prix Stripe **ne sont pas partagés entre test et live** — il faut les recréer manuellement.

### 2. ⚠️ Nom du produit incohérent
La doc (`STRIPE_INTEGRATION.md`) dit que le produit doit s'appeler **"Kanveo Pro"**, mais dans Stripe test on voit **"Prospeo beta"** et **"prospeo beta annuel"**. Le naming est incohérent.

### 3. ⚠️ Aucun fichier `.env` dans le workspace
Pas de fichier `.env`, `.env.local` ou `.env.production`. Les variables `VITE_SUPABASE_URL` et `VITE_SUPABASE_ANON_KEY` sont référencées via `import.meta.env` mais définies probablement uniquement dans **Vercel**.  
Aucune variable `VITE_STRIPE_*` n'est utilisée côté front — c'est normal car le front passe par les Edge Functions.

### 4. ✅ Pas de `price_id` dans le front — correct mais attention
`createCheckout()` dans `stripeService.js` envoie `billing_interval: 'monthly' | 'annual'` à l'Edge Function. C'est le backend (Edge Function) qui résout le bon Price ID. **Mais ces Edge Functions ne sont pas dans le repo** (pas de dossier `supabase/functions/`). Si le mapping `billing_interval` → `price_id` dans l'Edge Function utilise des `price_id` de test, en production ça ne marchera pas.

### 5. ❌ Edge Functions absentes du repo
Les 4 Edge Functions critiques ne sont nulle part dans le code source :
- `create-checkout` (création de session de paiement)
- `stripe-webhook` (réception des events Stripe)
- `create-portal-session` (portail de facturation)
- `create-connect-account` (comptes affiliés)

Elles sont déployées directement sur Supabase. Impossible d'auditer leur contenu, et impossible de savoir si elles utilisent des clés test (`sk_test_`) ou live (`sk_live_`).

### 6. ⚠️ Coupon ID hardcodé `GZD8vrdX` — CORRIGÉ ✅
Dans `adminService.js`, le coupon Stripe ID `GZD8vrdX` était hardcodé en fallback. Ce coupon n'existe probablement qu'en mode test. **Corrigé** : le fallback a été supprimé, le champ est maintenant obligatoire dans le formulaire admin.

### 7. ❌ Secrets Supabase (test vs live)
La feuille de route (`FEUILLE_DE_ROUTE.md`) indique configurer les secrets avec `sk_test_XXXXXXX`. Si l'étape 10 (passage en production) n'a jamais été exécutée, les Edge Functions utilisent **encore les clés test**. Même avec un front déployé en production, les paiements vont dans le bac à sable Stripe.

---

## Diagnostic : pourquoi les produits ne sont pas visibles

Stripe fonctionne avec **2 environnements étanches** :

- **Mode test** : clés `pk_test_` / `sk_test_`, produits de test, cartes `4242...`
- **Mode live** : clés `pk_live_` / `sk_live_`, vrais produits, vrais paiements

Les produits, coupons, codes promo et webhooks **doivent être recréés** dans chaque environnement. Les produits n'ont été créés qu'en test → le dashboard production est vide.

---

## Ce qui a été corrigé côté code (sans action manuelle)

| Correction | Fichier | Détail |
|---|---|---|
| Suppression du coupon ID hardcodé `GZD8vrdX` | `src/services/adminService.js` | Le fallback forçait un coupon de test. Maintenant `null` si non fourni |
| Champ coupon Stripe obligatoire dans le formulaire | `src/components/admin/CodeFormModal.jsx` | Indication visuelle que le champ est requis |

---

## Plan d'action — À faire manuellement (ce soir)

### Étape A — Recréer les produits en production

1. Dashboard Stripe → désactiver le toggle "Mode test" en haut à droite
2. **Produits → + Créer un produit** :
   - Nom : `Kanveo Pro` (ou `Prospeo` si c'est le nom final)
   - Prix 1 : `19,00 €` / mois / récurrent → noter le `price_id` mensuel
   - Prix 2 : `199,00 €` / an / récurrent → noter le `price_id` annuel
3. **Produits → Coupons → + Créer un coupon** :
   - Type : Montant fixe, 4,00 €, EUR
   - Durée : 12 mois
   - Nom : `Early Adopter -21%`
   - → noter le `coupon_id`

### Étape B — Recréer les codes promo influenceurs

Pour chaque influenceur :
1. Depuis le coupon → Codes promotionnels → + Créer un code
2. Code : `NOM_CODE` (majuscules)
3. Metadata : `influencer_name`, `influencer_email`, `commission_amount` (400), `commission_months` (12)

### Étape C — Recréer le webhook en production

1. Développeurs → Webhooks → + Ajouter un endpoint
2. URL : `https://aqhdhaxcxyguyicqwlmy.supabase.co/functions/v1/stripe-webhook`
3. Événements : `customer.subscription.created`, `customer.subscription.updated`, `customer.subscription.deleted`, `invoice.payment_succeeded`
4. → noter le `whsec_...` (Signing Secret)

### Étape D — Mettre à jour les secrets Supabase

```bash
supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXXXXX
supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXX
```

### Étape E — Mettre à jour les Edge Functions

Dans les Edge Functions déployées sur Supabase, remplacer les `price_id` de test par les nouveaux `price_id` live (mensuel + annuel).

### Étape F — Activer le Portail Client en mode live

Paramètres → Facturation → Portail client → activer annulation + changement carte + factures.

### Étape G — Tester

1. Faire un achat test avec une vraie carte (petit montant puis rembourser)
2. Vérifier que le webhook arrive bien
3. Vérifier que `user_profiles` est mis à jour dans Supabase

---

## Checklist finale

- [x] Produit créé en mode live (19€/mois + 199€/an)
  - price mensuel : `price_1T2g4b2NBssd1kDTKhIywxb9`
  - price annuel : `price_1T2g7p2NBssd1kDTmZGcm0cN`
- [x] Price IDs live notés
- [x] Coupon "Early Adopter" créé en mode live
  - coupon mensuel (-4€/mois × 12) : `0kmZNB4X`
  - coupon annuel (-50€) : `0kmZNB4X`
- [ ] Codes promo influenceurs à créer via le panel admin (tu t'en charges)
- [x] Webhook live configuré → endpoint `dynamic-dream`, whsec noté
- [ ] Portail client activé en mode live
- [ ] `STRIPE_SECRET_KEY` mis à jour avec `sk_live_` (à faire via dashboard ou CLI)
- [ ] `STRIPE_WEBHOOK_SECRET` = `whsec_dlTDQ1lkcJFhBYOIwtWVqtBJfnheKuGH` → à setter dans Supabase Dashboard → Settings → Edge Functions → Secrets
- [x] Edge Functions mises à jour avec les price IDs live (`create-checkout` v9 déployé)
- [ ] Coupon ID à saisir dans le panel admin pour chaque code influenceur
- [ ] Test de paiement réel effectué et vérifié
