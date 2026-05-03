import React, { useState, useEffect, useMemo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Cell, ResponsiveContainer,
  RadialBarChart, RadialBar,
} from 'recharts';
import {
  Target, Trophy, CheckCircle2, Circle, Clock, Flame,
  RefreshCw, Calendar, ChevronDown, ChevronUp, Plus, Minus,
  Star, Zap, TrendingUp, LayoutGrid, List,
} from 'lucide-react';

// ─── Deadline config ─────────────────────────────────────────────────────────
const DEADLINE   = new Date('2026-10-01T00:00:00');
const START_DATE = new Date('2026-05-03T00:00:00');
const TOTAL_DAYS = Math.ceil((DEADLINE - START_DATE) / 86400000); // 151

// ─── Category palette ────────────────────────────────────────────────────────
const CAT_COLOR = {
  spiritual: '#A78BFA',
  financial: '#34D399',
  health:    '#F97316',
  personal:  '#60A5FA',
  social:    '#EC4899',
  community: '#FBBF24',
  business:  '#C9A84C',
  income:    '#10B981',
  lifestyle: '#EF4444',
  impact:    '#06B6D4',
  family:    '#F472B6',
};

// ─── Goals data (quickest → longest) ─────────────────────────────────────────
const GOALS = [
  // ── PHASE 1 · IMMEDIATE (Days 1–7) ────────────────────────────────────────
  {
    id: 'god', phase: 1, phaseName: 'IMMEDIATE', category: 'spiritual',
    emoji: '✝️', title: 'Stronger Relationship with God',
    target: TOTAL_DAYS, unit: 'days', def: 0,
    task: 'Morning prayer + 1 Bible chapter before phone (30 min)',
    tip: 'Use YouVersion app — set a 5am daily reminder',
  },
  {
    id: 'daughter', phase: 1, phaseName: 'IMMEDIATE', category: 'family',
    emoji: '👧', title: 'Quality Time with Daughter',
    target: TOTAL_DAYS, unit: 'days', def: 0,
    task: 'Dedicated 1-hour uninterrupted time — no phone',
    tip: "She doesn't need a perfect parent, just a present one",
  },
  {
    id: 'amex', phase: 1, phaseName: 'IMMEDIATE', category: 'financial',
    emoji: '💳', title: 'Amex Platinum & Gold Cards',
    target: 2, unit: 'cards', def: 0,
    task: 'Apply at AmericanExpress.com today (30 min)',
    tip: 'Check pre-qualification first — no hard pull',
  },
  {
    id: 'roth', phase: 1, phaseName: 'IMMEDIATE', category: 'financial',
    emoji: '📈', title: "Roth IRA for Daughter",
    target: 1, unit: 'account', def: 0,
    task: "Open custodial Roth IRA on Fidelity or Vanguard (20 min)",
    tip: 'Max $7K/yr — tax-free growth for her future',
  },
  {
    id: 'life-policy', phase: 1, phaseName: 'IMMEDIATE', category: 'financial',
    emoji: '🛡️', title: '$1M Life Insurance Policy',
    target: 1, unit: 'policy', def: 0,
    task: 'Apply via PolicyGenius for $1M 20-yr term today',
    tip: "Protect your daughter's future — it's cheaper than you think",
  },

  // ── PHASE 2 · SHORT TERM (Days 1–30) ──────────────────────────────────────
  {
    id: 'fighting', phase: 2, phaseName: 'SHORT TERM', category: 'health',
    emoji: '🥋', title: 'Learn New Fighting Style',
    target: 40, unit: 'sessions', def: 0,
    task: 'Train 45 min: BJJ / Muay Thai / boxing (3×/week)',
    tip: 'Enroll in a gym THIS week — commit to the schedule',
  },
  {
    id: 'weight', phase: 2, phaseName: 'SHORT TERM', category: 'health',
    emoji: '💪', title: 'Gain 25 Pounds (In Shape)',
    target: 25, unit: 'lbs', def: 0,
    task: 'Gym session + eat 3,500+ cals / 200g protein daily',
    tip: '~0.5 lb lean gain/week is optimal — trust the process',
  },
  {
    id: 'credit', phase: 2, phaseName: 'SHORT TERM', category: 'financial',
    emoji: '⭐', title: '800+ Credit Score',
    target: 800, unit: 'pts', def: 720,
    task: 'Pay all bills on time, keep utilization under 10%',
    tip: 'Check Credit Karma daily — dispute any errors immediately',
  },
  {
    id: 'relationship', phase: 2, phaseName: 'SHORT TERM', category: 'personal',
    emoji: '❤️', title: 'Healthiest Relationship',
    target: 1, unit: 'goal', def: 0,
    task: 'Invest intentional energy into love life daily',
    tip: 'Clarity attracts — define exactly what you want',
  },

  // ── PHASE 3 · MEDIUM TERM (30–90 days) ────────────────────────────────────
  {
    id: 'books', phase: 3, phaseName: 'MEDIUM TERM', category: 'personal',
    emoji: '📚', title: 'Read 40 Books',
    target: 40, unit: 'books', def: 0,
    task: 'Read 45 pages minimum (Audible counts for commutes)',
    tip: '40 books / 21 weeks = 2 books/week — totally doable',
  },
  {
    id: 'videos', phase: 3, phaseName: 'MEDIUM TERM', category: 'social',
    emoji: '🎬', title: 'Record 1,500 Videos',
    target: 1500, unit: 'videos', def: 0,
    task: 'Batch 10 videos/day — 90-min shoot = done',
    tip: 'Same outfit, 10 hooks, 10 cuts. Efficient & consistent.',
  },
  {
    id: 'travel', phase: 3, phaseName: 'MEDIUM TERM', category: 'personal',
    emoji: '✈️', title: 'Travel 4 Countries',
    target: 4, unit: 'countries', def: 0,
    task: 'Book 1 international trip (months 2, 3, 4, 5)',
    tip: 'Combine with content — every country = viral travel content',
  },
  {
    id: 'personal-dev', phase: 3, phaseName: 'MEDIUM TERM', category: 'personal',
    emoji: '🎓', title: '$250K Personal Development',
    target: 250000, unit: '$', def: 0,
    task: 'Invest daily in courses, coaches & masterminds',
    tip: 'Every $1 in yourself returns $10 — pay the tuition',
  },
  {
    id: 'africa', phase: 3, phaseName: 'MEDIUM TERM', category: 'impact',
    emoji: '🌍', title: 'Build Houses in Africa',
    target: 1, unit: 'project', def: 0,
    task: 'Allocate $500/day to Africa housing fund',
    tip: 'Research African housing NGOs & architects NOW',
  },

  // ── PHASE 4 · COMMUNITY & TEAM (60–120 days) ──────────────────────────────
  {
    id: 'community', phase: 4, phaseName: 'COMMUNITY', category: 'community',
    emoji: '🏘️', title: '1,200 Online Community Members',
    target: 1200, unit: 'members', def: 0,
    task: 'Onboard 8+ new members + deliver value daily',
    tip: 'Skool or Discord — invite 20 people per day minimum',
  },
  {
    id: 'run-club', phase: 4, phaseName: 'COMMUNITY', category: 'community',
    emoji: '🏃', title: 'Run Club / In-Person Community 10K',
    target: 10000, unit: 'members', def: 0,
    task: 'Host weekly in-person run, post club content daily',
    tip: 'Partner with local gyms, post to Meetup & Eventbrite',
  },
  {
    id: 'employees', phase: 4, phaseName: 'COMMUNITY', category: 'business',
    emoji: '👥', title: '20 Employees',
    target: 20, unit: 'hires', def: 0,
    task: 'Post 1 job listing, conduct 1 interview daily',
    tip: 'Start with VAs, editors, setters & closers first',
  },

  // ── PHASE 5 · SOCIAL MEDIA GROWTH (ongoing, all 5 months) ────────────────
  {
    id: 'youtube', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '▶️', title: '1M YouTube Subscribers',
    target: 1000000, unit: 'subs', def: 0,
    task: 'Post 1-2 YouTube videos + engage comments 20 min',
    tip: 'Long-form (10-20 min) + Shorts. Consistency wins.',
  },
  {
    id: 'instagram', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '📸', title: '2M Instagram Followers',
    target: 2000000, unit: 'followers', def: 0,
    task: 'Post 3 Reels + Stories, engage for 30 min',
    tip: 'Reels 7–15 sec perform best — hook in 2 seconds',
  },
  {
    id: 'tiktok-social', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '🎵', title: '2M TikTok Followers',
    target: 2000000, unit: 'followers', def: 0,
    task: 'Post 5 TikToks, reply to every comment',
    tip: 'Post 7–9 AM or 7–9 PM for max reach',
  },
  {
    id: 'facebook', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '📘', title: '2M Facebook Followers',
    target: 2000000, unit: 'followers', def: 0,
    task: 'Post 2 videos to Facebook, go live once weekly',
    tip: 'Cross-post your Reels/TikToks — repurpose everything',
  },
  {
    id: 'x-twitter', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '𝕏', title: '1M X / Twitter Followers',
    target: 1000000, unit: 'followers', def: 0,
    task: 'Post 8-10 threads/tweets, reply to 20 big accounts',
    tip: 'Threads + hot takes in your niche = viral growth',
  },
  {
    id: 'snapchat', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '👻', title: '1M Snapchat Followers',
    target: 1000000, unit: 'followers', def: 0,
    task: 'Post 3 Stories + 1 Spotlight video daily',
    tip: 'Raw, behind-the-scenes content wins on Snap',
  },
  {
    id: 'rumble', phase: 5, phaseName: 'SOCIAL GROWTH', category: 'social',
    emoji: '⚡', title: '1M Rumble Followers',
    target: 1000000, unit: 'followers', def: 0,
    task: 'Mirror all videos to Rumble automatically',
    tip: 'Use TubeSync or auto-upload — Rumble rewards reposts',
  },

  // ── PHASE 6 · REVENUE (90–151 days) ───────────────────────────────────────
  {
    id: 'tiktok-aff', phase: 6, phaseName: 'REVENUE', category: 'income',
    emoji: '💰', title: '$500K TikTok Affiliate',
    target: 500000, unit: '$', def: 0,
    task: 'Push 2 high-ticket affiliate products per day',
    tip: '$500K / 151 days = $3,311/day — go high-ticket',
  },
  {
    id: 'life-inc', phase: 6, phaseName: 'REVENUE', category: 'income',
    emoji: '🏦', title: '$500K Life Insurance Income',
    target: 500000, unit: '$', def: 0,
    task: 'Make 20 life insurance prospecting calls, close 2+',
    tip: '$3,311/day pace — avg policy is ~$1,200',
  },
  {
    id: 'launchpad', phase: 6, phaseName: 'REVENUE', category: 'income',
    emoji: '🚀', title: '$2M from Affiliate Launchpad',
    target: 2000000, unit: '$', def: 0,
    task: 'Close 2+ Affiliate Launchpad deals daily',
    tip: '$13,245/day pace — raise prices, add volume',
  },
  {
    id: 'liquid', phase: 6, phaseName: 'REVENUE', category: 'financial',
    emoji: '💵', title: '$2M Liquid',
    target: 2000000, unit: '$', def: 0,
    task: 'Track liquid assets daily, move profits to savings',
    tip: 'Liquid = cash + accessible investments',
  },

  // ── PHASE 7 · LEGACY (100–151 days) ───────────────────────────────────────
  {
    id: 'm3', phase: 7, phaseName: 'LEGACY', category: 'lifestyle',
    emoji: '🏎️', title: 'BMW M3',
    target: 1, unit: 'car', def: 0,
    task: 'Hit revenue milestones — M3 is the earned reward',
    tip: 'Set as reward at $1.5M liquid — discipline first',
  },
  {
    id: 'give-back', phase: 7, phaseName: 'LEGACY', category: 'impact',
    emoji: '🤲', title: 'Give Back $100K',
    target: 100000, unit: '$', def: 0,
    task: 'Allocate 5% of all income to giving',
    tip: "You can't out-give God. Give first, scale faster.",
  },
  {
    id: 'personal-spend', phase: 7, phaseName: 'LEGACY', category: 'personal',
    emoji: '🏆', title: '$250K on Personal Development',
    target: 250000, unit: '$', def: 0,
    task: 'Book masterminds, events & elite coaching',
    tip: 'Room full of people further ahead = fastest path',
  },
];

