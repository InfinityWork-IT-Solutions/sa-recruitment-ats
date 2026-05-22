"""
AI Generation Service — GPT-4 powered content generation:
  - Job description generation
  - Interview question generation
  - Salary benchmarking for SA market
"""
import json
import os
from typing import Dict, List, Optional
import openai

from app.core.config import settings


class AIGenerationService:

    def __init__(self):
        self.client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.model = getattr(settings, "OPENAI_MODEL", "gpt-4")

    async def generate_job_description(
        self,
        title: str,
        category: str,
        skills: List[str],
        experience_level: str,
        employment_type: str,
        company_name: str = "",
        company_context: str = "",
        location: str = "South Africa",
    ) -> Dict:
        """
        Generate a full job description from minimal inputs.
        Returns: {title, description, responsibilities, requirements, qualifications, benefits}
        """
        prompt = f"""You are an expert South African HR professional writing job postings.

Generate a complete, professional job description for the following role:

Job Title: {title}
Category: {category}
Required Skills: {', '.join(skills) if skills else 'Not specified'}
Experience Level: {experience_level}
Employment Type: {employment_type}
Location: {location}
Company: {company_name or 'A leading South African company'}
{f'Company Context: {company_context}' if company_context else ''}

Return a JSON object with these exact keys:
{{
  "title": "refined job title",
  "description": "2-3 paragraph overview of the role and its importance",
  "responsibilities": ["responsibility 1", "responsibility 2", ...],
  "requirements": ["requirement 1", "requirement 2", ...],
  "qualifications": ["qualification 1", "qualification 2", ...],
  "benefits": ["benefit 1", "benefit 2", ...]
}}

Make it specific, compelling, and appropriate for the South African job market.
Responsibilities: 6-8 items. Requirements: 5-7 items. Qualifications: 3-5 items. Benefits: 4-6 items.
"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.7,
        )
        return json.loads(response.choices[0].message.content)

    async def generate_interview_questions(
        self,
        job_title: str,
        required_skills: List[str],
        candidate_skills: Optional[List[str]] = None,
        interview_round: str = "first",
        experience_level: str = "mid_level",
    ) -> Dict:
        """
        Generate tailored interview questions based on job + candidate profile.
        Returns: {technical_questions, behavioural_questions, culture_questions, opening_question}
        """
        skill_gap = []
        if candidate_skills:
            required_set = set(s.lower() for s in required_skills)
            candidate_set = set(s.lower() for s in candidate_skills)
            skill_gap = list(required_set - candidate_set)

        prompt = f"""You are an expert South African interviewer. Generate tailored interview questions.

Role: {job_title}
Experience Level: {experience_level}
Interview Round: {interview_round}
Required Skills: {', '.join(required_skills)}
{f"Candidate's Skills: {', '.join(candidate_skills)}" if candidate_skills else ""}
{f"Skills to probe (gaps): {', '.join(skill_gap)}" if skill_gap else ""}

Return a JSON object:
{{
  "opening_question": "ice-breaker question",
  "technical_questions": ["question 1", "question 2", "question 3", "question 4"],
  "behavioural_questions": ["STAR-format question 1", "STAR-format question 2", "STAR-format question 3"],
  "culture_questions": ["question 1", "question 2"],
  "closing_question": "do you have any questions for us type question"
}}

Make questions specific to the role and South African work context. Behavioural questions should use STAR format prompts.
"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.6,
        )
        return json.loads(response.choices[0].message.content)

    async def get_salary_benchmark(
        self,
        job_title: str,
        location: str = "South Africa",
        experience_years: int = 3,
        employment_type: str = "full_time",
    ) -> Dict:
        """
        Return SA market salary benchmark for a role.
        Returns: {min_monthly, median_monthly, max_monthly, min_annual, median_annual, max_annual, currency, rationale, market_notes}
        """
        prompt = f"""You are a South African compensation expert with up-to-date knowledge of SA salary benchmarks.

Provide a salary benchmark for:
Job Title: {job_title}
Location: {location}
Years of Experience: {experience_years}
Employment Type: {employment_type}

Return a JSON object with realistic South African Rand (ZAR) figures:
{{
  "min_monthly": <integer in ZAR>,
  "median_monthly": <integer in ZAR>,
  "max_monthly": <integer in ZAR>,
  "min_annual": <integer in ZAR>,
  "median_annual": <integer in ZAR>,
  "max_annual": <integer in ZAR>,
  "currency": "ZAR",
  "rationale": "2-3 sentence explanation of the range",
  "market_notes": "1-2 sentences about current SA market conditions for this role",
  "competitiveness_tip": "1 sentence tip on how to make the offer competitive"
}}

Base figures on current South African market rates. Be realistic and specific to the SA economy.
"""
        response = await self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"},
            temperature=0.3,
        )
        return json.loads(response.choices[0].message.content)
