"""
RecruitPro SA - Automated Screening Service
Automatically screens applications and makes AI-powered decisions
"""

from typing import List, Dict, Optional
from datetime import datetime
from uuid import UUID
import asyncio
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import openai

from app.models.automation import AutomatedScreeningResult
from app.models.application import Application
from app.models.job import Job
from app.models.candidate import Candidate

class AutomatedScreeningService:
    """
    AI-Powered Automated Screening
    - Scores applications 0-100
    - Auto-rejects < 75%
    - Invites 75-89% to video screening
    - Fast-tracks 90%+ to interview
    """
    
    def __init__(self, db: AsyncSession, openai_api_key: str):
        self.db = db
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
        
        # Screening thresholds
        self.AUTO_REJECT_THRESHOLD = 75
        self.VIDEO_SCREENING_THRESHOLD = 75
        self.FAST_TRACK_THRESHOLD = 90
    
    async def screen_application(
        self,
        application_id: UUID,
        candidate_data: Dict,
        job_requirements: Dict
    ) -> Dict:
        """
        Screen a single application and make automated decision
        
        Returns:
            {
                "decision": "auto_reject" | "video_screening" | "fast_track",
                "overall_score": 85,
                "decision_reason": "Strong Python skills but lacks AWS experience",
                "ai_summary": "...",
                "strengths": [...],
                "weaknesses": [...],
                "red_flags": [...]
            }
        """
        
        # 1. Calculate match scores
        scores = await self._calculate_match_scores(candidate_data, job_requirements)
        
        overall_score = scores['overall_score']
        
        # 2. Make decision based on score
        if overall_score < self.AUTO_REJECT_THRESHOLD:
            decision = 'auto_reject'
        elif overall_score >= self.FAST_TRACK_THRESHOLD:
            decision = 'fast_track'
        else:
            decision = 'video_screening'
        
        # 3. Generate AI analysis and human-friendly explanation
        ai_analysis = await self._generate_ai_analysis(
            candidate_data,
            job_requirements,
            scores,
            decision
        )
        
        # 4. Save screening result to database
        result = await self._save_screening_result(
            application_id=application_id,
            scores=scores,
            decision=decision,
            ai_analysis=ai_analysis
        )
        
        # 5. Take automated action based on decision
        await self._execute_decision_action(
            application_id=application_id,
            decision=decision,
            result=result
        )
        
        return {
            **scores,
            'decision': decision,
            **ai_analysis
        }
    
    async def _calculate_match_scores(
        self,
        candidate_data: Dict,
        job_requirements: Dict
    ) -> Dict:
        """
        Calculate detailed match scores across multiple dimensions
        """
        
        # Skills matching (40 points)
        skills_score = self._calculate_skills_match(
            candidate_skills=candidate_data.get('skills', []),
            required_skills=job_requirements.get('required_skills', [])
        )
        
        # Experience matching (30 points)
        experience_score = self._calculate_experience_match(
            candidate_years=candidate_data.get('years_of_experience', 0),
            required_years=job_requirements.get('years_of_experience', 0)
        )
        
        # Education matching (10 points)
        education_score = self._calculate_education_match(
            candidate_education=candidate_data.get('education', ''),
            required_education=job_requirements.get('education_level', '')
        )
        
        # Location matching (15 points)
        location_score = self._calculate_location_match(
            candidate_location=candidate_data.get('location', ''),
            job_location=job_requirements.get('location', '')
        )
        
        # Salary alignment (5 points)
        salary_score = self._calculate_salary_match(
            candidate_expected=candidate_data.get('expected_salary', 0),
            job_range=job_requirements.get('salary_range', {})
        )
        
        # Calculate weighted overall score
        overall_score = (
            (skills_score * 0.40) +
            (experience_score * 0.30) +
            (education_score * 0.10) +
            (location_score * 0.15) +
            (salary_score * 0.05)
        )
        
        return {
            'overall_score': int(overall_score),
            'skills_score': skills_score,
            'experience_score': experience_score,
            'education_score': education_score,
            'location_score': location_score,
            'salary_score': salary_score
        }
    
    def _calculate_skills_match(
        self,
        candidate_skills: List[str],
        required_skills: List[str]
    ) -> int:
        """
        Calculate skills match score (0-100)
        """
        if not required_skills:
            return 100
        
        candidate_skills_lower = [s.lower() for s in candidate_skills]
        required_skills_lower = [s.lower() for s in required_skills]
        
        # Exact matches
        matched_skills = [
            skill for skill in required_skills_lower
            if skill in candidate_skills_lower
        ]
        
        match_percentage = (len(matched_skills) / len(required_skills_lower)) * 100
        
        # Bonus for extra skills
        extra_skills_bonus = min(len(candidate_skills) - len(required_skills), 5) * 2
        
        score = min(match_percentage + extra_skills_bonus, 100)
        
        return int(score)
    
    def _calculate_experience_match(
        self,
        candidate_years: float,
        required_years: float
    ) -> int:
        """
        Calculate experience match score (0-100)
        """
        if required_years == 0:
            return 100
        
        if candidate_years >= required_years:
            # Perfect match or overqualified
            if candidate_years <= required_years * 1.5:
                return 100
            else:
                # Slightly overqualified (might be flight risk)
                return 90
        else:
            # Underqualified
            gap = required_years - candidate_years
            penalty = min(gap * 20, 100)
            return max(0, 100 - int(penalty))
    
    def _calculate_education_match(
        self,
        candidate_education: str,
        required_education: str
    ) -> int:
        """
        Calculate education match score (0-100)
        """
        education_levels = {
            'high_school': 1,
            'diploma': 2,
            'bachelors': 3,
            'masters': 4,
            'phd': 5
        }
        
        candidate_level = education_levels.get(candidate_education.lower(), 0)
        required_level = education_levels.get(required_education.lower(), 0)
        
        if required_level == 0:
            return 100
        
        if candidate_level >= required_level:
            return 100
        elif candidate_level == required_level - 1:
            return 70  # One level below
        else:
            return 40  # Significantly below
    
    def _calculate_location_match(
        self,
        candidate_location: str,
        job_location: str
    ) -> int:
        """
        Calculate location match score (0-100)
        """
        if not job_location or job_location.lower() == 'remote':
            return 100
        
        # Exact city match
        if candidate_location.lower() == job_location.lower():
            return 100
        
        # Same province/state
        if self._same_region(candidate_location, job_location):
            return 75
        
        # Different location
        return 30
    
    def _same_region(self, location1: str, location2: str) -> bool:
        """
        Check if two locations are in the same region
        """
        # Simple implementation - you'd want more sophisticated logic
        regions = {
            'Western Cape': ['Cape Town', 'Stellenbosch', 'Paarl'],
            'Gauteng': ['Johannesburg', 'Pretoria', 'Sandton'],
            'KwaZulu-Natal': ['Durban', 'Pietermaritzburg']
        }
        
        for region_cities in regions.values():
            if location1 in region_cities and location2 in region_cities:
                return True
        
        return False
    
    def _calculate_salary_match(
        self,
        candidate_expected: float,
        job_range: Dict
    ) -> int:
        """
        Calculate salary match score (0-100)
        """
        if not job_range or not job_range.get('max'):
            return 100
        
        job_max = job_range.get('max', 0)
        job_min = job_range.get('min', 0)
        
        if candidate_expected <= job_max and candidate_expected >= job_min:
            return 100  # Within range
        elif candidate_expected > job_max:
            # Expects more than offered
            overage = ((candidate_expected - job_max) / job_max) * 100
            penalty = min(overage * 2, 100)
            return max(0, 100 - int(penalty))
        else:
            # Expects less than range (no penalty)
            return 100
    
    async def _generate_ai_analysis(
        self,
        candidate_data: Dict,
        job_requirements: Dict,
        scores: Dict,
        decision: str
    ) -> Dict:
        """
        Generate AI-powered analysis and explanations using GPT-4
        """
        
        prompt = f"""
Analyze this candidate application for a job position:

**Job Requirements:**
{job_requirements}

**Candidate Profile:**
{candidate_data}

**Match Scores:**
- Overall: {scores['overall_score']}%
- Skills: {scores['skills_score']}%
- Experience: {scores['experience_score']}%
- Education: {scores['education_score']}%
- Location: {scores['location_score']}%

**Automated Decision:** {decision}

Please provide:
1. A brief 2-3 sentence summary explaining the match
2. Top 3 strengths that make this candidate a good fit
3. Top 3 weaknesses or concerns
4. Any red flags (gaps in employment, mismatches, etc.)
5. If decision is "auto_reject", provide a kind, human-friendly rejection reason to send to the candidate

Format your response as JSON:
{
    "ai_summary": "...",
    "strengths": ["...", "...", "..."],
    "weaknesses": ["...", "...", "..."],
    "red_flags": ["..."],
    "rejection_reason_candidate": "..." (only if auto_reject)
}
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert recruitment AI analyzing candidate applications."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            import json
            analysis = json.loads(response.choices[0].message.content)
            
            return analysis
            
        except Exception as e:
            print(f"AI analysis failed: {e}")
            # Fallback to rule-based analysis
            return self._generate_fallback_analysis(scores, decision)
    
    def _generate_fallback_analysis(self, scores: Dict, decision: str) -> Dict:
        """
        Fallback analysis if AI fails
        """
        strengths = []
        weaknesses = []
        
        if scores['skills_score'] >= 80:
            strengths.append("Strong technical skill match")
        elif scores['skills_score'] < 60:
            weaknesses.append("Missing key required skills")
        
        if scores['experience_score'] >= 80:
            strengths.append("Appropriate experience level")
        elif scores['experience_score'] < 60:
            weaknesses.append("Insufficient experience for this role")
        
        if scores['location_score'] < 70:
            weaknesses.append("Location may require relocation")
        
        return {
            'ai_summary': f"Candidate scored {scores['overall_score']}% overall match.",
            'strengths': strengths or ["Profile reviewed"],
            'weaknesses': weaknesses or ["No major concerns"],
            'red_flags': [],
            'rejection_reason_candidate': "Thank you for your application. After careful review, we've decided to move forward with candidates whose experience more closely matches our requirements." if decision == 'auto_reject' else None
        }
    
    async def _save_screening_result(
        self,
        application_id: UUID,
        scores: Dict,
        decision: str,
        ai_analysis: Dict
    ) -> Dict:
        """
        Save screening result to database
        """
        # result = AutomatedScreeningResult(...)
        
        result = AutomatedScreeningResult(
            application_id=application_id,
            overall_score=scores['overall_score'],
            skills_score=scores.get('skills_score'),
            experience_score=scores.get('experience_score'),
            education_score=scores.get('education_score'),
            location_score=scores.get('location_score'),
            decision=decision,
            decision_reason=ai_analysis.get('ai_summary'),
            ai_summary=ai_analysis.get('ai_summary'),
            strengths=ai_analysis.get('strengths'),
            weaknesses=ai_analysis.get('weaknesses'),
            red_flags=ai_analysis.get('red_flags'),
            rejection_reason_candidate=ai_analysis.get('rejection_reason_candidate'),
            processed_at=datetime.utcnow()
        )
        
        self.db.add(result)
        await self.db.commit()
        await self.db.refresh(result)
        
        return result
    
    async def _execute_decision_action(
        self,
        application_id: UUID,
        decision: str,
        result: Dict
    ):
        """
        Execute automated action BASED ON MODE (Full Auto vs Semi-Auto)
        
        Defaulting to SEMI-AUTO (Queue for recruiter approval)
        as this is the safest and most 'wow' factor for recruiters
        """
        from app.services.ai_decision_queue_service import AIDecisionQueueService, DecisionType
        
        # Get application/candidate details for the decision
        app_result = await self.db.execute(
            select(Application).where(Application.id == application_id)
        )
        application = app_result.scalar_one_or_none()
        
        if not application:
            return
            
        decision_service = AIDecisionQueueService(self.db)
        
        # Map screening decision to queue decision type
        decision_map = {
            'auto_reject': DecisionType.AUTO_REJECT,
            'video_screening': DecisionType.SEND_VIDEO_SCREENING,
            'fast_track': DecisionType.FAST_TRACK_INTERVIEW
        }
        
        decision_type = decision_map.get(decision)
        if not decision_type:
            return
            
        # Create the decision in the queue
        await decision_service.create_decision(
            job_id=application.job_id,
            application_id=application_id,
            candidate_id=application.candidate_id,
            decision_type=decision_type,
            ai_reasoning=result.decision_reason or result.ai_summary,
            ai_confidence=result.overall_score,
            proposed_action={
                "action": decision,
                "application_id": str(application_id),
                "details": {
                    "score": result.overall_score,
                    "strengths": result.strengths,
                    "weaknesses": result.weaknesses
                }
            },
            created_by_service="AutomatedScreeningService"
        )
        
        print(f"Decision queued for application {application_id}: {decision}")
    
    async def _send_rejection_email(self, application_id: UUID, result: Dict):
        """
        Send automated rejection email to candidate
        """
        # This would integrate with your email service
        # For now, placeholder
        print(f"Sending rejection email for application {application_id}")
        
        # Mark email as sent in database
        result.rejection_email_sent = True
        result.rejection_email_sent_at = datetime.utcnow()
        await self.db.commit()
    
    async def _send_video_screening_invitation(self, application_id: UUID):
        """
        Send video screening invitation
        """
        print(f"Sending video screening invite for application {application_id}")
        # Implementation in video screening service
    
    async def _notify_recruiters_fast_track(self, application_id: UUID):
        """
        Notify recruiters of fast-track candidate
        """
        print(f"Notifying recruiters of fast-track candidate {application_id}")
        # Send notification
    
    async def _update_application_status(self, application_id: UUID, status: str):
        """
        Update application status
        """
        # from app.models.application import Application
        
        result = await self.db.execute(
            select(Application).where(Application.id == application_id)
        )
        application = result.scalar_one_or_none()
        
        if application:
            application.status = status
            await self.db.commit()
    
    async def bulk_screen_applications(
        self,
        job_id: UUID,
        max_applications: int = 100
    ) -> List[Dict]:
        """
        Screen multiple applications for a job in bulk
        """
        # from app.models.application import Application
        
        # Get unscreened applications
        result = await self.db.execute(
            select(Application)
            .where(Application.job_id == job_id)
            .where(Application.status == 'new')
            .limit(max_applications)
        )
        applications = result.scalars().all()
        
        results = []
        for application in applications:
            try:
                screening_result = await self.screen_application(
                    application_id=application.id,
                    candidate_data=application.candidate_data,
                    job_requirements=application.job.requirements
                )
                results.append(screening_result)
            except Exception as e:
                print(f"Error screening application {application.id}: {e}")
                continue
        
        return results
