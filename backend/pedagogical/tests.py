from django.test import TestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from .models import User
import io


class DocumentUploadTests(TestCase):
    """Tests for the document upload endpoint."""
    
    def setUp(self):
        """Set up test client and create a test user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            user_type='formateur'
        )
        self.client.force_authenticate(user=self.user)
        self.upload_url = reverse('document-upload')
    
    def test_upload_txt_file(self):
        """Test uploading a text file."""
        content = b"This is test content for quiz generation."
        file = SimpleUploadedFile("test.txt", content, content_type="text/plain")
        
        response = self.client.post(self.upload_url, {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text', response.data)
        self.assertEqual(response.data['text'], content.decode('utf-8'))
        self.assertEqual(response.data['file_type'], '.txt')
    
    def test_upload_without_authentication(self):
        """Test that upload requires authentication."""
        self.client.force_authenticate(user=None)
        content = b"Test content"
        file = SimpleUploadedFile("test.txt", content, content_type="text/plain")
        
        response = self.client.post(self.upload_url, {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_upload_without_file(self):
        """Test upload endpoint without providing a file."""
        response = self.client.post(self.upload_url, {}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_unsupported_format(self):
        """Test uploading an unsupported file format."""
        content = b"Some content"
        file = SimpleUploadedFile("test.exe", content, content_type="application/x-msdownload")
        
        response = self.client.post(self.upload_url, {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_large_file(self):
        """Test uploading a file that exceeds size limit."""
        # Create a file larger than MAX_UPLOAD_SIZE
        large_content = b"x" * (settings.MAX_UPLOAD_SIZE + 1)
        file = SimpleUploadedFile("large.txt", large_content, content_type="text/plain")
        
        response = self.client.post(self.upload_url, {'file': file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)


class GenerateQuizTests(TestCase):
    """Tests for the quiz generation endpoint."""
    
    def setUp(self):
        """Set up test client and create a test user."""
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='testuser',
            password='testpass123',
            user_type='apprenant'
        )
        self.client.force_authenticate(user=self.user)
        self.quiz_url = reverse('generate-quiz')
    
    def test_generate_quiz_without_text(self):
        """Test quiz generation without providing text."""
        response = self.client.post(self.quiz_url, {}, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_generate_quiz_without_authentication(self):
        """Test that quiz generation requires authentication."""
        self.client.force_authenticate(user=None)
        data = {'text': 'Some text for quiz generation'}
        
        response = self.client.post(self.quiz_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_generate_quiz_invalid_num_questions(self):
        """Test quiz generation with invalid number of questions."""
        data = {
            'text': 'Sample text',
            'num_questions': 15  # More than max allowed
        }
        
        response = self.client.post(self.quiz_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_generate_quiz_without_api_key(self):
        """Test quiz generation when OpenAI API key is not configured."""
        # Temporarily remove the API key
        original_key = settings.OPENAI_API_KEY
        settings.OPENAI_API_KEY = ''
        
        data = {
            'text': 'Sample text for quiz generation',
            'num_questions': 5
        }
        
        response = self.client.post(self.quiz_url, data, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)
        
        # Restore the original key
        settings.OPENAI_API_KEY = original_key
