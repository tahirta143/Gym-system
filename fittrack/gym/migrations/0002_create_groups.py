from django.db import migrations

def create_groups_and_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Permission = apps.get_model('auth', 'Permission')
    ContentType = apps.get_model('contenttypes', 'ContentType')

    # Create Groups
    super_admin_group, _ = Group.objects.get_or_create(name='SuperAdmin')
    manager_group, _ = Group.objects.get_or_create(name='Manager')
    trainer_group, _ = Group.objects.get_or_create(name='Trainer')
    accountant_group, _ = Group.objects.get_or_create(name='Accountant')

    # Define permission mappings
    # Group -> (app_label, model_name, [codename, ...])
    permission_map = {
        'Manager': [
            ('gym', 'member', ['add_member', 'change_member', 'delete_member', 'view_member']),
            ('gym', 'membershipplan', ['add_membershipplan', 'change_membershipplan', 'view_membershipplan']),
            ('gym', 'attendance', ['add_attendance', 'change_attendance', 'delete_attendance', 'view_attendance']),
            ('gym', 'fee', ['add_fee', 'change_fee', 'view_fee']),
            ('gym', 'ptpackage', ['add_ptpackage', 'change_ptpackage', 'delete_ptpackage', 'view_ptpackage']),
            ('gym', 'trainer', ['view_trainer']),
        ],
        'Trainer': [
            ('gym', 'member', ['view_member']),
            ('gym', 'attendance', ['add_attendance', 'view_attendance']),
            ('gym', 'ptpackage', ['view_ptpackage']),
            ('gym', 'trainer', ['view_trainer']),
            ('gym', 'trainerpayroll', ['view_trainerpayroll']),
        ],
        'Accountant': [
            ('gym', 'member', ['view_member']),
            ('gym', 'fee', ['add_fee', 'change_fee', 'delete_fee', 'view_fee']),
            ('gym', 'expense', ['add_expense', 'change_expense', 'delete_expense', 'view_expense']),
            ('gym', 'trainerpayroll', ['add_trainerpayroll', 'change_trainerpayroll', 'delete_trainerpayroll', 'view_trainerpayroll']),
            ('gym', 'trainer', ['view_trainer']),
            ('gym', 'ptpackage', ['view_ptpackage']),
        ],
    }

    # Assign permissions
    for group_name, mappings in permission_map.items():
        group = Group.objects.get(name=group_name)
        for app_label, model, codenames in mappings:
            try:
                ct = ContentType.objects.get(app_label=app_label, model=model)
                perms = Permission.objects.filter(content_type=ct, codename__in=codenames)
                for perm in perms:
                    group.permissions.add(perm)
            except ContentType.DoesNotExist:
                # ContentType might not be created in migrations yet, we'll try to find by codename directly
                perms = Permission.objects.filter(codename__in=codenames)
                for perm in perms:
                    group.permissions.add(perm)

    # SuperAdmin gets all gym permissions
    super_admin_perms = Permission.objects.filter(content_type__app_label='gym')
    for perm in super_admin_perms:
        super_admin_group.permissions.add(perm)


def remove_groups_and_permissions(apps, schema_editor):
    Group = apps.get_model('auth', 'Group')
    Group.objects.filter(name__in=['SuperAdmin', 'Manager', 'Trainer', 'Accountant']).delete()


class Migration(migrations.Migration):

    dependencies = [
        ('gym', '0001_initial'),
        ('contenttypes', '__first__'),
        ('auth', '__first__'),
    ]

    operations = [
        migrations.RunPython(create_groups_and_permissions, remove_groups_and_permissions),
    ]
