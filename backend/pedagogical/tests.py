from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from django.conf import settings
from rest_framework.test import APITestCase, APIClient
from rest_framework import status
from .models import User
import os
import io


class DocumentUploadViewTests(APITestCase):
    """Tests for the document upload endpoint."""
    
    def setUp(self):
        """Set up test users and client."""
        self.client = APIClient()
        
        # Create a formateur user
        self.formateur = User.objects.create_user(
            username='formateur_test',
            email='formateur@test.com',
            password='testpass123',
            user_type='formateur'
        )
        
        # Create an apprenant user
        self.apprenant = User.objects.create_user(
            username='apprenant_test',
            email='apprenant@test.com',
            password='testpass123',
            user_type='apprenant'
        )
        
        self.upload_url = '/api/documents/upload/'
    
    def test_upload_txt_file_as_formateur(self):
        """Test uploading a TXT file as a formateur."""
        self.client.force_authenticate(user=self.formateur)
        
        # Create a simple text file
        text_content = b'This is a test document with some content for quiz generation.'
        txt_file = SimpleUploadedFile('test.txt', text_content, content_type='text/plain')
        
        response = self.client.post(self.upload_url, {'file': txt_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('text', response.data)
        self.assertIn('filename', response.data)
        self.assertEqual(response.data['filename'], 'test.txt')
    
    def test_upload_without_authentication(self):
        """Test uploading without authentication should fail."""
        text_content = b'Test content'
        txt_file = SimpleUploadedFile('test.txt', text_content, content_type='text/plain')
        
        response = self.client.post(self.upload_url, {'file': txt_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_upload_as_apprenant_should_fail(self):
        """Test that apprenants cannot upload documents."""
        self.client.force_authenticate(user=self.apprenant)
        
        text_content = b'Test content'
        txt_file = SimpleUploadedFile('test.txt', text_content, content_type='text/plain')
        
        response = self.client.post(self.upload_url, {'file': txt_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_upload_without_file(self):
        """Test uploading without a file should fail."""
        self.client.force_authenticate(user=self.formateur)
        
        response = self.client.post(self.upload_url, {}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_unsupported_format(self):
        """Test uploading an unsupported file format."""
        self.client.force_authenticate(user=self.formateur)
        
        # Create a fake image file
        img_content = b'fake image content'
        img_file = SimpleUploadedFile('test.jpg', img_content, content_type='image/jpeg')
        
        response = self.client.post(self.upload_url, {'file': img_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_upload_empty_file(self):
        """Test uploading an empty file."""
        self.client.force_authenticate(user=self.formateur)
        
        empty_file = SimpleUploadedFile('empty.txt', b'', content_type='text/plain')
        
        response = self.client.post(self.upload_url, {'file': empty_file}, format='multipart')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class QuizGenerationViewTests(APITestCase):
    """Tests for the quiz generation endpoint."""
    
    def setUp(self):
        """Set up test users and client."""
        self.client = APIClient()
        
        # Create a formateur user
        self.formateur = User.objects.create_user(
            username='formateur_test',
            email='formateur@test.com',
            password='testpass123',
            user_type='formateur'
        )
        
        # Create an apprenant user
        self.apprenant = User.objects.create_user(
            username='apprenant_test',
            email='apprenant@test.com',
            password='testpass123',
            user_type='apprenant'
        )
        
        self.generate_url = '/api/quiz/generate/'
        self.sample_text = 'Python is a high-level programming language. It was created by Guido van Rossum.'
    
    def test_generate_quiz_without_authentication(self):
        """Test generating quiz without authentication should fail."""
        response = self.client.post(self.generate_url, {
            'text': self.sample_text,
            'num_questions': 3
        })
        
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
    
    def test_generate_quiz_as_apprenant_should_fail(self):
        """Test that apprenants cannot generate quizzes."""
        self.client.force_authenticate(user=self.apprenant)
        
        response = self.client.post(self.generate_url, {
            'text': self.sample_text,
            'num_questions': 3
        })
        
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
    
    def test_generate_quiz_without_text(self):
        """Test generating quiz without text should fail."""
        self.client.force_authenticate(user=self.formateur)
        
        response = self.client.post(self.generate_url, {
            'num_questions': 3
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn('error', response.data)
    
    def test_generate_quiz_with_invalid_num_questions(self):
        """Test generating quiz with invalid number of questions."""
        self.client.force_authenticate(user=self.formateur)
        
        # Test with too many questions
        response = self.client.post(self.generate_url, {
            'text': self.sample_text,
            'num_questions': 25
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Test with zero questions
        response = self.client.post(self.generate_url, {
            'text': self.sample_text,
            'num_questions': 0
        })
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
    
    def test_generate_quiz_without_api_key(self):
        """Test that quiz generation fails when OpenAI API key is not configured."""
        self.client.force_authenticate(user=self.formateur)
        
        # Temporarily clear the API key
        original_key = settings.OPENAI_API_KEY
        settings.OPENAI_API_KEY = ''
        
        response = self.client.post(self.generate_url, {
            'text': self.sample_text,
            'num_questions': 3
        })
        
        # Restore the API key
        settings.OPENAI_API_KEY = original_key
        
        self.assertEqual(response.status_code, status.HTTP_500_INTERNAL_SERVER_ERROR)
        self.assertIn('error', response.data)

