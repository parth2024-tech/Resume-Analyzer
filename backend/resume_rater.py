"""
resume_rater.py
───────────────
Advanced multi-dimensional resume rating engine.

Produces a structured rating with:
  • Overall letter grade  (A+ → F)
  • Five pillar scores   (each 0-100)
  • Per-pillar actionable suggestions
  • Competitive benchmark percentile
  • Hiring-manager readiness level
"""

import re
from skills_db import SKILL_KEYWORDS

# ──────────────────────────────────────────────────────────────────────────────
#  Constants
# ──────────────────────────────────────────────────────────────────────────────

_SKILL_SET_LOWER = {s.lower() for s in SKILL_KEYWORDS}

_ACTION_VERBS = {
    "achieved", "accelerated", "architected", "automated", "built",
    "championed", "collaborated", "conceptualized", "configured", "created",
    "decreased", "delivered", "deployed", "designed", "developed",
    "directed", "drove", "enabled", "engineered", "established",
    "executed", "expanded", "facilitated", "founded", "generated",
    "grew", "implemented", "improved", "increased", "innovated",
    "integrated", "launched", "led", "managed", "mentored",
    "migrated", "modernized", "optimized", "orchestrated", "owned",
    "partnered", "pioneered", "produced", "published", "reduced",
    "refactored", "released", "resolved", "scaled", "shipped",
    "simplified", "spearheaded", "standardized", "streamlined",
    "transformed", "upgraded", "validated", "won", "wrote",
}

_METRIC_RE = re.compile(
    r"(\d[\d,]*(?:\.\d+)?\s*(?:%|percent|x|\$[\d,]+|k\b|m\b|bn\b|\+\s*users|\+\s*customers)?)"
    r"|(\$\s*[\d,]+(?:\.\d+)?)",
    re.IGNORECASE,
)

_SECTION_HEADERS = {
    "experience":      [r"\bwork\s+experience\b", r"\bprofessional\s+experience\b", r"\bemployment\b"],
    "education":       [r"\beducation\b", r"\bacademic\b", r"\bdegree\b"],
    "skills":          [r"\bskills\b", r"\bcompetencies\b", r"\btech\s+stack\b"],
    "projects":        [r"\bprojects\b", r"\bportfolio\b"],
    "summary":         [r"\bsummary\b", r"\bobjective\b", r"\bprofile\b", r"\babout\s+me\b"],
    "certifications":  [r"\bcertif", r"\bcredential\b", r"\blicense\b"],
    "achievements":    [r"\bachievement", r"\baward", r"\bhonor\b", r"\brecognition\b"],
    "contact":         [r"@", r"\bphone\b", r"\blinkedin\b", r"\bgithub\b"],
}

_GRADE_TABLE = [
    (95, "A+"), (90, "A"), (85, "A-"),
    (80, "B+"), (75, "B"), (70, "B-"),
    (65, "C+"), (60, "C"), (55, "C-"),
    (50, "D"),  (0,  "F"),
]

_PERCENTILE_TABLE = [
    (95, 99), (90, 95), (85, 90), (80, 82),
    (75, 72), (70, 60), (65, 48), (60, 36),
    (50, 22), (0,  10),
]

_READINESS_TABLE = [
    (90, "🟢 Highly Competitive",    "Top-tier submission ready. Likely to pass 95%+ of ATS filters."),
    (80, "🟡 Competitive",           "Strong profile. Minor refinements will maximise recruiter interest."),
    (70, "🟠 Developing",            "Good foundation — address the gaps below to stand out."),
    (55, "🔴 Needs Improvement",     "Several critical areas are holding this resume back."),
    (0,  "⛔ Not Ready",             "Significant restructuring required before submitting."),
]


# ──────────────────────────────────────────────────────────────────────────────
#  Pillar 1 — Content Depth  (0-100)
# ──────────────────────────────────────────────────────────────────────────────

