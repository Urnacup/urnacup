import React, { useEffect, useMemo, useState } from "react";

const STORAGE_KEY = "urnacup-www-v3";
const ADMIN_PASSWORD = "97531";
const MATCH_DURATION_SECONDS = 12 * 60;
const POINTS_WIN = 2;
const POINTS_DRAW = 1;

const defaultTeamNames = [
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

const fixedMatches = [
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

const defaultSponsors = [
  { name: "Hauk", logoUrl: "" },
  { name: "Koloniál Renata", logoUrl: "" },
  { name: "Bluefly", logoUrl: "" },
  { name: "Saargummy", logoUrl: "" },
  { name: "Triangl", logoUrl: "" },
  { name: "Drogerie Vávra", logoUrl: "" },
];

function uid() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function parseRoster(text) {
  return String(text || "")
    .replace(/\r/g, "")
    .split("\n")
    .map((x) => x.trim())
    .filter(Boolean);
}

function formatClock(seconds) {
  const s = Math.max(0, Number(seconds || 0));
  const m = String(Math.floor(s / 60)).padStart(2, "0");
  const sec = String(s % 60).padStart(2, "0");
  return `${m}:${sec}`;
}

function getTeamName(teams, id) {
  return teams.find((t) => t.id === id)?.name || "Neznámý tým";
}

function sponsorInitials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((x) => x[0])
    .join("")
    .toUpperCase();
}

function buildMatchesFromTemplates(teams) {
  const teamIdByName = Object.fromEntries(teams.map((t) => [t.name, t.id]));
  return fixedMatches
    .filter((m) => teamIdByName[m.home] && teamIdByName[m.away])
    .map((m, index) => ({
      id: uid(),
      round: index + 1,
      time: m.time,
      homeId: teamIdByName[m.home],
      awayId: teamIdByName[m.away],
      homeScore: "",
      awayScore: "",
      status: "scheduled",
      sponsorId: "",
      scorers: [],
      live: {
        running: false,
        clock: MATCH_DURATION_SECONDS,
        period: 1,
        overlayTitle: "",
        events: [],
      },
    }));
}

function buildInitialState() {
  const teams = defaultTeamNames.map((name, index) => ({
    id: uid(),
    name,
    rosterText: "",
    shootoutScore: 0,
    manualRank: index + 1,
  }));

  return {
    tournamentName: "Urna Cup",
    urnaLogoUrl: "",
    manualStandingsEnabled: false,
    teams,
    matches: buildMatchesFromTemplates(teams),
    sponsors: defaultSponsors.map((s) => ({ id: uid(), ...s })),
  };
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return buildInitialState();
    const parsed = JSON.parse(raw);
    const fallback = buildInitialState();

    const teams = Array.isArray(parsed.teams) ? parsed.teams : fallback.teams;

    const matches =
      Array.isArray(parsed.matches) && parsed.matches.length
        ? parsed.matches.map((m) => ({
            ...m,
            scorers: Array.isArray(m.scorers) ? m.scorers : [],
            live: {
              running: Boolean(m.live?.running),
              clock:
                typeof m.live?.clock === "number"
                  ? m.live.clock
                  : MATCH_DURATION_SECONDS,
              period:
                typeof m.live?.period === "number" ? m.live.period : 1,
              overlayTitle: m.live?.overlayTitle || "",
              events: Array.isArray(m.live?.events) ? m.live.events : [],
            },
          }))
        : buildMatchesFromTemplates(teams);

    return {
      tournamentName: parsed.tournamentName || fallback.tournamentName,
      urnaLogoUrl: parsed.urnaLogoUrl || "",
      manualStandingsEnabled: Boolean(parsed.manualStandingsEnabled),
      teams,
      matches,
      sponsors: Array.isArray(parsed.sponsors)
        ? parsed.sponsors
        : fallback.sponsors,
    };
  } catch {
    return buildInitialState();
  }
}

function isFinished(match) {
  return (
    match.status === "finished" &&
    match.homeScore !== "" &&
    match.awayScore !== ""
  );
}

