import React, { useState, useEffect, useCallback } from 'react';
import type { User, Page, Item, LiveEvent, HackResult, Batch } from './types';
import { Page as PageEnum } from './types';
import { SHOP_ITEMS, INITIAL_EVENTS, HACK_SUCCESS_MESSAGES, HACK_FAIL_MESSAGES, ITEM_ACTIVATION_MESSAGES } from './constants';
import Login from './components/Login';
import Layout from './components/Layout';
import Profile from './components/Profile';
import Leaderboard from './components/Leaderboard';
import Play from './components/Play';
import Shop from './components/Shop';
import Tutorial from './components/Tutorial';
import HackResultModal from './components/HackResultModal';
import ProjectorView from './components/ProjectorView';
import GameOverView from './components/GameOverView';
import MatrixBackground from './components/MatrixBackground';
import { Howl, Howler } from 'howler';
/** ✅ NOTE: because App.tsx is at project root, import from ./src/lib/db */
import { upsertProfile, getLeaderboard } from './src/lib/db';
import { supabase } from './src/lib/supabase';
import { upsertProfile, getLeaderboard } from './src/lib/db';
import { supabase } from './src/lib/supabase';

async function syncToSupabase(u: User) {
  try {
    const res = await upsertProfile({
      username: u.name,
      batch: String(u.batch).toUpperCase(),
      xp: u.xp ?? 0,
    });
    if (!res) console.warn('syncToSupabase: upsert returned null');
  } catch (e) {
    console.error('syncToSupabase failed:', e);
  }
}

async function syncToSupabase(u: User) {
  try {
    await upsertProfile({
      username: u.name,
      batch: String(u.batch).toUpperCase(),
      xp: u.xp ?? 0,
    });
  } catch (e) {
    console.error('syncToSupabase failed:', e);
  }
}
const soundService = {
  sounds: {
    click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.5 }),
    success: new Howl({ src: ['/sounds/success.mp3'], volume: 0.5 }),
    error: new Howl({ src: ['/sounds/error.mp3'], volume: 0.5 }),
    hack: new Howl({ src: ['/sounds/hack.mp3'], volume: 0.5 }),
    bg: new Howl({ src: ['/sounds/bg.mp3'], volume: 0.2, loop: true, html5: true }),
  },
  play(soundName: 'click' | 'success' | 'error' | 'hack') {
    if (this.sounds[soundName]) this.sounds[soundName].play();
  },
  toggleMute() {
    Howler.mute(!Howler.mute());
    return Howler.mute();
  },
  startBgMusic() {
    if (!this.sounds.bg.playing()) this.sounds.bg.play();
  },
  stopBgMusic() {
    this.sounds.bg.stop();
  }
};

const AVATAR_API = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=';
const LOCAL_STORAGE_KEY_CURRENT_USER = 'brain-heist-user';
const LOCAL_STORAGE_KEY_USER_LIST = 'brain-heist-user-list';
const LOCAL_STORAGE_KEY_USER_PREFIX = 'brain-heist-user-';
const LOCAL_STORAGE_KEY_EVENTS = 'brain-heist-live-events';
const LOCAL_STORAGE_KEY_GAME_OVER = 'brain-heist-game-over';

