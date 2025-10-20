import React, { useState } from 'react';
import { GiftIcon } from './ui/Icons';

interface SurpriseBoxModalProps {
  gift: {
      name: string;
      icon: React.ReactNode;
  };
  onClose: () => void;
}

const SurpriseBoxModal: React.FC<SurpriseBoxModalProps> = ({ gift, onClose }) => {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        setIsOpen(true);
    }

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4">
            <div className="hacker-box w-full max-w-md p-6 text-center">
                {!isOpen ? (
                    <>
                        <h2 className="text-3xl font-bold font-orbitron text-yellow-300 mb-4">&gt; SURPRISE BOX!</h2>
                        <p className="text-gray-300 mb-6">You earned a reward for completing the bonus round. Click the box to see what you got!</p>
                        <button 
                            onClick={handleOpen} 
                            className="w-48 h-48 mx-auto my-4 text-yellow-400 animate-pulse transition-transform transform hover:scale-110"
                            aria-label="Open surprise box"
                        >
                            <GiftIcon className="w-full h-full" />
                        </button>
                    </>
                ) : (
                    <div className="animate-fade-in">
                        <h2 className="text-3xl font-bold font-orbitron text-cyan-300 mb-4">&gt; REWARD ACQUIRED</h2>
                        <div className="my-8 flex flex-col items-center gap-4">
                            <div className="text-cyan-400">{gift.icon}</div>
                            <p className="text-4xl font-bold font-orbitron text-white">{gift.name}</p>
                        </div>
                        <button onClick={onClose} className="hacker-button hacker-button-primary w-full mt-4">
                            &gt; Awesome!
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default SurpriseBoxModal;