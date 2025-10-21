import React, { useState, useEffect } from 'react';
import type { User } from '../types';

interface WinnersCircleProps {
  topUsers: User[];
}

const WinnerCard: React.FC<{ user: User; rank: number; isRevealed: boolean }> = ({ user, rank, isRevealed }) => {
  const rankStyles = [
    { bg: 'bg-yellow-500/20', border: 'border-yellow-400', shadow: 'shadow-yellow-400/50', text: 'text-yellow-300', rankText: '1st Place' },
    { bg: 'bg-gray-400/20', border: 'border-gray-300', shadow: 'shadow-gray-300/50', text: 'text-gray-200', rankText: '2nd Place' },
    { bg: 'bg-amber-700/20', border: 'border-amber-600', shadow: 'shadow-amber-600/50', text: 'text-amber-500', rankText: '3rd Place' },
  ];
  
  const style = rankStyles[rank];

  if (!user) return null;

  return (
    <div 
        className={`hacker-box w-full max-w-sm p-6 text-center transition-all duration-700 ${style.bg} ${style.border} shadow-2xl ${style.shadow} ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}
        style={{ transitionDelay: `${rank * 200}ms`}}
    >
        <p className={`text-3xl font-bold font-orbitron ${style.text}`}>{style.rankText}</p>
        <img src={user.avatar} alt={user.name} className={`w-32 h-32 rounded-full mx-auto my-4 border-4 ${style.border}`} />
        <h3 className="text-4xl font-bold font-orbitron text-white">{user.name}</h3>
        <p className="text-lg text-gray-400">{user.batch}</p>
        <p className="mt-4 text-2xl font-semibold text-cyan-300">{user.xp.toLocaleString()} XP</p>
    </div>
  );
};

const WinnersCircle: React.FC<WinnersCircleProps> = ({ topUsers }) => {
    const [revealed, setRevealed] = useState([false, false, false]);

    useEffect(() => {
        const timers = [
            setTimeout(() => setRevealed(prev => [prev[0], prev[1], true]), 200), // 3rd place
            setTimeout(() => setRevealed(prev => [prev[0], true, prev[2]]), 600), // 2nd place
            setTimeout(() => setRevealed(prev => [true, prev[1], prev[2]]), 1000), // 1st place
        ];
        return () => timers.forEach(clearTimeout);
    }, []);
    
    const handleRestart = () => {
        localStorage.removeItem('brain-heist-game-over');
        localStorage.removeItem('brain-heist-live-events');
        localStorage.removeItem('brain-heist-user'); // Current user session

        // Correctly remove all individual user data
        const userListJSON = localStorage.getItem('brain-heist-user-list');
        if (userListJSON) {
            const userIds: string[] = JSON.parse(userListJSON);
            userIds.forEach(id => {
                localStorage.removeItem(`brain-heist-user-${id}`);
            });
        }
        localStorage.removeItem('brain-heist-user-list');

        window.location.reload();
    };
    
    // Sort them for display: 2nd, 1st, 3rd
    const displayOrder = [topUsers[1], topUsers[0], topUsers[2]];
    const displayRanks = [1, 0, 2];

    return (
        <div className="w-full h-full flex flex-col items-center justify-center p-4 animate-fade-in">
            <h1 className="text-6xl font-bold font-orbitron text-cyan-300 mb-4 animate-text-glitch">
              // HEIST COMPLETE
            </h1>
            <h2 className="text-3xl font-orbitron text-white mb-12">// Top Agents</h2>
            
            <div className="flex flex-col md:flex-row items-center justify-center gap-8">
                {displayOrder.map((user, index) => (
                    <div key={user?.id || index} className={`transform ${displayRanks[index] === 0 ? 'md:-translate-y-8 scale-110 z-10' : ''} animate-winner-reveal`} style={{animationDelay: `${(2-index) * 300 + 500}ms`}}>
                       { user && <WinnerCard user={user} rank={displayRanks[index]} isRevealed={revealed[displayRanks[index]]} /> }
                    </div>
                ))}
            </div>

            <button
                onClick={handleRestart}
                className="hacker-button hacker-button-primary text-xl px-8 py-4 mt-12 animate-fade-in"
                style={{ animationDelay: '1.5s' }}
            >
                &gt; START NEW HEIST
            </button>
        </div>
    );
};

export default WinnersCircle;