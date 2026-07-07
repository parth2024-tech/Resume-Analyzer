import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useResume } from '../context/ResumeContext';
import type { RatingPillar, RatingSuggestion } from '../context/ResumeContext';
import {
  Star, TrendingUp, Target, AlertTriangle, CheckCircle,
  ChevronDown, ChevronUp, Zap, Award, BarChart3, Trophy,
  Users, BookOpen, Cpu, Layout, Briefcase
} from 'lucide-react';

const IMPACT_CONFIG = {
  Critical: { color: 'text-rose-600 dark:text-rose-400', bg: 'bg-rose-50 dark:bg-rose-950/20', border: 'border-rose-200 dark:border-rose-900/50', dot: 'bg-rose-500' },
  High:     { color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-900/50', dot: 'bg-amber-500' },
  Medium:   { color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-900/50', dot: 'bg-blue-500' },
  Low:      { color: 'text-zinc-600 dark:text-zinc-400', bg: 'bg-zinc-50 dark:bg-zinc-900/20', border: 'border-zinc-200 dark:border-zinc-800', dot: 'bg-zinc-400' },
} as const;

const PILLAR_ICONS: Record<string, React.ReactNode> = {
  content_depth:          <BookOpen className="w-4 h-4" />,
  technical_strength:     <Cpu className="w-4 h-4" />,
  structure_formatting:   <Layout className="w-4 h-4" />,
  career_progression:     <TrendingUp className="w-4 h-4" />,
  market_competitiveness: <Trophy className="w-4 h-4" />,
};

const GRADE_COLORS: Record<string, { text: string; bg: string; border: string; ring: string }> = {
  'A+': { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-800', ring: '#10b981' },
  'A':  { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-800', ring: '#10b981' },
  'A-': { text: 'text-emerald-600 dark:text-emerald-400', bg: 'bg-emerald-50 dark:bg-emerald-950/30', border: 'border-emerald-300 dark:border-emerald-800', ring: '#10b981' },
  'B+': { text: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-950/30',       border: 'border-cyan-300 dark:border-cyan-800',       ring: '#06b6d4' },
  'B':  { text: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-950/30',       border: 'border-cyan-300 dark:border-cyan-800',       ring: '#06b6d4' },
  'B-': { text: 'text-cyan-600 dark:text-cyan-400',     bg: 'bg-cyan-50 dark:bg-cyan-950/30',       border: 'border-cyan-300 dark:border-cyan-800',       ring: '#06b6d4' },
  'C+': { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-300 dark:border-amber-800',     ring: '#f59e0b' },
  'C':  { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-300 dark:border-amber-800',     ring: '#f59e0b' },
  'C-': { text: 'text-amber-600 dark:text-amber-400',   bg: 'bg-amber-50 dark:bg-amber-950/30',     border: 'border-amber-300 dark:border-amber-800',     ring: '#f59e0b' },
  'D':  { text: 'text-orange-600 dark:text-orange-400', bg: 'bg-orange-50 dark:bg-orange-950/30',   border: 'border-orange-300 dark:border-orange-800',   ring: '#f97316' },
  'F':  { text: 'text-rose-600 dark:text-rose-400',     bg: 'bg-rose-50 dark:bg-rose-950/30',       border: 'border-rose-300 dark:border-rose-800',       ring: '#f43f5e' },
};

function PillarBar({ pillar, index }: { pillar: RatingPillar; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const scoreColor = pillar.score >= 80 ? '#10b981' : pillar.score >= 60 ? '#f59e0b' : '#f43f5e';
  const scoreTextColor = pillar.score >= 80
    ? 'text-emerald-600 dark:text-emerald-400'
    : pillar.score >= 60
    ? 'text-amber-600 dark:text-amber-400'
    : 'text-rose-600 dark:text-rose-400';

  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.08 }}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden"
    >
      {/* Pillar Header */}
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center gap-3 p-4 bg-white dark:bg-zinc-900/60 hover:bg-zinc-50 dark:hover:bg-zinc-900/80 transition-colors text-left group"
      >
        <div className="shrink-0 p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
          {PILLAR_ICONS[pillar.id] || <Star className="w-4 h-4" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">{pillar.label}</span>
            <div className="flex items-center gap-2">
              {pillar.suggestions.length > 0 && (
                <span className="text-[9px] font-semibold text-zinc-500 dark:text-zinc-500">
                  {pillar.suggestions.length} tip{pillar.suggestions.length !== 1 ? 's' : ''}
                </span>
              )}
              <span className={`text-sm font-bold tabular-nums ${scoreTextColor}`}>{pillar.score}</span>
              <span className="text-[9px] text-zinc-400">/100</span>
            </div>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 w-full rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: scoreColor }}
              initial={{ width: 0 }}
              animate={{ width: `${pillar.score}%` }}
              transition={{ duration: 0.8, delay: index * 0.08 + 0.2, ease: 'easeOut' }}
            />
          </div>
        </div>

        <div className="shrink-0 text-zinc-400 group-hover:text-zinc-600 dark:group-hover:text-zinc-300 transition-colors">
          {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </div>
      </button>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {expanded && pillar.suggestions.length > 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
          >
            <div className="p-3 space-y-2 bg-zinc-50/50 dark:bg-zinc-950/30">
              {pillar.suggestions.map((sug, si) => {
                const cfg = IMPACT_CONFIG[sug.impact as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG.Low;
                return (
                  <div key={si} className={`flex gap-3 p-3 rounded-lg border ${cfg.bg} ${cfg.border}`}>
                    <span className="text-base leading-none shrink-0 mt-0.5">{sug.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5">
                        <span className="text-[10px] font-bold text-zinc-700 dark:text-zinc-300 leading-tight">{sug.title}</span>
                        <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded ${cfg.bg} ${cfg.color} ${cfg.border} border`}>
                          {sug.impact}
                        </span>
                      </div>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-light">{sug.detail}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
        {expanded && pillar.suggestions.length === 0 && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden border-t border-zinc-100 dark:border-zinc-800"
          >
            <div className="flex items-center gap-2 p-4 bg-emerald-50/50 dark:bg-emerald-950/10">
              <CheckCircle className="w-4 h-4 text-emerald-500 shrink-0" />
              <span className="text-xs text-emerald-700 dark:text-emerald-400 font-light">
                Excellent — no improvements needed in this category!
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function SuggestionCard({ sug, index }: { sug: RatingSuggestion; index: number }) {
  const cfg = IMPACT_CONFIG[sug.impact as keyof typeof IMPACT_CONFIG] || IMPACT_CONFIG.Low;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.07 }}
      className={`flex gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border} hover:shadow-sm transition-shadow`}
    >
      <span className="text-xl leading-none shrink-0 mt-0.5">{sug.icon}</span>
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200">{sug.title}</span>
          <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
            {sug.impact}
          </span>
        </div>
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500 leading-relaxed font-light">{sug.detail}</p>
      </div>
    </motion.div>
  );
}

export default function ResumeRating() {
  const { ratingData } = useResume();
  const [activeView, setActiveView] = useState<'pillars' | 'suggestions'>('pillars');

  if (!ratingData) return null;

  const { overall_score, grade, percentile, readiness, pillars, top_suggestions, critical_count, high_count } = ratingData;
  const gradeStyle = GRADE_COLORS[grade] || GRADE_COLORS['F'];

  const circumference = 2 * Math.PI * 52;
  const offset = circumference - (overall_score / 100) * circumference;
  const strokeColor = gradeStyle.ring;

  return (
    <section className="bg-white dark:bg-zinc-900/80 border border-zinc-200 dark:border-zinc-900 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
      
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-900/60">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 dark:bg-violet-950/20 dark:border-violet-900/50 dark:text-violet-400">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-zinc-900 dark:text-zinc-200 uppercase tracking-widest">Resume Rating</h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 font-light">5-pillar professional evaluation</p>
          </div>
        </div>

        {/* View toggle */}
        <div className="flex p-0.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950/60">
          {(['pillars', 'suggestions'] as const).map(v => (
            <button
              key={v}
              onClick={() => setActiveView(v)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeView === v
                  ? 'bg-white text-zinc-900 dark:bg-zinc-100 dark:text-zinc-950 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-white'
              }`}
            >
              {v === 'pillars' ? '📊 Pillars' : '💡 Actions'}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6 space-y-6">

        {/* Overall score row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">

          {/* Score gauge */}
          <div className="flex flex-col items-center justify-center gap-3 p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800">
            <div className="relative w-28 h-28 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" stroke="#e4e4e7" strokeWidth="8" fill="transparent" className="dark:stroke-zinc-800" />
                <motion.circle
                  cx="60" cy="60" r="52"
                  stroke={strokeColor} strokeWidth="8" fill="transparent"
                  strokeDasharray={circumference}
                  initial={{ strokeDashoffset: circumference }}
                  animate={{ strokeDashoffset: offset }}
                  transition={{ duration: 1.2, ease: 'easeOut' }}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <motion.span
                  className="text-2xl font-bold tabular-nums text-zinc-900 dark:text-zinc-100"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
                >{overall_score}</motion.span>
                <span className="text-[8px] text-zinc-400 uppercase tracking-widest font-semibold">/100</span>
              </div>
            </div>
            <div className="text-center">
              <span className={`text-lg font-black px-3 py-1 rounded-xl border ${gradeStyle.text} ${gradeStyle.bg} ${gradeStyle.border}`}>
                Grade {grade}
              </span>
            </div>
          </div>

          {/* Readiness + percentile */}
          <div className="md:col-span-2 flex flex-col gap-3">
            {/* Readiness */}
            <div className="flex-1 flex flex-col justify-center p-4 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800">
              <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Hiring Readiness</span>
              <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-1">{readiness.level}</p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-500 font-light leading-relaxed">{readiness.description}</p>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="flex flex-col items-center p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/30 border border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] text-zinc-400 font-light mb-1 flex items-center gap-1">
                  <Users className="w-3 h-3" /> Beats
                </span>
                <span className="text-xl font-black text-violet-600 dark:text-violet-400">{percentile}%</span>
                <span className="text-[9px] text-zinc-400">of applicants</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30">
                <span className="text-[10px] text-rose-500 font-light mb-1 flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Critical
                </span>
                <span className="text-xl font-black text-rose-600 dark:text-rose-400">{critical_count}</span>
                <span className="text-[9px] text-rose-400">issues</span>
              </div>
              <div className="flex flex-col items-center p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30">
                <span className="text-[10px] text-amber-500 font-light mb-1 flex items-center gap-1">
                  <Zap className="w-3 h-3" /> High
                </span>
                <span className="text-xl font-black text-amber-600 dark:text-amber-400">{high_count}</span>
                <span className="text-[9px] text-amber-400">priority</span>
              </div>
            </div>
          </div>
        </div>

        {/* Pillar / Suggestion tabs */}
        <AnimatePresence mode="wait">
          {activeView === 'pillars' ? (
            <motion.div
              key="pillars"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Target className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">5 Evaluation Pillars</span>
                <span className="text-[9px] text-zinc-400 ml-auto">Click a pillar to see tips</span>
              </div>
              {pillars.map((pillar, i) => (
                <PillarBar key={pillar.id} pillar={pillar} index={i} />
              ))}
            </motion.div>
          ) : (
            <motion.div
              key="suggestions"
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
              className="space-y-2"
            >
              <div className="flex items-center gap-1.5 mb-3">
                <Award className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Top Prioritised Actions</span>
                <span className="text-[9px] text-zinc-400 ml-auto">Sorted by impact</span>
              </div>
              {top_suggestions.length > 0 ? (
                top_suggestions.map((sug, i) => (
                  <SuggestionCard key={i} sug={sug} index={i} />
                ))
              ) : (
                <div className="flex flex-col items-center gap-3 py-10 text-center">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <p className="text-sm font-medium text-zinc-600 dark:text-zinc-400">No major issues found!</p>
                  <p className="text-xs text-zinc-400 font-light">Your resume scores well across all evaluated pillars.</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom progress overview */}
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-zinc-400 font-light uppercase tracking-widest">Overall progress</span>
            <span className="text-[10px] font-bold text-zinc-500">{overall_score}/100 pts</span>
          </div>
          <div className="grid grid-cols-5 gap-1">
            {pillars.map((p) => (
              <div key={p.id} className="flex flex-col items-center gap-1">
                <div className="w-full h-1.5 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                  <motion.div
                    className="h-full rounded-full"
                    style={{
                      backgroundColor: p.score >= 80 ? '#10b981' : p.score >= 60 ? '#f59e0b' : '#f43f5e',
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${p.score}%` }}
                    transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                  />
                </div>
                <span className="text-[8px] text-zinc-400 text-center leading-tight font-light">{p.label.split(' ')[0]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
