"""
Management command: seed_data
Usage:  python manage.py seed_data
        python manage.py seed_data --students 60 --flush

Creates a realistic dataset for the EduCore SMS:
  • 1 superuser  (admin / admin123)
  • 2 staff users (registrar / reg123, dean / dean123)
  • 5 Programmes
  • 45 Courses  (9 per programme across levels 100–400)
  • N Students  (default 40, override with --students)
  • Enrollments (each active student enrolled in 3–5 courses)
  • 40 Exams    (midterm + final for first 20 courses)
  • Exam Results (for completed exams)
"""
import random
from datetime import date, time, timedelta

from django.contrib.auth.models import User
from django.core.management.base import BaseCommand

from core.models import (
    AdminProfile, Course, Enrollment, Exam,
    ExamResult, Programme, Student,
)


# ── Static seed data ──────────────────────────────────────────
PROGRAMMES = [
    {
        'code': 'BSC-CS',
        'name': 'Bachelor of Science in Computer Science',
        'department': 'Computer Science',
        'duration': 4,
        'description': 'A rigorous four-year programme covering algorithms, systems, and software engineering.',
    },
    {
        'code': 'BSC-IS',
        'name': 'Bachelor of Information Systems',
        'department': 'Information Technology',
        'duration': 3,
        'description': 'Focuses on bridging business processes and technology solutions.',
    },
    {
        'code': 'BSC-SE',
        'name': 'Bachelor of Software Engineering',
        'department': 'Engineering',
        'duration': 4,
        'description': 'Equips students with disciplined approaches to large-scale software development.',
    },
    {
        'code': 'DIP-DS',
        'name': 'Diploma in Data Science',
        'department': 'Mathematics & Statistics',
        'duration': 2,
        'description': 'A practical diploma covering data analysis, machine learning, and visualisation.',
    },
    {
        'code': 'BSC-NET',
        'name': 'Bachelor of Network Engineering',
        'department': 'Engineering',
        'duration': 4,
        'description': 'Covers network design, security, cloud infrastructure, and telecommunications.',
    },
]

# 9 course templates per programme (levels 100–400)
COURSE_TEMPLATES = [
    ('Introduction to Programming',         '100', 4),
    ('Mathematics for Computing',           '100', 3),
    ('Communication & Academic Skills',     '100', 2),
    ('Data Structures & Algorithms',        '200', 4),
    ('Database Management Systems',         '200', 3),
    ('Object-Oriented Programming',         '200', 3),
    ('Operating Systems',                   '300', 3),
    ('Software Engineering Principles',     '300', 3),
    ('Final Year Research Project',         '400', 6),
]

FIRST_NAMES = [
    'Alice', 'Bob', 'Carol', 'David', 'Eve', 'Frank', 'Grace', 'Henry',
    'Iris', 'Jack', 'Kate', 'Liam', 'Mia', 'Noah', 'Olivia', 'Paul',
    'Quinn', 'Rose', 'Samuel', 'Tina', 'Uma', 'Victor', 'Wendy', 'Xavier',
    'Yara', 'Zoe', 'Aaron', 'Beatrice', 'Calvin', 'Diana', 'Elijah', 'Faith',
]

LAST_NAMES = [
    'Kamau', 'Otieno', 'Wanjiku', 'Mwangi', 'Njeri', 'Odhiambo', 'Kariuki',
    'Mutua', 'Achieng', 'Kimani', 'Waweru', 'Ndungu', 'Gitau', 'Chebet',
    'Rotich', 'Maina', 'Njoroge', 'Ochieng', 'Langat', 'Kipchoge',
]

VENUES = ['Hall A', 'Hall B', 'Hall C', 'Lab 1', 'Lab 2', 'Lecture Room 1', 'Lecture Room 2']
LEVELS = ['100', '200', '300', '400']
STATUSES = ['active', 'active', 'active', 'active', 'deferred', 'graduated']
GENDERS = ['M', 'M', 'F', 'F', 'F', 'M', 'F', 'M']


