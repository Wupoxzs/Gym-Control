import React, { useState, useEffect } from "react";
import { Profile, Routine, WorkoutSession, CoachMessage } from "./types";
import {
  loadProfile,
  saveProfile,
  loadRoutines,
  saveRoutines,
  loadSessions,
  saveSessions,
  loadChatHistory,
  saveChatHistory
} from "./lib/storage";

// Components
import Navbar from "./components/Navbar";
import RoutinesTab from "./components/RoutinesTab";
import HistoryTab from "./components/HistoryTab";
import CoachTab from "./components/CoachTab";

// Icons
import { User, X, Download, Upload, RefreshCw, Sparkles, Dumbbell, ClipboardList, History } from "lucide-react";

export default function App() {
  // App Core States
  const [activeTab, setActiveTab] = useState<string>("routines");
  const [profile, setProfileState] = useState<Profile>(loadProfile());
  const [routines, setRoutinesState] = useState<Routine[]>(loadRoutines());
  const [sessions, setSessionsState] = useState<WorkoutSession[]>(loadSessions());
  const [chatHistory, setChatHistoryState] = useState<CoachMessage[]>(loadChatHistory());

  // Profile modal state
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [tempProfileName, setTempProfileName] = useState(profile.name);
  const [tempProfileWeight, setTempProfileWeight] = useState(profile.weight || 70);
  const [tempProfileHeight, setTempProfileHeight] = useState(profile.height || 170);
  const [tempProfileUnit, setTempProfileUnit] = useState<'kg' | 'lbs'>(profile.unit);

  // Highlight/success toast state
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // Sync state helpers
  const updateProfile = (newProfile: Profile) => {
    setProfileState(newProfile);
    saveProfile(newProfile);
  };

  const updateRoutines = (newRoutines: Routine[]) => {
    setRoutinesState(newRoutines);
    saveRoutines(newRoutines);
  };

  const updateSessions = (newSessions: WorkoutSession[]) => {
    setSessionsState(newSessions);
    saveSessions(newSessions);
  };

  const updateChatHistory = (newChat: CoachMessage[]) => {
    setChatHistoryState(newChat);
    saveChatHistory(newChat);
  };

  // Pre-fill profile form when opening modal
  useEffect(() => {
    if (isProfileOpen) {
      setTempProfileName(profile.name);
      setTempProfileWeight(profile.weight || 70);
      setTempProfileHeight(profile.height || 170);
      setTempProfileUnit(profile.unit);
    }
  }, [isProfileOpen, profile]);

  // Save profile edits
  const handleSaveProfile = () => {
    const updated: Profile = {
      ...profile,
      name: tempProfileName.trim(),
      weight: tempProfileWeight,
      height: tempProfileHeight,
      unit: tempProfileUnit
    };
    updateProfile(updated);
    setIsProfileOpen(false);
    showToast("Perfil guardado con éxito");
  };

  // Export Backup File (JSON)
  const handleExportBackup = () => {
    const backupData = {
      profile,
      routines,
      sessions,
      chatHistory,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Copia_Seguridad_GymControl_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Copia de seguridad descargada");
  };

  // Import Backup File (JSON)
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        if (data.profile && data.routines && data.sessions) {
          updateProfile(data.profile);
          updateRoutines(data.routines);
          updateSessions(data.sessions);
          if (data.chatHistory) updateChatHistory(data.chatHistory);
          setIsProfileOpen(false);
          showToast("Copia de seguridad restaurada con éxito");
        } else {
          alert("El archivo no tiene el formato correcto.");
        }
      } catch (err) {
        alert("Error al leer la copia de seguridad. Asegúrate de que es un archivo JSON válido.");
      }
    };
    reader.readAsText(file);
  };

  // Open reset confirmation modal
  const handlePromptResetApp = () => {
    setIsResetConfirmOpen(true);
  };

  // Confirm reset entire app database to blank
  const handleConfirmResetApp = () => {
    updateProfile({
      name: "",
      unit: "kg",
      activeRoutineId: undefined
    });
    updateRoutines([]);
    updateSessions([]);
    updateChatHistory([
      {
        id: "welcome-msg",
        role: "assistant",
        content: "¡Hola! Tu base de datos ha sido restablecida en blanco. ¿En qué te gustaría consultar hoy?",
        timestamp: new Date().toISOString()
      }
    ]);
    setIsResetConfirmOpen(false);
    setIsProfileOpen(false);
    setActiveTab("routines");
    showToast("La aplicación ha sido restablecida en blanco");
  };

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => {
      setSuccessToast(null);
    }, 3500);
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] text-black font-sans selection:bg-zinc-200 flex overflow-hidden h-screen w-full">
      
      {/* DESKTOP SIDEBAR - Minimalist Black & White */}
      <aside className="hidden md:flex w-64 bg-white border-r border-zinc-200 flex-col justify-between shrink-0">
        <div className="p-8">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-black flex items-center justify-center text-white shadow-xs select-none">
              <span className="font-black text-base tracking-tighter leading-none">U</span>
            </div>
            <div>
              <h1 className="text-base font-black tracking-tight text-black">U control</h1>
              <p className="text-[9px] text-zinc-400 uppercase tracking-widest font-bold">Monochrome Edition</p>
            </div>
          </div>

          <nav className="mt-8">
            <ul className="space-y-1">
              {[
                { id: "routines", label: "Rutinas", icon: ClipboardList },
                { id: "history", label: "Historial", icon: History },
                { id: "coach", label: "Coach & Tips", icon: Sparkles },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center px-4 py-3 rounded-2xl text-xs font-bold transition-all cursor-pointer ${
                      activeTab === item.id
                        ? "bg-black text-white shadow-xs"
                        : "text-zinc-500 hover:bg-zinc-100 hover:text-black"
                    }`}
                  >
                    <item.icon className="mr-3 w-4 h-4 stroke-[2]" />
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Sidebar Footer Info & Profile Trigger */}
        <div className="p-6 space-y-3">
          <div className="bg-zinc-50 p-3.5 rounded-2xl border border-zinc-200">
            <p className="text-[9px] font-bold text-zinc-400 uppercase tracking-wider mb-0.5">Rutina Principal</p>
            <p className="text-xs font-bold text-black truncate">
              {routines.find((r) => r.id === profile.activeRoutineId)?.name || (routines[0]?.name || "Ninguna")}
            </p>
          </div>

          <button
            onClick={() => setIsProfileOpen(true)}
            className="w-full flex items-center gap-3 p-3 bg-white hover:bg-zinc-50 rounded-2xl border border-zinc-200 text-left cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-black border border-zinc-200 flex items-center justify-center text-xs font-black uppercase">
              {profile.name ? profile.name.slice(0, 2) : <User className="w-4 h-4" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-black truncate">{profile.name || "Mi Perfil"}</p>
              <p className="text-[10px] text-zinc-400 font-medium">Ajustes y Datos</p>
            </div>
          </button>
        </div>
      </aside>

      {/* MAIN LAYOUT WRAPPER */}
      <div className="flex-grow flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* MOBILE HEADER (Hidden on desktop) */}
        <header className="md:hidden sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-zinc-200">
          <div className="max-w-md mx-auto px-4 py-3 flex justify-between items-center">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-xl bg-black flex items-center justify-center text-white shadow-xs select-none">
                <span className="font-black text-xs tracking-tighter leading-none">U</span>
              </div>
              <h1 className="text-sm font-black tracking-tight text-black">U control</h1>
            </div>

            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-zinc-100 hover:bg-zinc-200 text-black transition-all cursor-pointer border border-zinc-200"
              title="Ajustes de Perfil"
            >
              {profile.name ? (
                <span className="text-[11px] font-black uppercase">
                  {profile.name.slice(0, 2)}
                </span>
              ) : (
                <User className="w-4 h-4" />
              )}
            </button>
          </div>
        </header>

        {/* SCROLLABLE VIEWPORT FOR THE ACTIVE TAB */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 md:px-8 py-5 md:py-8 pb-24 md:pb-8">
            {activeTab === "routines" && (
              <RoutinesTab
                routines={routines}
                setRoutines={updateRoutines}
                activeRoutineId={profile.activeRoutineId}
                setActiveRoutineId={(id) => updateProfile({ ...profile, activeRoutineId: id })}
              />
            )}

            {activeTab === "history" && (
              <HistoryTab
                sessions={sessions}
                setSessions={updateSessions}
                routines={routines}
                profile={profile}
              />
            )}

            {activeTab === "coach" && (
              <CoachTab
                profile={profile}
                sessions={sessions}
                chatHistory={chatHistory}
                setChatHistory={updateChatHistory}
              />
            )}
          </div>
        </div>

        {/* MOBILE BOTTOM NAVIGATION BAR */}
        <div className="md:hidden">
          <Navbar
            activeTab={activeTab}
            setActiveTab={setActiveTab}
          />
        </div>
      </div>

      {/* --- SIDEBAR / MODAL FOR PROFILE & BACKUP --- */}
      {isProfileOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsProfileOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-md rounded-3xl border border-zinc-200 p-6 space-y-5 shadow-2xl my-auto max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-zinc-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-zinc-100 text-black flex items-center justify-center border border-zinc-200">
                  <User className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-black text-base tracking-tight">Perfil y Ajustes</h3>
              </div>
              <button
                onClick={() => setIsProfileOpen(false)}
                className="p-1 text-zinc-400 hover:text-black rounded-lg hover:bg-zinc-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nombre o Apodo</label>
                <input
                  type="text"
                  placeholder="ej. Alex G."
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-black text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Peso Corporal</label>
                  <input
                    type="number"
                    step="0.1"
                    value={tempProfileWeight}
                    onChange={(e) => setTempProfileWeight(parseFloat(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black text-black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estatura (cm)</label>
                  <input
                    type="number"
                    value={tempProfileHeight}
                    onChange={(e) => setTempProfileHeight(parseInt(e.target.value) || 0)}
                    className="w-full px-3.5 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs font-mono font-bold focus:outline-none focus:ring-2 focus:ring-black text-black"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Unidades</label>
                <div className="grid grid-cols-2 gap-2 bg-zinc-100 p-1 rounded-xl border border-zinc-200 text-xs font-bold">
                  <button
                    onClick={() => setTempProfileUnit('kg')}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      tempProfileUnit === 'kg' 
                        ? "bg-black text-white shadow-xs" 
                        : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    Kilogramos (kg)
                  </button>
                  <button
                    onClick={() => setTempProfileUnit('lbs')}
                    className={`py-2 rounded-lg transition-all cursor-pointer ${
                      tempProfileUnit === 'lbs' 
                        ? "bg-black text-white shadow-xs" 
                        : "text-zinc-500 hover:text-black"
                    }`}
                  >
                    Libras (lbs)
                  </button>
                </div>
              </div>
            </div>

            {/* Backup / Export Section */}
            <div className="pt-3 border-t border-zinc-200 space-y-3">
              <span className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider">Copia de Seguridad</span>
              
              <div className="grid grid-cols-2 gap-2 text-xs font-bold">
                <button
                  onClick={handleExportBackup}
                  className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-black border border-zinc-200 rounded-xl transition-colors cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Exportar
                </button>
                
                <label className="flex items-center justify-center gap-1.5 py-2.5 bg-zinc-50 hover:bg-zinc-100 text-black border border-zinc-200 rounded-xl transition-colors cursor-pointer">
                  <Upload className="w-4 h-4" />
                  <span>Importar</span>
                  <input
                    type="file"
                    accept=".json"
                    onChange={handleImportBackup}
                    className="hidden"
                  />
                </label>
              </div>

              <button
                onClick={handlePromptResetApp}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Restablecer a Cero
              </button>
            </div>

            {/* Save Button */}
            <button
              onClick={handleSaveProfile}
              className="w-full py-3 bg-black hover:bg-zinc-800 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer text-center"
            >
              Guardar Cambios
            </button>
          </div>
        </div>
      )}

      {/* --- IN-APP CONFIRMATION MODAL FOR APP RESET --- */}
      {isResetConfirmOpen && (
        <div 
          className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs overflow-y-auto"
          onClick={() => setIsResetConfirmOpen(false)}
        >
          <div 
            className="relative bg-white w-full max-w-sm sm:max-w-md rounded-3xl border border-zinc-200 p-6 space-y-4 shadow-2xl my-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-50 flex items-center justify-center border border-red-100 shrink-0">
                <RefreshCw className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-black">¿Restablecer aplicación?</h3>
                <p className="text-xs text-zinc-500">Se borrarán tus rutinas y sesiones.</p>
              </div>
            </div>

            <p className="text-xs text-zinc-600 leading-relaxed">
              Esta acción dejará la aplicación en blanco para que puedas empezar desde cero. Si tienes datos importantes, recuerda exportar un respaldo primero.
            </p>

            <div className="flex gap-2 justify-end pt-2">
              <button
                onClick={() => setIsResetConfirmOpen(false)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-zinc-100 hover:bg-zinc-200 text-black rounded-xl text-xs font-bold transition-colors cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmResetApp}
                className="flex-1 sm:flex-none px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Restablecer a Cero
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- NOTIFICATION TOAST --- */}
      {successToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 bg-black text-white px-5 py-2.5 rounded-full text-xs font-bold shadow-xl flex items-center gap-2 transition-all animate-fade-in border border-zinc-700">
          <Sparkles className="w-3.5 h-3.5" />
          <span>{successToast}</span>
        </div>
      )}

    </div>
  );
}
