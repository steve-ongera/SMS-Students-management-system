from django.contrib.auth.models import User
from django.db.models import Count, Q
from django.utils import timezone
from rest_framework import viewsets, status, filters
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken

from .models import Programme, Course, Student, Enrollment, Exam, ExamResult, AdminProfile
from .serializers import (
    ProgrammeSerializer, CourseSerializer, StudentSerializer,
    StudentListSerializer, EnrollmentSerializer, ExamSerializer,
    ExamResultSerializer, UserSerializer, UserCreateSerializer,
    DashboardSerializer
)
from .permissions import IsAdminUser


# ── Auth Views ────────────────────────────────────────────────────
@api_view(['POST'])
@permission_classes([AllowAny])
def login_view(request):
    from django.contrib.auth import authenticate
    username = request.data.get('username')
    password = request.data.get('password')

    user = authenticate(username=username, password=password)
    if not user:
        return Response({'detail': 'Invalid credentials.'}, status=status.HTTP_401_UNAUTHORIZED)
    if not user.is_staff:
        return Response({'detail': 'Admin access only.'}, status=status.HTTP_403_FORBIDDEN)

    refresh = RefreshToken.for_user(user)
    serializer = UserSerializer(user)
    return Response({
        'access':  str(refresh.access_token),
        'refresh': str(refresh),
        'user':    serializer.data,
    })


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def logout_view(request):
    try:
        token = RefreshToken(request.data.get('refresh'))
        token.blacklist()
    except Exception:
        pass
    return Response({'detail': 'Logged out.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def me_view(request):
    return Response(UserSerializer(request.user).data)


# ── Dashboard ─────────────────────────────────────────────────────
@api_view(['GET'])
@permission_classes([IsAdminUser])
def dashboard_view(request):
    today = timezone.now().date()
    data = {
        'total_students':   Student.objects.count(),
        'active_students':  Student.objects.filter(status='active').count(),
        'total_programmes': Programme.objects.filter(is_active=True).count(),
        'total_courses':    Course.objects.filter(is_active=True).count(),
        'total_exams':      Exam.objects.count(),
        'upcoming_exams':   Exam.objects.filter(date__gte=today, status='scheduled').count(),
        'total_users':      User.objects.filter(is_staff=True).count(),
        'recent_students':  Student.objects.order_by('-created_at')[:5],
        'upcoming_exam_list': Exam.objects.filter(date__gte=today, status='scheduled').order_by('date', 'start_time')[:5],
    }
    return Response(DashboardSerializer(data).data)


# ── Programme ViewSet ─────────────────────────────────────────────
class ProgrammeViewSet(viewsets.ModelViewSet):
    queryset           = Programme.objects.all()
    serializer_class   = ProgrammeSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'code', 'department']
    ordering_fields    = ['name', 'created_at', 'code']

    @action(detail=True, methods=['get'])
    def courses(self, request, pk=None):
        programme = self.get_object()
        courses = programme.courses.filter(is_active=True)
        return Response(CourseSerializer(courses, many=True).data)

    @action(detail=True, methods=['get'])
    def students(self, request, pk=None):
        programme = self.get_object()
        students = programme.students.all()
        return Response(StudentListSerializer(students, many=True).data)


# ── Course ViewSet ────────────────────────────────────────────────
class CourseViewSet(viewsets.ModelViewSet):
    queryset           = Course.objects.select_related('programme').all()
    serializer_class   = CourseSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['name', 'code', 'programme__name']
    ordering_fields    = ['code', 'name', 'level']

    def get_queryset(self):
        qs = super().get_queryset()
        prog = self.request.query_params.get('programme')
        level = self.request.query_params.get('level')
        if prog:  qs = qs.filter(programme_id=prog)
        if level: qs = qs.filter(level=level)
        return qs


# ── Student ViewSet ───────────────────────────────────────────────
class StudentViewSet(viewsets.ModelViewSet):
    queryset           = Student.objects.select_related('programme').all()
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['first_name', 'last_name', 'student_id', 'email']
    ordering_fields    = ['last_name', 'student_id', 'created_at', 'level']

    def get_serializer_class(self):
        if self.action == 'list':
            return StudentListSerializer
        return StudentSerializer

    def get_queryset(self):
        qs = super().get_queryset()
        programme = self.request.query_params.get('programme')
        status_f  = self.request.query_params.get('status')
        level     = self.request.query_params.get('level')
        gender    = self.request.query_params.get('gender')
        if programme: qs = qs.filter(programme_id=programme)
        if status_f:  qs = qs.filter(status=status_f)
        if level:     qs = qs.filter(level=level)
        if gender:    qs = qs.filter(gender=gender)
        return qs

    @action(detail=True, methods=['get'])
    def results(self, request, pk=None):
        student = self.get_object()
        results = student.results.select_related('exam', 'exam__course').all()
        return Response(ExamResultSerializer(results, many=True).data)

    @action(detail=True, methods=['get'])
    def enrollments(self, request, pk=None):
        student = self.get_object()
        enrs = student.enrollments.select_related('course').all()
        return Response(EnrollmentSerializer(enrs, many=True).data)


# ── Enrollment ViewSet ────────────────────────────────────────────
class EnrollmentViewSet(viewsets.ModelViewSet):
    queryset           = Enrollment.objects.select_related('student', 'course').all()
    serializer_class   = EnrollmentSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['student__first_name', 'student__last_name', 'course__name']

    def get_queryset(self):
        qs = super().get_queryset()
        student = self.request.query_params.get('student')
        course  = self.request.query_params.get('course')
        semester = self.request.query_params.get('semester')
        if student:  qs = qs.filter(student_id=student)
        if course:   qs = qs.filter(course_id=course)
        if semester: qs = qs.filter(semester=semester)
        return qs


# ── Exam ViewSet ──────────────────────────────────────────────────
class ExamViewSet(viewsets.ModelViewSet):
    queryset           = Exam.objects.select_related('course', 'course__programme').all()
    serializer_class   = ExamSerializer
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter, filters.OrderingFilter]
    search_fields      = ['title', 'course__name', 'course__code', 'venue']
    ordering_fields    = ['date', 'created_at']

    def get_queryset(self):
        qs = super().get_queryset()
        course  = self.request.query_params.get('course')
        status_f = self.request.query_params.get('status')
        exam_type = self.request.query_params.get('type')
        if course:     qs = qs.filter(course_id=course)
        if status_f:   qs = qs.filter(status=status_f)
        if exam_type:  qs = qs.filter(exam_type=exam_type)
        return qs

    @action(detail=True, methods=['get', 'post'])
    def results(self, request, pk=None):
        exam = self.get_object()
        if request.method == 'GET':
            results = exam.results.select_related('student').all()
            return Response(ExamResultSerializer(results, many=True).data)
        serializer = ExamResultSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save(exam=exam)
        return Response(serializer.data, status=status.HTTP_201_CREATED)


