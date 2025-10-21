import React, { useState } from 'react';
import type { User, Item } from '../types';

interface ShopProps {
  user: User;
  onUpdateUser: (userId: string, updateFn: (user: User) => User) => void;
  items: Item[];
}

const Shop: React.FC<ShopProps> = ({ user, onUpdateUser, items }) => {
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleBuy = (item: Item) => {
    setFeedback(null);
    // Perform pre-flight checks on UI state to prevent obviously invalid actions
    if (user.creds < item.price) {
      setFeedback({ message: 'Error: Insufficient funds!', type: 'error' });
      return;
    }
    if (item.levelRequirement && user.level < item.levelRequirement) {
        setFeedback({ message: `Error: Requires Level ${item.levelRequirement}`, type: 'error' });
        return;
    }
    if (user.inventory[item.id] > 0 && item.type !== 'upgrade') {
      setFeedback({ message: 'Error: Item already in inventory.', type: 'error' });
      return;
    }

    onUpdateUser(user.id, (currentUserState) => {
        // Re-validate inside the atomic update to ensure correctness
        if (currentUserState.creds < item.price) {
            setFeedback({ message: 'Error: Insufficient funds!', type: 'error' });
            return currentUserState; // Abort update
        }

        const newInventory = { ...currentUserState.inventory };
        newInventory[item.id] = (newInventory[item.id] || 0) + 1;

        setFeedback({ message: `Success: ${item.name} acquired.`, type: 'success' });

        return {
          ...currentUserState,
          creds: currentUserState.creds - item.price,
          inventory: newInventory,
        };
    });
    
    setTimeout(() => setFeedback(null), 3000);
  };

  const getButtonText = (item: Item): string => {
      if (item.levelRequirement && user.level < item.levelRequirement) {
          return `Lvl ${item.levelRequirement} Req.`;
      }
      if (user.inventory[item.id] > 0 && item.type !== 'upgrade') {
          return 'Owned';
      }
      return `Buy (${item.price} Creds)`;
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-pink-400 mb-4 font-orbitron">&gt; Item Shop</h2>
       {feedback && (
        <div className={`mb-4 p-3 rounded text-center font-mono ${feedback.type === 'success' ? 'bg-green-900/50 text-green-300 border border-green-500' : 'bg-red-900/50 text-red-300 border border-red-500'}`}>
          {feedback.message}
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {items.map((item) => (
          <div key={item.id} className="hacker-box p-4 flex flex-col justify-between hover:border-cyan-500 hover:shadow-[0_0_15px_rgba(0,208,232,0.5)] transition-all duration-300 transform hover:-translate-y-1">
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <div className="text-cyan-400">{item.icon}</div>
                  <h3 className="text-xl font-bold text-white font-orbitron">{item.name}</h3>
                </div>
                {item.levelRequirement && <span className="text-xs font-bold text-yellow-400 bg-yellow-900/50 px-2 py-1 rounded">LVL {item.levelRequirement}+</span>}
              </div>
              <p className="text-gray-400 text-sm mb-4 h-10">// {item.description}</p>
              {item.effects && (
                  <div className="text-sm text-green-300 bg-green-900/30 p-2 rounded mb-4">
                      {item.effects.hackingSkill && <p>+ {item.effects.hackingSkill} Hacking Skill</p>}
                      {item.effects.securityLevel && <p>+ {item.effects.securityLevel} Security Level</p>}
                      {item.effects.maxStamina && <p>+ {item.effects.maxStamina} Max Stamina</p>}
                  </div>
              )}
            </div>
            <button
              onClick={() => handleBuy(item)}
              disabled={
                user.creds < item.price || 
                (item.levelRequirement && user.level < item.levelRequirement) ||
                (user.inventory[item.id] > 0 && item.type !== 'upgrade')
              }
              className="w-full mt-2 font-semibold py-2 hacker-button"
            >
              {getButtonText(item)}
            </button>
          </div>
        ))}
      </div>
       <div className="mt-8 p-4 hacker-box">
          <h3 className="text-xl font-bold text-cyan-300 mb-2 font-orbitron">&gt; Your Inventory</h3>
           {Object.keys(user.inventory).length > 0 ? (
              <div className="flex flex-wrap gap-4">
                  {Object.keys(user.inventory).map((itemId) => {
                      const quantity = user.inventory[itemId];
                      const item = items.find(i => i.id === itemId);
                      return item ? (
                          <div key={itemId} className="flex items-center space-x-2 p-2 bg-black/50 rounded border border-green-900">
                              <span className="text-cyan-400">{item.icon}</span>
                              <span className="text-white">{item.name}</span>
                              {quantity > 1 && <span className="text-xs text-gray-400 font-mono">x{quantity}</span>}
                          </div>
                      ) : null;
                  })}
              </div>
          ) : (
              <p className="text-gray-500 italic">// Your inventory is empty. Visit the shop to get items!</p>
          )}
      </div>
    </div>
  );
};

export default Shop;
