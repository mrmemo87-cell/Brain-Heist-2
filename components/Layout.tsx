import React, { useState } from 'react';
import type { User } from '../types';
import { Page } from '../types';
import { UserIcon, BarChartIcon, ZapIcon, ShoppingCartIcon, LogOutIcon, VolumeUpIcon, VolumeOffIcon } from './ui/Icons';

interface LayoutProps {
  user: User;
  onLogout: () => void;
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  children: React.ReactNode;
  soundService: {
      play: (soundName: 'click') => void;
      toggleMute: () => boolean;
  },
  tutorialHighlight: number | null;
  theme: 'classic' | 'modern';
  onToggleTheme: () => void;
}

const NavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; isHighlighted: boolean; }> = ({ icon, label, isActive, onClick, isHighlighted }) => (
  <button
    onClick={onClick}
    className={`flex items-center space-x-4 w-full p-3 my-1 rounded transition-all duration-300 transform hover:scale-105 group ${
      isActive
        ? 'bg-green-500/10 border-l-4 border-green-400 text-green-300'
        : 'text-gray-400 hover:bg-gray-700/50 hover:text-white'
    } ${isHighlighted ? 'tutorial-highlight' : ''}`}
  >
    <span className={`${isActive ? 'text-green-300' : 'text-gray-500 group-hover:text-green-300 transition-colors'}`}>{icon}</span>
    <span className="font-semibold">{label}</span>
  </button>
);

const MobileNavItem: React.FC<{ icon: React.ReactNode; label: string; isActive: boolean; onClick: () => void; }> = ({ icon, label, isActive, onClick }) => (
    <button
      onClick={onClick}
      className={`flex flex-col items-center justify-center flex-1 p-1 text-center transition-colors duration-300 ${isActive ? 'text-green-300' : 'text-gray-500 hover:text-white'}`}
    >
      {icon}
      <span className={`text-[10px] mt-1 ${isActive ? 'font-bold' : ''}`}>{label}</span>
    </button>
);

const ThemeToggle: React.FC<{ theme: 'classic' | 'modern'; onToggle: () => void; isMobile?: boolean; }> = ({ theme, onToggle, isMobile }) => (
    <button
      onClick={onToggle}
      className={`flex items-center space-x-2 p-2 rounded transition-all duration-300 text-cyan-400 hover:bg-cyan-500/20 ${isMobile ? 'text-xs' : 'text-sm'}`}
      title="Toggle Theme"
    >
      <svg xmlns="http://www.w3.org/2000/svg" className={isMobile ? "h-4 w-4" : "h-5 w-5"} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5v-5.714c0-.597-.237-1.17-.659-1.591L14.25 5.5M5 14.5L3 21m18-6.5l-2 6.5m-3.46-3.961l-1.591 1.591a2.25 2.25 0 01-3.182 0l-1.591-1.591a2.25 2.25 0 010-3.182l1.591-1.591a2.25 2.25 0 013.182 0l1.591 1.591a2.25 2.25 0 010 3.182z" />
      </svg>
      {!isMobile && <span className="font-semibold capitalize">{theme}</span>}
    </button>
);


