import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from gym.models import (
    Trainer, Profile, MembershipPlan, Member, 
    Attendance, Fee, PTPackage, TrainerPayroll, Expense
)
from gym.payroll_engine import calculate_monthly_payroll


class Command(BaseCommand):
    help = "Seeds the database with mock gym data for testing."

    def handle(self, *args, **options):
        self.stdout.write("Starting database seeding...")

        # 1. Ensure Groups exist (just in case)
        super_admin_group, _ = Group.objects.get_or_create(name='SuperAdmin')
        manager_group, _ = Group.objects.get_or_create(name='Manager')
        trainer_group, _ = Group.objects.get_or_create(name='Trainer')
        accountant_group, _ = Group.objects.get_or_create(name='Accountant')

        # 2. Seed Users & Profiles
        # Owner (Super Admin)
        owner_user, created = User.objects.get_or_create(username='owner', email='owner@gympro.com')
        if created:
            owner_user.set_password('owner123')
            owner_user.first_name = "Gym"
            owner_user.last_name = "Owner"
            owner_user.is_staff = True
            owner_user.is_superuser = True
            owner_user.save()
        profile = owner_user.profile
        profile.role = 'super_admin'
        profile.save()

        # Manager
        manager_user, created = User.objects.get_or_create(username='manager', email='manager@gympro.com')
        if created:
            manager_user.set_password('manager123')
            manager_user.first_name = "Front"
            manager_user.last_name = "Desk"
            manager_user.save()
        profile = manager_user.profile
        profile.role = 'manager'
        profile.save()

        # Accountant
        accountant_user, created = User.objects.get_or_create(username='accountant', email='accountant@gympro.com')
        if created:
            accountant_user.set_password('accountant123')
            accountant_user.first_name = "Finance"
            accountant_user.last_name = "Officer"
            accountant_user.save()
        profile = accountant_user.profile
        profile.role = 'accountant'
        profile.save()

        # Trainers
        trainer1_user, created = User.objects.get_or_create(username='trainer1', email='trainer1@gympro.com')
        if created:
            trainer1_user.set_password('trainer123')
            trainer1_user.first_name = "Ali"
            trainer1_user.last_name = "Ahmed"
            trainer1_user.save()

        trainer2_user, created = User.objects.get_or_create(username='trainer2', email='trainer2@gympro.com')
        if created:
            trainer2_user.set_password('trainer2123')
            trainer2_user.first_name = "Zara"
            trainer2_user.last_name = "Khan"
            trainer2_user.save()

        # Create Trainers in DB
        t1, _ = Trainer.objects.get_or_create(
            user=trainer1_user,
            defaults={
                'name': 'Ali Ahmed',
                'phone': '03001112222',
                'specialization': 'Bodybuilding & Strength',
                'salary_type': 'hybrid',
                'base_salary': 35000.00,
                'commission_pct': 20.00
            }
        )
        
        # Link Profile
        profile1 = trainer1_user.profile
        profile1.role = 'trainer'
        profile1.linked_trainer = t1
        profile1.save()

        t2, _ = Trainer.objects.get_or_create(
            user=trainer2_user,
            defaults={
                'name': 'Zara Khan',
                'phone': '03003334444',
                'specialization': 'Yoga & Cardio',
                'salary_type': 'commission',
                'base_salary': 0.00,
                'commission_pct': 30.00
            }
        )
        
        # Link Profile
        profile2 = trainer2_user.profile
        profile2.role = 'trainer'
        profile2.linked_trainer = t2
        profile2.save()

        self.stdout.write("Users and Roles seeded.")

        # 3. Seed Membership Plans
        plan_basic, _ = MembershipPlan.objects.get_or_create(
            name="Basic Monthly Plan",
            defaults={'duration_months': 1, 'price': 3000.00, 'features': ["Gym Floor Access", "Locker Room Access"]}
        )
        plan_quarterly, _ = MembershipPlan.objects.get_or_create(
            name="Quarterly Gold Plan",
            defaults={'duration_months': 3, 'price': 8000.00, 'features': ["Gym Floor Access", "Group Classes", "Sauna"]}
        )
        plan_annual, _ = MembershipPlan.objects.get_or_create(
            name="Annual Platinum Plan",
            defaults={'duration_months': 12, 'price': 28000.00, 'features': ["Gym Floor Access", "All Classes", "Sauna", "1 Free PT Session"]}
        )

        self.stdout.write("Membership Plans seeded.")

        # 4. Seed Members
        m1, _ = Member.objects.get_or_create(
            name="Muhammad Bilal",
            defaults={
                'phone': '03125556666',
                'email': 'bilal@gmail.com',
                'join_date': datetime.date.today() - datetime.timedelta(days=20),
                'plan': plan_basic,
                'status': 'active'
            }
        )
        m2, _ = Member.objects.get_or_create(
            name="Sana Malik",
            defaults={
                'phone': '03217778888',
                'email': 'sana@gmail.com',
                'join_date': datetime.date.today() - datetime.timedelta(days=10),
                'plan': plan_quarterly,
                'status': 'active'
            }
        )
        m3, _ = Member.objects.get_or_create(
            name="Kamil Shah",
            defaults={
                'phone': '03339990000',
                'email': 'kamil@gmail.com',
                'join_date': datetime.date.today() - datetime.timedelta(days=100),
                'plan': plan_basic,
                'status': 'expired'
            }
        )
        # Manually force expiry status and join date for expired member
        m3.join_date = datetime.date.today() - datetime.timedelta(days=100)
        m3.status = 'expired'
        m3.save()

        m4, _ = Member.objects.get_or_create(
            name="Dawood Ibrahim",
            defaults={
                'phone': '03451113333',
                'email': 'dawood@gmail.com',
                'join_date': datetime.date.today() - datetime.timedelta(days=45),
                'plan': plan_annual,
                'status': 'frozen'
            }
        )

        self.stdout.write("Members seeded.")

        # 5. Seed Attendance logs (past few days)
        today = datetime.date.today()
        for i in range(10):
            day = today - datetime.timedelta(days=i)
            # Bilal checks in most days
            Attendance.objects.get_or_create(member=m1, date=day, defaults={'check_in_time': datetime.datetime.now() - datetime.timedelta(hours=i)})
            # Sana checks in every other day
            if i % 2 == 0:
                Attendance.objects.get_or_create(member=m2, date=day, defaults={'check_in_time': datetime.datetime.now() - datetime.timedelta(hours=i+1)})

        self.stdout.write("Attendance logs seeded.")

        # 6. Seed Personal Training (PT) Packages
        # Bilal gets trainer Ali (t1)
        pt1, _ = PTPackage.objects.get_or_create(
            member=m1,
            trainer=t1,
            defaults={
                'sessions_total': 12,
                'sessions_used': 4,
                'price': 15000.00,
                'created_at': today - datetime.timedelta(days=15)
            }
        )
        
        # Sana gets trainer Zara (t2)
        pt2, _ = PTPackage.objects.get_or_create(
            member=m2,
            trainer=t2,
            defaults={
                'sessions_total': 24,
                'sessions_used': 8,
                'price': 30000.00,
                'created_at': today - datetime.timedelta(days=10)
            }
        )

        self.stdout.write("PT Packages seeded.")

        # 7. Seed Fee collections
        # Bilal paid his fee
        Fee.objects.get_or_create(
            member=m1,
            period_month=today.replace(day=1),
            defaults={
                'amount': 3000.00,
                'payment_date': today - datetime.timedelta(days=18),
                'method': 'jazzcash',
                'status': 'paid'
            }
        )
        
        # Sana's fee is pending
        Fee.objects.get_or_create(
            member=m2,
            period_month=today.replace(day=1),
            defaults={
                'amount': 8000.00,
                'status': 'pending'
            }
        )
        
        # Let's add an overdue fee for Bilal from last month
        last_month = (today.replace(day=1) - datetime.timedelta(days=15)).replace(day=1)
        fee_overdue, _ = Fee.objects.get_or_create(
            member=m1,
            period_month=last_month,
            defaults={
                'amount': 3000.00,
                'status': 'overdue',
                'due_date': last_month.replace(day=10)
            }
        )
        # Re-save to force late fee calculation in database
        fee_overdue.save()

        # Let's seed past paid fees to populate charts
        for m in range(1, 5):
            past_month = (today.replace(day=1) - datetime.timedelta(days=m*30)).replace(day=1)
            # Bilal paid past months
            Fee.objects.get_or_create(
                member=m1,
                period_month=past_month,
                defaults={
                    'amount': 3000.00,
                    'payment_date': past_month + datetime.timedelta(days=5),
                    'method': 'cash',
                    'status': 'paid'
                }
            )
            # Sana paid past months
            Fee.objects.get_or_create(
                member=m2,
                period_month=past_month,
                defaults={
                    'amount': 8000.00,
                    'payment_date': past_month + datetime.timedelta(days=6),
                    'method': 'bank',
                    'status': 'paid'
                }
            )

        self.stdout.write("Fees seeded.")

        # 8. Seed Expenses
        Expense.objects.get_or_create(
            category='rent',
            amount=80000.00,
            date=today.replace(day=1),
            defaults={'description': 'Monthly Gym Facility Rent', 'added_by': owner_user}
        )
        Expense.objects.get_or_create(
            category='utilities',
            amount=25000.00,
            date=today - datetime.timedelta(days=5),
            defaults={'description': 'Electricity Bill', 'added_by': accountant_user}
        )
        Expense.objects.get_or_create(
            category='equipment',
            amount=15000.00,
            date=today - datetime.timedelta(days=12),
            defaults={'description': 'Treadmill Belt Repair', 'added_by': accountant_user}
        )

        # Seed past months expenses for charts
        for m in range(1, 5):
            past_month = (today.replace(day=1) - datetime.timedelta(days=m*30)).replace(day=1)
            Expense.objects.get_or_create(
                category='rent',
                amount=80000.00,
                date=past_month,
                defaults={'description': 'Rent', 'added_by': owner_user}
            )
            Expense.objects.get_or_create(
                category='utilities',
                amount=20000.00,
                date=past_month + datetime.timedelta(days=10),
                defaults={'description': 'Utilities', 'added_by': accountant_user}
            )

        self.stdout.write("Expenses seeded.")

        # 9. Calculate current month's payroll
        calculate_monthly_payroll(today)
        self.stdout.write("Monthly payroll calculated.")

        self.stdout.write(self.style.SUCCESS("Database seeding completed successfully!"))
