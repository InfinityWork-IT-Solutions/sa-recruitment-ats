"""
RecruitPro SA - Proactive Candidate Sourcing Service
AI actively hunts for qualified candidates instead of waiting for applications
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from uuid import UUID
import asyncio

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
import openai

from app.models.automation import SourcingCampaign, SourcingProspect
from app.models import Job, Candidate


class ProactiveSourcingService:
    """
    Proactive Candidate Sourcing
    - AI searches candidate database for matches
    - Sends personalized outreach messages
    - Tracks responses and applications
    - Automated follow-ups
    """
    
    def __init__(self, db: AsyncSession, email_service, openai_api_key: str):
        self.db = db
        self.email_service = email_service
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
    
    async def create_sourcing_campaign(
        self,
        job_id: UUID,
        company_id: UUID,
        name: str,
        target_criteria: Dict,
        max_candidates: int = 100
    ) -> Dict:
        """
        Create a new sourcing campaign
        
        Args:
            job_id: Job to source candidates for
            company_id: Company creating campaign
            name: Campaign name
            target_criteria: {
                "skills": ["Python", "Django"],
                "experience_years_min": 3,
                "experience_years_max": 7,
                "locations": ["Cape Town"],
                "education_levels": ["bachelors", "masters"]
            }
            max_candidates: Maximum candidates to contact
        """
        # from models import ...
        
        # Get job details
        job = await self.db.get(Job, job_id)
        
        # Generate AI search query
        ai_search_query = await self._generate_search_query(job, target_criteria)
        
        # Create campaign
        campaign = SourcingCampaign(
            job_id=job_id,
            company_id=company_id,
            name=name,
            status='draft',
            target_skills=target_criteria.get('skills'),
            target_experience_years_min=target_criteria.get('experience_years_min'),
            target_experience_years_max=target_criteria.get('experience_years_max'),
            target_locations=target_criteria.get('locations'),
            target_education_levels=target_criteria.get('education_levels'),
            ai_search_query=ai_search_query,
            max_candidates_to_contact=max_candidates,
            start_date=datetime.utcnow().date(),
            end_date=(datetime.utcnow() + timedelta(days=30)).date()
        )
        
        self.db.add(campaign)
        await self.db.commit()
        await self.db.refresh(campaign)
        
        return {
            'campaign_id': campaign.id,
            'name': campaign.name,
            'status': campaign.status,
            'target_criteria': target_criteria
        }
    
    async def _generate_search_query(self, job, criteria: Dict) -> str:
        """
        Generate AI-powered search query for finding candidates
        """
        
        prompt = f"""
Generate a natural language search query to find qualified candidates for this job:

Job Title: {job.title}
Job Description: {job.description}

Target Criteria:
- Skills: {criteria.get('skills', [])}
- Experience: {criteria.get('experience_years_min', 0)}-{criteria.get('experience_years_max', 10)} years
- Locations: {criteria.get('locations', [])}
- Education: {criteria.get('education_levels', [])}

