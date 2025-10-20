import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { User, LiveEvent, LiveEventType } from '../types';
import WinnersCircle from './WinnersCircle';

const getRankColor = (rank: number) => {
  if (rank === 0) return 'border-yellow-400 shadow-[0_0_15px_rgba(250,204,21,0.5)]';
  if (rank === 1) return 'border-gray-300 shadow-[0_0_15px_rgba(209,213,219,0.5)]';
  if (rank === 2) return 'border-yellow-600 shadow-[0_0_15px_rgba(202,138,4,0.5)]';
  return 'border-green-500/20';
};

const LiveFeed: React.FC<{ events: LiveEvent[] }> = ({ events }) => {
    const eventStyles: Record<LiveEventType, string> = {
        HACK_SUCCESS: 'text-green-400 border-green-400/50',
        HACK_FAIL: 'text-red-400 border-red-400/50',
        HACK_SHIELDED: 'text-blue-400 border-blue-400/50',
        ITEM_ACTIVATION: 'text-yellow-400 border-yellow-400/50',
    };
    const feedRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if(feedRef.current) {
            feedRef.current.scrollTop = 0;
        }
    }, [events])

    return (
        <div className="hacker-box p-4 h-full flex flex-col">
            <h3 className="text-xl font-bold text-pink-400 mb-4 text-center font-orbitron">[LIVE FEED]</h3>
            <div ref={feedRef} className="flex-1 overflow-y-auto space-y-3 pr-1">
                {events.map(event => (
                    <div key={event.id} className={`p-2 border-l-2 ${eventStyles[event.type]} text-sm animate-fade-in`}>
                        <p>{event.message}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};


interface ProjectorViewProps {
  allUsers: User[];
  liveEvents: LiveEvent[];
  onFinishHeist: () => void;
  gameOver: boolean;
}

const ProjectorView: React.FC<ProjectorViewProps> = ({ allUsers, liveEvents, onFinishHeist, gameOver }) => {
  const [gameStarted, setGameStarted] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
      audioRef.current = document.getElementById('projector-music') as HTMLAudioElement;
  }, []);

  const handleStartGame = () => {
    setGameStarted(true);
    if(audioRef.current) {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => console.error("Audio play failed:", e));
    }
  };
  
  const handleFinishHeist = () => {
      onFinishHeist();
      if(audioRef.current) {
          audioRef.current.pause();
      }
  }

  const sortedUsers = useMemo(() => {
    return [...allUsers].sort((a, b) => (b.xp || 0) - (a.xp || 0));
  }, [allUsers]);

  const qrUrl = window.location.href.split('?')[0];

  if (gameOver) {
      return <WinnersCircle topUsers={sortedUsers.slice(0, 3)} />;
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-between p-4 md:p-8 text-white animate-fade-in">
        <header className={`flex items-center gap-4 transition-all duration-1000 ${gameStarted ? 'justify-start w-full' : 'justify-center flex-col'}`}>
            <div className={`transition-all duration-1000 ${gameStarted ? 'w-16 h-16' : 'w-48 h-48'}`}>
                <div className={`hacker-box p-1 animate-qr-pulse`}>
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(qrUrl)}`} alt="QR Code" className="w-full h-full"/>
                </div>
            </div>
            <h1 className={`text-center font-bold text-green-400 font-orbitron animate-text-glitch transition-all duration-1000 ${gameStarted ? 'text-3xl' : 'text-5xl'}`}>
                BRAIN HEIST
            </h1>
        </header>

        <main className="flex-1 w-full max-w-7xl flex items-center justify-center overflow-hidden py-4">
          {!gameStarted ? (
              <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="hacker-box p-4 flex flex-col">
                      <h2 className="text-2xl text-center font-orbitron text-cyan-300 mb-4">[CONNECTED AGENTS: {allUsers.length}]</h2>
                      <ul className="overflow-y-auto flex-1 pr-2 space-y-2">
                          {allUsers.map(user => (
                              <li key={user.id} className="bg-black/30 p-2 rounded animate-fade-in">{user.name}</li>
                          ))}
                      </ul>
                  </div>
                  <div className="h-full">
                     <LiveFeed events={liveEvents} />
                  </div>
              </div>
          ) : (
               <div className="w-full h-full grid grid-cols-3 gap-8">
                  <div className="col-span-2 hacker-box p-4 flex flex-col">
                       <h2 className="text-2xl text-center font-orbitron text-cyan-300 mb-4">[LEADERBOARD]</h2>
                       <div className="flex-1 overflow-y-auto pr-2 space-y-2">
                          {sortedUsers.map((user, index) => (
                            <div key={user.id} className={`flex items-center justify-between p-2 bg-black/20 border-l-4 ${getRankColor(index)}`}>
                              <div className="flex items-center space-x-3">
                                <span className="font-bold text-xl w-8 text-center">{index + 1}</span>
                                <img src={user.avatar} alt={user.name} className="w-12 h-12 rounded-full border-2 border-pink-500/50" />
                                <div>
                                  <p className="font-bold text-lg text-white">{user.name}</p>
                                  <p className="text-sm text-gray-400">{user.batch}</p>
                                </div>
                              </div>
                              <div className="text-right">
                                  <p className="font-bold text-xl text-cyan-300">{user.xp.toLocaleString()} XP</p>
                                  <p className="text-sm text-gray-400">Level {user.level}</p>
                              </div>
                            </div>
                          ))}
                      </div>
                  </div>
                  <div className="col-span-1 h-full">
                      <LiveFeed events={liveEvents} />
                  </div>
              </div>
          )}
        </main>

        <footer className="flex-shrink-0">
            {!gameStarted ? (
                <button onClick={handleStartGame} className="hacker-button hacker-button-primary text-2xl px-8 py-4">
                    &gt; START HEIST
                </button>
            ) : (
                <button onClick={handleFinishHeist} className="hacker-button text-xl px-6 py-3">
                    &gt; FINISH HEIST
                </button>
            )}
        </footer>
    </div>
  );
};

export default ProjectorView;