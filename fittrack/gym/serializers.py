from rest_framework import serializers
from django.contrib.auth.models import User
from gym.models import (
    Trainer, Profile, MembershipPlan, Member, 
    Attendance, Fee, PTPackage, TrainerPayroll, Expense,
    WorkoutPlan, DietPlan, SystemSetting
)


class UserSerializer(serializers.ModelSerializer):
    role = serializers.SerializerMethodField()
    trainer_id = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'trainer_id']

    def get_role(self, obj):
        try:
            return obj.profile.role
        except Profile.DoesNotExist:
            if obj.is_superuser or obj.groups.filter(name='SuperAdmin').exists():
                return 'super_admin'
            elif obj.groups.filter(name='Manager').exists():
                return 'manager'
            elif obj.groups.filter(name='Trainer').exists():
                return 'trainer'
            elif obj.groups.filter(name='Accountant').exists():
                return 'accountant'
            return 'manager' # Default fallback

    def get_trainer_id(self, obj):
        try:
            if obj.profile.linked_trainer:
                return obj.profile.linked_trainer.id
        except Profile.DoesNotExist:
            pass
        trainer = Trainer.objects.filter(user=obj).first()
        if trainer:
            return trainer.id
        return None


class TrainerSerializer(serializers.ModelSerializer):
    username = serializers.CharField(write_only=True, required=False)
    password = serializers.CharField(write_only=True, required=False)
    email = serializers.EmailField(write_only=True, required=False)
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Trainer
        fields = ['id', 'user', 'name', 'phone', 'specialization', 'salary_type', 
                  'base_salary', 'commission_pct', 'username', 'password', 'email', 'user_details']
        read_only_fields = ['user']

    def validate_username(self, value):
        if value and User.objects.filter(username__iexact=value).exists():
            raise serializers.ValidationError("A user with this username already exists.")
        return value

    def validate_email(self, value):
        if value and User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("A user with this email already exists.")
        return value

    def create(self, validated_data):
        username = validated_data.pop('username', None)
        password = validated_data.pop('password', None)
        email = validated_data.pop('email', '')

        trainer = Trainer.objects.create(**validated_data)

        # If username is provided, create a Django User
        if username and password:
            user = User.objects.create_user(username=username, password=password, email=email, first_name=trainer.name)
            trainer.user = user
            trainer.save()
            # Create or update profile (since User post_save signal may have already created it)
            Profile.objects.update_or_create(
                user=user,
                defaults={'role': 'trainer', 'linked_trainer': trainer}
            )

        return trainer


class ProfileSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'user', 'role', 'linked_trainer', 'user_details']


class MembershipPlanSerializer(serializers.ModelSerializer):
    class Meta:
        model = MembershipPlan
        fields = '__all__'


class MemberSerializer(serializers.ModelSerializer):
    plan_details = MembershipPlanSerializer(source='plan', read_only=True)

    class Meta:
        model = Member
        fields = ['id', 'name', 'phone', 'email', 'join_date', 'plan', 'status', 'expiry_date', 'plan_details']
        read_only_fields = ['expiry_date']


class AttendanceSerializer(serializers.ModelSerializer):
    member_details = MemberSerializer(source='member', read_only=True)

    class Meta:
        model = Attendance
        fields = ['id', 'member', 'check_in_time', 'date', 'member_details']
        read_only_fields = ['check_in_time', 'date']


class FeeSerializer(serializers.ModelSerializer):
    member_details = MemberSerializer(source='member', read_only=True)
    month_name = serializers.SerializerMethodField()
    overdue_days = serializers.SerializerMethodField()

    class Meta:
        model = Fee
        fields = ['id', 'member', 'amount', 'payment_date', 'period_month', 'due_date', 
                  'method', 'status', 'late_fee', 'member_details', 'month_name', 'overdue_days']
        read_only_fields = ['late_fee']

    def get_month_name(self, obj):
        if obj.period_month:
            return obj.period_month.strftime('%B %Y')
        return ""

    def get_overdue_days(self, obj):
        import datetime
        if obj.status == 'paid':
            if obj.payment_date and obj.due_date and obj.payment_date > obj.due_date:
                return (obj.payment_date - obj.due_date).days
            return 0
        else:
            if obj.due_date:
                today = datetime.date.today()
                if today > obj.due_date:
                    return (today - obj.due_date).days
            return 0