function buildStandings(teams, matches, manualEnabled) {
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

  const byId = Object.fromEntries(rows.map((r) => [r.teamId, r]));
  const finished = matches.filter(isFinished);

  finished.forEach((m) => {
    const hs = Number(m.homeScore);
    const as = Number(m.awayScore);
    const home = byId[m.homeId];
    const away = byId[m.awayId];
    if (!home || !away) return;

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

  rows.forEach((r) => {
    r.gd = r.gf - r.ga;
  });

  function group(items, keyFn) {
    const map = new Map();
    items.forEach((item) => {
      const key = keyFn(item);
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });
    return Array.from(map.entries()).map(([key, items]) => ({ key, items }));
  }

  function mini(ids) {
    const set = new Set(ids);
    const result = Object.fromEntries(ids.map((id) => [id, { pts: 0, gd: 0 }]));

    finished.forEach((m) => {
      if (!set.has(m.homeId) || !set.has(m.awayId)) return;

      const hs = Number(m.homeScore);
      const as = Number(m.awayScore);

      result[m.homeId].gd += hs - as;
      result[m.awayId].gd += as - hs;

      if (hs > as) {
        result[m.homeId].pts += POINTS_WIN;
      } else if (hs < as) {
        result[m.awayId].pts += POINTS_WIN;
      } else {
        result[m.homeId].pts += POINTS_DRAW;
        result[m.awayId].pts += POINTS_DRAW;
      }
    });

    return result;
  }

  function sortRecursive(items, level = 0) {
    if (items.length <= 1) return items;

    if (level === 0) {
      return group(items, (x) => x.points)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((g) => sortRecursive(g.items, 1));
    }

    if (level === 1) {
      const m = mini(items.map((x) => x.teamId));
      const enriched = items.map((x) => ({
        ...x,
        miniPts: m[x.teamId]?.pts || 0,
        miniGd: m[x.teamId]?.gd || 0,
      }));

      return group(enriched, (x) => x.miniPts)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((g) => sortRecursive(g.items, 2));
    }

    if (level === 2) {
      return group(items, (x) => x.miniGd)
        .sort((a, b) => Number(b.key) - Number(a.key))
        .flatMap((g) => sortRecursive(g.items, 3));
    }

    return [...items].sort((a, b) => {
      if (b.shootoutScore !== a.shootoutScore) return b.shootoutScore - a.shootoutScore;
      if (b.gf !== a.gf) return b.gf - a.gf;
      return a.teamName.localeCompare(b.teamName, "cs");
    });
  }

  const computed = sortRecursive(rows).map((row, index) => ({
    ...row,
    rank: index + 1,
  }));

  if (!manualEnabled) return computed;

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
          playerName: entry.playerName,
          teamName: getTeamName(teams, entry.teamId),
          teamId: entry.teamId,
          goals: 0,
        });
      }
      map.get(key).goals += 1;
    });
  });

  return Array.from(map.values())
    .sort((a, b) => {
      if (b.goals !== a.goals) return b.goals - a.goals;
      if (a.playerName !== b.playerName) {
        return a.playerName.localeCompare(b.playerName, "cs");
      }
      return a.teamName.localeCompare(b.teamName, "cs");
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));
}

