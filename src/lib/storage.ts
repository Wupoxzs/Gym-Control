import { Profile, Routine, WorkoutSession, CoachMessage } from "../types";

const PROFILE_KEY = "gym_control_profile";
const ROUTINES_KEY = "gym_control_routines";
const SESSIONS_KEY = "gym_control_sessions";
const CHAT_KEY = "gym_control_chat";

export const DEFAULT_ROUTINES: Routine[] = [];

export const loadProfile = (): Profile => {
  const data = localStorage.getItem(PROFILE_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return {
    name: "",
    unit: "kg",
    activeRoutineId: undefined
  };
};

export const saveProfile = (profile: Profile): void => {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
};

export const loadRoutines = (): Routine[] => {
  const data = localStorage.getItem(ROUTINES_KEY);
  if (data) {
    try {
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed)) {
        // If it still has the old default pre-filled routines, clear to keep routines blank
        const isOldDefault = parsed.some(r => r.id === "routine-push" || r.id === "routine-pull");
        if (isOldDefault) {
          localStorage.setItem(ROUTINES_KEY, JSON.stringify([]));
          return [];
        }
        return parsed;
      }
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

export const saveRoutines = (routines: Routine[]): void => {
  localStorage.setItem(ROUTINES_KEY, JSON.stringify(routines));
};

export const loadSessions = (): WorkoutSession[] => {
  const data = localStorage.getItem(SESSIONS_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return [];
};

export const saveSessions = (sessions: WorkoutSession[]): void => {
  localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
};

export const loadChatHistory = (): CoachMessage[] => {
  const data = localStorage.getItem(CHAT_KEY);
  if (data) {
    try {
      return JSON.parse(data);
    } catch (e) {
      console.error(e);
    }
  }
  return [
    {
      id: "welcome-msg",
      role: "assistant",
      content: "¡Hola! Soy tu Coach Científico de Gimnasio. Estoy aquí para darte consejos prácticos sobre tu rutina (Push/Pull/Legs x Upper/Lower) respaldados en evidencia científica comprobable.\n\nPuedes preguntarme cosas como:\n* *¿Cuánto tiempo debo descansar entre series?*\n* *¿Cómo aplicar sobrecarga progresiva en press de banca?*\n* *¿Es mejor entrenar al fallo muscular?*\n\n¿En qué te puedo ayudar hoy con tu entrenamiento?",
      timestamp: new Date().toISOString()
    }
  ];
};

export const saveChatHistory = (messages: CoachMessage[]): void => {
  localStorage.setItem(CHAT_KEY, JSON.stringify(messages));
};
