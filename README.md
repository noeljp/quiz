# Plateforme Pédagogique

Une plateforme web moderne pour l'éducation, construite avec React.js et Django, permettant aux formateurs de partager des ressources et aux apprenants de suivre leur progression.

## 🚀 Fonctionnalités

### Authentification et Sécurité
- **Système d'authentification JWT** avec tokens d'accès et de rafraîchissement
- **Routes protégées** basées sur le rôle utilisateur (formateur/apprenant)
- **Gestion automatique des sessions** avec rafraîchissement de tokens
- **Redirections intelligentes** après connexion selon le type d'utilisateur

### Page d'accueil
- Présentation de la plateforme
- Navigation vers les espaces Formateur et Apprenant
- Interface moderne et responsive

### Espace Formateur (Protégé)
- Téléversement de fichiers pédagogiques (PDF, DOC, PPT) via API
- Formulaire avec titre, sujet et thème
- Liste des documents téléversés depuis la base de données
- Gestion et suppression des ressources pédagogiques
- Intégration complète avec le backend Django

### Espace Apprenant (Protégé)
- Visualisation des quiz disponibles depuis l'API
- Suivi de progression en temps réel avec statistiques:
  - Nombre de quiz complétés
  - Score moyen
  - Pourcentage de progression
- Liste des quiz avec statut (complété/en cours)
- Affichage des informations utilisateur via `/api/users/me/`

### Composants partagés
- **Header**: Barre de navigation dynamique avec gestion de la déconnexion
- **Footer**: Pied de page avec copyright
- **ProtectedRoute**: Composant de protection des routes sensibles

## 🛠️ Technologies

### Frontend
- **React 19.2** - Bibliothèque JavaScript pour l'interface utilisateur
- **Vite 7** - Outil de build rapide et moderne
- **Material-UI (MUI) 7** - Framework de composants UI
- **React Router 7** - Routage côté client
- **Axios** - Client HTTP pour les appels API
- **Emotion** - Styling CSS-in-JS
- **Vitest** - Framework de tests unitaires
- **Testing Library** - Outils de test React

### Backend
- **Django 6.0** - Framework web Python
- **Django REST Framework** - API REST
- **JWT Authentication** - djangorestframework-simplejwt
- **SQLite** - Base de données (dev)

## 📋 Prérequis

- Node.js (version 18 ou supérieure)
- Python 3.10 ou supérieur
- npm ou yarn

## 🚀 Installation et Démarrage

### 1. Cloner le repository
```bash
git clone https://github.com/noeljp/quiz.git
cd quiz
```

### 2. Configuration du Backend Django

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate
python manage.py createsuperuser  # Créer un compte admin
python manage.py runserver
```

Le backend sera accessible sur `http://localhost:8000`

### 3. Configuration du Frontend React

Dans un nouveau terminal:

```bash
# Depuis la racine du projet
npm install

# Créer le fichier .env (déjà configuré)
# VITE_API_BASE_URL=http://localhost:8000/api

npm run dev
```

Le frontend sera accessible sur `http://localhost:5173`

## 📜 Scripts disponibles

### Frontend
- `npm run dev` - Démarre le serveur de développement
- `npm run build` - Compile l'application pour la production
- `npm run preview` - Prévisualise la version de production
- `npm run lint` - Vérifie le code avec ESLint
- `npm test` - Lance les tests avec Vitest
- `npm run test:ui` - Lance les tests avec interface UI
- `npm run test:coverage` - Génère un rapport de couverture

### Backend
- `python manage.py runserver` - Démarre le serveur Django
- `python manage.py test` - Lance les tests Django
- `python manage.py migrate` - Applique les migrations
- `./test_api.sh` - Teste les endpoints API

## 📁 Structure du projet

