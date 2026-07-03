import datetime
from django.core.management.base import BaseCommand
from django.contrib.auth.models import User, Group
from gym.models import (
    Trainer, Profile, MembershipPlan, Member, 
    Attendance, Fee, PTPackage, TrainerPayroll, Expense,
    WorkoutPlan, DietPlan, SystemSetting
)

class Command(BaseCommand):
    help = "Clears all mock/seed data from the database, leaving only the primary SuperAdmin account and default security groups."

    def handle(self, *args, **options):
        self.stdout.write("Starting database cleaning...")

        # 1. Delete all transactional / log / client data
        Attendance.objects.all().delete()
        Fee.objects.all().delete()
        PTPackage.objects.all().delete()
        TrainerPayroll.objects.all().delete()
        Expense.objects.all().delete()
        WorkoutPlan.objects.all().delete()
        DietPlan.objects.all().delete()
        SystemSetting.objects.all().delete()
        
        # 2. Delete Members and Trainers
        Member.objects.all().delete()
        Trainer.objects.all().delete()

        # 3. Clean Users (keep only superusers or username='owner')
        users_to_keep = User.objects.filter(is_superuser=True) | User.objects.filter(username='owner')
        users_to_keep_ids = list(users_to_keep.values_list('id', flat=True))
        
        # Delete profiles for other users first to avoid cascade blocks
        Profile.objects.exclude(user_id__in=users_to_keep_ids).delete()
        User.objects.exclude(id__in=users_to_keep_ids).delete()

        # 4. Ensure standard groups exist
        super_admin_group, _ = Group.objects.get_or_create(name='SuperAdmin')
        manager_group, _ = Group.objects.get_or_create(name='Manager')
        trainer_group, _ = Group.objects.get_or_create(name='Trainer')
        accountant_group, _ = Group.objects.get_or_create(name='Accountant')

        # 5. Ensure owner/superadmin exists
        owner_user = User.objects.filter(username='owner').first()
        if not owner_user:
            # Fallback if no owner exists
            owner_user = User.objects.create_superuser(username='owner', email='owner@gympro.com', password='owner123')
            owner_user.first_name = "Gym"
            owner_user.last_name = "Owner"
            owner_user.save()
            
        owner_user.is_staff = True
        owner_user.is_superuser = True
        owner_user.save()

        # Ensure owner's profile role is super_admin
        profile, _ = Profile.objects.get_or_create(user=owner_user)
        profile.role = 'super_admin'
        profile.save()

        # Add owner to SuperAdmin group
        owner_user.groups.add(super_admin_group)

        self.stdout.write(self.style.SUCCESS("All seed/mock data has been successfully deleted!"))