const App: React.FC = () => {
  const [isProjectorView, setIsProjectorView] = useState(false);

  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(INITIAL_EVENTS);
  const [hackResult, setHackResult] = useState<HackResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialHighlight, setTutorialHighlight] = useState<number | null>(null);
  const [theme, setTheme] = useState<'classic' | 'modern'>('modern');
  const [gameOver, setGameOver] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(PageEnum.PROFILE);

  const syncAllUsersFromStorage = useCallback(() => {
    const userListJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_LIST);
    const userIdsFromList: string[] = userListJSON ? JSON.parse(userListJSON) : [];

    const userIdsFromScan: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LOCAL_STORAGE_KEY_USER_PREFIX)) {
        const userId = key.substring(LOCAL_STORAGE_KEY_USER_PREFIX.length);
        userIdsFromScan.push(userId);
      }
    }

    const allUserIds = Array.from(new Set([...userIdsFromList, ...userIdsFromScan]));
    const users: User[] = allUserIds.map(id => {
      const userJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + id);
      if (userJSON) {
        try { return JSON.parse(userJSON); }
        catch { return null; }
      }
      return null;
    }).filter((u): u is User => u !== null);

    setAllUsers(users);
    if (allUserIds.length !== userIdsFromList.length) {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_LIST, JSON.stringify(allUserIds));
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setIsProjectorView(params.get('view') === 'projector');

    try {
      const savedUser = localStorage.getItem(LOCAL_STORAGE_KEY_CURRENT_USER);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      syncAllUsersFromStorage();

      const savedEvents = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
      setLiveEvents(savedEvents ? JSON.parse(savedEvents) : INITIAL_EVENTS);

      const savedGameOver = localStorage.getItem(LOCAL_STORAGE_KEY_GAME_OVER);
      setGameOver(savedGameOver ? JSON.parse(savedGameOver) : false);
    } catch (e) {
      console.error('load state error', e);
    }

    document.body.className = theme;
  }, [theme, syncAllUsersFromStorage]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_KEY_USER_LIST || event.key?.startsWith(LOCAL_STORAGE_KEY_USER_PREFIX)) {
      syncAllUsersFromStorage();
      if (currentUser && event.key === LOCAL_STORAGE_KEY_USER_PREFIX + currentUser.id) {
        const updatedUserJSON = event.newValue;
        if (updatedUserJSON) setCurrentUser(JSON.parse(updatedUserJSON));
      }
    }
    if (event.key === LOCAL_STORAGE_KEY_EVENTS) {
      setLiveEvents(event.newValue ? JSON.parse(event.newValue) : []);
    }
    if (event.key === LOCAL_STORAGE_KEY_GAME_OVER) {
      setGameOver(event.newValue ? JSON.parse(event.newValue) : false);
    }
  }, [currentUser, syncAllUsersFromStorage]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange]);

  const updateEventsAtomically = useCallback((updateFn: (events: LiveEvent[]) => LiveEvent[]) => {
    const eventsJSON = localStorage.getItem(LOCAL_STORAGE_KEY_EVENTS);
    const currentEvents: LiveEvent[] = eventsJSON ? JSON.parse(eventsJSON) : INITIAL_EVENTS;
    const newEvents = updateFn(currentEvents);
    localStorage.setItem(LOCAL_STORAGE_KEY_EVENTS, JSON.stringify(newEvents));
    setLiveEvents(newEvents);
  }, []);

  const addLiveEvent = useCallback((type: LiveEvent['type'], message: string) => {
    updateEventsAtomically(currentEvents => {
      const newEvent: LiveEvent = { id: `evt${Date.now()}${Math.random()}`, type, message, timestamp: Date.now(), reactions: {} };
      return [newEvent, ...currentEvents].slice(0, 20);
    });
  }, [updateEventsAtomically]);

  const handleUpdateUser = useCallback((userId: string, updateFn: (user: User) => User) => {
    const userJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + userId);
    if (!userJSON) return;
    const user = JSON.parse(userJSON);
    const updatedUser = updateFn(user);
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PREFIX + userId, JSON.stringify(updatedUser));

    if (currentUser?.id === updatedUser.id) {
      setCurrentUser(updatedUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(updatedUser));
    }
    setAllUsers(prev => prev.map(u => u.id === updatedUser.id ? updatedUser : u));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || gameOver) return;
    const interval = setInterval(() => {
      handleUpdateUser(currentUser.id, (user) => {
        if (user.stamina.current >= user.stamina.max) return user;
        const newStamina = Math.min(user.stamina.max, user.stamina.current + 1);
        return { ...user, stamina: { ...user.stamina, current: newStamina }};
      });
    }, 5000);
    return () => clearInterval(interval);
  }, [currentUser, gameOver, handleUpdateUser]);

  useEffect(() => {
    if (!currentUser || gameOver) return;
    const activityInterval = setInterval(() => {
      handleUpdateUser(currentUser.id, (user) => ({
        ...user,
        lastActiveTimestamp: Date.now()
      }));
    }, 30000);
    return () => clearInterval(activityInterval);
  }, [currentUser, gameOver, handleUpdateUser]);

  /** ✅ reflect/merge with Supabase **/
  const syncToSupabase = async (u: User) => {
    try {
      await upsertProfile({ username: u.name, batch: (u.batch as string), xp: u.xp });
    } catch (e) {
      console.error('upsertProfile failed', e);
    }
  };

  const handleLogin = (username: string, batch: Batch): string | null => {
    soundService.play('click');
    const userId = username.toLowerCase().replace(/\s/g, '');
    const existingUserJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + userId);

    if (existingUserJSON) {
      let existingUser: User = JSON.parse(existingUserJSON);
      existingUser.lastActiveTimestamp = Date.now();
      setCurrentUser(existingUser);
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_PREFIX + existingUser.id, JSON.stringify(existingUser));
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(existingUser));
      soundService.startBgMusic();
      syncToSupabase(existingUser);
      return null;
    }

    const newUser: User = {
      id: userId,
      name: username,
      avatar: `${AVATAR_API}${username}`,
      bio: 'A new agent has entered the system...',
      batch: batch,
      xp: 0, level: 1, creds: 500, streak: 0,
      hackingSkill: 10, securityLevel: 10,
      stamina: { current: 50, max: 50 },
      inventory: {
        'upgrade-hack-1': 1,
        'upgrade-sec-1': 1,
        'upgrade-stam-1': 1,
      },
      activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } },
      lastActiveTimestamp: Date.now(),
    };

    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PREFIX + newUser.id, JSON.stringify(newUser));

    const userListJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_LIST);
    const userIds: string[] = userListJSON ? JSON.parse(userListJSON) : [];
    if (!userIds.includes(newUser.id)) {
      localStorage.setItem(LOCAL_STORAGE_KEY_USER_LIST, JSON.stringify([...userIds, newUser.id]));
    }

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(newUser));

    if (!localStorage.getItem('brain-heist-tutorial-complete')) setShowTutorial(true);
    soundService.startBgMusic();
    syncToSupabase(newUser);
    return null;
  };

  const handleLogout = () => {
    soundService.play('click');
    localStorage.removeItem(LOCAL_STORAGE_KEY_CURRENT_USER);
    setCurrentUser(null);
    soundService.stopBgMusic();
  };

  const handleHack = useCallback((targetUser: User) => {
    if (!currentUser) return;

    const hackerJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + currentUser.id);
    const targetJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + targetUser.id);
    if (!hackerJSON || !targetJSON) return;

    let hacker: User = JSON.parse(hackerJSON);
    let target: User = JSON.parse(targetJSON);

    const cooldownDuration = 60 * 60 * 1000; // 1 hour
    if (target.lastHackedTimestamp && Date.now() - target.lastHackedTimestamp < cooldownDuration) {
      setHackResult({
        targetName: target.name, success: false,
        message: `HACK FAILED: ${target.name}'s systems are under lockdown protocol. Cooldown active.`,
        shieldUsed: false
      });
      return;
    }

    if (hacker.stamina.current < 10) return;
    soundService.play('hack');

    let result: HackResult;
    hacker.stamina.current -= 10;
    hacker.lastActiveTimestamp = Date.now();

    if (target.activeEffects.shielded) {
      target.activeEffects.shielded = false;
      const message = `🛡️ HACK FAILED: ${hacker.name}'s intrusion was blocked by ${target.name}'s Firewall Shield. The shield was consumed.`;
      result = { targetName: target.name, success: false, message, shieldUsed: true };
      addLiveEvent('HACK_SHIELDED', message);
    } else {
      target.lastHackedTimestamp = Date.now();
      const successChance = Math.max(0.1, Math.min(0.9, 0.5 + (hacker.hackingSkill - target.securityLevel) / 100));
      if (Math.random() < successChance) {
        const credsStolen = Math.floor(target.creds * (0.1 + Math.random() * 0.15));
        hacker.creds += credsStolen;
        target.creds -= credsStolen;
        const message = HACK_SUCCESS_MESSAGES[Math.floor(Math.random() * HACK_SUCCESS_MESSAGES.length)]
          .replace('{hacker}', hacker.name).replace('{target}', target.name).replace('{creds}', credsStolen.toLocaleString());
        result = { targetName: target.name, success: true, message, shieldUsed: false };
        addLiveEvent('HACK_SUCCESS', message);
      } else {
        const credsLost = Math.floor(hacker.creds * 0.05);
        hacker.creds -= credsLost;
        target.creds += credsLost;
        const message = HACK_FAIL_MESSAGES[Math.floor(Math.random() * HACK_FAIL_MESSAGES.length)]
          .replace('{hacker}', hacker.name).replace('{target}', target.name).replace('{creds}', credsLost.toLocaleString());
        result = { targetName: target.name, success: false, message, shieldUsed: false };
        addLiveEvent('HACK_FAIL', message);
      }
    }

    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PREFIX + hacker.id, JSON.stringify(hacker));
    localStorage.setItem(LOCAL_STORAGE_KEY_USER_PREFIX + target.id, JSON.stringify(target));

    if (currentUser?.id === hacker.id) {
      setCurrentUser(hacker);
      localStorage.setItem(LOCAL_STORAGE_KEY_CURRENT_USER, JSON.stringify(hacker));
    }
    setHackResult(result);
    syncAllUsersFromStorage();
  }, [currentUser, addLiveEvent, syncAllUsersFromStorage]);

  const handleActivateItem = (item: Item) => {
    if (!currentUser) return;
    soundService.play('success');

    handleUpdateUser(currentUser.id, (user) => {
      let updatedUser = { ...user, lastActiveTimestamp: Date.now() };
      const newInventory = { ...updatedUser.inventory };
      if (newInventory[item.id] > 0) {
        newInventory[item.id] -= 1;
        if (newInventory[item.id] === 0) delete newInventory[item.id];
      } else {
        return user;
      }
      updatedUser.inventory = newInventory;

      switch (item.type) {
        case 'shield': updatedUser.activeEffects.shielded = true; break;
        case 'upgrade':
          if (item.effects?.hackingSkill) updatedUser.hackingSkill += item.effects.hackingSkill;
          if (item.effects?.securityLevel) updatedUser.securityLevel += item.effects.securityLevel;
          if (item.effects?.maxStamina) {
            updatedUser.stamina.max += item.effects.maxStamina;
            updatedUser.stamina.current += item.effects.maxStamina;
          }
          break;
      }
      return updatedUser;
    });

    const message = ITEM_ACTIVATION_MESSAGES[Math.floor(Math.random() * ITEM_ACTIVATION_MESSAGES.length)]
      .replace('{user}', currentUser.name).replace('{item}', item.name);
    addLiveEvent('ITEM_ACTIVATION', message);
  };

  const handleReact = (eventId: string, emoji: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;

    updateEventsAtomically(currentEvents => {
      return currentEvents.map(event => {
        if (event.id === eventId) {
          const newReactions = { ...event.reactions };
          const userAlreadyReactedWithEmoji = newReactions[emoji]?.includes(userId);

          Object.keys(newReactions).forEach(key => {
            newReactions[key] = newReactions[key]?.filter(id => id !== userId);
            if (newReactions[key]?.length === 0) delete newReactions[key];
          });

          if (!userAlreadyReactedWithEmoji) {
            if (!newReactions[emoji]) newReactions[emoji] = [];
            newReactions[emoji].push(userId);
          }
          return { ...event, reactions: newReactions };
        }
        return event;
      });
    });

    handleUpdateUser(currentUser.id, u => ({ ...u, lastActiveTimestamp: Date.now() }));
  };

  const finishHeist = useCallback(() => {
    setGameOver(true);
    localStorage.setItem(LOCAL_STORAGE_KEY_GAME_OVER, JSON.stringify(true));
  }, []);

  useEffect(() => {
    document.body.className = theme;
  }, [theme]);

  /** ✅ reflect XP changes to Supabase */
  useEffect(() => {
    if (!currentUser) return;
    syncToSupabase(currentUser);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser?.xp]);

