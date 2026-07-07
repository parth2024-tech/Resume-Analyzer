import re

# ─────────────────────────────────────────────────────────────────
#  Industry-standard ATS weights (based on Jobscan / Lever / Greenhouse rubrics)
#  Sections: Formatting, Keywords, Work Experience, Education, Sections
# ─────────────────────────────────────────────────────────────────

# Strong action verbs commonly rewarded by ATS systems
ACTION_VERBS = {
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
    "transformed", "upgraded", "validated", "won", "wrote"
}

# Standard ATS-parseable section headers
REQUIRED_SECTIONS = {
    "experience":   ["experience", "work experience", "professional experience",
                     "employment history", "work history", "career history"],
    "education":    ["education", "academic background", "academic history",
                     "qualifications", "academic qualifications"],
    "skills":       ["skills", "technical skills", "core competencies",
                     "key skills", "competencies", "expertise"],
    "projects":     ["projects", "personal projects", "academic projects",
                     "key projects", "portfolio"],
    "summary":      ["summary", "professional summary", "profile",
                     "objective", "career objective", "about me", "introduction"],
    "contact":      []  # inferred from email/phone presence
}

OPTIONAL_SECTIONS = {
    "certifications":   ["certification", "certifications", "certified", "credential"],
    "awards":           ["award", "awards", "achievement", "honor", "recognition"],
    "languages":        ["languages", "spoken languages", "language proficiency"],
    "publications":     ["publication", "publications", "research", "paper"],
    "volunteer":        ["volunteer", "volunteering", "community service"],
    "linkedin":         ["linkedin"],
    "github":           ["github"]
}

# Quantification patterns – numbers/dollar/percentages in bullet lines
METRIC_PATTERN = re.compile(
    r"""
    (\d[\d,]*(?:\.\d+)?          # number
    \s*                          # optional space
    (?:%|percent|x               # percentage or multiplier
      |\$[\d,]+                  # or dollar amount at end
      |k\b|m\b|bn\b              # or thousands/millions
      |\+\s*users|\+\s*customers # or user growth
    )?)
    |(\$\s*[\d,]+(?:\.\d+)?)     # dollar amounts
    """,
    re.VERBOSE | re.IGNORECASE
)


