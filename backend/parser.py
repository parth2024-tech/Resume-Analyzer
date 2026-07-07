import os
import re
import io
import pdfplumber
import docx

# Import from the single source of truth for all skill keywords
from skills_db import SKILL_KEYWORDS

def extract_text_from_stream(stream: io.BytesIO, ext: str) -> str:
    """
    Extracts raw plain text from a BytesIO stream representing a PDF or DOCX.
    Operates entirely in-memory — no disk I/O required.

    :param stream: An in-memory BytesIO object containing the file bytes.
    :param ext: Lowercase file extension (e.g. '.pdf', '.docx').
    :return: The extracted plain text as a string.
    :raises ValueError: If the file format is unsupported or no text is found.
    :raises RuntimeError: If text extraction fails due to file corruption.
    """
    if ext == '.pdf':
        return _extract_pdf_from_stream(stream)
    elif ext == '.docx':
        return _extract_docx_from_stream(stream)
    else:
        raise ValueError(
            f"Unsupported file format '{ext}'. Only .pdf and .docx files are supported."
        )

# Keep file-path variant for any direct callers outside ResumeParser
def extract_text(file_path: str) -> str:
    """
    Convenience wrapper — reads a file from disk and delegates to
    extract_text_from_stream. Prefer extract_text_from_stream for new code.
    """
    if not os.path.exists(file_path):
        raise FileNotFoundError(f"File not found at: {file_path}")
    _, ext = os.path.splitext(file_path.lower())
    with open(file_path, 'rb') as f:
        stream = io.BytesIO(f.read())
    return extract_text_from_stream(stream, ext)


def _extract_pdf_from_stream(stream: io.BytesIO) -> str:
    """
    Extract text from a PDF in-memory stream using pdfplumber.
    Falls back to extracting words via bounding-boxes when plain extract_text
    yields nothing (handles some complex layouts).
    """
    text_content = []
    try:
        stream.seek(0)
        with pdfplumber.open(stream) as pdf:
            if not pdf.pages:
                raise ValueError("PDF file contains no pages.")

            for page in pdf.pages:
                page_text = page.extract_text(x_tolerance=2, y_tolerance=3)
                if page_text and page_text.strip():
                    text_content.append(page_text.strip())
                else:
                    # Fallback: reconstruct text from individual word bboxes
                    words = page.extract_words(x_tolerance=3, y_tolerance=3)
                    if words:
                        text_content.append(" ".join(w["text"] for w in words))

        if not text_content:
            raise ValueError(
                "No text could be extracted from the PDF. "
                "It may be a scanned/image-only document."
            )
        return "\n\n".join(text_content)
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise RuntimeError(f"Failed to extract text from PDF: {str(e)}") from e


def _extract_docx_from_stream(stream: io.BytesIO) -> str:
    """
    Extract text from a DOCX in-memory stream using python-docx.
    Also captures text inside tables (common in resume layouts).
    """
    try:
        stream.seek(0)
        doc = docx.Document(stream)
        paragraphs = [p.text.strip() for p in doc.paragraphs if p.text.strip()]

        table_texts = []
        for table in doc.tables:
            for row in table.rows:
                row_text = [cell.text.strip() for cell in row.cells if cell.text.strip()]
                if row_text:
                    clean_row_text: list[str] = []
                    for val in row_text:
                        if not clean_row_text or clean_row_text[-1] != val:
                            clean_row_text.append(val)
                    table_texts.append(" | ".join(clean_row_text))

        combined_text_list = paragraphs
        if table_texts:
            combined_text_list.append("\n--- Table Content ---\n" + "\n".join(table_texts))

        combined_text = "\n\n".join(combined_text_list)
        if not combined_text.strip():
            raise ValueError("DOCX file contains no text paragraphs or tables.")
        return combined_text
    except Exception as e:
        if isinstance(e, ValueError):
            raise
        raise RuntimeError(f"Failed to extract text from DOCX: {str(e)}") from e

def infer_name(text: str) -> str:
    """
    Infors candidate's name from the first few lines of the resume.
    """
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    
    # Exclude lines that contain noise or sections headers
    exclusion_keywords = {
        "email", "phone", "skills", "experience", "education", "projects", 
        "summary", "objective", "profile", "contact", "address", "github", 
        "linkedin", "portfolio", "http", "www", "resume", "curriculum", "vitae",
        "about", "work", "history", "career"
    }
    
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    phone_pattern = r'\+?\d[\d\s\(\)-]{7,}\d'
    
    candidate_lines = []
    for line in lines[:10]:  # Look in the top 10 lines
        lower_line = line.lower()
        
        # Skip lines containing email, phone or common URL domains
        if re.search(email_pattern, line) or re.search(phone_pattern, line):
            continue
        if any(domain in lower_line for domain in ["github.com", "linkedin.com", "http", "www"]):
            continue
            
        # Skip if contains any exclusion keyword
        if any(kw in lower_line for kw in exclusion_keywords):
            continue
            
        # Clean lines of bullets or numbering
        cleaned = re.sub(r'^[\s\-\*•o\d\.\)]+', '', line).strip()
        if not cleaned:
            continue
            
        candidate_lines.append(cleaned)
        
    # Match standard capitalized name pattern (2 to 4 words)
    name_like_pattern = r'^[A-Z][a-zA-Z]*(?:\s+[A-Z][a-zA-Z]*){1,3}$'
    for candidate in candidate_lines:
        if re.match(name_like_pattern, candidate):
            return candidate
            
    # Fallback to the first candidate line that isn't excluded
    if candidate_lines:
        return candidate_lines[0]
        
    # Final fallback
    if lines:
        return lines[0]
    return ""