def _score_content_depth(text: str) -> tuple[int, list[dict]]:
    suggestions = []
    score = 0

    words = text.split()
    word_count = len(words)

    # Length adequacy (0-25)
    if word_count >= 600:
        score += 25
    elif word_count >= 400:
        score += 18
        suggestions.append({
            "icon": "📝",
            "title": "Expand your content",
            "detail": f"Your resume has ~{word_count} words. Aim for 500-700 for a mid-career resume.",
            "impact": "Medium",
        })
    elif word_count >= 200:
        score += 10
        suggestions.append({
            "icon": "📝",
            "title": "Resume is too thin",
            "detail": f"Only ~{word_count} words detected. Add more detail to experience bullets.",
            "impact": "High",
        })
    else:
        suggestions.append({
            "icon": "📝",
            "title": "Critical: Very short resume",
            "detail": "Fewer than 200 words found. This will likely be rejected by ATS outright.",
            "impact": "Critical",
        })

    # Quantified achievements (0-30)
    metric_hits = len(_METRIC_RE.findall(text))
    if metric_hits >= 8:
        score += 30
    elif metric_hits >= 5:
        score += 22
        suggestions.append({
            "icon": "📊",
            "title": "Add more quantified achievements",
            "detail": f"Found {metric_hits} metrics. Aim for 8+ (e.g. 'increased revenue by 30%', 'reduced latency by 120ms').",
            "impact": "Medium",
        })
    elif metric_hits >= 2:
        score += 12
        suggestions.append({
            "icon": "📊",
            "title": "Quantify your impact",
            "detail": f"Only {metric_hits} data points found. Numbers make achievements concrete and memorable to recruiters.",
            "impact": "High",
        })
    else:
        suggestions.append({
            "icon": "📊",
            "title": "No quantified results detected",
            "detail": "Add measurable results (%, $, users, ms, x improvement) to every experience bullet.",
            "impact": "Critical",
        })

    # Action verb usage (0-25)
    text_lower = text.lower()
    used_verbs = [v for v in _ACTION_VERBS if re.search(r'\b' + v + r'\b', text_lower)]
    if len(used_verbs) >= 10:
        score += 25
    elif len(used_verbs) >= 6:
        score += 18
        suggestions.append({
            "icon": "⚡",
            "title": "Strengthen your action verbs",
            "detail": f"Using {len(used_verbs)} action verbs. Add more (e.g. 'architected', 'spearheaded', 'optimized').",
            "impact": "Low",
        })
    elif len(used_verbs) >= 3:
        score += 10
        suggestions.append({
            "icon": "⚡",
            "title": "Weak action verb usage",
            "detail": "Found only a few strong action verbs. Start every bullet with a powerful past-tense verb.",
            "impact": "Medium",
        })
    else:
        suggestions.append({
            "icon": "⚡",
            "title": "Missing action verbs",
            "detail": "Bullets appear passive. Use action verbs: Led, Built, Reduced, Scaled, Delivered, etc.",
            "impact": "High",
        })

    # Summary/objective presence (0-20)
    has_summary = any(re.search(p, text_lower) for p in [r'\bsummary\b', r'\bobjective\b', r'\bprofile\b', r'\babout me\b'])
    if has_summary:
        score += 20
    else:
        suggestions.append({
            "icon": "💬",
            "title": "Add a Professional Summary",
            "detail": "A 3-4 sentence summary at the top dramatically improves ATS keyword density and human readability.",
            "impact": "High",
        })

    return min(score, 100), suggestions


# ──────────────────────────────────────────────────────────────────────────────
#  Pillar 2 — Technical Strength  (0-100)
# ──────────────────────────────────────────────────────────────────────────────

