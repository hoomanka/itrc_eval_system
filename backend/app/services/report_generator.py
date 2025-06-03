"""
Technical Report Generation Service for ITRC Evaluation System
Generates professional Word documents with evaluation data
"""

import os
import json
from datetime import datetime
from typing import Dict, List, Optional
from pathlib import Path

from docx import Document
from docx.shared import Inches, Pt
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.style import WD_STYLE_TYPE
from docx.oxml.shared import OxmlElement, qn

from sqlalchemy.orm import Session
from ..models import TechnicalReport, Evaluation, Application, User, SecurityTarget, STClassSelection, ProductClass
from ..database import get_db

class TechnicalReportGenerator:
    """Professional technical report generator for ITRC evaluation system"""
    
    def __init__(self, db: Session):
        self.db = db
        self.reports_dir = Path("reports")
        self.reports_dir.mkdir(exist_ok=True)
        
    def generate_report_number(self) -> str:
        """Generate unique report number: ITRC-ETR-YYYY-NNNN"""
        year = datetime.now().year
        
        # Count existing reports for the year
        count = self.db.query(TechnicalReport).filter(
            TechnicalReport.report_number.like(f"ITRC-ETR-{year}-%")
        ).count()
        
        return f"ITRC-ETR-{year}-{count + 1:04d}"
    
    def collect_evaluation_data(self, evaluation_id: int) -> Dict:
        """Collect all data needed for report generation"""
        evaluation = self.db.query(Evaluation).filter(Evaluation.id == evaluation_id).first()
        if not evaluation:
            raise ValueError(f"Evaluation {evaluation_id} not found")
        
        application = evaluation.application
        security_target = application.security_target
        evaluator = evaluation.evaluator
        applicant = application.applicant
        
        # Get class selections with evaluations
        class_selections = self.db.query(STClassSelection).filter(
            STClassSelection.security_target_id == security_target.id
        ).all()
        
        # Organize class data
        class_data = []
        for selection in class_selections:
            class_info = {
                "class_name_en": selection.product_class.name_en,
                "class_name_fa": selection.product_class.name_fa,
                "class_code": selection.product_class.code,
                "subclass_name_en": selection.product_subclass.name_en if selection.product_subclass else "",
                "subclass_name_fa": selection.product_subclass.name_fa if selection.product_subclass else "",
                "subclass_code": selection.product_subclass.code if selection.product_subclass else "",
                "description": selection.description,
                "justification": selection.justification,
                "test_approach": selection.test_approach,
                "evaluator_notes": selection.evaluator_notes,
                "evaluation_status": selection.evaluation_status,
                "evaluation_score": selection.evaluation_score
            }
            class_data.append(class_info)
        
        return {
            "evaluation": {
                "id": evaluation.id,
                "start_date": evaluation.start_date,
                "end_date": evaluation.end_date,
                "status": evaluation.status,
                "overall_score": evaluation.overall_score,
                "findings": evaluation.findings,
                "recommendations": evaluation.recommendations
            },
            "application": {
                "id": application.id,
                "application_number": application.application_number,
                "product_name": application.product_name,
                "product_version": application.product_version,
                "description": application.description,
                "evaluation_level": application.evaluation_level,
                "company_name": application.company_name,
                "contact_person": application.contact_person,
                "contact_email": application.contact_email,
                "submission_date": application.submission_date
            },
            "evaluator": {
                "id": evaluator.id,
                "full_name": evaluator.full_name,
                "email": evaluator.email,
                "company": evaluator.company
            },
            "applicant": {
                "id": applicant.id,
                "full_name": applicant.full_name,
                "email": applicant.email,
                "company": applicant.company
            },
            "security_target": {
                "id": security_target.id,
                "version": security_target.version,
                "product_description": security_target.product_description,
                "toe_description": security_target.toe_description
            },
            "class_selections": class_data,
            "generation_date": datetime.now(),
            "report_template_version": "1.0"
        }
    
    def create_word_document(self, data: Dict, report_title: str) -> Document:
        """Create Word document with professional formatting"""
        doc = Document()
        
        # Configure document styles
        self._setup_document_styles(doc)
        
        # Title page
        self._add_title_page(doc, data, report_title)
        
        # Table of contents placeholder
        doc.add_page_break()
        self._add_section_heading(doc, "Table of Contents", level=1)
        doc.add_paragraph("(Table of contents will be generated automatically)")
        
        # Executive Summary
        doc.add_page_break()
        self._add_executive_summary(doc, data)
        
        # Product Overview
        self._add_product_overview(doc, data)
        
        # Evaluation Methodology
        self._add_evaluation_methodology(doc, data)
        
        # Detailed Evaluation Results
        self._add_detailed_evaluation_results(doc, data)
        
        # Findings and Recommendations
        self._add_findings_and_recommendations(doc, data)
        
        # Conclusions
        self._add_conclusions(doc, data)
        
        # Appendices
        self._add_appendices(doc, data)
        
        return doc
    
    def _setup_document_styles(self, doc: Document):
        """Setup professional document styles"""
        styles = doc.styles
        
        # Heading styles
        heading1 = styles['Heading 1']
        heading1.font.name = 'Arial'
        heading1.font.size = Pt(16)
        heading1.font.bold = True
        
        heading2 = styles['Heading 2']
        heading2.font.name = 'Arial'
        heading2.font.size = Pt(14)
        heading2.font.bold = True
        
        # Normal style
        normal = styles['Normal']
        normal.font.name = 'Arial'
        normal.font.size = Pt(11)
    
    def _add_title_page(self, doc: Document, data: Dict, report_title: str):
        """Add professional title page"""
        # ITRC Logo placeholder
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run("IRAN TELECOMMUNICATIONS RESEARCH CENTER (ITRC)")
        title_run.font.size = Pt(16)
        title_run.font.bold = True
        
        doc.add_paragraph()
        
        # Report title
        title_para = doc.add_paragraph()
        title_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        title_run = title_para.add_run(report_title)
        title_run.font.size = Pt(18)
        title_run.font.bold = True
        
        doc.add_paragraph()
        
        # Product information
        product_para = doc.add_paragraph()
        product_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
        product_run = product_para.add_run(f"Product: {data['application']['product_name']}")
        product_run.font.size = Pt(14)
        
        if data['application']['product_version']:
            version_para = doc.add_paragraph()
            version_para.alignment = WD_ALIGN_PARAGRAPH.CENTER
            version_run = version_para.add_run(f"Version: {data['application']['product_version']}")
            version_run.font.size = Pt(12)
        
        # Add some space
        for _ in range(5):
            doc.add_paragraph()
        
        # Report details table
        table = doc.add_table(rows=6, cols=2)
        table.style = 'Table Grid'
        
        # Table content
        rows_data = [
            ("Application Number:", data['application']['application_number']),
            ("Evaluation Level:", data['application']['evaluation_level']),
            ("Evaluator:", data['evaluator']['full_name']),
            ("Company:", data['application']['company_name']),
            ("Evaluation Period:", f"{data['evaluation']['start_date'].strftime('%Y-%m-%d')} to {data['evaluation']['end_date'].strftime('%Y-%m-%d') if data['evaluation']['end_date'] else 'Ongoing'}"),
            ("Report Date:", data['generation_date'].strftime('%Y-%m-%d'))
        ]
        
        for i, (label, value) in enumerate(rows_data):
            table.cell(i, 0).text = label
            table.cell(i, 1).text = str(value)
            
            # Make labels bold
            table.cell(i, 0).paragraphs[0].runs[0].font.bold = True
    
    def _add_section_heading(self, doc: Document, heading: str, level: int = 1):
        """Add section heading with proper formatting"""
        doc.add_heading(heading, level=level)
    
    def _add_executive_summary(self, doc: Document, data: Dict):
        """Add executive summary section"""
        self._add_section_heading(doc, "Executive Summary", level=1)
        
        doc.add_paragraph(
            f"This report presents the results of the Common Criteria evaluation of "
            f"{data['application']['product_name']} version {data['application']['product_version'] or 'N/A'} "
            f"conducted by the Iran Telecommunications Research Center (ITRC)."
        )
        
        doc.add_paragraph(
            f"The evaluation was performed at {data['application']['evaluation_level']} level "
            f"and covered {len(data['class_selections'])} functional classes. "
            f"The overall evaluation score achieved was {data['evaluation']['overall_score'] or 'N/A'}."
        )
        
        if data['evaluation']['overall_score']:
            if data['evaluation']['overall_score'] >= 80:
                result_text = "The product successfully met the evaluation criteria."
            elif data['evaluation']['overall_score'] >= 60:
                result_text = "The product met most evaluation criteria with some minor issues."
            else:
                result_text = "The product requires significant improvements to meet evaluation criteria."
            
            doc.add_paragraph(result_text)
    
    def _add_product_overview(self, doc: Document, data: Dict):
        """Add product overview section"""
        self._add_section_heading(doc, "Product Overview", level=1)
        
        self._add_section_heading(doc, "Product Identification", level=2)
        
        # Product details table
        table = doc.add_table(rows=5, cols=2)
        table.style = 'Table Grid'
        
        product_details = [
            ("Product Name:", data['application']['product_name']),
            ("Product Version:", data['application']['product_version'] or "N/A"),
            ("Developer:", data['application']['company_name']),
            ("Evaluation Level:", data['application']['evaluation_level']),
            ("Application Number:", data['application']['application_number'])
        ]
        
        for i, (label, value) in enumerate(product_details):
            table.cell(i, 0).text = label
            table.cell(i, 1).text = str(value)
            table.cell(i, 0).paragraphs[0].runs[0].font.bold = True
        
        self._add_section_heading(doc, "Product Description", level=2)
        doc.add_paragraph(data['application']['description'] or "No description provided.")
        
        if data['security_target']['toe_description']:
            self._add_section_heading(doc, "Target of Evaluation (TOE)", level=2)
            doc.add_paragraph(data['security_target']['toe_description'])
    
    def _add_evaluation_methodology(self, doc: Document, data: Dict):
        """Add evaluation methodology section"""
        self._add_section_heading(doc, "Evaluation Methodology", level=1)
        
        doc.add_paragraph(
            "The evaluation was conducted according to the Common Criteria for Information "
            "Technology Security Evaluation (ISO/IEC 15408) and the Common Methodology for "
            "Information Technology Security Evaluation (ISO/IEC 18045)."
        )
        
        self._add_section_heading(doc, "Evaluation Activities", level=2)
        
        activities = [
            "Documentation review and analysis",
            "Security Target evaluation",
            "Functional testing",
            "Vulnerability assessment",
            "Configuration management review"
        ]
        
        for activity in activities:
            doc.add_paragraph(f"• {activity}", style='List Bullet')
        
        self._add_section_heading(doc, "Evaluation Period", level=2)
        doc.add_paragraph(
            f"The evaluation was conducted from {data['evaluation']['start_date'].strftime('%B %d, %Y')} "
            f"to {data['evaluation']['end_date'].strftime('%B %d, %Y') if data['evaluation']['end_date'] else 'ongoing'}."
        )
    
    def _add_detailed_evaluation_results(self, doc: Document, data: Dict):
        """Add detailed evaluation results for each class"""
        self._add_section_heading(doc, "Detailed Evaluation Results", level=1)
        
        for i, class_selection in enumerate(data['class_selections'], 1):
            self._add_section_heading(doc, f"{i}. {class_selection['class_name_en']}", level=2)
            
            # Class information table
            table = doc.add_table(rows=5, cols=2)
            table.style = 'Table Grid'
            
            class_details = [
                ("Class Code:", class_selection['class_code']),
                ("Subclass:", f"{class_selection['subclass_name_en']} ({class_selection['subclass_code']})" if class_selection['subclass_code'] else "N/A"),
                ("Status:", class_selection['evaluation_status']),
                ("Score:", str(class_selection['evaluation_score']) if class_selection['evaluation_score'] else "N/A"),
                ("Persian Name:", class_selection['class_name_fa'])
            ]
            
            for j, (label, value) in enumerate(class_details):
                table.cell(j, 0).text = label
                table.cell(j, 1).text = value
                table.cell(j, 0).paragraphs[0].runs[0].font.bold = True
            
            # Implementation description
            self._add_section_heading(doc, "Implementation", level=3)
            doc.add_paragraph(class_selection['description'] or "No description provided.")
            
            # Justification
            if class_selection['justification']:
                self._add_section_heading(doc, "Justification", level=3)
                doc.add_paragraph(class_selection['justification'])
            
            # Test approach
            if class_selection['test_approach']:
                self._add_section_heading(doc, "Test Approach", level=3)
                doc.add_paragraph(class_selection['test_approach'])
            
            # Evaluator notes
            if class_selection['evaluator_notes']:
                self._add_section_heading(doc, "Evaluator Assessment", level=3)
                doc.add_paragraph(class_selection['evaluator_notes'])
    
    def _add_findings_and_recommendations(self, doc: Document, data: Dict):
        """Add findings and recommendations section"""
        self._add_section_heading(doc, "Findings and Recommendations", level=1)
        
        if data['evaluation']['findings']:
            self._add_section_heading(doc, "Key Findings", level=2)
            doc.add_paragraph(data['evaluation']['findings'])
        
        if data['evaluation']['recommendations']:
            self._add_section_heading(doc, "Recommendations", level=2)
            doc.add_paragraph(data['evaluation']['recommendations'])
    
    def _add_conclusions(self, doc: Document, data: Dict):
        """Add conclusions section"""
        self._add_section_heading(doc, "Conclusions", level=1)
        
        overall_score = data['evaluation']['overall_score']
        if overall_score:
            doc.add_paragraph(
                f"Based on the evaluation conducted, the product achieved an overall score of "
                f"{overall_score}%. "
            )
            
            if overall_score >= 80:
                conclusion = "The product demonstrates strong compliance with the evaluated security functional requirements."
            elif overall_score >= 60:
                conclusion = "The product shows good compliance with most requirements, with some areas needing attention."
            else:
                conclusion = "The product requires significant improvements to achieve satisfactory compliance."
            
            doc.add_paragraph(conclusion)
        else:
            doc.add_paragraph("The evaluation is complete. Please refer to the detailed findings for specific conclusions.")
    
    def _add_appendices(self, doc: Document, data: Dict):
        """Add appendices section"""
        self._add_section_heading(doc, "Appendices", level=1)
        
        self._add_section_heading(doc, "Appendix A: Evaluation Team", level=2)
        doc.add_paragraph(f"Lead Evaluator: {data['evaluator']['full_name']}")
        doc.add_paragraph(f"Email: {data['evaluator']['email']}")
        if data['evaluator']['company']:
            doc.add_paragraph(f"Organization: {data['evaluator']['company']}")
        
        self._add_section_heading(doc, "Appendix B: References", level=2)
        references = [
            "ISO/IEC 15408-1:2009, Information technology — Security techniques — Evaluation criteria for IT security — Part 1: Introduction and general model",
            "ISO/IEC 15408-2:2008, Information technology — Security techniques — Evaluation criteria for IT security — Part 2: Security functional components",
            "ISO/IEC 15408-3:2008, Information technology — Security techniques — Evaluation criteria for IT security — Part 3: Security assurance components",
            "ISO/IEC 18045:2008, Information technology — Security techniques — Methodology for IT security evaluation"
        ]
        
        for ref in references:
            doc.add_paragraph(f"• {ref}", style='List Bullet')
    
    def generate_technical_report(self, evaluation_id: int, generated_by_id: int, 
                                title: Optional[str] = None) -> TechnicalReport:
        """Generate complete technical report"""
        
        # Collect evaluation data
        data = self.collect_evaluation_data(evaluation_id)
        
        # Generate report number and title
        report_number = self.generate_report_number()
        if not title:
            title = f"Evaluation Technical Report for {data['application']['product_name']}"
        
        # Create Word document
        doc = self.create_word_document(data, title)
        
        # Save document
        filename = f"{report_number}.docx"
        file_path = self.reports_dir / filename
        doc.save(str(file_path))
        
        # Create database record
        report = TechnicalReport(
            evaluation_id=evaluation_id,
            report_number=report_number,
            title=title,
            generated_by=generated_by_id,
            generated_at=datetime.now(),
            word_file_path=str(file_path),
            file_size=file_path.stat().st_size,
            report_data=data
        )
        
        self.db.add(report)
        self.db.commit()
        self.db.refresh(report)
        
        return report 