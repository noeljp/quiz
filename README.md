# Plateforme Pédagogique

Une plateforme web moderne pour l'éducation, construite avec React.js et Django, permettant aux formateurs de partager des ressources et aux apprenants de suivre leur progression avec un système d'évaluation intelligente basé sur l'IA.

## 🚀 Fonctionnalités

### 🆕 Nouvelles Fonctionnalités de Gestion des Quiz (Janvier 2026)

#### Pour les Formateurs
- **Modification de quiz** : Éditez vos quiz existants (questions, titre, description)
- **Génération IA intégrée** : Créez des quiz automatiquement à partir de documents (PDF, DOCX, TXT)
  - Workflow en 3 étapes : Upload → Génération → Révision
  - Support OpenAI GPT-3.5-turbo
  - Édition des questions générées avant sauvegarde
- **Gestion des assignations** : Assignez ou réassignez des apprenants à tout moment
- **Tableau de bord statistiques** : Visualisez les performances en temps réel
  - Taux de complétion par quiz
  - Score moyen de la classe
  - Détails par apprenant (statut, score, progression)
  - Indicateurs visuels colorés selon la performance

Pour plus de détails, consultez le [Guide des nouvelles fonctionnalités](GUIDE_NOUVELLES_FONCTIONNALITES.md).

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
- **Création et modification de quiz** - Interface unifiée pour gérer les quiz
- **Génération de quiz avec IA** - Extraction de texte et génération automatique via OpenAI
- **Assignation d'apprenants** - Gestion dynamique des assignations de quiz
- **Tableau de bord des statistiques** - Suivi des performances par quiz et par apprenant
- Intégration complète avec le backend Django

### Espace Apprenant (Protégé)
- Visualisation des quiz disponibles depuis l'API
- Suivi de progression en temps réel avec statistiques:
  - Nombre de quiz complétés
  - Score moyen
  - Pourcentage de progression
- Liste des quiz avec statut (complété/en cours)
- Affichage des informations utilisateur via `/api/users/me/`
- **🧠 Évaluation diagnostique intelligente** - Système adaptatif pour identifier le style d'apprentissage
- **📊 Profil cognitif personnalisé** - Forces, faiblesses et recommandations générées par IA

### 🧠 Nouveau : Système d'Évaluation Intelligente

Le système d'évaluation intelligente est conforme aux méthodologies décrites dans `methode_de_suivi.md` :

#### Pour les Apprenants
- **Évaluation diagnostique** : 15 questions pour identifier votre style d'apprentissage
- **Aide progressive** : Système d'indices disponibles sans pénalité
- **Profil cognitif** : Découvrez vos forces et votre style d'apprentissage unique
- **Recommandations personnalisées** : Conseils pédagogiques adaptés à votre profil
- **Feedback bienveillant** : Valorisation du raisonnement, pas seulement du résultat

#### Fonctionnalités Clés
- ✅ Collecte de données détaillées (temps de réponse, tentatives, aide utilisée)
- ✅ Analyse cognitive avec OpenAI GPT-3.5-turbo
- ✅ Identification de forces (minimum 2) et fragilités (maximum 3)
- ✅ Génération de style d'apprentissage (visuel/logique/guidé)
- ✅ Hypothèses pédagogiques (JAMAIS de diagnostic médical)
- ✅ Profil évolutif qui s'améliore avec chaque évaluation
- ✅ Analyse de repli basée sur des règles si OpenAI indisponible

#### Principes Pédagogiques
- 🎯 L'évaluation est un outil d'observation, pas de notation
- 💪 Chaque élève possède au moins une force dominante
- 🔍 Les difficultés sont des signaux cognitifs, jamais des fautes
- 📈 Focus sur la progression et le raisonnement
- ❌ Pas de notation punitive

Pour plus de détails, consultez :
- [Guide Utilisateur](GUIDE_EVALUATION.md) - Guide complet pour apprenants et formateurs
- [Documentation API](backend/API_EVALUATION.md) - Endpoints et utilisation technique

### Composants partagés
- **Header**: Barre de navigation dynamique avec gestion de la déconnexion
- **Footer**: Pied de page avec copyright
- **ProtectedRoute**: Composant de protection des routes sensibles

## 📚 Guide Formateur : Créer des Quiz à partir de Documents

### Vue d'ensemble

En tant que formateur, vous pouvez créer des quiz interactifs automatiquement à partir de vos documents pédagogiques (PDF, DOCX, TXT). La plateforme utilise l'intelligence artificielle (OpenAI) pour générer des questions pertinentes basées sur le contenu de vos documents.

### Prérequis

1. **Compte formateur** : Vous devez être authentifié avec un compte de type "formateur"
2. **Clé API OpenAI** : Le backend doit être configuré avec une clé API OpenAI valide
   ```bash
   # Dans backend/.env
   OPENAI_API_KEY=votre-clé-api-openai
   ```

### Processus de création de quiz

#### Étape 1 : Téléverser un document

