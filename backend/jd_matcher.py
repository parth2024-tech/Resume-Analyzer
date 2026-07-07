import re
import math
from collections import Counter

# Import from the single source of truth for all skill keywords
from skills_db import SKILL_KEYWORDS


# ─────────────────────────────────────────────
#  Stop Words (broad English + resume-specific)
# ─────────────────────────────────────────────
STOP_WORDS = {
    "a", "an", "the", "and", "or", "but", "in", "on", "at", "to", "for",
    "of", "with", "by", "from", "is", "are", "was", "were", "be", "been",
    "being", "have", "has", "had", "do", "does", "did", "will", "would",
    "shall", "should", "may", "might", "must", "can", "could", "not",
    "this", "that", "these", "those", "it", "its", "we", "you", "they",
    "he", "she", "i", "me", "my", "your", "their", "our", "us", "them",
    "what", "which", "who", "when", "where", "why", "how", "all", "each",
    "every", "both", "few", "more", "most", "other", "some", "such",
    "no", "nor", "only", "own", "same", "so", "than", "too", "very",
    "just", "as", "if", "while", "although", "because", "since", "about",
    "above", "after", "before", "between", "during", "including", "until",
    "against", "among", "throughout", "per", "etc", "eg", "ie",
    "well", "also", "like", "use", "using", "used", "work", "working",
    "across", "excellent", "strong", "good", "great", "hands",
    "experience", "years", "year", "knowledge", "understanding",
    "position", "role", "team", "company", "ability", "looking",
    "candidate", "required", "requirements", "preferred", "responsibilities",
    "qualifications", "plus", "bonus", "nice", "familiar", "proficient",
    "degree", "bachelor", "master", "phd", "university", "college",
    "minimum", "least", "related", "field", "proven", "demonstrated",
    "help", "must", "new", "need", "high", "end", "large", "scale",
    "design", "build", "develop", "implement", "create", "ensure",
    "manage", "support", "provide", "maintain", "improve", "drive",
    "deliver", "enable", "collaborate", "communicate", "lead"
}



# ─────────────────────────────────────────────
#  NLP Utilities
# ─────────────────────────────────────────────

def tokenize(text: str) -> list:
    """Lowercase, strip punctuation, remove stop words, return meaningful tokens."""
    text = text.lower()
    # Replace punctuation with spaces (keep alphanumeric + + # / . for tech tokens)
    text = re.sub(r"[^a-z0-9\s\+\#\.]", " ", text)
    tokens = text.split()
    return [t for t in tokens if len(t) > 1 and t not in STOP_WORDS]


def extract_bigrams(tokens: list) -> list:
    """Extract consecutive 2-word phrases from a token list."""
    return [f"{tokens[i]} {tokens[i+1]}" for i in range(len(tokens) - 1)]


def compute_cosine_similarity(text1: str, text2: str) -> float:
    """
    Compute TF-weighted cosine similarity between two texts (bag-of-words).
    Returns a float in [0.0, 1.0].
    """
    tokens1 = tokenize(text1)
    tokens2 = tokenize(text2)

    if not tokens1 or not tokens2:
        return 0.0

    vec1 = Counter(tokens1)
    vec2 = Counter(tokens2)

    shared = set(vec1.keys()) & set(vec2.keys())
    dot_product = sum(vec1[t] * vec2[t] for t in shared)

    mag1 = math.sqrt(sum(v ** 2 for v in vec1.values()))
    mag2 = math.sqrt(sum(v ** 2 for v in vec2.values()))

    if mag1 == 0 or mag2 == 0:
        return 0.0

    return dot_product / (mag1 * mag2)


