import { Team, TeamRanking, Match, SurvivorPath, SurvivorChoice, PathLocks } from "../types";

/**
 * Interface representing a team's calculated final metrics
 */
export interface ComputedTeamPower {
  teamId: string;
  name: string;
  flag: string;
  averageRank: number;
  calculatedPower: number; // Elo-style, e.g. 500 to 1500
  rank: number; // 1 to N
}

/**
 * Combined Rules and Calculation Engine
 */

/**
 * 1. Combines expert rankings to compute a unified Average Ranking and Strength rating (Power).
 */
export function calculateAverageRanking(
  teams: Team[],
  rankings: TeamRanking[]
): ComputedTeamPower[] {
  const activeRankings = rankings.filter((r) => r.isActive !== false);

  if (activeRankings.length === 0) {
    // Default to alphabetic or basic rank if no active rankings
    return teams.map((t, idx) => ({
      teamId: t.id,
      name: t.name,
      flag: t.flag,
      averageRank: idx + 1,
      calculatedPower: 1500 - (idx / Math.max(1, teams.length - 1)) * 900,
      rank: idx + 1,
    }));
  }

  const teamPowerMap: { [teamId: string]: { sumRank: number; count: number } } = {};

  teams.forEach((t) => {
    teamPowerMap[t.id] = { sumRank: 0, count: 0 };
  });

  activeRankings.forEach((r) => {
    // Find missing teams
    const rankingLength = r.teamIds.length;
    teams.forEach((team) => {
      const pos = r.teamIds.indexOf(team.id);
      if (pos >= 0) {
        teamPowerMap[team.id].sumRank += pos + 1; // 1-indexed rank
        teamPowerMap[team.id].count += 1;
      } else {
        // If not listed, assign last position + penalty
        teamPowerMap[team.id].sumRank += Math.max(32, rankingLength + 5);
        teamPowerMap[team.id].count += 1;
      }
    });
  });

  const computedTeams = teams.map((team) => {
    const stats = teamPowerMap[team.id];
    const avg = stats.count > 0 ? stats.sumRank / stats.count : 32;
    return {
      teamId: team.id,
      name: team.name,
      flag: team.flag,
      averageRank: parseFloat(avg.toFixed(2)),
      calculatedPower: 0, // Assigned later based on rank
      rank: 0,
    };
  });

  // Sort by averageRank ascending (lower means stronger)
  computedTeams.sort((a, b) => a.averageRank - b.averageRank);

  const N = computedTeams.length;
  return computedTeams.map((team, index) => {
    const rank = index + 1;
    // Map rank to an Elo score between 500 (weakest) and 1500 (strongest)
    const power = Math.round(1500 - ((rank - 1) / Math.max(1, N - 1)) * 900);
    return {
      ...team,
      rank,
      calculatedPower: power,
    };
  });
}

/**
 * 2. Predicts match probabilities using standard Elo logistic rating difference.
 */
export interface MatchProbabilities {
  homeWin: number;
  draw: number;
  awayWin: number;
}

export function getMatchProbabilities(
  homePower: number,
  awayPower: number,
  stage: "gironi" | "eliminazione"
): MatchProbabilities {
  const delta = homePower - awayPower;
  // Elo formula: Probability of home winning
  const pHomeBase = 1 / (1 + Math.pow(10, -delta / 400));

  if (stage === "eliminazione") {
    // In knockout phase, a team must qualify. No draw is possible.
    return {
      homeWin: parseFloat(pHomeBase.toFixed(3)),
      draw: 0,
      awayWin: parseFloat((1 - pHomeBase).toFixed(3)),
    };
  } else {
    // In group phase, draws are possible (approx 24% baseline decaying with power gap)
    const drawBaseProb = 0.24 * Math.exp(-Math.pow(delta / 300, 2));
    const winRemaining = 1 - drawBaseProb;

    return {
      homeWin: parseFloat((pHomeBase * winRemaining).toFixed(3)),
      draw: parseFloat(drawBaseProb.toFixed(3)),
      awayWin: parseFloat(((1 - pHomeBase) * winRemaining).toFixed(3)),
    };
  }
}

/**
 * Helper to identify which teams are available in a round from the match fixtures.
 */
export function getTeamsPlayingInRound(
  matches: Match[],
  roundName: string
): { teamId: string; matchId: string; opponentId: string; isHome: boolean }[] {
  const roundMatches = matches.filter((m) => m.round === roundName);
  const players: { teamId: string; matchId: string; opponentId: string; isHome: boolean }[] = [];

  roundMatches.forEach((m) => {
    players.push({
      teamId: m.homeTeamId,
      matchId: m.id,
      opponentId: m.awayTeamId,
      isHome: true,
    });
    players.push({
      teamId: m.awayTeamId,
      matchId: m.id,
      opponentId: m.homeTeamId,
      isHome: false,
    });
  });

  return players;
}

