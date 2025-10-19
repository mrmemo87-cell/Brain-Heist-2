import React, { useState, useCallback, useEffect } from 'react';
import type { User, Item, Batch, LiveEvent, LiveEventType, HackResult } from './types';
import { Page } from './types';
import { USERS, SHOP_ITEMS, INITIAL_EVENTS, HACK_SUCCESS_MESSAGES, HACK_FAIL_MESSAGES, ITEM_ACTIVATION_MESSAGES } from './constants';
import Login from './components/Login';
import Layout from './components/Layout';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Play from './components/Play';
import Shop from './components/Shop';
import Tutorial from './components/Tutorial';
import HackResultModal from './components/HackResultModal';

const soundService = {
  sounds: {} as { [key: string]: HTMLAudioElement | null },
  isMuted: false,
  musicStarted: false,
  load: () => {
    soundService.sounds = {
      click: new Audio('https://cdn.pixabay.com/audio/2021/08/04/audio_541489e7f8.mp3'),
      success: new Audio('https://cdn.pixabay.com/audio/2022/03/15/audio_731c312788.mp3'),
      error: new Audio('https://cdn.pixabay.com/audio/2022/01/18/audio_7ac372c366.mp3'),
      hack: new Audio('https://cdn.pixabay.com/audio/2023/11/22/audio_49b5b82269.mp3'),
      type: new Audio('https://cdn.pixabay.com/audio/2022/03/07/audio_c35f8c0e40.mp3'),
      backgroundMusic: document.getElementById('bg-music') as HTMLAudioElement,
    };
    Object.values(soundService.sounds).forEach(sound => { if(sound) sound.volume = 0.3; });
    if (soundService.sounds.backgroundMusic) {
      soundService.sounds.backgroundMusic.volume = 0.1;
    }
  },
  play: (soundName: 'click' | 'success' | 'error' | 'hack' | 'type') => {
    if (!soundService.isMuted && soundService.sounds[soundName]) {
      soundService.sounds[soundName]!.currentTime = 0;
      soundService.sounds[soundName]!.play().catch(e => {});
    }
  },
  startMusic: () => {
    if (!soundService.musicStarted && soundService.sounds.backgroundMusic) {
        soundService.sounds.backgroundMusic.play().catch(e => {
            console.warn("Background music autoplay was prevented. User may need to interact more.", e);
        });
        soundService.musicStarted = true;
    }
  },
  toggleMute: () => {
    soundService.isMuted = !soundService.isMuted;
    Object.values(soundService.sounds).forEach(sound => {
      if(sound) sound.muted = soundService.isMuted;
    });
    return soundService.isMuted;
  }
};

