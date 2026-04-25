"""
RecruitPro SA - AI Video Screening Service
GAME-CHANGER FEATURE: Replaces first-round phone screens with AI-analyzed video responses
"""

from typing import List, Dict, Optional
from datetime import datetime, timedelta
from uuid import UUID, uuid4
import secrets
import json

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
import openai
import assemblyai as aai

from app.models.automation import (
    VideoScreeningInvitation, 
    VideoScreeningTemplate, 
    VideoScreeningResponse, 
    VideoScreeningResult
)
from app.models import Application, Job, User


class VideoScreeningService:
    """
    AI-Powered Video Screening
    1. Send video screening invitation to candidate
    2. Candidate records video answers on their phone
    3. AI transcribes and analyzes responses
    4. AI generates detailed report card
    5. Auto-invites top scorers to interview
    """
    
    def __init__(
        self,
        db: AsyncSession,
        openai_api_key: str,
        assemblyai_api_key: str
    ):
        self.db = db
        self.openai_client = openai.AsyncOpenAI(api_key=openai_api_key)
        self.aai_client = aai.Client(token=assemblyai_api_key)
        
        # Scoring thresholds
        self.AUTO_INTERVIEW_THRESHOLD = 80
        self.MANUAL_REVIEW_THRESHOLD = 60
    
    async def create_video_screening_invitation(
        self,
        application_id: UUID,
        candidate_id: UUID,
        job_id: UUID,
        template_id: Optional[UUID] = None
    ) -> Dict:
        """
        Create and send video screening invitation to candidate
        
        Returns:
            {
                "invitation_id": UUID,
                "access_token": "unique_token",
                "access_url": "https://recruitpro.sa/video-screening/unique_token",
                "expires_at": datetime
            }
        """
        # from models import ...
        
        # Generate unique access token
        access_token = secrets.token_urlsafe(32)
        
        # Set expiration (7 days from now)
        expires_at = datetime.utcnow() + timedelta(days=7)
        
        # Create invitation
        invitation = VideoScreeningInvitation(
            application_id=application_id,
            candidate_id=candidate_id,
            job_id=job_id,
            template_id=template_id,
            access_token=access_token,
            expires_at=expires_at,
            status='pending'
        )
        
        self.db.add(invitation)
        await self.db.commit()
        await self.db.refresh(invitation)
        
        # Send invitation email
        await self._send_invitation_email(invitation)
        
        return {
            'invitation_id': invitation.id,
            'access_token': access_token,
            'access_url': f"https://recruitpro.sa/video-screening/{access_token}",
            'expires_at': expires_at
        }
    
    async def get_screening_questions(
        self,
        invitation_id: UUID
    ) -> List[Dict]:
        """
        Get video screening questions for candidate
        """
        # from models import ...
        
        invitation = await self.db.get(VideoScreeningInvitation, invitation_id)
        
        if invitation.template_id:
            template = await self.db.get(VideoScreeningTemplate, invitation.template_id)
            questions = template.questions
        else:
            # Use default questions
            questions = await self._get_default_questions(invitation.job_id)
        
        return questions
    
    async def _get_default_questions(self, job_id: UUID) -> List[Dict]:
        """
        Generate default screening questions based on job
        """
        # You could use AI to generate custom questions
        # For now, return standard questions
        return [
            {
                "order": 1,
                "question": "Tell us about your relevant experience for this role. What is the largest project you've worked on?",
                "duration_seconds": 120,
                "type": "experience"
            },
            {
                "order": 2,
                "question": "Describe a challenging technical problem you solved recently. How did you approach it?",
                "duration_seconds": 120,
                "type": "technical"
            },
            {
                "order": 3,
                "question": "Why are you interested in this role and our company? What excites you most?",
                "duration_seconds": 90,
                "type": "motivation"
            }
        ]
    
    async def save_video_response(
        self,
        invitation_id: UUID,
        question_index: int,
        question_text: str,
        video_url: str,
        duration_seconds: int
    ) -> Dict:
        """
        Save candidate's video response and process it with AI
        """
        # from models import ...
        
        # Get invitation and candidate details
        invitation = await self.db.get(VideoScreeningInvitation, invitation_id)
        
        # Create response record
        response = VideoScreeningResponse(
            invitation_id=invitation_id,
            candidate_id=invitation.candidate_id,
            question_index=question_index,
            question_text=question_text,
            video_url=video_url,
            video_duration_seconds=duration_seconds,
            recorded_at=datetime.utcnow()
        )
        
        self.db.add(response)
        await self.db.commit()
        await self.db.refresh(response)
        
        # Process video asynchronously
        # In production, this would be a background task
        await self._process_video_response(response)
        
        return {
            'response_id': response.id,
            'status': 'processing'
        }
    
    async def _process_video_response(self, response):
        """
        Process video response: transcribe and analyze
        """
        
        # 1. Transcribe video using AssemblyAI
        transcript_data = await self._transcribe_video(response.video_url)
        
        response.transcript = transcript_data['text']
        response.transcript_confidence = transcript_data['confidence']
        
        # 2. Analyze transcript with AI
        analysis = await self._analyze_transcript(
            transcript=transcript_data['text'],
            question=response.question_text
        )
        
        response.ai_score = analysis['score']
        response.ai_analysis = analysis['analysis']
        response.technical_keywords_found = analysis['keywords']
        response.sentiment_analysis = analysis['sentiment']
        response.processed_at = datetime.utcnow()
        
        await self.db.commit()
    
    async def _transcribe_video(self, video_url: str) -> Dict:
        """
        Transcribe video using AssemblyAI
        """
        try:
            # Configure AssemblyAI
            config = aai.TranscriptionConfig(
                speaker_labels=True,
                sentiment_analysis=True,
                entity_detection=True
            )
            
            # Transcribe
            transcriber = aai.Transcriber()
            transcript = transcriber.transcribe(video_url, config=config)
            
            return {
                'text': transcript.text,
                'confidence': transcript.confidence * 100,  # Convert to percentage
                'words': transcript.words,
                'sentiment': transcript.sentiment_analysis_results
            }
            
        except Exception as e:
            print(f"Transcription error: {e}")
            return {
                'text': '[Transcription failed]',
                'confidence': 0,
                'words': [],
                'sentiment': None
            }
    
    async def _analyze_transcript(
        self,
        transcript: str,
        question: str
    ) -> Dict:
        """
        Analyze transcript using GPT-4
        """
        
        prompt = f"""
Analyze this video screening response:

**Question:** {question}

**Candidate's Answer (transcribed):**
{transcript}

Please evaluate:
1. Content quality (0-100): How well did they answer the question?
2. Communication skills (0-100): Clarity, structure, professionalism
3. Technical depth (0-100): Demonstrates real knowledge/experience
4. Red flags: Any concerns (vague answers, lack of examples, etc.)
5. Positive signals: Strengths demonstrated
6. Technical keywords mentioned
7. Overall sentiment

Provide your analysis in JSON format:
{
    "score": 85,
    "content_score": 90,
    "communication_score": 85,
    "technical_score": 80,
    "analysis": "Detailed analysis...",
    "keywords": ["Python", "Django", "AWS"],
    "sentiment": {"overall": "positive", "confidence": 0.85},
    "red_flags": [],
    "positive_signals": ["Provided specific examples", "Clear communication"]
}
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert recruitment interviewer analyzing video screening responses."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            import json
            analysis = json.loads(response.choices[0].message.content)
            
            return analysis
            
        except Exception as e:
            print(f"Analysis error: {e}")
            return {
                'score': 50,
                'content_score': 50,
                'communication_score': 50,
                'technical_score': 50,
                'analysis': 'Analysis failed',
                'keywords': [],
                'sentiment': {},
                'red_flags': [],
                'positive_signals': []
            }
    
    async def complete_video_screening(
        self,
        invitation_id: UUID
    ) -> Dict:
        """
        Mark screening as complete and generate overall assessment
        """
        # from models import ...
        
        # Update invitation status
        invitation = await self.db.get(VideoScreeningInvitation, invitation_id)
        invitation.status = 'completed'
        invitation.completed_at = datetime.utcnow()
        
        # Get all responses
        result = await self.db.execute(
            select(VideoScreeningResponse)
            .where(VideoScreeningResponse.invitation_id == invitation_id)
        )
        responses = result.scalars().all()
        
        # Calculate overall scores
        overall_score = int(sum(r.ai_score for r in responses) / len(responses))
        content_score = int(sum(r.ai_analysis.get('content_score', 0) for r in responses) / len(responses))
        communication_score = int(sum(r.ai_analysis.get('communication_score', 0) for r in responses) / len(responses))
        technical_score = int(sum(r.ai_analysis.get('technical_score', 0) for r in responses) / len(responses))
        
        # Generate overall AI summary
        ai_summary = await self._generate_overall_summary(responses)
        
        # Determine recommended action
        if overall_score >= self.AUTO_INTERVIEW_THRESHOLD:
            recommended_action = 'proceed_to_interview'
        elif overall_score >= self.MANUAL_REVIEW_THRESHOLD:
            recommended_action = 'manual_review'
        else:
            recommended_action = 'reject'
        
        # Create result record
        result = VideoScreeningResult(
            invitation_id=invitation_id,
            candidate_id=invitation.candidate_id,
            job_id=invitation.job_id,
            overall_score=overall_score,
            content_score=content_score,
            communication_score=communication_score,
            technical_score=technical_score,
            ai_summary=ai_summary['summary'],
            key_strengths=ai_summary['strengths'],
            key_concerns=ai_summary['concerns'],
            recommended_action=recommended_action,
            final_decision='pending'
        )
        
        self.db.add(result)
        await self.db.commit()
        await self.db.refresh(result)
        
        # Take automated action
        await self._execute_screening_action(result, recommended_action)
        
        return {
            'result_id': result.id,
            'overall_score': overall_score,
            'recommended_action': recommended_action,
            'summary': ai_summary
        }
    
    async def _generate_overall_summary(
        self,
        responses: List
    ) -> Dict:
        """
        Generate overall summary of all video responses
        """
        
        all_transcripts = "\n\n".join([
            f"Q: {r.question_text}\nA: {r.transcript}"
            for r in responses
        ])
        
        all_analyses = "\n\n".join([
            f"Question {i+1} Analysis: {r.ai_analysis.get('analysis', '')}"
            for i, r in enumerate(responses)
        ])
        
        prompt = f"""
