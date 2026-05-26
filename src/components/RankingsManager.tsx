import React, { useState } from "react";
import { Team, TeamRanking } from "../types";
import { ArrowUp, ArrowDown, Trash2, Plus, Edit2, Check, Star, ChevronsUp, ChevronsDown } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

interface RankingsManagerProps {
  teams: Team[];
  rankings: TeamRanking[];
  onUpdateRankings: (newRankings: TeamRanking[]) => void;
}

export default function RankingsManager({
  teams,
  rankings,
  onUpdateRankings,
}: RankingsManagerProps) {
  const [selectedRankingId, setSelectedRankingId] = useState<string>(rankings[0]?.id || "");
  const [isCreating, setIsCreating] = useState(false);
  const [newRankingName, setNewRankingName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const activeRanking = rankings.find((r) => r.id === selectedRankingId) || rankings[0];

  React.useEffect(() => {
    if (activeRanking && selectedRankingId !== activeRanking.id) {
      setSelectedRankingId(activeRanking.id);
    }
  }, [activeRanking, selectedRankingId]);

  const handleCreateRanking = () => {
    if (!newRankingName.trim()) return;
    const newId = `custom_${Date.now()}`;
    const newRank: TeamRanking = {
      id: newId,
      name: newRankingName.trim(),
      teamIds: teams.map((t) => t.id), // Start with default team ordering
    };
    onUpdateRankings([...rankings, newRank]);
    setSelectedRankingId(newId);
    setNewRankingName("");
    setIsCreating(false);
  };

  const handleDeleteRanking = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (rankings.length <= 1) {
      alert("Devi mantenere almeno una classifica nel sistema.");
      return;
    }
    const updated = rankings.filter((r) => r.id !== id);
    onUpdateRankings(updated);
    if (selectedRankingId === id) {
      setSelectedRankingId(updated[0].id);
    }
  };

  const handleStartRename = (id: string, currentName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(id);
    setEditName(currentName);
  };

  const handleSaveRename = (id: string) => {
    if (!editName.trim()) return;
    const updated = rankings.map((r) => (r.id === id ? { ...r, name: editName.trim() } : r));
    onUpdateRankings(updated);
    setEditingId(null);
  };

  // Reordering functions
  const handleMoveTeam = (teamId: string, direction: "up" | "down" | "top" | "bottom") => {
    if (!activeRanking) return;
    const list = [...activeRanking.teamIds];
    const index = list.indexOf(teamId);
    if (index === -1) return;

    if (direction === "up" && index > 0) {
      // Swap with previous
      const temp = list[index];
      list[index] = list[index - 1];
      list[index - 1] = temp;
    } else if (direction === "down" && index < list.length - 1) {
      // Swap with next
      const temp = list[index];
      list[index] = list[index + 1];
      list[index + 1] = temp;
    } else if (direction === "top" && index > 0) {
      // Remove and insert at 0
      list.splice(index, 1);
      list.unshift(teamId);
    } else if (direction === "bottom" && index < list.length - 1) {
      // Remove and append at the end
      list.splice(index, 1);
      list.push(teamId);
    }

    const updatedRankings = rankings.map((r) =>
      r.id === selectedRankingId ? { ...r, teamIds: list } : r
    );
    onUpdateRankings(updatedRankings);
  };

  const handleToggleActive = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = rankings.map((r) => {
      if (r.id === id) {
        return { ...r, isActive: r.isActive === false ? true : false };
      }
      return r;
    });
    const activeCount = updated.filter((r) => r.isActive !== false).length;
    if (activeCount === 0) {
      alert("Devi mantenere attiva almeno una classifica nel sistema.");
      return;
    }
    onUpdateRankings(updated);
  };

  const handleMoveToRank = (teamId: string, targetRank: number) => {
    if (!activeRanking) return;
    const list = [...activeRanking.teamIds];
    const currentIndex = list.indexOf(teamId);
    if (currentIndex === -1) return;

    list.splice(currentIndex, 1);
    const targetIndex = Math.max(0, Math.min(list.length, targetRank - 1));
    list.splice(targetIndex, 0, teamId);

    const updatedRankings = rankings.map((r) =>
      r.id === selectedRankingId ? { ...r, teamIds: list } : r
    );
    onUpdateRankings(updatedRankings);
  };

  const handleCopyRankingFrom = (sourceId: string) => {
    const sourceRank = rankings.find((r) => r.id === sourceId);
    if (!sourceRank) return;

    if (isCreating) {
      // Create and select the new custom ranking immediately with the copied order
      const name = newRankingName.trim() || `Nuova Classifica (${sourceRank.name})`;
      const newId = `custom_${Date.now()}`;
      const newRank: TeamRanking = {
        id: newId,
        name: name,
        teamIds: [...sourceRank.teamIds],
        isActive: true,
      };
      onUpdateRankings([...rankings, newRank]);
      setSelectedRankingId(newId);
      setNewRankingName("");
      setIsCreating(false);
      return;
    }

    if (!activeRanking) return;
    const updatedRankings = rankings.map((r) =>
      r.id === selectedRankingId ? { ...r, teamIds: [...sourceRank.teamIds] } : r
    );
    onUpdateRankings(updatedRankings);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="rankings-manager">
      {/* Colonna di sinistra: Lista Classifiche */}
      <div className="lg:col-span-4 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col gap-4">
        <div className="flex justify-between items-center sm:pb-3 border-b border-slate-100">
          <h3 className="font-sans font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Star className="text-indigo-600 w-5 h-5 fill-indigo-100" />
            Classifiche Inserite
          </h3>
        </div>

        {/* Elenco Classifiche */}
        <div className="flex flex-col gap-2 overflow-y-auto max-h-[300px] lg:max-h-[500px] pr-1">
          {rankings.map((r) => {
            const isSelected = r.id === selectedRankingId;
            const isEditing = r.id === editingId;
            const isRankingActive = r.isActive !== false;

            return (
              <div
                key={r.id}
                id={`ranking-card-${r.id}`}
                onClick={() => setSelectedRankingId(r.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl cursor-pointer transition-all duration-200 border text-sm ${
                  isSelected
                    ? "bg-indigo-50/50 border-indigo-500/50 shadow-sm text-indigo-900 font-semibold"
                    : "bg-slate-50 border-slate-200 hover:bg-slate-100/70 text-slate-600 hover:text-slate-800"
                }`}
              >
                {/* Active Checkbox/Switch toggle bubble */}
                <button
                  type="button"
                  onClick={(e) => handleToggleActive(r.id, e)}
                  className={`mr-3.5 shrink-0 p-1 rounded-lg border flex items-center justify-center transition ${
                    isRankingActive
                      ? "bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-600 shadow-sm"
                      : "bg-white hover:bg-slate-50 text-slate-300 border-slate-250"
                  }`}
                  title={isRankingActive ? "Disattiva (Escludi dai calcoli)" : "Attiva (Includi nei calcoli)"}
                >
                  <Check className={`w-3.5 h-3.5 ${isRankingActive ? "stroke-[2.5px]" : "stroke-[1px]"}`} />
                </button>
                {isEditing ? (
                  <div className="flex items-center gap-2 w-full" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="bg-white border border-slate-350 text-slate-800 rounded px-2 py-1 text-xs w-full focus:outline-none focus:border-indigo-500"
                      maxLength={40}
                      autoFocus
                    />
                    <button
                      onClick={() => handleSaveRename(r.id)}
                      className="p-1 hover:bg-slate-150 text-indigo-600 rounded-md transition"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-0.5 min-w-0 pr-2">
                    <span className="font-semibold truncate text-slate-800">{r.name}</span>
                    <span className="text-[10px] text-slate-400">
                      {r.teamIds.length} squadre •{" "}
                      {r.id === "bookmakers" ? "Sorgente Predefinita" : "Utente"}
                    </span>
                  </div>
                )}

                {!isEditing && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleStartRename(r.id, r.name, e)}
                      className="p-1 hover:bg-slate-200/50 text-slate-500 hover:text-slate-700 rounded transition"
                      title="Rinomina"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {r.id !== "bookmakers" && (
                      <button
                        onClick={(e) => handleDeleteRanking(r.id, e)}
                        className="p-1 hover:bg-red-50 text-slate-500 hover:text-red-650 rounded transition"
                        title="Elimina"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Bottone Crea Nuova Classifica */}
        {isCreating ? (
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 flex flex-col gap-2 mt-auto shadow-inner">
            <span className="text-xs font-semibold text-slate-700">Nuova Classifica</span>
            <input
              type="text"
              placeholder="E.g., Il mio Pronostico"
              value={newRankingName}
              onChange={(e) => setNewRankingName(e.target.value)}
              className="bg-white border border-slate-300 text-slate-800 text-sm rounded-lg px-3 py-2 focus:outline-none focus:border-indigo-500"
              maxLength={40}
            />
            <div className="flex flex-col gap-1.5 mt-1 border-t border-slate-150 pt-2 bg-slate-100/30 p-2 rounded-lg">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Inizializza copiando subito da:</span>
              <button
                type="button"
                onClick={() => handleCopyRankingFrom("bookmakers")}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 hover:bg-indigo-50 hover:text-indigo-600 hover:border-indigo-200 rounded-lg text-[11px] font-bold transition text-slate-650 cursor-pointer shadow-sm hover:scale-[1.02] text-center"
              >
                Quote Bookmakers
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-1 border-t border-slate-100 pt-2">
              <button
                onClick={() => setIsCreating(false)}
                className="px-3 py-1.5 border border-slate-250 text-slate-500 rounded-lg text-xs hover:bg-white hover:border-slate-350 transition"
              >
                Annulla
              </button>
              <button
                onClick={handleCreateRanking}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold transition"
              >
                Aggiungi (Default)
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setIsCreating(true)}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-dashed border-slate-200 text-slate-500 hover:text-indigo-600 hover:border-indigo-400 hover:bg-indigo-50/40 transition duration-250 font-semibold text-xs mt-auto cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crea Nuova Classifica
          </button>
        )}
      </div>

      {/* Colonna di destra: Ordinamento Squadre nella classifica selezionata */}
      <div className="lg:col-span-8 bg-white border border-slate-200 shadow-sm rounded-2xl p-5 flex flex-col">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3.5 border-b border-slate-150 gap-2 mb-4">
          <div>
            <h3 className="font-sans font-semibold text-lg text-slate-800">
              Ordinamento: <span className="text-indigo-600">{activeRanking?.name}</span>
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Ordina le squadre. In alto la squadra considerata **più forte**, in basso la **più debole**.
            </p>
          </div>
          <span className="text-xs bg-slate-100 text-slate-600 font-mono py-1 px-2.5 rounded-full border border-slate-200 shrink-0 self-start">
            Fascia di Forza
          </span>
        </div>

        {/* Copy Order Panel for custom user-created rankings OR when creating a new ranking */}
        {(isCreating || (activeRanking &&
          activeRanking.id !== "bookmakers")) && (
            <div className="flex flex-wrap gap-2 items-center mb-4.5 p-3 bg-indigo-50/40 border border-indigo-150 rounded-2xl text-xs text-slate-650 shadow-sm animate-fade-in">
              <span className="font-semibold text-indigo-905">
                {isCreating ? "Crea e inizializza la nuova classifica da:" : "Inizializza ordine copiando da:"}
              </span>
              <button
                type="button"
                onClick={() => handleCopyRankingFrom("bookmakers")}
                className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-indigo-100 hover:text-indigo-700 hover:border-indigo-300 text-indigo-650 rounded-xl font-bold transition cursor-pointer shadow-sm text-[11px] hover:scale-[1.02]"
              >
                Bookmakers
              </button>
            </div>
          )}

        {/* Lista Squadre in classifica con comandi manuali di alta precisione */}
        <div className="overflow-y-auto max-h-[500px] flex flex-col gap-1.5 pr-2">
          {activeRanking?.teamIds.map((teamId, index) => {
            const team = teams.find((t) => t.id === teamId);
            if (!team) return null;

            // Simple tiering indicator based on ranking index
            let badgeColor = "bg-green-50 text-green-700 border-green-200/80 font-bold";
            let tierText = "Elite (Top)";
            if (index >= 8 && index < 16) {
              badgeColor = "bg-blue-50 text-blue-750 border-blue-200/80 font-semibold";
              tierText = "Fascia Alta";
            } else if (index >= 16 && index < 24) {
              badgeColor = "bg-amber-50 text-amber-800 border-amber-200/80";
              tierText = "Fascia Media";
            } else if (index >= 24) {
              badgeColor = "bg-red-50 text-red-750 border-red-200/80";
              tierText = "Fascia Bassa";
            }

            return (
              <div
                key={team.id}
                id={`ranking-team-row-${team.id}`}
                className="flex items-center justify-between py-2 px-3 bg-slate-50/70 border border-slate-200 rounded-xl hover:border-slate-350 transition duration-150 gap-4 shadow-[0_1px_2px_rgba(0,0,0,0.02)]"
              >
                {/* Info Squadra e Posizione */}
                <div className="flex items-center gap-3 min-w-0">
                  {/* Direct input for instant numeric reordering */}
                  <div className="flex items-center gap-1 shrink-0" title="Digita un numero per riordinare istantaneamente!">
                    <span className="text-[10px] text-slate-400 font-bold font-mono">#</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      value={index + 1}
                      onChange={(e) => {
                        const sanitizedValue = e.target.value.replace(/[^0-9]/g, "");
                        const val = parseInt(sanitizedValue, 10);
                        if (!isNaN(val) && val >= 1 && val <= activeRanking.teamIds.length) {
                          handleMoveToRank(team.id, val);
                        }
                      }}
                      className="w-10 text-center text-xs font-mono font-bold bg-white border border-slate-200 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 rounded-lg px-1 py-1 text-slate-700 focus:outline-none"
                    />
                  </div>
                  <span className="text-lg leading-none select-none shrink-0">{team.flag}</span>
                  <span className="font-semibold text-slate-800 text-sm truncate">{team.name}</span>
                  <span className="text-[10px] text-slate-500 font-mono shrink-0 font-semibold bg-white px-1.5 py-0.5 rounded border border-slate-200">
                    {team.id}
                  </span>
                </div>

                {/* Badge di Fascia d'Altezza e pulsanti ordinamento */}
                <div className="flex items-center gap-3 shrink-0">
                  <span
                    className={`text-[9.5px] uppercase tracking-wider font-bold px-2 py-0.5 rounded border ${badgeColor} hidden sm:inline-block`}
                  >
                    {tierText}
                  </span>

                  {/* Azioni di Ordinamento */}
                  <div className="flex items-center gap-1 bg-white border border-slate-200 p-0.5 rounded-lg shadow-sm">
                    {/* Top */}
                    <button
                      onClick={() => handleMoveTeam(team.id, "top")}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-50 text-slate-450 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-450 rounded transition cursor-pointer"
                      title="Sposta in cima"
                    >
                      <ChevronsUp className="w-3.5 h-3.5" />
                    </button>
                    {/* Up */}
                    <button
                      onClick={() => handleMoveTeam(team.id, "up")}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-50 text-slate-450 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-450 rounded transition cursor-pointer"
                      title="Sposta su"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    {/* Down */}
                    <button
                      onClick={() => handleMoveTeam(team.id, "down")}
                      disabled={index === activeRanking.teamIds.length - 1}
                      className="p-1 hover:bg-slate-50 text-slate-450 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-450 rounded transition cursor-pointer"
                      title="Sposta giù"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                    {/* Bottom */}
                    <button
                      onClick={() => handleMoveTeam(team.id, "bottom")}
                      disabled={index === activeRanking.teamIds.length - 1}
                      className="p-1 hover:bg-slate-50 text-slate-450 hover:text-indigo-600 disabled:opacity-20 disabled:hover:text-slate-450 rounded transition cursor-pointer"
                      title="Sposta in fondo"
                    >
                      <ChevronsDown className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
