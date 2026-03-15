"""
AI Resume Parsing service - OpenAI integration for resume data extraction
"""
import os
from typing import Dict, Optional, List
import openai
from pathlib import Path
import PyPDF2
import docx
import json
from fastapi import UploadFile

from app.core.config import settings


class AIResumeParser:
    """AI-powered resume parser using OpenAI"""
    
    def __init__(self):
        """Initialize OpenAI client"""
        openai.api_key = settings.OPENAI_API_KEY
    
    async def extract_text_from_file(self, file_path: str) -> str:
        """
        Extract text from resume file (PDF, DOC, DOCX)
        
        Args:
            file_path: Path to resume file
            
        Returns:
            Extracted text content
        """
        file_ext = Path(file_path).suffix.lower()
        
        if file_ext == '.pdf':
            return self._extract_from_pdf(file_path)
        elif file_ext in ['.doc', '.docx']:
            return self._extract_from_docx(file_path)
        else:
            raise ValueError(f"Unsupported file type: {file_ext}")
    
    def _extract_from_pdf(self, file_path: str) -> str:
        """Extract text from PDF"""
        text = ""
        with open(file_path, 'rb') as file:
            pdf_reader = PyPDF2.PdfReader(file)
            for page in pdf_reader.pages:
                text += page.extract_text()
        return text
    
    def _extract_from_docx(self, file_path: str) -> str:
        """Extract text from DOCX"""
        doc = docx.Document(file_path)
        text = "\n".join([paragraph.text for paragraph in doc.paragraphs])
        return text
    
    async def parse_resume_with_ai(self, resume_text: str) -> Dict:
        """
        Parse resume using OpenAI GPT-4
        
        Args:
            resume_text: Extracted text from resume
            
        Returns:
            Structured data extracted from resume
        """
        prompt = f"""
        You are an expert HR assistant. Extract structured information from the following resume.
        
        Resume:
        {resume_text}
        
        Extract the following information and return ONLY valid JSON (no markdown, no backticks):
        {{
            "personal_info": {{
                "first_name": "string or null",
                "last_name": "string or null",
                "email": "string or null",
                "phone": "string or null",
                "location": {{
                    "city": "string or null",
                    "province": "string or null",
                    "country": "string or null"
                }},
                "linkedin_url": "string or null",
                "portfolio_url": "string or null",
                "github_url": "string or null"
            }},
            "professional_summary": "string or null",
            "skills": ["skill1", "skill2", ...],
            "years_of_experience": integer or null,
            "education": [
                {{
                    "degree": "string",
                    "institution": "string",
                    "field": "string or null",
                    "graduation_year": "integer or null",
                    "location": "string or null"
                }}
            ],
            "certifications": ["cert1", "cert2", ...],
            "work_experience": [
                {{
                    "job_title": "string",
                    "company": "string",
                    "start_date": "YYYY-MM or null",
                    "end_date": "YYYY-MM or 'Present'",
                    "location": "string or null",
                    "description": "string or null",
                    "achievements": ["achievement1", ...]
                }}
            ],
            "languages": ["language1", "language2", ...],
            "education_level": "Matric|Diploma|BCom|BSc|BA|MCom|MSc|MA|PhD|Other or null"
        }}
        
        Important: Return ONLY the JSON object, no other text.
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert HR assistant that extracts structured data from resumes. Always return valid JSON only."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=2000
            )
            
            # Extract response
            content = response.choices[0].message.content.strip()
            
            # Remove markdown code blocks if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            
            # Parse JSON
            parsed_data = json.loads(content)
            
            # Add metadata
            parsed_data['parsing_metadata'] = {
                'model': 'gpt-4',
                'tokens_used': response.usage.total_tokens,
                'confidence': 'high'
            }
            
            return parsed_data
            
        except json.JSONDecodeError as e:
            # Fallback: Try to extract key information with regex
            return {
                'error': 'Failed to parse AI response',
                'raw_response': content if 'content' in locals() else None,
                'parsing_metadata': {
                    'model': 'gpt-4',
                    'confidence': 'low',
                    'error': str(e)
                }
            }
        except Exception as e:
            return {
                'error': f'AI parsing failed: {str(e)}',
                'parsing_metadata': {
                    'model': 'gpt-4',
                    'confidence': 'none'
                }
            }
    
    async def calculate_job_match_score(
        self,
        candidate_data: Dict,
        job_data: Dict
    ) -> Dict:
        """
        Calculate how well a candidate matches a job using AI
        
        Args:
            candidate_data: Candidate information
            job_data: Job requirements
            
        Returns:
            Match score (0-100) with explanation
        """
        prompt = f"""
        You are an expert recruiter. Analyze how well this candidate matches the job requirements.
        
        Candidate:
        - Skills: {candidate_data.get('skills', [])}
        - Experience: {candidate_data.get('years_of_experience', 0)} years
        - Education: {candidate_data.get('education_level', 'Not specified')}
        - Current Role: {candidate_data.get('current_job_title', 'Not specified')}
        
        Job Requirements:
        - Required Skills: {job_data.get('skills', [])}
        - Experience Required: {job_data.get('years_of_experience_min', 0)}-{job_data.get('years_of_experience_max', 10)} years
        - Education: {job_data.get('education_level', 'Not specified')}
        - Job Title: {job_data.get('title', 'Not specified')}
        
        Return ONLY valid JSON (no markdown):
        {{
            "match_score": integer between 0-100,
            "explanation": "Brief explanation of the match",
            "strengths": ["strength1", "strength2", ...],
            "gaps": ["gap1", "gap2", ...],
            "recommendation": "hire|interview|maybe|reject"
        }}
        """
        
        try:
            response = openai.ChatCompletion.create(
                model="gpt-4",
                messages=[
                    {"role": "system", "content": "You are an expert recruiter analyzing candidate-job fit. Return only JSON."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.3,
                max_tokens=500
            )
            
            content = response.choices[0].message.content.strip()
            
            # Remove markdown if present
            if content.startswith('```'):
                content = content.split('```')[1]
                if content.startswith('json'):
                    content = content[4:]
            
            match_data = json.loads(content)
            return match_data
            
        except Exception as e:
            # Fallback: Simple keyword matching
            return self._fallback_match_score(candidate_data, job_data)
    
    def _fallback_match_score(self, candidate_data: Dict, job_data: Dict) -> Dict:
        """Fallback match score using simple keyword matching"""
        candidate_skills = set([s.lower() for s in candidate_data.get('skills', [])])
        job_skills = set([s.lower() for s in job_data.get('skills', [])])
        
        if not job_skills:
            return {
                "match_score": 50,
                "explanation": "Unable to calculate precise match",
                "strengths": [],
                "gaps": [],
                "recommendation": "interview"
            }
        
        # Calculate skill overlap
        matching_skills = candidate_skills.intersection(job_skills)
        skill_match_ratio = len(matching_skills) / len(job_skills) if job_skills else 0
        
        # Calculate experience match
        candidate_exp = candidate_data.get('years_of_experience', 0)
        required_exp = job_data.get('years_of_experience_min', 0)
        exp_match = 1.0 if candidate_exp >= required_exp else candidate_exp / required_exp if required_exp > 0 else 0.5
        
        # Final score (60% skills, 40% experience)
        score = int((skill_match_ratio * 0.6 + exp_match * 0.4) * 100)
        
        return {
            "match_score": min(score, 100),
            "explanation": f"Matches {len(matching_skills)}/{len(job_skills)} required skills",
            "strengths": list(matching_skills),
            "gaps": list(job_skills - candidate_skills),
            "recommendation": "hire" if score >= 80 else "interview" if score >= 60 else "maybe"
        }


# Create service instance
ai_resume_parser = AIResumeParser()
