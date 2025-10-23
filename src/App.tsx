import React, { useState, useEffect, useCallback } from 'react';
import type { User, Page, Item, LiveEvent, HackResult, Batch } from '@/types';
import { Page as PageEnum } from '@/types';
import {
  SHOP_ITEMS,
  INITIAL_EVENTS,
  HACK_SUCCESS_MESSAGES,
  HACK_FAIL_MESSAGES,
  ITEM_ACTIVATION_MESSAGES,
} from '@/constants';

import Login from '@/components/Login';
import Layout from '@/components/Layout';
import Profile from '@/components/Profile';
import Leaderboard from '@/components/Leaderboard';
import Play from '@/components/Play';
import Shop from '@/components/Shop';
import Tutorial from '@/components/Tutorial';
import HackResultModal from '@/components/HackResultModal';
import MatrixBackground from '@/components/MatrixBackground';
import { saveStats, upsertProfile } from '@/lib/db';
import { Howl, Howler } from 'howler';
import { supabase } from '@/lib/supabase';

const soundService = {
  sounds: {
    click: new Howl({ src: ['/sounds/click.mp3'], volume: 0.5 }),
    success: new Howl({ src: ['/sounds/success.mp3'], volume: 0.5 }),
    error: new Howl({ src: ['/sounds/error.mp3'], volume: 0.5 }),
    hack: new Howl({ src: ['/sounds/hack.mp3'], volume: 0.5 }),
    correct: new Howl({ src: ['/sounds/correct.mp3'], volume: 0.5 }),
    wrong: new Howl({ src: ['/sounds/wrong.mp3'], volume: 0.5 }),
    hack_win: new Howl({ src: ['/sounds/hack_win.mp3'], volume: 0.5 }),
    hack_fail: new Howl({ src: ['/sounds/hack_fail.mp3'], volume: 0.5 }),
    level_up: new Howl({ src: ['/sounds/level_up.mp3'], volume: 0.5 }),
    activate: new Howl({ src: ['/sounds/activate.mp3'], volume: 0.5 }),
    buy: new Howl({ src: ['/sounds/buy.mp3'], volume: 0.5 }),
    collect: new Howl({ src: ['/sounds/collect.mp3'], volume: 0.5 }),
    bg: new Howl({ src: ['/sounds/bg.mp3'], volume: 0.2, loop: true, html5: true }),
  },
  play(name:
    | 'click' | 'success' | 'error' | 'hack' | 'correct'
    | 'wrong' | 'hack_win' | 'hack_fail' | 'level_up'
    | 'activate' | 'buy' | 'collect') {
    // @ts-ignore
    const s = this.sounds[name]; if (s) s.play();
  },
  toggleMute() { const any = Howler as any; const next = !Boolean(any._muted); Howler.mute(next); return next; },
  startBgMusic() { if (!this.sounds.bg.playing()) this.sounds.bg.play(); },
  stopBgMusic() { this.sounds.bg.stop(); },
};