def _score_technical_strength(text: str) -> tuple[int, list[dict]]:
    suggestions = []
    score = 0
    text_lower = text.lower()

    found_skills = [s for s in SKILL_KEYWORDS if re.search(r'\b' + re.escape(s.lower()) + r'\b', text_lower)]
    skill_count = len(found_skills)

    # Breadth (0-40)
    if skill_count >= 20:
        score += 40
    elif skill_count >= 14:
        score += 30
        suggestions.append({
            "icon": "🛠️",
            "title": "Broaden your skill set",
            "detail": f"Found {skill_count} recognized technologies. Aim for 18-25 skills listed explicitly.",
            "impact": "Medium",
        })
    elif skill_count >= 8:
        score += 18
        suggestions.append({
            "icon": "🛠️",
            "title": "List more technologies explicitly",
            "detail": f"Only {skill_count} skills matched our index. Create a dedicated 'Technical Skills' section.",
            "impact": "High",
        })
    else:
        suggestions.append({
            "icon": "🛠️",
            "title": "Technical skills section is weak",
            "detail": f"Only {skill_count} known technologies found. Add a dedicated skills section with tools, languages, and frameworks.",
            "impact": "Critical",
        })

    # Skill diversity across categories (0-35)
    category_hits = 0
    categories = {
        "Languages":    ["Python", "Java", "C++", "JavaScript", "TypeScript", "Go", "Rust", "Ruby", "Swift", "Kotlin", "C#"],
        "Frameworks":   ["React", "Next.js", "Vue", "Angular", "FastAPI", "Flask", "Django", "Spring Boot", "Node.js", "Express"],
        "Cloud/DevOps": ["AWS", "Azure", "GCP", "Docker", "Kubernetes", "Terraform", "CI/CD", "GitHub Actions"],
        "Databases":    ["SQL", "PostgreSQL", "MongoDB", "Redis", "MySQL", "DynamoDB", "Elasticsearch"],
        "AI/ML":        ["Machine Learning", "TensorFlow", "PyTorch", "Scikit-learn", "LLM", "NLP", "RAG"],
    }
    for cat, keywords in categories.items():
        if any(re.search(r'\b' + re.escape(k.lower()) + r'\b', text_lower) for k in keywords):
            category_hits += 1

    score += category_hits * 7  # max 35
    if category_hits <= 2:
        suggestions.append({
            "icon": "🗂️",
            "title": "Diversify across technology categories",
            "detail": f"Skills span only {category_hits}/5 major categories. Recruiters look for breadth (languages + cloud + databases).",
            "impact": "Medium",
        })

    # Modern/in-demand tech bonus (0-25)
    hot_skills = ["React", "Next.js", "TypeScript", "Python", "AWS", "Docker", "Kubernetes",
                  "PostgreSQL", "GraphQL", "LLM", "RAG", "LangChain", "FastAPI", "Go", "Rust"]
    hot_count = sum(1 for s in hot_skills if re.search(r'\b' + re.escape(s.lower()) + r'\b', text_lower))
    hot_bonus = min(hot_count * 4, 25)
    score += hot_bonus
    if hot_count < 3:
        suggestions.append({
            "icon": "🔥",
            "title": "Add in-demand modern skills",
            "detail": "High-demand skills in 2024-25: TypeScript, React, Python, Docker, AWS, PostgreSQL, LLM/AI.",
            "impact": "Medium",
        })

    return min(score, 100), suggestions


# ──────────────────────────────────────────────────────────────────────────────
#  Pillar 3 — Structure & Formatting  (0-100)
# ──────────────────────────────────────────────────────────────────────────────

def _score_structure(text: str) -> tuple[int, list[dict]]:
    suggestions = []
    score = 0
    text_lower = text.lower()
    lines = [l.strip() for l in text.split('\n') if l.strip()]

    # Section coverage (0-40)
    required = ["experience", "education", "skills"]
    optional = ["projects", "summary", "certifications", "achievements"]

    required_hits = sum(
        1 for sec in required
        if any(re.search(p, text_lower) for p in _SECTION_HEADERS.get(sec, []))
    )
    optional_hits = sum(
        1 for sec in optional
        if any(re.search(p, text_lower) for p in _SECTION_HEADERS.get(sec, []))
    )

    score += required_hits * 10   # up to 30
    score += min(optional_hits * 5, 10)  # up to 10 bonus

    missing_required = [
        sec for sec in required
        if not any(re.search(p, text_lower) for p in _SECTION_HEADERS.get(sec, []))
    ]
    if missing_required:
        suggestions.append({
            "icon": "📋",
            "title": f"Missing required sections: {', '.join(s.title() for s in missing_required)}",
            "detail": "Every professional resume must include Experience, Education, and Skills sections with standard headers.",
            "impact": "Critical",
        })

    # Contact information (0-25)
    has_email = bool(re.search(r'[\w.+-]+@[\w-]+\.\w+', text))
    has_phone = bool(re.search(r'\+?\d[\d\s\(\)-]{7,}\d', text))
    has_linkedin = bool(re.search(r'linkedin\.com', text_lower))
    has_github = bool(re.search(r'github\.com', text_lower))

    contact_score = (10 if has_email else 0) + (8 if has_phone else 0) + \
                    (4 if has_linkedin else 0) + (3 if has_github else 0)
    score += contact_score

    if not has_email:
        suggestions.append({
            "icon": "📧",
            "title": "Email address not found",
            "detail": "Your email must be clearly visible. ATS systems use it as the primary candidate identifier.",
            "impact": "Critical",
        })
    if not has_linkedin:
        suggestions.append({
            "icon": "🔗",
            "title": "Add your LinkedIn profile URL",
            "detail": "68% of recruiters check LinkedIn before interviews. A profile link boosts credibility significantly.",
            "impact": "Medium",
        })
    if not has_github:
        suggestions.append({
            "icon": "💻",
            "title": "Link your GitHub profile",
            "detail": "For technical roles, a GitHub link lets recruiters verify your coding skills directly.",
            "impact": "Medium",
        })

    # Bullet point usage and structure (0-20)
    bullet_lines = [l for l in lines if l.startswith(('•', '-', '*', '–', '→', '▸')) or
                    re.match(r'^[◦▪○●]', l)]
    bullet_ratio = len(bullet_lines) / max(len(lines), 1)
    if bullet_ratio >= 0.30:
        score += 20
    elif bullet_ratio >= 0.15:
        score += 13
        suggestions.append({
            "icon": "•",
            "title": "Increase use of bullet points",
            "detail": f"Only {round(bullet_ratio*100)}% of lines are bulleted. Aim for 30-40% — bullets improve ATS parsing.",
            "impact": "Medium",
        })
    else:
        score += 5
        suggestions.append({
            "icon": "•",
            "title": "Resume lacks bullet structure",
            "detail": "Very few bullet points detected. Structured bullets are critical for ATS parsing and scannability.",
            "impact": "High",
        })

    # Line length variety (0-15)
    if len(lines) >= 20:
        score += 15
    elif len(lines) >= 12:
        score += 10
    else:
        score += 4
        suggestions.append({
            "icon": "📏",
            "title": "Resume appears too short",
            "detail": "Only a few lines detected. A professional resume typically has 30-60 content lines.",
            "impact": "High",
        })

    return min(score, 100), suggestions


