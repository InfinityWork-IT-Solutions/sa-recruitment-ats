from datetime import datetime, timedelta
from typing import List, Dict, Any
from jinja2 import Template
from app.services.email_service import email_service

class EmailAutomationService:
    """Automated email service for all platform notifications"""
    
    @staticmethod
    async def send_application_confirmation(
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        company_name: str
    ):
        """Send instant confirmation when candidate applies"""
        
        subject = f"✅ Application Received - {job_title}"
        
        html = EmailAutomationService._application_confirmation_template(
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name
        )
        
        await email_service.send_email(
            recipient=candidate_email,
            subject=subject,
            body=f"Hi {candidate_name}, your application for {job_title} at {company_name} has been received.",
            html=html
        )
    
    @staticmethod
    async def send_new_application_alert(
        company_email: str,
        recruiter_name: str,
        candidate_name: str,
        job_title: str,
        match_score: int,
        application_id: str
    ):
        """Alert company about new application"""
        
        subject = f"🎯 New Application: {candidate_name} for {job_title} ({match_score}% match)"
        
        html = EmailAutomationService._new_application_template(
            recruiter_name=recruiter_name,
            candidate_name=candidate_name,
            job_title=job_title,
            match_score=match_score,
            application_url=f"https://recruitpro.co.za/company/applications/{application_id}"
        )
        
        await email_service.send_email(
            recipient=company_email,
            subject=subject,
            body=f"Hi {recruiter_name}, a new candidate {candidate_name} applied for {job_title}.",
            html=html
        )
    
    @staticmethod
    async def send_job_match_alert(
        candidate_email: str,
        candidate_name: str,
        matched_jobs: List[Dict[str, Any]]
    ):
        """Send daily job match digest to candidate"""
        
        if not matched_jobs:
            return
        
        subject = f"🎯 {len(matched_jobs)} New Jobs Match Your Profile!"
        
        html = EmailAutomationService._job_match_template(
            candidate_name=candidate_name,
            matched_jobs=matched_jobs
        )
        
        await email_service.send_email(
            recipient=candidate_email,
            subject=subject,
            body=f"Hi {candidate_name}, we found new jobs for you.",
            html=html
        )
    
    @staticmethod
    async def send_interview_invitation(
        candidate_email: str,
        candidate_name: str,
        company_name: str,
        job_title: str,
        interview_date: str,
        interview_time: str,
        interview_location: str,
        interview_type: str  # 'in-person', 'video', 'phone'
    ):
        """Send interview invitation"""
        
        subject = f"📅 Interview Invitation - {job_title} at {company_name}"
        
        html = EmailAutomationService._interview_invitation_template(
            candidate_name=candidate_name,
            company_name=company_name,
            job_title=job_title,
            interview_date=interview_date,
            interview_time=interview_time,
            interview_location=interview_location,
            interview_type=interview_type
        )
        
        await email_service.send_email(
            recipient=candidate_email,
            subject=subject,
            body=f"Hi {candidate_name}, you have been invited for an interview.",
            html=html
        )
    
    @staticmethod
    async def send_status_update(
        candidate_email: str,
        candidate_name: str,
        job_title: str,
        company_name: str,
        new_status: str,
        message: str = None
    ):
        """Notify candidate of application status change"""
        
        status_messages = {
            'screening': 'Your application is being reviewed',
            'shortlisted': 'You\'ve been shortlisted!',
            'interview': 'Interview scheduled',
            'offer': 'Congratulations! You have an offer',
            'rejected': 'Application Update'
        }
        
        subject = f"{status_messages.get(new_status, 'Application Update')} - {job_title}"
        
        html = EmailAutomationService._status_update_template(
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name,
            new_status=new_status,
            message=message
        )
        
        await email_service.send_email(
            recipient=candidate_email,
            subject=subject,
            body=f"Hi {candidate_name}, your application status has been updated.",
            html=html
        )

    @staticmethod
    async def send_verification_email(
        user_email: str,
        user_name: str,
        verification_token: str
    ):
        """Send verification email with security token"""
        from app.services.email_service import email_service
        # In production, use the actual frontend URL for verification
        verification_link = f"http://localhost:5173/verify-email?token={verification_token}"
        
        template = """
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 12px; background: #fff;">
    <div style="text-align: center; margin-bottom: 30px; background: #2563eb; padding: 20px; border-radius: 8px;">
        <h1 style="color: #fff; margin: 0;">RecruitPro SA</h1>
        <p style="color: #bfdbfe; margin: 5px 0 0 0;">Secure Identity Verification</p>
    </div>
    <p style="font-size: 16px; color: #374151;">Hello <strong>{{ name }}</strong>,</p>
    <p style="font-size: 16px; color: #374151; line-height: 1.5;">Welcome to RecruitPro SA! To ensure the security of our platform and protect sensitive information, please verify your email address by clicking the button below:</p>
    <div style="text-align: center; margin: 35px 0;">
        <a href="{{ link }}" style="background: #2563eb; color: white; padding: 14px 30px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(37, 99, 235, 0.2);">Verify My Account</a>
    </div>
    <p style="font-size: 14px; color: #6b7280;">This verification helps us distinguish genuine professionals and prevents unauthorized access to confidential platform details.</p>
    <p style="font-size: 12px; color: #9ca3af; margin-top: 30px; border-top: 1px solid #efefef; padding-top: 20px;">If you didn't create an account with RecruitPro SA, please ignore this email.</p>
</div>
        """
        html = Template(template).render(name=user_name, link=verification_link)
        
        await email_service.send_email(
            recipient=user_email,
            subject="Action Required: Verify your RecruitPro SA account",
            body=f"Hello {user_name}, please verify your account at {verification_link}",
            html=html
        )

    @staticmethod
    async def send_admin_registration_notification(
        user_details: dict
    ):
        """Notify platform admin of new registration for security auditing"""
        from app.services.email_service import email_service
        # This should be configurable in production
        admin_email = "admin@recruitpro-sa.com"
        
        template = """
<div style="font-family: Arial, sans-serif; background: #f9fafb; padding: 30px; border-radius: 15px;">
    <div style="background: #ef4444; color: white; padding: 15px 25px; border-radius: 10px 10px 0 0; font-weight: bold;">
        ⚠️ NEW REGISTRATION ALERT
    </div>
    <div style="background: white; padding: 25px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
        <p style="margin: 0 0 15px 0;">A new user has registered on the platform. Please verify their identity to prevent unauthorized access.</p>
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0;"><strong>Name:</strong> {{ name }}</p>
            <p style="margin: 5px 0;"><strong>Email:</strong> {{ email }}</p>
            <p style="margin: 5px 0;"><strong>Role:</strong> <span style="background: #fee2e2; color: #991b1b; padding: 2px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">{{ role }}</span></p>
            <p style="margin: 5px 0;"><strong>Location:</strong> {{ location }}</p>
        </div>
        <a href="http://localhost:5173/admin/users" style="display: block; text-align: center; background: #111827; color: white; padding: 12px; margin-top: 20px; border-radius: 6px; text-decoration: none; font-weight: bold;">Open Admin Terminal</a>
    </div>
</div>
        """
        html = Template(template).render(
            name=f"{user_details.get('first_name')} {user_details.get('last_name')}",
            email=user_details.get('email'),
            role=user_details.get('role', 'unknown').upper(),
            location=f"{user_details.get('city', 'Unknown')}, {user_details.get('province', 'Unknown')}"
        )
        
        await email_service.send_email(
            recipient=admin_email,
            subject=f"Security Alert: New {user_details.get('role', 'User').capitalize()} Registered",
            html=html
        )

    @staticmethod
    async def send_rejection_email(candidate_email: str, candidate_name: str):
        """Send rejection email (SendGrid integration)"""
        subject = f'Application Update - {candidate_name}'
        html = f'''
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: #f8fafc; padding: 30px; border-radius: 10px; border-left: 4px solid #ef4444;">
                <h2 style="color: #1e293b;">Hi {candidate_name},</h2>
                <p style="color: #475569; line-height: 1.6;">
                    Thank you for your application and for the interest you've shown in joining our team.
                </p>
                <p style="color: #475569; line-height: 1.6;">
                    After careful consideration, we regret to inform you that we will not be moving forward with your application at this time. 
                    However, we will keep your profile in our database for future opportunities that match your skills.
                </p>
                <p style="color: #475569; line-height: 1.6;">
                    We wish you the very best in your job search and future career endeavors.
                </p>
                <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;">
                <p style="font-size: 14px; color: #94a3b8;">
                    Best Regards,<br>
                    The Hiring Team | RecruitPro SA
                </p>
            </div>
        </body>
        </html>
        '''
        return await email_service.send_email(
            recipient=candidate_email,
            subject=subject,
            body=f"Hi {candidate_name}, thank you for your application. We regret to inform you that we won't be moving forward at this time.",
            html=html
        )
    @staticmethod
    async def send_generic_email(
        recipient_email: str,
        subject: str,
        body: str,
        company_name: str = "RecruitPro"
    ):
        """Send a generic branded email"""
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#2563eb,#1e40af);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">{{ company_name }}</h1>
    </div>
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <div style="font-size:16px;color:#374151;line-height:1.6;white-space:pre-wrap;">{{ body }}</div>
        <div style="margin-top:30px;padding-top:20px;border-top:1px solid #eee;font-size:12px;color:#999;text-align:center;">
            Sent via {{ company_name }} Recruitment Portal
        </div>
    </div>