const AVATAR_API = 'https://api.dicebear.com/7.x/pixel-art/svg?seed=';
const LS_CUR = 'brain-heist-user';
const LS_LIST = 'brain-heist-user-list';
const LS_USER_PREFIX = 'brain-heist-user-';
const LS_EVENTS = 'brain-heist-live-events';
const LS_GAMEOVER = 'brain-heist-game-over';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [liveEvents, setLiveEvents] = useState<LiveEvent[]>(INITIAL_EVENTS);
  const [hackResult, setHackResult] = useState<HackResult | null>(null);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialHighlight, setTutorialHighlight] = useState<number | null>(null);
  const [theme, setTheme] = useState<'classic' | 'modern'>('modern');
  const [gameOver, setGameOver] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>(PageEnum.PROFILE);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (!data.session) { await supabase.auth.signInAnonymously().catch(() => {}); }
    })();
  }, []);

  const syncAllUsersFromStorage = useCallback(() => {
    const listJSON = localStorage.getItem(LS_LIST);
    const userIdsFromList: string[] = listJSON ? JSON.parse(listJSON) : [];
    const userIdsFromScan: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(LS_USER_PREFIX)) userIdsFromScan.push(key.substring(LS_USER_PREFIX.length));
    }
    const allUserIds = Array.from(new Set([...userIdsFromList, ...userIdsFromScan]));
    const users: User[] = allUserIds
      .map(id => {
        const j = localStorage.getItem(LS_USER_PREFIX + id);
        if (!j) return null;
        try { return JSON.parse(j); } catch { return null; }
      }).filter((u): u is User => !!u);

    setAllUsers(users);
    if (allUserIds.length !== userIdsFromList.length) localStorage.setItem(LS_LIST, JSON.stringify(allUserIds));
  }, []);

  useEffect(() => {
    try {
      const savedUser = localStorage.getItem(LS_CUR);
      if (savedUser) setCurrentUser(JSON.parse(savedUser));
      syncAllUsersFromStorage();
      const savedEvents = localStorage.getItem(LS_EVENTS);
      setLiveEvents(savedEvents ? JSON.parse(savedEvents) : INITIAL_EVENTS);
      const savedGO = localStorage.getItem(LS_GAMEOVER);
      setGameOver(savedGO ? JSON.parse(savedGO) : false);
    } catch (e) { console.error('load state error', e); }
    document.body.className = theme;
  }, [theme, syncAllUsersFromStorage]);

  const handleStorageChange = useCallback((event: StorageEvent) => {
    if (event.key === LS_LIST || event.key?.startsWith(LS_USER_PREFIX)) {
      syncAllUsersFromStorage();
      if (currentUser && event.key === LS_USER_PREFIX + currentUser.id) {
        if (event.newValue) setCurrentUser(JSON.parse(event.newValue));
      }
    }
    if (event.key === LS_EVENTS) setLiveEvents(event.newValue ? JSON.parse(event.newValue) : []);
    if (event.key === LS_GAMEOVER) setGameOver(event.newValue ? JSON.parse(event.newValue) : false);
  }, [currentUser, syncAllUsersFromStorage]);

  useEffect(() => {
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [handleStorageChange]);

  const updateEventsAtomically = useCallback((fn: (e: LiveEvent[]) => LiveEvent[]) => {
    const j = localStorage.getItem(LS_EVENTS);
    const cur: LiveEvent[] = j ? JSON.parse(j) : INITIAL_EVENTS;
    const next = fn(cur);
    localStorage.setItem(LS_EVENTS, JSON.stringify(next));
    setLiveEvents(next);
  }, []);
  const addLiveEvent = useCallback((type: LiveEvent['type'], message: string) => {
    updateEventsAtomically(cur => {
      const e: LiveEvent = { id: `evt${Date.now()}${Math.random()}`, type, message, timestamp: Date.now(), reactions: {} };
      return [e, ...cur].slice(0, 20);
    });
  }, [updateEventsAtomically]);

  const handleUpdateUser = useCallback((userId: string, fn: (u: User) => User) => {
    const j = localStorage.getItem(LS_USER_PREFIX + userId);
    if (!j) return;
    const u = JSON.parse(j);
    const nu = fn(u);
    localStorage.setItem(LS_USER_PREFIX + userId, JSON.stringify(nu));
    if (currentUser?.id === nu.id) {
      setCurrentUser(nu);
      localStorage.setItem(LS_CUR, JSON.stringify(nu));
    }
    setAllUsers(prev => prev.map(x => (x.id === nu.id ? nu : x)));
  }, [currentUser?.id]);

  useEffect(() => {
    if (!currentUser || gameOver) return;
    const t = setInterval(() => {
      handleUpdateUser(currentUser.id, u => {
        if (u.stamina.current >= u.stamina.max) return u;
        return { ...u, stamina: { ...u.stamina, current: Math.min(u.stamina.max, u.stamina.current + 1) } };
      });
    }, 5000);
    return () => clearInterval(t);
  }, [currentUser, gameOver, handleUpdateUser]);

  useEffect(() => {
    if (!currentUser || gameOver) return;
    const t = setInterval(() => {
      handleUpdateUser(currentUser.id, u => ({ ...u, lastActiveTimestamp: Date.now() }));
    }, 30000);
    return () => clearInterval(t);
  }, [currentUser, gameOver, handleUpdateUser]);

  const handleLogin = (username: string, batch: Batch): string | null => {
    soundService.play('click');
    const userId = username.toLowerCase().replace(/\s/g, '');
    const key = LS_USER_PREFIX + userId;
    const existing = localStorage.getItem(key);

    if (existing) {
      const u: User = { ...JSON.parse(existing), lastActiveTimestamp: Date.now() };
      setCurrentUser(u);
      localStorage.setItem(key, JSON.stringify(u));
      localStorage.setItem(LS_CUR, JSON.stringify(u));
      soundService.startBgMusic();
      saveStats({
        username: u.name, batch: String(u.batch), xp: u.xp, creds: u.creds,
        hacking: u.hackingSkill, security: u.securityLevel,
        stamina_current: u.stamina.current, stamina_max: u.stamina.max, bio: u.bio ?? '',
      }).catch(console.error);
      return null;
    }

    const newUser: User = {
      id: userId,
      name: username,
      avatar: `${AVATAR_API}${username}`,
      bio: 'A new agent has entered the system...',
      batch,
      xp: 0, level: 1, creds: 500, streak: 0,
      hackingSkill: 10, securityLevel: 10,
      stamina: { current: 50, max: 50 },
      inventory: { 'upgrade-hack-1': 1, 'upgrade-sec-1': 1, 'upgrade-stam-1': 1 },
      activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } },
      lastActiveTimestamp: Date.now(),
    };

    localStorage.setItem(key, JSON.stringify(newUser));
    const listJSON = localStorage.getItem(LS_LIST);
    const list: string[] = listJSON ? JSON.parse(listJSON) : [];
    if (!list.includes(newUser.id)) localStorage.setItem(LS_LIST, JSON.stringify([...list, newUser.id]));

    setAllUsers(prev => [...prev, newUser]);
    setCurrentUser(newUser);
    localStorage.setItem(LS_CUR, JSON.stringify(newUser));

    if (!localStorage.getItem('brain-heist-tutorial-complete')) setShowTutorial(true);
    soundService.startBgMusic();
    saveStats({
      username: newUser.name, batch: String(newUser.batch), xp: newUser.xp, creds: newUser.creds,
      hacking: newUser.hackingSkill, security: newUser.securityLevel,
      stamina_current: newUser.stamina.current, stamina_max: newUser.stamina.max, bio: newUser.bio ?? '',
    }).catch(console.error);
    return null;
  };

  const handleLogout = () => {
    soundService.play('click');
    localStorage.removeItem(LS_CUR);
    setCurrentUser(null);
    soundService.stopBgMusic();
  };

  const handleHack = useCallback((targetUser: User) => {
    if (!currentUser) return;
    const hackerKey = LS_USER_PREFIX + currentUser.id;
    const targetKey = LS_USER_PREFIX + targetUser.id;
    const hj = localStorage.getItem(hackerKey);
    const tj = localStorage.getItem(targetKey);
    if (!hj || !tj) return;

    let hacker: User = JSON.parse(hj);
    let target: User = JSON.parse(tj);
    const sameBatch = String(hacker.batch || '').toUpperCase() === String(target.batch || '').toUpperCase();
    if (!sameBatch) return;

    const cooldownMs = 60 * 60 * 1000;
    if (target.lastHackedTimestamp && Date.now() - target.lastHackedTimestamp < cooldownMs) {
      setHackResult({ targetName: target.name, success: false,
        message: `HACK FAILED: ${target.name}'s systems are under lockdown protocol. Cooldown active.`,
        shieldUsed: false });
      return;
    }

    if ((hacker.stamina?.current ?? 0) < 10) return;
    soundService.play('hack');

    let result: HackResult;
    hacker.stamina.current = Math.max(0, (hacker.stamina?.current ?? 0) - 10);
    hacker.lastActiveTimestamp = Date.now();

    if (target.activeEffects?.shielded) {
      target.activeEffects.shielded = false;
      const message = `🛡️ HACK FAILED: ${hacker.name}'s intrusion was blocked by ${target.name}'s Firewall Shield. The shield was consumed.`;
      result = { targetName: target.name, success: false, message, shieldUsed: true };
      addLiveEvent('HACK_SHIELDED', message);
      soundService.play('hack_fail');
    } else {
      target.lastHackedTimestamp = Date.now();
      const chance = Math.max(0.1, Math.min(0.9, 0.5 + (hacker.hackingSkill - target.securityLevel) / 100));
      if (Math.random() < chance) {
        const steal = Math.floor((target.creds ?? 0) * (0.1 + Math.random() * 0.15));
        hacker.creds = (hacker.creds ?? 0) + steal;
        target.creds = Math.max(0, (target.creds ?? 0) - steal);
        const message = HACK_SUCCESS_MESSAGES[Math.floor(Math.random() * HACK_SUCCESS_MESSAGES.length)]
          .replace('{hacker}', hacker.name).replace('{target}', target.name).replace('{creds}', steal.toLocaleString());
        result = { targetName: target.name, success: true, message, shieldUsed: false };
        addLiveEvent('HACK_SUCCESS', message);
        soundService.play('hack_win');
      } else {
        const loss = Math.floor((hacker.creds ?? 0) * 0.05);
        hacker.creds = Math.max(0, (hacker.creds ?? 0) - loss);
        target.creds = (target.creds ?? 0) + loss;
        const message = HACK_FAIL_MESSAGES[Math.floor(Math.random() * HACK_FAIL_MESSAGES.length)]
          .replace('{hacker}', hacker.name).replace('{target}', target.name).replace('{creds}', loss.toLocaleString());
        result = { targetName: target.name, success: false, message, shieldUsed: false };
        addLiveEvent('HACK_FAIL', message);
        soundService.play('hack_fail');
      }
    }

    localStorage.setItem(hackerKey, JSON.stringify(hacker));
    localStorage.setItem(targetKey, JSON.stringify(target));
    if (currentUser?.id === hacker.id) {
      setCurrentUser(hacker);
      localStorage.setItem(LS_CUR, JSON.stringify(hacker));
    }
    setHackResult(result);
    syncAllUsersFromStorage();

    saveStats({
      username: hacker.name, batch: String(hacker.batch), xp: hacker.xp, creds: hacker.creds,
      hacking: hacker.hackingSkill, security: hacker.securityLevel,
      stamina_current: hacker.stamina.current, stamina_max: hacker.stamina.max, bio: hacker.bio ?? '',
    }).catch(console.error);
    saveStats({
      username: target.name, batch: String(target.batch), xp: target.xp, creds: target.creds,
      hacking: target.hackingSkill, security: target.securityLevel,
      stamina_current: target.stamina.current, stamina_max: target.stamina.max, bio: target.bio ?? '',
    }).catch(console.error);
  }, [currentUser, addLiveEvent, syncAllUsersFromStorage]);

  const handleActivateItem = (item: Item) => {
    if (!currentUser) return;
    soundService.play('success');

    handleUpdateUser(currentUser.id, (u) => {
      let nu = { ...u, lastActiveTimestamp: Date.now() };
      const inv = { ...nu.inventory };
      if (inv[item.id] > 0) {
        inv[item.id] -= 1;
        if (inv[item.id] === 0) delete inv[item.id];
      } else { return u; }
      nu.inventory = inv;

      switch (item.type) {
        case 'shield': nu.activeEffects.shielded = true; break;
        case 'upgrade':
          if (item.effects?.hackingSkill) nu.hackingSkill += item.effects.hackingSkill;
          if (item.effects?.securityLevel) nu.securityLevel += item.effects.securityLevel;
          if (item.effects?.maxStamina) {
            nu.stamina.max += item.effects.maxStamina;
            nu.stamina.current += item.effects.maxStamina;
          }
          break;
      }
      return nu;
    });

    const uname = currentUser?.name ?? 'Player';
    const message =
      ITEM_ACTIVATION_MESSAGES[Math.floor(Math.random() * ITEM_ACTIVATION_MESSAGES.length)]
        .replace('{user}', uname).replace('{item}', item.name);
    addLiveEvent('ITEM_ACTIVATION', message);
    soundService.play('activate');

    const after = localStorage.getItem(LS_USER_PREFIX + currentUser.id);
    if (after) {
      const u: User = JSON.parse(after);
      saveStats({
        username: u.name, batch: String(u.batch), xp: u.xp, creds: u.creds,
        hacking: u.hackingSkill, security: u.securityLevel,
        stamina_current: u.stamina.current, stamina_max: u.stamina.max, bio: u.bio ?? '',
      }).catch(console.error);
    }
  };

  const handleReact = (eventId: string, emoji: string) => {
    if (!currentUser) return;
    const userId = currentUser.id;
    updateEventsAtomically(cur => cur.map(e => {
      if (e.id !== eventId) return e;
      const r = { ...e.reactions };
      const already = r[emoji]?.includes(userId);
      Object.keys(r).forEach(k => {
        r[k] = r[k]?.filter(id => id !== userId);
        if (!r[k]?.length) delete r[k];
      });
      if (!already) { (r[emoji] ??= []).push(userId); }
      return { ...e, reactions: r };
    }));
    handleUpdateUser(currentUser.id, u => ({ ...u, lastActiveTimestamp: Date.now() }));
  };

  return (
    <div className="w-full h-screen p-2 md:p-4 relative">
      <MatrixBackground />
      <Layout
        user={currentUser}
        onLogout={handleLogout}
        currentPage={currentPage}
        setCurrentPage={setCurrentPage}
        soundService={soundService}
        tutorialHighlight={tutorialHighlight}
        theme={theme}
        onToggleTheme={() => setTheme(t => (t === 'classic' ? 'modern' : 'classic'))}
      >
        {!currentUser ? (
          // keep login narrow and centered by Layout's max-w-xl
          <Login onLogin={handleLogin} />
        ) : (
          (() => {
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
                    currentUser={currentUser as any}
                    liveEvents={liveEvents}
                    onHack={handleHack}
                    onReact={handleReact}
                    theme={theme}
                  />
                );
              case PageEnum.PLAY:
                return <Play user={currentUser} onUpdateUser={handleUpdateUser} playSound={(s) => soundService.play(s as any)} />;
              case PageEnum.SHOP:
                return <Shop user={currentUser} onUpdateUser={handleUpdateUser} items={SHOP_ITEMS} />;
              default:
                return null;
            }
          })()
        )}
      </Layout>

      {currentUser && showTutorial && (
        <Tutorial
          username={currentUser.name}
          onClose={() => {
            setShowTutorial(false);
            setTutorialHighlight(null);
            localStorage.setItem('brain-heist-tutorial-complete', 'true');
          }}
          highlightStep={setTutorialHighlight}
        />
      )}

      {hackResult && <HackResultModal result={hackResult} onClose={() => setHackResult(null)} />}
    </div>
  );
};

export default App;
