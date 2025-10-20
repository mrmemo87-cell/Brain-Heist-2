// Fix: Import React types to resolve 'Cannot find namespace React' error.
import type * as React from 'react';

export enum Page {
  PROFILE = 'PROFILE',
  LEADERBOARD = 'LEADERBOARD',
  PLAY = 'PLAY',
  SHOP = 'SHOP'
}

export type Batch = '8A' | '8B' | '8C';

export interface Item {
  id: string;
  name: string;
  description: string;
  price: number;
  type: 'booster' | 'shield' | 'cosmetic' | 'hack' | 'upgrade';
  icon: React.ReactNode;
  effects?: {
      hackingSkill?: number;
      securityLevel?: number;
      maxStamina?: number;
  };
  levelRequirement?: number;
}

export interface User {
  id: string;
  name: string;
  avatar: string;
  bio: string;
  batch: Batch;
  xp: number;
  level: number;
  creds: number;
  streak: number;
  hackingSkill: number;
  securityLevel: number;
  stamina: {
    current: number;
    max: number;
  };
  inventory: { [itemId: string]: number }; // map of item id to quantity
  activeEffects: {
    shielded: boolean;
    xpBoost: {
      active: boolean;
      expiry: number | null;
    }
  };
  lastHackedTimestamp?: number;
  lastActiveTimestamp?: number;
}

export interface Question {
  topic: string;
  text: string;
  options: string[];
  correctAnswer: string;
}

export type Subject = 'Science' | 'Maths' | 'English' | 'Global Perspective' | 'Russian Language' | 'Russian Literature' | 'German Language' | 'Geography' | 'Kyrgyz Language' | 'Kyrgyz History';

export type LiveEventType = 'HACK_SUCCESS' | 'HACK_FAIL' | 'HACK_SHIELDED' | 'ITEM_ACTIVATION';

export interface LiveEvent {
  id: string;
  type: LiveEventType;
  message: string;
  timestamp: number;
  reactions: { [emoji: string]: string[] }; // emoji -> list of user IDs
}

export interface HackResult {
    targetName: string;
    success: boolean;
    message: string;
    shieldUsed: boolean;
}