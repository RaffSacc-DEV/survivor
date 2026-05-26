import React from "react";
import { Scale, Users, TrendingUp, Calendar, Zap, AlertTriangle } from "lucide-react";

export default function SurvivorRulesEngine() {
  return (
    <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-5" id="survivor-rules-engine">
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-100 mb-5 gap-2">
        <div>
          <h3 className="font-sans font-semibold text-lg text-slate-800 flex items-center gap-2">
            <Zap className="text-indigo-600 w-5 h-5 fill-indigo-100" />
            Survivor Algorithm & Rules Engine
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Approfondimento matematico ed euristico alla base dell'ottimizzazione dei percorsi.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 text-sm">
        {/* Card 1: Forza Squadre & Elo Rating */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2.5">
          <span className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 font-mono">
            <Scale className="w-4 h-4" /> 1. Modellazione Forza (Elo)
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            I giudizi delle classifiche inserite vengono normalizzati e convertiti in un rating di forza Elo che varia da <strong className="text-indigo-600 font-bold">500 (colonna debole)</strong> a <strong className="text-indigo-600 font-bold">1500 (super favorita)</strong>.
          </p>
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 font-mono flex flex-col gap-1 shadow-sm">
            <span className="text-indigo-600 font-bold">Risoluzione Probabilità di Vittoria:</span>
            <span>Delta = Forza_A - Forza_B</span>
            <span>P(A vince) = 1 / (1 + 10^(-Delta / 400))</span>
          </div>
        </div>

        {/* Card 2: Penalizzazione Valore Futuro */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2.5">
          <span className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 font-mono">
            <TrendingUp className="w-4 h-4" /> 2. Risparmio Forze Top
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Il sistema penalizza fortemente l'uso prematuro delle nazionali più forti (top seed 1-8) nei primi round del torneo, conservandoli per le fasi dove non restano altre alternative valide.
          </p>
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 font-mono flex flex-col gap-1 shadow-sm">
            <span className="text-indigo-600 font-bold">Penalità Futura Decrescente:</span>
            <span>Penalità = FV(Nazionale) * ((N_Rounds - Corrente) / N_Rounds) * Peso</span>
            <span className="text-slate-400">Decade a zero nella Finale</span>
          </div>
        </div>

        {/* Card 3: Massimizzazione Diversità dei Percorsi */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2.5">
          <span className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 font-mono">
            <Users className="w-4 h-4" /> 3. Copertura Complessiva
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Per sopravvivere con almeno un percorso fino alla fine, le scelte degli 8 percorsi vengono distribuite. Più un team viene selezionato nello stesso round, maggiore è la penalità stimata per le scelte parallele.
          </p>
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 font-mono flex flex-col gap-1 shadow-sm">
            <span className="text-indigo-600 font-bold">Distribuzione del Rischio Co-Selection:</span>
            <span>Se Percorso 1 sceglie ARG al Round 1, il punteggio di utilità di ARG diminuisce per il Percorso 2 nello stesso Round.</span>
          </div>
        </div>

        {/* Card 4: Regola Del Gioco del Survivor */}
        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex flex-col gap-2.5">
          <span className="font-bold text-slate-800 flex items-center gap-2 text-xs uppercase tracking-wider text-indigo-600 font-mono">
            <Calendar className="w-4 h-4" /> 4. Vincoli di Gioco
          </span>
          <p className="text-xs text-slate-600 leading-relaxed">
            Ogni percorso rappresenta una linea di gioco autonoma. Nel corso della stessa striscia, una squadra non può mai essere chiamata due volte. Un pareggio o una sconfitta interrompono la sopravvivenza.
          </p>
          <div className="bg-white border border-slate-200 p-2.5 rounded-lg text-[10px] text-slate-600 font-mono flex flex-col gap-1 shadow-sm">
            <span className="text-amber-600 font-bold flex items-center gap-1">
              <AlertTriangle className="w-3.5 h-3.5" /> Condizione K.O.
            </span>
            <span className="text-slate-600">
              Vittoria obbligatoria entro i tempi regolamentari per i gironi; passaggio turno per diretta.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
