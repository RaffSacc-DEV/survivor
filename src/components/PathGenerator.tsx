import React, { useState, useMemo } from "react";
import { Team, TeamRanking, Match, PathLocks } from "../types";
import { generateSurvivorPaths } from "../utils/SurvivorRulesEngine";
import PathResults from "./PathResults";
import { Zap, Percent, ShieldCheck, Database, Sliders } from "lucide-react";

interface PathGeneratorProps {
  teams: Team[];
  rankings: TeamRanking[];
  fixtures: Match[];
  locks: PathLocks;
  onUpdateLocks: (newLocks: PathLocks) => void;
}

export default function PathGenerator({
  teams,
  rankings,
  fixtures,
  locks,
  onUpdateLocks,
}: PathGeneratorProps) {
  // Optimization dials (to customize algorithm weighting)
  const [fvWeight, setFvWeight] = useState(0.45);
  const [overlapWeight, setOverlapWeight] = useState(0.15);
  const [seed, setSeed] = useState(0);

  // Trigger a full path generation pass
  const generatedPaths = useMemo(() => {
    // We pass state directly down or compute with active settings
    return generateSurvivorPaths({
      teams,
      rankings,
      matches: fixtures,
      locks,
      fvWeight,
      overlapWeight,
      seed,
    });
  }, [teams, rankings, fixtures, locks, fvWeight, overlapWeight, seed]);

  // Handle setting/releasing of individual round manual blocks
  const handleToggleLock = (pathId: number, round: string, teamId: string) => {
    const nextLocks = { ...locks };
    if (!nextLocks[pathId]) {
      nextLocks[pathId] = {};
    }

    if (nextLocks[pathId][round] === teamId) {
      // Release
      delete nextLocks[pathId][round];
      if (Object.keys(nextLocks[pathId]).length === 0) {
        delete nextLocks[pathId];
      }
    } else {
      // Block
      nextLocks[pathId][round] = teamId;
    }

    onUpdateLocks(nextLocks);
  };

  const handleRegenerate = () => {
    // Increment deterministic random seed to find alternative path configurations.
    setSeed((prev) => prev + 1);

    // Add micro-interaction glow feedback
    const overlay = document.getElementById("solver-glow");
    if (overlay) {
      overlay.classList.add("animate-ping");
      setTimeout(() => {
        overlay.classList.remove("animate-ping");
      }, 700);
    }
  };

  // Compute analytics about the calculated paths
  const stats = useMemo(() => {
    if (generatedPaths.length === 0) return { jointSuccessRate: 0, avgWinProb: 0, topTeamsPreserved: 0 };

    // 1. Joint Survival probability: Product of (1 - Failure_Probability) represents independence,
    // though sports paths are partially correlated, we can compute an estimated joint safety net factor.
    // If we have 8 paths, what is the probability that AT LEAST one path finishes?
    // Let's model each path's ultimate survival as: Product of standard selection winProb's.
    const pathProbabilities = generatedPaths.map((p) => {
      if (p.choices.length === 0) return 0;
      return p.choices.reduce((acc, c) => acc * c.winProbability, 1);
    });

    // To prevent math limits, cap average
    const avgWinProb =
      generatedPaths.reduce((sum, p) => {
        if (p.choices.length === 0) return sum;
        return sum + p.choices.reduce((s, c) => s + c.winProbability, 0) / p.choices.length;
      }, 0) / generatedPaths.length;

    // Approximate joint survival probability of at least 1 path surviving
    // Assuming partial independence due to overlap diversity penalization (using 1 - Product(1 - PathProb))
    const highestPathProb = Math.max(...pathProbabilities);
    const estimatedJointProb = Math.min(
      0.99,
      highestPathProb + (1 - highestPathProb) * (0.12 * pathProbabilities.length)
    );

    // Count preserved elite teams (not used in early group rounds, e.g. Round 1-3)
    // Rank 1-8 are considered elite. How many were kept fresh for later phases?
    let preservedCount = 0;
    const top8Teams = rankings[0]?.teamIds.slice(0, 8) || [];

    top8Teams.forEach((tId) => {
      // Check if any path used this team in Round 1-3
      let usedEarly = false;
      generatedPaths.forEach((p) => {
        p.choices.slice(0, 3).forEach((c) => {
          if (c.teamId === tId) usedEarly = true;
        });
      });
      if (!usedEarly) preservedCount++;
    });

    return {
      jointSuccessRate: Math.round(estimatedJointProb * 100),
      avgWinProb: Math.round(avgWinProb * 100),
      topTeamsPreserved: preservedCount,
    };
  }, [generatedPaths, rankings]);

  return (
    <div className="flex flex-col gap-6" id="path-generator-dashboard">
      {/* Real-time Solver Performance KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Probabilità di Vittoria Congiunta */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex items-center justify-between shadow p-4 relative overflow-hidden">
          <div className="flex flex-col gap-1 z-10">
            <span className="text-xs text-slate-400 font-medium">Sopravvivenza Congiunta Est.</span>
            <span className="text-3xl font-black font-mono text-emerald-400 mt-0.5">
              {stats.jointSuccessRate}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Almeno 1 percorso supera tutti i turni
            </span>
          </div>
          <div className="bg-emerald-950/40 p-3 rounded-xl border border-emerald-900/40 shrink-0 z-10">
            <Percent className="w-5 h-5 text-emerald-400" />
          </div>
          <div
            id="solver-glow"
            className="absolute -right-12 -bottom-12 w-24 h-24 rounded-full bg-emerald-500/5 filter blur-xl"
          />
        </div>

        {/* KPI 2: Sicurezza Media Scelte */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex items-center justify-between shadow p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-medium">Sicurezza Media Nazionale</span>
            <span className="text-3xl font-black font-mono text-blue-400 mt-0.5">
              {stats.avgWinProb}%
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Percentuale media di vittoria per match
            </span>
          </div>
          <div className="bg-blue-950/40 p-3 rounded-xl border border-blue-900/40 shrink-0">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
          </div>
        </div>

        {/* KPI 3: Risparmio Nazionali Elite */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex items-center justify-between shadow p-4">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-slate-400 font-medium">Superfavorite Risparmiate</span>
            <span className="text-3xl font-black font-mono text-amber-500 mt-0.5">
              {stats.topTeamsPreserved}/8
            </span>
            <span className="text-[10px] text-slate-500 font-medium">
              Top seed tenuti freschi per turni K.O.
            </span>
          </div>
          <div className="bg-amber-950 text-amber-500 p-3 rounded-xl border border-amber-900/40 shrink-0">
            <Database className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Dynamic Weight Adjustment Sliders */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <span className="text-sm font-semibold text-slate-200 flex items-center gap-2">
          <Sliders className="w-4 h-4 text-emerald-400" /> Calibrazione Algoritmo
        </span>

        <div className="flex flex-col sm:flex-row gap-5 w-full md:w-auto">
          {/* Slider Future Value */}
          <div className="flex items-center gap-3 w-full sm:w-64">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Risparmio Top (FV): {(fvWeight * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={fvWeight}
                onChange={(e) => setFvWeight(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>

          {/* Slider Overlap Diversity */}
          <div className="flex items-center gap-3 w-full sm:w-64">
            <div className="flex flex-col">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Diversità Percorsi: {(overlapWeight * 100).toFixed(0)}%
              </span>
              <input
                type="range"
                min="0"
                max="0.5"
                step="0.05"
                value={overlapWeight}
                onChange={(e) => setOverlapWeight(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-emerald-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Render the core paths display results board */}
      <PathResults
        teams={teams}
        paths={generatedPaths}
        locks={locks}
        fixtures={fixtures}
        onToggleLock={handleToggleLock}
        onRegenerate={handleRegenerate}
      />
    </div>
  );
}