// ─── Daily schedule ───────────────────────────────────────────────────────────
const SCHEDULE = [
  { time: '5:00 AM', task: 'Wake up + 32oz water immediately', cat: 'health', dur: '5 min' },
  { time: '5:05 AM', task: 'Prayer + 1 Bible chapter (NO phone first)', cat: 'spiritual', dur: '30 min' },
  { time: '5:35 AM', task: 'Read 45 pages (toward 40 books)', cat: 'personal', dur: '45 min' },
  { time: '6:20 AM', task: 'Gym — strength training (25 lbs gain program)', cat: 'health', dur: '60 min' },
  { time: '7:20 AM', task: 'Shower + high-protein breakfast (200g protein)', cat: 'health', dur: '25 min' },
  { time: '7:45 AM', task: 'Batch record 10 videos (content block)', cat: 'social', dur: '90 min' },
  { time: '9:15 AM', task: 'Schedule + post content on all 7 platforms', cat: 'social', dur: '30 min' },
  { time: '9:45 AM', task: 'Life insurance prospecting — 20 calls', cat: 'income', dur: '120 min' },
  { time: '11:45 AM', task: 'Community engagement + onboard 8 members', cat: 'community', dur: '30 min' },
  { time: '12:15 PM', task: 'Lunch break', cat: 'health', dur: '30 min' },
  { time: '12:45 PM', task: 'Affiliate Launchpad — sales calls & closes', cat: 'income', dur: '120 min' },
  { time: '2:45 PM', task: 'TikTok affiliate — optimize & push products', cat: 'income', dur: '60 min' },
  { time: '3:45 PM', task: 'Team management, hiring interviews', cat: 'business', dur: '60 min' },
  { time: '4:45 PM', task: 'Run club / martial arts training', cat: 'community', dur: '60 min' },
  { time: '5:45 PM', task: '1-hour UNINTERRUPTED time with daughter', cat: 'family', dur: '60 min' },
  { time: '6:45 PM', task: 'Dinner + review finances / credit score', cat: 'financial', dur: '30 min' },
  { time: '7:15 PM', task: 'Personal development — course / coaching call', cat: 'personal', dur: '60 min' },
  { time: '8:15 PM', task: 'Reply to comments across all platforms', cat: 'social', dur: '45 min' },
  { time: '9:00 PM', task: 'Evening reflection + gratitude journal', cat: 'spiritual', dur: '15 min' },
  { time: '9:15 PM', task: 'Wind down — NO screens after 9:30pm', cat: 'health', dur: '15 min' },
  { time: '9:30 PM', task: 'Sleep (7.5 hours)', cat: 'health', dur: '450 min' },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
function getCountdown() {
  const diff = DEADLINE - new Date();
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 };
  return {
    days:    Math.floor(diff / 86400000),
    hours:   Math.floor((diff % 86400000) / 3600000),
    minutes: Math.floor((diff % 3600000) / 60000),
    seconds: Math.floor((diff % 60000) / 1000),
  };
}