def extract_jd_keywords(jd_text: str) -> list:
    """
    Extract all meaningful keywords from the job description.
    Combines:
      1. Predefined skill keyword matching (case-insensitive, word-boundary)
      2. Dynamic CamelCase / ALL-CAPS / dot-notation technical terms from JD text
    """
    found_predefined = []
    jd_lower = jd_text.lower()

    for skill in SKILL_KEYWORDS:
        escaped = re.escape(skill.lower())
        start_b = r"\b" if escaped[0].isalnum() else r"(?<!\w)"
        end_b = r"\b" if escaped[-1].isalnum() else r"(?!\w)"
        if re.search(f"{start_b}{escaped}{end_b}", jd_lower):
            found_predefined.append(skill)

    # Dynamic: capture CamelCase, all-caps acronyms (≥ 2 chars), dotted identifiers
    dynamic_patterns = [
        r"\b[A-Z]{2,}\b",                        # ALL_CAPS acronyms: AWS, API, SDK
        r"\b[A-Z][a-z]+(?:[A-Z][a-z]+)+\b",      # CamelCase: TensorFlow, PostgreSQL
        r"\b[A-Za-z]+\.[A-Za-z]+\b",             # dotted: Next.js, Vue.js
    ]
    dynamic_terms = set()
    for pattern in dynamic_patterns:
        for match in re.findall(pattern, jd_text):
            if len(match) > 1 and match.lower() not in STOP_WORDS:
                dynamic_terms.add(match)

    # Merge: predefined first, then dynamic terms not already covered
    found_lower_set = {k.lower() for k in found_predefined}
    for term in sorted(dynamic_terms):
        if term.lower() not in found_lower_set:
            found_predefined.append(term)
            found_lower_set.add(term.lower())

    return found_predefined


def extract_jd_phrases(jd_text: str) -> list:
    """
    Extract meaningful 2-word technical phrases from the JD.
    E.g. 'machine learning', 'cloud infrastructure', 'unit testing'
    """
    tokens = tokenize(jd_text)
    bigrams = extract_bigrams(tokens)
    # Filter bigrams to those with at least one non-trivial token
    meaningful = [bg for bg in bigrams if len(bg) > 6]
    return meaningful


class JobDescriptionMatcher:
    """
    Advanced resume-to-job-description matcher using:
      - Dynamic keyword extraction from JD (predefined + NLP-derived)
      - TF cosine similarity (bag-of-words semantic similarity)
      - Bigram phrase matching
      - Weighted composite match score
    """

    def __init__(self):
        pass

    def match(self, resume_text: str, job_description: str) -> dict:
        """
        Compute multi-dimensional match between resume and job description.

        Composite match = 0.55 * keyword_score + 0.30 * cosine_score + 0.15 * phrase_score

        :param resume_text: Extracted plain text from the resume.
        :param job_description: Plain text of the job description.
        :return: Dict with composite match, sub-scores, matched/missing keywords, and suggestions.
        """
        # ── 1. Keyword Coverage Score ──────────────────────────────────────────
        jd_keywords = extract_jd_keywords(job_description)
        resume_lower = resume_text.lower()

        matched_kws = []
        missing_kws = []

        for kw in jd_keywords:
            escaped = re.escape(kw.lower())
            start_b = r"\b" if escaped[0].isalnum() else r"(?<!\w)"
            end_b = r"\b" if escaped[-1].isalnum() else r"(?!\w)"
            if re.search(f"{start_b}{escaped}{end_b}", resume_lower):
                matched_kws.append(kw)
            else:
                missing_kws.append(kw)

        keyword_score = round((len(matched_kws) / len(jd_keywords)) * 100) if jd_keywords else 0

        # ── 2. Cosine Similarity Score (semantic overlap) ──────────────────────
        cosine_sim = compute_cosine_similarity(resume_text, job_description)
        cosine_score = round(cosine_sim * 100)

        # ── 3. Phrase / Bigram Match Score ─────────────────────────────────────
        jd_phrases = extract_jd_phrases(job_description)
        resume_phrases = set(extract_bigrams(tokenize(resume_text)))

        matched_phrases = [p for p in jd_phrases if p in resume_phrases]
        phrase_score = round((len(matched_phrases) / len(jd_phrases)) * 100) if jd_phrases else cosine_score

        # ── 4. Composite Score ─────────────────────────────────────────────────
        match_percentage = round(
            0.55 * keyword_score +
            0.30 * cosine_score +
            0.15 * phrase_score
        )
        match_percentage = min(match_percentage, 100)

        # ── 5. Skill category analysis ────────────────────────────────────────
        categories = _categorize_keywords(matched_kws, missing_kws)

        # ── 6. Generate smart suggestions ─────────────────────────────────────
        suggestions = _generate_suggestions(
            keyword_score, cosine_score, phrase_score, missing_kws
        )

        return {
            "match_percentage": match_percentage,
            "keyword_score": keyword_score,
            "cosine_score": cosine_score,
            "phrase_score": phrase_score,
            "matched_keywords": matched_kws,
            "missing_keywords": missing_kws,
            "matched_phrases": matched_phrases[:8],
            "total_jd_keywords": len(jd_keywords),
            "skill_categories": categories,
            "suggestions": suggestions
        }


