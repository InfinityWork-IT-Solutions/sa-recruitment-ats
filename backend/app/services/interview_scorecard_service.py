"""
Interview Scorecard Service — structured per-interviewer feedback on candidates
"""
from typing import List, Optional, Dict
from uuid import UUID

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.models.scorecard import InterviewScorecard, ScorecardRecommendation
from app.models.user import User


class InterviewScorecardService:

    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_scorecards(self, application_id: UUID) -> List[dict]:
        result = await self.db.execute(
            select(InterviewScorecard)
            .where(InterviewScorecard.application_id == application_id)
            .order_by(InterviewScorecard.created_at.desc())
        )
        scorecards = result.scalars().all()

        output = []
        for sc in scorecards:
            scorer_result = await self.db.execute(
                select(User).where(User.id == sc.scored_by)
            )
            scorer = scorer_result.scalar_one_or_none()
            output.append({
                "id": str(sc.id),
                "application_id": str(sc.application_id),
                "interview_id": str(sc.interview_id) if sc.interview_id else None,
                "scored_by": str(sc.scored_by) if sc.scored_by else None,
                "scorer_name": f"{scorer.first_name} {scorer.last_name}" if scorer else "Unknown",
                "overall_rating": sc.overall_rating,
                "criteria_scores": sc.criteria_scores or {},
                "strengths": sc.strengths,
                "concerns": sc.concerns,
                "recommendation": sc.recommendation.value if sc.recommendation else None,
                "notes": sc.notes,
                "created_at": sc.created_at.isoformat(),
            })
        return output

    async def create_scorecard(
        self,
        application_id: UUID,
        scored_by: UUID,
        overall_rating: int,
        recommendation: str,
        criteria_scores: Optional[Dict] = None,
        strengths: Optional[str] = None,
        concerns: Optional[str] = None,
        notes: Optional[str] = None,
        interview_id: Optional[UUID] = None,
    ) -> dict:
        scorecard = InterviewScorecard(
            application_id=application_id,
            interview_id=interview_id,
            scored_by=scored_by,
            overall_rating=min(5, max(1, overall_rating)),
            recommendation=ScorecardRecommendation(recommendation),
            criteria_scores=criteria_scores or {},
            strengths=strengths,
            concerns=concerns,
            notes=notes,
        )
        self.db.add(scorecard)
        await self.db.flush()

        return {
            "id": str(scorecard.id),
            "application_id": str(scorecard.application_id),
            "overall_rating": scorecard.overall_rating,
            "recommendation": scorecard.recommendation.value,
            "created_at": scorecard.created_at.isoformat(),
        }