# ──────────────────────────────────────────────────────────────────────────────
#  Pillar 4 — Career Progression  (0-100)
# ──────────────────────────────────────────────────────────────────────────────

def _score_career_progression(text: str) -> tuple[int, list[dict]]:
    suggestions = []
    score = 0
    text_lower = text.lower()

    # Company diversity (0-25)
    company_indicators = re.findall(
        r'\b(?:at|for|with|@)\s+([A-Z][A-Za-z0-9]+(?:\s+[A-Z][A-Za-z0-9]+)?)\b', text
    )
    company_count = len(set(company_indicators))
    if company_count >= 3:
        score += 25
    elif company_count >= 2:
        score += 17
    elif company_count >= 1:
        score += 10
    else:
        suggestions.append({
            "icon": "🏢",
            "title": "Company names not clearly identified",
            "detail": "List company names prominently for each role. ATS systems use these to map career history.",
            "impact": "High",
        })

    # Year mentions (0-25)
    year_hits = re.findall(r'\b(20[0-2][0-9]|19[89][0-9])\b', text)
    unique_years = len(set(year_hits))
    if unique_years >= 4:
        score += 25
    elif unique_years >= 2:
        score += 16
        suggestions.append({
            "icon": "📅",
            "title": "Include more date ranges",
            "detail": "Add start and end dates for every role (Month Year – Month Year). ATS uses these to calculate tenure.",
            "impact": "Medium",
        })
    else:
        suggestions.append({
            "icon": "📅",
            "title": "Dates are missing or unclear",
            "detail": "ATS systems require explicit dates for each position to evaluate employment gaps and tenure.",
            "impact": "High",
        })

    # Leadership signals (0-25)
    leadership_terms = [
        "lead", "led", "managed", "supervised", "mentored", "directed",
        "oversaw", "coordinated", "head of", "team lead", "senior",
        "principal", "staff", "architect", "manager", "director"
    ]
    leadership_hits = sum(1 for t in leadership_terms if re.search(r'\b' + t + r'\b', text_lower))
    if leadership_hits >= 5:
        score += 25
    elif leadership_hits >= 3:
        score += 16
        suggestions.append({
            "icon": "👔",
            "title": "Emphasize leadership more",
            "detail": "Add team sizes managed, reports, or scope of responsibility to signal seniority.",
            "impact": "Low",
        })
    elif leadership_hits >= 1:
        score += 8
        suggestions.append({
            "icon": "👔",
            "title": "Show leadership experience",
            "detail": "Even junior roles can show leadership. Mention mentoring interns, leading features, or cross-team collaboration.",
            "impact": "Medium",
        })
    else:
        suggestions.append({
            "icon": "👔",
            "title": "No leadership indicators detected",
            "detail": "Add context about team size, ownership, or leadership to demonstrate career growth.",
            "impact": "High",
        })

    # Education presence (0-25)
    edu_terms = [r'\bdegree\b', r'\bb\.tech\b', r'\bbachelor\b', r'\bmaster\b', r'\bphd\b',
                 r'\bm\.s\.\b', r'\bb\.s\.\b', r'\buniversity\b', r'\bcollege\b', r'\binstitute\b']
    has_education = any(re.search(p, text_lower) for p in edu_terms)
    if has_education:
        score += 25
    else:
        suggestions.append({
            "icon": "🎓",
            "title": "Education section not detected",
            "detail": "Add your degree, institution, and graduation year. Many ATS systems filter by education level.",
            "impact": "High",
        })

    return min(score, 100), suggestions


