import datetime
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.contrib.auth.models import Group

def add_months(sourcedate, months):
    month = sourcedate.month - 1 + months
    year = sourcedate.year + month // 12
    month = month % 12 + 1
    day = min(sourcedate.day, [31,
        29 if year % 4 == 0 and (year % 100 != 0 or year % 400 == 0) else 28,
        31, 30, 31, 30, 31, 31, 30, 31, 30, 31][month-1])
    return datetime.date(year, month, day)


class Trainer(models.Model):
    SALARY_TYPES = [
        ('fixed', 'Fixed Only'),
        ('commission', 'Commission Only'),
        ('hybrid', 'Hybrid (Base + Commission)'),
    ]
    user = models.OneToOneField(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='trainer_profile')
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    specialization = models.CharField(max_length=150)
    salary_type = models.CharField(max_length=20, choices=SALARY_TYPES, default='fixed')
    base_salary = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    commission_pct = models.DecimalField(max_digits=5, decimal_places=2, default=0.0) # Percentage e.g. 10.00 for 10%

    def __str__(self):
        return self.name


class Profile(models.Model):
    ROLES = [
        ('super_admin', 'Super Admin'),
        ('manager', 'Manager'),
        ('trainer', 'Trainer'),
        ('accountant', 'Accountant'),
    ]
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    role = models.CharField(max_length=20, choices=ROLES, default='manager')
    linked_trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True, related_name='profiles')

    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"


class MembershipPlan(models.Model):
    name = models.CharField(max_length=100)
    duration_months = models.IntegerField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    features = models.JSONField(default=list, blank=True)

    def __str__(self):
        return f"{self.name} ({self.duration_months} Months)"


class Member(models.Model):
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('expired', 'Expired'),
        ('frozen', 'Frozen'),
    ]
    name = models.CharField(max_length=100)
    phone = models.CharField(max_length=20)
    email = models.EmailField(blank=True)
    join_date = models.DateField(default=datetime.date.today)
    plan = models.ForeignKey(MembershipPlan, on_delete=models.PROTECT, related_name='members')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    expiry_date = models.DateField(null=True, blank=True)

    def save(self, *args, **kwargs):
        if self.join_date and self.plan:
            self.expiry_date = add_months(self.join_date, self.plan.duration_months)
        
        # Check if expired based on current date
        today = datetime.date.today()
        if self.expiry_date and today > self.expiry_date and self.status == 'active':
            self.status = 'expired'
            
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Attendance(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='attendances')
    check_in_time = models.DateTimeField(default=datetime.datetime.now)
    date = models.DateField(default=datetime.date.today)

    def __str__(self):
        return f"{self.member.name} - {self.date} {self.check_in_time.strftime('%H:%M')}"


class Fee(models.Model):
    PAYMENT_METHODS = [
        ('cash', 'Cash'),
        ('card', 'Card'),
        ('jazzcash', 'JazzCash'),
        ('easypaisa', 'Easypaisa'),
        ('bank', 'Bank Transfer'),
    ]
    STATUS_CHOICES = [
        ('paid', 'Paid'),
        ('pending', 'Pending'),
        ('overdue', 'Overdue'),
    ]
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='fees')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateField(null=True, blank=True)
    period_month = models.DateField() # First day of the covered month
    due_date = models.DateField(null=True, blank=True)
    method = models.CharField(max_length=20, choices=PAYMENT_METHODS, default='cash')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    late_fee = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)

    def save(self, *args, **kwargs):
        if not self.due_date and self.period_month:
            # Due date default is the 10th of that period's month
            self.due_date = self.period_month.replace(day=10)
        
        # If pending or overdue, check if currently late
        if self.status in ['pending', 'overdue']:
            today = datetime.date.today()
            if self.due_date and today > self.due_date:
                self.status = 'overdue'
                # 50 PKR late fee per day past due date
                days_late = (today - self.due_date).days
                self.late_fee = days_late * 50.00
            else:
                self.late_fee = 0.00
                
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.member.name} - {self.period_month.strftime('%B %Y')} ({self.status})"


