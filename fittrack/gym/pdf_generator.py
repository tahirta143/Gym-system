from io import BytesIO
from reportlab.lib.pagesizes import letter
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
import datetime

def generate_fee_receipt_pdf(fee):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#6366F1'), # Premium Indigo
        alignment=1 # Center
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#4B5563'),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1F2937'),
        spaceBefore=15,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')
    )

    # Title & Header
    story.append(Paragraph("GymPro Fitness Center", title_style))
    story.append(Paragraph("123 Gym Street, Sector Y, DHA, Lahore", subtitle_style))
    story.append(Paragraph(f"Print Date: {datetime.date.today().strftime('%d-%b-%Y')}", subtitle_style))
    story.append(Spacer(1, 20))
    
    story.append(Paragraph("<b>PAYMENT RECEIPT</b>", ParagraphStyle('RecTitle', parent=h2_style, alignment=1)))
    story.append(Spacer(1, 10))
    
    # Info tables
    data = [
        ["Receipt No:", f"GP-FEE-{fee.id}", "Date Paid:", fee.payment_date.strftime('%d-%b-%Y') if fee.payment_date else "N/A"],
        ["Member Name:", fee.member.name, "Phone:", fee.member.phone],
        ["Email:", fee.member.email or "N/A", "Membership Plan:", fee.member.plan.name],
        ["Status:", fee.get_status_display(), "Period Covered:", fee.period_month.strftime('%B %Y')]
    ]
    t = Table(data, colWidths=[100, 160, 100, 160])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#374151')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Financial breakdown
    financial_data = [
        ["Description", "Amount (PKR)"],
        [f"Membership Dues for {fee.period_month.strftime('%B %Y')}", f"{fee.amount:,.2f}"],
        ["Late Fees / Penalties", f"{fee.late_fee:,.2f}"],
        ["Grand Total Paid", f"{(fee.amount + fee.late_fee):,.2f}"]
    ]
    ft = Table(financial_data, colWidths=[360, 160])
    ft.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#6366F1')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F9FAFB')),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor('#111827')),
    ]))
    story.append(ft)
    story.append(Spacer(1, 30))
    
    # Footer
    story.append(Paragraph("Thank you for your training with GymPro! Please keep this receipt for your records.", ParagraphStyle('FooterStyle', parent=body_style, alignment=1, textColor=colors.HexColor('#9CA3AF'))))
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()


def generate_payslip_pdf(payroll):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=letter, rightMargin=40, leftMargin=40, topMargin=40, bottomMargin=40)
    story = []
    styles = getSampleStyleSheet()
    
    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontName='Helvetica-Bold',
        fontSize=24,
        leading=28,
        textColor=colors.HexColor('#10B981'), # Green theme for Salary
        alignment=1
    )
    subtitle_style = ParagraphStyle(
        'SubtitleStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=12,
        textColor=colors.HexColor('#4B5563'),
        alignment=1
    )
    h2_style = ParagraphStyle(
        'H2Style',
        parent=styles['Heading2'],
        fontSize=14,
        leading=18,
        textColor=colors.HexColor('#1F2937'),
        spaceBefore=15,
        spaceAfter=5
    )
    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['Normal'],
        fontSize=10,
        leading=14,
        textColor=colors.HexColor('#374151')
    )

    # Title & Header
    story.append(Paragraph("GymPro Fitness Center", title_style))
    story.append(Paragraph("Trainer Salary Payslip", subtitle_style))
    story.append(Paragraph(f"Pay Period: {payroll.month.strftime('%B %Y')}", subtitle_style))
    story.append(Spacer(1, 20))
    
    # Info tables
    data = [
        ["Payslip ID:", f"GP-PAY-{payroll.id}", "Date Generated:", datetime.date.today().strftime('%d-%b-%Y')],
        ["Trainer Name:", payroll.trainer.name, "Phone:", payroll.trainer.phone],
        ["Specialization:", payroll.trainer.specialization, "Salary Structure:", payroll.trainer.get_salary_type_display()],
    ]
    t = Table(data, colWidths=[100, 160, 120, 140])
    t.setStyle(TableStyle([
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#374151')),
        ('FONTNAME', (0,0), (0,-1), 'Helvetica-Bold'),
        ('FONTNAME', (2,0), (2,-1), 'Helvetica-Bold'),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    story.append(t)
    story.append(Spacer(1, 20))
    
    # Earnings & Deductions Table
    breakdown_data = [
        ["Earnings Description", "Amount (PKR)"],
        ["Base Salary", f"{payroll.base_pay:,.2f}"],
        ["Commissions Earned", f"{payroll.commission_earned:,.2f}"],
        ["Deductions (Unpaid leaves / Misc)", f"-{payroll.deductions:,.2f}"],
        ["Net Take-home Salary", f"{payroll.net_pay:,.2f}"]
    ]
    bt = Table(breakdown_data, colWidths=[360, 160])
    bt.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), colors.HexColor('#10B981')),
        ('TEXTCOLOR', (0,0), (-1,0), colors.white),
        ('FONTNAME', (0,0), (-1,0), 'Helvetica-Bold'),
        ('ALIGN', (1,0), (1,-1), 'RIGHT'),
        ('PADDING', (0,0), (-1,-1), 8),
        ('GRID', (0,0), (-1,-1), 0.5, colors.HexColor('#E5E7EB')),
        ('FONTNAME', (0,-1), (-1,-1), 'Helvetica-Bold'),
        ('BACKGROUND', (0,-1), (-1,-1), colors.HexColor('#F9FAFB')),
        ('TEXTCOLOR', (0,-1), (-1,-1), colors.HexColor('#047857')),
    ]))
    story.append(bt)
    story.append(Spacer(1, 40))
    
    # Signatures
    sig_data = [
        ["_________________________", "_________________________"],
        ["Accountant / Owner Signature", "Trainer Signature"]
    ]
    st = Table(sig_data, colWidths=[260, 260])
    st.setStyle(TableStyle([
        ('ALIGN', (0,0), (-1,-1), 'CENTER'),
        ('FONTNAME', (0,1), (-1,1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0,0), (-1,-1), colors.HexColor('#4B5563')),
    ]))
    story.append(st)
    
    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
