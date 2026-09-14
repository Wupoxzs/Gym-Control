import React, { useState } from "react";
import { Routine, Exercise } from "../types";
import { Plus, Trash2, Edit2, Check, X, Dumbbell, ChevronDown, ChevronUp, Copy, Star, Layers } from "lucide-react";

interface RoutinesTabProps {
  routines: Routine[];
  setRoutines: (routines: Routine[]) => void;
  activeRoutineId?: string;
  setActiveRoutineId: (id: string) => void;
}

const MUSCLE_GROUPS = [
  "Pecho", "Dorsal", "Hombros", "Bíceps", "Tríceps", 
  "Cuádriceps", "Isquiotibiales", "Glúteos", "Gemelos", "Core", "Completo"
];

export default function RoutinesTab({
  routines,
  setRoutines,
  activeRoutineId,
  setActiveRoutineId
}: RoutinesTabProps) {
  const [editingRoutineId, setEditingRoutineId] = useState<string | null>(null);
  const [expandedRoutineId, setExpandedRoutineId] = useState<string | null>(null);
  
  // In-app delete confirmation state (NO window.confirm)
  const [routineToDelete, setRoutineToDelete] = useState<Routine | null>(null);

  // States for creating a routine
  const [isCreatingRoutine, setIsCreatingRoutine] = useState(false);
  const [newRoutineName, setNewRoutineName] = useState("");
  const [newRoutineType, setNewRoutineType] = useState<'push' | 'pull' | 'legs' | 'upper' | 'lower' | 'custom'>("custom");

  // States for editing a routine
  const [tempRoutineName, setTempRoutineName] = useState("");
  const [tempExercises, setTempExercises] = useState<Exercise[]>([]);

  // States for adding a new exercise to tempExercises
  const [newExName, setNewExName] = useState("");
  const [newExMuscle, setNewExMuscle] = useState("Pecho");
  const [newExSets, setNewExSets] = useState(3);
  const [newExReps, setNewExReps] = useState("8-12");

  // Toggle expand
  const toggleExpand = (id: string) => {
    setExpandedRoutineId(expandedRoutineId === id ? null : id);
  };

  // Start editing a routine
  const handleStartEdit = (routine: Routine) => {
    setEditingRoutineId(routine.id);
    setTempRoutineName(routine.name);
    setTempExercises([...routine.exercises]);
    setExpandedRoutineId(routine.id);
  };

  // Cancel editing
  const handleCancelEdit = () => {
    setEditingRoutineId(null);
    setNewExName("");
  };

  // Save edited routine
  const handleSaveEdit = (id: string) => {
    if (!tempRoutineName.trim()) return;
    
    const updatedRoutines = routines.map((r) => {
      if (r.id === id) {
        return {
          ...r,
          name: tempRoutineName.trim(),
          exercises: tempExercises
        };
      }
      return r;
    });

    setRoutines(updatedRoutines);
    setEditingRoutineId(null);
    setNewExName("");
  };

  // Add exercise to the temporary list of the routine being edited
  const handleAddTempExercise = () => {
    if (!newExName.trim()) return;
    
    const newExercise: Exercise = {
      id: "ex-" + Date.now(),
      name: newExName.trim(),
      targetMuscle: newExMuscle,
      defaultSets: newExSets,
      defaultReps: newExReps
    };

    setTempExercises([...tempExercises, newExercise]);
    setNewExName("");
    setNewExSets(3);
    setNewExReps("8-12");
  };

  // Remove exercise from the temporary list
  const handleRemoveTempExercise = (id: string) => {
    setTempExercises(tempExercises.filter((ex) => ex.id !== id));
  };

  // Create entirely new routine
  const handleCreateRoutine = () => {
    if (!newRoutineName.trim()) return;

    const newRoutine: Routine = {
      id: "routine-" + Date.now(),
      name: newRoutineName.trim(),
      type: newRoutineType,
      exercises: []
    };

    const updated = [...routines, newRoutine];
    setRoutines(updated);
    if (!activeRoutineId) {
      setActiveRoutineId(newRoutine.id);
    }
    setNewRoutineName("");
    setIsCreatingRoutine(false);
    setEditingRoutineId(newRoutine.id);
    setTempRoutineName(newRoutine.name);
    setTempExercises([]);
    setExpandedRoutineId(newRoutine.id);
  };

  // Duplicate a routine
  const handleDuplicateRoutine = (routine: Routine) => {
    const duplicated: Routine = {
      ...routine,
      id: "routine-" + Date.now(),
      name: `${routine.name} (Copia)`,
      exercises: routine.exercises.map(ex => ({ ...ex, id: "ex-" + Math.random().toString(36).substring(2, 9) }))
    };
    setRoutines([...routines, duplicated]);
    setExpandedRoutineId(duplicated.id);
  };

  // Confirm delete routine
  const handleConfirmDeleteRoutine = () => {
    if (!routineToDelete) return;
    const targetId = routineToDelete.id;
    const filtered = routines.filter((r) => r.id !== targetId);
    setRoutines(filtered);
    if (activeRoutineId === targetId) {
      setActiveRoutineId(filtered[0]?.id || "");
    }
    if (expandedRoutineId === targetId) {
      setExpandedRoutineId(null);
    }
    setRoutineToDelete(null);
  };

  return (
    <div className="space-y-6 pb-20 max-w-full">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mb-1">Tus Rutinas</p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-black">Mis Rutinas</h2>
        </div>
        {!isCreatingRoutine && (
          <button
            onClick={() => setIsCreatingRoutine(true)}
            className="flex items-center justify-center gap-1.5 px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
            Nueva Rutina
          </button>
        )}
      </div>

      {/* Routine Creator Form */}
      {isCreatingRoutine && (
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-zinc-200 shadow-sm space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-black text-base tracking-tight">Crear Nueva Rutina</h3>
            <button 
              onClick={() => setIsCreatingRoutine(false)} 
              className="p-1 text-zinc-400 hover:text-black cursor-pointer rounded-lg hover:bg-zinc-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Nombre de la Rutina
              </label>
              <input
                type="text"
                placeholder="ej. Push / Empuje, Pecho y Bíceps, Pierna Fuerza..."
                value={newRoutineName}
                onChange={(e) => setNewRoutineName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black text-black"
                autoFocus
              />
            </div>
            
            <div>
              <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1.5">
                Enfoque o Categoría
              </label>
              <select
                value={newRoutineType}
                onChange={(e: any) => setNewRoutineType(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black text-black cursor-pointer"
              >
                <option value="custom">Personalizado (Custom)</option>
                <option value="push">Empuje (Push)</option>
                <option value="pull">Tracción (Pull)</option>
                <option value="legs">Pierna (Legs)</option>
                <option value="upper">Torso / Superior (Upper)</option>
                <option value="lower">Pierna / Inferior (Lower)</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2 justify-end pt-2 text-xs">
            <button
              onClick={() => setIsCreatingRoutine(false)}
              className="px-4 py-2 font-semibold text-zinc-500 hover:text-black cursor-pointer"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreateRoutine}
              disabled={!newRoutineName.trim()}
              className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full font-bold disabled:opacity-30 transition-all cursor-pointer shadow-sm"
            >
              Crear y Agregar Ejercicios
            </button>
          </div>
        </div>
      )}

      {/* Empty State when user has no routines */}
      {routines.length === 0 && !isCreatingRoutine && (
        <div className="bg-white rounded-3xl border border-zinc-200 p-8 sm:p-12 text-center space-y-4 shadow-sm">
          <div className="w-14 h-14 rounded-2xl bg-zinc-100 flex items-center justify-center mx-auto text-black border border-zinc-200">
            <Dumbbell className="w-7 h-7 stroke-[1.75]" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-black tracking-tight">Sin rutinas todavía</h3>
            <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
              Tu sección de rutinas está completamente en blanco para que puedas crear y personalizar tus propios días de entrenamiento con los ejercicios, series y repeticiones que decidas.
            </p>
          </div>
          <button
            onClick={() => setIsCreatingRoutine(true)}
            className="inline-flex items-center gap-2 px-5 py-3 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Crear Primera Rutina
          </button>
        </div>
      )}

      {/* Routines Card List */}
      <div className="space-y-4 pb-12">
        {routines.map((routine) => {
          const isEditing = editingRoutineId === routine.id;
          const isExpanded = expandedRoutineId === routine.id;
          const isActive = activeRoutineId === routine.id;

          return (
            <div
              key={routine.id}
              className={`bg-white rounded-3xl border transition-all shadow-2xs ${
                isActive 
                  ? "border-black ring-1 ring-black/15" 
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
            >
              {/* Card Header */}
              <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                <div 
                  onClick={() => !isEditing && toggleExpand(routine.id)}
                  className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                >
                  <div className={`p-2.5 sm:p-3 rounded-2xl border shrink-0 ${
                    isActive 
                      ? "bg-black text-white border-black" 
                      : "bg-zinc-100 text-black border-zinc-200"
                  }`}>
                    <Dumbbell className="w-4 h-4 sm:w-5 sm:h-5 stroke-[2]" />
                  </div>
                  
                  <div className="min-w-0">
                    {isEditing ? (
                      <input
                        type="text"
                        value={tempRoutineName}
                        onChange={(e) => setTempRoutineName(e.target.value)}
                        className="font-bold text-black text-sm bg-zinc-50 border border-zinc-200 px-2.5 py-1 rounded-xl focus:outline-none focus:ring-2 focus:ring-black"
                        placeholder="Nombre de la rutina"
                      />
                    ) : (
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-bold text-black text-sm sm:text-base truncate tracking-tight">{routine.name}</h3>
                        {isActive && (
                          <span className="inline-block text-[9px] px-2 py-0.5 bg-black text-white rounded-full font-bold uppercase tracking-wider">
                            Principal
                          </span>
                        )}
                        <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider bg-zinc-100 px-2 py-0.5 rounded-md border border-zinc-200">
                          {routine.type}
                        </span>
                      </div>
                    )}
                    <p className="text-xs text-zinc-500 font-medium mt-0.5">
                      {isEditing ? tempExercises.length : routine.exercises.length} ejercicios registrados
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1 shrink-0">
                  {!isEditing && (
                    <>
                      <button
                        onClick={() => setActiveRoutineId(routine.id)}
                        className={`p-2 rounded-xl transition-colors cursor-pointer ${
                          isActive 
                            ? "text-black bg-zinc-100" 
                            : "text-zinc-400 hover:text-black hover:bg-zinc-100"
                        }`}
                        title={isActive ? "Rutina Principal" : "Marcar como Principal"}
                      >
                        <Star className={`w-4 h-4 ${isActive ? "fill-black" : ""}`} />
                      </button>
                      <button
                        onClick={() => handleDuplicateRoutine(routine)}
                        className="p-2 text-zinc-400 hover:text-black rounded-xl hover:bg-zinc-100 cursor-pointer transition-colors"
                        title="Duplicar"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleStartEdit(routine)}
                        className="p-2 text-zinc-400 hover:text-black rounded-xl hover:bg-zinc-100 cursor-pointer transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setRoutineToDelete(routine)}
                        className="p-2 text-zinc-400 hover:text-red-600 rounded-xl hover:bg-red-50 cursor-pointer transition-colors"
                        title="Eliminar Rutina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  {isEditing && (
                    <>
                      <button
                        onClick={() => handleSaveEdit(routine.id)}
                        className="p-2 text-black hover:bg-zinc-100 rounded-xl cursor-pointer"
                        title="Guardar Cambios"
                      >
                        <Check className="w-4.5 h-4.5 stroke-[2.5]" />
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="p-2 text-zinc-400 hover:text-black rounded-xl cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-4.5 h-4.5" />
                      </button>
                    </>
                  )}

                  <button
                    onClick={() => toggleExpand(routine.id)}
                    className="p-2 text-zinc-400 hover:text-black rounded-xl cursor-pointer"
                  >
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Collapsed / Expanded Content */}
              {isExpanded && (
                <div className="border-t border-zinc-200 p-4 sm:p-5 bg-zinc-50/70 rounded-b-3xl space-y-4">
                  
                  {/* Exercises List in routine */}
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                      Ejercicios de la Rutina
                    </span>

                    {/* Non-editing mode list */}
                    {!isEditing && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                        {routine.exercises.map((ex, idx) => (
                          <div 
                            key={ex.id}
                            className="flex items-center justify-between p-3 bg-white rounded-2xl border border-zinc-200 text-xs shadow-2xs"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-mono font-bold shrink-0">
                                {idx + 1}
                              </span>
                              <div className="min-w-0">
                                <p className="font-bold text-black truncate">{ex.name}</p>
                                <span className="text-[10px] text-zinc-400 font-semibold">{ex.targetMuscle}</span>
                              </div>
                            </div>
                            <div className="text-right font-mono text-[11px] font-bold text-black shrink-0 pl-2">
                              {ex.defaultSets} × {ex.defaultReps}
                            </div>
                          </div>
                        ))}

                        {routine.exercises.length === 0 && (
                          <div className="col-span-full py-6 text-center text-xs text-zinc-500 bg-white rounded-2xl border border-zinc-200">
                            Aún no hay ejercicios agregados a esta rutina. Pulsa "Editar" para añadir tus ejercicios.
                          </div>
                        )}
                      </div>
                    )}

                    {/* Editing mode list */}
                    {isEditing && (
                      <div className="space-y-3">
                        <div className="space-y-2">
                          {tempExercises.map((ex, idx) => (
                            <div 
                              key={ex.id}
                              className="flex items-center justify-between p-3 bg-white rounded-2xl border border-zinc-200 text-xs"
                            >
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full bg-zinc-100 text-zinc-600 flex items-center justify-center text-[10px] font-mono font-bold">
                                  {idx + 1}
                                </span>
                                <div>
                                  <p className="font-bold text-black">{ex.name}</p>
                                  <span className="text-[10px] text-zinc-400">{ex.targetMuscle}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span className="font-mono text-xs font-bold text-black">{ex.defaultSets} × {ex.defaultReps}</span>
                                <button
                                  onClick={() => handleRemoveTempExercise(ex.id)}
                                  className="text-zinc-400 hover:text-red-600 p-1 cursor-pointer"
                                  title="Quitar ejercicio"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Add exercise form inside edit mode */}
                        <div className="p-4 bg-white rounded-2xl border border-zinc-200 space-y-3 shadow-2xs">
                          <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider block">
                            Agregar Ejercicio
                          </span>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                            <div className="sm:col-span-2">
                              <input
                                type="text"
                                placeholder="Nombre (ej. Press Militar, Dominadas)"
                                value={newExName}
                                onChange={(e) => setNewExName(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black text-black"
                              />
                            </div>
                            <div>
                              <select
                                value={newExMuscle}
                                onChange={(e) => setNewExMuscle(e.target.value)}
                                className="w-full px-3 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold text-black focus:outline-none focus:ring-2 focus:ring-black cursor-pointer"
                              >
                                {MUSCLE_GROUPS.map((m) => (
                                  <option key={m} value={m}>{m}</option>
                                ))}
                              </select>
                            </div>
                            <div className="flex gap-2">
                              <input
                                type="number"
                                min="1"
                                max="10"
                                value={newExSets}
                                onChange={(e) => setNewExSets(parseInt(e.target.value) || 3)}
                                title="Series"
                                placeholder="Series"
                                className="w-1/2 px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-center text-black"
                              />
                              <input
                                type="text"
                                value={newExReps}
                                onChange={(e) => setNewExReps(e.target.value)}
                                title="Reps"
                                placeholder="Reps"
                                className="w-1/2 px-2 py-2 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold text-center text-black"
                              />
                            </div>
                          </div>

                          <div className="flex justify-end">
                            <button
                              onClick={handleAddTempExercise}
                              disabled={!newExName.trim()}
                              className="px-4 py-2 bg-zinc-100 hover:bg-zinc-200 border border-zinc-200 text-black rounded-xl text-xs font-bold disabled:opacity-40 transition-colors cursor-pointer"
                            >
                              + Añadir a la Lista
                            </button>
                          </div>
                        </div>

                        <div className="flex justify-end pt-2">
                          <button
                            onClick={() => handleSaveEdit(routine.id)}
                            className="px-5 py-2.5 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all cursor-pointer shadow-sm"
                          >
                            Guardar Cambios de Rutina
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* In-app Delete Routine Confirmation Modal (NO window.confirm) */}
      {routineToDelete && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setRoutineToDelete(null)}
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
                <h3 className="font-bold text-base text-black">¿Eliminar esta rutina?</h3>
                <p className="text-xs text-zinc-500">Se quitará de tu listado de rutinas.</p>
              </div>
            </div>

            <div className="p-3 bg-zinc-50 rounded-2xl border border-zinc-200 text-xs">
              <p className="font-bold text-black">{routineToDelete.name}</p>
              <p className="text-zinc-500 mt-0.5">{routineToDelete.exercises.length} ejercicios registrados</p>
            </div>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setRoutineToDelete(null)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmDeleteRoutine}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Eliminar Rutina
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
