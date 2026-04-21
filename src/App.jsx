import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Trophy,
  Users,
  CalendarDays,
  Radio,
  Plus,
  Trash2,
  RefreshCcw,
  Play,
  Pause,
  RotateCcw,
  Smartphone,
  Handshake,
  ChevronRight,
  CheckCircle2,
  ShieldCheck,
  Lock,
  LogOut,
  Image as ImageIcon,
  ListChecks,
  Clock3,
  Target,
  PencilLine,
} from "lucide-react";

const STORAGE_KEY = "urnacup-state-v14";
const MATCH_DURATION_SECONDS = 15 * 60;
const POINTS_WIN = 2;
const POINTS_DRAW = 1;
const DEMO_ADMIN_PASSWORD = "97531";

const DEFAULT_TEAMS = [
  "Last Place Hunters",
  "Savice",
  "Žďáráci",
  "Palachovci",
  "Best Of The Rest",
  "Bez limitu",
  "Cigiho banda",
  "Crazywolves",
  "Dream Team",
];

const DEFAULT_SPONSORS = [
  { name: "Hauk", logoUrl: "" },
  { name: "Koloniál Renata", logoUrl: "" },
  { name: "Bluefly", logoUrl: "" },
  { name: "Saargummy", logoUrl: "" },
  { name: "Triangl", logoUrl: "" },
  { name: "Drogerie Vávra", logoUrl: "" },
];

const FIXED_MATCHES = [
  { time: "08:00–08:12", home: "Savice", away: "Last Place Hunters" },
  { time: "08:15–08:27", home: "Žďáráci", away: "Dream Team" },
  { time: "08:30–08:42", home: "Bez limitu", away: "Crazywolves" },
  { time: "08:45–08:57", home: "Best Of The Rest", away: "Savice" },
  { time: "09:00–09:12", home: "Cigiho banda", away: "Palachovci" },
  { time: "09:15–09:27", home: "Žďáráci", away: "Best Of The Rest" },
  { time: "09:30–09:42", home: "Last Place Hunters", away: "Palachovci" },
  { time: "09:45–09:57", home: "Crazywolves", away: "Cigiho banda" },
  { time: "10:00–10:12", home: "Dream Team", away: "Bez limitu" },
  { time: "10:15–10:27", home: "Best Of The Rest", away: "Last Place Hunters" },
  { time: "10:30–10:42", home: "Savice", away: "Žďáráci" },
  { time: "10:45–10:57", home: "Palachovci", away: "Best Of The Rest" },
  { time: "11:00–11:12", home: "Bez limitu", away: "Savice" },
  { time: "11:15–11:27", home: "Žďáráci", away: "Last Place Hunters" },
  { time: "11:30–11:42", home: "Cigiho banda", away: "Dream Team" },
  { time: "11:45–11:57", home: "Palachovci", away: "Crazywolves" },
  { time: "12:00–12:12", home: "Best Of The Rest", away: "Bez limitu" },
  { time: "12:15–12:27", home: "Last Place Hunters", away: "Crazywolves" },
  { time: "12:30–12:42", home: "Dream Team", away: "Palachovci" },
  { time: "12:45–12:57", home: "Savice", away: "Cigiho banda" },
  { time: "13:00–13:12", home: "Žďáráci", away: "Bez limitu" },
  { time: "13:15–13:27", home: "Crazywolves", away: "Best Of The Rest" },
  { time: "13:30–13:42", home: "Bez limitu", away: "Last Place Hunters" },
  { time: "13:45–13:57", home: "Cigiho banda", away: "Žďáráci" },
  { time: "14:00–14:12", home: "Palachovci", away: "Savice" },
  { time: "14:15–14:27", home: "Crazywolves", away: "Dream Team" },
  { time: "14:30–14:42", home: "Best Of The Rest", away: "Cigiho banda" },
  { time: "14:45–14:57", home: "Last Place Hunters", away: "Dream Team" },
  { time: "15:00–15:12", home: "Savice", away: "Crazywolves" },
  { time: "15:15–15:27", home: "Žďáráci", away: "Palachovci" },
  { time: "15:30–15:42", home: "Bez limitu", away: "Cigiho banda" },
  { time: "15:45–15:57", home: "Dream Team", away: "Best Of The Rest" },
  { time: "16:00–16:12", home: "Cigiho banda", away: "Last Place Hunters" },
  { time: "16:15–16:27", home: "Palachovci", away: "Bez limitu" },
  { time: "16:30–16:42", home: "Crazywolves", away: "Žďáráci" },
  { time: "16:45–16:57", home: "Dream Team", away: "Savice" },
];

function uid() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function createLiveState() {
  return {
    period: 1,
    clock: MATCH_DURATION_SECONDS,
    running: false,
    overlayTitle: "",
    events: [],
  };
}

function createTeams(names = DEFAULT_TEAMS) {
  return names.map((name, index) => ({
    id: uid(),
    name,
    shootoutScore: 0,
    rosterText: "",
    manualRank: index + 1,
  }));
}

function createSponsors(items = DEFAULT_SPONSORS) {
  return items.map((item) => ({
    id: uid(),
    name: item.name,
    logoUrl: item.logoUrl || "",
  }));
}

function buildMatchesFromTemplates(teams) {
  const idByName = Object.fromEntries(teams.map((team) => [team.name, team.id]));

  return FIXED_MATCHES.filter((match) => idByName[match.home] && idByName[match.away]).map((match, index) => ({
    id: uid(),
    round: index + 1,
    time: match.time,
    homeId: idByName[match.home],
    awayId: idByName[match.away],
    homeScore: "",
    awayScore: "",
    status: "scheduled",
    sponsorId: null,
    closedAt: null,
    scorers: [],
    live: createLiveState(),
  }));
}

function createInitialState() {
  const teams = createTeams();
  return {
    tournamentName: "Urnacup",
    urnaLogoUrl: "",
    sponsors: createSponsors(),
    teams,
    matches: buildMatchesFromTemplates(teams),
    manualStandingsEnabled: false,
  };
}

