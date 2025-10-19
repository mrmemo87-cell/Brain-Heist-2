
import React, { useState } from 'react';
import type { Batch } from '../types';

interface LoginProps {
  onLogin: (username: string, batch: Batch) => string | null;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [batch, setBatch] = useState<Batch>('8A');
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

  const handleBatchChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
      setBatch(e.target.value as Batch);
      if (error) setError(null);
  }

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
            onChange={handleBatchChange}
            className="w-full hacker-input"
          >
            <option value="8A">Batch 8A</option>
            <option value="8B">Batch 8B</option>
            <option value="8C">Batch 8C</option>
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
    </div>
  );
};

export default Login;