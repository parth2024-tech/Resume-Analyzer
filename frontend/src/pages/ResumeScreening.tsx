import React, { useState, useRef, useCallback } from 'react';
import { useTheme } from '../context/ThemeContext';
import {
  Upload, X, FileText, Send, AlertCircle, Trophy, Medal, Award,
  ChevronDown, ChevronUp, CheckCircle2, XCircle, Zap, Users,
  Target, Download, BarChart2, Brain, Hash, Layers, ArrowUpDown,
  Filter, RefreshCw, Star, TrendingUp, Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell
} from 'recharts';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ─── Types ───────────────────────────────────────────────────────────────────

interface ATSBreakdown {
  formatting: number;
  sections: number;
  contact_info: number;
  skills_match: number;
  experience_impact: number;
}

interface SkillCategory {
  matched: string[];
  missing: string[];
  coverage_pct: number;
}

interface ScreeningResult {
  rank: number;
  filename: string;
  candidate_name: string;
  email: string;
  skills: string[];
  composite_score: number;
  match_percentage: number;
  keyword_score: number;
  cosine_score: number;
  phrase_score: number;
  ats_score: number;
  ats_breakdown: ATSBreakdown;
  matched_keywords: string[];
  missing_keywords: string[];
  matched_phrases: string[];
  total_jd_keywords: number;
  skill_categories: Record<string, SkillCategory>;
  suggestions: string[];
  error: string | null;
}

interface Stats {
  avg_composite: number;
  avg_match: number;
  avg_ats: number;
  top_score: number;
  top_candidate: string;
}

interface ScreeningResponse {
  total: number;
  stats: Stats;
  results: ScreeningResult[];
}

type SortKey = 'composite_score' | 'match_percentage' | 'ats_score' | 'keyword_score';

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getRankBadge(rank: number, theme: string) {
  const base = 'w-9 h-9 rounded-xl flex items-center justify-center shrink-0 font-bold text-sm';
  if (rank === 1)
    return (
      <div className={`${base} bg-yellow-400/15 border border-yellow-400/40 text-yellow-400`}>
        <Trophy className="w-4 h-4" />
      </div>
    );
  if (rank === 2)
    return (
      <div className={`${base} bg-zinc-400/15 border border-zinc-400/40 text-zinc-400`}>
        <Medal className="w-4 h-4" />
      </div>
    );
  if (rank === 3)
    return (
      <div className={`${base} bg-amber-600/15 border border-amber-600/40 text-amber-500`}>
        <Award className="w-4 h-4" />
      </div>
    );
  return (
    <div
      className={`${base} ${
        theme === 'dark'
          ? 'bg-zinc-800 border border-zinc-700 text-zinc-400'
          : 'bg-zinc-100 border border-zinc-200 text-zinc-500'
      }`}
    >
      #{rank}
    </div>
  );
}

function scoreColor(score: number) {
  if (score >= 70) return 'text-emerald-500';
  if (score >= 45) return 'text-amber-500';
  return 'text-rose-500';
}

function scoreBgGradient(score: number) {
  if (score >= 70) return 'from-emerald-500 to-emerald-400';
  if (score >= 45) return 'from-amber-500 to-amber-400';
  return 'from-rose-500 to-rose-400';
}

function ScoreRing({ score, size = 72 }: { score: number; size?: number }) {
  const r = (size / 2) - 5;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const stroke = score >= 70 ? '#10b981' : score >= 45 ? '#f59e0b' : '#f43f5e';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="currentColor"
        strokeWidth="5" className="text-zinc-200 dark:text-zinc-800" />
      <motion.circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={stroke}
        strokeWidth="5" strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        strokeLinecap="round"
      />
    </svg>
  );
}

function MiniBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="space-y-1">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-medium text-zinc-500 dark:text-zinc-500">{label}</span>
        <span className={`text-[10px] font-bold ${scoreColor(value)}`}>{value}%</span>
      </div>
      <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <motion.div
          className={`h-full rounded-full bg-gradient-to-r ${color}`}
          initial={{ width: 0 }}
          animate={{ width: `${value}%` }}
          transition={{ duration: 0.7, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}

// ─── Result Card ──────────────────────────────────────────────────────────────

function ResultCard({ result, theme }: { result: ScreeningResult; theme: string }) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'keywords' | 'breakdown' | 'suggestions'>('keywords');

  const radarData = [
    { subject: 'Keywords', value: result.keyword_score },
    { subject: 'Semantic', value: result.cosine_score },
    { subject: 'Phrases', value: result.phrase_score },
    { subject: 'ATS', value: result.ats_score },
    {
      subject: 'Coverage',
      value: result.total_jd_keywords > 0
        ? Math.round((result.matched_keywords.length / result.total_jd_keywords) * 100)
        : 0
    },
  ];

  const atsBarData = Object.entries(result.ats_breakdown || {}).map(([k, v]) => ({
    name: k.replace('_', ' '),
    value: v as number
  }));

  const isTop = result.rank === 1;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: result.rank * 0.06 }}
      className={`rounded-2xl border overflow-hidden transition-all ${
        isTop
          ? theme === 'dark'
            ? 'border-yellow-500/30 shadow-lg shadow-yellow-500/5 bg-zinc-900/80'
            : 'border-yellow-300 shadow-lg shadow-yellow-100 bg-white'
          : theme === 'dark'
          ? 'border-zinc-800 bg-zinc-900/70 hover:border-zinc-700'
          : 'border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-sm'
      }`}
    >
      {/* Top bar for #1 */}
      {isTop && (
        <div className="h-0.5 w-full bg-gradient-to-r from-yellow-400 via-amber-300 to-yellow-400" />
      )}

      {/* Card Header */}
      <div className="p-5 flex items-start gap-4">
        {/* Rank */}
        {getRankBadge(result.rank, theme)}

        {/* Score Ring */}
        <div className="relative shrink-0">
          <ScoreRing score={result.composite_score} size={64} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-sm font-bold leading-none ${scoreColor(result.composite_score)}`}>
              {result.composite_score}
            </span>
            <span className="text-[8px] text-zinc-500 dark:text-zinc-500 font-bold uppercase leading-none mt-0.5">
              Score
            </span>
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 space-y-1.5">
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`text-sm font-semibold ${
                theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
              }`}>
                {result.candidate_name !== 'Unknown' ? result.candidate_name : result.filename}
              </h3>
              {result.email && (
                <span className="text-[10px] text-zinc-500 dark:text-zinc-500 truncate max-w-[140px]">
                  {result.email}
                </span>
              )}
            </div>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">{result.filename}</p>
          </div>

          {/* Skill chips */}
          <div className="flex flex-wrap gap-1">
            {result.skills.slice(0, 7).map((s) => (
              <span key={s} className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md border ${
                theme === 'dark'
                  ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                  : 'bg-zinc-100 border-zinc-200 text-zinc-500'
              }`}>
                {s}
              </span>
            ))}
            {result.skills.length > 7 && (
              <span className="text-[9px] text-zinc-500">+{result.skills.length - 7}</span>
            )}
          </div>

          {/* Mini sub-scores */}
          <div className="grid grid-cols-3 gap-2 pt-1">
            <MiniBar label="Keyword" value={result.keyword_score} color="from-purple-500 to-purple-400" />
            <MiniBar label="Semantic" value={result.cosine_score} color="from-blue-500 to-blue-400" />
            <MiniBar label="ATS" value={result.ats_score} color={
              result.ats_score >= 70 ? 'from-emerald-500 to-emerald-400' :
              result.ats_score >= 45 ? 'from-amber-500 to-amber-400' :
              'from-rose-500 to-rose-400'
            } />
          </div>
        </div>

        {/* Match % Badge + Expand */}
        <div className="flex flex-col items-end gap-2 shrink-0">
          <div className={`text-center px-3 py-1.5 rounded-xl border ${
            result.match_percentage >= 70
              ? theme === 'dark' ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-200 bg-emerald-50'
              : result.match_percentage >= 45
              ? theme === 'dark' ? 'border-amber-500/30 bg-amber-500/10' : 'border-amber-200 bg-amber-50'
              : theme === 'dark' ? 'border-rose-500/30 bg-rose-500/10' : 'border-rose-200 bg-rose-50'
          }`}>
            <div className={`text-base font-bold ${scoreColor(result.match_percentage)}`}>
              {result.match_percentage}%
            </div>
            <div className={`text-[8px] font-bold uppercase tracking-widest ${
              theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
            }`}>Match</div>
          </div>
          <button
            onClick={() => setExpanded(!expanded)}
            className={`p-1.5 rounded-lg transition-colors ${
              theme === 'dark'
                ? 'text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800'
                : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
            }`}
            aria-label="Toggle details"
          >
            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Panel */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="overflow-hidden"
          >
            <div className={`border-t ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
              {/* Tab bar */}
              <div className={`flex border-b ${theme === 'dark' ? 'border-zinc-800' : 'border-zinc-100'}`}>
                {(['keywords', 'breakdown', 'suggestions'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 py-2.5 text-[10px] font-bold uppercase tracking-widest transition-colors ${
                      activeTab === tab
                        ? theme === 'dark'
                          ? 'text-zinc-100 border-b-2 border-purple-400'
                          : 'text-zinc-900 border-b-2 border-purple-500'
                        : theme === 'dark'
                        ? 'text-zinc-500 hover:text-zinc-300'
                        : 'text-zinc-400 hover:text-zinc-600'
                    }`}
                  >
                    {tab === 'keywords' ? 'Keywords' : tab === 'breakdown' ? 'Score Breakdown' : 'Suggestions'}
                  </button>
                ))}
              </div>

              {/* Tab Content */}
              <div className="p-5">
                {activeTab === 'keywords' && (
                  <div className="space-y-4">
                    {/* Radar Chart */}
                    {radarData.length > 0 && (
                      <div className="h-44">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid stroke={theme === 'dark' ? '#27272a' : '#e4e4e7'} />
                            <PolarAngleAxis
                              dataKey="subject"
                              tick={{ fontSize: 9, fill: theme === 'dark' ? '#71717a' : '#a1a1aa' }}
                            />
                            <Radar
                              name="Score"
                              dataKey="value"
                              stroke="#a855f7"
                              fill="#a855f7"
                              fillOpacity={0.25}
                              strokeWidth={1.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    )}

                    {/* Matched keywords */}
                    {result.matched_keywords.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            Matched ({result.matched_keywords.length}/{result.total_jd_keywords})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.matched_keywords.map((kw) => (
                            <span key={kw}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-medium">
                              ✓ {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Missing keywords */}
                    {result.missing_keywords.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <XCircle className="w-3.5 h-3.5 text-rose-500" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            Missing ({result.missing_keywords.length})
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.missing_keywords.map((kw) => (
                            <span key={kw}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                              + {kw}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Phrase matches */}
                    {result.matched_phrases.length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Hash className="w-3.5 h-3.5 text-blue-400" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            Phrase Matches
                          </span>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {result.matched_phrases.map((p) => (
                            <span key={p}
                              className="text-[10px] px-2 py-0.5 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-medium">
                              "{p}"
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Skill Categories */}
                    {Object.keys(result.skill_categories).length > 0 && (
                      <div>
                        <div className="flex items-center gap-1.5 mb-2">
                          <Layers className="w-3.5 h-3.5 text-purple-400" />
                          <span className={`text-[10px] font-bold uppercase tracking-widest ${
                            theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                          }`}>
                            Category Coverage
                          </span>
                        </div>
                        <div className="space-y-2">
                          {Object.entries(result.skill_categories).map(([cat, data]) => (
                            <div key={cat}>
                              <div className="flex justify-between mb-1">
                                <span className={`text-[10px] font-medium ${
                                  theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
                                }`}>{cat}</span>
                                <span className={`text-[10px] font-bold ${scoreColor(data.coverage_pct)}`}>
                                  {data.coverage_pct}%
                                </span>
                              </div>
                              <div className="h-1 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                                <motion.div
                                  className={`h-full rounded-full bg-gradient-to-r ${
                                    data.coverage_pct >= 70 ? 'from-emerald-500 to-emerald-400' :
                                    data.coverage_pct >= 40 ? 'from-amber-500 to-amber-400' :
                                    'from-rose-500 to-rose-400'
                                  }`}
                                  initial={{ width: 0 }}
                                  animate={{ width: `${data.coverage_pct}%` }}
                                  transition={{ duration: 0.7, ease: 'easeOut' }}
                                />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'breakdown' && (
                  <div className="space-y-4">
                    {/* Score breakdown bars */}
                    <div className="space-y-3">
                      {[
                        { label: 'Composite Score', value: result.composite_score, color: 'from-purple-500 to-purple-400' },
                        { label: 'JD Match', value: result.match_percentage, color: 'from-blue-500 to-blue-400' },
                        { label: 'Keyword Coverage', value: result.keyword_score, color: 'from-indigo-500 to-indigo-400' },
                        { label: 'Semantic (Cosine)', value: result.cosine_score, color: 'from-cyan-500 to-cyan-400' },
                        { label: 'Phrase Match', value: result.phrase_score, color: 'from-teal-500 to-teal-400' },
                        { label: 'ATS Score', value: result.ats_score, color: 'from-emerald-500 to-emerald-400' },
                      ].map(({ label, value, color }) => (
                        <MiniBar key={label} label={label} value={value} color={color} />
                      ))}
                    </div>

                    {/* ATS sub-breakdown mini chart */}
                    {atsBarData.length > 0 && (
                      <div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest mb-2 ${
                          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                        }`}>ATS Sub-Categories</p>
                        <div className="h-32">
                          <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={atsBarData} barSize={12}>
                              <XAxis dataKey="name" tick={{ fontSize: 8, fill: theme === 'dark' ? '#71717a' : '#a1a1aa' }} />
                              <YAxis domain={[0, 100]} tick={{ fontSize: 8, fill: theme === 'dark' ? '#71717a' : '#a1a1aa' }} />
                              <Tooltip
                                contentStyle={{
                                  fontSize: '10px',
                                  background: theme === 'dark' ? '#18181b' : '#ffffff',
                                  border: `1px solid ${theme === 'dark' ? '#27272a' : '#e4e4e7'}`,
                                  color: theme === 'dark' ? '#f4f4f5' : '#18181b'
                                }}
                              />
                              <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                {atsBarData.map((entry, i) => (
                                  <Cell
                                    key={i}
                                    fill={entry.value >= 70 ? '#10b981' : entry.value >= 50 ? '#f59e0b' : '#f43f5e'}
                                    opacity={0.8}
                                  />
                                ))}
                              </Bar>
                            </BarChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {activeTab === 'suggestions' && (
                  <ul className="space-y-3">
                    {result.suggestions.map((s, i) => (
                      <li key={i} className="flex gap-3 items-start">
                        <div className={`w-5 h-5 rounded flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5 border ${
                          theme === 'dark'
                            ? 'bg-zinc-800 border-zinc-700 text-zinc-400'
                            : 'bg-zinc-100 border-zinc-200 text-zinc-500'
                        }`}>{i + 1}</div>
                        <span className={`text-xs font-light leading-relaxed ${
                          theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                        }`}>{s}</span>
                      </li>
                    ))}
                    {result.error && (
                      <li className="flex items-center gap-2 text-xs text-rose-500">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {result.error}
                      </li>
                    )}
                  </ul>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function ResumeScreening() {
  const { theme } = useTheme();

  const [files, setFiles] = useState<File[]>([]);
  const [jdText, setJdText] = useState('');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [response, setResponse] = useState<ScreeningResponse | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>('composite_score');
  const [minScore, setMinScore] = useState(0);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── File management ───────────────────────────────────────────────────────

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const valid = Array.from(newFiles).filter((f) => {
      const ext = f.name.toLowerCase().slice(f.name.lastIndexOf('.'));
      return ['.pdf', '.docx'].includes(ext);
    });
    setFiles((prev) => {
      const combined = [...prev, ...valid];
      const unique = combined.filter(
        (f, i, arr) => arr.findIndex((x) => x.name === f.name) === i
      );
      return unique.slice(0, 10);
    });
  }, []);

  const removeFile = (i: number) => setFiles((p) => p.filter((_, idx) => idx !== i));

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addFiles(e.dataTransfer.files);
  }, [addFiles]);

  // ── Export CSV ────────────────────────────────────────────────────────────

  const exportCSV = () => {
    if (!response) return;
    const headers = [
      'Rank', 'Candidate', 'File', 'Composite Score', 'JD Match %',
      'Keyword Score', 'Semantic Score', 'Phrase Score', 'ATS Score',
      'Matched Keywords', 'Missing Keywords'
    ];
    const rows = response.results.map((r) => [
      r.rank, r.candidate_name, r.filename, r.composite_score,
      r.match_percentage, r.keyword_score, r.cosine_score,
      r.phrase_score, r.ats_score,
      `"${r.matched_keywords.join('; ')}"`,
      `"${r.missing_keywords.join('; ')}"`
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'resume_screening_results.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  // ── Submit ────────────────────────────────────────────────────────────────

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setResponse(null);

    if (files.length === 0) { setFormError('Upload at least one resume.'); return; }
    if (jdText.trim().length < 50) { setFormError('Job description must be at least 50 characters.'); return; }

    setIsLoading(true);
    try {
      const formData = new FormData();
      files.forEach((f) => formData.append('files', f));
      formData.append('job_description', jdText);

      const res = await fetch(`${API_BASE}/screen-resumes`, { method: 'POST', body: formData });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || 'Screening failed. Is the backend running?');
      }
      setResponse(await res.json());
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Derived sorted + filtered results ─────────────────────────────────────

  const sortedResults = response
    ? [...response.results]
        .filter((r) => r.composite_score >= minScore)
        .sort((a, b) => b[sortKey] - a[sortKey])
        .map((r, i) => ({ ...r, rank: i + 1 }))
    : [];

  // ── Render ────────────────────────────────────────────────────────────────

  const card = `rounded-2xl border p-5 ${
    theme === 'dark' ? 'bg-zinc-900/80 border-zinc-800' : 'bg-white border-zinc-200'
  }`;

  return (
    <div className="space-y-8 text-left">
      {/* ── Header ── */}
      <div className={`pb-6 border-b ${theme === 'dark' ? 'border-zinc-900/60' : 'border-zinc-200'}`}>
        <span className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${
          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
        }`}>NLP Batch Screening Engine · Task 04</span>
        <h2 className={`text-2xl font-semibold tracking-tight ${
          theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
        }`}>
          AI Resume Screening
        </h2>
        <p className={`text-xs font-light mt-1.5 leading-relaxed max-w-2xl ${
          theme === 'dark' ? 'text-zinc-500' : 'text-zinc-500'
        }`}>
          Upload multiple resumes and a job description. The engine extracts text via NLP,
          computes <strong className="font-medium">keyword coverage</strong>,{' '}
          <strong className="font-medium">cosine semantic similarity</strong>, and{' '}
          <strong className="font-medium">phrase matching</strong> to rank candidates by a
          weighted composite score.
        </p>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8 items-start">
        {/* ── Left: Input ── */}
        <div className="xl:col-span-4 space-y-5 xl:sticky xl:top-6">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Dropzone */}
            <div>
              <label className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Resumes · PDF / DOCX · max 10
              </label>
              <div
                onDrop={onDrop}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 flex flex-col items-center justify-center text-center cursor-pointer transition-all ${
                  isDragging
                    ? theme === 'dark'
                      ? 'border-purple-500/60 bg-purple-500/5'
                      : 'border-purple-400 bg-purple-50'
                    : theme === 'dark'
                    ? 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40'
                    : 'border-zinc-200 hover:border-zinc-300 bg-zinc-50'
                }`}
              >
                <Upload className={`w-6 h-6 mb-2 ${
                  theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                }`} />
                <p className={`text-xs font-medium ${
                  theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                }`}>Drag & drop or click to browse</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">PDF & DOCX supported</p>
                <input ref={fileInputRef} type="file" multiple accept=".pdf,.docx" className="hidden"
                  onChange={(e) => e.target.files && addFiles(e.target.files)} />
              </div>
            </div>

            {/* File list */}
            {files.length > 0 && (
              <div className={`rounded-xl border overflow-hidden ${
                theme === 'dark' ? 'border-zinc-800' : 'border-zinc-200'
              }`}>
                <div className={`flex items-center justify-between px-3 py-2 border-b text-[10px] font-bold uppercase tracking-widest ${
                  theme === 'dark' ? 'border-zinc-800 text-zinc-500 bg-zinc-900/60' : 'border-zinc-200 text-zinc-400 bg-zinc-50'
                }`}>
                  <span>{files.length} / 10 files</span>
                  <button type="button" onClick={() => setFiles([])}
                    className={`font-medium transition-colors ${
                      theme === 'dark' ? 'text-zinc-500 hover:text-rose-400' : 'text-zinc-400 hover:text-rose-500'
                    }`}>Clear all</button>
                </div>
                <div className="max-h-44 overflow-y-auto divide-y divide-zinc-100 dark:divide-zinc-800/60">
                  {files.map((f, i) => (
                    <div key={i} className={`flex items-center gap-2.5 px-3 py-2 ${
                      theme === 'dark' ? 'hover:bg-zinc-800/40' : 'hover:bg-zinc-50'
                    }`}>
                      <FileText className="w-3.5 h-3.5 text-zinc-500 shrink-0" />
                      <span className={`text-xs truncate flex-1 ${
                        theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
                      }`}>{f.name}</span>
                      <span className="text-[9px] text-zinc-500 shrink-0">
                        {(f.size / 1024).toFixed(0)}KB
                      </span>
                      <button type="button" onClick={() => removeFile(i)}
                        className="text-zinc-500 hover:text-rose-400 p-0.5 transition-colors"
                        aria-label={`Remove ${f.name}`}>
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Job description */}
            <div>
              <label htmlFor="jd-screen-input" className={`text-[10px] font-bold uppercase tracking-widest block mb-2 ${
                theme === 'dark' ? 'text-zinc-400' : 'text-zinc-500'
              }`}>
                Job Description / Requirements
              </label>
              <textarea id="jd-screen-input" rows={11} value={jdText}
                onChange={(e) => setJdText(e.target.value)} disabled={isLoading}
                placeholder="Paste job description, required skills, responsibilities, and qualifications here..."
                className={`w-full rounded-xl border p-4 text-xs font-light leading-relaxed resize-none focus:outline-none focus:ring-1 transition-all ${
                  theme === 'dark'
                    ? 'bg-zinc-900/20 border-zinc-800 text-zinc-200 placeholder-zinc-600 focus:border-zinc-700 focus:ring-transparent'
                    : 'bg-white border-zinc-200 text-zinc-900 placeholder-zinc-400 focus:border-zinc-300 focus:ring-zinc-200'
                }`} />
              <div className={`flex justify-between text-[10px] mt-1 ${
                theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                <span>Min. 50 chars — more detail = better accuracy</span>
                <span>{jdText.length}</span>
              </div>
            </div>

            {/* Error */}
            {formError && (
              <div className={`p-3 rounded-xl border flex items-start gap-2 text-xs ${
                theme === 'dark'
                  ? 'border-rose-800 bg-rose-950/20 text-rose-400'
                  : 'border-rose-200 bg-rose-50 text-rose-600'
              }`}>
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{formError}</span>
              </div>
            )}

            {/* Submit */}
            <button type="submit" disabled={isLoading} id="screen-submit-btn"
              className={`w-full flex items-center justify-center gap-2 rounded-xl text-xs font-semibold h-11 transition-all disabled:opacity-50 active:scale-[0.98] ${
                theme === 'dark'
                  ? 'bg-zinc-100 text-zinc-950 hover:bg-zinc-200'
                  : 'bg-zinc-900 text-white hover:bg-zinc-800'
              }`}>
              {isLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  Screening {files.length} resume{files.length > 1 ? 's' : ''}…
                </>
              ) : (
                <>
                  <Brain className="w-3.5 h-3.5" />
                  Screen & Rank Candidates
                </>
              )}
            </button>

            {/* How it works */}
            <div className={`rounded-xl border p-4 space-y-2 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40' : 'border-zinc-100 bg-zinc-50'
            }`}>
              <p className={`text-[10px] font-bold uppercase tracking-widest ${
                theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
              }`}>How scoring works</p>
              {[
                ['55%', 'Keyword Coverage', 'purple'],
                ['30%', 'Cosine Similarity (NLP)', 'blue'],
                ['15%', 'Phrase Matching', 'teal'],
              ].map(([pct, label, color]) => (
                <div key={label} className="flex items-center gap-2">
                  <span className={`text-[10px] font-bold w-7 text-${color}-500`}>{pct}</span>
                  <span className={`text-[10px] ${
                    theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                  }`}>{label}</span>
                </div>
              ))}
              <p className={`text-[9px] pt-1 ${
                theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                Final composite = 75% JD match + 25% ATS quality score
              </p>
            </div>
          </form>
        </div>

        {/* ── Right: Results ── */}
        <div className="xl:col-span-8 space-y-5">
          {isLoading ? (
            <div className={`rounded-2xl border border-dashed p-16 flex flex-col items-center text-center gap-5 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div className="relative w-14 h-14">
                <span className={`absolute inset-0 rounded-full animate-ping opacity-40 ${
                  theme === 'dark' ? 'bg-purple-600' : 'bg-purple-300'
                }`} />
                <div className={`relative w-full h-full rounded-full border-2 border-t-purple-500 animate-spin ${
                  theme === 'dark' ? 'border-zinc-700' : 'border-zinc-200'
                }`} />
              </div>
              <div>
                <p className={`text-sm font-semibold ${
                  theme === 'dark' ? 'text-zinc-200' : 'text-zinc-800'
                }`}>Processing {files.length} resume{files.length > 1 ? 's' : ''}…</p>
                <p className={`text-xs mt-1 ${
                  theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                }`}>Extracting text · Computing NLP similarity · Ranking candidates</p>
              </div>
            </div>
          ) : response ? (
            <>
              {/* Stats Banner */}
              <div className={`grid grid-cols-2 sm:grid-cols-4 gap-3`}>
                {[
                  { label: 'Candidates', value: response.total, icon: Users, suffix: '' },
                  { label: 'Top Score', value: response.stats.top_score, icon: Star, suffix: '%' },
                  { label: 'Avg Match', value: response.stats.avg_match, icon: Target, suffix: '%' },
                  { label: 'Avg ATS', value: response.stats.avg_ats, icon: BarChart2, suffix: '' },
                ].map(({ label, value, icon: Icon, suffix }) => (
                  <div key={label} className={card}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${
                        theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                      }`}>{label}</span>
                      <Icon className={`w-3.5 h-3.5 ${
                        theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                      }`} />
                    </div>
                    <p className={`text-xl font-bold ${
                      theme === 'dark' ? 'text-zinc-100' : 'text-zinc-900'
                    }`}>{value}{suffix}</p>
                  </div>
                ))}
              </div>

              {/* Controls */}
              <div className={`flex flex-wrap items-center justify-between gap-3`}>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-[10px] font-bold uppercase tracking-widest flex items-center gap-1 ${
                    theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                  }`}>
                    <ArrowUpDown className="w-3 h-3" /> Sort by
                  </span>
                  {([
                    ['composite_score', 'Composite'],
                    ['match_percentage', 'JD Match'],
                    ['ats_score', 'ATS'],
                    ['keyword_score', 'Keywords'],
                  ] as [SortKey, string][]).map(([key, label]) => (
                    <button key={key} onClick={() => setSortKey(key)}
                      className={`text-[10px] font-semibold px-2.5 py-1 rounded-lg border transition-all ${
                        sortKey === key
                          ? theme === 'dark'
                            ? 'bg-zinc-100 text-zinc-950 border-zinc-100'
                            : 'bg-zinc-900 text-white border-zinc-900'
                          : theme === 'dark'
                          ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                          : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                      }`}>
                      {label}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Filter className={`w-3 h-3 ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                    }`} />
                    <span className={`text-[10px] ${
                      theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                    }`}>Min {minScore}%</span>
                    <input type="range" min={0} max={80} step={5} value={minScore}
                      onChange={(e) => setMinScore(Number(e.target.value))}
                      className="w-20 accent-purple-500" />
                  </div>
                  <button onClick={exportCSV}
                    className={`flex items-center gap-1.5 text-[10px] font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                      theme === 'dark'
                        ? 'border-zinc-800 text-zinc-400 hover:border-zinc-700 hover:text-zinc-200'
                        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 hover:text-zinc-800'
                    }`}>
                    <Download className="w-3 h-3" /> CSV
                  </button>
                </div>
              </div>

              {/* Candidate Cards */}
              {sortedResults.length === 0 ? (
                <div className={`text-center py-10 text-xs ${
                  theme === 'dark' ? 'text-zinc-500' : 'text-zinc-400'
                }`}>
                  No candidates above {minScore}% threshold. Lower the filter to see all results.
                </div>
              ) : (
                <div className="space-y-4">
                  {sortedResults.map((r) => (
                    <ResultCard key={r.filename + r.rank} result={r} theme={theme} />
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Empty state */
            <div className={`rounded-2xl border border-dashed min-h-[480px] flex flex-col items-center justify-center text-center p-12 ${
              theme === 'dark' ? 'border-zinc-800 bg-zinc-900/30' : 'border-zinc-200 bg-zinc-50'
            }`}>
              <div className={`p-4 rounded-2xl border mb-4 ${
                theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'
              }`}>
                <Brain className="w-7 h-7" />
              </div>
              <h3 className={`text-sm font-semibold mb-1 ${
                theme === 'dark' ? 'text-zinc-300' : 'text-zinc-700'
              }`}>Awaiting Resumes & Job Description</h3>
              <p className={`text-[11px] max-w-sm leading-relaxed mb-8 ${
                theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
              }`}>
                Upload PDFs or DOCX files and paste a job description. The NLP engine will
                extract, analyze, and rank all candidates automatically.
              </p>
              <div className="grid grid-cols-3 gap-6 w-full max-w-sm">
                {[
                  { Icon: Upload, label: '1. Upload', desc: 'Multiple resumes' },
                  { Icon: Brain, label: '2. Analyze', desc: 'NLP + Cosine sim' },
                  { Icon: TrendingUp, label: '3. Rank', desc: 'Composite score' },
                ].map(({ Icon, label, desc }) => (
                  <div key={label} className="flex flex-col items-center gap-2">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                      theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-zinc-500' : 'bg-white border-zinc-200 text-zinc-400'
                    }`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <p className={`text-[10px] font-bold ${
                      theme === 'dark' ? 'text-zinc-400' : 'text-zinc-600'
                    }`}>{label}</p>
                    <p className={`text-[9px] ${
                      theme === 'dark' ? 'text-zinc-600' : 'text-zinc-400'
                    }`}>{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
