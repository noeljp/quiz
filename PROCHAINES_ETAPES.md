# Prochaines Étapes - Plateforme Pédagogique

## Date: 28 décembre 2025

## État Actuel du Projet

### ✅ Fonctionnalités Complétées

1. **Authentification et Autorisation**
   - Système JWT complet avec tokens d'accès et de rafraîchissement
   - Gestion des rôles (formateur/apprenant)
   - Routes protégées basées sur les rôles
   - Rafraîchissement automatique des tokens

2. **Backend Django REST API**
   - Authentification utilisateur (inscription, connexion)
   - Gestion des fichiers pédagogiques (upload, liste, suppression)
   - Suivi de progression des apprenants
   - Base de données SQLite avec modèles User, File, Progress

3. **Frontend React avec Material-UI**
   - Page d'accueil
   - Pages de connexion et inscription
   - Dashboard Formateur (téléversement et gestion de fichiers)
   - Dashboard Apprenant (visualisation des quiz et statistiques)
   - Header dynamique avec gestion de la déconnexion

4. **Intégration OpenAI**
   - Upload de documents (PDF, DOCX, TXT)
   - Extraction automatique du texte
   - Génération de quiz à partir du contenu via GPT-3.5-turbo
   - Validation et sécurisation des endpoints

5. **Tests et Qualité**
   - 14 tests unitaires frontend (Vitest + Testing Library)
   - 11 tests backend Django
   - CodeQL security scan (0 vulnérabilités)
   - Documentation complète

## 🎯 Prochaine Étape Recommandée

### **Phase 1: Système de Quiz Interactifs**

Cette phase est la suite logique car:
- ✅ Le backend génère déjà des quiz via OpenAI
- ✅ Le frontend affiche déjà des informations de progression
- ❌ **MANQUANT**: Les quiz générés ne sont pas stockés ni utilisables
- ❌ **MANQUANT**: Les apprenants ne peuvent pas réellement prendre de quiz
- ❌ **MANQUANT**: Aucun système de notation automatique

### Objectifs de la Phase 1

1. **Permettre aux formateurs de:**
   - Générer des quiz depuis leurs documents
   - Sauvegarder les quiz générés dans la base de données
   - Réviser et éditer les questions avant publication
   - Assigner des quiz aux apprenants
   - Voir les résultats et statistiques

2. **Permettre aux apprenants de:**
   - Voir les quiz disponibles/assignés
   - Prendre des quiz de manière interactive
   - Recevoir une notation automatique
   - Voir leurs résultats avec explications
   - Suivre leur progression réelle

## 📋 Plan Détaillé - Phase 1

### Étape 1.1: Modèles de Données Backend (2-3 heures)

**Objectif:** Créer les modèles pour stocker les quiz et les tentatives

**Fichiers à créer/modifier:**
- `backend/pedagogical/models.py`

**Nouveaux modèles:**

```python
class Quiz(models.Model):
    """Représente un quiz généré"""
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    subject = models.CharField(max_length=100)
    theme = models.CharField(max_length=100)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_quizzes')
    source_document = models.ForeignKey(File, on_delete=models.SET_NULL, null=True, blank=True)
    is_published = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Question(models.Model):
    """Représente une question dans un quiz"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='questions')
    question_text = models.TextField()
    question_type = models.CharField(max_length=20, default='multiple_choice')
    order = models.IntegerField()
    points = models.IntegerField(default=1)
    explanation = models.TextField(blank=True)

class Answer(models.Model):
    """Représente une réponse possible à une question"""
    question = models.ForeignKey(Question, on_delete=models.CASCADE, related_name='answers')
    answer_text = models.TextField()
    is_correct = models.BooleanField(default=False)
    order = models.IntegerField()

class QuizAttempt(models.Model):
    """Représente une tentative de quiz par un apprenant"""
    quiz = models.ForeignKey(Quiz, on_delete=models.CASCADE, related_name='attempts')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='quiz_attempts')
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    score = models.IntegerField(null=True, blank=True)
    max_score = models.IntegerField()
    percentage = models.FloatField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)

class UserAnswer(models.Model):
    """Représente la réponse d'un utilisateur à une question"""
    attempt = models.ForeignKey(QuizAttempt, on_delete=models.CASCADE, related_name='user_answers')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    selected_answer = models.ForeignKey(Answer, on_delete=models.CASCADE)
    is_correct = models.BooleanField()
    answered_at = models.DateTimeField(auto_now_add=True)
```

