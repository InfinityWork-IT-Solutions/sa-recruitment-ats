import os
from typing import List, Optional
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

class EmailService:
    def __init__(self):
        # Load API key from environment
        self.api_key = os.getenv("SENDGRID_API_KEY")
        self.sender_email = os.getenv("SENDGRID_FROM_EMAIL", "noreply@infinityworkitsolutions.com")
        self.sender_name = os.getenv("SENDGRID_FROM_NAME", "RecruitPro SA")

    async def send_email(self, recipient: str, subject: str, body: str, html: Optional[str] = None):
        """Send email using SendGrid API"""
        if not self.api_key or self.api_key == "dummy":
            print(f"SendGrid API Key not configured. Email to {recipient} NOT sent.")
            return False

        message = Mail(
            from_email=(self.sender_email, self.sender_name),
            to_emails=recipient,
            subject=subject,
            plain_text_content=body,
            html_content=html or body
        )

        try:
            # SendGrid's client is synchronous, so in a high-traffic app we'd use an async client
            # Or run this in a threadpool to avoid blocking the event loop.
            # For now, we'll use the standard client as it's the most reliable.
            sg = SendGridAPIClient(self.api_key)
            response = sg.send(message)
            
            if response.status_code >= 200 and response.status_code < 300:
                return True
            else:
                print(f"SendGrid error: Status Code {response.status_code}")
                return False
        except Exception as e:
            print(f"Error sending email via SendGrid: {e}")
            return False

    async def notify_job_match(self, candidate_email: str, job_title: str, score: float):
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
        return await self.send_email(candidate_email, subject, body, html)

    async def notify_company_match(self, company_email: str, candidate_name: str, job_title: str, score: float):
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
        return await self.send_email(company_email, subject, body, html)

email_service = EmailService()
