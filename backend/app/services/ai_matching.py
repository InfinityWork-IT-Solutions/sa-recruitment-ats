"""
AI Matching Service — LLM-powered candidate-job scoring with rule-based fallback.
Primary: GPT-4 semantic analysis for richer matching.
Fallback: weighted arithmetic (skills 40%, experience 30%, location 30%).
"""
import json
import os
from typing import List, Dict, Any, Optional
import openai

from app.models.job import Job
from app.models.candidate import Candidate


class AIMatchingService:

    def __init__(self):
        api_key = os.getenv("OPENAI_API_KEY", "")
        self.client = openai.AsyncOpenAI(api_key=api_key) if api_key else None
        self.model = os.getenv("OPENAI_MODEL", "gpt-4")

    async def calculate_match_score(self, job: Job, candidate: Candidate) -> Dict[str, Any]:
        """
        Calculate match score using GPT-4 when available, rule-based fallback otherwise.
        Returns breakdown dict with overall_score (0-100) and match_explanation.
        """
        rule_based = self._rule_based_score(job, candidate)

        if not self.client:
            return rule_based

        try:
            return await self._llm_score(job, candidate, rule_based)
        except Exception:
            return rule_based

    async def _llm_score(self, job: Job, candidate: Candidate, fallback: Dict) -> Dict:
        prompt = f"""You are an expert South African recruiter scoring candidate-job fit.

JOB:
Title: {job.title}
Required Skills: {', '.join(job.requirements or [])}
Experience Required: {job.years_of_experience_min or 0}+ years
Experience Level: {job.experience_level.value if job.experience_level else 'not specified'}
Location: {job.location}
Remote: {'Yes' if job.is_remote else 'No'}
Employment Type: {job.employment_type.value if job.employment_type else 'full_time'}

CANDIDATE:
Skills: {', '.join(candidate.skills or [])}
Years of Experience: {candidate.years_of_experience or candidate.experience_years or 0}
Current Title: {candidate.current_job_title or 'Not specified'}
Location: {(candidate.city or '') + (', ' + candidate.province if candidate.province else '')}
Education: {candidate.education_level or 'Not specified'}

Score the candidate for this specific job. Return JSON:
{{
  "overall_score": <integer 0-100>,
  "skills_score": <integer 0-100>,
  "experience_score": <integer 0-100>,
  "location_score": <integer 0-100>,
  "matched_skills": ["skill1", "skill2"],
  "missing_skills": ["skill1", "skill2"],
  "strengths": "1-2 sentences on why this candidate is a good fit",
  "gaps": "1-2 sentences on gaps or concerns (or 'No significant gaps')",
  "recommendation": "one of: strong_match | good_match | possible_match | poor_match"
}}

Be honest and realistic. Base the score purely on merit.
"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.2,
        )
        result = json.loads(response.choices[0].message.content)
        result["source"] = "llm"
        return result

    def _rule_based_score(self, job: Job, candidate: Candidate) -> Dict[str, Any]:
        score = 0
        breakdown = {
            "skills_score": 0,
            "experience_score": 0,
            "location_score": 0,
            "overall_score": 0,
            "source": "rule_based",
        }

        # Skills (40%)
        job_skills = set(s.lower() for s in (job.requirements or []))
        candidate_skills = set(s.lower() for s in (candidate.skills or []))
        if job_skills:
            matched = job_skills.intersection(candidate_skills)
            breakdown["skills_score"] = (len(matched) / len(job_skills)) * 100
            breakdown["matched_skills"] = list(matched)
            breakdown["missing_skills"] = list(job_skills - candidate_skills)
        score += breakdown["skills_score"] * 0.4

        # Experience (30%)
        min_exp = job.years_of_experience_min or 0
        cand_exp = getattr(candidate, 'years_of_experience', None) or getattr(candidate, 'experience_years', None) or 0
        if cand_exp >= min_exp:
            breakdown["experience_score"] = 100
        else:
            breakdown["experience_score"] = (cand_exp / min_exp * 100) if min_exp > 0 else 100
        score += breakdown["experience_score"] * 0.3

        # Location (30%)
        job_loc = (job.location or "").lower()
        cand_loc = ((candidate.city or "") + " " + (candidate.province or "")).lower().strip()
        if job.is_remote:
            breakdown["location_score"] = 100
        elif job_loc and cand_loc and (job_loc in cand_loc or cand_loc in job_loc):
            breakdown["location_score"] = 100
        elif job_loc and cand_loc:
            breakdown["location_score"] = 50
        else:
            breakdown["location_score"] = 70
        score += breakdown["location_score"] * 0.3

        breakdown["overall_score"] = round(score, 2)
        return breakdown

    async def get_matches_for_job(self, job: Job, candidates: List[Candidate]) -> List[Dict[str, Any]]:
        matches = []
        for candidate in candidates:
            score_data = await self.calculate_match_score(job, candidate)
            matches.append({
                "candidate_id": str(candidate.id),
                "candidate_name": f"{candidate.first_name} {candidate.last_name}",
                "score": score_data,
            })
        return sorted(matches, key=lambda x: x["score"]["overall_score"], reverse=True)


ai_matching_service = AIMatchingService()