**Tâches:**
- [ ] Créer les 5 nouveaux modèles
- [ ] Créer les migrations: `python manage.py makemigrations`
- [ ] Appliquer les migrations: `python manage.py migrate`
- [ ] Tester la création manuelle d'objets dans Django shell

### Étape 1.2: Sérialiseurs Backend (1-2 heures)

**Objectif:** Créer les sérialiseurs pour l'API REST

**Fichiers à modifier:**
- `backend/pedagogical/serializers.py`

**Nouveaux sérialiseurs:**
```python
class AnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Answer
        fields = ['id', 'answer_text', 'is_correct', 'order']
        read_only_fields = ['id']

class QuestionSerializer(serializers.ModelSerializer):
    answers = AnswerSerializer(many=True, read_only=True)
    
    class Meta:
        model = Question
        fields = ['id', 'question_text', 'question_type', 'order', 'points', 'explanation', 'answers']
        read_only_fields = ['id']

class QuizSerializer(serializers.ModelSerializer):
    questions = QuestionSerializer(many=True, read_only=True)
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    question_count = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'description', 'subject', 'theme', 'created_by', 
                  'created_by_username', 'source_document', 'is_published', 
                  'created_at', 'updated_at', 'questions', 'question_count']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_question_count(self, obj):
        return obj.questions.count()

class QuizAttemptSerializer(serializers.ModelSerializer):
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    user_username = serializers.CharField(source='user.username', read_only=True)
    
    class Meta:
        model = QuizAttempt
        fields = ['id', 'quiz', 'quiz_title', 'user', 'user_username', 
                  'started_at', 'completed_at', 'score', 'max_score', 
                  'percentage', 'is_completed']
        read_only_fields = ['id', 'user', 'started_at', 'percentage']

class UserAnswerSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserAnswer
        fields = ['id', 'attempt', 'question', 'selected_answer', 'is_correct', 'answered_at']
        read_only_fields = ['id', 'is_correct', 'answered_at']
```

**Tâches:**
- [ ] Créer les 5 nouveaux sérialiseurs
- [ ] Tester la sérialisation dans Django shell
- [ ] Vérifier les relations nested correctes

### Étape 1.3: Vues et Endpoints API Backend (3-4 heures)

**Objectif:** Créer les endpoints API pour gérer les quiz

**Fichiers à modifier:**
- `backend/pedagogical/views.py`
- `backend/pedagogical/urls.py`

**Nouveaux endpoints:**

1. **Quiz Management (Formateurs)**
   - `POST /api/quizzes/` - Créer un quiz
   - `GET /api/quizzes/` - Lister les quiz (filtrés par créateur si formateur)
   - `GET /api/quizzes/{id}/` - Détails d'un quiz
   - `PUT /api/quizzes/{id}/` - Modifier un quiz
   - `DELETE /api/quizzes/{id}/` - Supprimer un quiz
   - `POST /api/quizzes/{id}/publish/` - Publier un quiz

2. **Quiz Taking (Apprenants)**
   - `GET /api/quizzes/available/` - Quiz disponibles pour l'apprenant
   - `POST /api/quizzes/{id}/start/` - Commencer un quiz
   - `POST /api/attempts/{id}/submit/` - Soumettre des réponses
   - `GET /api/attempts/{id}/results/` - Voir les résultats

3. **Quiz Generation Integration**
   - `POST /api/quizzes/generate-and-save/` - Générer via OpenAI et sauvegarder

