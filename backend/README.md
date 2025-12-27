# Backend Django - Plateforme Pédagogique

Backend API Django pour la plateforme pédagogique avec REST Framework.

## 🛠️ Technologies

- **Django 6.0** - Framework web Python
- **Django REST Framework 3.16** - API REST
- **djangorestframework-simplejwt 5.5** - Authentification JWT
- **django-cors-headers 4.9** - Support CORS pour React
- **Pillow 12.0** - Traitement d'images/fichiers
- **PyPDF2 3.0** - Extraction de texte PDF
- **python-docx 1.1** - Extraction de texte DOCX
- **openai 1.12** - Génération de quiz avec OpenAI
- **SQLite** - Base de données

## 📋 Prérequis

- Python 3.12 ou supérieur
- pip

## 🚀 Installation

1. Naviguer vers le répertoire backend:
```bash
cd backend
```

2. Créer un environnement virtuel:
```bash
python3 -m venv venv
```

3. Activer l'environnement virtuel:
```bash
# Linux/Mac
source venv/bin/activate

# Windows
venv\Scripts\activate
```

4. Installer les dépendances:
```bash
pip install -r requirements.txt
```

5. Effectuer les migrations:
```bash
python manage.py migrate
```

6. Créer un superutilisateur (optionnel):
```bash
python manage.py createsuperuser
```

7. Lancer le serveur de développement:
```bash
python manage.py runserver
```

Le serveur sera accessible à l'adresse: `http://localhost:8000`

## 📁 Structure du Projet

```
backend/
├── config/               # Configuration Django
│   ├── settings.py      # Paramètres du projet
│   ├── urls.py          # URLs principales
│   └── wsgi.py          # Point d'entrée WSGI
├── pedagogical/         # Application principale
│   ├── models.py        # Modèles de données
│   ├── serializers.py   # Sérialiseurs DRF
│   ├── views.py         # Vues/ViewSets API
│   ├── urls.py          # URLs de l'API
│   └── admin.py         # Configuration admin
├── media/               # Fichiers téléversés
├── db.sqlite3          # Base de données SQLite
├── manage.py           # Script de gestion Django
└── requirements.txt    # Dépendances Python
```

## 📊 Modèles de Données

### User (Utilisateur)
Modèle personnalisé basé sur AbstractUser de Django.

**Champs:**
- `username` - Nom d'utilisateur (unique)
- `email` - Adresse email
- `password` - Mot de passe (crypté)
- `user_type` - Type d'utilisateur: `formateur` ou `apprenant`
- `first_name` - Prénom
- `last_name` - Nom
- `date_joined` - Date d'inscription

### File (Fichier)
Modèle pour les fichiers pédagogiques téléversés.

**Champs:**
- `title` - Titre du fichier
- `subject` - Sujet du fichier
- `theme` - Thème du fichier
- `file` - Fichier téléversé (PDF, DOC, PPT, etc.)
- `uploaded_by` - Formateur qui a téléversé (ForeignKey vers User)
- `uploaded_at` - Date de téléversement

### Progress (Progression)
Modèle pour suivre la progression des apprenants.

**Champs:**
- `user` - Apprenant (ForeignKey vers User)
- `quiz_title` - Titre du quiz
- `quiz_subject` - Sujet du quiz
- `score` - Score obtenu
- `max_score` - Score maximum possible
- `completed` - Quiz complété (booléen)
- `completed_at` - Date de complétion
- `created_at` - Date de création
- `updated_at` - Date de mise à jour

**Propriétés calculées:**
- `percentage` - Pourcentage du score (score/max_score * 100)

## 🔌 API Endpoints

### Authentification

#### Inscription
```
POST /api/auth/register/
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securepassword123",
  "user_type": "apprenant",  // ou "formateur"
  "first_name": "John",
  "last_name": "Doe"
}

Response: 201 Created
{
  "user": {
    "id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "user_type": "apprenant",
    ...
  },
  "tokens": {
    "refresh": "refresh_token_here",
    "access": "access_token_here"
  }
}
```

#### Connexion
```
POST /api/auth/login/
Content-Type: application/json

{
  "username": "john_doe",
  "password": "securepassword123"
}

Response: 200 OK
{
  "user": { ... },
  "tokens": {
    "refresh": "refresh_token_here",
    "access": "access_token_here"
  }
}
```

#### Rafraîchir le token
```
POST /api/auth/token/refresh/
Content-Type: application/json

{
  "refresh": "refresh_token_here"
}

Response: 200 OK
{
  "access": "new_access_token_here"
}
```

### Utilisateurs

```
GET    /api/users/           # Liste des utilisateurs
GET    /api/users/{id}/      # Détails d'un utilisateur
GET    /api/users/me/        # Informations utilisateur courant
PUT    /api/users/{id}/      # Modifier un utilisateur
DELETE /api/users/{id}/      # Supprimer un utilisateur
```

### Fichiers

**Note:** Authentification requise. Les formateurs peuvent uniquement créer et voir leurs propres fichiers.

#### Lister les fichiers
```
GET /api/files/
Authorization: Bearer <access_token>

Response: 200 OK
[
  {
    "id": 1,
    "title": "Cours Python",
    "subject": "Programmation",
    "theme": "Python",
    "file": "/media/uploads/2024/12/27/cours.pdf",
    "file_url": "http://localhost:8000/media/uploads/2024/12/27/cours.pdf",
    "uploaded_by": 1,
    "uploaded_by_username": "formateur1",
    "uploaded_at": "2024-12-27T10:30:00Z"
  }
]
```

