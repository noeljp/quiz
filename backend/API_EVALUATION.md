# API Documentation - Système d'Évaluation Intelligente

Cette documentation décrit les nouveaux endpoints API pour le système d'évaluation diagnostique et de profil cognitif.

## Vue d'ensemble

Le système d'évaluation intelligente permet de :
- Créer des sessions d'évaluation diagnostique
- Collecter des données détaillées sur les réponses (temps, tentatives, aide)
- Analyser les performances avec l'IA (OpenAI)
- Générer des profils cognitifs personnalisés
- Fournir des recommandations pédagogiques

## Authentification

Tous les endpoints nécessitent une authentification JWT via le header :
```
Authorization: Bearer <access_token>
```

## Endpoints

### 1. Sessions d'Évaluation

#### GET `/api/evaluation-sessions/`
Récupère la liste des sessions d'évaluation.

**Permissions** : Apprenant (ses propres sessions) ou Formateur (toutes les sessions)

**Réponse** :
```json
[
  {
    "id": 1,
    "learner": 3,
    "learner_username": "jean.dupont",
    "quiz": null,
    "session_type": "diagnostic",
    "started_at": "2024-01-04T10:30:00Z",
    "completed_at": "2024-01-04T10:45:00Z",
    "is_completed": true,
    "num_responses": 15
  }
]
```

#### POST `/api/evaluation-sessions/`
Crée une nouvelle session d'évaluation.

**Body** :
```json
{
  "session_type": "diagnostic",
  "quiz": null  // optionnel
}
```

**Réponse** :
```json
{
  "id": 1,
  "learner": 3,
  "session_type": "diagnostic",
  "started_at": "2024-01-04T10:30:00Z",
  "is_completed": false
}
```

#### POST `/api/evaluation-sessions/{id}/complete/`
Complète une session et déclenche l'analyse du profil cognitif.

**Réponse** :
```json
{
  "session": {
    "id": 1,
    "is_completed": true,
    "completed_at": "2024-01-04T10:45:00Z"
  },
  "profile": {
    "id": 2,
    "strengths": ["logique", "raisonnement"],
    "weaknesses": ["lecture"],
    "learning_style": "visuel et logique",
    "confidence_level": "élevé",
    "recommendations": [
      "Privilégier les supports visuels",
      "Encourager l'explication orale"
    ]
  },
  "message": "Session complétée et profil cognitif généré"
}
```

### 2. Réponses aux Questions

#### POST `/api/question-responses/`
Enregistre une réponse à une question avec métadonnées.

**Body** :
```json
{
  "session": 1,
  "question_id": "q1",
  "question_text": "Quel est le résultat de 15 + 27 ?",
  "question_type": "qcm",
  "competence_type": "calcul",
  "answer": "B",
  "correct_answer": "B",
  "is_correct": true,
  "response_time_ms": 8500,
  "attempts": 1,
  "help_used": false,
  "help_type": ""
}
```

**Réponse** :
```json
{
  "id": 45,
  "session": 1,
  "question_id": "q1",
  "is_correct": true,
  "response_time_ms": 8500,
  "created_at": "2024-01-04T10:32:15Z"
}
```

#### POST `/api/question-responses/{id}/generate_feedback/`
Génère un feedback pédagogique personnalisé avec l'IA.

**Réponse** :
```json
{
  "feedback": "Excellent ! Ton raisonnement est rapide et précis. Tu as bien décomposé le problème. Continue comme ça !"
}
```

### 3. Profils Cognitifs

#### GET `/api/cognitive-profiles/my_profile/`
Récupère le profil cognitif de l'apprenant connecté.

**Permissions** : Apprenant uniquement

**Réponse** :
```json
{
  "id": 2,
  "learner": 3,
  "learner_username": "jean.dupont",
  "strengths": ["logique", "raisonnement", "compréhension orale"],
  "weaknesses": ["lecture écrite", "attention"],
  "learning_style": "visuel et logique",
  "confidence_level": "élevé",
  "recommendations": [
    "Privilégier les supports visuels",
    "Alléger les consignes écrites",
    "Encourager l'explication orale",
    "Proposer des pauses régulières pour maintenir l'attention"
  ],
  "analysis_data": {
    "total_responses": 15,
    "overall_success_rate": 80.0,
    "average_response_time": 9500,
    "help_usage_rate": 20.0,
    "by_competence": {
      "calcul": {
        "success_rate": 85.0,
        "avg_time": 8000
      },
      "logique": {
        "success_rate": 90.0,
        "avg_time": 7500
      },
      "lecture": {
        "success_rate": 60.0,
        "avg_time": 15000
      }
    }
  },
  "last_evaluation_session": 1,
  "created_at": "2024-01-04T10:45:30Z",
  "updated_at": "2024-01-04T10:45:30Z"
}
```