**ViewSets à créer:**
```python
class QuizViewSet(viewsets.ModelViewSet):
    serializer_class = QuizSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        user = self.request.user
        if user.user_type == 'formateur':
            return Quiz.objects.filter(created_by=user)
        else:
            return Quiz.objects.filter(is_published=True)
    
    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)
    
    @action(detail=True, methods=['post'])
    def publish(self, request, pk=None):
        quiz = self.get_object()
        if quiz.created_by != request.user:
            return Response({'error': 'Permission denied'}, status=403)
        quiz.is_published = True
        quiz.save()
        return Response({'status': 'published'})
    
    @action(detail=True, methods=['post'])
    def start(self, request, pk=None):
        quiz = self.get_object()
        if request.user.user_type != 'apprenant':
            return Response({'error': 'Only learners can take quizzes'}, status=403)
        
        attempt = QuizAttempt.objects.create(
            quiz=quiz,
            user=request.user,
            max_score=sum(q.points for q in quiz.questions.all())
        )
        return Response(QuizAttemptSerializer(attempt).data)

class QuizAttemptViewSet(viewsets.ModelViewSet):
    serializer_class = QuizAttemptSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        return QuizAttempt.objects.filter(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def submit(self, request, pk=None):
        attempt = self.get_object()
        if attempt.is_completed:
            return Response({'error': 'Quiz already completed'}, status=400)
        
        answers_data = request.data.get('answers', [])
        score = 0
        
        for answer_data in answers_data:
            question_id = answer_data['question_id']
            selected_answer_id = answer_data['answer_id']
            
            question = Question.objects.get(id=question_id)
            selected_answer = Answer.objects.get(id=selected_answer_id)
            is_correct = selected_answer.is_correct
            
            UserAnswer.objects.create(
                attempt=attempt,
                question=question,
                selected_answer=selected_answer,
                is_correct=is_correct
            )
            
            if is_correct:
                score += question.points
        
        attempt.score = score
        attempt.percentage = (score / attempt.max_score) * 100
        attempt.is_completed = True
        attempt.completed_at = timezone.now()
        attempt.save()
        
        return Response(QuizAttemptSerializer(attempt).data)
    
    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        attempt = self.get_object()
        if not attempt.is_completed:
            return Response({'error': 'Quiz not completed yet'}, status=400)
        
        serializer = QuizAttemptSerializer(attempt)
        user_answers = UserAnswer.objects.filter(attempt=attempt).select_related(
            'question', 'selected_answer'
        )
        
        results = {
            'attempt': serializer.data,
            'answers': UserAnswerSerializer(user_answers, many=True).data,
            'questions': QuestionSerializer(
                attempt.quiz.questions.all(), many=True
            ).data
        }
        
        return Response(results)
```

**Tâches:**
- [ ] Créer QuizViewSet avec toutes les actions
- [ ] Créer QuizAttemptViewSet avec submit et results
- [ ] Ajouter les routes dans urls.py
- [ ] Tester avec curl/Postman tous les endpoints
- [ ] Ajouter la permission IsAuthenticated et vérifier les rôles

### Étape 1.4: Intégration OpenAI → Database (2 heures)

**Objectif:** Modifier l'endpoint de génération pour sauvegarder dans la DB

**Fichier à modifier:**
- `backend/pedagogical/views.py`

