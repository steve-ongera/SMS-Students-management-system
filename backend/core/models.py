from django.db import models
from django.contrib.auth.models import User


# ── Programme ────────────────────────────────────────────────────
class Programme(models.Model):
    DURATION_CHOICES = [(i, f"{i} Year{'s' if i > 1 else ''}") for i in range(1, 7)]

    code        = models.CharField(max_length=20, unique=True)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    duration    = models.PositiveSmallIntegerField(choices=DURATION_CHOICES, default=3)
    department  = models.CharField(max_length=100)
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']

    def __str__(self):
        return f"{self.code} – {self.name}"


# ── Course ───────────────────────────────────────────────────────
class Course(models.Model):
    LEVEL_CHOICES = [
        ('100', 'Level 100'), ('200', 'Level 200'), ('300', 'Level 300'),
        ('400', 'Level 400'), ('500', 'Level 500'), ('600', 'Level 600'),
    ]

    code        = models.CharField(max_length=20, unique=True)
    name        = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    credit_hrs  = models.PositiveSmallIntegerField(default=3)
    level       = models.CharField(max_length=10, choices=LEVEL_CHOICES, default='100')
    programme   = models.ForeignKey(Programme, on_delete=models.CASCADE, related_name='courses')
    is_active   = models.BooleanField(default=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['level', 'code']

    def __str__(self):
        return f"{self.code} – {self.name}"


# ── Student ──────────────────────────────────────────────────────
class Student(models.Model):
    GENDER_CHOICES = [('M', 'Male'), ('F', 'Female'), ('O', 'Other')]
    STATUS_CHOICES = [
        ('active', 'Active'), ('deferred', 'Deferred'),
        ('graduated', 'Graduated'), ('withdrawn', 'Withdrawn'),
    ]

    student_id    = models.CharField(max_length=20, unique=True)
    first_name    = models.CharField(max_length=100)
    last_name     = models.CharField(max_length=100)
    email         = models.EmailField(unique=True)
    phone         = models.CharField(max_length=20, blank=True)
    gender        = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField(null=True, blank=True)
    address       = models.TextField(blank=True)
    programme     = models.ForeignKey(Programme, on_delete=models.SET_NULL, null=True, related_name='students')
    level         = models.CharField(max_length=10, default='100')
    status        = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    enrolled_date = models.DateField(auto_now_add=True)
    photo         = models.ImageField(upload_to='students/', null=True, blank=True)
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['last_name', 'first_name']

    def __str__(self):
        return f"{self.student_id} – {self.first_name} {self.last_name}"

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"


# ── Enrollment ───────────────────────────────────────────────────
class Enrollment(models.Model):
    student    = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='enrollments')
    course     = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='enrollments')
    semester   = models.CharField(max_length=20)   # e.g. "2024/1"
    enrolled_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ['student', 'course', 'semester']
        ordering = ['-enrolled_at']

    def __str__(self):
        return f"{self.student.student_id} → {self.course.code} ({self.semester})"


# ── Exam ─────────────────────────────────────────────────────────
class Exam(models.Model):
    TYPE_CHOICES = [
        ('midterm', 'Mid-Term'), ('final', 'Final'), ('quiz', 'Quiz'),
        ('assignment', 'Assignment'), ('practical', 'Practical'),
    ]
    STATUS_CHOICES = [
        ('scheduled', 'Scheduled'), ('ongoing', 'Ongoing'),
        ('completed', 'Completed'), ('cancelled', 'Cancelled'),
    ]

    title      = models.CharField(max_length=200)
    course     = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='exams')
    exam_type  = models.CharField(max_length=20, choices=TYPE_CHOICES)
    date       = models.DateField()
    start_time = models.TimeField()
    duration   = models.PositiveSmallIntegerField(help_text='Duration in minutes', default=120)
    venue      = models.CharField(max_length=100, blank=True)
    total_marks = models.PositiveSmallIntegerField(default=100)
    pass_marks  = models.PositiveSmallIntegerField(default=40)
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default='scheduled')
    instructions = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-date', 'start_time']

    def __str__(self):
        return f"{self.title} ({self.course.code})"


# ── ExamResult ───────────────────────────────────────────────────
class ExamResult(models.Model):
    GRADE_CHOICES = [
        ('A', 'A – Distinction'), ('B', 'B – Merit'), ('C', 'C – Credit'),
        ('D', 'D – Pass'), ('E', 'E – Fail'), ('ABS', 'Absent'),
    ]

    exam     = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='results')
    student  = models.ForeignKey(Student, on_delete=models.CASCADE, related_name='results')
    marks    = models.DecimalField(max_digits=6, decimal_places=2, null=True, blank=True)
    grade    = models.CharField(max_length=5, choices=GRADE_CHOICES, blank=True)
    remarks  = models.TextField(blank=True)
    recorded_at = models.DateTimeField(auto_now_add=True)
    updated_at  = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ['exam', 'student']

    def __str__(self):
        return f"{self.student.student_id} – {self.exam.title}: {self.marks}"

    def save(self, *args, **kwargs):
        # Auto-assign grade from marks
        if self.marks is not None and self.exam_id:
            total = self.exam.total_marks
            pct = float(self.marks) / total * 100
            if pct >= 80:   self.grade = 'A'
            elif pct >= 70: self.grade = 'B'
            elif pct >= 60: self.grade = 'C'
            elif pct >= 40: self.grade = 'D'
            else:           self.grade = 'E'
        super().save(*args, **kwargs)


# ── AdminUser (profile extension) ────────────────────────────────
class AdminProfile(models.Model):
    user       = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    phone      = models.CharField(max_length=20, blank=True)
    department = models.CharField(max_length=100, blank=True)
    avatar     = models.ImageField(upload_to='avatars/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Profile({self.user.username})"