class PTPackage(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='pt_packages')
    trainer = models.ForeignKey(Trainer, on_delete=models.CASCADE, related_name='pt_packages')
    sessions_total = models.IntegerField()
    sessions_used = models.IntegerField(default=0)
    price = models.DecimalField(max_digits=10, decimal_places=2)
    created_at = models.DateField(default=datetime.date.today)

    def __str__(self):
        return f"{self.member.name} with {self.trainer.name} ({self.sessions_used}/{self.sessions_total} sessions)"


class TrainerPayroll(models.Model):
    trainer = models.ForeignKey(Trainer, on_delete=models.CASCADE, related_name='payrolls')
    month = models.DateField() # Represented by the 1st of the month
    base_pay = models.DecimalField(max_digits=10, decimal_places=2)
    commission_earned = models.DecimalField(max_digits=10, decimal_places=2)
    deductions = models.DecimalField(max_digits=10, decimal_places=2, default=0.0)
    net_pay = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.trainer.name} Payroll - {self.month.strftime('%B %Y')}"


class Expense(models.Model):
    CATEGORIES = [
        ('rent', 'Rent'),
        ('utilities', 'Utilities'),
        ('equipment', 'Equipment'),
        ('salary', 'Salary Payments'),
        ('commission', 'Trainer Commissions'),
        ('misc', 'Miscellaneous'),
    ]
    category = models.CharField(max_length=20, choices=CATEGORIES)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    date = models.DateField(default=datetime.date.today)
    description = models.TextField(blank=True)
    added_by = models.ForeignKey(User, on_delete=models.PROTECT, related_name='added_expenses')

    def __str__(self):
        return f"{self.get_category_display()}: {self.amount} on {self.date}"


# --- Signals to sync Profile Roles with Django Groups & Trainer links ---
@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        role = 'super_admin' if instance.is_superuser else 'manager'
        Profile.objects.get_or_create(user=instance, defaults={'role': role})

@receiver(post_save, sender=Profile)
def sync_user_groups(sender, instance, created, **kwargs):
    user = instance.user
    
    # Map Profile role to Django group name
    role_to_group = {
        'super_admin': 'SuperAdmin',
        'manager': 'Manager',
        'trainer': 'Trainer',
        'accountant': 'Accountant',
    }
    
    # Ensure all groups exist
    for group_name in role_to_group.values():
        Group.objects.get_or_create(name=group_name)
    
    # Clear user's roles groups and re-assign current one
    current_group_name = role_to_group.get(instance.role)
    if current_group_name:
        for role_code, gname in role_to_group.items():
            group = Group.objects.get(name=gname)
            if gname == current_group_name:
                user.groups.add(group)
            else:
                user.groups.remove(group)
                
    # Keep user.is_staff in sync for Super Admin to access Django Admin
    if instance.role == 'super_admin':
        if not user.is_staff:
            user.is_staff = True
            user.save()


class WorkoutPlan(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='workout_plans')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True)
    day_of_week = models.CharField(max_length=15, choices=[
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday'), ('Sunday', 'Sunday')
    ])
    exercises = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.name} - {self.day_of_week} Workout"


class DietPlan(models.Model):
    member = models.ForeignKey(Member, on_delete=models.CASCADE, related_name='diet_plans')
    trainer = models.ForeignKey(Trainer, on_delete=models.SET_NULL, null=True, blank=True)
    day_of_week = models.CharField(max_length=15, choices=[
        ('Monday', 'Monday'), ('Tuesday', 'Tuesday'), ('Wednesday', 'Wednesday'),
        ('Thursday', 'Thursday'), ('Friday', 'Friday'), ('Saturday', 'Saturday'), ('Sunday', 'Sunday')
    ])
    meals = models.JSONField(default=list, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.member.name} - {self.day_of_week} Diet"


class SystemSetting(models.Model):
    key = models.CharField(max_length=100, unique=True)
    value = models.TextField()
    description = models.TextField(blank=True)

    def __str__(self):
        return self.key
