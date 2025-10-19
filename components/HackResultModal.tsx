import React, { useState, useEffect } from 'react';
import type { HackResult } from '../types';

interface HackResultModalProps {
    result: HackResult;
    onClose: () => void;
}

const HACK_ANIMATION_TEXT = [
    '// Establishing connection to target node...',
    '// Bypassing primary firewall...',
    '// Exploiting kernel vulnerability CVE-2024-H3IST...',
    '// Accessing root directory...',
    '// Siphoning data packets...',
    '// Covering tracks...',
    '// Disconnecting from host...',
    '// Operation complete.',
];

const HackResultModal: React.FC<HackResultModalProps> = ({ result, onClose }) => {
    const [displayText, setDisplayText] = useState('');
    const [currentLine, setCurrentLine] = useState(0);
    const [isAnimating, setIsAnimating] = useState(true);
    const [showResult, setShowResult] = useState(false);

    useEffect(() => {
        let textToAnimate = [...HACK_ANIMATION_TEXT];
        if (result.shieldUsed) {
            textToAnimate.splice(2, 0, '// WARNING: High-level encryption detected. Firewall Shield active...');
        }

        if (currentLine < textToAnimate.length) {
            const timeout = setTimeout(() => {
                setDisplayText(prev => prev + textToAnimate[currentLine] + '\n');
                setCurrentLine(line => line + 1);
            }, 300 + Math.random() * 200);
            return () => clearTimeout(timeout);
        } else {
            setIsAnimating(false);
            setTimeout(() => setShowResult(true), 500);
        }
    }, [currentLine, result.shieldUsed]);

    const resultColor = result.success ? 'text-green-400 border-green-500' : 'text-red-400 border-red-500';

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-2" onClick={onClose}>
            <div className={`hacker-box w-[95vw] max-w-lg p-4 md:p-6 border-2 ${showResult ? (result.success ? 'border-green-500' : 'border-red-500') : 'border-primary-glow'}`} onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl md:text-2xl font-bold font-orbitron text-pink-400">&gt; Hacking: {result.targetName}</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </div>
                <div className="bg-black/50 p-4 h-64 font-mono text-sm overflow-y-auto border border-gray-700">
                    <pre className="whitespace-pre-wrap">{displayText}</pre>
                    {isAnimating && <span className="typing-caret"></span>}
                    {showResult && (
                        <div className={`mt-4 p-4 border-2 ${resultColor} animate-fade-in ${!result.success && 'animate-modal-glitch'}`}>
                           <h3 className="font-bold text-lg mb-2">++ HACK COMPLETE ++</h3>
                           <p>{result.message}</p>
                           {result.shieldUsed && !result.success && <p className="text-cyan-300 text-sm mt-2">// Target's Firewall Shield absorbed most of the impact and was consumed.</p>}
                        </div>
                    )}
                </div>
                <button onClick={onClose} className="hacker-button hacker-button-primary w-full mt-4">
                    &gt; Close Terminal
                </button>
            </div>
        </div>
    );
};

export default HackResultModal;