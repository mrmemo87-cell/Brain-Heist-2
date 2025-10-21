
import React, { useMemo } from 'react';
import type { User } from '../types';
import { BarChartIcon, ShieldIcon, TerminalIcon } from './ui/Icons';

interface GameOverViewProps {
  user: User;
  allUsers: User[];
}

const GameOverView: React.FC<GameOverViewProps> = ({ user, allUsers }) => {
  const sortedUsers = useMemo(() => 
    [...allUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0)), 
    [allUsers]
  );
  
  const userRank = useMemo(() => 
    sortedUsers.findIndex(u => u.id === user.id) + 1, 
    [sortedUsers, user.id]
  );

  const getRankSuffix = (rank: number) => {
    if (rank % 100 >= 11 && rank % 100 <= 13) return 'th';
    switch (rank % 10) {
      case 1: return 'st';
      case 2: return 'nd';
      case 3: return 'rd';
      default: return 'th';
    }
  };

  return (
    <div className="w-full h-full flex items-center justify-center p-4">
      <div className="hacker-box w-full max-w-2xl p-8 text-center animate-fade-in">
        <h1 className="text-4xl sm:text-5xl font-bold font-orbitron text-cyan-300 mb-2 animate-text-glitch">
          // HEIST COMPLETE
        </h1>
        <p className="text-lg text-gray-400 mb-8">You have been disconnected from the terminal.</p>

        <div className="bg-black/30 border border-green-500/30 p-6 rounded-lg">
          <h2 className="text-3xl font-bold font-orbitron text-white">
            Your Final Rank: <span className="text-yellow-400">{userRank}{getRankSuffix(userRank)}</span>
          </h2>
          <p className="text-gray-400">out of {allUsers.length} agents</p>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center mt-8 border-t border-green-500/20 pt-6">
            <div>
              <p className="text-3xl font-bold font-orbitron text-green-400">{user.level}</p>
              <p className="text-sm text-gray-400">Level</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-orbitron text-cyan-400">{user.xp.toLocaleString()}</p>
              <p className="text-sm text-gray-400">Total XP</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-orbitron text-pink-400">{user.hackingSkill}</p>
              <p className="text-sm text-gray-400">Hacking Skill</p>
            </div>
            <div>
              <p className="text-3xl font-bold font-orbitron text-blue-400">{user.securityLevel}</p>
              <p className="text-sm text-gray-400">Security Level</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameOverView;