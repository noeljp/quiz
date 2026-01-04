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


class Quiz(models.Model):
    """
    Model for storing quizzes created by formateurs.
    Contains title, subject, and questions in JSON format.
    """
    title = models.CharField(max_length=255, help_text="Titre du quiz")
    subject = models.CharField(max_length=255, help_text="Sujet du quiz")
    description = models.TextField(blank=True, help_text="Description du quiz")
    questions = models.JSONField(help_text="Questions au format JSON")
    created_by = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='created_quizzes',
        limit_choices_to={'user_type': 'formateur'}
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name_plural = 'Quizzes'
    
    def __str__(self):
        return f"{self.title} - {self.subject}"
    
    @property
    def num_questions(self):
        """Get the number of questions in the quiz."""
        if isinstance(self.questions, dict) and 'questions' in self.questions:
            return len(self.questions['questions'])
        return 0


class QuizAssignment(models.Model):
    """
    Model for assigning quizzes to specific learners.
    Links a quiz to learners who should complete it.
    """
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='assignments'
    )
    learner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='assigned_quizzes',
        limit_choices_to={'user_type': 'apprenant'}
    )
    assigned_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-assigned_at']
        unique_together = ['quiz', 'learner']
    
    def __str__(self):
        return f"{self.quiz.title} -> {self.learner.username}"


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
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.CASCADE,
        related_name='progress_entries',
        null=True,
        blank=True
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


class EvaluationSession(models.Model):
    """
    Model for tracking diagnostic evaluation sessions.
    Each session contains 15-20 questions to assess cognitive profile.
    """
    learner = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='evaluation_sessions',
        limit_choices_to={'user_type': 'apprenant'}
    )
    quiz = models.ForeignKey(
        Quiz,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='evaluation_sessions'
    )
    session_type = models.CharField(
        max_length=50,
        default='diagnostic',
        help_text="Type d'évaluation: diagnostic, formative, etc."
    )
    started_at = models.DateTimeField(auto_now_add=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    is_completed = models.BooleanField(default=False)
    
    class Meta:
        ordering = ['-started_at']
    
    def __str__(self):
        return f"Session {self.id} - {self.learner.username} - {self.session_type}"


class QuestionResponse(models.Model):
    """
    Model for collecting detailed response data for each question.
    Tracks time, attempts, help usage, and competence type.
    """
    COMPETENCE_CHOICES = [
        ('lecture', 'Lecture'),
        ('logique', 'Logique'),
        ('calcul', 'Calcul'),
        ('comprehension', 'Compréhension'),
        ('attention', 'Attention'),
    ]
    
    session = models.ForeignKey(
        EvaluationSession,
        on_delete=models.CASCADE,
        related_name='responses'
    )
    question_id = models.CharField(max_length=255, help_text="Identifiant de la question")
    question_text = models.TextField(help_text="Texte de la question")
    question_type = models.CharField(max_length=50, default='qcm')
    competence_type = models.CharField(
        max_length=50,
        choices=COMPETENCE_CHOICES,
        default='comprehension'
    )
    answer = models.TextField(help_text="Réponse de l'élève")
    correct_answer = models.TextField(help_text="Réponse correcte")
    is_correct = models.BooleanField(default=False)
    response_time_ms = models.IntegerField(
        help_text="Temps de réponse en millisecondes"
    )
    attempts = models.IntegerField(default=1, help_text="Nombre de tentatives")
    help_used = models.BooleanField(default=False, help_text="Aide utilisée")
    help_type = models.CharField(
        max_length=100,
        blank=True,
        help_text="Type d'aide utilisée"
    )
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"Response {self.id} - Session {self.session.id} - Q{self.question_id}"


class CognitiveProfile(models.Model):
    """
    Model for storing learner cognitive strengths and weaknesses.
    Generated from evaluation session analysis using AI.
    """
    learner = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='cognitive_profile',
        limit_choices_to={'user_type': 'apprenant'}
    )
    strengths = models.JSONField(
        default=list,
        help_text="Forces identifiées (ex: ['logique', 'raisonnement'])"
    )
    weaknesses = models.JSONField(
        default=list,
        help_text="Fragilités probables (ex: ['lecture', 'attention'])"
    )
    learning_style = models.CharField(
        max_length=100,
        default='',
        help_text="Style d'apprentissage: visuel/logique/guidé"
    )
    confidence_level = models.CharField(
        max_length=20,
        choices=[
            ('faible', 'Faible'),
            ('moyen', 'Moyen'),
            ('élevé', 'Élevé')
        ],
        default='moyen'
    )
    recommendations = models.JSONField(
        default=list,
        help_text="Recommandations pédagogiques"
    )
    analysis_data = models.JSONField(
        default=dict,
        help_text="Données complètes de l'analyse (indicateurs, patterns)"
    )
    last_evaluation_session = models.ForeignKey(
        EvaluationSession,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='generated_profiles'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name_plural = 'Cognitive Profiles'
    
    def __str__(self):
        return f"Profil cognitif - {self.learner.username}"
