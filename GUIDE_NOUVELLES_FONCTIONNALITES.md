# Guide des nouvelles fonctionnalités de gestion des quiz

Ce document décrit les nouvelles fonctionnalités ajoutées pour la gestion des quiz par les formateurs.

## 🎯 Fonctionnalités implémentées

### 1. Modification de quiz existants

Les formateurs peuvent maintenant modifier leurs quiz après leur création.

#### Caractéristiques
- Modification du titre, sujet et description
- Modification des questions et options
- Ajout ou suppression de questions
- Mise à jour des apprenants assignés
- Conservation de l'historique (dates de création/modification)

#### Utilisation
1. Dans l'onglet "Quiz" du Dashboard Formateur
2. Cliquer sur le bouton "✏️ Modifier" à côté du quiz souhaité
3. Modifier les informations du quiz
4. Cliquer sur "Modifier" pour enregistrer les changements

#### Endpoint API
```bash
PATCH /api/quizzes/{id}/
Authorization: Bearer <token>
Content-Type: application/json

{
  "title": "Nouveau titre",
  "description": "Nouvelle description",
  "questions": { "questions": [...] },
  "learner_ids": [1, 2, 3]
}
```

### 2. Génération de questions avec IA

Les formateurs peuvent générer automatiquement des questions à partir de documents pédagogiques.

#### Workflow
1. **Étape 1 - Upload du document**
   - Formats supportés: PDF, DOCX, TXT
   - Taille maximale: 10 MB
   - Extraction automatique du texte

2. **Étape 2 - Génération des questions**
   - Choix du nombre de questions (1-20)
   - Génération via OpenAI GPT-3.5-turbo
   - Questions à choix multiples (A, B, C, D)

3. **Étape 3 - Révision et sauvegarde**
   - Modification des questions générées
   - Ajout/suppression de questions
   - Finalisation du quiz

#### Utilisation
1. Dans le dialogue de création de quiz
2. Sélectionner l'onglet "Générer avec IA" ✨
3. Suivre les 3 étapes du workflow
4. Réviser et modifier les questions si nécessaire
5. Remplir les informations du quiz et sauvegarder

#### Exemple avec curl
```bash
# 1. Upload et extraction de texte
curl -X POST http://localhost:8000/api/documents/upload/ \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@document.pdf"

# 2. Génération de questions
curl -X POST http://localhost:8000/api/quiz/generate/ \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Texte extrait du document...",
    "num_questions": 5
  }'
```

### 3. Assignation d'apprenants

Les formateurs peuvent assigner ou réassigner des apprenants à leurs quiz à tout moment.

#### Caractéristiques
- Assignation lors de la création du quiz
- Modification des assignations après la création
- Sélection multiple d'apprenants
- Affichage du nombre d'apprenants assignés

#### Utilisation
1. Dans le dialogue de création/modification de quiz
2. Section "Assigner aux apprenants"
3. Sélectionner les apprenants dans la liste déroulante
4. Les apprenants peuvent être ajoutés ou retirés

#### API
L'assignation se fait automatiquement lors de la création ou modification:
```json
{
  "title": "Mon Quiz",
  "subject": "Mathématiques",
  "questions": { "questions": [...] },
  "learner_ids": [1, 2, 3, 4]
}
```

### 4. Tableau de bord des statistiques

Les formateurs peuvent visualiser les performances de leurs apprenants sur chaque quiz.

#### Métriques affichées

**Vue d'ensemble**
- Nombre total de questions
- Nombre d'apprenants assignés
- Taux de complétion (%)
- Score moyen (%)

**Détails par apprenant**
- Nom et identifiant
- Date d'assignation
- Statut (Terminé/En cours)
- Date de complétion
- Score obtenu
- Pourcentage de réussite

#### Indicateurs visuels
- 🟢 Vert: Score ≥ 80%
- 🟠 Orange: Score ≥ 60%
- 🔴 Rouge: Score < 60%

#### Utilisation
1. Dans l'onglet "Quiz" du Dashboard Formateur
2. Cliquer sur le bouton "📊 Statistiques" à côté du quiz
3. Visualiser les statistiques globales et par apprenant
4. Fermer le dialogue quand terminé

#### Endpoint API
```bash
GET /api/quizzes/{id}/stats/
Authorization: Bearer <token>
```

