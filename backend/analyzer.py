import os
import re


# ── Extended skill keyword list (mirrors jd_matcher for consistency) ──────────
SKILL_KEYWORDS = [
    # Languages
    "Python", "Java", "C++", "C", "JavaScript", "TypeScript", "Go", "Golang",
    "Rust", "Swift", "Kotlin", "Ruby", "PHP", "Scala", "R", "MATLAB",
    "Dart", "Lua", "Julia", "Groovy", "Elixir", "Haskell", "Perl",
    # Web Frontend
    "React", "Next.js", "Vue", "Vue.js", "Angular", "Svelte",
    "HTML", "CSS", "Tailwind", "Bootstrap", "SASS", "Redux",
    "GraphQL", "REST", "WebSocket", "gRPC", "Framer Motion",
    # Web Backend
    "Node.js", "Express", "FastAPI", "Flask", "Django", "Spring Boot",
    "Laravel", "Rails", "Gin", "NestJS", "Hono",
    # AI / ML / Data
    "TensorFlow", "PyTorch", "Scikit-learn", "Keras", "OpenCV", "Pandas",
    "NumPy", "Matplotlib", "Seaborn", "NLTK", "SpaCy", "Hugging Face",
    "LangChain", "Gemini", "OpenAI", "GPT", "BERT", "Transformers",
    "Machine Learning", "Deep Learning", "NLP", "Computer Vision",
    "Reinforcement Learning", "Data Science", "Data Analysis", "Data Engineering",
    "Neural Network", "LLM", "RAG", "Vector Database", "Pinecone",
    "XGBoost", "LightGBM", "Random Forest",
    # Cloud / DevOps
    "Docker", "Kubernetes", "AWS", "Azure", "GCP", "Google Cloud",
    "Terraform", "Ansible", "Jenkins", "GitHub Actions", "GitLab CI",
    "CI/CD", "Linux", "Nginx", "Microservices", "Serverless", "Lambda",
    # Databases
    "SQL", "MySQL", "PostgreSQL", "MongoDB", "Redis", "Elasticsearch",
    "DynamoDB", "Cassandra", "Neo4j", "SQLite", "Oracle", "Supabase",
    "Firebase", "Prisma", "Snowflake", "BigQuery",
    # Tools / Practices
    "Git", "GitHub", "GitLab", "Jira", "Agile", "Scrum", "Kanban",
    "Figma", "Postman", "Swagger", "Selenium", "Pytest", "Jest", "Cypress",
    # Mobile
    "React Native", "Flutter", "Android", "iOS", "Expo",
    # Security
    "Cybersecurity", "OAuth", "JWT", "SSL", "TLS", "OWASP",
    # Data / Analytics
    "Spark", "Kafka", "Airflow", "dbt", "Tableau", "Power BI", "ETL",
    # Generic tech
    "API", "SDK", "OOP", "System Design", "Distributed Systems",
]

# Patterns for optional sections that indicate a well-rounded resume
OPTIONAL_SECTION_PATTERNS = {
    "summary":        r'\b(summary|professional summary|objective|profile|about me|introduction)\b',
    "certifications": r'\b(certification|certifications|certified|credential|license)\b',
    "awards":         r'\b(award|awards|achievement|honor|recognition|accomplishment)\b',
    "languages":      r'\b(languages|language proficiency|spoken languages)\b',
    "publications":   r'\b(publication|publications|research|paper|journal)\b',
    "volunteer":      r'\b(volunteer|volunteering|community service|pro bono)\b',
}


