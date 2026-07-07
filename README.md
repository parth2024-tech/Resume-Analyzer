# CerebroAI — Resume Intelligence Platform

> **Neural resume intelligence. Built for job seekers, recruiters, and hiring teams.**

CerebroAI is a full-stack AI-powered resume analysis platform that combines deep NLP, semantic matching, and Gemini AI to give you unmatched insight into your resume's performance.

---

## Features

- **ATS Scoring** — Grades your resume against recruiter parsing algorithms: formatting, section structure, contact info, skill density, and experience impact.
- **Keyword Gap Decoder** — Semantic cosine similarity + phrase matching against any job description to reveal exactly what's missing.
- **AI Recruiter Engine** — Upload up to 10 resumes at once. NLP pipeline ranks candidates by composite score, keyword coverage, and semantic alignment.
- **Cover Letter Generator** — AI-generated, tone-customizable cover letters tailored to a specific JD.
- **Interview Prep** — Generates 4 tailored questions (Technical, Project, Behavioral, HR) per candidate profile.
- **AI Resume Assistant** — Chat with your resume. Ask for improvements, skill suggestions, and summary rewrites.
- **Shareable Reports** — Export and share a read-only analysis report via URL.

---

## Tech Stack

**Frontend**
- React 19 + TypeScript + Vite
- Tailwind CSS v4 + Framer Motion + Recharts
- Space Grotesk + Syne fonts

**Backend**
- FastAPI (Python)
- Google Gemini 2.5 Flash
- pdfplumber + python-docx
- In-memory rate limiting

---

## Architecture

CerebroAI follows a decoupled client-server architecture:

```
frontend/          React SPA (Vite)
backend/           FastAPI REST API
  ├── main.py      API routes + middleware
  ├── parser.py    PDF/DOCX text extraction
  ├── analyzer.py  NLP resume analysis
  ├── ats_score.py ATS scoring engine
  ├── jd_matcher.py  Semantic JD matching
  ├── resume_rater.py  Multi-pillar rating
  └── gemini_service.py  Gemini AI client
```

---

## Quick Start

### Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env  # add your GEMINI_API_KEY
uvicorn main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

App runs at `http://localhost:5173`

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/health` | API health + Gemini status |
| POST | `/analyze` | Full resume analysis |
| POST | `/ats-score` | ATS score & breakdown |
| POST | `/rate` | Multi-pillar resume rating |
| POST | `/jd-match` | Resume vs JD matching |
| POST | `/screen-resumes` | Batch multi-resume screening |
| POST | `/generate-cover-letter` | AI cover letter |
| POST | `/generate-interview-questions` | AI interview questions |
| POST | `/chat` | AI resume assistant |

---

## Built By

**Parth Gupta** — Full Stack Development Internship @ IncodeVision Labs · Task 04

`#incodevision` `#AI` `#NLP` `#MachineLearning` `#FullStack`