#### Téléverser un fichier
```
POST /api/files/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "title": "Cours Python",
  "subject": "Programmation",
  "theme": "Python",
  "file": <binary_file_data>
}

Response: 201 Created
```

#### Autres opérations sur fichiers
```
GET    /api/files/{id}/     # Détails d'un fichier
PUT    /api/files/{id}/     # Modifier un fichier
DELETE /api/files/{id}/     # Supprimer un fichier
```

### Progression

**Note:** Les apprenants peuvent uniquement voir et modifier leur propre progression.

#### Lister la progression
```
GET /api/progress/
Authorization: Bearer <access_token>

Response: 200 OK
[
  {
    "id": 1,
    "user": 2,
    "username": "apprenant1",
    "quiz_title": "Quiz Python Basics",
    "quiz_subject": "Python",
    "score": 85,
    "max_score": 100,
    "percentage": 85.0,
    "completed": true,
    "completed_at": "2024-12-27T11:00:00Z",
    "created_at": "2024-12-27T10:00:00Z",
    "updated_at": "2024-12-27T11:00:00Z"
  }
]
```

#### Créer une entrée de progression
```
POST /api/progress/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "quiz_title": "Quiz Python Basics",
  "quiz_subject": "Python",
  "score": 85,
  "max_score": 100,
  "completed": true
}

Response: 201 Created
```

#### Statistiques de progression
```
GET /api/progress/stats/
Authorization: Bearer <access_token>

Response: 200 OK
{
  "total_quizzes": 10,
  "completed_quizzes": 7,
  "average_score": 82.5,
  "completion_percentage": 70.0
}
```

#### Autres opérations sur progression
```
GET    /api/progress/{id}/     # Détails d'une progression
PUT    /api/progress/{id}/     # Modifier une progression
PATCH  /api/progress/{id}/     # Mise à jour partielle
DELETE /api/progress/{id}/     # Supprimer une progression
```

### Document Upload & Quiz Generation

**Note:** Authentification requise. Consultez [API_UPLOAD_QUIZ.md](API_UPLOAD_QUIZ.md) pour la documentation complète.

#### Téléverser un document
```
POST /api/upload/
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

{
  "file": <binary_file_data>  // PDF, DOCX, or TXT
}

Response: 200 OK
{
  "text": "Extracted text content...",
  "filename": "document.pdf",
  "file_type": ".pdf",
  "text_length": 1234,
  "truncated": false
}
```

#### Générer un quiz avec OpenAI
```
POST /api/generate-quiz/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "text": "Text content for quiz generation",
  "num_questions": 5  // 1-10, default: 5
}

Response: 200 OK
{
  "questions": "Question 1: ...\nA. ...\nB. ...\n...",
  "num_questions": 5,
  "model": "gpt-3.5-turbo"
}
```

Voir [API_UPLOAD_QUIZ.md](API_UPLOAD_QUIZ.md) pour plus d'exemples et de détails.

## ⚙️ Configuration

### Variables d'environnement

Créez un fichier `.env` dans le répertoire backend (voir `.env.example`):

```bash
# Django Settings
SECRET_KEY=your-secret-key-here
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# OpenAI API Key (pour génération de quiz)
OPENAI_API_KEY=your-openai-api-key-here
```

## 🔐 Authentification

L'API utilise JWT (JSON Web Tokens) pour l'authentification:

1. Obtenez un token via `/api/auth/login/` ou `/api/auth/register/`
2. Incluez le token dans l'en-tête de chaque requête:
   ```
   Authorization: Bearer <access_token>
   ```
3. Les tokens d'accès expirent après 1 jour
4. Les tokens de rafraîchissement expirent après 7 jours
5. Utilisez `/api/auth/token/refresh/` pour obtenir un nouveau token d'accès

## 🔒 Permissions

- **Endpoints publics:** `/api/auth/register/`, `/api/auth/login/`
- **Endpoints authentifiés:** Tous les autres endpoints nécessitent un token JWT
- **Formateurs:** Peuvent téléverser des fichiers et voir tous les progrès
- **Apprenants:** Peuvent voir tous les fichiers mais uniquement leur propre progression

## 🛡️ CORS

Le backend est configuré pour accepter les requêtes du frontend React:
- `http://localhost:5173`
- `http://127.0.0.1:5173`

## 🎨 Interface Admin

Accédez à l'interface d'administration Django:
```
http://localhost:8000/admin
```

Créez un superutilisateur pour y accéder:
```bash
python manage.py createsuperuser
```

## 📝 Notes de Développement

- Le serveur de développement recharge automatiquement lors des modifications
- Les fichiers téléversés sont stockés dans `media/uploads/`
- La base de données SQLite est dans `db.sqlite3`
- DEBUG est activé en développement (désactiver en production)

## 🔮 Évolutions Futures

- [x] **Support de téléversement et génération de quiz** - Implémenté avec PyPDF2, python-docx et OpenAI
- [ ] Support de PostgreSQL pour la production
- [ ] Cache avec Redis
- [x] **Tests unitaires et d'intégration** - Implémenté pour les endpoints upload et quiz
- [ ] Documentation API avec Swagger/OpenAPI
- [x] **Limites de taille de fichier configurables** - Configuré via settings
- [ ] Filtrage et recherche avancés
- [ ] Pagination optimisée
- [ ] WebSocket pour notifications temps réel
- [ ] Système de rôles plus granulaire

## 📄 Licence

Tous droits réservés © 2025 Plateforme Pédagogique
