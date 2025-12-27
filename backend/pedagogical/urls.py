from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import (
    RegisterView, LoginView, UserViewSet, FileViewSet, ProgressViewSet,
    DocumentUploadView, GenerateQuizView
)

router = DefaultRouter()
router.register(r'users', UserViewSet)
router.register(r'files', FileViewSet)
router.register(r'progress', ProgressViewSet)

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('upload/', DocumentUploadView.as_view(), name='document-upload'),
    path('generate-quiz/', GenerateQuizView.as_view(), name='generate-quiz'),
    path('', include(router.urls)),
]