</body>
</html>
        """
        html = Template(template).render(body=body, company_name=company_name)
        
        await email_service.send_email(
            recipient=recipient_email,
            subject=subject,
            body=body,
            html=html
        )

    
    @staticmethod
    def _application_confirmation_template(
        candidate_name: str,
        job_title: str,
        company_name: str
    ) -> str:
        """Application confirmation email template"""
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#2563eb,#7c3aed);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">✅ Application Received!</h1>
    </div>
    
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#374151;">Hi <strong>{{ candidate_name }}</strong>,</p>
        
        <p style="font-size:16px;color:#374151;">Thank you for applying to <strong>{{ job_title }}</strong> at <strong>{{ company_name }}</strong>!</p>
        
        <div style="background:#f3f4f6;padding:20px;border-radius:8px;border-left:4px solid #2563eb;margin:20px 0;">
            <p style="margin:0;font-size:15px;color:#374151;"><strong>What happens next?</strong></p>
            <ol style="color:#6b7280;font-size:14px;margin:10px 0 0 0;padding-left:20px;">
                <li>The hiring team will review your application</li>
                <li>We'll notify you of any status updates</li>
                <li>Check your dashboard for real-time updates</li>
            </ol>
        </div>
        
        <p style="font-size:14px;color:#6b7280;">Track your application anytime at: <a href="https://recruitpro.co.za/candidate/applications" style="color:#2563eb;">View My Applications</a></p>
        
        <p style="font-size:14px;color:#6b7280;margin-top:30px;">Good luck! 🍀</p>
    </div>
</body>
</html>
        """
        return Template(template).render(
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name
        )
    
    @staticmethod
    def _new_application_template(
        recruiter_name: str,
        candidate_name: str,
        job_title: str,
        match_score: int,
        application_url: str
    ) -> str:
        """New application alert for companies"""
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#10b981,#2563eb);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">🎯 New Application Received</h1>
    </div>
    
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#374151;">Hi <strong>{{ recruiter_name }}</strong>,</p>
        
        <p style="font-size:16px;color:#374151;">A new candidate has applied for <strong>{{ job_title }}</strong>!</p>
        
        <div style="background:#f0fdf4;padding:20px;border-radius:8px;border:2px solid #10b981;margin:20px 0;">
            <h3 style="margin:0 0 15px 0;color:#059669;">Candidate Details</h3>
            <p style="margin:5px 0;"><strong>Name:</strong> {{ candidate_name }}</p>
            <p style="margin:5px 0;"><strong>AI Match Score:</strong> <span style="color:#10b981;font-weight:bold;font-size:24px;">{{ match_score }}%</span></p>
        </div>
        
        <a href="{{ application_url }}" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;margin:10px 0;">View Application →</a>
        
        <p style="font-size:14px;color:#6b7280;margin-top:20px;">Quick action: Review this candidate before your competitors do!</p>
    </div>
