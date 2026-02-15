# Feuille de route Stripe — Actions manuelles

> Tout ce qui suit te concerne TOI. Ce sont les actions que tu fais manuellement sur le dashboard Stripe et Supabase. Aucun code à écrire. Suis les étapes dans l'ordre.

---

## Rappel du modèle économique

### Abonnement standard

| Période | Prix utilisateur | Frais Stripe (~1.4% + 0.25€) | Net reçu |
|---------|-----------------|------------------------------|----------|
| Mois 1 à 12 (Early Adopter) | 15,00 € | ~0,46 € | ~14,54 € |
| Mois 13+ | 19,00 € | ~0,52 € | ~18,48 € |

### Avec code influenceur

| Période | Prix utilisateur | Frais Stripe | Commission influenceur | Net reçu |
|---------|-----------------|-------------|----------------------|----------|
| Mois 1 à 12 | 15,00 € | ~0,46 € | 4,00 € | **~10,54 €** |
| Mois 13+ | 19,00 € | ~0,52 € | 0,00 € | ~18,48 € |

L'influenceur touche **4 €/mois pendant 12 mois max** par utilisateur ayant utilisé son code.
Après 12 mois : prix normal 19 €, plus aucune commission.
**PAS d'essai gratuit** — paiement immédiat à l'inscription.

---

## Étape 1 — Créer ton compte Stripe

1. Va sur **https://dashboard.stripe.com** dans ton navigateur
2. Clique **"S'inscrire"** (ou connecte-toi si tu as déjà un compte)
3. Remplis tes infos (email, mot de passe)
4. Une fois connecté, tu arrives sur le **Dashboard Stripe**
5. **IMPORTANT** : en haut à droite, vérifie que le toggle **"Mode test"** est activé (il doit être orange). On teste d'abord avant de passer en production

---

## Étape 2 — Récupérer tes clés API

1. Dans le menu de gauche, clique sur **"Développeurs"** (ou "Developers")
2. Clique sur l'onglet **"Clés API"** (ou "API Keys")
3. Tu vois 2 clés :
   - **Clé publique** : commence par `pk_test_...` → tu en auras besoin pour le frontend (mais pas tout de suite)
   - **Clé secrète** : commence par `sk_test_...` → clique sur "Révéler la clé" pour la voir
4. **Note ces 2 clés quelque part** (fichier texte, gestionnaire de mots de passe). Tu en auras besoin plus tard pour Supabase

> ⚠️ Ne partage JAMAIS la clé secrète (`sk_test_...`). Elle donne accès total à ton compte Stripe.

---

## Étape 3 — Créer le produit "Kanveo Pro"

1. Dans le menu de gauche, clique sur **"Produits"** (ou "Products")
2. Clique sur **"+ Ajouter un produit"** (bouton en haut à droite)
3. Remplis le formulaire :
   - **Nom** : `Kanveo Pro`
   - **Description** (optionnel) : `Abonnement Kanveo — Prospection commerciale B2B`
   - **Image** (optionnel) : tu peux ajouter le logo Kanveo
4. Dans la section **"Informations tarifaires"** :
   - **Modèle de tarification** : `Standard`
   - **Prix** : `19,00`
   - **Devise** : `EUR`
   - **Facturation** : sélectionne `Récurrent`
   - **Période** : `Mensuel`
5. Clique **"Enregistrer le produit"** (ou "Save product")
6. Tu es redirigé vers la fiche du produit
7. Dans la section "Tarification", clique sur le prix que tu viens de créer
8. **Note le Price ID** — il ressemble à `price_1Xxx...` — tu en auras besoin pour le code

---

## Étape 4 — Créer le coupon de réduction Early Adopter

Le coupon = la réduction automatique. Il retire 4 € du prix (19 → 15) pendant 12 mois.

1. Dans le menu de gauche, clique sur **"Produits"**
2. Clique sur l'onglet **"Coupons"** (en haut, à côté de "Tous les produits")
3. Clique **"+ Créer un coupon"**
4. Remplis :
   - **Type de réduction** : `Montant fixe`
   - **Montant** : `4,00`
   - **Devise** : `EUR`
   - **Durée** : `Multiple mois` (ou "Repeating")
   - **Nombre de mois** : `12`
   - **Nom** : `Early Adopter -21%` (ce nom apparaît sur la facture du client)
   - **ID** (optionnel) : laisse vide, Stripe en génère un automatiquement