**Nouveau endpoint:**
```python
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def generate_and_save_quiz(request):
    """Génère un quiz via OpenAI et le sauvegarde dans la base de données"""
    
    if request.user.user_type != 'formateur':
        return Response({'error': 'Only trainers can generate quizzes'}, status=403)
    
    # Récupérer les paramètres
    text = request.data.get('text', '').strip()
    num_questions = request.data.get('num_questions', 5)
    title = request.data.get('title', 'Quiz généré')
    subject = request.data.get('subject', '')
    theme = request.data.get('theme', '')
    
    # Validation
    if not text:
        return Response({'error': 'Text is required'}, status=400)
    
    if not (1 <= num_questions <= 10):
        return Response({'error': 'Number of questions must be between 1 and 10'}, status=400)
    
    # Générer le quiz via OpenAI
    try:
        response = openai.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[{
                "role": "system",
                "content": "You are a helpful educational assistant that creates quiz questions in French."
            }, {
                "role": "user",
                "content": f"""Crée {num_questions} questions QCM en français basées sur le texte suivant.
Pour chaque question, fournis:
- Une question claire
- 4 options de réponse (A, B, C, D)
- L'option correcte
- Une brève explication

Format JSON:
{{
  "questions": [
    {{
      "question": "...",
      "options": ["A. ...", "B. ...", "C. ...", "D. ..."],
      "correct": 0,
      "explanation": "..."
    }}
  ]
}}

Texte: {text[:3000]}"""
            }],
            temperature=0.7,
            max_tokens=2000
        )
        
        # Parser la réponse JSON
        content = response.choices[0].message.content
        quiz_data = json.loads(content)
        
        # Créer le quiz dans la base de données
        quiz = Quiz.objects.create(
            title=title,
            subject=subject,
            theme=theme,
            created_by=request.user,
            is_published=False
        )
        
        # Créer les questions et réponses
        for idx, q_data in enumerate(quiz_data['questions']):
            question = Question.objects.create(
                quiz=quiz,
                question_text=q_data['question'],
                order=idx,
                points=1,
                explanation=q_data.get('explanation', '')
            )
            
            for opt_idx, option in enumerate(q_data['options']):
                Answer.objects.create(
                    question=question,
                    answer_text=option,
                    is_correct=(opt_idx == q_data['correct']),
                    order=opt_idx
                )
        
        return Response({
            'quiz_id': quiz.id,
            'message': 'Quiz generated and saved successfully',
            'question_count': quiz.questions.count()
        }, status=201)
        
    except Exception as e:
        return Response({
            'error': f'Failed to generate quiz: {str(e)}'
        }, status=500)
```

**Tâches:**
- [ ] Créer la nouvelle fonction generate_and_save_quiz
- [ ] Ajouter la route dans urls.py
- [ ] Tester la génération et vérifier que tout est sauvegardé
- [ ] Gérer les erreurs de parsing JSON

### Étape 1.5: Services API Frontend (2 heures)

**Objectif:** Créer les services pour consommer les nouveaux endpoints

**Fichier à créer:**
- `src/api/quizzes.js`

**Contenu:**
```javascript
import apiClient from './config';

export const quizService = {
  // Formateur: Gestion des quiz
  async getMyQuizzes() {
    const response = await apiClient.get('/quizzes/');
    return response.data;
  },

  async getQuizDetails(quizId) {
    const response = await apiClient.get(`/quizzes/${quizId}/`);
    return response.data;
  },

  async createQuiz(quizData) {
    const response = await apiClient.post('/quizzes/', quizData);
    return response.data;
  },

  async updateQuiz(quizId, quizData) {
    const response = await apiClient.put(`/quizzes/${quizId}/`, quizData);
    return response.data;
  },

  async deleteQuiz(quizId) {
    const response = await apiClient.delete(`/quizzes/${quizId}/`);
    return response.data;
  },

  async publishQuiz(quizId) {
    const response = await apiClient.post(`/quizzes/${quizId}/publish/`);
    return response.data;
  },

  async generateAndSaveQuiz(text, numQuestions, title, subject, theme) {
    const response = await apiClient.post('/quizzes/generate-and-save/', {
      text,
      num_questions: numQuestions,
      title,
      subject,
      theme
    });
    return response.data;
  },

  // Apprenant: Passer des quiz
  async getAvailableQuizzes() {
    const response = await apiClient.get('/quizzes/');
    return response.data;
  },

  async startQuiz(quizId) {
    const response = await apiClient.post(`/quizzes/${quizId}/start/`);
    return response.data;
  },

  async getMyAttempts() {
    const response = await apiClient.get('/attempts/');
    return response.data;
  },

  async submitQuizAnswers(attemptId, answers) {
    const response = await apiClient.post(`/attempts/${attemptId}/submit/`, {
      answers
    });
    return response.data;
  },

  async getQuizResults(attemptId) {
    const response = await apiClient.get(`/attempts/${attemptId}/results/`);
    return response.data;
  }
};
```

