from django.contrib import admin
from django.contrib.auth.models import User
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.utils.html import format_html

from .models import Programme, Course, Student, Enrollment, Exam, ExamResult, AdminProfile


# ══════════════════════════════════════════════════════════════
#  INLINE ADMINS
# ══════════════════════════════════════════════════════════════

class AdminProfileInline(admin.StackedInline):
    model = AdminProfile
    can_delete = False
    verbose_name = 'Admin Profile'
    verbose_name_plural = 'Admin Profile'
    fields = ('phone', 'department', 'avatar')
    extra = 0


class CourseInline(admin.TabularInline):
    model = Course
    extra = 0
    fields = ('code', 'name', 'level', 'credit_hrs', 'is_active')
    show_change_link = True


class EnrollmentInline(admin.TabularInline):
    model = Enrollment
    extra = 0
    fields = ('course', 'semester', 'enrolled_at')
    readonly_fields = ('enrolled_at',)
    show_change_link = True


class ExamResultInline(admin.TabularInline):
    model = ExamResult
    extra = 0
    fields = ('student', 'marks', 'grade', 'remarks')
    readonly_fields = ('grade',)
    show_change_link = True


# ══════════════════════════════════════════════════════════════
#  EXTEND DEFAULT USER ADMIN  (adds profile inline)
# ══════════════════════════════════════════════════════════════