Utilisez l'API pour téléverser votre document et en extraire le texte :

```bash
# Connexion en tant que formateur
curl -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "formateur1",
    "password": "votre_mot_de_passe"
  }'

# Récupérer le token d'accès de la réponse
TOKEN="votre_token_access"

# Téléverser et extraire le texte d'un document
curl -X POST http://localhost:8000/api/documents/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/chemin/vers/votre/document.pdf"
```

**Formats supportés :**
- PDF (`.pdf`)
- Microsoft Word (`.docx`)
- Texte brut (`.txt`)

**Limitations :**
- Taille maximale : 10 MB
- Seuls les formateurs peuvent téléverser des documents

**Réponse attendue :**
```json
{
  "text": "Contenu extrait du document...",
  "filename": "document.pdf",
  "size": 12345,
  "message": "Texte extrait avec succès"
}
```

#### Étape 2 : Générer le quiz

Une fois le texte extrait, utilisez-le pour générer des questions de quiz :

```bash
# Générer 5 questions à partir du texte extrait
curl -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Votre texte extrait ici...",
    "num_questions": 5
  }'
```

**Paramètres :**
- `text` (requis) : Le texte à partir duquel générer les questions
- `num_questions` (optionnel) : Nombre de questions à générer (entre 1 et 20, défaut: 5)

**Réponse attendue :**
```json
{
  "quiz": {
    "questions": [
      {
        "question": "Quelle est la définition de...?",
        "options": {
          "A": "Première option",
          "B": "Deuxième option",
          "C": "Troisième option",
          "D": "Quatrième option"
        },
        "correct_answer": "B",
        "explanation": "Explication de la bonne réponse"
      }
    ]
  },
  "message": "Quiz généré avec succès"
}
```

#### Étape 3 : Workflow complet (exemple avec script bash)

Voici un exemple de script complet pour automatiser le processus :

```bash
#!/bin/bash

# 1. Connexion
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:8000/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{
    "username": "formateur1",
    "password": "votre_mot_de_passe"
  }')

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.tokens.access')

# 2. Upload du document et extraction du texte
UPLOAD_RESPONSE=$(curl -s -X POST http://localhost:8000/api/documents/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@cours_python.pdf")

EXTRACTED_TEXT=$(echo $UPLOAD_RESPONSE | jq -r '.text')

# 3. Génération du quiz
QUIZ_RESPONSE=$(curl -s -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"text\": \"$EXTRACTED_TEXT\",
    \"num_questions\": 5
  }")

echo $QUIZ_RESPONSE | jq '.'
```

#### Étape 4 : Exemple avec Python

```python
import requests

# Configuration
BASE_URL = "http://localhost:8000/api"
USERNAME = "formateur1"
PASSWORD = "votre_mot_de_passe"

# 1. Connexion
response = requests.post(f"{BASE_URL}/auth/login/", json={
    "username": USERNAME,
    "password": PASSWORD
})
token = response.json()["tokens"]["access"]
headers = {"Authorization": f"Bearer {token}"}

# 2. Upload et extraction
with open("cours.pdf", "rb") as f:
    response = requests.post(
        f"{BASE_URL}/documents/upload/",
        headers=headers,
        files={"file": f}
    )
text = response.json()["text"]

# 3. Génération du quiz
response = requests.post(
    f"{BASE_URL}/quiz/generate/",
    headers=headers,
    json={
        "text": text,
        "num_questions": 5
    }
)
quiz = response.json()["quiz"]

# Afficher les questions
for i, question in enumerate(quiz["questions"], 1):
    print(f"\nQuestion {i}: {question['question']}")
    for key, value in question["options"].items():
        print(f"  {key}. {value}")
    print(f"Réponse correcte: {question['correct_answer']}")
    print(f"Explication: {question['explanation']}")
```

### Gestion des erreurs

**Erreur 403 (Forbidden) :**
```json
{"error": "Seuls les formateurs peuvent téléverser des documents"}
```
→ Vérifiez que vous êtes connecté avec un compte formateur.

**Erreur 400 (Bad Request) :**
```json
{"error": "Format non supporté. Formats acceptés: .pdf, .docx, .txt"}
```
→ Vérifiez le format de votre document.

**Erreur 500 (Server Error) :**
```json
{"error": "Clé API OpenAI non configurée"}
```
→ Configurez la clé API OpenAI dans le fichier `.env` du backend.

**Erreur 429 (Too Many Requests) :**
```json
{"error": "Limite de taux dépassée pour l'API OpenAI. Réessayez plus tard."}
```
→ Attendez quelques minutes avant de réessayer.

### Bonnes pratiques

1. **Qualité du contenu** : Assurez-vous que vos documents sont bien formatés et contiennent du texte lisible
2. **Longueur du texte** : Le texte est automatiquement limité à 3000 caractères pour optimiser les coûts API
3. **Nombre de questions** : Commencez avec 5 questions et ajustez selon vos besoins
4. **Révision manuelle** : Toujours vérifier et ajuster les questions générées avant de les assigner aux apprenants
5. **Sécurité** : Ne partagez jamais votre clé API OpenAI dans le code ou les fichiers versionnés