**Tâches:**
- [ ] Créer le fichier quizzes.js
- [ ] Exporter toutes les fonctions
- [ ] Tester chaque fonction individuellement

### Étape 1.6: Interface Formateur - Génération et Gestion (4-5 heures)

**Objectif:** Améliorer le dashboard formateur avec la génération de quiz

**Fichiers à créer/modifier:**
- `src/pages/DashboardFormateur.jsx`
- `src/components/QuizGenerator.jsx` (nouveau)
- `src/components/QuizList.jsx` (nouveau)
- `src/components/QuizEditor.jsx` (nouveau)

**Composants:**

1. **QuizGenerator.jsx** - Formulaire de génération
```jsx
import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, CircularProgress, Alert
} from '@mui/material';
import { quizService } from '../api/quizzes';

export default function QuizGenerator() {
  const [text, setText] = useState('');
  const [numQuestions, setNumQuestions] = useState(5);
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('');
  const [theme, setTheme] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleGenerate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const result = await quizService.generateAndSaveQuiz(
        text, numQuestions, title, subject, theme
      );
      setSuccess(`Quiz créé avec succès! ${result.question_count} questions générées.`);
      // Reset form
      setText('');
      setTitle('');
      setSubject('');
      setTheme('');
      setNumQuestions(5);
    } catch (err) {
      setError(err.response?.data?.error || 'Erreur lors de la génération');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Générer un Quiz avec IA
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <Box component="form" onSubmit={handleGenerate}>
          <TextField
            label="Titre du Quiz"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            fullWidth
            required
            margin="normal"
          />
          
          <TextField
            label="Sujet"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            fullWidth
            margin="normal"
          />
          
          <TextField
            label="Thème"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            fullWidth
            margin="normal"
          />

          <TextField
            label="Texte source"
            value={text}
            onChange={(e) => setText(e.target.value)}
            multiline
            rows={8}
            fullWidth
            required
            margin="normal"
            placeholder="Collez ici le contenu pédagogique..."
          />

          <TextField
            label="Nombre de questions"
            type="number"
            value={numQuestions}
            onChange={(e) => setNumQuestions(parseInt(e.target.value))}
            inputProps={{ min: 1, max: 10 }}
            fullWidth
            margin="normal"
          />

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            sx={{ mt: 2 }}
          >
            {loading ? <CircularProgress size={24} /> : 'Générer le Quiz'}
          </Button>
        </Box>
      </CardContent>
    </Card>
  );
}
```

2. **QuizList.jsx** - Liste des quiz créés
```jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Button,
  List, ListItem, ListItemText, Chip, IconButton
} from '@mui/material';
import { Edit, Delete, Visibility, Publish } from '@mui/icons-material';
import { quizService } from '../api/quizzes';

export default function QuizList({ onEdit }) {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizzes();
  }, []);

  const loadQuizzes = async () => {
    try {
      const data = await quizService.getMyQuizzes();
      setQuizzes(data);
    } catch (error) {
      console.error('Error loading quizzes:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePublish = async (quizId) => {
    try {
      await quizService.publishQuiz(quizId);
      loadQuizzes();
    } catch (error) {
      console.error('Error publishing quiz:', error);
    }
  };

  const handleDelete = async (quizId) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer ce quiz?')) {
      try {
        await quizService.deleteQuiz(quizId);
        loadQuizzes();
      } catch (error) {
        console.error('Error deleting quiz:', error);
      }
    }
  };

  if (loading) return <Typography>Chargement...</Typography>;

  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Mes Quiz ({quizzes.length})
        </Typography>

        <List>
          {quizzes.map((quiz) => (
            <ListItem
              key={quiz.id}
              secondaryAction={
                <Box>
                  {!quiz.is_published && (
                    <IconButton onClick={() => handlePublish(quiz.id)}>
                      <Publish />
                    </IconButton>
                  )}
                  <IconButton onClick={() => onEdit(quiz.id)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(quiz.id)}>
                    <Delete />
                  </IconButton>
                </Box>
              }
            >
              <ListItemText
                primary={quiz.title}
                secondary={`${quiz.question_count} questions - ${quiz.subject}`}
              />
              <Chip
                label={quiz.is_published ? 'Publié' : 'Brouillon'}
                color={quiz.is_published ? 'success' : 'default'}
                size="small"
              />
            </ListItem>
          ))}
        </List>
      </CardContent>
    </Card>
  );
}
```

