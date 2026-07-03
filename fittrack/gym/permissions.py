from rest_framework import permissions

class IsSuperAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.is_superuser or request.user.groups.filter(name='SuperAdmin').exists()
        )


class IsManager(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.groups.filter(name='Manager').exists() or 
            request.user.groups.filter(name='SuperAdmin').exists() or
            request.user.is_superuser
        )


class IsTrainer(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.groups.filter(name='Trainer').exists() or
            request.user.groups.filter(name='SuperAdmin').exists() or
            request.user.is_superuser
        )


class IsAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and (
            request.user.groups.filter(name='Accountant').exists() or
            request.user.groups.filter(name='SuperAdmin').exists() or
            request.user.is_superuser
        )


class IsManagerOrAccountant(permissions.BasePermission):
    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated):
            return False
        return request.user.is_superuser or request.user.groups.filter(name__in=['SuperAdmin', 'Manager', 'Accountant']).exists()
