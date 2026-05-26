import React from "react";
import { Team, TeamRanking } from "../types";
import { calculateAverageRanking, ComputedTeamPower } from "../utils/SurvivorRulesEngine";
import { Info, TrendingUp, AlertCircle } from "lucide-react";

interface AverageRankingCalculatorProps {
  teams: Team[];
  rankings: TeamRanking[];
}

export default function AverageRankingCalculator({
  teams,
  rankings,
}: AverageRankingCalculatorProps) {
  const activeRankings = rankings.filter((r) => r.isActive !== false);
  const computedPowers: ComputedTeamPower[] = calculateAverageRanking(teams, rankings);

  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5" id="average-ranking-calculator">
      {/* Header section with summary info */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-3">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-800 flex items-center gap-2">
            <TrendingUp className="text-indigo-600 w-5 h-5" />
            Classifica Media Consolidata
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Combinazione di <span className="text-indigo-600 font-semibold">{activeRankings.length} classifiche attive</span>. I valori di Forza determinano le probabilità di vittoria.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 px-3 py-1.5 rounded-lg border border-slate-200">
          <Info className="w-4 h-4 text-indigo-600 shrink-0" />
          <span className="text-[10px] text-slate-500 max-w-[220px] leading-tight flex flex-col">
            <span>Forza stimata (500-1500) basata sull'ordinamento medio.</span>
          </span>
        </div>
      </div>

      {activeRankings.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
          <AlertCircle className="w-8 h-8 text-amber-500 mb-2" />
          <span className="text-sm font-medium text-slate-700">Nessuna classifica attiva</span>
          <span className="text-xs text-slate-400 mt-1 font-sans">
            Attiva almeno una classifica nel pannello "Classifiche" per calcolare la forza delle nazionali.
          </span>
        </div>
      ) : (
        /* Dynamic stats list */
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                <th className="py-3 px-3 text-center w-12">Rank</th>
                <th className="py-3 px-3">Nazionale</th>
                <th className="py-3 px-3 text-center ">Avg Pos</th>
                <th className="py-3 px-3 text-right">Forza Elo</th>
                {activeRankings.map((r) => (
                  <th key={r.id} className="py-3 px-3 text-center font-normal text-slate-500 hidden md:table-cell max-w-[120px] truncate">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {computedPowers.map((team, idx) => {
                const isTop = idx < 4;
                const isBottom = idx >= computedPowers.length - 4;

                return (
                  <tr
                     key={team.teamId}
                     id={`avg-team-row-${team.teamId}`}
                     className="hover:bg-slate-50 transition-colors"
                  >
                    {/* Rank Number with customizable badge */}
                    <td className="py-3 px-3 text-center">
                       <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold ${
                          isTop
                            ? "bg-indigo-50 text-indigo-700 border border-indigo-100"
                            : isBottom
                            ? "bg-slate-100 text-slate-400 border border-slate-200"
                            : "bg-white text-slate-600 border border-slate-250"
                        }`}
                      >
                        {team.rank}
                      </span>
                    </td>

                    {/* Team Name and flag */}
                    <td className="py-3 px-3 font-medium text-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="text-lg leading-none">{team.flag}</span>
                        <span className="text-sm font-semibold">{team.name}</span>
                        <span className="text-[10px] text-slate-400 font-mono bg-slate-50 px-1.5 py-0.2 rounded border border-slate-200/40">
                          {team.teamId}
                        </span>
                      </div>
                    </td>

                    {/* Mathematical Average Position */}
                    <td className="py-3 px-3 text-center font-mono text-xs text-slate-600 font-medium">
                      {team.averageRank.toFixed(1)}
                    </td>

                    {/* Computed power / points score */}
                    <td className="py-3 px-3 text-right font-mono text-xs text-indigo-600 font-bold">
                      {team.calculatedPower}
                    </td>

                    {/* Original indices from experts */}
                    {activeRankings.map((r) => {
                      const origIndex = r.teamIds.indexOf(team.teamId);
                      const origRank = origIndex >= 0 ? origIndex + 1 : "-";
                      return (
                        <td
                          key={r.id}
                          className="py-3 px-3 text-center text-xs text-slate-400 font-mono hidden md:table-cell"
                        >
                          {origRank}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
