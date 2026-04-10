from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register('programmes', views.ProgrammeViewSet)
router.register('courses',    views.CourseViewSet)
router.register('students',   views.StudentViewSet)
router.register('enrollments', views.EnrollmentViewSet)
router.register('exams',      views.ExamViewSet)
router.register('results',    views.ExamResultViewSet)
router.register('users',      views.UserViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('auth/login/',    views.login_view),
    path('auth/logout/',   views.logout_view),
    path('auth/me/',       views.me_view),
    path('dashboard/',     views.dashboard_view),
]