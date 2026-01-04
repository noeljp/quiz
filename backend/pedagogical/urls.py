from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserViewSet, FileViewSet, ProgressViewSet,
    DocumentUploadView, QuizGenerationView, QuizViewSet
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'files', FileViewSet)
router.register(r'progress', ProgressViewSet)
router.register(r'quizzes', QuizViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('documents/upload/', DocumentUploadView.as_view(), name='document_upload'),
    path('quiz/generate/', QuizGenerationView.as_view(), name='quiz_generate'),
    path('', include(router.urls)),
]
