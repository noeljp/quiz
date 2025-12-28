from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.utils import timezone
from django.conf import settings
from .models import User, File, Progress
from .serializers import (
    UserSerializer, FileSerializer, ProgressSerializer, ProgressStatsSerializer
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
        return request.user and request.user.is_authenticated and request.user.user_type == 'formateur'


class IsApprenant(permissions.BasePermission):
    """
    Custom permission to only allow apprenants to access certain endpoints.
    """
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.user_type == 'apprenant'


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