# ──────────────────────────────────────────────────────────────────────────────
#  Pillar 5 — Market Competitiveness  (0-100)
# ──────────────────────────────────────────────────────────────────────────────

def _score_market_competitiveness(text: str) -> tuple[int, list[dict]]:
    suggestions = []
    score = 0
    text_lower = text.lower()

    # Certifications (0-20)
    cert_terms = [r'\baws\s+certified\b', r'\bgoogle\s+cloud\b', r'\bazure\s+certified\b',
                  r'\bkubernetes\s+certified\b', r'\bcka\b', r'\bckad\b', r'\bpmp\b',
                  r'\bscrum\s+master\b', r'\bcsm\b', r'\bprofessional\s+certified\b',
                  r'\bcertificate\b', r'\bcertification\b']
    cert_hits = sum(1 for p in cert_terms if re.search(p, text_lower))
    if cert_hits >= 3:
        score += 20
    elif cert_hits >= 1:
        score += 12
        suggestions.append({
            "icon": "🏆",
            "title": "Add more certifications",
            "detail": "AWS, Google Cloud, Kubernetes certifications give a strong competitive edge in tech hiring.",
            "impact": "Medium",
        })
    else:
        suggestions.append({
            "icon": "🏆",
            "title": "No certifications listed",
            "detail": "Industry certifications (AWS, GCP, CKA, Scrum Master) significantly boost ATS ranking and recruiter confidence.",
            "impact": "Medium",
        })

    # Open-source / portfolio signals (0-20)
    portfolio_signals = [r'github\.com', r'portfolio', r'open.source', r'contributed', r'pull\s+request',
                         r'open\s+source', r'npm\s+package', r'pypi', r'crates\.io']
    portfolio_hits = sum(1 for p in portfolio_signals if re.search(p, text_lower))
    if portfolio_hits >= 3:
        score += 20
    elif portfolio_hits >= 1:
        score += 12
        suggestions.append({
            "icon": "🌐",
            "title": "Strengthen your portfolio presence",
            "detail": "Link to deployed projects, open-source contributions, or a personal portfolio site.",
            "impact": "Medium",
        })
    else:
        suggestions.append({
            "icon": "🌐",
            "title": "No portfolio or open-source links",
            "detail": "For tech roles, a GitHub profile with real projects is one of the strongest differentiators.",
            "impact": "High",
        })

    # Awards & recognition (0-20)
    award_signals = [r'\baward\b', r'\bhackathon\b', r'\bwinner\b', r'\bfirst\s+place\b',
                     r'\bhonor\b', r'\brecognition\b', r'\bscholarship\b', r'\bdean\b']
    award_hits = sum(1 for p in award_signals if re.search(p, text_lower))
    if award_hits >= 2:
        score += 20
    elif award_hits >= 1:
        score += 12
        suggestions.append({
            "icon": "🥇",
            "title": "List more awards & recognitions",
            "detail": "Add hackathon wins, academic honors, or employer awards to stand out from equally-qualified candidates.",
            "impact": "Low",
        })
    else:
        suggestions.append({
            "icon": "🥇",
            "title": "No awards or recognition mentioned",
            "detail": "Add any awards, scholarships, or competitive achievements. Even dean's list or hackathon participation helps.",
            "impact": "Low",
        })

    # Publications / research (0-15)
    research_signals = [r'\bpublication\b', r'\bresearch\b', r'\bpaper\b', r'\bjournal\b',
                        r'\bconference\b', r'\bieee\b', r'\bacm\b', r'\barxiv\b']
    research_hits = sum(1 for p in research_signals if re.search(p, text_lower))
    if research_hits >= 2:
        score += 15
    elif research_hits >= 1:
        score += 8

    # Volunteer / community (0-15)
    volunteer_signals = [r'\bvolunteer\b', r'\bcommunity\b', r'\bmentoring\b', r'\bngo\b',
                         r'\bopen\s+source\b', r'\bteach\b', r'\bcoach\b']
    volunteer_hits = sum(1 for p in volunteer_signals if re.search(p, text_lower))
    if volunteer_hits >= 2:
        score += 15
    elif volunteer_hits >= 1:
        score += 8
    else:
        suggestions.append({
            "icon": "🤝",
            "title": "Add community or volunteer work",
            "detail": "Mentoring, open-source, or community involvement signals collaborative nature and growth mindset.",
            "impact": "Low",
        })

    # Clamp to 10 max bonus from research + volunteer
    return min(score, 100), suggestions