5. Clique **"Créer le coupon"**
6. **Note le Coupon ID** : il commence par quelque chose comme `coupon_Xxx...` ou un ID auto-généré

---

## Étape 5 — Créer un code promo pour un influenceur

Le code promo = le texte que l'influenceur partage (ex: `THOMAS30`). Il est lié au coupon.

1. Depuis la page du coupon que tu viens de créer (tu y es déjà normalement)
2. Dans la section **"Codes promotionnels"** (ou "Promotion codes"), clique **"+ Créer un code"**
3. Remplis :
   - **Code** : le texte exact que l'influenceur va partager → ex: `THOMAS30` (tout en majuscules pour éviter les erreurs)
   - **Nombre max d'utilisations** : laisse vide (illimité) ou mets un nombre si tu veux limiter
   - **Date d'expiration** : optionnel — si tu veux que le code expire après une certaine date
4. **IMPORTANT — Ajouter les metadata** : en bas du formulaire, il y a une section "Metadata" (ou tu peux la trouver après création en éditant le code promo)
   - Clique **"+ Ajouter un metadata"** 4 fois et remplis :

   | Clé | Valeur |
   |-----|--------|
   | `influencer_name` | `Thomas` ← le prénom/nom de l'influenceur |
   | `influencer_email` | `thomas@example.com` ← son email de contact |
   | `commission_amount` | `400` ← commission en centimes (4 €) |
   | `commission_months` | `12` ← durée de la commission en mois |

5. Clique **"Créer"**

> **Pour chaque nouvel influenceur** : répète cette étape 5 avec un code différent (ex: `JULIE20`, `MARC50`...). Tous les codes sont liés au même coupon créé à l'étape 4.

---

## Étape 6 — Configurer le Webhook

Le webhook = Stripe envoie une notification à ton serveur chaque fois qu'un paiement arrive ou qu'un abonnement change. C'est automatique, tu configures juste l'URL.

1. Dans le menu de gauche, clique sur **"Développeurs"** (ou "Developers")
2. Clique sur l'onglet **"Webhooks"**
3. Clique **"+ Ajouter un endpoint"** (ou "Add endpoint")
4. Remplis :
   - **URL de l'endpoint** : `https://aqhdhaxcxyguyicqwlmy.supabase.co/functions/v1/stripe-webhook`
     (remplace `aqhdhaxcxyguyicqwlmy` par ton vrai Project Ref Supabase si différent)
   - **Événements à écouter** : clique sur "Sélectionner des événements" et coche ces 4 :
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
5. Clique **"Ajouter l'endpoint"**
6. Tu es redirigé vers la page de l'endpoint
7. Tu vois un **"Signing Secret"** — clique pour le révéler, il commence par `whsec_...`
8. **Note ce Signing Secret** — c'est le `STRIPE_WEBHOOK_SECRET` dont tu auras besoin pour Supabase

---

## Étape 7 — Configurer le Portail Client (Billing Portal)

Le portail client = une page Stripe où tes clients peuvent gérer eux-mêmes leur abonnement (annuler, changer de carte, voir les factures).

1. Dans le menu de gauche, clique sur **"Paramètres"** (icône engrenage en bas)
2. Dans la section "Facturation" (ou "Billing"), clique **"Portail client"** (ou "Customer portal")
3. Configure les options :
   - **Annulation** : active → les clients peuvent annuler eux-mêmes
   - **Changement de moyen de paiement** : active
   - **Historique des factures** : active
   - **Changement de plan** : laisse désactivé (tu n'as qu'un seul plan)
4. Clique **"Enregistrer"**

---

## Étape 8 — Configurer les secrets dans Supabase

1. Ouvre un terminal dans ton projet
2. Si pas encore fait, installe et lie le CLI Supabase :
   - `npm install -g supabase`
   - `supabase login`
   - `supabase link --project-ref aqhdhaxcxyguyicqwlmy`