class PTPackageSerializer(serializers.ModelSerializer):
    member_details = MemberSerializer(source='member', read_only=True)
    trainer_details = TrainerSerializer(source='trainer', read_only=True)

    class Meta:
        model = PTPackage
        fields = ['id', 'member', 'trainer', 'sessions_total', 'sessions_used', 'price', 'created_at', 
                  'member_details', 'trainer_details']


class TrainerPayrollSerializer(serializers.ModelSerializer):
    trainer_details = TrainerSerializer(source='trainer', read_only=True)
    month_name = serializers.SerializerMethodField()

    class Meta:
        model = TrainerPayroll
        fields = ['id', 'trainer', 'month', 'base_pay', 'commission_earned', 'deductions', 'net_pay', 
                  'trainer_details', 'month_name']

    def get_month_name(self, obj):
        if obj.month:
            return obj.month.strftime('%B %Y')
        return ""


class ExpenseSerializer(serializers.ModelSerializer):
    added_by_details = UserSerializer(source='added_by', read_only=True)

    class Meta:
        model = Expense
        fields = ['id', 'category', 'amount', 'date', 'description', 'added_by', 'added_by_details']
        read_only_fields = ['added_by']


from django.contrib.auth.models import Group, Permission

class PermissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Permission
        fields = ['id', 'name', 'codename']


class GroupSerializer(serializers.ModelSerializer):
    permissions = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Permission.objects.all(),
        required=False
    )
    permission_details = PermissionSerializer(source='permissions', many=True, read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'permissions', 'permission_details']


class UserManageSerializer(serializers.ModelSerializer):
    role = serializers.CharField(write_only=True, required=False)
    groups = serializers.PrimaryKeyRelatedField(
        many=True,
        queryset=Group.objects.all(),
        required=False
    )
    group_names = serializers.SerializerMethodField(read_only=True)

    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password', 'groups', 'group_names', 'role']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

    def get_group_names(self, obj):
        return [g.name for g in obj.groups.all()]

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data['role'] = instance.profile.role
        except Profile.DoesNotExist:
            # Fallback based on groups
            if instance.groups.filter(name='SuperAdmin').exists():
                data['role'] = 'super_admin'
            elif instance.groups.filter(name='Manager').exists():
                data['role'] = 'manager'
            elif instance.groups.filter(name='Trainer').exists():
                data['role'] = 'trainer'
            elif instance.groups.filter(name='Accountant').exists():
                data['role'] = 'accountant'
            else:
                data['role'] = 'manager'
        return data

    def create(self, validated_data):
        groups = validated_data.pop('groups', [])
        role = validated_data.pop('role', 'manager')
        password = validated_data.pop('password', None)
        
        user = User.objects.create(**validated_data)
        if password:
            user.set_password(password)
            user.save()
            
        user.groups.set(groups)
        
        # Profile is created by signal; sync role to profile
        profile = user.profile
        profile.role = role
        profile.save()
        
        return user

    def update(self, instance, validated_data):
        groups = validated_data.pop('groups', None)
        role = validated_data.pop('role', None)
        password = validated_data.pop('password', None)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)
            
        if password:
            instance.set_password(password)
            
        instance.save()

        if groups is not None:
            instance.groups.set(groups)

        if role:
            profile = instance.profile
            profile.role = role
            profile.save()

        return instance


class WorkoutPlanSerializer(serializers.ModelSerializer):
    member_details = MemberSerializer(source='member', read_only=True)
    trainer_details = TrainerSerializer(source='trainer', read_only=True)

    class Meta:
        model = WorkoutPlan
        fields = ['id', 'member', 'trainer', 'day_of_week', 'exercises', 'created_at', 
                  'member_details', 'trainer_details']


class DietPlanSerializer(serializers.ModelSerializer):
    member_details = MemberSerializer(source='member', read_only=True)
    trainer_details = TrainerSerializer(source='trainer', read_only=True)

    class Meta:
        model = DietPlan
        fields = ['id', 'member', 'trainer', 'day_of_week', 'meals', 'created_at', 
                  'member_details', 'trainer_details']


class SystemSettingSerializer(serializers.ModelSerializer):
    class Meta:
        model = SystemSetting
        fields = '__all__'
