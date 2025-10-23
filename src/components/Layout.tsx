import React from 'react';
import type { User, Page } from '@/types';
import { Page as PageEnum } from '@/types';

interface LayoutProps {
  user?: User | null;
  onLogout: () => void;
  currentPage: Page;
  setCurrentPage: (p: Page) => void;
  soundService: any;
  tutorialHighlight: number | null;
  theme: 'classic' | 'modern';
  onToggleTheme: () => void;
  children: React.ReactNode;
}

const TABS: Array<{ key: Page; label: string }> = [
  { key: PageEnum.PROFILE, label: 'Profile' },
  { key: PageEnum.LEADERBOARD, label: 'Leaderboard' },
  { key: PageEnum.PLAY, label: 'Play' },
  { key: PageEnum.SHOP, label: 'Shop' },
];

const Avatar: React.FC<{ src?: string; alt: string }> = ({ src, alt }) => {
  if (src) {
    return (
      <img
        src={src}
        alt={alt}
        className="w-8 h-8 rounded-full border border-cyan-400 object-cover"
      />
    );
  }
  return (
    <svg viewBox="0 0 24 24" className="w-8 h-8 rounded-full border border-cyan-400 p-1 text-cyan-300" fill="currentColor">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  );
};

const Layout: React.FC<LayoutProps> = ({
  user,
  onLogout,
  currentPage,
  setCurrentPage,
  soundService,
  tutorialHighlight,
  theme,
  onToggleTheme,
  children,
}) => {
  const isAuthed = !!user;
  const displayName = user?.name ?? 'Agent';
  const avatarSrc = user?.avatar;

  // when not authed, keep main content narrow so big SVGs/images can't expand
  const contentMaxWidth = isAuthed ? 'max-w-6xl' : 'max-w-xl';

  return (
    <div className="relative mx-auto w-full">
      {/* Header */}
      <header className={`mb-3 ${contentMaxWidth} mx-auto flex items-center justify-between`}>
        <h1 className="font-orbitron text-2xl md:text-3xl text-cyan-200 tracking-wide">BRAIN HEIST</h1>
        <div className="flex items-center gap-2">
          <button className="hacker-button text-xs md:text-sm" onClick={onToggleTheme}>
            &gt; Theme: {theme === 'modern' ? 'Modern' : 'Classic'}
          </button>
          {isAuthed && (
            <>
              <div className="hidden sm:flex items-center gap-2 px-2 py-1 rounded-lg bg-black/30 border border-green-500/20">
                <Avatar src={avatarSrc} alt={displayName} />
                <span className="font-orbitron text-sm text-cyan-300">Welcome, {displayName}</span>
              </div>
              <button className="hacker-button text-xs md:text-sm" onClick={onLogout}>
                &gt; Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* Tabs only after login */}
      {isAuthed && (
        <nav className={`${contentMaxWidth} mx-auto flex flex-wrap gap-2 mb-3`}>
          {TABS.map((t, idx) => {
            const active = currentPage === t.key;
            return (
              <button
                key={t.label}
                onClick={() => setCurrentPage(t.key)}
                className={`px-3 py-1 rounded-md text-sm hacker-tab ${
                  active ? 'bg-green-500/80 text-black' : 'hover:bg-green-500/20'
                }`}
              >
                {t.label}
              </button>
            );
          })}
        </nav>
      )}

      {/* Main Card */}
      <main className={`${contentMaxWidth} mx-auto hacker-box p-4`}>
        {children}
      </main>
    </div>
  );
};

export default Layout;