const getRandomMessage = (messageBank: string[], params: Record<string, string | number>): string => {
    const template = messageBank[Math.floor(Math.random() * messageBank.length)];
    return Object.entries(params).reduce((msg, [key, value]) => {
        return msg.replace(new RegExp(`{${key}}`, 'g'), String(value));
    }, template);
}

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(USERS);
  const [currentPage, setCurrentPage] = useState<Page>(Page.PLAY);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(INITIAL_EVENTS);
  const [hackResult, setHackResult] = useState<HackResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialHighlight, setTutorialHighlight] = useState<number | null>(null);
  const [theme, setTheme] = useState<'classic' | 'modern'>('classic');
  
  useEffect(() => {
    soundService.load();
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  const handleToggleTheme = useCallback(() => {
    setTheme(prev => (prev === 'classic' ? 'modern' : 'classic'));
    soundService.play('click');
  }, []);

  const updateUserState = useCallback((updatedUser: User) => {
    setUsers(prevUsers => prevUsers.map(u => u.id === updatedUser.id ? updatedUser : u));
    if (currentUser?.id === updatedUser.id) {
        setCurrentUser(updatedUser);
    }
  }, [currentUser]);

  const addLiveEvent = useCallback((type: LiveEventType, message: string) => {
    const newEvent: LiveEvent = {
        id: `event-${Date.now()}-${Math.random()}`,
        type,
        message,
        timestamp: Date.now(),
        reactions: {}
    };
    setLiveEvents(prev => [newEvent, ...prev].slice(0, 50));
  }, []);

  const handleReact = useCallback((eventId: string, emoji: string) => {
    if (!currentUser) return;
    setLiveEvents(prevEvents => prevEvents.map(event => {
        if (event.id === eventId) {
            const newReactions = { ...event.reactions };
            // User can only react once. Remove previous reaction if any.
            Object.keys(newReactions).forEach(key => {
                newReactions[key] = newReactions[key].filter(userId => userId !== currentUser.id);
            });

            // Add new reaction
            if (!newReactions[emoji]) {
                newReactions[emoji] = [];
            }
            newReactions[emoji].push(currentUser.id);

            return { ...event, reactions: newReactions };
        }
        return event;
    }));
  }, [currentUser]);

  const handleHackAttempt = useCallback((targetUser: User) => {
    if (!currentUser) return;
    if (targetUser.id === currentUser.id || targetUser.batch !== currentUser.batch) return;

    const STAMINA_COST = 10;
    if (currentUser.stamina.current < STAMINA_COST) {
        console.error("Not enough stamina");
        return;
    }
    
    soundService.play('hack');

    const hacker = { ...currentUser, stamina: { ...currentUser.stamina, current: currentUser.stamina.current - STAMINA_COST } };
    let target = { ...users.find(u => u.id === targetUser.id)! };
    
    let effectiveHackingSkill = hacker.hackingSkill;
    let effectiveSecurityLevel = target.securityLevel;

    const hackerStaminaModifier = (hacker.stamina.current / hacker.stamina.max - 0.5) * 0.2; // +/- 10% effectiveness
    const targetStaminaModifier = (target.stamina.current / target.stamina.max - 0.5) * 0.2; // +/- 10% vulnerability
    effectiveHackingSkill *= (1 + hackerStaminaModifier);
    effectiveSecurityLevel *= (1 - targetStaminaModifier);

    let shieldUsed = false;
    if (target.activeEffects.shielded) {
        effectiveSecurityLevel += 20; // Huge temporary boost from shield
        shieldUsed = true;
    }
    
    const skillDifference = effectiveHackingSkill - effectiveSecurityLevel;
    const successChance = Math.max(0.1, Math.min(0.9, 0.5 + skillDifference * 0.05));
    
    let liveEventMessage = '';
    let modalMessage = '';
    let success = false;

    if (Math.random() < successChance) {
        success = true;
        const credsToSteal = Math.floor(10 + Math.random() * (target.creds * 0.75));
        const credsStolen = Math.min(target.creds, credsToSteal);
        hacker.creds += credsStolen;
        target.creds -= credsStolen;
        
        const params = { hacker: hacker.name, target: target.name, creds: credsStolen };
        liveEventMessage = getRandomMessage(HACK_SUCCESS_MESSAGES, params);
        modalMessage = `HACK SUCCESSFUL! You breached ${target.name}'s network and plundered ${credsStolen} creds!`;
        addLiveEvent('HACK_SUCCESS', liveEventMessage);
        soundService.play('success');
    } else {
        success = false;
        const credsToLose = Math.floor(10 + Math.random() * (hacker.creds * 0.50));
        const credsLost = Math.min(hacker.creds, credsToLose);
        hacker.creds -= credsLost;
        target.creds += credsLost;
        
        const params = { hacker: hacker.name, target: target.name, creds: credsLost };
        liveEventMessage = getRandomMessage(HACK_FAIL_MESSAGES, params);
        modalMessage = `HACK FAILED! Your attack backfired against ${target.name}, costing you ${credsLost} creds.`;
        addLiveEvent('HACK_FAIL', liveEventMessage);
        soundService.play('error');
    }

    if (shieldUsed) {
        target.activeEffects.shielded = false;
    }

    updateUserState(hacker);
    updateUserState(target);
    setHackResult({ targetName: target.name, success, message: modalMessage, shieldUsed });

  }, [currentUser, users, addLiveEvent, updateUserState]);

  const handleItemActivation = useCallback((item: Item) => {
    if (!currentUser) return;
    
    let updatedUser = { ...currentUser };
    let itemUsed = false;
    let feedbackMessage = '';

    if (item.type === 'shield' && !updatedUser.activeEffects.shielded) {
        updatedUser.activeEffects.shielded = true;
        feedbackMessage = getRandomMessage(ITEM_ACTIVATION_MESSAGES, { user: updatedUser.name, item: 'Firewall Shield' });
        itemUsed = true;
    } else if (item.type === 'upgrade' && item.effects) {
        updatedUser.hackingSkill += item.effects.hackingSkill || 0;
        updatedUser.securityLevel += item.effects.securityLevel || 0;
        if (item.effects.maxStamina) {
            updatedUser.stamina.max += item.effects.maxStamina;
            updatedUser.stamina.current += item.effects.maxStamina; // Also refills stamina
        }
        feedbackMessage = getRandomMessage(ITEM_ACTIVATION_MESSAGES, { user: updatedUser.name, item: item.name });
        itemUsed = true;
    }

    if(itemUsed) {
      const newInventory = { ...updatedUser.inventory };
      if (newInventory[item.id] > 1) {
          newInventory[item.id] -= 1;
      } else {
          delete newInventory[item.id];
      }
      updatedUser.inventory = newInventory;

      addLiveEvent('ITEM_ACTIVATION', feedbackMessage);
      soundService.play('success');
      updateUserState(updatedUser);
    }
  }, [currentUser, addLiveEvent, updateUserState]);

  const handleLogin = useCallback((username: string, batch: Batch): string | null => {
    const existingUser = users.find(u => u.name.toLowerCase() === username.trim().toLowerCase());
    
    if (existingUser) {
        if (existingUser.batch === batch) {
            setCurrentUser(existingUser);
            soundService.play('success');
            soundService.startMusic();
            return null;
        } else {
            soundService.play('error');
            return `Agent '${existingUser.name}' is already registered in batch ${existingUser.batch}.`;
        }
    } else {
        const newUser: User = {
            id: `u${users.length + 1}`,
            name: username.trim(),
            avatar: `https://i.pravatar.cc/150?u=${username.trim()}`,
            bio: 'New agent on the block.',
            batch: batch,
            xp: 0,
            level: 1,
            creds: 100,
            streak: 0,
            hackingSkill: 5,
            securityLevel: 5,
            stamina: { current: 50, max: 50 },
            inventory: {},
            activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } },
        };
        setUsers(prev => [...prev, newUser]);
        setCurrentUser(newUser);
        setShowTutorial(true); // Trigger tutorial for new user
        soundService.play('success');
        soundService.startMusic();
        return null;
    }
  }, [users]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
  }, []);

  const renderPage = () => {
    if (!currentUser) return null;
    switch (currentPage) {
      case Page.PROFILE:
        return <Profile user={currentUser} onUpdateUser={updateUserState} onActivateItem={handleItemActivation} theme={theme} />;
      case Page.LEADERBOARD:
        return <Leaderboard allUsers={users} currentUser={currentUser} liveEvents={liveEvents} onHack={handleHackAttempt} onReact={handleReact} theme={theme} />;
      case Page.PLAY:
        return <Play user={currentUser} onUpdateUser={updateUserState} playSound={soundService.play} />;
      case Page.SHOP:
        return <Shop user={currentUser} onUpdateUser={updateUserState} items={SHOP_ITEMS} />;
      default:
        return <Play user={currentUser} onUpdateUser={updateUserState} playSound={soundService.play} />;
    }
  };

  if (!currentUser) {
    return (
        <div className="w-screen h-screen bg-black/80 flex items-center justify-center p-4">
            <Login onLogin={handleLogin} />
        </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-y-auto md:overflow-hidden p-2 md:p-4">
        <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
        {hackResult && <HackResultModal result={hackResult} onClose={() => setHackResult(null)} />}
        {showTutorial && (
            <Tutorial 
                username={currentUser.name} 
                onClose={() => {
                    setShowTutorial(false);
                    setTutorialHighlight(null);
                }}
                highlightStep={setTutorialHighlight}
            />
        )}
        <Layout 
            user={currentUser} 
            onLogout={handleLogout} 
            currentPage={currentPage}
            setCurrentPage={setCurrentPage}
            soundService={soundService}
            tutorialHighlight={tutorialHighlight}
            theme={theme}
            onToggleTheme={handleToggleTheme}
        >
            {renderPage()}
        </Layout>
    </div>
  );
};

export default App;
