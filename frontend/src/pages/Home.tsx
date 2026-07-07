import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import ErrorState from '../components/ui/ErrorState';
import {
  Upload,
  ChevronRight,
  ArrowRight,
  Zap,
  Target,
  Check,
  ShieldCheck,
  Brain,
  AlertTriangle,
  Cpu,
  BarChart3,
  FileSearch,
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function Home() {
  const { uploadAndAnalyze, isLoading, error, errorType } = useResume();
  const navigate = useNavigate();
  const [isDragActive, setIsDragActive] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);

  const processFile = async (file: File) => {
    const validTypes = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/msword'
    ];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!validTypes.includes(file.type) && extension !== 'pdf' && extension !== 'docx' && extension !== 'doc') {
      setFileError('Supported formats: PDF or DOCX only.');
      return;
    }
    setFileError(null);
    setCurrentFile(file);
    try {
      const success = await uploadAndAnalyze(file);
      if (success) navigate('/analyze');
    } catch (err) {
      console.error(err);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') setIsDragActive(true);
    else if (e.type === 'dragleave') setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const loadDemo = () => {
    const demoFile = new File(['demo_content'], 'Bipul_Jaiswal_Resume.pdf', { type: 'application/pdf' });
    processFile(demoFile);
  };

  // Metrics for stats bar
  const stats = [
    { label: 'AI Engine', value: 'Gemini 2.5', sub: 'Flash model' },
    { label: 'Parse Time', value: '< 2s', sub: 'Instant results' },
    { label: 'Data Privacy', value: 'Zero storage', sub: 'Deleted post-session' },
    { label: 'Candidates Screened', value: '50k+', sub: 'Global reach' },
  ];

  // Feature cards
  const features = [
    {
      icon: BarChart3,
      tag: 'ATS Engine',
      title: 'ATS Score Intelligence',
      desc: 'Measure exactly how recruiter bots read your resume. Our engine grades formatting, section structure, contact completeness, and keyword density with surgical precision.',
      points: ['Formatting & layout grading', 'Section completeness audit', 'Contact info verification'],
      accent: '#0ef6cc',
    },
    {
      icon: Target,
      tag: 'Gap Analysis',
      title: 'Keyword Gap Decoder',
      desc: 'Paste any job description and see the exact terms you\'re missing. Semantic cosine matching identifies both direct and implied skill gaps instantly.',
      points: ['Semantic similarity matching', 'Multi-phrase detection', 'Missing keyword roadmap'],
      accent: '#f59e0b',
    },
    {
      icon: FileSearch,
      tag: 'Batch Screening',
      title: 'AI Recruiter Engine',
      desc: 'Upload up to 10 resumes at once. Our NLP pipeline ranks candidates by composite score, keyword coverage, and semantic alignment against your job role.',
      points: ['Multi-resume batch analysis', 'Composite ranking algorithm', 'Shortlist & export to CSV'],
      accent: '#38bdf8',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-16 pb-24 space-y-28">

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center min-h-[60vh]">

        {/* Left: Copy */}
        <div className="lg:col-span-7 space-y-7 text-left">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-medium"
            style={{ borderColor: 'rgba(14,246,204,0.25)', background: 'rgba(14,246,204,0.06)', color: '#0ef6cc' }}
          >
            <Brain className="w-3.5 h-3.5" />
            <span>Powered by Gemini 2.5 Flash</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="text-4xl sm:text-6xl font-bold tracking-tight leading-[1.08] font-display"
          >
            Make your resume{' '}
            <span className="text-gradient-hero">impossible to ignore.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="text-base sm:text-lg max-w-xl font-light leading-relaxed"
            style={{ color: '#5d7a96' }}
          >
            CerebroAI decodes your resume with deep NLP — scoring ATS compliance, finding keyword gaps, and ranking candidates with an intelligence layer built for modern recruiting.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.3 }}
            className="flex flex-wrap gap-4 pt-2"
          >
            <a
              href="#upload-zone"
              className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold h-11 px-6 transition-all shadow-sm"
              style={{ background: '#0ef6cc', color: '#050a14' }}
              onMouseEnter={e => (e.currentTarget.style.background = '#0de0b8')}
              onMouseLeave={e => (e.currentTarget.style.background = '#0ef6cc')}
            >
              Analyze My Resume
              <ChevronRight className="w-4 h-4" />
            </a>
            <button
              onClick={loadDemo}
              disabled={isLoading}
              className="inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold h-11 px-6 transition-all border disabled:opacity-50 disabled:pointer-events-none"
              style={{ borderColor: '#162340', color: '#5d7a96', background: 'transparent' }}
              onMouseEnter={e => { (e.currentTarget.style.borderColor = '#0ef6cc40'); (e.currentTarget.style.color = '#e8f4f8'); }}
              onMouseLeave={e => { (e.currentTarget.style.borderColor = '#162340'); (e.currentTarget.style.color = '#5d7a96'); }}
            >
              View Live Demo
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        </div>

        {/* Right: Upload Zone */}
        <div id="upload-zone" className="lg:col-span-5 relative w-full">
          <div className="absolute inset-0 rounded-3xl blur-3xl -z-10 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse, rgba(14,246,204,0.06) 0%, transparent 70%)' }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.2 }}
          >
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              className="relative border rounded-2xl p-8 transition-all duration-300 flex flex-col items-center justify-center min-h-[280px] overflow-hidden"
              style={{
                background: isDragActive ? 'rgba(14,246,204,0.04)' : 'rgba(10,22,40,0.6)',
                borderColor: isDragActive ? 'rgba(14,246,204,0.5)' : '#162340',
                backdropFilter: 'blur(16px)',
              }}
            >
              <input
                type="file"
                id="cerebro-upload-input"
                className="hidden"
                accept=".pdf,.docx,.doc"
                onChange={handleFileInput}
                disabled={isLoading}
              />

              {isLoading ? (
                <div className="flex flex-col items-center justify-center gap-5 text-center">
                  <div className="relative flex items-center justify-center w-12 h-12">
                    <span className="absolute inline-flex h-full w-full rounded-full animate-ping opacity-30"
                      style={{ background: '#0ef6cc' }} />
                    <div className="relative w-8 h-8 rounded-full border-2 border-t-[#0ef6cc] animate-spin"
                      style={{ borderColor: '#162340', borderTopColor: '#0ef6cc' }} />
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm font-medium" style={{ color: '#e8f4f8' }}>Neural analysis in progress...</p>
                    <p className="text-[11px] font-light" style={{ color: '#5d7a96' }}>Extracting structure, keywords, and semantic signals</p>
                  </div>
                </div>
              ) : (
                <label
                  htmlFor="cerebro-upload-input"
                  className="cursor-pointer flex flex-col items-center justify-center w-full h-full text-center group"
                >
                  <div
                    className="p-3.5 rounded-xl border mb-4 transition-all duration-300"
                    style={{ background: '#0a1628', borderColor: '#162340', color: '#5d7a96' }}
                  >
                    <Upload className="w-5 h-5 group-hover:scale-110 transition-transform" style={{ color: '#0ef6cc' }} />
                  </div>
                  <span className="text-sm font-medium mb-1" style={{ color: '#e8f4f8' }}>
                    Drop your resume here
                  </span>
                  <span className="text-xs font-light mb-5" style={{ color: '#5d7a96' }}>
                    or click to browse your files
                  </span>
                  <div
                    className="flex items-center gap-3 px-3 py-1.5 rounded-lg border text-[10px] font-light"
                    style={{ borderColor: '#162340', background: 'rgba(10,22,40,0.4)', color: '#5d7a96' }}
                  >
                    <span>PDF</span>
                    <span className="h-1 w-1 rounded-full" style={{ background: '#162340' }} />
                    <span>DOCX</span>
                    <span className="h-1 w-1 rounded-full" style={{ background: '#162340' }} />
                    <span>Max 10MB</span>
                  </div>
                </label>
              )}
            </div>

            {/* Error */}
            {(fileError || error) && (
              <div className="mt-4">
                {errorType ? (
                  <ErrorState
                    type={errorType}
                    title={errorType === 'offline' ? 'Connection Error' : errorType === 'upload_fail' ? 'Upload Failed' : 'Parse Error'}
                    message={fileError || error || 'An error occurred.'}
                    onRetry={currentFile ? () => processFile(currentFile) : undefined}
                  />
                ) : (
                  <div className="p-3.5 rounded-xl border text-xs flex items-center gap-2.5"
                    style={{ borderColor: 'rgba(244,63,94,0.3)', background: 'rgba(244,63,94,0.06)', color: '#fb7185' }}>
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{fileError || error}</span>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </section>

      {/* ── Stats Bar ─────────────────────────────────────────────────────────── */}
      <section className="border-t border-b py-12" style={{ borderColor: '#162340' }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s, i) => (
            <motion.div
              key={s.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.1 * i }}
              className="space-y-1 text-left"
            >
              <span className="text-[10px] font-bold uppercase tracking-widest block" style={{ color: '#5d7a96' }}>{s.label}</span>
              <span className="text-2xl font-bold block font-display" style={{ color: '#e8f4f8' }}>{s.value}</span>
              <span className="text-xs font-light" style={{ color: '#5d7a96' }}>{s.sub}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Feature Cards Grid ─────────────────────────────────────────────────── */}
      <section className="space-y-6">
        <div className="text-center space-y-3 mb-12">
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: '#0ef6cc' }}>
            What CerebroAI does
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight font-display" style={{ color: '#e8f4f8' }}>
            Built for every hiring workflow
          </h2>
          <p className="text-sm font-light max-w-xl mx-auto" style={{ color: '#5d7a96' }}>
            Whether you're a job seeker optimizing one resume or an HR team screening hundreds — CerebroAI has the tooling for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.tag}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.1 * i }}
                className="rounded-2xl border p-6 space-y-4 cerebro-card glow-hover"
                style={{ background: 'rgba(10,22,40,0.6)', borderColor: '#162340', backdropFilter: 'blur(12px)' }}
              >
                <div className="flex items-start justify-between">
                  <div className="p-2 rounded-lg border" style={{ background: 'rgba(10,22,40,0.8)', borderColor: f.accent + '30' }}>
                    <Icon className="w-4 h-4" style={{ color: f.accent }} />
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-lg border"
                    style={{ color: f.accent, borderColor: f.accent + '30', background: f.accent + '10' }}>
                    {f.tag}
                  </span>
                </div>

                <div className="space-y-2">
                  <h3 className="text-base font-semibold font-display" style={{ color: '#e8f4f8' }}>{f.title}</h3>
                  <p className="text-xs font-light leading-relaxed" style={{ color: '#5d7a96' }}>{f.desc}</p>
                </div>

                <ul className="space-y-2 pt-2">
                  {f.points.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs" style={{ color: '#5d7a96' }}>
                      <Check className="w-3.5 h-3.5 shrink-0" style={{ color: f.accent }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </motion.div>
            );
          })}
        </div>
      </section>

      {/* ── CTA Strip ─────────────────────────────────────────────────────────── */}
      <section
        className="rounded-2xl border p-10 text-center space-y-5"
        style={{ background: 'rgba(14,246,204,0.04)', borderColor: 'rgba(14,246,204,0.15)' }}
      >
        <Brain className="w-8 h-8 mx-auto" style={{ color: '#0ef6cc' }} />
        <h2 className="text-2xl sm:text-3xl font-bold font-display" style={{ color: '#e8f4f8' }}>
          Ready to decode your resume?
        </h2>
        <p className="text-sm font-light" style={{ color: '#5d7a96' }}>
          Upload your PDF or DOCX and get a full intelligence report in under 2 seconds.
        </p>
        <a
          href="#upload-zone"
          className="inline-flex items-center gap-2 rounded-xl text-sm font-semibold h-11 px-8 transition-all"
          style={{ background: '#0ef6cc', color: '#050a14' }}
          onMouseEnter={e => (e.currentTarget.style.background = '#0de0b8')}
          onMouseLeave={e => (e.currentTarget.style.background = '#0ef6cc')}
        >
          Start Free Analysis
          <ChevronRight className="w-4 h-4" />
        </a>
      </section>

    </div>
  );
}
