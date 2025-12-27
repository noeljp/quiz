from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, File, Progress


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Admin configuration for User model."""
    list_display = ['username', 'email', 'user_type', 'first_name', 'last_name', 'is_staff']
    list_filter = ['user_type', 'is_staff', 'is_superuser', 'is_active']
    fieldsets = BaseUserAdmin.fieldsets + (
        ('User Type', {'fields': ('user_type',)}),
    )
    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('User Type', {'fields': ('user_type',)}),
    )


@admin.register(File)
class FileAdmin(admin.ModelAdmin):
    """Admin configuration for File model."""
    list_display = ['title', 'subject', 'theme', 'uploaded_by', 'uploaded_at']
    list_filter = ['uploaded_at', 'subject', 'theme']
    search_fields = ['title', 'subject', 'theme', 'uploaded_by__username']
    readonly_fields = ['uploaded_at']
    
    def get_queryset(self, request):
        """Limit files to those uploaded by the current user if not superuser."""
        qs = super().get_queryset(request)
        if request.user.is_superuser:
            return qs
        return qs.filter(uploaded_by=request.user)


@admin.register(Progress)
class ProgressAdmin(admin.ModelAdmin):
    """Admin configuration for Progress model."""
    list_display = ['user', 'quiz_title', 'quiz_subject', 'score', 'max_score', 'percentage', 'completed', 'updated_at']
    list_filter = ['completed', 'created_at', 'updated_at']
    search_fields = ['user__username', 'quiz_title', 'quiz_subject']
    readonly_fields = ['created_at', 'updated_at', 'percentage']
    
    def percentage(self, obj):
        """Display percentage in admin."""
        return f"{obj.percentage}%"
    percentage.short_description = 'Percentage'
