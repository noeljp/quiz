from django.db import models
from django.contrib.auth.models import AbstractUser


class User(AbstractUser):
    """
    Custom User model extending Django's AbstractUser.
    Supports two types of users: formateurs (trainers) and apprenants (learners).
    """
    USER_TYPE_CHOICES = [
        ('formateur', 'Formateur'),
        ('apprenant', 'Apprenant'),
    ]
    
    user_type = models.CharField(
        max_length=10,
        choices=USER_TYPE_CHOICES,
        default='apprenant'
    )
    
    def __str__(self):
        return f"{self.username} ({self.get_user_type_display()})"


class File(models.Model):
    """
    Model for uploaded files (PDF, DOC, PPT, etc.).
    Associated with a formateur user.
    """
    title = models.CharField(max_length=255)
    subject = models.CharField(max_length=255, help_text="Sujet du fichier")
    theme = models.CharField(max_length=255, help_text="Thème du fichier")
    file = models.FileField(upload_to='uploads/%Y/%m/%d/')
    uploaded_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='uploaded_files',
        limit_choices_to={'user_type': 'formateur'}
    )
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-uploaded_at']
    
    def __str__(self):
        return f"{self.title} - {self.subject}"


class Progress(models.Model):
    """
    Model for tracking learner progress on quizzes.
    Stores quiz completion status and scores.
    """
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='progress',
        limit_choices_to={'user_type': 'apprenant'}
    )
    quiz_title = models.CharField(max_length=255)
    quiz_subject = models.CharField(max_length=255)
    score = models.IntegerField(default=0, help_text="Score obtenu sur le quiz")
    max_score = models.IntegerField(default=100, help_text="Score maximum possible")
    completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
        verbose_name_plural = 'Progress'
    
    def __str__(self):
        return f"{self.user.username} - {self.quiz_title} ({self.score}/{self.max_score})"
    
    @property
    def percentage(self):
        """Calculate the percentage score."""
        if self.max_score > 0:
            return round((self.score / self.max_score) * 100, 2)
        return 0
