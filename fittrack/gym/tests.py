import datetime
from decimal import Decimal
from django.test import TestCase
from django.contrib.auth.models import User, Group
from rest_framework.test import APITestCase
from rest_framework.authtoken.models import Token
from gym.models import (
    MembershipPlan, Member, Trainer, PTPackage, 
    Fee, TrainerPayroll, Expense, Profile
)
from gym.payroll_engine import calculate_monthly_payroll


class GymModelsTestCase(TestCase):
    def setUp(self):
        # Create standard groups
        Group.objects.get_or_create(name='SuperAdmin')
        Group.objects.get_or_create(name='Manager')
        Group.objects.get_or_create(name='Trainer')
        Group.objects.get_or_create(name='Accountant')

        # Create plans
        self.plan = MembershipPlan.objects.create(
            name="1 Month Basic",
            duration_months=1,
            price=Decimal('3000.00'),
            features=["Gym Floor"]
        )
        self.plan_3m = MembershipPlan.objects.create(
            name="3 Month Gold",
            duration_months=3,
            price=Decimal('8000.00'),
            features=["Gym Floor", "Sauna"]
        )

    def test_member_auto_expiry_date(self):
        """
        Verify that member expiry date is auto-calculated based on plan duration.
        """
        join_date = datetime.date(2026, 7, 3)
        member = Member.objects.create(
            name="Bilal Khan",
            phone="03001234567",
            join_date=join_date,
            plan=self.plan,
            status="active"
        )
        
        # Expected expiry date: 2026-07-03 + 1 month = 2026-08-03
        self.assertEqual(member.expiry_date, datetime.date(2026, 8, 3))

        # Check 3 months plan
        member_3m = Member.objects.create(
            name="Sana Shah",
            phone="03001234568",
            join_date=join_date,
            plan=self.plan_3m,
            status="active"
        )
        # Expected: 2026-07-03 + 3 months = 2026-10-03
        self.assertEqual(member_3m.expiry_date, datetime.date(2026, 10, 3))

    def test_fee_late_fee_calculation(self):
        """
        Verify that late fees are auto-calculated on save if past the due date.
        """
        member = Member.objects.create(
            name="Ali Khan",
            phone="03001112222",
            plan=self.plan,
            status="active"
        )
        
        # Create fee period in past
        past_period = datetime.date.today().replace(day=1) - datetime.timedelta(days=35)
        past_period = past_period.replace(day=1)
        due_date = past_period.replace(day=10) # 10th of that month
        
        fee = Fee.objects.create(
            member=member,
            amount=Decimal('3000.00'),
            period_month=past_period,
            due_date=due_date,
            status='pending'
        )
        
        # Since it is past due_date, status should change to 'overdue' and late_fee should be set
        self.assertEqual(fee.status, 'overdue')
        today = datetime.date.today()
        expected_days_late = (today - due_date).days
        expected_late_fee = expected_days_late * 50.00
        self.assertEqual(float(fee.late_fee), expected_late_fee)


