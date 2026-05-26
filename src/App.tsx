import React, { useState, useEffect } from "react";
import RankingsManager from "./components/RankingsManager";
import FixturesManager from "./components/FixturesManager";
import AverageRankingCalculator from "./components/AverageRankingCalculator";
import PathGenerator from "./components/PathGenerator";
import SurvivorRulesEngine from "./components/SurvivorRulesEngine";
import {
  DEFAULT_TEAMS,
  DEFAULT_RANKINGS,
  DEFAULT_FIXTURES,
} from "./utils/defaultData";
import { Team, TeamRanking, Match, PathLocks } from "./types";
import {
  RefreshCw,
  Layers,
  Calendar,
  Star,
  TrendingUp,
  Info,
} from "lucide-react";
import { supabase } from "./lib/supabase";

const STORAGE_KEYS = {
  TEAMS: "worldcup_survivor_teams",
  RANKINGS: "worldcup_survivor_rankings",
  FIXTURES: "worldcup_survivor_fixtures",
  LOCKS: "worldcup_survivor_locks",
};

export default function App() {
  const [activeTab, setActiveTab] = useState<
    "paths" | "rankings" | "calculated" | "fixtures" | "rules"
  >("paths");

  const [teams, setTeams] = useState<Team[]>([]);
  const [rankings, setRankings] = useState<TeamRanking[]>([]);
  const [fixtures, setFixtures] = useState<Match[]>([]);
  const [locks, setLocks] = useState<PathLocks>({});
  const [loaded, setLoaded] = useState(false);

  const formatSupabaseRankings = (data: any[]): TeamRanking[] => {
  const formatted: TeamRanking[] = data.map((r) => ({
    id: r.id,
    name: r.name,
    teamIds: r.team_ids,
    isActive: r.is_active ?? true,
  }));

  const cleanedRankings = formatted.filter(
    (r) => r.id !== "fifa" && r.id !== "expert_opinion"
  );

  DEFAULT_RANKINGS.forEach((defaultRank) => {
    if (!cleanedRankings.some((r) => r.id === defaultRank.id)) {
      cleanedRankings.push({
        ...defaultRank,
        isActive: defaultRank.isActive ?? true,
      });
    }
  });

  return cleanedRankings;
};

  const loadRankingsFromSupabase = async () => {
    const { data, error } = await supabase
      .from("rankings")
      .select("*")
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Errore caricamento classifiche Supabase:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    return formatSupabaseRankings(data);
  };

  const handleUpdateRankings = async (newRankings: TeamRanking[]) => {
    setRankings(newRankings);
    localStorage.setItem(STORAGE_KEYS.RANKINGS, JSON.stringify(newRankings));

    const rows = newRankings.map((r) => ({
      id: r.id,
      name: r.name,
      team_ids: r.teamIds,
      is_active: r.isActive ?? true,
    }));

    const { error: upsertError } = await supabase
      .from("rankings")
      .upsert(rows);

    if (upsertError) {
      console.error("Errore salvataggio classifiche:", upsertError);
      return;
    }

    const idsToKeep = newRankings.map((r) => r.id);

    const { error: deleteError } = await supabase
      .from("rankings")
      .delete()
      .not("id", "in", `(${idsToKeep.map((id) => `"${id}"`).join(",")})`);

    if (deleteError) {
      console.error("Errore eliminazione classifiche rimosse:", deleteError);
    }
  };

  useEffect(() => {
    const hydrate = async () => {
      try {
        const storedTeams = localStorage.getItem(STORAGE_KEYS.TEAMS);
        const storedFixtures = localStorage.getItem(STORAGE_KEYS.FIXTURES);
        const storedLocks = localStorage.getItem(STORAGE_KEYS.LOCKS);
        const storedRankings = localStorage.getItem(STORAGE_KEYS.RANKINGS);

        let parsedTeams = storedTeams ? JSON.parse(storedTeams) : null;
        let parsedFixtures = storedFixtures ? JSON.parse(storedFixtures) : null;
        const parsedRankings = storedRankings
          ? JSON.parse(storedRankings)
          : null;

        if (parsedTeams && parsedTeams.length !== DEFAULT_TEAMS.length) {
          parsedTeams = null;
          parsedFixtures = null;

          localStorage.removeItem(STORAGE_KEYS.TEAMS);
          localStorage.removeItem(STORAGE_KEYS.RANKINGS);
          localStorage.removeItem(STORAGE_KEYS.FIXTURES);
          localStorage.removeItem(STORAGE_KEYS.LOCKS);
        }

        setTeams(parsedTeams || DEFAULT_TEAMS);
        setFixtures(parsedFixtures || DEFAULT_FIXTURES);
        setLocks(storedLocks ? JSON.parse(storedLocks) : {});

        const onlineRankings = await loadRankingsFromSupabase();

        if (onlineRankings) {
          setRankings(onlineRankings);
          localStorage.setItem(
            STORAGE_KEYS.RANKINGS,
            JSON.stringify(onlineRankings)
          );
        } else if (parsedRankings) {
          setRankings(parsedRankings);
          await handleUpdateRankings(parsedRankings);
        } else {
          setRankings(DEFAULT_RANKINGS);
          await handleUpdateRankings(DEFAULT_RANKINGS);
        }
      } catch (e) {
        console.error("Errore caricamento dati:", e);
        setTeams(DEFAULT_TEAMS);
        setRankings(DEFAULT_RANKINGS);
        setFixtures(DEFAULT_FIXTURES);
        setLocks({});
      }

      setLoaded(true);
    };

    hydrate();
  }, []);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.TEAMS, JSON.stringify(teams));
  }, [teams, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.FIXTURES, JSON.stringify(fixtures));
  }, [fixtures, loaded]);

  useEffect(() => {
    if (!loaded) return;
    localStorage.setItem(STORAGE_KEYS.LOCKS, JSON.stringify(locks));
  }, [locks, loaded]);

  const handleResetToDefaults = async () => {
    if (
      window.confirm(
        "Sei sicuro di voler ripristinare i dati di default? Questo cancellerà tutti i tuoi inserimenti personalizzati."
      )
    ) {
      setTeams(DEFAULT_TEAMS);
      setFixtures(DEFAULT_FIXTURES);
      setLocks({});
      await handleUpdateRankings(DEFAULT_RANKINGS);
    }
  };

  if (!loaded) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-900 flex-col gap-3 font-sans">
        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-mono text-slate-500">
          Caricamento Simulatore...
        </span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
      <div className="absolute top-0 left-0 right-0 h-[380px] bg-gradient-to-b from-indigo-100/35 to-transparent pointer-events-none -z-10" />

      <div className="w-full max-w-7xl mx-auto px-4 py-6 flex flex-col gap-6">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white border border-slate-200 rounded-2xl p-4.5 shadow-sm">
          <div className="flex items-center gap-3.5">
            <div className="bg-indigo-600 p-2.5 rounded-xl text-white shadow-md">
              <img
                src="/img/coppa.png"
                alt="Trophy Icon"
                className="w-15 h-20"
              />
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
              onUpdateRankings={handleUpdateRankings}
            />
          )}

          {activeTab === "calculated" && (
            <AverageRankingCalculator teams={teams} rankings={rankings} />
          )}

          {activeTab === "fixtures" && (
            <FixturesManager
              teams={teams}
              fixtures={fixtures}
              onUpdateFixtures={setFixtures}
            />
          )}

          {activeTab === "rules" && <SurvivorRulesEngine />}
        </main>

        <footer className="text-center py-6 border-t border-slate-200 mt-10 text-slate-400 font-mono text-[10px]">
          WORLD CUP SURVIVOR STRATEGIST • SVILUPPATO CON MATEMATICA DI ELO
          LOGISTIC SCALE • RAFFSACC.DEV © 2026
        </footer>
      </div>
    </div>
  );
}