def extract_email(text: str) -> str:
    """
    Extracts the first email address found in the text.
    """
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b'
    match = re.search(email_pattern, text)
    return match.group(0) if match else ""

def extract_phone(text: str) -> str:
    """
    Extracts the first phone number matching typical formats (Indian and International).
    """
    phone_patterns = [
        # Indian pattern split with dash/space: +91-98765-43210
        r'(?<!\w)(?:\+?91|0)?[-\s]?[6789]\d{4}[-\s]?\d{5}\b',
        # Indian pattern consecutive: +91 9876543210
        r'(?<!\w)(?:\+?91|0)?[-\s]?[6789]\d{9}\b',
        # General international formats like +1-555-123-4567, (555) 123-4567
        r'(?<!\w)(?:\+?\d{1,3}[-\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}\b',
        # Plain 10 digit number
        r'\b\d{10}\b'
    ]
    
    for pattern in phone_patterns:
        matches = re.findall(pattern, text)
        if matches:
            # Clean spaces/dashes and return first match
            return re.sub(r'\s+', ' ', matches[0].strip())
    return ""

def extract_skills(text: str) -> list:
    """
    Matches predefined technical skills inside the raw text.
    """
    detected = []
    text_lower = text.lower()
    
    for skill in SKILL_KEYWORDS:
        escaped = re.escape(skill.lower())
        
        # Word boundary logic: use standard \b for alphanumeric, lookarounds for special chars like C++
        start_boundary = r'\b' if escaped[0].isalnum() else r'(?<!\w)'
        end_boundary = r'\b' if escaped[-1].isalnum() else r'(?!\w)'
        
        pattern = f"{start_boundary}{escaped}{end_boundary}"
        
        if re.search(pattern, text_lower):
            detected.append(skill)
            
    return sorted(list(set(detected)))

def extract_section_lines(text: str, regex_pattern: str) -> list:
    """
    Extracts and cleans lines matching a regex pattern.
    """
    matched_lines = []
    compiled = re.compile(regex_pattern, re.IGNORECASE)
    
    # Common section header titles to skip
    header_titles = {
        "education", "experience", "projects", "work experience", 
        "academic projects", "personal projects", "key projects", 
        "professional experience", "employment history", "employment", 
        "skills", "technical skills", "history", "career"
    }
    
    for line in text.split('\n'):
        cleaned = line.strip()
        if not cleaned:
            continue
            
        # Skip exact section header lines
        if cleaned.lower() in header_titles:
            continue
            
        if compiled.search(cleaned):
            # Strip list bullets, numbering from the start of the line
            cleaned = re.sub(r'^[\s\-\*•o\d\.\)]+', '', cleaned).strip()
            if cleaned and cleaned not in matched_lines:
                matched_lines.append(cleaned)
                
    return matched_lines

def extract_resume_info(text: str) -> dict:
    """
    Extracts structured summary information from raw resume text.
    
    :param text: Raw text extracted from the document.
    :return: Dict containing extracted profile components.
    """
    if not text:
        return {
            "name": "",
            "email": "",
            "phone": "",
            "skills": [],
            "education": [],
            "experience": [],
            "projects": []
        }
        
    education_pattern = r'\b(?:b\.tech|bachelor|master|university|institute|college|cgpa|diploma|ph\.d|school|degree)s?\b'
    experience_pattern = r'\b(?:engineer|developer|intern|analyst|experience|worked|company|employment|job|position|role)s?\b'
    projects_pattern = r'\b(?:project|built|developed|created|designed|implemented|github)s?\b'
    
    return {
        "name": infer_name(text),
        "email": extract_email(text),
        "phone": extract_phone(text),
        "skills": extract_skills(text),
        "education": extract_section_lines(text, education_pattern),
        "experience": extract_section_lines(text, experience_pattern),
        "projects": extract_section_lines(text, projects_pattern)
    }

class ResumeParser:
    """
    Parses resume files entirely in-memory using BytesIO streams.
    No temporary files are written to disk — faster and safer.
    """
    def __init__(self):
        pass

    def parse(self, file_content: bytes, filename: str) -> dict:
        """
        Parses binary file contents using an in-memory BytesIO stream.

        :param file_content: Binary content of the file.
        :param filename: Original filename (used for extension detection only).
        :return: Dict with file metadata and extracted raw text.
        :raises ValueError: For unsupported file formats.
        :raises RuntimeError: For corrupt or unreadable files.
        """
        ext = os.path.splitext(filename.lower())[1]
        if ext not in ('.pdf', '.docx'):
            raise ValueError(
                f"Unsupported file format '{ext}'. Only .pdf and .docx files are supported."
            )

        stream = io.BytesIO(file_content)
        text = extract_text_from_stream(stream, ext)

        return {
            "filename": filename,
            "file_type": ext.lstrip('.'),
            "file_size_bytes": len(file_content),
            "extracted_text": text,
        }
