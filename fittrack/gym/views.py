import datetime
from decimal import Decimal
from django.db.models import Sum, Count
from django.http import HttpResponse
from django.contrib.auth.models import User, Group
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token

from gym.models import (
    Trainer, Profile, MembershipPlan, Member, 
    Attendance, Fee, PTPackage, TrainerPayroll, Expense,
    WorkoutPlan, DietPlan, SystemSetting
)
from gym.serializers import (
    UserSerializer, TrainerSerializer, ProfileSerializer, 
    MembershipPlanSerializer, MemberSerializer, AttendanceSerializer, 
    FeeSerializer, PTPackageSerializer, TrainerPayrollSerializer, ExpenseSerializer,
    WorkoutPlanSerializer, DietPlanSerializer, SystemSettingSerializer
)
from gym.permissions import IsSuperAdmin, IsManager, IsTrainer, IsAccountant, IsManagerOrAccountant
from gym.payroll_engine import calculate_monthly_payroll
from gym.pdf_generator import generate_fee_receipt_pdf, generate_payslip_pdf


class CustomAuthToken(ObtainAuthToken):
    """
    Custom token authentication view that returns the user's role and trainer ID alongside the token.
    """
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        
        # Get role
        role = 'manager'
        trainer_id = None
        try:
            profile = user.profile
            role = profile.role
            if profile.linked_trainer:
                trainer_id = profile.linked_trainer.id
        except Profile.DoesNotExist:
            if user.is_superuser or user.groups.filter(name='SuperAdmin').exists():
                role = 'super_admin'
            elif user.groups.filter(name='Manager').exists():
                role = 'manager'
            elif user.groups.filter(name='Trainer').exists():
                role = 'trainer'
                trainer = Trainer.objects.filter(user=user).first()
                if trainer:
                    trainer_id = trainer.id
            elif user.groups.filter(name='Accountant').exists():
                role = 'accountant'

        return Response({
            'token': token.key,
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': role,
                'trainer_id': trainer_id
            }
        })


class UserProfileView(APIView):
    """
    Endpoint to retrieve the current user's profile details.
    """
    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class MembershipPlanViewSet(viewsets.ModelViewSet):
    queryset = MembershipPlan.objects.all()
    serializer_class = MembershipPlanSerializer

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManager()]  # Only Managers/SuperAdmins can modify plans
        return [permissions.IsAuthenticated()]


class MemberViewSet(viewsets.ModelViewSet):
    serializer_class = MemberSerializer

    def get_queryset(self):
        user = self.request.user
        # Row level restriction: Trainers only see their own PT clients
        if user.groups.filter(name='Trainer').exists():
            trainer = getattr(user.profile, 'linked_trainer', None)
            if trainer:
                return Member.objects.filter(pt_packages__trainer=trainer).distinct()
            return Member.objects.none()
        return Member.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManager()]  # Only Managers/SuperAdmins can register/edit members
        return [permissions.IsAuthenticated()]


class AttendanceViewSet(viewsets.ModelViewSet):
    serializer_class = AttendanceSerializer

    def get_queryset(self):
        user = self.request.user
        # Row level restriction: Trainers only see their own clients' attendance
        if user.groups.filter(name='Trainer').exists():
            trainer = getattr(user.profile, 'linked_trainer', None)
            if trainer:
                return Attendance.objects.filter(member__pt_packages__trainer=trainer).distinct()
            return Attendance.objects.none()
        return Attendance.objects.all()

    def get_permissions(self):
        if self.action in ['update', 'partial_update', 'destroy']:
            return [IsManager()]
        return [permissions.IsAuthenticated()]

    @action(detail=False, methods=['post'], url_path='check-in')
    def check_in(self, request):
        """
        Record a check-in. Only managers/front desk/super admin can check members in.
        """
        if not (request.user.is_superuser or request.user.groups.filter(name__in=['SuperAdmin', 'Manager']).exists()):
            return Response({'detail': 'You do not have permission to perform this action.'}, status=403)

        member_id = request.data.get('member_id')
        if not member_id:
            return Response({'error': 'member_id is required'}, status=400)
            
        try:
            member = Member.objects.get(id=member_id)
        except Member.DoesNotExist:
            return Response({'error': 'Member not found'}, status=404)
            
        if member.status != 'active':
            return Response({'error': f'Member status is {member.status}. Only active members can check in.'}, status=400)
            
        # Optional: check if already checked in today
        today = datetime.date.today()
        already_checked_in = Attendance.objects.filter(member=member, date=today).exists()
        if already_checked_in:
            return Response({'error': 'Member has already checked in today.'}, status=400)

        attendance = Attendance.objects.create(member=member)
        serializer = self.get_serializer(attendance)
        return Response(serializer.data, status=201)


