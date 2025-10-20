// Fix: Import React and useState to resolve compilation errors.
import React, { useState } from 'react';
import type { Batch } from '../types';
import { AVAILABLE_BATCHES } from '../constants';

interface LoginProps {
  onLogin: (username: string, batch: Batch) => string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [batch, setBatch] = useState<Batch>(AVAILABLE_BATCHES[0]);
  const [error, setError] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (username.trim()) {
      const errorMessage = onLogin(username, batch);
      setError(errorMessage);
      if (errorMessage) {
        setIsShaking(true);
        setTimeout(() => setIsShaking(false), 500); // Duration of shake animation
      }
    }
  };
  
  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setUsername(e.target.value);
      if (error) setError(null);
  }
  
  const handleSystemReset = () => {
    const isConfirmed = window.confirm("Are you sure you want to perform a system reset? This will delete ALL saved players and game progress for this browser. This is intended for starting a fresh session with a new class.");
    if (isConfirmed) {
        localStorage.removeItem('brain-heist-game-over');
        localStorage.removeItem('brain-heist-live-events');
        localStorage.removeItem('brain-heist-user');

        const userListJSON = localStorage.getItem('brain-heist-user-list');
        if (userListJSON) {
            const userIds: string[] = JSON.parse(userListJSON);
            userIds.forEach(id => {
                localStorage.removeItem(`brain-heist-user-${id}`);
            });
        }
        localStorage.removeItem('brain-heist-user-list');
        
        window.location.reload();
    }
  };

  return (
    <div className={`w-full max-w-md hacker-box p-8 transition-transform duration-500 ${isShaking ? 'animate-shake-error' : ''} animate-fade-in`}>
      <div className="relative">
        <div className="terminal-scan-line"></div>
      </div>
      <h1 className="text-4xl sm:text-5xl font-bold text-center text-green-400 mb-2 font-orbitron animate-text-glitch">
        BRAIN HEIST
      </h1>
      <p className="text-center text-cyan-300 mb-8">// Agent Authentication Required</p>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="username" className="block text-sm font-medium text-gray-300 mb-2">Agent Name:</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={handleUsernameChange}
            className="w-full hacker-input"
            placeholder="e.g. Cipher"
            required
          />
        </div>
        <div>
          <label htmlFor="batch" className="block text-sm font-medium text-gray-300 mb-2">Select Batch:</label>
          <select 
            id="batch" 
            value={batch} 
            onChange={(e) => setBatch(e.target.value as Batch)}
            className="w-full hacker-input"
          >
            {AVAILABLE_BATCHES.map(b => <option key={b} value={b}>{b}</option>)}
          </select>
        </div>
        {error && (
            <p className="text-red-400 text-sm text-center -my-3 p-2 bg-red-900/50 border border-red-500 rounded">{error}</p>
        )}
        <button
          type="submit"
          className="w-full font-bold text-lg py-3 hacker-button hacker-button-primary"
        >
          &gt; Access Terminal
        </button>
      </form>
      <div className="text-center mt-6 border-t border-gray-700 pt-4">
          <button onClick={handleSystemReset} className="text-xs text-red-400 hover:text-red-300 hover:underline">
            // System Reset
          </button>
      </div>
    </div>
  );
};

export default Login;