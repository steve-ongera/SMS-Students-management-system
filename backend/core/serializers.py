from django.contrib.auth.models import User
from rest_framework import serializers
from .models import Programme, Course, Student, Enrollment, Exam, ExamResult, AdminProfile


# ── Auth ─────────────────────────────────────────────────────────
class AdminProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model  = AdminProfile
        fields = ['phone', 'department', 'avatar']


class UserSerializer(serializers.ModelSerializer):
    profile = AdminProfileSerializer(read_only=True)

    class Meta:
        model  = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name',
                  'is_staff', 'is_superuser', 'date_joined', 'profile']
        read_only_fields = ['date_joined']


class UserCreateSerializer(serializers.ModelSerializer):
    password  = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True)
    phone      = serializers.CharField(required=False, allow_blank=True)
    department = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model  = User
        fields = ['username', 'email', 'first_name', 'last_name',
                  'password', 'password2', 'is_staff', 'phone', 'department']

    def validate(self, data):
        if data['password'] != data.pop('password2'):
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def create(self, validated_data):
        phone      = validated_data.pop('phone', '')
        department = validated_data.pop('department', '')
        password   = validated_data.pop('password')
        user = User.objects.create_user(password=password, **validated_data)
        AdminProfile.objects.create(user=user, phone=phone, department=department)
        return user


# ── Programme ────────────────────────────────────────────────────
class ProgrammeSerializer(serializers.ModelSerializer):
    student_count = serializers.SerializerMethodField()
    course_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Programme
        fields = '__all__'

    def get_student_count(self, obj):
        return obj.students.filter(status='active').count()

    def get_course_count(self, obj):
        return obj.courses.filter(is_active=True).count()


# ── Course ───────────────────────────────────────────────────────
class CourseSerializer(serializers.ModelSerializer):
    programme_name = serializers.CharField(source='programme.name', read_only=True)
    enrolled_count = serializers.SerializerMethodField()

    class Meta:
        model  = Course
        fields = '__all__'

    def get_enrolled_count(self, obj):
        return obj.enrollments.count()


# ── Student ──────────────────────────────────────────────────────
class StudentSerializer(serializers.ModelSerializer):
    full_name      = serializers.ReadOnlyField()
    programme_name = serializers.CharField(source='programme.name', read_only=True)

    class Meta:
        model  = Student
        fields = '__all__'


class StudentListSerializer(serializers.ModelSerializer):
    """Lightweight serializer for list views."""
    full_name      = serializers.ReadOnlyField()
    programme_name = serializers.CharField(source='programme.name', read_only=True)

    class Meta:
        model  = Student
        fields = ['id', 'student_id', 'full_name', 'first_name', 'last_name',
                  'email', 'programme_name', 'level', 'status', 'gender', 'phone', 'photo']


# ── Enrollment ───────────────────────────────────────────────────
class EnrollmentSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    course_name  = serializers.CharField(source='course.name', read_only=True)
    course_code  = serializers.CharField(source='course.code', read_only=True)

    class Meta:
        model  = Enrollment
        fields = '__all__'


# ── Exam ─────────────────────────────────────────────────────────
class ExamSerializer(serializers.ModelSerializer):
    course_name    = serializers.CharField(source='course.name', read_only=True)
    course_code    = serializers.CharField(source='course.code', read_only=True)
    results_count  = serializers.SerializerMethodField()

    class Meta:
        model  = Exam
        fields = '__all__'

    def get_results_count(self, obj):
        return obj.results.count()


# ── ExamResult ───────────────────────────────────────────────────
class ExamResultSerializer(serializers.ModelSerializer):
    student_name = serializers.CharField(source='student.full_name', read_only=True)
    student_id_no = serializers.CharField(source='student.student_id', read_only=True)
    exam_title   = serializers.CharField(source='exam.title', read_only=True)

    class Meta:
        model  = ExamResult
        fields = '__all__'


# ── Dashboard stats ──────────────────────────────────────────────
class DashboardSerializer(serializers.Serializer):
    total_students   = serializers.IntegerField()
    active_students  = serializers.IntegerField()
    total_programmes = serializers.IntegerField()
    total_courses    = serializers.IntegerField()
    total_exams      = serializers.IntegerField()
    upcoming_exams   = serializers.IntegerField()
    total_users      = serializers.IntegerField()
    recent_students  = StudentListSerializer(many=True)
    upcoming_exam_list = ExamSerializer(many=True)