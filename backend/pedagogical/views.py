from rest_framework import viewsets, status, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.db.models import Avg, Count, Q
from django.utils import timezone
from .models import User, File, Progress
from .serializers import (
    UserSerializer, FileSerializer, ProgressSerializer, ProgressStatsSerializer
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
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        """Get current user information."""
        serializer = self.get_serializer(request.user)
        return Response(serializer.data)


class FileViewSet(viewsets.ModelViewSet):
    """ViewSet for File model."""
    queryset = File.objects.all()
    serializer_class = FileSerializer
    
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
