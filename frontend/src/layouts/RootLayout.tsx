import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useResume } from '../context/ResumeContext';
import { useTheme } from '../context/ThemeContext';
import AIChatPanel from '../components/AIChatPanel';
import {
  LayoutDashboard,
  Briefcase,
  Users,
  ChevronLeft,
  Menu,
  Trash2,
  Edit3,
  Sun,
  Moon,
  MessageSquare,
  Calendar,
  LogOut,
  X,
  Brain,
  Zap,
  Sparkles,
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

export default function RootLayout() {
  const {
    uploadedFile,
    history,
    activeResumeId,
    switchResume,
    deleteResume,
    renameResume,
    clearState
  } = useResume();
  const { theme, toggleTheme } = useTheme();

  const location = useLocation();
  const navigate = useNavigate();
  const isAppView =
    location.pathname === '/analyze' ||
    location.pathname === '/match' ||
    location.pathname === '/recruit';

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (!isAppView) {
      setIsAssistantOpen(false);
      setIsMobileMenuOpen(false);
    }
  }, [isAppView]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMobileMenuOpen) setIsMobileMenuOpen(false);
        if (isAssistantOpen) setIsAssistantOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMobileMenuOpen, isAssistantOpen]);

  const [renameId, setRenameId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const handleReset = () => {
    clearState();
    navigate('/');
  };

  const handleRenameSubmit = (e: React.FormEvent, id: string) => {
    e.preventDefault();
    if (renameValue.trim()) renameResume(id, renameValue.trim());
    setRenameId(null);
    setRenameValue('');
  };

  const startRename = (id: string, currentName: string) => {
    setRenameId(id);
    setRenameValue(currentName);
  };

  // ── Nav links with new routes ──────────────────────────────────────────────
  const links = [
    { to: '/analyze', label: 'Analysis', icon: LayoutDashboard },
    { to: '/match', label: 'Job Match', icon: Briefcase },
    { to: '/recruit', label: 'Recruiting', icon: Users },
  ];

  // ── Theme-aware class shortcuts ────────────────────────────────────────────
  const isDark = theme === 'dark';
  const bg = isDark ? 'bg-[#050a14]' : 'bg-[#f0f6ff]';
  const text = isDark ? 'text-[#e8f4f8]' : 'text-[#0a1628]';
  const border = isDark ? 'border-[#162340]' : 'border-[#c8ddf0]';
  const sidebarBg = isDark ? 'bg-[#050a14]/80 backdrop-blur-xl' : 'bg-white shadow-sm';
  const cardBg = isDark ? 'bg-[#0a1628]' : 'bg-[#f0f6ff]';
  const mutedText = isDark ? 'text-[#5d7a96]' : 'text-[#4a6a8a]';

  return (
    <div className={`min-h-screen flex relative ${
      isAppView ? 'overflow-hidden' : 'overflow-y-auto overflow-x-hidden'
    } transition-colors duration-300 ${bg} ${text}`}>

      {/* Mesh background */}
      <div className="absolute inset-0 bg-mesh pointer-events-none -z-10" />
      {isDark && <div className="absolute inset-0 bg-scanline opacity-30 pointer-events-none -z-10" />}

      {/* Ambient glows */}
      {isDark ? (
        <>
          <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-cyan-500/3 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-500/3 rounded-full blur-[120px] pointer-events-none -z-10" />
        </>
      ) : (
        <>
          <div className="absolute top-[-15%] left-[-5%] w-[500px] h-[500px] bg-cyan-200/20 rounded-full blur-[120px] pointer-events-none -z-10" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[400px] h-[400px] bg-amber-100/30 rounded-full blur-[120px] pointer-events-none -z-10" />
        </>
      )}

      {/* ── APP VIEW ─────────────────────────────────────────────────────────── */}
      {isAppView ? (
        <div className="flex w-full min-h-screen relative">

          {/* Desktop Sidebar */}
          <motion.aside
            initial={{ width: 240 }}
            animate={{ width: isSidebarOpen ? 240 : 64 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`hidden md:flex flex-col border-r shrink-0 relative z-30 h-screen sticky top-0 ${border} ${sidebarBg}`}
          >
            {/* Sidebar Header — CerebroAI branding */}
            <div className={`h-14 flex items-center justify-between px-4 border-b ${border}`}>
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className={`p-1.5 rounded-lg flex items-center justify-center shrink-0 border ${
                  isDark ? 'bg-[#0a1628] border-[#162340]' : 'bg-[#e8f4f8] border-[#c8ddf0]'
                }`}>
                  <Brain className="w-4 h-4 text-[#0ef6cc]" />
                </div>
                {isSidebarOpen && (
                  <span className="font-semibold text-xs tracking-wider uppercase text-[#0ef6cc] truncate font-display">
                    CerebroAI
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className={`p-1 rounded-md transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${mutedText} hover:${text}`}
                title={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
                aria-label={isSidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
              >
                <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isSidebarOpen ? 'rotate-180' : ''}`} />
              </button>
            </div>

            {/* Sidebar Nav */}
            <div className="flex-1 pt-4 pb-32 px-3 overflow-y-auto">
              <div className="space-y-6">
                <nav className="space-y-1">
                  {links.map((link) => {
                    const Icon = link.icon;
                    return (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        className={({ isActive }) =>
                          `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs tracking-wide transition-all duration-200 group ${
                            isActive
                              ? isDark
                                ? 'text-[#0ef6cc] bg-[#0ef6cc]/8 border border-[#0ef6cc]/20 font-medium'
                                : 'text-[#0891b2] bg-[#0ef6cc]/10 border border-[#0ef6cc]/25 font-semibold'
                              : isDark
                              ? 'text-[#5d7a96] hover:text-[#e8f4f8] hover:bg-[#0a1628]/60'
                              : 'text-[#4a6a8a] hover:text-[#0a1628] hover:bg-[#e8f4f8]/60'
                          }`
                        }
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        {isSidebarOpen && <span>{link.label}</span>}
                      </NavLink>
                    );
                  })}
                </nav>

                {/* Resume History */}
                {isSidebarOpen && (
                  <div className="space-y-3 pt-2">
                    <span className={`text-[10px] font-bold uppercase tracking-widest block px-3 ${mutedText}`}>
                      Session History
                    </span>
                    <div className="space-y-1 max-h-[220px] overflow-y-auto pr-1">
                      {history.map((item) => (
                        <div
                          key={item.id}
                          className={`group flex items-center justify-between p-2 rounded-lg text-left transition-all ${
                            activeResumeId === item.id
                              ? isDark
                                ? 'bg-[#0a1628] text-[#e8f4f8] border border-[#162340]'
                                : 'bg-white text-[#0a1628] border border-[#c8ddf0] shadow-sm'
                              : isDark
                              ? 'text-[#5d7a96] hover:bg-[#0a1628]/40'
                              : 'text-[#4a6a8a] hover:bg-[#e8f4f8]/60 hover:text-[#0a1628]'
                          }`}
                        >
                          {renameId === item.id ? (
                            <form onSubmit={(e) => handleRenameSubmit(e, item.id)} className="w-full flex items-center">
                              <input
                                type="text"
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onBlur={(e) => handleRenameSubmit(e, item.id)}
                                autoFocus
                                className={`w-full border rounded px-1.5 py-0.5 text-xs focus:outline-none ${
                                  isDark
                                    ? 'bg-[#050a14] border-[#162340] text-[#e8f4f8]'
                                    : 'bg-white border-[#c8ddf0] text-[#0a1628]'
                                }`}
                              />
                            </form>
                          ) : (
                            <div
                              onClick={() => switchResume(item.id)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ') {
                                  e.preventDefault();
                                  switchResume(item.id);
                                }
                              }}
                              tabIndex={0}
                              role="button"
                              aria-label={`Select resume ${item.filename}`}
                              className="flex-1 min-w-0 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] rounded px-1"
                            >
                              <span className="text-xs truncate block font-medium">{item.filename}</span>
                              <span className={`text-[9px] ${mutedText} font-light flex items-center gap-1 mt-0.5`}>
                                <Calendar className="w-2.5 h-2.5" />
                                {item.uploadDate}
                              </span>
                            </div>
                          )}

                          {renameId !== item.id && (
                            <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity pl-2">
                              <button
                                onClick={() => startRename(item.id, item.filename)}
                                className={`${mutedText} hover:text-[#0ef6cc] p-0.5 rounded focus-visible:outline-none`}
                                title="Rename"
                                aria-label={`Rename resume ${item.filename}`}
                              >
                                <Edit3 className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => deleteResume(item.id)}
                                className={`${mutedText} hover:text-rose-400 p-0.5 rounded focus-visible:outline-none`}
                                title="Delete"
                                aria-label={`Delete resume ${item.filename}`}
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </div>
                      ))}
                      {history.length === 0 && (
                        <span className={`text-[11px] ${mutedText} font-light block px-3`}>
                          No uploads yet.
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar Footer */}
            <div className={`fixed left-0 bottom-0 z-50 border-t p-3 transition-all duration-300 ${
              isSidebarOpen ? 'w-[240px]' : 'w-[64px]'
            } ${border} ${isDark ? 'bg-[#050a14]/95 backdrop-blur-md' : 'bg-white'}`}>
              <div className="space-y-1">
                <button
                  onClick={toggleTheme}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs w-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${mutedText} hover:${text} hover:bg-[#0a1628]/40`}
                  aria-label="Toggle dark/light theme"
                >
                  {isDark ? (
                    <><Sun className="w-4 h-4 shrink-0" />{isSidebarOpen && <span>Light Mode</span>}</>
                  ) : (
                    <><Moon className="w-4 h-4 shrink-0" />{isSidebarOpen && <span>Dark Mode</span>}</>
                  )}
                </button>
                <button
                  onClick={handleReset}
                  className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs w-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${mutedText} hover:text-rose-400`}
                  aria-label="Exit workspace"
                >
                  <LogOut className="w-4 h-4 shrink-0" />
                  {isSidebarOpen && <span>Exit Session</span>}
                </button>
              </div>
            </div>
          </motion.aside>

          {/* Mobile backdrop */}
          {isMobileMenuOpen && isMobile && (
            <div
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-sm z-40 pointer-events-auto"
            />
          )}

          {/* Mobile Drawer */}
          {isMobileMenuOpen && isMobile && (
            <div className={`fixed inset-y-0 left-0 w-64 border-r z-50 flex flex-col p-4 ${border} ${isDark ? 'bg-[#050a14]' : 'bg-white'}`}>
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4 text-[#0ef6cc]" />
                  <span className="font-semibold text-xs tracking-wider uppercase text-[#0ef6cc] font-display">CerebroAI</span>
                </div>
                <button onClick={() => setIsMobileMenuOpen(false)} className={`p-1 ${mutedText} hover:${text}`}>
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1 mb-6">
                {links.map((link) => {
                  const Icon = link.icon;
                  return (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs transition-all ${
                          isActive
                            ? 'text-[#0ef6cc] bg-[#0ef6cc]/10 border border-[#0ef6cc]/20 font-medium'
                            : `${mutedText} hover:${text} hover:bg-[#0a1628]/40`
                        }`
                      }
                    >
                      <Icon className="w-4 h-4" />
                      <span>{link.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="space-y-1 border-t pt-4" style={{ borderColor: '#162340' }}>
                <button onClick={toggleTheme} className={`flex items-center gap-3 px-3 py-2 rounded-lg text-xs w-full ${mutedText}`}>
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                  <span>Toggle Theme</span>
                </button>
                <button onClick={handleReset} className="flex items-center gap-3 px-3 py-2 rounded-lg text-xs w-full text-rose-400">
                  <LogOut className="w-4 h-4" />
                  <span>Exit Session</span>
                </button>
              </div>
            </div>
          )}

          {/* Main content area */}
          <div className="flex-1 flex min-w-0 relative">
            <div className="flex-1 flex flex-col min-w-0">

              {/* Top Bar */}
              <header className={`h-14 border-b flex items-center justify-between px-4 sm:px-6 md:px-8 backdrop-blur-md z-20 ${border} ${isDark ? 'bg-[#050a14]/20' : 'bg-white/60'}`}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setIsMobileMenuOpen(true)}
                    className={`md:hidden p-1.5 rounded-lg border ${mutedText} hover:${text} focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${isDark ? 'border-[#162340] bg-[#0a1628]' : 'border-[#c8ddf0] bg-[#e8f4f8]'}`}
                    aria-label="Open navigation menu"
                  >
                    <Menu className="w-4 h-4" />
                  </button>
                  <div className={`flex items-center gap-2 text-[10px] ${mutedText} font-semibold tracking-wider uppercase`}>
                    <NavLink to="/" className="hover:text-[#0ef6cc] transition-colors">Home</NavLink>
                    <span>/</span>
                    <span className={isDark ? 'text-[#e8f4f8]' : 'text-[#0a1628]'}>
                      {location.pathname.replace('/', '')}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setIsAssistantOpen(!isAssistantOpen)}
                    className={`inline-flex items-center gap-2 rounded-xl text-xs font-semibold h-9 px-4 transition-all border shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${
                      isAssistantOpen
                        ? 'bg-[#0ef6cc]/10 text-[#0ef6cc] border-[#0ef6cc]/30'
                        : isDark
                        ? `border-[#162340] bg-[#0a1628] ${mutedText} hover:text-[#e8f4f8]`
                        : `border-[#c8ddf0] bg-white text-[#4a6a8a] hover:text-[#0a1628] hover:bg-[#e8f4f8]`
                    }`}
                    aria-label="Toggle AI Assistant"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">AI Assistant</span>
                  </button>

                  <NavLink
                    to="/"
                    className={`text-xs font-medium py-1.5 px-3 rounded-lg border shadow-sm transition-all focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${
                      isDark
                        ? `border-[#162340] bg-[#0a1628] ${mutedText} hover:text-[#e8f4f8]`
                        : `border-[#c8ddf0] bg-white text-[#4a6a8a] hover:text-[#0a1628] hover:bg-[#e8f4f8]`
                    }`}
                    aria-label="Go to home page"
                  >
                    Home
                  </NavLink>
                </div>
              </header>

              {/* Page content */}
              <main className="flex-1 px-4 sm:px-6 md:px-8 py-8 max-w-[1400px] w-full mx-auto overflow-y-auto">
                <Outlet />
              </main>
            </div>

            {/* AI Chat Panel */}
            {isAssistantOpen && (
              <div className={`fixed right-0 top-0 h-screen w-80 z-50 flex flex-col border-l shadow-2xl overflow-y-auto ${border} ${isDark ? 'bg-[#050a14]' : 'bg-white'}`}>
                <AIChatPanel onClose={() => setIsAssistantOpen(false)} />
              </div>
            )}
          </div>
        </div>

      ) : (
        // ── LANDING PAGE ──────────────────────────────────────────────────────
        <div className="flex-1 flex flex-col min-w-0">
          <header className={`sticky top-0 z-50 border-b backdrop-blur-xl ${border} ${isDark ? 'bg-[#050a14]/60' : 'bg-[#f0f6ff]/80'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
              {/* CerebroAI Logo */}
              <div className="flex items-center gap-2.5">
                <div className={`p-1.5 rounded-lg border ${isDark ? 'bg-[#0a1628] border-[#162340]' : 'bg-[#e8f4f8] border-[#c8ddf0]'}`}>
                  <Brain className="w-4 h-4 text-[#0ef6cc]" />
                </div>
                <span className="font-semibold text-sm tracking-tight font-display">
                  Cerebro<span className="text-[#0ef6cc]">AI</span>
                </span>
              </div>

              <nav className="flex items-center gap-4">
                <button
                  onClick={toggleTheme}
                  className={`p-1.5 rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#0ef6cc] ${
                    isDark
                      ? `border-[#162340] bg-[#0a1628]/50 ${mutedText} hover:text-[#e8f4f8]`
                      : `border-[#c8ddf0] bg-[#e8f4f8]/40 text-[#4a6a8a] hover:text-[#0a1628]`
                  }`}
                  title="Toggle Theme"
                  aria-label="Toggle dark/light theme"
                >
                  {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>

                {uploadedFile ? (
                  <NavLink
                    to="/analyze"
                    className="text-xs font-semibold bg-[#0ef6cc] text-[#050a14] hover:bg-[#0ef6cc]/90 transition-all py-1.5 px-4 rounded-lg shadow-sm"
                  >
                    Open Dashboard
                  </NavLink>
                ) : (
                  <a
                    href="#upload-zone"
                    className="text-xs font-semibold bg-[#0ef6cc] text-[#050a14] hover:bg-[#0ef6cc]/90 transition-all py-1.5 px-4 rounded-lg shadow-sm"
                  >
                    Get Started
                  </a>
                )}
              </nav>
            </div>
          </header>

          <main className="flex-grow">
            <Outlet />
          </main>

          <footer className={`border-t py-12 mt-12 ${border} ${isDark ? 'bg-[#050a14]/80 text-[#5d7a96]' : 'bg-[#f0f6ff] text-[#4a6a8a]'}`}>
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6 text-xs">
              <div className="flex items-center gap-2">
                <Brain className="w-3.5 h-3.5 text-[#0ef6cc]" />
                <span className="font-semibold font-display">CerebroAI</span>
                <span>—</span>
                <span>Neural resume intelligence.</span>
              </div>
              <div className="flex gap-6">
                <a href="https://github.com/parth2024-tech/Resume-Analyzer" target="_blank" rel="noopener noreferrer" className="hover:text-[#0ef6cc] transition-colors">GitHub</a>
                <a href="#" className="hover:text-[#0ef6cc] transition-colors">Privacy</a>
                <a href="#" className="hover:text-[#0ef6cc] transition-colors">Terms</a>
              </div>
              <span className="text-[10px]">© 2026 CerebroAI · Built by Parth Gupta</span>
            </div>
          </footer>
        </div>
      )}
    </div>
  );
}
