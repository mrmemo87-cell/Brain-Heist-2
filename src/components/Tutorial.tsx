import React, { useState, useEffect } from 'react';

interface TutorialProps {
    username: string;
    onClose: () => void;
    highlightStep: (step: number | null) => void;
}

const tutorialSteps = [
    {
        title: 'Welcome to Brain Heist!',
        text: "You're a new agent in the system. Let's get you acquainted with the terminal so you can start your climb to the top.",
        highlight: null,
    },
    {
        title: 'The Mission: Play to Earn',
        text: "Your main objective is on the 'Play' screen. Answer AI-generated trivia questions correctly to earn XP (Experience Points) and Coins. This is how you'll level up and fund your operations.",
        highlight: 1, // Corresponds to the "Play" nav item
    },
    {
        title: 'The Competition: Leaderboard',
        text: "The 'Leaderboard' is where you see how you rank against other agents. Keep an eye on your rivals here... you might find opportunities.",
        highlight: 2, // Corresponds to the "Leaderboard" nav item
    },
    {
        title: 'The Arsenal: The Shop',
        text: "Use your Coins in the 'Shop' to buy items. This is critical for increasing your hacking skills and your security level. You can buy offensive tools or defensive shields.",
        highlight: 3, // Corresponds to the "Shop" nav item
    },
    {
        title: 'The Loadout: Profile & Inventory',
        text: "Your 'Profile' shows your stats. More importantly, this is where you manage your 'Inventory'. Items bought from the shop MUST BE ACTIVATED here to take effect.",
        highlight: 4, // Corresponds to the "Profile" nav item
    },
    {
        title: 'The Heist: Hacking',
        text: "On the 'Leaderboard', you can use 'Hack' tools on other agents in your batch. Success steals their coins, but failure can cost you. A 'Firewall Shield', bought and activated, will protect you from one hack.",
        highlight: 2, // Highlight Leaderboard again for context
    },
    {
        title: 'Briefing Complete',
        text: "That's the rundown, agent. The rest is up to you. Answer questions, manage your gear, and dominate the network. Good luck.",
        highlight: null,
    },
];

const Tutorial: React.FC<TutorialProps> = ({ username, onClose, highlightStep }) => {
    const [step, setStep] = useState(0);
    const currentStep = tutorialSteps[step];

    useEffect(() => {
        highlightStep(currentStep.highlight);
    }, [step, highlightStep, currentStep.highlight]);
    
    const handleNext = () => {
        if (step < tutorialSteps.length - 1) {
            setStep(s => s + 1);
        } else {
            onClose();
        }
    };

    const handlePrev = () => {
        if (step > 0) {
            setStep(s => s - 1);
        }
    };

    return (
        <>
            <div className="tutorial-overlay animate-fade-in"></div>
            <div className="tutorial-modal w-[95vw] max-w-lg hacker-box p-6 animate-fade-in">
                <h2 className="text-2xl font-bold font-orbitron text-cyan-300 mb-4">&gt; Agent Briefing: {currentStep.title}</h2>
                <p className="text-gray-300 mb-6 whitespace-pre-wrap">{currentStep.text.replace('agent', username)}</p>
                <div className="flex justify-between items-center border-t border-green-500/20 pt-4">
                    <span className="text-sm text-gray-500">Step {step + 1} of {tutorialSteps.length}</span>
                    <div className="space-x-2">
                        <button onClick={handlePrev} disabled={step === 0} className="hacker-button">&lt; Prev</button>
                        <button onClick={handleNext} className="hacker-button hacker-button-primary">
                            {step === tutorialSteps.length - 1 ? 'Start Heist!' : 'Next >'}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Tutorial;