class ResumeAnalyzer:
    """
    Analyzes resume text to extract structured components and qualitative insights.
    Industry-standard sections, expanded skill list, richer scoring signals.
    """

    def __init__(self):
        pass

    def analyze(self, raw_text: str, filename: str = "") -> dict:
        """
        Analyzes raw resume text and outputs a structured profile + feedback.

        :param raw_text:  Extracted plain text from the parser.
        :param filename:  Optional filename (used to detect demo mode).
        :return:          Dict with profile, insights, heatmap, radar_chart, _raw_text.
        """
        from parser import extract_resume_info

        is_demo = raw_text.strip() == "demo_content"

        if is_demo:
            info = {
                "name": "Marcus Vance",
                "email": "marcus.vance@devhq.net",
                "phone": "+1 (555) 234-5678",
                "linkedin": "linkedin.com/in/marcusvance",
                "github": "github.com/marcusvance",
                "skills": [
                    "Java", "Spring Boot", "Python", "SQL", "REST", "Docker",
                    "Kubernetes", "Git", "GitHub", "Linux", "PostgreSQL", "Redis", "AWS"
                ],
                "education": [
                    "B.S. in Computer Science | University of Washington | 2020"
                ],
                "experience": [
                    "Software Engineer | SystemScale Industries | 2020 - 2023 | "
                    "Architected distributed Java Spring Boot APIs handling 10k+ concurrent threads. "
                    "Optimized database read indexing in PostgreSQL, reducing query latency by 40%. "
                    "Deployed Docker clusters on Kubernetes, achieving 99.9% uptime.",
                    "Junior Software Engineer | DataBridge Corp | 2019 - 2020 | "
                    "Built RESTful APIs in Python/Flask, increasing team delivery speed by 25%. "
                    "Collaborated with cross-functional teams to ship 3 major product releases."
                ],
                "projects": [
                    "Distributed Task Scheduler | Built a background queue processor in Java using "
                    "RabbitMQ for async messaging, reducing processing time by 60%.",
                    "Resume Intellect | Developed a full-stack ATS analysis tool using React + FastAPI "
                    "and Gemini API, deployed on Google Cloud."
                ],
                "certifications": ["AWS Certified Developer – Associate"],
                "summary": (
                    "Software engineer with 4+ years building scalable distributed systems. "
                    "Specialized in Java, Python, and cloud-native architectures."
                )
            }
        else:
            info = extract_resume_info(raw_text)
            # Augment with extra fields the enhanced extractor provides
            info.setdefault("linkedin", _extract_linkedin(raw_text))
            info.setdefault("github", _extract_github(raw_text))
            info.setdefault("certifications", _extract_certifications(raw_text))
            info.setdefault("summary", _extract_summary(raw_text))

        # ── Derived counts ──────────────────────────────────────────────────
        skills_count = len(info.get("skills", []))
        exp_items     = info.get("experience", [])
        proj_items    = info.get("projects", [])
        edu_items     = info.get("education", [])
        exp_count     = len(exp_items)
        proj_count    = len(proj_items)
        edu_count     = len(edu_items)
        has_email     = bool(info.get("email"))
        has_phone     = bool(info.get("phone"))
        has_linkedin  = bool(info.get("linkedin"))
        has_github    = bool(info.get("github"))
        has_summary   = bool(info.get("summary"))
        has_certs     = bool(info.get("certifications"))

        # ── Check for metric quantification in experience ───────────────────
        metric_pattern = re.compile(
            r'(\d[\d,]*(?:\.\d+)?\s*(?:%|percent|x|\$[\d,]+|k\b|m\b|\+\s*users|\+\s*customers)?)|(\$\s*[\d,]+)',
            re.IGNORECASE
        )
        action_verbs = {
            "achieved", "accelerated", "architected", "automated", "built",
            "championed", "configured", "created", "decreased", "delivered",
            "deployed", "designed", "developed", "directed", "drove",
            "enabled", "engineered", "established", "executed", "expanded",
            "generated", "grew", "implemented", "improved", "increased",
            "integrated", "launched", "led", "managed", "mentored",
            "migrated", "optimized", "orchestrated", "owned", "pioneered",
            "produced", "reduced", "refactored", "released", "resolved",
            "scaled", "shipped", "simplified", "spearheaded", "streamlined",
            "transformed", "upgraded", "validated", "won"
        }

        has_metrics   = False
        action_verb_count = 0
        for exp_item in exp_items:
            if isinstance(exp_item, dict):
                desc = exp_item.get("description", "") + " " + exp_item.get("role", "")
            else:
                desc = str(exp_item)
            desc_lower = desc.lower()
            if metric_pattern.search(desc):
                has_metrics = True
            action_verb_count += sum(
                1 for v in action_verbs if re.search(rf'\b{v}\b', desc_lower)
            )

        # ── Build structured lists for frontend ────────────────────────────
        formatted_education   = _format_education(edu_items)
        formatted_experience  = _format_experience(exp_items)
        formatted_projects    = _format_projects(proj_items)

        # ── Insights (strengths / weaknesses / recommendations) ────────────
        strengths       = []
        weaknesses      = []
        recommendations = []

        if has_summary:
            strengths.append("Professional summary is present — provides keyword context for ATS.")
        else:
            weaknesses.append("No professional summary detected.")
            recommendations.append(
                "Add a 2–3 line 'Professional Summary' at the top of your resume to anchor ATS parsing."
            )

        if skills_count >= 10:
            strengths.append(f"Strong technical skills inventory — {skills_count} distinct tools/technologies identified.")
        elif skills_count >= 5:
            strengths.append(f"{skills_count} technical skills found — consider expanding to 10+.")
        else:
            weaknesses.append(f"Only {skills_count} technical skills detected.")
            recommendations.append(
                "Expand your Technical Skills section to include 10–15 specific tools and frameworks."
            )

        if exp_count >= 2:
            strengths.append(f"Multiple roles documented — {exp_count} positions parsed from work history.")
        elif exp_count == 1:
            strengths.append("Work experience section is present.")
        else:
            weaknesses.append("No clear work experience section found.")
            recommendations.append(
                "Add a clearly labeled 'Work Experience' section with company, role, dates, and bullet-point achievements."
            )

        if has_metrics:
            strengths.append("Quantified achievements detected — metrics significantly boost ATS ranking.")
        else:
            weaknesses.append("No quantified metrics found in experience bullets.")
            recommendations.append(
                "Quantify achievements using numbers, percentages, or dollar figures "
                "(e.g. 'Reduced latency by 35%', 'Scaled to 500k+ users')."
            )

        if action_verb_count >= 5:
            strengths.append(f"{action_verb_count} strong action verbs used — excellent for ATS keyword matching.")
        elif action_verb_count >= 2:
            strengths.append(f"{action_verb_count} action verbs found. Aim for 5+ across experience bullets.")
        else:
            weaknesses.append("Weak or passive language in experience descriptions.")
            recommendations.append(
                "Start each bullet point with a strong action verb: "
                "Architected, Deployed, Optimized, Led, Reduced, Scaled."
            )

        if proj_count >= 2:
            strengths.append(f"{proj_count} portfolio projects documented — demonstrates practical execution.")
        else:
            weaknesses.append("Limited project entries.")
            recommendations.append(
                "Add at least 2 detailed project entries with the tech stack, your role, and outcomes."
            )

        if edu_count > 0:
            strengths.append("Education credentials are clearly structured and parseable.")
        else:
            weaknesses.append("Education section not clearly detected.")
            recommendations.append(
                "Ensure your Education section uses a clear header and lists degree, institution, and year."
            )

        if has_linkedin and has_github:
            strengths.append("LinkedIn and GitHub profiles are linked — signals professional presence.")
        elif has_linkedin or has_github:
            missing = "GitHub" if has_linkedin else "LinkedIn"
            recommendations.append(f"Add your {missing} profile URL to strengthen your professional footprint.")

        if has_certs:
            strengths.append("Certifications section found — adds keyword weight and signals specialization.")
        else:
            recommendations.append(
                "Consider adding a Certifications section (e.g. AWS, Google Cloud, PMP) "
                "to boost keyword density and credibility."
            )

        # Fallback defaults
        if not strengths:
            strengths.append("Basic resume structure is present.")
        if not weaknesses:
            weaknesses.append("Resume is well-rounded. Focus on tailoring per job application.")
        if not recommendations:
            recommendations.append(
                "Use the Job Alignment tool to match your resume to specific job descriptions."
            )

        # ── Heatmap ─────────────────────────────────────────────────────────
        contact_score = 100 if (has_email and has_phone) else 70 if (has_email or has_phone) else 30
        skills_score  = min(30 + skills_count * 5, 100)
        exp_score     = min(40 + exp_count * 15 + (20 if has_metrics else 0) + min(action_verb_count * 3, 15), 100)
        proj_score    = min(40 + proj_count * 20, 100)
        edu_score     = min(50 + edu_count * 25, 100)
        summary_score = 100 if has_summary else 30

        heatmap = [
            {
                "section": "Contact & Header",
                "score": contact_score,
                "status": "Strong" if contact_score >= 80 else "Moderate" if contact_score >= 60 else "Weak",
                "description": (
                    "Email, phone" +
                    (", LinkedIn" if has_linkedin else "") +
                    (", GitHub" if has_github else "") +
                    " are present."
                ) if contact_score >= 70 else "Contact details are incomplete — add phone number and social links."
            },
            {
                "section": "Professional Summary",
                "score": summary_score,
                "status": "Strong" if summary_score >= 80 else "Weak",
                "description": (
                    "Summary section found — great for ATS keyword seeding."
                    if has_summary else
                    "No summary detected. A 2–3 line summary dramatically improves ATS parsing."
                )
            },
            {
                "section": "Skills",
                "score": skills_score,
                "status": "Strong" if skills_score >= 80 else "Moderate" if skills_score >= 55 else "Weak",
                "description": (
                    f"{skills_count} skills parsed — excellent keyword density."
                    if skills_score >= 80 else
                    f"{skills_count} skills parsed. Aim for 10–15 specific tools and frameworks."
                )
            },
            {
                "section": "Work Experience",
                "score": exp_score,
                "status": "Strong" if exp_score >= 80 else "Moderate" if exp_score >= 55 else "Weak",
                "description": (
                    f"{exp_count} roles with quantified metrics and action verbs — top-tier ATS signal."
                    if exp_score >= 80 else
                    "Add metric-driven bullets and action verbs to each role."
                )
            },
            {
                "section": "Projects",
                "score": proj_score,
                "status": "Strong" if proj_score >= 80 else "Moderate" if proj_score >= 55 else "Weak",
                "description": (
                    f"{proj_count} projects — strong portfolio coverage."
                    if proj_count >= 2 else
                    "Add at least 2 project entries with tech stack and measurable outcomes."
                )
            },
            {
                "section": "Education",
                "score": edu_score,
                "status": "Strong" if edu_score >= 80 else "Moderate" if edu_score >= 55 else "Weak",
                "description": (
                    "Education section is clear and structured."
                    if edu_count > 0 else
                    "Education header not detected — ensure degree, institution, and year are listed."
                )
            },
        ]

        # ── Radar Chart ──────────────────────────────────────────────────────
        lowercase_skills = [s.lower() for s in info.get("skills", [])]

        def count_matches(keywords):
            return sum(1 for s in lowercase_skills if any(kw in s for kw in keywords))

        prog_val = min(25 + count_matches([
            'python', 'javascript', 'typescript', 'java', 'go', 'golang',
            'cpp', 'c++', 'ruby', 'rust', 'kotlin', 'scala', 'dart', 'elixir'
        ]) * 15, 100)

        aiml_val = min(20 + count_matches([
            'gemini', 'ai', 'ml', 'openai', 'llm', 'machine learning', 'deep learning',
            'tensorflow', 'pytorch', 'nlp', 'langchain', 'hugging', 'bert', 'gpt',
            'rag', 'vector', 'xgboost'
        ]) * 20, 100)

        web_val = min(25 + count_matches([
            'react', 'next', 'vue', 'angular', 'svelte', 'html', 'css', 'tailwind',
            'bootstrap', 'fastapi', 'flask', 'django', 'node', 'express', 'nestjs',
            'rest', 'graphql', 'api', 'websocket'
        ]) * 12, 100)

        db_val = min(25 + count_matches([
            'sql', 'postgres', 'mysql', 'mongo', 'redis', 'graphql', 'prisma',
            'database', 'dynamodb', 'cassandra', 'elasticsearch', 'neo4j',
            'snowflake', 'bigquery', 'supabase', 'firebase'
        ]) * 15, 100)

        devops_val = min(20 + count_matches([
            'docker', 'kubernetes', 'aws', 'azure', 'gcp', 'terraform', 'ansible',
            'jenkins', 'ci/cd', 'linux', 'nginx', 'serverless', 'lambda',
            'github actions', 'gitlab'
        ]) * 20, 100)

        radar_chart = {
            "programming":      prog_val,
            "ai_ml":            aiml_val,
            "web_development":  web_val,
            "databases":        db_val,
            "devops_cloud":     devops_val
        }

        # ── Timeline / Roadmap ───────────────────────────────────────────────
        timeline = _build_timeline(
            exp_score, skills_score, contact_score, summary_score, has_metrics, action_verb_count
        )

        return {
            "profile": {
                "name":           info.get("name", ""),
                "email":          info.get("email", ""),
                "phone":          info.get("phone", ""),
                "linkedin":       info.get("linkedin", ""),
                "github":         info.get("github", ""),
                "summary":        info.get("summary", ""),
                "skills":         info.get("skills", []),
                "education":      formatted_education,
                "experience":     formatted_experience,
                "projects":       formatted_projects,
                "certifications": info.get("certifications", []),
            },
            "insights": {
                "strengths":       strengths,
                "weaknesses":      weaknesses,
                "recommendations": recommendations,
                "timeline":        timeline
            },
            "heatmap":      heatmap,
            "radar_chart":  radar_chart,
            "_raw_text":    raw_text      # passed through for ATS scorer
        }


