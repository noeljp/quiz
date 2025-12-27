from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import File, Progress

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