# ── ExamResult ViewSet ────────────────────────────────────────────
class ExamResultViewSet(viewsets.ModelViewSet):
    queryset           = ExamResult.objects.select_related('exam', 'student').all()
    serializer_class   = ExamResultSerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        qs = super().get_queryset()
        exam    = self.request.query_params.get('exam')
        student = self.request.query_params.get('student')
        if exam:    qs = qs.filter(exam_id=exam)
        if student: qs = qs.filter(student_id=student)
        return qs


# ── User (Admin) ViewSet ──────────────────────────────────────────
class UserViewSet(viewsets.ModelViewSet):
    queryset           = User.objects.filter(is_staff=True).order_by('-date_joined')
    permission_classes = [IsAdminUser]
    filter_backends    = [filters.SearchFilter]
    search_fields      = ['username', 'email', 'first_name', 'last_name']

    def get_serializer_class(self):
        if self.action == 'create':
            return UserCreateSerializer
        return UserSerializer

    @action(detail=True, methods=['patch'])
    def set_password(self, request, pk=None):
        user = self.get_object()
        password = request.data.get('password')
        if not password or len(password) < 6:
            return Response({'detail': 'Password must be at least 6 characters.'}, status=400)
        user.set_password(password)
        user.save()
        return Response({'detail': 'Password updated.'})

    @action(detail=True, methods=['patch'])
    def toggle_active(self, request, pk=None):
        user = self.get_object()
        if user == request.user:
            return Response({'detail': 'Cannot deactivate yourself.'}, status=400)
        user.is_active = not user.is_active
        user.save()
        return Response({'is_active': user.is_active})