**Exemple de réponse**
```json
{
  "quiz_id": 1,
  "quiz_title": "Quiz Python",
  "quiz_subject": "Programmation",
  "num_questions": 10,
  "total_assigned": 5,
  "total_completed": 3,
  "completion_rate": 60.0,
  "average_score": 75.5,
  "learner_stats": [
    {
      "learner_id": 2,
      "learner_username": "marie",
      "learner_name": "Marie Martin",
      "assigned_at": "2026-01-04T10:00:00Z",
      "completed": true,
      "completed_at": "2026-01-04T11:30:00Z",
      "score": 85,
      "max_score": 100,
      "percentage": 85.0
    }
  ]
}
```

## 🔒 Sécurité

### Permissions
- Tous les endpoints sont protégés par authentification JWT
- Seuls les formateurs peuvent:
  - Créer des quiz
  - Modifier leurs propres quiz
  - Générer des questions avec l'IA
  - Voir les statistiques de leurs quiz
- Les apprenants ne peuvent que:
  - Voir les quiz qui leur sont assignés
  - Répondre aux quiz
  - Voir leur propre progression

### Validation
- Backend: Vérification du type d'utilisateur (`user_type == 'formateur'`)
- Frontend: Protection des routes et composants
- Les formateurs ne peuvent modifier que leurs propres quiz

## 🧪 Tests

### Tests manuels effectués
```bash
# 1. Créer des utilisateurs de test
cd backend
python manage.py shell
>>> from pedagogical.models import User
>>> formateur = User.objects.create_user(
...     username='formateur1',
...     password='password123',
...     user_type='formateur'
... )

# 2. Tester la création de quiz
curl -X POST http://localhost:8000/api/quizzes/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# 3. Tester la modification
curl -X PATCH http://localhost:8000/api/quizzes/1/ \
  -H "Authorization: Bearer $TOKEN" \
  -d '{...}'

# 4. Tester les statistiques
curl http://localhost:8000/api/quizzes/1/stats/ \
  -H "Authorization: Bearer $TOKEN"
```

### Tests unitaires
Tous les tests existants passent:
```bash
npm test -- --run
# ✓ 14 tests passed
```

## 📋 Configuration requise

### Backend
- OpenAI API Key (pour la génération de questions)
- Configuration dans `backend/.env`:
  ```
  OPENAI_API_KEY=sk-...
  MAX_UPLOAD_SIZE=10485760  # 10 MB
  MAX_TEXT_LENGTH_FOR_QUIZ=3000
  ```

### Frontend
- Aucune configuration supplémentaire nécessaire
- Les composants sont automatiquement chargés

## 🚀 Déploiement

### Migrations
```bash
cd backend
python manage.py migrate
```

### Build frontend
```bash
npm run build
```

### Variables d'environnement
```bash
# Backend
OPENAI_API_KEY=your_openai_api_key
ALLOWED_DOCUMENT_EXTENSIONS=['.pdf', '.docx', '.txt']
MAX_UPLOAD_SIZE=10485760

# Frontend
VITE_API_BASE_URL=http://localhost:8000/api
```

## 📚 Ressources

- [Documentation API complète](../backend/API_DOCUMENTATION.md)
- [Guide d'utilisation OpenAI](../backend/API_UPLOAD_QUIZ.md)
- [Architecture système](../ARCHITECTURE.md)

## 🐛 Dépannage

### L'IA ne génère pas de questions
- Vérifier que `OPENAI_API_KEY` est configurée
- Vérifier les logs du backend pour les erreurs
- Limiter la longueur du texte à 3000 caractères

### Les statistiques ne s'affichent pas
- Vérifier que le quiz a des apprenants assignés
- Vérifier que le formateur est bien le créateur du quiz
- Vérifier les permissions JWT

### Les modifications ne sont pas sauvegardées
- Vérifier les permissions du formateur
- Vérifier que toutes les questions sont complètes
- Consulter la console pour les erreurs

## 💡 Bonnes pratiques

1. **Réviser les questions IA**: Toujours vérifier les questions générées par l'IA
2. **Limiter la taille**: Ne pas dépasser 20 questions par quiz
3. **Documenter**: Ajouter des descriptions claires aux quiz
4. **Suivre les stats**: Consulter régulièrement les statistiques pour adapter l'enseignement
5. **Réassigner**: Mettre à jour les assignations quand la classe change