**Tâches:**
- [ ] Créer QuizGenerator.jsx
- [ ] Créer QuizList.jsx
- [ ] Créer QuizEditor.jsx (optionnel)
- [ ] Intégrer dans DashboardFormateur.jsx
- [ ] Tester la génération end-to-end
- [ ] Tester la publication et suppression

### Étape 1.7: Interface Apprenant - Passer des Quiz (4-5 heures)

**Objectif:** Permettre aux apprenants de prendre des quiz

**Fichiers à créer:**
- `src/components/QuizTaker.jsx`
- `src/components/QuizResults.jsx`
- `src/pages/TakeQuiz.jsx`

**Composants:**

1. **QuizTaker.jsx** - Interface pour passer un quiz
```jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Radio,
  RadioGroup, FormControlLabel, Button, LinearProgress
} from '@mui/material';
import { quizService } from '../api/quizzes';
import { useNavigate, useParams } from 'react-router-dom';

export default function QuizTaker() {
  const { quizId } = useParams();
  const navigate = useNavigate();
  
  const [quiz, setQuiz] = useState(null);
  const [attempt, setAttempt] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadQuizAndStart();
  }, [quizId]);

  const loadQuizAndStart = async () => {
    try {
      const quizData = await quizService.getQuizDetails(quizId);
      setQuiz(quizData);
      
      const attemptData = await quizService.startQuiz(quizId);
      setAttempt(attemptData);
    } catch (error) {
      console.error('Error starting quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerSelect = (questionId, answerId) => {
    setAnswers({
      ...answers,
      [questionId]: answerId
    });
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = async () => {
    try {
      const answersArray = Object.keys(answers).map(questionId => ({
        question_id: parseInt(questionId),
        answer_id: answers[questionId]
      }));

      await quizService.submitQuizAnswers(attempt.id, answersArray);
      navigate(`/quiz/results/${attempt.id}`);
    } catch (error) {
      console.error('Error submitting quiz:', error);
    }
  };

  if (loading || !quiz) return <Typography>Chargement...</Typography>;

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        {quiz.title}
      </Typography>

      <LinearProgress variant="determinate" value={progress} sx={{ mb: 3 }} />

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Question {currentQuestion + 1} sur {quiz.questions.length}
          </Typography>

          <Typography variant="body1" sx={{ mb: 3 }}>
            {question.question_text}
          </Typography>

          <RadioGroup
            value={answers[question.id] || ''}
            onChange={(e) => handleAnswerSelect(question.id, parseInt(e.target.value))}
          >
            {question.answers.map((answer) => (
              <FormControlLabel
                key={answer.id}
                value={answer.id}
                control={<Radio />}
                label={answer.answer_text}
              />
            ))}
          </RadioGroup>
        </CardContent>
      </Card>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
        <Button
          variant="outlined"
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
        >
          Précédent
        </Button>

        {currentQuestion < quiz.questions.length - 1 ? (
          <Button
            variant="contained"
            onClick={handleNext}
            disabled={!answers[question.id]}
          >
            Suivant
          </Button>
        ) : (
          <Button
            variant="contained"
            color="success"
            onClick={handleSubmit}
            disabled={Object.keys(answers).length !== quiz.questions.length}
          >
            Terminer le Quiz
          </Button>
        )}
      </Box>
    </Box>
  );
}
```

