from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from ..database import get_db
from ..models import Report, Evaluation, User, UserRole, ReportType
from ..schemas import (
    ReportCreate, ReportUpdate, Report as ReportSchema,
    MessageResponse
)
from ..core.auth import get_current_active_user, require_role

router = APIRouter()

# Report templates for different types
REPORT_TEMPLATES = {
    ReportType.ETR: {
        "title": "گزارش فنی ارزیابی (ETR)",
        "content": """
# گزارش فنی ارزیابی (Evaluation Technical Report)

## اطلاعات کلی
- نام محصول: 
- نسخه محصول:
- شرکت متقاضی:
- ارزیاب: 

## خلاصه ارزیابی
### نتایج کلی
### یافته‌های اصلی
### توصیه‌های کلی

## جزئیات ارزیابی
### بررسی اسناد
### تست‌های امنیتی
### ارزیابی آسیب‌پذیری

## نتیجه‌گیری
### امتیاز کلی
### توصیه نهایی
        """
    },
    ReportType.TRP: {
        "title": "گزارش تست (TRP)",
        "content": """
# گزارش تست (Test Report)

## اطلاعات کلی
- نام محصول: 
- نسخه محصول:
- تاریخ تست:

## روش‌های تست
### تست‌های عملکردی
### تست‌های امنیتی
### تست‌های نفوذ

## نتایج تست‌ها
### تست‌های موفق
### تست‌های ناموفق
### موارد نیاز به بهبود

## خلاصه و نتیجه‌گیری
        """
    },
    ReportType.VTR: {
        "title": "گزارش تست اعتبارسنجی (VTR)",
        "content": """
# گزارش تست اعتبارسنجی (Validation Test Report)

## اطلاعات کلی
- نام محصول: 
- نسخه محصول:
- تاریخ اعتبارسنجی:

## روش‌های اعتبارسنجی
### بررسی انطباق با استانداردها
### تست‌های تأیید عملکرد
### بررسی مستندات

## نتایج اعتبارسنجی
### موارد تأیید شده
### موارد رد شده
### نیازمندی‌های بیشتر

## نتیجه‌گیری نهایی
### وضعیت کلی
### توصیه‌های نهایی
        """
    }
}

@router.post("/", response_model=ReportSchema)
async def create_report(
    report_data: ReportCreate,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Create new report."""
    # Check if evaluation exists
    evaluation = db.query(Evaluation).filter(Evaluation.id == report_data.evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    # Check permissions
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Check if report of this type already exists
    existing_report = db.query(Report).filter(
        Report.evaluation_id == report_data.evaluation_id,
        Report.report_type == report_data.report_type
    ).first()
    
    if existing_report:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="گزارش از این نوع قبلاً ایجاد شده است"
        )
    
    # Use template content if not provided
    content = report_data.content
    if not content and report_data.report_type in REPORT_TEMPLATES:
        content = REPORT_TEMPLATES[report_data.report_type]["content"]
    
    title = report_data.title
    if not title and report_data.report_type in REPORT_TEMPLATES:
        title = REPORT_TEMPLATES[report_data.report_type]["title"]
    
    # Create report
    db_report = Report(
        evaluation_id=report_data.evaluation_id,
        report_type=report_data.report_type,
        title=title,
        content=content
    )
    
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    
    return db_report

@router.get("/evaluation/{evaluation_id}", response_model=List[ReportSchema])
async def get_evaluation_reports(
    evaluation_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get all reports for an evaluation."""
    # Check if evaluation exists
    evaluation = db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
    if not evaluation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="ارزیابی مورد نظر یافت نشد"
        )
    
    # Check permissions
    can_view = False
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id == current_user.id:
        can_view = True
    elif current_user.role == UserRole.APPLICANT and evaluation.application.applicant_id == current_user.id:
        can_view = True
    elif current_user.role in [UserRole.GOVERNANCE, UserRole.ADMIN]:
        can_view = True
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    reports = db.query(Report).filter(Report.evaluation_id == evaluation_id).all()
    return reports

@router.get("/{report_id}", response_model=ReportSchema)
async def get_report(
    report_id: int,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get specific report details."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش مورد نظر یافت نشد"
        )
    
    # Check permissions
    evaluation = report.evaluation
    can_view = False
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id == current_user.id:
        can_view = True
    elif current_user.role == UserRole.APPLICANT and evaluation.application.applicant_id == current_user.id:
        can_view = True
    elif current_user.role in [UserRole.GOVERNANCE, UserRole.ADMIN]:
        can_view = True
    
    if not can_view:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    return report

@router.put("/{report_id}", response_model=ReportSchema)
async def update_report(
    report_id: int,
    report_update: ReportUpdate,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Update report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش مورد نظر یافت نشد"
        )
    
    # Check permissions
    evaluation = report.evaluation
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Can't update approved reports
    if report.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="امکان ویرایش گزارش تأیید شده وجود ندارد"
        )
    
    # Update fields
    update_data = report_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(report, field, value)
    
    from datetime import datetime
    report.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(report)
    
    return report

@router.post("/{report_id}/finalize", response_model=MessageResponse)
async def finalize_report(
    report_id: int,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Finalize report (mark as non-draft)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش مورد نظر یافت نشد"
        )
    
    # Check permissions
    evaluation = report.evaluation
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    if not report.is_draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="گزارش قبلاً نهایی شده است"
        )
    
    report.is_draft = False
    db.commit()
    
    return MessageResponse(message="گزارش نهایی شد")

@router.post("/{report_id}/approve", response_model=MessageResponse)
async def approve_report(
    report_id: int,
    current_user: User = Depends(require_role([UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Approve report (Governance and Admin only)."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش مورد نظر یافت نشد"
        )
    
    if report.is_draft:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="امکان تأیید گزارش پیش‌نویس وجود ندارد"
        )
    
    if report.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="گزارش قبلاً تأیید شده است"
        )
    
    from datetime import datetime
    report.is_approved = True
    report.approved_by = current_user.id
    report.approval_date = datetime.utcnow()
    db.commit()
    
    return MessageResponse(message="گزارش تأیید شد")

@router.delete("/{report_id}", response_model=MessageResponse)
async def delete_report(
    report_id: int,
    current_user: User = Depends(require_role([UserRole.EVALUATOR, UserRole.GOVERNANCE, UserRole.ADMIN])),
    db: Session = Depends(get_db)
):
    """Delete report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="گزارش مورد نظر یافت نشد"
        )
    
    # Check permissions
    evaluation = report.evaluation
    if current_user.role == UserRole.EVALUATOR and evaluation.evaluator_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="دسترسی غیرمجاز"
        )
    
    # Can't delete approved reports
    if report.is_approved:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="امکان حذف گزارش تأیید شده وجود ندارد"
        )
    
    db.delete(report)
    db.commit()
    
    return MessageResponse(message="گزارش حذف شد") 