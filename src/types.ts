/**
 * Types for Mondiale Survivor Simulator
 */

export interface Team {
  id: string; // e.g. "ARG"
  name: string; // e.g. "Argentina"
  flag: string; // Emoji flag if available, or just standard index
}

export interface TeamRanking {
  id: string; // Unique ranking id
  name: string; // Description like "Ranking FIFA", "My Rankings"
  teamIds: string[]; // Ordered list of team IDs (from index 0 = strongest to weakest)
  isActive?: boolean; // Whether the ranking is active for consolidations
}

export interface Match {
  id: string;
  round: string; // e.g. "Round 1", "Round 2", "Round 3", "Ottavi", "Quarti", "Semifinale", "Finale"
  homeTeamId: string;
  awayTeamId: string;
  stage: "gironi" | "eliminazione";
  homeScore?: number;
  awayScore?: number;
}

export interface SurvivorChoice {
  round: string;
  teamId: string;
  opponentId: string;
  winProbability: number; // e.g. 0.72 (72%)
  risk: "basso" | "medio" | "alto";
  reason: string;
}

export interface SurvivorPath {
  id: number; // 1 to 8
  choices: SurvivorChoice[]; // One choice per round
  isEliminated: boolean; // Has any completed round result in this path lost/drawn?
  eliminatedAtRound?: string; // Round where it was eliminated
}

// User-defined manual overrides or blocks
export interface PathLocks {
  [pathId: number]: {
    [round: string]: string; // teamId locked for this round in this path
  };
}