# ──────────────────────────────────────────────────────────────────────────────
#  Master Rating Function
# ──────────────────────────────────────────────────────────────────────────────

def _get_grade(score: float) -> str:
    for threshold, grade in _GRADE_TABLE:
        if score >= threshold:
            return grade
    return "F"


def _get_percentile(score: float) -> int:
    for threshold, pct in _PERCENTILE_TABLE:
        if score >= threshold:
            return pct
    return 5


def _get_readiness(score: float) -> dict:
    for threshold, level, description in _READINESS_TABLE:
        if score >= threshold:
            return {"level": level, "description": description}
    return {"level": "⛔ Not Ready", "description": "Significant restructuring required."}


PILLAR_WEIGHTS = {
    "content_depth":          0.28,
    "technical_strength":     0.26,
    "structure_formatting":   0.20,
    "career_progression":     0.15,
    "market_competitiveness": 0.11,
}


def rate_resume(text: str) -> dict:
    """
    Main entry point. Returns a full rating object.
    """
    cd_score, cd_sug  = _score_content_depth(text)
    ts_score, ts_sug  = _score_technical_strength(text)
    sf_score, sf_sug  = _score_structure(text)
    cp_score, cp_sug  = _score_career_progression(text)
    mc_score, mc_sug  = _score_market_competitiveness(text)

    overall = round(
        cd_score * PILLAR_WEIGHTS["content_depth"] +
        ts_score * PILLAR_WEIGHTS["technical_strength"] +
        sf_score * PILLAR_WEIGHTS["structure_formatting"] +
        cp_score * PILLAR_WEIGHTS["career_progression"] +
        mc_score * PILLAR_WEIGHTS["market_competitiveness"]
    )

    # Sort all suggestions by impact priority
    _impact_order = {"Critical": 0, "High": 1, "Medium": 2, "Low": 3}
    all_suggestions = cd_sug + ts_sug + sf_sug + cp_sug + mc_sug
    all_suggestions.sort(key=lambda s: _impact_order.get(s.get("impact", "Low"), 4))

    pillars = [
        {
            "id": "content_depth",
            "label": "Content Depth",
            "score": cd_score,
            "weight": int(PILLAR_WEIGHTS["content_depth"] * 100),
            "icon": "📝",
            "description": "Richness of accomplishments, metrics, and narrative",
            "suggestions": cd_sug,
        },
        {
            "id": "technical_strength",
            "label": "Technical Strength",
            "score": ts_score,
            "weight": int(PILLAR_WEIGHTS["technical_strength"] * 100),
            "icon": "⚙️",
            "description": "Breadth & depth of technical skills and tools",
            "suggestions": ts_sug,
        },
        {
            "id": "structure_formatting",
            "label": "Structure & Format",
            "score": sf_score,
            "weight": int(PILLAR_WEIGHTS["structure_formatting"] * 100),
            "icon": "📋",
            "description": "ATS-parseable layout, sections, and contact info",
            "suggestions": sf_sug,
        },
        {
            "id": "career_progression",
            "label": "Career Progression",
            "score": cp_score,
            "weight": int(PILLAR_WEIGHTS["career_progression"] * 100),
            "icon": "📈",
            "description": "Evidence of growth, leadership, and tenure",
            "suggestions": cp_sug,
        },
        {
            "id": "market_competitiveness",
            "label": "Market Edge",
            "score": mc_score,
            "weight": int(PILLAR_WEIGHTS["market_competitiveness"] * 100),
            "icon": "🏆",
            "description": "Certs, portfolio, awards, and industry visibility",
            "suggestions": mc_sug,
        },
    ]

    return {
        "overall_score": overall,
        "grade": _get_grade(overall),
        "percentile": _get_percentile(overall),
        "readiness": _get_readiness(overall),
        "pillars": pillars,
        "top_suggestions": all_suggestions[:6],
        "total_issues": len(all_suggestions),
        "critical_count": sum(1 for s in all_suggestions if s.get("impact") == "Critical"),
        "high_count": sum(1 for s in all_suggestions if s.get("impact") == "High"),
    }