class FeeViewSet(viewsets.ModelViewSet):
    serializer_class = FeeSerializer

    def get_queryset(self):
        user = self.request.user
        if user.groups.filter(name='Trainer').exists() and not user.is_superuser:
            # Trainers cannot see fees
            return Fee.objects.none()
        return Fee.objects.all()

    def get_permissions(self):
        # Trainers cannot access fees at all
        if self.request.user.groups.filter(name='Trainer').exists() and not self.request.user.is_superuser:
            return [permissions.DjangoModelPermissions()] # triggers 403
            
        if self.action in ['create', 'destroy']:
            return [IsAccountant()] # Accountant or SuperAdmin only
        return [IsManagerOrAccountant()]

    @action(detail=True, methods=['post'])
    def collect(self, request, pk=None):
        """
        Record a fee collection. Marks the fee status as Paid.
        """
        fee = self.get_object()
        method = request.data.get('method', 'cash')
        payment_date = request.data.get('payment_date', datetime.date.today().strftime('%Y-%m-%d'))
        
        fee.status = 'paid'
        fee.method = method
        fee.payment_date = payment_date
        fee.save()
        
        serializer = self.get_serializer(fee)
        return Response(serializer.data)

    @action(detail=False, methods=['post'], url_path='auto-generate')
    def auto_generate(self, request):
        """
        Auto-generates fees for the current month for all active members.
        """
        if not (request.user.is_superuser or request.user.groups.filter(name__in=['SuperAdmin', 'Accountant']).exists()):
            return Response({'detail': 'You do not have permission to generate fees.'}, status=403)
            
        today = datetime.date.today()
        period_month = today.replace(day=1)
        
        active_members = Member.objects.filter(status='active')
        created_count = 0
        
        for member in active_members:
            # Check if fee already exists for this period month
            exists = Fee.objects.filter(member=member, period_month=period_month).exists()
            if not exists:
                Fee.objects.create(
                    member=member,
                    amount=member.plan.price,
                    period_month=period_month,
                    status='pending'
                )
                created_count += 1
                
        return Response({
            'message': f'Dues successfully generated.',
            'created_count': created_count
        })

    @action(detail=True, methods=['get'])
    def receipt(self, request, pk=None):
        """
        Generates and downloads the PDF receipt.
        """
        fee = self.get_object()
        pdf_bytes = generate_fee_receipt_pdf(fee)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="fee_receipt_{fee.id}.pdf"'
        return response


class TrainerViewSet(viewsets.ModelViewSet):
    serializer_class = TrainerSerializer

    def get_queryset(self):
        user = self.request.user
        # Row level restriction: Trainers only see their own trainer profile
        if user.groups.filter(name='Trainer').exists() and not user.is_superuser:
            return Trainer.objects.filter(user=user)
        return Trainer.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsSuperAdmin()] # Only Super Admin can register/manage trainers salary settings
        return [permissions.IsAuthenticated()]


class PTPackageViewSet(viewsets.ModelViewSet):
    serializer_class = PTPackageSerializer

    def get_queryset(self):
        user = self.request.user
        # Row level restriction: Trainers only see their own PT Packages
        if user.groups.filter(name='Trainer').exists() and not user.is_superuser:
            trainer = getattr(user.profile, 'linked_trainer', None)
            if trainer:
                return PTPackage.objects.filter(trainer=trainer)
            return PTPackage.objects.none()
        return PTPackage.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [IsManager()]
        return [permissions.IsAuthenticated()]