class PayrollEngineTestCase(TestCase):
    def setUp(self):
        Group.objects.get_or_create(name='SuperAdmin')
        Group.objects.get_or_create(name='Manager')
        Group.objects.get_or_create(name='Trainer')
        Group.objects.get_or_create(name='Accountant')

        self.plan = MembershipPlan.objects.create(
            name="Basic Plan",
            duration_months=1,
            price=Decimal('3000.00'),
            features=[]
        )
        self.member = Member.objects.create(
            name="Bilal Khan",
            phone="03001234567",
            plan=self.plan,
            status="active"
        )

        # Create trainer Ali: Hybrid
        self.trainer_hybrid = Trainer.objects.create(
            name="Ali Ahmed",
            phone="03001112222",
            specialization="Strength",
            salary_type="hybrid",
            base_salary=Decimal('20000.00'),
            commission_pct=Decimal('10.00')
        )

        # Create trainer Zara: Commission Only
        self.trainer_comm = Trainer.objects.create(
            name="Zara Khan",
            phone="03003334444",
            specialization="Yoga",
            salary_type="commission",
            base_salary=Decimal('0.00'),
            commission_pct=Decimal('20.00')
        )

    def test_payroll_fixed_commission_hybrid(self):
        """
        Verify that monthly payroll calculation is correct according to trainer structure.
        """
        today = datetime.date.today()
        start_of_month = today.replace(day=1)

        # Bilal purchases PT package with Ali: 15,000 PKR
        PTPackage.objects.create(
            member=self.member,
            trainer=self.trainer_hybrid,
            sessions_total=12,
            price=Decimal('15000.00'),
            created_at=start_of_month + datetime.timedelta(days=2)
        )

        # Bilal purchases PT package with Zara: 30,000 PKR
        PTPackage.objects.create(
            member=self.member,
            trainer=self.trainer_comm,
            sessions_total=12,
            price=Decimal('30000.00'),
            created_at=start_of_month + datetime.timedelta(days=4)
        )

        calculate_monthly_payroll(start_of_month)

        # Fetch payroll for Ali (Hybrid: Base 20,000 + 10% of 15,000 = 21,500)
        pay_hybrid = TrainerPayroll.objects.get(trainer=self.trainer_hybrid, month=start_of_month)
        self.assertEqual(pay_hybrid.base_pay, Decimal('20000.00'))
        self.assertEqual(pay_hybrid.commission_earned, Decimal('1500.00'))
        self.assertEqual(pay_hybrid.net_pay, Decimal('21500.00'))

        # Fetch payroll for Zara (Comm: Base 0 + 20% of 30,000 = 6,000)
        pay_comm = TrainerPayroll.objects.get(trainer=self.trainer_comm, month=start_of_month)
        self.assertEqual(pay_comm.base_pay, Decimal('0.00'))
        self.assertEqual(pay_comm.commission_earned, Decimal('6000.00'))
        self.assertEqual(pay_comm.net_pay, Decimal('6000.00'))


class GymAPIPermissionsTestCase(APITestCase):
    def setUp(self):
        # Create groups and assign
        super_admin_group, _ = Group.objects.get_or_create(name='SuperAdmin')
        manager_group, _ = Group.objects.get_or_create(name='Manager')
        trainer_group, _ = Group.objects.get_or_create(name='Trainer')
        accountant_group, _ = Group.objects.get_or_create(name='Accountant')

        # Create users
        self.admin_user = User.objects.create_user(username='admin', password='password123', is_superuser=True)
        profile_admin = self.admin_user.profile
        profile_admin.role = 'super_admin'
        profile_admin.save()
        self.admin_token = Token.objects.create(user=self.admin_user).key

        self.manager_user = User.objects.create_user(username='manager', password='password123')
        profile_manager = self.manager_user.profile
        profile_manager.role = 'manager'
        profile_manager.save()
        self.manager_token = Token.objects.create(user=self.manager_user).key

        self.trainer_user = User.objects.create_user(username='trainer', password='password123')
        self.trainer = Trainer.objects.create(user=self.trainer_user, name="Trainer T", phone="123", specialization="Strength")
        profile_trainer = self.trainer_user.profile
        profile_trainer.role = 'trainer'
        profile_trainer.linked_trainer = self.trainer
        profile_trainer.save()
        self.trainer_token = Token.objects.create(user=self.trainer_user).key

        self.accountant_user = User.objects.create_user(username='accountant', password='password123')
        profile_accountant = self.accountant_user.profile
        profile_accountant.role = 'accountant'
        profile_accountant.save()
        self.accountant_token = Token.objects.create(user=self.accountant_user).key

    def test_expenses_access_denied_for_manager_and_trainer(self):
        """
        Verify that managers and trainers cannot view or modify expenses (403 Forbidden).
        """
        # Manager tries to list expenses
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/expenses/')
        self.assertEqual(response.status_code, 403)

        # Trainer tries to list expenses
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.trainer_token)
        response = self.client.get('/api/expenses/')
        self.assertEqual(response.status_code, 403)

        # Accountant gets full access
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.accountant_token)
        response = self.client.get('/api/expenses/')
        self.assertEqual(response.status_code, 200)

    def test_reports_access_denied_for_manager(self):
        """
        Verify that managers are denied reports access, while accountants are allowed.
        """
        # Manager tries to fetch reports
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.manager_token)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, 403)

        # Accountant tries to fetch reports
        self.client.credentials(HTTP_AUTHORIZATION='Token ' + self.accountant_token)
        response = self.client.get('/api/reports/')
        self.assertEqual(response.status_code, 200)
