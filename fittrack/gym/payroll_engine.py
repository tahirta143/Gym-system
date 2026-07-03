import datetime
from django.db import models
from gym.models import Trainer, PTPackage, TrainerPayroll

def calculate_monthly_payroll(month_date):
    """
    Calculates payroll for all trainers for a specific month (represented as a date, e.g. 2026-07-01).
    Returns a list of created/updated TrainerPayroll objects.
    """
    # Force month_date to the first day of that month
    start_date = month_date.replace(day=1)
    
    # Calculate end date (exclusive upper bound)
    if start_date.month == 12:
        end_date = start_date.replace(year=start_date.year + 1, month=1)
    else:
        end_date = start_date.replace(month=start_date.month + 1)
        
    trainers = Trainer.objects.all()
    results = []
    
    for trainer in trainers:
        # Calculate PT Packages revenue in this month
        packages = PTPackage.objects.filter(
            trainer=trainer,
            created_at__gte=start_date,
            created_at__lt=end_date
        )
        from decimal import Decimal
        total_pt_revenue = sum(p.price for p in packages)
        if not isinstance(total_pt_revenue, Decimal):
            total_pt_revenue = Decimal('0.00')
            
        commission_earned = (total_pt_revenue * trainer.commission_pct) / 100
        
        base_pay = Decimal('0.00')
        deductions = Decimal('0.00')
        
        # Check existing deductions if payroll record already exists to avoid resetting custom manual input
        existing_payroll = TrainerPayroll.objects.filter(trainer=trainer, month=start_date).first()
        if existing_payroll:
            deductions = existing_payroll.deductions

        if trainer.salary_type == 'fixed':
            base_pay = trainer.base_salary
            commission_earned = Decimal('0.00')
        elif trainer.salary_type == 'commission':
            base_pay = Decimal('0.00')
        elif trainer.salary_type == 'hybrid':
            base_pay = trainer.base_salary
            
        net_pay = base_pay + commission_earned - deductions
        
        payroll, created = TrainerPayroll.objects.update_or_create(
            trainer=trainer,
            month=start_date,
            defaults={
                'base_pay': base_pay,
                'commission_earned': commission_earned,
                'deductions': deductions,
                'net_pay': net_pay
            }
        )
        results.append(payroll)
        
    return results
