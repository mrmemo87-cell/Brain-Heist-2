import React, { useState } from 'react';
import type { User, Item } from '../types';
import { getXpForNextLevel, SHOP_ITEMS } from '../constants';
import { TerminalIcon, ShieldIcon, ZapIcon, PencilIcon } from './ui/Icons';
import RadialGauge from './ui/RadialGauge';
import AvatarSelectionModal from './AvatarSelectionModal';

interface ProfileProps {
  user: User;
  onUpdateUser: (userId: string, updateFn: (user: User) => User) => void;
  onActivateItem: (item: Item) => void;
  theme: 'classic' | 'modern';
}

const StatBar: React.FC<{ value: number; maxValue?: number; label:string; icon: React.ReactNode; colorClass: string; }> = ({ value, maxValue, label, icon, colorClass }) => {
    const percentage = maxValue ? (value / maxValue) * 100 : 100;
    return (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2 text-lg font-semibold">
                    {icon}
                    <span>{label}</span>
                </div>
                <span className="font-mono text-lg">{value}{maxValue ? `/${maxValue}`: ''}</span>
            </div>
            <div className={`w-full bg-gray-900 rounded-full h-4 border-2 border-gray-700 p-0.5`}>
                <div 
                    className={`${colorClass} h-full rounded-full transition-all duration-500`}
                    style={{ width: `${percentage}%` }}
                ></div>
            </div>
        </div>
    );
};

const XpBar: React.FC<{ currentXp: number; level: number }> = ({ currentXp, level }) => {
  const xpForNext = getXpForNextLevel(level);
  const xpForPrev = level > 1 ? getXpForNextLevel(level - 1) : 0;
  
  const totalXpInLevel = xpForNext - xpForPrev;
  const currentXpInLevel = currentXp - xpForPrev;
  const percentage = Math.max(0, Math.min(100, (currentXpInLevel / totalXpInLevel) * 100));

  return (
    <div className="w-full">
        <div className="flex justify-between items-center text-sm text-gray-400 mb-1 font-mono">
            <span>LVL {level}</span>
            <span>{currentXpInLevel.toLocaleString()} / {totalXpInLevel.toLocaleString()} XP</span>
            <span>LVL {level + 1}</span>
        </div>
        <div className="w-full bg-gray-900 rounded-full h-4 border-2 border-green-900 p-0.5">
            <div 
                className="bg-gradient-to-r from-pink-500 to-cyan-400 h-full rounded-full transition-all duration-500"
                style={{ width: `${percentage}%`, boxShadow: '0 0 10px var(--secondary-glow)' }}
            ></div>
        </div>
    </div>
  );
};


const Profile: React.FC<ProfileProps> = ({ user, onUpdateUser, onActivateItem, theme }) => {
    const [bio, setBio] = useState(user.bio);
    const [isEditing, setIsEditing] = useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);

    const handleBioSave = () => {
        onUpdateUser(user.id, (currentUserState) => ({ ...currentUserState, bio }));
        setIsEditing(false);
    }

  return (
    <>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 flex flex-col items-center p-6 hacker-box">
            <div className="relative group w-32 h-32 md:w-40 md:h-40 mb-4">
                <img src={user.avatar} alt={user.name} className="w-full h-full rounded-full border-4 border-cyan-400 shadow-lg shadow-cyan-500/30"/>
                <div 
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="absolute inset-0 bg-black/70 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-full cursor-pointer"
                >
                    <PencilIcon className="w-10 h-10 text-white" />
                </div>
            </div>

            <h3 className="text-3xl font-bold font-orbitron">{user.name}</h3>
            <p className="text-gray-400">{user.batch}</p>
            
            <div className="mt-6 w-full text-center">
                 {isEditing ? (
                    <textarea 
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                        className="w-full hacker-input h-24 resize-none"
                    />
                 ) : (
                    <p className="text-gray-300 italic">"{user.bio}"</p>
                 )}
                 <button onClick={isEditing ? handleBioSave : () => setIsEditing(true)} className="mt-2 text-sm text-cyan-400 hover:underline">
                    {isEditing ? 'Save Bio' : 'Edit Bio'}
                 </button>
            </div>
        </div>

        <div className="md:col-span-2 p-6 hacker-box space-y-6">
            <div>
                 <h3 className="text-2xl font-bold text-pink-400 font-orbitron mb-4">&gt; Agent Statistics</h3>
                <XpBar currentXp={user.xp} level={user.level} />
            </div>
            {theme === 'modern' ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 place-items-center">
                    <RadialGauge value={user.hackingSkill} maxValue={100} label="Hacking" color="hsl(340, 100%, 60%)" size={120} icon={<TerminalIcon className="w-6 h-6" />} />
                    <RadialGauge value={user.securityLevel} maxValue={100} label="Security" color="hsl(195, 100%, 50%)" size={120} icon={<ShieldIcon className="w-6 h-6" />} />
                    <RadialGauge value={user.stamina.current} maxValue={user.stamina.max} label="Stamina" color="hsl(50, 100%, 50%)" size={120} icon={<ZapIcon className="w-6 h-6" />} />
                </div>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <StatBar label="Hacking Skill" value={user.hackingSkill} icon={<TerminalIcon className="w-6 h-6" />} colorClass="bg-gradient-to-r from-red-500 to-pink-500" />
                    <StatBar label="Security Level" value={user.securityLevel} icon={<ShieldIcon className="w-6 h-6" />} colorClass="bg-gradient-to-r from-blue-500 to-cyan-500" />
                    <StatBar label="Stamina" value={user.stamina.current} maxValue={user.stamina.max} icon={<ZapIcon className="w-6 h-6" />} colorClass="bg-gradient-to-r from-yellow-400 to-orange-500" />
                </div>
            )}
            <div className="p-4 hacker-box">
                <h4 className="font-bold text-lg text-cyan-300 mb-2">&gt; Inventory</h4>
                {Object.keys(user.inventory).length > 0 ? (
                    <div className="space-y-2">
                      {Object.keys(user.inventory).map((itemId) => {
                        const quantity = user.inventory[itemId];
                        const item = SHOP_ITEMS.find(i => i.id === itemId);
                        if (!item) return null;
                        const isActivatable = item.type === 'booster' || item.type === 'shield' || item.type === 'upgrade';
                        return (
                          <div key={itemId} className="flex justify-between items-center bg-black/30 p-2 rounded">
                            <span className="flex items-center gap-2">{item.icon} {item.name} {quantity > 1 && <span className="text-xs text-gray-400">(x{quantity})</span>}</span>
                            {isActivatable && (
                                <button onClick={() => onActivateItem(item)} className="hacker-button text-xs px-2 py-1">Activate</button>
                            )}
                          </div>
                        );
                      })}
                      {user.activeEffects.shielded && <div className="text-cyan-300 p-2 rounded bg-cyan-900/50 mt-2">Firewall Shield is ACTIVE</div>}
                    </div>
                ) : (
                    <p className="text-gray-500 italic">SYSTEM: Inventory empty.</p>
                )}
            </div>
        </div>
    </div>
    {isAvatarModalOpen && (
        <AvatarSelectionModal 
            onClose={() => setIsAvatarModalOpen(false)}
            onAvatarSelect={(newAvatarUrl) => {
                onUpdateUser(user.id, (currentUserState) => ({ ...currentUserState, avatar: newAvatarUrl }));
                setIsAvatarModalOpen(false);
            }}
        />
    )}
    </>
  );
};

export default Profile;