Create a concise search query (max 100 words) that captures the ideal candidate profile.
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are a recruitment expert creating candidate search queries."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                max_tokens=150
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"AI query generation failed: {e}")
            # Fallback to simple query
            skills_str = ", ".join(criteria.get('skills', []))
            return f"Software developer with {skills_str} skills, {criteria.get('experience_years_min', 0)}+ years experience"
    
    async def find_candidates(
        self,
        campaign_id: UUID,
        limit: int = 100
    ) -> List[Dict]:
        """
        Find potential candidates matching campaign criteria
        """
        # from models import ...
        
        campaign = await self.db.get(SourcingCampaign, campaign_id)
        
        if not campaign:
            raise ValueError("Campaign not found")
        
        # Build database query based on criteria
        query_filters = [
            Candidate.is_active == True,
            Candidate.job_seeking_status == 'actively_looking'
        ]
        
        # Filter by skills (candidates with any of the target skills)
        if campaign.target_skills:
            query_filters.append(
                or_(*[
                    Candidate.skills.contains([skill])
                    for skill in campaign.target_skills
                ])
            )
        
        # Filter by experience
        if campaign.target_experience_years_min:
            query_filters.append(
                Candidate.years_of_experience >= campaign.target_experience_years_min
            )
        
        if campaign.target_experience_years_max:
            query_filters.append(
                Candidate.years_of_experience <= campaign.target_experience_years_max
            )
        
        # Filter by location
        if campaign.target_locations:
            query_filters.append(
                or_(*[
                    Candidate.location.ilike(f"%{loc}%")
                    for loc in campaign.target_locations
                ])
            )
        
        # Execute query
        result = await self.db.execute(
            select(Candidate)
            .where(and_(*query_filters))
            .limit(limit)
        )
        
        candidates = result.scalars().all()
        
        # Score each candidate
        prospects = []
        for candidate in candidates:
            score = await self._calculate_match_score(candidate, campaign)
            
            prospects.append({
                'candidate_id': candidate.id,
                'candidate_name': candidate.full_name,
                'candidate_email': candidate.email,
                'match_score': score['overall_score'],
                'match_reason': score['reason']
            })
        
        # Sort by match score
        prospects.sort(key=lambda x: x['match_score'], reverse=True)
        
        return prospects
    
    async def _calculate_match_score(self, candidate, campaign) -> Dict:
        """
        Calculate how well candidate matches campaign criteria
        """
        score = 0
        reasons = []
        
        # Skills match (40 points)
        if campaign.target_skills:
            candidate_skills = set([s.lower() for s in (candidate.skills or [])])
            target_skills = set([s.lower() for s in campaign.target_skills])
            
            matched_skills = candidate_skills.intersection(target_skills)
            skills_match_rate = len(matched_skills) / len(target_skills)
            
            skills_score = int(skills_match_rate * 40)
            score += skills_score
            
            if skills_score >= 30:
                reasons.append(f"Strong skill match: {', '.join(matched_skills)}")
            elif skills_score >= 20:
                reasons.append(f"Good skill match: {', '.join(matched_skills)}")
        
        # Experience match (30 points)
        if campaign.target_experience_years_min and campaign.target_experience_years_max:
            exp_years = candidate.years_of_experience or 0
            
            if campaign.target_experience_years_min <= exp_years <= campaign.target_experience_years_max:
                score += 30
                reasons.append(f"{exp_years} years experience (perfect match)")
            elif exp_years >= campaign.target_experience_years_min:
                score += 20
                reasons.append(f"{exp_years} years experience (above minimum)")
        
        # Location match (20 points)
        if campaign.target_locations:
            candidate_location = (candidate.location or "").lower()
            
            for target_loc in campaign.target_locations:
                if target_loc.lower() in candidate_location:
                    score += 20
                    reasons.append(f"Located in {target_loc}")
                    break
        
        # Education match (10 points)
        if campaign.target_education_levels:
            candidate_edu = (candidate.education_level or "").lower()
            
            for target_edu in campaign.target_education_levels:
                if target_edu.lower() in candidate_edu:
                    score += 10
                    reasons.append(f"{target_edu.title()} degree")
                    break
        
        return {
            'overall_score': min(score, 100),
            'reason': "; ".join(reasons) if reasons else "Potential match"
        }
    
    async def add_prospects_to_campaign(
        self,
        campaign_id: UUID,
        prospect_data: List[Dict]
    ):
        """
        Add found candidates as prospects to campaign
        """
        # from models import ...
        
        campaign = await self.db.get(SourcingCampaign, campaign_id)
        
        for prospect in prospect_data:
            sourcing_prospect = SourcingProspect(
                campaign_id=campaign_id,
                candidate_id=prospect['candidate_id'],
                job_id=campaign.job_id,
                match_score=prospect['match_score'],
                match_reason=prospect['match_reason'],
                status='identified'
            )
            
            self.db.add(sourcing_prospect)
        
        # Update campaign stats
        campaign.candidates_found = len(prospect_data)
        
        await self.db.commit()
    
    async def send_outreach_messages(
        self,
        campaign_id: UUID,
        top_n: int = 50
    ) -> Dict:
        """
        Send personalized outreach messages to top prospects
        """
        # from models import ...
        
        campaign = await self.db.get(SourcingCampaign, campaign_id)
        job = await self.db.get(Job, campaign.job_id)
        
        # Get top prospects (highest match scores, not yet contacted)
        result = await self.db.execute(
            select(SourcingProspect)
            .where(
                and_(
                    SourcingProspect.campaign_id == campaign_id,
                    SourcingProspect.status == 'identified'
                )
            )
            .order_by(SourcingProspect.match_score.desc())
            .limit(top_n)
        )
        
        prospects = result.scalars().all()
        
        messages_sent = 0
        
        for prospect in prospects:
            candidate = await self.db.get(Candidate, prospect.candidate_id)
            
            # Generate personalized message
            message = await self._generate_outreach_message(
                candidate,
                job,
                prospect.match_reason
            )
            
            # Send email
            result = await self._send_outreach_email(
                candidate=candidate,
                job=job,
                message_body=message,
                campaign=campaign
            )
            
            if result['success']:
                # Update prospect status
                prospect.status = 'message_sent'
                prospect.message_sent_at = datetime.utcnow()
                
                # Schedule follow-up (3 days later)
                prospect.next_follow_up_at = datetime.utcnow() + timedelta(days=3)
                
                messages_sent += 1
        
        # Update campaign stats
        campaign.candidates_messaged = messages_sent
        campaign.candidates_contacted_count = messages_sent
        
        await self.db.commit()
        
        return {
            'messages_sent': messages_sent,
            'campaign_id': campaign_id
        }
    
    async def _generate_outreach_message(
        self,
        candidate,
        job,
        match_reason: str
    ) -> str:
        """
        Generate personalized outreach message using AI
        """
        
        prompt = f"""
Write a personalized, professional outreach email to a passive candidate.

Candidate Name: {candidate.full_name}
Candidate Skills: {', '.join(candidate.skills or [])}
Why They're a Match: {match_reason}

Job Title: {job.title}
Company: {job.company.name}
Job Description (brief): {job.description[:300]}...

Requirements:
- Warm, professional tone
- Acknowledge their skills specifically
- Explain why they're a good fit
- Invite them to learn more (not apply yet - low pressure!)
- Keep it under 150 words
- End with a clear, easy next step

Write only the email body (no subject line).
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert recruiter writing personalized outreach emails."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )
            
            return response.choices[0].message.content.strip()
            
        except Exception as e:
            print(f"AI message generation failed: {e}")
            # Fallback to template
            return f"""
