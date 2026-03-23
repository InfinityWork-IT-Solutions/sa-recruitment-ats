from typing import List, Dict, Any
import math
from app.models.job import Job
from app.models.candidate import Candidate

class AIMatchingService:
    @staticmethod
    def calculate_match_score(job: Job, candidate: Candidate) -> Dict[str, Any]:
        """
        Calculates a matching score (0-100) between a job and a candidate.
        Factors: Skills, Experience, Location, Salary (if available)
        """
        score = 0
        breakdown = {
            "skills_score": 0,
            "experience_score": 0,
            "location_score": 0,
            "overall_score": 0
        }

        # 1. Skills Matching (40%)
        job_skills = set([s.lower() for s in (job.requirements or [])])
        candidate_skills = set([s.lower() for s in (candidate.skills or [])])
        
        if job_skills:
            matching_skills = job_skills.intersection(candidate_skills)
            breakdown["skills_score"] = (len(matching_skills) / len(job_skills)) * 100
            score += breakdown["skills_score"] * 0.4

        # 2. Experience Matching (30%)
        # Assuming job.min_experience and candidate.experience_years
        min_exp = job.min_experience or 0
        cand_exp = candidate.experience_years or 0
        
        if cand_exp >= min_exp:
            breakdown["experience_score"] = 100
        else:
            breakdown["experience_score"] = (cand_exp / min_exp) * 100 if min_exp > 0 else 100
            
        score += breakdown["experience_score"] * 0.3

        # 3. Location Matching (30%)
        if job.location and candidate.location:
            if job.location.lower() == candidate.location.lower():
                breakdown["location_score"] = 100
            elif job.is_remote:
                breakdown["location_score"] = 100
            else:
                breakdown["location_score"] = 50 # Partial match for same country/region (simple logic)
        else:
            breakdown["location_score"] = 70 # Default to 70 if not specified
            
        score += breakdown["location_score"] * 0.3

        breakdown["overall_score"] = round(score, 2)
        return breakdown

    @staticmethod
    def get_matches_for_job(job: Job, candidates: List[Candidate]) -> List[Dict[str, Any]]:
        matches = []
        for candidate in candidates:
            score_data = AIMatchingService.calculate_match_score(job, candidate)
            matches.append({
                "candidate_id": candidate.id,
                "candidate_name": f"{candidate.first_name} {candidate.last_name}",
                "score": score_data
            })
        
        # Sort by score descending
        return sorted(matches, key=lambda x: x["score"]["overall_score"], reverse=True)

ai_matching_service = AIMatchingService()
