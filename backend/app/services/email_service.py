import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import List, Optional

class EmailService:
    def __init__(self):
        # Default settings - should be in .env
        self.smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER", "")
        self.smtp_password = os.getenv("SMTP_PASSWORD", "")
        self.sender_email = os.getenv("SENDER_EMAIL", "notifications@recruitpro.co.za")

    def send_email(self, recipient: str, subject: str, body: str, html: Optional[str] = None):
        """Standard email sender"""
        if not self.smtp_user or not self.smtp_password:
            print(f"SMTP not configured. Email to {recipient} NOT sent.")
            return False

        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"] = f"RecruitPro SA <{self.sender_email}>"
        message["To"] = recipient

        part1 = MIMEText(body, "plain")
        message.attach(part1)
        
        if html:
            part2 = MIMEText(html, "html")
            message.attach(part2)

        try:
            with smtplib.SMTP(self.smtp_server, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.sender_email, recipient, message.as_string())
            return True
        except Exception as e:
            print(f"Error sending email: {e}")
            return False

    def notify_job_match(self, candidate_email: str, job_title: str, score: float):
        subject = f"New Job Match: {job_title}"
        body = f"We found a new job match that scores {score}% for your profile!"
        html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <div style="max-width: 600px; margin: 0 auto; border: 1px solid #ddd; border-radius: 8px; padding: 20px;">
                    <h1 style="color: #22c55e;">New Match Found!</h1>
                    <p>Hi there,</p>
                    <p>Our AI has found a perfect match for you:</p>
                    <div style="background: #f0fdf4; padding: 15px; border-radius: 6px; margin: 20px 0;">
                        <h2 style="margin: 0;">{job_title}</h2>
                        <p style="font-size: 24px; font-weight: bold; color: #166534; margin: 10px 0;">{score}% Match Score</p>
                    </div>
                    <p>Log in to your dashboard to view the details and apply.</p>
                    <a href="https://recruitpro.co.za/login" style="display: inline-block; background: #22c55e; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">View Job Details</a>
                </div>
            </body>
        </html>
        """
        return self.send_email(candidate_email, subject, body, html)

    def notify_company_match(self, company_email: str, candidate_name: str, job_title: str, score: float):
        subject = f"AI Match for {job_title}: {candidate_name}"
        body = f"A new candidate ({candidate_name}) matches your post for {job_title} with a score of {score}%!"
        html = f"""
        <html>
            <body style="font-family: sans-serif; color: #333;">
                <h1 style="color: #3b82f6;">Top Candidate Found</h1>
                <p>We found a high-scoring candidate for your role <strong>{job_title}</strong>.</p>
                <div style="background: #eff6ff; padding: 15px; border-radius: 6px;">
                    <p><strong>Candidate:</strong> {candidate_name}</p>
                    <p><strong>Match Score:</strong> {score}%</p>
                </div>
                <p>Visit your portal to review their profile and invite them to interview.</p>
            </body>
        </html>
        """
        return self.send_email(company_email, subject, body, html)

email_service = EmailService()