# ── Formatting helpers ─────────────────────────────────────────────────────────

def _format_education(edu_items: list) -> list:
    result = []
    for item in edu_items:
        if isinstance(item, dict):
            result.append(item)
        else:
            parts = str(item).split('|')
            result.append({
                "degree":      parts[0].strip() if parts else str(item),
                "institution": parts[1].strip() if len(parts) > 1 else "Listed Institution",
                "year":        parts[2].strip() if len(parts) > 2 else "N/A"
            })
    return result


def _format_experience(exp_items: list) -> list:
    result = []
    for item in exp_items:
        if isinstance(item, dict):
            result.append(item)
        else:
            parts = str(item).split('|')
            result.append({
                "role":        parts[0].strip() if parts else str(item),
                "company":     parts[1].strip() if len(parts) > 1 else "Listed Company",
                "duration":    parts[2].strip() if len(parts) > 2 else "N/A",
                "description": parts[3].strip() if len(parts) > 3 else str(item)
            })
    return result


def _format_projects(proj_items: list) -> list:
    result = []
    for item in proj_items:
        if isinstance(item, dict):
            result.append(item)
        else:
            parts = str(item).split('|')
            result.append({
                "name":        parts[0].strip() if parts else str(item),
                "description": parts[1].strip() if len(parts) > 1 else str(item)
            })
    return result