function App() {
  const [data, setData] = useState(loadState);
  const [isAdmin, setIsAdmin] = useState(false);
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [selectedTeamId, setSelectedTeamId] = useState("");
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [newTeamName, setNewTeamName] = useState("");
  const [newSponsorName, setNewSponsorName] = useState("");
  const [newSponsorLogo, setNewSponsorLogo] = useState("");
  const [sponsorIndex, setSponsorIndex] = useState(0);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  }, [data]);

  useEffect(() => {
    const timer = setInterval(() => {
      setData((current) => ({
        ...current,
        matches: current.matches.map((match) => {
          if (!match.live.running || match.live.clock <= 0) return match;
          const next = match.live.clock - 1;
          return {
            ...match,
            live: { ...match.live, clock: next, running: next > 0 },
          };
        }),
      }));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!data.sponsors.length) return;
    const timer = setInterval(() => {
      setSponsorIndex((x) => (x + 1) % data.sponsors.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [data.sponsors.length]);

  const standings = useMemo(
    () => buildStandings(data.teams, data.matches, data.manualStandingsEnabled),
    [data.teams, data.matches, data.manualStandingsEnabled]
  );

  const scorers = useMemo(
    () => buildScorerTable(data.matches, data.teams),
    [data.matches, data.teams]
  );

  const selectedTeam = data.teams.find((t) => t.id === selectedTeamId) || null;
  const selectedMatch = data.matches.find((m) => m.id === selectedMatchId) || null;
  const currentSponsor = data.sponsors[sponsorIndex] || null;

  function login() {
    if (password === ADMIN_PASSWORD) {
      setIsAdmin(true);
      setAuthError("");
      setPassword("");
    } else {
      setAuthError("Nesprávné heslo.");
    }
  }

  function updateTeam(teamId, patch) {
    setData((current) => ({
      ...current,
      teams: current.teams.map((t) => (t.id === teamId ? { ...t, ...patch } : t)),
    }));
  }

  function updateMatch(matchId, patch) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((m) => {
        if (m.id !== matchId) return m;
        return {
          ...m,
          ...patch,
        };
      }),
    }));
  }

  function updateMatchLive(matchId, patch) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((m) =>
        m.id === matchId ? { ...m, live: { ...m.live, ...patch } } : m
      ),
    }));
  }

  function addGoal(matchId, side, playerName) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => {
        if (match.id !== matchId) return match;

        const teamId = side === "home" ? match.homeId : match.awayId;
        const teamName = getTeamName(current.teams, teamId);
        const name = playerName || "Neurčený střelec";
        const homeScore = Number(match.homeScore || 0);
        const awayScore = Number(match.awayScore || 0);

        return {
          ...match,
          status: match.status === "scheduled" ? "live" : match.status,
          homeScore: side === "home" ? homeScore + 1 : homeScore,
          awayScore: side === "away" ? awayScore + 1 : awayScore,
          scorers: [
            ...(match.scorers || []),
            { id: uid(), teamId, playerName: name },
          ],
          live: {
            ...match.live,
            events: [
              {
                id: uid(),
                time: formatClock(match.live.clock),
                text: `Gól – ${teamName}: ${name}`,
              },
              ...(match.live.events || []),
            ].slice(0, 12),
          },
        };
      }),
    }));
  }

  function removeScorerEntry(matchId, scorerId) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) => {
        if (match.id !== matchId) return match;

        const target = (match.scorers || []).find((entry) => entry.id === scorerId);
        if (!target) return match;

        const nextScorers = (match.scorers || []).filter((entry) => entry.id !== scorerId);
        const nextHomeScore = Math.max(
          0,
          Number(match.homeScore || 0) - (target.teamId === match.homeId ? 1 : 0)
        );
        const nextAwayScore = Math.max(
          0,
          Number(match.awayScore || 0) - (target.teamId === match.awayId ? 1 : 0)
        );

        const teamName = getTeamName(current.teams, target.teamId);
        const targetText = `Gól – ${teamName}: ${target.playerName}`;
        let removed = false;

        const nextEvents = (match.live.events || []).filter((event) => {
          if (!removed && event.text === targetText) {
            removed = true;
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
  }

  function closeMatch(matchId) {
    setData((current) => ({
      ...current,
      matches: current.matches.map((match) =>
        match.id === matchId
          ? {
              ...match,
              status: "finished",
              live: {
                ...match.live,
                running: false,
              },
            }
          : match
      ),
    }));
  }

  function addTeam() {
    const name = newTeamName.trim();
    if (!name) return;

    setData((current) => ({
      ...current,
      teams: [
        ...current.teams,
        {
          id: uid(),
          name,
          rosterText: "",
          shootoutScore: 0,
          manualRank: current.teams.length + 1,
        },
      ],
    }));

    setNewTeamName("");
  }

  function removeTeam(teamId) {
    setData((current) => ({
      ...current,
      teams: current.teams.filter((t) => t.id !== teamId),
      matches: current.matches.filter(
        (m) => m.homeId !== teamId && m.awayId !== teamId
      ),
    }));
  }

  function addSponsor() {
    const name = newSponsorName.trim();
    if (!name) return;

    setData((current) => ({
      ...current,
      sponsors: [
        ...current.sponsors,
        { id: uid(), name, logoUrl: newSponsorLogo.trim() },
      ],
    }));

    setNewSponsorName("");
    setNewSponsorLogo("");
  }

  function resetData() {
    setData(buildInitialState());
    setSelectedMatchId("");
    setSelectedTeamId("");
  }

  function restoreFixedSchedule() {
    setData((current) => ({
      ...current,
      matches: buildMatchesFromTemplates(current.teams),
    }));
    setSelectedMatchId("");
  }

  return (
    <div className="page">
      <div className="shell">
        <header className="hero">
          <div className="hero-top">
            <div className="hero-brand">
              <div className="logo-box">
                {data.urnaLogoUrl ? (
                  <img src={data.urnaLogoUrl} alt="Urna Cup" className="cover-image" />
                ) : (
                  <div className="logo-fallback">URNA CUP</div>
                )}
              </div>

              <input
                className="title-input"
                value={data.tournamentName}
                onChange={(e) =>
                  isAdmin &&
                  setData((c) => ({ ...c, tournamentName: e.target.value }))
                }
                readOnly={!isAdmin}
              />
            </div>

            <div className="stats">
              <Stat label="Týmy" value={String(data.teams.length)} />
              <Stat label="Zápasy" value={String(data.matches.length)} />
              <Stat
                label="Ukončeno"
                value={String(data.matches.filter((m) => m.status === "finished").length)}
              />

              <div className="card">
                {isAdmin ? (
                  <>
                    <div className="card-title">Administrátor</div>
                    <button
                      className="button secondary top-gap"
                      onClick={() => setIsAdmin(false)}
                    >
                      Odhlásit
                    </button>
                  </>
                ) : (
                  <>
                    <div className="card-title">Přihlášení</div>
                    <div className="row top-gap">
                      <input
                        className="input"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Heslo"
                        onKeyDown={(e) => e.key === "Enter" && login()}
                      />
                      <button className="button" onClick={login}>
                        Vstup
                      </button>
                    </div>
                    {authError ? <div className="error">{authError}</div> : null}
                  </>
                )}
              </div>
            </div>
          </div>

          {currentSponsor ? (
            <div className="rotating">
              <SponsorLogo sponsor={currentSponsor} large />
            </div>
          ) : null}
        </header>

        {isAdmin ? (
          <section className="panel">
            <h2>Hlavička</h2>
            <div className="field-wrap top-gap">
              <label>Logo Urna Cupu</label>
              <input
                className="input"
                value={data.urnaLogoUrl}
                onChange={(e) =>
                  setData((c) => ({ ...c, urnaLogoUrl: e.target.value }))
                }
                placeholder="https://..."
              />
            </div>
          </section>
        ) : null}

        <div className="layout">
          <section className="panel">
            <h2>Účastníci</h2>

            {isAdmin ? (
              <div className="row top-gap">
                <input
                  className="input"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  placeholder="Přidat tým"
                />
                <button className="button" onClick={addTeam}>
                  Přidat
                </button>
              </div>
            ) : null}

            <div className="stack top-gap">
              {data.teams.map((team, index) => (
                <div className="list-card" key={team.id}>
                  <div className="badge">{index + 1}</div>

                  <div className="list-main">
                    {isAdmin ? (
                      <input
                        className="inline-input"
                        value={team.name}
                        onChange={(e) => updateTeam(team.id, { name: e.target.value })}
                      />
                    ) : (
                      <button
                        className="link-button"
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        {team.name}
                      </button>
                    )}

                    <div className="row between">
                      <button
                        className="link-button tiny-link"
                        onClick={() => setSelectedTeamId(team.id)}
                      >
                        Detail
                      </button>

                      {isAdmin ? (
                        <div className="row mini-row">
                          <input
                            className="mini-input"
                            type="number"
                            value={team.shootoutScore}
                            onChange={(e) =>
                              updateTeam(team.id, {
                                shootoutScore: Number(e.target.value || 0),
                              })
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {isAdmin ? (
                    <button
                      className="icon-button danger"
                      onClick={() => removeTeam(team.id)}
                    >
                      Smazat
                    </button>
                  ) : null}
                </div>
              ))}
            </div>

            {isAdmin ? (
              <div className="grid-two top-gap">
                <button className="button secondary" onClick={restoreFixedSchedule}>
                  Obnovit rozpis
                </button>
                <button className="button secondary" onClick={resetData}>
                  Reset
                </button>
              </div>
            ) : null}
          </section>

          <section className="panel">
            <h2>Rozpis zápasů</h2>

            <div className="stack top-gap">
              {data.matches.map((match) => {
                const sponsorName =
                  data.sponsors.find((s) => s.id === match.sponsorId)?.name || "";

                return (
                  <button
                    key={match.id}
                    className="match-card"
                    onClick={() => setSelectedMatchId(match.id)}
                  >
                    <div className="match-meta">
                      <span>{match.time}</span>
                      <span className={`status ${match.status}`}>
                        {match.status === "scheduled"
                          ? "Plánováno"
                          : match.status === "live"
                          ? "Živě"
                          : "Ukončeno"}
                      </span>
                      {sponsorName ? (
                        <span className="sponsor-chip">{sponsorName}</span>
                      ) : null}
                    </div>

                    <div className="match-line">
                      <span>{getTeamName(data.teams, match.homeId)}</span>
                      <strong>{match.homeScore === "" ? "–" : match.homeScore}</strong>
                      <span>{getTeamName(data.teams, match.awayId)}</span>
                      <strong>{match.awayScore === "" ? "–" : match.awayScore}</strong>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>

          <section className="right-stack">
            <section className="panel">
              <h2>Aktuální tabulka</h2>

              {isAdmin ? (
                <div className="manual-box top-gap">
                  <label className="checkbox-line">
                    <input
                      type="checkbox"
                      checked={data.manualStandingsEnabled}
                      onChange={(e) =>
                        setData((c) => ({
                          ...c,
                          manualStandingsEnabled: e.target.checked,
                        }))
                      }
                    />
                    Ruční pořadí
                  </label>

                  <div className="stack top-gap">
                    {data.teams
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name, "cs"))
                      .map((team) => (
                        <div className="rank-line" key={team.id}>
                          <span>{team.name}</span>
                          <input
                            className="mini-input"
                            type="number"
                            min="1"
                            value={team.manualRank}
                            onChange={(e) =>
                              updateTeam(team.id, {
                                manualRank: Number(e.target.value || 1),
                              })
                            }
                          />
                        </div>
                      ))}
                  </div>
                </div>
              ) : null}

              <div className="table-wrap top-gap">
                <table>
                  <thead>
                    <tr>
                      <th>#</th>
                      <th>Tým</th>
                      <th>Z</th>
                      <th>V</th>
                      <th>R</th>
                      <th>P</th>
                      <th>Skóre</th>
                      <th>B</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((row) => (
                      <tr key={row.teamId}>
                        <td>{row.rank}</td>
                        <td>
                          <button
                            className="link-button"
                            onClick={() => setSelectedTeamId(row.teamId)}
                          >
                            {row.teamName}
                          </button>
                        </td>
                        <td>{row.played}</td>
                        <td>{row.wins}</td>
                        <td>{row.draws}</td>
                        <td>{row.losses}</td>
                        <td>
                          {row.gf}:{row.ga}
                        </td>
                        <td>
                          <strong>{row.points}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>

            <section className="panel">
              <h2>Střelci</h2>

              {scorers.length === 0 ? (
                <div className="empty top-gap">Zatím bez střelců.</div>
              ) : (
                <div className="table-wrap top-gap">
                  <table>
                    <thead>
                      <tr>
                        <th>#</th>
                        <th>Hráč</th>
                        <th>Tým</th>
                        <th>G</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scorers.map((row) => (
                        <tr key={`${row.teamId}-${row.playerName}`}>
                          <td>{row.rank}</td>
                          <td>{row.playerName}</td>
                          <td>{row.teamName}</td>
                          <td>
                            <strong>{row.goals}</strong>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            <section className="panel">
              <h2>Sponzoři</h2>

              {isAdmin ? (
                <div className="stack top-gap">
                  <input
                    className="input"
                    value={newSponsorName}
                    onChange={(e) => setNewSponsorName(e.target.value)}
                    placeholder="Název sponzora"
                  />
                  <input
                    className="input"
                    value={newSponsorLogo}
                    onChange={(e) => setNewSponsorLogo(e.target.value)}
                    placeholder="URL loga"
                  />
                  <button className="button" onClick={addSponsor}>
                    Přidat
                  </button>
                </div>
              ) : null}

              <div className="stack top-gap">
                {data.sponsors.map((sponsor) => (
                  <div className="sponsor-card" key={sponsor.id}>
                    <SponsorLogo sponsor={sponsor} />

                    <div className="sponsor-main">
                      {isAdmin ? (
                        <>
                          <input
                            className="inline-input"
                            value={sponsor.name}
                            onChange={(e) =>
                              updateSponsor(setData, sponsor.id, {
                                name: e.target.value,
                              })
                            }
                          />
                          <input
                            className="input"
                            value={sponsor.logoUrl}
                            onChange={(e) =>
                              updateSponsor(setData, sponsor.id, {
                                logoUrl: e.target.value,
                              })
                            }
                            placeholder="URL loga"
                          />
                        </>
                      ) : (
                        <div className="card-title">{sponsor.name}</div>
                      )}
                    </div>

                    {isAdmin ? (
                      <button
                        className="icon-button danger"
                        onClick={() => removeSponsorDirect(setData, sponsor.id)}
                      >
                        Smazat
                      </button>
                    ) : null}
                  </div>
                ))}
              </div>
            </section>
          </section>
        </div>
      </div>

      {selectedTeam ? (
        <TeamModal
          team={selectedTeam}
          standings={standings}
          matches={data.matches}
          teams={data.teams}
          isAdmin={isAdmin}
          onClose={() => setSelectedTeamId("")}
          onUpdateTeam={updateTeam}
        />
      ) : null}

      {selectedMatch ? (
        <MatchModal
          match={selectedMatch}
          teams={data.teams}
          sponsors={data.sponsors}
          isAdmin={isAdmin}
          onClose={() => setSelectedMatchId("")}
          onMatchChange={updateMatch}
          onLiveChange={updateMatchLive}
          onAddGoal={addGoal}
          onRemoveScorerEntry={removeScorerEntry}
          onCloseMatch={closeMatch}
        />
      ) : null}
    </div>
  );
}

function updateSponsor(setData, sponsorId, patch) {
  setData((current) => ({
    ...current,
    sponsors: current.sponsors.map((s) =>
      s.id === sponsorId ? { ...s, ...patch } : s
    ),
  }));
}

function removeSponsorDirect(setData, sponsorId) {
  setData((current) => ({
    ...current,
    sponsors: current.sponsors.filter((s) => s.id !== sponsorId),
    matches: current.matches.map((m) =>
      m.sponsorId === sponsorId ? { ...m, sponsorId: "" } : m
    ),
  }));
}

function Stat({ label, value }) {
  return (
    <div className="card">
      <div className="stat-label">{label}</div>
      <div className="stat-value">{value}</div>
    </div>
  );
}

function SponsorLogo({ sponsor, large = false }) {
  const className = large ? "sponsor-logo sponsor-logo-large" : "sponsor-logo";

  if (sponsor.logoUrl) {
    return <img className={className} src={sponsor.logoUrl} alt={sponsor.name} />;
  }

  return <div className={`${className} fallback`}>{sponsorInitials(sponsor.name)}</div>;
}

function TeamModal({
  team,
  standings,
  matches,
  teams,
  isAdmin,
  onClose,
  onUpdateTeam,
}) {
  const row = standings.find((x) => x.teamId === team.id);
  const played = matches.filter(
    (m) => isFinished(m) && (m.homeId === team.id || m.awayId === team.id)
  );
  const upcoming = matches.filter(
    (m) => !isFinished(m) && (m.homeId === team.id || m.awayId === team.id)
  );
  const roster = parseRoster(team.rosterText);

  return (
    <div className="modal-overlay">
      <div className="modal large">
        <div className="modal-header">
          <div className="card-title big">{team.name}</div>
          <button className="button secondary" onClick={onClose}>
            Zavřít
          </button>
        </div>

        <div className="modal-grid team-modal-grid">
          <div className="stack">
            <div className="panel small-panel">
              <div className="grid-two">
                <Stat label="Pořadí" value={String(row?.rank || "–")} />
                <Stat label="Body" value={String(row?.points || 0)} />
                <Stat label="Zápasy" value={String(row?.played || 0)} />
                <Stat label="Skóre" value={row ? `${row.gf}:${row.ga}` : "0:0"} />
              </div>
            </div>

            <div className="panel small-panel">
              <h3>Soupiska</h3>
              {isAdmin ? (
                <textarea
                  className="textarea top-gap"
                  value={team.rosterText}
                  onChange={(e) => onUpdateTeam(team.id, { rosterText: e.target.value })}
                  placeholder="Každý hráč na samostatný řádek"
                />
              ) : roster.length === 0 ? (
                <div className="empty top-gap">Soupiska zatím není vyplněná.</div>
              ) : (
                <div className="stack top-gap">
                  {roster.map((player, i) => (
                    <div className="mini-card" key={player + i}>
                      {i + 1}. {player}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="stack">
            <div className="panel small-panel">
              <h3>Odehraná utkání</h3>
              <div className="stack top-gap">
                {played.length === 0 ? (
                  <div className="empty">Bez odehraného zápasu.</div>
                ) : (
                  played.map((m) => (
                    <MatchLine key={m.id} match={m} teamId={team.id} teams={teams} />
                  ))
                )}
              </div>
            </div>

            <div className="panel small-panel">
              <h3>Příští program</h3>
              <div className="stack top-gap">
                {upcoming.length === 0 ? (
                  <div className="empty">Bez dalšího programu.</div>
                ) : (
                  upcoming.map((m) => (
                    <MatchLine
                      key={m.id}
                      match={m}
                      teamId={team.id}
                      teams={teams}
                      future
                    />
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
  onCloseMatch,
}) {
  const [homePlayer, setHomePlayer] = useState("");
  const [awayPlayer, setAwayPlayer] = useState("");

  useEffect(() => {
    setHomePlayer("");
    setAwayPlayer("");
  }, [match.id]);

  const homeTeam = teams.find((t) => t.id === match.homeId);
  const awayTeam = teams.find((t) => t.id === match.awayId);
  const homeRoster = parseRoster(homeTeam?.rosterText || "");
  const awayRoster = parseRoster(awayTeam?.rosterText || "");
  const sponsor = sponsors.find((s) => s.id === match.sponsorId) || null;

  const scorerEntries = [...(match.scorers || [])]
    .slice()
    .reverse()
    .map((entry) => ({
      ...entry,
      teamName: getTeamName(teams, entry.teamId),
    }));

  const latestScorer =
    match.scorers && match.scorers.length
      ? match.scorers[match.scorers.length - 1]
      : null;

  return (
    <div className="modal-overlay">
      <div className="modal xlarge">
        <div className="modal-header">
          <div>
            <div className="card-title big">
              {homeTeam?.name} vs. {awayTeam?.name}
            </div>
            <div className="tiny">{match.time}</div>
          </div>
          <button className="button secondary" onClick={onClose}>
            Zavřít
          </button>
        </div>

        {sponsor ? (
          <div className="sponsor-banner">
            <SponsorLogo sponsor={sponsor} />
          </div>
        ) : null}

        <div className="modal-grid">
          <div className="stack">
            <div className="scoreboard">
              {match.live.overlayTitle ? (
                <div className="overlay-title">{match.live.overlayTitle}</div>
              ) : null}

              <div className="score-line">
                <div className="score-side">
                  <div className="team-big">{homeTeam?.name}</div>
                  <div className="score-number">
                    {match.homeScore === "" ? 0 : match.homeScore}
                  </div>
                </div>

                <div className="center-box">
                  <div className="clock">{formatClock(match.live.clock)}</div>
                  <div className="tiny">Perioda {match.live.period}</div>
                </div>

                <div className="score-side">
                  <div className="team-big">{awayTeam?.name}</div>
                  <div className="score-number">
                    {match.awayScore === "" ? 0 : match.awayScore}
                  </div>
                </div>
              </div>
            </div>

            {isAdmin ? (
              <div className="panel small-panel">
                <h3>Správa zápasu</h3>

                <div className="button-grid top-gap">
                  <button
                    className="button"
                    onClick={() => onAddGoal(match.id, "home", "Neurčený střelec")}
                  >
                    + domácí
                  </button>

                  <button
                    className="button"
                    onClick={() => onAddGoal(match.id, "away", "Neurčený střelec")}
                  >
                    + hosté
                  </button>

                  <button
                    className="button success"
                    onClick={() => {
                      if (match.live.running) {
                        onLiveChange(match.id, { running: false });
                      } else {
                        onMatchChange(match.id, {
                          status: match.status === "scheduled" ? "live" : match.status,
                        });
                        onLiveChange(match.id, { running: true });
                      }
                    }}
                  >
                    {match.live.running ? "Stop" : "Start"}
                  </button>

                  <button
                    className="button secondary"
                    onClick={() =>
                      onLiveChange(match.id, {
                        clock: MATCH_DURATION_SECONDS,
                        running: false,
                      })
                    }
                  >
                    Reset času
                  </button>
                </div>

                <div className="grid-two top-gap">
                  <RosterScorerPicker
                    title={homeTeam?.name || ""}
                    players={homeRoster}
                    selected={homePlayer}
                    onSelect={setHomePlayer}
                    onConfirm={() => {
                      if (!homePlayer) return;
                      onAddGoal(match.id, "home", homePlayer);
                      setHomePlayer("");
                    }}
                  />

                  <RosterScorerPicker
                    title={awayTeam?.name || ""}
                    players={awayRoster}
                    selected={awayPlayer}
                    onSelect={setAwayPlayer}
                    onConfirm={() => {
                      if (!awayPlayer) return;
                      onAddGoal(match.id, "away", awayPlayer);
                      setAwayPlayer("");
                    }}
                  />
                </div>

                <div className="grid-two top-gap">
                  <Field label="Domácí">
                    <input
                      className="input"
                      type="number"
                      value={match.homeScore}
                      onChange={(e) =>
                        onMatchChange(match.id, { homeScore: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Hosté">
                    <input
                      className="input"
                      type="number"
                      value={match.awayScore}
                      onChange={(e) =>
                        onMatchChange(match.id, { awayScore: e.target.value })
                      }
                    />
                  </Field>

                  <Field label="Perioda">
                    <select
                      className="input"
                      value={match.live.period}
                      onChange={(e) =>
                        onLiveChange(match.id, { period: Number(e.target.value) })
                      }
                    >
                      <option value={1}>1. třetina</option>
                      <option value={2}>2. třetina</option>
                      <option value={3}>3. třetina</option>
                      <option value={4}>Prodloužení</option>
                    </select>
                  </Field>

                  <Field label="Sponzor">
                    <select
                      className="input"
                      value={match.sponsorId}
                      onChange={(e) =>
                        onMatchChange(match.id, { sponsorId: e.target.value })
                      }
                    >
                      <option value="">Bez sponzora</option>
                      {sponsors.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field label="Titulek" className="top-gap">
                  <input
                    className="input"
                    value={match.live.overlayTitle}
                    onChange={(e) =>
                      onLiveChange(match.id, { overlayTitle: e.target.value })
                    }
                  />
                </Field>

                <div className="row top-gap wrap">
                  <button
                    className="button secondary"
                    onClick={() => onMatchChange(match.id, { status: "live" })}
                  >
                    Označit živě
                  </button>

                  <button
                    className="button secondary"
                    disabled={!latestScorer}
                    onClick={() =>
                      latestScorer && onRemoveScorerEntry(match.id, latestScorer.id)
                    }
                  >
                    Smazat poslední gól
                  </button>

                  <button
                    className="button warning"
                    onClick={() => onCloseMatch(match.id)}
                  >
                    Uzavřít zápas
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="stack">
            <div className="panel small-panel">
              <h3>Střelci zápasu</h3>

              {scorerEntries.length === 0 ? (
                <div className="empty top-gap">Zatím bez střelce.</div>
              ) : (
                <div className="stack top-gap">
                  {scorerEntries.map((row) => (
                    <div className="mini-card row between" key={row.id}>
                      <div>
                        <div className="card-title">{row.playerName}</div>
                        <div className="tiny">{row.teamName}</div>
                      </div>

                      <div className="row">
                        <strong>1 g</strong>
                        {isAdmin ? (
                          <button
                            className="button secondary"
                            onClick={() => onRemoveScorerEntry(match.id, row.id)}
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

            <div className="panel small-panel">
              <h3>Události</h3>
              <div className="stack top-gap">
                {(match.live.events || []).length === 0 ? (
                  <div className="empty">Bez událostí.</div>
                ) : (
                  match.live.events.map((event) => (
                    <div className="mini-card" key={event.id}>
                      <strong>{event.time}</strong> — {event.text}
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="panel small-panel">
              <h3>Stav</h3>
              <div className="stack top-gap">
                <InfoLine label="Čas" value={match.time || "—"} />
                <InfoLine
                  label="Status"
                  value={
                    match.status === "scheduled"
                      ? "Plánováno"
                      : match.status === "live"
                      ? "Živě"
                      : "Ukončeno"
                  }
                />
                <InfoLine label="Časomíra" value={formatClock(match.live.clock)} />
                <InfoLine label="Perioda" value={String(match.live.period)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function RosterScorerPicker({ title, players, selected, onSelect, onConfirm }) {
  return (
    <div className="picker">
      <div className="card-title">{title}</div>

      {players.length === 0 ? (
        <div className="empty top-gap">Nejdřív doplň soupisku.</div>
      ) : (
        <>
          <div className="picker-list top-gap">
            {players.map((player) => (
              <button
                key={player}
                className={`picker-item ${selected === player ? "active" : ""}`}
                onClick={() => onSelect(selected === player ? "" : player)}
              >
                {player}
              </button>
            ))}
          </div>

          <button className="button top-gap" disabled={!selected} onClick={onConfirm}>
            Přidat gól
          </button>
        </>
      )}
    </div>
  );
}

function MatchLine({ match, teamId, teams, future = false }) {
  const isHome = match.homeId === teamId;
  const opponent = isHome
    ? getTeamName(teams, match.awayId)
    : getTeamName(teams, match.homeId);
  const myScore = isHome ? match.homeScore : match.awayScore;
  const oppScore = isHome ? match.awayScore : match.homeScore;

  return (
    <div className="mini-card row between">
      <div>
        <div className="card-title">{opponent}</div>
        <div className="tiny">{match.time}</div>
      </div>
      <strong>{future ? "vs" : `${myScore}:${oppScore}`}</strong>
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`field-wrap ${className}`}>
      <label>{label}</label>
      {children}
    </div>
  );
}

function InfoLine({ label, value }) {
  return (
    <div className="mini-card row between">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default App;