2. **QuizResults.jsx** - Affichage des résultats
```jsx
import React, { useState, useEffect } from 'react';
import {
  Box, Card, CardContent, Typography, Alert,
  List, ListItem, ListItemText, Chip
} from '@mui/material';
import { CheckCircle, Cancel } from '@mui/icons-material';
import { quizService } from '../api/quizzes';
import { useParams } from 'react-router-dom';

export default function QuizResults() {
  const { attemptId } = useParams();
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResults();
  }, [attemptId]);

  const loadResults = async () => {
    try {
      const data = await quizService.getQuizResults(attemptId);
      setResults(data);
    } catch (error) {
      console.error('Error loading results:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || !results) return <Typography>Chargement...</Typography>;

  const { attempt, answers, questions } = results;
  const percentage = attempt.percentage;
  const passed = percentage >= 50;

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Résultats du Quiz
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Score: {attempt.score} / {attempt.max_score}
          </Typography>
          <Typography variant="h6" color={passed ? 'success.main' : 'error.main'}>
            {percentage.toFixed(1)}% - {passed ? 'Réussi ✓' : 'Échoué ✗'}
          </Typography>
        </CardContent>
      </Card>

      <Typography variant="h6" gutterBottom>
        Détails des Réponses
      </Typography>

      {questions.map((question, idx) => {
        const userAnswer = answers.find(a => a.question === question.id);
        const correctAnswer = question.answers.find(a => a.is_correct);

        return (
          <Card key={question.id} sx={{ mb: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="subtitle1" sx={{ flexGrow: 1 }}>
                  Question {idx + 1}
                </Typography>
                {userAnswer?.is_correct ? (
                  <CheckCircle color="success" />
                ) : (
                  <Cancel color="error" />
                )}
              </Box>

              <Typography variant="body1" sx={{ mb: 2 }}>
                {question.question_text}
              </Typography>

              <List dense>
                {question.answers.map((answer) => {
                  const isUserAnswer = userAnswer?.selected_answer === answer.id;
                  const isCorrect = answer.is_correct;

                  return (
                    <ListItem key={answer.id}>
                      <ListItemText
                        primary={answer.answer_text}
                        sx={{
                          color: isCorrect ? 'success.main' : 'inherit',
                          fontWeight: isUserAnswer ? 'bold' : 'normal'
                        }}
                      />
                      {isUserAnswer && (
                        <Chip
                          label="Votre réponse"
                          size="small"
                          color={isCorrect ? 'success' : 'error'}
                        />
                      )}
                      {isCorrect && !isUserAnswer && (
                        <Chip
                          label="Réponse correcte"
                          size="small"
                          color="success"
                          variant="outlined"
                        />
                      )}
                    </ListItem>
                  );
                })}
              </List>

              {question.explanation && (
                <Alert severity="info" sx={{ mt: 2 }}>
                  <Typography variant="body2">
                    <strong>Explication:</strong> {question.explanation}
                  </Typography>
                </Alert>
              )}
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}
```

**Tâches:**
- [ ] Créer QuizTaker.jsx
- [ ] Créer QuizResults.jsx
- [ ] Ajouter les routes dans App.jsx
- [ ] Modifier DashboardApprenant pour afficher les quiz disponibles
- [ ] Tester le flux complet de prise de quiz

### Étape 1.8: Tests (3-4 heures)

**Objectif:** Tester tous les nouveaux composants et endpoints

**Tests Backend:**
```python
# backend/pedagogical/tests.py
class QuizAPITests(TestCase):
    def test_create_quiz(self):
        # Test creation de quiz
        pass
    
    def test_start_quiz(self):
        # Test démarrage d'un quiz
        pass
    
    def test_submit_quiz(self):
        # Test soumission des réponses
        pass
    
    def test_quiz_scoring(self):
        # Test calcul du score
        pass
    
    def test_generate_and_save(self):
        # Test génération via OpenAI
        pass
```

