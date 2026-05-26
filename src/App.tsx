import React, { useState, useEffect } from "react";
import RankingsManager from "./components/RankingsManager";
import FixturesManager from "./components/FixturesManager";
import AverageRankingCalculator from "./components/AverageRankingCalculator";
import PathGenerator from "./components/PathGenerator";
import SurvivorRulesEngine from "./components/SurvivorRulesEngine";
import { DEFAULT_TEAMS, DEFAULT_RANKINGS, DEFAULT_FIXTURES } from "./utils/defaultData";
import { Team, TeamRanking, Match, PathLocks } from "./types";
import { Trophy, RefreshCw, Layers, Calendar, Star, TrendingUp, Info } from "lucide-react";

const STORAGE_KEYS = {
  TEAMS: "worldcup_survivor_teams",
  RANKINGS: "worldcup_survivor_rankings",
  FIXTURES: "worldcup_survivor_fixtures",
  LOCKS: "worldcup_survivor_locks",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"paths" | "rankings" | "calculated" | "fixtures" | "rules">("paths");

  // State populated from LocalStorage or defaultData
  const [teams, setTeams] = useState<Team[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [locks, setLocks] = useState<PathLocks>({});

  // Loading phase
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    // Attempt local storage hydrate
    try {
      const storedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
      const storedRankings = localStorage.getItem(STORAGE_KEYS.RANKINGS);
      const storedFixtures = localStorage.getItem(STORAGE_KEYS.FIXTURES);
      const storedLocks = localStorage.getItem(STORAGE_KEYS.LOCKS);

      let parsedTeams = storedTeams ? JSON.parse(storedTeams) : null;
      let parsedRankings = storedRankings ? JSON.parse(storedRankings) : null;
      let parsedFixtures = storedFixtures ? JSON.parse(storedFixtures) : null;

      // Automatically upgrade if structure is obsolete (fewer teams or different length)
      if (parsedTeams && parsedTeams.length !== DEFAULT_TEAMS.length) {
        parsedTeams = null;
        parsedRankings = null;
        parsedFixtures = null;
        localStorage.removeItem(STORAGE_KEYS.TEAMS);
        localStorage.removeItem(STORAGE_KEYS.RANKINGS);
        localStorage.removeItem(STORAGE_KEYS.FIXTURES);
        localStorage.removeItem(STORAGE_KEYS.LOCKS);
      }

      if (parsedTeams) setTeams(parsedTeams);
      else setTeams(DEFAULT_TEAMS);

      if (parsedRankings) {
        let cleanedRankings = parsedRankings.filter((r: any) => r.id !== "fifa" && r.id !== "expert_opinion");
        // Always override default "bookmakers" with the hardcoded files to stay fully fresh
        cleanedRankings = cleanedRankings.map((r: any) => {
          const defaultRank = DEFAULT_RANKINGS.find((dr) => dr.id === r.id);
          return defaultRank ? { ...defaultRank, isActive: r.isActive } : r;
        });

        // Ensure default rankings "bookmakers" is present
        DEFAULT_RANKINGS.forEach((defaultRank) => {
          if (!cleanedRankings.some((r: any) => r.id === defaultRank.id)) {
            cleanedRankings.push(defaultRank);
          }
        });

        // Ensure that selectedRankingId is valid by checking if active rankings are consistent
        setRankings(cleanedRankings);
      } else {
        setRankings(DEFAULT_RANKINGS);
      }

      if (parsedFixtures) setFixtures(parsedFixtures);
      else setFixtures(DEFAULT_FIXTURES);

      if (storedLocks) setLocks(JSON.parse(storedLocks));
      else setLocks({});
    } catch (e) {
      console.error("Local storage hydrate failed, recovering defaults", e);
      setTeams(DEFAULT_TEAMS);
      setRankings(DEFAULT_RANKINGS);
      setFixtures(DEFAULT_FIXTURES);
      setLocks({});
    }
    setLoaded(true);
  }, []);

  // Sync back state modifications to LocalStorage
  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }, [teams, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(rankings));
  }, [rankings, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(fixtures));
  }, [fixtures, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.LOCKS, JSON.stringify(locks));
  }, [locks, loaded]);

  // Command to restore full pristine mock datasets
  const handleResetToDefaults = () => {
    if (
      window.confirm(
        "Sei sicuro di voler ripristinare i dati di default? Questo cancellerà tutti i tuoi inserimenti personalizzati."
      )
    ) {
      setTeams(DEFAULT_TEAMS);
      setRankings(DEFAULT_RANKINGS);
      setFixtures(DEFAULT_FIXTURES);
      setLocks({});
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 flex-col gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-500">Caricamento Simulatore...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      {/* Visual background lines accent */}
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-indigo-100/35 to-transparent pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        {/* APP SHELL HEADER */}
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md">
              <Trophy className="w-6 h-6 leading-none fill-white text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
                Mondiale Survivor Simulator
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5 font-medium">
                Sopravvivenza predittiva • Campionati Mondiali FIFA
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-stretch sm:self-auto justify-between sm:justify-start">
            <span className="text-[10px] text-slate-600 font-mono bg-slate-100 px-2 py-1 rounded border border-slate-200 shrink-0 uppercase">
              Live UTC: 2026-05-26
            </span>
            <button
              onClick={handleResetToDefaults}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 hover:text-indigo-600 font-bold border border-slate-200 rounded-xl transition text-[10px] cursor-pointer"
              title="Ripristina dati iniziali"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Ripristina Default
            </button>
          </div>
        </header>

        {/* TAB NAVIGATION STRIP */}
        <nav className="flex items-center gap-1 overflow-x-auto bg-white border border-slate-200 p-1.5 rounded-xl scrollbar-none shadow-sm">
          <button
            onClick={() => setActiveTab("paths")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeTab === "paths"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <Layers className="w-4 h-4" />
            Ottimizzatore Percorsi (8 Paths)
          </button>

          <button
            onClick={() => setActiveTab("rankings")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeTab === "rankings"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <Star className="w-4 h-4" />
            Gestore Classifiche
          </button>

          <button
            onClick={() => setActiveTab("calculated")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeTab === "calculated"
                ? "bg-indigo-600 text-white shadow animate-pulse-once"
                : "text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            Classifica Media Consolidata
          </button>

          <button
            onClick={() => setActiveTab("fixtures")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeTab === "fixtures"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <Calendar className="w-4 h-4" />
            Calendario & Risultati
          </button>

          <button
            onClick={() => setActiveTab("rules")}
            className={`flex items-center gap-2 py-2 px-4 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeTab === "rules"
                ? "bg-indigo-600 text-white shadow"
                : "text-slate-650 hover:text-indigo-600 hover:bg-slate-100"
            }`}
          >
            <Info className="w-4 h-4" />
            Regole Calcolo Algorithm
          </button>
        </nav>

        {/* CORE MAIN DASHBOARD SCREEN */}
        <main className="min-h-[400px]">
          {activeTab === "paths" && (
            <PathGenerator
              teams={teams}
              rankings={rankings}
              fixtures={fixtures}
              locks={locks}
              onUpdateLocks={setLocks}
            />
          )}

          {activeTab === "rankings" && (
            <RankingsManager
              teams={teams}
              rankings={rankings}
              onUpdateRankings={setRankings}
            />
          )}

          {activeTab === "calculated" && (
            <AverageRankingCalculator
              teams={teams}
              rankings={rankings}
            />
          )}

          {activeTab === "fixtures" && (
            <FixturesManager
              teams={teams}
              fixtures={fixtures}
              onUpdateFixtures={setFixtures}
            />
          )}

          {activeTab === "rules" && (
            <SurvivorRulesEngine />
          )}
        </main>

        {/* HUMBLE PAGE FOOTER */}
        <footer className="text-center py-6 border-t border-slate-200 mt-10 text-slate-400 font-mono text-[10px]">
          WORLD CUP SURVIVOR STRATEGIST • SVILUPPATO CON MATEMATICA DI ELO LOGISTIC SCALE • © 2026
        </footer>
      </div>
    </div>
  );
}