function normalizeState(raw) {
  const fallback = createInitialState();
  if (!raw || !Array.isArray(raw.teams)) return fallback;

  const teams = raw.teams.map((team, index) => ({
    id: team.id || uid(),
    name: team.name || "Neznámý tým",
    shootoutScore: Number(team.shootoutScore || 0),
    rosterText: team.rosterText || "",
    manualRank: Number(team.manualRank || index + 1),
  }));

  const sponsors = Array.isArray(raw.sponsors)
    ? raw.sponsors.map((sponsor) => ({
        id: sponsor.id || uid(),
        name: sponsor.name || "Sponzor",
        logoUrl: sponsor.logoUrl || "",
      }))
    : createSponsors();

  const matches = Array.isArray(raw.matches) && raw.matches.length > 0
    ? raw.matches.map((match, index) => ({
        id: match.id || uid(),
        round: Number(match.round || index + 1),
        time: match.time || "",
        homeId: match.homeId,
        awayId: match.awayId,
        homeScore: match.homeScore ?? "",
        awayScore: match.awayScore ?? "",
        status: match.status || "scheduled",
        sponsorId: match.sponsorId || null,
        closedAt: match.closedAt || null,
        scorers: Array.isArray(match.scorers) ? match.scorers : [],
        live: {
          period: Number(match.live?.period || 1),
          clock: Number.isFinite(match.live?.clock) ? match.live.clock : MATCH_DURATION_SECONDS,
          running: Boolean(match.live?.running),
          overlayTitle: match.live?.overlayTitle || "",
          events: Array.isArray(match.live?.events) ? match.live.events : [],
        },
      }))
    : buildMatchesFromTemplates(teams);

  return {
    tournamentName: raw.tournamentName || "Urnacup",
    urnaLogoUrl: raw.urnaLogoUrl || "",
    sponsors,
    teams,
    matches,
    manualStandingsEnabled: Boolean(raw.manualStandingsEnabled),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? normalizeState(JSON.parse(raw)) : createInitialState();
  } catch {
    return createInitialState();
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function splitRosterLines(text) {
  return String(text || "")
    .split(String.fromCharCode(13)).join("")
    .split(String.fromCharCode(10))
    .map((line) => line.trim())
    .filter(Boolean);
}

function formatClock(seconds) {
  const value = Math.max(0, Number(seconds || 0));
  const minutes = String(Math.floor(value / 60)).padStart(2, "0");
  const secs = String(value % 60).padStart(2, "0");
  return `${minutes}:${secs}`;
}

function getTeamName(teams, id) {
  return teams.find((team) => team.id === id)?.name || "Neznámý tým";
}

function getTeamById(teams, id) {
  return teams.find((team) => team.id === id) || null;
}

function getSponsorById(sponsors, id) {
  return sponsors.find((sponsor) => sponsor.id === id) || null;
}

function toNumber(value) {
  if (value === "" || value === null || value === undefined) return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function isClosedMatch(match) {
  return match.status === "finished" && toNumber(match.homeScore) !== null && toNumber(match.awayScore) !== null;
}

function groupBy(items, getKey) {
  const map = new Map();
  items.forEach((item) => {
    const key = getKey(item);
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(item);
  });
  return Array.from(map.entries()).map(([key, groupItems]) => ({ key, items: groupItems }));
}

function buildComputedStandings(teams, matches) {
  const rows = teams.map((team) => ({
    teamId: team.id,
    teamName: team.name,
    played: 0,
    wins: 0,
    draws: 0,
    losses: 0,
    gf: 0,
    ga: 0,
    gd: 0,
    points: 0,
    shootoutScore: Number(team.shootoutScore || 0),
    manualRank: Number(team.manualRank || 999),
  }));

  const rowsById = Object.fromEntries(rows.map((row) => [row.teamId, row]));
  const closedMatches = matches.filter(isClosedMatch);

  closedMatches.forEach((match) => {
    const home = rowsById[match.homeId];
    const away = rowsById[match.awayId];
    if (!home || !away) return;

    const hs = Number(match.homeScore);
    const as = Number(match.awayScore);

    home.played += 1;
    away.played += 1;
    home.gf += hs;
    home.ga += as;
    away.gf += as;
    away.ga += hs;

    if (hs > as) {
      home.wins += 1;
      away.losses += 1;
      home.points += POINTS_WIN;
    } else if (hs < as) {
      away.wins += 1;
      home.losses += 1;
      away.points += POINTS_WIN;
    } else {
      home.draws += 1;
      away.draws += 1;
      home.points += POINTS_DRAW;
      away.points += POINTS_DRAW;
    }
  });

  rows.forEach((row) => {
    row.gd = row.gf - row.ga;
  });

  const getMiniMetrics = (groupIds) => {
    const allowed = new Set(groupIds);
    const mini = Object.fromEntries(groupIds.map((id) => [id, { miniPoints: 0, miniGd: 0 }]));

    closedMatches.forEach((match) => {
      if (!allowed.has(match.homeId) || !allowed.has(match.awayId)) return;
      const hs = Number(match.homeScore);
      const as = Number(match.awayScore);

      mini[match.homeId].miniGd += hs - as;
      mini[match.awayId].miniGd += as - hs;

      if (hs > as) {
        mini[match.homeId].miniPoints += POINTS_WIN;
      } else if (hs < as) {
        mini[match.awayId].miniPoints += POINTS_WIN;
      } else {
        mini[match.homeId].miniPoints += POINTS_DRAW;
        mini[match.awayId].miniPoints += POINTS_DRAW;
      }
    });

    return mini;
  };

  const sortRecursive = (items, level = 0) => {
    if (items.length <= 1) return items;

    if (level === 0) {
      return groupBy(items, (row) => row.points)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((group) => sortRecursive(group.items, 1));
    }

    if (level === 1) {
      const ids = items.map((row) => row.teamId);
      const mini = getMiniMetrics(ids);
      const enriched = items.map((row) => ({
        ...row,
        miniPoints: mini[row.teamId]?.miniPoints || 0,
        miniGd: mini[row.teamId]?.miniGd || 0,
      }));

      return groupBy(enriched, (row) => row.miniPoints)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((group) => sortRecursive(group.items, 2));
    }

    if (level === 2) {
      return groupBy(items, (row) => row.miniGd)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((group) => sortRecursive(group.items, 3));
    }

    return [...items].sort((a, b) => {
      if (b.shootoutScore !== a.shootoutScore) return b.shootoutScore - a.shootoutScore;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName, "cs");
    });
  };

  return sortRecursive(rows).map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildDisplayedStandings(teams, matches, manualStandingsEnabled) {
  const computed = buildComputedStandings(teams, matches);

  if (!manualStandingsEnabled) {
    return computed;
  }

  return [...computed]
    .sort((a, b) => {
      if (a.manualRank !== b.manualRank) return a.manualRank - b.manualRank;
      return a.teamName.localeCompare(b.teamName, "cs");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function buildScorerTable(matches, teams) {
  const map = new Map();

  matches.forEach((match) => {
    (match.scorers || []).forEach((entry) => {
      const key = `${entry.teamId}::${entry.playerName}`;
      if (!map.has(key)) {
        map.set(key, {
          teamId: entry.teamId,
          teamName: getTeamName(teams, entry.teamId),
          playerName: entry.playerName,
          goals: 0,
        });
      }
      map.get(key).goals += 1;
    });
  });

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (a.playerName !== b.playerName) return a.playerName.localeCompare(b.playerName, "cs");
      return a.teamName.localeCompare(b.teamName, "cs");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function getBadgeClass(status) {
  if (status === "finished") return "bg-emerald-500/15 text-emerald-300 border-emerald-400/30";
  if (status === "live") return "bg-rose-500/15 text-rose-300 border-rose-400/30";
  return "bg-slate-500/15 text-slate-300 border-slate-400/30";
}

function sponsorInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

export default function UrnacupPrototype() {
  const [data, setData] = useState(loadState);
  const [selectedMatchId, setSelectedMatchId] = useState(null);
  const [selectedTeamId, setSelectedTeamId] = useState(null);
  const [newTeamName, setNewTeamName] = useState("");
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorLogoUrl, setNewSponsorLogoUrl] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [authError, setAuthError] = useState("");
  const saveTimeoutRef = useRef(null);
  const sponsorRotationRef = useRef(0);
  const [sponsorRotationIndex, setSponsorRotationIndex] = useState(0);

  useEffect(() => {
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => saveState(data), 250);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setData((current) => ({
        ...current,
        matches: current.matches.map((match) => {
          if (!match.live.running || match.live.clock <= 0) return match;
          const nextClock = match.live.clock - 1;
          return {
            ...match,
            live: {
              ...match.live,
              clock: nextClock,
              running: nextClock > 0,
            },
          };
        }),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data.sponsors.length) return undefined;
    const timer = setInterval(() => {
      sponsorRotationRef.current = (sponsorRotationRef.current + 1) % data.sponsors.length;
      setSponsorRotationIndex(sponsorRotationRef.current);
    }, 2500);
    return () => clearInterval(timer);
  }, [data.sponsors.length]);

  const standings = useMemo(
    () => buildDisplayedStandings(data.teams, data.matches, data.manualStandingsEnabled),
    [data.teams, data.matches, data.manualStandingsEnabled]
  );

  const scorerTable = useMemo(() => buildScorerTable(data.matches, data.teams), [data.matches, data.teams]);

  const matchesByRound = useMemo(
    () => groupBy(data.matches, (match) => match.round).sort((a, b) => Number(a.key) - Number(b.key)),
    [data.matches]
  );

  const selectedMatch = data.matches.find((match) => match.id === selectedMatchId) || null;
  const selectedTeam = data.teams.find((team) => team.id === selectedTeamId) || null;
  const rotatingSponsor = data.sponsors.length ? data.sponsors[sponsorRotationIndex % data.sponsors.length] : null;

  const setTournamentName = (value) => {
    setData((current) => ({ ...current, tournamentName: value }));
  };

  const setUrnaLogoUrl = (value) => {
    setData((current) => ({ ...current, urnaLogoUrl: value }));
  };

  const setManualStandingsEnabled = (enabled) => {
    setData((current) => ({ ...current, manualStandingsEnabled: enabled }));
  };

  const loginAsAdmin = () => {
    if (passwordInput === DEMO_ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAuthError("");
      setPasswordInput("");
    } else {
      setAuthError("Nesprávné heslo.");
    }
  };

  const logoutAdmin = () => {
    setIsAdmin(false);
    setPasswordInput("");
    setAuthError("");
  };

  const updateTeam = (teamId, patch) => {
    setData((current) => ({
      ...current,
      teams: current.teams.map((team) => (team.id === teamId ? { ...team, ...patch } : team)),
    }));
  };

  const addTeam = () => {
    const name = newTeamName.trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      teams: [
        ...current.teams,
        {
          id: uid(),
          name,
          shootoutScore: 0,
          rosterText: "",
          manualRank: current.teams.length + 1,
        },
      ],
    }));
    setNewTeamName("");
  };

  const removeTeam = (teamId) => {
    setData((current) => ({
      ...current,
      teams: current.teams.filter((team) => team.id !== teamId),
      matches: current.matches.filter((match) => match.homeId !== teamId && match.awayId !== teamId),
    }));
    if (selectedMatch && (selectedMatch.homeId === teamId || selectedMatch.awayId === teamId)) setSelectedMatchId(null);
    if (selectedTeamId === teamId) setSelectedTeamId(null);
  };

  const restoreFixedSchedule = () => {
    setData((current) => ({
      ...current,
      matches: buildMatchesFromTemplates(current.teams),
    }));
    setSelectedMatchId(null);
  };

  const resetAllData = () => {
    setData(createInitialState());
    setSelectedMatchId(null);
    setSelectedTeamId(null);
  };

  const updateMatch = (matchId, patch) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => (match.id === matchId ? { ...match, ...patch } : match)),
    }));
  };

  const updateMatchLive = (matchId, patch) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId ? { ...match, live: { ...match.live, ...patch } } : match
      ),
    }));
  };

  const addGoal = (matchId, side, playerName) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => {
        if (match.id !== matchId) return match;
        const homeScore = toNumber(match.homeScore) || 0;
        const awayScore = toNumber(match.awayScore) || 0;
        const teamId = side === "home" ? match.homeId : match.awayId;
        const scorerName = playerName || "Neurčený střelec";
        const teamName = getTeamName(current.teams, teamId);

        return {
          ...match,
          status: match.status === "scheduled" ? "live" : match.status,
          homeScore: side === "home" ? homeScore + 1 : homeScore,
          awayScore: side === "away" ? awayScore + 1 : awayScore,
          scorers: [
            ...(match.scorers || []),
            {
              id: uid(),
              teamId,
              playerName: scorerName,
            },
          ],
          live: {
            ...match.live,
            events: [
              {
                id: uid(),
                time: formatClock(match.live.clock),
                text: `Gól – ${teamName}: ${scorerName}`,
              },
              ...(match.live.events || []),
            ].slice(0, 12),
          },
        };
      }),
    }));
  };

  const removeScorerEntry = (matchId, scorerId) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => {
        if (match.id !== matchId) return match;

        const targetEntry = (match.scorers || []).find((entry) => entry.id === scorerId);
        if (!targetEntry) return match;

        const nextScorers = (match.scorers || []).filter((entry) => entry.id !== scorerId);
        const nextHomeScore = Math.max(0, (toNumber(match.homeScore) || 0) - (targetEntry.teamId === match.homeId ? 1 : 0));
        const nextAwayScore = Math.max(0, (toNumber(match.awayScore) || 0) - (targetEntry.teamId === match.awayId ? 1 : 0));
        const targetTeamName = getTeamName(current.teams, targetEntry.teamId);
        const targetEventText = `Gól – ${targetTeamName}: ${targetEntry.playerName}`;

        let removedEvent = false;
        const nextEvents = (match.live.events || []).filter((event) => {
          if (!removedEvent && event.text === targetEventText) {
            removedEvent = true;
            return false;
          }
          return true;
        });

        return {
          ...match,
          homeScore: nextHomeScore,
          awayScore: nextAwayScore,
          scorers: nextScorers,
          live: {
            ...match.live,
            events: nextEvents,
          },
        };
      }),
    }));
  };

  const clearMatch = (matchId) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              homeScore: "",
              awayScore: "",
              status: "scheduled",
              closedAt: null,
              scorers: [],
              sponsorId: null,
              live: createLiveState(),
            }
          : match
      ),
    }));
  };

  const closeMatch = (matchId) => {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              status: "finished",
              closedAt: new Date().toISOString(),
              live: { ...match.live, running: false },
            }
          : match
      ),
    }));
  };

  const addSponsor = () => {
    const name = newSponsorName.trim();
    if (!name) return;
    setData((current) => ({
      ...current,
      sponsors: [...current.sponsors, { id: uid(), name, logoUrl: newSponsorLogoUrl.trim() }],
    }));
    setNewSponsorName("");
    setNewSponsorLogoUrl("");
  };

  const updateSponsor = (sponsorId, patch) => {
    setData((current) => ({
      ...current,
      sponsors: current.sponsors.map((sponsor) => (sponsor.id === sponsorId ? { ...sponsor, ...patch } : sponsor)),
    }));
  };

  const removeSponsor = (sponsorId) => {
    setData((current) => ({
      ...current,
      sponsors: current.sponsors.filter((sponsor) => sponsor.id !== sponsorId),
      matches: current.matches.map((match) => (match.sponsorId === sponsorId ? { ...match, sponsorId: null } : match)),
    }));
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <header className="relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 p-6 shadow-2xl shadow-indigo-950/30">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(59,130,246,0.2),transparent_30%),radial-gradient(circle_at_bottom_left,rgba(168,85,247,0.16),transparent_32%)]" />
          <div className="relative flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-white/5">
                {data.urnaLogoUrl ? (
                  <img src={data.urnaLogoUrl} alt="Urna Cup logo" className="h-full w-full object-cover" />
                ) : (
                  <div className="text-center text-sky-200">
                    <Trophy className="mx-auto h-8 w-8" />
                    <div className="mt-1 text-xs font-bold">URNA CUP</div>
                  </div>
                )}
              </div>

              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-sky-400/20 bg-sky-400/10 px-3 py-1 text-sm text-sky-200">
                  <Trophy className="h-4 w-4" />
                  WWW prototyp turnaje
                </div>
                <input
                  value={data.tournamentName}
                  onChange={(e) => isAdmin && setTournamentName(e.target.value)}
                  readOnly={!isAdmin}
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-3xl font-black tracking-tight text-white outline-none placeholder:text-slate-400 sm:w-auto sm:min-w-[320px]"
                  placeholder="Název turnaje"
                />
                <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
                  Body: 2 za výhru, 1 za remízu. U zápasu lze označit střelce podle soupisky a vede se tabulka střelců.
                </p>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-[repeat(4,minmax(0,1fr))] xl:min-w-[560px]">
              <InfoChip label="Týmy" value={String(data.teams.length)} icon={<Users className="h-4 w-4" />} />
              <InfoChip label="Zápasy" value={String(data.matches.length)} icon={<CalendarDays className="h-4 w-4" />} />
              <InfoChip label="Ukončeno" value={String(data.matches.filter((match) => match.status === "finished").length)} icon={<CheckCircle2 className="h-4 w-4" />} />
              <AuthCard
                isAdmin={isAdmin}
                passwordInput={passwordInput}
                setPasswordInput={setPasswordInput}
                authError={authError}
                onLogin={loginAsAdmin}
                onLogout={logoutAdmin}
              />
            </div>
          </div>

          {rotatingSponsor ? (
            <div className="relative mt-6 rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Rotující partner v hlavičce</div>
              <div className="flex items-center gap-3">
                <SponsorLogo sponsor={rotatingSponsor} size="small" />
                <div>
                  <div className="text-sm text-slate-400">Aktuálně zobrazený sponsor</div>
                  <div className="text-lg font-bold text-white">{rotatingSponsor.name}</div>
                </div>
              </div>
            </div>
          ) : null}
        </header>

        {isAdmin ? (
          <section className="mt-6 rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
            <SectionTitle icon={<ImageIcon className="h-5 w-5" />} title="Nastavení hlavičky" subtitle="Logo vlevo a loga sponzorů v rotaci." />
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <label className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">URL loga Urna Cupu</div>
                <input
                  value={data.urnaLogoUrl}
                  onChange={(e) => setUrnaLogoUrl(e.target.value)}
                  placeholder="https://.../urna-cup.png"
                  className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                />
              </label>
              <div className="rounded-2xl border border-white/10 bg-white/5 p-3 text-sm text-slate-300">
                <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">Jak vložit obrázek</div>
                <div>V této verzi vlož přímou URL adresu obrázku. Logo sponzora i logo turnaje se zobrazí hned po vložení odkazu.</div>
              </div>
            </div>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.05fr_1.4fr_0.95fr]">
          <section className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
            <SectionTitle icon={<Users className="h-5 w-5" />} title="Účastníci turnaje" subtitle="Kliknutí na název otevře profil týmu." />

            {isAdmin ? (
              <div className="mt-4 flex gap-2">
                <input
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Přidat nový tým"
                  className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                />
                <button onClick={addTeam} className="rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400">
                  <Plus className="h-4 w-4" />
                </button>
              </div>
            ) : null}

            <div className="mt-4 space-y-3">
              {data.teams.map((team, index) => (
                <div key={team.id} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="flex items-start gap-3">
                    <div className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-sky-500/15 text-sm font-bold text-sky-200">
                      {index + 1}
                    </div>
                    <div className="min-w-0 flex-1">
                      {isAdmin ? (
                        <input
                          value={team.name}
                          onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                          className="w-full rounded-xl border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-white outline-none focus:border-white/10 focus:bg-white/5"
                        />
                      ) : (
                        <button onClick={() => setSelectedTeamId(team.id)} className="block w-full text-left text-sm font-semibold text-white transition hover:text-sky-200">
                          {team.name}
                        </button>
                      )}

                      <div className="mt-2 flex items-center justify-between gap-3">
                        <button onClick={() => setSelectedTeamId(team.id)} className="text-xs font-semibold text-sky-200 transition hover:text-sky-100">
                          Zobrazit profil týmu
                        </button>
                        {isAdmin ? (
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Nájezdy:</span>
                            <input
                              type="number"
                              value={team.shootoutScore}
                              onChange={(e) => updateTeam(team.id, { shootoutScore: Number(e.target.value || 0) })}
                              className="w-20 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-1.5 text-sm text-white outline-none"
                            />
                          </div>
                        ) : null}
                      </div>
                    </div>
                    {isAdmin ? (
                      <button onClick={() => removeTeam(team.id)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    ) : null}
                  </div>
                </div>
              ))}
            </div>

            {isAdmin ? (
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                <button onClick={restoreFixedSchedule} className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-indigo-400">
                  <RefreshCcw className="h-4 w-4" />
                  Obnovit pevný rozpis
                </button>
                <button onClick={resetAllData} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
                  <RotateCcw className="h-4 w-4" />
                  Obnovit demo data
                </button>
              </div>
            ) : null}
          </section>

          <section className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
            <SectionTitle icon={<CalendarDays className="h-5 w-5" />} title="Rozpis zápasů" subtitle="Pevně vložený harmonogram Urna Cupu." />

            <div className="mt-4 space-y-5">
              {matchesByRound.map((round) => (
                <div key={String(round.key)}>
                  <div className="mb-3 inline-flex items-center rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    Zápas #{round.key}
                  </div>
                  <div className="space-y-3">
                    {round.items.map((match) => {
                      const homeName = getTeamName(data.teams, match.homeId);
                      const awayName = getTeamName(data.teams, match.awayId);
                      const sponsor = getSponsorById(data.sponsors, match.sponsorId);

                      return (
                        <button
                          key={match.id}
                          onClick={() => setSelectedMatchId(match.id)}
                          className="w-full rounded-2xl border border-white/10 bg-white/5 p-4 text-left transition hover:border-sky-400/30 hover:bg-white/10"
                        >
                          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
                            <div className="min-w-0 flex-1">
                              <div className="mb-2 flex flex-wrap items-center gap-2 text-xs text-slate-400">
                                {match.time ? <span className="rounded-full border border-white/10 px-2 py-1">{match.time}</span> : null}
                                <span className={`rounded-full border px-2 py-1 ${getBadgeClass(match.status)}`}>
                                  {match.status === "scheduled" ? "Plánováno" : match.status === "live" ? "Živě" : "Ukončeno"}
                                </span>
                                {match.status !== "scheduled" ? (
                                  <span className="rounded-full border border-white/10 px-2 py-1">{formatClock(match.live.clock)}</span>
                                ) : null}
                                {sponsor ? (
                                  <span className="rounded-full border border-amber-400/20 bg-amber-500/10 px-2 py-1 text-amber-100">
                                    Partner utkání: {sponsor.name}
                                  </span>
                                ) : null}
                              </div>

                              <div className="grid grid-cols-[1fr_auto_1fr_auto] items-center gap-2 text-sm sm:text-base">
                                <div className="truncate font-semibold text-white">{homeName}</div>
                                <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-center text-lg font-black text-white">
                                  {match.homeScore === "" ? "–" : match.homeScore}
                                </div>
                                <div className="truncate text-right font-semibold text-white">{awayName}</div>
                                <div className="rounded-xl bg-slate-950/80 px-3 py-2 text-center text-lg font-black text-white">
                                  {match.awayScore === "" ? "–" : match.awayScore}
                                </div>
                              </div>
                            </div>
                            <div className="inline-flex items-center gap-2 text-sm font-semibold text-sky-200">
                              Detail zápasu
                              <ChevronRight className="h-4 w-4" />
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-6">
            <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <SectionTitle icon={<Trophy className="h-5 w-5" />} title="Aktuální tabulka" subtitle="Pořadí: body → vzájemné zápasy → vzájemné skóre → nájezdy" />
              <div className="mt-3 rounded-2xl border border-sky-400/20 bg-sky-500/10 p-3 text-sm text-sky-100">
                Bodování je nastavené na 2 body za výhru a 1 bod za remízu.
              </div>

              {isAdmin ? (
                <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                    <PencilLine className="h-4 w-4 text-sky-300" />
                    Ruční úprava konečného pořadí tabulky
                  </div>

                  <label className="mb-4 flex items-center gap-3 text-sm text-slate-200">
                    <input
                      type="checkbox"
                      checked={data.manualStandingsEnabled}
                      onChange={(e) => setManualStandingsEnabled(e.target.checked)}
                      className="h-4 w-4 rounded border-white/10 bg-slate-950/70"
                    />
                    Zapnout ruční pořadí tabulky
                  </label>

                  <div className="grid gap-2">
                    {data.teams
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, "cs"))
                      .map((team) => (
                        <div key={team.id} className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2">
                          <div className="text-sm font-semibold text-white">{team.name}</div>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-400">Ruční pořadí</span>
                            <input
                              type="number"
                              min="1"
                              value={team.manualRank}
                              onChange={(e) => updateTeam(team.id, { manualRank: Number(e.target.value || 1) })}
                              className="w-20 rounded-xl border border-white/10 bg-slate-900 px-3 py-2 text-sm text-white outline-none"
                            />
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                <div className="overflow-x-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white/5 text-slate-300">
                      <tr>
                        <Th>#</Th>
                        <Th>Tým</Th>
                        <Th>Z</Th>
                        <Th>V</Th>
                        <Th>R</Th>
                        <Th>P</Th>
                        <Th>Skóre</Th>
                        <Th>B</Th>
                        <Th>N</Th>
                      </tr>
                    </thead>
                    <tbody>
                      {standings.map((row, index) => (
                        <tr key={row.teamId} className={index % 2 === 0 ? "bg-slate-950/60" : "bg-slate-900/60"}>
                          <Td strong>{row.rank}</Td>
                          <Td>
                            <button onClick={() => setSelectedTeamId(row.teamId)} className="text-left text-slate-100 transition hover:text-sky-200">
                              {row.teamName}
                            </button>
                          </Td>
                          <Td>{row.played}</Td>
                          <Td>{row.wins}</Td>
                          <Td>{row.draws}</Td>
                          <Td>{row.losses}</Td>
                          <Td>{row.gf}:{row.ga}</Td>
                          <Td strong>{row.points}</Td>
                          <Td>{row.shootoutScore}</Td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <SectionTitle icon={<Target className="h-5 w-5" />} title="Tabulka střelců" subtitle="Počítá se podle označených střelců u zápasů." />
              {scorerTable.length === 0 ? (
                <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">
                  Zatím není zapsaný žádný střelec.
                </div>
              ) : (
                <div className="mt-4 overflow-hidden rounded-2xl border border-white/10">
                  <div className="overflow-x-auto">
                    <table className="min-w-full text-sm">
                      <thead className="bg-white/5 text-slate-300">
                        <tr>
                          <Th>#</Th>
                          <Th>Hráč</Th>
                          <Th>Tým</Th>
                          <Th>G</Th>
                        </tr>
                      </thead>
                      <tbody>
                        {scorerTable.map((row, index) => (
                          <tr key={`${row.teamId}-${row.playerName}`} className={index % 2 === 0 ? "bg-slate-950/60" : "bg-slate-900/60"}>
                            <Td strong>{row.rank}</Td>
                            <Td>{row.playerName}</Td>
                            <Td>{row.teamName}</Td>
                            <Td strong>{row.goals}</Td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-slate-900/80 p-5 shadow-xl shadow-black/20 backdrop-blur">
              <SectionTitle icon={<Handshake className="h-5 w-5" />} title="Sponzoři" subtitle="Veřejná prezentace s možností vložit logo přes URL." />

              {isAdmin ? (
                <div className="mt-4 grid gap-2">
                  <input
                    value={newSponsorName}
                    onChange={(e) => setNewSponsorName(e.target.value)}
                    placeholder="Název sponzora"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <input
                    value={newSponsorLogoUrl}
                    onChange={(e) => setNewSponsorLogoUrl(e.target.value)}
                    placeholder="Odkaz na logo (URL)"
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-400"
                  />
                  <button onClick={addSponsor} className="rounded-2xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-emerald-400">
                    Přidat sponzora
                  </button>
                </div>
              ) : null}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {data.sponsors.map((sponsor) => (
                  <div key={sponsor.id} className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <div className="flex items-center gap-3">
                      <SponsorLogo sponsor={sponsor} size="small" />
                      <div className="min-w-0 flex-1">
                        {isAdmin ? (
                          <input
                            value={sponsor.name}
                            onChange={(e) => updateSponsor(sponsor.id, { name: e.target.value })}
                            className="w-full rounded-xl border border-transparent bg-transparent px-1 py-1 text-sm font-semibold text-white outline-none focus:border-white/10 focus:bg-white/5"
                          />
                        ) : (
                          <div className="text-sm font-semibold text-white">{sponsor.name}</div>
                        )}
                      </div>
                      {isAdmin ? (
                        <button onClick={() => removeSponsor(sponsor.id)} className="rounded-xl border border-white/10 p-2 text-slate-400 transition hover:border-rose-400/30 hover:bg-rose-500/10 hover:text-rose-200">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      ) : null}
                    </div>
                    {isAdmin ? (
                      <div className="mt-3">
                        <input
                          value={sponsor.logoUrl}
                          onChange={(e) => updateSponsor(sponsor.id, { logoUrl: e.target.value })}
                          placeholder="Odkaz na logo (URL)"
                          className="w-full rounded-xl border border-white/10 bg-slate-950/60 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>
          </section>
        </div>
      </div>

      {selectedMatch ? (
        <MatchModal
          match={selectedMatch}
          teams={data.teams}
          sponsors={data.sponsors}
          isAdmin={isAdmin}
          onClose={() => setSelectedMatchId(null)}
          onMatchChange={updateMatch}
          onLiveChange={updateMatchLive}
          onAddGoal={addGoal}
          onRemoveScorerEntry={removeScorerEntry}
          onClearMatch={clearMatch}
          onCloseMatch={closeMatch}
        />
      ) : null}

      {selectedTeam ? (
        <TeamModal
          team={selectedTeam}
          standings={standings}
          matches={data.matches}
          teams={data.teams}
          isAdmin={isAdmin}
          onClose={() => setSelectedTeamId(null)}
          onUpdateTeam={updateTeam}
        />
      ) : null}
    </div>
  );
}

function AuthCard({ isAdmin, passwordInput, setPasswordInput, authError, onLogin, onLogout }) {
  if (isAdmin) {
    return (
      <div className="rounded-2xl border border-emerald-400/20 bg-emerald-500/10 p-3">
        <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-200">
          <ShieldCheck className="h-4 w-4" />
          Administrátor
        </div>
        <div className="mt-2 text-sm font-semibold text-white">Editace je odemčená</div>
        <button onClick={onLogout} className="mt-3 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition hover:bg-white/15">
          <LogOut className="h-4 w-4" />
          Odhlásit
        </button>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-300">
        <Lock className="h-4 w-4" />
        Přihlášení správce
      </div>
      <div className="mt-2 flex gap-2">
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && onLogin()}
          placeholder="Heslo"
          className="min-w-0 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500"
        />
        <button onClick={onLogin} className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400">
          Vstup
        </button>
      </div>
      <div className="mt-2 text-[11px] text-slate-400">Demo heslo: 97531</div>
      {authError ? <div className="mt-1 text-xs text-rose-300">{authError}</div> : null}
    </div>
  );
}

function MatchModal({
  match,
  teams,
  sponsors,
  isAdmin,
  onClose,
  onMatchChange,
  onLiveChange,
  onAddGoal,
  onRemoveScorerEntry,
  onClearMatch,
  onCloseMatch,
}) {
  const [selectedHomePlayer, setSelectedHomePlayer] = useState("");
  const [selectedAwayPlayer, setSelectedAwayPlayer] = useState("");

  useEffect(() => {
    setSelectedHomePlayer("");
    setSelectedAwayPlayer("");
  }, [match.id]);

  const homeTeam = getTeamById(teams, match.homeId);
  const awayTeam = getTeamById(teams, match.awayId);
  const homeName = homeTeam?.name || "Neznámý tým";
  const awayName = awayTeam?.name || "Neznámý tým";
  const sponsor = getSponsorById(sponsors, match.sponsorId);
  const homePlayers = splitRosterLines(homeTeam?.rosterText || "");
  const awayPlayers = splitRosterLines(awayTeam?.rosterText || "");
  const scorerEntries = [...(match.scorers || [])]
    .slice()
    .reverse()
    .map((entry) => ({
      ...entry,
      teamName: getTeamName(teams, entry.teamId),
    }));
  const latestScorerEntry = match.scorers && match.scorers.length ? match.scorers[match.scorers.length - 1] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-7xl overflow-auto rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl shadow-black/60">
        {sponsor ? (
          <div className="border-b border-amber-400/20 bg-amber-500/10 px-5 py-3">
            <div className="flex items-center gap-3">
              <SponsorLogo sponsor={sponsor} size="tiny" />
              <div>
                <div className="text-xs uppercase tracking-[0.2em] text-amber-200">Partner utkání</div>
                <div className="text-sm font-bold text-white">{sponsor.name}</div>
              </div>
            </div>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <div>
            <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Detail utkání</div>
            <div className="mt-1 text-xl font-black text-white">{homeName} vs. {awayName}</div>
            {match.time ? <div className="mt-1 text-sm text-slate-400">{match.time}</div> : null}
          </div>
          <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
            Zavřít
          </button>
        </div>

        <div className="grid gap-6 p-5 xl:grid-cols-[1.25fr_0.95fr]">
          <div className="space-y-6">
            <div className="overflow-hidden rounded-[28px] border border-sky-400/20 bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 p-5">
              <div className="mb-4 flex items-center justify-between">
                <div className="inline-flex items-center gap-2 rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-200">
                  <Radio className="h-3.5 w-3.5" />
                  Online přenos
                </div>
                <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">Perioda {match.live.period}</div>
              </div>

              {match.live.overlayTitle ? (
                <div className="mb-4 rounded-2xl border border-sky-400/20 bg-sky-500/10 px-4 py-2 text-center text-sm font-semibold text-sky-100">
                  {match.live.overlayTitle}
                </div>
              ) : null}

              <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <div className="min-w-0 text-center">
                  <div className="truncate text-base font-bold text-white sm:text-xl">{homeName}</div>
                  <div className="mt-3 rounded-[22px] bg-white/5 px-3 py-6 text-5xl font-black tracking-tight text-white sm:text-7xl">
                    {match.homeScore === "" ? 0 : match.homeScore}
                  </div>
                </div>
                <div className="text-center">
                  <div className="rounded-[22px] border border-white/10 bg-black/30 px-5 py-4 text-3xl font-black tracking-[0.15em] text-emerald-200 sm:text-5xl">
                    {formatClock(match.live.clock)}
                  </div>
                  <div className="mt-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-300">
                    {match.status === "scheduled" ? "Připraveno" : match.status === "live" ? "Živě" : "Ukončeno"}
                  </div>
                </div>
                <div className="min-w-0 text-center">
                  <div className="truncate text-base font-bold text-white sm:text-xl">{awayName}</div>
                  <div className="mt-3 rounded-[22px] bg-white/5 px-3 py-6 text-5xl font-black tracking-tight text-white sm:text-7xl">
                    {match.awayScore === "" ? 0 : match.awayScore}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                  <Smartphone className="h-4 w-4 text-sky-300" />
                  Administrace utkání a střelců
                </div>

                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  <button onClick={() => onAddGoal(match.id, "home", "Neurčený střelec")} className="rounded-2xl bg-sky-500 px-4 py-4 text-sm font-bold text-white transition hover:bg-sky-400">
                    + gól domácí bez střelce
                  </button>
                  <button onClick={() => onAddGoal(match.id, "away", "Neurčený střelec")} className="rounded-2xl bg-violet-500 px-4 py-4 text-sm font-bold text-white transition hover:bg-violet-400">
                    + gól hosté bez střelce
                  </button>
                  <button
                    onClick={() => {
                      if (match.live.running) {
                        onLiveChange(match.id, { running: false });
                      } else {
                        onMatchChange(match.id, { status: match.status === "scheduled" ? "live" : match.status });
                        onLiveChange(match.id, { running: true });
                      }
                    }}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-500 px-4 py-4 text-sm font-bold text-white transition hover:bg-emerald-400"
                  >
                    {match.live.running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                    {match.live.running ? "Pozastavit" : "Spustit čas"}
                  </button>
                  <button onClick={() => onLiveChange(match.id, { clock: MATCH_DURATION_SECONDS, running: false })} className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-4 text-sm font-bold text-white transition hover:bg-white/10">
                    <RotateCcw className="h-4 w-4" />
                    Reset času
                  </button>
                </div>

                <div className="mt-4 grid gap-4 lg:grid-cols-2">
                  <RosterScorerPicker
                    title={`Střelci ${homeName}`}
                    players={homePlayers}
                    selectedPlayer={selectedHomePlayer}
                    onSelect={setSelectedHomePlayer}
                    onConfirm={() => {
                      if (!selectedHomePlayer) return;
                      onAddGoal(match.id, "home", selectedHomePlayer);
                      setSelectedHomePlayer("");
                    }}
                    buttonLabel="Přidat gól domácího střelce"
                  />

                  <RosterScorerPicker
                    title={`Střelci ${awayName}`}
                    players={awayPlayers}
                    selectedPlayer={selectedAwayPlayer}
                    onSelect={setSelectedAwayPlayer}
                    onConfirm={() => {
                      if (!selectedAwayPlayer) return;
                      onAddGoal(match.id, "away", selectedAwayPlayer);
                      setSelectedAwayPlayer("");
                    }}
                    buttonLabel="Přidat gól hostujícího střelce"
                  />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2">
                  <Field label="Manuální skóre domácí">
                    <input
                      type="number"
                      value={match.homeScore}
                      onChange={(e) => onMatchChange(match.id, { homeScore: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                    />
                  </Field>
                  <Field label="Manuální skóre hosté">
                    <input
                      type="number"
                      value={match.awayScore}
                      onChange={(e) => onMatchChange(match.id, { awayScore: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                    />
                  </Field>
                  <Field label="Perioda">
                    <select
                      value={match.live.period}
                      onChange={(e) => onLiveChange(match.id, { period: Number(e.target.value) })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                    >
                      <option value={1}>1. třetina</option>
                      <option value={2}>2. třetina</option>
                      <option value={3}>3. třetina</option>
                      <option value={4}>Prodloužení</option>
                    </select>
                  </Field>
                  <Field label="Sponzor utkání">
                    <select
                      value={match.sponsorId || ""}
                      onChange={(e) => onMatchChange(match.id, { sponsorId: e.target.value || null })}
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none"
                    >
                      <option value="">Bez partnera utkání</option>
                      {sponsors.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Titulek přenosu" className="md:col-span-2">
                    <input
                      value={match.live.overlayTitle}
                      onChange={(e) => onLiveChange(match.id, { overlayTitle: e.target.value })}
                      placeholder="např. Boj o 1. místo"
                      className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-white outline-none placeholder:text-slate-500"
                    />
                  </Field>
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button onClick={() => onMatchChange(match.id, { status: "live" })} className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-200 transition hover:bg-rose-500/20">
                    Označit jako živě
                  </button>
                  <button
                    onClick={() => latestScorerEntry && onRemoveScorerEntry(match.id, latestScorerEntry.id)}
                    disabled={!latestScorerEntry}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
                  >
                    Smazat poslední gól
                  </button>
                  <button
                    onClick={() => onClearMatch(match.id)}
                    className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
                  >
                    Vymazat zápas
                  </button>
                  <button onClick={() => onCloseMatch(match.id)} className="rounded-2xl bg-amber-500 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-amber-400">
                    Uzavřít zápas a promítnout do tabulky
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <Target className="h-4 w-4 text-sky-300" />
                Střelci zápasu
              </div>
              {scorerEntries.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                  Zatím není zapsaný žádný střelec.
                </div>
              ) : (
                <div className="space-y-2">
                  {scorerEntries.map((row) => (
                    <div key={row.id} className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <div>
                        <div className="text-sm font-semibold text-white">{row.playerName}</div>
                        <div className="text-xs text-slate-400">{row.teamName}</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-white">1 g</div>
                        {isAdmin ? (
                          <button
                            onClick={() => onRemoveScorerEntry(match.id, row.id)}
                            className="rounded-xl border border-rose-400/20 bg-rose-500/10 px-3 py-2 text-xs font-semibold text-rose-200 transition hover:bg-rose-500/20"
                          >
                            Smazat
                          </button>
                        ) : null}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-white">
                <ListChecks className="h-4 w-4 text-sky-300" />
                Události zápasu
              </div>
              <div className="space-y-2">
                {match.live.events.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
                    Zatím bez událostí.
                  </div>
                ) : (
                  match.live.events.map((event) => (
                    <div key={event.id} className="flex items-start gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                      <div className="rounded-full border border-white/10 bg-white/5 px-2 py-1 text-xs font-bold text-sky-200">{event.time}</div>
                      <div className="text-sm text-slate-100">{event.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-4">
              <div className="mb-3 text-sm font-semibold text-white">Stav zápasu</div>
              <div className="space-y-3 text-sm text-slate-300">
                <InfoLine label="Pořadí v rozpisu" value={String(match.round)} />
                <InfoLine label="Čas" value={match.time || "—"} />
                <InfoLine label="Status" value={match.status === "scheduled" ? "Plánováno" : match.status === "live" ? "Živě" : "Ukončeno"} />
                <InfoLine label="Časomíra" value={formatClock(match.live.clock)} />
                <InfoLine label="Perioda" value={String(match.live.period)} />
                <InfoLine label="Přenos" value={match.live.running ? "Běží" : "Stojí"} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterScorerPicker({ title, players, selectedPlayer, onSelect, onConfirm, buttonLabel }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
      <div className="mb-3 text-sm font-semibold text-white">{title}</div>
      {players.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/10 px-4 py-6 text-center text-sm text-slate-400">
          Nejdřív doplň soupisku týmu.
        </div>
      ) : (
        <>
          <div className="grid max-h-56 gap-2 overflow-auto pr-1">
            {players.map((player) => {
              const active = selectedPlayer === player;
              return (
                <button
                  key={player}
                  onClick={() => onSelect(active ? "" : player)}
                  className={`rounded-xl border px-3 py-2 text-left text-sm transition ${active ? "border-sky-400/40 bg-sky-500/20 text-white" : "border-white/10 bg-white/5 text-slate-200 hover:bg-white/10"}`}
                >
                  {player}
                </button>
              );
            })}
          </div>
          <button
            onClick={onConfirm}
            disabled={!selectedPlayer}
            className="mt-3 w-full rounded-2xl bg-sky-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-sky-400 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {buttonLabel}
          </button>
        </>
      )}
    </div>
  );
}

function TeamModal({ team, standings, matches, teams, isAdmin, onClose, onUpdateTeam }) {
  const standing = standings.find((row) => row.teamId === team.id);
  const playedMatches = matches.filter((match) => isClosedMatch(match) && (match.homeId === team.id || match.awayId === team.id));
  const upcomingMatches = matches.filter((match) => !isClosedMatch(match) && (match.homeId === team.id || match.awayId === team.id));
  const roster = splitRosterLines(team.rosterText);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 p-4 backdrop-blur-sm">
      <div className="max-h-[95vh] w-full max-w-5xl overflow-auto rounded-[28px] border border-white/10 bg-slate-900 shadow-2xl shadow-black/60">
        <div className="border-b border-white/10 px-5 py-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Profil týmu</div>
              <div className="mt-1 text-2xl font-black text-white">{team.name}</div>
            </div>
            <button onClick={onClose} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-semibold text-white transition hover:bg-white/10">
              Zavřít
            </button>
          </div>
        </div>

        <div className="grid gap-6 p-5 xl:grid-cols-[0.9fr_1.1fr]">
          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/10 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-5">
              <div className="mb-4 text-sm font-semibold text-white">Přehled</div>
              <div className="grid grid-cols-2 gap-3">
                <InfoChip label="Pořadí" value={standing ? String(standing.rank) : "–"} icon={<Trophy className="h-4 w-4" />} />
                <InfoChip label="Body" value={standing ? String(standing.points) : "0"} icon={<Target className="h-4 w-4" />} />
                <InfoChip label="Zápasy" value={standing ? String(standing.played) : "0"} icon={<ListChecks className="h-4 w-4" />} />
                <InfoChip label="Skóre" value={standing ? `${standing.gf}:${standing.ga}` : "0:0"} icon={<Clock3 className="h-4 w-4" />} />
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-sm font-semibold text-white">Soupiska</div>
              {isAdmin ? (
                <textarea
                  value={team.rosterText}
                  onChange={(e) => onUpdateTeam(team.id, { rosterText: e.target.value })}
                  placeholder="Každého hráče napiš na samostatný řádek"
                  className="min-h-[220px] w-full rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500"
                />
              ) : roster.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">Soupiska zatím nebyla doplněna.</div>
              ) : (
                <div className="grid gap-2 sm:grid-cols-2">
                  {roster.map((player, index) => (
                    <div key={`${player}-${index}`} className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3 text-sm text-slate-100">
                      {index + 1}. {player}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-sm font-semibold text-white">Odehraná utkání</div>
              <div className="space-y-3">
                {playedMatches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">Tým ještě nemá odehrané utkání.</div>
                ) : (
                  playedMatches.map((match) => (
                    <MatchLine key={match.id} match={match} teamId={team.id} teams={teams} />
                  ))
                )}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/5 p-5">
              <div className="mb-3 text-sm font-semibold text-white">Příští program</div>
              <div className="space-y-3">
                {upcomingMatches.length === 0 ? (
                  <div className="rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center text-sm text-slate-400">Další utkání zatím nejsou k dispozici.</div>
                ) : (
                  [...upcomingMatches].sort((a, b) => a.round - b.round).map((match) => (
                    <MatchLine key={match.id} match={match} teamId={team.id} teams={teams} future />
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MatchLine({ match, teamId, teams, future = false }) {
  const isHome = match.homeId === teamId;
  const opponent = isHome ? getTeamName(teams, match.awayId) : getTeamName(teams, match.homeId);
  const myScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;

  return (
    <div className="rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
      <div className="mb-2 flex items-center justify-between gap-3 text-xs text-slate-400">
        <span>{match.time || `Zápas #${match.round}`}</span>
        <span className={`rounded-full border px-2 py-1 ${getBadgeClass(match.status)}`}>{future ? "Program" : "Dohráno"}</span>
      </div>
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-sm font-semibold text-white">{opponent}</div>
          <div className="mt-1 text-xs text-slate-400">{isHome ? "domácí" : "hosté"}</div>
        </div>
        <div className="rounded-xl bg-white/5 px-3 py-2 text-sm font-black text-white">{future ? "vs" : `${myScore}:${oppScore}`}</div>
      </div>
    </div>
  );
}

function SponsorLogo({ sponsor, size = "small" }) {
  const sizeClasses = size === "tiny" ? "h-10 w-10" : size === "small" ? "h-14 w-14" : "h-20 w-20";

  if (sponsor.logoUrl) {
    return (
      <div className={`overflow-hidden rounded-2xl border border-white/10 bg-white ${sizeClasses}`}>
        <img src={sponsor.logoUrl} alt={sponsor.name} className="h-full w-full object-contain p-2" />
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-center rounded-2xl border border-white/10 bg-slate-950/60 ${sizeClasses}`}>
      <div className="text-center">
        <ImageIcon className="mx-auto h-4 w-4 text-slate-500" />
        <div className="mt-1 text-[10px] font-bold text-slate-300">{sponsorInitials(sponsor.name)}</div>
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, subtitle }) {
  return (
    <div>
      <div className="flex items-center gap-2 text-white">
        <div className="rounded-xl bg-sky-500/15 p-2 text-sky-300">{icon}</div>
        <div>
          <div className="text-lg font-bold">{title}</div>
          <div className="text-sm text-slate-400">{subtitle}</div>
        </div>
      </div>
    </div>
  );
}

function InfoChip({ label, value, icon }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-3 backdrop-blur">
      <div className="flex items-center gap-2 text-xs uppercase tracking-wide text-slate-400">
        {icon}
        {label}
      </div>
      <div className="mt-2 text-2xl font-black text-white">{value}</div>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`rounded-2xl border border-white/10 bg-slate-950/60 p-3 text-sm text-slate-300 ${className}`}>
      <div className="mb-2 text-xs uppercase tracking-wide text-slate-400">{label}</div>
      {children}
    </label>
  );
}

function Th({ children }) {
  return <th className="px-3 py-3 text-left text-xs font-bold uppercase tracking-wide">{children}</th>;
}

function Td({ children, strong = false }) {
  return <td className={`px-3 py-3 ${strong ? "font-bold text-white" : "text-slate-200"}`}>{children}</td>;
}

function InfoLine({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
      <span className="text-slate-400">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}