const Layout: React.FC<LayoutProps> = ({ user, onLogout, currentPage, setCurrentPage, children, soundService, tutorialHighlight, theme, onToggleTheme }) => {
    const [isMuted, setIsMuted] = useState(false);

    const handleNavClick = (page: Page) => {
        soundService.play('click');
        setCurrentPage(page);
    };

    const handleMuteToggle = () => {
        soundService.play('click');
        const muted = soundService.toggleMute();
        setIsMuted(muted);
    }
  
  return (
    <div className="flex flex-col md:flex-row h-full w-full gap-2 md:gap-4">
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex w-64 flex-shrink-0 hacker-box p-4 flex-col justify-between animate-slide-in-left">
        <div>
          <h1 className="text-3xl font-bold text-center text-green-400 mb-8 font-orbitron animate-text-glitch">
            BRAIN HEIST
          </h1>
          <nav>
            <NavItem icon={<UserIcon className="w-6 h-6" />} label="Profile" isActive={currentPage === Page.PROFILE} onClick={() => handleNavClick(Page.PROFILE)} isHighlighted={tutorialHighlight === 4} />
            <NavItem icon={<BarChartIcon className="w-6 h-6" />} label="Leaderboard" isActive={currentPage === Page.LEADERBOARD} onClick={() => handleNavClick(Page.LEADERBOARD)} isHighlighted={tutorialHighlight === 2 || tutorialHighlight === 5} />
            <NavItem icon={<ZapIcon className="w-6 h-6" />} label="Play" isActive={currentPage === Page.PLAY} onClick={() => handleNavClick(Page.PLAY)} isHighlighted={tutorialHighlight === 1} />
            <NavItem icon={<ShoppingCartIcon className="w-6 h-6" />} label="Shop" isActive={currentPage === Page.SHOP} onClick={() => handleNavClick(Page.SHOP)} isHighlighted={tutorialHighlight === 3} />
          </nav>
        </div>
        <div className="space-y-2">
            <ThemeToggle theme={theme} onToggle={onToggleTheme} />
            <div className="flex items-center justify-between">
              <button onClick={onLogout} className="flex items-center space-x-2 p-2 rounded transition-all duration-300 text-red-400 hover:bg-red-500/20">
                <LogOutIcon className="w-6 h-6" />
                <span className="font-semibold">Logout</span>
              </button>
              <button onClick={handleMuteToggle} className="p-2 rounded transition-all duration-300 text-gray-400 hover:bg-gray-500/20">
                {isMuted ? <VolumeOffIcon className="w-6 h-6" /> : <VolumeUpIcon className="w-6 h-6" />}
              </button>
            </div>
        </div>
      </aside>
      
      {/* Wrapper for Mobile Header + Main Content */}
      <div className="flex-1 flex flex-col gap-2 md:gap-4 overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden hacker-box p-2">
            <div className="flex justify-between items-center">
                <h1 className="text-xl font-bold text-green-400 font-orbitron animate-text-glitch">
                    BRAIN HEIST
                </h1>
                <div className="flex items-center">
                    <ThemeToggle theme={theme} onToggle={onToggleTheme} isMobile={true} />
                    <button onClick={handleMuteToggle} className="p-2 rounded transition-all duration-300 text-gray-400 hover:bg-gray-500/20">
                        {isMuted ? <VolumeOffIcon className="w-5 h-5" /> : <VolumeUpIcon className="w-5 h-5" />}
                    </button>
                    <button onClick={onLogout} className="p-2 rounded text-red-400 hover:bg-red-500/20">
                        <LogOutIcon className="w-5 h-5" />
                    </button>
                </div>
            </div>
            <nav className="flex justify-around items-center mt-2 border-t border-green-500/20 pt-2">
                <MobileNavItem icon={<UserIcon className="w-5 h-5" />} label="Profile" isActive={currentPage === Page.PROFILE} onClick={() => handleNavClick(Page.PROFILE)} />
                <MobileNavItem icon={<BarChartIcon className="w-5 h-5" />} label="Leaderboard" isActive={currentPage === Page.LEADERBOARD} onClick={() => handleNavClick(Page.LEADERBOARD)} />
                <MobileNavItem icon={<ZapIcon className="w-7 h-7" />} label="Play" isActive={currentPage === Page.PLAY} onClick={() => handleNavClick(Page.PLAY)} />
                <MobileNavItem icon={<ShoppingCartIcon className="w-5 h-5" />} label="Shop" isActive={currentPage === Page.SHOP} onClick={() => handleNavClick(Page.SHOP)} />
            </nav>
        </header>

        <main className="flex-1 flex flex-col hacker-box p-2 md:p-6 overflow-hidden animate-fade-in" style={{animationDelay: '0.2s'}}>
            <header className="flex justify-between items-center mb-4 border-b border-green-500/20 pb-4">
                <div>
                    <h2 className="text-xl md:text-3xl font-bold text-white font-orbitron">Welcome, <span className="text-green-400">{user.name}</span></h2>
                    <p className="hidden md:block text-gray-400 text-sm">// Agent Status: <span className="text-green-400">Online</span></p>
                </div>
                <div className="hidden md:flex items-center space-x-6 text-lg font-semibold">
                    <div className="flex items-center space-x-2 text-yellow-400">
                        <span>{user.creds.toLocaleString()}</span>
                        <span>Creds</span>
                    </div>
                    <div className="flex items-center space-x-2 text-sky-400">
                        <span>{user.xp.toLocaleString()}</span>
                        <span>XP</span>
                    </div>
                    <div className="flex items-center space-x-2 text-purple-400">
                        <span>Lv.{user.level}</span>
                    </div>
                </div>
            </header>

            <div className="md:hidden flex items-center justify-around text-center text-xs sm:text-sm font-semibold mb-4 border-b border-green-500/10 pb-2">
                <div className="text-yellow-400">
                    <p>{user.creds.toLocaleString()}</p><p>Creds</p>
                </div>
                <div className="text-sky-400">
                    <p>{user.xp.toLocaleString()}</p><p>XP</p>
                </div>
                <div className="text-purple-400">
                    <p>Lv.{user.level}</p><p>Level</p>
                </div>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 md:pr-2">
            {children}
            </div>
        </main>
      </div>
    </div>
  );
};

export default Layout;