3. Configure les secrets :
   - `supabase secrets set STRIPE_SECRET_KEY=sk_test_XXXXXXX` ← ta clé secrète de l'étape 2
   - `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXX` ← le signing secret de l'étape 6

---

## Étape 9 — Tester le flux complet

1. Va sur ton app → page `/pricing`
2. Clique **"S'abonner maintenant"**
3. Tu es redirigé vers la page de paiement Stripe
4. Utilise la **carte de test** : `4242 4242 4242 4242`
   - Date d'expiration : n'importe quelle date future (ex: `12/30`)
   - CVC : n'importe quel chiffre (ex: `123`)
   - Nom : ce que tu veux
5. Pour tester un code promo : tape le code que tu as créé (ex: `THOMAS30`) dans le champ "Code promo" → le prix doit passer de 19 € à 15 €
6. Clique **"S'abonner"**
7. Tu dois être redirigé vers `/settings` avec un message de confirmation
8. Vérifie dans **Supabase → Table Editor → user_profiles** que les colonnes `subscription_status`, `subscription_id`, etc. sont remplies
9. Si tu as utilisé un code promo, vérifie dans **Supabase → Table Editor → referrals** qu'une ligne a été créée

---

## Étape 10 — Passer en production (quand tout est testé)

1. Dans le dashboard Stripe, désactive le **"Mode test"** (toggle en haut à droite)
2. Va dans **Développeurs → Clés API** → note les nouvelles clés (`pk_live_...` et `sk_live_...`)
3. Recrée ton produit, coupon et codes promo en mode live (ils ne sont pas partagés entre test et live)
4. Recrée le webhook avec la même URL mais en mode live → note le nouveau `whsec_...`
5. Mets à jour les secrets Supabase :
   - `supabase secrets set STRIPE_SECRET_KEY=sk_live_XXXXXXX`
   - `supabase secrets set STRIPE_WEBHOOK_SECRET=whsec_XXXXXXX`

---

## Résumé — Ce que tu dois noter

| Élément | Où le trouver | Format | Où l'utiliser |
|---------|--------------|--------|--------------|
| Clé publique | Développeurs → Clés API | `pk_test_...` | Frontend (variable d'env) |
| Clé secrète | Développeurs → Clés API | `sk_test_...` | Supabase secret |
| Price ID | Produits → Kanveo Pro → Prix | `price_1Xxx...` | Frontend (appel checkout) |
| Coupon ID | Produits → Coupons | auto-généré | Juste pour tes records |
| Webhook Secret | Développeurs → Webhooks → ton endpoint | `whsec_...` | Supabase secret |

---

## Ajouter un nouvel influenceur (plus tard)

Quand tu veux ajouter un nouvel influenceur :

1. Va dans **Produits → Coupons** → clique sur ton coupon "Early Adopter -21%"
2. Section "Codes promotionnels" → **"+ Créer un code"**
3. Remplis le code (ex: `JULIE20`) + les 4 metadata (`influencer_name`, `influencer_email`, `commission_amount`, `commission_months`)
4. Enregistre
5. Donne le code à l'influenceur — c'est tout, le tracking est automatique

---

## Payer les influenceurs (chaque mois)

1. Va dans **Supabase → SQL Editor**
2. Exécute : `SELECT * FROM referral_summary WHERE active_users > 0;`
3. Tu vois combien tu dois à chaque influenceur ce mois-ci
4. Paie par virement bancaire ou PayPal
5. Pas besoin de mettre à jour la base : le compteur `months_paid` s'incrémente automatiquement à chaque paiement de l'utilisateur

---

## Checklist — Actions manuelles

- [ ] Compte Stripe créé
- [ ] Clés API notées (`pk_test_...` + `sk_test_...`)
- [ ] Produit "Kanveo Pro" créé à 19 €/mois → Price ID noté
- [ ] Coupon "Early Adopter -21%" créé (4 € off × 12 mois)
- [ ] Au moins 1 code promo créé avec les 4 metadata influenceur
- [ ] Webhook configuré (4 événements) → Signing Secret noté
- [ ] Portail client activé (annulation + changement carte + factures)
- [ ] Secrets Supabase configurés via CLI (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`)
- [ ] Test complet en mode test (carte `4242 4242 4242 4242`)
- [ ] Passage en production (quand tout marche)