### Prochaines étapes

Une fois votre quiz généré, vous pourrez :
- Sauvegarder le quiz dans la base de données
- L'assigner à des apprenants spécifiques
- Définir des dates limites
- Suivre les résultats et la progression

Pour plus de détails techniques, consultez :
- [API Documentation](backend/API_DOCUMENTATION.md)
- [API Upload Quiz](backend/API_UPLOAD_QUIZ.md)

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
- `POST /api/documents/upload/` - Upload et extraction de texte depuis documents (PDF, DOCX, TXT)
- `POST /api/quiz/generate/` - Génération de quiz à partir de texte via OpenAI

#### Nouveaux endpoints - Système d'Évaluation Intelligente
- `GET /api/evaluation-sessions/` - Liste des sessions d'évaluation
- `POST /api/evaluation-sessions/` - Créer une session d'évaluation
- `POST /api/evaluation-sessions/{id}/complete/` - Compléter et analyser une session
- `POST /api/question-responses/` - Enregistrer une réponse avec métadonnées
- `POST /api/question-responses/{id}/generate_feedback/` - Générer feedback IA
- `GET /api/cognitive-profiles/` - Liste des profils cognitifs
- `GET /api/cognitive-profiles/my_profile/` - Profil cognitif de l'apprenant

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
- ✅ ~~Création de quiz à partir de documents~~ - **Implémenté avec extraction de texte et OpenAI**
- ✅ ~~Système d'évaluation diagnostique~~ - **Implémenté avec analyse cognitive IA**
- ✅ ~~Profil cognitif personnalisé~~ - **Implémenté avec recommandations adaptées**
- ✅ ~~Téléchargement réel de fichiers~~ - **Implémenté dans l'API backend**
- ✅ ~~Édition et personnalisation de quiz interactifs~~ - **Implémenté avec QuizEdit**
- ✅ ~~Assignation de quiz à des apprenants spécifiques~~ - **Implémenté avec gestion dynamique**
- ✅ ~~Tableau de bord formateur avec statistiques~~ - **Implémenté avec analytics détaillées**
- ✅ ~~Génération de quiz avec IA à partir de documents~~ - **Implémenté avec workflow complet**
- Système de notation automatique avec feedback détaillé
- Notifications en temps réel
- Système de messagerie entre formateurs et apprenants
- Tests end-to-end avec Playwright ou Cypress
- Export de profils cognitifs en PDF
- Suivi longitudinal de l'évolution des profils

## 🗄️ Backend Django

Le projet inclut un backend Django complet avec:

- **Authentification JWT** - Inscription, connexion, gestion de session, rafraîchissement automatique
- **API REST** - Endpoints pour utilisateurs, fichiers et progression
- **Upload de fichiers** - Téléversement de documents pédagogiques
- **Extraction de texte** - Support PDF, DOCX et TXT avec PyPDF2 et python-docx
- **Génération de quiz IA** - Création automatique de questions via OpenAI GPT-3.5-turbo
- **Système d'évaluation intelligente** - Analyse cognitive avec OpenAI
  - Sessions d'évaluation diagnostique avec collecte de métadonnées
  - Analyse automatique des performances (temps, succès, patterns)
  - Génération de profils cognitifs avec forces et style d'apprentissage
  - Recommandations pédagogiques personnalisées
  - Feedback adaptatif qui valorise le raisonnement
- **Suivi de progression** - Système complet de tracking des quiz
- **Base de données SQLite** - Persistance des données (dev)
- **Panel Admin Django** - Interface d'administration
- **Tests API** - Script de test des endpoints

Pour plus de détails, voir:
- [Backend README](backend/README.md) - Documentation complète du backend
- [API Documentation](backend/API_DOCUMENTATION.md) - Documentation des endpoints de quiz
- [INTEGRATION.md](INTEGRATION.md) - Guide d'intégration Frontend-Backend
- [ARCHITECTURE.md](ARCHITECTURE.md) - Architecture système complète

## 🔮 Évolutions futures

- ✅ ~~Authentification utilisateur~~ - **Implémenté avec JWT**
- ✅ ~~Backend API avec base de données~~ - **Implémenté avec Django REST Framework**
- ✅ ~~Intégration Frontend-Backend~~ - **Implémenté avec Axios et intercepteurs**
- ✅ ~~Routes protégées~~ - **Implémenté avec ProtectedRoute**
- ✅ ~~Tests unitaires~~ - **Implémenté avec Vitest et Testing Library**
- ✅ ~~Création de quiz à partir de documents~~ - **Implémenté avec extraction de texte et OpenAI**
- Édition et personnalisation de quiz interactifs
- Système de notation automatique
- ✅ ~~Téléchargement réel de fichiers~~ - **Implémenté dans l'API backend**
- Assignation de quiz à des apprenants spécifiques
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
