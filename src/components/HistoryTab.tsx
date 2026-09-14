import React, { useState, useMemo } from "react";
import { WorkoutSession, Routine, Profile, ExerciseLog, SetLog } from "../types";
import { 
  Plus, 
  Clock, 
  Dumbbell, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  Calendar, 
  X, 
  Check, 
  Search, 
  AlertTriangle,
  Flame,
  Activity,
  Layers
} from "lucide-react";

interface HistoryTabProps {
  sessions: WorkoutSession[];
  setSessions: (sessions: WorkoutSession[]) => void;
  routines?: Routine[];
  profile?: Profile;
}

export default function HistoryTab({ 
  sessions, 
  setSessions, 
  routines = [],
  profile 
}: HistoryTabProps) {
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);
  const [isLoggingModalOpen, setIsLoggingModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // In-app delete confirmation state (NO window.confirm to guarantee compatibility in all iframes)
  const [sessionToDelete, setSessionToDelete] = useState<WorkoutSession | null>(null);
  const [isClearAllModalOpen, setIsClearAllModalOpen] = useState(false);

  // New session form state
  const [selectedRoutineId, setSelectedRoutineId] = useState<string>("");
  const [sessionRoutineName, setSessionRoutineName] = useState<string>("");
  const [sessionDate, setSessionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [sessionDurationMinutes, setSessionDurationMinutes] = useState<number>(50);
  
  // Exercises in the new session form
  interface FormExercise {
    id: string;
    name: string;
    sets: { weight: number; reps: number }[];
  }
  const [formExercises, setFormExercises] = useState<FormExercise[]>([]);
  const [newExNameInput, setNewExNameInput] = useState("");

  const toggleExpand = (id: string) => {
    setExpandedSessionId(expandedSessionId === id ? null : id);
  };

  // Helper to calculate total volume of a session (Weight * Reps)
  const calculateTotalVolume = (session: WorkoutSession): number => {
    return session.logs.reduce((totalVol, log) => {
      const exerciseVol = log.sets.reduce((setVol, set) => {
        if (set.isCompleted) {
          return setVol + (set.weight * set.reps);
        }
        return setVol;
      }, 0);
      return totalVol + exerciseVol;
    }, 0);
  };

  // Helper to calculate total reps in a session
  const calculateTotalReps = (session: WorkoutSession): number => {
    return session.logs.reduce((total, log) => {
      const exerciseReps = log.sets.reduce((setReps, set) => {
        if (set.isCompleted) {
          return setReps + set.reps;
        }
        return setReps;
      }, 0);
      return total + exerciseReps;
    }, 0);
  };

  // Trigger delete confirmation modal
  const handlePromptDelete = (session: WorkoutSession, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setSessionToDelete(session);
  };

  // Confirm delete of single session
  const handleConfirmDelete = () => {
    if (!sessionToDelete) return;
    const targetId = sessionToDelete.id;
    const updated = sessions.filter((s) => s.id !== targetId);
    setSessions(updated);
    if (expandedSessionId === targetId) {
      setExpandedSessionId(null);
    }
    setSessionToDelete(null);
  };

  // Confirm clearing all sessions
  const handleConfirmClearAll = () => {
    setSessions([]);
    setExpandedSessionId(null);
    setIsClearAllModalOpen(false);
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("es-ES", {
        weekday: "short",
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  // Open logging modal with smart pre-population
  const handleOpenLogModal = () => {
    setIsLoggingModalOpen(true);
    if (routines.length > 0) {
      const first = routines[0];
      setSelectedRoutineId(first.id);
      setSessionRoutineName(first.name);
      setFormExercises(
        first.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: Array.from({ length: ex.defaultSets || 3 }).map(() => ({
            weight: 0,
            reps: parseInt(ex.defaultReps) || 10
          }))
        }))
      );
    } else {
      setSelectedRoutineId("custom");
      setSessionRoutineName("Sesión Libre");
      setFormExercises([
        {
          id: "ex-1",
          name: "Press de Banca",
          sets: [
            { weight: 60, reps: 10 },
            { weight: 60, reps: 10 },
            { weight: 60, reps: 8 }
          ]
        }
      ]);
    }
  };

  // Change routine selection in log modal
  const handleRoutineSelect = (routineId: string) => {
    setSelectedRoutineId(routineId);
    if (routineId === "custom") {
      setSessionRoutineName("Sesión Personalizada");
      setFormExercises([]);
      return;
    }
    const found = routines.find(r => r.id === routineId);
    if (found) {
      setSessionRoutineName(found.name);
      setFormExercises(
        found.exercises.map(ex => ({
          id: ex.id,
          name: ex.name,
          sets: Array.from({ length: ex.defaultSets || 3 }).map(() => ({
            weight: 0,
            reps: parseInt(ex.defaultReps) || 10
          }))
        }))
      );
    }
  };

  // Add exercise to form
  const handleAddExerciseToForm = () => {
    if (!newExNameInput.trim()) return;
    setFormExercises([
      ...formExercises,
      {
        id: "ex-" + Date.now(),
        name: newExNameInput.trim(),
        sets: [
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 },
          { weight: 0, reps: 10 }
        ]
      }
    ]);
    setNewExNameInput("");
  };

  // Remove exercise from form
  const handleRemoveExerciseFromForm = (exId: string) => {
    setFormExercises(formExercises.filter(e => e.id !== exId));
  };

  // Update set in form
  const handleUpdateSet = (exIndex: number, setIndex: number, field: 'weight' | 'reps', val: number) => {
    const updated = [...formExercises];
    updated[exIndex].sets[setIndex][field] = Math.max(0, val);
    setFormExercises(updated);
  };

  // Quick increment/decrement helper for mobile friendliness
  const handleQuickAdjust = (exIndex: number, setIndex: number, field: 'weight' | 'reps', delta: number) => {
    const updated = [...formExercises];
    const current = updated[exIndex].sets[setIndex][field] || 0;
    updated[exIndex].sets[setIndex][field] = Math.max(0, Number((current + delta).toFixed(1)));
    setFormExercises(updated);
  };

  // Add set to exercise in form
  const handleAddSetToExercise = (exIndex: number) => {
    const updated = [...formExercises];
    const lastSet = updated[exIndex].sets[updated[exIndex].sets.length - 1];
    updated[exIndex].sets.push({
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || 10
    });
    setFormExercises(updated);
  };

  // Remove set from exercise in form
  const handleRemoveSetFromExercise = (exIndex: number, setIndex: number) => {
    const updated = [...formExercises];
    if (updated[exIndex].sets.length > 1) {
      updated[exIndex].sets.splice(setIndex, 1);
      setFormExercises(updated);
    }
  };

  // Save new session
  const handleSaveSession = () => {
    if (formExercises.length === 0) {
      return;
    }

    const logs: ExerciseLog[] = formExercises.map(fe => ({
      exerciseId: fe.id,
      exerciseName: fe.name,
      sets: fe.sets.map((s, idx) => ({
        id: `set-${fe.id}-${idx}-${Date.now()}`,
        weight: Number(s.weight) || 0,
        reps: Number(s.reps) || 0,
        isCompleted: true
      }))
    }));

    const newSession: WorkoutSession = {
      id: "session-" + Date.now(),
      routineId: selectedRoutineId,
      routineName: sessionRoutineName || "Sesión Registrada",
      date: sessionDate ? new Date(sessionDate).toISOString() : new Date().toISOString(),
      durationSeconds: (sessionDurationMinutes || 45) * 60,
      logs
    };

    setSessions([newSession, ...sessions]);
    setIsLoggingModalOpen(false);
  };

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    const sorted = [...sessions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (!searchTerm.trim()) return sorted;
    const term = searchTerm.toLowerCase();
    return sorted.filter(s => 
      s.routineName.toLowerCase().includes(term) ||
      s.logs.some(l => l.exerciseName.toLowerCase().includes(term))
    );
  }, [sessions, searchTerm]);

  // Overall aggregate stats for header bar
  const totalVolumeAll = useMemo(() => {
    return sessions.reduce((acc, s) => acc + calculateTotalVolume(s), 0);
  }, [sessions]);

  const totalSetsAll = useMemo(() => {
    return sessions.reduce((acc, s) => {
      return acc + s.logs.reduce((sub, l) => sub + l.sets.filter(st => st.isCompleted).length, 0);
    }, 0);
  }, [sessions]);

  return (
    <div className="space-y-6 pb-24 md:pb-12 max-w-full">
      
      {/* Header with Actions */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Control de Sesiones</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">Historial de Entrenamientos</h2>
        </div>
        <div className="flex items-center gap-2">
          {sessions.length > 0 && (
            <button
              onClick={() => setIsClearAllModalOpen(true)}
              className="px-3.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 hover:text-black rounded-full text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
              title="Vaciar todo el historial"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Vaciar</span>
            </button>
          )}
          <button
            onClick={handleOpenLogModal}
            className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Registrar Sesión
          </button>
        </div>
      </div>

      {/* Global Stats Ribbon - Responsive for PC & Mobile */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Sesiones</span>
            </div>
            <p className="text-xl font-black text-black font-mono">{sessions.length}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Flame className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Carga Total</span>
            </div>
            <p className="text-xl font-black text-black font-mono">
              {totalVolumeAll.toLocaleString()} <span className="text-xs font-normal text-zinc-500">{profile?.unit || 'kg'}</span>
            </p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Layers className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Series Hechas</span>
            </div>
            <p className="text-xl font-black text-black font-mono">{totalSetsAll}</p>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-zinc-200 shadow-2xs">
            <div className="flex items-center gap-2 text-zinc-400 mb-1">
              <Activity className="w-3.5 h-3.5" />
              <span className="text-[10px] uppercase font-bold tracking-wider">Último Registro</span>
            </div>
            <p className="text-xs font-bold text-black truncate capitalize pt-1">
              {formatDate(sessions[0]?.date || "")}
            </p>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {sessions.length > 2 && (
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Buscar por rutina o ejercicio..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-white border border-zinc-200 rounded-2xl text-xs font-medium text-black focus:outline-none focus:ring-2 focus:ring-black shadow-2xs"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-black p-1"
            >
              ×
            </button>
          )}
        </div>
      )}

      {/* Sessions list */}
      <div className="space-y-3.5">
        {filteredSessions.map((session) => {
          const isExpanded = expandedSessionId === session.id;
          const volume = calculateTotalVolume(session);
          const totalReps = calculateTotalReps(session);

          return (
            <div
              key={session.id}
              className="bg-white rounded-2xl sm:rounded-3xl border border-zinc-200 shadow-2xs overflow-hidden transition-all hover:border-zinc-300"
            >
              {/* Card Header Info */}
              <div 
                onClick={() => toggleExpand(session.id)}
                className="p-4 sm:p-5 flex items-center justify-between cursor-pointer gap-3"
              >
                <div className="space-y-1.5 min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-[9px] font-bold text-white uppercase tracking-wider bg-black px-2.5 py-0.5 rounded-full">
                      {session.routineName}
                    </span>
                    <span className="text-xs text-zinc-400 font-semibold flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {Math.floor(session.durationSeconds / 60)} min
                    </span>
                  </div>
                  
                  <h3 className="font-bold text-black text-sm capitalize truncate tracking-tight">
                    {formatDate(session.date)}
                  </h3>
                </div>

                <div className="flex items-center gap-3 sm:gap-4 shrink-0">
                  {/* Volume Summary */}
                  <div className="text-right">
                    <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Volumen</span>
                    <p className="text-xs sm:text-sm font-bold text-black font-mono">
                      {volume.toLocaleString()} {profile?.unit || 'kg'}
                    </p>
                  </div>

                  {/* Explicit DELETE Button - Completely functional in all iframe/browser environments */}
                  <button
                    onClick={(e) => handlePromptDelete(session, e)}
                    className="p-2 sm:p-2.5 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 transition-colors cursor-pointer active:scale-95"
                    title="Eliminar este registro"
                    aria-label="Eliminar sesión"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="p-1 text-zinc-400">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>
              </div>

              {/* Expand details */}
              {isExpanded && (
                <div className="border-t border-zinc-200 p-4 sm:p-5 bg-zinc-50/70 rounded-b-2xl sm:rounded-b-3xl space-y-4">
                  
                  {/* Session Tonnage Stats */}
                  <div className="grid grid-cols-3 gap-2 py-2.5 px-3 bg-white rounded-xl border border-zinc-200 text-center">
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Carga Total</span>
                      <p className="text-xs sm:text-sm font-bold text-black font-mono mt-0.5">{volume.toLocaleString()} {profile?.unit || 'kg'}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Reps Hechas</span>
                      <p className="text-xs sm:text-sm font-bold text-black font-mono mt-0.5">{totalReps}</p>
                    </div>
                    <div>
                      <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider">Ejercicios</span>
                      <p className="text-xs sm:text-sm font-bold text-black mt-0.5">{session.logs.length}</p>
                    </div>
                  </div>

                  {/* Exercises and sets log details - Responsive Grid for PC and Mobile */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {session.logs.map((log) => {
                      const completedSets = log.sets.filter(s => s.isCompleted);
                      if (completedSets.length === 0) return null;

                      return (
                        <div key={log.exerciseId} className="space-y-2 bg-white p-3.5 rounded-2xl border border-zinc-200 shadow-2xs">
                          <h4 className="text-xs font-bold text-black flex items-center gap-1.5 tracking-tight">
                            <Dumbbell className="w-3.5 h-3.5 text-zinc-500" />
                            {log.exerciseName}
                          </h4>
                          
                          <div className="flex flex-wrap gap-1.5 pt-1">
                            {completedSets.map((set, sIdx) => (
                              <div
                                key={set.id}
                                className="px-2.5 py-1 bg-zinc-50 rounded-lg border border-zinc-200 text-[11px] font-medium text-black font-mono"
                              >
                                S{sIdx + 1}: <strong className="font-bold">{set.weight} {profile?.unit || 'kg'}</strong> × <strong>{set.reps} reps</strong>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Quick card action bar */}
                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() => handlePromptDelete(session)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Eliminar Registro
                    </button>
                  </div>

                </div>
              )}
            </div>
          );
        })}

        {filteredSessions.length === 0 && (
          <div className="text-center py-12 bg-white border border-zinc-200 rounded-3xl p-8 space-y-4 shadow-sm">
            <div className="w-12 h-12 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-black border border-zinc-200">
              <Calendar className="w-6 h-6 stroke-[1.75]" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-black">
                {searchTerm ? "No se encontraron sesiones con ese término" : "Sin registros de sesiones"}
              </h3>
              <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
                {searchTerm ? "Prueba buscando otra rutina o limpia el filtro." : "Anota los pesos y repeticiones que hiciste para llevar el control de tus levantamientos."}
              </p>
            </div>
            {!searchTerm && (
              <button
                onClick={handleOpenLogModal}
                className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Registrar Primera Sesión
              </button>
            )}
          </div>
        )}
      </div>

      {/* ========================================================================= */}
      {/* --- IN-APP MODAL: CONFIRM SINGLE SESSION DELETION (NO WINDOW.CONFIRM) --- */}
      {/* ========================================================================= */}
      {sessionToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setSessionToDelete(null)}
        >
          <div 
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black">¿Eliminar registro de sesión?</h3>
                <p className="text-xs text-zinc-500">Esta acción no se puede deshacer.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs space-y-1">
              <p className="font-bold text-black capitalize">{sessionToDelete.routineName}</p>
              <p className="text-zinc-500 font-medium">Fecha: {formatDate(sessionToDelete.date)}</p>
              <p className="text-zinc-500 font-mono">
                Carga: {calculateTotalVolume(sessionToDelete).toLocaleString()} {profile?.unit || 'kg'} • {sessionToDelete.logs.length} ejercicios
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setSessionToDelete(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDelete}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Eliminar Registro
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- IN-APP MODAL: CONFIRM CLEAR ALL SESSIONS --- */}
      {/* ========================================================================= */}
      {isClearAllModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsClearAllModalOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black">¿Vaciar todo el historial?</h3>
                <p className="text-xs text-zinc-500">Se borrarán todas las {sessions.length} sesiones registradas.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Tus rutinas permanecerán intactas, pero se eliminará el registro histórico de pesos y levantamientos.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsClearAllModalOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmClearAll}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Sí, Vaciar Todo
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* --- MODAL FOR REGISTERING A SESSION (RESPONSIVE PC & MOBILE) --- */}
      {/* ========================================================================= */}
      {isLoggingModalOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsLoggingModalOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-2xl rounded-3xl border border-zinc-200 p-5 sm:p-6 space-y-5 shadow-2xl max-h-[90vh] flex flex-col my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3 flex-shrink-0">
              <div>
                <h3 className="font-black text-black text-lg tracking-tight">Registrar Sesión</h3>
                <p className="text-xs text-zinc-400 font-medium">Anota el peso levantado y repeticiones por serie</p>
              </div>
              <button
                onClick={() => setIsLoggingModalOpen(false)}
                className="p-1.5 text-zinc-400 hover:text-black rounded-xl hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="flex-1 overflow-y-auto space-y-4 pr-1">
              
              {/* Routine Selector, Date & Duration */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-1">
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Rutina
                  </label>
                  <select
                    value={selectedRoutineId}
                    onChange={(e) => handleRoutineSelect(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                  >
                    {routines.map((r) => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                    <option value="custom">Sesión Personalizada / Libre</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    value={sessionDate}
                    onChange={(e) => setSessionDate(e.target.value)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Duración (min)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="300"
                    value={sessionDurationMinutes}
                    onChange={(e) => setSessionDurationMinutes(parseInt(e.target.value) || 45)}
                    className="w-full px-3 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              </div>

              {selectedRoutineId === "custom" && (
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">
                    Nombre de la Sesión
                  </label>
                  <input
                    type="text"
                    value={sessionRoutineName}
                    onChange={(e) => setSessionRoutineName(e.target.value)}
                    placeholder="ej. Día de Pecho y Tríceps"
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                </div>
              )}

              {/* Exercises List in Form */}
              <div className="space-y-4 pt-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Ejercicios y Series ({formExercises.length})
                  </span>
                </div>

                {formExercises.map((ex, exIdx) => (
                  <div key={ex.id} className="p-4 bg-zinc-50 border border-zinc-200 rounded-2xl space-y-3">
                    <div className="flex justify-between items-center">
                      <p className="font-bold text-xs sm:text-sm text-black">{ex.name}</p>
                      <button
                        onClick={() => handleRemoveExerciseFromForm(ex.id)}
                        className="text-[10px] font-bold text-zinc-400 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        Quitar
                      </button>
                    </div>

                    {/* Sets headers */}
                    <div className="grid grid-cols-12 gap-2 text-[9px] font-bold text-zinc-400 uppercase text-center px-1">
                      <div className="col-span-2 text-left">Serie</div>
                      <div className="col-span-5">Peso ({profile?.unit || 'kg'})</div>
                      <div className="col-span-4">Reps</div>
                      <div className="col-span-1"></div>
                    </div>

                    {/* Sets rows */}
                    <div className="space-y-2">
                      {ex.sets.map((set, sIdx) => (
                        <div key={sIdx} className="grid grid-cols-12 gap-2 items-center">
                          <div className="col-span-2 text-xs font-mono font-bold text-zinc-500 pl-1">
                            S{sIdx + 1}
                          </div>
                          
                          {/* Weight with quick buttons */}
                          <div className="col-span-5 flex items-center gap-1">
                            <input
                              type="number"
                              step="0.5"
                              value={set.weight || ""}
                              placeholder="0"
                              onChange={(e) => handleUpdateSet(exIdx, sIdx, 'weight', parseFloat(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-black text-center focus:outline-none focus:ring-1 focus:ring-black"
                            />
                            <div className="hidden sm:flex flex-col gap-0.5">
                              <button
                                type="button"
                                onClick={() => handleQuickAdjust(exIdx, sIdx, 'weight', 2.5)}
                                className="text-[8px] bg-zinc-200 hover:bg-zinc-300 px-1 rounded font-bold cursor-pointer"
                                title="+2.5 kg"
                              >
                                +2.5
                              </button>
                            </div>
                          </div>

                          {/* Reps with quick buttons */}
                          <div className="col-span-4 flex items-center gap-1">
                            <input
                              type="number"
                              value={set.reps || ""}
                              placeholder="0"
                              onChange={(e) => handleUpdateSet(exIdx, sIdx, 'reps', parseInt(e.target.value) || 0)}
                              className="w-full px-2 py-1.5 bg-white border border-zinc-200 rounded-lg text-xs font-mono font-bold text-black text-center focus:outline-none focus:ring-1 focus:ring-black"
                            />
                          </div>

                          <div className="col-span-1 text-right">
                            {ex.sets.length > 1 && (
                              <button
                                onClick={() => handleRemoveSetFromExercise(exIdx, sIdx)}
                                className="text-zinc-400 hover:text-black p-1 text-xs cursor-pointer"
                                title="Quitar serie"
                              >
                                ×
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      onClick={() => handleAddSetToExercise(exIdx)}
                      className="text-[11px] font-bold text-black hover:underline cursor-pointer pt-1 inline-flex items-center gap-1"
                    >
                      + Añadir Serie
                    </button>
                  </div>
                ))}

                {/* Add new exercise field */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    placeholder="Nombre de otro ejercicio (ej. Fondos, Sentadilla)..."
                    value={newExNameInput}
                    onChange={(e) => setNewExNameInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleAddExerciseToForm();
                    }}
                    className="flex-1 px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black"
                  />
                  <button
                    onClick={handleAddExerciseToForm}
                    disabled={!newExNameInput.trim()}
                    className="px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-black rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    Añadir
                  </button>
                </div>
              </div>

            </div>

            {/* Modal Footer */}
            <div className="border-t border-zinc-200 pt-3 flex gap-2 justify-end flex-shrink-0">
              <button
                onClick={() => setIsLoggingModalOpen(false)}
                className="px-4 py-2.5 text-xs font-bold text-zinc-500 hover:text-black cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSession}
                disabled={formExercises.length === 0}
                className="px-6 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm disabled:opacity-30"
              >
                Guardar Sesión
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
