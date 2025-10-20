import React, { useState, useMemo, useEffect } from 'react';
import type { User, LiveEvent, LiveEventType } from '../types';
import RadialGauge from './ui/RadialGauge'; // Import the new component
import { ShieldIcon } from './ui/Icons';
import { AVAILABLE_BATCHES } from '../constants';

// MiniProfileModal Component
const MiniProfileModal: React.FC<{ user: User; onClose: () => void; theme: 'classic' | 'modern' }> = ({ user, onClose, theme }) => {
    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in" onClick={onClose}>
            <div className="hacker-box w-[95vw] max-w-md p-6" onClick={e => e.stopPropagation()}>
                <div className="flex items-center space-x-4 mb-4">
                    <img src={user.avatar} alt={user.name} className="w-24 h-24 rounded-full border-2 border-cyan-400" />
                    <div>
                        <h3 className="text-2xl font-bold font-orbitron text-cyan-300">{user.name}</h3>
                        <p className="text-gray-400">{user.batch}</p>
                    </div>
                </div>
                <p className="text-gray-300 italic mb-4">"{user.bio}"</p>
                <div className="border-t border-green-500/20 pt-4">
                  {theme === 'modern' ? (
                     <div className="grid grid-cols-3 gap-4 text-center">
                        <RadialGauge value={user.hackingSkill} maxValue={100} label="Hacking" color="hsl(340, 100%, 60%)" size={80} />
                        <RadialGauge value={user.securityLevel} maxValue={100} label="Security" color="hsl(195, 100%, 50%)" size={80} />
                        <RadialGauge value={user.stamina.current} maxValue={user.stamina.max} label="Stamina" color="hsl(50, 100%, 50%)" size={80} />
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <p><strong>Level:</strong> {user.level}</p>
                      <p><strong>Hacking Skill:</strong> {user.hackingSkill}</p>
                      <p><strong>Security Level:</strong> {user.securityLevel}</p>
                      <p><strong>Creds:</strong> {user.creds.toLocaleString()}</p>
                    </div>
                  )}
                </div>
                 <button onClick={onClose} className="hacker-button mt-4 w-full">&gt; Close</button>
            </div>
        </div>
    );
};

// LiveFeed Components
const REACTION_EMOJIS = ['🔥', '🤯', '😈', '😂'];

const ReactionButtons: React.FC<{ event: LiveEvent; currentUser: User; onReact: (eventId: string, emoji: string) => void; }> = ({ event, currentUser, onReact }) => {
    const userReaction = REACTION_EMOJIS.find(emoji => event.reactions[emoji]?.includes(currentUser.id));

    return (
        <div className="flex items-center space-x-2 mt-2">
            {REACTION_EMOJIS.map(emoji => {
                const count = event.reactions[emoji]?.length || 0;
                return (
                    <button 
                        key={emoji}
                        onClick={() => onReact(event.id, emoji)}
                        className={`reaction-button flex items-center ${userReaction === emoji ? 'reacted' : ''}`}
                    >
                        <span>{emoji}</span>
                        {count > 0 && <span className="reaction-count">{count}</span>}
                    </button>
                );
            })}
        </div>
    );
};