**Erreur 404** (pas de profil) :
```json
{
  "message": "Aucun profil cognitif disponible. Complétez une évaluation diagnostique."
}
```

#### GET `/api/cognitive-profiles/`
Liste tous les profils (formateurs) ou son propre profil (apprenants).

**Permissions** : Authentifié

## Types de Compétences

Les questions peuvent être catégorisées selon les types de compétences suivants :
- `lecture` : Compréhension écrite, décodage
- `logique` : Raisonnement logique, résolution de problèmes
- `calcul` : Compétences mathématiques
- `comprehension` : Compréhension générale
- `attention` : Concentration, repérage d'erreurs

## Niveaux de Confiance

- `faible` : En développement, nécessite un accompagnement renforcé
- `moyen` : Performance correcte avec marge de progression
- `élevé` : Bonnes performances générales

## Analyse avec OpenAI

Le système utilise l'API OpenAI (GPT-3.5-turbo) pour :

1. **Analyse du profil cognitif** : Identification des forces et fragilités basée sur les indicateurs quantitatifs
2. **Génération de recommandations** : Stratégies pédagogiques adaptées au profil de l'élève
3. **Feedback personnalisé** : Messages encourageants qui valorisent le raisonnement

### Configuration requise

```bash
# Dans backend/.env
OPENAI_API_KEY=votre-clé-api-openai
```

### Fallback sans OpenAI

Si la clé API n'est pas configurée ou si l'API échoue, le système utilise une analyse basée sur des règles :
- Forces : compétences avec taux de réussite > 70%
- Fragilités : compétences avec taux de réussite < 50%
- Style d'apprentissage : basé sur l'utilisation de l'aide et le temps de réponse

## Principes Pédagogiques

⚠️ **Important** : Le système génère des **hypothèses pédagogiques**, JAMAIS de diagnostics médicaux.

Conformément au document `methode_de_suivi.md` :

1. ✅ Toujours identifier AU MOINS 2 forces
2. ✅ Limiter les fragilités à 3 maximum
3. ✅ Valoriser le raisonnement, pas seulement le résultat
4. ✅ Feedback bienveillant et encourageant
5. ❌ Pas de notation punitive
6. ❌ Pas de diagnostics médicaux

## Exemples d'Utilisation

### Workflow complet d'évaluation

```javascript
// 1. Créer une session
const session = await evaluationService.createEvaluationSession({
  session_type: 'diagnostic'
});

// 2. Pour chaque question, enregistrer la réponse
for (const question of questions) {
  const startTime = Date.now();
  // ... l'utilisateur répond ...
  const responseTime = Date.now() - startTime;
  
  await evaluationService.createQuestionResponse({
    session: session.id,
    question_id: question.id,
    question_text: question.text,
    question_type: 'qcm',
    competence_type: question.competence,
    answer: userAnswer,
    correct_answer: question.correct,
    is_correct: userAnswer === question.correct,
    response_time_ms: responseTime,
    attempts: 1,
    help_used: helpWasUsed,
    help_type: helpWasUsed ? 'progressive_hint' : ''
  });
}

// 3. Compléter la session et obtenir le profil
const result = await evaluationService.completeEvaluationSession(session.id);
console.log('Profil cognitif:', result.profile);
```

### Obtenir son profil

```javascript
try {
  const profile = await evaluationService.getMyCognitiveProfile();
  console.log('Forces:', profile.strengths);
  console.log('Recommandations:', profile.recommendations);
} catch (error) {
  if (error.response?.status === 404) {
    // Pas de profil, proposer de faire une évaluation
    console.log('Complétez une évaluation diagnostique');
  }
}
```

## Codes d'erreur

- `400 Bad Request` : Données invalides
- `401 Unauthorized` : Token JWT manquant ou invalide
- `403 Forbidden` : Accès refusé (mauvais type d'utilisateur)
- `404 Not Found` : Ressource non trouvée
- `500 Internal Server Error` : Erreur serveur (ex: API OpenAI non configurée)

## Notes de Performance

- Les sessions d'évaluation peuvent contenir 15-20 questions
- L'analyse avec OpenAI prend environ 2-5 secondes
- Le profil cognitif est mis à jour à chaque nouvelle évaluation
- Les données d'analyse sont conservées dans `analysis_data` pour traçabilité