Based on these video screening responses, provide an overall assessment:

**Transcripts:**
{all_transcripts}

**Individual Question Analyses:**
{all_analyses}

Generate:
1. Overall summary (2-3 sentences)
2. Top 3 key strengths
3. Top 3 key concerns or areas needing clarification
4. Should this candidate proceed to interview?

Format as JSON:
{
    "summary": "...",
    "strengths": ["...", "...", "..."],
    "concerns": ["...", "...", "..."],
    "interview_ready": true/false
}
"""
        
        try:
            response = await self.openai_client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert recruitment interviewer."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.7,
                response_format={"type": "json_object"}
            )
            
            import json
            return json.loads(response.choices[0].message.content)
            
        except:
            return {
                'summary': 'Assessment completed',
                'strengths': ['Completed video screening'],
                'concerns': [],
                'interview_ready': True
            }
    
    async def _execute_screening_action(
        self,
        result,
        recommended_action: str
    ):
        """
        Take automated action via the AI Decision Queue (Semi-Auto)
        """
        from app.services.ai_decision_queue_service import AIDecisionQueueService, DecisionType
        
        decision_service = AIDecisionQueueService(self.db)
        
        # Map video screening recommendation to queue decision type
        decision_map = {
            'proceed_to_interview': DecisionType.FAST_TRACK_INTERVIEW,
            'reject': DecisionType.AUTO_REJECT,
            'manual_review': None # For manual review, we don't necessarily queue an automated action
        }
        
        decision_type = decision_map.get(recommended_action)
        if not decision_type:
            # If manual review or unknown, we just leave it for the recruiter to see in the results
            print(f"Video screening result {result.id} requires manual review")
            return
            
        # Create decision in queue
        await decision_service.create_decision(
            job_id=result.job_id,
            candidate_id=result.candidate_id,
            application_id=result.application_id if hasattr(result, 'application_id') else None,
            decision_type=decision_type,
            ai_reasoning=result.ai_summary,
            ai_confidence=result.overall_score,
            proposed_action={
                "action": recommended_action,
                "video_screening_result_id": str(result.id),
                "details": {
                    "score": result.overall_score,
                    "strengths": result.key_strengths,
                    "concerns": result.key_concerns
                }
            },
            created_by_service="VideoScreeningService"
        )
        
        print(f"Decision queued from video screening {result.id}: {recommended_action}")
    
    async def _send_invitation_email(self, invitation):
        """
        Send video screening invitation email
        """
        print(f"Sending video screening invite email to candidate {invitation.candidate_id}")
        # Email implementation here
    
    async def _send_interview_invitation(self, result):
        """
        Send interview invitation email
        """
        print(f"Sending interview invite to candidate {result.candidate_id}")
        # Email implementation here
    
    async def _send_screening_rejection(self, result):
        """
        Send kind rejection after video screening
        """
        print(f"Sending screening rejection to candidate {result.candidate_id}")
        # Email implementation here
    
    async def _notify_recruiters_for_review(self, result):
        """
        Notify recruiters to manually review borderline candidate
        """
        print(f"Notifying recruiters to review candidate {result.candidate_id}")
        # Notification implementation here