const LiveFeed: React.FC<{ events: LiveEvent[], currentUser: User, onReact: (eventId: string, emoji: string) => void; }> = ({ events, currentUser, onReact }) => {
    const eventStyles: Record<LiveEventType, string> = {
        HACK_SUCCESS: 'text-green-400 border-green-400/50',
        HACK_FAIL: 'text-red-400 border-red-400/50',
        HACK_SHIELDED: 'text-blue-400 border-blue-400/50',
        ITEM_ACTIVATION: 'text-yellow-400 border-yellow-400/50',
    };
    return (
        <div className="hacker-box p-4 h-full flex flex-col">
            <h3 className="text-xl font-bold text-pink-400 mb-4 text-center font-orbitron">[LIVE FEED]</h3>
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                {events.map(event => (
                    <div key={event.id} className={`p-2 border-l-2 ${eventStyles[event.type]} text-sm animate-fade-in`}>
                        <p>{event.message}</p>
                        <div className="flex justify-between items-center">
                            <p className="text-xs text-gray-500 text-right">{new Date(event.timestamp).toLocaleTimeString()}</p>
                            <ReactionButtons event={event} currentUser={currentUser} onReact={onReact} />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface LeaderboardProps {
  allUsers: User[];
  currentUser: User;
  liveEvents: LiveEvent[];
  onHack: (targetUser: User) => void;
  onReact: (eventId: string, emoji: string) => void;
  theme: 'classic' | 'modern';
}

const getRankColor = (rank: number) => {
  if (rank === 0) return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
  if (rank === 1) return 'border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.5)]';
  if (rank === 2) return 'border-yellow-600 shadow-[0_0_15px_rgba(202,138,4,0.5)]';
  return 'border-green-500/20';
};

const getStatusInfo = (lastActiveTimestamp?: number) => {
    if (!lastActiveTimestamp) return { color: 'bg-red-500', title: 'Inactive' };
    const minutesAgo = (Date.now() - lastActiveTimestamp) / (1000 * 60);
    if (minutesAgo < 2) return { color: 'bg-green-400 animate-pulse', title: 'Active Now' };
    if (minutesAgo < 20) return { color: 'bg-green-500', title: `Active ${Math.round(minutesAgo)}m ago` };
    if (minutesAgo < 40) return { color: 'bg-yellow-400', title: `Active ${Math.round(minutesAgo)}m ago` };
    return { color: 'bg-red-500', title: 'Inactive for >40m' };
};

const Leaderboard: React.FC<LeaderboardProps> = ({ allUsers, currentUser, liveEvents, onHack, onReact, theme }) => {
  const [filter, setFilter] = useState<string>('global');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const sortedUsers = useMemo(() => {
    return [...allUsers]
      .filter(user => filter === 'global' || user.batch === filter)
      .sort((a, b) => (b.xp || 0) - (a.xp || 0));
  }, [allUsers, filter]);
  
  const availableBatches = useMemo(() => {
    return ['global', ...AVAILABLE_BATCHES];
  }, []);

  const latestHackEvent = useMemo(() => liveEvents.find(e => e.type === 'HACK_SUCCESS'), [liveEvents]);

  return (
    <div className="h-full grid grid-cols-1 lg:grid-cols-3 gap-4">
      {selectedUser && <MiniProfileModal user={selectedUser} onClose={() => setSelectedUser(null)} theme={theme} />}
      <div className="lg:col-span-2 h-full flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
          <h2 className="text-2xl font-bold text-pink-400 font-orbitron">&gt; Leaderboard</h2>
          <div className="flex space-x-1 p-1 bg-black/30 rounded-lg border border-green-500/20 self-start sm:self-center">
            {availableBatches.map(f => (
                <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1 rounded-md text-sm transition-all ${filter === f ? 'bg-green-500/80 text-black' : 'hover:bg-green-500/20'}`}>{f.toUpperCase()}</button>
            ))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto pr-2 space-y-2">
          {sortedUsers.map((user, index) => {
            const status = getStatusInfo(user.lastActiveTimestamp);
            const cooldownDuration = 60 * 60 * 1000;
            const cooldownEnds = (user.lastHackedTimestamp || 0) + cooldownDuration;
            const onCooldown = now < cooldownEnds;
            const cooldownRemaining = onCooldown ? Math.ceil((cooldownEnds - now) / (1000 * 60)) : 0;
            const canHack = user.id !== currentUser.id && user.batch === currentUser.batch && currentUser.stamina.current >= 10 && !onCooldown;
            const isRecentTarget = latestHackEvent && latestHackEvent.message.includes(` ${user.name}'s`) && (now - latestHackEvent.timestamp < 3000);

            let rowClass = `flex items-center justify-between p-2 hacker-box border-l-4 ${getRankColor(index)}`;
            if (user.id === currentUser.id) rowClass += ' bg-green-500/10';
            if (isRecentTarget) rowClass += ' animate-hack-target-pulse';
            
            return (
              <div
                key={user.id}
                className={rowClass}
              >
                <div className="flex items-center space-x-2 md:space-x-3">
                  <span className="font-bold text-lg md:text-xl w-8 text-center">{index + 1}</span>
                  <img src={user.avatar} alt={user.name} className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-pink-500/50" />
                  <div className="cursor-pointer" onClick={() => setSelectedUser(user)}>
                    <div className="flex items-center space-x-2">
                        <div className={`w-3 h-3 rounded-full flex-shrink-0 ${status.color}`} title={status.title}></div>
                        <p className="font-bold text-base md:text-lg text-white hover:text-cyan-300 transition-colors">{user.name}</p>
                    </div>
                    <p className="text-xs md:text-sm text-gray-400 ml-5">{user.batch}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                    <div className="text-right">
                        <p className="font-bold text-base md:text-xl text-cyan-300">{user.xp.toLocaleString()} XP</p>
                        <p className="text-xs md:text-sm text-gray-400">Level {user.level}</p>
                    </div>
                    <div className="w-20 text-center">
                        {onCooldown ? (
                             <div className="flex flex-col items-center text-cyan-400 text-xs">
                                <ShieldIcon className="w-5 h-5 mb-1" />
                                <span>{cooldownRemaining}m left</span>
                             </div>
                        ) : (
                             <button onClick={() => onHack(user)} disabled={!canHack} className="hacker-button text-xs px-2 py-1">
                                Hack
                            </button>
                        )}
                    </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="lg:col-span-1 h-full min-h-[200px]">
        <LiveFeed events={liveEvents} currentUser={currentUser} onReact={onReact} />
      </div>
    </div>
  );
};

export default Leaderboard;