# ── Extra extractors ──────────────────────────────────────────────────────────

def _extract_linkedin(text: str) -> str:
    m = re.search(r'linkedin\.com/in/[\w\-]+', text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_github(text: str) -> str:
    m = re.search(r'github\.com/[\w\-]+', text, re.IGNORECASE)
    return m.group(0) if m else ""


def _extract_certifications(text: str) -> list:
    """
    Heuristic: look for lines near certification-related headers.
    """
    cert_header = re.compile(
        r'\b(certification|certifications|certified|credential|license|accreditation)\b',
        re.IGNORECASE
    )
    # Common certification names
    cert_names = re.compile(
        r'\b(AWS|Google Cloud|Azure|PMP|CISSP|CPA|CFA|Scrum Master|CSM|'
        r'Kubernetes|CKA|CKAD|TensorFlow Developer|Oracle Certified|'
        r'CompTIA|CCNA|CCNP|CEH|OSCP|Salesforce|HubSpot|PMI)\b',
        re.IGNORECASE
    )
    found = []
    lines = text.split('\n')
    in_cert_section = False
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        if cert_header.search(stripped):
            in_cert_section = True
            continue
        # Stop at next major section header
        if in_cert_section and re.match(r'^[A-Z][A-Za-z\s]{2,30}$', stripped) and len(stripped) < 35:
            next_sections = ['experience', 'education', 'skills', 'projects', 'summary', 'awards']
            if any(ns in stripped.lower() for ns in next_sections):
                in_cert_section = False
        if in_cert_section and len(stripped) > 5:
            found.append(stripped)
        elif cert_names.search(stripped):
            # Collect cert names found anywhere
            matches = cert_names.findall(stripped)
            found.extend(matches)

    return list(dict.fromkeys(found))[:6]  # deduplicate, cap at 6


def _extract_summary(text: str) -> str:
    """
    Extract professional summary / objective paragraph from the resume.
    """
    summary_header = re.compile(
        r'\b(summary|professional summary|profile|objective|career objective|about me|introduction)\b',
        re.IGNORECASE
    )
    lines = text.split('\n')
    in_summary = False
    collected = []

    for line in lines:
        stripped = line.strip()
        if not stripped:
            if in_summary and collected:
                break   # blank line ends the summary block
            continue
        if summary_header.search(stripped) and len(stripped) < 50:
            in_summary = True
            continue
        if in_summary:
            # Stop at the next header-like line (all caps, or known section name)
            if re.match(r'^[A-Z][A-Za-z\s]{2,30}$', stripped) and len(stripped) < 40:
                break
            collected.append(stripped)
            if len(collected) >= 5:
                break

    return " ".join(collected).strip()


# ── Timeline / Roadmap builder ────────────────────────────────────────────────

def _build_timeline(
    exp_score: int,
    skills_score: int,
    contact_score: int,
    summary_score: int,
    has_metrics: bool,
    action_verb_count: int
) -> list:
    timeline = []

    if summary_score < 80:
        timeline.append({
            "id": "r0",
            "priority": "Critical",
            "action": "Add a Professional Summary section",
            "atsGain": 10,
            "description": (
                "Write a 2–3 line summary at the top of your resume that describes your "
                "role, years of experience, and top 2–3 technical strengths."
            )
        })

    if not has_metrics:
        timeline.append({
            "id": "r1",
            "priority": "Critical",
            "action": "Quantify work accomplishments with metrics",
            "atsGain": 12,
            "description": (
                "Add numbers, percentages, or dollar figures to every experience bullet. "
                "E.g. 'Reduced API latency by 35%' or 'Scaled to 500k+ daily active users'."
            )
        })

    if action_verb_count < 5:
        timeline.append({
            "id": "r2",
            "priority": "High",
            "action": "Start bullets with strong action verbs",
            "atsGain": 8,
            "description": (
                "Replace weak or passive openings with action verbs: "
                "Architected, Deployed, Optimized, Led, Automated, Scaled, Reduced."
            )
        })

    if skills_score < 70:
        timeline.append({
            "id": "r3",
            "priority": "High",
            "action": "Expand Technical Skills section to 10+ tools",
            "atsGain": 10,
            "description": (
                "List all relevant languages, frameworks, cloud platforms, and tools "
                "in a dedicated 'Technical Skills' section using comma-separated format."
            )
        })

    if contact_score < 90:
        timeline.append({
            "id": "r4",
            "priority": "Medium",
            "action": "Complete contact header (phone + LinkedIn + GitHub)",
            "atsGain": 5,
            "description": (
                "Ensure your name, email, phone, LinkedIn URL, and GitHub handle "
                "all appear in the resume header section."
            )
        })

    timeline.append({
        "id": "r5",
        "priority": "Medium",
        "action": "Add a Certifications section",
        "atsGain": 4,
        "description": (
            "Relevant certifications (AWS, Google Cloud, Kubernetes, etc.) boost keyword "
            "density and signal specialization to both ATS and recruiters."
        )
    })

    if not timeline:
        timeline.append({
            "id": "r_default",
            "priority": "Low",
            "action": "Tailor resume per job using Job Alignment tool",
            "atsGain": 3,
            "description": (
                "Your resume is well-structured. Use the Job Alignment feature to "
                "identify specific keywords missing for each role you apply to."
            )
        })

    return timeline