class TrainerPayrollViewSet(viewsets.ModelViewSet):
    serializer_class = TrainerPayrollSerializer

    def get_queryset(self):
        user = self.request.user
        # Row level restriction: Trainers only see their own payslips
        if user.groups.filter(name='Trainer').exists() and not user.is_superuser:
            trainer = getattr(user.profile, 'linked_trainer', None)
            if trainer:
                return TrainerPayroll.objects.filter(trainer=trainer)
            return TrainerPayroll.objects.none()
        elif user.groups.filter(name='Manager').exists() and not user.is_superuser:
            # Managers cannot see payroll
            return TrainerPayroll.objects.none()
        return TrainerPayroll.objects.all()

    def get_permissions(self):
        if self.action in ['create', 'destroy', 'calculate']:
            return [IsAccountant()]
        # Allow Accountants, SuperAdmins, and Trainers. Block Managers.
        return [IsAccountant() | IsTrainer()]

    @action(detail=False, methods=['post'])
    def calculate(self, request):
        """
        Runs payroll calculations for all trainers for a specific month.
        """
        month_str = request.data.get('month') # expected YYYY-MM-DD
        if month_str:
            try:
                month_date = datetime.datetime.strptime(month_str, '%Y-%m-%d').date()
            except ValueError:
                return Response({'error': 'Invalid date format. Use YYYY-MM-DD'}, status=400)
        else:
            month_date = datetime.date.today().replace(day=1)

        payrolls = calculate_monthly_payroll(month_date)
        serializer = self.get_serializer(payrolls, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def payslip(self, request, pk=None):
        """
        Generates and downloads the PDF payslip.
        """
        payroll = self.get_object()
        
        # Row-level check: Trainer can only view their own
        if request.user.groups.filter(name='Trainer').exists():
            trainer = getattr(request.user.profile, 'linked_trainer', None)
            if not trainer or payroll.trainer != trainer:
                return Response({'error': 'You do not have permission to view this payslip.'}, status=403)
                
        pdf_bytes = generate_payslip_pdf(payroll)
        response = HttpResponse(pdf_bytes, content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename="payslip_{payroll.id}.pdf"'
        return response


class ExpenseViewSet(viewsets.ModelViewSet):
    queryset = Expense.objects.all()
    serializer_class = ExpenseSerializer
    permission_classes = [IsAccountant]

    def perform_create(self, serializer):
        serializer.save(added_by=self.request.user)


class AnalyticsView(APIView):
    """
    Returns analytics summary widgets and chart data filtered by the requester's role.
    """
    def get(self, request):
        user = request.user
        
        # 1. Super Admin / Accountant Dashboard (Financials, expenses, P&L, trainer performance)
        if user.is_superuser or user.groups.filter(name__in=['SuperAdmin', 'Accountant']).exists():
            total_revenue = Fee.objects.filter(status='paid').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            total_late_fees = Fee.objects.filter(status='paid').aggregate(total=Sum('late_fee'))['total'] or Decimal('0.00')
            revenue = total_revenue + total_late_fees
            
            expenses = Expense.objects.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            net_profit = revenue - expenses
            
            pending_dues = Fee.objects.filter(status='pending').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            overdue_dues = Fee.objects.filter(status='overdue').aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
            overdue_count = Fee.objects.filter(status='overdue').count()

            # Trainer Ranking (Commission + Clients)
            trainer_rankings = []
            trainers = Trainer.objects.all()
            for t in trainers:
                active_clients = PTPackage.objects.filter(trainer=t).values('member').distinct().count()
                commission = TrainerPayroll.objects.filter(trainer=t).aggregate(total=Sum('commission_earned'))['total'] or Decimal('0.00')
                trainer_rankings.append({
                    'id': t.id,
                    'name': t.name,
                    'specialization': t.specialization,
                    'active_clients': active_clients,
                    'commission_total': commission,
                })
            # Sort by clients desc
            trainer_rankings.sort(key=lambda x: x['active_clients'], reverse=True)

            # Chart Data: Last 6 months revenue vs expenses
            chart_data = []
            today = datetime.date.today()
            for i in range(5, -1, -1):
                # Calculate month date
                m_date = today - datetime.timedelta(days=i*30)
                m_start = m_date.replace(day=1)
                if m_start.month == 12:
                    m_end = m_start.replace(year=m_start.year + 1, month=1)
                else:
                    m_end = m_start.replace(month=m_start.month + 1)
                
                # Revenue in month
                m_fees = Fee.objects.filter(status='paid', payment_date__gte=m_start, payment_date__lt=m_end)
                m_rev = (m_fees.aggregate(total=Sum('amount'))['total'] or Decimal('0.00')) + (m_fees.aggregate(total=Sum('late_fee'))['total'] or Decimal('0.00'))
                
                # Expenses in month
                m_exp = Expense.objects.filter(date__gte=m_start, date__lt=m_end).aggregate(total=Sum('amount'))['total'] or Decimal('0.00')
                
                chart_data.append({
                    'month': m_start.strftime('%B %Y'),
                    'revenue': m_rev,
                    'expenses': m_exp
                })

            return Response({
                'role': 'financial',
                'summary': {
                    'total_revenue': revenue,
                    'total_expenses': expenses,
                    'net_profit': net_profit,
                    'pending_dues': pending_dues,
                    'overdue_dues': overdue_dues,
                    'overdue_count': overdue_count,
                },
                'trainer_rankings': trainer_rankings[:5],
                'chart_data': chart_data
            })
            
        # 2. Manager Dashboard (Member growth, attendance, dues count - no financials)
        elif user.groups.filter(name='Manager').exists():
            total_members = Member.objects.count()
            active_members = Member.objects.filter(status='active').count()
            expired_members = Member.objects.filter(status='expired').count()
            frozen_members = Member.objects.filter(status='frozen').count()
            
            today = datetime.date.today()
            today_checkins = Attendance.objects.filter(date=today).count()
            
            # Current Month Collections Dues Stats
            m_start = today.replace(day=1)
            total_dues_count = Fee.objects.filter(period_month=m_start).count()
            paid_dues_count = Fee.objects.filter(period_month=m_start, status='paid').count()
            pending_dues_count = Fee.objects.filter(period_month=m_start, status__in=['pending', 'overdue']).count()

            # Member Registrations Trend (last 6 months)
            registration_trends = []
            for i in range(5, -1, -1):
                m_date = today - datetime.timedelta(days=i*30)
                m_start_sub = m_date.replace(day=1)
                if m_start_sub.month == 12:
                    m_end_sub = m_start_sub.replace(year=m_start_sub.year + 1, month=1)
                else:
                    m_end_sub = m_start_sub.replace(month=m_start_sub.month + 1)
                    
                count = Member.objects.filter(join_date__gte=m_start_sub, join_date__lt=m_end_sub).count()
                registration_trends.append({
                    'month': m_start_sub.strftime('%b %Y'),
                    'count': count
                })

            return Response({
                'role': 'manager',
                'summary': {
                    'total_members': total_members,
                    'active_members': active_members,
                    'expired_members': expired_members,
                    'frozen_members': frozen_members,
                    'today_checkins': today_checkins,
                    'dues_collected': paid_dues_count,
                    'dues_pending': pending_dues_count,
                    'total_dues': total_dues_count
                },
                'chart_data': registration_trends
            })

        # 3. Trainer Dashboard (Own client list, sessions completed, commission)
        elif user.groups.filter(name='Trainer').exists():
            trainer = getattr(user.profile, 'linked_trainer', None)
            if not trainer:
                return Response({'error': 'No linked trainer profile found.'}, status=400)
                
            active_clients_count = PTPackage.objects.filter(trainer=trainer).values('member').distinct().count()
            
            # Sum up sessions used / total
            sessions_stat = PTPackage.objects.filter(trainer=trainer).aggregate(
                total=Sum('sessions_total'),
                used=Sum('sessions_used')
            )
            sessions_total = sessions_stat['total'] or 0
            sessions_used = sessions_stat['used'] or 0
            
            # Commission earned this month
            today = datetime.date.today()
            m_start = today.replace(day=1)
            payroll = TrainerPayroll.objects.filter(trainer=trainer, month=m_start).first()
            commission_earned = payroll.commission_earned if payroll else Decimal('0.00')
            net_pay = payroll.net_pay if payroll else Decimal('0.00')
            
            # Client details list
            clients = []
            packages = PTPackage.objects.filter(trainer=trainer)
            for p in packages:
                clients.append({
                    'member_name': p.member.name,
                    'member_phone': p.member.phone,
                    'sessions_total': p.sessions_total,
                    'sessions_used': p.sessions_used,
                    'sessions_remaining': p.sessions_total - p.sessions_used,
                })

            return Response({
                'role': 'trainer',
                'summary': {
                    'active_clients': active_clients_count,
                    'sessions_total': sessions_total,
                    'sessions_used': sessions_used,
                    'sessions_remaining': sessions_total - sessions_used,
                    'commission_earned': commission_earned,
                    'net_pay': net_pay
                },
                'clients': clients
            })
            
        return Response({'error': 'Role not authorized'}, status=403)


class ReportsView(APIView):
    """
    API endpoint that aggregates month-by-month Income Statements (P&L).
    """
    permission_classes = [IsAccountant]

    def get(self, request):
        from django.db.models.functions import TruncMonth
        
        # Aggregate Paid Fees by month
        fee_monthly = Fee.objects.filter(status='paid').annotate(
            month_period=TruncMonth('payment_date')
        ).values('month_period').annotate(
            total_collected=Sum('amount'),
            total_late_fee=Sum('late_fee')
        ).order_by('-month_period')
        
        # Aggregate Expenses by month
        expense_monthly = Expense.objects.annotate(
            month_period=TruncMonth('date')
        ).values('month_period').annotate(
            total_spent=Sum('amount')
        ).order_by('-month_period')
        
        # Aggregate Payroll by month
        payroll_monthly = TrainerPayroll.objects.annotate(
            month_period=TruncMonth('month')
        ).values('month_period').annotate(
            total_net=Sum('net_pay')
        ).order_by('-month_period')
        
        months_data = {}
        
        for item in fee_monthly:
            if not item['month_period']: continue
            m_str = item['month_period'].strftime('%Y-%m')
            months_data[m_str] = {
                'month': item['month_period'].strftime('%B %Y'),
                'fees_collected': item['total_collected'] or Decimal('0.00'),
                'late_fees_collected': item['total_late_fee'] or Decimal('0.00'),
                'expenses': Decimal('0.00'),
                'payroll': Decimal('0.00'),
            }
            
        for item in expense_monthly:
            if not item['month_period']: continue
            m_str = item['month_period'].strftime('%Y-%m')
            if m_str not in months_data:
                months_data[m_str] = {
                    'month': item['month_period'].strftime('%B %Y'),
                    'fees_collected': Decimal('0.00'),
                    'late_fees_collected': Decimal('0.00'),
                    'expenses': Decimal('0.00'),
                    'payroll': Decimal('0.00'),
                }
            months_data[m_str]['expenses'] = item['total_spent'] or Decimal('0.00')

        for item in payroll_monthly:
            if not item['month_period']: continue
            m_str = item['month_period'].strftime('%Y-%m')
            if m_str not in months_data:
                months_data[m_str] = {
                    'month': item['month_period'].strftime('%B %Y'),
                    'fees_collected': Decimal('0.00'),
                    'late_fees_collected': Decimal('0.00'),
                    'expenses': Decimal('0.00'),
                    'payroll': Decimal('0.00'),
                }
            months_data[m_str]['payroll'] = item['total_net'] or Decimal('0.00')

        reports_list = []
        for m_key, val in sorted(months_data.items(), reverse=True):
            total_revenue = val['fees_collected'] + val['late_fees_collected']
            total_expenses = val['expenses'] + val['payroll']
            net_profit = total_revenue - total_expenses
            reports_list.append({
                'month_key': m_key,
                'month_name': val['month'],
                'revenue_collected': val['fees_collected'],
                'late_fees_collected': val['late_fees_collected'],
                'total_revenue': total_revenue,
                'operating_expenses': val['expenses'],
                'payroll_payouts': val['payroll'],
                'total_expenses': total_expenses,
                'net_profit': net_profit,
            })
            
        return Response({
            'monthly_financials': reports_list
        })


from django.contrib.auth.models import Group, Permission
from gym.serializers import PermissionSerializer, GroupSerializer, UserManageSerializer

class PermissionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Permission.objects.all().order_by('codename')
    serializer_class = PermissionSerializer
    permission_classes = [IsSuperAdmin]


class GroupViewSet(viewsets.ModelViewSet):
    queryset = Group.objects.all().order_by('name')
    serializer_class = GroupSerializer
    permission_classes = [IsSuperAdmin]


class UserManageViewSet(viewsets.ModelViewSet):
    queryset = User.objects.all().order_by('username')
    serializer_class = UserManageSerializer
    permission_classes = [IsSuperAdmin]


class WorkoutPlanViewSet(viewsets.ModelViewSet):
    queryset = WorkoutPlan.objects.all().order_by('-created_at')
    serializer_class = WorkoutPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs

    def perform_create(self, serializer):
        trainer = None
        try:
            profile = self.request.user.profile
            if profile.role == 'trainer' and profile.linked_trainer:
                trainer = profile.linked_trainer
        except Profile.DoesNotExist:
            pass
        serializer.save(trainer=trainer)


class DietPlanViewSet(viewsets.ModelViewSet):
    queryset = DietPlan.objects.all().order_by('-created_at')
    serializer_class = DietPlanSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = super().get_queryset()
        member_id = self.request.query_params.get('member')
        if member_id:
            qs = qs.filter(member_id=member_id)
        return qs

    def perform_create(self, serializer):
        trainer = None
        try:
            profile = self.request.user.profile
            if profile.role == 'trainer' and profile.linked_trainer:
                trainer = profile.linked_trainer
        except Profile.DoesNotExist:
            pass
        serializer.save(trainer=trainer)


class SystemSettingViewSet(viewsets.ModelViewSet):
    queryset = SystemSetting.objects.all().order_by('key')
    serializer_class = SystemSettingSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_permissions(self):
        if self.request.method in permissions.SAFE_METHODS:
            return [permissions.IsAuthenticated()]
        return [permissions.IsAuthenticated(), (IsSuperAdmin | IsManager)()]


import csv
import io

class DataImportView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsSuperAdmin | IsManager]
    
    def post(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        target_type = request.data.get('target_type')
        
        if not file_obj:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)
            
        if target_type not in ['members', 'trainers']:
            return Response({'error': 'Invalid target_type. Must be members or trainers'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            data_set = file_obj.read().decode('utf-8-sig')
            io_string = io.StringIO(data_set)
            reader = csv.DictReader(io_string)
            
            imported_count = 0
            errors = []
            
            if target_type == 'members':
                default_plan = MembershipPlan.objects.first()
                for row_idx, row in enumerate(reader):
                    try:
                        name = row.get('name', '').strip()
                        phone = row.get('phone', '').strip()
                        email = row.get('email', '').strip()
                        join_date_str = row.get('join_date', '').strip()
                        plan_name = row.get('plan', '').strip()
                        status_val = row.get('status', 'active').strip().lower()
                        
                        if not name or not phone:
                            raise ValueError("Name and Phone are required")
                            
                        plan = default_plan
                        if plan_name:
                            matched_plan = MembershipPlan.objects.filter(name__icontains=plan_name).first()
                            if matched_plan:
                                plan = matched_plan
                                
                        if not plan:
                            raise ValueError("No membership plan exists. Please create one first.")
                            
                        join_date = datetime.date.today()
                        if join_date_str:
                            try:
                                join_date = datetime.datetime.strptime(join_date_str, '%Y-%m-%d').date()
                            except ValueError:
                                try:
                                    join_date = datetime.datetime.strptime(join_date_str, '%d-%m-%Y').date()
                                except ValueError:
                                    pass
                                    
                        if status_val not in ['active', 'expired', 'frozen']:
                            status_val = 'active'
                            
                        Member.objects.create(
                            name=name,
                            phone=phone,
                            email=email,
                            join_date=join_date,
                            plan=plan,
                            status=status_val
                        )
                        imported_count += 1
                    except Exception as e:
                        errors.append(f"Row {row_idx + 1}: {str(e)}")
                        
            elif target_type == 'trainers':
                for row_idx, row in enumerate(reader):
                    try:
                        name = row.get('name', '').strip()
                        phone = row.get('phone', '').strip()
                        specialization = row.get('specialization', '').strip()
                        salary_type = row.get('salary_type', 'fixed').strip().lower()
                        base_salary_str = row.get('base_salary', '0').strip()
                        commission_pct_str = row.get('commission_pct', '0').strip()
                        
                        if not name or not phone:
                            raise ValueError("Name and Phone are required")
                            
                        if salary_type not in ['fixed', 'commission', 'hybrid']:
                            salary_type = 'fixed'
                            
                        base_salary = Decimal(base_salary_str or '0.00')
                        commission_pct = Decimal(commission_pct_str or '0.00')
                        
                        Trainer.objects.create(
                            name=name,
                            phone=phone,
                            specialization=specialization,
                            salary_type=salary_type,
                            base_salary=base_salary,
                            commission_pct=commission_pct
                        )
                        imported_count += 1
                    except Exception as e:
                        errors.append(f"Row {row_idx + 1}: {str(e)}")
            
            if errors and imported_count == 0:
                return Response({'error': 'Import failed', 'details': errors}, status=status.HTTP_400_BAD_REQUEST)
                
            return Response({
                'success': True,
                'imported_count': imported_count,
                'errors': errors
            })
        except Exception as e:
            return Response({'error': f"Failed to parse CSV: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)
