import React, { useState } from "react";
import { Team, SurvivorPath, PathLocks, Match } from "../types";
import { Lock, Unlock, ShieldAlert, Sparkles, AlertTriangle, CheckCircle, RefreshCw, Layers } from "lucide-react";
import { isChoiceSuccessful } from "../utils/SurvivorRulesEngine";

interface PathResultsProps {
  teams: Team[];
  paths: SurvivorPath[];
  locks: PathLocks;
  fixtures: Match[];
  onToggleLock: (pathId: number, round: string, teamId: string) => void;
  onRegenerate: () => void;
}

export default function PathResults({
  teams,
  paths,
  locks,
  fixtures,
  onToggleLock,
  onRegenerate,
}: PathResultsProps) {
  const [selectedPathId, setSelectedPathId] = useState<number>(1);

  const activePath = paths.find((p) => p.id === selectedPathId) || paths[0];

  const getTeamFromId = (id: string) => teams.find((t) => t.id === id);

  // Helper to check if a specific choice is locked
  const isLocked = (pathId: number, round: string, teamId: string) => {
    return locks[pathId]?.[round] === teamId;
  };

  // Helper to count how many paths survived
  const alivePathsCount = paths.filter((p) => !p.isEliminated).length;

  return (
    <div className="flex flex-col gap-6" id="path-results">
      {/* Intestazione e Controlli Rigenerazione */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-100 flex items-center gap-2">
            <Sparkles className="text-yellow-400 w-5 h-5 fill-yellow-400" />
            Percorsi Survivor Ottimizzati
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Algoritmo predittivo per massimizzare la probabilità complessiva di sopravvivenza.{" "}
            <span className="text-emerald-400 font-semibold">{alivePathsCount} su 8 percorsi</span> sono ancora vivi.
          </p>
        </div>

        <button
          onClick={onRegenerate}
          className="flex items-center justify-center gap-2 py-2.5 px-5 bg-emerald-600 hover:bg-emerald-500 text-slate-100 font-semibold rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition cursor-pointer shrink-0"
        >
          <RefreshCw className="w-4 h-4" />
          Rigenera Altri Percorsi
        </button>
      </div>

      {/* Grid: Selettore Percorso (Sinistra) + Dettaglio Scelte (Destra) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Selettore Percorsi (Tendenze veloci) */}
        <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-4">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider pb-2 border-b border-slate-850">
            Lista Percorsi Generati
          </span>

          <div className="flex flex-col gap-2.5">
            {paths.map((p) => {
              const isSelected = p.id === selectedPathId;

              // Compute stats for path
              const totalRounds = p.choices.length;
              const usedLocksCount = Object.keys(locks[p.id] || {}).length;

              return (
                <button
                  key={p.id}
                  id={`path-tab-${p.id}`}
                  onClick={() => setSelectedPathId(p.id)}
                  className={`flex items-center justify-between p-3.5 rounded-xl border text-left cursor-pointer transition duration-155 ${
                    isSelected
                      ? "bg-slate-800/80 border-emerald-500/50 text-slate-100 shadow-md shadow-emerald-950/10"
                      : "bg-slate-950/45 border-slate-800 hover:bg-slate-900 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  <div className="flex flex-col gap-1 min-w-0 pr-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-sm">Percorso {p.id}</span>
                      {usedLocksCount > 0 && (
                        <span className="bg-slate-950/70 text-slate-400 text-[9px] font-mono px-1.5 py-0.5 rounded border border-slate-800 flex items-center gap-0.5">
                          <Lock className="w-2.5 h-2.5 text-emerald-400" />
                          {usedLocksCount} loc.
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-slate-500 truncate">
                      {totalRounds} turni • Scelte uniche
                    </span>
                  </div>

                  <div className="shrink-0">
                    {p.isEliminated ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-red-400 bg-red-950/30 px-2 py-1 rounded-full border border-red-900/40">
                        Eliminato
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/30 px-2 py-1 rounded-full border border-emerald-900/40">
                        Vivo
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dettaglio Percorso Selezionato */}
        <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 flex flex-col gap-5">
          {/* Header del percorso selezionato */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-850 gap-2">
            <div>
              <h4 className="font-sans font-semibold text-base text-slate-100 flex items-center gap-2">
                <Layers className="w-5 h-5 text-emerald-400" />
                Dettaglio Scelte • Percorso {activePath.id}
              </h4>
              <p className="text-xs text-slate-450 mt-1">
                Visualizza la catena di partite consigliate. Impedisci modifiche bloccando le singole squadre.
              </p>
            </div>

            <div className="shrink-0 flex items-center gap-2">
              {activePath.isEliminated ? (
                <div className="flex items-center gap-1.5 bg-red-950/30 text-red-400 border border-red-900/40 py-1 px-3 rounded-xl text-xs font-bold">
                  <ShieldAlert className="w-4 h-4" />
                  Interrotto al: {activePath.eliminatedAtRound}
                </div>
              ) : (
                <div className="flex items-center gap-1.5 bg-emerald-950/30 text-emerald-400 border border-emerald-900/40 py-1 px-3 rounded-xl text-xs font-bold">
                  <CheckCircle className="w-4 h-4" />
                  Percorso in Gioco (Survives!)
                </div>
              )}
            </div>
          </div>

          {/* Squadre già usate nel percorso */}
          <div className="bg-slate-950/65 border border-slate-850 rounded-xl p-3.5 flex flex-col gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
              Squadre già usate in questo percorso (Vincolo di unicità rispettato):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {activePath.choices.map((c, index) => {
                const team = getTeamFromId(c.teamId);
                return (
                  <span
                    key={`${c.teamId}-${index}`}
                    className="inline-flex items-center gap-1 bg-slate-900 text-slate-300 rounded-lg px-2 py-1 text-xs border border-slate-800 font-medium"
                  >
                    <span className="text-sm">{team?.flag}</span>
                    <span>{team?.name || c.teamId}</span>
                    <span className="text-[9px] text-slate-500 font-mono">T{index + 1}</span>
                  </span>
                );
              })}
              {activePath.choices.length === 0 && (
                <span className="text-xs text-slate-500">Nessuna squadra usata ancora.</span>
              )}
            </div>
          </div>

          {/* Step Timeline di Scelta */}
          <div className="flex flex-col gap-4 mt-1">
            {activePath.choices.map((choice, index) => {
              const team = getTeamFromId(choice.teamId);
              const opponent = getTeamFromId(choice.opponentId);
              const locked = isLocked(activePath.id, choice.round, choice.teamId);

              // Match result logic (check if actual result exists and check success status)
              const match = fixtures.find(
                (m) =>
                  m.round === choice.round &&
                  (m.homeTeamId === choice.teamId || m.awayTeamId === choice.teamId)
              );

              const hasResult =
                match && match.homeScore !== undefined && match.awayScore !== undefined;
              const { success: survived, scoreText } = match
                ? isChoiceSuccessful(match, choice.teamId)
                : { success: true, scoreText: "" };

              // Check if previous choices failed, which means the timeline is broken at this stage
              let timelineStatus = "pending"; // pending, success, failed, skipped
              if (activePath.isEliminated) {
                // Find index of round when it failed
                const failedRoundIdx = activePath.choices.findIndex(
                  (c) => c.round === activePath.eliminatedAtRound
                );
                if (index < failedRoundIdx) {
                  timelineStatus = "success";
                } else if (index === failedRoundIdx) {
                  timelineStatus = "failed";
                } else {
                  timelineStatus = "skipped";
                }
              } else if (hasResult && survived) {
                timelineStatus = "success";
              }

              // Color of the cards based on timeline
              let statusCardBorder = "border-slate-800/75 hover:border-slate-700/60";
              let statusBg = "bg-slate-950/20";
              let titleStatusBadge = null;

              if (timelineStatus === "success") {
                statusCardBorder = "border-emerald-900/50 bg-emerald-950/5 hover:border-emerald-800/50";
                titleStatusBadge = (
                  <span className="text-[9px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800/40 uppercase">
                    Vinta ({scoreText})
                  </span>
                );
              } else if (timelineStatus === "failed") {
                statusCardBorder = "border-red-900/50 bg-red-950/5 hover:border-red-800/50";
                titleStatusBadge = (
                  <span className="text-[9px] font-bold text-red-400 bg-red-950 px-2 py-0.5 rounded border border-red-800/40 uppercase font-mono">
                    Perdente ({scoreText}) • Streak K.O.
                  </span>
                );
              } else if (timelineStatus === "skipped") {
                statusCardBorder = "border-slate-850 opacity-40";
                titleStatusBadge = (
                  <span className="text-[9px] font-semibold text-slate-500 font-mono">Annullato</span>
                );
              }

              // Probability colors
              let probColor = "text-emerald-400";
              if (choice.winProbability < 0.65 && choice.winProbability >= 0.45) {
                probColor = "text-yellow-400";
              } else if (choice.winProbability < 0.45) {
                probColor = "text-red-400";
              }

              return (
                <div
                  key={choice.round}
                  id={`choice-card-${index}`}
                  className={`border rounded-xl p-4 transition-all duration-200 ${statusCardBorder} ${statusBg} flex flex-col gap-3 relative`}
                >
                  {/* Row 1: Turn & Actions (Lock) */}
                  <div className="flex justify-between items-center pb-2 border-b border-slate-850/40">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                        Round {index + 1}: {choice.round}
                      </span>
                      {titleStatusBadge}
                    </div>

                    <button
                      onClick={() => onToggleLock(activePath.id, choice.round, choice.teamId)}
                      className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold tracking-wide border cursor-pointer select-none transition ${
                        locked
                          ? "bg-amber-950/50 text-amber-300 border-amber-900/50"
                          : "bg-slate-950 hover:bg-slate-855 text-slate-500 hover:text-slate-300 border-slate-850"
                      }`}
                    >
                      {locked ? (
                        <>
                          <Lock className="w-3 h-3 text-amber-400" />
                          BOCCATO
                        </>
                      ) : (
                        <>
                          <Unlock className="w-3 h-3" />
                          BLOCCA
                        </>
                      )}
                    </button>
                  </div>

                  {/* Row 2: Matchup details */}
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
                    <div className="md:col-span-4 flex items-center gap-3">
                      <span className="text-3xl select-none shrink-0">{team?.flag || "🏳️"}</span>
                      <div className="flex flex-col min-w-0">
                        <span className="text-xs text-slate-400">Scelta Survivor</span>
                        <span className="font-semibold text-slate-100 text-sm truncate">
                          {team?.name || choice.teamId}
                        </span>
                      </div>
                    </div>

                    <div className="md:col-span-4 flex flex-col items-center justify-center text-center">
                      <span className="text-[10px] text-slate-500 uppercase tracking-widest font-mono font-bold">
                        VS AVVERSARIO
                      </span>
                      <span className="text-sm font-semibold text-slate-300 flex items-center gap-1.5 mt-0.5">
                        <span className="text-lg leading-none">{opponent?.flag}</span>
                        {opponent?.name || choice.opponentId}
                      </span>
                    </div>

                    <div className="md:col-span-4 flex items-center justify-end gap-3 md:text-right">
                      <div className="flex flex-col">
                        <span className="text-[10px] text-slate-400">Probabilità Vittoria</span>
                        <span className={`text-base font-black font-mono ${probColor}`}>
                          {Math.round(choice.winProbability * 100)}%
                        </span>
                      </div>

                      {/* Risk Badge */}
                      <span
                        className={`text-[9px] font-bold tracking-wider uppercase px-2 py-1 rounded-md border flex items-center gap-1 ${
                          choice.risk === "basso"
                            ? "bg-emerald-950/40 text-emerald-450 border-emerald-900/30"
                            : choice.risk === "medio"
                            ? "bg-amber-950/40 text-amber-455 border-amber-900/30"
                            : "bg-red-950/40 text-red-455 border-red-900/30"
                        }`}
                      >
                        {choice.risk === "basso" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-450 shrink-0" />
                        )}
                        {choice.risk === "medio" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-amber-455 shrink-0" />
                        )}
                        {choice.risk === "alto" && (
                          <span className="w-1.5 h-1.5 rounded-full bg-red-455 shrink-0" />
                        )}
                        Rischio {choice.risk}
                      </span>
                    </div>
                  </div>

                  {/* Row 3: Description Reason */}
                  <div className="text-xs text-slate-400 bg-slate-950/40 rounded-lg p-2.5 border border-slate-850/40 leading-relaxed font-sans">
                    {choice.reason}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
