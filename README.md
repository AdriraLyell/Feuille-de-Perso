# Seigneurs des Mystères - Gestionnaire de Fiche

Application React (Vite) pour gérer les fiches de personnage du JDR **Seigneurs des Mystères**.

## 🚀 Fonctionnalités
- Gestion complète de fiche (Attributs, Compétences, Inventaire).
- Application **Admin** séparée pour configurer le système (`rules.js`).
- Mode "Hors-Ligne" (PWA / SingleFile).
- Système de sauvegarde local et export JSON.

## 🛠️ Installation & Développement

```bash
# Installation
npm install

# Lancer le mode développement (Accès à Fiche + Admin)
npm run dev
```

## 📦 Build & Déploiement

### Déploiement Automatique (GitHub Pages)
Ce projet est configuré pour se déployer automatiquement via **GitHub Actions**.
1. Poussez le code sur la branche `main`.
2. Allez dans **Settings > Pages** sur GitHub.
3. Source : **GitHub Actions**.
4. Le workflow (`.github/workflows/deploy.yml`) construira et déploiera le site.

### Build Manuel
Pour générer les fichiers HTML autonomes (distribuables par clé USB/Discord) :

```bash
npm run build
```

Vous obtiendrez dans le dossier `dist/` :
- `index.html` : La fiche personnage.
- `admin.html` : L'interface d'administration (MJ).

Note : L'application Admin chargera automatiquement une configuration par défaut si aucun fichier `rules.js` externe n'est détecté.