# ─────────────────────────────────────────────
#  Helper: Keyword Categorizer
# ─────────────────────────────────────────────

_CATEGORY_MAP = {
    "Languages": [
        "python", "java", "c++", "c", "javascript", "typescript", "go", "golang",
        "rust", "swift", "kotlin", "ruby", "php", "scala", "r", "matlab",
        "dart", "lua", "julia", "groovy", "elixir", "haskell", "perl"
    ],
    "AI / ML": [
        "tensorflow", "pytorch", "scikit-learn", "keras", "openai", "gemini",
        "machine learning", "deep learning", "nlp", "computer vision",
        "llm", "rag", "bert", "gpt", "transformers", "hugging face",
        "neural network", "langchain", "xgboost", "lightgbm"
    ],
    "Cloud / DevOps": [
        "docker", "kubernetes", "aws", "azure", "gcp", "google cloud",
        "terraform", "ansible", "ci/cd", "jenkins", "github actions",
        "serverless", "lambda", "linux", "helm", "argocd"
    ],
    "Databases": [
        "sql", "mysql", "postgresql", "mongodb", "redis", "elasticsearch",
        "dynamodb", "cassandra", "neo4j", "sqlite", "oracle", "supabase",
        "firebase", "prisma", "snowflake", "bigquery", "redshift"
    ],
    "Web": [
        "react", "next.js", "vue", "angular", "node.js", "express",
        "fastapi", "flask", "django", "spring boot", "graphql", "rest",
        "html", "css", "tailwind", "bootstrap", "svelte", "nestjs"
    ],
    "Tools": [
        "git", "github", "gitlab", "jira", "agile", "scrum", "docker",
        "postman", "figma", "selenium", "jest", "pytest", "cypress"
    ]
}


def _categorize_keywords(matched: list, missing: list) -> dict:
    """Group matched and missing keywords by category."""
    categories = {}
    all_kws_lower = {k.lower(): k for k in matched + missing}

    for cat, kw_list in _CATEGORY_MAP.items():
        cat_matched = [matched_k for k in kw_list
                       for matched_k in [all_kws_lower.get(k)]
                       if matched_k and matched_k in matched]
        cat_missing = [matched_k for k in kw_list
                       for matched_k in [all_kws_lower.get(k)]
                       if matched_k and matched_k in missing]
        if cat_matched or cat_missing:
            total = len(cat_matched) + len(cat_missing)
            categories[cat] = {
                "matched": cat_matched,
                "missing": cat_missing,
                "coverage_pct": round((len(cat_matched) / total) * 100) if total else 0
            }

    return categories


# ─────────────────────────────────────────────
#  Helper: Smart Suggestion Generator
# ─────────────────────────────────────────────

def _generate_suggestions(
    keyword_score: int,
    cosine_score: int,
    phrase_score: int,
    missing_kws: list
) -> list:
    suggestions = []

    if missing_kws:
        top_missing = missing_kws[:4]
        for kw in top_missing:
            suggestions.append(
                f"Add '{kw}' to your skills or experience section to better align with this role."
            )

    if cosine_score < 35:
        suggestions.append(
            "Your resume language diverges significantly from the JD. "
            "Mirror its vocabulary in your summary and bullet points."
        )
    elif cosine_score < 55:
        suggestions.append(
            "Incorporate more terminology from the job description into your resume summary and role descriptions."
        )

    if phrase_score < 30:
        suggestions.append(
            "Use multi-word phrases from the JD (e.g. 'distributed systems', 'cloud infrastructure') in your resume."
        )

    if keyword_score >= 70 and cosine_score >= 60:
        suggestions.append(
            "Strong technical match! Quantify your achievements with metrics (e.g. '30% faster', '$1M impact') to stand out."
        )

    if not suggestions:
        suggestions.append(
            "Good alignment. Tailor your professional summary to echo the job's specific goals and tech stack."
        )

    return suggestions
