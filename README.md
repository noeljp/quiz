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

- ✅ ~~Authentification utilisateur~~ - **Implémenté dans le backend Django**
- ✅ ~~Backend API avec base de données~~ - **Implémenté avec Django REST Framework**
- Création et édition de quiz interactifs
- Système de notation automatique
- ✅ ~~Téléchargement réel de fichiers~~ - **Implémenté dans l'API backend**
- Tableau de bord administrateur
- Notifications en temps réel
- Système de messagerie

## 🗄️ Backend Django

Le projet inclut maintenant un backend Django complet avec:

- **Authentification JWT** - Inscription, connexion, gestion de session
- **API REST** - Endpoints pour utilisateurs, fichiers et progression
- **Upload de fichiers** - Téléversement de documents pédagogiques
- **Suivi de progression** - Système complet de tracking des quiz
- **Base de données SQLite** - Persistance des données
- **Panel Admin Django** - Interface d'administration

### Démarrage rapide du backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

Pour plus de détails, voir:
- [Backend README](backend/README.md) - Documentation complète du backend
- [INTEGRATION.md](INTEGRATION.md) - Guide d'intégration Frontend-Backend

## 📝 Notes de développement

**Version actuelle:**
- Frontend React fonctionnel avec données mockées pour la démonstration
- Backend Django REST API complet et opérationnel
- Les deux peuvent fonctionner indépendamment ou ensemble
- L'intégration frontend-backend est documentée dans [INTEGRATION.md](INTEGRATION.md)

**Prochaines étapes:**
- Connecter le frontend React existant avec le backend Django
- Remplacer les données mockées par les vraies API calls
- Implémenter l'authentification dans le frontend

## 📄 Licence

Tous droits réservés © 2025 Plateforme Pédagogique
