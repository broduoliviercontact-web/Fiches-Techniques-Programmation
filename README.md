# Fiches techniques Programmation

Site pour remplir la fiche technique de programmation de chaque événement, à plusieurs :
horaires (avec frise de la journée), rider, locations backline / lumière / machinerie / autre
(loueur, devis, facture, pièces jointes), 4 contacts et commentaires.
Export Word dans la mise en page d'origine (`public/fiche-template.docx`).

## Lire un devis

Dans une location, quand le devis joint est un PDF, le bouton **Lire le devis** le lit dans le navigateur
(`public/devis-reader.js` + pdf.js dans `public/vendor/pdfjs`, rien n'est envoyé ailleurs) et propose de remplir
ce qui est vide : loueur, n° et montant du devis, statut « Reçu », et les lignes de matériel absentes de la liste
(le transport est ignoré). **Annuler** remet la fiche comme avant. Ne marche pas sur les scans ni les photos.
`devis-reader.js` est une copie de celui du projet *suivi-devis* : une amélioration se recopie dans les deux.

## Structure

- `public/index.html` : la page (aucune étape de build)
- `public/fiche-template.docx` : la fiche Word d'origine, avec des repères `{{…}}` remplis à l'export
- `api/login.js` : connexion par mot de passe (cookie HttpOnly, 90 jours)
- `api/events/` : lecture / création / modification / suppression des fiches (Upstash Redis)
- `api/upload.js` : envoi des PDF et images vers un store Vercel Blob **privé** (4,4 Mo max par fichier)
- `api/file.js` : lecture d'une pièce jointe, réservée aux personnes connectées

## Configuration Vercel

1. **Storage → Upstash for Redis** (Marketplace) : créer une base et la connecter au projet.
   Les variables `KV_REST_API_URL` / `KV_REST_API_TOKEN` (ou `UPSTASH_REDIS_REST_*`) sont ajoutées automatiquement.
2. **Storage → Blob** : créer un store en accès **Private** et le connecter au projet (`BLOB_STORE_ID`, authentification OIDC automatique sur Vercel).
3. **Settings → Environment Variables** : ajouter `SITE_PASSWORD` (le mot de passe de l'équipe).
4. Redéployer.

Les fiches se mettent à jour toutes les 8 secondes chez les autres personnes connectées.