class UserAdmin(BaseUserAdmin):
    inlines = (AdminProfileInline,)
    list_display  = ('username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'date_joined')
    list_filter   = ('is_staff', 'is_superuser', 'is_active')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    ordering      = ('-date_joined',)


admin.site.unregister(User)
admin.site.register(User, UserAdmin)


# ══════════════════════════════════════════════════════════════
#  PROGRAMME ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(Programme)
class ProgrammeAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name', 'department', 'duration_display', 'student_count', 'course_count', 'is_active', 'created_at')
    list_filter   = ('is_active', 'department', 'duration')
    search_fields = ('code', 'name', 'department')
    ordering      = ('name',)
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('is_active',)
    inlines       = [CourseInline]

    fieldsets = (
        ('Basic Information', {
            'fields': ('code', 'name', 'department', 'duration', 'is_active')
        }),
        ('Description', {
            'fields': ('description',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Duration')
    def duration_display(self, obj):
        return f"{obj.duration} Year{'s' if obj.duration > 1 else ''}"

    @admin.display(description='Active Students')
    def student_count(self, obj):
        count = obj.students.filter(status='active').count()
        return format_html('<b>{}</b>', count)

    @admin.display(description='Courses')
    def course_count(self, obj):
        return obj.courses.filter(is_active=True).count()


# ══════════════════════════════════════════════════════════════
#  COURSE ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display  = ('code', 'name', 'programme_link', 'level', 'credit_hrs', 'enrolled_count', 'is_active')
    list_filter   = ('level', 'is_active', 'programme')
    search_fields = ('code', 'name', 'programme__name')
    ordering      = ('level', 'code')
    readonly_fields = ('created_at',)
    list_editable = ('is_active',)
    list_select_related = ('programme',)

    fieldsets = (
        ('Course Details', {
            'fields': ('code', 'name', 'programme', 'level', 'credit_hrs', 'is_active')
        }),
        ('Description', {
            'fields': ('description',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at',),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Programme')
    def programme_link(self, obj):
        return format_html(
            '<a href="/admin/core/programme/{}/change/">{}</a>',
            obj.programme_id, obj.programme.code
        )

    @admin.display(description='Enrolled')
    def enrolled_count(self, obj):
        return obj.enrollments.count()


# ══════════════════════════════════════════════════════════════
#  STUDENT ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display  = ('student_id', 'full_name_display', 'email', 'programme_code', 'level', 'gender', 'status_badge', 'enrolled_date')
    list_filter   = ('status', 'gender', 'level', 'programme')
    search_fields = ('student_id', 'first_name', 'last_name', 'email', 'phone')
    ordering      = ('last_name', 'first_name')
    readonly_fields = ('enrolled_date', 'created_at', 'updated_at')
    list_select_related = ('programme',)
    list_per_page = 25
    date_hierarchy = 'enrolled_date'
    inlines       = [EnrollmentInline]

    fieldsets = (
        ('Identity', {
            'fields': ('student_id', 'first_name', 'last_name', 'email', 'phone', 'gender', 'date_of_birth', 'photo')
        }),
        ('Academic', {
            'fields': ('programme', 'level', 'status'),
        }),
        ('Address', {
            'fields': ('address',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('enrolled_date', 'created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    actions = ['mark_active', 'mark_deferred', 'mark_graduated', 'mark_withdrawn']

    @admin.display(description='Full Name')
    def full_name_display(self, obj):
        return obj.full_name

    @admin.display(description='Programme')
    def programme_code(self, obj):
        return obj.programme.code if obj.programme else '—'

    @admin.display(description='Status')
    def status_badge(self, obj):
        colors = {
            'active':    'green',
            'deferred':  'orange',
            'graduated': 'blue',
            'withdrawn': 'red',
        }
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            colors.get(obj.status, 'grey'), obj.get_status_display()
        )

    @admin.action(description='Mark selected students as Active')
    def mark_active(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="active")} student(s) marked Active.')

    @admin.action(description='Mark selected students as Deferred')
    def mark_deferred(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="deferred")} student(s) marked Deferred.')

    @admin.action(description='Mark selected students as Graduated')
    def mark_graduated(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="graduated")} student(s) marked Graduated.')

    @admin.action(description='Mark selected students as Withdrawn')
    def mark_withdrawn(self, request, queryset):
        self.message_user(request, f'{queryset.update(status="withdrawn")} student(s) marked Withdrawn.')


# ══════════════════════════════════════════════════════════════
#  ENROLLMENT ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(Enrollment)
class EnrollmentAdmin(admin.ModelAdmin):
    list_display  = ('student_id_display', 'student_name', 'course_code', 'course_name', 'semester', 'enrolled_at')
    list_filter   = ('semester', 'course__programme')
    search_fields = ('student__student_id', 'student__first_name', 'student__last_name', 'course__code', 'course__name')
    ordering      = ('-enrolled_at',)
    readonly_fields = ('enrolled_at',)
    list_select_related = ('student', 'course', 'course__programme')
    list_per_page = 30

    @admin.display(description='Student ID')
    def student_id_display(self, obj):
        return obj.student.student_id

    @admin.display(description='Student')
    def student_name(self, obj):
        return obj.student.full_name

    @admin.display(description='Code')
    def course_code(self, obj):
        return obj.course.code

    @admin.display(description='Course')
    def course_name(self, obj):
        return obj.course.name


# ══════════════════════════════════════════════════════════════
#  EXAM ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    # NOTE: 'status' must appear in list_display before it can appear in list_editable
    list_display  = (
        'title', 'course_code', 'exam_type', 'date',
        'start_time', 'duration_display', 'venue',
        'total_marks', 'status', 'results_count',
    )
    list_filter   = ('exam_type', 'status', 'course__programme', 'date')
    search_fields = ('title', 'course__code', 'course__name', 'venue')
    ordering      = ('-date', 'start_time')
    readonly_fields = ('created_at', 'updated_at')
    list_editable = ('status',)
    date_hierarchy = 'date'
    list_select_related = ('course', 'course__programme')
    inlines       = [ExamResultInline]

    fieldsets = (
        ('Exam Details', {
            'fields': ('title', 'course', 'exam_type', 'status')
        }),
        ('Schedule', {
            'fields': ('date', 'start_time', 'duration', 'venue'),
        }),
        ('Marking', {
            'fields': ('total_marks', 'pass_marks'),
        }),
        ('Instructions', {
            'fields': ('instructions',),
            'classes': ('collapse',),
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Course')
    def course_code(self, obj):
        return obj.course.code

    @admin.display(description='Duration')
    def duration_display(self, obj):
        h, m = divmod(obj.duration, 60)
        return f"{h}h {m}m" if h else f"{m}m"

    @admin.display(description='Results')
    def results_count(self, obj):
        return obj.results.count()


# ══════════════════════════════════════════════════════════════
#  EXAM RESULT ADMIN
# ══════════════════════════════════════════════════════════════

@admin.register(ExamResult)
class ExamResultAdmin(admin.ModelAdmin):
    list_display  = ('student_id_display', 'student_name', 'exam_title', 'course_code', 'marks', 'grade_badge', 'recorded_at')
    list_filter   = ('grade', 'exam__exam_type', 'exam__course__programme')
    search_fields = ('student__student_id', 'student__first_name', 'student__last_name', 'exam__title')
    ordering      = ('-recorded_at',)
    readonly_fields = ('grade', 'recorded_at', 'updated_at')
    list_select_related = ('student', 'exam', 'exam__course')
    list_per_page = 30

    fieldsets = (
        ('Result', {
            'fields': ('exam', 'student', 'marks', 'grade', 'remarks')
        }),
        ('Timestamps', {
            'fields': ('recorded_at', 'updated_at'),
            'classes': ('collapse',),
        }),
    )

    @admin.display(description='Student ID')
    def student_id_display(self, obj):
        return obj.student.student_id

    @admin.display(description='Student')
    def student_name(self, obj):
        return obj.student.full_name

    @admin.display(description='Exam')
    def exam_title(self, obj):
        return obj.exam.title

    @admin.display(description='Course')
    def course_code(self, obj):
        return obj.exam.course.code

    @admin.display(description='Grade')
    def grade_badge(self, obj):
        colors = {
            'A': 'green', 'B': 'teal', 'C': 'blue',
            'D': 'orange', 'E': 'red', 'ABS': 'grey',
        }
        return format_html(
            '<span style="color:{}; font-weight:bold;">{}</span>',
            colors.get(obj.grade, 'grey'), obj.grade or '—'
        )


# ══════════════════════════════════════════════════════════════
#  ADMIN PROFILE
# ══════════════════════════════════════════════════════════════

@admin.register(AdminProfile)
class AdminProfileAdmin(admin.ModelAdmin):
    list_display  = ('user', 'department', 'phone', 'created_at')
    search_fields = ('user__username', 'user__email', 'department')
    readonly_fields = ('created_at',)
    list_select_related = ('user',)


# ══════════════════════════════════════════════════════════════
#  SITE BRANDING
# ══════════════════════════════════════════════════════════════

admin.site.site_header = 'EduCore SMS — Administration'
admin.site.site_title  = 'EduCore Admin'
admin.site.index_title = 'Student Management System'