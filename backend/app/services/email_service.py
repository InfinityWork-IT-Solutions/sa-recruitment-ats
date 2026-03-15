"""
Email Notification service - SendGrid integration for automated emails
"""
import os
from typing import Dict, List, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, Email, To, Content
from datetime import datetime
from jinja2 import Template

from app.core.config import settings


class EmailService:
    """Email notification service using SendGrid"""
    
    def __init__(self):
        """Initialize SendGrid client"""
        self.client = SendGridAPIClient(settings.SENDGRID_API_KEY)
        self.from_email = settings.SENDGRID_FROM_EMAIL
    
    async def send_email(
        self,
        to_email: str,
        subject: str,
        html_content: str,
        plain_content: Optional[str] = None
    ) -> bool:
        """
        Send email via SendGrid
        
        Args:
            to_email: Recipient email
            subject: Email subject
            html_content: HTML email content
            plain_content: Plain text fallback
            
        Returns:
            True if sent successfully
        """
        try:
            message = Mail(
                from_email=self.from_email,
                to_emails=to_email,
                subject=subject,
                html_content=html_content,
                plain_text_content=plain_content or html_content
            )
            
            response = self.client.send(message)
            return response.status_code in [200, 201, 202]
            
        except Exception as e:
            print(f"Email send failed: {str(e)}")
            return False
    
    # ============= Candidate Email Templates =============
    
    async def send_application_confirmation(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        agency_name: str
    ) -> bool:
        """Send application confirmation to candidate"""
        subject = f"Application Received - {job_title}"
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4a90e2; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Application Received</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Dear {candidate_name},</p>
                    
                    <p>Thank you for applying for the position of <strong>{job_title}</strong> through {agency_name}.</p>
                    
                    <p>We have received your application and our recruitment team will review it shortly. 
                    If your profile matches our requirements, we will contact you for the next steps.</p>
                    
                    <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4a90e2;">
                        <h3 style="margin-top: 0;">What happens next?</h3>
                        <ul>
                            <li>Your application will be reviewed within 3-5 business days</li>
                            <li>Shortlisted candidates will be contacted for an interview</li>
                            <li>We'll keep you updated on your application status</li>
                        </ul>
                    </div>
                    
                    <p>Best regards,<br>
                    <strong>{agency_name}</strong></p>
                </div>
                
                <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                    <p>This is an automated message. Please do not reply to this email.</p>
                </div>
            </body>
        </html>
        """
        
        return await self.send_email(candidate_email, subject, html_content)
    
    async def send_interview_invitation(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        interview_date: datetime,
        interview_location: str,
        interviewer_name: str,
        calendar_link: Optional[str] = None
    ) -> bool:
        """Send interview invitation to candidate"""
        subject = f"Interview Invitation - {job_title}"
        
        formatted_date = interview_date.strftime("%A, %B %d, %Y at %I:%M %p")
        
        calendar_section = ""
        if calendar_link:
            calendar_section = f"""
            <div style="text-align: center; margin: 20px 0;">
                <a href="{calendar_link}" style="background-color: #27ae60; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
                    Add to Calendar
                </a>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #27ae60; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Interview Invitation</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Dear {candidate_name},</p>
                    
                    <p>Congratulations! We are pleased to invite you for an interview for the position of <strong>{job_title}</strong>.</p>
                    
                    <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #27ae60;">
                        <h3 style="margin-top: 0;">Interview Details</h3>
                        <p><strong>Date & Time:</strong> {formatted_date}</p>
                        <p><strong>Location:</strong> {interview_location}</p>
                        <p><strong>Interviewer:</strong> {interviewer_name}</p>
                    </div>
                    
                    {calendar_section}
                    
                    <div style="background-color: #fff3cd; padding: 15px; margin: 20px 0; border-radius: 5px;">
                        <h4 style="margin-top: 0;">What to bring:</h4>
                        <ul>
                            <li>Updated CV/Resume</li>
                            <li>ID Document</li>
                            <li>Copies of qualifications</li>
                        </ul>
                    </div>
                    
                    <p>Please confirm your attendance by replying to this email.</p>
                    
                    <p>We look forward to meeting you!</p>
                    
                    <p>Best regards,<br>
                    <strong>{interviewer_name}</strong></p>
                </div>
                
                <div style="background-color: #333; color: white; padding: 20px; text-align: center; font-size: 12px;">
                    <p>Need to reschedule? Please contact us as soon as possible.</p>
                </div>
            </body>
        </html>
        """
        
        return await self.send_email(candidate_email, subject, html_content)
    
    async def send_offer_letter(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        salary: int,
        start_date: datetime,
        company_name: str
    ) -> bool:
        """Send job offer letter to candidate"""
        subject = f"Job Offer - {job_title}"
        
        formatted_salary = f"R{salary:,}"
        formatted_start_date = start_date.strftime("%B %d, %Y")
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4a90e2; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Congratulations!</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Dear {candidate_name},</p>
                    
                    <p>We are delighted to offer you the position of <strong>{job_title}</strong> at {company_name}.</p>
                    
                    <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4a90e2;">
                        <h3 style="margin-top: 0;">Offer Details</h3>
                        <p><strong>Position:</strong> {job_title}</p>
                        <p><strong>Salary:</strong> {formatted_salary} per month</p>
                        <p><strong>Start Date:</strong> {formatted_start_date}</p>
                    </div>
                    
                    <p>Please review the attached formal offer letter and contract.</p>
                    
                    <div style="text-align: center; margin: 30px 0;">
                        <p style="font-size: 18px; color: #4a90e2;">
                            <strong>Please respond within 5 business days</strong>
                        </p>
                    </div>
                    
                    <p>We're excited to have you join our team!</p>
                    
                    <p>Best regards,<br>
                    <strong>{company_name}</strong></p>
                </div>
            </body>
        </html>
        """
        
        return await self.send_email(candidate_email, subject, html_content)
    
    async def send_rejection_email(
        self,
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        agency_name: str,
        feedback: Optional[str] = None
    ) -> bool:
        """Send rejection email to candidate"""
        subject = f"Application Update - {job_title}"
        
        feedback_section = ""
        if feedback:
            feedback_section = f"""
            <div style="background-color: white; padding: 20px; margin: 20px 0; border-left: 4px solid #4a90e2;">
                <h3 style="margin-top: 0;">Feedback</h3>
                <p>{feedback}</p>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #6c757d; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">Application Update</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Dear {candidate_name},</p>
                    
                    <p>Thank you for your interest in the position of <strong>{job_title}</strong> and for taking the time to apply.</p>
                    
                    <p>After careful consideration, we have decided to move forward with other candidates whose qualifications more closely match our current needs.</p>
                    
                    {feedback_section}
                    
                    <p>We encourage you to apply for future positions that match your skills and experience. 
                    We will keep your profile on file for 6 months.</p>
                    
                    <p>We wish you the best in your job search.</p>
                    
                    <p>Best regards,<br>
                    <strong>{agency_name}</strong></p>
                </div>
            </body>
        </html>
        """
        
        return await self.send_email(candidate_email, subject, html_content)
    
    # ============= Recruiter Email Templates =============
    
    async def send_new_application_alert(
        self,
        recruiter_email: str,
        recruiter_name: str,
        candidate_name: str,
        job_title: str,
        match_score: Optional[int] = None
    ) -> bool:
        """Send new application alert to recruiter"""
        subject = f"New Application - {job_title}"
        
        match_badge = ""
        if match_score:
            color = "#27ae60" if match_score >= 80 else "#f39c12" if match_score >= 60 else "#e74c3c"
            match_badge = f"""
            <div style="background-color: {color}; color: white; padding: 10px; border-radius: 5px; text-align: center; margin: 15px 0;">
                <strong>Match Score: {match_score}%</strong>
            </div>
            """
        
        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <div style="background-color: #4a90e2; padding: 20px; text-align: center;">
                    <h1 style="color: white; margin: 0;">New Application Received</h1>
                </div>
                
                <div style="padding: 30px; background-color: #f9f9f9;">
                    <p>Hi {recruiter_name},</p>
                    
                    <p>A new application has been received for <strong>{job_title}</strong>.</p>
                    
                    <div style="background-color: white; padding: 20px; margin: 20px 0;">
                        <p><strong>Candidate:</strong> {candidate_name}</p>
                        {match_badge}
                    </div>
                    
                    <p>Please review the application in your dashboard.</p>
                </div>
            </body>
        </html>
        """
        
        return await self.send_email(recruiter_email, subject, html_content)


# Create service instance
email_service = EmailService()