class ATSScorer:
    """
    Industry-standard ATS scorer modelled on Jobscan / Greenhouse / Lever rubrics.

    Score breakdown (out of 100):
      - Formatting         10 pts  – parseable length, clean structure
      - Section Coverage   20 pts  – required/optional standard sections
      - Contact Info       15 pts  – email, phone, LinkedIn/GitHub
      - Skills Density     20 pts  – number of distinct technical skills
      - Experience Quality 20 pts  – action verbs + metric quantification
      - Readability        15 pts  – bullet usage, section headers, line variety
    """

    def __init__(self):
        pass

    def compute_score(self, analyzed_data: dict) -> dict:
        """
        Compute ATS score from the structured analyzed_data dict produced by ResumeAnalyzer.

        :param analyzed_data: Output of ResumeAnalyzer.analyze()
        :return: Dict with 'ats_score' (0-100) and granular 'breakdown'.
        """
        profile  = analyzed_data.get("profile", {})
        raw_text = analyzed_data.get("_raw_text", "")   # injected by analyzer for richer checks

        # ── 1. Formatting Score (10 pts) ─────────────────────────────────────
        formatting_score = self._score_formatting(raw_text, profile)

        # ── 2. Section Coverage Score (20 pts) ───────────────────────────────
        section_score = self._score_sections(raw_text, profile)

        # ── 3. Contact Info Score (15 pts) ───────────────────────────────────
        contact_score = self._score_contact(profile)

        # ── 4. Skills Density Score (20 pts) ─────────────────────────────────
        skills_score = self._score_skills(profile)

        # ── 5. Experience Quality Score (20 pts) ─────────────────────────────
        experience_score = self._score_experience(profile, raw_text)

        # ── 6. Readability / Bullet Usage Score (15 pts) ─────────────────────
        readability_score = self._score_readability(raw_text, profile)

        breakdown = {
            "formatting":        formatting_score,
            "section_coverage":  section_score,
            "contact_info":      contact_score,
            "skills_density":    skills_score,
            "experience_quality": experience_score,
            "readability":       readability_score
        }

        # Weighted composite
        weights = {
            "formatting":         0.10,
            "section_coverage":   0.20,
            "contact_info":       0.15,
            "skills_density":     0.20,
            "experience_quality": 0.20,
            "readability":        0.15
        }
        ats_score = round(sum(breakdown[k] * weights[k] for k in weights))

        # Derive a letter grade
        grade = self._letter_grade(ats_score)

        # Generate actionable recommendations
        recommendations = self._recommendations(breakdown, profile)

        return {
            "ats_score": ats_score,
            "grade":     grade,
            "breakdown": breakdown,
            "ats_recommendations": recommendations
        }

    # ── Sub-scorers ────────────────────────────────────────────────────────────

    def _score_formatting(self, raw_text: str, profile: dict) -> int:
        """
        Score: resume length sanity check + no obvious ATS anti-patterns.
        Industry standard: 1-2 pages (≈ 400–800 words for most roles).
        """
        if not raw_text:
            return 40

        words = raw_text.split()
        word_count = len(words)

        # Ideal word range: 300–900 words for 1-2 pages
        if 300 <= word_count <= 900:
            length_score = 100
        elif 200 <= word_count < 300 or 900 < word_count <= 1200:
            length_score = 75
        elif word_count < 200:
            length_score = 45
        else:  # > 1200 — too long
            length_score = 60

        # Penalize obvious table/column markers (ATS struggles with these)
        table_penalty = 0
        if raw_text.count('|') > 10:
            table_penalty = 15  # heavy table use

        # Penalize URLs beyond 2 (clutters parse)
        urls = re.findall(r'https?://\S+', raw_text)
        url_penalty = max(0, (len(urls) - 2) * 5)

        score = max(0, length_score - table_penalty - url_penalty)
        return min(score, 100)

    def _score_sections(self, raw_text: str, profile: dict) -> int:
        """
        Score presence of standard ATS-expected resume sections.
        Required sections contribute more; optional sections are a bonus.
        """
        if not raw_text:
            return 30

        raw_lower = raw_text.lower()

        # Check required sections
        present_required = 0
        for section, headers in REQUIRED_SECTIONS.items():
            if section == "contact":
                has_email = bool(profile.get("email"))
                has_phone = bool(profile.get("phone"))
                if has_email or has_phone:
                    present_required += 1
            else:
                if any(h in raw_lower for h in headers):
                    present_required += 1

        total_required = len(REQUIRED_SECTIONS)
        required_ratio = present_required / total_required   # 0.0–1.0

        # Check optional sections (bonus)
        present_optional = sum(
            1 for headers in OPTIONAL_SECTIONS.values()
            if any(h in raw_lower for h in headers)
        )
        optional_bonus = min(present_optional * 5, 20)

        base_score = round(required_ratio * 80)
        return min(base_score + optional_bonus, 100)

    def _score_contact(self, profile: dict) -> int:
        """
        Score: email, phone, LinkedIn/GitHub all present.
        Industry best practice: include at minimum email + phone.
        """
        score = 0
        if profile.get("email"):
            score += 50
        if profile.get("phone"):
            score += 30
        if profile.get("linkedin"):
            score += 10
        if profile.get("github"):
            score += 10
        return min(score, 100)

    def _score_skills(self, profile: dict) -> int:
        """
        Score: count distinct technical skills.
        Benchmark: 8-15 skills = strong; >15 = excellent.
        """
        skills = profile.get("skills", [])
        count = len(skills)

        if count >= 15:
            return 100
        elif count >= 10:
            return 85
        elif count >= 7:
            return 70
        elif count >= 4:
            return 55
        elif count >= 2:
            return 40
        return 25

    def _score_experience(self, profile: dict, raw_text: str) -> int:
        """
        Score: action verb usage + metric quantification.
        Both are top ATS differentiators per recruiter research.
        """
        experience = profile.get("experience", [])
        if not experience:
            return 30

        exp_count = len(experience)

        # Check action verbs across all descriptions
        all_desc = " ".join(
            (e.get("description", "") + " " + e.get("role", "")).lower()
            for e in experience
        )
        found_verbs = [v for v in ACTION_VERBS if re.search(rf'\b{v}\b', all_desc)]
        verb_ratio = min(len(found_verbs) / 8, 1.0)   # 8+ strong verbs = max
        verb_score = round(verb_ratio * 50)

        # Check metric quantification
        all_text_for_metrics = all_desc + " " + raw_text.lower()
        metric_count = len(METRIC_PATTERN.findall(all_text_for_metrics))
        metric_score = min(metric_count * 8, 40)       # up to 5 metrics = max

        # Bonus for multiple distinct roles
        role_bonus = min((exp_count - 1) * 5, 10)

        return min(verb_score + metric_score + role_bonus, 100)

    def _score_readability(self, raw_text: str, profile: dict) -> int:
        """
        Score: bullet usage, distinct line lengths, header variety.
        ATS systems prefer well-structured, scannable bullet-based layouts.
        """
        if not raw_text:
            return 40

        lines = [l.strip() for l in raw_text.split('\n') if l.strip()]
        total_lines = len(lines)
        if total_lines == 0:
            return 40

        # Bullet/dash lines (ATS-friendly)
        bullet_lines = sum(
            1 for l in lines
            if l.startswith(('•', '-', '–', '·', '*', '○', '▪'))
            or re.match(r'^\d+[\.\)]\s', l)
        )
        bullet_ratio = bullet_lines / total_lines
        bullet_score = round(min(bullet_ratio * 2, 1.0) * 50)  # 50% bullet = max

        # Length variety – not all lines should be the same length (sign of tables)
        lengths = [len(l) for l in lines]
        mean_len = sum(lengths) / len(lengths)
        variance = sum((ln - mean_len) ** 2 for ln in lengths) / len(lengths)
        variety_score = min(round((variance ** 0.5) / 30 * 30), 30)  # up to 30 pts

        # Short header lines (section headers tend to be short)
        header_count = sum(1 for l in lines if 3 <= len(l) <= 40 and l.isupper())
        header_score = min(header_count * 5, 20)

        return min(bullet_score + variety_score + header_score, 100)

    # ── Helpers ────────────────────────────────────────────────────────────────

    def _letter_grade(self, score: int) -> str:
        if score >= 90: return "A+"
        if score >= 80: return "A"
        if score >= 70: return "B+"
        if score >= 60: return "B"
        if score >= 50: return "C"
        return "D"

    def _recommendations(self, breakdown: dict, profile: dict) -> list:
        """
        Generate prioritized, actionable ATS improvement recommendations.
        """
        recs = []

        if breakdown["contact_info"] < 80:
            if not profile.get("phone"):
                recs.append({
                    "priority": "High",
                    "category": "Contact",
                    "action": "Add a phone number",
                    "detail": "Most ATS systems require a phone number. Add it below your name in the header.",
                    "ats_gain": 8
                })
            if not profile.get("linkedin"):
                recs.append({
                    "priority": "Medium",
                    "category": "Contact",
                    "action": "Add your LinkedIn URL",
                    "detail": "Include a LinkedIn profile URL in the header section for recruiter access.",
                    "ats_gain": 5
                })

        if breakdown["section_coverage"] < 70:
            recs.append({
                "priority": "High",
                "category": "Sections",
                "action": "Add a Professional Summary section",
                "detail": "A 2–3 line summary at the top dramatically improves ATS ranking by providing keyword context.",
                "ats_gain": 10
            })

        if breakdown["skills_density"] < 70:
            recs.append({
                "priority": "High",
                "category": "Skills",
                "action": "Expand your Technical Skills section",
                "detail": "Aim for 10–15 specific tools, languages, and frameworks. Use comma-separated format under a 'Technical Skills' header.",
                "ats_gain": 10
            })

        if breakdown["experience_quality"] < 70:
            recs.append({
                "priority": "Critical",
                "category": "Experience",
                "action": "Quantify achievements in work experience",
                "detail": "Change vague statements to metric-driven ones. E.g. 'Improved API performance by 40%' or 'Scaled system to 1M+ users'.",
                "ats_gain": 12
            })
            recs.append({
                "priority": "High",
                "category": "Experience",
                "action": "Start each bullet with a strong action verb",
                "detail": "Use verbs like: Architected, Deployed, Optimized, Led, Reduced, Increased. Avoid passive voice.",
                "ats_gain": 8
            })

        if breakdown["readability"] < 65:
            recs.append({
                "priority": "Medium",
                "category": "Formatting",
                "action": "Convert paragraphs to bullet points",
                "detail": "ATS systems parse bullet-based resumes more accurately. Use '•' or '-' for each achievement.",
                "ats_gain": 6
            })

        if breakdown["formatting"] < 70:
            recs.append({
                "priority": "Medium",
                "category": "Length",
                "action": "Adjust resume length to 1–2 pages",
                "detail": "Industry standard is 400–800 words (1–2 pages). Trim redundant details or expand thin sections.",
                "ats_gain": 5
            })

        # Bonus recommendations
        if breakdown["section_coverage"] < 85:
            recs.append({
                "priority": "Low",
                "category": "Sections",
                "action": "Consider adding Certifications and Awards sections",
                "detail": "Certifications (e.g. AWS Certified, Google Cloud) add keyword weight and signal specialization.",
                "ats_gain": 4
            })

        if not recs:
            recs.append({
                "priority": "Low",
                "category": "Polish",
                "action": "Resume is well-structured — focus on tailoring per job",
                "detail": "Use the Job Alignment tool to match your resume to specific job descriptions.",
                "ats_gain": 2
            })

        return recs
