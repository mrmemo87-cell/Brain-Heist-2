import React, { useState } from 'react';
import type { User, Question, Subject } from '../types';
import { SUBJECTS, getXpForNextLevel } from '../constants';
import { generateMCQ } from '../services/geminiService';
import { XCircleIcon } from './ui/Icons';

interface PlayProps {
  user: User;
  onUpdateUser: (updatedUser: User) => void;
  playSound: (sound: 'success' | 'error' | 'click') => void;
}

const Play: React.FC<PlayProps> = ({ user, onUpdateUser, playSound }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [penaltyLevel, setPenaltyLevel] = useState(0);

  const loadNewQuestion = async (subject: Subject) => {
    setIsLoading(true);
    // Hardcoded for English as per requirements
    const topic = subject === 'English' ? "parts of speech" : subject;
    const mcq = await generateMCQ(topic);
    setQuestion(mcq);
    setSelectedAnswer(null);
    setIsAnswered(false);
    setIsLoading(false);
  };

  const handleSubjectSelect = (subject: Subject) => {
    playSound('click');
    setSelectedSubject(subject);
    setSessionStreak(0);
    setPenaltyLevel(0);
    if (subject === 'English') {
        loadNewQuestion(subject);
    }
  };

  const handleEndSession = () => {
    playSound('click');
    setSelectedSubject(null);
    setQuestion(null);
  }

  const handleAnswer = (answer: string) => {
    if (isAnswered || !question) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === question.correctAnswer;
    
    let xpGained = 0;
    let credsGained = 0;
    let newOverallStreak = user.streak;
    let updatedUser = { ...user };

    if (isCorrect) {
      playSound('success');
      const newSessionStreak = sessionStreak + 1;
      setSessionStreak(newSessionStreak);
      setPenaltyLevel(0);

      xpGained = 50 + newSessionStreak * 10;
      credsGained = 10 + (newSessionStreak - 1) * 12;
      newOverallStreak += 1;
    } else {
      playSound('error');
      const newPenaltyLevel = penaltyLevel + 1;
      setPenaltyLevel(newPenaltyLevel);
      setSessionStreak(0);

      const credsLost = 5 + (newPenaltyLevel - 1) * 2;
      credsGained = -Math.min(user.creds, credsLost);
      newOverallStreak = 0;
    }

    const newXp = user.xp + xpGained;
    const xpForNextLevel = getXpForNextLevel(user.level);
    let newLevel = user.level;
    if (newXp >= xpForNextLevel) {
        newLevel += 1;
    }

    updatedUser = {
        ...user,
        xp: newXp,
        level: newLevel,
        creds: user.creds + credsGained,
        streak: newOverallStreak
    };
    onUpdateUser(updatedUser);

    setTimeout(() => {
        if (selectedSubject) {
            loadNewQuestion(selectedSubject);
        }
    }, 2500);
  };

  const getOptionClass = (option: string) => {
      if (!isAnswered) return 'play-option-button hover:border-cyan-400 hover:bg-cyan-900/50';
      if (option === question?.correctAnswer) return 'play-option-button bg-green-500/50 border-green-400 animate-pulse';
      if (option === selectedAnswer) return 'play-option-button bg-red-500/50 border-red-400';
      return 'play-option-button opacity-50';
  }

  if (!selectedSubject) {
    return (
      <div className="p-2 md:p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-pink-400 mb-6 font-orbitron">&gt; Select Mission Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUBJECTS.map(subject => (
            <button key={subject} onClick={() => handleSubjectSelect(subject)} className="hacker-box p-4 text-center transition-transform transform hover:scale-105">
              <div className="glare"></div>
              <p className="font-bold font-orbitron">{subject}</p>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (selectedSubject !== 'English') {
      return (
           <div className="p-6 text-center animate-fade-in">
                <h2 className="text-2xl font-bold text-cyan-300 mb-4 font-orbitron">&gt; Subject: {selectedSubject}</h2>
                <p className="text-xl text-gray-400 my-8">// No mission data available for this subject.</p>
                <button onClick={handleEndSession} className="hacker-button hacker-button-primary">
                    &gt; Back to Subjects
                </button>
           </div>
      )
  }

  return (
    <div className="p-2 md:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
            <div>
                <h2 className="text-2xl font-bold text-cyan-300 font-orbitron">&gt; Mission: {selectedSubject}</h2>
                <p className="text-sm text-gray-400">Correct Streak: <span className="font-bold text-green-400">{sessionStreak}</span></p>
            </div>
            <button onClick={handleEndSession} className="hacker-button flex items-center gap-2">
                <XCircleIcon className="w-5 h-5" /> End Mission
            </button>
        </div>
      {isLoading ? (
        <div className="flex-1 flex justify-center items-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
          <p className="ml-4 text-lg">// Generating new data point...</p>
        </div>
      ) : (
        question && (
          <div className="animate-fade-in flex-1">
            <div className="mb-6 p-4 border border-cyan-500/50 rounded-lg bg-black/30">
              <p className="text-sm text-pink-400 mb-2 font-orbitron">// Topic: {question.topic}</p>
              <p className="text-white play-question-text">{question.text}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map(option => (
                    <button 
                        key={option} 
                        onClick={() => handleAnswer(option)}
                        disabled={isAnswered}
                        className={`transition-all duration-300 ${getOptionClass(option)}`}
                    >
                        {option}
                    </button>
                ))}
            </div>
            {isAnswered && (
                <div className={`mt-6 text-center text-2xl font-bold animate-fade-in font-orbitron ${selectedAnswer === question.correctAnswer ? 'text-green-400' : 'text-red-500'}`}>
                    {selectedAnswer === question.correctAnswer ? '// CORRECT' : '// INCORRECT'}
                </div>
            )}
          </div>
        )
      )}
    </div>
  );
};

export default Play;
