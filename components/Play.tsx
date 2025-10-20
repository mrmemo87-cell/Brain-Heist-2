import React, { useState, useEffect, useRef, useCallback } from 'react';
import type { User, Question, Subject, Item } from '../types';
import { SUBJECTS, getXpForNextLevel, SHOP_ITEMS } from '../constants';
// ⬇️ use a namespace/default import so we don't rely on named export resolution
import * as Gemini from '/src/services/geminiService';
import { XCircleIcon, GiftIcon } from './ui/Icons';
import SurpriseBoxModal from './SurpriseBoxModal';

interface PlayProps {
  user: User;
  onUpdateUser: (userId: string, updateFn: (user: User) => User) => void;
  playSound: (sound: 'success' | 'error' | 'click') => void;
}

const QUESTIONS_TO_FETCH = 5;
const REFILL_THRESHOLD = 2;

const Play: React.FC<PlayProps> = ({ user, onUpdateUser, playSound }) => {
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);
  const [question, setQuestion] = useState<Question | null>(null);
  const [questionQueue, setQuestionQueue] = useState<Question[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefilling, setIsRefilling] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [sessionStreak, setSessionStreak] = useState(0);
  const [penaltyLevel, setPenaltyLevel] = useState(0);

  const [isBonusQuestion, setIsBonusQuestion] = useState(false);
  const [showSurpriseBox, setShowSurpriseBox] = useState(false);
  const [surpriseGift, setSurpriseGift] = useState<{ name: string; icon: React.ReactNode } | null>(null);
  const [streakAnimKey, setStreakAnimKey] = useState(0);

  const isFetchingRef = useRef(false);

  // --- helper: adapt Gemini MCQ -> Question type your app expects
  const toQuestion = (topic: string, mcq: { question: string; options: string[]; answer: string }): Question => ({
    topic,
    text: mcq.question,
    options: mcq.options,
    correctAnswer: mcq.answer,
  });

  const fetchQuestionBatch = useCallback(async (subject: Subject) => {
    if (isFetchingRef.current) return;
    isFetchingRef.current = true;
    setIsRefilling(true);

    const topic = subject === 'English' ? 'parts of speech' : subject;

    // get N MCQs from Gemini (safe wrapper returns fallback when no API key)
    const batch = await Promise.all(
      Array(QUESTIONS_TO_FETCH)
        .fill(0)
        .map(() => Gemini.generateMCQ(topic))
    );

    let newQuestions: Question[] = batch
      .filter(Boolean)
      .map((mcq) => toQuestion(topic, mcq as any));

    // sprinkle a fun one sometimes
    if (subject === 'English' && Math.random() < 0.25) {
      const funny = await Gemini.generateMCQ('a funny, absurd, or silly pop-culture topic');
      if (funny) {
        const idx = Math.floor(Math.random() * (newQuestions.length + 1));
        newQuestions.splice(idx, 0, toQuestion('fun', funny as any));
      }
    }

    setQuestionQueue((prev) => [...prev, ...newQuestions]);
    isFetchingRef.current = false;
    setIsRefilling(false);
    return newQuestions;
  }, []);

  const determineAndAwardGift = () => {
    const gifts = [
      { type: 'DOUBLE_CREDS', name: 'Creds Doubled!', icon: <GiftIcon className="w-8 h-8" /> },
      { type: '1000_CREDS', name: '+1000 Creds!', icon: <GiftIcon className="w-8 h-8" /> },
      { type: 'SHIELD_ITEM', name: 'Firewall Shield!', item: SHOP_ITEMS.find((i) => i.id === 'shield-1') },
      { type: '10_CREDS', name: '+10 Creds!', icon: <GiftIcon className="w-8 h-8" /> },
      { type: 'XP_BOOSTER_ITEM', name: 'XP Booster!', item: SHOP_ITEMS.find((i) => i.id === 'booster-1') },
    ];
    const chosen = gifts[Math.floor(Math.random() * gifts.length)];

    onUpdateUser(user.id, (curr) => {
      const updated = { ...curr };
      switch (chosen.type) {
        case 'DOUBLE_CREDS':
          updated.creds = Math.floor(updated.creds * 2);
          break;
        case '1000_CREDS':
          updated.creds += 1000;
          break;
        case '10_CREDS':
          updated.creds += 10;
          break;
        case 'SHIELD_ITEM':
        case 'XP_BOOSTER_ITEM': {
          const item = (chosen as any).item;
          if (item) {
            const inv = { ...updated.inventory };
            inv[item.id] = (inv[item.id] || 0) + 1;
            updated.inventory = inv;
          }
          break;
        }
      }
      return updated;
    });

    setSurpriseGift({ name: chosen.name, icon: (chosen as any).item?.icon || <GiftIcon className="w-8 h-8" /> });
    setShowSurpriseBox(true);
  };

  const loadNextQuestionFromQueue = useCallback(() => {
    // bonus question chance after streak ≥ 2
    setIsBonusQuestion(sessionStreak >= 2 && Math.random() < 0.2);

    setQuestionQueue((prevQueue) => {
      const newQueue = [...prevQueue];
      const nextQuestion = newQueue.shift();
      setQuestion(nextQuestion || null);
      setSelectedAnswer(null);
      setIsAnswered(false);

      if (newQueue.length <= REFILL_THRESHOLD && selectedSubject === 'English' && !isRefilling) {
        fetchQuestionBatch(selectedSubject);
      }

      if (!nextQuestion && newQueue.length === 0 && !isRefilling) {
        setIsLoading(true);
        fetchQuestionBatch(selectedSubject!).then((newQs = []) => {
          const firstNew = newQs.shift();
          setQuestion(firstNew || null);
          setQuestionQueue(newQs);
          setIsLoading(false);
        });
      }

      return newQueue;
    });
  }, [selectedSubject, fetchQuestionBatch, isRefilling, sessionStreak]);

  const handleSubjectSelect = async (subject: Subject) => {
    playSound('click');
    setSelectedSubject(subject);
    setSessionStreak(0);
    setPenaltyLevel(0);
    setQuestion(null);
    setQuestionQueue([]);

    if (subject === 'English') {
      setIsLoading(true);
      await fetchQuestionBatch(subject);
      loadNextQuestionFromQueue(); // pull the first one
      setIsLoading(false);
    }
  };

  const handleEndSession = () => {
    playSound('click');
    setSelectedSubject(null);
    setQuestion(null);
  };

  const handleAnswer = (answer: string) => {
    if (isAnswered || !question) return;

    setSelectedAnswer(answer);
    setIsAnswered(true);

    const isCorrect = answer === question.correctAnswer;

    let newSessionStreak = sessionStreak;
    let newPenaltyLevel = penaltyLevel;

    if (isCorrect) {
      playSound('success');
      newSessionStreak += 1;
      setSessionStreak(newSessionStreak);
      setStreakAnimKey((k) => k + 1);
      setPenaltyLevel(0);
    } else {
      playSound('error');
      newPenaltyLevel += 1;
      setPenaltyLevel(newPenaltyLevel);
      setSessionStreak(0);
      newSessionStreak = 0;
    }

    onUpdateUser(user.id, (curr) => {
      let xpGained = 0;
      let credsGained = 0;
      let newOverallStreak = curr.streak;

      if (isCorrect) {
        xpGained = 50 + newSessionStreak * 10;
        if (isBonusQuestion) xpGained *= 2;
        credsGained = 10 + (newSessionStreak - 1) * 12;
        if (isBonusQuestion) credsGained *= 2;
        newOverallStreak += 1;
      } else {
        const credsLost = 5 + (newPenaltyLevel - 1) * 2;
        credsGained = -Math.min(curr.creds, credsLost);
        newOverallStreak = 0;
      }

      const newXp = curr.xp + xpGained;
      const xpForNextLevel = getXpForNextLevel(curr.level);
      let newLevel = curr.level;
      if (newXp >= xpForNextLevel) newLevel += 1;

      return {
        ...curr,
        xp: newXp,
        level: newLevel,
        creds: curr.creds + credsGained,
        streak: newOverallStreak,
      };
    });

    const wasBonusAndCorrect = isCorrect && isBonusQuestion;
    if (wasBonusAndCorrect) {
      setTimeout(() => determineAndAwardGift(), 1000);
    }

    setTimeout(() => {
      if (!wasBonusAndCorrect) {
        loadNextQuestionFromQueue();
      }
    }, 2500);
  };

  const getOptionClass = (option: string) => {
    if (!isAnswered) return 'play-option-button hover:border-cyan-400 hover:bg-cyan-900/50';

    const isCorrect = option === question?.correctAnswer;
    const isSelected = option === selectedAnswer;
    const wasAnsweredCorrectly = selectedAnswer === question?.correctAnswer;

    if (wasAnsweredCorrectly) {
      if (isCorrect) {
        return 'play-option-button bg-green-500/50 border-green-400 animate-pulse';
      }
    } else {
      if (isCorrect) {
        return 'play-option-button bg-green-500/50 border-green-400';
      }
      if (isSelected) {
        return 'play-option-button bg-red-500/50 border-red-400';
      }
    }

    return 'play-option-button opacity-50';
  };

  if (!selectedSubject) {
    return (
      <div className="p-2 md:p-6 animate-fade-in">
        <h2 className="text-2xl font-bold text-pink-400 mb-6 font-orbitron">&gt; Select Mission Subject</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => handleSubjectSelect(subject)}
              className="hacker-box p-4 text-center transition-transform transform hover:scale-105"
            >
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
    );
  }

  return (
    <>
      <div className="p-2 md:p-6 flex flex-col h-full">
        <div className="flex justify-between items-center mb-4 border-b border-cyan-500/20 pb-2">
          <div>
            <h2 className="text-2xl font-bold text-cyan-300 font-orbitron">&gt; Mission: {selectedSubject}</h2>
            <p className="text-sm text-gray-400">
              Correct Streak:
              <span className="font-bold text-green-400 relative ml-2">
                {sessionStreak}
                {sessionStreak > 0 && (
                  <span key={streakAnimKey} className="absolute -top-5 -right-10 text-lg animate-streak-pop">
                    🔥+{sessionStreak}
                  </span>
                )}
              </span>
            </p>
          </div>
          <button onClick={handleEndSession} className="hacker-button flex items-center gap-2">
            <XCircleIcon className="w-5 h-5" /> End Mission
          </button>
        </div>

        {isLoading ? (
          <div className="flex-1 flex justify-center items-center">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-cyan-400"></div>
            <p className="ml-4 text-lg">// Establishing secure connection to data node...</p>
          </div>
        ) : (
          question && (
            <div className="animate-fade-in flex-1">
              <div
                className={`mb-6 p-4 border rounded-lg bg-black/30 transition-all duration-500 ${
                  isBonusQuestion ? 'border-yellow-400 shadow-lg shadow-yellow-500/30' : 'border-cyan-500/50'
                }`}
              >
                <div className="flex justify-between items-center">
                  <p className="text-sm text-pink-400 mb-2 font-orbitron">// Topic: {question.topic}</p>
                  {isBonusQuestion && (
                    <p className="text-sm font-bold text-yellow-300 bg-yellow-900/50 px-2 py-1 rounded animate-pulse">BONUS ROUND</p>
                  )}
                </div>
                <p className="text-white play-question-text">{question.text}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {question.options.map((option) => (
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
                <div
                  className={`mt-6 text-center text-2xl font-bold animate-fade-in font-orbitron ${
                    selectedAnswer === question.correctAnswer ? 'text-green-400' : 'text-red-500'
                  }`}
                >
                  {selectedAnswer === question.correctAnswer ? '// CORRECT' : '// INCORRECT'}
                </div>
              )}
            </div>
          )
        )}

        {!isLoading && !question && (
          <div className="flex-1 flex justify-center items-center text-center">
            <p className="text-xl text-gray-400 my-8">// Mission data corrupted. Re-establishing link...</p>
          </div>
        )}
      </div>

      {showSurpriseBox && surpriseGift && (
        <SurpriseBoxModal
          gift={surpriseGift}
          onClose={() => {
            setShowSurpriseBox(false);
            setSurpriseGift(null);
            loadNextQuestionFromQueue();
          }}
        />
      )}
    </>
  );
};

export default Play;