/**
 * Checks if a match results in a "survived" state for the chosen team.
 * Survivor rule: Team MUST WIN. Draw or Loss results in elimination.
 */
export function isChoiceSuccessful(
  match: Match,
  chosenTeamId: string
): { calculated: boolean; success: boolean; scoreText: string } {
  const hasResult = match.homeScore !== undefined && match.awayScore !== undefined;
  if (!hasResult) {
    return { calculated: false, success: true, scoreText: "" };
  }

  const hs = match.homeScore!;
  const as = match.awayScore!;
  const scoreText = `${hs} - ${as}`;

  const isHome = match.homeTeamId === chosenTeamId;
  const isAway = match.awayTeamId === chosenTeamId;

  if (isHome) {
    // Must win (homeScore > awayScore)
    const win = hs > as;
    return { calculated: true, success: win, scoreText };
  } else if (isAway) {
    // Must win (awayScore > homeScore)
    const win = as > hs;
    return { calculated: true, success: win, scoreText };
  }

  return { calculated: false, success: true, scoreText: "" };
}

/**
 * 3. Primary Path Generation Algorithm
 * Generates exactly 8 paths, optimizing survival, diversity, future value, and respecting locks.
 */
export function generateSurvivorPaths({
  teams,
  rankings,
  matches,
  locks,
  fvWeight = 0.45,
  overlapWeight = 0.15,
  seed = 0,
}: {
  teams: Team[];
  rankings: TeamRanking[];
  matches: Match[];
  locks: PathLocks;
  fvWeight?: number;
  overlapWeight?: number;
  seed?: number;
}): SurvivorPath[] {
  const computedPowers = calculateAverageRanking(teams, rankings);
  const powerMap = new Map<string, number>();
  const rankMap = new Map<string, number>();

  computedPowers.forEach((cp) => {
    powerMap.set(cp.teamId, cp.calculatedPower);
    rankMap.set(cp.teamId, cp.rank);
  });

  // Unique rounds list sorted by original schedule order
  const roundsMap = new Map<string, number>();
  matches.forEach((m) => {
    if (!roundsMap.has(m.round)) {
      roundsMap.set(m.round, matches.indexOf(m));
    }
  });
  const allRounds = Array.from(roundsMap.keys()).sort(
    (a, b) => roundsMap.get(a)! - roundsMap.get(b)!
  );

  const numPaths = 8;
  const paths: SurvivorPath[] = [];

  // Keeps track of how many times a team is selected in a specific round across ALL paths
  // Used to calculate co-selection / overlap penalties
  const roundTeamPicksCount: { [round: string]: { [teamId: string]: number } } = {};
  allRounds.forEach((r) => {
    roundTeamPicksCount[r] = {};
  });

  // We perform a greedy generation sequence for paths 1 through 8.
  for (let pathIdx = 1; pathIdx <= numPaths; pathIdx++) {
    const choices: SurvivorChoice[] = [];
    const usedTeamsInPath = new Set<string>();
    let isPathEliminated = false;
    let eliminatedAt: string | undefined = undefined;

    // First, map manual locks for this path so they are reserved/used
    const pathLocksForThisPath = locks[pathIdx] || {};
    Object.keys(pathLocksForThisPath).forEach((lockedRound) => {
      const lockedTeamId = pathLocksForThisPath[lockedRound];
      if (lockedTeamId) {
        usedTeamsInPath.add(lockedTeamId);
      }
    });

    for (let rIdx = 0; rIdx < allRounds.length; rIdx++) {
      const roundName = allRounds[rIdx];
      const matchPlayers = getTeamsPlayingInRound(matches, roundName);

      // Check if user has locked a team for this specific path/round
      const lockedTeamId = pathLocksForThisPath[roundName];

      if (lockedTeamId && matchPlayers.some((p) => p.teamId === lockedTeamId)) {
        // Handle Locked Team Case
        const pObj = matchPlayers.find((p) => p.teamId === lockedTeamId)!;
        const homePower = powerMap.get(pObj.teamId) || 1000;
        const awayPower = powerMap.get(pObj.opponentId) || 1000;
        const stage = matches.find((m) => m.id === pObj.matchId)?.stage || "gironi";

        const probs = getMatchProbabilities(
          pObj.isHome ? homePower : awayPower,
          pObj.isHome ? awayPower : homePower,
          stage
        );

        const winProb = pObj.isHome ? probs.homeWin : probs.awayWin;
        const risk = winProb >= 0.7 ? "basso" : winProb >= 0.5 ? "medio" : "alto";

        choices.push({
          round: roundName,
          teamId: pObj.teamId,
          opponentId: pObj.opponentId,
          winProbability: winProb,
          risk,
          reason: "Scelta bloccata manualmente dall'utente (Blocco attivo).",
        });

        // Track pick count
        roundTeamPicksCount[roundName][pObj.teamId] =
          (roundTeamPicksCount[roundName][pObj.teamId] || 0) + 1;
        continue;
      }

      // If NOT Locked, determine optimal choice
      // Filter players that are not yet chosen in this path (ignoring locked reservations if they happen to conflict, though usually we prevent overlap)
      let candidates = matchPlayers.filter((p) => {
        // If locked for other round in this path, we can't use it now
        return !usedTeamsInPath.has(p.teamId);
      });

      // If we ran out of unused teams (extremely rare unless small match list), allow all playing teams
      if (candidates.length === 0) {
        candidates = matchPlayers;
      }

      // Score each candidate to pick the best
      let bestCandidate: typeof matchPlayers[0] | null = null;
      let bestScore = -999999;
      let calculatedWinProb = 0.5;
      let calculatedReason = "";

      const R = allRounds.length;

      candidates.forEach((cand) => {
        const homePower = powerMap.get(cand.isHome ? cand.teamId : cand.opponentId) || 1000;
        const awayPower = powerMap.get(cand.isHome ? cand.opponentId : cand.teamId) || 1000;
        const m = matches.find((m) => m.id === cand.matchId)!;
        const stage = m.stage;

        const probs = getMatchProbabilities(homePower, awayPower, stage);
        const winProb = cand.isHome ? probs.homeWin : probs.awayWin;

        // Future Value penalty (penalize using top-ranked teams in early rounds)
        const teamRank = rankMap.get(cand.teamId) || 16;
        const futureValueIndex = Math.max(0, (33 - teamRank) / 32); // Max 1.0 for #1 ranked team
        const roundDecay = R > 1 ? (R - 1 - rIdx) / (R - 1) : 0; // Decays to 0 in the final round
        const futureValuePenalty = futureValueIndex * roundDecay * fvWeight;

        // Overlap penalty: discourage picking the exact same team in the same round as other active paths to diversify risk
        const overlapCount = roundTeamPicksCount[roundName][cand.teamId] || 0;
        const overlapPenalty = overlapCount * overlapWeight;

        // Custom algorithmic bonus or adjustments:
        // Prioritize favorable matches where the opponent is substantially weaker
        const deltaPower = (powerMap.get(cand.teamId) || 1000) - (powerMap.get(cand.opponentId) || 1000);
        const relativePowerBonus = Math.max(0, deltaPower / 1000) * 0.1;

        // Seed-based pseudo-random perturbation to generate alternative pathways
        const perturbation = seed > 0
          ? Math.sin(cand.teamId.charCodeAt(0) * 17 + pathIdx * 31 + seed * 101) * 0.12
          : 0;

        // TOTAL OPTIMIZATION SCORE
        const score = winProb - futureValuePenalty - overlapPenalty + relativePowerBonus + perturbation;

        if (score > bestScore) {
          bestScore = score;
          bestCandidate = cand;
          calculatedWinProb = winProb;

          // Build explanation dynamically
          if (teamRank <= 4 && rIdx < 3) {
            calculatedReason = `Squadra élite (Ranking #${teamRank}). Scelta ad alto budget, ottima sicurezza ma consuma una risorsa chiave molto presto.`;
          } else if (teamRank >= 16) {
            calculatedReason = `Scelta strategica eccellente: si sfrutta una nazionale di fascia media (${cand.teamId}) contro un avversario debole, conservando i top club.`;
          } else if (winProb >= 0.75) {
            calculatedReason = `Match caldissimo: ${cand.teamId} parte con un vantaggio forza straordinario (+${Math.round(deltaPower)} punti) per questo round.`;
          } else {
            calculatedReason = `Ottimo compromesso tra probabilità di passaggio (${Math.round(winProb * 100)}%) ed economia del percorso a lungo termine.`;
          }
        }
      });

      if (bestCandidate) {
        const cand: typeof matchPlayers[0] = bestCandidate;
        const risk = calculatedWinProb >= 0.72 ? "basso" : calculatedWinProb >= 0.5 ? "medio" : "alto";

        choices.push({
          round: roundName,
          teamId: cand.teamId,
          opponentId: cand.opponentId,
          winProbability: calculatedWinProb,
          risk,
          reason: calculatedReason,
        });

        usedTeamsInPath.add(cand.teamId);
        roundTeamPicksCount[roundName][cand.teamId] =
          (roundTeamPicksCount[roundName][cand.teamId] || 0) + 1;
      }
    }

    // Now, determine if this path has been eliminated based on completed games
    choices.forEach((choice) => {
      const match = matches.find(
        (m) =>
          m.round === choice.round &&
          (m.homeTeamId === choice.teamId || m.awayTeamId === choice.teamId)
      );

      if (match) {
        const check = isChoiceSuccessful(match, choice.teamId);
        if (check.calculated && !check.success) {
          isPathEliminated = true;
          if (!eliminatedAt) {
            eliminatedAt = choice.round;
          }
        }
      }
    });

    paths.push({
      id: pathIdx,
      choices,
      isEliminated: isPathEliminated,
      eliminatedAtRound: eliminatedAt,
    });
  }

  return paths;
}