</body>
</html>
        """
        return Template(template).render(
            recruiter_name=recruiter_name,
            candidate_name=candidate_name,
            job_title=job_title,
            match_score=match_score,
            application_url=application_url
        )
    
    @staticmethod
    def _job_match_template(
        candidate_name: str,
        matched_jobs: List[Dict[str, Any]]
    ) -> str:
        """Daily job match digest"""
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#7c3aed,#ec4899);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">🎯 Jobs Matched For You!</h1>
    </div>
    
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#374151;">Hi <strong>{{ candidate_name }}</strong>,</p>
        
        <p style="font-size:16px;color:#374151;">We found {{ matched_jobs|length }} new jobs that match your profile:</p>
        
        {% for job in matched_jobs %}
        <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:15px 0;border-left:4px solid #7c3aed;">
            <h3 style="margin:0 0 10px 0;color:#1f2937;">{{ job.title }}</h3>
            <p style="margin:5px 0;color:#6b7280;"><strong>{{ job.company_name }}</strong> • {{ job.location }}</p>
            <p style="margin:5px 0;color:#6b7280;">R{{ "{:,.2f}".format(job.salary_min) if job.salary_min else "N/A" }} - R{{ "{:,.2f}".format(job.salary_max) if job.salary_max else "N/A" }}</p>
            <p style="margin:10px 0 0 0;"><span style="background:#7c3aed;color:#fff;padding:4px 12px;border-radius:20px;font-size:13px;font-weight:600;">{{ job.match_score }}% Match</span></p>
            <a href="https://recruitpro.co.za/jobs/{{ job.id }}" style="color:#2563eb;text-decoration:none;font-weight:600;margin-top:10px;display:inline-block;">View Job →</a>
        </div>
        {% endfor %}
        
        <a href="https://recruitpro.co.za/candidate/jobs" style="display:inline-block;background:#7c3aed;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;margin:20px 0;">See All Matches</a>
    </div>
</body>
</html>
        """
        return Template(template).render(
            candidate_name=candidate_name,
            matched_jobs=matched_jobs
        )
    
    @staticmethod
    def _interview_invitation_template(
        candidate_name: str,
        company_name: str,
        job_title: str,
        interview_date: str,
        interview_time: str,
        interview_location: str,
        interview_type: str
    ) -> str:
        """Interview invitation"""
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:linear-gradient(135deg,#059669,#0891b2);padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="color:#fff;margin:0;">📅 Interview Invitation!</h1>
    </div>
    
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#374151;">Hi <strong>{{ candidate_name }}</strong>,</p>
        
        <p style="font-size:16px;color:#374151;">Congratulations! <strong>{{ company_name }}</strong> would like to interview you for the <strong>{{ job_title }}</strong> position.</p>
        
        <div style="background:#ecfdf5;padding:20px;border-radius:8px;border:2px solid#059669;margin:20px 0;">
            <h3 style="margin:0 0 15px 0;color:#059669;">Interview Details</h3>
            <p style="margin:8px 0;"><strong>Date:</strong> {{ interview_date }}</p>
            <p style="margin:8px 0;"><strong>Time:</strong> {{ interview_time }}</p>
            <p style="margin:8px 0;"><strong>Type:</strong> {{ interview_type|capitalize }}</p>
            {% if interview_type != 'video' %}
            <p style="margin:8px 0;"><strong>Location:</strong> {{ interview_location }}</p>
            {% else %}
            <p style="margin:8px 0;"><strong>Meeting Link:</strong> <a href="{{ interview_location }}">Join Video Call</a></p>
            {% endif %}
        </div>
        
        <p style="font-size:14px;color:#6b7280;"><strong>Tips for success:</strong></p>
        <ul style="color:#6b7280;font-size:14px;">
            <li>Research the company beforehand</li>
            <li>Prepare questions to ask the interviewer</li>
            <li>Arrive 10 minutes early (or join the call 5 minutes early)</li>
            <li>Bring copies of your resume</li>
        </ul>
        
        <p style="font-size:14px;color:#374151;margin-top:20px;">Good luck! We're rooting for you! 🍀</p>
    </div>
</body>
</html>
        """
        return Template(template).render(
            candidate_name=candidate_name,
            company_name=company_name,
            job_title=job_title,
            interview_date=interview_date,
            interview_time=interview_time,
            interview_location=interview_location,
            interview_type=interview_type
        )
    
    @staticmethod
    def _status_update_template(
        candidate_name: str,
        job_title: str,
        company_name: str,
        new_status: str,
        message: str = None
    ) -> str:
        """Application status update"""
        
        status_info = {
            'screening': {
                'emoji': '👀',
                'title': 'Application Under Review',
                'message': 'Your application is currently being reviewed by the hiring team.'
            },
            'shortlisted': {
                'emoji': '⭐',
                'title': 'You\'ve Been Shortlisted!',
                'message': 'Great news! You\'ve been selected for the next round.'
            },
            'rejected': {
                'emoji': '💙',
                'title': 'Application Update',
                'message': 'Thank you for your interest. While we won\'t be moving forward with your application at this time, we encourage you to apply for other opportunities.'
            }
        }
        
        info = status_info.get(new_status, {'emoji': '📋', 'title': 'Application Update', 'message': ''})
        
        template = """
<!DOCTYPE html>
<html>
<body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
    <div style="background:#f3f4f6;padding:30px;border-radius:12px 12px 0 0;text-align:center;">
        <h1 style="margin:0;font-size:48px;">{{ info.emoji }}</h1>
        <h2 style="color:#1f2937;margin:10px 0 0 0;">{{ info.title }}</h2>
    </div>
    
    <div style="background:#fff;padding:30px;border:1px solid #e5e7eb;border-top:none;border-radius:0 0 12px 12px;">
        <p style="font-size:16px;color:#374151;">Hi <strong>{{ candidate_name }}</strong>,</p>
        
        <p style="font-size:16px;color:#374151;">We have an update regarding your application for <strong>{{ job_title }}</strong> at <strong>{{ company_name }}</strong>.</p>
        
        <div style="background:#f9fafb;padding:20px;border-radius:8px;margin:20px 0;">
            <p style="color:#374151;margin:0;">{{ custom_message or info.message }}</p>
        </div>
        
        <a href="https://recruitpro.co.za/candidate/applications" style="display:inline-block;background:#2563eb;color:#fff;padding:14px 32px;text-decoration:none;border-radius:8px;font-weight:600;margin:10px 0;">View Application Status</a>
    </div>
</body>
</html>
        """
        return Template(template).render(
            candidate_name=candidate_name,
            job_title=job_title,
            company_name=company_name,
            info=info,
            custom_message=message
        )
