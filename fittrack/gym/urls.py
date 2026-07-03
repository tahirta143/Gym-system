from django.urls import path, include
from rest_framework.routers import DefaultRouter
from gym.views import (
    CustomAuthToken, UserProfileView, MembershipPlanViewSet, MemberViewSet,
    AttendanceViewSet, FeeViewSet, TrainerViewSet, PTPackageViewSet,
    TrainerPayrollViewSet, ExpenseViewSet, AnalyticsView, ReportsView,
    GroupViewSet, PermissionViewSet, UserManageViewSet,
    WorkoutPlanViewSet, DietPlanViewSet, SystemSettingViewSet, DataImportView
)

router = DefaultRouter()
router.register(r'plans', MembershipPlanViewSet, basename='plan')
router.register(r'members', MemberViewSet, basename='member')
router.register(r'attendance', AttendanceViewSet, basename='attendance')
router.register(r'fees', FeeViewSet, basename='fee')
router.register(r'trainers', TrainerViewSet, basename='trainer')
router.register(r'pt-packages', PTPackageViewSet, basename='pt-package')
router.register(r'payroll', TrainerPayrollViewSet, basename='payroll')
router.register(r'expenses', ExpenseViewSet, basename='expense')
router.register(r'groups', GroupViewSet, basename='group')
router.register(r'permissions', PermissionViewSet, basename='permission')
router.register(r'users-manage', UserManageViewSet, basename='users-manage')
router.register(r'workouts', WorkoutPlanViewSet, basename='workout')
router.register(r'diets', DietPlanViewSet, basename='diet')
router.register(r'settings', SystemSettingViewSet, basename='settings')

urlpatterns = [
    path('login/', CustomAuthToken.as_view(), name='api-login'),
    path('user-profile/', UserProfileView.as_view(), name='api-user-profile'),
    path('analytics/', AnalyticsView.as_view(), name='api-analytics'),
    path('reports/', ReportsView.as_view(), name='api-reports'),
    path('import/', DataImportView.as_view(), name='api-import'),
    path('', include(router.urls)),
]
