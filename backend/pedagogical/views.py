from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from .models import (
    User, File, Progress, Quiz, QuizAssignment,
    EvaluationSession, QuestionResponse, CognitiveProfile
)
from .serializers import (
    UserSerializer, FileSerializer, ProgressSerializer, ProgressStatsSerializer,
    QuizSerializer, QuizAssignmentSerializer, QuizListSerializer,
    EvaluationSessionSerializer, QuestionResponseSerializer, CognitiveProfileSerializer
)
import os
import json
from PyPDF2 import PdfReader
from docx import Document as DocxDocument
import openai


class IsFormateur(permissions.BasePermission):
    """
    Custom permission to only allow formateurs to access certain endpoints.
    """
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'user_type')
            and request.user.user_type == 'formateur'
        )


class IsApprenant(permissions.BasePermission):
    """
    Custom permission to only allow apprenants to access certain endpoints.
    """
    def has_permission(self, request, view):
        return (
            request.user 
            and request.user.is_authenticated 
            and hasattr(request.user, 'user_type')
            and request.user.user_type == 'apprenant'
        )


class RegisterView(APIView):
    """API endpoint for user registration."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        serializer = UserSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    """API endpoint for user login."""
    permission_classes = [permissions.AllowAny]
    
    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response(
                {'error': 'Username and password are required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user = authenticate(username=username, password=password)
        
        if user is not None:
            refresh = RefreshToken.for_user(user)
            return Response({
                'user': UserSerializer(user).data,
                'tokens': {
                    'refresh': str(refresh),
                    'access': str(refresh.access_token),
                }
            })
        
        return Response(
            {'error': 'Invalid credentials'},
            status=status.HTTP_401_UNAUTHORIZED
        )


class UserViewSet(viewsets.ModelViewSet):
    """ViewSet for User model."""
    queryset = User.objects.all()
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class FileViewSet(viewsets.ModelViewSet):
    """ViewSet for File model."""
    queryset = File.objects.all()
    serializer_class = FileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        """
        Use IsFormateur permission for create, update, and delete.
        Use IsAuthenticated for list and retrieve.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsFormateur()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Filter files based on user type."""
        queryset = File.objects.all()
        
        # If user is formateur, show only their files
        if self.request.user.user_type == 'formateur':
            queryset = queryset.filter(uploaded_by=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the uploaded_by field to the current user."""
        serializer.save(uploaded_by=self.request.user)


