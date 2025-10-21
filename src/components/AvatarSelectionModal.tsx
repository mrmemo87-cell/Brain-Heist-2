import React, { useState, useRef } from 'react';
import { UploadIcon } from './ui/Icons';

interface AvatarSelectionModalProps {
    onClose: () => void;
    onAvatarSelect: (newAvatarUrl: string) => void;
}

const AVATAR_API = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=';
const avatarSeeds = [
    'Cipher', 'Glitch', 'Neon', 'Byte', 'Kernel', 'Root', 'Hex', 'Proxy', 
    'Socket', 'Vector', 'Matrix', 'Pulse', 'Zero', 'Echo', 'Void', 'Rogue'
];

const AvatarSelectionModal: React.FC<AvatarSelectionModalProps> = ({ onClose, onAvatarSelect }) => {
    const [selectedAvatar, setSelectedAvatar] = useState<string | null>(null);
    const [uploadedAvatar, setUploadedAvatar] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                const result = reader.result as string;
                setUploadedAvatar(result);
                setSelectedAvatar(result);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSave = () => {
        if (selectedAvatar) {
            onAvatarSelect(selectedAvatar);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in p-4" onClick={onClose}>
            <div className="hacker-box w-full max-w-lg p-6" onClick={e => e.stopPropagation()}>
                <h2 className="text-2xl font-bold font-orbitron text-cyan-300 mb-6 text-center">&gt; Select New Avatar</h2>
                
                <div className="grid grid-cols-4 gap-4 mb-6 max-h-[60vh] overflow-y-auto pr-2">
                    <div className="aspect-square">
                        <button
                            title="Upload custom avatar"
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-full rounded-lg border-4 border-dashed border-gray-600 hover:border-cyan-400 transition-all flex items-center justify-center text-gray-500 hover:text-cyan-400"
                        >
                            <UploadIcon className="w-10 h-10" />
                        </button>
                        <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
                    </div>
                    {uploadedAvatar && (
                         <div className="aspect-square" onClick={() => setSelectedAvatar(uploadedAvatar)}>
                            <img 
                                src={uploadedAvatar} 
                                alt="Uploaded Avatar"
                                className={`w-full h-full object-cover rounded-lg cursor-pointer transition-all duration-200 border-4 ${selectedAvatar === uploadedAvatar ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50' : 'border-transparent hover:border-cyan-700/50'}`}
                            />
                        </div>
                    )}
                    {avatarSeeds.map(seed => {
                        const url = `${AVATAR_API}${seed}`;
                        const isSelected = selectedAvatar === url;
                        return (
                            <div key={seed} className="aspect-square" onClick={() => setSelectedAvatar(url)}>
                                <img 
                                    src={url} 
                                    alt={`Avatar for ${seed}`}
                                    className={`w-full h-full rounded-lg cursor-pointer transition-all duration-200 border-4 ${isSelected ? 'border-cyan-400 scale-110 shadow-lg shadow-cyan-500/50' : 'border-transparent hover:border-cyan-700/50'}`}
                                />
                            </div>
                        );
                    })}
                </div>

                <div className="flex justify-end space-x-4 border-t border-green-500/20 pt-4">
                    <button onClick={onClose} className="hacker-button">&gt; Cancel</button>
                    <button 
                        onClick={handleSave} 
                        disabled={!selectedAvatar}
                        className="hacker-button hacker-button-primary"
                    >
                        &gt; Confirm Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default AvatarSelectionModal;