"""
Rule-based CV/resume parser.
Extracts structured data from plain text using regex and keyword lists.
Free, local, no AI calls.
"""
import re
from typing import List, Optional

# ── Skills dictionary ──────────────────────────────────────────────────────────

_TECH = [
    "Python", "JavaScript", "TypeScript", "Java", "C#", "C++", "Go", "Rust", "PHP", "Ruby",
    "Kotlin", "Swift", "Scala", "R", "MATLAB",
    "React", "Angular", "Vue", "Next.js", "Nuxt", "Svelte",
    "Node.js", "Express", "Django", "FastAPI", "Flask", "Spring Boot", "Laravel",
    "PostgreSQL", "MySQL", "MongoDB", "Redis", "Elasticsearch", "SQLite", "Oracle",
    "AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "Ansible", "CI/CD",
    "Git", "GitHub", "GitLab", "Linux", "Bash", "PowerShell",
    "REST API", "GraphQL", "gRPC", "Microservices", "DevOps", "SRE",
    "Machine Learning", "Deep Learning", "TensorFlow", "PyTorch", "scikit-learn",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SASS",
    "SQL", "Power BI", "Tableau", "Excel", "SAP", "Jira", "Confluence",
    "Unit Testing", "Jest", "Pytest", "Selenium", "Cypress",
]

_BUSINESS = [
    "Project Management", "Agile", "Scrum", "Kanban", "PMBOK", "Prince2",
    "Financial Analysis", "Budgeting", "Forecasting", "Bookkeeping", "Payroll", "IFRS", "GAAP",
    "Marketing", "SEO", "SEM", "Google Ads", "Social Media Marketing", "Content Marketing",
    "Sales", "B2B Sales", "CRM", "Salesforce", "HubSpot", "Customer Service",
    "Human Resources", "Talent Acquisition", "Performance Management", "HRIS",
    "Data Analysis", "Business Intelligence", "Reporting", "Business Analysis",
    "Supply Chain", "Logistics", "Procurement", "Warehouse Management",
    "Audit", "Risk Management", "Compliance", "Corporate Governance",
    "Communication", "Leadership", "Team Management", "Stakeholder Management",
    "Change Management", "Strategic Planning",
]

_HEALTHCARE = [
    "Patient Care", "Clinical Research", "Nursing", "Pharmacology",
    "EMR/EHR Systems", "Triage", "Medical Coding", "HPCSA", "BLS", "ACLS",
    "Radiography", "Physiotherapy", "Occupational Therapy",
]

ALL_SKILLS: List[str] = _TECH + _BUSINESS + _HEALTHCARE

# ── SA geography ───────────────────────────────────────────────────────────────

SA_CITIES = [
    "Johannesburg", "Cape Town", "Durban", "Pretoria", "Tshwane",
    "Port Elizabeth", "Gqeberha", "Bloemfontein", "East London", "Nelspruit",
    "Mbombela", "Polokwane", "Sandton", "Centurion", "Randburg", "Roodepoort",
    "Boksburg", "Germiston", "Benoni", "Soweto", "Midrand", "Bedfordview",
    "Umhlanga", "Pinetown", "Pietermaritzburg", "Rustenburg", "Kimberley",
]

SA_PROVINCES = [
    "Gauteng", "Western Cape", "Eastern Cape", "KwaZulu-Natal",
    "Mpumalanga", "Limpopo", "North West", "Northern Cape", "Free State",
]

# ── Education hierarchy ────────────────────────────────────────────────────────

EDUCATION_LEVELS = [
    ("PhD / Doctorate",   [r'\bPhD\b', r'\bDoctorate\b', r'\bDoctor\s+of\b']),
    ("Masters",           [r'\bMasters?\b', r'\bMBA\b', r'\bMSc\b', r'\bM\.Sc\b', r'\bMA\b', r'\bMEng\b', r'\bMTech\b']),
    ("Honours",           [r'\bHonours?\b', r'\bBHons?\b']),
    ("Bachelors",         [r'\bBSc\b', r'\bB\.Sc\b', r'\bBA\b', r'\bBCom\b', r'\bBEng\b', r'\bBTech\b', r'\bLLB\b', r'\bBNurs\b']),
    ("National Diploma",  [r'\bNational Diploma\b', r'\bND\b']),
    ("Higher Certificate",[r'\bHigher Certificate\b']),
    ("Matric",            [r'\bMatric\b', r'\bGrade\s+12\b', r'\bNSC\b', r'\bSenior Certificate\b']),
]

# ── Common SA job title fragments ──────────────────────────────────────────────