class ProgressViewSet(viewsets.ModelViewSet):
    """ViewSet for Progress model."""
    queryset = Progress.objects.all()
    serializer_class = ProgressSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter progress based on user."""
        if self.request.user.user_type == 'apprenant':
            return Progress.objects.filter(user=self.request.user)
        # Formateurs can see all progress
        return Progress.objects.all()
    
    def perform_create(self, serializer):
        """Set the user field to the current user if apprenant."""
        if self.request.user.user_type == 'apprenant':
            serializer.save(user=self.request.user)
        else:
            serializer.save()
    
    def update(self, request, *args, **kwargs):
        """Update progress and set completed_at if completed."""
        instance = self.get_object()
        
        # If marking as completed and it wasn't completed before
        if request.data.get('completed') and not instance.completed:
            # Create a mutable copy of request.data
            data = request.data.copy()
            data['completed_at'] = timezone.now()
            # Create serializer with the modified data
            serializer = self.get_serializer(instance, data=data, partial=True)
            serializer.is_valid(raise_exception=True)
            self.perform_update(serializer)
            return Response(serializer.data)
        
        return super().update(request, *args, **kwargs)
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get progress statistics for the current user."""
        if request.user.user_type != 'apprenant':
            return Response(
                {'error': 'Statistics are only available for learners'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        progress_items = Progress.objects.filter(user=request.user)
        
        total_quizzes = progress_items.count()
        completed_quizzes = progress_items.filter(completed=True).count()
        
        # Calculate average score as percentage
        avg_score = 0
        if total_quizzes > 0:
            scores = progress_items.values_list('score', 'max_score')
            percentages = [(score / max_score * 100) if max_score > 0 else 0 
                          for score, max_score in scores]
            avg_score = sum(percentages) / len(percentages) if percentages else 0
        
        completion_percentage = (completed_quizzes / total_quizzes * 100) if total_quizzes > 0 else 0
        
        stats_data = {
            'total_quizzes': total_quizzes,
            'completed_quizzes': completed_quizzes,
            'average_score': round(avg_score, 2),
            'completion_percentage': round(completion_percentage, 2),
        }
        
        serializer = ProgressStatsSerializer(stats_data)
        return Response(serializer.data)


class DocumentUploadView(APIView):
    """
    API endpoint for document upload and text extraction.
    Supports PDF, DOCX, and TXT files.
    """
    parser_classes = (MultiPartParser,)
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, format=None):
        """Upload a document and extract text from it."""
        # Check if user is a formateur
        if request.user.user_type != 'formateur':
            return Response(
                {'error': 'Seuls les formateurs peuvent téléverser des documents'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Check if file is provided
        if 'file' not in request.FILES:
            return Response(
                {'error': 'Aucun fichier fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        file = request.FILES['file']
        
        # Check file size
        if file.size > settings.MAX_UPLOAD_SIZE:
            return Response(
                {'error': f'Fichier trop volumineux. Taille maximale: {settings.MAX_UPLOAD_SIZE / (1024 * 1024)} MB'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check file extension
        file_ext = os.path.splitext(file.name)[1].lower()
        if file_ext not in settings.ALLOWED_DOCUMENT_EXTENSIONS:
            return Response(
                {'error': f'Format non supporté. Formats acceptés: {", ".join(settings.ALLOWED_DOCUMENT_EXTENSIONS)}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Extract text based on file type
        try:
            if file_ext == '.pdf':
                reader = PdfReader(file)
                text = ''.join([page.extract_text() or '' for page in reader.pages])
            elif file_ext == '.docx':
                doc = DocxDocument(file)
                text = '\n'.join([p.text for p in doc.paragraphs])
            elif file_ext == '.txt':
                text = file.read().decode('utf-8')
            else:
                return Response(
                    {'error': 'Format non supporté'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Check if text was extracted
            if not text or len(text.strip()) == 0:
                return Response(
                    {'error': 'Aucun texte n\'a pu être extrait du document'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            return Response({
                'text': text,
                'filename': file.name,
                'size': file.size,
                'message': 'Texte extrait avec succès'
            })
        
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'extraction du texte: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuizGenerationView(APIView):
    """
    API endpoint for generating quizzes from text using OpenAI API.
    """
    permission_classes = [permissions.IsAuthenticated]
    
    def post(self, request, format=None):
        """Generate quiz questions from provided text using OpenAI."""
        # Check if user is a formateur
        if request.user.user_type != 'formateur':
            return Response(
                {'error': 'Seuls les formateurs peuvent générer des quiz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get text and number of questions from request
        text = request.data.get('text', '')
        num_questions = request.data.get('num_questions', 5)
        
        # Validate inputs
        if not text or len(text.strip()) == 0:
            return Response(
                {'error': 'Aucun texte fourni'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            num_questions = int(num_questions)
            if num_questions < 1 or num_questions > 20:
                return Response(
                    {'error': 'Le nombre de questions doit être entre 1 et 20'},
                    status=status.HTTP_400_BAD_REQUEST
                )
        except (ValueError, TypeError):
            return Response(
                {'error': 'Nombre de questions invalide'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Check if OpenAI API key is configured
        if not settings.OPENAI_API_KEY:
            return Response(
                {'error': 'Clé API OpenAI non configurée'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        # Limit text length to avoid excessive API costs
        if len(text) > settings.MAX_TEXT_LENGTH_FOR_QUIZ:
            text = text[:settings.MAX_TEXT_LENGTH_FOR_QUIZ]
        
        # Generate quiz using OpenAI
        try:
            client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
            
            prompt = f"""À partir du texte suivant, génère {num_questions} questions pédagogiques à choix multiples.

Texte :
\"\"\"{text}\"\"\"

Pour chaque question, fournis :
1. La question
2. Quatre options de réponse (A, B, C, D)
3. La bonne réponse (indiquer la lettre)
4. Une brève explication

Format de réponse en JSON :
{{
  "questions": [
    {{
      "question": "Texte de la question",
      "options": {{
        "A": "Option A",
        "B": "Option B",
        "C": "Option C",
        "D": "Option D"
      }},
      "correct_answer": "A",
      "explanation": "Explication de la bonne réponse"
    }}
  ]
}}"""

            response = client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {"role": "system", "content": "Tu es un assistant pédagogique qui génère des questions de quiz de haute qualité."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=2000
            )
            
            # Extract the generated text
            generated_text = response.choices[0].message.content
            
            # Try to parse as JSON
            try:
                quiz_data = json.loads(generated_text)
                return Response({
                    'quiz': quiz_data,
                    'message': 'Quiz généré avec succès'
                })
            except json.JSONDecodeError:
                # If not valid JSON, return as plain text
                return Response({
                    'quiz_text': generated_text,
                    'message': 'Quiz généré avec succès (format texte)'
                })
        
        except openai.AuthenticationError:
            return Response(
                {'error': 'Erreur d\'authentification avec l\'API OpenAI. Vérifiez votre clé API.'},
                status=status.HTTP_401_UNAUTHORIZED
            )
        except openai.RateLimitError:
            return Response(
                {'error': 'Limite de taux dépassée pour l\'API OpenAI. Réessayez plus tard.'},
                status=status.HTTP_429_TOO_MANY_REQUESTS
            )
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du quiz: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class QuizViewSet(viewsets.ModelViewSet):
    """ViewSet for Quiz model."""
    queryset = Quiz.objects.all()
    serializer_class = QuizSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_serializer_class(self):
        """Use simplified serializer for list view."""
        if self.action == 'list':
            return QuizListSerializer
        return QuizSerializer
    
    def get_permissions(self):
        """
        Use IsFormateur permission for create, update, and delete.
        Use IsAuthenticated for list and retrieve.
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsFormateur()]
        return [permissions.IsAuthenticated()]
    
    def get_queryset(self):
        """Filter quizzes based on user type."""
        queryset = Quiz.objects.all()
        
        # If user is formateur, show only their quizzes
        if self.request.user.user_type == 'formateur':
            queryset = queryset.filter(created_by=self.request.user)
        # If user is apprenant, show only assigned quizzes
        elif self.request.user.user_type == 'apprenant':
            queryset = queryset.filter(assignments__learner=self.request.user)
        
        return queryset
    
    def perform_create(self, serializer):
        """Set the created_by field to the current user."""
        serializer.save(created_by=self.request.user)
    
    def create(self, request, *args, **kwargs):
        """Create a quiz and optionally assign it to learners."""
        # Extract learner_ids if provided
        learner_ids = request.data.get('learner_ids', [])
        
        # Create the quiz
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        quiz = serializer.save(created_by=request.user)
        
        # Assign quiz to learners if provided
        failed_assignments = []
        if learner_ids:
            for learner_id in learner_ids:
                try:
                    learner = User.objects.get(id=learner_id, user_type='apprenant')
                    QuizAssignment.objects.create(quiz=quiz, learner=learner)
                except User.DoesNotExist:
                    failed_assignments.append(learner_id)
        
        response_data = serializer.data
        if failed_assignments:
            response_data['warning'] = f'Certains apprenants n\'ont pas pu être assignés: {failed_assignments}'
        
        headers = self.get_success_headers(serializer.data)
        return Response(response_data, status=status.HTTP_201_CREATED, headers=headers)
    
    def update(self, request, *args, **kwargs):
        """Update a quiz and its assignments."""
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        
        # Extract learner_ids if provided
        learner_ids = request.data.get('learner_ids', None)
        
        # Update the quiz
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        
        # Update assignments if learner_ids is provided
        failed_assignments = []
        if learner_ids is not None:
            # Remove existing assignments
            instance.assignments.all().delete()
            
            # Create new assignments
            for learner_id in learner_ids:
                try:
                    learner = User.objects.get(id=learner_id, user_type='apprenant')
                    QuizAssignment.objects.create(quiz=instance, learner=learner)
                except User.DoesNotExist:
                    failed_assignments.append(learner_id)
        
        response_data = serializer.data
        if failed_assignments:
            response_data['warning'] = f'Certains apprenants n\'ont pas pu être assignés: {failed_assignments}'
        
        return Response(response_data)
    
    @action(detail=False, methods=['get'])
    def learners(self, request):
        """Get list of all learners (apprenants) for assignment."""
        if request.user.user_type != 'formateur':
            return Response(
                {'error': 'Seuls les formateurs peuvent accéder à cette ressource'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        learners = User.objects.filter(user_type='apprenant')
        serializer = UserSerializer(learners, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['get'])
    def stats(self, request, pk=None):
        """Get statistics for a specific quiz (for formateurs)."""
        if request.user.user_type != 'formateur':
            return Response(
                {'error': 'Seuls les formateurs peuvent accéder à cette ressource'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        quiz = self.get_object()
        
        # Check if the quiz belongs to this formateur
        if quiz.created_by != request.user:
            return Response(
                {'error': 'Vous ne pouvez voir que les statistiques de vos propres quiz'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Get all learners assigned to this quiz
        assignments = quiz.assignments.all()
        learner_stats = []
        
        for assignment in assignments:
            learner = assignment.learner
            
            # Get progress for this learner on this quiz
            progress = Progress.objects.filter(
                user=learner,
                quiz=quiz
            ).first()
            
            learner_data = {
                'learner_id': learner.id,
                'learner_username': learner.username,
                'learner_name': f"{learner.first_name} {learner.last_name}".strip() or learner.username,
                'assigned_at': assignment.assigned_at,
                'completed': progress.completed if progress else False,
                'completed_at': progress.completed_at if progress else None,
                'score': progress.score if progress else 0,
                'max_score': progress.max_score if progress else quiz.num_questions * 10,
                'percentage': progress.percentage if progress else 0,
            }
            learner_stats.append(learner_data)
        
        # Calculate overall statistics
        total_assigned = len(learner_stats)
        total_completed = sum(1 for stat in learner_stats if stat['completed'])
        completion_rate = (total_completed / total_assigned * 100) if total_assigned > 0 else 0
        
        # Calculate average score for completed quizzes
        completed_scores = [stat['percentage'] for stat in learner_stats if stat['completed']]
        average_score = sum(completed_scores) / len(completed_scores) if completed_scores else 0
        
        return Response({
            'quiz_id': quiz.id,
            'quiz_title': quiz.title,
            'quiz_subject': quiz.subject,
            'num_questions': quiz.num_questions,
            'total_assigned': total_assigned,
            'total_completed': total_completed,
            'completion_rate': round(completion_rate, 2),
            'average_score': round(average_score, 2),
            'learner_stats': learner_stats
        })


class EvaluationSessionViewSet(viewsets.ModelViewSet):
    """ViewSet for EvaluationSession model."""
    queryset = EvaluationSession.objects.all()
    serializer_class = EvaluationSessionSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter sessions based on user type."""
        if self.request.user.user_type == 'apprenant':
            return EvaluationSession.objects.filter(learner=self.request.user)
        # Formateurs can see all sessions
        return EvaluationSession.objects.all()
    
    def perform_create(self, serializer):
        """Set the learner field to the current user if apprenant."""
        if self.request.user.user_type == 'apprenant':
            serializer.save(learner=self.request.user)
        else:
            serializer.save()
    
    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        """Complete an evaluation session and trigger analysis."""
        session = self.get_object()
        
        if session.is_completed:
            return Response(
                {'error': 'Cette session est déjà terminée'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        session.completed_at = timezone.now()
        session.is_completed = True
        session.save()
        
        # Trigger cognitive profile analysis
        try:
            profile = self._analyze_session(session)
            serializer = self.get_serializer(session)
            return Response({
                'session': serializer.data,
                'profile': CognitiveProfileSerializer(profile).data,
                'message': 'Session complétée et profil cognitif généré'
            })
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de l\'analyse: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _analyze_session(self, session):
        """Analyze evaluation session using OpenAI and generate cognitive profile."""
        responses = session.responses.all()
        
        # Calculate cognitive indicators
        indicators = self._calculate_indicators(responses)
        
        # Use OpenAI to analyze and generate pedagogical insights
        if settings.OPENAI_API_KEY:
            try:
                ai_analysis = self._get_ai_analysis(indicators, responses)
            except Exception as e:
                # Fallback to rule-based analysis if AI fails
                ai_analysis = self._fallback_analysis(indicators)
        else:
            ai_analysis = self._fallback_analysis(indicators)
        
        # Create or update cognitive profile
        profile, created = CognitiveProfile.objects.update_or_create(
            learner=session.learner,
            defaults={
                'strengths': ai_analysis.get('strengths', []),
                'weaknesses': ai_analysis.get('weaknesses', []),
                'learning_style': ai_analysis.get('learning_style', ''),
                'confidence_level': ai_analysis.get('confidence_level', 'moyen'),
                'recommendations': ai_analysis.get('recommendations', []),
                'analysis_data': indicators,
                'last_evaluation_session': session
            }
        )
        
        return profile
    
    def _calculate_indicators(self, responses):
        """Calculate cognitive indicators from responses."""
        if not responses:
            return {}
        
        # Group by competence type
        by_competence = {}
        for resp in responses:
            comp = resp.competence_type
            if comp not in by_competence:
                by_competence[comp] = []
            by_competence[comp].append(resp)
        
        # Calculate indicators
        indicators = {
            'total_responses': len(responses),
            'overall_success_rate': sum(1 for r in responses if r.is_correct) / len(responses) * 100,
            'average_response_time': sum(r.response_time_ms for r in responses) / len(responses),
            'help_usage_rate': sum(1 for r in responses if r.help_used) / len(responses) * 100,
            'by_competence': {}
        }
        
        # Competence-specific indicators
        for comp, comp_responses in by_competence.items():
            indicators['by_competence'][comp] = {
                'count': len(comp_responses),
                'success_rate': sum(1 for r in comp_responses if r.is_correct) / len(comp_responses) * 100,
                'avg_time': sum(r.response_time_ms for r in comp_responses) / len(comp_responses),
                'help_rate': sum(1 for r in comp_responses if r.help_used) / len(comp_responses) * 100,
                'avg_attempts': sum(r.attempts for r in comp_responses) / len(comp_responses)
            }
        
        # Response time variability
        times = [r.response_time_ms for r in responses]
        avg_time = sum(times) / len(times)
        variance = sum((t - avg_time) ** 2 for t in times) / len(times)
        indicators['response_time_variability'] = variance ** 0.5
        
        return indicators
    
    def _get_ai_analysis(self, indicators, responses):
        """Use OpenAI to generate pedagogical insights."""
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        # Prepare data summary for AI
        summary = {
            'total_questions': indicators['total_responses'],
            'success_rate': round(indicators['overall_success_rate'], 2),
            'avg_response_time_seconds': round(indicators['average_response_time'] / 1000, 2),
            'help_usage': round(indicators['help_usage_rate'], 2),
            'competences': indicators['by_competence']
        }
        
        prompt = f"""En tant qu'expert pédagogique, analyse ces résultats d'évaluation diagnostique d'un élève.

Données d'évaluation :
{json.dumps(summary, indent=2, ensure_ascii=False)}

Consignes STRICTES :
1. Tu dois formuler des HYPOTHÈSES PÉDAGOGIQUES, JAMAIS de diagnostics médicaux
2. Identifie OBLIGATOIREMENT au moins 2 forces cognitives
3. Identifie les fragilités possibles (pas plus de 3)
4. Propose un style d'apprentissage (visuel/logique/guidé)
5. Donne 3-4 recommandations pédagogiques concrètes

Format de réponse JSON STRICTEMENT :
{{
  "strengths": ["force1", "force2"],
  "weaknesses": ["fragilité1", "fragilité2"],
  "learning_style": "style d'apprentissage",
  "confidence_level": "faible|moyen|élevé",
  "recommendations": ["recommandation1", "recommandation2", "recommandation3"],
  "reasoning": "Explication brève de l'analyse"
}}"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un expert pédagogique qui analyse les performances d'élèves pour identifier leurs forces et adapter l'enseignement. Tu ne poses JAMAIS de diagnostic médical."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=1000
        )
        
        ai_text = response.choices[0].message.content
        
        try:
            return json.loads(ai_text)
        except json.JSONDecodeError:
            # Try to extract JSON from markdown code blocks
            if '```json' in ai_text:
                ai_text = ai_text.split('```json')[1].split('```')[0].strip()
            elif '```' in ai_text:
                ai_text = ai_text.split('```')[1].split('```')[0].strip()
            return json.loads(ai_text)
    
    def _fallback_analysis(self, indicators):
        """Rule-based analysis as fallback."""
        by_comp = indicators.get('by_competence', {})
        
        # Identify strengths (success rate > 70%)
        strengths = [
            comp for comp, data in by_comp.items()
            if data['success_rate'] > 70
        ]
        
        # Identify weaknesses (success rate < 50%)
        weaknesses = [
            comp for comp, data in by_comp.items()
            if data['success_rate'] < 50
        ]
        
        # Determine learning style
        help_rate = indicators.get('help_usage_rate', 0)
        avg_time = indicators.get('average_response_time', 0)
        
        if help_rate < 20 and avg_time < 10000:
            learning_style = "autonome et rapide"
        elif help_rate > 50:
            learning_style = "guidé avec étayage"
        else:
            learning_style = "équilibré"
        
        # Confidence level
        success_rate = indicators.get('overall_success_rate', 0)
        if success_rate > 70:
            confidence = 'élevé'
        elif success_rate > 50:
            confidence = 'moyen'
        else:
            confidence = 'faible'
        
        return {
            'strengths': strengths[:2] if strengths else ['persévérance'],
            'weaknesses': weaknesses[:3],
            'learning_style': learning_style,
            'confidence_level': confidence,
            'recommendations': [
                f"Valoriser les compétences en {strengths[0] if strengths else 'réflexion'}",
                f"Renforcer progressivement {weaknesses[0] if weaknesses else 'les bases'}",
                "Adapter le rythme selon les besoins"
            ]
        }


class QuestionResponseViewSet(viewsets.ModelViewSet):
    """ViewSet for QuestionResponse model."""
    queryset = QuestionResponse.objects.all()
    serializer_class = QuestionResponseSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter responses based on user type and session."""
        user = self.request.user
        if user.user_type == 'apprenant':
            # Learners can only see responses from their own sessions
            return QuestionResponse.objects.filter(session__learner=user)
        # Formateurs can see all responses
        return QuestionResponse.objects.all()
    
    @action(detail=True, methods=['post'])
    def generate_feedback(self, request, pk=None):
        """Generate personalized feedback for a response using AI."""
        response_obj = self.get_object()
        
        if not settings.OPENAI_API_KEY:
            return Response(
                {'error': 'OpenAI API non configurée'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        
        try:
            feedback = self._generate_ai_feedback(response_obj)
            return Response({'feedback': feedback})
        except Exception as e:
            return Response(
                {'error': f'Erreur lors de la génération du feedback: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    def _generate_ai_feedback(self, response_obj):
        """Generate adaptive feedback using OpenAI."""
        client = openai.OpenAI(api_key=settings.OPENAI_API_KEY)
        
        context = {
            'question': response_obj.question_text,
            'student_answer': response_obj.answer,
            'correct_answer': response_obj.correct_answer,
            'is_correct': response_obj.is_correct,
            'time_taken': response_obj.response_time_ms / 1000,
            'attempts': response_obj.attempts,
            'help_used': response_obj.help_used
        }
        
        prompt = f"""En tant qu'enseignant bienveillant, donne un feedback pédagogique à un élève.

Question : {context['question']}
Réponse de l'élève : {context['student_answer']}
Réponse correcte : {context['correct_answer']}
Résultat : {"✓ Correct" if context['is_correct'] else "✗ Incorrect"}
Temps de réponse : {context['time_taken']} secondes
Tentatives : {context['attempts']}
Aide utilisée : {"Oui" if context['help_used'] else "Non"}

Consignes pour le feedback :
1. VALORISE le raisonnement, même si la réponse est incorrecte
2. EXPLIQUE l'erreur sans culpabiliser
3. PROPOSE une stratégie alternative si nécessaire
4. Reste BIENVEILLANT et ENCOURAGEANT
5. Maximum 3-4 phrases

Ton feedback :"""

        response = client.chat.completions.create(
            model="gpt-3.5-turbo",
            messages=[
                {
                    "role": "system",
                    "content": "Tu es un enseignant bienveillant qui donne des feedbacks constructifs et encourageants."
                },
                {"role": "user", "content": prompt}
            ],
            temperature=0.7,
            max_tokens=200
        )
        
        return response.choices[0].message.content


class CognitiveProfileViewSet(viewsets.ModelViewSet):
    """ViewSet for CognitiveProfile model."""
    queryset = CognitiveProfile.objects.all()
    serializer_class = CognitiveProfileSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        """Filter profiles based on user type."""
        if self.request.user.user_type == 'apprenant':
            return CognitiveProfile.objects.filter(learner=self.request.user)
        # Formateurs can see all profiles
        return CognitiveProfile.objects.all()
    
    @action(detail=False, methods=['get'])
    def my_profile(self, request):
        """Get the cognitive profile of the current user."""
        if request.user.user_type != 'apprenant':
            return Response(
                {'error': 'Seuls les apprenants ont un profil cognitif'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            profile = CognitiveProfile.objects.get(learner=request.user)
            serializer = self.get_serializer(profile)
            return Response(serializer.data)
        except CognitiveProfile.DoesNotExist:
            return Response(
                {'message': 'Aucun profil cognitif disponible. Complétez une évaluation diagnostique.'},
                status=status.HTTP_404_NOT_FOUND
            )