**Tests Frontend:**
```javascript
// src/components/__tests__/QuizTaker.test.jsx
describe('QuizTaker', () => {
  test('renders quiz questions', () => {
    // Test affichage des questions
  });
  
  test('allows answer selection', () => {
    // Test sélection des réponses
  });
  
  test('navigates between questions', () => {
    // Test navigation
  });
  
  test('submits quiz on completion', () => {
    // Test soumission
  });
});
```

**Tâches:**
- [ ] Créer 8-10 tests backend pour les quiz
- [ ] Créer 6-8 tests frontend pour les composants
- [ ] Tester tous les scénarios (succès, erreurs, edge cases)
- [ ] Vérifier la couverture de tests (>70%)

### Étape 1.9: Documentation (1-2 heures)

**Fichiers à créer/modifier:**
- `QUIZ_SYSTEM.md` - Documentation complète du système de quiz
- `README.md` - Mise à jour avec les nouvelles fonctionnalités
- `API_DOCUMENTATION.md` - Nouveaux endpoints

**Tâches:**
- [ ] Documenter les nouveaux modèles
- [ ] Documenter tous les endpoints avec exemples
- [ ] Créer un guide utilisateur pour formateurs
- [ ] Créer un guide utilisateur pour apprenants
- [ ] Mettre à jour les captures d'écran

## 📊 Estimation Totale

**Temps de développement estimé:** 22-30 heures

**Répartition:**
- Backend (modèles, API, tests): 10-12 heures
- Frontend (composants, pages, tests): 10-13 heures
- Documentation et validation: 2-5 heures

**Complexité:** Moyenne à élevée

## 🎯 Critères de Succès

La Phase 1 sera considérée comme réussie si:

1. ✅ Un formateur peut générer un quiz depuis un document
2. ✅ Le quiz est sauvegardé dans la base de données
3. ✅ Un formateur peut publier, éditer, supprimer ses quiz
4. ✅ Un apprenant peut voir les quiz disponibles
5. ✅ Un apprenant peut passer un quiz de manière interactive
6. ✅ Le système calcule automatiquement le score
7. ✅ L'apprenant voit ses résultats avec explications
8. ✅ La progression est mise à jour automatiquement
9. ✅ Au moins 80% des tests passent
10. ✅ La documentation est complète

## 🔮 Phases Suivantes (Après Phase 1)

### Phase 2: Fonctionnalités Avancées
- Différents types de questions (vrai/faux, réponse libre)
- Quiz chronométrés
- Quiz à plusieurs tentatives
- Banque de questions réutilisables
- Import/Export de quiz

### Phase 3: Analytics et Reporting
- Statistiques détaillées pour formateurs
- Dashboard analytique
- Rapports de performance
- Identification des questions difficiles
- Recommandations personnalisées

### Phase 4: Collaboration
- Partage de quiz entre formateurs
- Commentaires et feedback sur les quiz
- Quiz collaboratifs
- Classements et compétitions

### Phase 5: Optimisations
- Support multi-langues
- Mode hors-ligne
- Notifications push
- Export PDF des résultats
- Intégration avec d'autres plateformes

## 📞 Support et Questions

Pour toute question sur ce roadmap:
1. Consulter la documentation existante
2. Vérifier les tests existants pour des exemples
3. Regarder les implémentations similaires dans le code actuel

## 🎉 Conclusion

La Phase 1 représente une évolution majeure de la plateforme, transformant un système de génération de quiz "statique" en un système complet et interactif. Cette étape est essentielle car elle connecte toutes les pièces existantes (authentification, documents, progression) en un système cohérent et utilisable.

Le succès de cette phase permettra aux utilisateurs de réellement utiliser la plateforme pour créer, distribuer et passer des quiz éducatifs, réalisant ainsi la vision initiale du projet.

---

**Prêt à commencer?** Je recommande de débuter par l'Étape 1.1 (Modèles de données) et de progresser séquentiellement. Chaque étape construit sur la précédente, donc l'ordre est important.

**Bonne chance! 🚀**