TITLE_FRAGMENTS = [
    "Software Developer", "Software Engineer", "Frontend Developer", "Backend Developer",
    "Full Stack Developer", "DevOps Engineer", "Data Engineer", "Data Scientist",
    "Product Manager", "Project Manager", "Business Analyst", "Systems Analyst",
    "Account Manager", "Sales Manager", "Marketing Manager", "Brand Manager",
    "Financial Analyst", "Accountant", "Bookkeeper", "Auditor", "CFO", "CEO", "COO",
    "HR Manager", "Talent Acquisition", "Recruiter",
    "Operations Manager", "Supply Chain Manager", "Logistics Manager",
    "Registered Nurse", "Pharmacist", "Doctor",
    "Teacher", "Lecturer", "Professor",
    "Graphic Designer", "UX Designer", "UI Designer", "Web Designer",
    "Head of", "Director of", "Chief ", "Senior ", "Lead ", "Principal ",
]


def parse_resume_text(text: str) -> dict:
    """
    Parse raw resume text and return a dict of candidate profile fields.
    Only non-empty values are included; callers should merge over existing data
    (i.e. only fill fields that are currently blank on the profile).
    """
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = "\n".join(lines)
    result: dict = {}

    # ── Email ──────────────────────────────────────────────────────────────────
    emails = re.findall(r'[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}', full_text)
    if emails:
        result["email"] = emails[0].lower()

    # ── Phone (SA formats — handles +27-7XX-XXX-XXXX, 0XX XXX XXXX, etc.) ────
    phones = re.findall(
        r'(?:\+27[\s\-]?|0)[6-8]\d[\s.\-]?\d{3}[\s.\-]?\d{4}'
        r'|(?:\+27[\s\-]?|0)\d{2}[\s.\-]?\d{3}[\s.\-]?\d{4}',
        full_text
    )
    if phones:
        result["phone"] = re.sub(r'[\s.\-]', '', phones[0])

    # ── Skills ─────────────────────────────────────────────────────────────────
    found: List[str] = []
    for skill in ALL_SKILLS:
        if re.search(r'\b' + re.escape(skill) + r'\b', full_text, re.IGNORECASE):
            found.append(skill)
    if found:
        result["skills"] = found[:15]

    # ── City ───────────────────────────────────────────────────────────────────
    for city in SA_CITIES:
        if re.search(r'\b' + re.escape(city) + r'\b', full_text, re.IGNORECASE):
            result["city"] = city
            break

    # ── Province ───────────────────────────────────────────────────────────────
    for province in SA_PROVINCES:
        if re.search(r'\b' + re.escape(province) + r'\b', full_text, re.IGNORECASE):
            result["province"] = province
            break

    # ── Education level (highest found) ────────────────────────────────────────
    for level_label, patterns in EDUCATION_LEVELS:
        if any(re.search(p, full_text, re.IGNORECASE) for p in patterns):
            result["education_level"] = level_label
            break

    # ── Current job title (look in first 20 lines) ─────────────────────────────
    for line in lines[:20]:
        for fragment in TITLE_FRAGMENTS:
            if re.search(r'\b' + re.escape(fragment), line, re.IGNORECASE):
                # Only use line if it looks like a title (short, no @/:)
                if len(line) < 90 and '@' not in line and ':' not in line:
                    result["current_job_title"] = line
                break
        if result.get("current_job_title"):
            break

    # ── Professional summary (first paragraph ≥ 60 chars that isn't a heading) ─
    skip_headings = re.compile(
        r'^(curriculum vitae|cv|resume|contact|personal details|objective|skills|experience|education)',
        re.IGNORECASE
    )
    para_lines: List[str] = []
    for line in lines:
        if skip_headings.match(line) or len(line) < 20:
            if para_lines:
                break
            continue
        para_lines.append(line)
        combined = " ".join(para_lines)
        if len(combined) >= 80:
            result["summary"] = combined[:600]
            break

    # ── Work history (date-range anchored blocks) ───────────────────────────────
    date_re = re.compile(
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}|\d{4})'
        r'\s*[-–—to/]+\s*'
        r'((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\.?\s*\d{4}'
        r'|present|current|now|\d{4})',
        re.IGNORECASE
    )
    matches = list(date_re.finditer(full_text))
    work_entries = []
    for i, m in enumerate(matches[:6]):
        block_start = max(0, m.start() - 150)
        block_end = matches[i + 1].start() if i + 1 < len(matches) else min(m.end() + 300, len(full_text))
        block = full_text[block_start:block_end]
        block_lines = [l.strip() for l in block.splitlines() if l.strip()]
        timeline = m.group(0).strip()
        # first short non-date line = title candidate
        title_line = ""
        for bl in block_lines:
            if bl == timeline or len(bl) > 100 or re.search(r'^\d{4}', bl):
                continue
            title_line = bl
            break
        if title_line:
            work_entries.append({
                "id": str(i + 1),
                "title": title_line,
                "company": "",
                "timeline": timeline,
                "description": "",
            })
    if work_entries:
        result["work_history"] = work_entries

    return result