```
quiz/
├── backend/                    # Backend Django
│   ├── config/                 # Configuration Django
│   │   ├── settings.py         # Paramètres (CORS, JWT, etc.)
│   │   └── urls.py             # Routing principal
│   ├── pedagogical/            # Application principale
│   │   ├── models.py           # Modèles de données
│   │   ├── serializers.py      # Sérialiseurs DRF
│   │   ├── views.py            # Vues API
│   │   └── urls.py             # Routes API
│   ├── media/                  # Fichiers téléversés
│   └── manage.py
│
├── src/                        # Frontend React
│   ├── api/                    # Services API
│   │   ├── config.js           # Configuration Axios + intercepteurs JWT
│   │   ├── auth.js             # Service d'authentification
│   │   ├── users.js            # Service utilisateurs
│   │   ├── files.js            # Service fichiers
│   │   └── progress.js         # Service progression
│   ├── components/             # Composants réutilisables
│   │   ├── Header.jsx          # Navigation avec auth
│   │   ├── Footer.jsx          # Pied de page
│   │   └── ProtectedRoute.jsx  # Protection des routes
│   ├── contexts/               # Contextes React
│   │   └── AuthContext.jsx     # Contexte d'authentification
│   ├── pages/                  # Pages de l'application
│   │   ├── HomePage.jsx        # Page d'accueil
│   │   ├── LoginPage.jsx       # Page de connexion
│   │   ├── RegisterPage.jsx    # Page d'inscription
│   │   ├── DashboardFormateur.jsx # Espace formateur
│   │   └── DashboardApprenant.jsx # Espace apprenant
│   ├── test/                   # Configuration des tests
│   │   └── setup.js
│   ├── App.jsx                 # Composant principal avec routing
│   └── main.jsx                # Point d'entrée
│
├── .env                        # Variables d'environnement (ignoré par git)
├── vitest.config.js            # Configuration Vitest
└── package.json                # Dépendances frontend
```

## 🔐 Authentification et Sécurité

La plateforme utilise JWT (JSON Web Tokens) pour l'authentification:

1. **Inscription/Connexion**: L'utilisateur s'inscrit ou se connecte via `/api/auth/register/` ou `/api/auth/login/`
2. **Tokens JWT**: Le backend retourne deux tokens:
   - `access`: Token d'accès (courte durée)
   - `refresh`: Token de rafraîchissement (longue durée)
3. **Stockage**: Les tokens sont stockés dans le localStorage
4. **Intercepteurs**: Axios ajoute automatiquement le token à chaque requête
5. **Rafraîchissement**: Le token d'accès est automatiquement rafraîchi via `/api/auth/token/refresh/`
6. **Routes protégées**: Le composant `ProtectedRoute` vérifie l'authentification et le rôle utilisateur

### Scénarios d'autorisation testés:
- ✅ Connexion réussie avec redirection selon le rôle
- ✅ Échec de connexion avec message d'erreur
- ✅ Session expirée avec rafraîchissement automatique
- ✅ Déconnexion et nettoyage des tokens
- ✅ Accès refusé aux routes non autorisées

## 🧪 Tests

La plateforme inclut des tests unitaires complets avec Vitest et Testing Library:

### Exécuter les tests
```bash
npm test              # Mode watch
npm test -- --run     # Exécution unique
npm run test:ui       # Interface graphique
npm run test:coverage # Rapport de couverture
```

### Couverture actuelle
- **14 tests** passants dans 3 suites
- Services API: `authService` (5 tests)
- Composants: `ProtectedRoute` (4 tests)
- Pages: `LoginPage` (5 tests)

Les tests couvrent:
- ✅ Gestion de l'authentification
- ✅ Protection des routes par rôle
- ✅ Flux de connexion/inscription
- ✅ Gestion des erreurs
- ✅ États de chargement

## 🔄 Intégration Frontend-Backend

### Configuration API
Le fichier `src/api/config.js` configure Axios avec:
- URL de base: `http://localhost:8000/api`
- Intercepteurs de requêtes: Ajout automatique du token JWT
- Intercepteurs de réponses: Gestion du rafraîchissement de tokens