Hi {candidate.full_name},

I noticed your profile and was impressed by your experience with {', '.join((candidate.skills or [])[:3])}.

We have an exciting opportunity for a {job.title} at {job.company.name} that I think could be a great fit for you.

{match_reason}

Would you be interested in learning more? No pressure - just wanted to reach out!

Best regards,
{job.company.name} Team
"""
    
    async def _send_outreach_email(
        self,
        candidate,
        job,
        message_body: str,
        campaign
    ) -> Dict:
        """
        Send outreach email to candidate
        """
        
        subject = f"Opportunity: {job.title} at {job.company.name}"
        
        html_content = f"""
        <!DOCTYPE html>
        <html>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="white-space: pre-line;">
{message_body}
            </div>
            
            <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee;">
                <a href="https://recruitpro.sa/jobs/{job.id}?source=outreach&campaign={campaign.id}" 
                   style="background: #2E75B6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; font-weight: bold;">
                    View Opportunity →
                </a>
            </div>
            
            <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #999;">
                <p>You're receiving this because your profile matches our requirements for this role. 
                If you're not interested, you can <a href="#">unsubscribe from future opportunities</a>.</p>
            </div>
        </body>
        </html>
        """
        
        return await self.email_service.send_email(
            to_email=candidate.email,
            to_name=candidate.full_name,
            subject=subject,
            html_content=html_content
        )
    
    async def send_follow_ups(
        self,
        campaign_id: Optional[UUID] = None
    ):
        """
        Send automated follow-up messages
        Background job that runs daily
        """
        # from models import ...
        
        now = datetime.utcnow()
        
        # Get prospects needing follow-up
        query_filters = [
            SourcingProspect.status == 'message_sent',
            SourcingProspect.next_follow_up_at <= now,
            SourcingProspect.follow_up_count < 2  # Max 2 follow-ups
        ]
        
        if campaign_id:
            query_filters.append(SourcingProspect.campaign_id == campaign_id)
        
        result = await self.db.execute(
            select(SourcingProspect)
            .where(and_(*query_filters))
        )
        
        prospects = result.scalars().all()
        
        for prospect in prospects:
            candidate = await self.db.get(Candidate, prospect.candidate_id)
            campaign = await self.db.get(SourcingCampaign, prospect.campaign_id)
            job = await self.db.get(Job, prospect.job_id)
            
            # Send follow-up
            await self._send_follow_up_email(candidate, job, campaign, prospect.follow_up_count + 1)
            
            # Update prospect
            prospect.follow_up_count += 1
            prospect.last_follow_up_at = now
            
            # Schedule next follow-up (if under limit)
            if prospect.follow_up_count < 2:
                prospect.next_follow_up_at = now + timedelta(days=5)
            else:
                prospect.next_follow_up_at = None
        
        await self.db.commit()
    
    async def _send_follow_up_email(
        self,
        candidate,
        job,
        campaign,
        follow_up_number: int
    ):
        """
        Send follow-up email
        """
        
        if follow_up_number == 1:
            message = f"Hi {candidate.full_name}, just following up on the {job.title} opportunity I mentioned. Still interested?"
        else:
            message = f"Hi {candidate.full_name}, last chance to hear more about this {job.title} role. Let me know if you'd like details!"
        
        subject = f"Re: {job.title} opportunity"
        
        await self.email_service.send_email(
            to_email=candidate.email,
            subject=subject,
            html_content=f"<p>{message}</p>"
        )
    
    async def track_response(
        self,
        prospect_id: UUID,
        response_type: str,  # 'responded', 'applied', 'declined'
        response_text: Optional[str] = None
    ):
        """
        Track candidate response to outreach
        """
        # from models import ...
        
        prospect = await self.db.get(SourcingProspect, prospect_id)
        
        if not prospect:
            return
        
        prospect.status = response_type
        prospect.responded_at = datetime.utcnow()
        prospect.candidate_response = response_text
        
        if response_type == 'responded':
            prospect.candidate_interest_level = 'high'
        elif response_type == 'declined':
            prospect.candidate_interest_level = 'not_interested'
        
        await self.db.commit()
