from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import File, Progress, Quiz, QuizAssignment, EvaluationSession, QuestionResponse, CognitiveProfile

User = get_user_model()


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model."""
    password = serializers.CharField(write_only=True, required=True, style={'input_type': 'password'})
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'password', 'user_type', 'first_name', 'last_name', 'date_joined']
        read_only_fields = ['id', 'date_joined']
    
    def create(self, validated_data):
        """Create a new user with encrypted password."""
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password'],
            user_type=validated_data.get('user_type', 'apprenant'),
            first_name=validated_data.get('first_name', ''),
            last_name=validated_data.get('last_name', '')
        )
        return user


class FileSerializer(serializers.ModelSerializer):
    """Serializer for File model."""
    uploaded_by_username = serializers.CharField(source='uploaded_by.username', read_only=True)
    file_url = serializers.SerializerMethodField()
    
    class Meta:
        model = File
        fields = ['id', 'title', 'subject', 'theme', 'file', 'file_url', 'uploaded_by', 'uploaded_by_username', 'uploaded_at']
        read_only_fields = ['id', 'uploaded_by', 'uploaded_at']
    
    def get_file_url(self, obj):
        """Get the full URL for the file."""
        request = self.context.get('request')
        if obj.file and request:
            return request.build_absolute_uri(obj.file.url)
        return None


class ProgressSerializer(serializers.ModelSerializer):
    """Serializer for Progress model."""
    username = serializers.CharField(source='user.username', read_only=True)
    percentage = serializers.ReadOnlyField()
    
    class Meta:
        model = Progress
        fields = ['id', 'user', 'username', 'quiz_title', 'quiz_subject', 'score', 'max_score', 
                  'percentage', 'completed', 'completed_at', 'created_at', 'updated_at']
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']


class ProgressStatsSerializer(serializers.Serializer):
    """Serializer for progress statistics."""
    total_quizzes = serializers.IntegerField()
    completed_quizzes = serializers.IntegerField()
    average_score = serializers.FloatField()
    completion_percentage = serializers.FloatField()


class QuizSerializer(serializers.ModelSerializer):
    """Serializer for Quiz model."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    num_questions = serializers.ReadOnlyField()
    assigned_learners = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'subject', 'description', 'questions', 'created_by', 
                  'created_by_username', 'num_questions', 'assigned_learners', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_assigned_learners(self, obj):
        """Get list of learner IDs assigned to this quiz."""
        assignments = obj.assignments.all()
        return [assignment.learner.id for assignment in assignments]


class QuizAssignmentSerializer(serializers.ModelSerializer):
    """Serializer for QuizAssignment model."""
    quiz_title = serializers.CharField(source='quiz.title', read_only=True)
    learner_username = serializers.CharField(source='learner.username', read_only=True)
    
    class Meta:
        model = QuizAssignment
        fields = ['id', 'quiz', 'quiz_title', 'learner', 'learner_username', 'assigned_at']
        read_only_fields = ['id', 'assigned_at']


class QuizListSerializer(serializers.ModelSerializer):
    """Simplified serializer for quiz lists (without full questions)."""
    created_by_username = serializers.CharField(source='created_by.username', read_only=True)
    num_questions = serializers.ReadOnlyField()
    num_assigned_learners = serializers.SerializerMethodField()
    
    class Meta:
        model = Quiz
        fields = ['id', 'title', 'subject', 'description', 'num_questions', 
                  'created_by_username', 'num_assigned_learners', 'created_at', 'updated_at']
        read_only_fields = ['id', 'created_by', 'created_at', 'updated_at']
    
    def get_num_assigned_learners(self, obj):
        """Get count of learners assigned to this quiz."""
        return obj.assignments.count()


class QuestionResponseSerializer(serializers.ModelSerializer):
    """Serializer for QuestionResponse model."""
    
    class Meta:
        model = QuestionResponse
        fields = [
            'id', 'session', 'question_id', 'question_text', 'question_type',
            'competence_type', 'answer', 'correct_answer', 'is_correct',
            'response_time_ms', 'attempts', 'help_used', 'help_type', 'created_at'
        ]
        read_only_fields = ['id', 'created_at']


class EvaluationSessionSerializer(serializers.ModelSerializer):
    """Serializer for EvaluationSession model."""
    learner_username = serializers.CharField(source='learner.username', read_only=True)
    responses = QuestionResponseSerializer(many=True, read_only=True)
    num_responses = serializers.SerializerMethodField()
    
    class Meta:
        model = EvaluationSession
        fields = [
            'id', 'learner', 'learner_username', 'quiz', 'session_type',
            'started_at', 'completed_at', 'is_completed', 'responses', 'num_responses'
        ]
        read_only_fields = ['id', 'learner', 'started_at']
    
    def get_num_responses(self, obj):
        """Get the number of responses in this session."""
        return obj.responses.count()


class CognitiveProfileSerializer(serializers.ModelSerializer):
    """Serializer for CognitiveProfile model."""
    learner_username = serializers.CharField(source='learner.username', read_only=True)
    last_evaluation_session_id = serializers.IntegerField(
        source='last_evaluation_session.id',
        read_only=True,
        allow_null=True
    )
    
    class Meta:
        model = CognitiveProfile
        fields = [
            'id', 'learner', 'learner_username', 'strengths', 'weaknesses',
            'learning_style', 'confidence_level', 'recommendations',
            'analysis_data', 'last_evaluation_session', 'last_evaluation_session_id',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'learner', 'created_at', 'updated_at']
