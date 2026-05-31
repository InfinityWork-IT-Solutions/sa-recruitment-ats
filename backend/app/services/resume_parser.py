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
    ("PhD / Doctorate",    [r'\bPhD\b', r'\bDoctorate\b', r'\bDoctor\s+of\b']),
    ("Masters",            [r'\bMasters?\b', r'\bMBA\b', r'\bMSc\b', r'\bM\.Sc\b', r'\bMA\b', r'\bMEng\b', r'\bMTech\b']),
    ("Honours",            [r'\bHonours?\b', r'\bBHons?\b', r'\bPostgraduate Diploma\b']),
    ("Advanced Diploma",   [r'\bAdvanced Diploma\b']),           # NQF 7 — must be before "Diploma"
    ("Bachelors",          [r'\bBSc\b', r'\bB\.Sc\b', r'\bBA\b', r'\bBCom\b', r'\bBEng\b', r'\bBTech\b', r'\bLLB\b', r'\bBNurs\b', r'\bBachelor']),
    ("Diploma",            [r'\bNational Diploma\b', r'\bND\b', r'\bDiploma\b']),  # NQF 6 — after "Advanced Diploma"
    ("Higher Certificate", [r'\bHigher Certificate\b']),         # NQF 5
    ("Matric",             [r'\bMatric\b', r'\bGrade\s+12\b', r'\bNSC\b', r'\bSenior Certificate\b']),
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
    # Normalize common Unicode/encoding artifacts from PDF extraction
    text = text.replace('–', '-').replace('—', '-').replace('’', "'")
    text = text.replace('�', '-').replace('â', '-')
    lines = [l.strip() for l in text.splitlines() if l.strip()]
    full_text = "\n".join(lines)
    result: dict = {}

    # ── Email ──────────────────────────────────────────────────────────────────
    emails = re.findall(r'[\w.+\-]+@[\w\-]+\.[a-zA-Z]{2,}', full_text)
    if emails:
        result["email"] = emails[0].lower()

    # ── Phone (SA formats: +27-720-614-477, +27 72 061 4477, 072 061 4477) ────
    phones = re.findall(
        r'(?:\+27[\s\-]?|0)[6-8]\d\d?[\s.\-]?\d{3}[\s.\-]?\d{3,4}'
        r'|(?:\+27[\s\-]?|0)\d{2,3}[\s.\-]?\d{3}[\s.\-]?\d{3,4}',
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

    # ── Education entries (structured) ─────────────────────────────────────────
    edu_entries: List[dict] = []
    in_edu_section = False
    year_re = re.compile(r'\b(19|20)\d{2}\b')
    sep_re = re.compile(r'\s+[-–]\s+|\s*\|\s*')
    edu_stop = re.compile(
        r'^(certifications|professional experience|work experience|skills|core skills|projects?|references?|summary)',
        re.IGNORECASE
    )
    bullet_strip = re.compile(r'^[•\-\*◦▪]\s*')
    # First collect raw education lines, joining wrapped continuations
    edu_raw: List[str] = []
    for line in lines:
        if re.match(r'^education', line, re.IGNORECASE):
            in_edu_section = True
            continue
        if in_edu_section:
            if edu_stop.match(line):
                break
            if len(line) < 5:
                continue
            if bullet_strip.match(line):
                edu_raw.append(line)
            elif edu_raw:
                # Continuation of previous line (PDF word-wrap) — join it
                edu_raw[-1] = edu_raw[-1].rstrip() + ' ' + line.strip()
    for raw in edu_raw:
        clean = bullet_strip.sub('', raw).strip()
        yr_match = year_re.search(clean)
        year = yr_match.group(0) if yr_match else ''
        without_year = year_re.sub('', clean).strip().strip('|').strip()
        parts = sep_re.split(without_year, maxsplit=1)
        if len(parts) == 2:
            degree = parts[0].strip().strip(',').strip()
            institution = parts[1].strip().strip(',').strip()
        else:
            tokens = [t.strip() for t in without_year.split(',') if t.strip()]
            if len(tokens) >= 2:
                institution = tokens[-1]
                degree = ', '.join(tokens[:-1])
            else:
                degree = without_year
                institution = ''
        if degree and len(degree) > 3:
            edu_entries.append({
                "id": str(len(edu_entries) + 1),
                "degree": degree,
                "institution": institution,
                "year": year,
            })
    if edu_entries:
        result["education_details"] = edu_entries

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

    # ── Professional summary (paragraph after "Professional Summary" heading) ─────
    skip_headings = re.compile(
        r'^(curriculum vitae|cv|resume|contact|personal details|objective|skills|'
        r'experience|education|certifications|core skills|project|reference|work experience)',
        re.IGNORECASE
    )
    skip_contact = re.compile(r'[\|@]|https?://|\+27|linkedin\.com', re.IGNORECASE)
    in_summary = False
    para_lines: List[str] = []
    for line in lines:
        if re.match(r'^professional summary', line, re.IGNORECASE):
            in_summary = True
            continue
        if in_summary:
            if skip_headings.match(line) or skip_contact.search(line):
                break
            if len(line) < 15:
                if para_lines:
                    break
                continue
            para_lines.append(line)
    if para_lines:
        result["summary"] = " ".join(para_lines)[:800]
    else:
        # Fallback: find any long prose paragraph not containing contact info
        for line in lines:
            if skip_headings.match(line) or skip_contact.search(line) or len(line) < 40:
                if para_lines:
                    break
                continue
            para_lines.append(line)
            if len(" ".join(para_lines)) >= 80:
                result["summary"] = " ".join(para_lines)[:600]
                break

    # ── Work history ──────────────────────────────────────────────────────────────
    # Structure: "Company – Job Title" line, then date range line, then bullet points
    date_line_re = re.compile(
        r'^((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
        r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
        r'[\w.]*[\s\-]+\d{4}|\d{4})'
        r'\s*[-–—to/]+\s*'
        r'((?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|'
        r'Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)'
        r'[\w.]*[\s\-]+\d{4}|present|current|now|\d{4})',
        re.IGNORECASE
    )
    bullet_re = re.compile(r'^[•\-\*◦▪–]\s+')
    company_title_re = re.compile(r'\s+[-–—]\s+|\s*\|\s*')
    section_stop_re = re.compile(
        r'^(core skills|skills|certifications|project highlights?|references?|'
        r'awards?|publications?|languages?|interests?|hobbies)',
        re.IGNORECASE
    )

    work_entries: List[dict] = []
    for idx, line in enumerate(lines):
        if not date_line_re.match(line):
            continue
        # Line before the date range should be "Company – Job Title"
        company, title = "", ""
        if idx > 0:
            prev = lines[idx - 1]
            # Skip if previous line is a section heading or another date range
            if not date_line_re.match(prev) and len(prev) < 120:
                parts = company_title_re.split(prev, maxsplit=1)
                if len(parts) == 2:
                    company = parts[0].strip()
                    title = parts[1].strip()
                else:
                    title = prev.strip()
        if not title and not company:
            continue
        # Collect bullet-point responsibilities (join PDF word-wrapped continuations)
        responsibilities: List[str] = []
        j = idx + 1
        while j < len(lines) and len(responsibilities) < 6:
            nxt = lines[j]
            if date_line_re.match(nxt) or section_stop_re.match(nxt):
                break
            # Stop if we hit the next "Company – Title" pattern
            if j + 1 < len(lines) and date_line_re.match(lines[j + 1]) and company_title_re.search(nxt):
                break
            if bullet_re.match(nxt):
                responsibilities.append(bullet_re.sub('', nxt).strip())
            elif responsibilities and not date_line_re.match(nxt) and not company_title_re.search(nxt) and len(nxt) > 5:
                # Continuation line from PDF word-wrap — append to last bullet
                responsibilities[-1] = responsibilities[-1].rstrip() + ' ' + nxt.strip()
            j += 1
        work_entries.append({
            "id": str(len(work_entries) + 1),
            "title": title,
            "company": company,
            "timeline": line.strip(),
            "description": "\n".join(responsibilities),
        })
    if work_entries:
        result["work_history"] = work_entries

    return result
