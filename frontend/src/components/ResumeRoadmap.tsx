import { useResume } from '../context/ResumeContext';

interface RoadmapItem {
  id: string;
  priority: 'Critical' | 'High' | 'Medium' | 'Low';
  action: string;
  atsGain: number;
  description: string;
}

export default function ResumeRoadmap() {
  const { atsData, analysisData } = useResume();

  if (!atsData || !analysisData) return null;

  const roadmap: RoadmapItem[] = (analysisData.insights.timeline || []) as RoadmapItem[];

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'Critical':
        return 'bg-rose-50 dark:bg-rose-500/15 border-rose-200 dark:border-rose-900/50 text-rose-700 dark:text-rose-400';
      case 'High':
        return 'bg-amber-50 dark:bg-amber-500/15 border-amber-200 dark:border-amber-900/50 text-amber-700 dark:text-amber-400';
      case 'Medium':
        return 'bg-cyan-50 dark:bg-cyan-500/15 border-cyan-200 dark:border-cyan-900/50 text-purple-700 dark:text-[#0ef6cc]';
      default:
        return 'bg-zinc-50 dark:bg-[#1e3a5f]/40 border-[#c8ddf0] dark:border-zinc-700 text-zinc-700 dark:text-[#a0bdd4]';
    }
  };

  return (
    <div className="bg-white dark:bg-[#0a1628]/80 border border-[#c8ddf0] dark:border-[#162340] rounded-2xl p-6 text-left space-y-6 shadow-sm hover:shadow-md transition-shadow">
      <div>
        <span className="text-[10px] font-bold text-[#5d7a96] dark:text-[#5d7a96] uppercase tracking-widest block">Optimization Path</span>
        <span className="text-xs text-[#5d7a96] dark:text-[#a0bdd4] font-light mt-0.5 block">Visual roadmap to maximize ATS performance scoring</span>
      </div>

      <div className="space-y-4">
        {roadmap.map((item) => (
          <div key={item.id} className="p-4 rounded-xl border border-[#c8ddf0] dark:border-[#162340] bg-[#e8f4f8]/30 dark:bg-zinc-955/40 flex flex-col sm:flex-row justify-between gap-4">
            <div className="space-y-1 max-w-xl">
              <div className="flex items-center gap-2 flex-wrap">
                <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${getPriorityColor(item.priority)}`}>
                  {item.priority}
                </span>
                <span className="text-xs font-semibold text-[#050a14] dark:text-[#c8ddf0]">{item.action}</span>
              </div>
              <p className="text-[11px] text-[#5d7a96] dark:text-[#7a9db8] font-light leading-relaxed">{item.description}</p>
            </div>

            <div className="flex sm:flex-col items-end justify-between sm:justify-center shrink-0 self-end sm:self-center">
              <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/25 border border-emerald-200 dark:border-emerald-900 px-2 py-1 rounded flex items-center gap-1">
                +{item.atsGain} ATS Points
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