function getDayNumber() {
  const diff = new Date() - START_DATE;
  return Math.min(TOTAL_DAYS, Math.max(1, Math.floor(diff / 86400000) + 1));
}

function getTodayKey() {
  return new Date().toISOString().split('T')[0];
}

function pad2(n) { return String(n).padStart(2, '0'); }

function fmtVal(val, unit) {
  if (unit === '$') return '$' + val.toLocaleString();
  return val.toLocaleString() + ' ' + unit;
}

function calcPct(goal, current) {
  if (goal.id === 'credit') {
    const base = goal.def;
    return Math.min(100, Math.round(Math.max(0, (current - base) / (goal.target - base)) * 100));
  }
  return Math.min(100, Math.round((current / goal.target) * 100));
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function CountdownUnit({ value, label }) {
  return (
    <div className="flex flex-col items-center">
      <span
        className="font-mono text-3xl md:text-4xl font-black tracking-wider"
        style={{ color: '#C9A84C', textShadow: '0 0 20px rgba(201,168,76,0.6)' }}
      >
        {pad2(value)}
      </span>
      <span className="text-gray-500 text-xs tracking-[0.2em] uppercase mt-1">{label}</span>
    </div>
  );
}

function PhaseTag({ name }) {
  const colors = {
    'IMMEDIATE':    'bg-purple-500/20 text-purple-300 border-purple-500/30',
    'SHORT TERM':   'bg-orange-500/20 text-orange-300 border-orange-500/30',
    'MEDIUM TERM':  'bg-blue-500/20   text-blue-300   border-blue-500/30',
    'COMMUNITY':    'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    'SOCIAL GROWTH':'bg-pink-500/20   text-pink-300   border-pink-500/30',
    'REVENUE':      'bg-green-500/20  text-green-300  border-green-500/30',
    'LEGACY':       'bg-gold/20       text-gold        border-gold/30',
  };
  return (
    <span className={`text-[9px] font-bold tracking-[0.15em] px-1.5 py-0.5 rounded border ${colors[name] || 'bg-gray-500/20 text-gray-400'}`}>
      {name}
    </span>
  );
}

function GoalCard({ goal, current, onUpdate }) {
  const [expanded, setExpanded] = useState(false);
  const pct = calcPct(goal, current);
  const color = CAT_COLOR[goal.category] || '#C9A84C';
  const done  = pct >= 100;

  return (
    <div
      className="rounded-xl border transition-all duration-200 overflow-hidden"
      style={{
        background:   '#1A1A1A',
        borderColor:  done ? color : '#2A2A2A',
        boxShadow:    done ? `0 0 16px ${color}30` : 'none',
      }}
    >
      {/* Header row */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="flex items-start gap-2 min-w-0">
            <span className="text-xl leading-none mt-0.5">{goal.emoji}</span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold leading-snug ${done ? 'text-white' : 'text-gray-200'}`}>
                {goal.title}
              </p>
              <div className="mt-1">
                <PhaseTag name={goal.phaseName} />
              </div>
            </div>
          </div>
          {done && (
            <Trophy size={16} className="flex-shrink-0 mt-1" style={{ color }} />
          )}
        </div>

        {/* Progress bar */}
        <div className="mb-2">
          <div className="flex justify-between text-xs mb-1.5">
            <span className="text-gray-400 font-mono">
              {fmtVal(current, goal.unit)}
            </span>
            <span className="font-bold font-mono" style={{ color }}>
              {pct}%
            </span>
          </div>
          <div className="h-1.5 rounded-full bg-dark overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${pct}%`,
                background: `linear-gradient(90deg, ${color}99, ${color})`,
                boxShadow:  pct > 0 ? `0 0 8px ${color}60` : 'none',
              }}
            />
          </div>
          <div className="text-right text-xs text-gray-600 mt-1 font-mono">
            / {fmtVal(goal.target, goal.unit)}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between mt-3">
          <div className="flex items-center gap-1">
            <button
              onClick={() => onUpdate(goal, Math.max(goal.def, current - getStep(goal)))}
              className="w-7 h-7 rounded-lg bg-dark flex items-center justify-center text-gray-400 hover:text-white hover:bg-dark-hover border border-dark-border transition-all"
            >
              <Minus size={12} />
            </button>
            <button
              onClick={() => onUpdate(goal, Math.min(goal.target, current + getStep(goal)))}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-black font-bold transition-all hover:opacity-90"
              style={{ background: color }}
            >
              <Plus size={12} />
            </button>
          </div>
          <button
            onClick={() => setExpanded(e => !e)}
            className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-300 transition-colors"
          >
            {expanded ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            {expanded ? 'less' : 'plan'}
          </button>
        </div>
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="px-4 pb-4 border-t border-dark-border/60 pt-3 space-y-2">
          <div className="flex gap-2">
            <Zap size={13} className="flex-shrink-0 mt-0.5" style={{ color }} />
            <p className="text-xs text-gray-300">{goal.task}</p>
          </div>
          <div className="flex gap-2">
            <Star size={13} className="flex-shrink-0 mt-0.5 text-yellow-400" />
            <p className="text-xs text-gray-500 italic">"{goal.tip}"</p>
          </div>
        </div>
      )}
    </div>
  );
}

