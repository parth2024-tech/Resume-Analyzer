# CerebroAI — Resume Intelligence Platform

CerebroAI is an AI-driven resume analysis platform designed to evaluate and optimize resumes. It utilizes natural language processing and the Gemini AI model to provide actionable insights, semantic job description matching, and applicant screening capabilities.

---

## Key Features

- **ATS Evaluation:** Analyzes resumes against standard parsing criteria, evaluating formatting, structure, and skill density.
- **Job Description Alignment:** Employs semantic similarity and keyword analysis to identify gaps between a resume and a target job description.
- **Batch Screening:** Allows processing of multiple resumes simultaneously, ranking candidates based on keyword coverage and semantic alignment.
- **Cover Letter Generation:** Drafts context-aware cover letters tailored to specific job postings.
- **Interview Preparation:** Generates relevant technical and behavioral interview questions based on the candidate's profile.
- **Interactive AI Assistant:** Provides a conversational interface to ask specific questions about the resume and request improvements.

---

## Technology Stack

**Frontend Architecture**
- React 19, TypeScript, Vite
- Tailwind CSS v4, Framer Motion, Recharts

**Backend Architecture**
- FastAPI (Python)
- Google Gemini 2.5 Flash
- Document Parsing: pdfplumber, python-docx

---

## System Architecture

The platform uses a decoupled client-server architecture:

```text
frontend/          React Single Page Application
backend/           FastAPI REST API
  ├── main.py      API routing and middleware
  ├── parser.py    Document text extraction
  ├── analyzer.py  NLP-based resume analysis
  ├── ats_score.py ATS evaluation logic
  ├── jd_matcher.py  Semantic matching engine
  ├── resume_rater.py  Multi-criteria rating system
  └── gemini_service.py  AI model integration
```

---

## Local Development Setup

### Backend Environment
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # Configure GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend Environment
```bash
cd frontend
npm install
npm run dev
```

The application will be accessible at `http://localhost:5173`.

---

## API Reference

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/health` | Service health and AI connection status |
| POST | `/analyze` | Comprehensive resume extraction and analysis |
| POST | `/ats-score` | ATS compatibility evaluation |
| POST | `/rate` | Multi-dimensional resume scoring |
| POST | `/jd-match` | Resume and job description comparison |
| POST | `/screen-resumes` | Batch processing and candidate ranking |
| POST | `/generate-cover-letter` | Automated cover letter drafting |
| POST | `/generate-interview-questions` | Candidate-specific interview preparation |
| POST | `/chat` | Contextual resume assistant interface |