class Command(BaseCommand):
    help = 'Seed the database with realistic sample data for EduCore SMS.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--students', type=int, default=40,
            help='Number of students to create (default: 40)',
        )
        parser.add_argument(
            '--flush', action='store_true',
            help='Delete all existing SMS data before seeding (keeps Django auth tables).',
        )

    def handle(self, *args, **options):
        if options['flush']:
            self._flush()

        self._create_users()
        programmes = self._create_programmes()
        courses    = self._create_courses(programmes)
        students   = self._create_students(options['students'], programmes)
        self._create_enrollments(students, courses)
        exams      = self._create_exams(courses)
        self._create_results(exams, students)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('══════════════════════════════════════'))
        self.stdout.write(self.style.SUCCESS('  Seeding complete!'))
        self.stdout.write(self.style.SUCCESS('══════════════════════════════════════'))
        self.stdout.write(f'  Programmes : {Programme.objects.count()}')
        self.stdout.write(f'  Courses    : {Course.objects.count()}')
        self.stdout.write(f'  Students   : {Student.objects.count()}')
        self.stdout.write(f'  Enrollments: {Enrollment.objects.count()}')
        self.stdout.write(f'  Exams      : {Exam.objects.count()}')
        self.stdout.write(f'  Results    : {ExamResult.objects.count()}')
        self.stdout.write('')
        self.stdout.write('  Credentials:')
        self.stdout.write('    admin      / admin123  (superuser)')
        self.stdout.write('    registrar  / reg123    (staff)')
        self.stdout.write('    dean       / dean123   (staff)')

    # ── Private helpers ───────────────────────────────────────

    def _flush(self):
        self.stdout.write(self.style.WARNING('Flushing existing data…'))
        ExamResult.objects.all().delete()
        Enrollment.objects.all().delete()
        Exam.objects.all().delete()
        Student.objects.all().delete()
        Course.objects.all().delete()
        Programme.objects.all().delete()
        self.stdout.write(self.style.WARNING('  Done.\n'))

    def _create_users(self):
        self.stdout.write('Creating users…')

        # Superuser
        if not User.objects.filter(username='admin').exists():
            u = User.objects.create_superuser(
                username='admin', email='admin@educore.ac.ke', password='admin123'
            )
            u.first_name = 'Super'; u.last_name = 'Admin'; u.save()
            AdminProfile.objects.get_or_create(
                user=u,
                defaults={'department': 'Administration', 'phone': '+254700000001'},
            )
            self.stdout.write(self.style.SUCCESS('  ✓ admin / admin123'))
        else:
            self.stdout.write('  – admin already exists')

        # Staff: registrar
        if not User.objects.filter(username='registrar').exists():
            u = User.objects.create_user(
                username='registrar', email='registrar@educore.ac.ke',
                password='reg123', is_staff=True
            )
            u.first_name = 'Jane'; u.last_name = 'Registrar'; u.save()
            AdminProfile.objects.get_or_create(
                user=u,
                defaults={'department': 'Registry', 'phone': '+254700000002'},
            )
            self.stdout.write(self.style.SUCCESS('  ✓ registrar / reg123'))
        else:
            self.stdout.write('  – registrar already exists')

        # Staff: dean
        if not User.objects.filter(username='dean').exists():
            u = User.objects.create_user(
                username='dean', email='dean@educore.ac.ke',
                password='dean123', is_staff=True
            )
            u.first_name = 'John'; u.last_name = 'Dean'; u.save()
            AdminProfile.objects.get_or_create(
                user=u,
                defaults={'department': 'Academic Affairs', 'phone': '+254700000003'},
            )
            self.stdout.write(self.style.SUCCESS('  ✓ dean / dean123'))
        else:
            self.stdout.write('  – dean already exists')

    def _create_programmes(self):
        self.stdout.write('\nCreating programmes…')
        programmes = []
        for p in PROGRAMMES:
            obj, created = Programme.objects.get_or_create(
                code=p['code'],
                defaults={
                    'name':        p['name'],
                    'department':  p['department'],
                    'duration':    p['duration'],
                    'description': p['description'],
                    'is_active':   True,
                },
            )
            programmes.append(obj)
            mark = '✓' if created else '–'
            self.stdout.write(f'  {mark} {obj.code}')
        return programmes

    def _create_courses(self, programmes):
        self.stdout.write('\nCreating courses…')
        courses = []
        for prog in programmes:
            for i, (name, level, credits) in enumerate(COURSE_TEMPLATES, start=1):
                code = f'{prog.code}-{level[0]}{i:02d}'
                obj, created = Course.objects.get_or_create(
                    code=code,
                    defaults={
                        'name':       name,
                        'level':      level,
                        'credit_hrs': credits,
                        'programme':  prog,
                        'is_active':  True,
                        'description': f'{name} as taught in the {prog.name} programme.',
                    },
                )
                courses.append(obj)
        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(courses)} courses ready'))
        return courses

    def _create_students(self, n, programmes):
        self.stdout.write(f'\nCreating {n} students…')
        students = []
        existing = Student.objects.count()

        for i in range(n):
            fn     = random.choice(FIRST_NAMES)
            ln     = random.choice(LAST_NAMES)
            prog   = random.choice(programmes)
            sid    = f'STU{2024}{existing + i + 1:04d}'
            email  = f'{fn.lower()}.{ln.lower()}{existing + i}@student.ac.ke'
            dob    = date(
                random.randint(1998, 2005),
                random.randint(1, 12),
                random.randint(1, 28),
            )
            obj, created = Student.objects.get_or_create(
                student_id=sid,
                defaults={
                    'first_name':    fn,
                    'last_name':     ln,
                    'email':         email,
                    'phone':         f'07{random.randint(10_000_000, 99_999_999)}',
                    'gender':        random.choice(GENDERS),
                    'date_of_birth': dob,
                    'programme':     prog,
                    'level':         random.choice(LEVELS),
                    'status':        random.choice(STATUSES),
                    'address':       f'P.O. Box {random.randint(1, 9999)}, Nairobi',
                },
            )
            if created:
                students.append(obj)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(students)} new students created'))
        return Student.objects.all()   # return full queryset incl. pre-existing

    def _create_enrollments(self, students, courses):
        self.stdout.write('\nCreating enrollments…')
        created_count = 0
        semester = '2024/1'

        active_students = [s for s in students if s.status == 'active']
        for student in active_students:
            # Enroll each active student in 3–5 random courses from their programme
            eligible = [c for c in courses if c.programme_id == student.programme_id]
            if not eligible:
                eligible = courses   # fallback
            picks = random.sample(eligible, min(random.randint(3, 5), len(eligible)))
            for course in picks:
                _, created = Enrollment.objects.get_or_create(
                    student=student,
                    course=course,
                    semester=semester,
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created_count} enrollments created'))

    def _create_exams(self, courses):
        self.stdout.write('\nCreating exams…')
        exams = []
        today = date.today()

        for course in courses[:20]:      # only first 20 courses get exams
            for etype, delta_days, ex_status in [
                ('midterm', -60,  'completed'),
                ('final',   -10,  'completed'),
                ('quiz',    +14,  'scheduled'),
            ]:
                exam_date = today + timedelta(days=delta_days + random.randint(-5, 5))
                obj, created = Exam.objects.get_or_create(
                    title=f'{course.name} – {etype.title()}',
                    course=course,
                    defaults={
                        'exam_type':    etype,
                        'date':         exam_date,
                        'start_time':   time(random.choice([8, 9, 10, 14, 15]), 0),
                        'duration':     120,
                        'venue':        random.choice(VENUES),
                        'total_marks':  100,
                        'pass_marks':   40,
                        'status':       ex_status,
                        'instructions': 'No mobile phones. Answer ALL questions in section A.',
                    },
                )
                exams.append(obj)

        self.stdout.write(self.style.SUCCESS(f'  ✓ {len(exams)} exams ready'))
        return exams

    def _create_results(self, exams, students):
        self.stdout.write('\nCreating exam results…')
        created_count = 0
        student_list  = list(students[:30])   # record results for first 30 students

        completed_exams = [e for e in exams if e.status == 'completed']

        for exam in completed_exams:
            # Give 60–90 % of the student pool a result for each completed exam
            sample_size = random.randint(
                int(len(student_list) * 0.6),
                int(len(student_list) * 0.9),
            )
            for student in random.sample(student_list, min(sample_size, len(student_list))):
                # Realistic mark distribution: mostly 40–85, some outliers
                marks = round(random.gauss(62, 18), 2)
                marks = max(0, min(100, marks))   # clamp to [0, 100]

                _, created = ExamResult.objects.get_or_create(
                    exam=exam,
                    student=student,
                    defaults={
                        'marks':   marks,
                        'remarks': random.choice([
                            '', '', '', 'Good performance.',
                            'Needs improvement.', 'Excellent work!',
                            'Absent for part of the exam.',
                        ]),
                    },
                )
                if created:
                    created_count += 1

        self.stdout.write(self.style.SUCCESS(f'  ✓ {created_count} results recorded'))