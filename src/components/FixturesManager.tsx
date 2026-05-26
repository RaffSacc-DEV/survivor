import React, { useState } from "react";
import { Team, Match } from "../types";
import { Plus, Trash2, Trophy, Clock, Search, RotateCcw } from "lucide-react";

interface FixturesManagerProps {
  teams: Team[];
  fixtures: Match[];
  onUpdateFixtures: (newFixtures: Match[]) => void;
}

export default function FixturesManager({
  teams,
  fixtures,
  onUpdateFixtures,
}: FixturesManagerProps) {
  const [activeRoundFilter, setActiveRoundFilter] = useState<string>("Tutti");
  const [isAddingFixture, setIsAddingFixture] = useState(false);

  // New Match Form State
  const [selectedRound, setSelectedRound] = useState("Round 1 - Gironi");
  const [customRound, setCustomRound] = useState("");
  const [useCustomRound, setUseCustomRound] = useState(false);
  const [homeTeam, setHomeTeam] = useState("");
  const [awayTeam, setAwayTeam] = useState("");
  const [stage, setStage] = useState<"gironi" | "eliminazione">("gironi");

  // Get unique rounds list already programmed
  const uniqueRounds = Array.from(new Set(fixtures.map((m) => m.round)));

  // Sorting fixtures by their appearance
  const sortedFixtures = [...fixtures];

  const handleAddFixture = () => {
    const finalRound = useCustomRound ? customRound.trim() : selectedRound;
    if (!finalRound) {
      alert("Specifica un round valido per il match.");
      return;
    }
    if (!homeTeam || !awayTeam) {
      alert("Seleziona entrambe le nazionali.");
      return;
    }
    if (homeTeam === awayTeam) {
      alert("Una nazionale non può sfidare se stessa.");
      return;
    }

    const newMatch: Match = {
      id: `match_${Date.now()}`,
      round: finalRound,
      homeTeamId: homeTeam,
      awayTeamId: awayTeam,
      stage,
    };

    onUpdateFixtures([...fixtures, newMatch]);
    setIsAddingFixture(false);
    setHomeTeam("");
    setAwayTeam("");
  };

  const handleDeleteFixture = (id: string) => {
    onUpdateFixtures(fixtures.filter((m) => m.id !== id));
  };

  const handleScoreChange = (id: string, field: "home" | "away", valText: string) => {
    const updated = fixtures.map((m) => {
      if (m.id !== id) return m;

      const num = valText === "" ? undefined : parseInt(valText, 10);
      return {
        ...m,
        homeScore: field === "home" ? num : m.homeScore,
        awayScore: field === "away" ? num : m.awayScore,
      };
    });
    onUpdateFixtures(updated);
  };

  const handleResetScores = (id: string) => {
    const updated = fixtures.map((m) => {
      if (m.id !== id) return m;
      return {
        ...m,
        homeScore: undefined,
        awayScore: undefined,
      };
    });
    onUpdateFixtures(updated);
  };

  const handleResetAllScores = () => {
    if (window.confirm("Sei sicuro di voler azzerare i risultati di tutte le partite?")) {
      const updated = fixtures.map((m) => ({
        ...m,
        homeScore: undefined,
        awayScore: undefined,
      }));
      onUpdateFixtures(updated);
    }
  };

  // Grouped matches
  const filteredMatches = sortedFixtures.filter((m) => {
    if (activeRoundFilter === "Tutti") return true;
    return m.round === activeRoundFilter;
  });

  return (
    <div className="flex flex-col gap-6" id="fixtures-manager">
      {/* Barra Azioni e Filtri */}
      <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Chips Filtro Round */}
        <div className="flex gap-1.5 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 scrollbar-none scroll-smooth">
          <button
            onClick={() => setActiveRoundFilter("Tutti")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
              activeRoundFilter === "Tutti"
                ? "bg-indigo-600 text-white shadow"
                : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100/70"
            }`}
          >
            Tutti i Match ({fixtures.length})
          </button>
          {uniqueRounds.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRoundFilter(r)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition shrink-0 ${
                activeRoundFilter === r
                  ? "bg-indigo-600 text-white shadow"
                  : "bg-slate-50 border border-slate-200 text-slate-600 hover:text-slate-800 hover:bg-slate-100/70"
              }`}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Pulsanti Controllo Rapido */}
        <div className="flex items-center gap-2 self-end md:self-auto shrink-0">
          <button
            onClick={handleResetAllScores}
            className="flex items-center gap-2 px-3 py-2 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl text-slate-600 hover:text-red-500 hover:border-red-200 transition text-xs font-semibold cursor-pointer shadow-sm"
            title="Azzera tutti i risultati"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Reset Risultati
          </button>

          <button
            onClick={() => setIsAddingFixture(!isAddingFixture)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            Aggiungi Partita
          </button>
        </div>
      </div>

      {/* Form di Inserimento Match */}
      {isAddingFixture && (
        <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5 grid grid-cols-1 md:grid-cols-12 gap-5">
          <div className="md:col-span-12 border-b border-slate-100 pb-2 flex justify-between items-center">
            <span className="font-semibold text-sm text-slate-800 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-indigo-600" /> Inserisci Nuova Partita
            </span>
          </div>

          {/* Form Fields: Round */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500 flex items-center justify-between">
              <span>Fase / Round</span>
              <button
                type="button"
                onClick={() => setUseCustomRound(!useCustomRound)}
                className="text-[10px] text-indigo-600 hover:underline"
              >
                {useCustomRound ? "Seleziona Esistente" : "Crea Nuovo"}
              </button>
            </label>
            {useCustomRound ? (
              <input
                type="text"
                placeholder="E.g., Ottavi di Finale"
                value={customRound}
                onChange={(e) => setCustomRound(e.target.value)}
                className="bg-white border border-slate-300 text-slate-800 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              />
            ) : (
              <select
                value={selectedRound}
                onChange={(e) => setSelectedRound(e.target.value)}
                className="bg-white border border-slate-300 text-slate-805 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
              >
                {uniqueRounds.map((ur) => (
                  <option key={ur} value={ur}>
                    {ur}
                  </option>
                ))}
                {uniqueRounds.length === 0 && (
                  <option value="Round 1 - Gironi">Round 1 - Gironi</option>
                )}
              </select>
            )}
          </div>

          {/* Form Fields: Squadra Casa */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Squadra Casa</label>
            <select
              value={homeTeam}
              onChange={(e) => setHomeTeam(e.target.value)}
              className="bg-white border border-slate-300 text-slate-805 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Seleziona...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Fields: Squadra Ospite */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Squadra Ospite</label>
            <select
              value={awayTeam}
              onChange={(e) => setAwayTeam(e.target.value)}
              className="bg-white border border-slate-300 text-slate-805 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-indigo-500"
            >
              <option value="">Seleziona...</option>
              {teams.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.flag} {t.name}
                </option>
              ))}
            </select>
          </div>

          {/* Form Fields: Stage Type */}
          <div className="md:col-span-3 flex flex-col gap-1.5">
            <label className="text-xs font-semibold text-slate-500">Tipo Fase</label>
            <div className="grid grid-cols-2 gap-2 bg-slate-50 rounded-xl p-1 border border-slate-200 h-[38px] items-center">
              <button
                type="button"
                onClick={() => setStage("gironi")}
                className={`py-1 text-xs rounded-lg font-bold cursor-pointer transition ${
                  stage === "gironi"
                    ? "bg-white border border-slate-200 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-705"
                }`}
              >
                Gironi
              </button>
              <button
                type="button"
                onClick={() => setStage("eliminazione")}
                className={`py-1 text-xs rounded-lg font-bold cursor-pointer transition ${
                  stage === "eliminazione"
                    ? "bg-white border border-slate-200 text-indigo-600 shadow-sm"
                    : "text-slate-500 hover:text-slate-705"
                }`}
              >
                Diretta
              </button>
            </div>
          </div>

          {/* Submission and Close buttons */}
          <div className="md:col-span-12 flex justify-end gap-2.5 mt-2">
            <button
              onClick={() => setIsAddingFixture(false)}
              className="px-4 py-2 text-xs border border-slate-250 hover:bg-slate-50 text-slate-500 rounded-xl transition cursor-pointer"
            >
              Annulla
            </button>
            <button
              onClick={handleAddFixture}
              className="px-5 py-2 text-xs bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold shadow transition cursor-pointer"
            >
              Salva Partita
            </button>
          </div>
        </div>
      )}

      {/* Elenco Match Filtrati */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4" id="fixtures-list">
        {filteredMatches.length === 0 ? (
          <div className="col-span-1 md:col-span-2 lg:col-span-3 py-10 text-center bg-white border border-slate-200 shadow-sm rounded-2xl flex flex-col items-center justify-center">
            <Clock className="w-8 h-8 text-slate-400 mb-2" />
            <span className="text-sm font-semibold text-slate-700">Nessuna partita programmata</span>
            <span className="text-xs text-slate-400 mt-1">Aggiungi un match per iniziare ad analizzare i percorsi.</span>
          </div>
        ) : (
          filteredMatches.map((m) => {
            const home = teams.find((t) => t.id === m.homeTeamId);
            const away = teams.find((t) => t.id === m.awayTeamId);

            return (
              <div
                key={m.id}
                id={`match-card-${m.id}`}
                className="bg-white border border-slate-200 rounded-2xl p-4.5 flex flex-col justify-between hover:border-indigo-200 transition shadow-[0_1px_3px_rgba(0,0,0,0.02)] hover:shadow-md relative group"
              >
                {/* Upper Metadata badges */}
                <div className="flex justify-between items-center mb-4.5 border-b border-slate-100 pb-2.5">
                  <span className="text-[10px] font-bold text-slate-500 font-mono tracking-wider truncate max-w-[150px]">
                    {m.round}
                  </span>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wide uppercase ${
                        m.stage === "gironi"
                          ? "bg-blue-50 text-blue-700 border border-blue-100"
                          : "bg-purple-50 text-purple-700 border border-purple-100"
                      }`}
                    >
                      {m.stage === "gironi" ? "Gironi (Pareggio amme.)" : "K.O."}
                    </span>
                    <button
                      onClick={() => handleDeleteFixture(m.id)}
                      className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-50 text-slate-450 hover:text-red-500 rounded transition duration-200 cursor-pointer"
                      title="Elimina partita"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Score and Matchup details */}
                <div className="grid grid-cols-12 gap-2 items-center">
                  {/* Home info */}
                  <div className="col-span-4 flex flex-col items-center text-center gap-1">
                    <span className="text-2xl h-8 select-none">{home?.flag || "🏳️"}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate w-full">
                      {home?.name || m.homeTeamId}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">
                      {m.homeTeamId}
                    </span>
                  </div>

                  {/* Score inputs in the center */}
                  <div className="col-span-4 flex items-center justify-center gap-1 relative">
                    <input
                      type="number"
                      placeholder="-"
                      min={0}
                      max={99}
                      value={m.homeScore !== undefined ? m.homeScore : ""}
                      onChange={(e) => handleScoreChange(m.id, "home", e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-center text-sm font-bold rounded-lg w-10 h-10 focus:outline-none focus:border-indigo-500 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                    <span className="text-slate-400 font-bold font-mono text-xs select-none">:</span>
                    <input
                      type="number"
                      placeholder="-"
                      min={0}
                      max={99}
                      value={m.awayScore !== undefined ? m.awayScore : ""}
                      onChange={(e) => handleScoreChange(m.id, "away", e.target.value)}
                      className="bg-slate-50 border border-slate-200 text-slate-800 text-center text-sm font-bold rounded-lg w-10 h-10 focus:outline-none focus:border-indigo-500 font-mono [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />

                    {/* Reset individual score */}
                    {(m.homeScore !== undefined || m.awayScore !== undefined) && (
                      <button
                        onClick={() => handleResetScores(m.id)}
                        className="absolute -bottom-5 text-[8px] font-bold text-slate-400 hover:text-red-500 p-0.5 rounded cursor-pointer"
                        title="Cancella punteggio"
                      >
                        Azzera
                      </button>
                    )}
                  </div>

                  {/* Away info */}
                  <div className="col-span-4 flex flex-col items-center text-center gap-1">
                    <span className="text-2xl h-8 select-none">{away?.flag || "🏳️"}</span>
                    <span className="text-xs font-semibold text-slate-800 truncate w-full">
                      {away?.name || m.awayTeamId}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono uppercase font-bold">
                      {m.awayTeamId}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