function getStep(goal) {
  if (goal.target >= 1000000) return 10000;
  if (goal.target >= 100000)  return 1000;
  if (goal.target >= 10000)   return 100;
  if (goal.target >= 1000)    return 10;
  if (goal.target >= 100)     return 1;
  return 1;
}

const PHASE_LABELS = ['ALL', 'IMMEDIATE', 'SHORT TERM', 'MEDIUM TERM', 'COMMUNITY', 'SOCIAL GROWTH', 'REVENUE', 'LEGACY'];

// ─── Main component ───────────────────────────────────────────────────────────
export default function GoalsDashboard() {
  const [progress, setProgress] = useState(() => {
    try { return JSON.parse(localStorage.getItem('goals_2026_progress') || '{}'); }
    catch { return {}; }
  });

  const [checklist, setChecklist] = useState(() => {
    try { return JSON.parse(localStorage.getItem(`goals_2026_cl_${getTodayKey()}`) || '{}'); }
    catch { return {}; }
  });

  const [countdown, setCountdown]   = useState(getCountdown);
  const [activePhase, setActivePhase] = useState('ALL');
  const [view, setView] = useState('grid'); // 'grid' | 'list'
  const [activeTab, setActiveTab] = useState('goals'); // 'goals' | 'daily' | 'schedule' | 'chart'

  // Countdown tick
  useEffect(() => {
    const t = setInterval(() => setCountdown(getCountdown()), 1000);
    return () => clearInterval(t);
  }, []);

  // Persist progress
  useEffect(() => {
    localStorage.setItem('goals_2026_progress', JSON.stringify(progress));
  }, [progress]);

  // Persist checklist
  useEffect(() => {
    localStorage.setItem(`goals_2026_cl_${getTodayKey()}`, JSON.stringify(checklist));
  }, [checklist]);

  const getCurrent = (goal) => progress[goal.id] ?? goal.def;

  const updateGoal = (goal, newVal) => {
    setProgress(p => ({ ...p, [goal.id]: newVal }));
  };

  const toggleCheck = (id) => setChecklist(c => ({ ...c, [id]: !c[id] }));
  const resetChecklist = () => setChecklist({});

  // Stats
  const { totalPct, completedCount, inProgressCount } = useMemo(() => {
    let sumPct = 0;
    let completed = 0;
    let inProg = 0;
    GOALS.forEach(g => {
      const cur = getCurrent(g);
      const p   = calcPct(g, cur);
      sumPct += p;
      if (p >= 100) completed++;
      else if (p > 0) inProg++;
    });
    return {
      totalPct:       Math.round(sumPct / GOALS.length),
      completedCount: completed,
      inProgressCount: inProg,
    };
  }, [progress]);

  const dayNum = getDayNumber();
  const daysLeft = countdown.days;

  // Chart data — category average completion
  const categoryChartData = useMemo(() => {
    const catMap = {};
    GOALS.forEach(g => {
      const p = calcPct(g, getCurrent(g));
      if (!catMap[g.category]) catMap[g.category] = { pcts: [], color: CAT_COLOR[g.category] };
      catMap[g.category].pcts.push(p);
    });
    return Object.entries(catMap).map(([cat, { pcts, color }]) => ({
      name: cat.charAt(0).toUpperCase() + cat.slice(1),
      pct:  Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length),
      color,
    })).sort((a, b) => b.pct - a.pct);
  }, [progress]);

  // Filtered goals
  const visibleGoals = activePhase === 'ALL'
    ? GOALS
    : GOALS.filter(g => g.phaseName === activePhase);

  // Checklist tasks (one per goal)
  const checklistItems = GOALS.map(g => ({
    id:   g.id,
    emoji: g.emoji,
    title: g.title,
    task:  g.task,
    phase: g.phaseName,
    done:  !!checklist[g.id],
  }));

  const checksDone  = checklistItems.filter(i => i.done).length;
  const checksTotal = checklistItems.length;

  return (
    <div className="min-h-screen bg-dark text-white pb-16">

      {/* ─── Hero Header ─────────────────────────────────────────────────── */}
      <div
        className="relative overflow-hidden"
        style={{
          background: 'linear-gradient(180deg, #0D0D0D 0%, #0A0A0A 100%)',
          borderBottom: '1px solid #1E1E1E',
        }}
      >
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'linear-gradient(#C9A84C 1px, transparent 1px), linear-gradient(90deg, #C9A84C 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        <div className="relative z-10 px-4 md:px-8 py-8">
          {/* Title */}
          <div className="text-center mb-6">
            <p
              className="text-xs tracking-[0.4em] font-bold mb-2"
              style={{ color: '#C9A84C99', fontFamily: "'Courier New', monospace" }}
            >
              PERSONAL MISSION CONTROL
            </p>
            <h1
              className="text-3xl md:text-5xl font-black tracking-wider mb-2"
              style={{
                background: 'linear-gradient(135deg, #C9A84C 0%, #FFFFFF 50%, #C9A84C 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                fontFamily: "'Courier New', monospace",
                letterSpacing: '0.1em',
              }}
            >
              GOALS 2026
            </h1>
            <p className="text-gray-500 text-sm tracking-widest">
              Vision to Victory · October 1st Deadline
            </p>
          </div>

          {/* Countdown */}
          <div className="flex justify-center mb-6">
            <div
              className="inline-flex items-center gap-4 md:gap-8 px-8 py-4 rounded-2xl border"
              style={{ background: '#111', borderColor: '#C9A84C33' }}
            >
              <CountdownUnit value={countdown.days}    label="DAYS" />
              <span className="text-2xl font-mono text-gold/40 font-black">:</span>
              <CountdownUnit value={countdown.hours}   label="HRS" />
              <span className="text-2xl font-mono text-gold/40 font-black">:</span>
              <CountdownUnit value={countdown.minutes} label="MIN" />
              <span className="text-2xl font-mono text-gold/40 font-black">:</span>
              <CountdownUnit value={countdown.seconds} label="SEC" />
            </div>
          </div>

          {/* Stats strip */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto">
            {[
              { label: 'Overall',      value: `${totalPct}%`,        icon: Target,    color: '#C9A84C' },
              { label: 'Completed',    value: `${completedCount}/${GOALS.length}`, icon: Trophy, color: '#34D399' },
              { label: 'In Progress',  value: inProgressCount,        icon: TrendingUp, color: '#60A5FA' },
              { label: `Day ${dayNum} of ${TOTAL_DAYS}`, value: `${Math.round((dayNum/TOTAL_DAYS)*100)}%`, icon: Calendar, color: '#F97316' },
            ].map((s, i) => (
              <div
                key={i}
                className="rounded-xl px-4 py-3 text-center border"
                style={{ background: '#141414', borderColor: '#2A2A2A' }}
              >
                <s.icon size={16} className="mx-auto mb-1" style={{ color: s.color }} />
                <p className="font-mono font-black text-xl" style={{ color: s.color }}>{s.value}</p>
                <p className="text-gray-500 text-xs tracking-widest uppercase">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ─── Tab Navigation ──────────────────────────────────────────────── */}
      <div className="sticky top-0 z-20 bg-dark border-b border-dark-border">
        <div className="flex overflow-x-auto scrollbar-none px-4 md:px-8">
          {[
            { id: 'goals',    label: 'Goals',          icon: Target },
            { id: 'daily',    label: `Today's Plan`,   icon: CheckCircle2 },
            { id: 'schedule', label: 'Daily Schedule', icon: Clock },
            { id: 'chart',    label: 'Progress Chart', icon: TrendingUp },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                activeTab === tab.id
                  ? 'border-gold text-gold'
                  : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
            >
              <tab.icon size={14} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 md:px-8 py-6">

        {/* ─── GOALS TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'goals' && (
          <div>
            {/* Phase filter + view toggle */}
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div className="flex flex-wrap gap-1.5">
                {PHASE_LABELS.map(p => (
                  <button
                    key={p}
                    onClick={() => setActivePhase(p)}
                    className={`text-xs font-bold tracking-widest px-3 py-1.5 rounded-lg border transition-all ${
                      activePhase === p
                        ? 'bg-gold text-black border-gold'
                        : 'bg-dark-card text-gray-500 border-dark-border hover:text-white'
                    }`}
                  >
                    {p === 'ALL' ? `ALL (${GOALS.length})` : p}
                  </button>
                ))}
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => setView('grid')}
                  className={`p-2 rounded-lg border transition-all ${view === 'grid' ? 'bg-gold/20 border-gold/40 text-gold' : 'border-dark-border text-gray-500 hover:text-white'}`}
                ><LayoutGrid size={14} /></button>
                <button
                  onClick={() => setView('list')}
                  className={`p-2 rounded-lg border transition-all ${view === 'list' ? 'bg-gold/20 border-gold/40 text-gold' : 'border-dark-border text-gray-500 hover:text-white'}`}
                ><List size={14} /></button>
              </div>
            </div>

            {/* Phase sections */}
            {activePhase === 'ALL' ? (
              [1,2,3,4,5,6,7].map(phase => {
                const phaseGoals = GOALS.filter(g => g.phase === phase);
                if (!phaseGoals.length) return null;
                const phaseName = phaseGoals[0].phaseName;
                return (
                  <div key={phase} className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-7 h-7 rounded-lg bg-dark-card border border-dark-border flex items-center justify-center">
                        <span className="text-gold font-mono font-black text-sm">{phase}</span>
                      </div>
                      <h2 className="text-sm font-bold tracking-[0.2em] text-gray-400 uppercase">{phaseName}</h2>
                      <div className="flex-1 h-px bg-dark-border" />
                      <span className="text-xs text-gray-600">{phaseGoals.length} goals</span>
                    </div>
                    <div className={view === 'grid'
                      ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                      : 'space-y-2'
                    }>
                      {phaseGoals.map(goal => (
                        <GoalCard
                          key={goal.id}
                          goal={goal}
                          current={getCurrent(goal)}
                          onUpdate={updateGoal}
                        />
                      ))}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className={view === 'grid'
                ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3'
                : 'space-y-2'
              }>
                {visibleGoals.map(goal => (
                  <GoalCard
                    key={goal.id}
                    goal={goal}
                    current={getCurrent(goal)}
                    onUpdate={updateGoal}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── DAILY CHECKLIST TAB ───────────────────────────────────────── */}
        {activeTab === 'daily' && (
          <div className="max-w-3xl mx-auto">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2
                  className="text-xl font-black tracking-wider"
                  style={{ fontFamily: "'Courier New', monospace" }}
                >
                  TODAY'S MISSION
                </h2>
                <p className="text-gray-500 text-sm mt-1">
                  {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                  &nbsp;·&nbsp; Day {dayNum} of {TOTAL_DAYS}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <div
                  className="text-right px-4 py-2 rounded-xl border"
                  style={{ borderColor: checksDone === checksTotal ? '#34D399' : '#2A2A2A', background: '#141414' }}
                >
                  <p className="font-mono font-black text-lg" style={{ color: checksDone === checksTotal ? '#34D399' : '#C9A84C' }}>
                    {checksDone}/{checksTotal}
                  </p>
                  <p className="text-gray-500 text-xs">DONE</p>
                </div>
                <button
                  onClick={resetChecklist}
                  className="p-2 rounded-lg border border-dark-border text-gray-500 hover:text-white hover:border-gray-400 transition-all"
                  title="Reset today's checklist"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Overall daily progress bar */}
            <div className="mb-6 p-4 rounded-xl border border-dark-border bg-dark-card">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400">Daily Progress</span>
                <span className="font-mono font-bold text-gold">{Math.round((checksDone / checksTotal) * 100)}%</span>
              </div>
              <div className="h-2 rounded-full bg-dark overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${(checksDone / checksTotal) * 100}%`,
                    background: 'linear-gradient(90deg, #C9A84C99, #C9A84C)',
                    boxShadow: checksDone > 0 ? '0 0 10px rgba(201,168,76,0.5)' : 'none',
                  }}
                />
              </div>
            </div>

            {/* Tasks grouped by phase */}
            {[1,2,3,4,5,6,7].map(phase => {
              const items = checklistItems.filter(i => GOALS.find(g => g.id === i.id)?.phase === phase);
              if (!items.length) return null;
              const phaseName = GOALS.find(g => g.phase === phase)?.phaseName;
              return (
                <div key={phase} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-xs font-bold tracking-widest text-gray-600 uppercase">{phaseName}</span>
                    <div className="flex-1 h-px bg-dark-border" />
                  </div>
                  <div className="space-y-2">
                    {items.map(item => (
                      <button
                        key={item.id}
                        onClick={() => toggleCheck(item.id)}
                        className={`w-full flex items-start gap-3 p-3.5 rounded-xl border text-left transition-all duration-200 ${
                          item.done
                            ? 'bg-dark-card border-green-500/30'
                            : 'bg-dark-card border-dark-border hover:border-gray-600'
                        }`}
                      >
                        {item.done
                          ? <CheckCircle2 size={18} className="flex-shrink-0 mt-0.5 text-green-400" />
                          : <Circle       size={18} className="flex-shrink-0 mt-0.5 text-gray-600" />
                        }
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-sm">{item.emoji}</span>
                            <span className={`text-sm font-semibold ${item.done ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                              {item.title}
                            </span>
                          </div>
                          <p className={`text-xs ${item.done ? 'text-gray-600' : 'text-gray-400'}`}>
                            {item.task}
                          </p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            {checksDone === checksTotal && checksTotal > 0 && (
              <div
                className="mt-4 p-4 rounded-xl text-center border"
                style={{ background: 'rgba(52,211,153,0.08)', borderColor: '#34D39930' }}
              >
                <Trophy size={24} className="text-green-400 mx-auto mb-2" />
                <p className="text-green-400 font-bold tracking-wider">MISSION COMPLETE</p>
                <p className="text-gray-500 text-sm mt-1">All tasks done for today. Exceptional execution.</p>
              </div>
            )}
          </div>
        )}

        {/* ─── DAILY SCHEDULE TAB ───────────────────────────────────────── */}
        {activeTab === 'schedule' && (
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-black tracking-wider mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
                OPTIMAL DAILY SCHEDULE
              </h2>
              <p className="text-gray-500 text-sm">Your 16-hour execution blueprint — repeat 151 days</p>
            </div>

            <div className="relative">
              {/* Timeline line */}
              <div className="absolute left-[5.5rem] top-0 bottom-0 w-px bg-dark-border" />

              <div className="space-y-1">
                {SCHEDULE.map((s, i) => {
                  const color = CAT_COLOR[s.cat] || '#C9A84C';
                  return (
                    <div key={i} className="flex gap-4 items-start relative">
                      {/* Time */}
                      <div className="w-20 flex-shrink-0 text-right">
                        <span className="text-xs font-mono text-gray-500">{s.time}</span>
                      </div>

                      {/* Dot */}
                      <div className="flex-shrink-0 relative z-10 mt-1.5">
                        <div
                          className="w-2.5 h-2.5 rounded-full border-2 border-dark"
                          style={{ background: color }}
                        />
                      </div>

                      {/* Task */}
                      <div
                        className="flex-1 p-3 rounded-xl border mb-1 transition-all hover:border-gray-600"
                        style={{ background: '#141414', borderColor: '#222' }}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm text-gray-200">{s.task}</p>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <span className="text-xs text-gray-600 font-mono">{s.dur}</span>
                            <span
                              className="text-[10px] font-bold px-1.5 py-0.5 rounded capitalize"
                              style={{ color, background: `${color}20` }}
                            >
                              {s.cat}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div
              className="mt-6 p-4 rounded-xl border text-center"
              style={{ background: 'rgba(201,168,76,0.06)', borderColor: '#C9A84C30' }}
            >
              <Flame size={20} className="text-gold mx-auto mb-2" />
              <p className="text-gold font-bold tracking-wider text-sm">151 DAYS OF THIS = YOUR DESTINY</p>
              <p className="text-gray-500 text-xs mt-1">
                Not every day perfect — but every day present.
              </p>
            </div>
          </div>
        )}

        {/* ─── CHART TAB ─────────────────────────────────────────────────── */}
        {activeTab === 'chart' && (
          <div className="max-w-3xl mx-auto">
            <div className="mb-6">
              <h2 className="text-xl font-black tracking-wider mb-1" style={{ fontFamily: "'Courier New', monospace" }}>
                PROGRESS BY CATEGORY
              </h2>
              <p className="text-gray-500 text-sm">Average completion % across all goals in each category</p>
            </div>

            {/* Overall donut */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="rounded-xl border border-dark-border bg-dark-card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">Overall Mission</p>
                <ResponsiveContainer width="100%" height={220}>
                  <RadialBarChart
                    innerRadius="60%"
                    outerRadius="90%"
                    data={[{ name: 'Progress', value: totalPct, fill: '#C9A84C' }]}
                    startAngle={90}
                    endAngle={90 - (360 * totalPct / 100)}
                  >
                    <RadialBar dataKey="value" cornerRadius={8} fill="#C9A84C" />
                  </RadialBarChart>
                </ResponsiveContainer>
                <div className="text-center -mt-16">
                  <p className="font-mono font-black text-4xl text-gold">{totalPct}%</p>
                  <p className="text-gray-500 text-xs tracking-widest mt-1">COMPLETE</p>
                </div>
                <div className="mt-8 flex justify-center gap-6 text-center">
                  <div>
                    <p className="font-mono font-bold text-green-400 text-lg">{completedCount}</p>
                    <p className="text-gray-600 text-xs">Done</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-blue-400 text-lg">{inProgressCount}</p>
                    <p className="text-gray-600 text-xs">Active</p>
                  </div>
                  <div>
                    <p className="font-mono font-bold text-gray-400 text-lg">{GOALS.length - completedCount - inProgressCount}</p>
                    <p className="text-gray-600 text-xs">Pending</p>
                  </div>
                </div>
              </div>

              {/* Category bar chart */}
              <div className="rounded-xl border border-dark-border bg-dark-card p-5">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-4">By Category</p>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={categoryChartData}
                    layout="vertical"
                    margin={{ left: 10, right: 20, top: 0, bottom: 0 }}
                  >
                    <XAxis type="number" domain={[0, 100]} tick={{ fill: '#555', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis type="category" dataKey="name" tick={{ fill: '#888', fontSize: 11 }} axisLine={false} tickLine={false} width={70} />
                    <Tooltip
                      contentStyle={{ background: '#1A1A1A', border: '1px solid #2A2A2A', borderRadius: '8px', fontSize: 12 }}
                      formatter={val => [`${val}%`, 'Progress']}
                    />
                    <Bar dataKey="pct" radius={[0, 6, 6, 0]} maxBarSize={16}>
                      {categoryChartData.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Phase progress table */}
            <div className="rounded-xl border border-dark-border bg-dark-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-5">Phase Breakdown</p>
              <div className="space-y-4">
                {[1,2,3,4,5,6,7].map(phase => {
                  const phaseGoals = GOALS.filter(g => g.phase === phase);
                  const phaseName  = phaseGoals[0]?.phaseName;
                  const avgPct = Math.round(
                    phaseGoals.reduce((sum, g) => sum + calcPct(g, getCurrent(g)), 0) / phaseGoals.length
                  );
                  const done = phaseGoals.filter(g => calcPct(g, getCurrent(g)) >= 100).length;
                  const phaseColors = ['#A78BFA','#F97316','#60A5FA','#FBBF24','#EC4899','#10B981','#C9A84C'];
                  const col = phaseColors[phase - 1];
                  return (
                    <div key={phase}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs font-bold px-2 py-0.5 rounded"
                            style={{ color: col, background: `${col}20` }}
                          >
                            P{phase}
                          </span>
                          <span className="text-sm text-gray-300">{phaseName}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-600">{done}/{phaseGoals.length}</span>
                          <span className="font-mono font-bold text-sm" style={{ color: col }}>{avgPct}%</span>
                        </div>
                      </div>
                      <div className="h-2 rounded-full bg-dark overflow-hidden">
                        <div
                          className="h-full rounded-full transition-all duration-700"
                          style={{
                            width: `${avgPct}%`,
                            background: `linear-gradient(90deg, ${col}80, ${col})`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* All goals progress list */}
            <div className="mt-6 rounded-xl border border-dark-border bg-dark-card p-5">
              <p className="text-xs text-gray-500 uppercase tracking-widest mb-5">All Goals Tracker</p>
              <div className="space-y-3">
                {GOALS.map(g => {
                  const cur = getCurrent(g);
                  const pct = calcPct(g, cur);
                  const color = CAT_COLOR[g.category] || '#C9A84C';
                  return (
                    <div key={g.id} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center flex-shrink-0">{g.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-gray-400 truncate pr-2">{g.title}</span>
                          <span className="font-mono font-bold flex-shrink-0" style={{ color }}>
                            {pct}%
                          </span>
                        </div>
                        <div className="h-1.5 rounded-full bg-dark overflow-hidden">
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${pct}%`,
                              background: `linear-gradient(90deg, ${color}80, ${color})`,
                            }}
                          />
                        </div>
                      </div>
                      {pct >= 100 && <Trophy size={13} style={{ color, flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
