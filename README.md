# Plateforme Pédagogique

Une plateforme web moderne pour l'éducation, construite avec React.js et Material-UI, permettant aux formateurs de partager des ressources et aux apprenants de suivre leur progression.

## 🚀 Fonctionnalités

### Page d'accueil
- Présentation de la plateforme
- Navigation vers les espaces Formateur et Apprenant
- Interface moderne et responsive

### Espace Formateur
- Téléversement de fichiers pédagogiques (PDF, DOC, PPT)
- Formulaire avec sujet et thème
- Liste des documents téléversés
- Gestion des ressources pédagogiques

### Espace Apprenant
- Visualisation des quiz disponibles
- Suivi de progression avec statistiques:
  - Nombre de quiz complétés
  - Score moyen
  - Pourcentage de progression
- Liste des quiz avec statut (complété/disponible)

### Composants partagés
- **Header**: Barre de navigation avec liens vers toutes les pages
- **Footer**: Pied de page avec copyright

## 🛠️ Technologies

- **React 19.2** - Bibliothèque JavaScript pour l'interface utilisateur
- **Vite 7** - Outil de build rapide et moderne
- **Material-UI (MUI) 6** - Framework de composants UI
- **React Router 7** - Routage côté client
- **Emotion** - Styling CSS-in-JS

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- npm ou yarn

## 🚀 Installation

1. Cloner le repository:
```bash
git clone https://github.com/noeljp/quiz.git
cd quiz
```

2. Installer les dépendances:
```bash
npm install
```

3. Lancer le serveur de développement:
```bash
npm run dev
```

4. Ouvrir votre navigateur à l'adresse: `http://localhost:5173`

## 📜 Scripts disponibles

- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production
- `npm run lint` - Vérifie le code avec ESLint

## 📁 Structure du projet

```
quiz/
├── src/
│   ├── components/       # Composants réutilisables
│   │   ├── Header.jsx    # Barre de navigation
│   │   └── Footer.jsx    # Pied de page
│   ├── pages/            # Pages de l'application
│   │   ├── HomePage.jsx           # Page d'accueil
│   │   ├── DashboardFormateur.jsx # Espace formateur
│   │   └── DashboardApprenant.jsx # Espace apprenant
│   ├── App.jsx           # Composant principal avec routing
│   └── main.jsx          # Point d'entrée de l'application
├── public/               # Fichiers statiques
└── package.json          # Dépendances et scripts
```

## 🎨 Captures d'écran

### Page d'accueil
![Page d'accueil](https://github.com/user-attachments/assets/9e8da21d-ebdc-481c-a52f-a2aeea9b212d)

### Espace Formateur
![Dashboard Formateur](https://github.com/user-attachments/assets/54ca0bba-a2d1-486b-9063-73a8da7fc8e5)

### Espace Apprenant
![Dashboard Apprenant](https://github.com/user-attachments/assets/c79cf214-310f-4e00-8e9f-3f7116a4b5ec)

## 🔮 Évolutions futures

- Authentification utilisateur
- Backend API avec base de données
- Création et édition de quiz interactifs
- Système de notation automatique
- Téléchargement réel de fichiers
- Tableau de bord administrateur
- Notifications en temps réel
- Système de messagerie

## 📝 Notes de développement

Cette version est un prototype fonctionnel qui utilise des données mockées (factices) pour démontrer les fonctionnalités de base. Les données sont stockées localement dans les composants React et ne sont pas persistées.

## 📄 Licence

Tous droits réservés © 2025 Plateforme Pédagogique
