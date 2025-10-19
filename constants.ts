import React from 'react';
import type { User, Item, LiveEvent, Subject } from './types';
import { ShieldIcon, ZapIcon, ImageIcon, TerminalIcon } from './components/ui/Icons';

export const USERS: User[] = [
  { id: 'u1', name: 'Cipher', avatar: 'https://i.pravatar.cc/150?u=cipher', bio: 'Cracking codes and climbing ranks.', batch: '8A', xp: 1250, level: 5, creds: 500, streak: 3, hackingSkill: 10, securityLevel: 5, stamina: { current: 50, max: 50 }, inventory: { 'shield-1': 1 }, activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } } },
  { id: 'u2', name: 'Glitch', avatar: 'https://i.pravatar.cc/150?u=glitch', bio: 'In the system, I am the ghost.', batch: '8B', xp: 2500, level: 7, creds: 1200, streak: 10, hackingSkill: 15, securityLevel: 10, stamina: { current: 50, max: 50 }, inventory: { 'booster-1': 1 }, activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } } },
  { id: 'u3', name: 'Neon', avatar: 'https://i.pravatar.cc/150?u=neon', bio: 'Bright ideas, faster execution.', batch: '8A', xp: 800, level: 4, creds: 350, streak: 1, hackingSkill: 5, securityLevel: 5, stamina: { current: 50, max: 50 }, inventory: {}, activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } } },
  { id: 'u4', name: 'Zero', avatar: 'https://i.pravatar.cc/150?u=zero', bio: 'From nothing, everything.', batch: '8C', xp: 3100, level: 8, creds: 2000, streak: 15, hackingSkill: 20, securityLevel: 15, stamina: { current: 60, max: 60 }, inventory: { 'shield-1': 1, 'booster-1': 1 }, activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } } },
  { id: 'u5', name: 'Sobbi', avatar: 'https://i.pravatar.cc/150?u=sobbi', bio: 'Admin & Instructor', batch: '8A', xp: 99999, level: 100, creds: 99999, streak: 99, hackingSkill: 100, securityLevel: 100, stamina: { current: 100, max: 100 }, inventory: {}, activeEffects: { shielded: false, xpBoost: { active: false, expiry: null } } },
];

export const SHOP_ITEMS: Item[] = [
  { id: 'shield-1', name: 'Firewall Shield', description: 'Massively boosts your Security Level against one incoming hack attempt. Consumed after use.', price: 200, type: 'shield', icon: React.createElement(ShieldIcon, { className: "w-8 h-8" }) },
  { id: 'upgrade-hack-1', name: 'Data Spike', description: 'Permanent Upgrade: Increases Hacking Skill by 5.', price: 400, type: 'upgrade', icon: React.createElement(TerminalIcon, { className: "w-8 h-8" }), effects: { hackingSkill: 5 } },
  { id: 'upgrade-sec-1', name: 'Security Protocol', description: 'Permanent Upgrade: Increases Security Level by 5.', price: 400, type: 'upgrade', icon: React.createElement(ShieldIcon, { className: "w-8 h-8" }), effects: { securityLevel: 5 } },
  { id: 'upgrade-stam-1', name: 'Neuro-Link Capacitor', description: 'Permanent Upgrade: Increases Max Stamina by 10.', price: 500, type: 'upgrade', icon: React.createElement(ZapIcon, { className: "w-8 h-8" }), effects: { maxStamina: 10 }, levelRequirement: 3 },
  { id: 'booster-1', name: 'XP Booster (2x)', description: 'Doubles XP gain for 10 minutes.', price: 350, type: 'booster', icon: React.createElement(ZapIcon, { className: "w-8 h-8" }) },
  { id: 'cosmetic-1', name: 'Glitch Avatar Frame', description: 'A cool animated frame for your avatar.', price: 500, type: 'cosmetic', icon: React.createElement(ImageIcon, { className: "w-8 h-8" }) },
];

export const INITIAL_EVENTS: LiveEvent[] = [
    {id: 'evt1', type: 'ITEM_ACTIVATION', message: 'System Initialized. Welcome, Agents.', timestamp: Date.now(), reactions: {}},
]

export const SUBJECTS: Subject[] = ['Science', 'Maths', 'English', 'Global Perspective', 'Russian Language', 'Russian Literature', 'German Language', 'Geography', 'Kyrgyz Language', 'Kyrgyz History'];

export const getXpForNextLevel = (level: number): number => Math.ceil(100 * Math.pow(level, 1.5));

// Message Banks for Live Feed
export const HACK_SUCCESS_MESSAGES = [
  "💸 {hacker} breached {target}'s defenses and siphoned {creds} creds. Easy money.",
  "💥 {hacker} just pulled a fast one on {target}, walking away with {creds} creds.",
  "😎 Ghosted. {hacker} slipped past {target}'s security, securing a payload of {creds} creds.",
  "🚨 INTRUSION ALERT: {hacker} successfully exploited {target}'s network for {creds} creds.",
  "😂 {hacker} made {target}'s firewall look like a joke. Loot: {creds} creds.",
];

export const HACK_FAIL_MESSAGES = [
  "🛡️ DENIED. {hacker}'s attack on {target} backfired spectacularly, costing them {creds} creds.",
  "🤦‍♂️ Ouch. {hacker} tripped the wire on {target}'s system and lost {creds} creds for their trouble.",
  "🔥 REVERSED! {target}'s defenses were too strong, redirecting {hacker}'s attack and draining {creds} of their creds.",
  "🚫 ACCESS DENIED. {hacker} tried to hack {target}, but ended up funding their account with {creds} creds instead.",
  "🤡 A script kiddie move from {hacker}. {target} not only blocked the attack but gained {creds} creds.",
];

export const ITEM_ACTIVATION_MESSAGES = [
    "⚙️ {user} integrated {item}. System capabilities enhanced.",
    "⚡️ Power up! {user} just activated a {item}.",
    "✅ {user} brought a new toy online: {item}.",
    "🚀 {user} engaged their {item}. Ready for action.",
];