### Endpoints utilisés
- `POST /api/auth/register/` - Inscription
- `POST /api/auth/login/` - Connexion
- `POST /api/auth/token/refresh/` - Rafraîchissement du token
- `GET /api/users/me/` - Informations utilisateur connecté
- `GET /api/files/` - Liste des fichiers
- `POST /api/files/` - Téléversement de fichiers
- `DELETE /api/files/{id}/` - Suppression de fichiers
- `GET /api/progress/` - Progression de l'utilisateur
- `GET /api/progress/stats/` - Statistiques de progression

## 🎨 Captures d'écran

### Page d'accueil
![Page d'accueil](https://github.com/user-attachments/assets/9e8da21d-ebdc-481c-a52f-a2aeea9b212d)

### Espace Formateur
![Dashboard Formateur](https://github.com/user-attachments/assets/54ca0bba-a2d1-486b-9063-73a8da7fc8e5)

### Espace Apprenant
![Dashboard Apprenant](https://github.com/user-attachments/assets/c79cf214-310f-4e00-8e9f-3f7116a4b5ec)

## 🔮 Évolutions futures

- ✅ ~~Authentification utilisateur~~ - **Implémenté avec JWT**
- ✅ ~~Backend API avec base de données~~ - **Implémenté avec Django REST Framework**
- ✅ ~~Intégration Frontend-Backend~~ - **Implémenté avec Axios et intercepteurs**
- ✅ ~~Routes protégées~~ - **Implémenté avec ProtectedRoute**
- ✅ ~~Tests unitaires~~ - **Implémenté avec Vitest et Testing Library**
- Création et édition de quiz interactifs
- Système de notation automatique
- ✅ ~~Téléchargement réel de fichiers~~ - **Implémenté dans l'API backend**
- Tableau de bord administrateur
- Notifications en temps réel
- Système de messagerie
- Tests end-to-end avec Playwright ou Cypress

## 🗄️ Backend Django

Le projet inclut un backend Django complet avec:

- **Authentification JWT** - Inscription, connexion, gestion de session, rafraîchissement automatique
- **API REST** - Endpoints pour utilisateurs, fichiers et progression
- **Upload de fichiers** - Téléversement de documents pédagogiques
- **Suivi de progression** - Système complet de tracking des quiz
- **Base de données SQLite** - Persistance des données (dev)
- **Panel Admin Django** - Interface d'administration
- **Tests API** - Script de test des endpoints

Pour plus de détails, voir:
- [Backend README](backend/README.md) - Documentation complète du backend
- [INTEGRATION.md](INTEGRATION.md) - Guide d'intégration Frontend-Backend
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture système complète

## 🔮 Évolutions futures

- ✅ ~~Authentification utilisateur~~ - **Implémenté avec JWT**
- ✅ ~~Backend API avec base de données~~ - **Implémenté avec Django REST Framework**
- ✅ ~~Intégration Frontend-Backend~~ - **Implémenté avec Axios et intercepteurs**
- ✅ ~~Routes protégées~~ - **Implémenté avec ProtectedRoute**
- ✅ ~~Tests unitaires~~ - **Implémenté avec Vitest et Testing Library**
- Création et édition de quiz interactifs
- Système de notation automatique
- ✅ ~~Téléchargement réel de fichiers~~ - **Implémenté dans l'API backend**
- Tableau de bord administrateur
- Notifications en temps réel
- Système de messagerie
- Tests end-to-end avec Playwright ou Cypress

## 📝 Notes de développement

**Version actuelle:**
- ✅ Frontend React avec intégration API complète
- ✅ Backend Django REST API complet et opérationnel
- ✅ Authentification JWT fonctionnelle avec rafraîchissement automatique
- ✅ Routes protégées par rôle utilisateur
- ✅ Tests unitaires pour les composants critiques
- ✅ Gestion complète des fichiers et de la progression

**Architecture:**
- Frontend et backend communiquent via API REST
- CORS configuré pour le développement
- JWT pour l'authentification sécurisée
- Séparation claire des responsabilités

## 📄 Licence

Tous droits réservés © 2025 Plateforme Pédagogique