useEffect(() => {
  if (!currentUser) return;
  const channel = supabase
    .channel('profiles-realtime')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
      getLeaderboard(String(currentUser.batch)).then(rows => {
        const merged = rows.map(r => {
          const id = r.username.toLowerCase().replace(/\s/g, '');
          return {
            id,
            name: r.username,
            avatar: `${AVATAR_API}${r.username}`,
            bio: 'Classmate',
            batch: r.batch,
            xp: r.xp,
            level: 1, creds: 0, streak: 0,
            hackingSkill: 10, securityLevel: 10,
            stamina: { current: 50, max: 50 },
            inventory: {},
            activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } },
            lastActiveTimestamp: Date.now()
          };
        });
        const byId = new Map(allUsers.map(u => [u.id, u]));
        merged.forEach(u => byId.set(u.id, { ...(byId.get(u.id) || u), xp: u.xp, batch: u.batch }));
        setAllUsers(Array.from(byId.values()).sort((a, b) => b.xp - a.xp));
      }).catch(console.error);
    })
    .subscribe();
 return () => {
    supabase.removeChannel(channel);
  };
// ✅ only resubscribe when the batch changes (or user changes)
}, [currentUser?.batch]); 
useEffect(() => {
  if (!currentUser) return;
  if (currentPage === PageEnum.LEADERBOARD) {
    getLeaderboard(String(currentUser.batch)).then(rows => {
      // merge into your local user list, or keep a separate leaderboard list
      // simplest: just map rows to a display list in the Leaderboard component
    }).catch(console.error);
  }
}, [currentPage, currentUser]);

  /** ✅ pull classmates from Supabase */
  useEffect(() => {
    let cancelled = false;

    const fetchClassmates = async () => {
      if (!currentUser) return;
      try {
        const rows = await getLeaderboard(String(currentUser.batch));
        if (cancelled) return;

        const merged: User[] = rows.map(r => {
          const id = r.username.toLowerCase().replace(/\s/g, '');
          const existingJSON = localStorage.getItem(LOCAL_STORAGE_KEY_USER_PREFIX + id);
          const base: User = existingJSON
            ? JSON.parse(existingJSON)
            : {
                id,
                name: r.username,
                avatar: `${AVATAR_API}${r.username}`,
                bio: 'Classmate',
                batch: (r.batch as Batch),
                xp: r.xp,
                level: 1,
                creds: 0,
                streak: 0,
                hackingSkill: 10,
                securityLevel: 10,
                stamina: { current: 50, max: 50 },
                inventory: {},
                activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } },
                lastActiveTimestamp: Date.now()
              };
          base.xp = r.xp;
          base.batch = (r.batch as Batch);
          return base;
        });

        const byId = new Map<string, User>();
        [...merged, ...allUsers].forEach(u => byId.set(u.id, u));
        setAllUsers(Array.from(byId.values()).sort((a, b) => b.xp - a.xp));
      } catch (e) {
        console.error('fetch leaderboard failed', e);
      }
    };

    fetchClassmates();
    const shouldPoll = currentPage === PageEnum.LEADERBOARD;
    const interval = shouldPoll ? setInterval(fetchClassmates, 5000) : undefined;

    return () => {
      cancelled = true;
      if (interval) clearInterval(interval);
    };
  }, [currentUser, currentPage]); // eslint-disable-line react-hooks/exhaustive-deps

  if (isProjectorView) {
    return (
      <main className="w-full h-screen">
        <MatrixBackground />
        <ProjectorView
          allUsers={allUsers}
          liveEvents={liveEvents}
          onFinishHeist={finishHeist}
          gameOver={gameOver}
        />
      </main>
    );
  }

  if (gameOver) {
    return (
      <main className="w-full h-screen">
        <MatrixBackground />
        {currentUser && <GameOverView user={currentUser} allUsers={allUsers} />}
      </main>
    );
  }

  if (!currentUser) {
    return (
      <main className="w-full h-screen flex items-center justify-center p-4">
        <MatrixBackground />
        <Login onLogin={handleLogin} />
      </main>
    );
  }

  return (
    <div className="w-full h-screen p-2 md:p-4">
      <MatrixBackground />
      <Layout
        user={currentUser}
        onLogout={handleLogout}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        soundService={soundService}
        tutorialHighlight={tutorialHighlight}
        theme={theme}
        onToggleTheme={() => setTheme(t => t === 'classic' ? 'modern' : 'classic')}
      >
        {(() => {
  switch (currentPage) {
    case PageEnum.PROFILE:
      return (
        <Profile
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          onActivateItem={handleActivateItem}
          theme={theme}
        />
      );
    case PageEnum.LEADERBOARD:
      return (
        <Leaderboard
          allUsers={allUsers}
          currentUser={currentUser}
          liveEvents={liveEvents}
          onHack={handleHack}
          onReact={handleReact}
          theme={theme}
        />
      );
    case PageEnum.PLAY:
      return (
        <Play
          user={currentUser}
          onUpdateUser={handleUpdateUser}
          playSound={(s) => soundService.play(s)}
        />
      );
    // Use PageEnum since "Page" is a type
    case PageEnum.SHOP:
      return <Shop user={currentUser} onUpdateUser={handleUpdateUser} items={SHOP_ITEMS} />;
    default:
      return null;
  }
})()}
      </Layout>
      {showTutorial && <Tutorial username={currentUser.name} onClose={() => { setShowTutorial(false); setTutorialHighlight(null); localStorage.setItem('brain-heist-tutorial-complete', 'true'); }} highlightStep={setTutorialHighlight} />}
      {hackResult && <HackResultModal result={hackResult} onClose={() => setHackResult(null)} />}
    </div>
  );
};

export default App;
